"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Droplets,
  MapPin,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { useReservationData } from "@/lib/hooks/useReservationData";
import TourSelectionCards from "@/app/components/tours/TourSelectionCards";
import { principalContent } from "@/lib/constants/principal";
import { getTourImage } from "@/lib/tour-display";

// All images from /public/image used in the photo-mosaic strip
const GALLERY_STRIP = [
  "/image/IMG_6810.jpg", "/image/IMG_6812.jpg", "/image/IMG_4671.jpg",
  "/image/IMG_4257.jpg", "/image/IMG_6813.jpg", "/image/IMG_4197.jpg",
  "/image/IMG_3698.jpg", "/image/IMG_4943.jpg", "/image/IMG_5585.jpg",
  "/image/IMG_4522.jpg", "/image/IMG_6814.jpg", "/image/IMG_4200.jpg",
  "/image/IMG_3705.jpg", "/image/IMG_4917.jpg", "/image/IMG_4672.jpg",
  "/image/IMG_6809.jpg", "/image/IMG_6806.jpg", "/image/IMG_6811.jpg",
  "/image/IMG_4523.jpg", "/image/IMG_4210.jpg", "/image/IMG_3751.jpg",
  "/image/IMG_2439.jpg", "/image/IMG_2443.jpg", "/image/IMG_4514.jpg",
  "/image/IMG_6805.jpg", "/image/IMG_4376.jpg", "/image/IMG_4389.jpg",
  "/image/IMG_4575.jpg", "/image/IMG_3920.jpg", "/image/IMG_5592.jpg",
];

type Props = {
  onSelectTour: (slug: string) => void;
  selectedTourSlug?: string | null;
};

