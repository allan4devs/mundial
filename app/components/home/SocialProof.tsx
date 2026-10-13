"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const GALLERY_ROW_A = [
  "/image/IMG_6810.jpg", "/image/IMG_4671.jpg", "/image/IMG_4257.jpg",
  "/image/IMG_6813.jpg", "/image/IMG_3698.jpg", "/image/IMG_4943.jpg",
  "/image/IMG_4522.jpg", "/image/IMG_4200.jpg",
];

const GALLERY_ROW_B = [
  "/image/IMG_6812.jpg", "/image/IMG_3705.jpg", "/image/IMG_4917.jpg",
  "/image/IMG_4672.jpg", "/image/IMG_6809.jpg", "/image/IMG_4523.jpg",
  "/image/IMG_3751.jpg", "/image/IMG_4514.jpg",
];

const TESTIMONIALS = [
  {
    name: "María F.",
    experience: { es: "Ciudad Esmeralda", en: "Ciudad Esmeralda" },
    origin: { es: "San José, Costa Rica", en: "San José, Costa Rica" },
    es: "El cañón nos dejó sin palabras. Aguas esmeralda, guía que conocía cada rincón y un ritmo que nos retó sin agobiarnos. Pura vida de verdad.",
    en: "The canyon left us speechless. Emerald waters, a guide who knew every corner, and a pace that challenged us without overwhelming us. Real pura vida.",
  },
  {
    name: "Daniel R.",
    experience: { es: "Pozas Cristalinas", en: "Crystal Pools" },
    origin: { es: "Alajuela, Costa Rica", en: "Alajuela, Costa Rica" },
    es: "Fuimos en familia con niños y todos disfrutaron. Pozas cristalinas, caminata suave y el guía muy pendiente de la seguridad del grupo.",
    en: "We went as a family with kids and everyone loved it. Crystal pools, an easy hike, and a guide who was very attentive to the group's safety.",
  },
  {
    name: "Emily & Jake",
    experience: { es: "Avistamiento de Aves", en: "Birdwatching" },
    origin: { es: "Texas, EE. UU.", en: "Texas, USA" },
    es: "Escuchamos tucanes antes de verlos. Sin multitudes, bosque vivo y un equipo local que sabe de aves como nadie en la zona.",
    en: "We heard toucans before we saw them. No crowds, living forest, and a local crew that knows birds like no one else in the area.",
  },
];

export default function SocialProof() {
  const { lang } = useLanguage();
  const isEs = lang === "es";

  return (
    <section className="overflow-hidden bg-[#FAF9F6] py-20 dark:bg-[#0b0a09] md:py-28">
      {/* Testimonials */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">
            {isEs ? "Lo que dicen" : "What they say"}
          </p>
          <h2 className="font-display mx-auto max-w-2xl text-balance text-4xl font-bold leading-[1.02] tracking-tight text-stone-900 dark:text-stone-50 md:text-5xl">
            {isEs ? "Historias de quienes ya vivieron la aventura" : "Stories from those who lived the adventure"}
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-3xl border border-stone-200 bg-white p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] dark:border-stone-800 dark:bg-white/[0.03]"
            >
              <span className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className="fill-current" />
                ))}
              </span>
              <span className="mt-4 inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                {isEs ? t.experience.es : t.experience.en}
              </span>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                “{isEs ? t.es : t.en}”
              </blockquote>
              <figcaption className="mt-5">
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">{t.name}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{isEs ? t.origin.es : t.origin.en}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      {/* Gallery marquee */}
      <div className="mt-20 md:mt-28">
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50 md:text-4xl">
            {isEs ? "Esto es lo que vas a vivir" : "This is what you'll experience"}
          </h2>
        </div>

        <div className="space-y-3">
          <div
            className="flex w-max gap-3"
            style={{ animation: "lva-marquee-left 60s linear infinite" }}
          >
            {[...GALLERY_ROW_A, ...GALLERY_ROW_A].map((src, i) => (
              <div
                key={`a-${src}-${i}`}
                className="relative h-44 w-64 shrink-0 overflow-hidden rounded-2xl md:h-56 md:w-80"
              >
                <Image src={src} alt="" fill sizes="320px" className="object-cover" />
              </div>
            ))}
          </div>
          <div
            className="flex w-max gap-3"
            style={{ animation: "lva-marquee-right 52s linear infinite" }}
          >
            {[...GALLERY_ROW_B, ...GALLERY_ROW_B].map((src, i) => (
              <div
                key={`b-${src}-${i}`}
                className="relative h-44 w-64 shrink-0 overflow-hidden rounded-2xl md:h-56 md:w-80"
              >
                <Image src={src} alt="" fill sizes="320px" className="object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/galeria"
            className="group inline-flex items-center gap-2 rounded-full border border-stone-300 px-7 py-3.5 text-sm font-bold text-stone-800 transition-colors hover:border-emerald-600 hover:text-emerald-700 dark:border-stone-600 dark:text-stone-200 dark:hover:border-emerald-400 dark:hover:text-emerald-300"
          >
            {isEs ? "Ver galería completa" : "See full gallery"}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
