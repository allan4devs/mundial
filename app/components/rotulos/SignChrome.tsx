import type { CSSProperties } from "react";
import { AMENITIES, PICTOGRAMS } from "./constants";

/**
 * Piezas de "carpintería" compartidas entre láminas: lo que hace que un
 * rótulo se vea como un objeto físico montado afuera y no como una tarjeta
 * plana de UI. Esquinas redondeadas + poste + sombra de piso son lo que
 * saca la silueta del rectángulo normal; la hoja es el único guiño a
 * naturaleza, y siempre por debajo del texto en jerarquía visual.
 */

const LEAF_D =
  "M50 4C78 10 92 34 90 58C88 82 70 104 50 116C30 104 12 82 10 58C8 34 22 10 50 4Z";

const LEAF_VEINS = [
  "M50 14L50 108",
  "M50 34C40 38 32 46 27 56",
  "M50 34C60 38 68 46 73 56",
  "M50 58C41 61 34 68 29 76",
  "M50 58C59 61 66 68 71 76",
  "M50 80C43 82 37 88 33 94",
  "M50 80C57 82 63 88 67 94",
];

type LeafShapeProps = {
  className?: string;
  style?: CSSProperties;
  veins?: boolean;
};

/** Silueta de hoja: textura de fondo o acento suelto, nunca protagonista. */
export function LeafShape({ className, style, veins }: LeafShapeProps) {
  return (
    <svg viewBox="0 0 100 120" className={className} style={style} fill="currentColor" aria-hidden>
      <path d={LEAF_D} />
      {veins ? (
        <g stroke="rgba(0,0,0,0.25)" strokeWidth={2.4} strokeLinecap="round" fill="none">
          {LEAF_VEINS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      ) : null}
    </svg>
  );
}

const RIVER_LINES = [
  "M14 0C28 26 2 52 16 78C30 104 4 130 18 156C30 178 12 196 20 220",
  "M40 0C52 24 30 50 44 76C58 102 34 128 46 154C58 176 38 196 48 220",
  "M66 0C76 22 58 48 70 74C82 100 62 126 72 152C82 174 64 194 74 220",
];

/**
 * Líneas de cañón/río, el mismo trazo ondulado que forma el interior del
 * isotipo. Textura de marca reconocible sin tocar el archivo del logo.
 */
export function CanyonLines({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 88 220" className={className} style={style} fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth={3.5} strokeLinecap="round">
        {RIVER_LINES.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}

/** Dos hojas superpuestas: el acento que se posa junto a un pictograma o flecha. */
export function LeafSprig({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 46" className={className} fill="currentColor" aria-hidden>
      <g transform="translate(-2 -6) rotate(-14 22 26) scale(0.36)">
        <path d={LEAF_D} opacity={0.82} />
      </g>
      <g transform="translate(20 2) rotate(18 22 26) scale(0.3)">
        <path d={LEAF_D} />
      </g>
    </svg>
  );
}

/**
 * Costura ondulada entre la foto y la franja de color: rompe el corte recto
 * de rectángulo normal sin sacrificar el área legible de abajo.
 */
export function WaveSeam({ fill, className }: { fill: string; className?: string }) {
  return (
    <svg viewBox="0 0 400 44" preserveAspectRatio="none" className={className} aria-hidden>
      <path d="M0 44V20C60 4 140 2 200 16C262 30 340 30 400 12V44Z" fill={fill} />
    </svg>
  );
}

/** Los dos postes que sostienen la lámina: lo que la saca del rectángulo plano. */
export function SignPosts({ color, className }: { color: string; className?: string }) {
  return (
    <div className={`flex items-start justify-center gap-10 sm:gap-14 ${className ?? ""}`} aria-hidden>
      {[0, 1].map((i) => (
        <span
          key={i}
          className="block h-8 w-3 rounded-b-[3px] shadow-[2px_2px_3px_rgba(0,0,0,0.35)] sm:h-11 sm:w-3.5"
          style={{ backgroundImage: `linear-gradient(90deg, ${color}, ${color}E6 55%, ${color}B3)` }}
        />
      ))}
    </div>
  );
}

/** Sombra de contacto en el piso: separa la lámina del fondo de la página. */
export function GroundShadow({ className }: { className?: string }) {
  return <div className={`mx-auto rounded-full bg-black/35 blur-md ${className ?? "h-2.5 w-28 sm:w-36"}`} aria-hidden />;
}

/**
 * Comida · wifi · baños · senderos: los mismos cuatro íconos en toda la
 * señalización, chicos y sin etiqueta, para que el visitante sepa qué hay en
 * el sitio sin competir con el mensaje principal de la lámina.
 */
export function AmenityRow({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className ?? ""}`} aria-hidden>
      {AMENITIES.map((key) => {
        const Icon = PICTOGRAMS[key];
        return (
          <div
            key={key}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border border-white/40 bg-white/5 sm:h-7 sm:w-7"
          >
            <Icon className="h-3.5 w-3.5 text-white/85 sm:h-4 sm:w-4" strokeWidth={2.25} />
          </div>
        );
      })}
    </div>
  );
}
