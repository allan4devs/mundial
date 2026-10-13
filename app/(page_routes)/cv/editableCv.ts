// ─────────────────────────────────────────────────────────────
// Editable CV model — a fully serialisable mirror of CvData used by the /cv
// content editor. The only non-JSON field in CvData is the contact-entry icon
// (a React component); here it becomes a string key. Two converters bridge the
// two shapes:
//   toEditable(cv)     → seed the editor form from a variant data module
//   materialize(ec)     → back to CvData for the live preview / audit / letter
// materialize() also trims + drops empty rows so the preview stays clean while
// the editor keeps your in-progress text (blank bullet lines, half-typed groups).
// ─────────────────────────────────────────────────────────────

import {
  Calendar,
  FileText,
  Github,
  Globe,
  Link as LinkIcon,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
  type LucideIcon,
} from "lucide-react";
import type { CvData, CvLabels, SummarySegment } from "./types";

// ── contact icons ──────────────────────────────────────────

export type ContactIconKey =
  | "map-pin"
  | "phone"
  | "mail"
  | "linkedin"
  | "github"
  | "globe"
  | "twitter"
  | "calendar"
  | "file"
  | "link";

export const CONTACT_ICONS: Record<ContactIconKey, LucideIcon> = {
  "map-pin": MapPin,
  phone: Phone,
  mail: Mail,
  linkedin: Linkedin,
  github: Github,
  globe: Globe,
  twitter: Twitter,
  calendar: Calendar,
  file: FileText,
  link: LinkIcon,
};

export const CONTACT_ICON_ORDER: ContactIconKey[] = [
  "map-pin",
  "phone",
  "mail",
  "linkedin",
  "github",
  "globe",
  "twitter",
  "calendar",
  "file",
  "link",
];

export const CONTACT_ICON_LABEL: Record<ContactIconKey, string> = {
  "map-pin": "Location",
  phone: "Phone",
  mail: "Email",
  linkedin: "LinkedIn",
  github: "GitHub",
  globe: "Website",
  twitter: "X / Twitter",
  calendar: "Calendar",
  file: "Document",
  link: "Link",
};

// ── the editable model (no React components — safe to clone / JSON) ──

export type EditableContact = {
  icon: ContactIconKey;
  text: string;
  href: string;
  external: boolean;
};
export type EditableGroup = { label: string; items: string[] };
export type EditableHighlight = { title: string; detail: string };
export type EditableJob = {
  role: string;
  company: string;
  period: string;
  location: string;
  current: boolean;
  bullets: string[];
};
export type EditableLanguage = { language: string; level: string };

export type EditableCv = {
  personalInfo: { name: string; title: string };
  contactInfo: EditableContact[];
  primarySkills: EditableGroup[];
  secondarySkills: EditableGroup[];
  education: {
    degree: string;
    school: string;
    period: string;
    internshipLabel: string;
    internship: string;
  };
  languages: EditableLanguage[];
  /** one string per paragraph; inline markup: **bold**, **!accent** */
  summary: string[];
  highlights: EditableHighlight[];
  experience: EditableJob[];
  /** localized section headings — English defaults when unset */
  labels?: Partial<CvLabels>;
};

// ── blank rows for the "add" buttons ───────────────────────

export const blankContact = (): EditableContact => ({ icon: "link", text: "", href: "", external: false });
export const blankGroup = (): EditableGroup => ({ label: "", items: [] });
export const blankHighlight = (): EditableHighlight => ({ title: "", detail: "" });
export const blankJob = (): EditableJob => ({
  role: "",
  company: "",
  period: "",
  location: "",
  current: false,
  bullets: [""],
});
export const blankLanguage = (): EditableLanguage => ({ language: "", level: "" });

// ── summary <-> inline markup ──────────────────────────────
// The document renders the summary as runs of {text, bold?, accent?}. In the
// editor a paragraph is one plain string with lightweight markers:
//   **bold**   → bold           **!teal**  → bold + accent colour

const SUMMARY_RE = /\*\*(!)?([^*]+?)\*\*/g;

