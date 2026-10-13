import { SIGN_SIZES } from "./constants";
import type {
  MixCapacity,
  ProviderQuote,
  QuoteEvaluation,
  ScopeQuantities,
  ScopeRequirements,
  SignSizeKey,
} from "./types";

function positive(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function formatCRC(value: number) {
  return `₡${new Intl.NumberFormat("es-CR", { maximumFractionDigits: 0 }).format(
    Math.round(value),
  )}`;
}

export function scopeSignCount(scope: ScopeQuantities) {
  return SIGN_SIZES.reduce((total, size) => total + positive(scope[size.key]), 0);
}

export function quoteFixedCharges(quote: ProviderQuote) {
  return (
    positive(quote.designCrc) +
    positive(quote.transportCrc) +
    positive(quote.installationCrc) +
    positive(quote.otherCrc) -
    positive(quote.discountCrc)
  );
}

export function quoteVariableSubtotal(
  quote: ProviderQuote,
  scope: ScopeQuantities,
): number | null {
  const selectedSizes = SIGN_SIZES.filter((size) => positive(scope[size.key]) > 0);
  if (selectedSizes.length === 0) return null;

  if (selectedSizes.some((size) => positive(quote.unitPricesCrc[size.key]) === 0)) {
    return null;
  }

  return selectedSizes.reduce(
    (total, size) =>
      total + positive(scope[size.key]) * positive(quote.unitPricesCrc[size.key]),
    0,
  );
}

export function isQuoteExpired(validUntil: string, today = new Date()) {
  if (!validUntil) return false;
  const expiry = new Date(`${validUntil}T23:59:59`);
  return Number.isNaN(expiry.getTime()) ? false : expiry.getTime() < today.getTime();
}

export function evaluateProviderQuote(
  quote: ProviderQuote,
  scope: ScopeQuantities,
  budgetCrc: number,
  requirements: ScopeRequirements,
  today = new Date(),
): QuoteEvaluation {
  const variableSubtotalCrc = quoteVariableSubtotal(quote, scope);
  const fixedChargesCrc = quoteFixedCharges(quote);
  const computedTotalCrc =
    variableSubtotalCrc === null
      ? null
      : Math.max(0, variableSubtotalCrc + fixedChargesCrc);
  const officialTotalCrc = positive(quote.officialTotalCrc) || null;
  const differenceToBudgetCrc =
    officialTotalCrc === null ? null : positive(budgetCrc) - officialTotalCrc;
  const discrepancyCrc =
    officialTotalCrc === null || computedTotalCrc === null || !quote.pricesVerified
      ? null
      : officialTotalCrc - computedTotalCrc;
  const hasDiscrepancy = discrepancyCrc !== null && Math.abs(discrepancyCrc) > 1;
  const expired = isQuoteExpired(quote.validUntil, today);
  const missing: string[] = [];

  if (scopeSignCount(scope) === 0) missing.push("Defina al menos una lámina en el alcance");
  if (!requirements.specification.trim()) missing.push("Complete la especificación común");
  if (!quote.vendorName.trim()) missing.push("Nombre de la empresa");
  if (!quote.quoteReference.trim()) missing.push("Número o referencia de cotización");
  if (!quote.issuedOn) missing.push("Fecha de emisión");
  if (!quote.evidenceReference.trim()) missing.push("Referencia del documento recibido");
  if (!quote.materialConfirmation.trim()) missing.push("Material y acabado ofrecidos");
  if (quote.taxTreatment === "unknown") missing.push("Tratamiento de IVA");
  if (officialTotalCrc === null) missing.push("Total final del documento");
  if (!quote.scopeConfirmed) missing.push("Confirmar el mismo alcance");
  if (requirements.designRequired && !quote.includesDesign) missing.push("Confirmar diseño incluido");
  if (requirements.transportRequired && !quote.includesTransport) {
    missing.push("Confirmar transporte incluido");
  }
  if (requirements.installationRequired && !quote.includesInstallation) {
    missing.push("Confirmar instalación incluida");
  }
  if (!quote.quoteReceived) missing.push("Confirmar que la cotización fue recibida");
  if (expired) missing.push("La cotización está vencida");
  if (hasDiscrepancy) missing.push("Reconciliar el total calculado con el total oficial");

  return {
    variableSubtotalCrc,
    fixedChargesCrc,
    computedTotalCrc,
    officialTotalCrc,
    differenceToBudgetCrc,
    discrepancyCrc,
    hasDiscrepancy,
    expired,
    comparable: missing.length === 0,
    withinBudget:
      officialTotalCrc === null ? null : officialTotalCrc <= positive(budgetCrc),
    missing,
  };
}

export function maxQuantityForSize(
  quote: ProviderQuote,
  size: SignSizeKey,
  budgetCrc: number,
): number | null {
  const unitPrice = positive(quote.unitPricesCrc[size]);
  if (!quote.pricesVerified || unitPrice === 0) return null;
  const available = positive(budgetCrc) - quoteFixedCharges(quote);
  return available < 0 ? 0 : Math.floor(available / unitPrice);
}

export function mixCapacity(
  quote: ProviderQuote,
  scope: ScopeQuantities,
  budgetCrc: number,
): MixCapacity | null {
  if (!quote.pricesVerified) return null;
  const variableMixCost = quoteVariableSubtotal(quote, scope);
  const signsPerMix = scopeSignCount(scope);
  if (variableMixCost === null || variableMixCost <= 0 || signsPerMix <= 0) return null;

  const available = positive(budgetCrc) - quoteFixedCharges(quote);
  const completeMixes = available < 0 ? 0 : Math.floor(available / variableMixCost);
  return { completeMixes, signs: completeMixes * signsPerMix };
}

export function normalizeVendorName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es-CR")
    .replace(/\s+/g, " ");
}
