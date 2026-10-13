import { buildStandardPackagesFromPrice, fallbackPackagesForTour, normalizeTourPackages } from "@/lib/tour-packages";
import type { TourPackageOption, TourSummary } from "@/lib/types/index";

export const CRC_PER_USD = 525;
export const DEFAULT_GENERAL_ENTRY_USD = 30;
export const DEFAULT_MAIN_TOUR_SLUG = "avistamiento-aves-norteno";
export const DEFAULT_MAIN_TOUR_PRICE_CRC = 24990;

const GENERAL_ENTRY_KEYS = new Set([
  "entrada-general",
  "entrada general",
  "general-entry",
  "general entry",
]);

const LEGACY_PACKAGE_IDS: Record<string, string> = {
  basic: "essential-package",
  "full-day": "lunch-package",
  full_day: "lunch-package",
  private: "private-package",
  standard: "essential-package",
};

export function normalizePackageLookup(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function resolveLegacyPackageId(value: unknown): string {
  const normalized = normalizePackageLookup(value);
  return LEGACY_PACKAGE_IDS[normalized] || normalized;
}

export function isGeneralEntrySelection(value: unknown): boolean {
  return GENERAL_ENTRY_KEYS.has(normalizePackageLookup(value));
}

export function buildGeneralEntryPackage(
  tour: Pick<TourSummary, "priceCRC" | "descriptionEn" | "descriptionEs"> | Record<string, unknown> | null | undefined,
  tourSlug?: string,
): TourPackageOption {
  const dbPriceCRC = Number(tour?.priceCRC);
  const priceCRC = Number.isFinite(dbPriceCRC) && dbPriceCRC > 0
    ? dbPriceCRC
    : tourSlug === DEFAULT_MAIN_TOUR_SLUG
      ? DEFAULT_MAIN_TOUR_PRICE_CRC
      : null;

  return {
    id: "general-entry",
    name: "General Entry",
    nameEs: "Entrada General",
    price: priceCRC ? Math.round(priceCRC / CRC_PER_USD) : DEFAULT_GENERAL_ENTRY_USD,
    priceCRC,
    descriptionEn: typeof tour?.descriptionEn === "string" ? tour.descriptionEn : "",
    descriptionEs: typeof tour?.descriptionEs === "string" ? tour.descriptionEs : "",
    groupTour: true,
    departureTimes: ["08:00", "09:00", "10:00"],
  };
}

export function findPackageByLegacyOrCurrentId(
  packages: readonly TourPackageOption[],
  input: string | undefined,
): TourPackageOption | null {
  if (!input || packages.length === 0) return null;

  const normalizedInput = normalizePackageLookup(input);
  const legacyMapped = resolveLegacyPackageId(input);

  return packages.find((pkg) => {
    const candidates = [
      pkg.id,
      pkg.name,
      pkg.nameEs,
      (pkg as TourPackageOption & { _id?: { toString?: () => string } })._id?.toString?.(),
    ]
      .filter(Boolean)
      .map(normalizePackageLookup);

    return candidates.includes(normalizedInput) || candidates.includes(normalizePackageLookup(legacyMapped));
  }) ?? null;
}

export function getAvailablePackagesForTour(
  tour: Pick<TourSummary, "packages" | "slug"> | Record<string, unknown> | null | undefined,
  tourSlug?: string,
): TourPackageOption[] {
  const packages = "packages" in (tour ?? {}) ? (tour as TourSummary).packages : undefined;
  const dbPackages = normalizeTourPackages(packages);
  if (dbPackages.length > 0) return dbPackages;

  const fallback = fallbackPackagesForTour(tourSlug);
  if (fallback.length > 0) return fallback;

  const priceCRC = Number((tour as { priceCRC?: unknown } | null | undefined)?.priceCRC);
  return buildStandardPackagesFromPrice(Number.isFinite(priceCRC) ? priceCRC : null);
}

export function getPackageLabel(
  tourPackage: string | undefined,
  selectedPackage: TourPackageOption,
  language: string,
): string {
  if (tourPackage === "basic") return "Paquete Basico";
  if (tourPackage === "full-day") return "Dia Completo con Almuerzo";
  if (tourPackage === "private") return "Tour Privado";

  return language === "en"
    ? selectedPackage.name
    : selectedPackage.nameEs || selectedPackage.name;
}

export function resolveReservationPackage({
  tour,
  tourSlug,
  packageId,
  tourPackage,
}: {
  tour: Record<string, unknown> | TourSummary | null | undefined;
  tourSlug?: string;
  packageId?: string;
  tourPackage?: string;
}): TourPackageOption | null {
  const packageInput = packageId || tourPackage;
  if (isGeneralEntrySelection(packageInput)) {
    return buildGeneralEntryPackage(tour, tourSlug);
  }

  return findPackageByLegacyOrCurrentId(getAvailablePackagesForTour(tour, tourSlug), packageInput);
}
