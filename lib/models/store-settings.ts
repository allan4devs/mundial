import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";

export type StoreSettings = {
  _id: "default";
  shippingFeeUSD: number;
  freeShippingThresholdUSD: number;
  currency: "USD" | "CRC";
  whatsappPhone: string;
  updatedAt: Date;
};

const SETTINGS_KEY = "default";

const DEFAULT_SETTINGS: StoreSettings = {
  _id: SETTINGS_KEY,
  shippingFeeUSD: 12,
  freeShippingThresholdUSD: 75,
  currency: "USD",
  whatsappPhone: "50662332535",
  updatedAt: new Date(),
};

async function getSettingsCollection() {
  const db = await getDb();
  return db.collection<StoreSettings>(COLLECTIONS.STORE_SETTINGS);
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const col = await getSettingsCollection();
  const doc = await col.findOne({ _id: SETTINGS_KEY });
  if (doc) return doc;

  await col.updateOne(
    { _id: SETTINGS_KEY },
    { $setOnInsert: { ...DEFAULT_SETTINGS, updatedAt: new Date() } },
    { upsert: true },
  );

  return (await col.findOne({ _id: SETTINGS_KEY })) ?? DEFAULT_SETTINGS;
}

export async function upsertStoreSettings(
  input: Partial<Pick<StoreSettings, "shippingFeeUSD" | "freeShippingThresholdUSD" | "currency" | "whatsappPhone">>,
) {
  const col = await getSettingsCollection();
  const current = await getStoreSettings();

  await col.updateOne(
    { _id: SETTINGS_KEY },
    {
      $set: {
        shippingFeeUSD:
          typeof input.shippingFeeUSD === "number" && input.shippingFeeUSD >= 0
            ? input.shippingFeeUSD
            : current.shippingFeeUSD,
        freeShippingThresholdUSD:
          typeof input.freeShippingThresholdUSD === "number" && input.freeShippingThresholdUSD >= 0
            ? input.freeShippingThresholdUSD
            : current.freeShippingThresholdUSD ?? DEFAULT_SETTINGS.freeShippingThresholdUSD,
        currency: input.currency === "CRC" ? "CRC" : input.currency === "USD" ? "USD" : current.currency,
        whatsappPhone: String(input.whatsappPhone ?? current.whatsappPhone).trim() || current.whatsappPhone,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  return getStoreSettings();
}