"use client";

import {
  memo,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ComponentType,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  CalendarCheck,
  CloudSun,
  Compass,
  GalleryHorizontal,
  Globe,
  HelpCircle,
  Home,
  Info as InfoIcon,
  LayoutGrid,
  MessageCircle,
  ShoppingBag,
  X,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { translations } from "@/lib/translations";
import { principalContent } from "@/lib/constants/principal";

const WHATSAPP_RESERVAS_HREF = "https://wa.me/50662332535";

const MORE_PATH_PREFIXES = ["/info", "/tiempo", "/preguntas-frecuentes", "/ai", "/docs", "/store"];

const MOBILE_NAV_HEIGHT = "4.25rem";

interface NavLinkItem {
  href: string;
  label: string;
  variant?: "default" | "primary";
  external?: boolean;
}

// ─── LangToggle ───────────────────────────────────────────────────────────────
const LangToggle = memo<{ onClick: () => void; currentLang: string; compact?: boolean }>(
  ({ onClick, currentLang, compact }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={currentLang === "es" ? "Switch to English" : "Cambiar a Español"}
      className={[
        "emerald-wave-button rounded-full border border-emerald-100/35 bg-white/10 font-bold text-white",
        "shadow-[0_8px_24px_rgba(6,78,59,0.22),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-xl",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-100/70 hover:bg-emerald-100/20",
        compact
          ? "flex min-h-11 min-w-11 items-center justify-center gap-1 px-2.5 py-1.5 text-xs"
          : "min-w-[40px] px-3 py-1.5 text-center text-sm",
      ].join(" ")}
    >
      {compact && <Globe size={12} />}
      {currentLang === "es" ? "EN" : "ES"}
    </button>
  ),
);
LangToggle.displayName = "LangToggle";

// ─── Site header ──────────────────────────────────────────────────────────────
export const SiteHeader = memo<{ isScrolled?: boolean }>(({ isScrolled = false }) => {
  const { lang, toggle } = useLanguage();
  const tr = translations[lang].nav;
  const copy = principalContent[lang].header;
  const pathname = usePathname();

  const navLinks: NavLinkItem[] = [
    { href: "/info", label: tr.info },
    { href: "/tours", label: tr.tours },
    { href: "/store", label: tr.store },
    { href: "/galeria", label: tr.gallery },
    { href: "/tiempo", label: copy.forecast },
  ];

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50",
        "border-b border-emerald-100/15 backdrop-blur-2xl",
        "transition-all duration-300",
        isScrolled
          ? "bg-[linear-gradient(120deg,rgba(6,78,59,0.92),rgba(4,47,46,0.85)_48%,rgba(5,150,105,0.40))] shadow-[0_14px_48px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.12)]"
          : "bg-[linear-gradient(120deg,rgba(6,78,59,0.48),rgba(4,47,46,0.34)_50%,rgba(16,185,129,0.18))] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-200/45 to-transparent" />

      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-20 md:px-8">
        <Link href="/" className="group/logo flex min-w-0 items-center gap-2.5">
          <span className="emerald-logo-shell relative grid shrink-0 place-items-center rounded-xl border border-emerald-100/25 bg-white/10 p-1 shadow-[0_12px_34px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.24)] backdrop-blur-xl transition-all duration-500 group-hover/logo:-translate-y-0.5 group-hover/logo:border-emerald-100/[0.55] group-hover/logo:bg-emerald-100/[0.16] md:rounded-2xl md:p-1.5">
            <Image
              src="/logo2.jpg"
              alt="La Vieja Adventures"
              width={52}
              height={52}
              className="h-9 w-9 rounded-lg object-cover transition-all duration-500 group-hover/logo:scale-[1.03] md:h-[52px] md:w-[52px] md:rounded-xl"
              priority
            />
          </span>
          <span className="truncate font-black leading-tight tracking-tight text-white">
            <span className="block text-lg md:hidden">La Vieja</span>
            <span className="brand-glow-text hidden text-2xl md:block">La Vieja Adventures</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "group/nl relative flex flex-col items-center rounded-full px-3.5 py-2 transition-all duration-200",
                  isActive
                    ? "bg-emerald-300/10 text-emerald-100"
                    : "text-white/75 hover:bg-emerald-300/[0.08] hover:text-white",
                ].join(" ")}
              >
                {link.label}
                <span
                  className={[
                    "absolute bottom-1.5 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-teal-400 transition-all duration-200",
                    isActive
                      ? "w-4 opacity-100"
                      : "w-0 opacity-0 group-hover/nl:w-3 group-hover/nl:opacity-50",
                  ].join(" ")}
                />
              </Link>
            );
          })}

          <div className="mx-2 h-5 w-px bg-white/15" />

          <a
            href={WHATSAPP_RESERVAS_HREF}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={lang === "es" ? "Hablar por WhatsApp" : "Chat on WhatsApp"}
            className="emerald-wave-button inline-flex items-center gap-2 rounded-full border border-emerald-100/25 bg-white/[0.08] px-3.5 py-2 text-sm font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-100/60 hover:bg-emerald-300/15 hover:text-emerald-50"
          >
            <MessageCircle size={16} className="text-emerald-200" />
            WhatsApp
          </a>
          <Link
            href="/reservar"
            className="emerald-wave-button rounded-full border border-emerald-200/[0.45] bg-emerald-300/[0.15] px-5 py-2 font-semibold text-white shadow-[0_8px_26px_rgba(6,78,59,0.28),inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-100/80 hover:bg-emerald-200/25 hover:text-white"
          >
            {tr.reserve}
          </Link>
          <LangToggle onClick={toggle} currentLang={lang} />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <a
            href={WHATSAPP_RESERVAS_HREF}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={lang === "es" ? "Hablar por WhatsApp" : "Chat on WhatsApp"}
            className="emerald-wave-button flex h-11 w-11 items-center justify-center rounded-full border border-emerald-100/30 bg-white/10 text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl transition hover:border-emerald-100/60 hover:bg-emerald-300/15 active:scale-95"
          >
            <MessageCircle size={17} />
          </a>
          <LangToggle onClick={toggle} currentLang={lang} compact />
        </div>
      </div>
    </header>
  );
});
SiteHeader.displayName = "SiteHeader";

