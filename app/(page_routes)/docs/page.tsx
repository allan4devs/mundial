"use client";

import DynamicHeroHeader from "@/app/components/sections/DynamicHeroHeader";
import { useLanguage } from "@/lib/LanguageContext";
import {
  BookOpen,
  Building2,
  CalendarCheck2,
  CircleHelp,
  Compass,
  CreditCard,
  Sparkles,
  LayoutDashboard,
  Map,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";

const steps = {
  es: [
    {
      title: "Mirate los tours",
      description:
        "En Tours ves duración, nivel y qué se siente cada salida. Si no sabés si el cañón te da, empezá por algo más suave o preguntá.",
      href: "/tours",
      cta: "Ver tours",
      icon: Compass,
    },
    {
      title: "O chateá con la IA",
      description:
        "En AI escribís como en WhatsApp: fecha, grupo, dudas. Te guía paso a paso antes de pagar.",
      href: "/ai",
      cta: "Abrir asistente",
      icon: Sparkles,
    },
    {
      title: "Elegí fecha y paquete",
      description:
        "En Reservar marcás un día con cupo y el paquete que te calza (esencial, día completo o privado).",
      href: "/reservar",
      cta: "Ir a reservar",
      icon: CalendarCheck2,
    },
    {
      title: "Datos y pago",
      description:
        "Nombre, correo, teléfono, revisás el resumen y pagás con PayPal. Confirmación al correo.",
      href: "/reservar",
      cta: "Empezar reserva",
      icon: CreditCard,
    },
    {
      title: "Ubicación, clima y WhatsApp",
      description:
        "Antes de salir, mirá Info y Tiempo. Si el río viene alto o te perdés en el mapa, escribinos.",
      href: "/info",
      cta: "Ver información",
      icon: Map,
    },
  ],
  en: [
    {
      title: "Browse the tours",
      description:
        "On Tours you'll see duration, level, and what each day feels like. Not sure about the canyon? Start gentler or ask us.",
      href: "/tours",
      cta: "View tours",
      icon: Compass,
    },
    {
      title: "Or chat with the AI",
      description:
        "In AI you write like a normal message: date, group, questions. It walks you through before you pay.",
      href: "/ai",
      cta: "Open assistant",
      icon: Sparkles,
    },
    {
      title: "Pick date and package",
      description:
        "On Book, choose a day with space and the package that fits (essential, full-day, or private).",
      href: "/reservar",
      cta: "Go to booking",
      icon: CalendarCheck2,
    },
    {
      title: "Details and pay",
      description:
        "Name, email, phone, check the summary, pay with PayPal. Confirmation hits your inbox.",
      href: "/reservar",
      cta: "Start booking",
      icon: CreditCard,
    },
    {
      title: "Location, weather, WhatsApp",
      description:
        "Before you drive, check Info and Weather. River high or map confusing? Message us.",
      href: "/info",
      cta: "View info",
      icon: Map,
    },
  ],
} as const;

const tools = {
  es: [
    {
      title: "Dashboard de reservas",
      description:
        "Tus reservas, el estado del pago y lo que necesitás el día del tour, en un solo lugar.",
      href: "/dashboard",
      cta: "Abrir dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Portal B2B (operadores)",
      description:
        "Si trabajás con agencias o grupos, acá manejás reservas de clientes y el catálogo de tours.",
      href: "/b2b/login",
      cta: "Entrar al B2B",
      icon: Building2,
    },
    {
      title: "Asistente IA",
      description:
        "Fecha, horario, paquete y datos del viajero en una charla. Ideal si no querés pelear con formularios largos.",
      href: "/ai",
      cta: "Ir a AI",
      icon: Sparkles,
    },
    {
      title: "Preguntas frecuentes",
      description:
        "Pagos, qué llevar, cancelación y otras dudas de antes de meterse al río.",
      href: "/preguntas-frecuentes",
      cta: "Ver preguntas",
      icon: CircleHelp,
    },
  ],
  en: [
    {
      title: "Booking dashboard",
      description:
        "Your bookings, payment status, and what you need on tour day — one place.",
      href: "/dashboard",
      cta: "Open dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "B2B portal (operators)",
      description:
        "If you work with agencies or groups, manage client bookings and the tour catalog here.",
      href: "/b2b/login",
      cta: "Go to B2B",
      icon: Building2,
    },
    {
      title: "AI assistant",
      description:
        "Date, time, package, and traveler details in one chat. Handy if you hate long forms.",
      href: "/ai",
      cta: "Open AI",
      icon: Sparkles,
    },
    {
      title: "FAQ",
      description:
        "Payments, what to pack, cancellation, and other pre-river questions.",
      href: "/preguntas-frecuentes",
      cta: "View FAQs",
      icon: CircleHelp,
    },
  ],
} as const;

export default function DocsPage() {
  const { lang } = useLanguage();
  const copy = lang === "es" ? steps.es : steps.en;
  const toolCopy = lang === "es" ? tools.es : tools.en;

  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-50 via-zinc-50 to-white px-4 py-10 dark:from-black dark:via-zinc-950 dark:to-zinc-900">
      <DynamicHeroHeader showHeroSlider={false} />

      <section className="mx-auto mt-4 w-full max-w-6xl rounded-3xl border border-teal-100 bg-white/90 p-8 shadow-xl backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90 md:p-10">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1 text-sm font-semibold text-teal-700 dark:border-teal-800/70 dark:bg-teal-900/20 dark:text-teal-300">
          <BookOpen size={16} />
          {lang === "es" ? "Centro de ayuda" : "Help center"}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white md:text-4xl">
          {lang === "es" ? "Cómo se usa el sitio (sin enredo)" : "How the site works (no fuss)"}
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-700 dark:text-zinc-300">
          {lang === "es"
            ? "Elegí tour, fecha y pagá. Abajo tenés el mapa corto de cada sección y a dónde ir si te trabás."
            : "Pick a tour, a date, and pay. Below is the short map of each section — and where to go if you get stuck."}
        </p>
      </section>

      <section className="mx-auto mt-6 grid w-full max-w-6xl gap-5 md:grid-cols-2">
        {copy.map((step, index) => {
          const Icon = step.icon;
          return (
            <article
              key={step.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-full bg-teal-100 p-2 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                  <Icon size={18} />
                </div>
                <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  {lang === "es" ? `Paso ${index + 1}` : `Step ${index + 1}`}
                </p>
              </div>

              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{step.title}</h2>
              <p className="mt-3 text-zinc-700 dark:text-zinc-300">{step.description}</p>

              <Link
                href={step.href}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                {step.cta}
              </Link>
            </article>
          );
        })}
      </section>

      <section className="mx-auto mt-6 w-full max-w-6xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
          {lang === "es" ? "Más herramientas útiles" : "More helpful tools"}
        </h3>
        <p className="mt-2 text-zinc-700 dark:text-zinc-300">
          {lang === "es"
            ? "Además de la reserva rápida, también puedes usar estas secciones para gestionar mejor tu experiencia."
            : "Beyond quick booking, you can also use these sections to better manage your experience."}
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {toolCopy.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50"
              >
                <div className="mb-3 inline-flex rounded-full bg-teal-100 p-2 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                  <Icon size={18} />
                </div>
                <h4 className="text-lg font-semibold text-zinc-900 dark:text-white">{item.title}</h4>
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{item.description}</p>
                <Link
                  href={item.href}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                >
                  {item.cta}
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-6 w-full max-w-6xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
          {lang === "es" ? "¿Necesitas ayuda personalizada?" : "Need personalized help?"}
        </h3>
        <p className="mt-2 text-zinc-700 dark:text-zinc-300">
          {lang === "es"
            ? "Nuestro equipo responde rápido por WhatsApp para dudas sobre disponibilidad, transporte o recomendaciones."
            : "Our team quickly responds on WhatsApp for questions about availability, transport, or recommendations."}
        </p>
        <a
          href="https://wa.me/50662332535"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <MessageCircle size={16} />
          {lang === "es" ? "Escribir por WhatsApp" : "Chat on WhatsApp"}
        </a>
      </section>
    </main>
  );
}
