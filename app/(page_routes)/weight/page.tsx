"use client";

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
} from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Droplets,
  Flame,
  Languages,
  Moon,
  Package,
  Plus,
  Scale,
  Search,
  Sun,
  Trash2,
  Upload,
  User,
  Utensils,
} from "lucide-react";
import Image from "next/image";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as ReLineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Gender = "female" | "male" | "other";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "athlete";
type Goal = "lose" | "maintain" | "gain";
type Unit = "g" | "ml" | "unidades";
type Category =
  | "Proteinas"
  | "Carbohidratos"
  | "Verduras"
  | "Frutas"
  | "Lacteos"
  | "Grasas"
  | "Bebidas"
  | "Otros";

type Profile = {
  id: string;
  name: string;
  weightName: string;
  photo?: string;
  age: number;
  height: number;
  gender: Gender;
  activity: ActivityLevel;
  goal: Goal;
  targetWeight: number;
  targetDate: string;
  waterGoalMl: number;
};

type Food = {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: Unit;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

type Meal = {
  id: string;
  profileId: string;
  foodId?: string;
  foodName: string;
  grams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  date: string;
  manual: boolean;
};

type WeightEntry = {
  id: string;
  profileId: string;
  weightName?: string;
  weight: number;
  date: string;
};

type WaterEntry = {
  id: string;
  profileId: string;
  ml: number;
  date: string;
};

type WeightAppState = {
  profiles: Profile[];
  foods: Food[];
  meals: Meal[];
  weights: WeightEntry[];
  water: WaterEntry[];
};

const categories: Category[] = [
  "Proteinas",
  "Carbohidratos",
  "Verduras",
  "Frutas",
  "Lacteos",
  "Grasas",
  "Bebidas",
  "Otros",
];

const units: Unit[] = ["g", "ml", "unidades"];
const activityFactors: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

const activityLabels: Record<ActivityLevel, string> = {
  sedentary: "Sedentario",
  light: "Ligero",
  moderate: "Moderado",
  active: "Activo",
  athlete: "Atleta",
};

const goalLabels: Record<Goal, string> = {
  lose: "Bajar peso",
  maintain: "Mantener",
  gain: "Subir peso",
};

const palette = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444"];
const today = () => new Date().toISOString().slice(0, 10);
const id = () => crypto.randomUUID();
const storageKey = "weight-app-v1";
const themeStorageKey = "health-theme";
const languageStorageKey = "health-language";

type AppTheme = "light" | "dark";
type AppLanguage = "es" | "en";

type BrowserStore<T> = {
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  set: (value: T) => void;
  subscribe: (callback: () => void) => () => void;
};

function createBrowserStore<T>({
  key,
  eventName,
  defaultValue,
  read,
}: {
  key: string;
  eventName: string;
  defaultValue: T;
  read: (value: string | null) => T;
}): BrowserStore<T> {
  let cachedRawValue: string | null | undefined;
  let cachedSnapshot = defaultValue;

  return {
    getSnapshot: () => {
      if (typeof window === "undefined") return defaultValue;
      const rawValue = window.localStorage.getItem(key);

      if (rawValue === cachedRawValue) return cachedSnapshot;

      cachedRawValue = rawValue;
      cachedSnapshot = read(rawValue);
      return cachedSnapshot;
    },
    getServerSnapshot: () => defaultValue,
    set: (value) => {
      window.localStorage.setItem(key, String(value));
      window.dispatchEvent(new Event(eventName));
    },
    subscribe: (callback) => {
      window.addEventListener("storage", callback);
      window.addEventListener(eventName, callback);

      return () => {
        window.removeEventListener("storage", callback);
        window.removeEventListener(eventName, callback);
      };
    },
  };
}

const themeStore = createBrowserStore<AppTheme>({
  key: themeStorageKey,
  eventName: "health-theme-change",
  defaultValue: "dark",
  read: (value) => (value === "light" ? "light" : "dark"),
});

const languageStore = createBrowserStore<AppLanguage>({
  key: languageStorageKey,
  eventName: "health-language-change",
  defaultValue: "es",
  read: (value) => (value === "en" ? "en" : "es"),
});

const weightCopy = {
  es: {
    eyebrow: "Weight command center",
    title: "Peso, comidas y alacena",
    addProfile: "Perfil",
    loading: "Cargando datos desde Mongo...",
    saving: "Guardando cambios en Mongo...",
    loadError: "No pude cargar Mongo. Estoy usando datos locales mientras tanto.",
    saveError: "No pude guardar en Mongo. Los cambios quedaron en este navegador.",
    weightSaveError: "No pude guardar el peso en Mongo.",
    weightDeleteError: "No pude borrar el peso en Mongo.",
    switchLanguage: "Switch to English",
    switchTheme: "Cambiar tema",
    light: "Claro",
    dark: "Oscuro",
    tabs: {
      dashboard: "Dashboard",
      comidas: "Comidas",
      alacena: "Alacena",
      peso: "Peso",
      agua: "Agua",
      perfiles: "Perfiles",
      reportes: "Reportes",
    },
    stats: {
      calories: "Calorias del dia",
      remaining: "kcal restantes",
      macros: "Macros",
      macrosDetail: "Gramos consumidos hoy",
      currentWeight: "Peso actual",
      previous: "kg vs registro anterior",
      water: "Agua",
      waterGoal: "de la meta",
      streak: "Streak",
      days: "dias",
      streakDetail: "Registros consecutivos",
      weightProgress: "Progreso de peso",
      noProjection: "Sin proyeccion",
      macroDistribution: "Distribucion de macros",
      noData: "Sin datos",
    },
    filters: {
      foodSearch: "Buscar alimento",
      allCategories: "Todas las categorias",
    },
    inventory: {
      food: "Alimento",
      saveFood: "Guardar alimento",
      name: "Nombre",
      category: "Categoria",
      quantity: "Cantidad",
      calories: "Cal",
      macros: "P/G/C",
      edit: "Editar",
      currentQuantity: "Cantidad actual",
      caloriesPer100: "Calorias / 100g",
      protein: "Proteinas",
      fat: "Grasas",
      carbs: "Carbs",
    },
    meals: {
      register: "Registrar comida",
      grams: "Gramos consumidos",
      addInventory: "Agregar desde alacena",
      manual: "Comida manual",
      addManual: "Agregar manual",
      today: "Comidas de hoy",
    },
    weight: {
      tracker: "Tracker de peso",
      weightKg: "Peso kg",
      save: "Guardar peso",
      goal: "Meta de peso",
      targetDate: "Fecha objetivo",
      projection: "Proyeccion",
    },
    water: {
      tracker: "Tracker de agua",
    },
    profiles: {
      photo: "Foto",
      mongoName: "Nombre en pesos Mongo",
      age: "Edad",
      height: "Altura cm",
      genders: { male: "Masculino", female: "Femenino", other: "Otro" },
    },
    reports: {
      weekly: "Reporte semanal",
      monthly: "Reporte mensual",
      weightMinute: "Peso por minuto",
      weightDay: "Peso por dia",
      weightWeek: "Peso por semana",
      weightMonth: "Peso por mes",
      latest: "Ultimo",
      chartSummary: "{bars} barras de {entries} registros visibles",
      noWeightEntries: "No hay registros de peso en este rango.",
      calories: "Calorias",
      protein: "Proteinas",
      fat: "Grasas",
      carbs: "Carbs",
      weight: "Peso",
    },
    categories: {
      Proteinas: "Proteinas",
      Carbohidratos: "Carbohidratos",
      Verduras: "Verduras",
      Frutas: "Frutas",
      Lacteos: "Lacteos",
      Grasas: "Grasas",
      Bebidas: "Bebidas",
      Otros: "Otros",
    },
    activity: activityLabels,
    goals: goalLabels,
  },
  en: {
    eyebrow: "Weight command center",
    title: "Weight, meals and pantry",
    addProfile: "Profile",
    loading: "Loading data from Mongo...",
    saving: "Saving changes to Mongo...",
    loadError: "I could not load Mongo. Using local data for now.",
    saveError: "I could not save to Mongo. Changes stayed in this browser.",
    weightSaveError: "I could not save the weight in Mongo.",
    weightDeleteError: "I could not delete the weight in Mongo.",
    switchLanguage: "Cambiar a Espanol",
    switchTheme: "Switch theme",
    light: "Light",
    dark: "Dark",
    tabs: {
      dashboard: "Dashboard",
      comidas: "Meals",
      alacena: "Pantry",
      peso: "Weight",
      agua: "Water",
      perfiles: "Profiles",
      reportes: "Reports",
    },
    stats: {
      calories: "Daily calories",
      remaining: "kcal remaining",
      macros: "Macros",
      macrosDetail: "Grams consumed today",
      currentWeight: "Current weight",
      previous: "kg vs previous entry",
      water: "Water",
      waterGoal: "of goal",
      streak: "Streak",
      days: "days",
      streakDetail: "Consecutive logs",
      weightProgress: "Weight progress",
      noProjection: "No projection",
      macroDistribution: "Macro distribution",
      noData: "No data",
    },
    filters: {
      foodSearch: "Search food",
      allCategories: "All categories",
    },
    inventory: {
      food: "Food",
      saveFood: "Save food",
      name: "Name",
      category: "Category",
      quantity: "Quantity",
      calories: "Cal",
      macros: "P/F/C",
      edit: "Edit",
      currentQuantity: "Current quantity",
      caloriesPer100: "Calories / 100g",
      protein: "Protein",
      fat: "Fat",
      carbs: "Carbs",
    },
    meals: {
      register: "Log meal",
      grams: "Grams consumed",
      addInventory: "Add from pantry",
      manual: "Manual meal",
      addManual: "Add manual",
      today: "Today's meals",
    },
    weight: {
      tracker: "Weight tracker",
      weightKg: "Weight kg",
      save: "Save weight",
      goal: "Weight goal",
      targetDate: "Target date",
      projection: "Projection",
    },
    water: {
      tracker: "Water tracker",
    },
    profiles: {
      photo: "Photo",
      mongoName: "Mongo weight name",
      age: "Age",
      height: "Height cm",
      genders: { male: "Male", female: "Female", other: "Other" },
    },
    reports: {
      weekly: "Weekly report",
      monthly: "Monthly report",
      weightMinute: "Weight by minute",
      weightDay: "Weight by day",
      weightWeek: "Weight by week",
      weightMonth: "Weight by month",
      latest: "Latest",
      chartSummary: "{bars} bars from {entries} visible entries",
      noWeightEntries: "No weight entries in this range.",
      calories: "Calories",
      protein: "Protein",
      fat: "Fat",
      carbs: "Carbs",
      weight: "Weight",
    },
    categories: {
      Proteinas: "Protein",
      Carbohidratos: "Carbs",
      Verduras: "Vegetables",
      Frutas: "Fruit",
      Lacteos: "Dairy",
      Grasas: "Fats",
      Bebidas: "Drinks",
      Otros: "Other",
    },
    activity: {
      sedentary: "Sedentary",
      light: "Light",
      moderate: "Moderate",
      active: "Active",
      athlete: "Athlete",
    },
    goals: {
      lose: "Lose weight",
      maintain: "Maintain",
      gain: "Gain weight",
    },
  },
};

type WeightCopy = typeof weightCopy.es;

function getWeightUi(isDark: boolean) {
  return {
    page: isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-950",
    headerBorder: isDark ? "border-slate-800" : "border-slate-200",
    title: isDark ? "text-white" : "text-slate-950",
    muted: isDark ? "text-slate-400" : "text-slate-600",
    card: isDark ? "border-slate-800 bg-slate-900 text-slate-100 shadow-black/20" : "border-slate-200 bg-white text-slate-950 shadow-slate-200/80",
    cardSoft: isDark ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-white",
    input: isDark
      ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:ring-sky-900/50"
      : "border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-100",
    buttonPrimary: isDark ? "bg-white text-slate-950 hover:bg-slate-200" : "bg-slate-950 text-white hover:bg-slate-800",
    buttonAccent: isDark ? "bg-sky-500 text-white hover:bg-sky-400" : "bg-sky-600 text-white hover:bg-sky-700",
    buttonSecondary: isDark
      ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    tabActive: isDark ? "border-sky-400 bg-sky-400 text-slate-950" : "border-slate-950 bg-slate-950 text-white",
    tabIdle: isDark
      ? "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
    iconTile: isDark ? "bg-sky-950 text-sky-300" : "bg-sky-100 text-sky-700",
    divider: isDark ? "border-slate-800" : "border-slate-200",
    row: isDark ? "border-slate-800" : "border-slate-100",
    dangerButton: isDark ? "border-red-900/70 text-red-300" : "border-red-200 text-red-700",
    progressTrack: isDark ? "bg-slate-800" : "bg-slate-100",
    photoBg: isDark ? "bg-slate-800" : "bg-slate-100",
    chartGrid: isDark ? "#1e293b" : "#e2e8f0",
    chartPlaceholder: isDark ? "bg-slate-900" : "bg-slate-50",
    alertError: isDark ? "border-red-900/70 bg-red-950/40 text-red-200" : "border-red-200 bg-red-50 text-red-700",
    alertInfo: isDark ? "border-sky-900/70 bg-sky-950/40 text-sky-200" : "border-sky-200 bg-sky-50 text-sky-800",
  };
}

type WeightUi = ReturnType<typeof getWeightUi>;

type MongoWeightEntry = {
  id: string;
  name: string;
  weight: number;
  timestamp: string;
};

type PersistedWeightAppState = Omit<WeightAppState, "weights">;

const defaultState: WeightAppState = {
  profiles: [
    {
      id: "p-alrojas",
      name: "Yo",
      weightName: "YO",
      age: 35,
      height: 175,
      gender: "male",
      activity: "moderate",
      goal: "lose",
      targetWeight: 82,
      targetDate: "2026-07-30",
      waterGoalMl: 2500,
    },
    {
      id: "p-veronica",
      name: "Veronica",
      weightName: "VERONICA",
      age: 34,
      height: 165,
      gender: "female",
      activity: "light",
      goal: "maintain",
      targetWeight: 62,
      targetDate: "2026-07-30",
      waterGoalMl: 2200,
    },
  ],
  foods: [
    {
      id: "f-chicken",
      name: "Pechuga de pollo",
      category: "Proteinas",
      quantity: 1200,
      unit: "g",
      calories: 165,
      protein: 31,
      fat: 3.6,
      carbs: 0,
    },
    {
      id: "f-rice",
      name: "Arroz cocido",
      category: "Carbohidratos",
      quantity: 900,
      unit: "g",
      calories: 130,
      protein: 2.7,
      fat: 0.3,
      carbs: 28,
    },
    {
      id: "f-avocado",
      name: "Aguacate",
      category: "Grasas",
      quantity: 4,
      unit: "unidades",
      calories: 160,
      protein: 2,
      fat: 15,
      carbs: 9,
    },
  ],
  meals: [],
  weights: [
    { id: "w1", profileId: "p-alrojas", weight: 91.2, date: "2026-05-01" },
    { id: "w2", profileId: "p-alrojas", weight: 90.5, date: "2026-05-10" },
    { id: "w3", profileId: "p-alrojas", weight: 89.8, date: "2026-05-20" },
    { id: "w4", profileId: "p-veronica", weight: 62.4, date: "2026-05-04" },
    { id: "w5", profileId: "p-veronica", weight: 62.1, date: "2026-05-18" },
  ],
  water: [],
};

function loadState(): WeightAppState {
  if (typeof window === "undefined") return defaultState;
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) return defaultState;
  try {
    return { ...defaultState, ...JSON.parse(saved) };
  } catch {
    return defaultState;
  }
}

