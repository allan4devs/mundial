import type {
  ProviderQuote,
  ScopeQuantities,
  ScopeRequirements,
  SignSizeDefinition,
} from "./types";
import { ROTULOS } from "../data";
import { PANEL_SIZE_SPECS, planMeasurementStats } from "../measurements";

export const DEFAULT_BUDGET_CRC = 300000;
export const REQUIRED_QUOTES = 3;

export const SIGN_SIZES: SignSizeDefinition[] = [
  {
    key: "large",
    label: "Grande",
    dimensions: "3 × 2 m",
    widthM: PANEL_SIZE_SPECS.grande.widthM,
    heightM: PANEL_SIZE_SPECS.grande.heightM,
  },
  {
    key: "medium",
    label: "Mediano",
    dimensions: "2 × 1 m",
    widthM: PANEL_SIZE_SPECS.mediano.widthM,
    heightM: PANEL_SIZE_SPECS.mediano.heightM,
  },
  {
    key: "small",
    label: "Pequeño",
    dimensions: "1 × 1 m",
    widthM: PANEL_SIZE_SPECS.pequeno.widthM,
    heightM: PANEL_SIZE_SPECS.pequeno.heightM,
  },
];

/**
 * Alcance por defecto: se calcula desde el catálogo real (`ROTULOS` en
 * data.ts) en vez de repetir las cantidades a mano, para que este valor no
 * quede desincronizado si el plan de láminas cambia.
 */
const catalogPanelsBySize = planMeasurementStats(ROTULOS).bySize;

export const DEFAULT_SCOPE: ScopeQuantities = {
  large: catalogPanelsBySize.grande,
  medium: catalogPanelsBySize.mediano,
  small: catalogPanelsBySize.pequeno,
};

export const DEFAULT_SCOPE_REQUIREMENTS: ScopeRequirements = {
  specification: "",
  designRequired: false,
  transportRequired: false,
  installationRequired: false,
};

export const FC_PRELIMINARY_NOTE =
  "Referencia preliminar registrada: adhesivo impreso de 2 × 1 m por ₡25.000 + IVA. No se extrapola a otros tamaños y no cuenta como cotización comparable sin el documento y el alcance completos.";

function emptyProvider(slot: number): ProviderQuote {
  return {
    id: `provider-${slot}`,
    slot,
    vendorName: slot === 1 ? "FC Rótulos" : "",
    quoteReference: "",
    issuedOn: "",
    validUntil: "",
    evidenceReference: "",
    materialConfirmation: "",
    taxTreatment: "unknown",
    officialTotalCrc: 0,
    unitPricesCrc: { large: 0, medium: 0, small: 0 },
    designCrc: 0,
    transportCrc: 0,
    installationCrc: 0,
    otherCrc: 0,
    discountCrc: 0,
    pricesVerified: false,
    scopeConfirmed: false,
    quoteReceived: false,
    includesDesign: false,
    includesTransport: false,
    includesInstallation: false,
    leadTimeDays: 0,
    warranty: "",
    paymentTerms: "",
    notes: "",
  };
}

export function createDefaultProviders(): ProviderQuote[] {
  return Array.from({ length: REQUIRED_QUOTES }, (_, index) => emptyProvider(index + 1));
}
