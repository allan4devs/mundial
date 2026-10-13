// lib/helpers/tiempoModel.ts
// ─────────────────────────────────────────────────────────────────────────────
// MOTOR DE PREDICCIÓN /tiempo v2.0
//
// Todo lo que se muestra sale de UNA fuente física: el pluviómetro IMN de la
// Reserva Montaña Sagrada, en la cuenca alta que alimenta el Río La Vieja.
// Mide solo lluvia (mm) por hora, más el acumulado del día. No hay limnímetro,
// ni termómetro, ni sensor de caudal.
//
// A partir de esa serie de lluvia derivamos, con matemática explícita:
//   • API  — índice de precipitación antecedente (memoria de humedad del suelo)
//   • Climatología horaria propia (ciclo diurno de la convección local)
//   • Ensemble de pronóstico para mañana (climatología + persistencia AR(1) +
//     análogos + un miembro secundario Open-Meteo con peso bajo)
//   • Modelo hidrológico estación → tramo del tour (hidrograma unitario +
//     flujo base por recesión). "Si llueve en la estación, el río crece más
//     abajo, donde hacemos el tour" — con retardo y atenuación.
//
// Cada bloque del dashboard (AHORA / MAÑANA / RÍO) lleva su nivel de confianza,
// calculado a partir de: frescura y completitud de la estación, dispersión del
// ensemble, profundidad del histórico, horizonte y cuánto se apoya en la
// fuente secundaria.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AntecedentState,
  ClimatologyModel,
  ConfidenceFactor,
  ConfidenceScore,
  ForecastBlock,
  ForecastHour,
  HourClimatology,
  RiverHour,
  RiverModel,
  TiempoModel,
  TomorrowForecast,
} from "@/lib/types/tiempo-model";

// ── Constantes del modelo (pensadas para que el equipo las ajuste con la
//    experiencia real de operación en el Río La Vieja) ─────────────────────────

export const MODEL_TUNING = {
  /** Decaimiento diario del índice antecedente (0.90 = pierde 10 %/día). */
  API_DECAY_PER_DAY: 0.9,
  /** API (mm) al que la cuenca se considera prácticamente saturada. */
  API_REF_MM: 90,
  /** Coeficiente de escorrentía en cuenca seca / saturada. */
  RUNOFF_MIN: 0.12,
  RUNOFF_MAX: 0.8,

  /** Retardo estación → tramo del tour: horas hasta el pico del hidrograma. */
  RIVER_TIME_TO_PEAK_H: 4,
  /** Duración total de la respuesta rápida (h). */
  RIVER_BASE_TIME_H: 16,
  /** Forma del hidrograma unitario (n de la función gamma). */
  RIVER_UH_SHAPE_N: 3.5,
  /** Recesión horaria del flujo base. */
  RIVER_BASEFLOW_DECAY_PER_H: 0.96,
  /** Índice base del río sin lluvia reciente. */
  RIVER_BASE_INDEX: 8,
  /** Ganancia del flujo base sobre la humedad de cuenca normalizada (0–100). */
  RIVER_BF_GAIN: 0.36,
  /** Ganancia de la respuesta rápida sobre la lluvia efectiva. */
  RIVER_QF_GAIN: 1.9,
  /** Escala de saturación del componente hidrológico del índice. */
  RIVER_FLOW_SCALE: 40,

  /** Ventana operativa del tour (horas de Costa Rica), con margen de prep. */
  OPERATING_WINDOW: [6, 16] as [number, number],

  /** Pesos del ensemble de pronóstico (la estación manda). */
  ENSEMBLE_WEIGHTS: { climatology: 0.3, persistence: 0.3, analog: 0.25, secondary: 0.15 },
  /** Nº de días análogos a promediar. */
  ANALOG_K: 5,
  /** Incertidumbre relativa irreducible de la lluvia horaria pronosticada. */
  FORECAST_REL_SIGMA: 0.6,
  /** Correlación intradía para agregar la banda diaria. */
  FORECAST_INTRADAY_RHO: 0.45,
} as const;

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// ── Utilidades numéricas ────────────────────────────────────────────────────

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round((Number(v) || 0) * 10) / 10;
const roundN = (v: number, n: number) => {
  const f = 10 ** n;
  return Math.round((Number(v) || 0) * f) / f;
};
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const mean = (a: number[]) => (a.length ? sum(a) / a.length : 0);
const stdev = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(mean(a.map((x) => (x - m) ** 2)));
};
const median = (a: number[]) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
const smoothstep = (x: number) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};
const ln1p = Math.log1p;
const expm1 = Math.expm1;
const pad2 = (n: number) => String(n).padStart(2, "0");
/** z para p10 / p90 en una normal. */
const Z80 = 1.281552;

/** Humedad de cuenca normalizada 0–100 (saturación suave, no lineal). */
const apiNorm = (apiMm: number) =>
  clamp(100 * (1 - Math.exp(-Math.max(0, apiMm) / MODEL_TUNING.API_REF_MM)), 0, 100);

// ── Hora de Costa Rica (UTC−6 todo el año, igual que parseIMNDate) ───────────

const CR_OFFSET_MS = -6 * 60 * 60 * 1000;
function crParts(d: Date) {
  const t = new Date(d.getTime() + CR_OFFSET_MS);
  return {
    y: t.getUTCFullYear(),
    m: t.getUTCMonth() + 1,
    day: t.getUTCDate(),
    hour: t.getUTCHours(),
    min: t.getUTCMinutes(),
  };
}
const crDateStr = (d: Date) => {
  const p = crParts(d);
  return `${p.y}-${pad2(p.m)}-${pad2(p.day)}`;
};
const crHour = (d: Date) => crParts(d).hour;
/** Date UTC para una hora de Costa Rica dada. */
const crDateAt = (dateStr: string, hour: number) => {
  const [y, m, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day, hour - CR_OFFSET_MS / 3600000));
};
const addDaysStr = (dateStr: string, days: number) => {
  const [y, m, day] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day + days));
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
};

