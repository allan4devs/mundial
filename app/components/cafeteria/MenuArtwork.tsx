import Image from "next/image";
import { ArtworkBrand, PriceFooter, SignCode } from "./ArtworkChrome";
import { PALETTE, PHOTOS } from "./constants";
import { formatCRC, sectionFrom } from "./helpers";
import { MENU_SECTIONS } from "./menu-data";
import styles from "./CafeteriaSigns.module.css";

/**
 * C-01 · La pieza de entrada. No lista precio por precio: da las tres familias
 * con su "desde", para que el cliente sepa en qué rango se está metiendo antes
 * de llegar a la barra. La foto del cañón va detrás, muy apagada, porque es lo
 * único real que tenemos: todavía no hay fotografía de producto.
 */
export default function MenuArtwork() {
  return (
    <div
      className={`${styles.artboard} ${styles.menuTexture} bg-[#2E2A25] text-white`}
      role="img"
      aria-label="Propuesta de rótulo para el menú general de la cafetería"
    >
      <Image
        src={PHOTOS.menu}
        alt=""
        fill
        sizes="(min-width: 1100px) 70vw, 100vw"
        className="object-cover object-center opacity-[0.22]"
      />
      <div className={`absolute inset-0 ${styles.menuOverlay}`} />
      <div className="absolute -right-[12%] -top-[24%] h-[72%] w-[44%] rotate-12 rounded-[50%] bg-[#00C4B0]/85" />
      <div className="absolute -bottom-[46%] -left-[18%] h-[70%] w-[75%] -rotate-6 rounded-[50%] border-[clamp(1rem,4vw,2.5rem)] border-[#00C4B0]/20" />

      <div className="absolute inset-0 flex flex-col p-[clamp(1.1rem,4vw,2.8rem)]">
        <div className="relative z-10 flex items-start justify-between gap-3">
          <ArtworkBrand />
          <SignCode dark>C-01</SignCode>
        </div>

        <div className="relative z-10 mt-auto pt-5">
          <p className="text-[clamp(0.56rem,1.45vw,0.8rem)] font-black uppercase tracking-[0.24em] text-[#8EF2E6]">
            Un gustico en el camino · A little treat along the way
          </p>
          <h2 className="mt-1.5 font-display text-[clamp(3.4rem,13vw,7.6rem)] font-black uppercase leading-[0.86] tracking-[-0.07em]">
            Menú
            <span className="ml-3 font-display text-[clamp(1.1rem,3.6vw,2.2rem)] font-bold italic tracking-[-0.02em] text-[#8EF2E6]">
              Menu
            </span>
          </h2>
        </div>

        <div className="relative z-10 mt-[clamp(0.9rem,2.6vw,1.7rem)] grid gap-2 sm:grid-cols-3 sm:gap-3">
          {MENU_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className="flex items-center gap-3 border border-white/15 bg-[#2E2A25]/70 px-3 py-2.5 backdrop-blur-sm sm:block sm:p-4"
              >
                <Icon
                  className="h-7 w-7 shrink-0 text-[#00C4B0] sm:h-9 sm:w-9"
                  strokeWidth={2.2}
                  aria-hidden
                />
                <div className="min-w-0 flex-1 sm:mt-3.5">
                  <p className="font-display text-[clamp(0.8rem,2.3vw,1.2rem)] font-black uppercase leading-none">
                    {section.title.es}
                  </p>
                  <p className="mt-1 text-[clamp(0.52rem,1.2vw,0.7rem)] font-bold italic leading-none text-[#8EF2E6]/80">
                    {section.title.en}
                  </p>
                  <p className="mt-1.5 text-[clamp(0.55rem,1.3vw,0.74rem)] font-semibold leading-snug text-white/60">
                    {section.teaser.es}
                  </p>
                </div>
                <p
                  className="ml-auto shrink-0 whitespace-nowrap font-display text-[clamp(0.72rem,2vw,1.05rem)] font-black tracking-[-0.02em] sm:ml-0 sm:mt-3"
                  style={{ color: PALETTE.amber }}
                >
                  <span className="text-[0.7em] uppercase opacity-70">desde / from </span>
                  {formatCRC(sectionFrom(section.items))}
                </p>
              </div>
            );
          })}
        </div>

        <div className="relative z-10 mt-3">
          <PriceFooter dark stamp />
        </div>
      </div>
    </div>
  );
}
