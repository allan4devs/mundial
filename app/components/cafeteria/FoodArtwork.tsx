import Image from "next/image";
import { Sandwich } from "lucide-react";
import {
  ArtworkBrand,
  BilingualHeading,
  MenuRow,
  PriceFooter,
  SignCode,
} from "./ArtworkChrome";
import { ALLERGEN_NOTICE, PHOTOS } from "./constants";
import { FOOD } from "./menu-data";
import styles from "./CafeteriaSigns.module.css";

/**
 * C-04 · Las comidas. Cada renglón declara sus alérgenos al lado del precio:
 * no es obligatorio para comida preparada en Costa Rica, pero es lo que se
 * espera de una cafetería que atiende visitantes extranjeros y evita sustos.
 */
export default function FoodArtwork() {
  return (
    <div
      className={`${styles.artboard} bg-[#2E2A25] text-white`}
      role="img"
      aria-label="Propuesta de rótulo con precios de empanadas, sándwiches y tortillas"
    >
      <div className="absolute right-0 top-0 h-full w-[23%] overflow-hidden bg-[#F3A712]">
        <Image
          src={PHOTOS.food}
          alt=""
          fill
          sizes="25vw"
          className="object-cover object-center opacity-25 mix-blend-multiply"
        />
      </div>
      <div className="absolute -right-[7%] top-[8%] h-[42%] w-[25%] rotate-12 rounded-full border-[clamp(0.8rem,2.8vw,1.8rem)] border-[#2E2A25]/18" />

      <div className="absolute inset-0 flex flex-col p-[clamp(1.1rem,4vw,2.8rem)]">
        <div className="relative z-10 flex items-start justify-between gap-3">
          <ArtworkBrand />
          <SignCode dark>C-04</SignCode>
        </div>

        <div className="relative z-10 mt-[clamp(0.5rem,1.6vw,1rem)] flex items-end justify-between gap-4">
          <div className="min-w-0 max-w-[70%]">
            <p className="text-[clamp(0.55rem,1.45vw,0.78rem)] font-black uppercase tracking-[0.26em] text-[#76EBDE]">
              {FOOD.title.es} · {FOOD.title.en}
            </p>
            <BilingualHeading
              compact
              className="mt-1.5"
              accent="#F3A712"
              es={
                <>
                  ¿Le pegó
                  <span className="block text-[#F3A712]">el hambre?</span>
                </>
              }
              enText="Hungry after the trail?"
            />
          </div>
          <Sandwich
            className="hidden h-[clamp(3rem,6.5vw,5rem)] w-[clamp(3rem,6.5vw,5rem)] shrink-0 text-[#2E2A25]/45 sm:block"
            strokeWidth={1.6}
            aria-hidden
          />
        </div>

        <div className="relative z-10 mt-auto w-full max-w-[76%] pt-[clamp(0.5rem,1.5vw,0.9rem)]">
          <div className="grid gap-x-[clamp(0.8rem,2.4vw,1.8rem)] sm:grid-cols-2">
            {FOOD.items.map((item) => (
              <div
                key={item.name.es}
                className="border-b border-white/12 py-[clamp(0.24rem,0.75vw,0.46rem)]"
              >
                <MenuRow item={item} dark />
              </div>
            ))}
          </div>

          <p className="mt-2 flex flex-wrap items-center gap-x-2 border-l-4 border-[#F3A712] bg-white/[0.07] px-2.5 py-1 text-[clamp(0.46rem,1.05vw,0.62rem)] font-black uppercase tracking-[0.1em] text-[#FFD67A]">
            {ALLERGEN_NOTICE.es}
            <span className="font-bold italic normal-case text-white/50">
              {ALLERGEN_NOTICE.en}
            </span>
          </p>

          <div className="mt-2">
            <PriceFooter dark stamp />
          </div>
        </div>
      </div>
    </div>
  );
}
