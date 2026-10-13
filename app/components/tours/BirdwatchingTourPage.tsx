"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Backpack,
  Binoculars,
  Bird,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cloud,
  Expand,
  HelpCircle,
  Info,
  MapPin,
  MessageCircle,
  Play,
  Route,
  ShieldCheck,
  Sparkles,
  Star,
  TreePine,
  Users,
  Waves,
  X,
} from "lucide-react";
import DynamicHeroHeader from "@/app/components/sections/DynamicHeroHeader";
import { WHATSAPP_HREF } from "@/app/components/home/home-utils";
import {
  BIRDWATCHING_GALLERY,
  BIRDWATCHING_HABITATS,
  BIRDWATCHING_IMAGE_CREDITS,
  BIRDWATCHING_LEARNING,
  BIRDWATCHING_SPECIES,
  BIRDWATCHING_STATS,
  BIRDWATCHING_TESTIMONIALS,
  BIRDWATCHING_VIDEOS,
  LIKELIHOOD_LABELS,
  type BirdHabitat,
} from "@/lib/birdwatching-content";
import type { TourContent } from "@/lib/tour-content";
import type { TourPackageOption } from "@/lib/types/index";

type TourDetail = {
  slug: string;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  details: string;
  duration: string;
  difficulty: string;
  location: string;
  priceCRC: number;
  tagEs: string;
  inclusions: string[];
  packages: TourPackageOption[];
};

type Props = {
  tour: TourDetail;
  content: TourContent;
};

const ASPECTS = ["aspect-[3/4]", "aspect-square", "aspect-[4/3]", "aspect-[3/4]", "aspect-[4/5]", "aspect-square"];

function formatPriceCRC(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "Consultar";
  return `CRC ${value.toLocaleString("es-CR").replace(/,/g, ".")}`;
}

function HabitatIcon({ icon }: { icon: BirdHabitat["icon"] }) {
  const cls = "h-5 w-5 text-emerald-300";
  if (icon === "river") return <Waves className={cls} aria-hidden />;
  if (icon === "cloud") return <Cloud className={cls} aria-hidden />;
  if (icon === "farm") return <Bird className={cls} aria-hidden />;
  return <TreePine className={cls} aria-hidden />;
}

