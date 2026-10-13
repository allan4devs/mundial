"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, MessageCircle, ShieldCheck, Smartphone } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/helpers/utils";
import { PricingCards } from "../PricingCards";
import { OPERATOR } from "../pricing";

export default function PreciosPage() {
  const { lang, setLang } = useLanguage();
  const isEs = lang === "es";

  const faqs = isEs
    ? [
        ["¿El pago es único o mensual?", "Único. Pagás una vez el plan Pro y queda desbloqueado en ese navegador."],
        ["¿Qué recibo con Profesional?", "Un especialista revisa tu CV y tu carta, ajusta la redacción, ordena las secciones y optimiza palabras clave para filtros ATS. Te lo devolvemos en 48 horas por WhatsApp."],
        ["¿Y si cambio de compu?", "Escribinos por WhatsApp con tu comprobante y te reenviamos el código para el nuevo navegador."],
        ["¿Puedo probar antes de pagar?", "Sí. El plan Gratis te deja armar el CV completo, verlo y descargarlo con dos plantillas."],
      ]
    : [
        ["Is it a one-time or monthly payment?", "One-time. You pay once for Pro and it stays unlocked in that browser."],
        ["What do I get with Professional?", "A specialist reviews your CV and letter, fixes wording, orders the sections, and optimises keywords for ATS filters. Returned within 48 hours over WhatsApp."],
        ["What if I switch computers?", "Message us on WhatsApp with your receipt and we'll resend the code for the new browser."],
        ["Can I try before paying?", "Yes. The Free plan lets you build the full CV, preview it, and download it with two templates."],
      ];

  return (
    <main className="min-h-screen bg-white font-[family-name:var(--font-manrope)] text-zinc-800">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link href="/crear-cv" className="flex items-center gap-1.5 text-[12px] font-semibold text-zinc-500 hover:text-zinc-900">
            <ArrowLeft size={15} />
            CV Express
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex overflow-hidden rounded-full border border-zinc-300">
              {(["es", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-bold uppercase",
                    lang === l ? "bg-zinc-900 text-white" : "bg-white text-zinc-500",
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
            <Link
              href="/crear-cv/editor"
              className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-teal-700"
            >
              {isEs ? "Ir al editor" : "Open editor"}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 pb-6 pt-12 text-center">
        <h1 className="font-[family-name:var(--font-bricolage)] text-[clamp(2rem,5vw,3.25rem)] font-black leading-tight tracking-tight text-zinc-900">
          {isEs ? "Precios simples, pago único" : "Simple pricing, one-time payment"}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-zinc-600">
          {isEs
            ? "Empezá gratis. Desbloqueás todas las plantillas y quitás la marca de agua con un solo pago."
            : "Start free. Unlock every template and remove the watermark with a single payment."}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <PricingCards lang={lang} />
      </section>

      <section className="border-y border-zinc-200 bg-zinc-50 px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-bricolage)] text-2xl font-black tracking-tight text-zinc-900">
            {isEs ? "Cómo funciona el pago" : "How payment works"}
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {(isEs
              ? [
                  { icon: Smartphone, t: "1. SINPE Móvil", d: `Transferís al ${OPERATOR.sinpe} (${OPERATOR.sinpeName}).` },
                  { icon: MessageCircle, t: "2. WhatsApp", d: "Enviás el comprobante y te respondemos con tu código." },
                  { icon: ShieldCheck, t: "3. Activás", d: "Pegás el código en el editor y queda desbloqueado." },
                ]
              : [
                  { icon: Smartphone, t: "1. SINPE Móvil", d: `Transfer to ${OPERATOR.sinpe} (${OPERATOR.sinpeName}).` },
                  { icon: MessageCircle, t: "2. WhatsApp", d: "Send the receipt and we reply with your code." },
                  { icon: ShieldCheck, t: "3. Activate", d: "Paste the code in the editor and it's unlocked." },
                ]
            ).map((s) => (
              <div key={s.t} className="rounded-xl border border-zinc-200 bg-white p-4">
                <s.icon size={18} className="text-teal-600" />
                <p className="mt-2 text-[13px] font-bold text-zinc-900">{s.t}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-zinc-600">{s.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] text-zinc-500">
            {isEs
              ? `¿PayPal o transferencia bancaria? Escribinos a ${OPERATOR.email}.`
              : `PayPal or bank transfer? Email ${OPERATOR.email}.`}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="font-[family-name:var(--font-bricolage)] text-2xl font-black tracking-tight text-zinc-900">
          {isEs ? "Preguntas" : "Questions"}
        </h2>
        <div className="mt-5 space-y-2.5">
          {faqs.map(([q, a]) => (
            <details key={q} className="group rounded-xl border border-zinc-200 bg-white px-4 py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 text-[14px] font-bold text-zinc-900 marker:content-none">
                {q}
                <span className="shrink-0 text-teal-600 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="border-t border-zinc-100 pb-4 pt-3 text-[13px] leading-relaxed text-zinc-600">{a}</p>
            </details>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl bg-zinc-900 p-6">
          <div className="flex-1">
            <p className="text-[15px] font-bold text-white">
              {isEs ? "Listo para armar tu CV?" : "Ready to build your CV?"}
            </p>
            <p className="mt-0.5 text-[12px] text-zinc-400">
              {isEs ? "Gratis, sin cuenta." : "Free, no account."}
            </p>
          </div>
          <Link
            href="/crear-cv/editor"
            className="inline-flex items-center gap-2 rounded-full bg-teal-500 px-5 py-2.5 text-[13px] font-bold text-zinc-950 hover:bg-teal-400"
          >
            {isEs ? "Empezar" : "Start"}
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-200 px-4 py-6 text-center text-[12px] text-zinc-400">
        CV Express · Costa Rica ·{" "}
        <Link href="/" className="font-semibold hover:text-zinc-700">
          La Vieja Adventures
        </Link>
      </footer>
    </main>
  );
}