function normalizeWeightName(name: string) {
  return name.trim().replace(/\s+/g, " ").toUpperCase();
}

function normalizeFoodName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function foodFromManualMeal(meal: Omit<Meal, "id" | "profileId" | "date">): Food | null {
  if (!meal.manual || !meal.foodName.trim()) return null;

  return {
    id: id(),
    name: meal.foodName.trim(),
    category: "Otros",
    quantity: 1,
    unit: "unidades",
    calories: meal.calories,
    protein: meal.protein,
    fat: meal.fat,
    carbs: meal.carbs,
  };
}

function upsertManualFood(foods: Food[], manualFood: Food | null) {
  if (!manualFood) return foods;

  const manualName = normalizeFoodName(manualFood.name);
  const existingFood = foods.find((food) => normalizeFoodName(food.name) === manualName);

  if (!existingFood) return [...foods, manualFood];

  return foods.map((food) =>
    food.id === existingFood.id
      ? {
          ...food,
          category: food.category || manualFood.category,
          quantity: Math.max(food.quantity, manualFood.quantity),
          unit: food.unit || manualFood.unit,
          calories: manualFood.calories,
          protein: manualFood.protein,
          fat: manualFood.fat,
          carbs: manualFood.carbs,
        }
      : food
  );
}

function appStateForSave(state: WeightAppState): PersistedWeightAppState {
  return {
    profiles: state.profiles,
    foods: state.foods,
    meals: state.meals,
    water: state.water,
  };
}

