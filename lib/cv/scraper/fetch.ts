import { lookup } from "node:dns/promises";
import { request as httpRequest, type IncomingMessage } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP, type LookupFunction } from "node:net";
import { Transform, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createBrotliDecompress, createGunzip, createInflate } from "node:zlib";

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const SCAN_TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 5;

export class ScrapeError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ScrapeError";
  }
}

/** Reject internal, reserved and transition addresses before opening a socket. */
export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const [a, b, c] = address.split(".").map(Number);
    return !(
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0 && (c === 0 || c === 2)) ||
      (a === 192 && b === 88 && c === 99) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113)
    );
  }
  if (family !== 6 || address.includes("%")) return false;
  // Mapped/compatible IPv4 and NAT64 addresses are outside global-unicast /3.
  const prefix = Number.parseInt(address.split(":")[0] || "0", 16);
  if (prefix < 0x2000 || prefix > 0x3fff) return false;
  const second = Number.parseInt(address.split(":")[1] || "0", 16);
  if (prefix === 0x2002) return false; // 6to4 can route to a private IPv4 address.
  if (prefix === 0x2001 && (second < 0x200 || second === 0xdb8)) return false;
  if (prefix === 0x3fff && second < 0x1000) return false; // Documentation /20.
  return true;
}

/** Pure URL validation; every hostname is also DNS-validated before use. */
export function validateTargetUrl(value: string): URL {
  if (typeof value !== "string" || !value.trim() || value.length > 2048) {
    throw new ScrapeError("Enter a valid website URL (maximum 2,048 characters).", 400, "INVALID_URL");
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ScrapeError("Enter a complete http:// or https:// website URL.", 400, "INVALID_URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ScrapeError("Only HTTP and HTTPS websites can be scanned.", 400, "INVALID_PROTOCOL");
  }
  if (url.username || url.password || (url.port && url.port !== "80" && url.port !== "443")) {
    throw new ScrapeError("URL credentials and nonstandard ports are not supported.", 400, "UNSAFE_URL");
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") || hostname.endsWith(".internal") ||
      (!isIP(hostname) && !hostname.includes(".")) ||
      (isIP(hostname) && !isPublicAddress(hostname))) {
    throw new ScrapeError("Only public internet websites can be scanned.", 400, "UNSAFE_URL");
  }
  url.hash = "";
  return url;
}

async function pinnedLookup(url: URL, signal: AbortSignal): Promise<LookupFunction> {
  signal.throwIfAborted();
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const literalFamily = isIP(hostname);
  const addresses = literalFamily
    ? [{ address: hostname, family: literalFamily }]
    : await abortable(lookup(hostname, { all: true, verbatim: true }), signal);
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new ScrapeError("The website resolves to a nonpublic network address.", 400, "UNSAFE_ADDRESS");
  }
  // Resolve once, validate every answer, and reuse that exact answer for the socket.
  // This prevents a second DNS lookup from changing to an internal address.
  return (_hostname, options, callback) => {
    const eligible = options.family ? addresses.filter((entry) => entry.family === options.family) : addresses;
    if (!eligible.length) {
      callback(Object.assign(new Error("No supported website address."), { code: "ENOTFOUND" }), "");
    } else if (options.all) {
      callback(null, eligible);
    } else {
      callback(null, eligible[0].address, eligible[0].family);
    }
  };
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => { signal.removeEventListener("abort", onAbort); resolve(value); },
      (error) => { signal.removeEventListener("abort", onAbort); reject(error); },
    );
  });
}

function download(url: URL, lookupFn: LookupFunction, signal: AbortSignal): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(url, {
      // URL.hostname contains brackets for IPv6; the socket expects a bare address.
      hostname: url.hostname.replace(/^\[|\]$/g, ""),
      lookup: lookupFn,
      signal,
      agent: false,
      maxHeaderSize: 16 * 1024,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CVWebsiteScanner/1.0)",
        Accept: "text/html,application/xhtml+xml;q=0.9",
        "Accept-Encoding": "identity",
      },
    }, resolve);
    request.on("error", reject);
    request.end();
  });
}

function byteLimit(): Transform {
  let length = 0;
  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      length += chunk.length;
      if (length > MAX_HTML_BYTES) {
        callback(new ScrapeError("The webpage exceeds the 2 MB scan limit.", 413, "PAGE_TOO_LARGE"));
      } else {
        callback(null, chunk);
      }
    },
  });
}

