// ─────────────────────────────────────────────────────────────
// Persistence + the Pro unlock gate.
//
// The builder autosaves to localStorage. Pro is unlocked with an
// activation code the operator hands out after a SINPE Móvil / transfer
// is confirmed (see /crear-cv/precios). The check is intentionally
// lightweight — it gates the UI, it is not DRM.
// ─────────────────────────────────────────────────────────────

import type { BuilderState, ResumeData, ResumeSettings } from "./types";
import { ACCENTS, emptyResume, uid } from "./sample";

export const STORAGE_KEY = "lva:crear-cv:v1";
export const LICENSE_KEY = "lva:crear-cv:license";

// ── builder state ───────────────────────────────────────────

export function loadState(): BuilderState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveState(state: BuilderState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode — skip; export still works */
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const bool = (v: unknown): boolean => v === true;

/** Accept partial / older / hand-edited payloads without throwing. */
export function normalizeState(input: unknown): BuilderState {
  const raw = (input ?? {}) as Partial<BuilderState>;
  const d = (raw.data ?? {}) as Partial<ResumeData>;
  const s = (raw.settings ?? {}) as Partial<ResumeSettings>;
  const c = raw.cover ?? {};

  const data: ResumeData = {
    fullName: str(d.fullName),
    headline: str(d.headline),
    email: str(d.email),
    phone: str(d.phone),
    location: str(d.location),
    website: str(d.website),
    links: arr<ResumeData["links"][number]>(d.links).map((l) => ({
      id: str(l?.id) || uid("ln"),
      label: str(l?.label),
      url: str(l?.url),
    })),
    summary: str(d.summary),
    experience: arr<ResumeData["experience"][number]>(d.experience).map((e) => ({
      id: str(e?.id) || uid("exp"),
      role: str(e?.role),
      company: str(e?.company),
      location: str(e?.location),
      start: str(e?.start),
      end: str(e?.end),
      current: bool(e?.current),
      bullets: arr<string>(e?.bullets).map((b) => str(b)),
    })),
    education: arr<ResumeData["education"][number]>(d.education).map((e) => ({
      id: str(e?.id) || uid("edu"),
      degree: str(e?.degree),
      school: str(e?.school),
      location: str(e?.location),
      start: str(e?.start),
      end: str(e?.end),
      note: str(e?.note),
    })),
    skills: arr<ResumeData["skills"][number]>(d.skills).map((g) => ({
      id: str(g?.id) || uid("sk"),
      label: str(g?.label),
      items: arr<string>(g?.items).map((i) => str(i)),
    })),
    languages: arr<ResumeData["languages"][number]>(d.languages).map((l) => ({
      id: str(l?.id) || uid("lng"),
      name: str(l?.name),
      level: str(l?.level),
    })),
    projects: arr<ResumeData["projects"][number]>(d.projects).map((p) => ({
      id: str(p?.id) || uid("prj"),
      name: str(p?.name),
      description: str(p?.description),
      url: str(p?.url),
    })),
    references: str(d.references),
  };

  const template = (["clasico", "moderno", "minimal", "ejecutivo", "compacto"] as const).includes(
    s.template as never,
  )
    ? (s.template as ResumeSettings["template"])
    : "clasico";

  const settings: ResumeSettings = {
    template,
    accent: /^#[0-9a-fA-F]{6}$/.test(str(s.accent)) ? str(s.accent) : ACCENTS[0],
    cvLang: s.cvLang === "en" ? "en" : "es",
    fontScale: clampNum(s.fontScale, 0.9, 1.15, 1),
    paper: s.paper === "a4" ? "a4" : "letter",
  };

  return {
    data,
    settings,
    cover: {
      company: str((c as Record<string, unknown>).company),
      role: str((c as Record<string, unknown>).role),
      recipient: str((c as Record<string, unknown>).recipient),
      channel: str((c as Record<string, unknown>).channel),
      hook: str((c as Record<string, unknown>).hook),
      override:
        typeof (c as Record<string, unknown>).override === "string"
          ? ((c as Record<string, unknown>).override as string)
          : null,
    },
  };
}

function clampNum(v: unknown, lo: number, hi: number, fallback: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? v : fallback;
  return Math.min(hi, Math.max(lo, n));
}

export { emptyResume };

// ── Pro unlock ──────────────────────────────────────────────

/**
 * Activation codes look like `CVXPRO-XXXX` (any suffix ≥ 3 chars).
 * The operator generates one per confirmed payment — e.g. buyer's phone
 * last 4 digits: `CVXPRO-4590`. Case / dashes / spaces are ignored.
 */
export function isValidLicense(code: string): boolean {
  const norm = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^CVXPRO[A-Z0-9]{3,}$/.test(norm);
}

export function loadLicense(): { code: string; activatedAt: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LICENSE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { code?: string; activatedAt?: string };
    if (parsed.code && isValidLicense(parsed.code)) {
      return { code: parsed.code, activatedAt: parsed.activatedAt ?? "" };
    }
    return null;
  } catch {
    return null;
  }
}

export function activateLicense(code: string): boolean {
  if (!isValidLicense(code)) return false;
  try {
    window.localStorage.setItem(
      LICENSE_KEY,
      JSON.stringify({ code: code.trim(), activatedAt: new Date().toISOString() }),
    );
  } catch {
    /* ignore — still returns true so the session unlocks */
  }
  return true;
}

export function deactivateLicense(): void {
  try {
    window.localStorage.removeItem(LICENSE_KEY);
  } catch {
    /* ignore */
  }
}

// ── file helpers ────────────────────────────────────────────

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "cv"
  );
}

export function downloadBlob(data: BlobPart, filename: string, type: string): void {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function exportStateJSON(state: BuilderState): void {
  const name = state.data.fullName || "cv";
  downloadBlob(
    JSON.stringify(state, null, 2),
    `${slugify(name)}-cv-express.json`,
    "application/json",
  );
}

export function readStateFromFile(file: File): Promise<BuilderState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read-failed"));
    reader.onload = () => {
      try {
        resolve(normalizeState(JSON.parse(String(reader.result))));
      } catch {
        reject(new Error("parse-failed"));
      }
    };
    reader.readAsText(file);
  });
}
