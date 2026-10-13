"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Languages } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { createTranslator } from "../helpers";
import OrderPanel from "./OrderPanel";
import PaymentPanel from "./PaymentPanel";
import ProductGrid from "./ProductGrid";
import SaleReceipt from "./SaleReceipt";
import { usePosOrder } from "./usePosOrder";
import type { PaymentMethod, PosStep } from "./types";

/**
 * Caja de la cafetería. Productos a la izquierda, orden a la derecha, y el
 * mismo panel derecho cambia a cobro y a cierre sin sacar a nadie de la
 * pantalla. Los precios salen del mismo menú que se imprime en la pared.
 */
export default function CafeteriaPos() {
  const { lang, toggle } = useLanguage();
  const t = createTranslator(lang);
  const [step, setStep] = useState<PosStep>("order");

  const { lines, totals, sale, nextNumber, add, step: stepQty, remove, clear, complete, dismissSale } =
    usePosOrder();

  const handleConfirm = (method: PaymentMethod, received?: number) => {
    complete(method, received);
    setStep("done");
  };

  const handleNewOrder = () => {
    dismissSale();
    setStep("order");
  };

  return (
    <main className="flex h-[100dvh] flex-col bg-[#171512] text-white">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#171512]/90 px-3 py-2.5 backdrop-blur-xl sm:px-5">
        <Link
          href="/cafeteria"
          className="inline-flex min-w-0 items-center gap-2.5 text-white transition hover:text-[#8EF2E6]"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          <div className="shrink-0 bg-[#2E2A25] p-1">
            <Image
              src="/logo2.jpg"
              alt="La Vieja Adventures"
              width={32}
              height={32}
              className="h-7 w-7 object-contain"
              priority
            />
          </div>
          <span className="truncate text-sm font-black">{t("Caja", "Register")}</span>
        </Link>

        <button
          type="button"
          onClick={toggle}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-2 text-xs font-black text-white transition hover:border-[#00C4B0]/60 hover:text-[#8EF2E6]"
          aria-label={lang === "es" ? "Switch to English" : "Cambiar a español"}
        >
          <Languages className="h-4 w-4" aria-hidden />
          {lang === "es" ? "EN" : "ES"}
        </button>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_23rem] lg:p-4">
        {/* En móvil la rejilla se esconde durante el cobro: no hay pantalla para las dos. */}
        <div className={`min-h-0 ${step === "order" ? "" : "hidden lg:block"}`}>
          <ProductGrid lang={lang} onAdd={add} />
        </div>

        {step === "order" ? (
          <OrderPanel
            lang={lang}
            lines={lines}
            totals={totals}
            orderNumber={nextNumber}
            onStep={stepQty}
            onRemove={remove}
            onClear={clear}
            onCharge={() => setStep("pay")}
            t={t}
          />
        ) : null}

        {step === "pay" ? (
          <PaymentPanel
            lang={lang}
            totals={totals}
            onBack={() => setStep("order")}
            onConfirm={handleConfirm}
            t={t}
          />
        ) : null}

        {step === "done" && sale ? (
          <SaleReceipt lang={lang} sale={sale} onNew={handleNewOrder} t={t} />
        ) : null}
      </div>
    </main>
  );
}
