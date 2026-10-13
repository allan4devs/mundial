import { load, type CheerioAPI } from "cheerio";
import type { AnyNode, Element } from "domhandler";
import { validateTargetUrl } from "./fetch";
import type { ScrapedField, ScrapedForm, ScrapedJobPosting, ScrapeResult } from "./types";

const MAX_HTML_LENGTH = 2 * 1024 * 1024;
const MAX_FORMS = 40;
const MAX_FIELDS = 300;
const MAX_OPTIONS = 100;
const MAX_LINKS = 80;
const MAX_JOBS = 30;
const MAX_PAGE_TEXT = 24_000;
const MAX_VALUE = 2_000;
const MAX_JSON_NODES = 5_000;
const CONTROL_SELECTOR = "input, textarea, select, button";
const OMIT_TEXT_SELECTOR = "script, style, nav, header, footer, aside, noscript, svg, canvas, template, iframe, object, embed, input, textarea, select, [hidden], [aria-hidden='true']";
const BLOCK_SELECTOR = "address, article, blockquote, br, dd, div, dl, dt, fieldset, figcaption, figure, h1, h2, h3, h4, h5, h6, hr, legend, li, main, ol, p, pre, section, table, td, th, tr, ul";
const INPUT_TYPES = new Set(["button", "checkbox", "color", "date", "datetime-local", "email", "file", "hidden", "image", "month", "number", "password", "radio", "range", "reset", "search", "submit", "tel", "text", "time", "url", "week"]);

function normalized(value: unknown): string {
  return typeof value === "string" ? value.replace(/\u00a0/g, " ").replace(/[\s\u200b-\u200d\ufeff]+/g, " ").trim() : "";
}

function publicUrl(value: string, base: string): string | null {
  try {
    return validateTargetUrl(new URL(value, base).href).href;
  } catch {
    return null;
  }
}