export default function BirdwatchingTourPage({ tour, content }: Props) {
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeVideo, setActiveVideo] = useState(BIRDWATCHING_VIDEOS[0]?.youtubeId ?? "");

  const bookingHref = `/reservar?tour=${encodeURIComponent(tour.slug)}`;
  const bookingHrefForPackage = (packageId?: string | null) => {
    const packageParam = packageId ? `&package=${encodeURIComponent(packageId)}` : "";
    return `/reservar?tour=${encodeURIComponent(tour.slug)}${packageParam}`;
  };

  const heroImage = BIRDWATCHING_GALLERY[0] ?? "/image/IMG_6810.jpg";
  const title = tour.titleEs || "Avistamiento de Aves";

  useEffect(() => {
    const onScroll = () => setShowStickyBar(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const showPrev = useCallback(() => {
    setLightboxIndex((current) =>
      current === null ? null : (current - 1 + BIRDWATCHING_GALLERY.length) % BIRDWATCHING_GALLERY.length
    );
  }, []);

  const showNext = useCallback(() => {
    setLightboxIndex((current) =>
      current === null ? null : (current + 1) % BIRDWATCHING_GALLERY.length
    );
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showPrev();
      if (event.key === "ArrowRight") showNext();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIndex, closeLightbox, showPrev, showNext]);

  return (
    <main className="min-h-screen bg-[#060a08] text-white">
      <DynamicHeroHeader showHeroSlider={false} />

      {/* Hero */}
      <section className="relative min-h-[88vh] overflow-hidden pt-24">
        <Image src={heroImage} alt={title} fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060a08] via-[#060a08]/75 to-[#060a08]/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(52,211,153,0.18),transparent_35%)]" />

        <div className="container relative z-10 mx-auto flex min-h-[80vh] max-w-7xl flex-col justify-end px-4 pb-12 md:px-8">
          <Link
            href="/#tours"
            className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-black/45 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80 backdrop-blur transition hover:border-emerald-300 hover:text-emerald-200"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Tours
          </Link>

          <div className="max-w-4xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 backdrop-blur">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
              <span className="text-xs font-bold uppercase tracking-wide text-emerald-200">
                {tour.tagEs || "Tour estrella"} · Corredor Juan Castro Blanco
              </span>
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-[0.95] text-white sm:text-6xl lg:text-7xl">
              {title}
            </h1>
            <p className="mt-2 text-lg font-bold italic text-emerald-300/90 md:text-xl">{content.tagline}</p>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-200 md:text-lg">
              {tour.details || tour.descriptionEs}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={bookingHref}
                className="inline-flex min-h-14 items-center gap-2 rounded-full bg-emerald-400 px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-emerald-950 shadow-[0_20px_55px_rgba(52,211,153,0.28)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                Reservar avistamiento
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-14 items-center gap-2 rounded-full border border-white/25 bg-white/8 px-6 py-4 text-sm font-bold text-white backdrop-blur transition hover:border-white/50 hover:bg-white/14"
              >
                <MessageCircle className="h-4 w-4 text-emerald-300" aria-hidden />
                Hablar con un guía
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-white/10 bg-emerald-950/30">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-white/10 md:grid-cols-4">
          {BIRDWATCHING_STATS.map((stat) => (
            <div key={stat.label} className="bg-[#060a08] px-6 py-8 text-center">
              <p className="text-3xl font-black text-emerald-300 md:text-4xl">{stat.value}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick info + inline CTA */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 md:grid-cols-4 md:px-8">
        <InfoCard icon={<Clock className="h-4 w-4" />} label="Duración" value={tour.duration || "2 horas"} />
        <InfoCard icon={<ShieldCheck className="h-4 w-4" />} label="Nivel" value={tour.difficulty || "Fácil"} />
        <InfoCard icon={<MapPin className="h-4 w-4" />} label="Ubicación" value={tour.location || "Juan Castro Blanco"} />
        <InfoCard icon={<Users className="h-4 w-4" />} label="Desde" value={formatPriceCRC(tour.priceCRC)} />
      </section>

      {/* Overview */}
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionHeading icon={<Binoculars className="h-6 w-6" />} title="La experiencia completa" />
            <div className="mt-6 space-y-4">
              {content.overview.map((paragraph, index) => (
                <p key={index} className="text-base leading-relaxed text-zinc-300 md:text-lg">
                  {paragraph}
                </p>
              ))}
            </div>

            {content.highlights.length > 0 && (
              <div className="mt-8 rounded-3xl border border-emerald-400/15 bg-emerald-400/[0.04] p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-white">
                  <Sparkles className="h-5 w-5 text-emerald-300" aria-hidden />
                  Lo mejor del tour
                </h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {content.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                      <span className="text-sm leading-relaxed text-zinc-200">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8">
              <Link
                href={bookingHref}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-emerald-950 transition hover:bg-white"
              >
                Ver disponibilidad
                <CalendarDays className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {BIRDWATCHING_GALLERY.slice(1, 5).map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setLightboxIndex(index + 1)}
                className={`group relative overflow-hidden rounded-2xl border border-white/10 ${index === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square"}`}
              >
                <Image src={image} alt={`${title} ${index + 2}`} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />
                <Expand className="absolute bottom-3 right-3 h-4 w-4 text-white opacity-0 transition group-hover:opacity-100" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Videos */}
      <section className="border-y border-white/10 bg-white/[0.02] py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <SectionHeading icon={<Play className="h-6 w-6" />} title="Videos del recorrido" />
          <p className="mt-3 max-w-2xl text-base text-zinc-400">
            Mirá cómo es una mañana real de avistamiento: senderos, guías, cantos al amanecer y el paisaje del corredor biológico.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
              <div className="aspect-video w-full">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${activeVideo}?rel=0`}
                  title="Video de avistamiento de aves"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {BIRDWATCHING_VIDEOS.map((video) => (
                <button
                  key={video.youtubeId}
                  type="button"
                  onClick={() => setActiveVideo(video.youtubeId)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    activeVideo === video.youtubeId
                      ? "border-emerald-400/50 bg-emerald-400/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/25"
                  }`}
                >
                  <p className="text-sm font-black text-white">{video.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">{video.caption}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Species */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <SectionHeading icon={<Bird className="h-6 w-6" />} title="Especies que podés encontrar" />
        <p className="mt-3 max-w-3xl text-base text-zinc-400">
          El corredor Juan Castro Blanco concentra más de 400 especies registradas. Estas son algunas de las más buscadas y frecuentes en nuestro recorrido — el guía adapta la ruta según la temporada y la actividad del día.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BIRDWATCHING_SPECIES.map((species) => (
            <article
              key={species.scientificName}
              className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition hover:border-emerald-400/25 hover:bg-white/[0.05]"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={species.image}
                  alt={species.commonName}
                  fill
                  sizes="(min-width:1024px) 33vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-black/65 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-200 backdrop-blur">
                  {LIKELIHOOD_LABELS[species.likelihood]}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-black text-white">{species.commonName}</h3>
                <p className="text-xs italic text-emerald-300/80">{species.scientificName}</p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">{species.description}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Hábitat: <span className="text-zinc-300">{species.habitat}</span>
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-emerald-400/20 bg-gradient-to-r from-emerald-950/50 to-transparent p-8 md:flex md:items-center md:justify-between md:gap-8">
          <div>
            <p className="text-lg font-black text-white">¿Querés una lista personalizada por temporada?</p>
            <p className="mt-2 text-sm text-zinc-400">Reservá y el guía te comparte la checklist actualizada del corredor antes de la salida.</p>
          </div>
          <Link
            href={bookingHref}
            className="mt-5 inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-emerald-950 transition hover:bg-white md:mt-0"
          >
            Reservar ahora
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Habitats */}
      <section className="border-y border-white/10 bg-white/[0.02] py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <SectionHeading icon={<TreePine className="h-6 w-6" />} title="Hábitats del corredor biológico" />
          <p className="mt-3 max-w-3xl text-base text-zinc-400">
            La riqueza de aves viene de la mezcla de ecosistemas: bosque nuboso, quebradas, fincas en regeneración y el Parque Nacional del Agua Juan Castro Blanco — un corredor vital entre Monteverde y la Zona Norte.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {BIRDWATCHING_HABITATS.map((habitat) => (
              <div key={habitat.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="flex items-center gap-2 text-lg font-black text-white">
                  <HabitatIcon icon={habitat.icon} />
                  {habitat.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">{habitat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you'll learn */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <SectionHeading icon={<Sparkles className="h-6 w-6" />} title="Qué vas a aprender" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BIRDWATCHING_LEARNING.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
              <span className="text-sm leading-relaxed text-zinc-200">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Full gallery */}
      <section className="border-t border-white/10 py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <SectionHeading icon={<Expand className="h-6 w-6" />} title="Galería de la experiencia" />
          <p className="mt-3 max-w-2xl text-base text-zinc-400">
            Fotografías de referencia de las especies que buscamos en el corredor. Tocá cualquier imagen para verla en grande; la fauna silvestre nunca se garantiza.
          </p>

          <div className="mt-10 columns-2 gap-3 sm:columns-3 lg:columns-4">
            {BIRDWATCHING_GALLERY.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setLightboxIndex(index)}
                className={`group relative mb-3 block w-full overflow-hidden rounded-2xl border border-white/10 ${ASPECTS[index % ASPECTS.length]}`}
              >
                <Image
                  src={image}
                  alt={BIRDWATCHING_SPECIES[index]?.commonName ?? `Ave del corredor ${index + 1}`}
                  fill
                  sizes="(min-width:1024px) 25vw, 50vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/25" />
              </button>
            ))}
          </div>
          <p className="mt-5 text-xs leading-relaxed text-zinc-500">
            Fotografías con licencia abierta vía Wikimedia Commons. {BIRDWATCHING_IMAGE_CREDITS.map((credit, index) => (
              <span key={credit.source}>
                {index > 0 ? " · " : ""}
                <a href={credit.source} target="_blank" rel="noopener noreferrer" className="underline decoration-white/20 underline-offset-2 hover:text-emerald-200">
                  {credit.author} ({credit.license})
                </a>
              </span>
            ))}
          </p>
        </div>
      </section>

      {/* Itinerary */}
      {content.itinerary.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
          <SectionHeading icon={<Route className="h-6 w-6" />} title="Cómo es la mañana" />
          <ol className="relative ml-3 mt-8 space-y-6 border-l border-white/10 pl-6">
            {content.itinerary.map((stop, index) => (
              <li key={index} className="relative">
                <span className="absolute -left-[31px] top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-emerald-300 bg-[#060a08]" aria-hidden>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                </span>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {stop.time && (
                    <span className="rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-xs font-black tabular-nums text-emerald-200">
                      {stop.time}
                    </span>
                  )}
                  <h3 className="text-base font-black text-white">{stop.title}</h3>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{stop.description}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Testimonials */}
      <section className="border-y border-white/10 bg-emerald-950/20 py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <SectionHeading icon={<Star className="h-6 w-6" />} title="Lo que dicen los visitantes" />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {BIRDWATCHING_TESTIMONIALS.map((item) => (
              <blockquote key={item.author} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <span className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" aria-hidden />
                  ))}
                </span>
                <p className="mt-4 text-sm leading-relaxed text-zinc-200">&ldquo;{item.quote}&rdquo;</p>
                <footer className="mt-4 text-xs font-bold text-emerald-300">
                  {item.author} · {item.origin}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Includes / not included */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 md:grid-cols-2 md:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-white">
            <Check className="h-5 w-5 text-emerald-300" aria-hidden />
            Incluye
          </h3>
          <ul className="space-y-3">
            {content.included.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                <span className="text-sm leading-relaxed text-zinc-200">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {content.notIncluded.length > 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-white">
              <X className="h-5 w-5 text-rose-300/80" aria-hidden />
              No incluye
            </h3>
            <ul className="space-y-3">
              {content.notIncluded.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-300/70" aria-hidden />
                  <span className="text-sm leading-relaxed text-zinc-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* What to bring */}
      {(content.whatToBring.length > 0 || content.goodToKnow.length > 0) && (
        <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 md:grid-cols-2 md:px-8">
          {content.whatToBring.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-white">
                <Backpack className="h-5 w-5 text-emerald-300" aria-hidden />
                Qué llevar
              </h3>
              <ul className="space-y-3">
                {content.whatToBring.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                    <span className="text-sm leading-relaxed text-zinc-200">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {content.goodToKnow.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-white">
                <Info className="h-5 w-5 text-emerald-300" aria-hidden />
                Bueno saber antes de ir
              </h3>
              <ul className="space-y-3">
                {content.goodToKnow.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                    <span className="text-sm leading-relaxed text-zinc-200">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Packages */}
      {tour.packages.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
          <SectionHeading title="Paquetes disponibles" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {tour.packages.map((pkg) => (
              <div key={pkg.id ?? pkg.name} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <h3 className="text-lg font-black text-white">{pkg.nameEs || pkg.name}</h3>
                <p className="mt-2 min-h-12 text-sm leading-relaxed text-zinc-400">{pkg.descriptionEs || pkg.descriptionEn}</p>
                <p className="mt-4 text-2xl font-black text-emerald-200">${pkg.price} USD</p>
                <Link
                  href={bookingHrefForPackage(pkg.id)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-400 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-emerald-950 transition hover:bg-white"
                >
                  Seleccionar
                  <CalendarDays className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQs */}
      {content.faqs.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
          <SectionHeading icon={<HelpCircle className="h-6 w-6" />} title="Preguntas frecuentes" />
          <div className="mt-8 space-y-3">
            {content.faqs.map((faq) => (
              <details key={faq.q} className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-base font-bold text-white">
                  {faq.q}
                  <ChevronRight className="h-4 w-4 shrink-0 text-emerald-300 transition-transform group-open:rotate-90" aria-hidden />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Final CTA banner */}
      <section className="mx-auto max-w-7xl px-4 pb-28 md:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-10 shadow-2xl md:p-14">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" aria-hidden />
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-black text-white md:text-4xl">El amanecer no espera. ¿Reservamos tu plaza?</h2>
            <p className="mt-4 text-base leading-relaxed text-emerald-100">
              Salida temprano, guía experto, binoculares y una mañana inolvidable en el corredor biológico más rico de la Zona Norte.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={bookingHref}
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-emerald-900 transition hover:bg-emerald-50"
              >
                Reservar avistamiento
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-4 text-sm font-bold text-white transition hover:bg-white/10"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky booking bar */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-emerald-400/20 bg-[#060a08]/95 px-4 py-3 shadow-[0_-12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-transform duration-300 ${
          showStickyBar ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="min-w-0 hidden sm:block">
            <p className="truncate text-sm font-black text-white">{title}</p>
            <p className="text-xs text-emerald-300">Desde {formatPriceCRC(tour.priceCRC)} · Salida al amanecer</p>
          </div>
          <Link
            href={bookingHref}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-emerald-950 transition hover:bg-white sm:w-auto"
          >
            Reservar ahora
            <CalendarDays className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      {/* Floating WhatsApp */}
      <a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-green-900/40 transition hover:scale-105 hover:bg-[#1ebe5d] md:bottom-8"
        aria-label="Reservar por WhatsApp"
      >
        <MessageCircle className="h-6 w-6" aria-hidden />
      </a>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Galería ampliada"
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={showPrev}
            className="absolute left-3 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 md:left-6"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={showNext}
            className="absolute right-3 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 md:right-6"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="relative h-[70vh] w-full max-w-5xl">
            <Image
              src={BIRDWATCHING_GALLERY[lightboxIndex]}
              alt={`Galería ${lightboxIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>
          <p className="absolute bottom-6 text-sm text-zinc-400">
            {lightboxIndex + 1} / {BIRDWATCHING_GALLERY.length}
          </p>
        </div>
      )}
    </main>
  );
}

function SectionHeading({ icon, title }: { icon?: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="flex items-center gap-2 text-2xl font-black text-white md:text-3xl">
        {icon && <span className="text-emerald-300">{icon}</span>}
        {title}
      </h2>
      <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
        {icon}
        {label}
      </p>
      <p className="text-base font-bold leading-snug text-white">{value}</p>
    </div>
  );
}
