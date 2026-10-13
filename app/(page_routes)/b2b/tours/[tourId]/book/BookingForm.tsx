"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Tag, Users, CalendarDays } from "lucide-react";
import type { B2BTourWithPackages } from "@/lib/b2b-catalog";
import { getMinBookableIsoDateInCostaRica } from "@/lib/helpers/costa-rica-time";
import { getPackageSchedule, isPackageAvailableOnDate } from "@/lib/tour-packages";

interface BookingFormProps {
  tour: B2BTourWithPackages;
  commissionRate: number;
  commissionPerPax: number;
  ivaRate: number;
}

function formatCRC(amount: number) {
  return `₡${amount.toLocaleString("es-CR")}`;
}

export default function BookingForm({ tour, commissionRate, ivaRate }: BookingFormProps) {
  const router = useRouter();
  const labelClassName =
    "mb-1.5 block text-sm font-semibold text-zinc-800 dark:text-zinc-100";
  const fieldClassName =
    "w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-emerald-400 dark:focus:ring-emerald-900/40";

  const [form, setForm] = useState({
    packageId: tour.packages[0]?.id ?? "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    pax: tour.minPax,
    date: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedPackage = useMemo(
    () => tour.packages.find((pkg) => pkg.id === form.packageId) ?? tour.packages[0],
    [form.packageId, tour.packages]
  );

  const packageAvailabilityLabel = (pkg: B2BTourWithPackages["packages"][number]) => {
    const schedule = getPackageSchedule(pkg);
    if (schedule === "weekday") return "solo lunes-viernes";
    if (schedule === "weekend") return "solo fines de semana";
    return null;
  };

  useEffect(() => {
    if (!form.date || !form.packageId) return;

    const currentPackage = tour.packages.find((pkg) => pkg.id === form.packageId);
    if (!currentPackage || isPackageAvailableOnDate(currentPackage, form.date)) return;

    const nextPackage = tour.packages.find((pkg) => isPackageAvailableOnDate(pkg, form.date));
    setForm((prev) => ({ ...prev, packageId: nextPackage?.id ?? "" }));
  }, [form.date, form.packageId, tour.packages]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "pax" ? Math.max(tour.minPax, Number(value)) : value,
    }));
  }

  const subtotal = (selectedPackage?.priceCRC ?? 0) * form.pax;
  const ivaAmount = Math.round(subtotal * (ivaRate / 100));
  const totalRetail = subtotal + ivaAmount;
  const totalCommission = Math.round(totalRetail * (commissionRate / 100));
  const totalNet = totalRetail - totalCommission;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/b2b/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tourId: tour.id, ...form }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create booking.");
        return;
      }

      router.push(`/b2b/bookings?created=${data.bookingId}`);
    } catch {
      setError("No se pudo crear la reserva.");
    } finally {
      setLoading(false);
    }
  }

  const minBookableDate = getMinBookableIsoDateInCostaRica();

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}

            <div>
              <label htmlFor="packageId" className={labelClassName}>
                Paquete *
              </label>
              <select
                id="packageId"
                name="packageId"
                value={form.packageId}
                onChange={handleChange}
                className={fieldClassName}
              >
                {tour.packages.map((pkg) => {
                  const isAvailable = !form.date || isPackageAvailableOnDate(pkg, form.date);
                  const label = packageAvailabilityLabel(pkg);

                  return (
                    <option key={pkg.id} value={pkg.id} disabled={!isAvailable}>
                      {pkg.name} - {formatCRC(pkg.priceCRC)}{label ? ` (${label})` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label htmlFor="clientName" className={labelClassName}>
                Nombre del cliente *
              </label>
              <input
                id="clientName"
                name="clientName"
                required
                placeholder="Ej. María Fernández"
                value={form.clientName}
                onChange={handleChange}
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="clientEmail" className={labelClassName}>
                Email de contacto *
              </label>
              <input
                id="clientEmail"
                name="clientEmail"
                type="email"
                required
                placeholder="cliente@empresa.com"
                value={form.clientEmail}
                onChange={handleChange}
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="clientPhone" className={labelClassName}>
                Teléfono de contacto *
              </label>
              <input
                id="clientPhone"
                name="clientPhone"
                required
                placeholder="Ej. +506 8888 8888"
                value={form.clientPhone}
                onChange={handleChange}
                className={fieldClassName}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="pax" className={labelClassName}>
                  <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />Cantidad pax *</span>
                </label>
                <input id="pax" name="pax" type="number" required min={tour.minPax} max={tour.maxPax} value={form.pax} onChange={handleChange} className={fieldClassName} />
              </div>
              <div>
                <label htmlFor="date" className={labelClassName}>
                  <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Fecha preferida *</span>
                </label>
                <input id="date" name="date" type="date" required min={minBookableDate} value={form.date} onChange={handleChange} className={fieldClassName} />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className={labelClassName}>
                Notas adicionales
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={form.notes}
                onChange={handleChange}
                className={fieldClassName}
                placeholder="Comparte requisitos especiales, horario deseado o información adicional."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/b2b/tours" className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700">
                <ArrowLeft className="h-4 w-4" />Volver
              </Link>
              <button type="submit" disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                <Send className="h-4 w-4" />{loading ? "Enviando..." : "Confirmar reserva"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="sticky top-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-50">Resumen de precio</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCRC(subtotal)}</span></div>
            <div className="flex justify-between"><span>IVA ({ivaRate}%)</span><span>{formatCRC(ivaAmount)}</span></div>
            <div className="flex justify-between text-emerald-600"><span className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" />Tu comisión ({commissionRate}%)</span><span>+ {formatCRC(totalCommission)}</span></div>
            <div className="border-t pt-2.5 flex justify-between font-bold"><span>Total público</span><span>{formatCRC(totalRetail)}</span></div>
            <div className="flex justify-between text-xs text-zinc-500"><span>Tu precio neto</span><span>{formatCRC(totalNet)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
