import type { Copy, Lang, Panel, PanelSizeKey, Rotulo } from "./types";

export type PanelSizeSpec = {
  key: PanelSizeKey;
  label: Copy;
  widthM: number;
  heightM: number;
};

/** Medidas de trabajo del plan; no sustituyen la ficha final del proveedor. */
export const PANEL_SIZE_SPECS: Record<PanelSizeKey, PanelSizeSpec> = {
  grande: {
    key: "grande",
    label: { es: "Grande", en: "Large" },
    widthM: 3,
    heightM: 2,
  },
  mediano: {
    key: "mediano",
    label: { es: "Mediano", en: "Medium" },
    widthM: 2,
    heightM: 1,
  },
  pequeno: {
    key: "pequeno",
    label: { es: "Pequeño", en: "Small" },
    widthM: 1,
    heightM: 1,
  },
};

export const PANEL_SIZE_ORDER: PanelSizeKey[] = ["grande", "mediano", "pequeno"];

function decimal(value: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "es" ? "es-CR" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function panelAreaM2(size: PanelSizeKey) {
  const spec = PANEL_SIZE_SPECS[size];
  return spec.widthM * spec.heightM;
}

export function sizeMeasurementLabel(size: PanelSizeKey, lang: Lang) {
  const spec = PANEL_SIZE_SPECS[size];
  const area = panelAreaM2(size);
  return lang === "es"
    ? `${decimal(spec.widthM, lang)} m ancho × ${decimal(spec.heightM, lang)} m alto · ${decimal(area, lang)} m²`
    : `${decimal(spec.widthM, lang)} m wide × ${decimal(spec.heightM, lang)} m high · ${decimal(area, lang)} m²`;
}

export function panelMeasurementLabel(panel: Panel, lang: Lang) {
  return sizeMeasurementLabel(panel.size, lang);
}

export function panelMeasurementCentimeters(panel: Panel) {
  const spec = PANEL_SIZE_SPECS[panel.size];
  return `${Math.round(spec.widthM * 100)} × ${Math.round(spec.heightM * 100)} cm`;
}

export function rotuloTotalAreaM2(rotulo: Rotulo) {
  return rotulo.panels.reduce((total, panel) => total + panelAreaM2(panel.size), 0);
}

export function rotuloMeasurementSummary(rotulo: Rotulo, lang: Lang) {
  const counts = rotulo.panels.reduce<Partial<Record<PanelSizeKey, number>>>((result, panel) => {
    result[panel.size] = (result[panel.size] ?? 0) + 1;
    return result;
  }, {});

  return PANEL_SIZE_ORDER.flatMap((key) => {
    const count = counts[key] ?? 0;
    if (!count) return [];
    const spec = PANEL_SIZE_SPECS[key];
    const sizeText =
      lang === "es"
        ? `${decimal(spec.widthM, lang)} m ancho × ${decimal(spec.heightM, lang)} m alto`
        : `${decimal(spec.widthM, lang)} m wide × ${decimal(spec.heightM, lang)} m high`;
    return [
      `${count > 1 ? `${count} × ` : ""}${spec.label[lang]} · ${sizeText}${count > 1 ? (lang === "es" ? " c/u" : " each") : ""}`,
    ];
  }).join(" · ");
}

export function planMeasurementStats(rotulos: Rotulo[]) {
  const bySize: Record<PanelSizeKey, number> = { grande: 0, mediano: 0, pequeno: 0 };
  let panels = 0;
  let areaM2 = 0;

  for (const rotulo of rotulos) {
    for (const panel of rotulo.panels) {
      bySize[panel.size] += 1;
      panels += 1;
      areaM2 += panelAreaM2(panel.size);
    }
  }

  return { records: rotulos.length, panels, areaM2, bySize };
}

export function formatAreaM2(value: number, lang: Lang) {
  return `${decimal(value, lang)} m²`;
}
