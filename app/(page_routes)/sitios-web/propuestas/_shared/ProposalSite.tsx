"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Activity,
  Bone,
  Brush,
  CakeSlice,
  Cat,
  CheckCircle2,
  Clock3,
  Coffee,
  Cookie,
  Croissant,
  Dog,
  Dumbbell,
  Facebook,
  Fish,
  Flame,
  Gift,
  Heart,
  HeartHandshake,
  HeartPulse,
  Instagram,
  Leaf,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Music,
  PawPrint,
  Phone,
  Pizza,
  Quote,
  Salad,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Soup,
  Sparkles,
  Star,
  Stethoscope,
  Store,
  Syringe,
  Trophy,
  Utensils,
  UtensilsCrossed,
  Users,
  Wheat,
  X,
  Zap,
} from "lucide-react";
import type { BusinessConfig } from "./types";

const ICONS: Record<string, typeof Sparkles> = {
  Activity,
  ArrowRight,
  Bone,
  Brush,
  CakeSlice,
  Cat,
  Coffee,
  Cookie,
  Croissant,
  Dog,
  Dumbbell,
  Fish,
  Flame,
  Gift,
  Heart,
  HeartHandshake,
  HeartPulse,
  Leaf,
  Music,
  PawPrint,
  Pizza,
  Salad,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Soup,
  Sparkles,
  Star,
  Stethoscope,
  Store,
  Syringe,
  Trophy,
  Utensils,
  UtensilsCrossed,
  Users,
  Wheat,
  Zap,
};

function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = ICONS[name] ?? Sparkles;
  return <Cmp className={className} />;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const NAV = [
  { href: "#inicio", label: "Inicio" },
  { href: "#oferta", label: "Servicios" },
  { href: "#galeria", label: "Galería" },
  { href: "#ubicacion", label: "Visítenos" },
  { href: "#contacto", label: "Contacto" },
];

