"use client";

import { useMemo } from "react";
import { Check, Star } from "lucide-react";
import type { TourPackageOption } from "@/lib/types/index";
import { getPackageDisplayName } from "@/lib/reservation/pricing";

type Props = {
  packages: TourPackageOption[];
  selectedPackageId: string;
  hasConfirmedSelection?: boolean;
  onSelect: (packageId: string) => void;
  lang: "es" | "en";
  dateIso?: string;
  isPackageDisabled?: (pkg: TourPackageOption) => boolean;
};

export default function PackagePicker({
  packages,
  selectedPackageId,
  hasConfirmedSelection = false,
  onSelect,
  lang,
  isPackageDisabled,
}: Props) {
  const isEs = lang === "es";

  const recommendedId = useMemo(() => {
    const open = packages.filter((pkg) => !(isPackageDisabled?.(pkg) ?? false));
    if (open.length === 0) return null;
    // Prefer mid-tier when 3+ options, otherwise the lowest price open package.
    if (open.length >= 3) {
      const sorted = [...open].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      return sorted[1]?.id ?? sorted[1]?.name ?? null;
    }
    const cheapest = [...open].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];
    return cheapest?.id ?? cheapest?.name ?? null;
  }, [isPackageDisabled, packages]);

  if (packages.length <= 1) {
    const pkg = packages[0];
    if (!pkg) return null;
    const id = pkg.id ?? pkg.name;
    return (
      <button
        type="button"
        onClick={() => onSelect(id!)}
        className={`flex min-h-32 w-full items-center justify-between gap-4 rounded-3xl border-2 p-5 text-left transition ${
          hasConfirmedSelection
            ? "border-[#00C4B0] bg-[#00C4B0]/10 shadow-lg shadow-[#00C4B0]/10"
            : "border-zinc-200 bg-white hover:border-[#00C4B0] dark:border-zinc-700 dark:bg-zinc-950/40"
        }`}
      >
        <span className="font-black text-zinc-900 dark:text-zinc-100">
          {getPackageDisplayName(pkg, isEs)}
        </span>
        <span className="shrink-0 text-xl font-black text-[#087d72] dark:text-[#66ddcf]">
          ${pkg.price} / {isEs ? "persona" : "person"}
        </span>
      </button>
    );
  }

  return (
    <div
      className={`grid gap-2 ${
        packages.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"
      }`}
    >
      {packages.map((pkg) => {
        const id = pkg.id ?? pkg.name;
        const selected = hasConfirmedSelection && selectedPackageId === id;
        const disabled = isPackageDisabled?.(pkg) ?? false;
        const recommended = !disabled && id === recommendedId;

        return (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(id!)}
            className={[
              "relative flex min-h-44 flex-col rounded-3xl border-2 p-5 text-left transition-all",
              disabled
                ? "cursor-not-allowed border-zinc-200 bg-zinc-100 opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
                : selected
                  ? "border-[#00C4B0] bg-[#00C4B0]/10 shadow-lg shadow-[#00C4B0]/15 dark:border-[#00C4B0] dark:bg-[#00C4B0]/10"
                  : recommended
                    ? "border-amber-300/80 bg-white hover:border-[#00C4B0] dark:border-amber-700/50 dark:bg-zinc-950/40"
                    : "border-zinc-200 bg-white hover:border-[#00C4B0] dark:border-zinc-700 dark:bg-zinc-950/40",
            ].join(" ")}
          >
            {recommended && !selected && (
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
                <Star className="h-3 w-3" aria-hidden />
                {isEs ? "Popular" : "Popular"}
              </span>
            )}
            {selected && (
              <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check size={12} />
              </span>
            )}
            <p className={`pr-6 text-lg font-black leading-snug text-zinc-900 dark:text-zinc-50 ${recommended && !selected ? "mt-4" : ""}`}>
              {getPackageDisplayName(pkg, isEs)}
            </p>
            <p className="mt-2 text-2xl font-black text-[#087d72] dark:text-[#66ddcf]">
              ${pkg.price}
              <span className="text-xs font-semibold text-zinc-500"> / {isEs ? "pax" : "pax"}</span>
            </p>
            {(pkg.descriptionEs || pkg.descriptionEn) && (
              <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                {isEs ? pkg.descriptionEs ?? pkg.descriptionEn : pkg.descriptionEn ?? pkg.descriptionEs}
              </p>
            )}
            {disabled && (
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                {isEs ? "No disponible esta fecha" : "Not available this date"}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
