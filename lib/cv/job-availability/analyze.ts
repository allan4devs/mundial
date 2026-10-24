import { load } from "cheerio";
import { extractScrapeResult } from "../scraper/extract";
import type { JobAvailabilityResult } from "./types";

const CLOSED_RULES = [
  /\b(?:job|role|position|vacancy|posting|opportunity|requisition)(?: posting| opening| post)?(?: you (?:are |were )?(?:looking for|trying to (?:view|apply for)))? (?:is |has been |has |was )?(?:no longer (?:available|open|posted)|not (?:available|posted|found)|isn't available|unavailable|closed|filled|expired|removed|taken down)\b/,
  /\b(?:no longer|not|isn't|aren't) (?:currently )?(?:accepting|receiving|taking) (?:new )?(?:applications|resumes|candidates)\b/,
  /\bapplications (?:are |have been )?(?:closed|no longer (?:being )?accepted)\b/,
  /\bapplications for (?:this|the) (?:job|role|position) (?:are|have been) closed\b/,
  /\b(?:job|position|posting) (?:you (?:are|were) looking for )?(?:does not|doesn't|no longer) exist\b/,
  /\b(?:oferta|vacante|puesto|posicion)(?: de (?:trabajo|empleo))? (?:ya )?(?:esta |ha sido )?(?:no esta disponible|no existe|cerrad[ao]|expirad[ao]|cubiert[ao])\b/,
  /\b(?:ya no|no) (?:se (?:aceptan|reciben|estan recibiendo)|acepta(?:mos|n)?|recibe(?:n)?) (?:mas |nuevas )?(?:solicitudes|candidaturas|postulaciones)\b/,
];
const BLOCKED_RULES = [
  /\b(?:403 forbidden|access denied|access forbidden|request blocked|too many requests)\b/,
  /\b(?:http|error)\s*403\b/,
  /\b(?:verify (?:that )?you are (?:a )?human|are you a robot|captcha|security check|checking your browser)\b/,
  /\b(?:enable javascript and cookies|sign in to (?:continue|view)|log in to (?:continue|view)|you must be logged in)\b/,
  /\b(?:acceso denegado|verifica que eres humano|inicia sesion para continuar)\b/,
];
const APPLY_RULE = /^(?:apply(?: now| for (?:this|the) (?:job|role|position))?|submit (?:your )?application|postular(?:me|se)?|enviar (?:mi |tu )?solicitud|solicitar empleo)$/;
const HIDDEN = "script,style,noscript,template,svg,iframe,object,embed,[hidden],[aria-hidden='true']";

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
}

function titleMatches(expected: string, actual: string): boolean {
  const words = [...new Set(normalize(expected).match(/[a-z0-9+#.]+/g) ?? [])].filter((word) => word.length > 1);
  const actualWords = new Set(normalize(actual).match(/[a-z0-9+#.]+/g) ?? []);
  return words.length > 0 && words.filter((word) => actualWords.has(word)).length / words.length >= 0.6;
}

/** Fixed text/DOM rules only. Never executes page scripts or calls an AI provider. */
export function analyzeJobAvailability(html: string, url: string, expectedTitle = "", now = new Date()): JobAvailabilityResult {
  const scraped = extractScrapeResult(html, url);
  const $ = load(html);
  $(HIDDEN).remove();
  $("[style]").filter((_i, node) => /display\s*:\s*none|visibility\s*:\s*hidden/i.test($(node).attr("style") ?? "")).remove();
  $("nav,footer,aside,[class*='related-job'],[class*='recommended-job']").remove();
  const headings = $("h1").toArray().map((node) => $(node).text());
  const scope = $("main").first().length ? $("main").first() : $("body");
  const applyLabels = scope.find("a[href],button,input[type='submit']").toArray().flatMap((node) => {
    const element = $(node);
    if (element.is("[disabled],[aria-disabled='true']") || element.parents("fieldset[disabled]").length) return [];
    if (element.is("a") && /^(?:#|javascript:)/i.test(element.attr("href")?.trim() ?? "")) return [];
    const label = element.attr("aria-label") || element.attr("value") || element.text();
    return APPLY_RULE.test(normalize(label)) ? [label.trim().slice(0, 200)] : [];
  });
  $("input,textarea,select").remove();
  $("p,div,section,article,h1,h2,h3,li,br").prepend("\n").append("\n");
  const cleanText = (value: string) => value.replace(/[\t\r ]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const pageText = cleanText($("body").text());
  const primaryText = normalize(`${scraped.title} ${scope.text()}`);
  const result: JobAvailabilityResult = {
    status: "unknown", url, checkedAt: now.toISOString(), httpStatus: 200,
    pageTitle: scraped.title, pageText, evidence: [],
    reason: "No reliable open or closed signal was found. The site may require JavaScript or a manual check.",
  };
  const blocked = BLOCKED_RULES.flatMap((rule) => rule.exec(primaryText)?.[0] ?? []);
  if (blocked.length || /^(?:403\b|forbidden\b|access denied\b)/.test(normalize(scraped.title))) {
    return { ...result, status: "blocked", reason: "The page is an access or verification screen. Job availability could not be checked.", evidence: blocked.length ? blocked : [scraped.title] };
  }
  if (/\b(?:internal server error|service unavailable|temporarily unavailable|bad gateway)\b/.test(primaryText)) {
    return { ...result, reason: "The website is showing a server error. Job availability is unknown.", evidence: ["Website error page"] };
  }
  const closed = CLOSED_RULES.flatMap((rule) => rule.exec(primaryText)?.[0] ?? []);
  if (closed.length) return { ...result, status: "closed", reason: "The page contains a notice that this job is no longer accepting applications.", evidence: closed };
  if (/^(?:404\b|page not found\b|job not found\b|pagina no encontrada\b)/.test(normalize(scraped.title))) {
    return { ...result, status: "closed", reason: "The job link displays a page-not-found notice.", evidence: [scraped.title] };
  }
  const relevantJobs = scraped.jobPostings.filter((job) => expectedTitle ? titleMatches(expectedTitle, job.title) : scraped.jobPostings.length === 1);
  const expiredJobs = relevantJobs.filter((job) => {
    if (!job.validThrough) return false;
    const value = /^\d{4}-\d{2}-\d{2}$/.test(job.validThrough) ? `${job.validThrough}T23:59:59.999Z` : job.validThrough;
    const expiration = Date.parse(value);
    return Number.isFinite(expiration) && expiration < now.getTime();
  });
  if (relevantJobs.length && expiredJobs.length === relevantJobs.length) {
    return { ...result, status: "closed", reason: "The matching job's published application deadline has passed.", evidence: expiredJobs.map((job) => `validThrough: ${job.validThrough}`) };
  }
  const matchedTitle = expectedTitle
    ? [scraped.title, ...headings, ...relevantJobs.map((job) => job.title)].some((title) => titleMatches(expectedTitle, title))
    : relevantJobs.length === 1;
  if (matchedTitle && applyLabels.length) {
    return { ...result, status: "open", reason: "The matching job page has an enabled application link or button, with no closed notice found. Confirm on the employer's site.", evidence: [...new Set(applyLabels)].slice(0, 5) };
  }
  return result;
}
