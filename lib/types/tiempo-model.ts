// lib/types/tiempo-model.ts
// Tipos del motor de predicción de /tiempo v2.0.
//
// El dashboard v2.0 se organiza en TRES bloques, cada uno con su propio nivel
// de confianza:
//   1. Estado ACTUAL  (observación directa de la estación IMN)
//   2. Estado de MAÑANA, hora por hora  (predicción, ensemble de métodos)
//   3. NIVEL DEL RÍO en el tramo del tour  (hidrología derivada de la lluvia)
//
// Fuente primaria y única "verdad": pluviómetro IMN Reserva Montaña Sagrada
// (cuenca alta del Río La Vieja). Fuente secundaria, con confianza rebajada:
// modelo Open-Meteo para San Carlos / Ciudad Quesada.

export type ConfidenceLevel = "alta" | "media" | "baja";

/** Un factor que sube o baja la confianza, para poder mostrar el desglose. */
export type ConfidenceFactor = { label: string; delta: number };

export type ConfidenceScore = {
  /** 0–100 */
  score: number;
  level: ConfidenceLevel;
  /** Frase corta con el motivo dominante. */
  reason: string;
  /** Desglose de penalizaciones/bonos (para el "cómo se calcula"). */
  factors: ConfidenceFactor[];
};

// ── 1. Índice de precipitación antecedente (memoria de humedad de la cuenca) ──

export type AntecedentState = {
  /** Índice de precipitación antecedente en mm-equivalente (decaimiento exp.). */
  apiMm: number;
  /** Mismo índice normalizado 0–100 contra saturación de referencia. */
  apiIndex: number;
  /** Constante de decaimiento diario usada (k). */
  decayPerDay: number;
  /** Coeficiente de escorrentía actual (fracción de lluvia que va al río). */
  runoffCoef: number;
  /** Acumulados de lluvia en ventanas móviles hacia atrás (mm). */
  windows: {
    h1: number; h3: number; h6: number; h12: number;
    h24: number; h48: number; h72: number;
  };
  /** Evolución reciente del índice, para graficar. */
  series: { tsISO: string | null; apiMm: number }[];
};

// ── 2. Climatología a partir del histórico de la propia estación ─────────────

export type HourClimatology = {
  /** Hora del día 0–23 (hora de Costa Rica). */
  hour: number;
  /** Lluvia media a esa hora del día (mm). */
  meanMm: number;
  /** Probabilidad histórica de lluvia medible a esa hora (0–1). */
  wetProb: number;
  /** Nº de muestras que respaldan la hora. */
  samples: number;
};

export type ClimatologyModel = {
  month: number;
  monthLabel: string;
  /** Media / mediana del total diario en el histórico disponible (mm). */
  dailyMeanMm: number;
  dailyMedianMm: number;
  /** Autocorrelación de lag-1 del total diario (φ para el modelo AR(1)). */
  lag1Autocorr: number;
  /** Ciclo diurno: 24 entradas, hora 0 → 23. */
  hourly: HourClimatology[];
  sampleDays: number;
  sampleHours: number;
};

// ── 3. Predicción de mañana, hora por hora ──────────────────────────────────

export type ForecastMember = {
  climatology: number;
  persistence: number;
  analog: number;
  /** Miembro secundario (Open-Meteo). null si no está disponible. */
  secondary: number | null;
};

export type ForecastHour = {
  tsISO: string;
  /** Hora de Costa Rica 0–23. */
  hour: number;
  /** Lluvia esperada (mm) — media del ensemble. */
  expectedMm: number;
  /** Banda p10–p90 (mm). */
  p10Mm: number;
  p90Mm: number;
  /** Probabilidad de lluvia esa hora (0–1). */
  rainProb: number;
  members: ForecastMember;
  /** ¿Cae dentro de la ventana operativa del tour (mañana)? */
  inOperatingWindow: boolean;
};

export type ForecastBlockKey =
  | "madrugada" | "manana" | "mediodia" | "tarde" | "noche";

