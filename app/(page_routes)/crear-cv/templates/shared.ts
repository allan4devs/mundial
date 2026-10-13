// Helpers shared by every résumé template.

import type { ResumeData, SectionLabels } from "../types";

/** "Ene 2022 – Actualidad" / "2019 – 2021" / "2020" */
export function dateRange(
  start: string,
  end: string,
  current: boolean,
  presentLabel: string,
): string {
  const s = start.trim();
  const e = current ? presentLabel : end.trim();
  if (s && e) return `${s} – ${e}`;
  return s || e || "";
}

/** Split a free-text block into paragraphs on blank lines. */
export function paragraphs(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** First name initial + first surname initial. */
export function monogram(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "").toUpperCase();
}

export type ContactBit = { text: string; href?: string };

/** Ordered, de-duplicated contact lines (email, phone, location, site, links). */
export function contactBits(data: ResumeData): ContactBit[] {
  const out: ContactBit[] = [];
  if (data.email) out.push({ text: data.email, href: `mailto:${data.email}` });
  if (data.phone) out.push({ text: data.phone, href: `tel:${data.phone.replace(/[^\d+]/g, "")}` });
  if (data.location) out.push({ text: data.location });
  if (data.website) out.push({ text: cleanUrl(data.website), href: ensureHttp(data.website) });
  for (const l of data.links) {
    if (!l.url && !l.label) continue;
    out.push({ text: l.label || cleanUrl(l.url), href: l.url ? ensureHttp(l.url) : undefined });
  }
  return out;
}

export function cleanUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function ensureHttp(url: string): string {
  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}

export function hasSkills(data: ResumeData): boolean {
  return data.skills.some((g) => g.label || g.items.some(Boolean));
}

export function hasProjects(data: ResumeData): boolean {
  return data.projects.some((p) => p.name || p.description);
}

export function hasLanguages(data: ResumeData): boolean {
  return data.languages.some((l) => l.name);
}

export function cleanBullets(bullets: string[]): string[] {
  return bullets.map((b) => b.trim()).filter(Boolean);
}

export type Labels = SectionLabels;