export default function ToursImmersionSection({ onSelectTour, selectedTourSlug }: Props) {
  const { lang } = useLanguage();
  const { tours } = useReservationData();
  const copy = principalContent[lang].tours;
  const isEs = lang === "es";

  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const ciudadEsmeraldaTour = tours.find(
    (t) => t.slug === "tour-ciudad-esmeralda" || t.slug === "ciudad-esmeralda"
  );

  const updateCarouselState = () => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
    const currentScrollLeft = carousel.scrollLeft;
    setCanScrollLeft(currentScrollLeft > 8);
    setCanScrollRight(currentScrollLeft < maxScrollLeft - 8);
    const progress = maxScrollLeft > 0 ? (currentScrollLeft / maxScrollLeft) * 100 : 0;
    setScrollProgress(Math.min(100, Math.max(0, progress)));
    const firstCard = carousel.querySelector<HTMLElement>("[data-carousel-card]");
    if (!firstCard) return;
    const cardWidth = firstCard.offsetWidth;
    const gap = 16;
    const index = Math.round(currentScrollLeft / (cardWidth + gap));
    setActiveIndex(Math.min(Math.max(index, 0), tours.length - 1));
  };

  const scrollCarousel = (direction: "left" | "right") => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const firstCard = carousel.querySelector<HTMLElement>("[data-carousel-card]");
    const cardWidth = firstCard?.offsetWidth ?? carousel.clientWidth * 0.85;
    const gap = 16;
    carousel.scrollBy({ left: direction === "left" ? -(cardWidth + gap) : cardWidth + gap, behavior: "smooth" });
  };

  const scrollToIndex = (index: number) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const firstCard = carousel.querySelector<HTMLElement>("[data-carousel-card]");
    const cardWidth = firstCard?.offsetWidth ?? carousel.clientWidth * 0.85;
    const gap = 16;
    carousel.scrollTo({ left: index * (cardWidth + gap), behavior: "smooth" });
  };

  useEffect(() => {
    updateCarouselState();
    const carousel = carouselRef.current;
    if (!carousel) return;
    const handleScroll = () => updateCarouselState();
    const handleResize = () => updateCarouselState();
    carousel.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      carousel.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [tours.length]);

  return (
    <section
      id="tours"
      className="relative overflow-hidden bg-[#020807] pb-16 pt-8 md:pb-28 md:pt-14"
    >
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[580px] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.22),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(90deg,rgba(110,231,183,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:88px_88px]" />

      <div className="container relative mx-auto px-4 md:px-8">

        {/* ── Section header ── */}
        <div className="mx-auto mb-10 max-w-4xl text-center md:mb-14">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.32em] text-emerald-300 md:text-[11px]">
            {copy.eyebrow}
          </p>
          <h2 className="text-balance text-4xl font-black leading-[0.95] text-white md:text-6xl">
            {copy.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/55 md:text-base">
            {isEs
              ? "Desliza y elige. Reserva en segundos."
              : "Swipe and choose. Book in seconds."}
          </p>
        </div>

        {/* ── Carousel ── */}
        <div className="relative -mx-4 md:-mx-8">
          {/* Nav arrows — visible on md+ */}
          <button
            type="button"
            aria-label="Ver experiencias anteriores"
            onClick={() => scrollCarousel("left")}
            disabled={!canScrollLeft}
            className="absolute left-3 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/80 text-white shadow-2xl backdrop-blur-md transition hover:border-emerald-300 hover:bg-emerald-300 hover:text-black disabled:pointer-events-none disabled:opacity-0 md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div
            ref={carouselRef}
            className="
              overflow-x-auto scroll-smooth pb-6
              [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
              px-4 md:px-8
              [&>div]:!flex [&>div]:!grid-cols-none [&>div]:!gap-4 [&>div]:!overflow-visible
              [&>div]:!snap-x [&>div]:!snap-mandatory
              [&>div>*]:!min-w-[78vw] [&>div>*]:!max-w-[78vw] [&>div>*]:!shrink-0 [&>div>*]:!snap-start
              sm:[&>div>*]:!min-w-[360px] sm:[&>div>*]:!max-w-[360px]
              md:[&>div>*]:!min-w-[400px] md:[&>div>*]:!max-w-[400px]
              lg:[&>div>*]:!min-w-[420px] lg:[&>div>*]:!max-w-[420px]
              xl:[&>div>*]:!min-w-[30%] xl:[&>div>*]:!max-w-[30%]
            "
          >
            <TourSelectionCards
              tours={tours}
              onSelectTour={onSelectTour}
              selectedTourSlug={selectedTourSlug}
            />
          </div>

          <button
            type="button"
            aria-label="Ver más experiencias"
            onClick={() => scrollCarousel("right")}
            disabled={!canScrollRight}
            className="absolute right-3 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/80 text-white shadow-2xl backdrop-blur-md transition hover:border-emerald-300 hover:bg-emerald-300 hover:text-black disabled:pointer-events-none disabled:opacity-0 md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Progress + dots */}
        <div className="mt-1 flex items-center justify-center gap-3 md:mt-2">
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/10 md:w-40">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35 md:hidden">
            Desliza
          </span>
        </div>

        <div className="mt-5 flex justify-center gap-2">
          {tours.map((tour, index) => (
            <button
              key={tour.slug ?? index}
              type="button"
              aria-label={`Ir a experiencia ${index + 1}`}
              onClick={() => scrollToIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === index ? "w-7 bg-emerald-400" : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Photo mosaic strip ── */}
      <div className="hidden">
        {/* Top + bottom fades */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-[#020807] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-[#020807] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#020807] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#020807] to-transparent" />

        {/* Label */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center pointer-events-none">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300/80 mb-2">
            {isEs ? "San Carlos · Costa Rica" : "San Carlos · Costa Rica"}
          </p>
          <h3 className="text-3xl font-black text-white drop-shadow-2xl md:text-5xl">
            {isEs ? "Donde el cañón\nse vuelve esmeralda." : "Where the canyon\nturns emerald."}
          </h3>
          <Link
            href="/reservar"
            className="pointer-events-auto mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-emerald-950 shadow-[0_12px_36px_rgba(16,185,129,0.45)] transition hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-[0_12px_36px_rgba(245,158,11,0.40)]"
          >
            {isEs ? "Reservar ahora" : "Book now"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Row 1 — scrolls left */}
        <div className="flex gap-2 mb-2" style={{ animation: "lva-marquee-left 55s linear infinite" }}>
          {[...GALLERY_STRIP, ...GALLERY_STRIP].map((src, i) => (
            <div key={i} className="relative h-36 w-52 shrink-0 overflow-hidden rounded-xl md:h-44 md:w-64">
              <Image src={src} alt="" fill sizes="250px" className="object-cover opacity-55" />
            </div>
          ))}
        </div>

        {/* Row 2 — scrolls right */}
        <div className="flex gap-2" style={{ animation: "lva-marquee-right 45s linear infinite" }}>
          {[...GALLERY_STRIP.slice(10), ...GALLERY_STRIP, ...GALLERY_STRIP.slice(0, 10)].map((src, i) => (
            <div key={i} className="relative h-36 w-52 shrink-0 overflow-hidden rounded-xl md:h-44 md:w-64">
              <Image src={src} alt="" fill sizes="250px" className="object-cover opacity-45" />
            </div>
          ))}
        </div>

        <style jsx>{`
          @keyframes lva-marquee-left {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          @keyframes lva-marquee-right {
            from { transform: translateX(-50%); }
            to { transform: translateX(0); }
          }
        `}</style>
      </div>

      {/* ── Ciudad Esmeralda — Featured section ── */}
      {ciudadEsmeraldaTour && (
        <div className="container relative mx-auto mt-24 px-4 md:px-8 md:mt-32">
          <div className="relative overflow-hidden rounded-[20px] border border-emerald-300/25 shadow-[0_40px_100px_rgba(0,0,0,0.65),0_0_0_1px_rgba(52,211,153,0.12)]">
            {/* Background image */}
            <div className="relative min-h-[560px] md:min-h-[660px]">
              <Image
                src={getTourImage(ciudadEsmeraldaTour.slug)}
                alt={isEs ? ciudadEsmeraldaTour.titleEs : ciudadEsmeraldaTour.titleEn}
                fill
                sizes="100vw"
                className="object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(2,10,8,0.95)_0%,rgba(2,10,8,0.75)_45%,rgba(2,10,8,0.25)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_40%,rgba(52,211,153,0.28),transparent_42%)]" />

              {/* Content */}
              <div className="relative z-10 flex h-full flex-col justify-center px-8 py-14 md:max-w-[60%] md:px-14 md:py-20">
                <div className="mb-6 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/50 bg-emerald-400/20 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-200 backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    {isEs ? "Tour estrella" : "Star tour"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-white/75 backdrop-blur-md">
                    <Droplets className="h-3.5 w-3.5 text-emerald-300" />
                    {isEs ? "Aguas esmeralda" : "Emerald waters"}
                  </span>
                </div>

                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.30em] text-emerald-300">
                  {isEs ? "Ciudad Esmeralda · San Carlos" : "Ciudad Esmeralda · San Carlos"}
                </p>

                <h2 className="mb-5 text-balance text-4xl font-black leading-[0.92] text-white drop-shadow-2xl md:text-6xl">
                  {isEs
                    ? "El cañón de aguas color esmeralda"
                    : "The emerald water canyon"}
                </h2>

                <p className="mb-8 max-w-lg text-base font-medium leading-relaxed text-white/68 md:text-lg">
                  {(isEs ? ciudadEsmeraldaTour.descriptionEs : ciudadEsmeraldaTour.descriptionEn) ||
                    (isEs
                      ? "Baje al corazón del cañón y descubra pozas de agua color esmeralda rodeadas de roca viva. Una experiencia guiada por locales que combina naturaleza salvaje, agua cristalina y ese pura vida que solo se vive en San Carlos."
                      : "Descend into the heart of the canyon and discover emerald-colored pools surrounded by living rock. A locally guided experience combining wild nature, crystal water, and that pure life energy unique to San Carlos.")}
                </p>

                {/* Stats row */}
                <div className="mb-8 flex flex-wrap gap-3">
                  {[
                    { Icon: Clock3, label: ciudadEsmeraldaTour.duration || "3-4h", color: "text-teal-300" },
                    { Icon: Zap, label: ciudadEsmeraldaTour.difficulty || (isEs ? "Moderado" : "Moderate"), color: "text-amber-300" },
                    { Icon: MapPin, label: ciudadEsmeraldaTour.location?.split("-")[0]?.trim() || "San Carlos", color: "text-emerald-300" },
                  ].map(({ Icon, label, color }) => (
                    <span key={label} className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-black/40 px-3.5 py-2 text-xs font-bold text-white/80 backdrop-blur-md">
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                      {label}
                    </span>
                  ))}
                </div>

                {/* Inclusions */}
                {ciudadEsmeraldaTour.inclusions && ciudadEsmeraldaTour.inclusions.length > 0 && (
                  <ul className="mb-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {ciudadEsmeraldaTour.inclusions.slice(0, 4).map((inc) => (
                      <li key={inc} className="flex items-start gap-2 text-sm text-white/65">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        {inc}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Price + CTA */}
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                      {isEs ? "Precio desde" : "Starting from"}
                    </span>
                    <span className="text-3xl font-black text-amber-100 md:text-4xl">
                      {ciudadEsmeraldaTour.packages?.[0]?.price
                        ? `$${ciudadEsmeraldaTour.packages[0].price}`
                        : isEs ? "Consultar" : "Ask"}
                    </span>
                    <span className="ml-2 text-sm text-white/40">{isEs ? "/ persona" : "/ person"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectTour(ciudadEsmeraldaTour.slug)}
                    className="emerald-wave-button inline-flex items-center gap-2.5 rounded-full bg-emerald-400 px-8 py-4 text-sm font-black uppercase tracking-[0.16em] text-emerald-950 shadow-[0_16px_48px_rgba(16,185,129,0.42)] transition-all hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-[0_16px_48px_rgba(245,158,11,0.38)]"
                  >
                    {isEs ? "Reservar la Esmeralda" : "Book the Emerald"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-4 flex items-center gap-2 text-[10px] text-white/35">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/60" />
                  {isEs
                    ? "Cancelación gratuita 48h antes · Confirmación inmediata"
                    : "Free cancellation 48h before · Instant confirmation"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tour story articles ── */}
      <div className="container relative mx-auto mt-24 px-4 md:mt-32 md:px-8">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.30em] text-emerald-300">
            {isEs ? "Experiencias a fondo" : "Deep dive"}
          </p>
          <h2 className="text-3xl font-black text-white md:text-4xl">
            {isEs ? "Conoce cada aventura" : "Explore each adventure"}
          </h2>
        </div>

        <div className="space-y-20 md:space-y-28">
          {tours.slice(0, 4).map((tour, index) => {
            const reverse = index % 2 === 1;
            const title = isEs ? tour.titleEs : tour.titleEn;
            const description = isEs ? tour.descriptionEs : tour.descriptionEn;
            const price = tour.packages?.[0]?.price ? `$${tour.packages[0].price}` : isEs ? "Consultar" : "Ask";

            return (
              <article
                key={`story-${tour.slug}`}
                className={`grid items-center gap-10 md:grid-cols-2 md:gap-16 ${
                  reverse ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                {/* Image */}
                <div className="relative min-h-[420px] overflow-hidden rounded-[18px] border border-emerald-100/14 shadow-[0_40px_100px_rgba(0,0,0,0.60)] md:min-h-[560px]">
                  <Image
                    src={getTourImage(tour.slug)}
                    alt={title}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.40)),radial-gradient(circle_at_50%_16%,rgba(16,185,129,0.22),transparent_42%)]" />

                  {/* Index badge */}
                  <div className="absolute left-5 top-5 rounded-[12px] border border-white/22 bg-black/50 px-4 py-3 backdrop-blur-md shadow-xl">
                    <span className="block text-[9px] font-black uppercase tracking-[0.22em] text-emerald-200/75">
                      {isEs ? "Ruta" : "Route"}
                    </span>
                    <span className="text-2xl font-black tabular-nums text-white">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Gallery link */}
                  <Link
                    href={`/tour/${encodeURIComponent(tour.slug)}`}
                    className="absolute bottom-5 right-5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/80 backdrop-blur-md transition hover:border-white/40 hover:text-white"
                  >
                    {isEs ? "Ver galería" : "Gallery"}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {/* Text */}
                <div className="md:px-4">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.30em] text-emerald-300">
                    {index === 0
                      ? (isEs ? "Ciudad Esmeralda · Cañón" : "Emerald city · Canyon")
                      : tour.difficulty || (isEs ? "Experiencia local" : "Local experience")}
                  </p>

                  <h3 className="max-w-xl text-balance text-3xl font-black leading-tight text-white md:text-[2.6rem]">
                    {title}
                  </h3>

                  <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-white/60 md:text-lg">
                    {description ||
                      (isEs
                        ? "Una experiencia guiada por gente local, con naturaleza de verdad, seguridad seria y ese toque pura vida que hace que uno quiera volver."
                        : "A locally guided experience with real nature, serious safety, and the easygoing Costa Rican energy that makes you want to return.")}
                  </p>

                  {/* Stat tiles */}
                  <div className="mt-7 grid grid-cols-3 gap-2.5">
                    {[
                      { Icon: ShieldCheck, value: isEs ? "Guías locales" : "Local guides", color: "text-emerald-300" },
                      { Icon: Clock3, value: tour.duration || "3-4 h", color: "text-teal-300" },
                      { Icon: MapPin, value: tour.location?.split("-")[0]?.trim() || "San Carlos", color: "text-amber-300" },
                    ].map(({ Icon, value, color }) => (
                      <div
                        key={value}
                        className="flex min-h-[68px] flex-col justify-center rounded-[10px] border border-emerald-100/12 bg-white/[0.048] px-3 py-3 backdrop-blur"
                      >
                        <Icon className={`mb-1.5 h-4 w-4 ${color}`} />
                        <span className="text-[11px] font-black leading-tight text-white/80">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price + CTA */}
                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <div>
                      <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/38">
                        {isEs ? "Desde" : "From"}
                      </span>
                      <span className="text-2xl font-black text-amber-100">{price}</span>
                      <span className="ml-1.5 text-xs text-white/38">{isEs ? "/ persona" : "/ person"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectTour(tour.slug)}
                      className="emerald-wave-button inline-flex items-center gap-2 rounded-full bg-emerald-400 px-7 py-3.5 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-950 shadow-[0_14px_40px_rgba(16,185,129,0.32)] transition-all hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-[0_14px_40px_rgba(245,158,11,0.32)]"
                    >
                      {isEs ? "Reservar esta experiencia" : "Book this experience"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center md:mt-28">
          <p className="mb-3 text-sm text-white/45">
            {isEs ? `${tours.length} experiencias disponibles en San Carlos` : `${tours.length} experiences available in San Carlos`}
          </p>
          <Link
            href="/tours"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-7 py-3.5 text-sm font-black text-white/80 backdrop-blur-md transition hover:border-emerald-300/50 hover:text-emerald-200"
          >
            {isEs ? "Ver todos los tours" : "See all tours"}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
