/**
 * The sound registry, in Mongo.
 *
 * One document per style. Picking "rock" fetches that document and every row's
 * selector is repopulated from it - so adding a sound, retuning an amplifier or
 * changing an EQ curve is a database edit, not a deploy. The seed below is what
 * the collection is created with the first time it is read.
 *
 * `normalizeStylePack` is deliberately forgiving: these documents are meant to be
 * edited by hand, and a typo should cost one clamped number, not the whole style.
 */

import type { Collection } from "mongodb";

import { COLLECTIONS } from "@/lib/constants/db";
import { getDb } from "@/lib/helpers/mongodb";
import {
  MAX_BPM,
  MIN_BPM,
  SCALES,
  STYLES,
  TRACK_KINDS,
  VOICE_IDS,
  type ScaleName,
  type Sound,
  type Style,
  type StylePack,
  type TrackKind,
  type VoiceId,
} from "./types";

/** Compact constructor so each seeded sound reads as one line. */
function sound(
  id: string,
  kind: TrackKind,
  label: string,
  voice: VoiceId,
  transpose: number,
  config: Record<string, number>,
  [drive, level]: [number, number],
  [low, mid, high]: [number, number, number],
): Sound {
  return { id, kind, label, voice, transpose, config, amp: { drive, level }, eq: { low, mid, high } };
}

const SEED: StylePack[] = [
  {
    style: "groovy",
    label: "Groovy",
    root: 45,
    scale: "minor",
    bpm: 100,
    sounds: [
      sound("wah-lead", "guitarLead", "Wah lead", "pluck", 24, { detune: 7, cutoff: 3200, decay: 0.34 }, [0.35, 0.8], [-3, 7, 2]),
      sound("clean-funk", "guitarLead", "Clean funk", "pluck", 24, { detune: 4, cutoff: 4200, decay: 0.22 }, [0.05, 0.85], [-4, 0, 5]),
      sound("finger-bass", "bass", "Finger bass", "sub", 0, { edge: 0.14, cutoff: 260, decay: 0.32 }, [0.1, 0.95], [5, -1, -6]),
      sound("envelope-bass", "bass", "Envelope bass", "sub", 0, { edge: 0.5, cutoff: 780, decay: 0.2 }, [0.3, 0.9], [3, 3, -2]),
      sound("tight-kit", "drums", "Tight kit", "kit", 0, { snareAt: 0.3, hatAt: 0.62, tune: 1.15 }, [0.15, 0.9], [1, 0, 4]),
      sound("room-kit", "drums", "Room kit", "kit", 0, { snareAt: 0.36, hatAt: 0.7, tune: 0.95 }, [0.25, 0.85], [5, -2, 1]),
      sound("chank-stabs", "guitarFill", "Chank stabs", "stab", 12, { cutoff: 2100, decay: 0.1, strum: 0.008 }, [0.2, 0.7], [-6, 4, 3]),
      sound("muted-chops", "guitarFill", "Muted chops", "stab", 12, { cutoff: 1500, decay: 0.07, strum: 0.005 }, [0.35, 0.65], [-8, 5, 0]),
      sound("clav-pad", "synth", "Clav pad", "pad", 12, { spread: 7, cutoff: 2600, release: 0.25 }, [0.2, 0.7], [-4, 3, 2]),
      sound("rhodes-pad", "synth", "Rhodes pad", "pad", 12, { spread: 14, cutoff: 1700, release: 0.7 }, [0.05, 0.75], [2, 0, -2]),
    ],
  },
  {
    style: "rock",
    label: "Rock",
    root: 40,
    scale: "minor",
    bpm: 128,
    sounds: [
      sound("crunch-stack", "guitarLead", "Crunch stack", "pluck", 24, { detune: 12, cutoff: 2600, decay: 0.55 }, [0.7, 0.75], [4, -4, 4]),
      sound("fuzz-lead", "guitarLead", "Fuzz lead", "pluck", 24, { detune: 18, cutoff: 1900, decay: 0.75 }, [0.95, 0.65], [2, 2, 1]),
      sound("pick-bass", "bass", "Pick bass", "sub", 0, { edge: 0.55, cutoff: 900, decay: 0.28 }, [0.4, 0.9], [4, 2, 0]),
      sound("growl-bass", "bass", "Growl bass", "sub", 0, { edge: 0.7, cutoff: 620, decay: 0.36 }, [0.65, 0.85], [6, 1, -3]),
      sound("big-kit", "drums", "Big kit", "kit", 0, { snareAt: 0.4, hatAt: 0.72, tune: 0.85 }, [0.3, 0.95], [6, -1, 2]),
      sound("punch-kit", "drums", "Punch kit", "kit", 0, { snareAt: 0.33, hatAt: 0.66, tune: 1 }, [0.45, 0.9], [2, 3, 3]),
      sound("power-chords", "guitarFill", "Power chords", "stab", 12, { cutoff: 2400, decay: 0.42, strum: 0.014 }, [0.75, 0.6], [3, -3, 2]),
      sound("dry-stabs", "guitarFill", "Dry stabs", "stab", 12, { cutoff: 1800, decay: 0.12, strum: 0.006 }, [0.5, 0.65], [-2, 2, 1]),
      sound("organ-pad", "synth", "Organ pad", "pad", 12, { spread: 4, cutoff: 2000, release: 0.8 }, [0.35, 0.6], [3, 2, -1]),
      sound("string-pad", "synth", "String pad", "pad", 24, { spread: 24, cutoff: 1500, release: 1.1 }, [0.05, 0.55], [0, -2, 2]),
    ],
  },
  {
    style: "pop",
    label: "Pop",
    root: 48,
    scale: "major",
    bpm: 112,
    sounds: [
      sound("clean-sparkle", "guitarLead", "Clean sparkle", "pluck", 24, { detune: 5, cutoff: 5200, decay: 0.3 }, [0.05, 0.8], [-5, -1, 8]),
      sound("chorus-lead", "guitarLead", "Chorus lead", "pluck", 24, { detune: 22, cutoff: 3800, decay: 0.45 }, [0.15, 0.75], [-2, 1, 5]),
      sound("round-bass", "bass", "Round bass", "sub", 0, { edge: 0.08, cutoff: 220, decay: 0.3 }, [0.05, 0.95], [6, -2, -8]),
      sound("pluck-bass", "bass", "Pluck bass", "sub", 0, { edge: 0.3, cutoff: 500, decay: 0.14 }, [0.2, 0.9], [4, 1, -4]),
      sound("pop-kit", "drums", "Pop kit", "kit", 0, { snareAt: 0.28, hatAt: 0.58, tune: 1.1 }, [0.1, 0.9], [3, 0, 6]),
      sound("clap-kit", "drums", "Clap kit", "kit", 0, { snareAt: 0.42, hatAt: 0.68, tune: 1.25 }, [0.2, 0.85], [0, 4, 5]),
      sound("bright-stabs", "guitarFill", "Bright stabs", "stab", 24, { cutoff: 3600, decay: 0.16, strum: 0.01 }, [0.05, 0.6], [-8, 0, 6]),
      sound("soft-chops", "guitarFill", "Soft chops", "stab", 12, { cutoff: 2200, decay: 0.1, strum: 0.007 }, [0.1, 0.55], [-5, 1, 3]),
      sound("wide-pad", "synth", "Wide pad", "pad", 12, { spread: 20, cutoff: 2400, release: 0.9 }, [0.05, 0.7], [1, -2, 4]),
      sound("pluck-synth", "synth", "Pluck synth", "pad", 24, { spread: 6, cutoff: 4400, release: 0.2 }, [0.1, 0.7], [-4, 0, 7]),
    ],
  },
];

