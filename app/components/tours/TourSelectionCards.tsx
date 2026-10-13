"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, MapPin, ShieldCheck, Zap } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { getTourImage } from "@/lib/tour-display";
import { TourSummary } from "@/lib/types/index";

const TOUR_TAGS_BY_SLUG: Record<string, { tagEs: string; tagEn: string }> = [
  { slug: "avistamiento-aves-norteno",      tagEs: "Tour estrella", tagEn: "Star tour" },
  { slug: "avistamiento-aves",              tagEs: "Tour estrella", tagEn: "Star tour" },
  { slug: "caminata-volcanes-dormidos",     tagEs: "Top 2", tagEn: "Top 2" },
  { slug: "tour-ciudad-esmeralda", tagEs: "Top 3 aventura", tagEn: "Top 3 adventure" },
  { slug: "ciudad-esmeralda",      tagEs: "Top 3 aventura", tagEn: "Top 3 adventure" },
  { slug: "aventuras-cataratas",   tagEs: "Temporada lluviosa", tagEn: "Rainy season pick" },
  { slug: "pozas-cristalinas",     tagEs: "Mas vendido", tagEn: "Best seller" },
  { slug: "cuadra-tours-aventura", tagEs: "Adrenalina", tagEn: "Adrenaline" },
  { slug: "cascadas-secretas-rio-la-vieja", tagEs: "Cataratas", tagEn: "Waterfalls" },
  { slug: "tour-gastronomico-local",        tagEs: "Cultura local", tagEn: "Local culture" },
  { slug: "lluvia-en-la-naturaleza",        tagEs: "Sensorial", tagEn: "Sensory" },
  { slug: "tour-nocturno-la-vieja",         tagEs: "Nocturno", tagEn: "Nocturnal" },
  { slug: "rapel-canon-del-rio",            tagEs: "Extremo", tagEn: "Extreme" },
].reduce((acc, t) => {
  acc[t.slug] = { tagEs: t.tagEs, tagEn: t.tagEn };
  return acc;
}, {} as Record<string, { tagEs: string; tagEn: string }>);

function inferTourTag(tour: TourSummary): { tagEs: string; tagEn: string } {
  const text = `${tour.slug} ${tour.titleEs} ${tour.titleEn} ${tour.descriptionEs ?? ""} ${tour.descriptionEn ?? ""}`.toLowerCase();
  if (text.includes("catarata") || text.includes("waterfall")) return { tagEs: "Cataratas", tagEn: "Waterfalls" };
  if (text.includes("canon") || text.includes("cañon") || text.includes("cañón") || text.includes("canyon")) return { tagEs: "Cañonismo", tagEn: "Canyoning" };
  if (text.includes("cuadra") || text.includes("atv")) return { tagEs: "Adrenalina", tagEn: "Adrenaline" };
  if (text.includes("gastronom") || text.includes("culinary") || text.includes("food")) return { tagEs: "Cultura local", tagEn: "Local culture" };
  if (text.includes("ave") || text.includes("bird")) return { tagEs: "Fauna", tagEn: "Wildlife" };
  if (text.includes("nocturn") || text.includes("night")) return { tagEs: "Nocturno", tagEn: "Nocturnal" };
  if (text.includes("volcan") || text.includes("volcano")) return { tagEs: "Volcanes", tagEn: "Volcanoes" };
  if (text.includes("lluvia") || text.includes("rain")) return { tagEs: "Bosque lluvioso", tagEn: "Rainforest" };
  if (tour.difficulty?.toLowerCase().includes("avanz")) return { tagEs: "Alta intensidad", tagEn: "High intensity" };
  if (tour.difficulty?.toLowerCase().includes("moder")) return { tagEs: "Aventura moderada", tagEn: "Moderate adventure" };
  return { tagEs: "Experiencia local", tagEn: "Local experience" };
}

type Props = {
  tours: TourSummary[];
  onSelectTour: (slug: string) => void;
  selectedTourSlug?: string | null;
  className?: string;
  cardClassName?: string;
};

