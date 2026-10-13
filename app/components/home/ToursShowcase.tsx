"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, Info, MapPin, Zap } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { getTourImage } from "@/lib/tour-display";
import type { TourSummary } from "@/lib/types/index";
import { TOURS_HREF, getTourPriceDisplay, primaryBookingLabel, tourTitle } from "./home-utils";

type Props = {
  tours: TourSummary[];
};

export default function ToursShowcase({ tours }: Props) {
  const { lang } = useLanguage();
  const isEs = lang === "es";

  return (
    <section id="tours" className="bg-[#f4f1ea] py-16 dark:bg-[#0b0a09] md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">
              {isEs ? "Más experiencias" : "More experiences"}
            </p>
            <h2 className="font-display max-w-2xl text-balance text-4xl font-black leading-[0.98] tracking-tight text-stone-950 dark:text-stone-50 md:text-6xl">
              {isEs ? "¿Busca otro plan? Compare y reserve" : "Looking for another plan? Compare and book"}
            </h2>
          </div>
          <Link
            href={TOURS_HREF}
            className="group inline-flex items-center gap-2 text-sm font-black text-stone-950 transition-colors hover:text-emerald-700 dark:text-stone-50 dark:hover:text-emerald-300"
          >
            {isEs ? "Explorar todos los tours" : "Explore all tours"}
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 transition-all group-hover:border-emerald-600 group-hover:bg-emerald-600 group-hover:text-white dark:border-stone-600">
              <ArrowRight size={15} />
            </span>
          </Link>
        </div>

        <div className="mt-10 grid gap-x-7 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
          {tours.map((tour) => {
            const title = tourTitle(tour, isEs);
            const location = tour.location?.split("-")[0]?.trim() || "San Carlos";
            const price = getTourPriceDisplay(tour, isEs);
            return (
              <article key={tour.slug} className="group flex h-full flex-col">
                <Link
                  href={`/tour/${encodeURIComponent(tour.slug)}`}
                  aria-label={`${isEs ? "Ver información de" : "View information about"} ${title}`}
                  className="block w-full text-left"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-stone-900 shadow-[0_26px_70px_rgba(30,24,16,0.16)] sm:aspect-[3/4]">
                    <Image
                      src={getTourImage(tour.slug)}
                      alt={title}
                      fill
                      sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/10 to-black/12" />

                    {tour.difficulty && (
                      <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-stone-900 backdrop-blur-sm">
                        <Zap size={11} className="text-emerald-600" />
                        {tour.difficulty}
                      </span>
                    )}

                    <span className="absolute bottom-4 left-4 max-w-[calc(100%-5.5rem)] rounded-2xl bg-white px-4 py-2.5 text-stone-900 shadow-lg">
                      <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                        <span className="text-[11px] font-black uppercase tracking-wide text-stone-500">
                          {isEs ? "Desde" : "From"}
                        </span>
                        <span className="text-sm font-black">{price.primary}</span>
                        <span className="text-xs font-medium text-stone-500">
                          / {isEs ? "persona" : "person"}
                        </span>
                      </span>
                      {price.secondary && (
                        <span className="mt-0.5 block text-[11px] font-bold leading-none text-emerald-700">
                          {price.secondary}
                        </span>
                      )}
                    </span>

                    <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-800 shadow-lg transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-emerald-400 group-hover:text-emerald-950">
                      <Info size={17} />
                    </span>
                  </div>

                  <div className="mt-4 px-1">
                    <h3 className="font-display text-xl font-black tracking-tight text-stone-950 transition-colors group-hover:text-emerald-700 dark:text-stone-50 dark:group-hover:text-emerald-300">
                      {title}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500 dark:text-stone-400">
                      {tour.duration && (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={14} />
                          {tour.duration}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={14} />
                        {location}
                      </span>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                      {isEs ? "Ver fotos y detalles" : "See photos and details"}
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>

                <Link
                  href={`/reservar?tour=${encodeURIComponent(tour.slug)}`}
                  className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#00C4B0] px-5 py-3 text-sm font-black text-[#17211f] shadow-lg shadow-[#00C4B0]/20 transition-all hover:-translate-y-0.5 hover:bg-[#70eee1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C4B0] focus-visible:ring-offset-2 dark:ring-offset-stone-950"
                >
                  <CalendarDays size={16} />
                  {primaryBookingLabel(isEs)}
                  <ArrowRight size={15} />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
