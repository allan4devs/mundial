import { getDb } from "@/lib/helpers/mongodb";
import { companies as seedCompanies } from "@/app/(page_routes)/comp/company-data";
import type { CompanyCard } from "@/app/(page_routes)/comp/company-catalog";
import type { CompanyPreference } from "./types";

type CompanyRecord = CompanyCard & { _id: string };
type PreferenceRecord = CompanyPreference & { _id: string; ownerId: string; companyKey: string; updatedAt: Date };
export async function getCompanies(): Promise<CompanyCard[]> {
  const collection = (await getDb()).collection<CompanyRecord>("comp_companies");
  // Stable IDs make the initial import safe across concurrent requests and retries.
  const migrations = (await getDb()).collection<{ _id: string; completedAt: Date }>("comp_migrations");
  const migrationId = "catalog-v1";
  if (!await migrations.findOne({ _id: migrationId })) {
    await collection.bulkWrite(seedCompanies.map(company => ({ updateOne: {
      filter: { _id: company.key }, update: { $setOnInsert: company }, upsert: true,
    } })));
    await migrations.updateOne({ _id: migrationId }, { $set: { completedAt: new Date() } }, { upsert: true });
  }
  return collection.find({}, { projection: { _id: 0 } }).sort({ name: 1 }).toArray();
}
const preferences = async () => (await getDb()).collection<PreferenceRecord>("comp_preferences");
export async function getPreferences(ownerId: string): Promise<Record<string, CompanyPreference>> {
  const rows = await (await preferences()).find({ ownerId }).toArray();
  return Object.fromEntries(rows.map(row => [row.companyKey, { liked: row.liked, disliked: row.disliked, careersUrl: row.careersUrl }]));
}
export async function savePreference(ownerId: string, companyKey: string, change: CompanyPreference, importOnly = false) {
  const fields = { ...change, ...(change.liked ? { disliked: false } : change.disliked ? { liked: false } : {}), ownerId, companyKey, updatedAt: new Date() };
  await (await preferences()).updateOne({ _id: JSON.stringify([ownerId, companyKey]) }, importOnly ? { $setOnInsert: fields } : { $set: fields }, { upsert: true });
}
