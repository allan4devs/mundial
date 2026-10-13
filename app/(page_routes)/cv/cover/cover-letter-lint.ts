// ─────────────────────────────────────────────────────────────
// The 50-point cover-letter checklist, as far as a machine can take it.
//
// ~34 of the 50 rules have an automated check here; the rest need a human read
// and live in MANUAL_RULES so the feature still carries the whole list. Some
// rules fold together (23+41 résumé punctuation, 33+34 rhythm, 15+35 generic
// praise). buildCoverLetter() shares the phrase lists below so its default
// output already clears the automated rules.
// ─────────────────────────────────────────────────────────────

import type {
  LintContext,
  LintFinding,
  LintGroup,
  LintReport,
  ManualRule,
  Severity,
} from "./cover-letter-types";

// ── phrase lists (shared with build.ts) ─────────────────────

/** Corporate stock phrases — rule 21. A hit is a hard fail. */
export const BANNED_PHRASES: readonly string[] = [
  "proven track record",
  "results-driven",
  "results driven",
  "dynamic environment",
  "fast-paced environment",
  "synergy",
  "synergies",
  "detail-oriented",
  "detail oriented",
  "team player",
  "go-getter",
  "self-starter",
  "hit the ground running",
  "move the needle",
  "circle back",
  "value add",
  "value-add",
  "thought leader",
  "bring to the table",
  "wheelhouse",
  "deep dive",
  "touch base",
  "boots on the ground",
  "wear many hats",
];

/** Puffed-up verbs — rule 22. Prefer led / built / ran. */
export const WEAK_VERBS: readonly string[] = [
  "spearheaded",
  "leveraged",
  "leveraging",
  "leverage",
  "utilized",
  "utilised",
  "utilize",
  "utilise",
  "orchestrated",
  "helmed",
  "pioneered",
  "synergized",
  "spearheading",
];

/** Generic praise with no specifics — rules 15 & 35. */
export const GENERIC_PRAISE: readonly string[] = [
  "known for",
  "reputation for",
  "engineering excellence",
  "commitment to excellence",
  "culture of excellence",
  "passion for quality",
  "world-class engineering",
  "world class engineering",
  "cutting-edge",
  "cutting edge",
  "bleeding edge",
  "industry-leading",
  "industry leading",
  "best-in-class",
  "best in class",
];

/** Adverbs that carry no information — rule 31. */
export const EMPTY_ADVERBS: readonly string[] = [
  "truly",
  "highly",
  "very",
  "really",
  "extremely",
  "incredibly",
  "absolutely",
  "super",
  "totally",
];

/** Absolute claims you can't back up — rule 28. */
export const AI_ABSOLUTES: readonly string[] = [
  "expert in",
  "world-class",
  "world class",
  "best-in-class",
  "best in class",
  "unmatched",
  "unparalleled",
  "second to none",
  "guru",
  "ninja",
  "rockstar",
  "10x engineer",
  "10x developer",
];

// ── text helpers ───────────────────────────────────────────

const WORD_RE = /\S+/g;
const wordCount = (s: string) => (s.match(WORD_RE) ?? []).length;

const sentencesOf = (s: string): string[] =>
  s
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z"'(¿])/)
    .map((x) => x.trim())
    .filter(Boolean);

/** Case-insensitive, tolerant of one space/hyphen between words. */
function phraseRe(phrase: string): RegExp {
  const body = phrase
    .trim()
    .toLowerCase()
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((seg) => seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[\\s-]+");
  return new RegExp(`(^|[^a-z0-9])(${body})([^a-z0-9]|$)`, "i");
}

const hitList = (text: string, phrases: readonly string[]): string[] =>
  phrases.filter((p) => phraseRe(p).test(text));

/** A digit / % / $ or a mid-sentence capitalised word (proxy for a proper noun). */
function hasConcrete(text: string): boolean {
  if (/[0-9$%]/.test(text)) return true;
  return /[a-z][.,)]?\s+[A-Z][A-Za-z][A-Za-z.]+/.test(text);
}

function containsToken(haystack: string, token: string): boolean {
  const t = token.trim().toLowerCase();
  if (t.length < 2) return false;
  return new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i").test(
    haystack,
  );
}

const GENERIC_ROLE_WORDS = new Set([
  "senior", "staff", "principal", "lead", "sr", "jr", "junior", "the",
  "full", "stack", "full-stack", "fullstack", "software", "engineer", "engineering",
  "developer", "development", "i", "ii", "iii", "and", "of", "for",
]);