function mergeAppState(appState: Partial<PersistedWeightAppState>, weights: WeightEntry[]): WeightAppState {
  const profiles = (appState.profiles?.length ? appState.profiles : defaultState.profiles).map((profile) => ({
    ...profile,
    weightName: normalizeWeightName(profile.weightName || profile.name),
  }));
  const existingWeightNames = new Set(profiles.map((profile) => normalizeWeightName(profile.weightName)));
  const importedProfiles = Array.from(new Set(weights.map((entry) => normalizeWeightName(entry.weightName || ""))))
    .filter((weightName) => weightName && !existingWeightNames.has(weightName))
    .map<Profile>((weightName) => ({
      id: `p-${weightName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: weightName === "VERONICA" ? "Veronica" : weightName,
      weightName,
      age: 30,
      height: 170,
      gender: "other",
      activity: "moderate",
      goal: "maintain",
      targetWeight: weights.find((entry) => entry.weightName === weightName)?.weight ?? 70,
      targetDate: today(),
      waterGoalMl: 2500,
    }));

  return {
    profiles: [...profiles, ...importedProfiles],
    foods: appState.foods?.length ? appState.foods : defaultState.foods,
    meals: appState.meals ?? [],
    water: appState.water ?? [],
    weights,
  };
}

function normalizeMongoWeights(entries: MongoWeightEntry[]): WeightEntry[] {
  return entries
    .map<WeightEntry | null>((entry) => {
      const date = new Date(entry.timestamp);
      const weightName = normalizeWeightName(entry.name);
      const weight = Number(entry.weight);

      if (!weightName || !Number.isFinite(weight) || Number.isNaN(date.getTime())) {
        return null;
      }

      return {
        id: entry.id,
        profileId: weightName,
        weightName,
        weight,
        date: date.toISOString().slice(0, 10),
      };
    })
    .filter((entry): entry is WeightEntry => entry !== null);
}

async function fetchWeightAppState() {
  const [appRes, weightsRes] = await Promise.all([fetch("/api/weight/app"), fetch("/api/weight")]);

  if (!appRes.ok) throw new Error("Failed to load weight app state");
  if (!weightsRes.ok) throw new Error("Failed to load weight entries");

  const appState = (await appRes.json()) as Partial<PersistedWeightAppState>;
  const weights = normalizeMongoWeights((await weightsRes.json()) as MongoWeightEntry[]);

  return mergeAppState(appState, weights);
}

async function saveWeightAppState(state: WeightAppState) {
  const res = await fetch("/api/weight/app", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(appStateForSave(state)),
  });

  if (!res.ok) throw new Error("Failed to save weight app state");
}

async function createWeightEntry(profile: Profile, weight: number, date: string) {
  const res = await fetch("/api/weight", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: normalizeWeightName(profile.weightName || profile.name),
      weight,
      timestamp: new Date(`${date}T12:00:00`).toISOString(),
    }),
  });

  if (!res.ok) throw new Error("Failed to create weight entry");
  const entry = (await res.json()) as MongoWeightEntry;

  return normalizeMongoWeights([entry])[0];
}

async function deleteWeightEntry(weightId: string) {
  const res = await fetch(`/api/weight?id=${encodeURIComponent(weightId)}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to delete weight entry");
}

function caloriesFor(profile: Profile, weight = 80) {
  const base =
    profile.gender === "female"
      ? 10 * weight + 6.25 * profile.height - 5 * profile.age - 161
      : 10 * weight + 6.25 * profile.height - 5 * profile.age + 5;
  const maintenance = Math.round(base * activityFactors[profile.activity]);
  if (profile.goal === "lose") return maintenance - 450;
  if (profile.goal === "gain") return maintenance + 300;
  return maintenance;
}

function macroTotals(meals: Meal[]) {
  return meals.reduce(
    (sum, meal) => ({
      calories: sum.calories + meal.calories,
      protein: sum.protein + meal.protein,
      fat: sum.fat + meal.fat,
      carbs: sum.carbs + meal.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );
}

function daysBetween(start: string, end: string) {
  return Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000));
}

function trendProjection(entries: WeightEntry[], targetWeight: number, targetDate: string) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return { label: "Necesita mas registros", projected: null as number | null };
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const dailyChange = (last.weight - first.weight) / daysBetween(first.date, last.date);
  const projected = last.weight + dailyChange * daysBetween(last.date, targetDate);
  const onTrack = targetWeight <= last.weight ? projected <= targetWeight : projected >= targetWeight;
  return { label: onTrack ? "En ruta" : "Fuera de ritmo", projected };
}

export default function WeightPage() {
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.getSnapshot, themeStore.getServerSnapshot);
  const language = useSyncExternalStore(
    languageStore.subscribe,
    languageStore.getSnapshot,
    languageStore.getServerSnapshot
  );
  const isDark = theme === "dark";
  const copy = weightCopy[language] as WeightCopy;
  const ui = useMemo(() => getWeightUi(isDark), [isDark]);
  const [state, setState] = useState<WeightAppState>(defaultState);
  const [selectedProfileId, setSelectedProfileId] = useState(defaultState.profiles[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [foodQuery, setFoodQuery] = useState("");
  const [foodCategory, setFoodCategory] = useState<Category | "Todas">("Todas");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [hasLoadedFromMongo, setHasLoadedFromMongo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      const localState = loadState();

      if (cancelled) return;
      setState(localState);
      setSelectedProfileId(localState.profiles[0]?.id ?? "");
      setHasLoadedFromStorage(true);

      fetchWeightAppState()
        .then((nextState) => {
          if (cancelled) return;
          setState(nextState);
          setSelectedProfileId((current) =>
            nextState.profiles.some((profile) => profile.id === current) ? current : nextState.profiles[0]?.id ?? ""
          );
          setHasLoadedFromMongo(true);
          setError("");
        })
        .catch((loadError) => {
          console.error(loadError);
          if (!cancelled) {
            setError(weightCopy.es.loadError);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedFromStorage) return;

    window.localStorage.setItem(storageKey, JSON.stringify(state));

    if (!hasLoadedFromMongo) return;

    const timeout = window.setTimeout(() => {
      setSaving(true);
      saveWeightAppState(state)
        .then(() => setError(""))
        .catch((saveError) => {
          console.error(saveError);
          setError(weightCopy.es.saveError);
        })
        .finally(() => setSaving(false));
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [hasLoadedFromMongo, hasLoadedFromStorage, state]);

  const profile = state.profiles.find((item) => item.id === selectedProfileId) ?? state.profiles[0];
  const profileWeightName = normalizeWeightName(profile?.weightName || profile?.name || "");
  const profileWeights = state.weights
    .filter((entry) => normalizeWeightName(entry.weightName || entry.profileId) === profileWeightName)
    .sort((a, b) => a.date.localeCompare(b.date));
  const latestWeight = profileWeights.at(-1)?.weight ?? 80;
  const previousWeight = profileWeights.at(-2)?.weight ?? latestWeight;
  const dailyGoal = profile ? caloriesFor(profile, latestWeight) : 2000;
  const todaysMeals = state.meals.filter((meal) => meal.profileId === profile?.id && meal.date === today());
  const todayMacros = macroTotals(todaysMeals);
  const todaysWater = state.water
    .filter((entry) => entry.profileId === profile?.id && entry.date === today())
    .reduce((sum, entry) => sum + entry.ml, 0);
  const projection = profile ? trendProjection(profileWeights, profile.targetWeight, profile.targetDate) : null;
  const streak = useMemo(() => {
    const days = new Set(
      [...state.meals, ...state.weights, ...state.water]
        .filter((entry) => entry.profileId === profile?.id || normalizeWeightName("weightName" in entry ? String(entry.weightName) : "") === profileWeightName)
        .map((entry) => entry.date)
    );
    let count = 0;
    const cursor = new Date(today());
    while (days.has(cursor.toISOString().slice(0, 10))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [profile?.id, profileWeightName, state.meals, state.water, state.weights]);

  const filteredFoods = state.foods.filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(foodQuery.toLowerCase());
    const matchesCategory = foodCategory === "Todas" || food.category === foodCategory;
    return matchesSearch && matchesCategory;
  });

  const weeklyData = useMemo(
    () => buildReportData(state.meals, state.weights, profile?.id ?? "", profileWeightName, 7),
    [profile?.id, profileWeightName, state.meals, state.weights]
  );
  const monthlyData = useMemo(
    () => buildReportData(state.meals, state.weights, profile?.id ?? "", profileWeightName, 30),
    [profile?.id, profileWeightName, state.meals, state.weights]
  );

  const updateProfile = (patch: Partial<Profile>) => {
    setState((current) => ({
      ...current,
      profiles: current.profiles.map((item) => (item.id === profile.id ? { ...item, ...patch } : item)),
    }));
  };

  const addProfile = () => {
    const newProfile: Profile = {
      id: id(),
      name: "Nuevo perfil",
      weightName: "NUEVO PERFIL",
      age: 30,
      height: 170,
      gender: "other",
      activity: "moderate",
      goal: "maintain",
      targetWeight: 70,
      targetDate: today(),
      waterGoalMl: 2500,
    };
    setState((current) => ({ ...current, profiles: [...current.profiles, newProfile] }));
    setSelectedProfileId(newProfile.id);
    setActiveTab("perfiles");
  };

  const addWater = (ml: number) => {
    setState((current) => ({
      ...current,
      water: [...current.water, { id: id(), profileId: profile.id, ml, date: today() }],
    }));
  };

  if (!profile) {
    return null;
  }

  return (
    <main className={`min-h-screen ${ui.page}`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-6 sm:py-5 lg:px-8">
        <header className={`flex flex-col gap-4 border-b pb-5 md:flex-row md:items-center md:justify-between ${ui.headerBorder}`}>
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase text-sky-600 dark:text-sky-300">{copy.eyebrow}</p>
            <h1 className={`text-2xl font-black tracking-normal sm:text-4xl ${ui.title}`}>{copy.title}</h1>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => languageStore.set(language === "es" ? "en" : "es")}
              aria-label={copy.switchLanguage}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-bold shadow-sm transition ${ui.buttonSecondary}`}
            >
              <Languages className="h-4 w-4" />
              {language === "es" ? "EN" : "ES"}
            </button>
            <button
              type="button"
              onClick={() => themeStore.set(isDark ? "light" : "dark")}
              aria-label={copy.switchTheme}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-bold shadow-sm transition ${ui.buttonSecondary}`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? copy.light : copy.dark}
            </button>
            <select
              value={selectedProfileId}
              onChange={(event) => setSelectedProfileId(event.target.value)}
              className={`col-span-2 h-11 min-w-0 rounded-lg border px-3 text-sm font-bold shadow-sm sm:col-span-1 sm:w-auto ${ui.input}`}
            >
              {state.profiles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addProfile}
              className={`col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition sm:col-span-1 ${ui.buttonPrimary}`}
            >
              <Plus className="h-4 w-4" /> {copy.addProfile}
            </button>
          </div>
        </header>

        {(loading || saving || error) && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm font-bold ${error ? ui.alertError : ui.alertInfo}`}
          >
            {error || (loading ? copy.loading : copy.saving)}
          </div>
        )}

        <nav className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
          {[
            ["dashboard", Flame, copy.tabs.dashboard],
            ["comidas", Utensils, copy.tabs.comidas],
            ["alacena", Package, copy.tabs.alacena],
            ["peso", Scale, copy.tabs.peso],
            ["agua", Droplets, copy.tabs.agua],
            ["perfiles", User, copy.tabs.perfiles],
            ["reportes", BarChart3, copy.tabs.reportes],
          ].map(([key, Icon, label]) => {
            const TabIcon = Icon as typeof Flame;
            return (
              <button
                key={key as string}
                type="button"
                onClick={() => setActiveTab(key as string)}
                className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-bold transition sm:h-11 ${
                  activeTab === key ? ui.tabActive : ui.tabIdle
                }`}
              >
                <TabIcon className="h-4 w-4" />
                {label as string}
              </button>
            );
          })}
        </nav>

        {activeTab === "dashboard" && (
          <Dashboard
            dailyGoal={dailyGoal}
            latestWeight={latestWeight}
            previousWeight={previousWeight}
            macros={todayMacros}
            water={todaysWater}
            waterGoal={profile.waterGoalMl}
            streak={streak}
            projection={projection}
            weights={profileWeights}
            copy={copy}
            ui={ui}
          />
        )}

        {activeTab === "comidas" && (
          <MealsPanel
            foods={filteredFoods}
            allFoods={state.foods}
            meals={todaysMeals}
            query={foodQuery}
            category={foodCategory}
            setQuery={setFoodQuery}
            setCategory={setFoodCategory}
            copy={copy}
            ui={ui}
            onAddMeal={(meal, inventoryPatch) =>
              setState((current) => {
                const nextFoods = inventoryPatch
                  ? current.foods.map((food) =>
                      food.id === inventoryPatch.foodId
                        ? { ...food, quantity: Math.max(0, food.quantity - inventoryPatch.amount) }
                        : food
                    )
                  : upsertManualFood(current.foods, foodFromManualMeal(meal));

                return {
                  ...current,
                  meals: [...current.meals, { ...meal, id: id(), profileId: profile.id, date: today() }],
                  foods: nextFoods,
                };
              })
            }
            onDeleteMeal={(mealId) =>
              setState((current) => ({ ...current, meals: current.meals.filter((meal) => meal.id !== mealId) }))
            }
          />
        )}

        {activeTab === "alacena" && (
          <InventoryPanel
            foods={filteredFoods}
            query={foodQuery}
            category={foodCategory}
            setQuery={setFoodQuery}
            setCategory={setFoodCategory}
            copy={copy}
            ui={ui}
            onSave={(food) =>
              setState((current) => ({
                ...current,
                foods: current.foods.some((item) => item.id === food.id)
                  ? current.foods.map((item) => (item.id === food.id ? food : item))
                  : [...current.foods, food],
              }))
            }
            onDelete={(foodId) =>
              setState((current) => ({ ...current, foods: current.foods.filter((food) => food.id !== foodId) }))
            }
          />
        )}

        {activeTab === "peso" && (
          <WeightPanel
            weights={profileWeights}
            targetWeight={profile.targetWeight}
            targetDate={profile.targetDate}
            projection={projection}
            copy={copy}
            ui={ui}
            onGoalChange={updateProfile}
            onAdd={async (weight, date) => {
              try {
                setSaving(true);
                const created = await createWeightEntry(profile, weight, date);
                if (!created) return;
                setState((current) => ({ ...current, weights: [...current.weights, created] }));
                setError("");
              } catch (weightError) {
                console.error(weightError);
                setError(copy.weightSaveError);
              } finally {
                setSaving(false);
              }
            }}
            onDelete={async (weightId) => {
              try {
                setSaving(true);
                await deleteWeightEntry(weightId);
                setState((current) => ({ ...current, weights: current.weights.filter((entry) => entry.id !== weightId) }));
                setError("");
              } catch (weightError) {
                console.error(weightError);
                setError(copy.weightDeleteError);
              } finally {
                setSaving(false);
              }
            }}
          />
        )}

        {activeTab === "agua" && (
          <WaterPanel
            consumed={todaysWater}
            goal={profile.waterGoalMl}
            onGoalChange={(waterGoalMl) => updateProfile({ waterGoalMl })}
            onAdd={addWater}
            entries={state.water.filter((entry) => entry.profileId === profile.id && entry.date === today())}
            copy={copy}
            ui={ui}
          />
        )}

        {activeTab === "perfiles" && (
          <ProfilesPanel
            profile={profile}
            updateProfile={updateProfile}
            copy={copy}
            ui={ui}
            onPhoto={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const photo = await fileToDataUrl(file);
              updateProfile({ photo });
            }}
          />
        )}

        {activeTab === "reportes" && (
          <ReportsPanel
            weeklyData={weeklyData}
            monthlyData={monthlyData}
            weights={profileWeights}
            copy={copy}
            ui={ui}
          />
        )}
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  ui,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  detail: string;
  ui: WeightUi;
}) {
  return (
    <section className={`rounded-lg border p-5 shadow-sm ${ui.card}`}>
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${ui.iconTile}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className={`text-sm font-bold ${ui.muted}`}>{label}</p>
      <p className="mt-1 text-2xl font-black tracking-normal sm:text-3xl">{value}</p>
      <p className={`mt-2 text-sm ${ui.muted}`}>{detail}</p>
    </section>
  );
}

function ChartContainer({ children, ui }: { children: ReactElement; ui: WeightUi }) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  if (!mounted) {
    return <div className={`h-full w-full rounded-lg ${ui.chartPlaceholder}`} />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
      {children}
    </ResponsiveContainer>
  );
}