export type ForecastBlock = {
  key: ForecastBlockKey;
  label: string;
  hoursRange: [number, number];
  expectedMm: number;
  p90Mm: number;
  rainProbMax: number;
  verdict: "seco" | "llovizna" | "lluvia" | "lluvia-fuerte";
  confidence: ConfidenceScore;
};

export type ForecastAnalog = {
  /** Fecha del día histórico parecido. */
  dateISO: string | null;
  /** Lluvia del propio día parecido (mm). */
  priorMm: number;
  /** Lo que cayó el día siguiente a ese (mm) — el "análogo" de mañana. */
  nextMm: number;
  /** Peso relativo del análogo (0–1). */
  weight: number;
};

export type TomorrowForecast = {
  /** Fecha de mañana (hora de Costa Rica), YYYY-MM-DD. */
  dateISO: string;
  dailyExpectedMm: number;
  dailyP10Mm: number;
  dailyP90Mm: number;
  hourly: ForecastHour[];
  blocks: ForecastBlock[];
  analogs: ForecastAnalog[];
  methodWeights: { climatology: number; persistence: number; analog: number; secondary: number };
  secondaryAvailable: boolean;
  /** Confianza global del bloque "mañana". */
  confidence: ConfidenceScore;
};

// ── 4. Nivel del río en el tramo del tour ───────────────────────────────────

export type RiverHour = {
  tsISO: string;
  hour: number;
  /** true = movido por lluvia MEDIDA; false = proyección con pronóstico. */
  observed: boolean;
  /** Índice de caudal 0–100 en el tramo del tour. */
  index: number;
  /** Banda de la proyección (0–100). En horas observadas p10=p90=index. */
  p10: number;
  p90: number;
  quickFlow: number;
  baseFlow: number;
  /** Variación del índice respecto a la hora anterior (pts/h). */
  riseRatePerH: number;
};

export type RiverModel = {
  /** Retardo estación → tramo del tour: tiempo al pico del hidrograma (h). */
  timeToPeakH: number;
  /** Tiempo base del hidrograma unitario (h). */
  baseTimeH: number;
  baseflowDecayPerH: number;

  indexNow: number;
  bandNow: [number, number];
  stateLabel: string;
  stateLevel: "bajo" | "moderado" | "alto" | "critico";
  riseRateNowPerH: number;
  trend: "subiendo" | "estable" | "bajando";

  /** Histórico (observado) + proyección 24–30 h. */
  series: RiverHour[];
  /** Máximo del índice en la ventana de proyección (siempre, aunque el río esté bajando). */
  peak: {
    tsISO: string | null;
    index: number;
    etaHours: number | null;
    /** ¿El pico depende de lluvia pronosticada (no solo de la ya caída)? */
    fromForecastRain: boolean;
    /** ¿El máximo proyectado supera el índice actual (el río sube)? */
    exceedsNow: boolean;
  } | null;
  lagExplainer: string;

  crecida: {
    level: "bajo" | "moderado" | "alto" | "critico";
    label: string;
    guidance: string;
    basisMm: number;
    /** Lluvia extra en 3 h que llevaría el río a "puede subir" (mm). */
    triggerRainMm: number;
  };

  confidence: {
    now: ConfidenceScore;
    plus6h: ConfidenceScore;
    plus24h: ConfidenceScore;
  };
};

// ── Salida completa del motor ──────────────────────────────────────────────

export type TiempoModel = {
  antecedent: AntecedentState;
  climatology: ClimatologyModel;
  tomorrow: TomorrowForecast;
  river: RiverModel;
  /** Un nivel de confianza por cada uno de los 3 bloques del dashboard. */
  confidence: {
    now: ConfidenceScore;
    tomorrow: ConfidenceScore;
    river: ConfidenceScore;
  };
  /** Notas honestas sobre supuestos del modelo. */
  assumptions: string[];
  generatedAtISO: string;
};
