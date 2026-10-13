import Image from "next/image";
import { Eye, Target } from "lucide-react";
import { ArtworkBrand, DraftStamp, SignCode } from "./ArtworkChrome";
import { PHOTOS } from "./constants";
import type { Copy } from "./types";
import styles from "./CafeteriaSigns.module.css";

/** Borradores para aprobación. No son declaraciones oficiales todavía. */
const MISSION: Copy = {
  es: "Crear una pausa cálida para quienes visitan La Vieja, con atención cercana y productos de la zona que inviten a disfrutar el entorno.",
  en: "To create a warm pause for everyone who visits La Vieja, with close attention and local products that invite you to enjoy the surroundings.",
};

const VISION: Copy = {
  es: "Convertir la cafetería en un punto de encuentro querido por visitantes y comunidad, reconocido por su hospitalidad y su respeto por la naturaleza.",
  en: "To make the coffee shop a meeting point loved by visitors and neighbors alike, known for its hospitality and respect for nature.",
};

/**
 * C-06 · La pieza institucional. Va en la zona de mesas, donde sí hay tiempo
 * de leer un párrafo: es el único arte donde el texto largo tiene sentido.
 */
export default function PurposeArtwork() {
  return (
    <div
      className={`${styles.artboard} bg-[#171512] text-white`}
      role="img"
      aria-label="Propuesta de rótulo con borradores de misión y visión"
    >
      <Image
        src={PHOTOS.purpose}
        alt=""
        fill
        sizes="(min-width: 1100px) 70vw, 100vw"
        className="object-cover object-center"
      />
      <div className={`absolute inset-0 ${styles.photoOverlay}`} />

      <div className="absolute inset-0 flex flex-col p-[clamp(1.1rem,4vw,2.8rem)]">
        <div className="relative z-10 flex items-start justify-between gap-3">
          <ArtworkBrand />
          <SignCode>C-06</SignCode>
        </div>

        <div className="relative z-10 mt-auto pt-4">
          <p className="text-[clamp(0.55rem,1.45vw,0.78rem)] font-black uppercase tracking-[0.26em] text-[#76EBDE]">
            Borrador para aprobación · Draft for approval
          </p>
          <h2 className="mt-2 max-w-[82%] font-display text-[clamp(2.2rem,7.4vw,5.3rem)] font-black uppercase leading-[0.82] tracking-[-0.055em]">
            Nuestro
            <span className="block text-[#00C4B0]">propósito</span>
          </h2>
          <p className="mt-1.5 font-display text-[clamp(0.75rem,2.1vw,1.2rem)] font-bold italic tracking-[-0.01em] text-[#8EF2E6]">
            What we are here for
          </p>
        </div>

        <div className="relative z-10 mt-[clamp(0.9rem,2.5vw,1.5rem)] grid gap-2 sm:grid-cols-2 sm:gap-3">
          <div className="bg-[#00C4B0] p-3 text-[#16302C] sm:p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 shrink-0" strokeWidth={2.4} aria-hidden />
              <h3 className="font-display text-[clamp(0.9rem,2.4vw,1.35rem)] font-black uppercase leading-none">
                Misión
                <span className="ml-1.5 text-[0.62em] font-bold italic opacity-70">Mission</span>
              </h3>
            </div>
            <p className="mt-2 text-[clamp(0.56rem,1.3vw,0.75rem)] font-bold leading-relaxed sm:mt-2.5">
              {MISSION.es}
            </p>
            <p className="mt-1.5 text-[clamp(0.5rem,1.15vw,0.66rem)] font-semibold italic leading-relaxed opacity-70">
              {MISSION.en}
            </p>
          </div>

          <div className="border border-white/25 bg-[#2E2A25]/90 p-3 backdrop-blur-sm sm:p-4">
            <div className="flex items-center gap-2 text-[#8EF2E6]">
              <Eye className="h-5 w-5 shrink-0" strokeWidth={2.4} aria-hidden />
              <h3 className="font-display text-[clamp(0.9rem,2.4vw,1.35rem)] font-black uppercase leading-none">
                Visión
                <span className="ml-1.5 text-[0.62em] font-bold italic opacity-70">Vision</span>
              </h3>
            </div>
            <p className="mt-2 text-[clamp(0.56rem,1.3vw,0.75rem)] font-bold leading-relaxed text-white/85 sm:mt-2.5">
              {VISION.es}
            </p>
            <p className="mt-1.5 text-[clamp(0.5rem,1.15vw,0.66rem)] font-semibold italic leading-relaxed text-white/50">
              {VISION.en}
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-2.5 flex justify-end">
          <DraftStamp dark />
        </div>
      </div>
    </div>
  );
}
