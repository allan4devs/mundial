import Image from "next/image";
import { BUSINESS, PALETTE, PRICE_FOOTER, SERVICE_NOTICE } from "./constants";
import { allergenLabel, formatCRC } from "./helpers";
import type { MenuItem } from "./types";

/**
 * Piezas compartidas por los siete artes. Todo lo que se imprime sale bilingüe:
 * el español manda en tamaño y el inglés va debajo, más chico. Ese es el
 * formato que ya usan los rótulos de ruta y el que espera el visitante
 * extranjero en zona turística de Costa Rica.
 */

export function ArtworkBrand({ darkText = false }: { darkText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 sm:gap-3">
      <div className="shrink-0 bg-[#2E2A25] p-1.5">
        <Image
          src="/logo2.jpg"
          alt=""
          width={64}
          height={64}
          className="h-11 w-11 object-contain sm:h-14 sm:w-14"
        />
      </div>
      <div className={darkText ? "text-[#2E2A25]" : "text-white"}>
        <p className="font-display text-[clamp(0.9rem,2.1vw,1.2rem)] font-black uppercase leading-none tracking-tight">
          {BUSINESS.cafe.es}
        </p>
        <p className="mt-1 text-[clamp(0.52rem,1.25vw,0.7rem)] font-extrabold uppercase tracking-[0.16em] opacity-70">
          {BUSINESS.name}
        </p>
      </div>
    </div>
  );
}

export function SignCode({ children, dark = false }: { children: string; dark?: boolean }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[clamp(0.5rem,1.2vw,0.65rem)] font-black uppercase tracking-[0.2em] ${
        dark
          ? "border-[#2E2A25]/20 bg-[#2E2A25]/5 text-[#2E2A25]"
          : "border-white/25 bg-white/10 text-white"
      }`}
    >
      {children}
    </span>
  );
}

/**
 * Título bilingüe: el español grande, el inglés debajo en cursiva. `compact`
 * es para las láminas que además cargan una lista larga de precios, donde el
 * titular tiene que cederle altura a lo que de verdad se viene a leer.
 */
export function BilingualHeading({
  es,
  enText,
  accent,
  compact = false,
  className = "",
}: {
  es: React.ReactNode;
  enText: string;
  accent: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <h2
        className={`font-display font-black uppercase leading-[0.85] tracking-[-0.055em] ${
          compact
            ? "text-[clamp(1.25rem,3.8vw,2.5rem)]"
            : "text-[clamp(1.7rem,5.4vw,3.8rem)]"
        }`}
      >
        {es}
      </h2>
      <p
        className={`mt-1.5 font-display font-bold italic leading-none tracking-[-0.01em] ${
          compact ? "text-[clamp(0.58rem,1.4vw,0.82rem)]" : "text-[clamp(0.66rem,1.7vw,1rem)]"
        }`}
        style={{ color: accent }}
      >
        {enText}
      </p>
    </div>
  );
}

/** Precio único, en la cápsula que se lee desde la fila. */
export function PriceTag({
  value,
  inverse = false,
  size = "md",
}: {
  value: number;
  inverse?: boolean;
  size?: "md" | "lg";
}) {
  return (
    <span
      className={`whitespace-nowrap rounded-full border px-2.5 py-1 font-black tracking-[0.02em] ${
        size === "lg"
          ? "text-[clamp(0.8rem,2.2vw,1.25rem)]"
          : "text-[clamp(0.58rem,1.45vw,0.84rem)]"
      } ${
        inverse
          ? "border-white/35 bg-white/12 text-white"
          : "border-[#2E2A25]/20 bg-white/70 text-[#2E2A25]"
      }`}
    >
      {formatCRC(value)}
    </span>
  );
}

/**
 * Renglón de menú con puntillo guía: nombre bilingüe a la izquierda, precio
 * (o los dos tamaños) alineado a la derecha. Es el formato de pizarra de barra
 * de toda la vida, el que la gente ya sabe leer.
 */
export function MenuRow({ item, dark = false }: { item: MenuItem; dark?: boolean }) {
  const allergens = allergenLabel(item.allergens);

  return (
    <div className="flex items-baseline gap-2">
      <div className="min-w-0">
        <p className="font-display text-[clamp(0.72rem,1.85vw,1.08rem)] font-black uppercase leading-[1.05] tracking-[-0.02em]">
          {item.name.es}
          {item.note ? (
            <span className="ml-1.5 whitespace-nowrap text-[clamp(0.46rem,1.05vw,0.62rem)] font-bold uppercase tracking-[0.06em] opacity-55">
              {item.note.es}
            </span>
          ) : null}
        </p>
        <p
          className="text-[clamp(0.48rem,1.12vw,0.66rem)] font-bold italic leading-tight opacity-60"
          style={{ color: dark ? PALETTE.turquoiseLight : PALETTE.turquoiseDeep }}
        >
          {item.name.en}
          {item.note ? ` · ${item.note.en}` : ""}
          {allergens ? (
            <span className="ml-1.5 not-italic opacity-70">· {allergens}</span>
          ) : null}
        </p>
      </div>

      <span
        className={`mx-1 hidden min-w-3 flex-1 translate-y-[-0.2em] border-b-2 border-dotted sm:block ${
          dark ? "border-white/25" : "border-[#2E2A25]/25"
        }`}
        aria-hidden
      />

      {item.prices ? (
        <span className="ml-auto flex shrink-0 items-baseline gap-1.5 sm:ml-0">
          <PriceTag value={item.prices.small} inverse={dark} />
          <PriceTag value={item.prices.large} inverse={dark} />
        </span>
      ) : (
        <span className="ml-auto shrink-0 sm:ml-0">
          <PriceTag value={item.price ?? 0} inverse={dark} />
        </span>
      )}
    </div>
  );
}

/**
 * Pie legal de precio. En Costa Rica el precio exhibido tiene que ser el final
 * con impuestos incluidos (Ley 7472, art. 34), así que va impreso en cada arte
 * que muestra montos.
 */
export function PriceFooter({
  dark = false,
  stamp = false,
}: {
  dark?: boolean;
  /** Mete el sello de borrador en la misma franja, en vez de una fila aparte. */
  stamp?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2 text-[clamp(0.44rem,1.05vw,0.6rem)] font-black uppercase tracking-[0.11em] ${
        dark ? "border-white/20 text-white/60" : "border-[#2E2A25]/20 text-[#2E2A25]/60"
      }`}
    >
      <span>{PRICE_FOOTER.es}</span>
      <span className="italic opacity-70">{PRICE_FOOTER.en}</span>
      <span className="opacity-70">{SERVICE_NOTICE.es}</span>
      {stamp ? (
        <span className="ml-auto">
          <DraftStamp dark={dark} />
        </span>
      ) : null}
    </div>
  );
}

/** Sello de borrador: sale en todos los artes mientras sean propuesta. */
export function DraftStamp({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className="shrink-0 px-2.5 py-1 text-[clamp(0.44rem,1.05vw,0.6rem)] font-black uppercase tracking-[0.16em]"
      style={{
        backgroundColor: PALETTE.amber,
        color: dark ? PALETTE.inkDeep : PALETTE.ink,
      }}
    >
      Borrador · Draft
    </span>
  );
}
