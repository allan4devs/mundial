import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Ref } from "react";
import EditableSignCanvas from "../rotulos/layout-editor/EditableSignCanvas";
import MovableGroup from "../rotulos/layout-editor/MovableGroup";
import QrCode from "../rotulos/QrCode";
import SocialMark from "../rotulos/SocialMark";
import { BUSINESS, SOCIALS, TEXT_SHADOW } from "../rotulos/constants";
import { CanyonLines } from "../rotulos/SignChrome";
import type { Flyer } from "./types";

type FlyerPanelProps = {
  flyer: Flyer;
  /** Solo la primera tarjeta de la página: evita el aviso de LCP. */
  eager?: boolean;
  /** Nodo del lienzo (marco blanco incluido) para exportarlo a imagen HQ. */
  ref?: Ref<HTMLDivElement>;
};

const FEATURED_SOCIALS = SOCIALS.slice(0, 2);

/**
 * Publicación vertical 2:3 tipo Instagram: foto a sangre, gradación de color
 * con el acento de marca, líneas de cañón como textura y los mismos objetos
 * movibles que un rótulo de carretera, pero pensados para leerse en un feed.
 */
export default function FlyerPanel({ flyer, eager, ref }: FlyerPanelProps) {
  const Icon = flyer.icon;

  return (
    <div data-flyer-artwork className="relative w-full">
      <div className="mx-auto w-full max-w-[560px] [container-type:inline-size] drop-shadow-[0_28px_45px_rgba(0,0,0,0.5)]">
        <EditableSignCanvas
          ref={ref}
          panelId={flyer.layoutId}
          revision={1}
          label={{ es: flyer.title, en: flyer.titleEn }}
          className="relative isolate flex aspect-[2/3] w-full flex-col overflow-hidden rounded-[26px] border-[6px] border-white bg-[#2E2A25] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"
        >
          <Image
            src={flyer.photo}
            alt=""
            fill
            sizes="(max-width: 768px) 92vw, 560px"
            priority={eager}
            className="object-cover saturate-[1.15] contrast-[1.05]"
          />

          {/* Degradado para legibilidad: casi transparente arriba, sólido abajo */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />

          {/* Gradación de color con el acento de marca sobre la fotografía */}
          {flyer.accent.wash ? (
            <div
              className="pointer-events-none absolute inset-0 mix-blend-soft-light"
              style={{
                backgroundImage: `radial-gradient(120% 85% at 14% 0%, ${flyer.accent.wash}, transparent 62%)`,
              }}
            />
          ) : null}

          {/* Líneas de cañón/río: la misma textura que el interior del isotipo */}
          <div className="pointer-events-none absolute inset-y-0 -right-3 z-[5] w-24 text-white opacity-[0.16] sm:w-32">
            <CanyonLines className="h-full w-full" />
          </div>

          <div className="relative z-10 flex items-start justify-between gap-3 p-4 sm:p-5">
            <MovableGroup
              groupId="kicker"
              label={{ es: "Encabezado", en: "Eyebrow" }}
              className="flex w-fit max-w-[72%] items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] shadow-lg ring-1 ring-white/25 sm:text-xs"
              style={{ backgroundColor: flyer.accent.bg, color: flyer.accent.text }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
              <span className="truncate">{flyer.kicker}</span>
            </MovableGroup>

            <MovableGroup
              groupId="logo"
              label={{ es: "Logo", en: "Logo" }}
              className="shrink-0 rounded-full border border-white/30 bg-[rgba(24,24,27,0.55)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_10px_30px_-16px_rgba(0,0,0,0.85)] ring-2 ring-[#00C4B0]/70 backdrop-blur-md"
            >
              <Image
                src="/logo2.jpg"
                alt="La Vieja Adventures"
                width={64}
                height={64}
                className="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10"
              />
            </MovableGroup>
          </div>

          <div className="relative z-10 mt-auto flex flex-col gap-3 p-4 sm:gap-4 sm:p-6">
            <MovableGroup
              groupId="copy"
              label={{ es: "Título y detalles", en: "Title and details" }}
              className="w-fit max-w-full"
            >
              <p className="font-[family-name:var(--font-bricolage)] text-[clamp(1.85rem,9.5cqw,3.5rem)] font-black uppercase leading-[0.9] tracking-[-0.03em] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]">
                {flyer.title}
              </p>
              <p className="mt-1.5 text-[clamp(0.7rem,2.6cqw,1rem)] font-bold uppercase tracking-[0.1em] text-white/75">
                {flyer.titleEn}
              </p>
              <p
                className="mt-3 inline-block max-w-[94%] rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-[clamp(0.78rem,3cqw,1.05rem)] font-bold leading-snug text-white backdrop-blur-sm"
              >
                {flyer.subtitle}
              </p>
            </MovableGroup>

            {flyer.weatherDependent ? (
              <MovableGroup
                groupId="safety"
                label={{ es: "Nota de seguridad", en: "Safety note" }}
                className="w-fit max-w-full"
              >
                <p className={`text-[9px] font-bold uppercase tracking-[0.06em] text-white/75 sm:text-[10px] ${TEXT_SHADOW}`}>
                  {"Sujeto a clima y nivel del río · Guías certificados"}
                </p>
              </MovableGroup>
            ) : null}

            <div className="flex items-end justify-between gap-3">
              <MovableGroup
                groupId="cta"
                label={{ es: "Llamado a la acción", en: "Call to action" }}
                className="inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-[clamp(0.8rem,3.6cqw,1.05rem)] font-black uppercase tracking-[0.03em] shadow-[0_14px_28px_-14px_rgba(0,0,0,0.85)]"
                style={{ backgroundColor: flyer.accent.bg, color: flyer.accent.text }}
              >
                {flyer.cta.es}
                <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden />
              </MovableGroup>

              {flyer.showQr ? (
                <MovableGroup
                  groupId="qr"
                  label={{ es: "Código QR", en: "QR code" }}
                  className="w-fit shrink-0 rounded-xl bg-white p-1.5 shadow-xl shadow-black/40 ring-1 ring-black/5"
                >
                  <QrCode className="h-14 w-14 sm:h-16 sm:w-16" />
                </MovableGroup>
              ) : null}
            </div>

            <MovableGroup
              groupId="footer"
              label={{ es: "Contacto y redes", en: "Contact and social" }}
              className="flex w-full flex-col gap-2 pt-1"
            >
              <div
                className="h-[2px] w-full rounded-full opacity-70"
                style={{ backgroundColor: flyer.accent.bg }}
                aria-hidden
              />
              <div className="flex w-full items-center justify-between gap-3">
                <span
                  className={`truncate text-[11px] font-black uppercase tracking-[0.08em] text-white sm:text-xs ${TEXT_SHADOW}`}
                >
                  {BUSINESS.handle}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  {FEATURED_SOCIALS.map((social) => (
                    <SocialMark
                      key={social.label}
                      path={social.path}
                      className={`h-4 w-4 text-white/90 ${TEXT_SHADOW}`}
                    />
                  ))}
                </div>
              </div>
            </MovableGroup>
          </div>
        </EditableSignCanvas>
      </div>
    </div>
  );
}
