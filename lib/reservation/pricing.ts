import { fallbackPackagesForTour } from "@/lib/tour-packages";
import type { TourPackageOption, TourSummary } from "@/lib/types/index";
import { buildGeneralEntryPackage } from "./packages";

export function getTourPackageOptions(tour: TourSummary | null | undefined): TourPackageOption[] {
  const fromTour = (tour?.packages ?? []).filter(
    (pkg) => typeof pkg.price === "number" && pkg.price > 0 && pkg.name,
  );
  if (fromTour.length > 0) return fromTour;

  const fallback = fallbackPackagesForTour(tour?.slug);
  if (fallback.length > 0) return fallback;

  if (typeof tour?.priceCRC === "number" && tour.priceCRC > 0) {
    return [buildGeneralEntryPackage(tour, tour.slug)];
  }

  return [buildGeneralEntryPackage(tour, tour?.slug)];
}

export function resolveInitialPackage(
  packages: TourPackageOption[],
  preferredId?: string | null,
): TourPackageOption {
  if (preferredId) {
    const knownAliases: Record<string, string[]> = {
      "essential-package": ["essential-package", "paquete-esencial"],
      "paquete-esencial": ["essential-package", "paquete-esencial"],
      "lunch-package": ["lunch-package", "paquete-con-almuerzo"],
      "paquete-con-almuerzo": ["lunch-package", "paquete-con-almuerzo"],
      "private-package": ["private-package", "paquete-privado"],
      "paquete-privado": ["private-package", "paquete-privado"],
    };
    const acceptedIds = knownAliases[preferredId] ?? [preferredId];
    const match = packages.find((pkg) =>
      (pkg.id && acceptedIds.includes(pkg.id)) || pkg.name === preferredId,
    );
    if (match) return match;

    const normalize = (value: string) => value
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[_\s]+/g, "-");
    const preferred = normalize(preferredId);
    const tier =
      /\b(private|privado)\b/.test(preferred) ? "private" :
      /\b(lunch|almuerzo|full-day|completo)\b/.test(preferred) ? "lunch" :
      /\b(essential|esencial|basic|basico|standard|estandar)\b/.test(preferred) ? "essential" :
      null;

    if (tier) {
      const tierMatch = packages.find((pkg) => {
        const text = normalize([pkg.id, pkg.name, pkg.nameEs].filter(Boolean).join(" "));
        if (tier === "private") return /\b(private|privado)\b/.test(text) || pkg.groupTour === false;
        if (tier === "lunch") return /\b(lunch|almuerzo|full-day|completo)\b/.test(text);
        return /\b(essential|esencial|basic|basico|standard|estandar)\b/.test(text);
      });
      if (tierMatch) return tierMatch;
    }
  }
  return packages[0];
}

/** Best default package: mid-tier if 3+, else cheapest. */
export function resolveRecommendedPackage(
  packages: TourPackageOption[],
  isDisabled?: (pkg: TourPackageOption) => boolean,
): TourPackageOption | null {
  if (!packages.length) return null;
  const open = packages.filter((pkg) => !(isDisabled?.(pkg) ?? false));
  const pool = open.length > 0 ? open : packages;
  if (pool.length >= 3) {
    const sorted = [...pool].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    return sorted[1] ?? sorted[0] ?? null;
  }
  return [...pool].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0] ?? null;
}

export function getPackageId(pkg: TourPackageOption | null | undefined): string {
  if (!pkg) return "";
  return pkg.id ?? pkg.name ?? "";
}

export function getPackageDisplayName(pkg: TourPackageOption, isEs: boolean): string {
  return isEs ? pkg.nameEs || pkg.name : pkg.name;
}

export function packageIncludesLunch(pkg: TourPackageOption | null | undefined): boolean {
  if (!pkg) return false;
  const text = [pkg.id, pkg.name, pkg.nameEs, pkg.descriptionEn, pkg.descriptionEs]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\b(lunch|almuerzo|lunch-package|private-package)\b/.test(text);
}

export function getExcludedAddonIds(pkg: TourPackageOption | null | undefined): string[] {
  return packageIncludesLunch(pkg) ? ["almuerzo"] : [];
}

export function getPackageDepartureTimes(pkg: TourPackageOption | null | undefined): string[] {
  const times = (pkg?.departureTimes ?? []).map((t) => t.trim()).filter(Boolean);
  return times.length > 0 ? Array.from(new Set(times)) : [];
}
