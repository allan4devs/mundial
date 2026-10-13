import { Snowflake } from "lucide-react";
import {
  ArtworkBrand,
  BilingualHeading,
  MenuRow,
  PriceFooter,
  SignCode,
} from "./ArtworkChrome";
import { COLD_DRINKS } from "./menu-data";
import styles from "./CafeteriaSigns.module.css";

/**
 * C-03 · Las frías. Las marcas se nombran por su nombre y nada más: no se
 * reconstruye ni se altera ningún logotipo comercial, que es lo único que se
 * puede hacer sin permiso del titular.
 */
export default function ColdDrinksArtwork() {
  return (
    <div
      className={`${styles.artboard} ${styles.coldBubbles} bg-[#092333] text-white`}
      role="img"
      aria-label="Propuesta de rótulo con precios de gaseosas, Powerade y Monster"
    >
      <div className="absolute inset-y-0 left-0 w-[clamp(0.35rem,1.1vw,0.7rem)] bg-[#00C4B0]" />
      <Snowflake
        className="absolute right-[6%] top-[44%] h-[clamp(5rem,17vw,13rem)] w-[clamp(5rem,17vw,13rem)] -translate-y-1/2 text-[#00C4B0]/12"
        strokeWidth={1.1}
        aria-hidden
      />
      <div className="absolute inset-0 z-10 flex flex-col p-[clamp(1.1rem,4vw,2.8rem)]">
        <div className="flex items-start justify-between gap-3">
          <ArtworkBrand />
          <SignCode>C-03</SignCode>
        </div>

        <div className="mt-[clamp(0.5rem,1.6vw,1rem)] flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[clamp(0.55rem,1.45vw,0.78rem)] font-black uppercase tracking-[0.26em] text-[#76EBDE]">
              Frías y listas para el paseo · Cold and ready for the trail
            </p>
            <BilingualHeading
              compact
              className="mt-1.5"
              accent="#76EBDE"
              es={
                <>
                  Para
                  <span className="block text-[#00C4B0]">refrescarse</span>
                </>
              }
              enText="Cool off before the canyon"
            />
          </div>
        </div>

        <div className="mt-auto pt-[clamp(0.5rem,1.5vw,0.9rem)]">
          <div className="grid gap-x-[clamp(1rem,3vw,2.4rem)] sm:grid-cols-2">
            {COLD_DRINKS.items.map((item) => (
              <div
                key={`${item.name.es}-${item.note?.es ?? ""}`}
                className="border-b border-white/12 py-[clamp(0.24rem,0.75vw,0.48rem)]"
              >
                <MenuRow item={item} dark />
              </div>
            ))}
          </div>

          {/* Nota de marcas: se mencionan, no se representan. */}
          <p className="mt-2 text-[clamp(0.44rem,1vw,0.58rem)] font-bold uppercase tracking-[0.1em] text-white/35">
            Marcas mencionadas por su nombre comercial · Brand names for reference only
          </p>

          <div className="mt-2">
            <PriceFooter dark stamp />
          </div>
        </div>
      </div>
    </div>
  );
}