function Dashboard({
  dailyGoal,
  latestWeight,
  previousWeight,
  macros,
  water,
  waterGoal,
  streak,
  projection,
  weights,
  copy,
  ui,
}: {
  dailyGoal: number;
  latestWeight: number;
  previousWeight: number;
  macros: ReturnType<typeof macroTotals>;
  water: number;
  waterGoal: number;
  streak: number;
  projection: ReturnType<typeof trendProjection> | null;
  weights: WeightEntry[];
  copy: WeightCopy;
  ui: WeightUi;
}) {
  const macroPie = [
    { name: copy.reports.protein, value: Math.round(macros.protein), color: palette[0] },
    { name: copy.reports.fat, value: Math.round(macros.fat), color: palette[2] },
    { name: "Carbs", value: Math.round(macros.carbs), color: palette[1] },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-5">
        <StatCard
          icon={Flame}
          label={copy.stats.calories}
          value={`${Math.round(macros.calories)} / ${dailyGoal}`}
          detail={`${Math.max(0, dailyGoal - macros.calories).toFixed(0)} ${copy.stats.remaining}`}
          ui={ui}
        />
        <StatCard
          icon={Activity}
          label={copy.stats.macros}
          value={`${Math.round(macros.protein)}P ${Math.round(macros.fat)}G ${Math.round(macros.carbs)}C`}
          detail={copy.stats.macrosDetail}
          ui={ui}
        />
        <StatCard
          icon={Scale}
          label={copy.stats.currentWeight}
          value={`${latestWeight.toFixed(1)} kg`}
          detail={`${(latestWeight - previousWeight).toFixed(1)} ${copy.stats.previous}`}
          ui={ui}
        />
        <StatCard
          icon={Droplets}
          label={copy.stats.water}
          value={`${water} ml`}
          detail={`${Math.min(100, Math.round((water / waterGoal) * 100))}% ${copy.stats.waterGoal}`}
          ui={ui}
        />
        <StatCard icon={CalendarDays} label={copy.stats.streak} value={`${streak} ${copy.stats.days}`} detail={copy.stats.streakDetail} ui={ui} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
        <section className={`rounded-lg border p-5 shadow-sm ${ui.card}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black">{copy.stats.weightProgress}</h2>
            <span className="rounded-lg bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
              {projection?.label ?? copy.stats.noProjection}
            </span>
          </div>
          <div className="h-64 sm:h-72">
            <ChartContainer ui={ui}>
              <AreaChart data={weights}>
                <CartesianGrid strokeDasharray="3 3" stroke={ui.chartGrid} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="weight" stroke="#0ea5e9" fill="#bae6fd" strokeWidth={3} />
              </AreaChart>
            </ChartContainer>
          </div>
        </section>

        <section className={`rounded-lg border p-5 shadow-sm ${ui.card}`}>
          <h2 className="text-lg font-black">{copy.stats.macroDistribution}</h2>
          <div className="h-64 sm:h-72">
            <ChartContainer ui={ui}>
              <PieChart>
                <Pie data={macroPie.length ? macroPie : [{ name: copy.stats.noData, value: 1, color: "#cbd5e1" }]} dataKey="value" innerRadius={55} outerRadius={90}>
                  {(macroPie.length ? macroPie : [{ color: "#cbd5e1" }]).map((entry, index) => (
                    <Cell key={`${entry.color}-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ChartContainer>
          </div>
        </section>
      </div>
    </div>
  );
}

function Filters({
  query,
  category,
  setQuery,
  setCategory,
  copy,
  ui,
}: {
  query: string;
  category: Category | "Todas";
  setQuery: (query: string) => void;
  setCategory: (category: Category | "Todas") => void;
  copy: WeightCopy;
  ui: WeightUi;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
      <label className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.filters.foodSearch}
          className={`h-11 w-full rounded-lg border pl-10 pr-3 text-sm outline-none focus:ring-4 ${ui.input}`}
        />
      </label>
      <select
        value={category}
        onChange={(event) => setCategory(event.target.value as Category | "Todas")}
        className={`h-11 rounded-lg border px-3 text-sm font-bold ${ui.input}`}
      >
        <option value="Todas">{copy.filters.allCategories}</option>
        {categories.map((item) => (
          <option key={item} value={item}>
            {copy.categories[item]}
          </option>
        ))}
      </select>
    </div>
  );
}

