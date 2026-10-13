// app/api/tiempo/regional/route.ts
// Fetches weather data from Open-Meteo (free, no API key) for multiple
// locations in the San Carlos / Juan Castro Blanco area of Costa Rica.

import { NextResponse } from "next/server";
import type { LocationWeather } from "@/lib/types/index";
import {
  REGIONAL_CACHE_TTL_SECONDS,
  REGIONAL_FORECAST_DAYS,
  REGIONAL_FORECAST_HOURS,
  REGIONAL_LOCATIONS,
} from "@/lib/constants/tiempo";

// ─── WMO weather code descriptions (Spanish) ─────────────────────────────────
const WMO: Record<number, { label: string; icon: string }> = {
  0:  { label: "Despejado",              icon: "☀️" },
  1:  { label: "Mayorm. despejado",      icon: "🌤️" },
  2:  { label: "Parcialm. nublado",      icon: "⛅" },
  3:  { label: "Nublado",                icon: "☁️" },
  45: { label: "Neblina",                icon: "🌫️" },
  48: { label: "Niebla helada",          icon: "🌫️" },
  51: { label: "Llovizna ligera",        icon: "🌦️" },
  53: { label: "Llovizna moderada",      icon: "🌦️" },
  55: { label: "Llovizna densa",         icon: "🌧️" },
  61: { label: "Lluvia ligera",          icon: "🌧️" },
  63: { label: "Lluvia moderada",        icon: "🌧️" },
  65: { label: "Lluvia intensa",         icon: "🌧️" },
  71: { label: "Nevada ligera",          icon: "🌨️" },
  73: { label: "Nevada moderada",        icon: "🌨️" },
  75: { label: "Nevada intensa",         icon: "❄️" },
  77: { label: "Granizo ligero",         icon: "🌨️" },
  80: { label: "Chubascos ligeros",      icon: "🌦️" },
  81: { label: "Chubascos moderados",    icon: "🌧️" },
  82: { label: "Chubascos fuertes",      icon: "⛈️" },
  85: { label: "Nevada en chubascos",    icon: "🌨️" },
  86: { label: "Nevada intensa",         icon: "🌨️" },
  95: { label: "Tormenta eléctrica",     icon: "⛈️" },
  96: { label: "Tormenta c/ granizo",    icon: "⛈️" },
  99: { label: "Tormenta c/ granizo f.", icon: "⛈️" },
};

function wmo(code: number): { label: string; icon: string } {
  return WMO[code] ?? { label: `Código ${code}`, icon: "🌡️" };
}


async function fetchLocation(loc: (typeof REGIONAL_LOCATIONS)[number]): Promise<LocationWeather> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude",  String(loc.lat));
  url.searchParams.set("longitude", String(loc.lon));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,cloud_cover"
  );
  url.searchParams.set(
    "hourly",
    "temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,rain,weather_code"
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max"
  );
  url.searchParams.set("timezone",       "America/Costa_Rica");
  url.searchParams.set("forecast_days",  String(REGIONAL_FORECAST_DAYS));
  url.searchParams.set("forecast_hours", String(REGIONAL_FORECAST_HOURS));
  url.searchParams.set("wind_speed_unit","kmh");

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    // ── 24-hour hourly ──────────────────────────────────────────────────────
    const h = json.hourly ?? {};
    const times: string[] = h.time ?? [];
    const hourly_24h: LocationWeather["hourly_24h"] = times.slice(0, REGIONAL_FORECAST_HOURS).map((t, i) => ({
      time:         t,
      temp_c:       h.temperature_2m?.[i]           ?? 0,
      hr_pct:       h.relative_humidity_2m?.[i]     ?? 0,
      precip_mm:    h.precipitation?.[i]             ?? 0,
      precip_prob:  h.precipitation_probability?.[i] ?? null,
      rain_mm:      h.rain?.[i]                      ?? 0,
      weather_code: h.weather_code?.[i]              ?? 0,
      weather_icon: wmo(h.weather_code?.[i] ?? 0).icon,
    }));

    // Probabilidad de lluvia máxima en las próximas ~3 horas (dato honesto que
    // la estación local no puede dar). Reemplaza al "pronóstico ensemble".
    const nextProbs = hourly_24h
      .slice(0, 3)
      .map((x) => x.precip_prob)
      .filter((v): v is number => typeof v === "number");
    const precipProbNext3h = nextProbs.length ? Math.max(...nextProbs) : null;

    // ── Current conditions ──────────────────────────────────────────────────
    const cur = json.current;
    const current: LocationWeather["current"] = cur
      ? {
          time:          cur.time,
          temp_c:        cur.temperature_2m ?? 0,
          hr_pct:        cur.relative_humidity_2m ?? 0,
          precip_mm:     cur.precipitation ?? 0,
          precip_prob_next3h: precipProbNext3h,
          rain_mm:       cur.rain ?? 0,
          wind_kmh:      cur.wind_speed_10m ?? 0,
          cloud_pct:     cur.cloud_cover ?? 0,
          weather_code:  cur.weather_code ?? 0,
          weather_label: wmo(cur.weather_code ?? 0).label,
          weather_icon:  wmo(cur.weather_code ?? 0).icon,
        }
      : null;

    // ── 5-day daily ─────────────────────────────────────────────────────────
    const d = json.daily ?? {};
    const dates: string[] = d.time ?? [];
    const daily_5d: LocationWeather["daily_5d"] = dates.slice(0, REGIONAL_FORECAST_DAYS).map((date, i) => ({
      date,
      weather_code:   d.weather_code?.[i]        ?? 0,
      weather_label:  wmo(d.weather_code?.[i] ?? 0).label,
      weather_icon:   wmo(d.weather_code?.[i] ?? 0).icon,
      temp_max_c:     d.temperature_2m_max?.[i]  ?? 0,
      temp_min_c:     d.temperature_2m_min?.[i]  ?? 0,
      precip_sum_mm:  d.precipitation_sum?.[i]   ?? 0,
      precip_prob_max: d.precipitation_probability_max?.[i] ?? null,
    }));

    return {
      ...loc,
      elevation_m: json.elevation ?? null,
      current,
      hourly_24h,
      daily_5d,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return {
      ...loc,
      elevation_m: null,
      current: null,
      hourly_24h: [],
      daily_5d: [],
      error: msg,
    };
  }
}

export async function GET() {
  const results = await Promise.all(REGIONAL_LOCATIONS.map(fetchLocation));

  return NextResponse.json(
    {
      success: true,
      fetchedAt: new Date().toISOString(),
      source: "Open-Meteo (https://open-meteo.com) – CC BY 4.0",
      note: "Datos de modelo numérico de pronóstico. No sustituyen a observaciones en estación.",
      locations: results,
    },
    {
      headers: {
        "Cache-Control": `s-maxage=${REGIONAL_CACHE_TTL_SECONDS}, stale-while-revalidate=120`,
      },
    }
  );
}