// ── Entrada del motor ──────────────────────────────────────────────────────

export type ModelHourly = {
  timestamp: Date | null;
  lluvia_mm: number;
  temp_c: number | null;
  hr_pct: number | null;
};
export type ModelDaily = { timestamp: Date | null; lluvia_mm: number };
export type ModelSecondaryHour = { tsISO: string; precipMm: number; precipProb: number | null };

export type BuildModelInput = {
  /** Filas horarias del IMN, más recientes primero. */
  hourly: ModelHourly[];
  /** Filas diarias del IMN, más recientes primero. */
  daily: ModelDaily[];
  /** Acumulado de hoy (SUM_lluv) desde las 7 a.m., si está. */
  todaySumMm: number | null;
  /** Salud de la estación 0–100 (frescura + completitud). */
  stationHealthScore: number;
  minutesSinceReading: number | null;
  hourlyRows24h: number;
  /** Pronóstico horario secundario (Open-Meteo San Carlos). Puede faltar. */
  secondaryHourly?: ModelSecondaryHour[];
  now?: Date;
};

// ── Rejilla horaria regular a partir de las lecturas del IMN ────────────────

type Grid = {
  ts: Date[];
  rain: number[];
  /** Índice de la última hora con lectura real (ancla del "ahora"). */
  lastIdx: number;
};

function buildGrid(hourly: ModelHourly[]): Grid | null {
  const valid = hourly
    .filter((r) => r.timestamp && Number.isFinite(r.lluvia_mm))
    .map((r) => ({ t: r.timestamp as Date, mm: Math.max(0, r.lluvia_mm) }))
    .sort((a, b) => a.t.getTime() - b.t.getTime());
  if (valid.length < 6) return null;

  const HOUR = 3600_000;
  const floorHour = (ms: number) => Math.floor(ms / HOUR) * HOUR;
  const startMs = floorHour(valid[0].t.getTime());
  const endMs = floorHour(valid[valid.length - 1].t.getTime());
  const nRaw = Math.round((endMs - startMs) / HOUR) + 1;
  const n = clamp(nRaw, 6, 220);
  const gridStart = endMs - (n - 1) * HOUR;

  const bucket = new Map<number, number>();
  for (const v of valid) {
    const key = floorHour(v.t.getTime());
    bucket.set(key, (bucket.get(key) ?? 0) + v.mm);
  }

  const ts: Date[] = [];
  const rain: number[] = [];
  for (let i = 0; i < n; i++) {
    const ms = gridStart + i * HOUR;
    ts.push(new Date(ms));
    rain.push(bucket.get(ms) ?? 0);
  }
  return { ts, rain, lastIdx: n - 1 };
}

// ── 1. Índice de precipitación antecedente (API) ───────────────────────────

function buildAntecedent(grid: Grid): AntecedentState {
  const kDay = MODEL_TUNING.API_DECAY_PER_DAY;
  const kHour = kDay ** (1 / 24);

  const apiSeries: number[] = [];
  let apiMm = grid.rain.slice(0, 24).reduce((a, b) => a + b, 0) * 0.5; // arranque suave
  for (let i = 0; i < grid.rain.length; i++) {
    apiMm = grid.rain[i] + kHour * apiMm;
    apiSeries.push(apiMm);
  }

  const last = grid.lastIdx;
  const win = (h: number) =>
    round1(grid.rain.slice(Math.max(0, last - h + 1), last + 1).reduce((a, b) => a + b, 0));

  const apiNow = apiSeries[last];
  const apiIndex = apiNorm(apiNow);
  const runoffCoef =
    MODEL_TUNING.RUNOFF_MIN +
    (MODEL_TUNING.RUNOFF_MAX - MODEL_TUNING.RUNOFF_MIN) * smoothstep(apiIndex / 100);

  const seriesOut = grid.ts
    .map((t, i) => ({ tsISO: t.toISOString(), apiMm: round1(apiSeries[i]) }))
    .slice(-72);

  return {
    apiMm: round1(apiNow),
    apiIndex: Math.round(apiIndex),
    decayPerDay: kDay,
    runoffCoef: roundN(runoffCoef, 2),
    windows: {
      h1: win(1), h3: win(3), h6: win(6), h12: win(12),
      h24: win(24), h48: win(48), h72: win(72),
    },
    series: seriesOut,
  };
}

/** Coeficiente de escorrentía para un valor de API dado. */
function runoffFor(apiMm: number): number {
  return (
    MODEL_TUNING.RUNOFF_MIN +
    (MODEL_TUNING.RUNOFF_MAX - MODEL_TUNING.RUNOFF_MIN) * smoothstep(apiNorm(apiMm) / 100)
  );
}

// ── 2. Climatología propia de la estación ──────────────────────────────────

