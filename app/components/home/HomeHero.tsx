"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Bot,
  Clock3,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { BOOKING_HREF, WHATSAPP_HREF, primaryBookingLabel } from "./home-utils";

export default function HomeHero() {
  const { lang } = useLanguage();
  const isEs = lang === "es";

  const facts = isEs
    ? [
        { icon: MapPin, value: "San Carlos", label: "Sucre de Ciudad Quesada" },
        { icon: Users, value: "Grupos pequeños", label: "Guía local bilingüe" },
        { icon: Clock3, value: "3–4 horas", label: "Sendero, cañón y Cascada El Zafiro" },
        { icon: ShieldCheck, value: "Reserva flexible", label: "Cancelación gratis hasta 48 h antes" },
      ]
    : [
        { icon: MapPin, value: "San Carlos", label: "Sucre de Ciudad Quesada" },
        { icon: Users, value: "Small groups", label: "Local bilingual guide" },
        { icon: Clock3, value: "3–4 hours", label: "Trail, canyon & El Zafiro Waterfall" },
        { icon: ShieldCheck, value: "Flexible booking", label: "Free cancellation up to 48h before" },
      ];

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#2E2A25] text-white">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/hero/ciudad-esmeralda-poster.jpg"
        aria-hidden="true"
      >
        <source src="/hero/ciudad-esmeralda-hero.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,12,11,.52)_0%,rgba(8,10,9,.12)_33%,rgba(7,9,8,.55)_72%,rgba(6,7,6,.96)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_10%,rgba(0,0,0,.22)_72%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-black/28 to-transparent" />

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[1600px] flex-col px-4 pb-5 pt-28 sm:px-7 md:pt-32 lg:px-10">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] backdrop-blur-md sm:text-xs">
            <MapPin size={13} className="text-[#00C4B0]" />
            {isEs ? "San Carlos · Costa Rica" : "San Carlos · Costa Rica"}
          </span>
          <span className="hidden items-center gap-2 rounded-full border border-[#00C4B0]/40 bg-black/25 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md sm:inline-flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#00C4B0]" />
            {isEs ? "Reserva en línea" : "Book online"}
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center pb-28 pt-12 text-center sm:pb-32">
          <p className="mb-4 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.32em] text-white/80 sm:text-xs">
            <span className="h-px w-8 bg-[#00C4B0]" />
            {isEs ? "Cañón del Río La Vieja" : "La Vieja River Canyon"}
            <span className="h-px w-8 bg-[#00C4B0]" />
          </p>

          <h1 className="max-w-[1300px] font-display text-[clamp(3.5rem,10.7vw,10.5rem)] font-black uppercase leading-[0.78] tracking-[-0.075em] drop-shadow-[0_8px_30px_rgba(0,0,0,.42)]">
            {isEs ? "CIUDAD" : "EMERALD"}
            <span className="mt-2 block text-[#00C4B0]">
              {isEs ? "ESMERALDA" : "CITY"}
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-balance text-sm font-semibold leading-relaxed text-white/85 sm:text-base md:text-lg">
            {isEs
              ? "El cañón insignia de La Vieja Adventures: sendero, río y las pozas turquesa de la Cascada El Zafiro, con guía local bilingüe y grupos pequeños. Si el clima cambia, ajustamos la ruta o le reprogramamos sin costo."
              : "La Vieja Adventures' signature canyon: trail, river, and the turquoise pools of El Zafiro Waterfall, with a local bilingual guide and small groups. If the weather turns, we adjust the route or rebook you at no cost."}
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <Link
              href={BOOKING_HREF}
              className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#00C4B0] px-7 text-xs font-black uppercase tracking-[0.12em] text-[#17211f] shadow-[0_18px_50px_rgba(0,196,176,.28)] transition hover:-translate-y-0.5 hover:bg-white"
            >
              {primaryBookingLabel(isEs)}
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-white/30 bg-black/22 px-7 text-xs font-black uppercase tracking-[0.12em] text-white backdrop-blur-md transition hover:border-white/60 hover:bg-white/12"
            >
              <MessageCircle size={17} />
              {isEs ? "Hablar con un guía" : "Talk to a guide"}
            </a>
            <Link
              href="/ai?from=hero"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-[#00C4B0]/60 bg-[#00C4B0]/12 px-7 text-xs font-black uppercase tracking-[0.12em] text-[#79f4e7] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-[#00C4B0] hover:bg-[#00C4B0]/22"
            >
              <Bot size={17} aria-hidden />
              {isEs ? "Planear con Vero (IA)" : "Plan with Vero (AI)"}
            </Link>
          </div>
        </div>

        <div className="absolute inset-x-4 bottom-5 hidden overflow-hidden rounded-[1.6rem] border border-white/15 bg-black/46 shadow-[0_24px_80px_rgba(0,0,0,.34)] backdrop-blur-xl sm:inset-x-7 sm:block lg:inset-x-10">
          <div className="grid sm:grid-cols-[1.35fr_repeat(3,1fr)]">
            <div className="flex min-h-24 items-center justify-between gap-5 border-b border-white/12 p-5 sm:border-b-0 sm:border-r sm:p-6">
              <div>
                <p className="text-sm font-bold leading-relaxed text-white/82">
                  {isEs
                    ? "Reserve en línea y reciba la confirmación al instante."
                    : "Book online and get your confirmation instantly."}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#00C4B0]">
                  {isEs
                    ? "Pago seguro · Cancelación gratis hasta 48 h antes"
                    : "Secure payment · Free cancellation up to 48h before"}
                </p>
              </div>
              <ArrowDown size={18} className="hidden shrink-0 text-[#00C4B0] md:block" />
            </div>
            {facts.slice(1).map(({ icon: Icon, value, label }) => (
              <div
                key={value}
                className="hidden min-h-24 items-center gap-3 border-r border-white/12 p-5 last:border-r-0 sm:flex lg:p-6"
              >
                <Icon size={18} className="shrink-0 text-[#00C4B0]" />
                <div className="min-w-0">
                  <strong className="block text-xs font-black uppercase tracking-wide">{value}</strong>
                  <span className="mt-1 block text-[10px] font-semibold text-white/55">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}
