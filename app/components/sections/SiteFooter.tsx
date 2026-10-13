"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bot,
  CloudSun,
  ExternalLink,
  Facebook,
  FileText,
  Instagram,
  Leaf,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import {
  LA_VIEJA_GOOGLE_MAPS_EMBED_URL,
  LA_VIEJA_GOOGLE_MAPS_URL,
} from "@/lib/constants/location";
import { TOUR_INFO } from "@/lib/tour-info";

const socialLinks = [
  {
    label: "Instagram",
    href: TOUR_INFO.contact.instagram,
    icon: Instagram,
    className: "from-fuchsia-500 via-rose-500 to-amber-400",
  },
  {
    label: "Facebook",
    href: TOUR_INFO.contact.facebook,
    icon: Facebook,
    className: "from-blue-500 via-sky-500 to-cyan-300",
  },
  {
    label: "YouTube",
    href: TOUR_INFO.contact.youtube,
    icon: Youtube,
    className: "from-red-600 via-red-500 to-orange-400",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@la.vieja.adventur",
    icon: Music2,
    className: "from-zinc-100 via-cyan-300 to-rose-400",
  },
  {
    label: "X",
    href: TOUR_INFO.contact.twitter,
    icon: Twitter,
    className: "from-zinc-50 via-zinc-300 to-zinc-500",
  },
];

const routeGroups = {
  es: {
    exploreTitle: "Explorar",
    utilityTitle: "Herramientas",
    legalTitle: "Legal y soporte",
    contactTitle: "Contacto directo",
    mapTitle: "Encuentranos en Google Maps",
    mapCopy: "La Vieja Adventures Canyon Tour, Sucre de Ciudad Quesada, San Carlos.",
    whatsapp: "WhatsApp de reservas",
    call: "Llamar",
    email: "Correo",
    maps: "Abrir mapa",
    tagline: "Aventura responsable en el Canon del Rio La Vieja, Ciudad Esmeralda y la Zona Norte.",
    copyright: "La Vieja Adventures. Todos los derechos reservados.",
    links: {
      info: "Informacion general",
      tours: "Tours",
      gallery: "Galeria",
      store: "Store",
      organics: "Organics",
      wildo: "Wildo",
      weather: "Tiempo",
      docs: "Docs",
      ai: "Asistente IA",
      privacy: "Politica de privacidad",
      terms: "Terminos y condiciones",
      booking: "Reservar",
    },
  },
  en: {
    exploreTitle: "Explore",
    utilityTitle: "Tools",
    legalTitle: "Legal and support",
    contactTitle: "Direct contact",
    mapTitle: "Find us on Google Maps",
    mapCopy: "La Vieja Adventures Canyon Tour, Sucre de Ciudad Quesada, San Carlos.",
    whatsapp: "Booking WhatsApp",
    call: "Call",
    email: "Email",
    maps: "Open map",
    tagline: "Responsible adventure in La Vieja River Canyon, Ciudad Esmeralda, and Costa Rica's Northern Zone.",
    copyright: "La Vieja Adventures. All rights reserved.",
    links: {
      info: "General info",
      tours: "Tours",
      gallery: "Gallery",
      store: "Store",
      organics: "Organics",
      wildo: "Wildo",
      weather: "Weather",
      docs: "Docs",
      ai: "AI assistant",
      privacy: "Privacy policy",
      terms: "Terms and conditions",
      booking: "Book now",
    },
  },
} as const;