/** Read DOM text with separators for block elements and without executable or form content. */
function readableText($: CheerioAPI, node: AnyNode): string {
  const copy = $(node).clone();
  copy.find(OMIT_TEXT_SELECTOR).remove();
  copy.find("[style]").filter((_index, element) => /(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test($(element).attr("style") || "")).remove();
  copy.find(BLOCK_SELECTOR).prepend("\n").append("\n");
  return copy.text().replace(/\u00a0/g, " ").replace(/[\t\f\v\r \u200b-\u200d\ufeff]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function isWithin(node: AnyNode, ancestor: AnyNode): boolean {
  for (let current: AnyNode | null = node; current; current = current.parent) {
    if (current === ancestor) return true;
  }
  return false;
}

function disabledControl($: CheerioAPI, element: Element): boolean {
  if ($(element).attr("disabled") !== undefined) return true;
  return $(element).parents("fieldset[disabled]").toArray().some((fieldset) => {
    const firstLegend = $(fieldset).children("legend").get(0);
    return !firstLegend || !isWithin(element, firstLegend);
  });
}

function sensitiveControl($: CheerioAPI, element: Element, type: string): boolean {
  if (type === "password" || type === "hidden" || type === "file") return true;
  const identity = `${$(element).attr("name") || ""} ${$(element).attr("id") || ""}`;
  const autocomplete = $(element).attr("autocomplete") || "";
  return /(?:csrf|xsrf|token|nonce|secret|password|passwd|credential|api[-_]?key|session[-_]?id|authorization|auth[-_]?key)/i.test(identity) || /(?:password|one-time-code)/i.test(autocomplete);
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function scalar(value: unknown): string {
  if (Array.isArray(value)) return value.map(scalar).filter(Boolean).join(", ");
  return typeof value === "number" && Number.isFinite(value) ? String(value) : normalized(value);
}

function jobLocation(value: unknown): string {
  if (Array.isArray(value)) return [...new Set(value.map(jobLocation).filter(Boolean))].join("; ");
  if (typeof value === "string") return normalized(value);
  const place = record(value);
  if (!place) return "";
  const address = record(place.address) || place;
  const country = record(address.addressCountry);
  const parts = [scalar(address.streetAddress), scalar(address.addressLocality), scalar(address.addressRegion), country ? scalar(country.name) : scalar(address.addressCountry)];
  return [...new Set(parts.filter(Boolean))].join(", ") || scalar(place.name) || scalar(place.address);
}

function jobSalary(value: unknown): string {
  if (Array.isArray(value)) return value.map(jobSalary).filter(Boolean).join("; ");
  const salary = record(value);
  if (!salary) return scalar(value);
  const amount = record(salary.value) || salary;
  const min = scalar(amount.minValue);
  const max = scalar(amount.maxValue);
  const range = min && max ? `${min}–${max}` : min || max || scalar(amount.value) || scalar(salary.value);
  return [scalar(salary.currency), range, scalar(amount.unitText)].filter(Boolean).join(" ");
}

/** Extract the downloaded HTML only; this function never executes scripts or follows links. */
export function extractScrapeResult(html: string, url: string): ScrapeResult {
  const warnings = new Set<string>();
  const bound = (value: string, max: number, kind: string): string => {
    if (value.length <= max) return value;
    warnings.add(`${kind} was shortened to the scan limit.`);
    return value.slice(0, max);
  };
  const attr = ($: CheerioAPI, element: Element, name: string): string | null => {
    const value = $(element).attr(name);
    return value === undefined ? null : bound(value, 500, "Field attributes");
  };
  const $ = load(bound(html, MAX_HTML_LENGTH, "HTML"));
  let documentBase = url;
  const baseHref = $("base[href]").first().attr("href");
  if (baseHref) {
    try {
      documentBase = new URL(baseHref, url).href;
      if (!publicUrl(documentBase, url)) warnings.add("Relative URLs using an unsafe or unsupported document base were omitted.");
    } catch {
      warnings.add("An invalid document base was ignored.");
    }
  }
  const idNodes = new Map<string, Element>();
  $("[id]").each((_index, element) => {
    const id = $(element).attr("id");
    if (id && !idNodes.has(id)) idNodes.set(id, element);
  });
  const explicitLabels = new Map<string, string[]>();
  $("label[for]").each((_index, element) => {
    const id = $(element).attr("for") || "";
    const text = normalized(readableText($, element));
    if (text) explicitLabels.set(id, [...(explicitLabels.get(id) || []), text]);
  });
  const labelFor = (element: Element): string | null => {
    const labelledBy = ($(element).attr("aria-labelledby") || "").split(/\s+/).filter(Boolean);
    const ariaReferences = labelledBy.map((id) => idNodes.get(id)).filter((node): node is Element => Boolean(node)).map((node) => normalized(readableText($, node))).filter(Boolean).join(" ");
    const ariaLabel = normalized($(element).attr("aria-label"));
    const labels = explicitLabels.get($(element).attr("id") || "") || [];
    const wrapper = $(element).parents("label").first().get(0);
    const wrappedText = wrapper ? normalized(readableText($, wrapper)) : "";
    const text = ariaReferences || ariaLabel || [...new Set([...labels, wrappedText].filter(Boolean))].join(" ") || (element.name === "button" ? normalized($(element).text()) : "");
    return text ? bound(text, 500, "Field labels") : null;
  };
  const parseField = (element: Element): ScrapedField => {
    const node = $(element);
    const tag = element.name;
    const rawType = (node.attr("type") || "").toLowerCase();
    const type = tag === "input" ? (INPUT_TYPES.has(rawType) ? rawType : "text") : tag === "button" ? (["button", "reset", "submit"].includes(rawType) ? rawType : "submit") : tag;
    const sensitive = sensitiveControl($, element, type);
    let value: string | null = tag === "textarea" ? node.text() : node.attr("value") ?? (type === "checkbox" || type === "radio" ? "on" : null);
    const field: ScrapedField = {
      tag, label: labelFor(element), name: attr($, element, "name"), id: attr($, element, "id"), type,
      placeholder: attr($, element, "placeholder"), required: node.attr("required") !== undefined,
      value: null, autocomplete: attr($, element, "autocomplete"), disabled: disabledControl($, element),
      readOnly: node.attr("readonly") !== undefined, multiple: node.attr("multiple") !== undefined,
      accept: attr($, element, "accept"),
    };
    if (tag === "select") {
      const options = node.find("option").toArray();
      let selected = options.filter((option) => $(option).attr("selected") !== undefined);
      if (!field.multiple) {
        const size = Number.parseInt(node.attr("size") || "1", 10);
        selected = selected.length ? selected.slice(-1) : size > 1 ? [] : options.filter((option) => $(option).attr("disabled") === undefined && $(option).parents("optgroup[disabled]").length === 0).slice(0, 1);
      }
      value = selected.map((option) => $(option).attr("value") ?? normalized($(option).text())).join(", ");
      if (options.length > MAX_OPTIONS) warnings.add(`Select options were limited to ${MAX_OPTIONS} per field.`);
      field.options = options.slice(0, MAX_OPTIONS).map((option) => ({
        text: bound(normalized($(option).text()), 500, "Option labels"),
        value: sensitive ? "" : bound($(option).attr("value") ?? normalized($(option).text()), MAX_VALUE, "Option values"),
        selected: selected.includes(option),
        disabled: $(option).attr("disabled") !== undefined || $(option).parents("optgroup[disabled]").length > 0 || field.disabled,
      }));
    }
    if (type === "checkbox" || type === "radio") field.checked = node.attr("checked") !== undefined;
    if (sensitive) {
      if (value || type === "hidden" || type === "password") warnings.add("Password, hidden and credential-like field values were redacted.");
      // Option text can contain an identifier or token as well as its value.
      if (field.options) field.options = field.options.map((option) => ({ ...option, text: "", value: "" }));
    } else if (value !== null) {
      field.value = bound(value, MAX_VALUE, "Field values");
    }
    return field;
  };

  const allForms = $("form").toArray();
  const forms: ScrapedForm[] = allForms.slice(0, MAX_FORMS).map((element, index) => ({
    index: index + 1, id: attr($, element, "id"), name: attr($, element, "name"),
    action: publicUrl($(element).attr("action") || url, documentBase),
    method: ["post", "dialog"].includes(($(element).attr("method") || "").toLowerCase()) ? ($(element).attr("method") || "").toUpperCase() : "GET",
    enctype: attr($, element, "enctype"), fields: [],
  }));
  const formNodes = new Map(allForms.map((element, index) => [element, index]));
  const formIds = new Map<string, number>();
  allForms.forEach((element, index) => {
    const id = $(element).attr("id");
    if (id && !formIds.has(id)) formIds.set(id, index);
    if ($(element).attr("action") && !publicUrl($(element).attr("action") || "", documentBase)) warnings.add("An unsafe or unsupported form action was omitted.");
  });
  const looseFields: ScrapedField[] = [];
  const allControls = $(CONTROL_SELECTOR).toArray();
  for (const element of allControls.slice(0, MAX_FIELDS)) {
    const owner = $(element).attr("form");
    const parentForm = $(element).parents("form").first().get(0);
    const formIndex = owner !== undefined ? formIds.get(owner) : parentForm ? formNodes.get(parentForm) : undefined;
    const field = parseField(element);
    if (formIndex === undefined) looseFields.push(field);
    else if (forms[formIndex]) forms[formIndex].fields.push(field);
  }
  if (allForms.length > MAX_FORMS) warnings.add(`Forms were limited to the first ${MAX_FORMS}.`);
  if (allControls.length > MAX_FIELDS) warnings.add(`Fields were limited to the first ${MAX_FIELDS} across the page.`);
  if (!allForms.length) warnings.add("No HTML forms were found. Application forms may load with JavaScript or appear on another page.");
  if ($("script").toArray().some((element) => !/(?:json|ld\+json)/i.test($(element).attr("type") || ""))) warnings.add("JavaScript was not executed. Fields or job details loaded by scripts may be missing.");
  if ($("iframe, frame").length) warnings.add("Embedded frames were not scanned. Open the embedded application page directly to inspect its fields.");

  const jobPostings: ScrapedJobPosting[] = [];
  const jobKeys = new Set<string>();
  let visited = 0;
  $("script").filter((_index, element) => ($(element).attr("type") || "").trim().toLowerCase() === "application/ld+json").each((_index, script) => {
    const raw = $(script).text().trim().replace(/^\uFEFF/, "");
    if (!raw) return;
    if (raw.length > 512_000) {
      warnings.add("A structured-data block exceeded the scan limit and was skipped.");
      return;
    }
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      warnings.add("Some JSON-LD structured data could not be read because it was invalid JSON.");
      return;
    }
    const queue: Array<{ value: unknown; depth: number }> = [{ value: data, depth: 0 }];
    for (let offset = 0; offset < queue.length; offset++) {
      const { value, depth } = queue[offset];
      if (++visited > MAX_JSON_NODES) {
        warnings.add("Structured-data traversal reached the scan limit.");
        break;
      }
      if (depth > 15) {
        warnings.add("Deeply nested structured data was shortened to the scan limit.");
        continue;
      }
      if (Array.isArray(value)) {
        for (const child of value) queue.push({ value: child, depth: depth + 1 });
        continue;
      }
      const item = record(value);
      if (!item) continue;
      const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
      if (types.some((type) => typeof type === "string" && /(?:^|[/#])JobPosting$/i.test(type))) {
        const title = bound(scalar(item.title) || scalar(item.name), 500, "Job titles");
        const descriptionHtml = scalar(item.description);
        const descriptionRoot = load(descriptionHtml);
        const descriptionNode = descriptionRoot("body").get(0) || descriptionRoot.root().get(0);
        const description = bound(descriptionNode ? readableText(descriptionRoot, descriptionNode) : "", MAX_PAGE_TEXT, "Job descriptions");
        const employer = record(item.hiringOrganization);
        const location = jobLocation(item.jobLocation) || (/TELECOMMUTE/i.test(scalar(item.jobLocationType)) ? "Remote" : "");
        const jobUrl = publicUrl(scalar(item.url) || scalar(item["@id"]) || url, documentBase);
        const key = `${title}|${jobUrl || ""}|${description}`;
        if (title && !jobKeys.has(key)) {
          jobKeys.add(key);
          if (jobPostings.length < MAX_JOBS) jobPostings.push({
            title, company: bound(employer ? scalar(employer.name) : scalar(item.hiringOrganization), 500, "Company names") || null,
            location: bound(location, 1_000, "Job locations") || null,
            employmentType: bound(scalar(item.employmentType), 500, "Employment types") || null,
            datePosted: bound(scalar(item.datePosted), 100, "Job dates") || null,
            validThrough: bound(scalar(item.validThrough), 100, "Job dates") || null,
            description, url: jobUrl, salary: bound(jobSalary(item.baseSalary), 500, "Salary descriptions") || null,
          });
          else warnings.add(`Job postings were limited to the first ${MAX_JOBS}.`);
        }
      }
      for (const child of Object.values(item)) if (child !== null && typeof child === "object") queue.push({ value: child, depth: depth + 1 });
    }
  });

  const links: ScrapeResult["links"] = [];
  const linkUrls = new Set<string>();
  $("a[href]").each((_index, element) => {
    const href = $(element).attr("href")?.trim() || "";
    if (!href || href.startsWith("#")) return;
    const resolved = publicUrl(href, documentBase);
    if (!resolved || linkUrls.has(resolved)) return;
    linkUrls.add(resolved);
    if (links.length >= MAX_LINKS) {
      warnings.add(`Links were limited to the first ${MAX_LINKS}.`);
      return;
    }
    links.push({ text: bound(normalized($(element).text()) || normalized($(element).attr("aria-label")) || normalized($(element).attr("title")) || resolved, 500, "Link labels"), url: resolved });
  });
  const meta = (names: string[]): string => {
    const nameSet = new Set(names);
    const element = $("meta").toArray().find((node) => nameSet.has(($(node).attr("name") || $(node).attr("property") || "").toLowerCase()));
    return element ? normalized($(element).attr("content")) : "";
  };
  const title = bound(normalized($("title").first().text()) || meta(["og:title", "twitter:title"]) || normalized($("h1").first().text()) || url, 500, "Page title");
  const description = bound(meta(["description"]) || meta(["og:description", "twitter:description"]), 2_000, "Page description") || null;
  const body = $("body").get(0) || $.root().get(0);
  const pageText = bound(body ? readableText($, body) : "", MAX_PAGE_TEXT, "Page text");
  return { url, title, description, formCount: allForms.length, forms, looseFields, pageText, jobPostings, links, warnings: [...warnings], scannedAt: new Date().toISOString() };
}
