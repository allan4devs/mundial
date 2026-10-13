import { load } from "cheerio";

export const MAX_JD_LENGTH = 40_000;
export class CvInputError extends Error {}

/** Remove copied page noise before local keyword extraction. */
export function cleanJobDescription(value: unknown): string {
  if (typeof value !== "string") throw new CvInputError("Paste a job description to continue.");
  if (value.length > MAX_JD_LENGTH) throw new CvInputError("Keep the job description below 40,000 characters.");
  let text = value;
  if (/<(?:html|body|div|p|br|li|script|style|section|article)\b/i.test(text)) {
    const $ = load(text);
    $("script, style, nav, footer, noscript, svg, form").remove();
    $("br").replaceWith("\n");
    $("p, div, li, section, article, h1, h2, h3").append("\n");
    text = $.root().text();
  }
  const noise = /^(?:banner|jobs|careers|sign (?:in|up)|log in|apply(?: now)?|easy apply|save(?: job)?|share(?: job)?|show (?:more|less)|back to (?:jobs|search)|accept (?:all )?cookies|cookie (?:policy|preferences)|privacy policy|terms (?:of use|and conditions)|menu|skip to (?:main )?content|create (?:a )?job alert|\d+ (?:applicants|notifications))\s*[.!]?$/i;
  text = text.normalize("NFKC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\uFEFF]/g, "");
  const seen = new Set<string>();
  let lines = text.replace(/\r\n?/g, "\n").split("\n").map((line) => line.replace(/[\t\u00A0 ]+/g, " ").trim().replace(/^(.{1,80})\s+Logo$/i, "$1")).filter((line) => {
    if (!line || noise.test(line) || /^https?:\/\/\S+$/.test(line)) return false;
    const key = line.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const formStart = lines.findIndex((line, index) => index > 3 && /^(?:apply for this (?:job|position)|first name\s*\*?|indicates a required field)$/i.test(line) && lines.slice(0, index).join(" ").length > 400);
  if (formStart >= 0) lines = lines.slice(0, formStart);
  const cleaned = lines.join("\n").trim();
  if (cleaned.length < 100) throw new CvInputError("Paste the role description, responsibilities, and requirements (at least 100 characters).");
  return cleaned;
}

export function normalizedText(text: string): string {
  return text.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}
