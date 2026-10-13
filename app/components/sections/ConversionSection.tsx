"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Star, Users, Zap } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { principalContent } from "@/lib/constants/principal";

export default function ConversionSection() {
  const { lang } = useLanguage();
  const copy = principalContent[lang].conversion;
  const isEs = lang === "es";
  const [activeFaq, setActiveFaq] = useState(0);
  const currentFaq = copy.faqs[activeFaq] ?? copy.faqs[0];

  return (
    <>
      {/* ── Booking urgency CTA ── */}
      <section className="relative overflow-hidden bg-[#020807] py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.18),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:linear-gradient(90deg,rgba(110,231,183,0.07)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:88px_88px]" />

        <div className="container relative mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl"
          >
            <div className="overflow-hidden rounded-[24px] border border-emerald-300/22 bg-[linear-gradient(135deg,rgba(6,78,59,0.55),rgba(2,44,34,0.45)_55%,rgba(16,185,129,0.18))] shadow-[0_40px_100px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-2xl">
              <div className="px-8 py-12 text-center md:px-14 md:py-16">
                {/* Social proof stars */}
                <div className="mb-6 flex justify-center">
                  <div className="inline-flex items-center gap-3 rounded-full border border-amber-300/28 bg-amber-500/12 px-5 py-2 backdrop-blur-md">
                    <span className="flex gap-0.5 text-amber-400">
                      {Array(5).fill(0).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </span>
                    <span className="text-sm font-bold text-white/80">
                      {isEs ? "4.9 · +500 aventureros" : "4.9 · +500 adventurers"}
                    </span>
                  </div>
                </div>

                <h2 className="mb-4 text-balance text-4xl font-black leading-[0.94] text-white md:text-6xl">
                  {isEs
                    ? "Tu aventura arranca con una reserva."
                    : "Your adventure starts with a booking."}
                </h2>
                <p className="mx-auto mb-8 max-w-xl text-base font-medium leading-relaxed text-white/60 md:text-lg">
                  {isEs
                    ? "Cupos limitados. Guías locales certificados. Naturaleza real a minutos de Ciudad Quesada."
                    : "Limited spots. Certified local guides. Real nature minutes from Ciudad Quesada."}
                </p>

                {/* Trust chips */}
                <div className="mb-8 flex flex-wrap justify-center gap-3">
                  {[
                    { Icon: ShieldCheck, text: isEs ? "Cancelación gratuita 48h" : "Free cancellation 48h" },
                    { Icon: Zap, text: isEs ? "Confirmación inmediata" : "Instant confirmation" },
                    { Icon: Users, text: isEs ? "Grupos pequeños" : "Small groups" },
                  ].map(({ Icon, text }) => (
                    <span key={text} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white/70 backdrop-blur-md">
                      <Icon className="h-3.5 w-3.5 text-emerald-300" />
                      {text}
                    </span>
                  ))}
                </div>

                <Link
                  href="/reservar"
                  className="emerald-wave-button group inline-flex items-center gap-3 rounded-full bg-emerald-400 px-10 py-4 text-sm font-black uppercase tracking-[0.18em] text-emerald-950 shadow-[0_16px_52px_rgba(16,185,129,0.48)] transition-all duration-200 hover:-translate-y-1 hover:bg-amber-300 hover:shadow-[0_20px_52px_rgba(245,158,11,0.42)]"
                >
                  {isEs ? "Reservar mi aventura" : "Book my adventure"}
                  <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative bg-black py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-4xl text-center"
          >
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-300">
              FAQ
            </p>
            <h2 className="text-3xl font-black text-white md:text-5xl">
              {copy.title}
            </h2>
            {copy.subtitle && (
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">
                {copy.subtitle}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mt-10 max-w-3xl"
          >
            <article className="min-h-[240px] rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.36)] sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <span className="rounded-full border border-emerald-400/22 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
                  {String(activeFaq + 1).padStart(2, "0")} / {String(copy.faqs.length).padStart(2, "0")}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFaq((c) => (c - 1 + copy.faqs.length) % copy.faqs.length)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/12"
                    aria-label={isEs ? "Pregunta anterior" : "Previous question"}
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFaq((c) => (c + 1) % copy.faqs.length)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/12"
                    aria-label={isEs ? "Pregunta siguiente" : "Next question"}
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold leading-snug text-white sm:text-2xl">
                {currentFaq.question}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-zinc-300 sm:text-lg">
                {currentFaq.answer.replaceAll("**", "")}
              </p>
            </article>

            <div className="mt-5 flex justify-center gap-2">
              {copy.faqs.map((item, index) => (
                <button
                  key={item.question}
                  type="button"
                  onClick={() => setActiveFaq(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === activeFaq ? "w-8 bg-emerald-400" : "w-2 bg-white/25 hover:bg-white/50"
                  }`}
                  aria-label={`${isEs ? "Ir a pregunta" : "Go to question"} ${index + 1}`}
                />
              ))}
            </div>

            {/* Post-FAQ micro CTA */}
            <div className="mt-10 text-center">
              <p className="mb-4 text-sm text-white/45">
                {isEs ? "¿Listo para vivirlo?" : "Ready to experience it?"}
              </p>
              <Link
                href="/reservar"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-7 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-950 shadow-[0_10px_32px_rgba(16,185,129,0.38)] transition hover:-translate-y-0.5 hover:bg-amber-300"
              >
                {isEs ? "Reservar ahora" : "Book now"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
