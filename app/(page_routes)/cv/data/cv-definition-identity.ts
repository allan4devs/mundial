// ─────────────────────────────────────────────────────────────
// Identity — name, contact block, and languages, shared by every variant.
//
// Only two things ever change between variants:
//   • the location line in the contact block  → LOCATION_LINE keys
//   • the English proficiency wording          → ENGLISH_LEVEL keys
// Everything else (name, phone, email, links) is one source of truth here.
//
// Variants build their blocks from the helpers:
//     export const personalInfo = { name: NAME, title: "…" };
//     export const contactInfo  = buildContactInfo("latamAmericas");
//     export const languages    = buildLanguages("full");
// ─────────────────────────────────────────────────────────────

import { Github, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import type { ContactEntry } from "../types";

export const NAME = "Allan José Rojas Durán";
export const PHONE = "+506 7225 2296";
export const EMAIL = "allan4devs@gmail.com";
export const LINKEDIN_HANDLE = "linkedin.com/in/aallanrd";
export const LINKEDIN_URL = "https://www.linkedin.com/in/aallanrd/";
export const GITHUB_HANDLE = "github.com/emeraldcr";
export const GITHUB_URL = "https://github.com/emeraldcr";

/** The sidebar contact block's first line. Every variant picks exactly one. */
export const LOCATION_LINE = {
  latamAmericas: "Alajuela, Costa Rica · Remote (LATAM / Americas)",
  americas: "Alajuela, Costa Rica · Remote (Americas)",
  latam: "Alajuela, Costa Rica · Remote (LATAM)",
  remote: "Alajuela, Costa Rica · Remote",
} as const;
export type LocationKey = keyof typeof LOCATION_LINE;

/** English proficiency line — two house styles are currently in use. */
export const ENGLISH_LEVEL = {
  full: "Professional Working Proficiency · C1",
  short: "Professional Working · C1",
} as const;
export type EnglishKey = keyof typeof ENGLISH_LEVEL;

export function buildContactInfo(location: LocationKey = "latamAmericas"): ContactEntry[] {
  return [
    { icon: MapPin, text: LOCATION_LINE[location] },
    { icon: Phone, text: PHONE, href: `tel:${PHONE.replace(/\s+/g, "")}` },
    { icon: Mail, text: EMAIL, href: `mailto:${EMAIL}` },
    { icon: Linkedin, text: LINKEDIN_HANDLE, href: LINKEDIN_URL, external: true },
    { icon: Github, text: GITHUB_HANDLE, href: GITHUB_URL, external: true },
  ];
}

export function buildLanguages(english: EnglishKey = "full"): readonly { language: string; level: string }[] {
  return [
    { language: "Spanish", level: "Native" },
    { language: "English", level: ENGLISH_LEVEL[english] },
  ];
}
