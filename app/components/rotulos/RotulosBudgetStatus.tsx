type RotulosBudgetStatusProps = {
  amount: number;
  /** Parte de `amount` sin IVA; si se pasa, la tarjeta muestra el desglose. */
  baseAmount?: number;
  budgetCrc: number;
  price: (crc: number) => string;
  t: (es: string, en: string) => string;
  variant?: "pill" | "card";
};

/**
 * Compara la selección activa contra el presupuesto de referencia en vivo:
 * mismo dato en formato compacto (resumen cerrado) y en tarjeta con barra
 * (resumen abierto), para que el estado de presupuesto nunca quede oculto.
 */
export default function RotulosBudgetStatus({
  amount,
  baseAmount,
  budgetCrc,
  price,
  t,
  variant = "card",
}: RotulosBudgetStatusProps) {
  const usedPct = budgetCrc > 0 ? Math.round((amount / budgetCrc) * 100) : 0;
  const ivaAmount = baseAmount !== undefined ? amount - baseAmount : null;
  const remaining = budgetCrc - amount;
  const withinBudget = remaining >= 0;
  const barPct = Math.min(100, Math.max(0, usedPct));

  if (variant === "pill") {
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${
          withinBudget
            ? "border-[#00C4B0]/40 bg-[#00C4B0]/10 text-[#9ff5eb]"
            : "border-rose-400/40 bg-rose-400/10 text-rose-200"
        }`}
      >
        {withinBudget
          ? t(`${usedPct}% del presupuesto`, `${usedPct}% of budget`)
          : t(`Excede por ${price(Math.abs(remaining))}`, `Over by ${price(Math.abs(remaining))}`)}
      </span>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-4 ${
        withinBudget ? "border-[#00C4B0]/30 bg-[#00C4B0]/10" : "border-rose-400/30 bg-rose-400/10"
      }`}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
            {t("Frente al presupuesto de referencia", "Against the reference budget")}
          </p>
          <p className="mt-1 text-sm font-bold text-zinc-300">
            {price(amount)} {t("de", "of")} {price(budgetCrc)}
          </p>
          {ivaAmount !== null ? (
            <p className="mt-0.5 text-[11px] text-zinc-500">
              {price(baseAmount as number)} + IVA ({price(ivaAmount)})
            </p>
          ) : null}
        </div>
        <p className={`text-lg font-black ${withinBudget ? "text-[#9ff5eb]" : "text-rose-300"}`}>
          {withinBudget
            ? t(`Quedan ${price(remaining)}`, `${price(remaining)} remaining`)
            : t(`Excede por ${price(Math.abs(remaining))}`, `Over by ${price(Math.abs(remaining))}`)}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-[width] ${withinBudget ? "bg-[#00C4B0]" : "bg-rose-400"}`}
          style={{ width: `${barPct}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
        {t(
          "Compara la estimación interna seleccionada contra la referencia preliminar de ₡300.000. No sustituye las tres cotizaciones reales del comparador.",
          "Compares the selected internal estimate against the ₡300,000 preliminary reference. It does not replace the comparator's three real quotes.",
        )}
      </p>
    </div>
  );
}