let ready: Promise<void> | null = null;

async function packs(): Promise<Collection<StylePack>> {
  const db = await getDb();
  const collection = db.collection<StylePack>(COLLECTIONS.SONG_BUILDER_STYLES);
  ready ??= seed(collection).catch((error) => {
    ready = null;
    throw error;
  });
  await ready;
  return collection;
}

/** Creates the collection from `SEED` the first time it is read, then leaves it alone. */
async function seed(collection: Collection<StylePack>) {
  await collection.createIndex({ style: 1 }, { unique: true, name: "style_unique" });
  if ((await collection.countDocuments({})) > 0) return;
  await collection.insertMany(SEED.map((pack) => ({ ...pack })));
}

/** The pack for one style, or `null` if the database has no document for it. */
export async function getStylePack(style: Style): Promise<StylePack | null> {
  const doc = await (await packs()).findOne({ style });
  return doc ? normalizeStylePack(doc, style) : null;
}

export function isStyle(value: unknown): value is Style {
  return typeof value === "string" && STYLES.includes(value as Style);
}

/**
 * Coerces a hand-edited document into something the studio can play. Every row
 * is guaranteed at least one sound, so a selector is never empty.
 */
function normalizeStylePack(doc: Record<string, unknown>, style: Style): StylePack {
  const fallback = SEED.find((pack) => pack.style === style)!;
  const sounds = Array.isArray(doc.sounds)
    ? doc.sounds.map((entry) => normalizeSound(entry)).filter((entry): entry is Sound => entry !== null)
    : [];

  return {
    style,
    label: text(doc.label, fallback.label),
    root: int(doc.root, fallback.root, 24, 72),
    scale: SCALES.includes(doc.scale as ScaleName) ? (doc.scale as ScaleName) : fallback.scale,
    bpm: int(doc.bpm, fallback.bpm, MIN_BPM, MAX_BPM),
    // A row whose sounds were all dropped falls back to the seeded ones for that row.
    sounds: TRACK_KINDS.flatMap((kind) => {
      const forKind = sounds.filter((entry) => entry.kind === kind);
      return forKind.length ? forKind : fallback.sounds.filter((entry) => entry.kind === kind);
    }),
  };
}

function normalizeSound(raw: unknown): Sound | null {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Record<string, unknown>;
  const kind = entry.kind;
  const voice = entry.voice;
  if (!TRACK_KINDS.includes(kind as TrackKind) || !VOICE_IDS.includes(voice as VoiceId)) return null;
  if (typeof entry.id !== "string" || !entry.id) return null;

  const amp = (entry.amp ?? {}) as Record<string, unknown>;
  const eq = (entry.eq ?? {}) as Record<string, unknown>;

  return {
    id: entry.id.slice(0, 40),
    kind: kind as TrackKind,
    label: text(entry.label, entry.id),
    voice: voice as VoiceId,
    transpose: int(entry.transpose, 0, -24, 36),
    config: numbers(entry.config),
    amp: { drive: num(amp.drive, 0.2, 0, 1), level: num(amp.level, 0.8, 0, 1) },
    eq: {
      low: num(eq.low, 0, -18, 18),
      mid: num(eq.mid, 0, -18, 18),
      high: num(eq.high, 0, -18, 18),
    },
  };
}

function numbers(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) out[key] = parsed;
  }
  return out;
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 60) : fallback;
}

function num(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function int(value: unknown, fallback: number, min: number, max: number) {
  return Math.round(num(value, fallback, min, max));
}