function InventoryPanel({
  foods,
  query,
  category,
  setQuery,
  setCategory,
  copy,
  ui,
  onSave,
  onDelete,
}: {
  foods: Food[];
  query: string;
  category: Category | "Todas";
  setQuery: (query: string) => void;
  setCategory: (category: Category | "Todas") => void;
  copy: WeightCopy;
  ui: WeightUi;
  onSave: (food: Food) => void;
  onDelete: (foodId: string) => void;
}) {
  const blank: Food = { id: "", name: "", category: "Proteinas", quantity: 0, unit: "g", calories: 0, protein: 0, fat: 0, carbs: 0 };
  const [draft, setDraft] = useState<Food>(blank);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    onSave({ ...draft, id: draft.id || id(), name: draft.name.trim() });
    setDraft(blank);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-5">
      <form onSubmit={submit} className={`rounded-lg border p-4 shadow-sm sm:p-5 ${ui.card}`}>
        <h2 className="mb-4 text-lg font-black">{copy.inventory.food}</h2>
        <FoodFields draft={draft} setDraft={setDraft} copy={copy} ui={ui} />
        <button className={`mt-4 h-11 w-full rounded-lg text-sm font-bold transition ${ui.buttonPrimary}`} type="submit">
          {copy.inventory.saveFood}
        </button>
      </form>
      <section className={`rounded-lg border p-4 shadow-sm sm:p-5 ${ui.card}`}>
        <Filters query={query} category={category} setQuery={setQuery} setCategory={setCategory} copy={copy} ui={ui} />
        <div className="mt-4 grid gap-3 md:hidden">
          {foods.map((food) => (
            <article key={food.id} className={`rounded-lg border p-3 ${ui.cardSoft}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-black">{food.name}</p>
                  <p className={`mt-1 text-xs font-bold uppercase ${ui.muted}`}>{copy.categories[food.category]}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => setDraft(food)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${ui.buttonSecondary}`}>
                    {copy.inventory.edit}
                  </button>
                  <button type="button" onClick={() => onDelete(food.id)} className={`rounded-lg border p-2 ${ui.dangerButton}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className={`text-xs font-bold uppercase ${ui.muted}`}>{copy.inventory.quantity}</p>
                  <p className="font-bold">
                    {food.quantity} {food.unit}
                  </p>
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase ${ui.muted}`}>{copy.inventory.calories}</p>
                  <p className="font-bold">{food.calories}</p>
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase ${ui.muted}`}>{copy.inventory.macros}</p>
                  <p className="font-bold">
                    {food.protein}/{food.fat}/{food.carbs}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className={`border-b text-xs uppercase ${ui.divider} ${ui.muted}`}>
              <tr>
                <th className="py-3">{copy.inventory.name}</th>
                <th>{copy.inventory.category}</th>
                <th>{copy.inventory.quantity}</th>
                <th>{copy.inventory.calories}</th>
                <th>{copy.inventory.macros}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {foods.map((food) => (
                <tr key={food.id} className={`border-b ${ui.row}`}>
                  <td className="py-3 font-bold">{food.name}</td>
                  <td>{copy.categories[food.category]}</td>
                  <td>
                    {food.quantity} {food.unit}
                  </td>
                  <td>{food.calories}</td>
                  <td>
                    {food.protein}/{food.fat}/{food.carbs}
                  </td>
                  <td className="text-right">
                    <button type="button" onClick={() => setDraft(food)} className={`mr-2 rounded-lg border px-3 py-2 font-bold ${ui.buttonSecondary}`}>
                      {copy.inventory.edit}
                    </button>
                    <button type="button" onClick={() => onDelete(food.id)} className={`rounded-lg border px-3 py-2 ${ui.dangerButton}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function FoodFields({ draft, setDraft, copy, ui }: { draft: Food; setDraft: (food: Food) => void; copy: WeightCopy; ui: WeightUi }) {
  const numeric = (key: keyof Food, value: string) => setDraft({ ...draft, [key]: Number(value) || 0 });
  return (
    <div className="grid gap-3">
      <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder={copy.inventory.name} className={`h-11 rounded-lg border px-3 ${ui.input}`} />
      <div className="grid gap-3 sm:grid-cols-2">
        <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as Category })} className={`h-11 rounded-lg border px-3 ${ui.input}`}>
          {categories.map((item) => (
            <option key={item} value={item}>{copy.categories[item]}</option>
          ))}
        </select>
        <select value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value as Unit })} className={`h-11 rounded-lg border px-3 ${ui.input}`}>
          {units.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <input value={draft.quantity || ""} onChange={(event) => numeric("quantity", event.target.value)} type="number" placeholder={copy.inventory.currentQuantity} className={`h-11 rounded-lg border px-3 ${ui.input}`} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={draft.calories || ""} onChange={(event) => numeric("calories", event.target.value)} type="number" placeholder={copy.inventory.caloriesPer100} className={`h-11 rounded-lg border px-3 ${ui.input}`} />
        <input value={draft.protein || ""} onChange={(event) => numeric("protein", event.target.value)} type="number" placeholder={copy.inventory.protein} className={`h-11 rounded-lg border px-3 ${ui.input}`} />
        <input value={draft.fat || ""} onChange={(event) => numeric("fat", event.target.value)} type="number" placeholder={copy.inventory.fat} className={`h-11 rounded-lg border px-3 ${ui.input}`} />
        <input value={draft.carbs || ""} onChange={(event) => numeric("carbs", event.target.value)} type="number" placeholder={copy.inventory.carbs} className={`h-11 rounded-lg border px-3 ${ui.input}`} />
      </div>
    </div>
  );
}

