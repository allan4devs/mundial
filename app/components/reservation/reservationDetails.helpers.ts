import { TOUR_INFO } from "@/lib/tour-info";
import type { MainTourInfo } from "@/lib/types/index";

export const resolveSelectedTourSlug = (
  tours: Array<{ slug: string }>,
  manualSelectedTourSlug: string | null,
  initialSelectedTourSlug?: string
): string => {
  if (manualSelectedTourSlug && tours.some((tour) => tour.slug === manualSelectedTourSlug)) {
    return manualSelectedTourSlug;
  }

  if (initialSelectedTourSlug && tours.some((tour) => tour.slug === initialSelectedTourSlug)) {
    return initialSelectedTourSlug;
  }

  return tours[0]?.slug ?? "avistamiento-aves-norteno";
};

export const getDefaultMainTourInfo = (): MainTourInfo => ({
  ...TOUR_INFO,
  cancellationPolicy: TOUR_INFO.cancellationPolicy ?? "",
});
