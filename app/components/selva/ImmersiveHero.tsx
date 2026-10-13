"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowRight, Leaf, MapPin, MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { BOOKING_HREF, TOURS_HREF, WHATSAPP_HREF } from "@/app/components/home/home-utils";
import ToucanArt from "./ToucanArt";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Small drifting leaf, echoing the petals floating around the MISOGI tiger. */
function Leaflet({
  delay,
  x,
  size,
  duration,
  reduced,
}: {
  delay: number;
  x: string;
  size: number;
  duration: number;
  reduced: boolean;
}) {
  if (reduced) return null;
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute -top-10 text-emerald-600/70"
      style={{ left: x }}
      initial={{ y: -40, opacity: 0, rotate: 0 }}
      animate={{
        y: ["-6vh", "112vh"],
        x: [0, 26, -18, 12, 0],
        rotate: [0, 120, 240, 360],
        opacity: [0, 0.9, 0.9, 0],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
    >
      <Leaf width={size} height={size} strokeWidth={1.6} />
    </motion.span>
  );
}

export default function ImmersiveHero({
  /** Drop a transparent PNG at /public/hero/toucan.png and pass it here to
   *  swap the SVG bird for a photoreal cutout — everything else keeps working. */
  imageSrc,
}: {
  imageSrc?: string;
}) {
  const { lang } = useLanguage();
  const isEs = lang === "es";
  const reduced = useReducedMotion() ?? false;

  const sectionRef = useRef<HTMLElement>(null);

  // ── Scroll parallax ──────────────────────────────────────────────
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const birdScrollY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const bgScrollY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const wavesScrollY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // ── Mouse parallax ───────────────────────────────────────────────
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const mx = useSpring(pointerX, { stiffness: 60, damping: 18, mass: 0.6 });
  const my = useSpring(pointerY, { stiffness: 60, damping: 18, mass: 0.6 });

  function handlePointer(e: React.PointerEvent<HTMLElement>) {
    if (reduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    pointerX.set(((e.clientX - rect.left) / rect.width - 0.5) * 2); // -1..1
    pointerY.set(((e.clientY - rect.top) / rect.height - 0.5) * 2);
  }
  function resetPointer() {
    pointerX.set(0);
    pointerY.set(0);
  }

  const birdMX = useTransform(mx, (v) => v * 22);
  const birdMY = useTransform(my, (v) => v * 16);
  const bgMX = useTransform(mx, (v) => v * -14);
  const bgMY = useTransform(my, (v) => v * -10);
  const glowMX = useTransform(mx, (v) => v * 30);

  const facts = isEs
    ? [
        ["Guías locales", "Biólogos y baquianos de la zona"],
        ["Grupos pequeños", "Experiencia cercana, sin filas"],
        ["Bosque protegido", "Ribera del Río La Vieja"],
        ["Reserva flexible", "Cancelación gratis 48 h antes"],
      ]
    : [
        ["Local guides", "Biologists & trackers from the area"],
        ["Small groups", "Up-close, never crowded"],
        ["Protected forest", "Along the La Vieja River"],
        ["Flexible booking", "Free cancellation 48h before"],
      ];

  return (
    <section
      ref={sectionRef}
      onPointerMove={handlePointer}
      onPointerLeave={resetPointer}
      className="relative min-h-[100svh] overflow-hidden bg-[#F4F0E4] text-[#1b2b26]"
    >
      {/* ── Sky / atmosphere ────────────────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_78%_18%,#FBF8EF_0%,#E9F3EA_38%,#CFE9E0_66%,#AFDCD5_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_120%,rgba(0,110,96,0.28),transparent_70%)]" />

      {/* ── Far background: misty foliage swirls (slow parallax) ── */}
      <motion.div
        aria-hidden
        style={{ y: bgScrollY, x: bgMX }}
        className="pointer-events-none absolute inset-0"
      >
        <motion.svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          style={{ y: bgMY }}
        >
          {/* soft cloud/mist swirls, top-right — echoes the reference clouds */}
          <g fill="#BFE0D6" opacity="0.55">
            <path d="M980 120c60-40 150-30 190 20 40-6 86 12 92 54 60 4 96 62 60 104-40 44-150 30-360 22-150-6-190-40-176-92 12-46 84-62 130-52-6-42 4-84 64-88Z" />
          </g>
          <g fill="#D8ECE1" opacity="0.6">
            <path d="M1120 250c50-30 120-22 150 18 34-4 70 12 72 46 48 6 74 54 42 86-34 34-120 22-286 14-118-6-150-34-138-74 10-36 68-48 106-40-4-32 6-64 52-66Z" />
          </g>
          {/* distant canopy silhouettes bottom, blurred */}
          <g fill="#7FB79E" opacity="0.5">
            <path d="M0 760c120-70 210-30 300-70s180-70 300-40 210 90 340 60 240-90 380-50v340H0Z" />
          </g>
        </motion.svg>
      </motion.div>

      {/* ── Glow bloom behind the bird (the "emerging from depth" light) ── */}
      <motion.div
        aria-hidden
        style={{ x: glowMX }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={reduced ? { opacity: 0.9, scale: 1 } : { opacity: 0.9, scale: 1 }}
        transition={{ duration: 1.6, ease: EASE_OUT, delay: 0.1 }}
        className="pointer-events-none absolute right-[6%] top-[16%] h-[62vh] w-[62vh] rounded-full bg-[radial-gradient(circle,rgba(255,214,120,0.55)_0%,rgba(0,196,176,0.22)_42%,transparent_70%)] blur-2xl sm:right-[10%]"
      />

      {/* ── The toucan ──────────────────────────────────────────── */}
      <ParallaxBird
        birdScrollY={birdScrollY}
        birdMX={birdMX}
        birdMY={birdMY}
        reduced={reduced}
        imageSrc={imageSrc}
        isEs={isEs}
      />

      {/* ── Foreground waves / river (like the Hokusai waves) ──── */}
      <motion.svg
        aria-hidden
        viewBox="0 0 1440 320"
        preserveAspectRatio="xMidYMax slice"
        style={{ y: wavesScrollY }}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[34vh] w-full"
      >
        <path
          d="M0 180c120-46 240-46 360 0s240 46 360 0 240-46 360 0 240 46 360 0v140H0Z"
          fill="#79C6BC"
          opacity="0.85"
        />
        <path
          d="M0 232c140-40 260-40 380 0s240 40 340 6 240-46 360-6 220 40 360 6v82H0Z"
          fill="#3FA79B"
          opacity="0.92"
        />
        <path
          d="M0 270c160-30 260-30 400 4s240 30 340 2 260-34 400 2 160 24 300 2v40H0Z"
          fill="#1E7E76"
        />
      </motion.svg>

      {/* ── Drifting leaves ─────────────────────────────────────── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <Leaflet delay={0} x="12%" size={20} duration={13} reduced={reduced} />
        <Leaflet delay={3} x="34%" size={14} duration={17} reduced={reduced} />
        <Leaflet delay={6} x="58%" size={24} duration={15} reduced={reduced} />
        <Leaflet delay={1.5} x="72%" size={16} duration={19} reduced={reduced} />
        <Leaflet delay={8} x="88%" size={18} duration={14} reduced={reduced} />
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <motion.div
        style={{ y: contentY, opacity: fade }}
        className="relative mx-auto flex min-h-[100svh] w-full max-w-[1400px] flex-col px-5 pb-40 pt-28 sm:px-8 md:pt-32 lg:px-12"
      >
        {/* Top bar */}
        <nav className="flex items-center justify-between">
          <Link href="/" className="font-display text-lg font-black tracking-tight">
            LA VIEJA <span className="text-[#0E8C7F]">ADVENTURES</span>
          </Link>
          <span className="hidden items-center gap-2 rounded-full border border-[#0E8C7F]/30 bg-white/50 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#0b4740] backdrop-blur-md sm:inline-flex">
            <MapPin size={13} className="text-[#0E8C7F]" />
            San Carlos · Costa Rica
          </span>
        </nav>

        {/* Headline block — left aligned like the reference */}
        <div className="mt-auto max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.15 }}
            className="mb-5 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.32em] text-[#0b6b60]"
          >
            <span className="h-px w-8 bg-[#0E8C7F]" />
            {isEs ? "Vida silvestre · Río La Vieja" : "Wildlife · La Vieja River"}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.25 }}
            className="font-display text-[clamp(2.8rem,7.5vw,6.2rem)] font-black leading-[0.92] tracking-[-0.03em] text-[#15251f]"
          >
            {isEs ? (
              <>
                La selva,
                <br />
                <span className="text-[#0E8C7F]">a un aleteo.</span>
              </>
            ) : (
              <>
                The wild,
                <br />
                <span className="text-[#0E8C7F]">a wingbeat away.</span>
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.4 }}
            className="mt-6 max-w-xl text-base font-medium leading-relaxed text-[#2b3d37] sm:text-lg"
          >
            {isEs
              ? "Tucanes, ríos turquesa y bosque vivo en la ribera del Río La Vieja. Recorra San Carlos con guías locales y grupos pequeños, y vuelva con la historia que vino a buscar."
              : "Toucans, turquoise rivers, and living forest along the La Vieja River. Explore San Carlos with local guides and small groups, and leave with the story you came for."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.55 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
          >
            <Link
              href={TOURS_HREF}
              className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#0E8C7F] px-8 text-xs font-black uppercase tracking-[0.12em] text-white shadow-[0_18px_50px_rgba(14,140,127,0.34)] transition hover:-translate-y-0.5 hover:bg-[#0b6b60]"
            >
              {isEs ? "Explorar tours" : "Explore tours"}
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href={BOOKING_HREF}
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-[#15251f]/20 bg-white/60 px-8 text-xs font-black uppercase tracking-[0.12em] text-[#15251f] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-[#15251f]/40 hover:bg-white/80"
            >
              {isEs ? "Ver fechas" : "See dates"}
            </Link>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-[#0E8C7F]/40 bg-[#0E8C7F]/10 px-8 text-xs font-black uppercase tracking-[0.12em] text-[#0b6b60] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-[#0E8C7F]/20"
            >
              <MessageCircle size={16} />
              {isEs ? "Hablar con un guía" : "Talk to a guide"}
            </a>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Bottom feature strip (the reference's 4 columns) ────── */}
      <div className="absolute inset-x-0 bottom-0 z-10 border-t border-[#0E8C7F]/25 bg-[#12403a]/92 text-white backdrop-blur-md">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-x-6 gap-y-4 px-5 py-5 sm:px-8 md:grid-cols-4 lg:px-12">
          {facts.map(([title, sub]) => (
            <div key={title}>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#7fe6da]">{title}</p>
              <p className="mt-1 text-xs font-medium leading-snug text-white/70">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The animal layer: scroll + mouse parallax outside, cinematic reveal in the
 *  middle, perpetual idle float inside — the trio that reads as "video real". */
function ParallaxBird({
  birdScrollY,
  birdMX,
  birdMY,
  reduced,
  imageSrc,
  isEs,
}: {
  birdScrollY: MotionValue<number>;
  birdMX: MotionValue<number>;
  birdMY: MotionValue<number>;
  reduced: boolean;
  imageSrc?: string;
  isEs: boolean;
}) {
  return (
    <motion.div
      style={{ y: birdScrollY, x: birdMX }}
      className="pointer-events-none absolute right-[-6%] top-[8%] z-[5] w-[78vw] max-w-[720px] sm:right-[2%] sm:w-[58vw] lg:right-[5%] lg:w-[46vw]"
    >
      <motion.div style={{ y: birdMY }}>
        {/* Cinematic reveal: rises from depth, blur → sharp, scale up */}
        <motion.div
          initial={{ opacity: 0, scale: 0.72, y: 70, filter: "blur(16px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.5, ease: EASE_OUT, delay: 0.2 }}
        >
          {/* Perpetual idle float — the alive, video-like motion */}
          <motion.div
            animate={
              reduced
                ? undefined
                : { y: [0, -16, 0], rotate: [0, 1.4, 0] }
            }
            transition={{ duration: 6.5, ease: "easeInOut", repeat: Infinity }}
            style={{ transformOrigin: "60% 40%" }}
            className="drop-shadow-[0_40px_60px_rgba(6,40,34,0.35)]"
          >
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt={isEs ? "Tucán de La Vieja Adventures" : "Toucan at La Vieja Adventures"}
                className="h-auto w-full select-none"
                draggable={false}
              />
            ) : (
              <ToucanArt className="h-auto w-full select-none" />
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
