import { COLLECTIONS } from "@/lib/constants/db";
import { getDb } from "@/lib/helpers/mongodb";

export interface HeroSloganLog {
  es: string;
  en: string;
  model: string;
  prompt: string;
  rawResponse: string;
  createdAt: Date;
}

async function getHeroSloganCollection() {
  const db = await getDb();
  return db.collection<HeroSloganLog>(COLLECTIONS.HERO_SLOGANS);
}

export async function createHeroSloganLog(log: HeroSloganLog) {
  const collection = await getHeroSloganCollection();
  return collection.insertOne(log);
}

export async function listHeroSloganLogs(limit = 200) {
  const collection = await getHeroSloganCollection();
  const docs = await collection
    .find({ model: /^(?:claude|gpt-)/i })
    .sort({ createdAt: -1 })
    .limit(limit * 3)
    .toArray();

  const seen = new Set<string>();

  return docs
    .filter((doc) => {
      const key = `${(doc.es ?? "").trim().toLowerCase()}|${(doc.en ?? "").trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map((doc) => ({
      _id: doc._id.toString(),
      es: doc.es,
      en: doc.en,
      model: doc.model,
      prompt: doc.prompt,
      rawResponse: doc.rawResponse,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
    }));
}
