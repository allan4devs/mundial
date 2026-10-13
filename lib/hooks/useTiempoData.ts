import { useState, useCallback, useEffect, useMemo } from "react";
import {
  getWeatherAssessment,
  getCanyonSchedule,
  getSaturation,
  buildRainNarrative,
  getTomorrowMorningSlots,
  summarizeMorningSlots,
  buildHourlyChart,
  buildRiskChart,
  buildDailyChart,
  buildAccumulationSeries,
  getRiverTourImpacts,
} from "@/lib/helpers/tiempoHelpers";
import type { RainData, RegionalData } from "@/lib/types/index";
import type { WeatherSnapshot } from "@/lib/helpers/weatherMessageHelpers";

const RELOAD_COOLDOWN_SECS = 30;

export function useTiempoData() {
  const [rain, setRain] = useState<RainData | null>(null);
  const [regional, setRegional] = useState<RegionalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showRawForecast, setShowRawForecast] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [fetchWarning, setFetchWarning] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      setFetchWarning(null);
      const [r1, r2] = await Promise.allSettled([
        fetch("/api/tiempo?hours=48").then(r => r.json()),
        fetch("/api/tiempo/regional").then(r => r.json()),
      ]);

      if (r1.status === "fulfilled" && r1.value?.success) setRain(r1.value);
      if (r2.status === "fulfilled" && r2.value?.success) setRegional(r2.value);

      if (r1.status !== "fulfilled" || !r1.value?.success) {
        setFetchWarning("Datos locales de lluvia no disponibles temporalmente.");
      }
      if (r2.status !== "fulfilled" || !r2.value?.success) {
        setFetchWarning(prev => prev
          ? `${prev} Contexto regional no disponible.`
          : "Contexto regional no disponible temporalmente.");
      }

      setLastRefresh(new Date());
      setCooldown(RELOAD_COOLDOWN_SECS);
    } catch {
      setFetchWarning("No se pudieron actualizar los datos en este momento.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const assessment = getWeatherAssessment(rain);
  const canyonSchedule = getCanyonSchedule(rain?.meta?.lastUpdateISO);
  const saturation = getSaturation(rain);
  const rainNarrative = buildRainNarrative(rain, rain?.meta?.lastUpdateISO);

  const sanCarlosHourly = regional?.locations?.find(l => l.id === "san_carlos")?.hourly_24h;
  const morningSlots = getTomorrowMorningSlots(sanCarlosHourly);
  const morningSummary = summarizeMorningSlots(morningSlots);

  const weatherSnap = useMemo<WeatherSnapshot | null>(() => {
    if (!rain?.status) return null;
    // Temperatura y humedad reales vienen de Open-Meteo (San Carlos), no de la
    // estación de lluvia, que no las mide.
    const sc = regional?.locations?.find(l => l.id === "san_carlos")?.current ?? null;
    return {
      risk:        rain.status.risk,
      riskLabel:   rain.status.riskLabel,
      last1h_mm:   rain.stats?.last1h_mm  ?? 0,
      last3h_mm:   rain.stats?.last3h_mm  ?? 0,
      last6h_mm:   rain.stats?.last6h_mm  ?? 0,
      last24h_mm:  rain.stats?.last24h_mm ?? 0,
      last48h_mm:  rain.stats?.last48h_mm ?? 0,
      intensity:   rain.status.intensity,
      trend:       rain.status.trend,
      wetHoursLast24: rain.stats?.wetHoursLast24 ?? 0,
      wetStreak:   rain.stats?.wetStreak  ?? 0,
      dryStreak:   rain.stats?.dryStreak  ?? 0,
      peakHourMm:  rain.stats?.peakHour24h?.mm ?? 0,
      peakHourLabel: rain.stats?.peakHour24h?.fecha ?? "",
      stationName: rain.meta?.station ?? "San Carlos",
      currentSumMm: rain.currentSnapshot?.sum_lluv_mm ?? 0,
      yesterdayMm: rain.currentSnapshot?.lluv_ayer_mm ?? 0,
      rainProbNext3h: sc?.precip_prob_next3h ?? null,
      avgTemp24h:  sc?.temp_c ?? null,
      avgHR24h:    sc?.hr_pct ?? null,
    };
  }, [rain, regional]);

  const hourlyChart  = useMemo(() => buildHourlyChart(rain),   [rain]);
  const riskChart    = useMemo(() => buildRiskChart(rain),     [rain]);
  const dailyChart   = useMemo(() => buildDailyChart(rain),    [rain]);
  const accumulationSeries = useMemo(() => buildAccumulationSeries(rain), [rain]);
  const tourImpacts = useMemo(
    () => getRiverTourImpacts(rain, morningSlots),
    [rain, morningSlots],
  );

  return {
    rain,
    regional,
    loading,
    lastRefresh,
    cooldown,
    fetchAll,
    assessment,
    canyonSchedule,
    saturation,
    rainNarrative,
    morningSlots,
    morningSummary,
    weatherSnap,
    hourlyChart,
    riskChart,
    dailyChart,
    accumulationSeries,
    tourImpacts,
    stationHealth: rain?.stationHealth ?? null,
    baseline: rain?.baseline ?? null,
    model: rain?.model ?? null,
    showRawForecast,
    setShowRawForecast,
    fetchWarning,
  };
}