export default function ProposalSite({ config }: { config: BusinessConfig }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const a = config.accent;

  const mapsUrl = useMemo(
    () =>
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        config.mapsQuery,
      )}`,
    [config.mapsQuery],
  );
  const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(
    config.mapsQuery,
  )}&z=16&output=embed`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const styleVars = {
    "--accent": a.base,
    "--accent-ink": a.ink,
    "--accent-soft": a.soft,
    "--deep": a.deep,
  } as CSSProperties;

  const telHref = config.phone ? `tel:+506${config.phone}` : undefined;
  const waHref = config.whatsapp
    ? `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(
        `Hola ${config.shortName}, vi su sitio web y quiero más información.`,
      )}`
    : undefined;
  const primaryContact = waHref ?? telHref ?? "#contacto";
  const galleryItems = config.gallery ?? [];

  const socials = [
    config.facebook && { href: config.facebook, label: "Facebook", icon: Facebook },
    config.instagram && { href: config.instagram, label: "Instagram", icon: Instagram },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Facebook }[];

  return (
    <main
      style={styleVars}
      className="min-h-screen"
      // page background + text driven by accent config
    >
      <div style={{ background: a.page, color: a.pageInk }} className="min-h-screen">
        {/* ───────── Header ───────── */}
        <header
          className={cx(
            "fixed inset-x-0 top-0 z-50 transition-all duration-300",
            scrolled ? "shadow-lg backdrop-blur-xl" : "",
          )}
          style={{
            background: scrolled ? withAlpha(a.page, 0.9) : "transparent",
            borderBottom: scrolled ? `1px solid ${withAlpha(a.pageInk, 0.08)}` : "1px solid transparent",
          }}
        >
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
            <a href="#inicio" className="group flex items-center gap-3">
              {config.brandLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={config.brandLogo}
                  alt={`Logo de ${config.name}`}
                  className="h-12 w-auto max-w-36 object-contain"
                />
              ) : (
                <span
                  className="grid h-11 w-11 place-items-center rounded-xl shadow-lg transition group-hover:-rotate-3"
                  style={{ background: a.base, color: a.ink }}
                >
                  <Icon name={config.brandIcon} className="h-5 w-5" />
                </span>
              )}
              <span className="leading-tight">
                <span
                  className={cx(
                    "block text-[11px] font-black uppercase tracking-[0.2em]",
                    scrolled ? "" : "text-white/80",
                  )}
                  style={scrolled ? { color: a.base } : undefined}
                >
                  {config.category}
                </span>
                <span
                  className={cx("block text-base font-black", scrolled ? "" : "text-white")}
                  style={scrolled ? { color: a.pageInk } : undefined}
                >
                  {config.shortName}
                </span>
              </span>
            </a>

            <div className="hidden items-center gap-1 lg:flex">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "rounded-md px-3.5 py-2 text-sm font-bold transition hover:bg-black/5",
                    scrolled ? "" : "text-white/85 hover:bg-white/15 hover:text-white",
                  )}
                  style={scrolled ? { color: withAlpha(a.pageInk, 0.7) } : undefined}
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="hidden items-center gap-2 md:flex">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="grid h-11 w-11 place-items-center rounded-xl border transition hover:-translate-y-0.5"
                  style={{
                    borderColor: scrolled ? withAlpha(a.pageInk, 0.12) : "rgba(255,255,255,0.2)",
                    color: scrolled ? a.pageInk : "#fff",
                    background: scrolled ? withAlpha(a.pageInk, 0.03) : "rgba(255,255,255,0.1)",
                  }}
                >
                  <s.icon className="h-4.5 w-4.5" />
                </a>
              ))}
              {(telHref || waHref) && (
                <a
                  href={primaryContact}
                  target={waHref ? "_blank" : undefined}
                  rel={waHref ? "noreferrer" : undefined}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black shadow-xl transition hover:-translate-y-0.5"
                  style={{ background: a.base, color: a.ink }}
                >
                  <Phone className="h-4 w-4" />
                  {config.phoneDisplay ?? "Contactar"}
                </a>
              )}
            </div>

            <button
              aria-label="Abrir menú"
              onClick={() => setMenuOpen((v) => !v)}
              className="grid h-11 w-11 place-items-center rounded-xl border md:hidden"
              style={{
                borderColor: scrolled ? withAlpha(a.pageInk, 0.12) : "rgba(255,255,255,0.25)",
                color: scrolled ? a.pageInk : "#fff",
              }}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </nav>

          {menuOpen && (
            <div
              className="border-t px-5 py-4 shadow-xl backdrop-blur-xl md:hidden"
              style={{ background: withAlpha(a.page, 0.97), borderColor: withAlpha(a.pageInk, 0.1) }}
            >
              <div className="mx-auto grid max-w-7xl gap-2">
                {NAV.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-3 text-sm font-bold"
                    style={{ color: withAlpha(a.pageInk, 0.75) }}
                  >
                    {item.label}
                  </a>
                ))}
                {(telHref || waHref) && (
                  <a
                    href={primaryContact}
                    target={waHref ? "_blank" : undefined}
                    rel={waHref ? "noreferrer" : undefined}
                    className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-3 font-black"
                    style={{ background: a.base, color: a.ink }}
                  >
                    <Phone className="h-4 w-4" />
                    {config.phoneDisplay ?? "Contactar"}
                  </a>
                )}
              </div>
            </div>
          )}
        </header>

        {/* ───────── Hero ───────── */}
        <section
          id="inicio"
          className="relative min-h-[92vh] overflow-hidden px-5 pb-14 pt-28 sm:px-8"
        >
          <div className="absolute inset-0 z-0">
            {config.heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.heroImage}
                alt={`${config.name} en ${config.city}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="h-full w-full"
                style={{
                  background: `radial-gradient(120% 90% at 15% 10%, ${a.base} 0%, ${a.deep} 55%, #05070d 100%)`,
                }}
              />
            )}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, ${withAlpha(a.deep, 0.94)} 0%, ${withAlpha(
                  a.deep,
                  0.72,
                )} 42%, ${withAlpha(a.deep, 0.2)} 100%)`,
              }}
            />
            {!config.heroImage && (
              <Icon
                name={config.brandIcon}
                className="pointer-events-none absolute -right-10 bottom-0 h-[26rem] w-[26rem] opacity-[0.07] text-white"
              />
            )}
            <div
              className="absolute inset-x-0 bottom-0 h-40"
              style={{ background: `linear-gradient(to top, ${a.page}, transparent)` }}
            />
          </div>

          <div className="relative z-10 mx-auto grid min-h-[calc(92vh-7rem)] max-w-7xl items-end gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
            <motion.div
              initial="hidden"
              animate="show"
              transition={{ staggerChildren: 0.1 }}
              className="max-w-4xl pb-4"
            >
              <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
                <span
                  className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-white"
                  style={{ borderColor: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.1)" }}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {config.city}
                </span>
              </motion.div>
              {config.brandLogo && (
                <motion.img
                  variants={fadeUp}
                  transition={{ duration: 0.55 }}
                  src={config.brandLogo}
                  alt={`Logo de ${config.name}`}
                  className="mt-7 h-auto w-56 max-w-full object-contain sm:w-72"
                />
              )}
              <motion.h1
                variants={fadeUp}
                transition={{ duration: 0.55 }}
                className={cx(
                  "max-w-4xl text-5xl font-black leading-[0.94] text-white sm:text-7xl lg:text-8xl",
                  config.brandLogo ? "mt-4" : "mt-6",
                )}
              >
                {config.shortName}
              </motion.h1>
              <motion.p
                variants={fadeUp}
                transition={{ duration: 0.55 }}
                className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-white/85 sm:text-xl"
              >
                {config.intro}
              </motion.p>
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.55 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <a
                  href="#oferta"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black shadow-xl transition hover:-translate-y-0.5"
                  style={{ background: a.base, color: a.ink }}
                >
                  Ver más
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/12 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
                >
                  <MapPin className="h-4 w-4" />
                  Cómo llegar
                </a>
              </motion.div>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="mb-2 hidden rounded-2xl border border-white/18 bg-white/12 p-5 text-white shadow-2xl backdrop-blur-xl lg:block"
            >
              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <span className="text-sm font-black uppercase tracking-[0.16em] text-white/90">
                  {config.tagline}
                </span>
                <Icon name={config.brandIcon} className="h-5 w-5" />
              </div>
              <div className="mt-4 space-y-4">
                {config.sellingPoints.slice(0, 3).map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: a.base }} />
                    <span className="text-sm font-semibold text-white/88">{item}</span>
                  </div>
                ))}
              </div>
            </motion.aside>
          </div>
        </section>

        {/* ───────── Proof strip ───────── */}
        {config.proof.length > 0 && (
          <div className="relative z-10 mx-auto -mt-6 max-w-7xl px-5 sm:px-8">
            <div
              className="grid overflow-hidden rounded-2xl border shadow-2xl md:grid-cols-3"
              style={{ background: "#fff", borderColor: withAlpha(a.pageInk, 0.1) }}
            >
              {config.proof.map((item) => (
                <div
                  key={item.label}
                  className="border-b p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
                  style={{ borderColor: withAlpha(a.pageInk, 0.1) }}
                >
                  <div className="text-4xl font-black" style={{ color: a.deep }}>
                    {item.value}
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-stone-600">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ───────── Offerings ───────── */}
        <section id="oferta" className="px-5 py-16 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.72fr_1fr] lg:items-end">
              <div>
                <Eyebrow accent={a}>Lo que ofrecemos</Eyebrow>
                <h2 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
                  {config.offeringsTitle}
                </h2>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-stone-600 lg:ml-auto">
                {config.offeringsLead}
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {config.offerings.map((item, index) => (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="group rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                  style={{ borderColor: withAlpha(a.pageInk, 0.1) }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="grid h-12 w-12 place-items-center rounded-xl"
                      style={{ background: a.base, color: a.ink }}
                    >
                      <Icon name={item.icon} className="h-6 w-6" />
                    </span>
                    {item.badge && (
                      <span
                        className="rounded-full px-3 py-1 text-xs font-black"
                        style={{ background: a.soft, color: a.deep }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-5 text-xl font-black text-stone-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-600">{item.text}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── Value (dark) ───────── */}
        <section className="px-5 py-16 sm:px-8 lg:py-24" style={{ background: a.deep, color: "#fff" }}>
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1fr] lg:items-center">
            <div>
              <Eyebrow accent={a} light>
                Por qué un sitio web
              </Eyebrow>
              <h2 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
                {config.valueTitle}
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/78">{config.valueLead}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {config.sellingPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-center gap-3 rounded-xl border border-white/12 bg-white/8 px-4 py-4"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: a.base }} />
                  <span className="text-sm font-black">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── Gallery ───────── */}
        {galleryItems.length > 0 && (
          <section id="galeria" className="px-5 py-16 sm:px-8 lg:py-24">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                  <Eyebrow accent={a}>Galería</Eyebrow>
                  <h2 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
                    {config.galleryTitle ?? "Una vitrina digital que abre el apetito."}
                  </h2>
                </div>
                <p className="max-w-md text-lg leading-8 text-stone-600">
                  {config.galleryLead ??
                    "Fotos de referencia, listas para cambiar por imágenes reales del negocio cuando estén disponibles."}
                </p>
              </div>
              <div className="mt-10 grid auto-rows-[190px] gap-3 md:grid-cols-4 md:auto-rows-[220px]">
                {galleryItems.map((image, index) => (
                  <motion.figure
                    key={image.src + index}
                    initial={{ opacity: 0, scale: 0.96 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: index * 0.04 }}
                    className={cx(
                      "group relative overflow-hidden rounded-2xl bg-stone-200",
                      image.wide && "md:col-span-2 md:row-span-2",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    {image.label && (
                      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <span
                          className="inline-flex rounded-lg px-3 py-1.5 text-sm font-black"
                          style={{ background: "#fff", color: a.deep }}
                        >
                          {image.label}
                        </span>
                      </figcaption>
                    )}
                  </motion.figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ───────── Testimonials ───────── */}
        {config.testimonials && config.testimonials.length > 0 && (
          <section className="px-5 py-16 sm:px-8 lg:py-24" style={{ background: a.soft }}>
            <div className="mx-auto max-w-7xl">
              <div className="grid gap-8 lg:grid-cols-[0.6fr_1fr] lg:items-center">
                <div>
                  <Eyebrow accent={a}>Clientes</Eyebrow>
                  <h2 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
                    Lo que dice la gente del barrio.
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {config.testimonials.map((item) => (
                    <article
                      key={item.name}
                      className="rounded-2xl border bg-white p-5 shadow-sm"
                      style={{ borderColor: withAlpha(a.pageInk, 0.1) }}
                    >
                      <Quote className="h-6 w-6" style={{ color: a.base }} />
                      <p className="mt-4 text-sm leading-7 text-stone-600">{item.text}</p>
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <span className="font-black text-stone-950">{item.name}</span>
                        <span className="flex" style={{ color: a.base }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-current" />
                          ))}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ───────── Location ───────── */}
        <section id="ubicacion" className="px-5 py-16 sm:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1fr]">
            <div>
              <Eyebrow accent={a}>Visítenos</Eyebrow>
              <h2 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
                {config.locationTitle}
              </h2>
              <div className="mt-8 grid gap-4">
                <ContactRow accent={a} icon={<MapPin className="h-5 w-5" />} label="Dirección" value={config.address} href={mapsUrl} external />
                {config.phoneDisplay && telHref && (
                  <ContactRow accent={a} icon={<Phone className="h-5 w-5" />} label="Teléfono" value={config.phoneDisplay} href={telHref} />
                )}
                {config.email && (
                  <ContactRow accent={a} icon={<Mail className="h-5 w-5" />} label="Correo" value={config.email} href={`mailto:${config.email}`} />
                )}
                {config.facebook && (
                  <ContactRow accent={a} icon={<Facebook className="h-5 w-5" />} label="Facebook" value="Síguenos en Facebook" href={config.facebook} external />
                )}
                {config.instagram && (
                  <ContactRow accent={a} icon={<Instagram className="h-5 w-5" />} label="Instagram" value="Síguenos en Instagram" href={config.instagram} external />
                )}
              </div>

              {config.schedule && config.schedule.length > 0 && (
                <div
                  className="mt-6 rounded-2xl border bg-white p-5"
                  style={{ borderColor: withAlpha(a.pageInk, 0.1) }}
                >
                  <div className="flex items-center gap-3">
                    <Clock3 className="h-5 w-5" style={{ color: a.deep }} />
                    <p className="font-black text-stone-950">Horario</p>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {config.schedule.map((item) => (
                      <div key={item.day} className="flex justify-between gap-4 text-sm">
                        <span className="font-semibold text-stone-600">{item.day}</span>
                        <span className="font-black text-stone-950">{item.hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div
              className="min-h-[440px] overflow-hidden rounded-2xl border bg-white p-2 shadow-2xl"
              style={{ borderColor: withAlpha(a.pageInk, 0.1) }}
            >
              <iframe
                title={`Ubicación ${config.name}`}
                src={mapEmbed}
                className="h-full min-h-[420px] w-full rounded-xl"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>

        {/* ───────── Contact CTA ───────── */}
        <section id="contacto" className="relative overflow-hidden px-5 py-20 text-white sm:px-8">
          <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${a.deep}, ${a.base})` }} />
          <Icon
            name={config.brandIcon}
            className="pointer-events-none absolute -right-6 -bottom-10 h-80 w-80 opacity-10 text-white"
          />
          <div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.18em]">
                <Sparkles className="h-3.5 w-3.5" />
                {config.city}
              </span>
              <h2 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">{config.ctaTitle}</h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">{config.ctaText}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {telHref && (
                <a
                  href={telHref}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black shadow-xl transition hover:-translate-y-0.5"
                  style={{ background: "#fff", color: a.deep }}
                >
                  <Phone className="h-4 w-4" />
                  {config.phoneDisplay ?? "Llamar"}
                </a>
              )}
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/12 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
              {!waHref && socials[0] && (
                <a
                  href={socials[0].href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/12 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
                >
                  <MessageCircle className="h-4 w-4" />
                  {socials[0].label}
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ───────── Footer ───────── */}
        <footer className="px-5 py-10 sm:px-8" style={{ background: a.page, borderTop: `1px solid ${withAlpha(a.pageInk, 0.1)}` }}>
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: a.base, color: a.ink }}>
                  <Icon name={config.brandIcon} className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-black text-stone-950">{config.name}</p>
                  <p className="text-sm font-semibold text-stone-600">{config.tagline}</p>
                </div>
              </div>
              <p className="mt-5 max-w-lg text-sm leading-6 text-stone-500">
                Propuesta de sitio web para {config.name}: diseño moderno, contacto directo y
                presencia digital lista para {config.city}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-bold text-stone-600 hover:bg-black/5"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          <div className="mx-auto mt-8 flex max-w-7xl flex-col justify-between gap-3 border-t pt-5 text-xs font-semibold text-stone-500 sm:flex-row" style={{ borderColor: withAlpha(a.pageInk, 0.1) }}>
            <span>© {new Date().getFullYear()} {config.name}. Todos los derechos reservados.</span>
            <span>Propuesta de sitio web · San Carlos, Costa Rica</span>
          </div>
        </footer>
      </div>
    </main>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

function Eyebrow({
  children,
  accent,
  light = false,
}: {
  children: React.ReactNode;
  accent: BusinessConfig["accent"];
  light?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.18em]"
      style={
        light
          ? { borderColor: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "#fff" }
          : { borderColor: withAlpha(accent.deep, 0.12), background: accent.soft, color: accent.deep }
      }
    >
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function ContactRow({
  accent,
  icon,
  label,
  value,
  href,
  external = false,
}: {
  accent: BusinessConfig["accent"];
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="flex gap-4 rounded-2xl border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
      style={{ borderColor: withAlpha(accent.pageInk, 0.1) }}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: accent.soft, color: accent.deep }}>
        {icon}
      </span>
      <span>
        <span className="block font-black text-stone-950">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-stone-600">{value}</span>
      </span>
    </a>
  );
}

// Turn a #rrggbb hex into an rgba() string with the given alpha.
function withAlpha(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