function distinctiveRoleTokens(role: string): string[] {
  return role
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((w) => w.length >= 3 && !GENERIC_ROLE_WORDS.has(w));
}

function companyStem(company: string): string {
  return company
    .replace(/[·—-].*$/, "")
    .replace(/,?\s+(inc|llc|ltd|gmbh|s\.a\.|corp|co)\.?$/i, "")
    .trim();
}

// ── letter structure ───────────────────────────────────────

type Parts = {
  headLines: string[];
  greeting: string;
  paras: string[];
  bodyText: string;
  closingPara: string;
  ok: boolean;
};

function splitLetter(letter: string): Parts {
  const blocks = letter.trim().split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  if (blocks.length >= 5) {
    const paras = blocks.slice(3, -1);
    return {
      headLines: blocks[0].split("\n"),
      greeting: blocks[2],
      paras,
      bodyText: paras.join("\n\n"),
      closingPara: paras[paras.length - 1] ?? "",
      ok: true,
    };
  }
  // Degraded (hand-edited): treat everything between the first and last block as body.
  const paras = blocks.slice(1, -1).length ? blocks.slice(1, -1) : blocks;
  return {
    headLines: (blocks[0] ?? "").split("\n"),
    greeting: blocks[1] ?? "",
    paras,
    bodyText: paras.join("\n\n"),
    closingPara: paras[paras.length - 1] ?? "",
    ok: blocks.length >= 3,
  };
}

// ── the checks ─────────────────────────────────────────────

const GROUP: Record<string, LintGroup> = {
  open: "Opening & hook",
  struct: "Structure & content",
  lang: "Language & tone",
  ai: "Sounds-like-AI tells",
  fmt: "Formatting & mechanics",
  pre: "Before sending",
};

