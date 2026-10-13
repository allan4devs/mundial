import { redirect } from "next/navigation";
import Link from "next/link";
import { getOperatorFromCookies } from "@/lib/b2b-auth";
import { findBookingsByOperator } from "@/lib/models/booking";
import B2BNav from "@/app/components/b2b/B2BNav";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Globe,
  Handshake,
  Map,
  Sparkles,
  Users,
  UtensilsCrossed,
  BusFront,
  XCircle,
} from "lucide-react";

function formatCRC(amount: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:
      "bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800",
    confirmed:
      "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800",
    cancelled:
      "bg-rose-100 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-800",
  };

  const labels: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || styles.pending}`}
    >
      {labels[status] || status}
    </span>
  );
}

export default async function B2BDashboardPage() {
  const operator = await getOperatorFromCookies();
  if (!operator) redirect("/b2b/login");
  if (operator.status === "pending") redirect("/b2b/pending");

  const allBookings = await findBookingsByOperator(operator.id);

  const pending = allBookings.filter((b) => b.status === "pending").length;
  const confirmed = allBookings.filter((b) => b.status === "confirmed").length;
  const cancelled = allBookings.filter((b) => b.status === "cancelled").length;
  const totalCommission = allBookings
    .filter((b) => b.status !== "cancelled")
    .reduce((acc, booking) => acc + booking.commissionAmount, 0);
  const totalSales = allBookings
    .filter((b) => b.status !== "cancelled")
    .reduce((acc, booking) => acc + booking.totalPrice, 0);
  const avgTicket = allBookings.length > 0 ? totalSales / allBookings.length : 0;
  const conversionRate = allBookings.length > 0 ? (confirmed / allBookings.length) * 100 : 0;
  const cancellationRate = allBookings.length > 0 ? (cancelled / allBookings.length) * 100 : 0;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const currentAndUpcoming = allBookings.filter((booking) => new Date(booking.date) >= startOfToday).length;
  const pastBookings = allBookings.length - currentAndUpcoming;

  const monthFormatter = new Intl.DateTimeFormat("es-CR", { month: "short" });
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = monthFormatter.format(monthDate);
    const count = allBookings.filter((booking) => {
      const bookingDate = new Date(booking.createdAt);
      return (
        bookingDate.getFullYear() === monthDate.getFullYear() &&
        bookingDate.getMonth() === monthDate.getMonth()
      );
    }).length;

    return { label: label.charAt(0).toUpperCase() + label.slice(1), count };
  });

  const peakMonth = monthlyData.reduce(
    (top, current) => (current.count > top.count ? current : top),
    monthlyData[0] || { label: "-", count: 0 }
  );

  const maxMonthlyCount = Math.max(...monthlyData.map((item) => item.count), 1);

  return (
    <div className="min-h-screen bg-zinc-50/80 dark:bg-zinc-950">
      <B2BNav operatorName={operator.name} company={operator.company} />

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 p-6 text-white shadow-xl shadow-emerald-900/20 md:p-8">
          <div className="absolute -right-16 -top-14 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 left-20 h-56 w-56 rounded-full bg-teal-200/20 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-100">
                <Sparkles className="h-3.5 w-3.5" />
                Ciudad Esmeralda · La Vieja Adventures
              </p>
              <h1 className="mt-3 text-2xl font-bold md:text-4xl">Centro de operaciones B2B global</h1>
              <p className="mt-2 max-w-2xl text-sm text-emerald-50 md:text-base">
                Administra reservas, seguimiento comercial y crecimiento de aliados para nuestros tours en el Cañón del Río La Vieja desde un solo panel.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs md:text-sm">
                <span className="rounded-full bg-white/15 px-3 py-1 font-medium">Operador: {operator.name}</span>
                <span className="rounded-full bg-white/15 px-3 py-1 font-medium">Empresa: {operator.company}</span>
                <span className="rounded-full bg-white/15 px-3 py-1 font-medium">Comisión: {operator.commissionRate}%</span>
              </div>
            </div>
            <div className="grid gap-2 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-100">Acciones clave</p>
              <Link
                href="/b2b/tours"
                className="inline-flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Nueva reserva
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/b2b/bookings"
                className="inline-flex items-center justify-between rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
              >
                Revisar operación completa
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            {
              title: "Reservas totales",
              value: allBookings.length,
              icon: CalendarCheck,
              accent: "text-sky-600",
            },
            { title: "Pendientes", value: pending, icon: Clock3, accent: "text-amber-500" },
            {
              title: "Confirmadas",
              value: confirmed,
              icon: CheckCircle2,
              accent: "text-emerald-600",
            },
            {
              title: "Comisión acumulada",
              value: formatCRC(totalCommission),
              icon: CircleDollarSign,
              accent: "text-violet-600",
            },
            {
              title: "Venta total",
              value: formatCRC(totalSales),
              icon: BriefcaseBusiness,
              accent: "text-blue-600",
            },
          ].map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {card.title}
                </p>
                <card.icon className={`h-5 w-5 ${card.accent}`} />
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{card.value}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Desempeño en los últimos 6 meses</h2>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pico: {peakMonth.label}</span>
            </div>
            <div className="grid grid-cols-6 items-end gap-3">
              {monthlyData.map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-2">
                  <div className="flex h-40 w-full items-end rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-emerald-600 to-teal-400"
                      style={{ height: `${Math.max((item.count / maxMonthlyCount) * 100, item.count > 0 ? 12 : 4)}%` }}
                    />
                  </div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{item.label}</p>
                  <p className="text-xs text-zinc-400">{item.count}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Salud del negocio</h2>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Conversión a confirmadas</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{formatPercent(conversionRate)}</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Tasa de cancelación</p>
                <p className="mt-1 text-2xl font-bold text-rose-600">{formatPercent(cancellationRate)}</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Ticket promedio</p>
                <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{formatCRC(avgTicket)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Reservas actuales</p>
                  <p className="mt-1 text-2xl font-bold text-teal-600">{currentAndUpcoming}</p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Reservas pasadas</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{pastBookings}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  <Globe className="h-3.5 w-3.5" /> Operación global
                </p>
                <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-200/80">
                  Mantén estándares altos de respuesta para agencias internacionales y viajeros corporativos.
                </p>
              </div>
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Servicios interconectados</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Conecta la reserva con turoperadores aliados, alimentación y transporte para operación integral.</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">Hub B2B activo</span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              {
                title: "Red de Touroperadores",
                icon: Handshake,
                count: Math.max(3, confirmed),
                desc: "Sincroniza disponibilidad y cupos por agencia.",
                accent: "text-indigo-600",
              },
              {
                title: "Food Partners",
                icon: UtensilsCrossed,
                count: Math.max(2, pending),
                desc: "Coordina menús y restricciones alimentarias.",
                accent: "text-orange-600",
              },
              {
                title: "Transport Partners",
                icon: BusFront,
                count: Math.max(2, currentAndUpcoming),
                desc: "Programa traslados según fecha y PAX.",
                accent: "text-sky-600",
              },
            ].map((service) => (
              <article key={service.title} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-700">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{service.title}</p>
                  <service.icon className={`h-4 w-4 ${service.accent}`} />
                </div>
                <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{service.count}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{service.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Todas las reservas</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Control operacional completo del canal B2B.</p>
            </div>
            <Link
              href="/b2b/tours"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Map className="h-4 w-4" />
              Nueva reserva
            </Link>
          </div>

          {allBookings.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <Users className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-700" />
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Aún no hay reservas registradas en tu canal B2B.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-800/40">
                    {[
                      "Cliente",
                      "Tour",
                      "Fecha tour",
                      "Reservada",
                      "PAX",
                      "Venta",
                      "Comisión",
                      "Estado",
                    ].map((head) => (
                      <th
                        key={head}
                        className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allBookings.map((booking) => (
                    <tr
                      key={booking._id?.toString()}
                      className="border-b border-zinc-100/80 last:border-0 hover:bg-zinc-50/70 dark:border-zinc-800/70 dark:hover:bg-zinc-800/30"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{booking.clientName}</p>
                        <p className="text-xs text-zinc-500">{booking.clientEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{booking.tourName}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {new Date(booking.date).toLocaleDateString("es-CR")}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {new Date(booking.createdAt).toLocaleDateString("es-CR")}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{booking.pax}</td>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{formatCRC(booking.totalPrice)}</td>
                      <td className="px-4 py-3 text-violet-700 dark:text-violet-300">{formatCRC(booking.commissionAmount)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={booking.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid gap-3 border-t border-zinc-100 px-6 py-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 sm:grid-cols-3">
            <p className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 text-amber-500" /> Pendientes: {pending}
            </p>
            <p className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Confirmadas: {confirmed}
            </p>
            <p className="inline-flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5 text-rose-500" /> Canceladas: {cancelled}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
