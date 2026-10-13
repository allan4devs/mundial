/**
 * weatherMessageHelpers.ts
 * Versión chill: vacilón tico ligero, corto y sin ser despiadado.
 */

import { WEATHER_MESSAGE_SYSTEM_PROMPT } from "@/lib/constants/weatherMessageConstants";

export type WeatherSnapshot = {
  risk: "green" | "yellow" | "red";
  riskLabel?: string;
  last1h_mm: number;
  last3h_mm?: number;
  last6h_mm?: number;
  last24h_mm: number;
  last48h_mm?: number;
  intensity: string;
  trend: string;
  wetHoursLast24?: number;
  rainProbNext3h?: number | null;
  wetStreak?: number;
  dryStreak?: number;
  peakHourMm?: number;
  peakHourLabel?: string;
  stationName?: string;
  currentSumMm?: number;
  yesterdayMm?: number;
  avgTemp24h: number | null;
  avgHR24h?: number | null;
};

export function buildSystemPrompt(): string {
  return WEATHER_MESSAGE_SYSTEM_PROMPT;
}

function trendLabel(trendRaw: string): "up" | "down" | "flat" {
  const t = (trendRaw || "").toLowerCase();
  if (t.includes("up") || t.includes("sub")) return "up";
  if (t.includes("down") || t.includes("baj")) return "down";
  return "flat";
}

export function buildUserPrompt(snap: WeatherSnapshot): string {
  const condicion =
    snap.risk === "red"
      ? "lluvia brava"
      : snap.risk === "yellow"
        ? "lluvia inquieta"
        : "clima manso";

  const fmt = (v?: number | null, unit = "") =>
    v == null ? "sin dato" : `${Math.round(v * 10) / 10}${unit}`;

  const trend = trendLabel(snap.trend);
  const trendTexto =
    trend === "up"
      ? "subiendo"
      : trend === "down"
        ? "bajando"
        : "estable";

  return `Generá 1-2 oraciones de humor campesino san carleño con estos datos reales:
- Estado general: ${condicion} (${snap.riskLabel ?? snap.risk})
- Intensidad reportada: ${snap.intensity}
- Tendencia de lluvia: ${trendTexto}
- Lluvia última 1h: ${fmt(snap.last1h_mm, " mm")}
- Lluvia última 3h: ${fmt(snap.last3h_mm, " mm")}
- Lluvia última 6h: ${fmt(snap.last6h_mm, " mm")}
- Lluvia últimas 24h: ${fmt(snap.last24h_mm, " mm")}
- Lluvia últimas 48h: ${fmt(snap.last48h_mm, " mm")}
- Probabilidad de lluvia próximas 3h: ${fmt(snap.rainProbNext3h, " %")}
- Horas con lluvia en 24h: ${fmt(snap.wetHoursLast24)}
- Racha mojada: ${fmt(snap.wetStreak, " h")}
- Racha seca: ${fmt(snap.dryStreak, " h")}
- Pico de lluvia 24h: ${fmt(snap.peakHourMm, " mm")} (${snap.peakHourLabel ?? "hora no disponible"})
- Acumulado de hoy: ${fmt(snap.currentSumMm, " mm")}
- Ayer cayó: ${fmt(snap.yesterdayMm, " mm")}
- Temperatura actual: ${fmt(snap.avgTemp24h, " °C")}
- Humedad actual: ${fmt(snap.avgHR24h, " %")}
- Estación/zona: ${snap.stationName ?? "San Carlos"}

Personalización obligatoria Río La Vieja:
- Mencioná explícitamente "Río La Vieja" o "La Vieja river".`;
}
