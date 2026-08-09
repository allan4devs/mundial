import { revalidatePath } from "next/cache";
import { MongoClient } from "mongodb";
import WifiClient, { type WifiEntry } from "./WifiClient";

export const dynamic = "force-dynamic";

const MONGODB_URI = process.env.MONGODB_URI ?? "";
const MONGODB_DB = process.env.MONGODB_DB ?? "wifiPasswords";

let cachedClient: MongoClient | null = null;

async function getMongoClient() {
  if (!cachedClient) {
    if (!MONGODB_URI) {
      throw new Error("Missing MONGODB_URI environment variable");
    }

    cachedClient = new MongoClient(MONGODB_URI, {
      appName: "wifi-password-sharer",
    });

    await cachedClient.connect();
  }

  return cachedClient;
}

function normalizeCategory(value: FormDataEntryValue | null) {
  const category = String(value ?? "other").trim().toLowerCase();
  const allowed = ["home", "cafe", "restaurant", "store", "office", "hotel", "public", "other"];

  return allowed.includes(category) ? category : "other";
}

function asIsoDate(value: unknown) {
  const date = value ? new Date(String(value)) : new Date();

  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

async function getWifiEntries(): Promise<WifiEntry[]> {
  if (!MONGODB_URI) {
    return [];
  }

  const client = await getMongoClient();
  const collection = client.db(MONGODB_DB).collection("wifi_passwords");

  const entries = await collection
    .find({ consentConfirmed: { $ne: false } })
    .sort({ createdAt: -1 })
    .limit(120)
    .toArray();

  return entries.map((entry) => ({
    id: entry._id.toString(),
    ssid: String(entry.ssid ?? ""),
    password: String(entry.password ?? ""),
    notes: String(entry.notes ?? ""),
    category: String(entry.category ?? "other"),
    placeName: String(entry.placeName ?? entry.establishment ?? ""),
    area: String(entry.area ?? "Ciudad Quesada"),
    sharedBy: String(entry.sharedBy ?? ""),
    consentConfirmed: Boolean(entry.consentConfirmed ?? true),
    createdAt: asIsoDate(entry.createdAt),
  }));
}

async function createWifiEntry(formData: FormData) {
  "use server";

  const ssid = String(formData.get("ssid") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const placeName = String(formData.get("placeName") ?? "").trim();
  const area = String(formData.get("area") ?? "Ciudad Quesada").trim();
  const sharedBy = String(formData.get("sharedBy") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const category = normalizeCategory(formData.get("category"));
  const consentConfirmed = formData.get("consentConfirmed") === "on";

  if (!ssid || !password || !consentConfirmed) {
    return;
  }

  const client = await getMongoClient();
  const collection = client.db(MONGODB_DB).collection("wifi_passwords");

  await collection.insertOne({
    ssid,
    password,
    placeName,
    area,
    sharedBy,
    notes,
    category,
    consentConfirmed,
    createdAt: new Date(),
  });

  revalidatePath("/wifi");
}

export default async function WifiPage() {
  const wifiEntries = await getWifiEntries();

  return (
    <WifiClient
      entries={wifiEntries}
      isDatabaseConfigured={Boolean(MONGODB_URI)}
      createWifiEntry={createWifiEntry}
    />
  );
}
