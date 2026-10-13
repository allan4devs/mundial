"use client";

import { Printer } from "lucide-react";
import type { SignId } from "./types";

export type CafeteriaPrintTarget = "all" | SignId;

type PrintButtonProps = {
  target: CafeteriaPrintTarget;
  variant: "header" | "card";
  /** Cuántas láminas se mandan a imprimir, para rotular el botón de arriba. */
  count?: number;
  t: (es: string, en: string) => string;
};

function printSigns(target: CafeteriaPrintTarget) {
  const root = document.documentElement;
  root.dataset.cafeteriaPrint = target;

  const cleanup = () => {
    delete root.dataset.cafeteriaPrint;
  };

  window.addEventListener("afterprint", cleanup, { once: true });
  window.requestAnimationFrame(() => window.print());
}

export default function PrintButton({ target, variant, count, t }: PrintButtonProps) {
  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={() => printSigns(target)}
        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#00C4B0]/50 bg-[#00C4B0]/10 px-3 py-2 text-xs font-black text-[#8EF2E6] transition hover:bg-[#00C4B0]/20 sm:px-4 sm:text-sm"
      >
        <Printer className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">
          {t(`Imprimir los ${count ?? 0}`, `Print all ${count ?? 0}`)}
        </span>
        <span className="sm:hidden">{t("Imprimir", "Print")}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => printSigns(target)}
      className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#00C4B0] px-4 py-3 text-sm font-black text-[#17332F] transition hover:bg-[#39D6C5]"
    >
      <Printer className="h-4 w-4" aria-hidden />
      {t("Imprimir este rótulo", "Print this sign")}
    </button>
  );
}