function buildClimatology(grid: Grid, daily: ModelDaily[], now: Date): ClimatologyModel {
  // Ciclo diurno desde la rejilla horaria.
  const byHour: number[][] = Array.from({ length: 24 }, () => []);
  for (let i = 0; i < grid.rain.length; i++) {
    byHour[crHour(grid.ts[i])].push(grid.rain[i]);
  }
  const rawMean = byHour.map((a) => (a.length ? mean(a) : 0));
  const rawWet = byHour.map((a) => (a.length ? a.filter((v) => v > 0.2).length / a.length : 0));
  const globalMean = mean(grid.rain);
  // Prior de probabilidad de lluvia horaria (fracción global), acotado.
  const globalWetPrior = clamp(
    grid.rain.filter((v) => v > 0.2).length / Math.max(1, grid.rain.length),
    0.04,
    0.5,
  );

  const at = (arr: number[], h: number) => arr[(h + 24) % 24];
  const hourly: HourClimatology[] = [];
  for (let h = 0; h < 24; h++) {
    // Suavizado circular ±2 h — conserva la forma diurna (0 mm de madrugada es
    // un valor legítimo, no se rellena hacia la media global).
    const smoothMean =
      0.40 * at(rawMean, h) +
      0.20 * (at(rawMean, h - 1) + at(rawMean, h + 1)) +
      0.10 * (at(rawMean, h - 2) + at(rawMean, h + 2));
    const smoothWet =
      0.40 * at(rawWet, h) +
      0.20 * (at(rawWet, h - 1) + at(rawWet, h + 1)) +
      0.10 * (at(rawWet, h - 2) + at(rawWet, h + 2));
    const nH = byHour[h].length;
    const wWet = clamp(nH / 12, 0.3, 1); // la prob. sí se contrae hacia el prior
    hourly.push({
      hour: h,
      meanMm: roundN(smoothMean, 3),
      wetProb: roundN(wWet * smoothWet + (1 - wWet) * globalWetPrior, 3),
      samples: nH,
    });
  }

  // Estadística diaria (excluye la fila más reciente = día parcial en curso).
  const dSorted = [...daily]
    .filter((d) => d.timestamp)
    .sort((a, b) => (b.timestamp as Date).getTime() - (a.timestamp as Date).getTime());
  const dVals = dSorted.slice(1).map((d) => Math.max(0, d.lluvia_mm));
  const dailyMeanMm = dVals.length ? mean(dVals) : globalMean * 24;
  const dailyMedianMm = dVals.length ? median(dVals) : dailyMeanMm;

  // AR(1): autocorrelación de lag-1 en log1p del total diario (cronológico).
  const chrono = [...dVals].reverse();
  let phi = 0.25;
  if (chrono.length >= 6) {
    const l = chrono.map((v) => ln1p(v));
    const a = l.slice(0, -1);
    const b = l.slice(1);
    const ma = mean(a);
    const mb = mean(b);
    const cov = mean(a.map((v, i) => (v - ma) * (b[i] - mb)));
    const va = mean(a.map((v) => (v - ma) ** 2));
    phi = va > 1e-6 ? clamp(cov / va, 0, 0.7) : 0.25;
  }

  return {
    month: crParts(now).m,
    monthLabel: MONTHS_ES[crParts(now).m - 1],
    dailyMeanMm: round1(dailyMeanMm),
    dailyMedianMm: round1(dailyMedianMm),
    lag1Autocorr: roundN(phi, 2),
    hourly,
    sampleDays: dVals.length,
    sampleHours: grid.rain.length,
  };
}

// ── 3. Predicción de mañana (ensemble) ─────────────────────────────────────

