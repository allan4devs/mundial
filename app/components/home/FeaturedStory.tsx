"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Clock3, Sparkles, Star } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import type { TourSummary } from "@/lib/types/index";
import { BOOKING_HREF, TOURS_HREF, primaryBookingLabel } from "./home-utils";

type Props = {
  tours: TourSummary[];
};

export default function FeaturedStory({ tours }: Props) {
  const { lang } = useLanguage();
  const isEs = lang === "es";

  if (tours.length === 0) return null;
  const featuredTour = tours[0];

  const inclusions = isEs
    ? [
        "Sendero, río y cañón en una sola salida",
        "Cascada El Zafiro y pozas de agua turquesa",
        "Guía local bilingüe y charla de seguridad clara",
        "Ruta que se ajusta al clima y al nivel del río",
      ]
    : [
        "Trail, river, and canyon in a single outing",
        "El Zafiro Waterfall and turquoise pools",
        "Local bilingual guide and a clear safety briefing",
        "Route adjusts to the weather and river level",
      ];

  const steps = [
    {
      num: "01",
      title: isEs ? "Elija la fecha y el tamaño del grupo" : "Choose the date and group size",
      body: isEs
        ? "Ciudad Esmeralda es una salida fija: indíquenos el día y cuántas personas asistirán."
        : "Ciudad Esmeralda is a set departure — just tell us the day and how many will join.",
    },
    {
      num: "02",
      title: isEs ? "Confirme y pague en línea" : "Confirm and pay online",
      body: isEs
        ? "Pago seguro y confirmación en su correo de inmediato."
        : "Secure payment, and your confirmation email arrives right away.",
    },
    {
      num: "03",
      title: isEs ? "Viva el cañón" : "Into the canyon",
      body: isEs
        ? "Llega, conoce a su guía y entra al bosque. El ritmo y la ruta se adaptan a su grupo y a las condiciones del río ese día."
        : "You arrive, meet your guide, and head into the forest. Pace and route adapt to your group and the river conditions that day.",
    },
  ];

  return (
    <section className="bg-white py-20 dark:bg-[#0b0a09] md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem]">
              <Image
                src="/image/IMG_4671.jpg"
                alt={isEs ? "Cañón de Ciudad Esmeralda en Costa Rica" : "Ciudad Esmeralda Canyon in Costa Rica"}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>

            <span className="absolute left-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-stone-900 shadow-lg backdrop-blur-sm">
              <Sparkles size={13} className="text-amber-500" />
              {isEs ? "La de la casa" : "Our house favorite"}
            </span>

            <div className="absolute -bottom-6 right-4 w-56 rounded-2xl bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:bg-stone-900 dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] dark:ring-1 dark:ring-white/10 sm:right-8 sm:w-64">
              <span className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} className="fill-current" />
                ))}
              </span>
              <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-300">
                {isEs
                  ? "“Salimos mojados, cansados y ya queriendo volver. Las pozas se ven de mentira.”"
                  : "“We left wet, tired, and already wanting to come back. Those pools look unreal.”"}
              </p>
              <p className="mt-2 text-[11px] font-bold text-stone-900 dark:text-stone-100">— María F.</p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">
              {isEs ? "San Carlos · Juan Castro Blanco" : "San Carlos · Juan Castro Blanco"}
            </p>
            <h2 className="font-display text-balance text-4xl font-bold leading-[1.02] tracking-tight text-stone-900 dark:text-stone-50 md:text-5xl">
              {isEs ? "Del sendero a la Cascada El Zafiro" : "From the trail to El Zafiro Waterfall"}
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-stone-600 dark:text-stone-300 md:text-lg">
              {isEs
                ? "Es la salida que más nos piden: barro en las botas, agua hasta las rodillas y el cañón abriéndose hasta la cascada. No es un paseo de fotos: exige buena condición física. Y si el clima no acompaña, ajustamos la ruta o le reprogramamos la reserva."
                : "It's the day people ask for most: mud on your boots, water to your knees, and the canyon opening up to the falls. Not a photo stroll — it takes real fitness. And if the weather doesn't cooperate, we adjust the route or rebook you."}
            </p>

            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {inclusions.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-stone-700 dark:text-stone-200">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                    <Check size={12} className="text-emerald-700 dark:text-emerald-300" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <div>
                <span className="block text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
                  {isEs ? "Recorrido" : "Route"}
                </span>
                <span className="font-display text-3xl font-bold text-stone-900 dark:text-stone-50">
                  {isEs ? "3,5 km" : "3.5 km"}
                </span>
                <span className="ml-1.5 text-sm text-stone-500 dark:text-stone-400">
                  {isEs ? "de sendero, río y cañón" : "of trail, river and canyon"}
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3.5 py-2 text-xs font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                <Clock3 size={13} />
                {featuredTour.duration || (isEs ? "Duración por confirmar" : "Duration to confirm")}
              </span>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={BOOKING_HREF}
                className="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5 hover:bg-emerald-500"
              >
                {primaryBookingLabel(isEs)}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href={TOURS_HREF}
                className="group inline-flex items-center gap-2 rounded-full border-2 border-emerald-600 px-7 py-3.5 text-sm font-black text-emerald-800 transition-all hover:-translate-y-0.5 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
              >
                {isEs ? "Explorar otros tours" : "Explore other tours"}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-24 md:mt-32">
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">
              {isEs ? "Reserva sencilla" : "Simple booking"}
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50 md:text-4xl">
              {isEs ? "De la reserva al cañón en tres pasos" : "From booking to canyon in three steps"}
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.num}
                className="rounded-3xl border border-stone-200 bg-[#FAF9F6] p-8 transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:border-stone-800 dark:bg-white/[0.03] dark:hover:border-emerald-500/40"
              >
                <span className="font-display text-sm font-bold text-emerald-700 dark:text-emerald-300">{step.num}</span>
                <h3 className="font-display mt-3 text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
