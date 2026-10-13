"use client";

import DynamicHeroHeader from "@/app/components/sections/DynamicHeroHeader";
import Link from "next/link";
import {
    ArrowRight,
    Bell,
    Building2,
    CalendarClock,
    CalendarDays,
    Compass,
    Home,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    Sparkles,
    User,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useSession, signIn } from "next-auth/react";
import LogoutButton from "@/app/components/auth/LogoutButton";
import Profile from "@/app/components/auth/Profile";
import type { UserPreferences } from "@/lib/types/index";
import { DEFAULT_USER_PREFERENCES } from "@/lib/constants/user";
import { isUpcoming } from "@/lib/helpers/utils";

type Booking = {
    id: string;
    orderId: string | null;
    date: string | null;
    tourTime: string | null;
    tourPackage: string | null;
    tourSlug: string | null;
    tourName: string | null;
    tickets: number | null;
    amount: number | null;
    currency: string | null;
    status: string | null;
    createdAt: string | null;
};

const PACKAGE_LABELS: Record<string, { es: string; en: string }> = {
    basic: { es: "Tour Básico", en: "Basic Tour" },
    "full-day": { es: "Tour Día Completo", en: "Full-Day Tour" },
    private: { es: "Tour Privado", en: "Private Tour" },
};

const DASHBOARD_LINKS = [
    { href: "/", es: "Ir al inicio", en: "Go to home", icon: Home, style: "from-emerald-500 to-emerald-600" },
    { href: "/dashboard", es: "Dashboard usuario", en: "User dashboard", icon: User, style: "from-zinc-700 to-zinc-900" },
    { href: "/booking", es: "Reservar tour", en: "Book tour", icon: CalendarDays, style: "from-teal-500 to-cyan-600" },
    { href: "/tours", es: "Ver tours", en: "View tours", icon: Compass, style: "from-purple-500 to-indigo-600" },
    { href: "/b2b/login", es: "Login B2B", en: "B2B login", icon: Building2, style: "from-amber-500 to-orange-600" },
    { href: "/b2b/admin", es: "Admin B2B", en: "B2B admin", icon: ShieldCheck, style: "from-indigo-500 to-violet-700" },
];