export function lintLetter(letter: string, ctx: LintContext): LintReport {
  const parts = splitLetter(letter);
  const { paras, bodyText, closingPara, greeting } = parts;
  const body = bodyText;
  const bodyLc = body.toLowerCase();
  const greetBody = `${greeting}\n${body}`;
  const para1 = paras[0] ?? "";
  const allSentences = sentencesOf(body);
  const words = wordCount(body);

  const findings: LintFinding[] = [];
  const evaluated = new Set<number>();
  const violated = new Set<number>();

  const check = (
    rule: number,
    key: keyof typeof GROUP,
    severity: Severity,
    hit: boolean,
    title: string,
    detail: string,
  ) => {
    evaluated.add(rule);
    if (hit) {
      violated.add(rule);
      findings.push({ rule, group: GROUP[key], severity, title, detail });
    }
  };

  const roleTokens = distinctiveRoleTokens(ctx.role);
  const roleNamed =
    roleTokens.length === 0 || roleTokens.some((t) => containsToken(greetBody.toLowerCase(), t));
  const stem = companyStem(ctx.company);
  const companyNamed = stem.length > 0 && greetBody.toLowerCase().includes(stem.toLowerCase());

  if (!parts.ok) {
    findings.push({
      rule: 0,
      group: GROUP.fmt,
      severity: "info",
      title: "Letter structure looks off",
      detail: "Expected a header, date, greeting, 3–4 paragraphs and a sign-off separated by blank lines.",
    });
  }

  // ── Opening & hook ───────────────────────────────────────
  const openerRe =
    /^\s*(?:dear[^,]*,\s*)?i(?:['’]m| am| would like| wish| want)\b[^.?!]*\b(?:writing|reaching out)\b[^.?!]*\b(?:express|convey|share|register|indicate)\b/i;
  check(
    1,
    "open",
    "fail",
    openerRe.test(para1) || /express(?:ing)?\s+(?:my\s+)?(?:strong |keen |sincere |genuine )?interest in\b/i.test(para1) || /^\s*i am (?:very )?excited to apply\b/i.test(para1) || /^\s*please (?:accept|find)\b/i.test(para1),
    "Skip “I’m writing to express my interest”",
    "The opening line uses the most common template opener. Lead with a concrete company detail or your strongest result instead.",
  );

  const s1 = sentencesOf(para1)[0] ?? para1;
  const first2 = sentencesOf(para1).slice(0, 2).join(" ");
  check(
    3,
    "open",
    "warn",
    !companyNamed && !hasConcrete(s1),
    "Open with something specific",
    "The first sentence names nothing concrete — a product, a number, a technical choice, a talk. Generic praise doesn’t count.",
  );
  check(
    4,
    "open",
    "warn",
    !roleTokens.some((t) => containsToken(para1.toLowerCase(), t)) && roleTokens.length > 0,
    "Name the role in the first sentence",
    `Couldn’t find the role (“${ctx.role}”) in the opening paragraph.`,
  );
  check(
    5,
    "open",
    "fail",
    /\bi(?:['’]m| am)\s+an?\s+[\w /.-]+?\s+with\s+(?:over\s+|more than\s+)?\d+\+?\s*years?\b/i.test(body),
    "Don’t start with “I am a [title] with X years”",
    "That sentence is what every AI-written letter opens with. Cut it or bury the tenure later.",
  );
  check(
    6,
    "open",
    "warn",
    !hasConcrete(first2),
    "Get to something concrete within two sentences",
    "The first two sentences stay abstract — no name, number, or specific.",
  );
  check(
    8,
    "open",
    "warn",
    (para1.match(/\?/g) ?? []).length > 1 || sentencesOf(para1).length > 4,
    "One clear hook, not three",
    "The opening paragraph is doing too much — trim it to a single hook.",
  );

  // ── Structure & content ─────────────────────────────────
  check(
    11,
    "struct",
    "warn",
    allSentences.filter((s) => /\b\w+ed\b/.test(s) && /[a-z]\s+[A-Z][A-Za-z]/.test(s)).length > 5,
    "Pick 2–3 examples, not a career tour",
    "More than five example-style sentences — this reads like the résumé in prose. Choose the 2–3 that fit this role.",
  );
  check(
    12,
    "struct",
    "warn",
    !/[0-9$%]/.test(body) && !/\bfrom\b[^.?!]*\bto\b/i.test(body),
    "Show a result, not a responsibility",
    "No numbers or before/after anywhere — “cut deploy time from 40min to 6min” beats “responsible for CI/CD”.",
  );
  const focusMatched = ctx.focus.filter((f) =>
    f
      .split(/[^a-z0-9+#.]+/i)
      .filter((w) => w.length >= 3 && !GENERIC_ROLE_WORDS.has(w.toLowerCase()))
      .some((w) => containsToken(bodyLc, w.toLowerCase())),
  ).length;
  check(
    13,
    "struct",
    "warn",
    ctx.focus.length > 0 && focusMatched === 0,
    "Mirror the posting’s language",
    `Nothing in the letter echoes this variant’s focus (${ctx.focus.join(", ")}). Tie an example to what the posting asks for.`,
  );
  check(
    14,
    "struct",
    "warn",
    /\b(enterprise|healthcare|health care|consumer|consulting|fintech|retail|e-?commerce|edtech|govtech|saas|b2b|b2c)\b(?:\s*,\s*(?:and\s+)?[a-z][a-z -]+){2,}/i.test(body),
    "Cut the industry / domain list",
    "A run of comma-separated industries (“enterprise, healthcare, consumer, consulting”) — keep only the ones doing real work in the sentence.",
  );
  const praiseHits = hitList(body, GENERIC_PRAISE);
  check(
    15,
    "struct",
    "warn",
    (!ctx.hasWhyNote && !ctx.hasCompanyHook) || praiseHits.length > 0,
    "Say why THIS company, specifically",
    praiseHits.length > 0
      ? `Generic praise: “${praiseHits.join("”, “")}”. Replace with something you couldn’t paste into a competitor’s letter.`
      : "No company-specific reason supplied — the “why us” paragraph is portable. Add a real detail (a product, a technical decision, a post).",
  );
  check(
    18,
    "struct",
    words > 350 ? "fail" : "warn",
    words > 300 || paras.length < 3 || paras.length > 4,
    "3–4 paragraphs, under ~350 words",
    `${words} words in ${paras.length} paragraph${paras.length === 1 ? "" : "s"}.` +
      (words > 350 ? " Cut hard." : words > 300 ? " Trim toward 300." : " Aim for 3–4 paragraphs."),
  );
  const restated = (() => {
    if (paras.length < 3) return [] as string[];
    const earlier = paras.slice(0, -1).join(" ").toLowerCase();
    const skip = new Set(
      [...roleTokens, stem.toLowerCase(), ...companyStem(ctx.company).toLowerCase().split(/\s+/)].filter(Boolean),
    );
    return Array.from(
      new Set(
        (closingPara.toLowerCase().match(/[a-z]{6,}/g) ?? []).filter(
          (w) => !skip.has(w) && earlier.includes(w),
        ),
      ),
    );
  })();
  check(
    20,
    "struct",
    "warn",
    restated.length >= 3,
    "Don’t restate the letter in the closing",
    `The last paragraph echoes earlier wording: ${restated.slice(0, 4).join(", ")}.`,
  );
  check(
    19,
    "struct",
    "warn",
    /at your (?:earliest )?(?:disposal|convenience)|do not hesitate to (?:contact|reach)|thank you in advance|await(?:ing)? your (?:reply|response)/i.test(
      closingPara,
    ),
    "Low-pressure close, not a formula",
    "The closing uses a stock formality (“I remain at your disposal”, “at your earliest convenience”).",
  );

  // ── Language & tone ─────────────────────────────────────
  const banned = hitList(body, BANNED_PHRASES);
  check(21, "lang", "fail", banned.length > 0, "Cut corporate stock phrases", banned.length ? `Found: “${banned.join("”, “")}”.` : "");
  const weakVerbs = hitList(body, WEAK_VERBS).filter(
    (v) => !(v === "architected" && /architect/i.test(ctx.role)),
  );
  check(
    22,
    "lang",
    "warn",
    weakVerbs.length > 0,
    "Plain verbs — “led”, “built”, “ran”",
    `Puffed-up verb${weakVerbs.length > 1 ? "s" : ""}: “${weakVerbs.join("”, “")}”.`,
  );
  check(
    23,
    "lang",
    "warn",
    /[A-Za-z]{2,}\s*[·•]\s*[A-Za-z]{2,}/.test(body) ||
      /\b[A-Za-z.+#]{2,}\s*\/\s*[A-Za-z.+#]{2,}\s*\/\s*[A-Za-z.+#]{2,}/.test(body),
    "Full sentences, not slash-separated buzzwords",
    "A middot- or slash-joined run (“Python · React / TS”) appears inside a sentence.",
  );
  const listRe = /[A-Za-z][\w.+#]*(?:,\s+[\w.+#]+){2,}/g;
  const lists = (body.match(listRe) ?? []).map((l) =>
    l
      .toLowerCase()
      .split(/,\s*/)
      .map((x) => x.trim())
      .sort(),
  );
  const dupList = lists.some((a, i) =>
    lists.some((b, j) => j > i && a.filter((x) => b.includes(x)).length >= 3),
  );
  check(24, "lang", "warn", dupList, "Don’t list the same skills twice", "The same 3+ item stack list appears in two places — say it once.");
  const verbFamilies: [string, RegExp][] = [
    ["own", /\bown(?:s|ed|ing)?\b/g],
    ["lead", /\b(?:lead|leads|led|leading)\b/g],
    ["build", /\b(?:build|builds|built|building)\b/g],
    ["ship", /\b(?:ship|ships|shipped|shipping)\b/g],
    ["deliver", /\b(?:deliver|delivers|delivered|delivering)\b/g],
  ];
  for (const [name, re] of verbFamilies) {
    const n = (bodyLc.match(re) ?? []).length;
    check(25, "lang", "warn", n >= 3, "Vary your verbs", `“${name}” (and its forms) appears ${n} times — swap some out.`);
  }
  const passionRe = /\b(passionate|passion|excited|thrilled|obsessed|enthusiastic)\b/gi;
  let passionBare = false;
  for (const m of body.matchAll(passionRe)) {
    const after = body.slice(m.index ?? 0, (m.index ?? 0) + 90);
    if (!hasConcrete(after)) passionBare = true;
  }
  check(27, "lang", "warn", passionBare, "“Passionate”/“excited” needs a specific right after", "Followed by nothing concrete — cut the word or name what you mean.");
  const absolutes = hitList(body, AI_ABSOLUTES);
  check(28, "lang", "warn", absolutes.length > 0, "Drop claims you can’t back up", absolutes.length ? `“${absolutes.join("”, “")}”.` : "");
  const hedges = (body.match(/\bi (?:believe|think|feel|guess|suppose)\b/gi) ?? []).length +
    (body.match(/\bin my opinion\b/gi) ?? []).length;
  check(30, "lang", "warn", hedges >= 2, "Don’t hedge every claim", `“I believe / I think …” ${hedges} times — just state it.`);
  const adverbs = Array.from(new Set(hitList(body, EMPTY_ADVERBS)));
  check(31, "lang", "warn", adverbs.length > 0, "Cut information-free adverbs", `“${adverbs.join("”, “")}”.`);

  // ── Sounds-like-AI tells ────────────────────────────────
  const starts = allSentences.map((s) => s.split(/\s+/)[0]?.toLowerCase() ?? "");
  let run = 1;
  let maxRun = 1;
  for (let i = 1; i < starts.length; i++) {
    run = starts[i] === "i" && starts[i - 1] === "i" ? run + 1 : 1;
    maxRun = Math.max(maxRun, run);
  }
  const paraStarts = paras.map((p) => (sentencesOf(p)[0] ?? "").split(/\s+/)[0]?.toLowerCase() ?? "");
  check(
    33,
    "ai",
    "warn",
    maxRun >= 3 || (paras.length >= 3 && new Set(paraStarts).size === 1),
    "Vary the sentence rhythm",
    maxRun >= 3
      ? `${maxRun} sentences in a row start with “I”.`
      : "Every paragraph opens with the same word.",
  );
  check(
    37,
    "ai",
    "warn",
    /\bnot (?:just|only|merely)\b[^.?!]*\bbut\b/i.test(body) ||
      /\bit['’]?s not (?:just )?about\b[^.?!]*\bit['’]?s\b/i.test(body),
    "Avoid “not just X, but Y”",
    "That construction is a strong AI-writing tell.",
  );
  const emDashes = (letter.match(/—/g) ?? []).length;
  const everyPara = paras.length >= 3 && paras.every((p) => p.includes("—"));
  check(
    36,
    "ai",
    "warn",
    emDashes > 4 || everyPara,
    "Don’t lean on em dashes",
    everyPara ? "An em dash in every paragraph." : `${emDashes} em dashes — use commas or full stops for some.`,
  );
  const tripleAdj = (body.match(/\b(?:a|an|the)\s+\w+,\s+\w+,?\s+and\s+\w+\b/gi) ?? []).length;
  check(38, "ai", "warn", tripleAdj >= 2, "Don’t list three adjectives every time", `${tripleAdj} “X, Y, and Z” descriptions.`);
  check(
    39,
    "ai",
    "warn",
    !ctx.hasHumanDetail,
    "Include one specific human detail",
    "Nothing personal or slightly unusual — a tool you like, a decision you’d redo, a specific moment.",
  );
  // The sign-off paragraph is meant to be plain (rule 19) — judge substance on
  // the paragraphs that make the argument.
  const argSentences = sentencesOf(paras.slice(0, -1).join(" "));
  const argPool = argSentences.length > 0 ? argSentences : allSentences;
  const filler = argPool.filter((s) => !hasConcrete(s)).length;
  check(
    40,
    "ai",
    "warn",
    argPool.length >= 4 && filler / argPool.length > 0.45,
    "Every sentence should be non-portable",
    `${filler} of ${argPool.length} body sentences carry no name or number — they’d fit any letter.`,
  );

  // ── Formatting & mechanics ──────────────────────────────
  paras.forEach((p, i) => {
    check(42, "fmt", "warn", sentencesOf(p).length > 5, "Keep paragraphs to 3–5 sentences", `Paragraph ${i + 1} has ${sentencesOf(p).length} sentences.`);
  });
  check(43, "fmt", "warn", /[►◆●▪♦→⇒✔✓➤▶]/.test(body), "One clean font, no odd symbols", "Decorative symbols in the body text.");
  const tenseClash =
    (/\bi (?:lead|own|build|manage|drive)\b/i.test(body) && /\bi (?:led|owned|built|managed|drove)\b/i.test(body));
  check(44, "fmt", "warn", tenseClash, "Keep tense consistent", "Both present and simple-past first-person verbs appear — current role = present, past roles = past.");
  check(
    45,
    "fmt",
    !companyNamed ? "fail" : "warn",
    !companyNamed || !roleNamed,
    "Company name and role title must match the posting",
    !companyNamed && !roleNamed
      ? `Neither the company (“${stem}”) nor the role (“${ctx.role}”) appears in the letter.`
      : !companyNamed
        ? `The company (“${stem || ctx.company}”) doesn’t appear in the letter.`
        : `The role (“${ctx.role}”) doesn’t appear in the letter.`,
  );
  const hasEmail = parts.headLines.some((l) => /@/.test(l));
  const hasPhone = parts.headLines.some((l) => /\+?\d[\d ()\-]{6,}\d/.test(l));
  check(46, "fmt", "info", !hasEmail || !hasPhone, "Contact block current and complete", "Couldn’t see both an email and a phone number in the header.");

  // ── Before sending ──────────────────────────────────────
  check(48, "pre", "info", words > 280, "Cut it ~20% after you think it’s done", `${words} words now — aim for ~${Math.max(180, Math.round(words * 0.8))}.`);
  check(
    50,
    "pre",
    "info",
    argPool.length >= 5 && filler / argPool.length > 0.4,
    "Does every sentence earn its place?",
    `${filler} of ${argPool.length} body sentences add no specific — read each one and ask.`,
  );

  // ── score ───────────────────────────────────────────────
  const counts = { fail: 0, warn: 0, info: 0 };
  for (const f of findings) counts[f.severity]++;
  const autoTotal = Array.from(evaluated).filter((r) => Number.isInteger(r) && r > 0).length;
  const weight = counts.fail * 2 + counts.warn;
  const score = autoTotal === 0 ? 100 : Math.max(0, Math.min(100, Math.round((100 * (autoTotal - weight)) / autoTotal)));
  const passed = Array.from(evaluated).filter((r) => Number.isInteger(r) && r > 0 && !violated.has(r));

  findings.sort((a, b) => {
    const order: Record<Severity, number> = { fail: 0, warn: 1, info: 2 };
    return order[a.severity] - order[b.severity] || a.rule - b.rule;
  });

  return {
    findings,
    passed,
    autoTotal,
    score,
    wordCount: words,
    paragraphs: paras.length,
    sentences: allSentences.length,
    counts,
  };
}

/** Weakness score for a candidate sentence — build.ts ranks bullet choices by
 *  this so the generated letter starts as clean as the checklist allows. */
export function countWeakness(text: string): number {
  const t = ` ${text.toLowerCase()} `;
  let n = 0;
  for (const p of [...BANNED_PHRASES, ...WEAK_VERBS, ...GENERIC_PRAISE, ...EMPTY_ADVERBS, ...AI_ABSOLUTES]) {
    if (phraseRe(p).test(t)) n += 2;
  }
  n += (text.match(/—/g) ?? []).length;
  if (/[·•]/.test(text)) n += 2;
  if (/\b[A-Za-z.+#]{2,}\s*\/\s*[A-Za-z.+#]{2,}\s*\/\s*[A-Za-z.+#]{2,}/.test(text)) n += 2;
  if (/\bnot (?:just|only)\b[^.?!]*\bbut\b/i.test(text)) n += 3;
  return n;
}

// ── the rules a machine can't judge ────────────────────────

export const MANUAL_RULES: readonly ManualRule[] = [
  { rule: 7, group: "Opening & hook", text: "Write the opening last — after you know the letter’s actual argument." },
  { rule: 9, group: "Structure & content", text: "One letter = one argument: why you fit THIS role at THIS company." },
  { rule: 10, group: "Structure & content", text: "Cut anything that’s just the résumé restated in prose." },
  { rule: 16, group: "Structure & content", text: "If you don’t know the company well yet, research before writing — don’t write around it." },
  { rule: 17, group: "Structure & content", text: "Address a real pain point or priority you can infer from the posting." },
  { rule: 26, group: "Language & tone", text: "Read it out loud. If it’s not something you’d say to a person, rewrite it." },
  { rule: 29, group: "Language & tone", text: "Use contractions consistently — either voice is fine, just don’t mix." },
  { rule: 32, group: "Language & tone", text: "Match the company’s tone: startup vs enterprise vs agency read differently." },
  { rule: 34, group: "Sounds-like-AI tells", text: "Let the structure be a little uneven — real writing isn’t perfectly parallel." },
  { rule: 43, group: "Formatting & mechanics", text: "One clean font, consistent spacing, no weird symbols." },
  { rule: 47, group: "Before sending", text: "Read it as the hiring manager who’s seen 200 today. Does it stand out?" },
  { rule: 49, group: "Before sending", text: "Have someone else read it, or reread it after 24 hours away." },
];
