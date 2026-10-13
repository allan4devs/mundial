import { ArtworkBrand, DraftStamp, SignCode } from "./ArtworkChrome";
import { LEGAL_NOTICES, TOBACCO_HOTLINE } from "./constants";
import styles from "./CafeteriaSigns.module.css";

/**
 * C-07 · Los avisos que un servicio de alimentación al público tiene que
 * mantener a la vista en Costa Rica, reunidos en una sola lámina en vez de seis
 * papeles pegados con cinta. Las citas de ley son de referencia: hay que
 * validarlas con el Ministerio de Salud y con contabilidad antes de imprimir.
 */
export default function LegalArtwork() {
  return (
    <div
      className={`${styles.artboard} border-[clamp(0.6rem,2vw,1.1rem)] border-[#2E2A25] bg-[#F7F0E5] text-[#2E2A25]`}
      role="img"
      aria-label="Propuesta de rótulo con los avisos legales de un servicio de alimentación en Costa Rica"
    >
      <div className="absolute -right-[6%] -top-[10%] h-[38%] w-[26%] rotate-12 rounded-[50%] bg-[#00C4B0]/12" />

      <div className="absolute inset-0 flex flex-col p-[clamp(1rem,3.5vw,2.4rem)]">
        <div className="flex items-start justify-between gap-3">
          <ArtworkBrand darkText />
          <SignCode dark>C-07</SignCode>
        </div>

        <div className="mt-[clamp(0.5rem,1.6vw,1rem)]">
          <p className="text-[clamp(0.52rem,1.35vw,0.74rem)] font-black uppercase tracking-[0.25em] text-[#006F65]">
            Información al consumidor · Consumer information
          </p>
          <h2 className="mt-1.5 font-display text-[clamp(1.35rem,4.4vw,2.9rem)] font-black uppercase leading-[0.85] tracking-[-0.05em]">
            Avisos
            <span className="ml-2.5 text-[#006F65]">legales</span>
            <span className="ml-2 font-display text-[0.36em] font-bold italic tracking-[-0.01em] text-[#006F65]/70">
              Legal notices
            </span>
          </h2>
        </div>

        <div className="mt-auto grid gap-x-[clamp(0.8rem,2.4vw,1.8rem)] gap-y-[clamp(0.25rem,0.85vw,0.55rem)] pt-[clamp(0.6rem,1.8vw,1.1rem)] sm:grid-cols-2">
          {LEGAL_NOTICES.map((notice) => {
            const Icon = notice.icon;
            return (
              <div
                key={notice.title.es}
                className="flex items-start gap-2.5 border-t border-[#2E2A25]/15 pt-[clamp(0.25rem,0.85vw,0.5rem)]"
              >
                <div className="mt-0.5 flex h-[clamp(1.2rem,2.9vw,1.9rem)] w-[clamp(1.2rem,2.9vw,1.9rem)] shrink-0 items-center justify-center rounded-full bg-[#2E2A25]">
                  <Icon
                    className="h-[58%] w-[58%] text-[#00C4B0]"
                    strokeWidth={2.3}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-[clamp(0.66rem,1.75vw,1rem)] font-black uppercase leading-[1.05] tracking-[-0.015em]">
                    {notice.title.es}
                    {notice.law ? (
                      <span className="ml-1.5 whitespace-nowrap text-[0.62em] font-black tracking-[0.08em] text-[#006F65]">
                        {notice.law}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[clamp(0.46rem,1.1vw,0.63rem)] font-bold italic leading-tight text-[#006F65]/75">
                    {notice.title.en}
                  </p>
                  <p className="mt-1 text-[clamp(0.46rem,1.08vw,0.62rem)] font-semibold leading-snug text-[#2E2A25]/70">
                    {notice.body.es}
                  </p>
                  <p className="mt-0.5 text-[clamp(0.42rem,1vw,0.56rem)] font-semibold italic leading-snug text-[#2E2A25]/45">
                    {notice.body.en}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-[clamp(0.45rem,1.4vw,0.85rem)] flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t-2 border-[#2E2A25] pt-2.5">
          <p className="text-[clamp(0.46rem,1.1vw,0.62rem)] font-black uppercase tracking-[0.11em]">
            Denuncias por humo de tabaco · Ministerio de Salud{" "}
            <span className="text-[#006F65]">{TOBACCO_HOTLINE}</span>
          </p>
          <DraftStamp />
        </div>
      </div>
    </div>
  );
}