function buildTomorrow(
  grid: Grid,
  daily: ModelDaily[],
  ante: AntecedentState,
  clim: ClimatologyModel,
  secondary: ModelSecondaryHour[] | undefined,
  stationHealthScore: number,
  trend3hDelta: number,
): TomorrowForecast {
  const tomorrowStr = addDaysStr(crDateStr(grid.ts[grid.lastIdx]), 1);

  // Forma diurna normalizada (suma 1).
  const shapeRaw = clim.hourly.map((h) => h.meanMm);
  const shapeSum = sum(shapeRaw) || 1;
  const shape = shapeRaw.map((v) => v / shapeSum);

  // Miembro 2 — persistencia AR(1) sobre el total diario.
  const today24 = ante.windows.h24;
  const mu = Math.max(0.2, clim.dailyMeanMm);
  const persistTotal = Math.max(
    0,
    expm1(ln1p(mu) + clim.lag1Autocorr * (ln1p(today24) - ln1p(mu))),
  );

  // Miembro 3 — análogos: días históricos con antecedente parecido al de hoy.
  const { analogTotal, analogs } = buildAnalogs(grid, daily, ante);

  // Miembro 4 — secundario (Open-Meteo), emparejado por hora de mañana.
  const secByHour = new Map<number, ModelSecondaryHour>();
  for (const s of secondary ?? []) {
    const d = new Date(s.tsISO);
    if (crDateStr(d) === tomorrowStr) secByHour.set(crHour(d), s);
  }
  const secAvailable = secByHour.size >= 6;

  // Pesos: si falta el secundario o los análogos, se reparte su peso.
  const W: Record<"climatology" | "persistence" | "analog" | "secondary", number> = {
    ...MODEL_TUNING.ENSEMBLE_WEIGHTS,
  };
  let weights = { ...W };
  if (!secAvailable) {
    const extra = W.secondary / 3;
    weights = {
      climatology: W.climatology + extra,
      persistence: W.persistence + extra,
      analog: W.analog + extra,
      secondary: 0,
    };
  }
  if (analogs.length === 0) {
    const extra = weights.analog / 2;
    weights = {
      climatology: weights.climatology + extra,
      persistence: weights.persistence + extra,
      analog: 0,
      secondary: weights.secondary,
    };
  }

  const [opA, opB] = MODEL_TUNING.OPERATING_WINDOW;
  const hourly: ForecastHour[] = [];
  const sigmaArr: number[] = [];

  for (let h = 0; h < 24; h++) {
    const climM = shapeRaw[h];
    const persistM = shape[h] * persistTotal;
    const analogM = shape[h] * analogTotal;
    const sec = secByHour.get(h);
    const secM = secAvailable && sec ? Math.max(0, sec.precipMm) : null;

    const members = [
      { w: weights.climatology, v: climM },
      { w: weights.persistence, v: persistM },
      { w: weights.analog, v: analogM },
      ...(secM != null ? [{ w: weights.secondary, v: secM }] : []),
    ];
    const wSum = sum(members.map((m) => m.w)) || 1;
    const expected = sum(members.map((m) => m.w * m.v)) / wSum;

    const memberVals = members.map((m) => m.v);
    const memberSD = stdev(memberVals);
    const sigma = Math.sqrt(
      memberSD ** 2 + (MODEL_TUNING.FORECAST_REL_SIGMA * expected + 0.15) ** 2,
    );
    sigmaArr.push(sigma);

    const probExp = 1 - Math.exp(-expected / 1.1);
    const climWet = clim.hourly[h].wetProb;
    const secProb = secM != null && sec?.precipProb != null ? sec.precipProb / 100 : null;
    const rainProb =
      secProb != null
        ? 0.35 * climWet + 0.3 * probExp + 0.35 * secProb
        : 0.55 * climWet + 0.45 * probExp;

    hourly.push({
      tsISO: crDateAt(tomorrowStr, h).toISOString(),
      hour: h,
      expectedMm: roundN(expected, 2),
      p10Mm: roundN(Math.max(0, expected - Z80 * sigma), 2),
      p90Mm: roundN(expected + Z80 * sigma, 2),
      rainProb: roundN(clamp(rainProb, 0, 1), 2),
      members: {
        climatology: roundN(climM, 2),
        persistence: roundN(persistM, 2),
        analog: roundN(analogM, 2),
        secondary: secM != null ? roundN(secM, 2) : null,
      },
      inOperatingWindow: h >= opA && h <= opB,
    });
  }

  const dailyExpected = sum(hourly.map((x) => x.expectedMm));
  const sumSigma = sum(sigmaArr);
  const varSum = sum(sigmaArr.map((s) => s ** 2));
  const rho = MODEL_TUNING.FORECAST_INTRADAY_RHO;
  const dailyVar = varSum + rho * (sumSigma ** 2 - varSum);
  const dailySigma = Math.sqrt(Math.max(0, dailyVar));

  const blocks = buildBlocks(hourly, clim, stationHealthScore, trend3hDelta, secAvailable);

  // Confianza global del bloque "mañana".
  const opHours = hourly.filter((x) => x.inOperatingWindow);
  const relSpread =
    mean(
      opHours.map((x) => {
        const sd = stdev(
          [x.members.climatology, x.members.persistence, x.members.analog,
            ...(x.members.secondary != null ? [x.members.secondary] : [])],
        );
        return sd / (x.expectedMm + 0.5);
      }),
    ) || 0;

  const factors: ConfidenceFactor[] = [
    { label: "Pronóstico a 24 h", delta: -8 },
    { label: "Dispersión entre métodos", delta: -Math.round(clamp(40 * relSpread, 0, 30)) },
    { label: "Salud de la estación", delta: -Math.round((100 - stationHealthScore) * 0.25) },
  ];
  if (clim.sampleDays < 10) factors.push({ label: "Histórico corto (<10 días)", delta: -15 });
  else if (clim.sampleDays < 20) factors.push({ label: "Histórico medio (<20 días)", delta: -7 });
  if (clim.sampleHours < 96) factors.push({ label: "Pocas horas de histórico", delta: -8 });
  const instab = clamp(3 * Math.abs(trend3hDelta), 0, 15);
  if (instab >= 3) factors.push({ label: "Régimen cambiante ahora", delta: -Math.round(instab) });
  if (!secAvailable) factors.push({ label: "Sin contraste secundario", delta: -6 });

  const confidence = scoreConfidence(100, factors);

  return {
    dateISO: tomorrowStr,
    dailyExpectedMm: round1(dailyExpected),
    dailyP10Mm: round1(Math.max(0, dailyExpected - Z80 * dailySigma)),
    dailyP90Mm: round1(dailyExpected + Z80 * dailySigma),
    hourly,
    blocks,
    analogs,
    methodWeights: {
      climatology: roundN(weights.climatology, 2),
      persistence: roundN(weights.persistence, 2),
      analog: roundN(weights.analog, 2),
      secondary: roundN(weights.secondary, 2),
    },
    secondaryAvailable: secAvailable,
    confidence,
  };
}

