"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileCheck2,
  Globe2,
  Languages,
  Lock,
  MonitorSmartphone,
  PenLine,
  Plus,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/helpers/utils";
import { ResumeSheet } from "./ResumePreview";
import { PricingCards } from "./PricingCards";
import { sampleResume, ACCENTS } from "./sample";
import { TEMPLATE_META } from "./i18n";
import { TEMPLATE_ORDER, isFreeTemplate } from "./templates";
import type { ResumeSettings, TemplateId } from "./types";

export default function CrearCvLanding() {
  const { lang, setLang } = useLanguage();
  const isEs = lang === "es";
  const data = useMemo(() => sampleResume(lang), [lang]);

  const steps = isEs
    ? [
        { icon: PenLine, t: "Completá tus datos", d: "Un formulario claro: experiencia, estudios, habilidades. Sin cuenta, sin descargas." },
        { icon: Wand2, t: "Elegí un estilo", d: "Cambiá de plantilla y color y mirá el resultado al instante." },
        { icon: FileCheck2, t: "Descargá en PDF", d: "Tu CV y tu carta listos para enviar. Editá cuando querás." },
      ]
    : [
        { icon: PenLine, t: "Add your details", d: "A clean form: experience, studies, skills. No account, no installs." },
        { icon: Wand2, t: "Pick a style", d: "Switch template and colour and see the result instantly." },
        { icon: FileCheck2, t: "Download the PDF", d: "Your CV and letter ready to send. Edit whenever you want." },
      ];

  const features = isEs
    ? [
        { icon: PenLine, t: "Editás todo", d: "Cada línea, cada sección, el orden. Nada queda fijo." },
        { icon: MonitorSmartphone, t: "Vista previa en vivo", d: "Ves el PDF final mientras escribís, en la compu o el celular." },
        { icon: Languages, t: "Español e inglés", d: "El CV y la carta cambian de idioma con un clic." },
        { icon: Wand2, t: "Carta automática", d: "Escribí la empresa y el puesto: la carta se arma sola desde tu CV." },
        { icon: FileCheck2, t: "Amigable con ATS", d: "La plantilla Clásico usa texto limpio que los filtros leen bien." },
        { icon: Lock, t: "Privado y sin cuenta", d: "Tus datos se quedan en tu navegador. Exportás un .json cuando querás." },
      ]
    : [
        { icon: PenLine, t: "Edit everything", d: "Every line, every section, the order. Nothing is locked." },
        { icon: MonitorSmartphone, t: "Live preview", d: "See the final PDF as you type, on desktop or phone." },
        { icon: Languages, t: "Spanish & English", d: "The CV and letter switch language with one click." },
        { icon: Wand2, t: "Automatic cover letter", d: "Type the company and role: the letter builds itself from your CV." },
        { icon: FileCheck2, t: "ATS-friendly", d: "The Classic template uses clean text that filters parse well." },
        { icon: Lock, t: "Private, no account", d: "Your data stays in your browser. Export a .json anytime." },
      ];

  const faqs = isEs
    ? [
        ["¿Cómo pago el plan Pro?", "Con SINPE Móvil o transferencia. Enviás el comprobante por WhatsApp y te devolvemos un código que desbloquea todo en tu navegador. También hay PayPal a pedido."],
        ["¿Necesito crear una cuenta?", "No. Todo funciona en el navegador y tus datos se guardan solo en tu dispositivo."],
        ["¿El PDF pasa los filtros de las empresas?", "La plantilla Clásico está pensada para eso: una columna, texto seleccionable y encabezados estándar."],
        ["¿Puedo editar el CV después de descargarlo?", "Sí. Volvés al editor cuando querás; tus cambios quedan guardados. Podés exportar e importar tus datos."],
        ["¿Sirve para aplicar a trabajos fuera de Costa Rica?", "Sí. Cambiás el idioma del CV a inglés y ajustás el formato de fechas y teléfono."],
      ]
    : [
        ["How do I pay for Pro?", "SINPE Móvil or bank transfer. Send the receipt on WhatsApp and we reply with a code that unlocks everything in your browser. PayPal available on request."],
        ["Do I need an account?", "No. Everything runs in the browser and your data is stored only on your device."],
        ["Will the PDF pass company filters?", "The Classic template is built for that: single column, selectable text, standard headings."],
        ["Can I edit the CV after downloading?", "Yes. Come back to the editor anytime; your changes are saved. You can export and import your data."],
        ["Does it work for jobs outside Costa Rica?", "Yes. Switch the CV language to English and adjust date and phone formats."],
      ];

  return (
    <main className="min-h-screen bg-white font-[family-name:var(--font-manrope)] text-zinc-800">
      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <span className="font-[family-name:var(--font-bricolage)] text-[15px] font-black tracking-tight text-zinc-900">
            CV Express
          </span>
          <span className="hidden text-[11px] font-semibold uppercase tracking-wide text-teal-600 sm:inline">
            {isEs ? "Crear tu CV" : "Build your CV"}
          </span>
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
              className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-teal-700"
            >
              {isEs ? "Crear mi CV" : "Build my CV"}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
              <Globe2 size={12} className="text-teal-600" />
              {isEs ? "Hecho en Costa Rica" : "Made in Costa Rica"}
            </span>
            <h1 className="mt-4 font-[family-name:var(--font-bricolage)] text-[clamp(2.4rem,6vw,4rem)] font-black leading-[0.98] tracking-tight text-zinc-900">
              {isEs ? (
                <>Tu CV y tu carta de presentación, listos en minutos.</>
              ) : (
                <>Your résumé and cover letter, ready in minutes.</>
              )}
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-600">
              {isEs
                ? "Agregás tus datos, elegís un estilo y descargás el PDF. Editás todo, ves el resultado en vivo y tenés una carta que se arma sola. Empezá gratis."
                : "Add your details, pick a style, and download the PDF. Edit everything, see it live, and get a cover letter that writes itself. Start free."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/crear-cv/editor"
                className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-3 text-[14px] font-bold text-white transition-colors hover:bg-teal-700"
              >
                {isEs ? "Crear mi CV gratis" : "Build my CV free"}
                <ArrowRight size={16} />
              </Link>
              <a
                href="#plantillas"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-6 py-3 text-[14px] font-bold text-zinc-800 transition-colors hover:border-zinc-900"
              >
                {isEs ? "Ver plantillas" : "See templates"}
              </a>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] font-semibold text-zinc-500">
              {[
                isEs ? "Sin cuenta" : "No account",
                isEs ? "Español e inglés" : "Spanish & English",
                isEs ? "Tus datos en tu navegador" : "Data stays in your browser",
              ].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <Check size={14} className="text-teal-600" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* hero preview */}
          <div className="relative mx-auto w-full max-w-[420px]">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 p-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)]">
              <div className="h-[440px] overflow-hidden rounded-lg">
                <div className="origin-top-left" style={{ transform: "scale(0.48)", width: 816 }}>
                  <ResumeSheet
                    data={data}
                    settings={{ template: "moderno", accent: ACCENTS[0], cvLang: lang, fontScale: 1, paper: "letter" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="border-y border-zinc-200 bg-zinc-50 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-[family-name:var(--font-bricolage)] text-3xl font-black tracking-tight text-zinc-900">
            {isEs ? "Tres pasos" : "Three steps"}
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.t} className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-[13px] font-black text-white">
                    {i + 1}
                  </span>
                  <s.icon size={18} className="text-teal-600" />
                </div>
                <h3 className="mt-4 text-[16px] font-bold text-zinc-900">{s.t}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* templates */}
      <section id="plantillas" className="scroll-mt-16 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-bricolage)] text-3xl font-black tracking-tight text-zinc-900">
                {isEs ? "Plantillas" : "Templates"}
              </h2>
              <p className="mt-1.5 text-[13px] text-zinc-500">
                {isEs
                  ? "Dos gratis, cinco en total. Cambiás cuando querás sin perder tus datos."
                  : "Two free, five in total. Switch anytime without losing your data."}
              </p>
            </div>
            <Link
              href="/crear-cv/editor"
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-teal-700 hover:text-teal-900"
            >
              {isEs ? "Probar en el editor" : "Try in the editor"}
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {TEMPLATE_ORDER.map((id) => (
              <TemplateThumb key={id} id={id} lang={lang} isEs={isEs} data={data} />
            ))}
          </div>
        </div>
      </section>

      {/* features */}
      <section className="border-y border-zinc-200 bg-zinc-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-bricolage)] text-3xl font-black tracking-tight text-zinc-900">
            {isEs ? "Todo lo que necesitás para aplicar" : "Everything you need to apply"}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.t} className="rounded-2xl border border-zinc-200 bg-white p-5">
                <f.icon size={18} className="text-teal-600" />
                <h3 className="mt-3 text-[15px] font-bold text-zinc-900">{f.t}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-zinc-600">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* pricing */}
      <section id="precios" className="scroll-mt-16 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-bricolage)] text-3xl font-black tracking-tight text-zinc-900">
              {isEs ? "Precios" : "Pricing"}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-[13px] text-zinc-500">
              {isEs
                ? "Armá y descargá tu CV gratis. Pagás una sola vez si querés todas las plantillas y quitar la marca."
                : "Build and download your CV for free. Pay once if you want every template and no watermark."}
            </p>
          </div>
          <div className="mt-9">
            <PricingCards lang={lang} />
          </div>
          <p className="mt-4 text-center text-[11.5px] text-zinc-400">
            {isEs
              ? "Precios en colones. El pago se coordina por WhatsApp con SINPE Móvil o transferencia."
              : "Prices in Costa Rican colones. Payment is arranged over WhatsApp via SINPE Móvil or transfer."}
          </p>
        </div>
      </section>

      {/* faq */}
      <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-bricolage)] text-3xl font-black tracking-tight text-zinc-900">
            {isEs ? "Preguntas frecuentes" : "FAQ"}
          </h2>
          <div className="mt-6 space-y-2.5">
            {faqs.map(([q, a]) => (
              <details key={q} className="group rounded-xl border border-zinc-200 bg-white px-4 py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 text-[14px] font-bold text-zinc-900 marker:content-none">
                  {q}
                  <Plus size={16} className="shrink-0 text-teal-600 transition-transform group-open:rotate-45" />
                </summary>
                <p className="border-t border-zinc-100 pb-4 pt-3 text-[13px] leading-relaxed text-zinc-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* final cta */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-zinc-900 p-8 text-center sm:p-12">
          <ShieldCheck size={26} className="mx-auto text-teal-400" />
          <h2 className="mt-4 font-[family-name:var(--font-bricolage)] text-[clamp(1.8rem,4vw,2.75rem)] font-black leading-tight tracking-tight text-white">
            {isEs ? "Tu próximo trabajo empieza con un buen CV." : "Your next job starts with a solid CV."}
          </h2>
          <Link
            href="/crear-cv/editor"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal-500 px-7 py-3.5 text-[14px] font-bold text-zinc-950 transition-colors hover:bg-teal-400"
          >
            {isEs ? "Crear mi CV gratis" : "Build my CV free"}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-200 px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-[12px] text-zinc-500">
          <span>
            CV Express · {isEs ? "Crear tu CV en Costa Rica" : "Build your CV in Costa Rica"}
          </span>
          <div className="flex items-center gap-4">
            <Link href="/crear-cv/precios" className="font-semibold hover:text-zinc-900">
              {isEs ? "Precios" : "Pricing"}
            </Link>
            <Link href="/" className="font-semibold hover:text-zinc-900">
              La Vieja Adventures
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function TemplateThumb({
  id,
  lang,
  isEs,
  data,
}: {
  id: TemplateId;
  lang: "es" | "en";
  isEs: boolean;
  data: ReturnType<typeof sampleResume>;
}) {
  const meta = TEMPLATE_META[id];
  const settings: ResumeSettings = {
    template: id,
    accent: ACCENTS[0],
    cvLang: lang,
    fontScale: 1,
    paper: "letter",
  };
  return (
    <Link
      href="/crear-cv/editor"
      className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-lg"
    >
      <div className="relative h-[230px] overflow-hidden border-b border-zinc-100 bg-zinc-100">
        <div className="origin-top-left" style={{ transform: "scale(0.235)", width: 816 }}>
          <ResumeSheet data={data} settings={settings} />
        </div>
        {!isFreeTemplate(id) && (
          <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-zinc-900/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
            <Sparkles size={9} /> Pro
          </span>
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className="text-[13px] font-bold text-zinc-900">{meta[lang]}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
          {isEs ? meta.blurbEs : meta.blurbEn}
        </p>
      </div>
    </Link>
  );
}