async function readHtml(response: IncomingMessage, signal: AbortSignal): Promise<string> {
  const contentType = (response.headers["content-type"] || "").trim();
  if (!/^(text\/html|application\/xhtml\+xml)(?:\s*;|$)/i.test(contentType)) {
    response.destroy();
    throw new ScrapeError("This URL does not return an HTML webpage. Use the job or application page URL.", 415, "NOT_HTML");
  }
  const contentEncoding = (response.headers["content-encoding"] || "identity").trim().toLowerCase();
  const decompress = contentEncoding === "gzip" || contentEncoding === "x-gzip" ? createGunzip()
    : contentEncoding === "br" ? createBrotliDecompress()
      : contentEncoding === "deflate" ? createInflate() : null;
  if (contentEncoding !== "identity" && !decompress) {
    response.destroy();
    throw new ScrapeError("The website returned an unsupported content encoding.", 502, "UNSUPPORTED_ENCODING");
  }
  if (Number(response.headers["content-length"] || 0) > MAX_HTML_BYTES) {
    response.destroy();
    throw new ScrapeError("The webpage exceeds the 2 MB scan limit.", 413, "PAGE_TOO_LARGE");
  }
  const chunks: Buffer[] = [];
  const collector = new Writable({ write(chunk: Buffer, _encoding, callback) { chunks.push(chunk); callback(); } });
  // Bound bytes before AND after decompression; compressed pages may expand greatly.
  await pipeline(decompress ? [response, byteLimit(), decompress, byteLimit(), collector]
    : [response, byteLimit(), collector], { signal });
  const encoding = /charset\s*=\s*["']?([^\s;"']+)/i.exec(contentType)?.[1] || "utf-8";
  try {
    return new TextDecoder(encoding).decode(Buffer.concat(chunks));
  } catch {
    return new TextDecoder("utf-8").decode(Buffer.concat(chunks));
  }
}

export async function fetchPublicHtml(value: string, clientSignal?: AbortSignal): Promise<{ html: string; url: string }> {
  let url = validateTargetUrl(value);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new ScrapeError("The website took too long to respond. Try again or use a direct job URL.", 504, "SCAN_TIMEOUT")), SCAN_TIMEOUT_MS);
  const cancel = () => controller.abort(new ScrapeError("The scan was cancelled.", 408, "SCAN_CANCELLED"));
  clientSignal?.addEventListener("abort", cancel, { once: true });
  if (clientSignal?.aborted) cancel();
  try {
    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
      const lookupFn = await pinnedLookup(url, controller.signal);
      const response = await download(url, lookupFn, controller.signal);
      const status = response.statusCode || 502;
      if ([301, 302, 303, 307, 308].includes(status)) {
        const location = response.headers.location;
        response.destroy();
        if (!location) throw new ScrapeError("The website returned a redirect without a destination.", 502, "INVALID_REDIRECT");
        if (redirects === MAX_REDIRECTS) throw new ScrapeError("The website redirected too many times.", 502, "TOO_MANY_REDIRECTS");
        let destination: URL;
        try { destination = new URL(location, url); } catch {
          throw new ScrapeError("The website returned an invalid redirect destination.", 502, "INVALID_REDIRECT");
        }
        url = validateTargetUrl(destination.href);
        continue;
      }
      if (status < 200 || status >= 300) {
        response.destroy();
        const blocked = status === 401 || status === 403 || status === 429;
        throw new ScrapeError(blocked
          ? `The website blocked automated access (HTTP ${status}). Try a public job page or paste the job text.`
          : `The website returned HTTP ${status}.`, status === 404 ? 404 : 502, blocked ? "WEBSITE_BLOCKED" : "UPSTREAM_ERROR");
      }
      return { html: await readHtml(response, controller.signal), url: url.href };
    }
    throw new ScrapeError("The website redirected too many times.", 502, "TOO_MANY_REDIRECTS");
  } catch (error) {
    if (controller.signal.aborted) throw controller.signal.reason;
    if (error instanceof ScrapeError) throw error;
    throw new ScrapeError("Could not reach the website. Check the URL and try again.", 502, "FETCH_FAILED");
  } finally {
    clearTimeout(timer);
    clientSignal?.removeEventListener("abort", cancel);
  }
}