function buildAnalogs(grid: Grid, daily: ModelDaily[], ante: AntecedentState) {
  // Serie diaria: se prefiere la tabla "Diarios" del IMN (hasta ~31 días de
  // histórico) y se completa con lo reconstruido desde la rejilla horaria.
  const daysByDate = new Map<string, number>();
  for (const d of daily) {
    if (!d.timestamp) continue;
    daysByDate.set(crDateStr(d.timestamp), Math.max(0, d.lluvia_mm));
  }
  for (let i = 0; i < grid.rain.length; i++) {
    const key = crDateStr(grid.ts[i]);
    if (!daysByDate.has(key)) daysByDate.set(key, 0);
    // La rejilla solo suma si no había dato diario para esa fecha.
  }
  const hourlyDaySum = new Map<string, number>();
  for (let i = 0; i < grid.rain.length; i++) {
    const key = crDateStr(grid.ts[i]);
    hourlyDaySum.set(key, (hourlyDaySum.get(key) ?? 0) + grid.rain[i]);
  }
  for (const [key, mm] of hourlyDaySum) {
    if ((daysByDate.get(key) ?? 0) === 0) daysByDate.set(key, mm);
  }

  const days = [...daysByDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, mm]) => ({ date, mm }));
  // Descarta el último (día en curso, parcial).
  const usable = days.slice(0, -1);
  if (usable.length < 6) return { analogTotal: ante.windows.h24, analogs: [] as TomorrowForecast["analogs"] };

  const feat = (i: number) => [
    ln1p(usable[i].mm),
    ln1p(usable[i].mm + (usable[i - 1]?.mm ?? 0) + (usable[i - 2]?.mm ?? 0)),
  ];
  const todayFeat = [ln1p(ante.windows.h24), ln1p(ante.windows.h72)];

  const scored: { i: number; d: number }[] = [];
  for (let i = 2; i < usable.length - 1; i++) {
    const f = feat(i);
    const d = Math.hypot(f[0] - todayFeat[0], f[1] - todayFeat[1]);
    scored.push({ i, d });
  }
  scored.sort((a, b) => a.d - b.d);
  const picked = scored.slice(0, MODEL_TUNING.ANALOG_K);
  const wSum = sum(picked.map((p) => 1 / (p.d * p.d + 0.25)));
  const analogTotal =
    wSum > 0
      ? sum(picked.map((p) => (1 / (p.d * p.d + 0.25)) * usable[p.i + 1].mm)) / wSum
      : ante.windows.h24;

  const analogs = picked.map((p) => ({
    dateISO: usable[p.i].date,
    priorMm: round1(usable[p.i].mm),
    nextMm: round1(usable[p.i + 1].mm),
    weight: roundN((1 / (p.d * p.d + 0.25)) / (wSum || 1), 2),
  }));

  return { analogTotal, analogs };
}

function buildBlocks(
  hourly: ForecastHour[],
  clim: ClimatologyModel,
  stationHealthScore: number,
  trend3hDelta: number,
  secAvailable: boolean,
): ForecastBlock[] {
  const defs: { key: ForecastBlock["key"]; label: string; range: [number, number] }[] = [
    { key: "madrugada", label: "Madrugada", range: [0, 5] },
    { key: "manana", label: "Mañana", range: [6, 10] },
    { key: "mediodia", label: "Mediodía", range: [11, 13] },
    { key: "tarde", label: "Tarde", range: [14, 17] },
    { key: "noche", label: "Noche", range: [18, 23] },
  ];

  return defs.map(({ key, label, range }) => {
    const hs = hourly.filter((x) => x.hour >= range[0] && x.hour <= range[1]);
    const mm = sum(hs.map((x) => x.expectedMm));
    const p90 = sum(hs.map((x) => x.p90Mm));
    const probMax = Math.max(0, ...hs.map((x) => x.rainProb));

    let verdict: ForecastBlock["verdict"] = "seco";
    if (mm >= 12 || probMax >= 0.8) verdict = "lluvia-fuerte";
    else if (mm >= 4 || probMax >= 0.55) verdict = "lluvia";
    else if (mm >= 1 || probMax >= 0.3) verdict = "llovizna";

    const relSpread =
      mean(
        hs.map((x) => {
          const sd = stdev(
            [x.members.climatology, x.members.persistence, x.members.analog,
              ...(x.members.secondary != null ? [x.members.secondary] : [])],
          );
          return sd / (x.expectedMm + 0.5);
        }),
      ) || 0;

    const early = range[0] < 12;
    const factors: ConfidenceFactor[] = [
      { label: "Pronóstico a 24 h", delta: early ? -6 : -10 },
      { label: "Dispersión entre métodos", delta: -Math.round(clamp(35 * relSpread, 0, 28)) },
      { label: "Salud de la estación", delta: -Math.round((100 - stationHealthScore) * 0.2) },
    ];
    if (clim.sampleDays < 10) factors.push({ label: "Histórico corto", delta: -12 });
    if (Math.abs(trend3hDelta) >= 3)
      factors.push({ label: "Régimen cambiante", delta: -Math.round(clamp(2.5 * Math.abs(trend3hDelta), 0, 12)) });
    if (!secAvailable) factors.push({ label: "Sin contraste secundario", delta: -5 });

    return {
      key,
      label,
      hoursRange: range,
      expectedMm: round1(mm),
      p90Mm: round1(p90),
      rainProbMax: roundN(probMax, 2),
      verdict,
      confidence: scoreConfidence(100, factors),
    };
  });
}

// ── 4. Modelo hidrológico estación → tramo del tour ────────────────────────

/** Hidrograma unitario (respuesta del tramo del tour a 1 mm de lluvia efectiva
 *  en la estación). Función gamma discretizada por horas, normalizada a suma 1. */
function unitHydrograph(): number[] {
  const Tp = MODEL_TUNING.RIVER_TIME_TO_PEAK_H;
  const n = MODEL_TUNING.RIVER_UH_SHAPE_N;
  const L = MODEL_TUNING.RIVER_BASE_TIME_H;
  const raw: number[] = [];
  for (let t = 0; t <= L; t++) {
    const x = (t + 0.5) / Tp;
    raw.push(x ** n * Math.exp(n * (1 - x)));
  }
  const s = sum(raw) || 1;
  return raw.map((v) => v / s);
}

/** Puntaje 0–100 a partir de las ventanas móviles de lluvia, anclado a los
 *  umbrales de crecida ya probados por el equipo (3 h / 6 h / 24 h). */
