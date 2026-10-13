"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BarChart3, CheckCircle2, CreditCard, DollarSign, Home, Loader2, LogIn, LogOut, MousePointerClick, ShieldAlert, ShieldCheck, TrendingUp, UserRound, XCircle } from "lucide-react";

type Operator = {
  _id: string;
  name: string;
  company: string;
  email: string;
  status: "pending" | "approved" | "active";
  commissionRate: number;
  createdAt: string;
};

type AppUser = {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

type Reservation = {
  _id: string;
  name: string | null;
  email: string | null;
  date: string | null;
  tickets: number | null;
  amount: number | null;
  currency: string | null;
  status: string | null;
  tourName: string | null;
  createdAt: string | null;
};

type LoginLog = {
  _id: string;
  userType: "admin" | "operator" | "user";
  emailOrUsername: string;
  device: string;
  ip?: string;
  createdAt: string;
};

type AdminTour = {
  _id?: string;
  slug: string;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  duration: string;
  difficulty: string;
  location: string;
  priceCRC: number;
  retailPricePerPax: number;
  minPax: number;
  maxPax: number;
  includes: string[];
  type: string;
  isActive: boolean;
  isFeatured: boolean;
  currency: string;
};

type B2BSettings = {
  ivaRate: number;
  tourPricing: Array<{ tourId: string; packages: Array<{ id: string; name: string; priceCRC: number }> }>;
};

type BookingAnalyticsEvent = {
  _id: string;
  event:
    | "booking_step"
    | "booking_step_completed"
    | "booking_step_blocked"
    | "booking_step_abandoned"
    | "booking_field_blur"
    | "booking_selection_changed"
    | "booking_submitted"
    | "booking_checkout_started"
    | "payment_order_created"
    | "payment_approved"
    | "payment_error"
    | "booking_completed";
  path: string | null;
  sessionId: string | null;
  happenedAt: string | null;
  createdAt: string | null;
  metadata: {
    step?: string | number;
    stepLabel?: string;
    stage?: string;
    tickets?: number;
    amount?: number;
    currency?: string;
    [key: string]: unknown;
  };
  user: {
    userId?: string | null;
    email?: string | null;
    name?: string | null;
  };
  request: {
    country?: string | null;
    city?: string | null;
    deviceType?: string | null;
    browser?: string | null;
    os?: string | null;
  };
};

type AnalyticsCount = { label: string; count: number };

type ReservationIntent = {
  _id: string;
  event: BookingAnalyticsEvent["event"];
  step: string | number | null;
  stepLabel: string | null;
  stage: string | null;
  happenedAt: string | null;
  path: string | null;
  sessionId: string | null;
  tourSlug: string | null;
  tourName: string | null;
  tourPackage: string | null;
  tourTime: string | null;
  date: string | null;
  tickets: number | null;
  amount: number | null;
  currency: string | null;
  user: BookingAnalyticsEvent["user"];
  request: BookingAnalyticsEvent["request"];
};

type BookingAnalytics = {
  totalEvents: number;
  bookingSteps: number;
  blockedSteps: number;
  abandonedSteps: number;
  fieldIssuesTotal: number;
  selectionChanges: number;
  bookingSubmissions: number;
  checkoutStarts: number;
  paymentOrders: number;
  paymentApprovals: number;
  paymentErrors: number;
  completedBookings: number;
  uniqueSessions: number;
  conversionRate: number;
  completionRate: number;
  paymentApprovalRate: number;
  completedRevenue: number;
  reservationRevenue: number;
  eventCounts: AnalyticsCount[];
  funnel: AnalyticsCount[];
  topTours: AnalyticsCount[];
  topPackages: AnalyticsCount[];
  deviceBreakdown: AnalyticsCount[];
  browserBreakdown: AnalyticsCount[];
  frictionPoints: AnalyticsCount[];
  blockedActions: AnalyticsCount[];
  stepDropoffs: AnalyticsCount[];
  fieldIssues: AnalyticsCount[];
  averageStepSeconds: AnalyticsCount[];
  selectionBreakdown: AnalyticsCount[];
  recentIntents: ReservationIntent[];
  recentEvents: BookingAnalyticsEvent[];
};

type HeroSloganLog = {
  _id: string;
  es: string;
  en: string;
  model: string;
  prompt: string;
  rawResponse: string;
  createdAt: string | null;
};

type ManualReservationForm = {
  name: string;
  email: string;
  phone: string;
  date: string;
  tickets: number;
  tourName: string;
  tourPackage: string;
  tourTime: string;
  amount: string;
  currency: string;
  notes: string;
  paymentMethod: "cash" | "bank_transfer" | "unpaid";
};


const ACCESS_LINKS = [
  { href: "/", label: "Inicio", icon: <Home className="h-4 w-4" />, style: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  { href: "/dashboard", label: "Usuario normal", icon: <UserRound className="h-4 w-4" />, style: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200" },
  { href: "/b2b/login", label: "Login B2B", icon: <ShieldCheck className="h-4 w-4" />, style: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
  { href: "/bots", label: "Grok Army Command", icon: <ShieldAlert className="h-4 w-4" />, style: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300" },
];

const EMPTY_BOOKING_ANALYTICS: BookingAnalytics = {
  totalEvents: 0,
  bookingSteps: 0,
  blockedSteps: 0,
  abandonedSteps: 0,
  fieldIssuesTotal: 0,
  selectionChanges: 0,
  bookingSubmissions: 0,
  checkoutStarts: 0,
  paymentOrders: 0,
  paymentApprovals: 0,
  paymentErrors: 0,
  completedBookings: 0,
  uniqueSessions: 0,
  conversionRate: 0,
  completionRate: 0,
  paymentApprovalRate: 0,
  completedRevenue: 0,
  reservationRevenue: 0,
  eventCounts: [],
  funnel: [],
  topTours: [],
  topPackages: [],
  deviceBreakdown: [],
  browserBreakdown: [],
  frictionPoints: [],
  blockedActions: [],
  stepDropoffs: [],
  fieldIssues: [],
  averageStepSeconds: [],
  selectionBreakdown: [],
  recentIntents: [],
  recentEvents: [],
};

const EVENT_LABELS: Record<BookingAnalyticsEvent["event"], string> = {
  booking_step: "Paso",
  booking_step_completed: "Paso completado",
  booking_step_blocked: "Bloqueo",
  booking_step_abandoned: "Salida de paso",
  booking_field_blur: "Campo revisado",
  booking_selection_changed: "Seleccion",
  booking_submitted: "Reserva enviada",
  booking_checkout_started: "Checkout",
  payment_order_created: "Orden PayPal",
  payment_approved: "Pago aprobado",
  payment_error: "Error pago",
  booking_completed: "Reserva final",
};

function formatMoney(value: number, currency = "USD") {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CRC" ? 0 : 2,
  }).format(value);
}

function formatAnalyticsLabel(label: string) {
  const labels: Record<string, string> = {
    tour_time: "Hora del tour",
    tour_package: "Paquete",
    tour: "Tour",
    tickets: "Tickets",
    name: "Nombre",
    email: "Email",
    phone: "Telefono",
    terms: "Terminos",
    available_package: "Paquete no disponible",
    next_button: "Boton siguiente",
    step_chip: "Click en pasos",
    checkout_button: "Boton checkout",
    disabled_package: "Paquete deshabilitado",
    schedule: "Paso 1: fecha/paquete",
    traveler_details: "Paso 2: datos",
    review: "Paso 3: revision",
  };

  return labels[label] ?? label.replaceAll("_", " ");
}

export default function B2BAdminPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [operators, setOperators] = useState<Operator[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [bookingAnalytics, setBookingAnalytics] = useState<BookingAnalytics>(EMPTY_BOOKING_ANALYTICS);
  const [settings, setSettings] = useState<B2BSettings>({ ivaRate: 13, tourPricing: [] });
  const [pricingJson, setPricingJson] = useState("[]");
  const [heroSlogans, setHeroSlogans] = useState<HeroSloganLog[]>([]);
  const [tours, setTours] = useState<AdminTour[]>([]);
  const [tourJson, setTourJson] = useState("{}");
  const [selectedTourSlug, setSelectedTourSlug] = useState("");
  const [manualReservation, setManualReservation] = useState<ManualReservationForm>({
    name: "",
    email: "",
    phone: "",
    date: "",
    tickets: 1,
    tourName: "",
    tourPackage: "",
    tourTime: "",
    amount: "",
    currency: "CRC",
    notes: "",
    paymentMethod: "unpaid",
  });

  const [loading, setLoading] = useState(false);
  const [initialSessionLoading, setInitialSessionLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [creatingManualReservation, setCreatingManualReservation] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");

  const pendingOperators = useMemo(() => operators.filter((op) => op.status === "pending"), [operators]);
  const approvedOperators = useMemo(() => operators.filter((op) => op.status !== "pending"), [operators]);
  const maxFunnelCount = useMemo(
    () => Math.max(1, ...bookingAnalytics.funnel.map((item) => item.count)),
    [bookingAnalytics.funnel],
  );
  const maxFrictionCount = useMemo(
    () => Math.max(1, ...bookingAnalytics.frictionPoints.map((item) => item.count)),
    [bookingAnalytics.frictionPoints],
  );
  const uniqueHeroSlogans = useMemo(() => {
    const seen = new Set<string>();

    return heroSlogans
      .filter((slogan) => /^(?:claude|gpt-)/i.test(slogan.model ?? ""))
      .filter((slogan) => {
        const key = `${(slogan.es ?? "").trim().toLowerCase()}|${(slogan.en ?? "").trim().toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [heroSlogans]);

  async function fetchAdminData(preferredTourSlug?: string) {
    setLoading(true);
    setRequestError("");
    setRequestSuccess("");

    try {
      const [operatorsRes, insightsRes, settingsRes, toursRes] = await Promise.all([
        fetch("/api/admin/b2b/operators"),
        fetch("/api/admin/b2b/insights"),
        fetch("/api/admin/b2b/settings"),
        fetch("/api/admin/b2b/tours"),
      ]);

      if (operatorsRes.status === 401 || insightsRes.status === 401 || settingsRes.status === 401) {
        setIsLoggedIn(false);
        setOperators([]);
        setReservations([]);
        setBookingAnalytics(EMPTY_BOOKING_ANALYTICS);
        setHeroSlogans([]);
        return;
      }

      const operatorsData = await operatorsRes.json();
      const insightsData = await insightsRes.json();
      const settingsData = await settingsRes.json();
      const toursData = await toursRes.json();

      if (!operatorsRes.ok) {
        setRequestError(operatorsData.error || "No se pudieron cargar los operadores.");
        return;
      }

      setIsLoggedIn(true);
      setOperators(operatorsData.operators || []);
      setUsers(insightsData.users || []);
      setLoginLogs(insightsData.loginLogs || []);
      setReservations(insightsData.reservations || []);
      setBookingAnalytics(
        insightsData.bookingAnalytics ||
          EMPTY_BOOKING_ANALYTICS,
      );
      setHeroSlogans(insightsData.heroSlogans || []);
      const nextSettings = settingsData.settings || { ivaRate: 13, tourPricing: [] };
      setSettings(nextSettings);
      setPricingJson(JSON.stringify(nextSettings.tourPricing || [], null, 2));
      const adminTours = toursData.tours || [];
      setTours(adminTours);
      if (adminTours.length > 0) {
        const nextSelectedTour =
          adminTours.find((tour: AdminTour) => tour.slug === (preferredTourSlug || selectedTourSlug)) ||
          adminTours[0];
        setSelectedTourSlug(nextSelectedTour.slug);
        setTourJson(JSON.stringify(nextSelectedTour, null, 2));
      }
    } catch {
      setRequestError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
      setInitialSessionLoading(false);
    }
  }

  useEffect(() => {
    const loadAdminData = window.setTimeout(() => {
      void fetchAdminData();
    }, 0);

    return () => window.clearTimeout(loadAdminData);
  }, []);

  async function updateStatus(id: string, status: "approved" | "pending") {
    setActionLoadingId(id);
    setRequestError("");

    try {
      const response = await fetch(`/api/admin/b2b/operators/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (response.status === 401) {
        setIsLoggedIn(false);
        setOperators([]);
        setReservations([]);
        setBookingAnalytics(EMPTY_BOOKING_ANALYTICS);
        setHeroSlogans([]);
        return;
      }

      if (!response.ok) {
        setRequestError(data.error || "No se pudo actualizar el estado.");
        return;
      }

      setOperators((current) => current.map((operator) => (operator._id === id ? { ...operator, status } : operator)));
    } catch {
      setRequestError("Error de conexión al actualizar el operador.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    setRequestError("");

    try {
      const parsed = JSON.parse(pricingJson);
      const response = await fetch("/api/admin/b2b/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ivaRate: settings.ivaRate, tourPricing: parsed }),
      });
      const data = await response.json();
      if (!response.ok) {
        setRequestError(data.error || "No se pudo guardar configuración");
        return;
      }
      await fetchAdminData();
    } catch {
      setRequestError("JSON de paquetes inválido.");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleCreateManualReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingManualReservation(true);
    setRequestError("");
    setRequestSuccess("");

    try {
      const response = await fetch("/api/admin/b2b/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manualReservation,
          amount: manualReservation.amount ? Number(manualReservation.amount) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRequestError(data.error || "No se pudo crear la reserva manual.");
        return;
      }

      setRequestSuccess("Reserva manual creada correctamente.");
      setManualReservation({
        name: "",
        email: "",
        phone: "",
        date: "",
        tickets: 1,
        tourName: "",
        tourPackage: "",
        tourTime: "",
        amount: "",
        currency: "CRC",
        notes: "",
        paymentMethod: "unpaid",
      });

      await fetchAdminData();
    } catch {
      setRequestError("Error de conexión al crear la reserva manual.");
    } finally {
      setCreatingManualReservation(false);
    }
  }



  async function handleCreateTour() {
    setRequestError("");
    try {
      const payload = JSON.parse(tourJson);
      const response = await fetch("/api/admin/b2b/tours", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) return setRequestError(data.error || "No se pudo crear tour");
      setRequestSuccess("Tour creado correctamente.");
      await fetchAdminData(String(payload.slug ?? ""));
    } catch { setRequestError("JSON de tour inválido."); }
  }

  async function handleUpdateTour() {
    setRequestError("");
    try {
      const payload = JSON.parse(tourJson);
      if (!selectedTourSlug) return setRequestError("Selecciona un tour.");
      const response = await fetch(`/api/admin/b2b/tours/${selectedTourSlug}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) return setRequestError(data.error || "No se pudo actualizar tour");
      setRequestSuccess("Tour actualizado correctamente.");
      await fetchAdminData(String(data.slug ?? payload.slug ?? selectedTourSlug));
    } catch { setRequestError("JSON de tour inválido."); }
  }

  async function handleDeleteTour() {
    if (!selectedTourSlug) return setRequestError("Selecciona un tour.");
    const response = await fetch(`/api/admin/b2b/tours/${selectedTourSlug}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) return setRequestError(data.error || "No se pudo eliminar tour");
    setRequestSuccess("Tour eliminado.");
    await fetchAdminData();
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error || "Credenciales inválidas.");
        return;
      }
      setIsLoggedIn(true);
      setPassword("");
      await fetchAdminData();
    } catch {
      setAuthError("No se pudo iniciar sesión. Intenta nuevamente.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
    setOperators([]);
    setReservations([]);
  }

  if (initialSessionLoading) return <main className="admin-loading"><p><Loader2 className="h-4 w-4 animate-spin" />Verificando sesión de administrador...</p></main>;

  if (!isLoggedIn) {
    return (
      <main className="admin-login-page">
        <section className="admin-login-card">
          <div className="admin-login-mark"><ShieldCheck className="h-6 w-6" /></div>
          <p className="admin-eyebrow">Acceso interno</p>
          <h1>Admin B2B</h1>
          <p className="admin-muted">Gestiona operadores, precios, reservas y auditoría desde un panel más claro y seguro.</p>
          <div className="admin-login-links">{ACCESS_LINKS.map((link) => <Link key={link.href} href={link.href}>{link.icon}{link.label}</Link>)}</div>
          {authError && <p className="admin-alert admin-alert-error">{authError}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
            <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Usuario" />
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Contraseña" />
            <button type="submit" disabled={authLoading} className="admin-primary-button">{authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}Entrar</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-hero">
        <div className="admin-hero-copy">
          <p className="admin-eyebrow">La Vieja Adventures</p>
          <h1>Dashboard Admin B2B avanzado</h1>
          <p>Gestiona operadores, tours, precios, IVA, reservas y auditoría con una vista más elegante y escaneable.</p>
        </div>
        <div className="admin-hero-stats" aria-label="Resumen administrativo">
          <div><span>{pendingOperators.length}</span><small>Pendientes</small></div>
          <div><span>{approvedOperators.length}</span><small>Operadores</small></div>
          <div><span>{reservations.length}</span><small>Reservas</small></div>
          <div><span>{bookingAnalytics.conversionRate}%</span><small>Conversión</small></div>
        </div>
        <nav className="admin-toolbar" aria-label="Accesos rápidos">
          {ACCESS_LINKS.map((link) => <Link key={link.href} href={link.href}>{link.icon}{link.label}</Link>)}
          <button onClick={handleLogout}><LogOut className="h-4 w-4" />Salir</button>
        </nav>
      </header>

      {requestError && <div className="admin-alert admin-alert-error">{requestError}</div>}
      {requestSuccess && <div className="admin-alert admin-alert-success">{requestSuccess}</div>}

      <section className="grid gap-6 lg:grid-cols-2 mb-6">
        <article className="rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/30 p-6"><h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-amber-900 dark:text-amber-200"><ShieldAlert className="h-5 w-5" />Pendientes ({pendingOperators.length})</h2>{loading ? <p className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300"><Loader2 className="h-4 w-4 animate-spin" />Cargando operadores...</p> : pendingOperators.length === 0 ? <p className="text-sm text-zinc-600 dark:text-zinc-300">No hay operadores pendientes.</p> : <ul className="space-y-3">{pendingOperators.map((operator) => <li key={operator._id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"><p className="font-semibold text-zinc-900">{operator.company}</p><p className="text-sm text-zinc-600 dark:text-zinc-300">{operator.name} · {operator.email}</p><button disabled={actionLoadingId === operator._id} onClick={() => updateStatus(operator._id, "approved")} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">{actionLoadingId === operator._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Aprobar</button></li>)}</ul>}</article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900"><h2 className="mb-4 text-xl font-semibold text-zinc-900">Aprobados / activos ({approvedOperators.length})</h2>{loading ? <p className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300"><Loader2 className="h-4 w-4 animate-spin" />Cargando operadores...</p> : approvedOperators.length === 0 ? <p className="text-sm text-zinc-600 dark:text-zinc-300">No hay operadores aprobados aún.</p> : <ul className="space-y-3">{approvedOperators.map((operator) => <li key={operator._id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800"><p className="font-semibold text-zinc-900">{operator.company}</p><p className="text-sm text-zinc-600 dark:text-zinc-300">{operator.name} · {operator.email}</p><p className="mt-1 text-xs text-zinc-400">Estado: {operator.status}</p><button disabled={actionLoadingId === operator._id} onClick={() => updateStatus(operator._id, "pending")} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 disabled:opacity-60">{actionLoadingId === operator._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}Volver a pendiente</button></li>)}</ul>}</article>
      </section>



      <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold mb-3">CRUD de tours (MongoDB)</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <select value={selectedTourSlug} onChange={(e) => { const slug = e.target.value; setSelectedTourSlug(slug); const found = tours.find((tour) => tour.slug === slug); if (found) setTourJson(JSON.stringify(found, null, 2)); }} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">
            <option value="">Selecciona tour</option>
            {tours.map((tour) => <option key={tour.slug} value={tour.slug}>{tour.slug}</option>)}
          </select>
          <button onClick={handleCreateTour} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Crear</button>
          <div className="flex gap-2">
            <button onClick={handleUpdateTour} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Actualizar</button>
            <button onClick={handleDeleteTour} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">Eliminar</button>
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-500">Incluye campos para B2B: slug, titleEs/titleEn, descriptionEs/descriptionEn, duration, difficulty, location, priceCRC, retailPricePerPax, minPax, maxPax, includes[], type (b2b/both), isActive, isFeatured, currency.</p>
        <textarea value={tourJson} onChange={(e) => setTourJson(e.target.value)} rows={12} className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-mono" />
      </section>

      <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold mb-3">Configuración de paquetes, precios e IVA</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm mb-1">IVA (%)</label>
            <input type="number" min={0} max={100} value={settings.ivaRate} onChange={(e) => setSettings((prev) => ({ ...prev, ivaRate: Number(e.target.value) }))} className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm" />
          </div>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-3">Edita el JSON para definir paquetes por tour. Formato ejemplo en el textarea inferior.</p>
        <textarea value={pricingJson} onChange={(e) => setPricingJson(e.target.value)} rows={8} className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-mono" />
        <button onClick={handleSaveSettings} disabled={savingSettings} className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{savingSettings ? "Guardando..." : "Guardar configuración"}</button>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-4 text-xl font-semibold">Usuarios registrados ({users.length})</h2>
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-sm"><thead><tr className="text-left text-zinc-600 dark:text-zinc-300"><th className="pb-2">Nombre</th><th className="pb-2">Email</th><th className="pb-2">Creado</th></tr></thead><tbody>{users.map((user) => <tr key={user._id} className="border-t border-zinc-200 dark:border-zinc-700"><td className="py-2">{user.name}</td><td className="py-2">{user.email}</td><td className="py-2">{new Date(user.createdAt).toLocaleString("es-CR")}</td></tr>)}</tbody></table>
          </div>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-4 text-xl font-semibold">Logs de acceso ({loginLogs.length})</h2>
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-sm"><thead><tr className="text-left text-zinc-600 dark:text-zinc-300"><th className="pb-2">Tipo</th><th className="pb-2">Usuario</th><th className="pb-2">Device/IP</th><th className="pb-2">Fecha</th></tr></thead><tbody>{loginLogs.map((log) => <tr key={log._id} className="border-t border-zinc-200 dark:border-zinc-700"><td className="py-2">{log.userType}</td><td className="py-2">{log.emailOrUsername}</td><td className="py-2">{log.device}{log.ip ? ` · ${log.ip}` : ""}</td><td className="py-2">{new Date(log.createdAt).toLocaleString("es-CR")}</td></tr>)}</tbody></table>
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="mb-1 text-xl font-semibold">Analytics de reservaciones</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Embudo completo: formulario, checkout, PayPal y reserva final.</p>
          </div>
          <p className="text-xs text-zinc-500">Ultimos {bookingAnalytics.totalEvents} eventos guardados</p>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300"><MousePointerClick className="h-3.5 w-3.5" />Sesiones</p>
            <p className="text-2xl font-semibold">{bookingAnalytics.uniqueSessions}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300"><TrendingUp className="h-3.5 w-3.5" />Enviadas</p>
            <p className="text-2xl font-semibold">{bookingAnalytics.bookingSubmissions}</p>
            <p className="text-xs text-zinc-500">{bookingAnalytics.conversionRate}% de sesion</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300"><CreditCard className="h-3.5 w-3.5" />Checkout</p>
            <p className="text-2xl font-semibold">{bookingAnalytics.checkoutStarts}</p>
            <p className="text-xs text-zinc-500">{bookingAnalytics.paymentOrders} ordenes PayPal</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300"><CheckCircle2 className="h-3.5 w-3.5" />Pagos OK</p>
            <p className="text-2xl font-semibold">{bookingAnalytics.paymentApprovals}</p>
            <p className="text-xs text-zinc-500">{bookingAnalytics.paymentApprovalRate}% aprobacion</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300"><AlertTriangle className="h-3.5 w-3.5" />Errores pago</p>
            <p className="text-2xl font-semibold">{bookingAnalytics.paymentErrors}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300"><DollarSign className="h-3.5 w-3.5" />Revenue web</p>
            <p className="text-2xl font-semibold">{formatMoney(bookingAnalytics.reservationRevenue || bookingAnalytics.completedRevenue, "USD")}</p>
            <p className="text-xs text-zinc-500">{bookingAnalytics.completedBookings} pagos con total</p>
          </div>
        </div>

        <div className="mb-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-800 dark:bg-amber-950/20">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
                <AlertTriangle className="h-4 w-4" />Radar de friccion
              </h3>
              <span className="text-xs text-amber-800 dark:text-amber-200">
                {bookingAnalytics.blockedSteps} bloqueos · {bookingAnalytics.fieldIssuesTotal} campos invalidos
              </span>
            </div>
            <div className="space-y-3">
              {bookingAnalytics.frictionPoints.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-amber-950 dark:text-amber-100">{formatAnalyticsLabel(item.label)}</span>
                    <span className="tabular-nums text-amber-800 dark:text-amber-200">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-amber-200/70 dark:bg-amber-900">
                    <div className="h-2 rounded-full bg-amber-500" style={{ width: `${Math.max(5, (item.count / maxFrictionCount) * 100)}%` }} />
                  </div>
                </div>
              ))}
              {bookingAnalytics.frictionPoints.length === 0 && <p className="text-sm text-amber-800 dark:text-amber-200">Aun no hay friccion registrada con los eventos nuevos.</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <h3 className="mb-3 text-sm font-semibold">Donde se bloquean</h3>
              <ul className="space-y-2 text-sm">
                {bookingAnalytics.blockedActions.map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-3">
                    <span>{formatAnalyticsLabel(item.label)}</span>
                    <span className="font-semibold">{item.count}</span>
                  </li>
                ))}
                {bookingAnalytics.blockedActions.length === 0 && <li className="text-zinc-500">Sin bloqueos todavia.</li>}
              </ul>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <h3 className="mb-3 text-sm font-semibold">Campos con errores</h3>
              <ul className="space-y-2 text-sm">
                {bookingAnalytics.fieldIssues.map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-3">
                    <span>{formatAnalyticsLabel(item.label)}</span>
                    <span className="font-semibold">{item.count}</span>
                  </li>
                ))}
                {bookingAnalytics.fieldIssues.length === 0 && <li className="text-zinc-500">Sin errores de campos.</li>}
              </ul>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold"><BarChart3 className="h-4 w-4" />Embudo</h3>
            <div className="space-y-3">
              {bookingAnalytics.funnel.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">{item.label}</span>
                    <span className="tabular-nums text-zinc-500">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.max(4, (item.count / maxFunnelCount) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <h3 className="mb-3 text-sm font-semibold">Tours pagados</h3>
              <ul className="space-y-2 text-sm">
                {bookingAnalytics.topTours.map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-3">
                    <span className="truncate text-zinc-700 dark:text-zinc-200">{item.label}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">{item.count}</span>
                  </li>
                ))}
                {bookingAnalytics.topTours.length === 0 && <li className="text-zinc-500">Sin datos todavia.</li>}
              </ul>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <h3 className="mb-3 text-sm font-semibold">Paquetes pagados y dispositivos</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <ul className="space-y-2 text-sm">
                  {bookingAnalytics.topPackages.map((item) => (
                    <li key={item.label} className="flex items-center justify-between gap-3"><span>{item.label}</span><span className="font-semibold">{item.count}</span></li>
                  ))}
                  {bookingAnalytics.topPackages.length === 0 && <li className="text-zinc-500">Sin paquetes.</li>}
                </ul>
                <ul className="space-y-2 text-sm">
                  {bookingAnalytics.deviceBreakdown.map((item) => (
                    <li key={item.label} className="flex items-center justify-between gap-3"><span>{item.label}</span><span className="font-semibold">{item.count}</span></li>
                  ))}
                  {bookingAnalytics.deviceBreakdown.length === 0 && <li className="text-zinc-500">Sin dispositivos.</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <h3 className="mb-3 text-sm font-semibold">Salidas por paso</h3>
            <ul className="space-y-2 text-sm">
              {bookingAnalytics.stepDropoffs.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-3">
                  <span>{formatAnalyticsLabel(item.label)}</span>
                  <span className="font-semibold">{item.count}</span>
                </li>
              ))}
              {bookingAnalytics.stepDropoffs.length === 0 && <li className="text-zinc-500">Sin salidas incompletas.</li>}
            </ul>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <h3 className="mb-3 text-sm font-semibold">Tiempo promedio por paso</h3>
            <ul className="space-y-2 text-sm">
              {bookingAnalytics.averageStepSeconds.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-3">
                  <span>{formatAnalyticsLabel(item.label)}</span>
                  <span className="font-semibold">{item.count}s</span>
                </li>
              ))}
              {bookingAnalytics.averageStepSeconds.length === 0 && <li className="text-zinc-500">Sin tiempos todavia.</li>}
            </ul>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <h3 className="mb-3 text-sm font-semibold">Selecciones mas usadas</h3>
            <ul className="space-y-2 text-sm">
              {bookingAnalytics.selectionBreakdown.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-3">
                  <span className="truncate">{formatAnalyticsLabel(item.label)}</span>
                  <span className="font-semibold">{item.count}</span>
                </li>
              ))}
              {bookingAnalytics.selectionBreakdown.length === 0 && <li className="text-zinc-500">Sin selecciones nuevas.</li>}
            </ul>
          </div>
        </div>

        <div className="mt-5 max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-600 dark:text-zinc-300">
                <th className="pb-2">Evento</th>
                <th className="pb-2">Tour</th>
                <th className="pb-2">Fecha/Hora</th>
                <th className="pb-2">Tickets</th>
                <th className="pb-2">Monto</th>
                <th className="pb-2">Usuario</th>
                <th className="pb-2">Dispositivo</th>
                <th className="pb-2">Sesion</th>
                <th className="pb-2">Registrado</th>
              </tr>
            </thead>
            <tbody>
              {bookingAnalytics.recentIntents.map((intent) => (
                <tr key={intent._id} className="border-t border-zinc-200 dark:border-zinc-700">
                  <td className="py-2 font-medium">{EVENT_LABELS[intent.event]}</td>
                  <td className="py-2">
                    <p className="max-w-52 truncate">{intent.tourName || intent.tourSlug || "-"}</p>
                    <p className="text-xs text-zinc-500">{intent.tourPackage || "-"}</p>
                  </td>
                  <td className="py-2">{intent.date || "-"}{intent.tourTime ? ` - ${intent.tourTime}` : ""}</td>
                  <td className="py-2">{intent.tickets ?? "-"}</td>
                  <td className="py-2">{intent.amount != null ? formatMoney(intent.amount, intent.currency || "USD") : "-"}</td>
                  <td className="py-2">{intent.user.email || intent.user.name || "Anonimo"}</td>
                  <td className="py-2">{intent.request.deviceType || "-"} - {intent.request.browser || "-"}</td>
                  <td className="py-2">{intent.sessionId ? intent.sessionId.slice(0, 8) : "-"}</td>
                  <td className="py-2">{intent.happenedAt ? new Date(intent.happenedAt).toLocaleString("es-CR") : "-"}</td>
                </tr>
              ))}
              {bookingAnalytics.recentIntents.length === 0 && (
                <tr>
                  <td className="py-4 text-zinc-600 dark:text-zinc-300" colSpan={9}>Todavia no hay eventos de reservacion.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-1 text-xl font-semibold">Crear reserva manual (sin pago web)</h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">Para clientes que pagan en efectivo o transferencia local fuera del checkout del sitio.</p>

        <form onSubmit={handleCreateManualReservation} className="grid gap-3 md:grid-cols-2">
          <input required value={manualReservation.name} onChange={(event) => setManualReservation((prev) => ({ ...prev, name: event.target.value }))} placeholder="Nombre cliente" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm" />
          <input required type="email" value={manualReservation.email} onChange={(event) => setManualReservation((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email cliente" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm" />
          <input required value={manualReservation.phone} onChange={(event) => setManualReservation((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Teléfono" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm" />
          <input required type="date" value={manualReservation.date} onChange={(event) => setManualReservation((prev) => ({ ...prev, date: event.target.value }))} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm" />
          <input required type="number" min={1} value={manualReservation.tickets} onChange={(event) => setManualReservation((prev) => ({ ...prev, tickets: Number(event.target.value) }))} placeholder="Tickets" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm" />
          <input required value={manualReservation.tourName} onChange={(event) => setManualReservation((prev) => ({ ...prev, tourName: event.target.value }))} placeholder="Nombre del tour" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm" />
          <input value={manualReservation.tourPackage} onChange={(event) => setManualReservation((prev) => ({ ...prev, tourPackage: event.target.value }))} placeholder="Paquete (opcional)" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm" />
          <input value={manualReservation.tourTime} onChange={(event) => setManualReservation((prev) => ({ ...prev, tourTime: event.target.value }))} placeholder="Hora tour (opcional)" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm" />
          <input type="number" min={0} value={manualReservation.amount} onChange={(event) => setManualReservation((prev) => ({ ...prev, amount: event.target.value }))} placeholder="Monto (opcional)" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm" />
          <input value={manualReservation.currency} onChange={(event) => setManualReservation((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))} placeholder="Moneda (CRC, USD)" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm" />
          <select value={manualReservation.paymentMethod} onChange={(event) => setManualReservation((prev) => ({ ...prev, paymentMethod: event.target.value as ManualReservationForm["paymentMethod"] }))} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">
            <option value="unpaid">Sin pago aún</option>
            <option value="bank_transfer">Transferencia local</option>
            <option value="cash">Efectivo</option>
          </select>
          <input value={manualReservation.notes} onChange={(event) => setManualReservation((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Notas (opcional)" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm" />
          <button type="submit" disabled={creatingManualReservation} className="md:col-span-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{creatingManualReservation ? "Guardando..." : "Crear reserva manual"}</button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-xl font-semibold">Reservas de usuarios normales ({reservations.length})</h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">Este panel ahora unifica B2B + usuarios normales para que admin/admin gestione todo en un solo lugar.</p>
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-600 dark:text-zinc-300">
                <th className="pb-2">Cliente</th>
                <th className="pb-2">Tour</th>
                <th className="pb-2">Fecha tour</th>
                <th className="pb-2">Tickets</th>
                <th className="pb-2">Monto</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2">Creada</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation._id} className="border-t border-zinc-200 dark:border-zinc-700">
                  <td className="py-2">
                    <p className="font-medium text-zinc-900">{reservation.name || "Sin nombre"}</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">{reservation.email || "Sin email"}</p>
                  </td>
                  <td className="py-2">{reservation.tourName || "Tour principal"}</td>
                  <td className="py-2">{reservation.date || "Sin fecha"}</td>
                  <td className="py-2">{reservation.tickets ?? "-"}</td>
                  <td className="py-2">
                    {reservation.amount != null
                      ? `${reservation.amount} ${reservation.currency || "USD"}`
                      : "-"}
                  </td>
                  <td className="py-2">{reservation.status || "-"}</td>
                  <td className="py-2">
                    {reservation.createdAt ? new Date(reservation.createdAt).toLocaleString("es-CR") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-1 text-xl font-semibold">Slogans guardados en MongoDB ({uniqueHeroSlogans.length})</h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">Historial de slogans generados con IA en el hero. Los fallbacks y repetidos se ocultan; ya no se guardan nuevos slogans.</p>

        <div className="max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-600 dark:text-zinc-300">
                <th className="pb-2">Fecha</th>
                <th className="pb-2">ES</th>
                <th className="pb-2">EN</th>
                <th className="pb-2">Modelo</th>
              </tr>
            </thead>
            <tbody>
              {uniqueHeroSlogans.map((slogan) => (
                <tr key={slogan._id} className="border-t border-zinc-200 dark:border-zinc-700 align-top">
                  <td className="py-2 whitespace-nowrap">{slogan.createdAt ? new Date(slogan.createdAt).toLocaleString("es-CR") : "-"}</td>
                  <td className="py-2">{slogan.es}</td>
                  <td className="py-2">{slogan.en}</td>
                  <td className="py-2 whitespace-nowrap">{slogan.model || "-"}</td>
                </tr>
              ))}
              {uniqueHeroSlogans.length === 0 && (
                <tr>
                  <td className="py-4 text-zinc-600 dark:text-zinc-300" colSpan={4}>No hay slogans de IA guardados todavía.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="hidden">
        <h2 className="mb-1 text-xl font-semibold">Analytics de reservaciones</h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">Eventos nuevos de analytics para seguir el embudo de reserva e insights de conversión.</p>

        <div className="mb-4 grid gap-3 md:grid-cols-5">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="text-xs text-zinc-600 dark:text-zinc-300">Eventos</p>
            <p className="text-2xl font-semibold">{bookingAnalytics.totalEvents}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="text-xs text-zinc-600 dark:text-zinc-300">Booking steps</p>
            <p className="text-2xl font-semibold">{bookingAnalytics.bookingSteps}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="text-xs text-zinc-600 dark:text-zinc-300">Submissions</p>
            <p className="text-2xl font-semibold">{bookingAnalytics.bookingSubmissions}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="text-xs text-zinc-600 dark:text-zinc-300">Sesiones únicas</p>
            <p className="text-2xl font-semibold">{bookingAnalytics.uniqueSessions}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="text-xs text-zinc-600 dark:text-zinc-300">Conversión / sesión</p>
            <p className="text-2xl font-semibold">{bookingAnalytics.conversionRate}%</p>
          </div>
        </div>

        <div className="max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-600 dark:text-zinc-300">
                <th className="pb-2">Evento</th>
                <th className="pb-2">Paso</th>
                <th className="pb-2">Path</th>
                <th className="pb-2">Usuario</th>
                <th className="pb-2">Dispositivo</th>
                <th className="pb-2">Sesión</th>
                <th className="pb-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {bookingAnalytics.recentEvents.map((event) => (
                <tr key={event._id} className="border-t border-zinc-200 dark:border-zinc-700">
                  <td className="py-2 font-medium">{event.event}</td>
                  <td className="py-2">{typeof event.metadata.step === "string" ? event.metadata.step : "-"}</td>
                  <td className="py-2">{event.path || "-"}</td>
                  <td className="py-2">{event.user.email || event.user.name || "Anónimo"}</td>
                  <td className="py-2">{event.request.deviceType || "-"} · {event.request.browser || "-"}</td>
                  <td className="py-2">{event.sessionId ? event.sessionId.slice(0, 8) : "-"}</td>
                  <td className="py-2">{event.happenedAt ? new Date(event.happenedAt).toLocaleString("es-CR") : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </main>
  );
}
