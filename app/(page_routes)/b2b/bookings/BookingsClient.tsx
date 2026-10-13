"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Filter, CalendarCheck2 } from "lucide-react";
import { cn } from "@/lib/helpers/utils";

interface Booking {
  id: string;
  tourName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  pax: number;
  date: string;
  totalPrice: number;
  commissionAmount: number;
  status: string;
  notes: string;
  createdAt: string;
}

interface BookingsClientProps {
  bookings: Booking[];
  showSuccess: boolean;
}

type StatusFilter = "all" | "pending" | "confirmed" | "cancelled";
type DateFilter = "all" | "current" | "past";

const STATUS_LABELS: Record<string, string> = {
  all: "Todas",
  pending: "Pendientes",
  confirmed: "Confirmadas",
  cancelled: "Canceladas",
};

const DATE_LABELS: Record<DateFilter, string> = {
  all: "Todas",
  current: "Actuales y futuras",
  past: "Pasadas",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

function formatCRC(amount: number) {
  return `₡${amount.toLocaleString("es-CR")}`;
}

function isPastDate(dateString: string) {
  const bookingDate = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return bookingDate < today;
}

export default function BookingsClient({ bookings, showSuccess }: BookingsClientProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [successVisible, setSuccessVisible] = useState(showSuccess);

  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(() => setSuccessVisible(false), 5000);
      return () => clearTimeout(t);
    }
  }, [showSuccess]);

  const filtered = bookings.filter((booking) => {
    const byStatus = statusFilter === "all" || booking.status === statusFilter;
    const bookingIsPast = isPastDate(booking.date);
    const byDate =
      dateFilter === "all" ||
      (dateFilter === "past" && bookingIsPast) ||
      (dateFilter === "current" && !bookingIsPast);
    return byStatus && byDate;
  });

  const currentBookings = bookings.filter((booking) => !isPastDate(booking.date)).length;
  const pastBookings = bookings.length - currentBookings;

  return (
    <div>
      {successVisible && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ¡Reserva creada exitosamente! Está pendiente de confirmación.
        </div>
      )}

      <div className="mb-4 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/70">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Reservas actuales/futuras</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{currentBookings}</p>
          </div>
          <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/70">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Reservas pasadas</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{pastBookings}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CalendarCheck2 className="h-4 w-4 text-zinc-400" />
          {(Object.keys(DATE_LABELS) as DateFilter[]).map((key) => (
            <button
              key={key}
              onClick={() => setDateFilter(key)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-sm font-medium transition",
                dateFilter === key
                  ? "bg-teal-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              {DATE_LABELS[key]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-400" />
          {(["all", "pending", "confirmed", "cancelled"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-sm font-medium transition",
                statusFilter === s
                  ? "bg-emerald-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-500 dark:text-zinc-400">
            No hay reservas para los filtros seleccionados.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Cliente</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Tour</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Fecha</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Pax</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Total</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Comisión</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((booking) => (
                    <tr key={booking.id} className="border-b border-zinc-50 last:border-0 transition hover:bg-zinc-50/50 dark:border-zinc-800/50 dark:hover:bg-zinc-800/30">
                      <td className="px-5 py-4">
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">{booking.clientName}</p>
                        <p className="text-xs text-zinc-400">{booking.clientEmail}</p>
                      </td>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">{booking.tourName.split("–")[0].trim()}</td>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">{new Date(booking.date).toLocaleDateString("es-CR")}</td>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">{booking.pax}</td>
                      <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-zinc-50">{formatCRC(booking.totalPrice)}</td>
                      <td className="px-5 py-4 font-semibold text-emerald-600 dark:text-emerald-400">{formatCRC(booking.commissionAmount)}</td>
                      <td className="px-5 py-4">
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_BADGE[booking.status] || STATUS_BADGE.pending)}>
                          {booking.status === "pending" ? "Pendiente" : booking.status === "confirmed" ? "Confirmada" : "Cancelada"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map((booking) => (
              <div key={booking.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{booking.clientName}</p>
                    <p className="text-xs text-zinc-400">{booking.clientEmail}</p>
                  </div>
                  <span className={cn("flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_BADGE[booking.status] || STATUS_BADGE.pending)}>
                    {booking.status === "pending" ? "Pendiente" : booking.status === "confirmed" ? "Confirmada" : "Cancelada"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-zinc-400">Tour</p>
                    <p className="text-zinc-700 dark:text-zinc-300">{booking.tourName.split("–")[0].trim()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Fecha</p>
                    <p className="text-zinc-700 dark:text-zinc-300">{new Date(booking.date).toLocaleDateString("es-CR")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Pax / Total</p>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{booking.pax} pax · {formatCRC(booking.totalPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Tu comisión</p>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCRC(booking.commissionAmount)}</p>
                  </div>
                </div>
                {booking.notes && (
                  <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{booking.notes}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