export default function DashboardPage() {
    const { lang } = useLanguage();
    const { data: session, status } = useSession();
    const user = session?.user;
    const isLoading = status === "loading";
    const [bookings, setBookings] = useState<Booking[] | null>(null);
    const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
    const [savingPreferences, setSavingPreferences] = useState(false);
    const [preferencesStatus, setPreferencesStatus] = useState<"idle" | "saved" | "error">("idle");
    const [activeBookingTab, setActiveBookingTab] = useState<"upcoming" | "past">("upcoming");

    useEffect(() => {
        if (!user) return;

        let cancelled = false;

        fetch("/api/bookings")
            .then((res) => res.json())
            .then((data) => {
                if (!cancelled) setBookings(data.bookings ?? []);
            })
            .catch(() => {
                if (!cancelled) setBookings([]);
            });

        fetch("/api/user/preferences")
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                const nextPreferences = data.preferences ?? DEFAULT_USER_PREFERENCES;
                setPreferences(nextPreferences);
                setActiveBookingTab(nextPreferences.dashboard.defaultBookingTab);
            })
            .catch(() => {
                if (!cancelled) {
                    setPreferences(DEFAULT_USER_PREFERENCES);
                    setActiveBookingTab(DEFAULT_USER_PREFERENCES.dashboard.defaultBookingTab);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [user]);

    const updatePreferences = async (nextPreferences: UserPreferences) => {
        setPreferences(nextPreferences);
        setSavingPreferences(true);
        setPreferencesStatus("idle");

        try {
            const response = await fetch("/api/user/preferences", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(nextPreferences),
            });

            if (!response.ok) {
                throw new Error("Failed to save preferences");
            }

            const data = await response.json();
            setPreferences(data.preferences ?? nextPreferences);
            setPreferencesStatus("saved");
        } catch {
            setPreferencesStatus("error");
        } finally {
            setSavingPreferences(false);
        }
    };

    const bookingsLoading = Boolean(user) && bookings === null;
    const safeBookings = bookings ?? [];
    const upcomingBookings = safeBookings.filter((b) => isUpcoming(b.date));
    const pastBookings = safeBookings.filter((b) => !isUpcoming(b.date));

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen text-zinc-700 dark:text-zinc-300">
                {lang === "es" ? "Cargando..." : "Loading..."}
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-zinc-50 to-white px-4 py-10 dark:from-black dark:via-zinc-950 dark:to-zinc-900">
            <DynamicHeroHeader showHeroSlider={false} />

            <div className="mx-auto w-full max-w-6xl space-y-6">
                {!user ? (
                    <section className="rounded-3xl border border-emerald-100 bg-white/90 p-8 shadow-xl backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90 md:p-10">
                        <div className="text-center space-y-4">
                            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white md:text-4xl">
                                {lang === "es" ? "Inicia sesión en tu dashboard" : "Log in to your dashboard"}
                            </h1>
                            <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                                {lang === "es"
                                    ? "Accede para ver tus reservas, perfil y más."
                                    : "Access to view your bookings, profile, and more."}
                            </p>
                            <button
                                onClick={() => signIn(undefined, { callbackUrl: "/dashboard" })}
                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-800/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-800/30 active:translate-y-0 active:scale-[0.99]"
                            >
                                {lang === "es" ? "Iniciar sesión" : "Log In"}
                            </button>
                        </div>
                    </section>
                ) : (
                    <>
                        <section className="rounded-3xl border border-emerald-100 bg-white/90 p-8 shadow-xl backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90 md:p-10">
                            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                                <div className="max-w-3xl space-y-4">
                                    <p className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-sm font-semibold text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-900/20 dark:text-emerald-300">
                                        <Sparkles size={16} />
                                        {lang === "es" ? "Bienvenido de vuelta" : "Welcome back"}
                                    </p>
                                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white md:text-4xl">
                                        {lang === "es" ? "Tu Dashboard de Tours" : "Your Tours Dashboard"}
                                    </h1>
                                </div>
                                <div className="grid w-full gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900 md:max-w-xs">
                                    <Link
                                        href="/booking"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-emerald-800/20 transition hover:bg-emerald-700"
                                    >
                                        {lang === "es" ? "Reservar Nuevo Tour" : "Book New Tour"}
                                        <ArrowRight size={16} />
                                    </Link>
                                    <LogoutButton />
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
                            <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                                <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-zinc-900 dark:text-white">
                                    <Bell size={20} className="text-emerald-600" />
                                    {lang === "es" ? "Notificaciones y opciones" : "Notifications & options"}
                                </h2>
                                <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
                                    <label className="flex items-center justify-between gap-3">
                                        <span>{lang === "es" ? "Notificaciones por email" : "Email notifications"}</span>
                                        <input type="checkbox" checked={preferences.notifications.emailEnabled} onChange={(e) => updatePreferences({ ...preferences, notifications: { ...preferences.notifications, emailEnabled: e.target.checked } })} />
                                    </label>
                                    <label className="flex items-center justify-between gap-3">
                                        <span>{lang === "es" ? "Recordatorios de reservas" : "Booking reminders"}</span>
                                        <input type="checkbox" checked={preferences.notifications.bookingReminders} disabled={!preferences.notifications.emailEnabled} onChange={(e) => updatePreferences({ ...preferences, notifications: { ...preferences.notifications, bookingReminders: e.target.checked } })} />
                                    </label>
                                    <label className="flex items-center justify-between gap-3">
                                        <span>{lang === "es" ? "Promociones" : "Promotions"}</span>
                                        <input type="checkbox" checked={preferences.notifications.promotions} disabled={!preferences.notifications.emailEnabled} onChange={(e) => updatePreferences({ ...preferences, notifications: { ...preferences.notifications, promotions: e.target.checked } })} />
                                    </label>
                                    <label className="flex items-center justify-between gap-3">
                                        <span>{lang === "es" ? "Resumen semanal" : "Weekly summary"}</span>
                                        <input type="checkbox" checked={preferences.notifications.weeklySummary} disabled={!preferences.notifications.emailEnabled} onChange={(e) => updatePreferences({ ...preferences, notifications: { ...preferences.notifications, weeklySummary: e.target.checked } })} />
                                    </label>
                                    <hr className="border-zinc-200 dark:border-zinc-800" />
                                    <label className="flex items-center justify-between gap-3">
                                        <span>{lang === "es" ? "Vista compacta" : "Compact view"}</span>
                                        <input type="checkbox" checked={preferences.dashboard.compactView} onChange={(e) => updatePreferences({ ...preferences, dashboard: { ...preferences.dashboard, compactView: e.target.checked } })} />
                                    </label>
                                    <label className="flex items-center justify-between gap-3">
                                        <span>{lang === "es" ? "Mostrar tarjeta de soporte" : "Show support card"}</span>
                                        <input type="checkbox" checked={preferences.dashboard.showSupportCard} onChange={(e) => updatePreferences({ ...preferences, dashboard: { ...preferences.dashboard, showSupportCard: e.target.checked } })} />
                                    </label>
                                    <label className="flex items-center justify-between gap-3">
                                        <span>{lang === "es" ? "Pestaña inicial de reservas" : "Default bookings tab"}</span>
                                        <select
                                            className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                                            value={preferences.dashboard.defaultBookingTab}
                                            onChange={(e) => {
                                                const next = e.target.value as "upcoming" | "past";
                                                setActiveBookingTab(next);
                                                updatePreferences({ ...preferences, dashboard: { ...preferences.dashboard, defaultBookingTab: next } });
                                            }}
                                        >
                                            <option value="upcoming">{lang === "es" ? "Próximas" : "Upcoming"}</option>
                                            <option value="past">{lang === "es" ? "Pasadas" : "Past"}</option>
                                        </select>
                                    </label>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {savingPreferences
                                            ? (lang === "es" ? "Guardando preferencias..." : "Saving preferences...")
                                            : preferencesStatus === "saved"
                                            ? (lang === "es" ? "Preferencias guardadas." : "Preferences saved.")
                                            : preferencesStatus === "error"
                                            ? (lang === "es" ? "Error al guardar preferencias." : "Failed to save preferences.")
                                            : ""}
                                    </p>
                                </div>
                            </article>

                            <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                                <h2 className="mb-3 text-2xl font-semibold text-zinc-900 dark:text-white">
                                    {lang === "es" ? "Accesos rápidos" : "Quick links"}
                                </h2>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {DASHBOARD_LINKS.map((link) => {
                                        const Icon = link.icon;
                                        return (
                                            <Link key={link.href} href={link.href} className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${link.style} px-4 py-4 text-white shadow-lg shadow-zinc-900/10 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl`}>
                                                <span className="flex items-center gap-2 text-sm font-semibold"><Icon size={16} />{lang === "es" ? link.es : link.en}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </article>
                        </section>

                        <section className="grid gap-6 md:grid-cols-2">
                            <article className={`rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 ${preferences.dashboard.compactView ? "p-4" : "p-6"}`}>
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="flex items-center gap-2 text-2xl font-semibold text-zinc-900 dark:text-white">
                                        <CalendarDays size={20} className="text-emerald-600" />
                                        {lang === "es" ? "Reservas Próximas" : "Upcoming Bookings"}
                                    </h2>
                                    <button className="text-xs underline" onClick={() => setActiveBookingTab("upcoming")}>{lang === "es" ? "Ver" : "Show"}</button>
                                </div>
                                {activeBookingTab === "upcoming" && (bookingsLoading ? <p>{lang === "es" ? "Cargando..." : "Loading..."}</p> : <ul className="space-y-3 text-zinc-700 dark:text-zinc-300">{upcomingBookings.map((booking) => <li key={booking.id} className="flex flex-col gap-1 border-b border-zinc-200 pb-2 last:border-b-0 dark:border-zinc-800"><span className="font-semibold">{booking.tourName ? booking.tourName : booking.tourPackage ? (PACKAGE_LABELS[booking.tourPackage]?.[lang] ?? booking.tourPackage) : (lang === "es" ? "Tour Ciudad Esmeralda" : "Ciudad Esmeralda Tour")}</span><span className="text-sm">{booking.date}{booking.tourTime ? ` — ${booking.tourTime}` : ""}</span><span className="text-sm">{lang === "es" ? "Boletos:" : "Tickets:"} {booking.tickets ?? "—"}</span></li>)}{upcomingBookings.length === 0 && <p>{lang === "es" ? "No hay reservas próximas." : "No upcoming bookings."}</p>}</ul>)}
                            </article>

                            <article className={`rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 ${preferences.dashboard.compactView ? "p-4" : "p-6"}`}>
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="flex items-center gap-2 text-2xl font-semibold text-zinc-900 dark:text-white">
                                        <CalendarClock size={20} className="text-emerald-600" />
                                        {lang === "es" ? "Reservas Pasadas" : "Past Bookings"}
                                    </h2>
                                    <button className="text-xs underline" onClick={() => setActiveBookingTab("past")}>{lang === "es" ? "Ver" : "Show"}</button>
                                </div>
                                {activeBookingTab === "past" && (bookingsLoading ? <p>{lang === "es" ? "Cargando..." : "Loading..."}</p> : <ul className="space-y-3 text-zinc-700 dark:text-zinc-300">{pastBookings.map((booking) => <li key={booking.id} className="flex flex-col gap-1 border-b border-zinc-200 pb-2 last:border-b-0 dark:border-zinc-800"><span className="font-semibold">{booking.tourName ? booking.tourName : booking.tourPackage ? (PACKAGE_LABELS[booking.tourPackage]?.[lang] ?? booking.tourPackage) : (lang === "es" ? "Tour Ciudad Esmeralda" : "Ciudad Esmeralda Tour")}</span><span className="text-sm">{booking.date}{booking.tourTime ? ` — ${booking.tourTime}` : ""}</span><span className="text-sm">{lang === "es" ? "Boletos:" : "Tickets:"} {booking.tickets ?? "—"}</span></li>)}{pastBookings.length === 0 && <p>{lang === "es" ? "No hay reservas pasadas." : "No past bookings."}</p>}</ul>)}
                            </article>
                        </section>

                        <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
                            <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                                <h2 className="mb-5 flex items-center gap-2 text-2xl font-semibold text-zinc-900 dark:text-white">
                                    <User size={20} className="text-emerald-600" />
                                    {lang === "es" ? "Tu Perfil" : "Your Profile"}
                                </h2>
                                <Profile />
                            </article>

                            {preferences.dashboard.showSupportCard && (
                                <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                                    <h2 className="mb-3 text-2xl font-semibold text-zinc-900 dark:text-white">
                                        {lang === "es" ? "Contacto y Soporte" : "Contact & Support"}
                                    </h2>
                                    <ul className="mb-6 space-y-2 text-zinc-700 dark:text-zinc-300">
                                        <li className="flex items-start gap-2"><Phone size={16} className="mt-1 text-emerald-600" /><span><strong>{lang === "es" ? "Teléfono:" : "Phone:"}</strong> +506 8643-0807</span></li>
                                        <li className="flex items-start gap-2"><Mail size={16} className="mt-1 text-emerald-600" /><span><strong>{lang === "es" ? "Email:" : "Email:"}</strong> ciudadesmeraldacr@gmail.com</span></li>
                                        <li className="flex items-start gap-2"><MapPin size={16} className="mt-1 text-emerald-600" /><span><strong>{lang === "es" ? "Ubicación:" : "Location:"}</strong> {lang === "es" ? "Zona Norte, Costa Rica" : "Northern Zone, Costa Rica"}</span></li>
                                    </ul>
                                </article>
                            )}
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}