function bucketScore(h3: number, h6: number, h24: number): number {
  const interp = (v: number, pts: [number, number][]) => {
    if (v <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (v <= pts[i][0]) {
        const [x0, y0] = pts[i - 1];
        const [x1, y1] = pts[i];
        return y0 + ((y1 - y0) * (v - x0)) / (x1 - x0);
      }
    }
    return pts[pts.length - 1][1];
  };
  const s3 = interp(h3, [[0, 0], [3, 42], [10, 65], [20, 85], [35, 100]]);
  const s6 = interp(h6, [[0, 0], [6, 42], [18, 65], [35, 85], [60, 100]]);
  const s24 = interp(h24, [[0, 0], [10, 30], [40, 65], [70, 85], [120, 100]]);
  return clamp(Math.max(s3, s6, s24), 0, 100);
}

function riverIndexFrom(rawFlow: number, h3: number, h6: number, h24: number): number {
  const hydro = 100 * (1 - Math.exp(-Math.max(0, rawFlow) / MODEL_TUNING.RIVER_FLOW_SCALE));
  const bucket = bucketScore(h3, h6, h24);
  return clamp(0.6 * bucket + 0.4 * hydro, 0, 100);
}

const rollWin = (arr: number[], endIncl: number, h: number) =>
  arr.slice(Math.max(0, endIncl - h + 1), endIncl + 1).reduce((a, b) => a + b, 0);

