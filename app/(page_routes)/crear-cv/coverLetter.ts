// ─────────────────────────────────────────────────────────────
// Deterministic bilingual cover-letter builder. No network calls — it fills
// a fixed template from the résumé data plus the target company/role.
// The user can hand-edit the result afterwards (stored as `cover.override`).
// ─────────────────────────────────────────────────────────────

import type { CoverLetterData, CvLang, ResumeData } from "./types";
import { cleanBullets, contactBits, paragraphs } from "./templates/shared";

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

function lowerFirst(s: string): string {
  return /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
}

function asSentence(s: string): string {
  const t = collapse(s).replace(/[.]+$/, "");
  return t ? `${t}.` : "";
}

function companyName(raw: string): string {
  return collapse(raw.split(/[·—|]| - /)[0]).replace(
    /,?\s+(Inc|LLC|Ltd|GmbH|S\.?A\.?|Corp|SRL|Sociedad Anónima)\.?$/i,
    "",
  );
}

function listWithConn(items: string[], conn: string): string {
  const xs = items.filter(Boolean);
  if (xs.length <= 1) return xs[0] ?? "";
  return `${xs.slice(0, -1).join(", ")} ${conn} ${xs[xs.length - 1]}`;
}

function localizedDate(lang: CvLang, d = new Date()): string {
  return d.toLocaleDateString(lang === "es" ? "es-CR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function yearsPhrase(data: ResumeData, lang: CvLang): string {
  const m = data.summary.match(/(\d+)\s*\+?\s*(años|year)/i);
  if (m) {
    const n = m[1];
    return lang === "es" ? `más de ${n} años` : `over ${n} years`;
  }
  return lang === "es" ? "varios años" : "several years";
}

export function buildCoverLetter(
  data: ResumeData,
  cover: CoverLetterData,
  lang: CvLang,
): string {
  const es = lang === "es";
  const name = data.fullName || (es ? "Tu nombre" : "Your name");
  const contactLine = contactBits(data)
    .map((b) => b.text)
    .join("  ·  ");
  const company = cover.company ? companyName(cover.company) : es ? "su empresa" : "your company";
  const role = cover.role || data.headline || (es ? "el puesto disponible" : "the open role");
  const conn = es ? "y" : "and";

  const greeting = cover.recipient
    ? es
      ? `Estimado/a ${cover.recipient}:`
      : `Dear ${cover.recipient},`
    : cover.company
      ? es
        ? `Estimable equipo de ${company}:`
        : `Dear ${company} Hiring Team,`
      : es
        ? "Estimable equipo de reclutamiento:"
        : "Dear Hiring Team,";

  const years = yearsPhrase(data, lang);
  const topSkills = listWithConn(
    (data.skills.find((g) => g.items.filter(Boolean).length)?.items ?? [])
      .filter(Boolean)
      .slice(0, 3),
    conn,
  );
  const headline = data.headline || (es ? "profesional" : "professional");

  const jobs = data.experience.filter((e) => e.company || e.role);
  const current = jobs[0];
  const earlier = jobs.slice(1).find((e) => cleanBullets(e.bullets).length > 0);

  const paras: string[] = [];

  // 1 — intro
  paras.push(
    es
      ? `Me dirijo a ustedes para expresar mi interés en ${role} en ${company}. ` +
          `Soy ${headline.toLowerCase()} con ${years} de experiencia` +
          (topSkills ? `, con foco en ${topSkills}.` : ".")
      : `I'm writing to express my interest in ${role} at ${company}. ` +
          `I'm a ${headline.toLowerCase()} with ${years} of experience` +
          (topSkills ? `, focused on ${topSkills}.` : ".") ,
  );

  // 2 — proof
  const b0 = current ? cleanBullets(current.bullets)[0] : "";
  if (current && b0) {
    let proof = es
      ? `En ${companyName(current.company) || current.role}, ${lowerFirst(asSentence(b0))}`
      : `At ${companyName(current.company) || current.role}, I ${lowerFirst(asSentence(b0))}`;
    const b1 = earlier ? cleanBullets(earlier.bullets)[0] : "";
    if (earlier && b1) {
      proof += es
        ? ` Antes, en ${companyName(earlier.company) || earlier.role}, ${lowerFirst(asSentence(b1))}`
        : ` Before that, at ${companyName(earlier.company) || earlier.role}, I ${lowerFirst(asSentence(b1))}`;
    }
    paras.push(proof);
  } else {
    const sum = paragraphs(data.summary)[0];
    if (sum) paras.push(sum);
  }

  // 3 — why this company
  paras.push(
    cover.hook.trim()
      ? asSentence(cover.hook)
      : es
        ? `Me interesa ${company} por la calidad de su trabajo y el impacto de su equipo. ` +
            `Aportaría compromiso, orden y una comunicación clara desde el primer día.`
        : `${company} stands out to me for the quality of its work and the impact of its team. ` +
            `I would bring commitment, structure, and clear communication from day one.`,
  );

  // 4 — closing
  paras.push(
    es
      ? `Agradezco su tiempo y consideración. Quedo a disposición para ampliar cualquier punto en una entrevista` +
          (cover.channel ? ` por ${cover.channel}.` : ".")
      : `Thank you for your time and consideration. I'd welcome the chance to discuss my fit in an interview` +
          (cover.channel ? ` via ${cover.channel}.` : "."),
  );

  const signOff = es ? "Atentamente," : "Sincerely,";

  return [
    name,
    contactLine,
    "",
    localizedDate(lang),
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
