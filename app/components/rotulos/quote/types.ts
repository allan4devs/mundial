export type SignSizeKey = "large" | "medium" | "small";

export type ScopeQuantities = Record<SignSizeKey, number>;

export type ScopeRequirements = {
  specification: string;
  designRequired: boolean;
  transportRequired: boolean;
  installationRequired: boolean;
};

export type TaxTreatment = "unknown" | "included" | "separate";

export type ProviderQuote = {
  id: string;
  slot: number;
  vendorName: string;
  quoteReference: string;
  issuedOn: string;
  validUntil: string;
  evidenceReference: string;
  materialConfirmation: string;
  taxTreatment: TaxTreatment;
  officialTotalCrc: number;
  unitPricesCrc: Record<SignSizeKey, number>;
  designCrc: number;
  transportCrc: number;
  installationCrc: number;
  otherCrc: number;
  discountCrc: number;
  pricesVerified: boolean;
  scopeConfirmed: boolean;
  quoteReceived: boolean;
  includesDesign: boolean;
  includesTransport: boolean;
  includesInstallation: boolean;
  leadTimeDays: number;
  warranty: string;
  paymentTerms: string;
  notes: string;
};

export type SignSizeDefinition = {
  key: SignSizeKey;
  label: string;
  dimensions: string;
  widthM: number;
  heightM: number;
};

export type QuoteEvaluation = {
  variableSubtotalCrc: number | null;
  fixedChargesCrc: number;
  computedTotalCrc: number | null;
  officialTotalCrc: number | null;
  differenceToBudgetCrc: number | null;
  discrepancyCrc: number | null;
  hasDiscrepancy: boolean;
  expired: boolean;
  comparable: boolean;
  withinBudget: boolean | null;
  missing: string[];
};

export type MixCapacity = {
  completeMixes: number;
  signs: number;
};
