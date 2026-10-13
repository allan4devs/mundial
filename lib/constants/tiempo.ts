// lib/constants/tiempo.ts
// Constantes para el módulo de clima: nivel de río, confiabilidad de datos y ubicaciones regionales.

// ─── Estimación del nivel del Río La Vieja ────────────────────────────────────

/** Nivel base del río (m) cuando no hay lluvia acumulada */
export const RIVER_BASE_LEVEL_M = 0.45;

/** Factor de incremento de nivel por mm de lluvia acumulada */
export const RIVER_LEVEL_MULTIPLIER = 0.012;

/** Umbral de crecida fuerte (m) */
export const RIVER_LEVEL_CRITICAL_M = 1.8;

/** Umbral de caudal alto (m) */
export const RIVER_LEVEL_HIGH_M = 1.4;

/** Umbral de caudal normal (m) */
export const RIVER_LEVEL_NORMAL_M = 0.95;

// ─── Puntuación de confiabilidad de datos ────────────────────────────────────

/** Puntuación inicial máxima */
export const RELIABILITY_SCORE_MAX = 100;

/** Descuento cuando faltan registros horarios en las últimas 24h (<18 registros) */
export const RELIABILITY_DEDUCTION_RECORDS_LOW = 35;

/** Descuento cuando faltan algunos registros horarios (<24 registros) */
export const RELIABILITY_DEDUCTION_RECORDS_MED = 15;

/** Umbral de registros bajo (menos de este valor → penalización alta) */
export const RELIABILITY_RECORDS_THRESHOLD_LOW = 18;

/** Umbral de registros completo (24 registros = una hora por cada hora) */
export const RELIABILITY_RECORDS_THRESHOLD_FULL = 24;

/** Descuento cuando los datos tienen más de 3 horas de atraso (>180 min) */
export const RELIABILITY_DEDUCTION_FRESHNESS_HIGH = 35;

/** Descuento cuando los datos tienen entre 90 y 180 minutos de atraso */
export const RELIABILITY_DEDUCTION_FRESHNESS_MED = 20;

/** Descuento cuando los datos tienen entre 45 y 90 minutos de atraso */
export const RELIABILITY_DEDUCTION_FRESHNESS_LOW = 10;

/** Descuento cuando no hay snapshot actual de la estación */
export const RELIABILITY_DEDUCTION_NO_SNAPSHOT = 10;

/** Tiempo de frescura alto (minutos) a partir del cual se aplica la mayor penalización */
export const RELIABILITY_FRESHNESS_HIGH_MIN = 180;

/** Tiempo de frescura medio (minutos) */
export const RELIABILITY_FRESHNESS_MED_MIN = 90;

/** Tiempo de frescura bajo (minutos) */
export const RELIABILITY_FRESHNESS_LOW_MIN = 45;

/** Puntuación mínima para nivel de confiabilidad "alta" */
export const RELIABILITY_LEVEL_HIGH_SCORE = 80;

/** Puntuación mínima para nivel de confiabilidad "media" */
export const RELIABILITY_LEVEL_MED_SCORE = 55;

// ─── Caché de pronóstico regional ────────────────────────────────────────────

/** TTL de caché para la ruta de pronóstico regional (segundos) */
export const REGIONAL_CACHE_TTL_SECONDS = 1800; // 30 minutos

/** Días de pronóstico solicitados a Open-Meteo */
export const REGIONAL_FORECAST_DAYS = 5;

/** Horas de pronóstico horario solicitadas a Open-Meteo */
export const REGIONAL_FORECAST_HOURS = 48;

// ─── Ubicaciones regionales monitoreadas ─────────────────────────────────────

export const REGIONAL_LOCATIONS = [
  {
    id: "san_carlos",
    name: "San Carlos (Ciudad Quesada)",
    description: "Cabecera del cantón de San Carlos, Alajuela",
    lat: 10.330,
    lon: -84.430,
  },
  {
    id: "juan_castro_blanco",
    name: "P.N. Juan Castro Blanco",
    description: "Parque Nacional Juan Castro Blanco – zona de amortiguamiento",
    lat: 10.185,
    lon: -84.370,
  },
  {
    id: "san_jose_montana",
    name: "San José de la Montaña",
    description: "Distrito de Barva, Heredia – ladera sur de la cordillera",
    lat: 10.056,
    lon: -84.134,
  },
  {
    id: "el_congo",
    name: "El Congo",
    description: "Sector El Congo, San Carlos – zona baja norte",
    lat: 10.375,
    lon: -84.380,
  },
] as const;
