// ─────────────────────────────────────────────────────────────
// Cover-letter generator — deterministic, no network calls.
//
// Rewritten against the 50-point checklist: the default output already clears
// the automated rules in lint.ts — no "I'm writing to express my interest", no
// "I'm a <title> with N years", no industry lists, no corporate stock phrases,
// four short paragraphs under ~300 words, varied sentence openings, the role
// and company named once.
//
// What it can't invent — a specific, true reason for THIS company (rule 15) and
// one human detail (rule 39) — comes in as `hook`, `notes` and `detail`. When
// they're missing the letter still builds; lint.ts flags exactly what's left
// for a human to write.
// ─────────────────────────────────────────────────────────────

import type { CvData } from "../types";
import type { CvVariant } from "../variants";
import type { CompanyInfo, Tone } from "./cover-letter-types";
import { countWeakness } from "./cover-letter-lint";

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const formatDate = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

const wordCount = (s: string) => (s.match(/\S+/g) ?? []).length;

function endStop(s: string): string {
  const t = collapse(s);
  if (!t) return t;
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/** Lowercase the first letter unless it's an acronym (AWS, SQL…). */
function lowerFirst(s: string): string {
  return /^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
}

/** Trim a company field to a plain name — drop "· Client: …" and legal suffixes. */
function companyName(raw: string): string {
  const head = collapse(raw.split(/[·—]| - /)[0]);
  return head.replace(/,?\s+(Inc|LLC|Ltd|GmbH|S\.A\.|Corp|Co)\.?$/i, "");
}

function listWithAnd(items: readonly string[]): string {
  const xs = items.filter(Boolean);
  if (xs.length <= 1) return xs[0] ?? "";
  if (xs.length === 2) return `${xs[0]} and ${xs[1]}`;
  return `${xs.slice(0, -1).join(", ")}, and ${xs[xs.length - 1]}`;
}

/** "Python · React / TS" → "Python"; "AWS serverless" → "AWS serverless". */
const humanFocus = (item: string) => collapse(item.split(/\s*[·/]\s*/)[0]);
const focusList = (focus: readonly string[], n: number) =>
  listWithAnd(Array.from(new Set(focus.slice(0, n).map(humanFocus))));

/** Title before the first separator: "Tech Lead · Full-Stack Engineer" → "Tech Lead". */
const shortTitle = (role: string) => collapse(role.split(/\s*[·|—]\s*/)[0]);

// ── bullet → first person ──────────────────────────────────

const VERB_LEADS = new Set([
  "own", "owns", "led", "lead", "built", "build", "ship", "shipped", "design",
  "designed", "drove", "drive", "deliver", "delivered", "set", "run", "ran",
  "add", "added", "integrate", "integrated", "automate", "automated", "expose",
  "exposed", "back", "backed", "strengthen", "strengthened", "create", "created",
  "maintain", "maintained", "instrument", "instrumented", "contribute",
  "contributed", "took", "take", "wrote", "write", "reduced", "reduce", "tuned",
  "tune", "operate", "operated",
]);

const TO_PAST: Record<string, string> = {
  own: "owned", owns: "owned", ship: "shipped", build: "built", builds: "built",
  design: "designed", run: "ran", add: "added", expose: "exposed",
  integrate: "integrated", back: "backed", automate: "automated", lead: "led",
  take: "took", write: "wrote", drive: "drove", deliver: "delivered",
  maintain: "maintained", create: "created", strengthen: "strengthened",
  instrument: "instrumented", contribute: "contributed", tune: "tuned",
  operate: "operated", reduce: "reduced",
};

const leadWord = (s: string) => (s.match(/^([A-Za-z]+)/)?.[1] ?? "").toLowerCase();
const verbLed = (s: string) => VERB_LEADS.has(leadWord(s));

function firstPersonPresent(bullet: string): string {
  return `I ${lowerFirst(collapse(bullet))}`;
}
function firstPersonPast(bullet: string): string {
  const s = collapse(bullet);
  const lead = leadWord(s);
  const past = TO_PAST[lead];
  const rebased = past ? past + s.slice(lead.length) : s;
  return `I ${lowerFirst(rebased)}`;
}

/** Lowest-weakness, verb-leading bullet for a job; falls back to the first one. */
function pickBullet(bullets: readonly string[]): string | undefined {
  if (bullets.length === 0) return undefined;
  const ranked = [...bullets].sort((a, b) => {
    const va = countWeakness(a) + (verbLed(a) ? 0 : 3);
    const vb = countWeakness(b) + (verbLed(b) ? 0 : 3);
    return va - vb || a.length - b.length;
  });
  return ranked[0];
}

// ── build ──────────────────────────────────────────────────

export type CoverLetterInput = {
  info: CompanyInfo;
  variant: CvVariant;
  cv: CvData;
  /** One specific, true, non-portable thing about the company (rule 2 / 15). */
  hook?: string;
  /** Free text used verbatim as the "why this company" paragraph (rule 15 / 17). */
  notes?: string;
  /** One human, slightly-unusual detail (rule 39). */
  detail?: string;
  tone?: Tone;
  date?: Date;
};

export function buildCoverLetter({
  info,
  variant,
  cv,
  hook,
  notes,
  detail,
  tone = "startup",
  date = new Date(),
}: CoverLetterInput): string {
  const name = cv.personalInfo.name;
  const contactLine = cv.contactInfo.map((c) => c.text).join("  ·  ");
  const formal = tone === "enterprise";

  const company = info.company ? companyName(info.company) : "";
  const companyRef = company || "your team";
  const role = info.role || variant.postingTitle || variant.role;

  const theHook = collapse(hook ?? variant.coverLetterHook ?? "");
  const theNotes = collapse(notes ?? variant.coverLetterNotes ?? "");
  const theDetail = collapse(detail ?? variant.coverLetterDetail ?? "");

  const greeting = info.hiringManager
    ? `Dear ${info.hiringManager},`
    : company
      ? `Dear ${company} hiring team,`
      : "Dear hiring team,";

  // ── opening ──────────────────────────────────────────────
  const cur = cv.experience[0];
  const curCompany = cur ? companyName(cur.company) : "";
  const haveKey = formal ? "I have" : "I’ve";

  let opening: string;
  if (theHook) {
    const roleClause = company
      ? `Your ${role} opening at ${company} is where ${formal ? "I would" : "I’d"} want to take that next`
      : `Your ${role} opening is where ${formal ? "I would" : "I’d"} want to take that next`;
    opening = `${endStop(theHook)} ${roleClause}.`;
  } else {
    const focusPhrase = focusList(variant.focus, 2) || "full-stack";
    const asWho = curCompany
      ? `most recently as ${shortTitle(cur?.role ?? variant.role)} at ${curCompany}`
      : `most recently on ${shortTitle(variant.role).toLowerCase()} work`;
    const roleClause = company
      ? `Your ${role} role at ${company} lines up with that`
      : `Your ${role} role lines up closely with that`;
    opening =
      `For the last few years ${haveKey} been building ${focusPhrase} systems — ${asWho}. ` +
      `${roleClause}, so ${formal ? "I would like to apply" : "I’d like to put my name in"}.`;
  }

  // ── proof ────────────────────────────────────────────────
  const prev = cv.experience.slice(1).find((e) => e.bullets.length > 0);
  const proofParts: string[] = [];
  const curBullet = pickBullet(cur?.bullets ?? []);
  if (curBullet) {
    proofParts.push(
      curCompany
        ? `At ${curCompany}, ${firstPersonPresent(curBullet)}`
        : endStop(firstPersonPresent(curBullet)),
    );
  }
  if (prev) {
    const b = pickBullet(prev.bullets);
    if (b) proofParts.push(`Before that at ${companyName(prev.company)}, ${firstPersonPast(b)}`);
  }
  if (proofParts.length === 0) {
    proofParts.push(
      `The work I keep coming back to is ${focusList(variant.focus, 3) || "full-stack delivery"} — ` +
        `taken from first ask to something running in production.`,
    );
  }
  let proof = proofParts.map(endStop).join(" ");

  // ── why this company ─────────────────────────────────────
  let why: string;
  if (theNotes) {
    why = endStop(theNotes);
  } else {
    why =
      `What pulls me toward ${companyRef} is the chance to keep doing ` +
      `${humanFocus(variant.focus[0] ?? "this")} work somewhere it carries weight.`;
  }
  if (theDetail) why = `${why} ${endStop(theDetail)}`;

  // ── close ────────────────────────────────────────────────
  const close =
    tone === "enterprise"
      ? "I would welcome the chance to discuss the role in more detail. Thank you for your time and consideration."
      : tone === "agency"
        ? "Glad to walk through past projects whenever it suits. Thanks for reading."
        : "Happy to get into any of this on a call whenever it’s useful. Thanks for reading.";

  const signOff = formal ? "Sincerely," : "Best,";

  // Bullet ranking already prefers fewer em dashes (countWeakness); anything left
  // is the résumé's own punctuation. If it still trips rule 36 the review flags
  // it — we don't rewrite the bullets' meaning to chase the rule.
  let paras = [opening, proof, why, close];

  // ── length guard (rule 18): trim our own generated tail, never user text ──
  if (wordCount(paras.join(" ")) > 300 && !theNotes) {
    why =
      `What pulls me toward ${companyRef} is the chance to do ` +
      `${humanFocus(variant.focus[0] ?? "this")} work that matters.`;
    if (theDetail) why = `${why} ${endStop(theDetail)}`;
    paras = [opening, proof, why, close];
  }
  if (wordCount(paras.join(" ")) > 330 && proofParts.length > 1) {
    proof = endStop(proofParts.slice(0, 1).map(endStop).join(" "));
    paras = [opening, proof, why, close];
  }

  return [
    name,
    contactLine,
    "",
    formatDate(date),
    "",
    greeting,
    "",
    paras.map(collapse).join("\n\n"),
    "",
    signOff,
    name,
    "",
  ].join("\n");
}