// ─── Mobile more menu ─────────────────────────────────────────────────────────
interface MoreLink {
  href: string;
  label: string;
  description: string;
  Icon: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  external?: boolean;
}

const MobileMoreMenu = memo<{
  open: boolean;
  onClose: () => void;
}>(({ open, onClose }) => {
  const { lang } = useLanguage();
  const tr = translations[lang].nav;
  const copy = principalContent[lang].header;
  const sheetRef = useRef<HTMLDivElement>(null);
  const isEs = lang === "es";

  const links: MoreLink[] = [
    {
      href: "/store",
      label: tr.store,
      description: isEs ? "Equipo de montaña y marcas" : "Mountain gear and brands",
      Icon: ShoppingBag,
    },
    {
      href: "/info",
      label: tr.info,
      description: isEs ? "Tours, contacto y detalles" : "Tours, contact and details",
      Icon: InfoIcon,
    },
    {
      href: "/tiempo",
      label: tr.time,
      description: isEs ? "Lluvia, río y pronóstico" : "Rain, river and forecast",
      Icon: CloudSun,
    },
    {
      href: "/preguntas-frecuentes",
      label: isEs ? "Preguntas" : "FAQ",
      description: isEs ? "Respuestas rápidas" : "Quick answers",
      Icon: HelpCircle,
    },
    {
      href: "/ai",
      label: isEs ? "Asistente IA" : "AI assistant",
      description: isEs ? "Ayuda al instante" : "Instant help",
      Icon: Bot,
    },
  ];

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden" role="presentation">
      <button
        type="button"
        aria-label={copy.toggleMenuAria}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={isEs ? "Más opciones" : "More options"}
        className="absolute inset-x-0 bottom-0 rounded-t-[1.35rem] border border-emerald-100/20 bg-[linear-gradient(180deg,rgba(4,47,46,0.98),rgba(2,24,22,0.99))] px-4 pb-[calc(4.25rem+env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 shadow-[0_-24px_80px_rgba(0,0,0,0.55)]"
        style={{ animation: "lva-sheet-up 220ms ease-out" }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-teal-300/80">
              {isEs ? "Explorar más" : "Explore more"}
            </p>
            <h2 className="text-lg font-black text-white">{isEs ? "Menú" : "Menu"}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEs ? "Cerrar menú" : "Close menu"}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white transition active:scale-95 hover:bg-white/12"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {links.map(({ href, label, description, Icon, external }) => {
            const className =
              "group flex min-h-[4.5rem] flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-3.5 text-left transition active:scale-[0.98] hover:border-emerald-200/35 hover:bg-emerald-300/10";

            const content = (
              <>
                <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100/20 bg-emerald-300/10 text-teal-200">
                  <Icon size={18} strokeWidth={2.25} />
                </span>
                <span>
                  <span className="block text-sm font-black text-white">{label}</span>
                  <span className="mt-0.5 block text-[11px] font-medium leading-snug text-white/45">
                    {description}
                  </span>
                </span>
              </>
            );

            if (external) {
              return (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                  onClick={onClose}
                >
                  {content}
                </a>
              );
            }

            return (
              <Link key={href} href={href} className={className} onClick={onClose}>
                {content}
              </Link>
            );
          })}
        </div>

        <a
          href={WHATSAPP_RESERVAS_HREF}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="emerald-wave-button mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-100/25 bg-emerald-400/15 text-sm font-black text-emerald-50 transition active:scale-[0.98] hover:bg-emerald-400/22"
        >
          <MessageCircle size={17} />
          {isEs ? "Reservar por WhatsApp" : "Book via WhatsApp"}
        </a>
      </div>

      <style jsx>{`
        @keyframes lva-sheet-up {
          from {
            transform: translateY(100%);
            opacity: 0.6;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
});
MobileMoreMenu.displayName = "MobileMoreMenu";

const isPathActive = (pathname: string, href: string) => {
  if (href === "/") return pathname === "/";
  if (href === "/reservar") {
    return pathname === "/reservar" || pathname.startsWith("/booking");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
};

// ─── Mobile bottom tab bar ────────────────────────────────────────────────────
export const MobileBottomNav = memo(() => {
  const pathname = usePathname() ?? "";
  const { lang } = useLanguage();
  const tr = translations[lang].nav;
  const [moreOpen, setMoreOpen] = useState(false);

  const closeMore = useCallback(() => setMoreOpen(false), []);

  type MobileTab =
    | {
        id: string;
        href: string;
        label: string;
        Icon: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
        isPrimary?: boolean;
      }
    | {
        id: string;
        label: string;
        Icon: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
        isMore: true;
      };

  const tabs: MobileTab[] = [
    { id: "home", href: "/", label: lang === "es" ? "Inicio" : "Home", Icon: Home },
    { id: "tours", href: "/tours", label: tr.tours, Icon: Compass },
    {
      id: "reserve",
      href: "/reservar",
      label: lang === "es" ? "Reservar" : "Book",
      Icon: CalendarCheck,
      isPrimary: true,
    },
    { id: "gallery", href: "/galeria", label: tr.gallery, Icon: GalleryHorizontal },
    { id: "more", label: lang === "es" ? "Más" : "More", Icon: LayoutGrid, isMore: true },
  ];

  const isMoreActive = MORE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  return (
    <>
      <MobileMoreMenu open={moreOpen} onClose={closeMore} />

      <nav
        className="fixed inset-x-0 bottom-0 z-50 md:hidden"
        aria-label={lang === "es" ? "Navegación principal" : "Main navigation"}
      >
        <div className="absolute inset-0 border-t border-emerald-100/20 bg-teal-950/95 shadow-[0_-6px_32px_rgba(0,0,0,0.55)] backdrop-blur-2xl" />

        <div
          className="relative grid grid-cols-5 items-end"
          style={{
            height: `calc(${MOBILE_NAV_HEIGHT} + env(safe-area-inset-bottom, 0px))`,
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {tabs.map((tab) => {
            const { label, Icon } = tab;

            if (!("href" in tab)) {
              const isActive = isMoreActive;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMoreOpen(true)}
                  aria-expanded={moreOpen}
                  aria-haspopup="dialog"
                  aria-label={lang === "es" ? "Abrir más opciones" : "Open more options"}
                  className="relative flex min-h-[52px] flex-col items-center justify-center gap-1 py-2 transition-transform active:scale-95"
                >
                  {isActive && (
                    <span className="absolute inset-x-1 top-1.5 h-9 rounded-xl bg-teal-500/[0.13]" />
                  )}
                  <Icon
                    size={22}
                    strokeWidth={isActive || moreOpen ? 2.5 : 1.75}
                    className={`relative transition-all duration-150 ${
                      isActive || moreOpen
                        ? "text-teal-400 drop-shadow-[0_0_6px_rgba(45,212,191,0.55)]"
                        : "text-white/40"
                    }`}
                  />
                  <span
                    className={`relative text-[10px] font-semibold leading-none transition-colors duration-150 ${
                      isActive || moreOpen ? "font-bold text-teal-400" : "text-white/40"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            }

            const { href } = tab;
            const isActive = isPathActive(pathname, href);

            if (tab.isPrimary) {
              return (
                <Link
                  key={tab.id}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className="relative flex min-h-[52px] flex-col items-center justify-end pb-2 transition-transform active:scale-95"
                >
                  <span
                    className={[
                      "mb-1 flex h-11 w-11 -translate-y-2 items-center justify-center rounded-full shadow-[0_4px_24px_rgba(20,184,166,0.65),0_0_0_3px_rgba(2,44,34,0.95)] transition-transform",
                      isActive
                        ? "bg-teal-300 shadow-[0_0_0_5px_rgba(20,184,166,0.28)]"
                        : "bg-teal-500",
                    ].join(" ")}
                  >
                    <Icon size={21} className="text-white" strokeWidth={2.5} />
                  </span>
                  <span
                    className={[
                      "-mt-0.5 text-[10px] font-bold leading-none",
                      isActive ? "text-teal-300" : "text-teal-400",
                    ].join(" ")}
                  >
                    {label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.id}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className="relative flex min-h-[52px] flex-col items-center justify-center gap-1 py-2 transition-transform active:scale-95"
              >
                {isActive && (
                  <span className="absolute inset-x-1 top-1.5 h-9 rounded-xl bg-teal-500/[0.13]" />
                )}
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.75}
                  className={`relative transition-all duration-150 ${
                    isActive
                      ? "text-teal-400 drop-shadow-[0_0_6px_rgba(45,212,191,0.55)]"
                      : "text-white/40"
                  }`}
                />
                <span
                  className={`relative text-[10px] font-semibold leading-none transition-colors duration-150 ${
                    isActive ? "font-bold text-teal-400" : "text-white/40"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
});
MobileBottomNav.displayName = "MobileBottomNav";
