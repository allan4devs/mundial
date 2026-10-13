// Best-effort extraction of company / role / manager / location from a pasted
// job posting or notes blob. Anything missed just falls back to the active
// variant's own metadata when the letter is built.

import type { CompanyInfo } from "./cover-letter-types";

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();
const stripEdges = (s: string) => s.replace(/^[\s"'([]+|[\s"')\].,;:]+$/g, "");

export function parseCompanyInfo(raw: string): CompanyInfo {
  const text = raw.replace(/\r/g, "");
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const labelled = (labels: string[]): string => {
    const re = new RegExp(`^(?:${labels.join("|")})\\s*[:\\-–]\\s*(.+)$`, "i");
    for (const l of lines) {
      const m = l.match(re);
      if (m) return stripEdges(collapse(m[1]));
    }
    return "";
  };

  let company = labelled(["company", "employer", "organi[sz]ation", "client"]);
  let role = labelled(["role", "position", "job title", "title", "job"]);
  const location = labelled(["location", "based in", "office", "region"]);
  const hiringManager = labelled([
    "hiring manager",
    "hiring lead",
    "contact",
    "recruiter",
    "reporting to",
    "attn",
  ]);

  // "<Role> at <Company>" anywhere in the text.
  if (!company || !role) {
    const m = text.match(
      /\b([A-Z][A-Za-z0-9/&+.\-]*(?:\s+[A-Za-z0-9/&+.\-]+){0,5}?)\s+(?:role|position|job)?\s*at\s+([A-Z][A-Za-z0-9/&+.\-]*(?:\s+[A-Za-z0-9/&+.\-]+){0,4})/,
    );
    if (m) {
      if (!role) role = stripEdges(collapse(m[1]));
      if (!company) company = stripEdges(collapse(m[2]));
    }
  }

  // Last resort: first short, non-URL line is probably the company name.
  if (!company) {
    const first = lines.find((l) => !/^https?:\/\//i.test(l) && l.length <= 64);
    if (first) company = stripEdges(collapse(first));
  }

  return { company, role, location, hiringManager };
}
