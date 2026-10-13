import { load, type Cheerio, type CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";
import { isValid, parse } from "date-fns";
import { es } from "date-fns/locale";
import type {
  CurrentTotals,
  DailyEntry,
  HourlyEntry,
  RainBaseline,
  RainStatus,
  RiskDescriptor,
  StationHealth,
  StationHealthQuality,
  TiempoSections,
} from "@/lib/types/tiempo-api";
import {
  RELIABILITY_DEDUCTION_FRESHNESS_HIGH,
  RELIABILITY_DEDUCTION_FRESHNESS_LOW,
  RELIABILITY_DEDUCTION_FRESHNESS_MED,
  RELIABILITY_DEDUCTION_NO_SNAPSHOT,
  RELIABILITY_DEDUCTION_RECORDS_LOW,
  RELIABILITY_DEDUCTION_RECORDS_MED,
  RELIABILITY_FRESHNESS_HIGH_MIN,
  RELIABILITY_FRESHNESS_LOW_MIN,
  RELIABILITY_FRESHNESS_MED_MIN,
  RELIABILITY_LEVEL_HIGH_SCORE,
  RELIABILITY_LEVEL_MED_SCORE,
  RELIABILITY_RECORDS_THRESHOLD_FULL,
  RELIABILITY_RECORDS_THRESHOLD_LOW,
  RELIABILITY_SCORE_MAX,
} from "@/lib/constants/tiempo";

export function safeParseFloat(s?: string): number {
  if (!s) return 0;
  return parseFloat(s.replace(",", ".").trim()) || 0;
}

export function parseIMNDate(str: string): Date | null {
  const cleaned = str.trim().replace(/\s+/g, " ");
  let dt = parse(cleaned, "dd/MM/yyyy hh:mm:ss a", new Date(), { locale: es });
  if (!isValid(dt)) {
    dt = parse(cleaned, "dd/MM/yyyy hh:mm a", new Date(), { locale: es });
  }
  if (!isValid(dt)) {
    dt = parse(cleaned, "dd/MM/yyyy HH:mm", new Date());
  }
  if (!isValid(dt)) return null;

  const hoursInCostaRica = dt.getHours();
  const utcHour = hoursInCostaRica + 6; // Costa Rica = UTC-6 todo el año.
  return new Date(
    Date.UTC(
      dt.getFullYear(),
      dt.getMonth(),
      dt.getDate(),
      utcHour,
      dt.getMinutes(),
      dt.getSeconds(),
      dt.getMilliseconds(),
    ),
  );
}

export function getRainIntensity(mm: number): RainStatus {
  if (mm >= 12) return "intensa";
  if (mm >= 4) return "moderada";
  if (mm > 0.5) return "ligera";
  return "sin lluvia";
}

export function getRiskStatus(last3h: number, last6h: number, last24h: number): RiskDescriptor {
  if (last3h >= 20 || last6h >= 35 || last24h >= 70) {
    return { level: "red", label: "Riesgo alto – probable crecida rápida", emoji: "🔴" };
  }
  if (last3h >= 10 || last6h >= 18 || last24h >= 40) {
    return { level: "yellow", label: "Precaución – caudal puede subir", emoji: "🟡" };
  }
  return { level: "green", label: "Condiciones aceptables", emoji: "🟢" };
}

export function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function parseTableRows($: CheerioAPI, table: Cheerio<AnyNode>): string[][] {
  const rows: string[][] = [];
  table.find("tr").each((_, tr) => {
    const cells: string[] = [];
    $(tr)
      .find("td, th")
      .each((_, td) => {
        cells.push($(td).text().trim());
      });

    if (cells.length >= 2 && !cells[0].toLowerCase().match(/^(fecha|date|hora)$/)) {
      rows.push(cells);
    }
  });
  return rows;
}

export function extractSections(html: string): TiempoSections {
  const $ = load(html);
  const sections: TiempoSections = {};
  // El IMN rotula cada tabla con <h1><a name=...>Tabla de datos: X</a></h1>, así
  // que h1 y a deben estar en el selector o no se encuentra ningún título.
  const titleSelector = "h1, h2, h3, h4, h5, h6, a, p, td, th, div, span, b, strong";

  $(titleSelector).each((_, el) => {
    const ownText = $(el).clone().children().remove().end().text().trim();
    const fullText = $(el).text().trim();
    const titleText = ownText.length > 0 && ownText.length < 120 ? ownText : fullText;

    if (!titleText.includes("Tabla de datos:") || titleText.length > 200) return;

    const key = titleText.includes("Horarios")
      ? "hourly"
      : titleText.includes("Actuales")
        ? "current"
        : titleText.includes("Diarios")
          ? "daily"
          : null;

    if (!key) return;

    let table: Cheerio<AnyNode> = $(el).nextAll("table").first();
    if (!table.length) table = $(el).parent().nextAll("table").first();
    if (!table.length) table = $(el).closest("table").length ? $(el).closest("table") : $();
    if (!table.length) return;

    const rows = parseTableRows($, table);
    if (rows.length > 0 && (!sections[key] || rows.length > sections[key].length)) {
      sections[key] = rows;
    }
  });

  if (!sections.hourly) {
    $("table").each((_, tableEl) => {
      const table = $(tableEl);
      const allRows: string[][] = [];

      table.find("tr").each((_, tr) => {
        const cells: string[] = [];
        $(tr)
          .find("td, th")
          .each((_, td) => {
            cells.push($(td).text().trim());
          });
        if (cells.length >= 2) allRows.push(cells);
      });

      if (allRows.length < 2) return;

      const headerRow = allRows[0].join(" ").toLowerCase();
      const isHourly =
        headerRow.includes("lluvia") || headerRow.includes("temp") || headerRow.includes("hr");
      const isDaily =
        (headerRow.includes("lluvia") || headerRow.includes("fecha")) &&
        allRows.length <= 35 &&
        !isHourly;

      const dataRows = allRows.filter(
        (r) => !r[0].toLowerCase().match(/^(fecha|date|hora)$/) && r.length >= 2,
      );
      if (dataRows.length === 0) return;

      if (isHourly && !sections.hourly) sections.hourly = dataRows;
      else if (isDaily && !sections.daily) sections.daily = dataRows;
    });
  }

  return sections;
}

export function parseHourlyRows(rows: string[][]): HourlyEntry[] {
  return rows.map((cells) => {
    const fecha = cells[0]?.trim() ?? "";
    const timestamp = parseIMNDate(fecha);

    let lluvia_mm: number;
    let temp_c: number | null = null;
    let hr_pct: number | null = null;

    if (cells.length >= 4) {
      const t = safeParseFloat(cells[1]);
      const h = safeParseFloat(cells[2]);
      const l = safeParseFloat(cells[3]);
      temp_c = t >= 5 && t <= 45 ? t : null;
      hr_pct = h > 0 && h <= 100 ? h : null;
      lluvia_mm = l;
    } else {
      lluvia_mm = safeParseFloat(cells[1]);
    }

    return {
      fecha,
      timestamp,
      timestampISO: timestamp?.toISOString() ?? null,
      lluvia_mm,
      temp_c,
      hr_pct,
    };
  });
}

export function parseCurrentTotals(rows?: string[][]): CurrentTotals {
  if (!rows?.length) return null;

  const [fechaRaw, sumRaw, ayerRaw] = rows[0];
  const timestamp = parseIMNDate(fechaRaw);

  return {
    fecha: fechaRaw.trim(),
    timestamp,
    sum_lluv_mm: safeParseFloat(sumRaw),
    lluv_ayer_mm: safeParseFloat(ayerRaw),
  };
}

export function parseDailyRows(rows?: string[][]): DailyEntry[] {
  return (rows ?? []).map(([fechaRaw, lluviaRaw]) => ({
    fecha: fechaRaw.trim(),
    timestamp: parseIMNDate(fechaRaw),
    lluvia_mm: safeParseFloat(lluviaRaw),
  }));
}

// ── Salud de la estación ─────────────────────────────────────────────────────
// La estación del IMN publica un registro por hora. Si faltan registros o el
// último es viejo, los acumulados y la tendencia pierden confiabilidad. Esto lo
// vuelve explícito para el usuario en vez de fingir precisión.

export function buildStationHealth(
  hourlyRows: HourlyEntry[],
  current: CurrentTotals,
  now: Date = new Date(),
): StationHealth {
  const lastReading = hourlyRows.find((r) => r.timestamp)?.timestamp ?? null;
  const minutesSinceReading = lastReading
    ? Math.max(0, Math.round((now.getTime() - lastReading.getTime()) / 60000))
    : null;

  // La estación publica un registro por hora, así que la lectura más nueva vive
  // hasta ~60 min antes de que llegue la siguiente. Solo cuenta como "vieja" lo
  // que exceda esa cadencia horaria.
  const NOMINAL_INTERVAL_MIN = 60;
  const lateness =
    minutesSinceReading == null
      ? null
      : Math.max(0, minutesSinceReading - NOMINAL_INTERVAL_MIN);

  // Registros con marca de tiempo dentro de las últimas ~24 h. Se agrega media
  // hora de gracia para que el borde de la ventana móvil no reste un registro.
  const cutoff = now.getTime() - (24 * 60 + 30) * 60 * 1000;
  const hourlyRows24h = Math.min(
    RELIABILITY_RECORDS_THRESHOLD_FULL,
    hourlyRows.filter((r) => r.timestamp && r.timestamp.getTime() >= cutoff).length,
  );

  let score = RELIABILITY_SCORE_MAX;
  const reasons: string[] = [];

  if (lateness == null) {
    score -= RELIABILITY_DEDUCTION_FRESHNESS_HIGH;
    reasons.push("sin lecturas con hora válida");
  } else if (lateness > RELIABILITY_FRESHNESS_HIGH_MIN) {
    score -= RELIABILITY_DEDUCTION_FRESHNESS_HIGH;
    reasons.push(`última lectura hace ${minutesSinceReading} min`);
  } else if (lateness > RELIABILITY_FRESHNESS_MED_MIN) {
    score -= RELIABILITY_DEDUCTION_FRESHNESS_MED;
    reasons.push(`última lectura hace ${minutesSinceReading} min`);
  } else if (lateness > RELIABILITY_FRESHNESS_LOW_MIN) {
    score -= RELIABILITY_DEDUCTION_FRESHNESS_LOW;
    reasons.push(`última lectura hace ${minutesSinceReading} min`);
  }

  if (hourlyRows24h < RELIABILITY_RECORDS_THRESHOLD_LOW) {
    score -= RELIABILITY_DEDUCTION_RECORDS_LOW;
    reasons.push(`solo ${hourlyRows24h}/24 registros horarios`);
  } else if (hourlyRows24h < RELIABILITY_RECORDS_THRESHOLD_FULL - 1) {
    score -= RELIABILITY_DEDUCTION_RECORDS_MED;
    reasons.push(`${hourlyRows24h}/24 registros horarios`);
  }

  if (!current) {
    score -= RELIABILITY_DEDUCTION_NO_SNAPSHOT;
    reasons.push("sin acumulado actual (7 a.m.)");
  }

  score = Math.max(0, Math.min(RELIABILITY_SCORE_MAX, Math.round(score)));

  const quality: StationHealthQuality =
    score >= RELIABILITY_LEVEL_HIGH_SCORE
      ? "alta"
      : score >= RELIABILITY_LEVEL_MED_SCORE
        ? "media"
        : "baja";

  return {
    lastReadingISO: lastReading?.toISOString() ?? null,
    minutesSinceReading,
    hourlyRows24h,
    expectedRows24h: RELIABILITY_RECORDS_THRESHOLD_FULL,
    score,
    quality,
    qualityReason: reasons.length
      ? reasons.join(" · ")
      : "datos completos y al día",
  };
}

// ── Línea base de lluvia diaria ─────────────────────────────────────────────
// Promedio de mm/día en la tabla "Diarios", excluyendo la fila más reciente
// (que corresponde al día en curso y está incompleta). Sirve para decir
// "hoy va X% de lo normal para la fecha".

export function buildDailyBaseline(
  dailyRows: DailyEntry[],
  todaySumMm: number | null,
  maxDays = 14,
): RainBaseline {
  const sorted = [...dailyRows].sort((a, b) => {
    const ta = a.timestamp?.getTime() ?? 0;
    const tb = b.timestamp?.getTime() ?? 0;
    return tb - ta;
  });

  // La primera fila es el día en curso: se descarta del promedio.
  const sample = sorted.slice(1, 1 + maxDays).filter((r) => r.timestamp);
  const sampleDays = sample.length;
  const dailyAvgMm = sampleDays
    ? round1(sample.reduce((a, r) => a + r.lluvia_mm, 0) / sampleDays)
    : 0;

  const todayVsAvgPct =
    todaySumMm != null && dailyAvgMm > 0
      ? Math.round((todaySumMm / dailyAvgMm) * 100)
      : null;

  return { dailyAvgMm, sampleDays, todayVsAvgPct };
}
