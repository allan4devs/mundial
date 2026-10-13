"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  Minus,
  Plus,
  Printer,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import ProviderQuoteCard from "./ProviderQuoteCard";
import {
  evaluateProviderQuote,
  formatCRC,
  normalizeVendorName,
  scopeSignCount,
} from "./calculations";
import {
  createDefaultProviders,
  DEFAULT_BUDGET_CRC,
  DEFAULT_SCOPE,
  DEFAULT_SCOPE_REQUIREMENTS,
  REQUIRED_QUOTES,
  SIGN_SIZES,
} from "./constants";
import type {
  ProviderQuote,
  ScopeQuantities,
  ScopeRequirements,
  SignSizeKey,
} from "./types";

function numericValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

/** Alcance recibido por URL desde la selección hecha en /rotulos, si viene completo y válido. */
function scopeFromSearchParams(params: URLSearchParams): ScopeQuantities | null {
  const keys: SignSizeKey[] = ["large", "medium", "small"];
  const raw = keys.map((key) => params.get(key));
  if (raw.some((value) => value === null)) return null;

  const parsed = raw.map(Number);
  if (parsed.some((value) => !Number.isFinite(value) || value < 0)) return null;

  return { large: parsed[0], medium: parsed[1], small: parsed[2] };
}

export default function QuoteComparisonPlanner() {
  const searchParams = useSearchParams();
  const scopeFromSelection = useMemo(
    () => scopeFromSearchParams(searchParams),
    [searchParams],
  );

  const [budgetCrc, setBudgetCrc] = useState(DEFAULT_BUDGET_CRC);
  const [scope, setScope] = useState<ScopeQuantities>({
    ...(scopeFromSelection ?? DEFAULT_SCOPE),
  });
  const [requirements, setRequirements] = useState<ScopeRequirements>({
    ...DEFAULT_SCOPE_REQUIREMENTS,
  });
  const [providers, setProviders] = useState<ProviderQuote[]>(createDefaultProviders);

  const comparison = useMemo(() => {
    const normalizedNames = providers.map((provider) => normalizeVendorName(provider.vendorName));
    const duplicateNames = new Set(
      normalizedNames.filter(
        (name, index) => name && normalizedNames.indexOf(name) !== index,
      ),
    );

    return providers.map((provider) => {
      const normalizedName = normalizeVendorName(provider.vendorName);
      const duplicateName = normalizedName ? duplicateNames.has(normalizedName) : false;
      const evaluation = evaluateProviderQuote(
        provider,
        scope,
        budgetCrc,
        requirements,
      );
      return {
        provider,
        evaluation,
        duplicateName,
        comparable: evaluation.comparable && !duplicateName,
      };
    });
  }, [budgetCrc, providers, requirements, scope]);

  const comparableQuotes = comparison.filter((item) => item.comparable);
  const readyForDecision = comparableQuotes.length >= REQUIRED_QUOTES;
  const withinBudget = comparableQuotes
    .filter((item) => item.evaluation.withinBudget)
    .sort(
      (a, b) =>
        (a.evaluation.officialTotalCrc ?? Number.POSITIVE_INFINITY) -
        (b.evaluation.officialTotalCrc ?? Number.POSITIVE_INFINITY),
    );
  const lowestComparable = readyForDecision ? withinBudget[0] : undefined;
  const nextComparable = readyForDecision ? withinBudget[1] : undefined;
  const savings =
    lowestComparable?.evaluation.officialTotalCrc !== null &&
    lowestComparable?.evaluation.officialTotalCrc !== undefined &&
    nextComparable?.evaluation.officialTotalCrc !== null &&
    nextComparable?.evaluation.officialTotalCrc !== undefined
      ? nextComparable.evaluation.officialTotalCrc -
        lowestComparable.evaluation.officialTotalCrc
      : null;
  const signsInScope = scopeSignCount(scope);

  const updateProvider = (next: ProviderQuote) => {
    setProviders((current) =>
      current.map((provider) => (provider.id === next.id ? next : provider)),
    );
  };

  const adjustScope = (key: SignSizeKey, delta: number) => {
    setScope((current) => ({
      ...current,
      [key]: Math.max(0, current[key] + delta),
    }));
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-[#2E2A25] text-white shadow-[0_20px_60px_rgb(46_42_37_/_20%)] print:rounded-none print:shadow-none">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7ce5d9]">
              Compra de señalización · Comparación administrativa
            </p>
            <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-[-0.04em] sm:text-5xl">
              Tres cotizaciones reales para decidir con claridad
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-300 sm:text-base">
              Primero se fija un único alcance. Después se transcriben las tres ofertas y el
              sistema calcula saldo, capacidad y diferencias. La recomendación aparece solo
              cuando las empresas son distintas y las cotizaciones son comparables.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-black transition hover:border-[#00C4B0] hover:bg-[#00C4B0]/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00C4B0] print:hidden"
          >
            <Printer className="h-4 w-4" aria-hidden />
            Imprimir resumen
          </button>
        </div>

        <div className="grid border-t border-white/10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-b border-white/10 p-5 sm:border-r lg:border-b-0">
            <p className="text-xs font-bold text-zinc-400">Presupuesto</p>
            <p className="mt-1 text-2xl font-black text-[#7ce5d9]">{formatCRC(budgetCrc)}</p>
          </div>
          <div className="border-b border-white/10 p-5 lg:border-r lg:border-b-0">
            <p className="text-xs font-bold text-zinc-400">Alcance común</p>
            <p className="mt-1 text-2xl font-black">{signsInScope} láminas</p>
          </div>
          <div className="border-b border-white/10 p-5 sm:border-r sm:border-b-0">
            <p className="text-xs font-bold text-zinc-400">Cotizaciones comparables</p>
            <p className="mt-1 text-2xl font-black">
              {comparableQuotes.length}/{REQUIRED_QUOTES}
            </p>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15"
              role="progressbar"
              aria-label="Cotizaciones comparables completadas"
              aria-valuemin={0}
              aria-valuemax={REQUIRED_QUOTES}
              aria-valuenow={comparableQuotes.length}
            >
              <div
                className="h-full rounded-full bg-[#00C4B0] transition-[width]"
                style={{ width: `${(comparableQuotes.length / REQUIRED_QUOTES) * 100}%` }}
              />
            </div>
          </div>
          <div className="p-5">
            <p className="text-xs font-bold text-zinc-400">Estado</p>
            <p className="mt-1 text-lg font-black text-amber-200">
              {readyForDecision ? "Lista para decidir" : "No autorizar todavía"}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-5 flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-relaxed text-sky-950 print:hidden">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <p>
          Esta herramienta trabaja únicamente en la página abierta: no guarda ni envía los
          datos. No escriba cédulas, cuentas bancarias ni contactos sensibles; para el
          expediente oficial, imprima el resumen y adjunte los tres documentos originales.
        </p>
      </div>

      <section className="mt-8 rounded-3xl border border-[#2E2A25]/12 bg-white p-5 shadow-[0_12px_32px_rgb(46_42_37_/_8%)] sm:p-6 print:hidden">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00C4B0] font-black text-[#2E2A25]">
            1
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#008d80]">
              Alcance común
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Defina una sola compra</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#706b65]">
              Todas las empresas deben cotizar exactamente estas cantidades y la misma
              especificación. Así se comparan manzanas con manzanas, no una lona con un rótulo
              instalado, mae.
            </p>
            <p className="mt-2 max-w-3xl text-xs font-bold text-[#008d80]">
              {scopeFromSelection
                ? "Cantidades precargadas desde la selección hecha en /rotulos. Ajústelas aquí si el alcance a cotizar es distinto; no afecta esa página."
                : "Mostrando el alcance completo del plan (12 fichas, 12 láminas). Ajústelas aquí según lo que realmente vaya a cotizar."}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(240px,0.35fr)_minmax(0,1fr)]">
          <label className="rounded-2xl border border-[#00C4B0]/35 bg-[#d9f7f3] p-4 text-sm font-black">
            Presupuesto disponible (CRC)
            <input
              type="number"
              min="1"
              step="1000"
              inputMode="numeric"
              value={budgetCrc || ""}
              onChange={(event) => setBudgetCrc(numericValue(event.target.value))}
              className="mt-2 min-h-12 w-full rounded-xl border border-[#00C4B0]/50 bg-white px-3 text-xl font-black outline-none focus:ring-2 focus:ring-[#00C4B0]/25"
            />
            <span className="mt-2 block text-xs font-normal text-[#17685e]">
              Base inicial: ₡300.000. Puede cambiarla por cualquier monto X.
            </span>
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            {SIGN_SIZES.map((size) => (
              <div
                key={size.key}
                className="rounded-2xl border border-[#2E2A25]/12 bg-[#fafaf9] p-4"
                role="group"
                aria-label={`Cantidad de rótulos ${size.label.toLowerCase()}`}
              >
                <p className="font-black">{size.label}</p>
                <p className="text-xs text-[#706b65]">{size.dimensions}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => adjustScope(size.key, -1)}
                    aria-label={`Quitar un rótulo ${size.label.toLowerCase()}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#2E2A25]/20 bg-white transition hover:border-[#00C4B0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00C4B0]"
                  >
                    <Minus className="h-4 w-4" aria-hidden />
                  </button>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={scope[size.key]}
                    onChange={(event) =>
                      setScope((current) => ({
                        ...current,
                        [size.key]: numericValue(event.target.value),
                      }))
                    }
                    aria-label={`Cantidad exacta de rótulos ${size.label.toLowerCase()}`}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-[#2E2A25]/15 bg-white px-2 text-center text-xl font-black outline-none focus:border-[#00C4B0]"
                  />
                  <button
                    type="button"
                    onClick={() => adjustScope(size.key, 1)}
                    aria-label={`Agregar un rótulo ${size.label.toLowerCase()}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#2E2A25]/20 bg-white transition hover:border-[#00C4B0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00C4B0]"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.45fr)]">
          <label className="text-sm font-black">
            Especificación que deben recibir las tres empresas
            <textarea
              value={requirements.specification}
              onChange={(event) =>
                setRequirements((current) => ({
                  ...current,
                  specification: event.target.value,
                }))
              }
              rows={4}
              placeholder="Indique material, acabado, sustrato o estructura, medidas finales y cualquier condición que deba ser idéntica."
              className="mt-1 w-full rounded-2xl border border-[#2E2A25]/20 bg-white px-4 py-3 text-sm font-normal outline-none placeholder:text-[#706b65]/60 focus:border-[#00C4B0] focus:ring-2 focus:ring-[#00C4B0]/20"
            />
          </label>

          <fieldset>
            <legend className="text-sm font-black">Servicios obligatorios</legend>
            <div className="mt-1 space-y-2">
              {(
                [
                  ["designRequired", "Diseño"],
                  ["transportRequired", "Transporte"],
                  ["installationRequired", "Instalación"],
                ] as const
              ).map(([field, label]) => (
                <label
                  key={field}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[#2E2A25]/12 bg-[#fafaf9] p-3 text-sm font-bold"
                >
                  <input
                    type="checkbox"
                    checked={requirements[field]}
                    onChange={(event) =>
                      setRequirements((current) => ({
                        ...current,
                        [field]: event.target.checked,
                      }))
                    }
                    className="h-5 w-5 accent-[#00C4B0]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <section className="mt-10 print:hidden">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00C4B0] font-black text-[#2E2A25]">
            2
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#008d80]">
              Empresas cotizadoras
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Transcriba tres ofertas reales</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#706b65]">
              Los espacios dos y tres empiezan vacíos a propósito. Una cotización global sí
              sirve para comparar el alcance actual, pero solo los precios unitarios
              verificados permiten calcular cuántos rótulos adicionales caben en el presupuesto.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {comparison.map(({ provider, duplicateName }) => (
            <ProviderQuoteCard
              key={provider.id}
              quote={provider}
              scope={scope}
              budgetCrc={budgetCrc}
              requirements={requirements}
              duplicateName={duplicateName}
              onChange={updateProvider}
            />
          ))}
        </div>
      </section>

      <section className="mt-10" aria-live="polite">
        <div className="flex items-start gap-3 print:hidden">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00C4B0] font-black text-[#2E2A25]">
            3
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#008d80]">
              Resumen para aprobación
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Compare antes de autorizar</h2>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-[#2E2A25]/12 bg-white p-5 shadow-[0_12px_32px_rgb(46_42_37_/_8%)] sm:p-6 print:mt-0 print:border-2 print:shadow-none">
          <div className="border-b border-[#2E2A25]/10 pb-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#008d80]">
              Alcance evaluado
            </p>
            <p className="mt-2 text-lg font-black">
              {signsInScope} láminas · Presupuesto {formatCRC(budgetCrc)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#706b65]">
              {SIGN_SIZES.filter((size) => scope[size.key] > 0)
                .map((size) => `${scope[size.key]} ${size.label.toLowerCase()} (${size.dimensions})`)
                .join(" · ") || "Sin cantidades definidas"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#706b65]">
              <span className="font-black text-[#2E2A25]">Especificación común: </span>
              {requirements.specification.trim() || "Pendiente de completar"}
            </p>
          </div>

          <div className="mt-5 space-y-3 md:hidden print:hidden">
            {comparison.map(({ provider, evaluation, comparable, duplicateName }) => (
              <article key={provider.id} className="rounded-2xl border border-[#2E2A25]/12 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#706b65]">Empresa {provider.slot}</p>
                    <h3 className="font-black">{provider.vendorName || "Pendiente"}</h3>
                  </div>
                  <span className="text-right text-sm font-black">
                    {evaluation.officialTotalCrc === null
                      ? "Pendiente"
                      : formatCRC(evaluation.officialTotalCrc)}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-[#706b65]">Referencia</dt>
                    <dd className="font-bold">{provider.quoteReference || "Pendiente"}</dd>
                  </div>
                  <div>
                    <dt className="text-[#706b65]">Plazo</dt>
                    <dd className="font-bold">
                      {provider.leadTimeDays > 0 ? `${provider.leadTimeDays} días` : "Pendiente"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#706b65]">Garantía</dt>
                    <dd className="font-bold">{provider.warranty || "Pendiente"}</dd>
                  </div>
                  <div>
                    <dt className="text-[#706b65]">Estado</dt>
                    <dd className="font-bold">
                      {duplicateName
                        ? "Duplicada"
                        : comparable
                          ? evaluation.withinBudget
                            ? "Comparable · dentro"
                            : "Comparable · excede"
                          : "Incompleta"}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <div className="mt-5 hidden overflow-x-auto md:block print:block print:overflow-visible">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm print:min-w-0 print:text-xs">
              <thead>
                <tr className="border-b-2 border-[#2E2A25] text-xs uppercase tracking-[0.1em]">
                  <th className="px-3 py-3 font-black">Empresa</th>
                  <th className="px-3 py-3 font-black">Referencia</th>
                  <th className="px-3 py-3 text-right font-black">Total oficial</th>
                  <th className="px-3 py-3 text-right font-black">Saldo / faltante</th>
                  <th className="px-3 py-3 font-black">Plazo</th>
                  <th className="px-3 py-3 font-black">Garantía</th>
                  <th className="px-3 py-3 font-black">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2A25]/10">
                {comparison.map(({ provider, evaluation, comparable, duplicateName }) => {
                  const selected = lowestComparable?.provider.id === provider.id;
                  return (
                    <tr key={provider.id} className={selected ? "bg-[#d9f7f3]" : undefined}>
                      <td className="px-3 py-4 font-black">
                        {provider.vendorName || `Empresa ${provider.slot} pendiente`}
                        {selected ? (
                          <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-[#008d80]">
                            Menor total comparable
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-4">{provider.quoteReference || "Pendiente"}</td>
                      <td className="px-3 py-4 text-right font-black">
                        {evaluation.officialTotalCrc === null
                          ? "Pendiente"
                          : formatCRC(evaluation.officialTotalCrc)}
                      </td>
                      <td className="px-3 py-4 text-right font-bold">
                        {evaluation.differenceToBudgetCrc === null
                          ? "—"
                          : evaluation.differenceToBudgetCrc >= 0
                            ? formatCRC(evaluation.differenceToBudgetCrc)
                            : `−${formatCRC(Math.abs(evaluation.differenceToBudgetCrc))}`}
                      </td>
                      <td className="px-3 py-4">
                        {provider.leadTimeDays > 0 ? `${provider.leadTimeDays} días` : "Pendiente"}
                      </td>
                      <td className="px-3 py-4">{provider.warranty || "Pendiente"}</td>
                      <td className="px-3 py-4 font-bold">
                        {duplicateName
                          ? "Empresa duplicada"
                          : comparable
                            ? evaluation.withinBudget
                              ? "Comparable · dentro"
                              : "Comparable · excede"
                            : "Incompleta"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            className={`mt-6 rounded-2xl border p-5 ${
              readyForDecision && lowestComparable
                ? "border-[#00C4B0]/40 bg-[#d9f7f3]"
                : "border-amber-300/60 bg-amber-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {readyForDecision && lowestComparable ? (
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[#008d80]" aria-hidden />
              ) : (
                <TriangleAlert className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" aria-hidden />
              )}
              <div>
                <p className="font-black">
                  {!readyForDecision
                    ? `No autorizar todavía: hay ${comparableQuotes.length} de ${REQUIRED_QUOTES} cotizaciones comparables.`
                    : lowestComparable
                      ? `Lista para decisión: ${lowestComparable.provider.vendorName} tiene el menor total comparable dentro del presupuesto.`
                      : "Hay tres cotizaciones comparables, pero ninguna cumple el presupuesto."}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#706b65]">
                  {!readyForDecision
                    ? "Complete empresas distintas, documento, fecha, total final, IVA, evidencia y confirmación del mismo alcance."
                    : lowestComparable
                      ? `Monto: ${formatCRC(lowestComparable.evaluation.officialTotalCrc ?? 0)}${
                          savings !== null && savings > 0
                            ? ` · Diferencia frente a la siguiente oferta dentro del presupuesto: ${formatCRC(savings)}`
                            : ""
                        }. El menor precio no reemplaza la revisión humana de plazo, garantía y condiciones.`
                      : "Reduzca cantidades, aumente el presupuesto o solicite nuevas ofertas antes de seleccionar una empresa."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="flex gap-3 rounded-2xl border border-[#2E2A25]/12 p-4">
              <FileCheck2 className="h-5 w-5 shrink-0 text-[#008d80]" aria-hidden />
              <p className="text-sm"><span className="block font-black">3 documentos</span>Adjuntar los originales.</p>
            </div>
            <div className="flex gap-3 rounded-2xl border border-[#2E2A25]/12 p-4">
              <CircleDollarSign className="h-5 w-5 shrink-0 text-[#008d80]" aria-hidden />
              <p className="text-sm"><span className="block font-black">Mismo alcance</span>Comparar total final e inclusiones.</p>
            </div>
            <div className="flex gap-3 rounded-2xl border border-[#2E2A25]/12 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[#008d80]" aria-hidden />
              <p className="text-sm"><span className="block font-black">Decisión humana</span>Documentar motivo y aprobación.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