export default function TourSelectionCards({
  tours,
  onSelectTour,
  selectedTourSlug,
  className = "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3",
  cardClassName = "h-[520px]",
}: Props) {
  const { lang } = useLanguage();
  const isEs = lang === "es";

  return (
    <div className={className}>
      {tours.map((tour, index) => {
        const tag = {
          ...inferTourTag(tour),
          ...TOUR_TAGS_BY_SLUG[tour.slug],
          ...(tour.tagEs || tour.tagEn
            ? { tagEs: tour.tagEs ?? inferTourTag(tour).tagEs, tagEn: tour.tagEn ?? inferTourTag(tour).tagEn }
            : {}),
        };
        const tourTitle = isEs ? tour.titleEs : tour.titleEn;
        const isSelected = selectedTourSlug === tour.slug;
        const isFeatured = tour.slug === "avistamiento-aves-norteno" || tour.slug === "avistamiento-aves";
        const price = tour.packages?.[0]?.price ? `$${tour.packages[0].price}` : isEs ? "Consultar" : "Ask";

        return (
          <article
            key={tour.slug}
            data-carousel-card
            className={[
              "group relative overflow-hidden rounded-2xl text-left",
              "cursor-pointer select-none",
              "transition-all duration-500 hover:-translate-y-2",
              "shadow-[0_20px_60px_rgba(0,0,0,0.55)] hover:shadow-[0_40px_90px_rgba(0,0,0,0.70)]",
              isSelected
                ? "border-2 border-emerald-300 ring-4 ring-emerald-300/25"
                : isFeatured
                ? "border border-emerald-400/60 shadow-[0_20px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(52,211,153,0.25)]"
                : "border border-white/12 hover:border-emerald-200/45",
              cardClassName,
            ].join(" ")}
          >
            {/* Full-bleed image */}
            <Image
              src={getTourImage(tour.slug)}
              alt={tourTitle}
              fill
              sizes="(min-width: 1280px) 500px, (min-width: 768px) 50vw, 90vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
            />

            {/* Gradient — light at top, heavy at bottom for readability */}
            <div className="absolute inset-0 bg-[linear-gradient(175deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.14)_28%,rgba(0,0,0,0.58)_60%,rgba(2,10,8,0.97)_100%)]" />

            {/* Emerald glow hover */}
            <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_92%,rgba(16,185,129,0.22),transparent_52%)]" />

            {/* Featured glow (birdwatching) */}
            {isFeatured && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_10%,rgba(52,211,153,0.20),transparent_40%)]" />
            )}

            {/* Top: index + tag + price */}
            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4 z-10">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/25 bg-black/55 text-xs font-black text-white shadow-lg backdrop-blur-md">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className={[
                    "rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] backdrop-blur-md",
                    isFeatured
                      ? "border-emerald-300/55 bg-emerald-500/25 text-emerald-100"
                      : "border-white/22 bg-black/50 text-white/88",
                  ].join(" ")}
                >
                  {isSelected
                    ? (isEs ? "Seleccionado" : "Selected")
                    : isEs ? tag.tagEs : tag.tagEn}
                </span>
              </div>

              {/* Price */}
              <div className="shrink-0 rounded-xl border border-amber-300/28 bg-black/60 px-3 py-2 text-right backdrop-blur-md">
                <span className="block text-[8px] font-black uppercase tracking-[0.15em] text-amber-300/65">
                  {isEs ? "Desde" : "From"}
                </span>
                <span className="block text-lg font-black leading-none text-amber-100">
                  {price}
                </span>
              </div>
            </div>

            {/* Bottom content */}
            <div className="absolute inset-x-0 bottom-0 z-10 p-5">
              <h3 className="mb-3 font-black leading-tight text-white drop-shadow-xl text-[clamp(1.25rem,3.2vw,1.6rem)]">
                {tourTitle}
              </h3>

              {/* Stat pills */}
              <div className="mb-4 flex flex-wrap gap-1.5">
                {tour.duration && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/75 backdrop-blur-md">
                    <Clock3 className="h-3 w-3 shrink-0 text-teal-300" />
                    {tour.duration}
                  </span>
                )}
                {tour.difficulty && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/75 backdrop-blur-md">
                    <Zap className="h-3 w-3 shrink-0 text-amber-300" />
                    {tour.difficulty}
                  </span>
                )}
                {tour.location && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/75 backdrop-blur-md">
                    <MapPin className="h-3 w-3 shrink-0 text-emerald-300" />
                    {tour.location.split("-")[0]?.trim()}
                  </span>
                )}
              </div>

              {/* CTAs */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onSelectTour(tour.slug)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-950 shadow-[0_8px_26px_rgba(16,185,129,0.40)] transition-all duration-200 hover:bg-amber-300 hover:shadow-[0_8px_26px_rgba(245,158,11,0.38)] active:scale-[0.97]"
                >
                  {isEs ? "Reservar ahora" : "Book now"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <Link
                  href={`/tour/${encodeURIComponent(tour.slug)}`}
                  className="flex items-center justify-center rounded-xl border border-white/20 bg-white/8 px-4 py-3 text-[11px] font-bold text-white/72 backdrop-blur-md transition hover:border-white/38 hover:text-white"
                >
                  {isEs ? "Ver" : "Info"}
                </Link>
              </div>

              <p className="mt-2.5 flex items-center gap-1.5 text-[9px] font-medium text-white/35">
                <ShieldCheck className="h-3 w-3 text-emerald-300/60" />
                {isEs
                  ? "Confirmamos disponibilidad antes del cobro"
                  : "We confirm availability before charging"}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