export function segmentsToMarkup(para: readonly SummarySegment[]): string {
  return para
    .map((seg) => {
      if (!seg.bold) return seg.text;
      return seg.accent ? `**!${seg.text}**` : `**${seg.text}**`;
    })
    .join("");
}

export function markupToSegments(line: string): SummarySegment[] {
  const out: SummarySegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  SUMMARY_RE.lastIndex = 0;
  while ((m = SUMMARY_RE.exec(line)) !== null) {
    if (m.index > last) out.push({ text: line.slice(last, m.index) });
    out.push(m[1] ? { text: m[2], bold: true, accent: true } : { text: m[2], bold: true });
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push({ text: line.slice(last) });
  return out.filter((s) => s.text.length > 0);
}

// ── CvData → EditableCv ────────────────────────────────────

function iconKeyFromComponent(icon: LucideIcon): ContactIconKey | null {
  for (const key of CONTACT_ICON_ORDER) {
    if (CONTACT_ICONS[key] === icon) return key;
  }
  return null;
}

function guessIconKey(text: string, href?: string): ContactIconKey {
  const s = `${text} ${href ?? ""}`.toLowerCase();
  if (s.includes("linkedin")) return "linkedin";
  if (s.includes("github")) return "github";
  if (s.includes("mailto:") || s.includes("@")) return "mail";
  if (s.includes("tel:") || /\+?\d[\d\s()-]{6,}/.test(text)) return "phone";
  if (s.includes("twitter") || s.includes("x.com")) return "twitter";
  if (s.startsWith("http") || (href ?? "").startsWith("http")) return "globe";
  return "map-pin";
}

export function toEditable(cv: CvData): EditableCv {
  return {
    personalInfo: { name: cv.personalInfo.name, title: cv.personalInfo.title },
    contactInfo: cv.contactInfo.map((c) => ({
      icon: iconKeyFromComponent(c.icon) ?? guessIconKey(c.text, c.href),
      text: c.text,
      href: c.href ?? "",
      external: Boolean(c.external),
    })),
    primarySkills: cv.primarySkills.map((g) => ({ label: g.label, items: [...g.items] })),
    secondarySkills: cv.secondarySkills.map((g) => ({ label: g.label, items: [...g.items] })),
    education: {
      degree: cv.education.degree,
      school: cv.education.school,
      period: cv.education.period,
      internshipLabel: cv.education.internshipLabel,
      internship: cv.education.internship,
    },
    languages: cv.languages.map((l) => ({ language: l.language, level: l.level })),
    summary: cv.summary.map((para) => segmentsToMarkup(para)),
    highlights: (cv.highlights ?? []).map((h) => ({ title: h.title, detail: h.detail })),
    experience: cv.experience.map((j) => ({
      role: j.role,
      company: j.company,
      period: j.period,
      location: j.location,
      current: Boolean(j.current),
      bullets: [...j.bullets],
    })),
    ...(cv.labels ? { labels: { ...cv.labels } } : {}),
  };
}

// ── EditableCv → CvData (trimmed, empties dropped) ─────────

const trim = (s: string) => s.trim();
const nonEmpty = (s: string) => s.trim().length > 0;

export function materialize(ec: EditableCv): CvData {
  const groups = (gs: EditableGroup[]) =>
    gs
      .map((g) => ({ label: g.label.trim(), items: g.items.map(trim).filter(nonEmpty) }))
      .filter((g) => g.label.length > 0 || g.items.length > 0);

  return {
    personalInfo: {
      name: ec.personalInfo.name.trim(),
      title: ec.personalInfo.title.trim(),
    },
    contactInfo: ec.contactInfo
      .filter((c) => nonEmpty(c.text))
      .map((c) => ({
        icon: CONTACT_ICONS[c.icon] ?? CONTACT_ICONS.link,
        text: c.text.trim(),
        ...(nonEmpty(c.href) ? { href: c.href.trim() } : {}),
        ...(c.external ? { external: true } : {}),
      })),
    primarySkills: groups(ec.primarySkills),
    secondarySkills: groups(ec.secondarySkills),
    education: {
      degree: ec.education.degree.trim(),
      school: ec.education.school.trim(),
      period: ec.education.period.trim(),
      internshipLabel: ec.education.internshipLabel.trim(),
      internship: ec.education.internship.trim(),
    },
    languages: ec.languages
      .filter((l) => nonEmpty(l.language))
      .map((l) => ({ language: l.language.trim(), level: l.level.trim() })),
    summary: ec.summary
      .map((line) => markupToSegments(line.trim()))
      .filter((para) => para.some((s) => s.text.trim().length > 0)),
    highlights: ec.highlights
      .filter((h) => nonEmpty(h.title) || nonEmpty(h.detail))
      .map((h) => ({ title: h.title.trim(), detail: h.detail.trim() })),
    experience: ec.experience
      .filter((j) => nonEmpty(j.role) || nonEmpty(j.company))
      .map((j) => ({
        role: j.role.trim(),
        company: j.company.trim(),
        period: j.period.trim(),
        location: j.location.trim(),
        ...(j.current ? { current: true } : {}),
        bullets: j.bullets.map(trim).filter(nonEmpty),
      })),
    ...(ec.labels ? { labels: ec.labels } : {}),
  };
}

// ── defensive parse for stored / imported blobs ───────────

const asStr = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);
const asBool = (v: unknown): boolean => v === true;
const asStrArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const asObj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};