function buildRiver(
  grid: Grid,
  ante: AntecedentState,
  clim: ClimatologyModel,
  tomorrow: TomorrowForecast,
  stationHealthScore: number,
  confNow: ConfidenceScore,
): RiverModel {
  const uh = unitHydrograph();
  const kHour = MODEL_TUNING.API_DECAY_PER_DAY ** (1 / 24);

  // API por hora + lluvia efectiva observada.
  const apiArr: number[] = [];
  let a = grid.rain.slice(0, 24).reduce((x, y) => x + y, 0) * 0.5;
  for (let i = 0; i < grid.rain.length; i++) {
    a = grid.rain[i] + kHour * a;
    apiArr.push(a);
  }
  const peObs = grid.rain.map((mm, i) => mm * runoffFor(apiArr[i]));

  const N = grid.rain.length;
  const last = grid.lastIdx;

  // ── Serie observada del índice de río (últimas ~30 h) ──
  const histStart = Math.max(0, N - 30);
  const rainAll = [...grid.rain];
  const peAll = [...peObs];
  const series: RiverHour[] = [];
  const idxByPos: number[] = [];

  const computeAt = (pos: number, rainSeq: number[], peSeq: number[], apiVal: number) => {
    let quick = 0;
    for (let τ = 0; τ < uh.length; τ++) {
      const j = pos - τ;
      if (j < 0) break;
      quick += (peSeq[j] ?? 0) * uh[τ];
    }
    quick *= MODEL_TUNING.RIVER_QF_GAIN;
    // El flujo base usa la humedad de cuenca NORMALIZADA (0–100), no el API en
    // mm crudo, para que la saturación no domine el índice de forma permanente.
    const base = MODEL_TUNING.RIVER_BASE_INDEX + MODEL_TUNING.RIVER_BF_GAIN * apiNorm(apiVal);
    const raw = base + quick;
    const h3 = rollWin(rainSeq, pos, 3);
    const h6 = rollWin(rainSeq, pos, 6);
    const h24 = rollWin(rainSeq, pos, 24);
    return { index: riverIndexFrom(raw, h3, h6, h24), quick, base };
  };

  for (let pos = histStart; pos <= last; pos++) {
    const { index, quick, base } = computeAt(pos, rainAll, peAll, apiArr[pos]);
    idxByPos.push(index);
    const prev = idxByPos.length >= 2 ? idxByPos[idxByPos.length - 2] : index;
    series.push({
      tsISO: grid.ts[pos].toISOString(),
      hour: crHour(grid.ts[pos]),
      observed: true,
      index: round1(index),
      p10: round1(index),
      p90: round1(index),
      quickFlow: round1(quick),
      baseFlow: round1(base),
      riseRatePerH: round1(index - prev),
    });
  }

  const indexNow = idxByPos[idxByPos.length - 1] ?? MODEL_TUNING.RIVER_BASE_INDEX;
  const back = idxByPos.length >= 4 ? idxByPos[idxByPos.length - 4] : indexNow;
  const riseRateNow = (indexNow - back) / 3;
  const trend: RiverModel["trend"] =
    riseRateNow > 1 ? "subiendo" : riseRateNow < -1 ? "bajando" : "estable";

  // ── Proyección 30 h ──
  const tomorrowStr = tomorrow.dateISO;
  const shapeRaw = clim.hourly.map((h) => h.meanMm);
  const shapeSum = sum(shapeRaw) || 1;
  const shape = shapeRaw.map((v) => v / shapeSum);
  const restOfTodayDaily = Math.max(tomorrow.dailyExpectedMm, clim.dailyMeanMm);

  const forecastAt = (ts: Date): { mean: number; p10: number; p90: number } => {
    const hCR = crHour(ts);
    if (crDateStr(ts) === tomorrowStr) {
      const fh = tomorrow.hourly[hCR];
      return { mean: fh.expectedMm, p10: fh.p10Mm, p90: fh.p90Mm };
    }
    const m = shape[hCR] * restOfTodayDaily;
    return { mean: m, p10: m * 0.35, p90: m * 2.3 };
  };

  const HOUR = 3600_000;
  const HORIZON = 30;
  const rainMean = [...rainAll];
  const peMean = [...peAll];
  const rainP10 = [...rainAll];
  const peP10 = [...peAll];
  const rainP90 = [...rainAll];
  const peP90 = [...peAll];
  let apiMeanP = apiArr[last];
  let apiHiP = apiArr[last];

  let peak = {
    tsISO: null as string | null,
    index: -Infinity,
    etaHours: null as number | null,
    fromForecastRain: false,
    exceedsNow: false,
  };

  for (let k = 1; k <= HORIZON; k++) {
    const ts = new Date(grid.ts[last].getTime() + k * HOUR);
    const fc = forecastAt(ts);
    const pos = last + k;

    rainMean[pos] = fc.mean;
    rainP10[pos] = fc.p10;
    rainP90[pos] = fc.p90;
    apiMeanP = fc.mean + kHour * apiMeanP;
    apiHiP = fc.p90 + kHour * apiHiP;
    peMean[pos] = fc.mean * runoffFor(apiMeanP);
    peP10[pos] = fc.p10 * runoffFor(apiMeanP);
    peP90[pos] = fc.p90 * runoffFor(apiHiP);

    const m = computeAt(pos, rainMean, peMean, apiMeanP);
    const lo = computeAt(pos, rainP10, peP10, apiMeanP);
    const hi = computeAt(pos, rainP90, peP90, apiHiP);

    const prev = series[series.length - 1]?.index ?? indexNow;
    series.push({
      tsISO: ts.toISOString(),
      hour: crHour(ts),
      observed: false,
      index: round1(m.index),
      p10: round1(Math.min(lo.index, m.index)),
      p90: round1(Math.max(hi.index, m.index)),
      quickFlow: round1(m.quick),
      baseFlow: round1(m.base),
      riseRatePerH: round1(m.index - prev),
    });

    if (m.index > peak.index) {
      peak = {
        tsISO: ts.toISOString(),
        index: round1(m.index),
        etaHours: k,
        fromForecastRain: k > MODEL_TUNING.RIVER_TIME_TO_PEAK_H,
        exceedsNow: m.index > indexNow + 1,
      };
    }
  }

  // ── Estado y crecida ──
  const projPeak = peak.index;
  let stateLevel: RiverModel["stateLevel"] = "bajo";
  if (indexNow >= 80 || (indexNow >= 60 && riseRateNow >= 8)) stateLevel = "critico";
  else if (indexNow >= 60 || riseRateNow >= 6) stateLevel = "alto";
  else if (indexNow >= 40 || riseRateNow >= 3) stateLevel = "moderado";

  let crecLevel: RiverModel["crecida"]["level"] = "bajo";
  if (projPeak >= 80 || stateLevel === "critico") crecLevel = "critico";
  else if (projPeak >= 62 || stateLevel === "alto") crecLevel = "alto";
  else if (projPeak >= 44 || stateLevel === "moderado") crecLevel = "moderado";

  const CRECIDA_COPY: Record<RiverModel["crecida"]["level"], { label: string; guidance: string }> = {
    critico: {
      label: "Riesgo alto de crecida",
      guidance: "No ingresar al cañón. El caudal en el tramo del tour puede subir rápido y sin aviso.",
    },
    alto: {
      label: "El caudal va a subir",
      guidance: "Operar solo con alta precaución y monitoreo constante del río en sitio.",
    },
    moderado: {
      label: "Lluvia reciente en la cuenca",
      guidance: "Condiciones cambiantes. Observar el río antes de entrar y tener plan de salida.",
    },
    bajo: {
      label: "Caudal estable",
      guidance: "Sin lluvia significativa reciente. Protocolos de seguridad estándar.",
    },
  };

  const next3Fc = sum(
    [1, 2, 3].map((k) => forecastAt(new Date(grid.ts[last].getTime() + k * HOUR)).mean),
  );
  const triggerRainMm = round1(Math.max(0, 10 - next3Fc));

  // ── Confianza por horizonte ──
  const projNext6 = series.filter((s) => !s.observed).slice(0, 6);
  const relSpread6 =
    mean(projNext6.map((s) => (s.p90 - s.p10) / (2 * (s.index + 3)))) || 0;

  const nowFactors: ConfidenceFactor[] = [
    ...confNow.factors,
    { label: "Sin limnímetro: caudal estimado de la lluvia", delta: -10 },
  ];
  const cNow = scoreConfidence(100, nowFactors);

  const c6 = scoreConfidence(Math.min(confNow.score, 92), [
    { label: "Modelo hidrológico sin sensor de río", delta: -12 },
    { label: "Salud de la estación", delta: -Math.round((100 - stationHealthScore) * 0.15) },
    { label: "Dispersión de la proyección a 6 h", delta: -Math.round(clamp(40 * relSpread6, 0, 20)) },
  ]);

  const c24 = scoreConfidence(tomorrow.confidence.score, [
    { label: "Modelo hidrológico sin sensor de río", delta: -14 },
    { label: "Retardo y atenuación estimados", delta: -8 },
  ]);

  const nowHourCR = crHour(grid.ts[last]);
  const lagExplainer =
    `La lluvia que mide la estación tarda alrededor de ${MODEL_TUNING.RIVER_TIME_TO_PEAK_H} h en ` +
    `sentirse en el tramo donde se hace el tour, aguas abajo. Un aguacero ahora movería el caudal ` +
    `allí alrededor de las ${pad2((nowHourCR + MODEL_TUNING.RIVER_TIME_TO_PEAK_H) % 24)}:00, y la ` +
    `respuesta completa dura unas ${MODEL_TUNING.RIVER_BASE_TIME_H} h.`;

  return {
    timeToPeakH: MODEL_TUNING.RIVER_TIME_TO_PEAK_H,
    baseTimeH: MODEL_TUNING.RIVER_BASE_TIME_H,
    baseflowDecayPerH: MODEL_TUNING.RIVER_BASEFLOW_DECAY_PER_H,
    indexNow: round1(indexNow),
    bandNow: [round1(indexNow), round1(indexNow)],
    stateLabel: CRECIDA_COPY[stateLevel].label,
    stateLevel,
    riseRateNowPerH: round1(riseRateNow),
    trend,
    series,
    peak: peak.tsISO ? { ...peak, index: round1(peak.index) } : null,
    lagExplainer,
    crecida: {
      level: crecLevel,
      label: CRECIDA_COPY[crecLevel].label,
      guidance: CRECIDA_COPY[crecLevel].guidance,
      basisMm: ante.windows.h3,
      triggerRainMm,
    },
    confidence: { now: cNow, plus6h: c6, plus24h: c24 },
  };
}

