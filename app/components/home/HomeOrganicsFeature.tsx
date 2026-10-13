"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Leaf, Recycle, Sprout } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const points = {
  es: [
    "Huerta y practicas organicas locales",
    "Insumos frescos para nuestro restaurante",
    "Compost, temporada y menor desperdicio",
  ],
  en: [
    "Local organic garden practices",
    "Fresh inputs for our restaurant",
    "Compost, seasonality, and less waste",
  ],
};

export default function HomeOrganicsFeature() {
  const { lang } = useLanguage();
  const isEs = lang === "es";

  return (
    <section className="bg-[#f4f1ea] py-16 dark:bg-[#0b0a09] md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_28px_90px_rgba(30,24,16,0.12)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_28px_90px_rgba(0,0,0,0.45)] lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative min-h-[360px] bg-stone-900 lg:min-h-[520px]">
            <Image
              src="/ads/IMG_5670.jpg"
              alt={isEs ? "Cocina local conectada con La Vieja Organics" : "Local kitchen connected with La Vieja Organics"}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-900 shadow-lg">
                <Leaf size={14} />
                La Vieja Organics
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/35 px-4 py-2 text-xs font-bold text-white backdrop-blur-md">
                <Recycle size={14} className="text-emerald-300" />
                {isEs ? "Sostenibilidad local" : "Local sustainability"}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">
              {isEs ? "Nuevo de la familia La Vieja" : "New from the La Vieja family"}
            </p>
            <h2 className="font-display max-w-3xl text-balance text-4xl font-black leading-[0.98] tracking-tight text-stone-950 dark:text-stone-50 md:text-6xl">
              {isEs ? "Organico para alimentar nuestro restaurante" : "Organic roots for our restaurant"}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone-600 dark:text-stone-300 md:text-lg">
              {isEs
                ? "La Vieja Organics no nace como tienda: es un proyecto local de sostenibilidad organica para nutrir la cocina de nuestro restaurante, cuidar la tierra y aprovechar mejor lo que da la zona."
                : "La Vieja Organics is not a storefront for now: it is a local organic sustainability project that supports our restaurant kitchen, cares for the soil, and makes better use of what the area gives us."}
            </p>

            <ul className="mt-7 grid gap-3 sm:grid-cols-3">
              {points[lang].map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm font-medium text-stone-700 dark:text-stone-200">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                    <Check size={12} className="text-emerald-700 dark:text-emerald-300" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/organics"
                className="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5 hover:bg-emerald-500"
              >
                {isEs ? "Conocer el proyecto" : "Explore the project"}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/info"
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-7 py-3.5 text-sm font-bold text-stone-800 transition-colors hover:border-emerald-600 hover:text-emerald-700 dark:border-stone-600 dark:text-stone-200 dark:hover:border-emerald-400 dark:hover:text-emerald-300"
              >
                <Sprout size={16} />
                {isEs ? "Ver restaurante" : "See restaurant"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
