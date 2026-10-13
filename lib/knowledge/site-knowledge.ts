import type { Collection, Db } from "mongodb";
import { COLLECTIONS } from "@/lib/constants/db";
import { SITE_FAQS } from "@/lib/site-faqs";
import { TOUR_CONTENT } from "@/lib/tour-content";
import { translations } from "@/lib/translations";

const SITE_KNOWLEDGE_SEED_VERSION = 1;

export type SiteKnowledgeDocument = {
  id: string;
  scope: "site-copy" | "tour-content" | "site-faq";
  locale: "es" | "en" | "both";
  title: string;
  content: string;
  data: unknown;
  keywords: string[];
  source: string;
  priority: number;
  active: boolean;
  seedVersion: number;
  updatedAt: Date;
};

function collection(db: Db): Collection<SiteKnowledgeDocument> {
  return db.collection<SiteKnowledgeDocument>(COLLECTIONS.SITE_KNOWLEDGE);
}

export function normalizeKnowledgeTokens(value: string) {
  return [...new Set(value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3))];
}

function stringsFrom(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsFrom);
  if (value && typeof value === "object") return Object.values(value).flatMap(stringsFrom);
  return [];
}

function seedDocuments(): Omit<SiteKnowledgeDocument, "updatedAt">[] {
  const copy = (["es", "en"] as const).flatMap((locale) =>
    Object.entries(translations[locale]).map(([section, data]) => {
      const text = stringsFrom(data).join(" ");
      return {
        id: `copy:${locale}:${section}`,
        scope: "site-copy" as const,
        locale,
        title: `LVA ${section}`,
        content: text,
        data,
        keywords: normalizeKnowledgeTokens(`${section} ${text}`),
        source: `lib/translations.ts#${locale}.${section}`,
        priority: section === "hero" ? 90 : 50,
        active: true,
        seedVersion: SITE_KNOWLEDGE_SEED_VERSION,
      };
    }),
  );

  const tours = Object.entries(TOUR_CONTENT).map(([slug, data]) => {
    const text = stringsFrom(data).join(" ");
    return {
      id: `tour:${slug}`,
      scope: "tour-content" as const,
      locale: "both" as const,
      title: data.tagline,
      content: text,
      data,
      keywords: normalizeKnowledgeTokens(`${slug} ${text}`),
      source: `lib/tour-content.ts#${slug}`,
      priority: 100,
      active: true,
      seedVersion: SITE_KNOWLEDGE_SEED_VERSION,
    };
  });

  const faqs = (["es", "en"] as const).flatMap((locale) =>
    SITE_FAQS[locale].map((faq, index) => ({
      id: `faq:${locale}:${index + 1}`,
      scope: "site-faq" as const,
      locale,
      title: faq.question,
      content: faq.answer,
      data: faq,
      keywords: normalizeKnowledgeTokens(`${faq.question} ${faq.answer}`),
      source: "lib/site-faqs.ts",
      priority: 110,
      active: true,
      seedVersion: SITE_KNOWLEDGE_SEED_VERSION,
    })),
  );

  return [...copy, ...tours, ...faqs];
}

let setupPromise: Promise<void> | null = null;

export async function setupSiteKnowledge(db: Db) {
  if (!setupPromise) {
    setupPromise = (async () => {
      const docs = seedDocuments();
      await Promise.all([
        collection(db).createIndex({ id: 1 }, { unique: true, name: "unique_site_knowledge_id" }),
        collection(db).createIndex(
          { active: 1, keywords: 1, priority: -1 },
          { name: "active_site_knowledge_keywords" },
        ),
        collection(db).createIndex(
          { scope: 1, locale: 1, active: 1 },
          { name: "site_knowledge_scope_locale" },
        ),
      ]);
      const now = new Date();
      const existing = await collection(db)
        .find({ id: { $in: docs.map((doc) => doc.id) } })
        .project<Pick<SiteKnowledgeDocument, "id" | "seedVersion">>({ id: 1, seedVersion: 1 })
        .toArray();
      const versions = new Map(existing.map((doc) => [doc.id, doc.seedVersion ?? 0]));
      const pending = docs.filter((doc) => (versions.get(doc.id) ?? 0) < SITE_KNOWLEDGE_SEED_VERSION);
      if (pending.length > 0) {
        await collection(db).bulkWrite(pending.map((doc) => ({
          updateOne: {
            filter: { id: doc.id },
            update: { $set: { ...doc, updatedAt: now } },
            upsert: true,
          },
        })), { ordered: false });
      }
    })().catch((error) => {
      setupPromise = null;
      throw error;
    });
  }
  await setupPromise;
}

export async function searchSiteKnowledge(db: Db, query: string, limit = 8) {
  const tokens = normalizeKnowledgeTokens(query);
  if (tokens.length === 0) return [];
  const candidates = await collection(db)
    .find({ active: true, keywords: { $in: tokens } })
    .sort({ priority: -1 })
    .limit(Math.max(limit * 4, 20))
    .toArray();
  return candidates
    .map((doc) => ({
      doc,
      score: doc.keywords.reduce((total, keyword) => total + (tokens.includes(keyword) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score || b.doc.priority - a.doc.priority)
    .slice(0, limit)
    .map(({ doc }) => doc);
}
