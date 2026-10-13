"use client";

import { useState, useEffect } from "react";
import { CIUDAD_ESMERALDA_PACKAGES } from "@/lib/tour-packages";
import type { TourSummary } from "@/lib/types/index";

export const DEFAULT_BOOKABLE_TOUR: TourSummary = {
  id: "tour-ciudad-esmeralda",
  slug: "tour-ciudad-esmeralda",
  titleEs: "Tour Ciudad Esmeralda – Cañón del Río La Vieja",
  titleEn: "Ciudad Esmeralda Tour – La Vieja River Canyon",
  descriptionEs: "Caminata por senderos, río y cañón hacia la Cascada El Zafiro y sus pozas naturales.",
  descriptionEn: "A hike through trails, river, and canyon to El Zafiro Waterfall and its natural pools.",
  duration: "3-4 horas",
  difficulty: "Moderado",
  priceCRC: 25000,
  location: "Sucre de Ciudad Quesada, San Carlos, Alajuela, Costa Rica",
  packages: CIUDAD_ESMERALDA_PACKAGES,
};

export function useReservationData() {
  const [tours, setTours] = useState<TourSummary[]>([DEFAULT_BOOKABLE_TOUR]);
  const [ivaRatePercent, setIvaRatePercent] = useState<number>(13);

  useEffect(() => {
    fetch("/api/settings/iva")
      .then((r) => r.json())
      .then((data) => {
        const rate = Number(data?.ivaRate);
        if (!Number.isNaN(rate) && rate >= 0) setIvaRatePercent(rate);
      })
      .catch(() => {});

    fetch("/api/tours")
      .then((r) => r.json())
      .then((data) => {
        const remoteTours = Array.isArray(data?.tours) ? data.tours : [];
        const mapped: TourSummary[] = remoteTours
          .map((t: {
            id?: string;
            slug?: string;
            titleEs?: string;
            titleEn?: string;
            descriptionEs?: string;
            descriptionEn?: string;
            duration?: string;
            difficulty?: string;
            priceCRC?: number;
            location?: string;
            inclusions?: string[];
            exclusions?: string[];
            cancellationPolicy?: string;
            restrictions?: string;
            packages?: TourSummary["packages"];
            tagEs?: string;
            tagEn?: string;
          }) => ({
            id: t.id ?? t.slug ?? "",
            slug: t.slug ?? "",
            titleEs: t.titleEs ?? "Tour",
            titleEn: t.titleEn ?? "Tour",
            descriptionEs: t.descriptionEs,
            descriptionEn: t.descriptionEn,
            duration: t.duration,
            difficulty: t.difficulty,
            priceCRC: t.priceCRC,
            location: t.location,
            inclusions: t.inclusions,
            exclusions: t.exclusions,
            cancellationPolicy: t.cancellationPolicy,
            restrictions: t.restrictions,
            packages: Array.isArray(t.packages) ? t.packages : [],
            tagEs: t.tagEs,
            tagEn: t.tagEn,
          }))
          .filter((t: TourSummary) => Boolean(t.slug));
        const hasMain = mapped.some((t) => t.slug === DEFAULT_BOOKABLE_TOUR.slug);
        setTours(hasMain ? mapped : [DEFAULT_BOOKABLE_TOUR, ...mapped]);
      })
      .catch(() => { setTours([DEFAULT_BOOKABLE_TOUR]); });
  }, []);

  return { tours, ivaRatePercent };
}
