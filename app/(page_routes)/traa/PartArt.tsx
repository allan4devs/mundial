import type { CategoryId } from "./data";

/**
 * Ilustración vectorial por categoría. El catálogo real muestra "Sin imagen";
 * acá cada repuesto llega con una lámina técnica sobre el escenario oscuro,
 * en el naranja de TRAA. Es determinística y no depende de la red — el campo
 * para cambiarla por una foto real sería trivial de agregar en data.ts.
 */

const METAL = "#6a635b";
const METAL_DIM = "#48423b";
const ACCENT = "#f0501e";
const GLASS = "rgba(255,255,255,0.03)";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 240 170" className="tr-art" role="img" aria-hidden="true">
      {children}
    </svg>
  );
}

function Gear() {
  return (
    <Frame>
      <circle cx="98" cy="85" r="52" fill="none" stroke={METAL_DIM} strokeWidth="13" strokeDasharray="7 11" />
      <circle cx="98" cy="85" r="40" fill={GLASS} stroke={METAL} strokeWidth="3" />
      <circle cx="98" cy="85" r="15" fill="none" stroke={ACCENT} strokeWidth="4" />
      <line x1="138" y1="85" x2="214" y2="85" stroke={METAL} strokeWidth="12" strokeLinecap="round" />
      <line x1="200" y1="72" x2="200" y2="98" stroke={METAL_DIM} strokeWidth="4" />
    </Frame>
  );
}

function BrakeDisc() {
  return (
    <Frame>
      <circle cx="104" cy="85" r="54" fill={GLASS} stroke={METAL} strokeWidth="4" />
      <circle cx="104" cy="85" r="21" fill="none" stroke={METAL} strokeWidth="4" />
      <circle cx="104" cy="85" r="6" fill={METAL} />
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={104 + Math.cos(a) * 26}
            y1={85 + Math.sin(a) * 26}
            x2={104 + Math.cos(a) * 48}
            y2={85 + Math.sin(a) * 48}
            stroke={METAL_DIM}
            strokeWidth="3"
          />
        );
      })}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        return <circle key={i} cx={104 + Math.cos(a) * 13} cy={85 + Math.sin(a) * 13} r="3.4" fill={METAL_DIM} />;
      })}
      <path
        d="M150 55 h40 a10 10 0 0 1 10 10 v40 a10 10 0 0 1 -10 10 h-40 z"
        fill="rgba(240,80,30,0.14)"
        stroke={ACCENT}
        strokeWidth="3"
      />
    </Frame>
  );
}

function Piston() {
  return (
    <Frame>
      <rect x="88" y="26" width="64" height="46" rx="7" fill={GLASS} stroke={METAL} strokeWidth="4" />
      <line x1="90" y1="40" x2="150" y2="40" stroke={METAL_DIM} strokeWidth="3" />
      <line x1="90" y1="48" x2="150" y2="48" stroke={METAL_DIM} strokeWidth="3" />
      <line x1="90" y1="56" x2="150" y2="56" stroke={METAL_DIM} strokeWidth="3" />
      <path d="M98 72 v22 M142 72 v22" stroke={METAL} strokeWidth="4" />
      <circle cx="120" cy="98" r="8" fill="none" stroke={ACCENT} strokeWidth="4" />
      <path d="M120 106 L120 142" stroke={METAL} strokeWidth="11" strokeLinecap="round" />
      <circle cx="120" cy="146" r="13" fill={GLASS} stroke={METAL} strokeWidth="6" />
    </Frame>
  );
}

function Shock() {
  return (
    <Frame>
      <line x1="120" y1="150" x2="120" y2="150" stroke={METAL} strokeWidth="1" />
      <path
        d="M96 44 L146 54 L96 66 L146 76 L96 88 L146 98 L96 110 L146 120"
        fill="none"
        stroke={ACCENT}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <rect x="108" y="96" width="26" height="50" rx="9" fill={GLASS} stroke={METAL} strokeWidth="4" />
      <line x1="121" y1="96" x2="121" y2="34" stroke={METAL} strokeWidth="6" strokeLinecap="round" />
      <circle cx="121" cy="30" r="8" fill="none" stroke={METAL} strokeWidth="4" />
      <circle cx="121" cy="150" r="8" fill="none" stroke={METAL} strokeWidth="4" />
    </Frame>
  );
}

function Alternator() {
  return (
    <Frame>
      <circle cx="100" cy="86" r="44" fill={GLASS} stroke={METAL} strokeWidth="4" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={100 + Math.cos(a) * 24}
            y1={86 + Math.sin(a) * 24}
            x2={100 + Math.cos(a) * 38}
            y2={86 + Math.sin(a) * 38}
            stroke={METAL_DIM}
            strokeWidth="3"
          />
        );
      })}
      <circle cx="100" cy="86" r="13" fill="none" stroke={METAL} strokeWidth="4" />
      <rect x="142" y="70" width="16" height="34" rx="3" fill={GLASS} stroke={METAL} strokeWidth="4" />
      <path d="M92 74 h15 l-7 13 h11 l-17 22 6 -17 -10 0 z" fill={ACCENT} />
    </Frame>
  );
}

function Filter() {
  return (
    <Frame>
      <rect x="94" y="34" width="52" height="100" rx="13" fill={GLASS} stroke={METAL} strokeWidth="4" />
      {Array.from({ length: 7 }).map((_, i) => (
        <line key={i} x1={102 + i * 6} y1="40" x2={102 + i * 6} y2="128" stroke={METAL_DIM} strokeWidth="2.5" />
      ))}
      <rect x="102" y="24" width="36" height="14" rx="5" fill="rgba(240,80,30,0.14)" stroke={ACCENT} strokeWidth="4" />
      <ellipse cx="120" cy="134" rx="26" ry="7" fill="none" stroke={METAL} strokeWidth="4" />
    </Frame>
  );
}

const MAP: Record<CategoryId, () => React.ReactElement> = {
  transmision: Gear,
  frenos: BrakeDisc,
  motor: Piston,
  suspension: Shock,
  electrico: Alternator,
  filtros: Filter,
};

export function PartArt({ category }: { category: CategoryId }) {
  const Art = MAP[category] ?? Gear;
  return <Art />;
}