function MealsPanel({
  foods,
  allFoods,
  meals,
  query,
  category,
  setQuery,
  setCategory,
  copy,
  ui,
  onAddMeal,
  onDeleteMeal,
}: {
  foods: Food[];
  allFoods: Food[];
  meals: Meal[];
  query: string;
  category: Category | "Todas";
  setQuery: (query: string) => void;
  setCategory: (category: Category | "Todas") => void;
  copy: WeightCopy;
  ui: WeightUi;
  onAddMeal: (meal: Omit<Meal, "id" | "profileId" | "date">, inventoryPatch?: { foodId: string; amount: number }) => void;
  onDeleteMeal: (mealId: string) => void;
}) {
  const [foodId, setFoodId] = useState(allFoods[0]?.id ?? "");
  const [grams, setGrams] = useState(100);
  const [manual, setManual] = useState({ name: "", calories: 0, protein: 0, fat: 0, carbs: 0 });
  const selectedFood = allFoods.find((food) => food.id === foodId) ?? allFoods[0];

  const addFromInventory = () => {
    if (!selectedFood || grams <= 0) return;
    const factor = grams / 100;
    onAddMeal(
      {
        foodId: selectedFood.id,
        foodName: selectedFood.name,
        grams,
        calories: selectedFood.calories * factor,
        protein: selectedFood.protein * factor,
        fat: selectedFood.fat * factor,
        carbs: selectedFood.carbs * factor,
        manual: false,
      },
      { foodId: selectedFood.id, amount: selectedFood.unit === "unidades" ? 1 : grams }
    );
  };

  const addManual = () => {
    const foodName = manual.name.trim();
    if (!foodName) return;
    onAddMeal({
      foodName,
      grams: 0,
      calories: manual.calories,
      protein: manual.protein,
      fat: manual.fat,
      carbs: manual.carbs,
      manual: true,
    });
    setManual({ name: "", calories: 0, protein: 0, fat: 0, carbs: 0 });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[390px_minmax(0,1fr)] lg:gap-5">
      <section className={`space-y-4 rounded-lg border p-4 shadow-sm sm:p-5 ${ui.card}`}>
        <h2 className="text-lg font-black">{copy.meals.register}</h2>
        <Filters query={query} category={category} setQuery={setQuery} setCategory={setCategory} copy={copy} ui={ui} />
        <select value={foodId} onChange={(event) => setFoodId(event.target.value)} className={`h-11 w-full rounded-lg border px-3 ${ui.input}`}>
          {foods.map((food) => (
            <option key={food.id} value={food.id}>
              {food.name} ({food.quantity} {food.unit})
            </option>
          ))}
        </select>
        <input value={grams || ""} onChange={(event) => setGrams(Number(event.target.value) || 0)} type="number" placeholder={copy.meals.grams} className={`h-11 w-full rounded-lg border px-3 ${ui.input}`} />
        <button type="button" onClick={addFromInventory} className={`h-11 w-full rounded-lg text-sm font-bold transition ${ui.buttonAccent}`}>
          {copy.meals.addInventory}
        </button>
        <div className={`border-t pt-4 ${ui.divider}`}>
          <h3 className="mb-3 font-black">{copy.meals.manual}</h3>
          <div className="grid gap-3">
            <input value={manual.name} onChange={(event) => setManual({ ...manual, name: event.target.value })} placeholder={copy.inventory.name} className={`h-11 rounded-lg border px-3 ${ui.input}`} />
            <div className="grid gap-3 sm:grid-cols-2">
              {(["calories", "protein", "fat", "carbs"] as const).map((key) => (
                <input
                  key={key}
                  value={manual[key] || ""}
                  onChange={(event) => setManual({ ...manual, [key]: Number(event.target.value) || 0 })}
                  type="number"
                  placeholder={key}
                  className={`h-11 rounded-lg border px-3 ${ui.input}`}
                />
              ))}
            </div>
            <button type="button" onClick={addManual} className={`h-11 rounded-lg border text-sm font-bold ${ui.buttonSecondary}`}>
              {copy.meals.addManual}
            </button>
          </div>
        </div>
      </section>
      <section className={`rounded-lg border p-4 shadow-sm sm:p-5 ${ui.card}`}>
        <h2 className="mb-4 text-lg font-black">{copy.meals.today}</h2>
        <div className="space-y-3">
          {meals.map((meal) => (
            <div key={meal.id} className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${ui.cardSoft}`}>
              <div className="min-w-0">
                <p className="font-black">{meal.foodName}</p>
                <p className={`text-sm ${ui.muted}`}>
                  {Math.round(meal.calories)} kcal - {Math.round(meal.protein)}P/{Math.round(meal.fat)}G/{Math.round(meal.carbs)}C
                </p>
              </div>
              <button type="button" onClick={() => onDeleteMeal(meal.id)} className={`rounded-lg border p-2 ${ui.dangerButton}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function WeightPanel({
  weights,
  targetWeight,
  targetDate,
  projection,
  copy,
  ui,
  onGoalChange,
  onAdd,
  onDelete,
}: {
  weights: WeightEntry[];
  targetWeight: number;
  targetDate: string;
  projection: ReturnType<typeof trendProjection> | null;
  copy: WeightCopy;
  ui: WeightUi;
  onGoalChange: (patch: Partial<Profile>) => void;
  onAdd: (weight: number, date: string) => void | Promise<void>;
  onDelete: (weightId: string) => void | Promise<void>;
}) {
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(today());
  return (
    <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-5">
      <section className={`rounded-lg border p-4 shadow-sm sm:p-5 ${ui.card}`}>
        <h2 className="mb-4 text-lg font-black">{copy.weight.tracker}</h2>
        <div className="grid gap-3">
          <input value={weight} onChange={(event) => setWeight(event.target.value)} type="number" placeholder={copy.weight.weightKg} className={`h-11 rounded-lg border px-3 ${ui.input}`} />
          <input value={date} onChange={(event) => setDate(event.target.value)} type="date" className={`h-11 rounded-lg border px-3 ${ui.input}`} />
          <button type="button" onClick={() => Number(weight) && onAdd(Number(weight), date)} className={`h-11 rounded-lg text-sm font-bold transition ${ui.buttonPrimary}`}>
            {copy.weight.save}
          </button>
          <div className={`mt-3 grid gap-3 border-t pt-4 ${ui.divider}`}>
            <label className="text-sm font-bold">{copy.weight.goal}</label>
            <input value={targetWeight || ""} onChange={(event) => onGoalChange({ targetWeight: Number(event.target.value) || 0 })} type="number" className={`h-11 rounded-lg border px-3 ${ui.input}`} />
            <label className="text-sm font-bold">{copy.weight.targetDate}</label>
            <input value={targetDate} onChange={(event) => onGoalChange({ targetDate: event.target.value })} type="date" className={`h-11 rounded-lg border px-3 ${ui.input}`} />
            <div className="rounded-lg bg-sky-50 p-3 text-sm font-bold text-sky-800">
              {projection?.projected ? `${copy.weight.projection}: ${projection.projected.toFixed(1)} kg - ${projection.label}` : projection?.label}
            </div>
          </div>
        </div>
      </section>
      <section className={`rounded-lg border p-4 shadow-sm sm:p-5 ${ui.card}`}>
        <div className="h-64 sm:h-72">
          <ChartContainer ui={ui}>
            <ReLineChart data={weights}>
              <CartesianGrid strokeDasharray="3 3" stroke={ui.chartGrid} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
            </ReLineChart>
          </ChartContainer>
        </div>
        <div className="mt-4 grid gap-2">
          {weights.map((entry) => (
            <div key={entry.id} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${ui.cardSoft}`}>
              <span className="min-w-0">
                {entry.date} - <b>{entry.weight} kg</b>
              </span>
              <button type="button" onClick={() => onDelete(entry.id)} className={ui.dangerButton}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function WaterPanel({
  consumed,
  goal,
  onGoalChange,
  onAdd,
  entries,
  copy,
  ui,
}: {
  consumed: number;
  goal: number;
  onGoalChange: (goal: number) => void;
  onAdd: (ml: number) => void;
  entries: WaterEntry[];
  copy: WeightCopy;
  ui: WeightUi;
}) {
  const pct = Math.min(100, Math.round((consumed / goal) * 100));
  return (
    <section className={`rounded-lg border p-4 shadow-sm sm:p-5 ${ui.card}`}>
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <h2 className="text-lg font-black">{copy.water.tracker}</h2>
          <input value={goal || ""} onChange={(event) => onGoalChange(Number(event.target.value) || 0)} type="number" className={`h-11 w-full rounded-lg border px-3 ${ui.input}`} />
          <div className="grid grid-cols-3 gap-2">
            {[250, 500, 1000].map((ml) => (
              <button key={ml} type="button" onClick={() => onAdd(ml)} className={`h-11 rounded-lg text-xs font-bold transition sm:text-sm ${ui.buttonAccent}`}>
                {ml === 1000 ? "1L" : `${ml}ml`}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-3 flex items-end justify-between">
            <p className="text-3xl font-black tracking-normal sm:text-4xl">{consumed} ml</p>
            <p className={`font-bold ${ui.muted}`}>{pct}%</p>
          </div>
          <div className={`h-8 overflow-hidden rounded-lg ${ui.progressTrack}`}>
            <div className="h-full bg-sky-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {entries.map((entry) => (
              <span key={entry.id} className="rounded-lg bg-sky-100 px-3 py-1 text-sm font-bold text-sky-800">
                +{entry.ml}ml
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfilesPanel({
  profile,
  updateProfile,
  copy,
  ui,
  onPhoto,
}: {
  profile: Profile;
  updateProfile: (patch: Partial<Profile>) => void;
  copy: WeightCopy;
  ui: WeightUi;
  onPhoto: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <section className={`rounded-lg border p-4 shadow-sm sm:p-5 ${ui.card}`}>
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="mx-auto w-full max-w-56 lg:max-w-none">
          <div className={`flex aspect-square items-center justify-center overflow-hidden rounded-lg ${ui.photoBg}`}>
            {profile.photo ? (
              <Image
                src={profile.photo}
                alt={profile.name}
                width={220}
                height={220}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-16 w-16 text-slate-400" />
            )}
          </div>
          <label className={`mt-3 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm font-bold ${ui.buttonSecondary}`}>
            <Upload className="h-4 w-4" />
            {copy.profiles.photo}
            <input type="file" accept="image/*" onChange={onPhoto} className="sr-only" />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={profile.name} onChange={(event) => updateProfile({ name: event.target.value })} className={`h-11 rounded-lg border px-3 ${ui.input}`} />
          <input
            value={profile.weightName}
            onChange={(event) => updateProfile({ weightName: normalizeWeightName(event.target.value) })}
            placeholder={copy.profiles.mongoName}
            className={`h-11 rounded-lg border px-3 ${ui.input}`}
          />
          <input value={profile.age || ""} onChange={(event) => updateProfile({ age: Number(event.target.value) || 0 })} type="number" placeholder={copy.profiles.age} className={`h-11 rounded-lg border px-3 ${ui.input}`} />
          <input value={profile.height || ""} onChange={(event) => updateProfile({ height: Number(event.target.value) || 0 })} type="number" placeholder={copy.profiles.height} className={`h-11 rounded-lg border px-3 ${ui.input}`} />
          <select value={profile.gender} onChange={(event) => updateProfile({ gender: event.target.value as Gender })} className={`h-11 rounded-lg border px-3 ${ui.input}`}>
            <option value="male">{copy.profiles.genders.male}</option>
            <option value="female">{copy.profiles.genders.female}</option>
            <option value="other">{copy.profiles.genders.other}</option>
          </select>
          <select value={profile.activity} onChange={(event) => updateProfile({ activity: event.target.value as ActivityLevel })} className={`h-11 rounded-lg border px-3 ${ui.input}`}>
            {Object.entries(copy.activity).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select value={profile.goal} onChange={(event) => updateProfile({ goal: event.target.value as Goal })} className={`h-11 rounded-lg border px-3 ${ui.input}`}>
            {Object.entries(copy.goals).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}

function ReportsPanel({
  weeklyData,
  monthlyData,
  weights,
  copy,
  ui,
}: {
  weeklyData: ReportPoint[];
  monthlyData: ReportPoint[];
  weights: WeightEntry[];
  copy: WeightCopy;
  ui: WeightUi;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-2 xl:gap-5">
        <ReportChart title={copy.reports.weekly} data={weeklyData} copy={copy} ui={ui} />
        <ReportChart title={copy.reports.monthly} data={monthlyData} copy={copy} ui={ui} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2 xl:gap-5">
        {weightReportFrames.map((frame) => (
          <WeightReportChart key={frame.key} frame={frame} weights={weights} copy={copy} ui={ui} />
        ))}
      </div>
    </div>
  );
}

type ReportPoint = { date: string; calories: number; protein: number; fat: number; carbs: number; weight?: number };
type WeightFrameKey = "minute" | "day" | "week" | "month";
type WeightReportPoint = { id: string; label: string; weight: number };
type WeightReportFrame = {
  key: WeightFrameKey;
  label: keyof WeightCopy["reports"];
  hours: number;
  intervalMs: number;
  format: (date: Date) => string;
};

const weightReportFrames: WeightReportFrame[] = [
  {
    key: "minute",
    label: "weightMinute",
    hours: 0.25,
    intervalMs: 30 * 1000,
    format: formatReportTime,
  },
  {
    key: "day",
    label: "weightDay",
    hours: 24,
    intervalMs: 60 * 60 * 1000,
    format: formatReportTime,
  },
  {
    key: "week",
    label: "weightWeek",
    hours: 24 * 7,
    intervalMs: 24 * 60 * 60 * 1000,
    format: (date) => date.toISOString().slice(5, 10),
  },
  {
    key: "month",
    label: "weightMonth",
    hours: 24 * 30,
    intervalMs: 24 * 60 * 60 * 1000,
    format: (date) => date.toISOString().slice(5, 10),
  },
];

function formatReportTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function interpolateCopy(text: string, params: Record<string, string | number>) {
  return Object.entries(params).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, String(value)), text);
}

function weightEntryTime(entry: WeightEntry) {
  return new Date(`${entry.date}T12:00:00`).getTime();
}

function getVisibleWeights(entries: WeightEntry[]) {
  const weights = entries.map((entry) => entry.weight).filter(Number.isFinite).sort((a, b) => a - b);

  if (!weights.length) return entries;

  const middle = Math.floor(weights.length / 2);
  const median = weights.length % 2 === 0 ? (weights[middle - 1] + weights[middle]) / 2 : weights[middle];
  const allowedDistance = Math.max(12, median * 0.35);
  return entries.filter((entry) => Math.abs(entry.weight - median) <= allowedDistance);
}

function buildWeightReportData(weights: WeightEntry[], frame: WeightReportFrame) {
  const sorted = [...weights].sort((a, b) => weightEntryTime(a) - weightEntryTime(b));
  const latestTime = sorted.at(-1) ? weightEntryTime(sorted[sorted.length - 1]) : undefined;

  if (!latestTime) return { entries: [] as WeightEntry[], bars: [] as WeightReportPoint[], latestWeight: undefined as number | undefined };

  const startTime = latestTime - frame.hours * 60 * 60 * 1000;
  const visibleEntries = getVisibleWeights(sorted.filter((entry) => weightEntryTime(entry) >= startTime && weightEntryTime(entry) <= latestTime));
  const groups = new Map<number, WeightEntry[]>();

  visibleEntries.forEach((entry) => {
    const time = weightEntryTime(entry);
    const bucket =
      frame.key === "week" || frame.key === "month"
        ? new Date(new Date(time).getFullYear(), new Date(time).getMonth(), new Date(time).getDate()).getTime()
        : Math.floor(time / frame.intervalMs) * frame.intervalMs;
    groups.set(bucket, [...(groups.get(bucket) ?? []), entry]);
  });

  const bars = Array.from(groups.entries())
    .map(([bucket, group]) => {
      const average = group.reduce((total, entry) => total + entry.weight, 0) / group.length;
      return {
        id: `${frame.key}-${bucket}`,
        label: frame.format(new Date(bucket)),
        weight: Number(average.toFixed(2)),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  return { entries: visibleEntries, bars, latestWeight: visibleEntries.at(-1)?.weight };
}

function ReportChart({ title, data, copy, ui }: { title: string; data: ReportPoint[]; copy: WeightCopy; ui: WeightUi }) {
  return (
    <section className={`rounded-lg border p-4 shadow-sm sm:p-5 ${ui.card}`}>
      <h2 className="mb-4 text-lg font-black">{title}</h2>
      <div className="h-64 sm:h-72">
        <ChartContainer ui={ui}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={ui.chartGrid} />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="calories" fill="#0ea5e9" name={copy.reports.calories} />
            <Bar dataKey="protein" fill="#22c55e" name={copy.reports.protein} />
            <Bar dataKey="fat" fill="#f59e0b" name={copy.reports.fat} />
            <Bar dataKey="carbs" fill="#ef4444" name={copy.reports.carbs} />
          </BarChart>
        </ChartContainer>
      </div>
      <div className="mt-6 h-56 sm:h-64">
        <ChartContainer ui={ui}>
          <ReLineChart data={data.filter((item) => item.weight)}>
            <CartesianGrid strokeDasharray="3 3" stroke={ui.chartGrid} />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="weight" stroke="#111827" strokeWidth={3} name={copy.reports.weight} />
          </ReLineChart>
        </ChartContainer>
      </div>
    </section>
  );
}

function WeightReportChart({
  frame,
  weights,
  copy,
  ui,
}: {
  frame: WeightReportFrame;
  weights: WeightEntry[];
  copy: WeightCopy;
  ui: WeightUi;
}) {
  const { entries, bars, latestWeight } = buildWeightReportData(weights, frame);
  const chartMin = bars.length ? Math.max(0, Math.floor((Math.min(...bars.map((item) => item.weight)) - 0.6) * 10) / 10) : 0;
  const chartMax = bars.length ? Math.ceil((Math.max(...bars.map((item) => item.weight)) + 0.6) * 10) / 10 : 100;

  return (
    <section className={`rounded-lg border p-4 shadow-sm sm:p-5 ${ui.card}`}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">{copy.reports[frame.label]}</h2>
          <p className={`mt-1 text-sm font-medium ${ui.muted}`}>
            {interpolateCopy(copy.reports.chartSummary, { bars: bars.length, entries: entries.length })}
          </p>
        </div>
        {latestWeight !== undefined && (
          <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-right">
            <p className="text-xs font-bold uppercase text-sky-600 dark:text-sky-300">{copy.reports.latest}</p>
            <p className="text-lg font-black tabular-nums">{latestWeight.toFixed(2)} kg</p>
          </div>
        )}
      </div>
      <div className={`h-64 rounded-lg border p-2 sm:h-80 sm:p-3 ${ui.cardSoft}`}>
        {bars.length ? (
          <ChartContainer ui={ui}>
            <BarChart data={bars}>
              <CartesianGrid strokeDasharray="3 3" stroke={ui.chartGrid} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis domain={[chartMin, chartMax]} tick={{ fontSize: 12 }} tickFormatter={(value) => `${value} kg`} />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} kg`, copy.reports.weight]} />
              <Bar dataKey="weight" fill="#0ea5e9" name={copy.reports.weight} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className={`flex h-full items-center justify-center text-sm font-bold ${ui.muted}`}>
            {copy.reports.noWeightEntries}
          </div>
        )}
      </div>
    </section>
  );
}

function buildReportData(meals: Meal[], weights: WeightEntry[], profileId: string, profileWeightName: string, days: number): ReportPoint[] {
  const result: ReportPoint[] = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    const dayMeals = meals.filter((meal) => meal.profileId === profileId && meal.date === key);
    const totals = macroTotals(dayMeals);
    const weight = weights.find((entry) => normalizeWeightName(entry.weightName || entry.profileId) === profileWeightName && entry.date === key)?.weight;
    result.push({ date: key.slice(5), ...totals, weight });
  }
  return result;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
