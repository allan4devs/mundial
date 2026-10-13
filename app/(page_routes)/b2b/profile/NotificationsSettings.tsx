"use client";

import { useState } from "react";
import { BellRing, Loader2, MailCheck } from "lucide-react";

interface Preferences {
  bookingCreated: boolean;
  bookingReminder24h: boolean;
  bookingStatusChanges: boolean;
  weeklyPerformanceDigest: boolean;
  partnerNetworkUpdates: boolean;
}

export default function NotificationsSettings({
  initialPreferences,
}: {
  initialPreferences: Preferences;
}) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function savePreferences() {
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/b2b/profile/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    });

    setSaving(false);

    if (!res.ok) {
      setMessage("No se pudieron guardar los cambios.");
      return;
    }

    setMessage("Preferencias de email guardadas correctamente.");
  }

  const options: Array<{ key: keyof Preferences; label: string; description: string }> = [
    {
      key: "bookingCreated",
      label: "Nueva reserva creada",
      description: "Recibe un email cada vez que se genere una reserva B2B.",
    },
    {
      key: "bookingReminder24h",
      label: "Recordatorio 24 horas antes",
      description: "Aviso previo al tour para coordinar operación y logística.",
    },
    {
      key: "bookingStatusChanges",
      label: "Cambios de estado",
      description: "Notificaciones cuando una reserva pase a confirmada o cancelada.",
    },
    {
      key: "weeklyPerformanceDigest",
      label: "Resumen semanal",
      description: "Métricas semanales de ventas, conversión y comisión.",
    },
    {
      key: "partnerNetworkUpdates",
      label: "Actualizaciones de red de partners",
      description: "Novedades de alianzas con operadores, alimentación y transporte.",
    },
  ];

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            <BellRing className="h-4 w-4" />
            Perfil · Notificaciones
          </p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Preferencias de email</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Activa o desactiva las comunicaciones de operación y negocio.</p>
        </div>
      </div>

      <div className="space-y-3">
        {options.map((option) => (
          <label key={option.key} className="flex items-start gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-700">
            <input
              type="checkbox"
              checked={preferences[option.key]}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  [option.key]: e.target.checked,
                }))
              }
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{option.label}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{option.description}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
          Guardar preferencias
        </button>
        {message && <p className="text-sm text-zinc-600 dark:text-zinc-300">{message}</p>}
      </div>
    </section>
  );
}
