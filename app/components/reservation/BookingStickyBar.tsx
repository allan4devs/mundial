"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

type Props = {
  lang: "es" | "en";
  label: string;
  total: number;
  disabled?: boolean;
  onAction: () => void;
  onBack?: () => void;
  secondaryLabel?: string;
};

export default function BookingStickyBar({
  lang,
  label,
  total,
  disabled,
  onAction,
  onBack,
  secondaryLabel,
}: Props) {
  const isEs = lang === "es";

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-12px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-stone-950/95 md:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-2.5">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-700 transition active:scale-95 dark:border-white/15 dark:bg-stone-900 dark:text-stone-200"
            aria-label={isEs ? "Volver al paso anterior" : "Back to previous step"}
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {secondaryLabel && (
            <p className="truncate text-[11px] font-semibold text-stone-500 dark:text-stone-400">{secondaryLabel}</p>
          )}
          <p className="text-sm font-black text-stone-900 dark:text-stone-50">
            {isEs ? "Total est." : "Est. total"}{" "}
            <span className="text-emerald-700 dark:text-emerald-300">${total.toFixed(2)}</span>
          </p>
          <p className="text-[10px] font-medium text-stone-400 dark:text-stone-500">
            {isEs ? "IVA incluido" : "Tax included"}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onAction}
          className="inline-flex min-h-12 max-w-[12.5rem] shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-[13px] font-black leading-tight text-white shadow-sm transition hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-none sm:px-5 sm:text-sm"
        >
          <span className="line-clamp-2 text-left sm:truncate sm:text-center">{label}</span>
          <ArrowRight className="shrink-0" size={15} />
        </button>
      </div>
    </div>
  );
}
