import { redirect } from "next/navigation";
import Link from "next/link";
import { getOperatorFromCookies } from "@/lib/b2b-auth";
import { findBookingsByOperator } from "@/lib/models/booking";
import B2BNav from "@/app/components/b2b/B2BNav";
import BookingsClient from "./BookingsClient";
import { Map } from "lucide-react";

export default async function B2BBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; status?: string }>;
}) {
  const operator = await getOperatorFromCookies();
  if (!operator) redirect("/b2b/login");
  if (operator.status === "pending") redirect("/b2b/pending");

  const { success } = await searchParams;

  const allBookings = await findBookingsByOperator(operator.id);

  const serializable = allBookings.map((b) => ({
    id: b._id?.toString() ?? "",
    tourName: b.tourName,
    clientName: b.clientName,
    clientEmail: b.clientEmail,
    clientPhone: b.clientPhone,
    pax: b.pax,
    date: b.date.toISOString(),
    totalPrice: b.totalPrice,
    commissionAmount: b.commissionAmount,
    status: b.status,
    notes: b.notes,
    createdAt: b.createdAt.toISOString(),
  }));

  return (
    <div>
      <B2BNav operatorName={operator.name} company={operator.company} />

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Command Center</p>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Mis reservas</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {allBookings.length} reserva{allBookings.length !== 1 ? "s" : ""} en total para el canal B2B.
            </p>
          </div>
          <Link
            href="/b2b/tours"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Map className="h-4 w-4" />
            Nueva reserva
          </Link>
        </div>

        <BookingsClient bookings={serializable} showSuccess={success === "1"} />
      </main>
    </div>
  );
}
