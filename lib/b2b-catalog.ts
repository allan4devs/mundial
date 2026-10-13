import { getDb } from "@/lib/helpers/mongodb";
import { B2B_TOURS } from "@/lib/b2b-tours";
import { getB2BSettings, PackageConfig } from "@/lib/models/b2b-settings";
import { COLLECTIONS } from "@/lib/constants/db";
import { DEFAULT_IVA_RATE, B2B_PACKAGE_MULTIPLIERS } from "@/lib/constants/business";

export type B2BTourWithPackages = {
  id: string;
  name: string;
  description: string;
  duration: string;
  retailPricePerPax: number;
  currency: string;
  minPax: number;
  maxPax: number;
  includes: string[];
  location: string;
  imageUrl?: string;
  packages: PackageConfig[];
};

export async function getB2BCatalog(): Promise<{ tours: B2BTourWithPackages[]; ivaRate: number }> {
  let rawTours: B2BTourWithPackages[] = [];

  try {
    const db = await getDb();
    const docs = await db
      .collection(COLLECTIONS.TOURS)
      .find({ type: { $in: ["b2b", "both"] }, isActive: { $ne: false } })
      .sort({ isFeatured: -1 })
      .toArray();

    if (docs.length > 0) {
      rawTours = docs.map((t) => ({
        id: t.slug ?? t._id.toString(),
        name: t.titleEs ?? t.name ?? "",
        description: t.descriptionEs ?? t.description ?? "",
        duration: t.duration ?? "",
        retailPricePerPax: t.retailPricePerPax ?? t.priceCRC ?? 0,
        currency: t.currency ?? "CRC",
        minPax: t.minPax ?? 1,
        maxPax: t.maxPax ?? 20,
        includes: t.includes ?? [],
        location: t.location ?? "",
        imageUrl: t.imageUrl,
        packages: [],
      }));
    }
  } catch (err) {
    console.error("Failed to load B2B tours from MongoDB:", err);
  }

  if (rawTours.length === 0) {
    rawTours = B2B_TOURS.map((t) => ({ ...t, packages: [] }));
  }

  const settings = await getB2BSettings();
  const ivaRate = settings?.ivaRate ?? DEFAULT_IVA_RATE;
  const overrides = new Map((settings?.tourPricing ?? []).map((row) => [row.tourId, row.packages]));

  const tours = rawTours.map((tour) => {
    const configuredPackages = overrides.get(tour.id);
    const defaultPackages: PackageConfig[] = [
      { id: "regular", name: "Regular", priceCRC: tour.retailPricePerPax },
      { id: "premium", name: "Premium", priceCRC: Math.round(tour.retailPricePerPax * B2B_PACKAGE_MULTIPLIERS.PREMIUM) },
      { id: "vip", name: "VIP", priceCRC: Math.round(tour.retailPricePerPax * B2B_PACKAGE_MULTIPLIERS.VIP) },
    ];

    return {
      ...tour,
      packages: configuredPackages && configuredPackages.length > 0 ? configuredPackages : defaultPackages,
      retailPricePerPax:
        configuredPackages && configuredPackages.length > 0
          ? configuredPackages[0].priceCRC
          : tour.retailPricePerPax,
    };
  });

  return { tours, ivaRate };
}
