"use client";

import { CheckCircle2, CircleAlert, FileText } from "lucide-react";
import {
  evaluateProviderQuote,
  formatCRC,
  maxQuantityForSize,
  mixCapacity,
} from "./calculations";
import { FC_PRELIMINARY_NOTE, SIGN_SIZES } from "./constants";
import type { ProviderQuote, ScopeQuantities, ScopeRequirements } from "./types";

type ProviderQuoteCardProps = {
  quote: ProviderQuote;
  scope: ScopeQuantities;
  budgetCrc: number;
  requirements: ScopeRequirements;
  duplicateName: boolean;
  onChange: (quote: ProviderQuote) => void;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-xl border border-[#2E2A25]/20 bg-white px-3 py-2 text-sm text-[#2E2A25] outline-none transition placeholder:text-[#706b65]/60 focus:border-[#00C4B0] focus:ring-2 focus:ring-[#00C4B0]/20";

function moneyValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

export default function ProviderQuoteCard({
  quote,
  scope,
  budgetCrc,
  requirements,
  duplicateName,
  onChange,
}: ProviderQuoteCardProps) {
  const evaluation = evaluateProviderQuote(
    quote,
    scope,
    budgetCrc,
    requirements,
  );
  const capacity = mixCapacity(quote, scope, budgetCrc);
  const comparable = evaluation.comparable && !duplicateName;
  const status = duplicateName
    ? "Empresa duplicada"
    : comparable
      ? "Cotización comparable"
      : quote.quoteReceived
        ? "Requiere revisión"
        : "Cotización pendiente";
  const statusTone = comparable
    ? "border-[#00C4B0]/40 bg-[#d9f7f3] text-[#17685e]"
    : "border-amber-300/60 bg-amber-50 text-amber-800";

  const patch = (changes: Partial<ProviderQuote>) => onChange({ ...quote, ...changes });

  return (
    <fieldset className="overflow-hidden rounded-3xl border border-[#2E2A25]/12 bg-white shadow-[0_12px_32px_rgb(46_42_37_/_10%)]">
      <legend className="sr-only">Empresa cotizadora {quote.slot}</legend>

      <div className="flex flex-col gap-3 border-b border-[#2E2A25]/10 bg-[#2E2A25] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00C4B0] font-black text-[#2E2A25]">
            {quote.slot}
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8beade]">
              Empresa cotizadora
            </p>
            <h3 className="text-lg font-black">
              {quote.vendorName.trim() || `Empresa ${quote.slot}`}
            </h3>
          </div>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusTone}`}>
          {status}
        </span>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        {quote.slot === 1 ? (
          <div className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-relaxed text-sky-950">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <p>{FC_PRELIMINARY_NOTE}</p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-bold xl:col-span-2">
            Nombre de la empresa
            <input
              value={quote.vendorName}
              onChange={(event) => patch({ vendorName: event.target.value })}
              placeholder={`Empresa ${quote.slot}`}
              className={inputClass}
              autoComplete="organization"
            />
          </label>
          <label className="text-sm font-bold">
            Número o referencia
            <input
              value={quote.quoteReference}
              onChange={(event) => patch({ quoteReference: event.target.value })}
              placeholder="Ej. COT-024"
              className={inputClass}
            />
          </label>
          <label className="text-sm font-bold">
            Fecha de emisión
            <input
              type="date"
              value={quote.issuedOn}
              onChange={(event) => patch({ issuedOn: event.target.value })}
              className={inputClass}
            />
          </label>
        </div>

        <div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black">Precios unitarios finales</p>
              <p className="text-xs text-[#706b65]">
                Escríbalos solo si aparecen o fueron confirmados por la empresa. Sirven para calcular capacidad.
              </p>
            </div>
            <span className="text-xs font-bold text-[#706b65]">
              Cantidades del alcance común
            </span>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {SIGN_SIZES.map((size) => {
              const quantity = scope[size.key];
              const unitPrice = quote.unitPricesCrc[size.key];
              const lineTotal = quantity > 0 && unitPrice > 0 ? quantity * unitPrice : null;
              return (
                <label
                  key={size.key}
                  className="rounded-2xl border border-[#2E2A25]/12 bg-[#f3fbf9] p-4 text-sm font-bold"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span>
                      {size.label} · {size.dimensions}
                    </span>
                    <span className="rounded-full bg-white px-2 py-1 text-xs text-[#706b65]">
                      {quantity} u.
                    </span>
                  </span>
                  <span className="mt-2 block text-xs font-normal text-[#706b65]">
                    Precio final por unidad (CRC)
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={unitPrice || ""}
                    onChange={(event) =>
                      patch({
                        unitPricesCrc: {
                          ...quote.unitPricesCrc,
                          [size.key]: moneyValue(event.target.value),
                        },
                      })
                    }
                    placeholder="Pendiente"
                    className={inputClass}
                  />
                  <span className="mt-2 block text-xs font-normal text-[#706b65]">
                    {lineTotal === null ? "Sin cálculo" : `${quantity} × ${formatCRC(unitPrice)} = ${formatCRC(lineTotal)}`}
                  </span>
                </label>
              );
            })}
          </div>

          <label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border border-[#2E2A25]/12 bg-white p-3 text-sm">
            <input
              type="checkbox"
              checked={quote.pricesVerified}
              onChange={(event) => patch({ pricesVerified: event.target.checked })}
              className="mt-0.5 h-5 w-5 accent-[#00C4B0]"
            />
            <span>
              <span className="block font-black">Precios unitarios verificados</span>
              <span className="text-xs leading-relaxed text-[#706b65]">
                Marque únicamente si esos valores están respaldados por la cotización. Sin esto no se extrapolan cantidades.
              </span>
            </span>
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.45fr)]">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold sm:col-span-2">
              Material y acabado ofrecidos
              <textarea
                value={quote.materialConfirmation}
                onChange={(event) => patch({ materialConfirmation: event.target.value })}
                placeholder="Transcriba lo que indica la cotización; no lo complete por su cuenta."
                rows={3}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-bold">
              Referencia del documento recibido
              <input
                value={quote.evidenceReference}
                onChange={(event) => patch({ evidenceReference: event.target.value })}
                placeholder="Ej. PDF en Drive / correo del 24-08"
                className={inputClass}
              />
            </label>
            <label className="text-sm font-bold">
              Tratamiento de IVA
              <select
                value={quote.taxTreatment}
                onChange={(event) =>
                  patch({ taxTreatment: event.target.value as ProviderQuote["taxTreatment"] })
                }
                className={inputClass}
              >
                <option value="unknown">Pendiente de confirmar</option>
                <option value="included">Incluido en el total</option>
                <option value="separate">Desglosado por separado</option>
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-[#00C4B0]/35 bg-[#d9f7f3] p-4">
            <label className="text-sm font-black">
              Total final del documento
              <span className="mt-1 block text-xs font-normal text-[#17685e]">
                Este es el monto oficial que se compara.
              </span>
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={quote.officialTotalCrc || ""}
                onChange={(event) => patch({ officialTotalCrc: moneyValue(event.target.value) })}
                placeholder="₡ pendiente"
                className={inputClass}
              />
            </label>
            <p className="mt-3 text-2xl font-black text-[#2E2A25]">
              {evaluation.officialTotalCrc === null
                ? "Pendiente"
                : formatCRC(evaluation.officialTotalCrc)}
            </p>
            <p className="mt-1 text-xs font-bold text-[#17685e]">
              {evaluation.differenceToBudgetCrc === null
                ? `Presupuesto: ${formatCRC(budgetCrc)}`
                : evaluation.differenceToBudgetCrc >= 0
                  ? `Saldo: ${formatCRC(evaluation.differenceToBudgetCrc)}`
                  : `Excede por ${formatCRC(Math.abs(evaluation.differenceToBudgetCrc))}`}
            </p>
          </div>
        </div>

        <details className="rounded-2xl border border-[#2E2A25]/12 bg-[#fafaf9] p-4">
          <summary className="cursor-pointer font-black">Cargos, inclusiones y condiciones</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["designCrc", "Diseño"],
                ["transportCrc", "Transporte"],
                ["installationCrc", "Instalación"],
                ["otherCrc", "Otros cargos"],
                ["discountCrc", "Descuento (se resta)"],
              ] as const
            ).map(([field, label]) => (
              <label key={field} className="text-sm font-bold">
                {label} (CRC)
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={quote[field] || ""}
                  onChange={(event) => patch({ [field]: moneyValue(event.target.value) })}
                  placeholder="0"
                  className={inputClass}
                />
              </label>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(
              [
                ["includesDesign", "Incluye diseño"],
                ["includesTransport", "Incluye transporte"],
                ["includesInstallation", "Incluye instalación"],
              ] as const
            ).map(([field, label]) => (
              <label
                key={field}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[#2E2A25]/12 bg-white p-3 text-sm font-bold"
              >
                <input
                  type="checkbox"
                  checked={quote[field]}
                  onChange={(event) => patch({ [field]: event.target.checked })}
                  className="h-5 w-5 accent-[#00C4B0]"
                />
                {label}
              </label>
            ))}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-bold">
              Vigente hasta
              <input
                type="date"
                value={quote.validUntil}
                onChange={(event) => patch({ validUntil: event.target.value })}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-bold">
              Entrega (días)
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={quote.leadTimeDays || ""}
                onChange={(event) => patch({ leadTimeDays: moneyValue(event.target.value) })}
                placeholder="Pendiente"
                className={inputClass}
              />
            </label>
            <label className="text-sm font-bold">
              Garantía
              <input
                value={quote.warranty}
                onChange={(event) => patch({ warranty: event.target.value })}
                placeholder="Según documento"
                className={inputClass}
              />
            </label>
            <label className="text-sm font-bold lg:col-span-2">
              Forma de pago
              <input
                value={quote.paymentTerms}
                onChange={(event) => patch({ paymentTerms: event.target.value })}
                placeholder="Según documento"
                className={inputClass}
              />
            </label>
            <label className="text-sm font-bold sm:col-span-2 lg:col-span-4">
              Notas
              <textarea
                value={quote.notes}
                onChange={(event) => patch({ notes: event.target.value })}
                rows={2}
                placeholder="Aclaraciones pendientes, vigencia o exclusiones."
                className={inputClass}
              />
            </label>
          </div>
        </details>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-2xl border border-[#2E2A25]/12 bg-[#fafaf9] p-4 text-sm">
            <input
              type="checkbox"
              checked={quote.scopeConfirmed}
              onChange={(event) => patch({ scopeConfirmed: event.target.checked })}
              className="mt-0.5 h-5 w-5 accent-[#00C4B0]"
            />
            <span>
              <span className="block font-black">Mismo alcance confirmado</span>
              <span className="text-xs text-[#706b65]">La empresa cotizó las mismas medidas y especificaciones.</span>
            </span>
          </label>
          <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-2xl border border-[#2E2A25]/12 bg-[#fafaf9] p-4 text-sm">
            <input
              type="checkbox"
              checked={quote.quoteReceived}
              onChange={(event) => patch({ quoteReceived: event.target.checked })}
              className="mt-0.5 h-5 w-5 accent-[#00C4B0]"
            />
            <span>
              <span className="block font-black">Documento recibido</span>
              <span className="text-xs text-[#706b65]">Los datos anteriores fueron transcritos de una cotización real.</span>
            </span>
          </label>
        </div>

        <div className="rounded-2xl border border-[#2E2A25]/12 bg-[#fafaf9] p-4" aria-live="polite">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="flex items-center gap-2 font-black">
                {comparable ? (
                  <CheckCircle2 className="h-5 w-5 text-[#008d80]" aria-hidden />
                ) : (
                  <FileText className="h-5 w-5 text-amber-700" aria-hidden />
                )}
                {status}
              </p>
              {!comparable ? (
                <ul className="mt-2 space-y-1 text-xs text-[#706b65]">
                  {duplicateName ? <li>· Use una empresa distinta en cada espacio.</li> : null}
                  {evaluation.missing.slice(0, 4).map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                  {evaluation.missing.length > 4 ? (
                    <li>· Y {evaluation.missing.length - 4} requisito(s) más.</li>
                  ) : null}
                </ul>
              ) : null}
            </div>

            {evaluation.computedTotalCrc !== null ? (
              <div className="text-left sm:text-right">
                <p className="text-xs font-bold text-[#706b65]">Suma calculada desde líneas</p>
                <p className="font-black">{formatCRC(evaluation.computedTotalCrc)}</p>
                {evaluation.hasDiscrepancy && evaluation.discrepancyCrc !== null ? (
                  <p className="text-xs font-bold text-rose-700">
                    Diferencia: {formatCRC(Math.abs(evaluation.discrepancyCrc))}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            {SIGN_SIZES.map((size) => {
              const max = maxQuantityForSize(quote, size.key, budgetCrc);
              return (
                <div key={size.key} className="rounded-xl border border-[#2E2A25]/10 bg-white p-3">
                  <p className="text-xs font-bold text-[#706b65]">
                    Todo el presupuesto en {size.label.toLowerCase()}
                  </p>
                  <p className="mt-1 font-black">{max === null ? "No calculable" : `${max} u.`}</p>
                  <p className="mt-1 text-[11px] text-[#706b65]">
                    Hipotético: no resta el alcance ya definido arriba.
                  </p>
                </div>
              );
            })}
            <div className="rounded-xl border border-[#00C4B0]/30 bg-[#d9f7f3] p-3">
              <p className="text-xs font-bold text-[#17685e]">Mezcla actual</p>
              <p className="mt-1 font-black">
                {capacity === null ? "No calculable" : `${capacity.signs} rótulos`}
              </p>
              {capacity !== null ? (
                <p className="text-[11px] text-[#17685e]">{capacity.completeMixes} alcance(s) completo(s)</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </fieldset>
  );
}