// ── Confianza ──────────────────────────────────────────────────────────────

function scoreConfidence(base: number, factors: ConfidenceFactor[]): ConfidenceScore {
  const score = Math.round(clamp(base + sum(factors.map((f) => f.delta)), 0, 100));
  const level: ConfidenceScore["level"] = score >= 75 ? "alta" : score >= 50 ? "media" : "baja";
  const worst = [...factors].filter((f) => f.delta < 0).sort((a, b) => a.delta - b.delta)[0];
  const reason =
    level === "alta"
      ? "Datos frescos y métodos de acuerdo."
      : worst
        ? `Principal límite: ${worst.label.toLowerCase()}.`
        : "Incertidumbre estándar de pronóstico.";
  return { score, level, reason, factors: factors.filter((f) => f.delta !== 0) };
}

function buildNowConfidence(
  minutesSinceReading: number | null,
  hourlyRows24h: number,
  hasSnapshot: boolean,
): ConfidenceScore {
  const factors: ConfidenceFactor[] = [];
  if (minutesSinceReading == null) factors.push({ label: "Sin lecturas con hora válida", delta: -35 });
  else if (minutesSinceReading > 240) factors.push({ label: `Última lectura hace ${minutesSinceReading} min`, delta: -35 });
  else if (minutesSinceReading > 150) factors.push({ label: `Última lectura hace ${minutesSinceReading} min`, delta: -20 });
  else if (minutesSinceReading > 105) factors.push({ label: `Última lectura hace ${minutesSinceReading} min`, delta: -10 });

  if (hourlyRows24h < 18) factors.push({ label: `Solo ${hourlyRows24h}/24 registros horarios`, delta: -30 });
  else if (hourlyRows24h < 23) factors.push({ label: `${hourlyRows24h}/24 registros horarios`, delta: -12 });

  if (!hasSnapshot) factors.push({ label: "Sin acumulado actual (7 a.m.)", delta: -8 });

  return scoreConfidence(100, factors);
}

// ── Orquestador ────────────────────────────────────────────────────────────

export function buildTiempoModel(input: BuildModelInput): TiempoModel | null {
  const now = input.now ?? new Date();
  const grid = buildGrid(input.hourly);
  if (!grid) return null;

  const ante = buildAntecedent(grid);
  const clim = buildClimatology(grid, input.daily, now);

  // Tendencia reciente (3 h vs 3 h previas) para penalizar régimen inestable.
  const last = grid.lastIdx;
  const l3 = grid.rain.slice(Math.max(0, last - 2), last + 1).reduce((a, b) => a + b, 0);
  const p3 = grid.rain.slice(Math.max(0, last - 5), Math.max(0, last - 2)).reduce((a, b) => a + b, 0);
  const trend3hDelta = l3 - p3;

  const confNow = buildNowConfidence(
    input.minutesSinceReading,
    input.hourlyRows24h,
    input.todaySumMm != null,
  );

  const secondary = input.secondaryHourly?.filter((s) => Number.isFinite(s.precipMm));

  const dailyIn = input.daily.filter((d) => d.timestamp);
  const tomorrow = buildTomorrow(
    grid, dailyIn, ante, clim, secondary, input.stationHealthScore, trend3hDelta,
  );

  const river = buildRiver(
    grid, ante, clim, tomorrow, input.stationHealthScore, confNow,
  );

  // Confianza titular del bloque RÍO: mezcla ponderada de horizontes. El desglose
  // por horizonte (ahora / +6 h / +24 h) se muestra aparte en el módulo.
  const riverBlend = Math.round(
    0.4 * river.confidence.plus6h.score + 0.6 * river.confidence.plus24h.score,
  );
  const riverHeadline = scoreConfidence(riverBlend, []);

  const assumptions = [
    "La estación mide un punto de la cuenca alta; se asume que la lluvia allí representa la que alimenta el tramo del tour.",
    `Retardo estación → tramo del tour fijado en ~${MODEL_TUNING.RIVER_TIME_TO_PEAK_H} h (hidrograma unitario, no medido en sitio).`,
    "Las horas sin registro del IMN se rellenan como 0 mm; eso puede subestimar la lluvia real.",
    "El “nivel del río” es un índice 0–100 derivado de la lluvia, no una medición de caudal ni de metros.",
    tomorrow.secondaryAvailable
      ? "Open-Meteo (San Carlos) entra solo como contraste secundario con peso bajo."
      : "Open-Meteo no está disponible: la predicción de mañana es 100 % estación.",
  ];

  return {
    antecedent: ante,
    climatology: clim,
    tomorrow,
    river,
    confidence: {
      now: confNow,
      tomorrow: tomorrow.confidence,
      river: {
        ...riverHeadline,
        reason:
          river.confidence.plus24h.score <= river.confidence.plus6h.score
            ? river.confidence.plus24h.reason
            : river.confidence.plus6h.reason,
      },
    },
    assumptions,
    generatedAtISO: now.toISOString(),
  };
}