const LABEL_KEYS: (keyof CvLabels)[] = [
  "coreSkills",
  "education",
  "languages",
  "whatIBring",
  "summary",
  "experience",
  "documentType",
];

function parseLabels(v: unknown): Partial<CvLabels> | undefined {
  const o = asObj(v);
  const out: Partial<CvLabels> = {};
  for (const k of LABEL_KEYS) if (typeof o[k] === "string") out[k] = o[k] as string;
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Coerce anything (stored JSON, a pasted export) into a valid EditableCv, or
 *  null if it clearly isn't one. Missing / wrong-typed fields become blanks. */
export function coerceEditable(input: unknown): EditableCv | null {
  const o = asObj(input);
  if (!o.personalInfo || typeof o.personalInfo !== "object") return null;
  const pi = asObj(o.personalInfo);

  const toGroup = (g: unknown): EditableGroup => {
    const go = asObj(g);
    return { label: asStr(go.label), items: asStrArr(go.items) };
  };

  const edu = asObj(o.education);

  return {
    personalInfo: { name: asStr(pi.name), title: asStr(pi.title) },
    contactInfo: (Array.isArray(o.contactInfo) ? o.contactInfo : []).map((c): EditableContact => {
      const co = asObj(c);
      const icon = co.icon;
      return {
        icon: (typeof icon === "string" && (CONTACT_ICON_ORDER as string[]).includes(icon)
          ? icon
          : "link") as ContactIconKey,
        text: asStr(co.text),
        href: asStr(co.href),
        external: asBool(co.external),
      };
    }),
    primarySkills: (Array.isArray(o.primarySkills) ? o.primarySkills : []).map(toGroup),
    secondarySkills: (Array.isArray(o.secondarySkills) ? o.secondarySkills : []).map(toGroup),
    education: {
      degree: asStr(edu.degree),
      school: asStr(edu.school),
      period: asStr(edu.period),
      internshipLabel: asStr(edu.internshipLabel),
      internship: asStr(edu.internship),
    },
    languages: (Array.isArray(o.languages) ? o.languages : []).map((l): EditableLanguage => {
      const lo = asObj(l);
      return { language: asStr(lo.language), level: asStr(lo.level) };
    }),
    summary: asStrArr(o.summary),
    highlights: (Array.isArray(o.highlights) ? o.highlights : []).map((h): EditableHighlight => {
      const ho = asObj(h);
      return { title: asStr(ho.title), detail: asStr(ho.detail) };
    }),
    experience: (Array.isArray(o.experience) ? o.experience : []).map((j): EditableJob => {
      const jo = asObj(j);
      return {
        role: asStr(jo.role),
        company: asStr(jo.company),
        period: asStr(jo.period),
        location: asStr(jo.location),
        current: asBool(jo.current),
        bullets: asStrArr(jo.bullets),
      };
    }),
    ...(parseLabels(o.labels) ? { labels: parseLabels(o.labels) } : {}),
  };
}
