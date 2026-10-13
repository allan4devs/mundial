import Image from "next/image";
import {
  ArrowUp,
  ArrowUpRight,
  Award,
  Binoculars,
  Car,
  Mountain,
  ParkingCircle,
  Trees,
  UtensilsCrossed,
  Waves,
} from "lucide-react";
import { BUSINESS, SIGN_COLORS } from "./constants";
import QrCode from "./QrCode";
import { CanyonLines, LeafShape } from "./SignChrome";
import type { Variant } from "./types";

function SignFrame({
  children,
  color,
  className = "",
}: {
  children: React.ReactNode;
  color: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[3px] border-[3px] border-white p-2 shadow-[0_10px_24px_-12px_rgba(0,0,0,0.9)] ${className}`}
      style={{ backgroundColor: color }}
    >
      {children}
    </div>
  );
}

/** Maqueta de cada propuesta: colores planos, cero degradado, como se imprime. */
export default function ProposalMock({ variant }: { variant: Variant }) {
  if (variant === "mopt") {
    return (
      <div className="w-full max-w-[380px]">
        <div className="flex gap-1.5">
          <div
            className="flex w-[70px] flex-col items-center justify-center rounded-[3px] border-[3px] border-white py-2"
            style={{ backgroundColor: SIGN_COLORS.blue }}
          >
            <ArrowUp className="h-8 w-8 text-white" strokeWidth={3} aria-hidden />
            <span className="mt-1 text-sm font-black text-white">2 km</span>
          </div>
          <div
            className="flex flex-1 items-center justify-center gap-2 rounded-[3px] border-[3px] px-3 py-2"
            style={{ backgroundColor: SIGN_COLORS.yellow, borderColor: "#8a6b00" }}
          >
            <Image
              src="/logo2.jpg"
              alt=""
              width={38}
              height={38}
              className="rounded-sm object-cover"
            />
            <span className="text-lg font-black uppercase leading-none tracking-tight text-zinc-900">
              La Vieja
              <span className="block text-[10px] font-bold tracking-[0.18em]">ADVENTURES</span>
            </span>
          </div>
        </div>
        <SignFrame color={SIGN_COLORS.green} className="mt-1.5 text-center">
          <p className="text-2xl font-black uppercase tracking-wide text-white md:text-3xl">
            Cañón La Vieja
          </p>
        </SignFrame>
      </div>
    );
  }

  if (variant === "turistico") {
    return (
      <SignFrame color={SIGN_COLORS.brown} className="w-full max-w-[380px]">
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="flex flex-col items-center gap-1">
            <Waves className="h-12 w-12 text-white" strokeWidth={2.5} aria-hidden />
            <Mountain className="h-8 w-8 text-white" strokeWidth={2.5} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-black uppercase leading-none tracking-tight text-white">
              Cañón del Río
              <span className="block">La Vieja</span>
            </p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
              La Vieja River Canyon
            </p>
            <p className="mt-2 text-sm font-black uppercase tracking-wide text-white">
              La Vieja Adventures
            </p>
          </div>
          <div className="flex flex-col items-center border-l-2 border-white/60 pl-3">
            <ArrowUpRight className="h-9 w-9 text-white" strokeWidth={3} aria-hidden />
            <span className="mt-1 text-lg font-black text-white">2 km</span>
          </div>
        </div>
      </SignFrame>
    );
  }

  if (variant === "servicios") {
    return (
      <SignFrame color={SIGN_COLORS.blue} className="w-full max-w-[380px]">
        <p className="pb-2 text-center text-sm font-black uppercase tracking-[0.2em] text-white">
          Restaurante y Mirador
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { icon: UtensilsCrossed, es: "Comida", en: "Food" },
            { icon: Binoculars, es: "Mirador", en: "Lookout" },
            { icon: Car, es: "Parqueo", en: "Parking" },
          ].map((tile) => {
            const Icon = tile.icon;
            return (
              <div
                key={tile.es}
                className="flex flex-col items-center gap-1 rounded-[2px] bg-white px-1 py-2"
              >
                <Icon className="h-7 w-7 text-zinc-900" strokeWidth={2.5} aria-hidden />
                <span className="text-[10px] font-black uppercase leading-none text-zinc-900">
                  {tile.es}
                </span>
                <span className="text-[8px] font-bold uppercase leading-none text-zinc-500">
                  {tile.en}
                </span>
              </div>
            );
          })}
        </div>
        <p className="pt-2 text-center text-xs font-black uppercase tracking-[0.16em] text-white">
          La Vieja Adventures
        </p>
      </SignFrame>
    );
  }

  if (variant === "flecha") {
    return (
      <SignFrame color={SIGN_COLORS.green} className="w-full max-w-[380px]">
        <div className="flex items-center gap-3 px-1 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-black uppercase leading-none tracking-tight text-white">
              La Vieja
            </p>
            <p className="text-2xl font-black uppercase leading-none tracking-tight text-white">
              Adventures
            </p>
            <p className="mt-2 text-lg font-black text-white">1 km</p>
          </div>
          <ArrowUpRight className="h-20 w-20 shrink-0 text-white" strokeWidth={3} aria-hidden />
        </div>
      </SignFrame>
    );
  }

  if (variant === "portal") {
    return (
      <div className="w-full max-w-[380px] overflow-hidden rounded-[3px] border-[3px] border-white shadow-[0_10px_24px_-12px_rgba(0,0,0,0.9)]">
        <div className="relative h-[120px]">
          <Image
            src="/image/IMG_4671.jpg"
            alt=""
            fill
            sizes="380px"
            className="object-cover"
            style={{ objectPosition: "center 40%" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,78,59,0.95)_0%,rgba(6,78,59,0.35)_60%,transparent_100%)]" />
          <div className="absolute inset-0 flex items-center gap-2 p-3">
            <Image
              src="/logo2.jpg"
              alt=""
              width={52}
              height={52}
              className="rounded-lg border-2 border-white/80 object-cover"
            />
            <Image
              src="/logo1.jpg"
              alt=""
              width={52}
              height={52}
              className="rounded-lg border-2 border-white/80 object-cover"
            />
          </div>
        </div>
        <div style={{ backgroundColor: SIGN_COLORS.green }} className="px-3 py-3">
          <p className="text-xl font-black uppercase leading-none tracking-tight text-white">
            La Vieja Adventures
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
            Welcome &middot; Bienvenidos
          </p>
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/30 pt-2">
            <span className="text-sm font-black text-white">www.laviejaadventures.com</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-[2px] bg-white text-[7px] font-black leading-none text-zinc-900">
              QR
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "elegante") {
    return (
      <div className="w-full max-w-[300px]">
        <div
          className="relative overflow-hidden rounded-[4px] p-1.5 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.9)]"
          style={{ backgroundColor: SIGN_COLORS.wood }}
        >
          {/* Un solo guiño de naturaleza, al 6 %: se intuye, no se mira. */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden>
            <CanyonLines className="absolute -top-6 right-4 h-[170%] w-20 text-[#e6d6b4]" />
            <LeafShape
              veins
              className="absolute -bottom-7 -left-7 h-32 w-28 -rotate-[18deg] text-[#e6d6b4]"
            />
          </div>

          <div className="relative border border-[#9c7b45]/40 px-6 py-7">
            {[
              "left-0 top-0 border-l border-t",
              "right-0 top-0 border-r border-t",
              "bottom-0 left-0 border-b border-l",
              "bottom-0 right-0 border-b border-r",
            ].map((corner) => (
              <span
                key={corner}
                className={`pointer-events-none absolute h-2.5 w-2.5 border-[#9c7b45] ${corner}`}
                aria-hidden
              />
            ))}

            <div className="relative flex flex-col items-center text-center">
              <div className="rounded-full border border-[#9c7b45]/50 bg-black/30 p-1.5">
                <Image
                  src="/logo1.jpg"
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-contain"
                />
              </div>

              <p className="mt-4 font-serif text-lg font-semibold uppercase leading-none tracking-[0.35em] text-[#e6d6b4]">
                La Vieja
              </p>
              <p className="mt-1.5 font-serif text-[10px] uppercase tracking-[0.5em] text-[#e6d6b4]/75">
                Adventures
              </p>

              <div className="mt-3 flex w-full items-center gap-2">
                <span className="h-px flex-1 bg-[#9c7b45]/40" aria-hidden />
                <span className="text-[7px] uppercase tracking-[0.3em] text-[#cbb890]">
                  Cañón del Río La Vieja
                </span>
                <span className="h-px flex-1 bg-[#9c7b45]/40" aria-hidden />
              </div>

              <div className="mt-4 bg-white p-1">
                <QrCode className="h-12 w-12" />
              </div>

              <p className="mt-3 text-[7px] uppercase tracking-[0.22em] text-[#cbb890]/80">
                {BUSINESS.web.replace(/^www\./, "")}
              </p>
              <p className="mt-0.5 text-[7px] uppercase tracking-[0.22em] text-[#cbb890]/55">
                WhatsApp {BUSINESS.whatsapp}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[380px] flex-col items-start gap-1.5">
      {[
        { icon: ParkingCircle, es: "Parqueo", en: "Parking" },
        { icon: Award, es: "Recepción", en: "Check-in" },
        { icon: UtensilsCrossed, es: "Restaurante", en: "Restaurant" },
        { icon: Trees, es: "Sendero al cañón", en: "Canyon trail" },
      ].map((blade, index) => {
        const Icon = blade.icon;
        return (
          <div
            key={blade.es}
            className="flex items-center gap-3 rounded-[3px] border-2 border-amber-100/40 px-3 py-2 shadow-[0_8px_18px_-12px_rgba(0,0,0,0.9)]"
            style={{
              backgroundColor: SIGN_COLORS.wood,
              width: `${100 - index * 6}%`,
            }}
          >
            <Icon className="h-6 w-6 shrink-0 text-amber-100" strokeWidth={2.5} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-base font-black uppercase leading-none tracking-tight text-amber-50">
                {blade.es}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-100/60">
                {blade.en}
              </p>
            </div>
            <ArrowUpRight className="h-6 w-6 shrink-0 text-amber-100" strokeWidth={3} aria-hidden />
          </div>
        );
      })}
    </div>
  );
}