export default function SiteFooter() {
  const { lang } = useLanguage();
  const copy = routeGroups[lang];
  const whatsappHref = "https://wa.me/50662332535";
  const emailHref = `mailto:${TOUR_INFO.contact.email}`;

  const exploreLinks = [
    { href: "/info", label: copy.links.info, icon: Sparkles },
    { href: "/tours", label: copy.links.tours, icon: MapPin },
    { href: "/galeria", label: copy.links.gallery, icon: Instagram },
    { href: "/store", label: copy.links.store, icon: ShoppingBag },
    { href: "/organics", label: copy.links.organics, icon: Leaf },
    { href: "/wildo", label: copy.links.wildo, icon: Sparkles },
  ];

  const utilityLinks = [
    { href: "/tiempo", label: copy.links.weather, icon: CloudSun },
    { href: "/docs", label: copy.links.docs, icon: FileText },
    { href: "/ai", label: copy.links.ai, icon: Bot },
    { href: "/reservar", label: copy.links.booking, icon: MessageCircle },
  ];

  const legalLinks = [
    { href: "/terminos-y-condiciones", label: copy.links.terms, icon: ShieldCheck },
    { href: "/politica-de-privacidad", label: copy.links.privacy, icon: FileText },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-black text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 bg-emerald-500/10 blur-[140px]" />

      <div className="container relative z-10 mx-auto px-4 py-12 md:px-8 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="grid gap-6">
            <div>
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.32em] text-cyan-300">
                La Vieja Adventures
              </p>
              <h2 className="max-w-2xl text-3xl font-black leading-tight text-white md:text-4xl">
                Ciudad Esmeralda, Canon del Rio La Vieja
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 md:text-base">
                {copy.tagline}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <ContactAction href={whatsappHref} label={copy.whatsapp} value="+506 6233-2535" icon={<MessageCircle className="h-4 w-4" />} featured />
              <ContactAction href="tel:+50686430807" label={copy.call} value="+506 8643-0807" icon={<Phone className="h-4 w-4" />} />
              <ContactAction href={emailHref} label={copy.email} value={TOUR_INFO.contact.email} icon={<Mail className="h-4 w-4" />} />
            </div>

            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="group relative inline-flex h-12 min-w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:-translate-y-0.5 hover:border-white/35"
                  >
                    <span className={`absolute inset-0 bg-gradient-to-br ${social.className} opacity-0 transition group-hover:opacity-90`} />
                    <Icon className="relative z-10 h-5 w-5 text-white transition group-hover:text-black" />
                    <span className="relative z-10 ml-2 hidden text-xs font-black uppercase tracking-[0.16em] text-white transition group-hover:text-black sm:inline">
                      {social.label}
                    </span>
                  </a>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.045] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white">{copy.mapTitle}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">{copy.mapCopy}</p>
                </div>
                <a
                  href={LA_VIEJA_GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-cyan-200 transition hover:bg-cyan-300 hover:text-black"
                  aria-label={copy.maps}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <iframe
                  title="La Vieja Adventures en Google Maps"
                  src={LA_VIEJA_GOOGLE_MAPS_EMBED_URL}
                  loading="lazy"
                  className="h-72 w-full"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="mt-10 grid gap-6 border-t border-white/10 pt-8 md:grid-cols-3">
          <FooterLinkColumn title={copy.exploreTitle} links={exploreLinks} />
          <FooterLinkColumn title={copy.utilityTitle} links={utilityLinks} />
          <FooterLinkColumn title={copy.legalTitle} links={legalLinks} />
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {copy.copyright}</p>
          <p>Sucre, Ciudad Quesada, San Carlos, Alajuela, Costa Rica</p>
        </div>
      </div>
    </footer>
  );
}

function ContactAction({
  href,
  label,
  value,
  icon,
  featured = false,
}: {
  href: string;
  label: string;
  value: string;
  icon: ReactNode;
  featured?: boolean;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 ${
        featured
          ? "border-emerald-300/35 bg-emerald-300/12 shadow-[0_12px_40px_rgba(16,185,129,0.12)]"
          : "border-white/10 bg-white/[0.045] hover:border-cyan-300/30"
      }`}
    >
      <p className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">
        {icon}
        {label}
      </p>
      <p className="break-words text-sm font-bold leading-snug text-white">{value}</p>
    </a>
  );
}

function FooterLinkColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string; icon: LucideIcon }>;
}) {
  return (
    <nav aria-label={title}>
      <h3 className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-zinc-500">{title}</h3>
      <div className="grid gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group inline-flex items-center gap-2 rounded-xl border border-transparent px-2 py-2 text-sm font-semibold text-zinc-300 transition hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
            >
              <Icon className="h-4 w-4 text-cyan-300/70 transition group-hover:text-cyan-200" aria-hidden />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
