import { Banknote, CreditCard, ReceiptText, Smartphone } from "lucide-react";
import { ArtworkBrand, DraftStamp, SignCode } from "./ArtworkChrome";
import { IVA_RATE, SINPE_HOLDER, SINPE_PHONE } from "./constants";
import type { Copy } from "./types";
import styles from "./CafeteriaSigns.module.css";

/** Los tres medios de pago, en el orden en que los pide la gente. */
const METHODS: Array<{ icon: typeof Banknote; label: Copy; note: Copy }> = [
  {
    icon: Smartphone,
    label: { es: "SINPE Móvil", en: "SINPE Móvil" },
    note: {
      es: "Solo cuentas de bancos costarricenses",
      en: "Costa Rican bank accounts only",
    },
  },
  {
    icon: Banknote,
    label: { es: "Efectivo", en: "Cash" },
    note: {
      es: "Colones y dólares al tipo de cambio del día",
      en: "Colones and US dollars at the day's rate",
    },
  },
  {
    icon: CreditCard,
    label: { es: "Tarjeta", en: "Card" },
    note: { es: "Débito y crédito", en: "Debit and credit" },
  },
];

/**
 * C-05 · Pago. El número de SINPE ya está configurado en el checkout del sitio;
 * lo que falta es el titular y el QR. Se agregan los otros medios de pago
 * porque el visitante extranjero no tiene SINPE y es la duda número uno en caja.
 */
export default function SinpeArtwork() {
  return (
    <div
      className={`${styles.artboard} border-[clamp(0.75rem,2.4vw,1.35rem)] border-[#00C4B0] bg-white text-[#2E2A25]`}
      role="img"
      aria-label={`Propuesta de rótulo de pago con SINPE Móvil al número ${SINPE_PHONE}`}
    >
      <div className="absolute inset-0 flex flex-col p-[clamp(1rem,3.5vw,2.5rem)]">
        <div className="flex items-start justify-between gap-3">
          <ArtworkBrand darkText />
          <SignCode dark>C-05</SignCode>
        </div>

        <div className="mt-[clamp(0.8rem,2.6vw,1.6rem)] grid grid-cols-[0.72fr_1.28fr] items-center gap-[clamp(0.9rem,3vw,2.2rem)]">
          <div
            className={`${styles.qrPlaceholder} flex aspect-square flex-col items-center justify-center border-[3px] border-dashed border-[#2E2A25]/25 bg-[#F3FBF9] p-3 text-center`}
          >
            <Smartphone className="h-[28%] w-[28%] text-[#006F65]" strokeWidth={1.8} aria-hidden />
            <p className="mt-2.5 text-[clamp(0.55rem,1.4vw,0.75rem)] font-black uppercase tracking-[0.12em]">
              QR pendiente
            </p>
            <p className="text-[clamp(0.46rem,1vw,0.6rem)] font-bold italic text-[#2E2A25]/55">
              QR pending
            </p>
            <p className="mt-1 max-w-32 text-[clamp(0.44rem,0.95vw,0.56rem)] font-semibold leading-tight text-[#2E2A25]/60">
              Se genera cuando estén confirmados los datos del titular
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[clamp(0.54rem,1.35vw,0.75rem)] font-black uppercase tracking-[0.25em] text-[#006F65]">
              Pague aquí · Pay here
            </p>
            <h2 className="mt-2 font-display text-[clamp(1.9rem,6.6vw,4.6rem)] font-black uppercase leading-[0.8] tracking-[-0.055em]">
              SINPE
              <span className="block text-[#006F65]">Móvil</span>
            </h2>
            <p className="mt-[clamp(0.6rem,2vw,1.2rem)] font-display text-[clamp(1.3rem,4.2vw,2.7rem)] font-black tracking-[-0.035em]">
              {SINPE_PHONE}
            </p>
            <div className="mt-2.5 border-l-4 border-[#F3A712] bg-[#F7F0E5] px-3 py-2">
              <p className="text-[clamp(0.46rem,1.05vw,0.6rem)] font-black uppercase tracking-[0.13em] text-[#2E2A25]/65">
                Verifique que aparezca · Confirm the name shown
              </p>
              <p className="mt-1 text-[clamp(0.66rem,1.7vw,0.9rem)] font-black uppercase">
                {SINPE_HOLDER}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-[clamp(0.7rem,2vw,1.2rem)]">
          <div className="grid gap-1.5 border-t-2 border-[#2E2A25] pt-2.5 sm:grid-cols-3 sm:gap-2.5">
            {METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <div key={method.label.es} className="flex items-start gap-2">
                  <Icon
                    className="mt-0.5 h-[clamp(0.9rem,2.1vw,1.3rem)] w-[clamp(0.9rem,2.1vw,1.3rem)] shrink-0 text-[#006F65]"
                    strokeWidth={2.3}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="font-display text-[clamp(0.7rem,1.85vw,1.05rem)] font-black uppercase leading-none">
                      {method.label.es}
                    </p>
                    <p className="mt-1 text-[clamp(0.44rem,1vw,0.58rem)] font-bold uppercase leading-tight tracking-[0.06em] text-[#2E2A25]/55">
                      {method.note.es}
                    </p>
                    <p className="text-[clamp(0.42rem,0.95vw,0.55rem)] font-bold italic leading-tight text-[#006F65]/70">
                      {method.note.en}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Factura electrónica: en Costa Rica toda venta la genera. */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-[#2E2A25]/20 pt-2.5">
            <p className="flex items-center gap-2 text-[clamp(0.48rem,1.15vw,0.66rem)] font-black uppercase tracking-[0.11em]">
              <ReceiptText className="h-3.5 w-3.5 shrink-0 text-[#006F65]" aria-hidden />
              Exija su factura electrónica · Ask for your electronic invoice
            </p>
            <p className="text-[clamp(0.46rem,1.1vw,0.62rem)] font-black uppercase tracking-[0.11em] text-[#2E2A25]/60">
              IVA {IVA_RATE}% incluido · {IVA_RATE}% VAT included
            </p>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[clamp(0.5rem,1.2vw,0.68rem)] font-black uppercase tracking-[0.12em] text-[#006F65]">
              Gracias por su compra · Pura vida
            </p>
            <DraftStamp />
          </div>
        </div>
      </div>
    </div>
  );
}
