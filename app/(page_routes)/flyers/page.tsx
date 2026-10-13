"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import FlyerCard from "@/app/components/flyers/FlyerCard";
import { FLYER_CATEGORIES, FLYERS } from "@/app/components/flyers/data";
import { BUSINESS } from "@/app/components/rotulos/constants";
import { createTranslator } from "@/app/components/rotulos/helpers";

/**
 * Todo el catálogo de tours convertido en flyers verticales (2:3) para
 * Instagram, agrupados por tour/categoría. Cada tarjeta trae el mismo editor
 * movible tipo Canva que los rótulos: "Editar objetos" para mover,
 * redimensionar, agregar texto o íconos y borrar.
 */
export default function FlyersPage() {
  const { lang, toggle } = useLanguage();
  const t = useMemo(() => createTranslator(lang), [lang]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 w-full max-w-[1920px] items-center justify-between gap-3 px-4 md:px-8 xl:h-20 xl:px-14 2xl:px-20">
          <Link
            href="/rotulos"
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-300 transition hover:text-white sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t("Rótulos", "Signage")}
          </Link>

          <div className="flex min-w-0 items-center gap-3">
            <Image
              src="/logo2.jpg"
              alt="La Vieja Adventures Logo"
              width={36}
              height={36}
              className="shrink-0 object-contain shadow-md shadow-black/30"
              priority
            />
            <span className="hidden truncate text-sm font-black tracking-tight text-white sm:inline md:text-base">
              {t("Flyers · Instagram", "Flyers · Instagram")}
            </span>
          </div>

          <button
            type="button"
            onClick={toggle}
            className="min-w-10 shrink-0 rounded-full border border-zinc-500/80 bg-white/10 px-3 py-1 text-center text-xs font-bold text-white transition hover:border-[#00C4B0]/60 hover:bg-[#00C4B0]/20 sm:text-sm"
            aria-label={lang === "es" ? "Switch to English" : "Cambiar a Español"}
          >
            {lang === "es" ? "EN" : "ES"}
          </button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1920px] px-4 pb-10 pt-10 sm:px-6 xl:px-14 2xl:px-20">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#65e2d5]">
            {t("Contenido para redes sociales", "Social media content")}
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] text-white sm:text-4xl xl:text-5xl">
            {t("Flyers para Instagram", "Instagram Flyers")}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
            {t(
              `${FLYERS.length} publicaciones verticales listas, una tanda completa por cada tour del catálogo. Descargue cada una en alta calidad con el botón "Descargar HQ", o active "Editar objetos" para mover, redimensionar, agregar texto o íconos y borrar — igual que en el editor de rótulos.`,
              `${FLYERS.length} ready-to-post vertical flyers, a full set for every tour in the catalog. Download each one in high quality with the "Download HQ" button, or turn on "Edit objects" to move, resize, add text or icons, and delete — the same editor used for the road signs.`,
            )}
          </p>
        </div>

        <nav
          aria-label={t("Ir a categoría", "Jump to category")}
          className="mt-8 flex flex-wrap gap-2"
        >
          {FLYER_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <a
                key={category.slug}
                href={`#${category.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-zinc-300 transition hover:border-[#00C4B0]/60 hover:bg-[#00C4B0]/15 hover:text-white sm:text-xs"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-[#65e2d5]" aria-hidden />
                {t(category.label.es, category.label.en)}
                <span className="text-zinc-500">{category.flyers.length}</span>
              </a>
            );
          })}
        </nav>
      </section>

      {FLYER_CATEGORIES.map((category, categoryIndex) => {
        const Icon = category.icon;
        return (
          <section
            key={category.slug}
            id={category.slug}
            className="mx-auto w-full max-w-[1920px] scroll-mt-24 px-4 pb-16 sm:px-6 xl:px-14 2xl:px-20"
          >
            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-10">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-[#65e2d5]">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <p className="text-xs font-black uppercase tracking-[0.2em]">
                    {t(category.label.es, category.label.en)}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300 sm:text-base">
                  {t(category.blurb.es, category.blurb.en)}
                </p>
              </div>
              <Link
                href={`/tour/${encodeURIComponent(category.tourSlug)}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-zinc-300 transition hover:border-[#00C4B0]/60 hover:bg-[#00C4B0]/15 hover:text-white"
              >
                {t("Ver el tour", "View the tour")}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>

            <div className="mt-8 grid gap-8 sm:grid-cols-2 xl:grid-cols-3 xl:gap-10">
              {category.flyers.map((flyer, index) => (
                <FlyerCard
                  key={flyer.id}
                  flyer={flyer}
                  lang={lang}
                  eager={categoryIndex === 0 && index === 0}
                />
              ))}
            </div>
          </section>
        );
      })}

      <p className="mx-auto w-full max-w-[1920px] px-4 pb-24 text-center text-xs text-zinc-500 sm:px-6 xl:px-14 2xl:px-20">
        {BUSINESS.name} &middot; {BUSINESS.place} &middot; {BUSINESS.web}
      </p>
    </main>
  );
}
