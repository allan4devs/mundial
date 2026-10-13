import { Coffee } from "lucide-react";
import {
  ArtworkBrand,
  BilingualHeading,
  MenuRow,
  PriceFooter,
  SignCode,
} from "./ArtworkChrome";
import { HOT_DRINKS } from "./menu-data";
import styles from "./CafeteriaSigns.module.css";

/**
 * C-02 · Pizarra de barra caliente. Dos columnas de precio, 8 y 12 onzas, que
 * es como se pide el café en Costa Rica. La taza vectorial se queda: no hay
 * fotografía de producto y una taza dibujada imprime mejor que una foto mala.
 */
export default function HotDrinksArtwork() {
  return (
    <div
      className={`${styles.artboard} border-[clamp(0.7rem,2.2vw,1.25rem)] border-[#00C4B0] bg-[#F7F0E5] text-[#2E2A25]`}
      role="img"
      aria-label="Propuesta de rótulo con precios de café, chocolate y agua dulce"
    >
      <div className="absolute -right-[10%] top-[12%] h-[45%] w-[24%] rounded-l-full bg-[#00C4B0]/18" />
      <div className="absolute inset-0 flex flex-col p-[clamp(1rem,3.5vw,2.5rem)]">
        <div className="flex items-start justify-between gap-3">
          <ArtworkBrand darkText />
          <SignCode dark>C-02</SignCode>
        </div>

        <div className="mt-[clamp(0.5rem,1.6vw,1rem)] grid grid-cols-[0.34fr_1.66fr] items-center gap-[clamp(0.7rem,2.2vw,1.5rem)]">
          <div className="relative flex aspect-square items-center justify-center rounded-full bg-[#2E2A25] text-white shadow-[0_24px_60px_rgba(46,42,37,0.22)]">
            <div className="absolute -top-[18%] left-[28%] h-[30%] w-[9%] -rotate-12 rounded-full border-l-[3px] border-[#00C4B0]/70" />
            <div className="absolute -top-[23%] left-[48%] h-[37%] w-[9%] rotate-6 rounded-full border-l-[3px] border-[#00C4B0]/70" />
            <div className="absolute -top-[17%] left-[66%] h-[28%] w-[9%] rotate-12 rounded-full border-l-[3px] border-[#00C4B0]/70" />
            <Coffee className="h-[48%] w-[48%]" strokeWidth={1.65} aria-hidden />
          </div>

          <div className="min-w-0">
            <p className="text-[clamp(0.55rem,1.4vw,0.78rem)] font-black uppercase tracking-[0.25em] text-[#006F65]">
              {HOT_DRINKS.title.es} · {HOT_DRINKS.title.en}
            </p>
            <BilingualHeading
              compact
              className="mt-1.5"
              accent="#006F65"
              es={
                <>
                  Calientito
                  <span className="block text-[#006F65]">cae bien</span>
                </>
              }
              enText="Something warm always helps"
            />
          </div>
        </div>

        <div className="mt-auto pt-[clamp(0.5rem,1.5vw,0.9rem)]">
          {/* Encabezado de las dos columnas: sin esto, dos precios confunden. */}
          <div className="flex items-end justify-end gap-1.5 border-b-2 border-[#2E2A25] pb-1.5">
            <span className="w-[clamp(3.1rem,7.2vw,4.6rem)] text-center text-[clamp(0.46rem,1.1vw,0.62rem)] font-black uppercase tracking-[0.12em] text-[#2E2A25]/60">
              8 oz
            </span>
            <span className="w-[clamp(3.1rem,7.2vw,4.6rem)] text-center text-[clamp(0.46rem,1.1vw,0.62rem)] font-black uppercase tracking-[0.12em] text-[#2E2A25]/60">
              12 oz
            </span>
          </div>

          <div className="divide-y divide-[#2E2A25]/12">
            {HOT_DRINKS.items.map((item) => (
              <div key={item.name.es} className="py-[clamp(0.2rem,0.62vw,0.38rem)]">
                <MenuRow item={item} />
              </div>
            ))}
          </div>

          <div className="mt-2">
            <PriceFooter stamp />
          </div>
        </div>
      </div>
    </div>
  );
}
