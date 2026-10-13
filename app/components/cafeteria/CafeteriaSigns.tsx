"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calculator, Languages, TriangleAlert } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import PrintButton from "./PrintButton";
import { SIGNS } from "./data";
import { createTranslator } from "./helpers";
import styles from "./CafeteriaSigns.module.css";

/**
 * Propuesta interna de rótulos para la cafetería. Los artes se imprimen
 * siempre bilingües; el idioma que se cambia con el botón es el de esta
 * página, no el de las láminas.
 */
export default function CafeteriaSigns() {
  const { lang, toggle } = useLanguage();
  const t = createTranslator(lang);

  return (
    <main className={styles.page}>
      <header
        className={`${styles.screenOnly} sticky top-0 z-40 border-b border-white/10 bg-[#171512]/90 backdrop-blur-xl`}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 md:px-8">
          <Link
            href="/"
            className="inline-flex min-w-0 items-center gap-3 text-white transition hover:text-[#8EF2E6]"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            <div className="shrink-0 bg-[#2E2A25] p-1">
              <Image
                src="/logo2.jpg"
                alt="La Vieja Adventures"
                width={36}
                height={36}
                className="h-8 w-8 object-contain"
                priority
              />
            </div>
            <span className="truncate text-sm font-black sm:text-base">
              {t("Rótulos de cafetería", "Coffee shop signs")}
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/cafeteria/pos"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-2 text-xs font-black text-white transition hover:border-[#00C4B0]/60 hover:text-[#8EF2E6]"
            >
              <Calculator className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{t("Caja", "Register")}</span>
            </Link>
            <button
              type="button"
              onClick={toggle}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-2 text-xs font-black text-white transition hover:border-[#00C4B0]/60 hover:text-[#8EF2E6]"
              aria-label={lang === "es" ? "Switch to English" : "Cambiar a español"}
            >
              <Languages className="h-4 w-4" aria-hidden />
              {lang === "es" ? "EN" : "ES"}
            </button>
            <PrintButton target="all" variant="header" count={SIGNS.length} t={t} />
          </div>
        </div>
      </header>

      <div
        className={`${styles.pageInner} mx-auto max-w-7xl px-3 pb-20 pt-8 sm:px-5 md:px-8 md:pt-12`}
      >
        <section
          className={`${styles.screenOnly} grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end`}
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#76EBDE]">
              {t(
                `Segunda propuesta · ${SIGNS.length} piezas`,
                `Second proposal · ${SIGNS.length} pieces`,
              )}
            </p>
            <h1 className="mt-4 max-w-4xl font-display text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl md:text-7xl">
              {t(
                "Una cafetería que se entiende de una mirada.",
                "A coffee shop you understand at a glance.",
              )}
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/65 sm:text-base">
              {t(
                "Siete rótulos unidos por la marca de La Vieja: menú, bebidas calientes, bebidas frías, comidas, formas de pago, propósito y avisos legales. Todos se imprimen bilingües, con precios finales en colones e IVA incluido, como pide la Ley 7472.",
                "Seven signs tied together by the La Vieja brand: menu, hot drinks, cold drinks, food, payment, purpose and legal notices. All print bilingual, with final prices in colones and VAT included, as Law 7472 requires.",
              )}
            </p>
          </div>

          <aside className="border border-[#F3A712]/35 bg-[#F3A712]/10 p-4 text-sm leading-relaxed text-amber-50 sm:p-5">
            <div className="flex items-center gap-2 font-black text-[#FFD67A]">
              <TriangleAlert className="h-5 w-5 shrink-0" aria-hidden />
              {t("Antes de mandar a producir", "Before sending to production")}
            </div>
            <p className="mt-2 text-amber-50/75">
              {t(
                "Los precios que se ven son de ejemplo: montos de referencia del mercado costarricense puestos para que el arte se pueda evaluar terminado. Hay que confirmarlos, junto con el titular y el QR de SINPE, el número de permiso sanitario, las medidas finales y la misión y visión.",
                "The prices shown are samples: Costa Rican market reference amounts, added so the artwork can be judged finished. They need confirming, along with the SINPE account holder and QR, the health permit number, final sizes, and the mission and vision.",
              )}
            </p>
          </aside>
        </section>

        <nav
          className={`${styles.screenOnly} mt-8 flex gap-2 overflow-x-auto pb-3`}
          aria-label={t("Ir a un rótulo", "Jump to a sign")}
        >
          {SIGNS.map((sign) => (
            <a
              key={sign.id}
              href={`#${sign.id}`}
              className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 transition hover:border-[#00C4B0]/60 hover:text-white"
            >
              <span className="mr-1.5 text-[#76EBDE]">{sign.code}</span>
              {sign.title[lang]}
            </a>
          ))}
        </nav>

        <section
          className={`${styles.signList} mt-7`}
          aria-label={t("Propuestas de rótulos", "Sign proposals")}
        >
          {SIGNS.map((sign) => {
            const Artwork = sign.Artwork;
            return (
              <article
                key={sign.id}
                id={sign.id}
                data-sign-id={sign.id}
                className={styles.signCard}
              >
                <div className={styles.signLayout}>
                  <div className={styles.artboardFrame}>
                    <Artwork />
                  </div>

                  <aside className={styles.details}>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#76EBDE]">
                        {sign.code}
                      </p>
                      <h2 className="mt-2 font-display text-2xl font-black tracking-tight text-white">
                        {sign.title[lang]}
                      </h2>
                      <p className="mt-3 text-sm leading-relaxed text-white/60">
                        {sign.description[lang]}
                      </p>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
                        {t("Ubicación sugerida", "Suggested placement")}
                      </p>
                      <p className="mt-1.5 text-sm font-semibold leading-relaxed text-white/75">
                        {sign.placement[lang]}
                      </p>
                    </div>

                    <div className="border border-[#F3A712]/20 bg-[#F3A712]/[0.07] p-3.5">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#FFD67A]">
                        {t("Falta completar", "Still to confirm")}
                      </p>
                      <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-amber-50/65">
                        {sign.pending.map((item) => (
                          <li key={item.es} className="flex gap-2">
                            <span className="text-[#F3A712]">·</span>
                            <span>{item[lang]}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <PrintButton target={sign.id} variant="card" t={t} />
                  </aside>
                </div>
              </article>
            );
          })}
        </section>

        <footer
          className={`${styles.screenOnly} mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/35`}
        >
          {t(
            "La Vieja Adventures · Propuesta interna de rótulos · Precios de ejemplo, medidas y materiales por definir",
            "La Vieja Adventures · Internal sign proposal · Sample prices, sizes and materials to be defined",
          )}
        </footer>
      </div>
    </main>
  );
}
