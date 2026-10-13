import { redirect } from "next/navigation";
import Link from "next/link";
import { getOperatorFromCookies } from "@/lib/b2b-auth";
import B2BNav from "@/app/components/b2b/B2BNav";
import { Clock, Users, MapPin, ArrowRight, Tag } from "lucide-react";
import { getB2BCatalog } from "@/lib/b2b-catalog";

function formatCRC(amount: number) {
  return `₡${amount.toLocaleString("es-CR")}`;
}

export default async function B2BToursPage() {
  const operator = await getOperatorFromCookies();
  if (!operator) redirect("/b2b/login");
  if (operator.status === "pending") redirect("/b2b/pending");

  const commissionRate = operator.commissionRate;
  const { tours, ivaRate } = await getB2BCatalog();

  const toursWithPricing = tours.map((tour) => ({
    ...tour,
    commissionPerPax: Math.round(tour.retailPricePerPax * (commissionRate / 100)),
    netPricePerPax: Math.round(tour.retailPricePerPax * (1 - commissionRate / 100)),
  }));

  return (
    <div>
      <B2BNav operatorName={operator.name} company={operator.company} />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Catálogo de tours</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Precios de venta + IVA ({ivaRate}%) + tu comisión del {commissionRate}%</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {toursWithPricing.map((tour) => (
            <div key={tour.id} className="rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between gap-3"><h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{tour.name}</h2></div>
                <p className="mb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{tour.description}</p>
                <div className="mb-4 flex flex-wrap gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{tour.duration}</span>
                  <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{tour.minPax}–{tour.maxPax} pax</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{tour.location}</span>
                </div>
                <div className="mb-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Incluye</p><ul className="space-y-1">{tour.includes.map((item) => <li key={item} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"><span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />{item}</li>)}</ul></div>
                <div className="mb-5 rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-zinc-500 dark:text-zinc-400">Precio desde</span><span className="font-semibold text-zinc-900 dark:text-zinc-50">{formatCRC(tour.retailPricePerPax)} / pax</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Paquetes configurados</span><span className="font-semibold">{tour.packages.length}</span></div>
                    <div className="flex justify-between"><span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400"><Tag className="h-3.5 w-3.5 text-emerald-500" />Tu comisión ({commissionRate}%)</span><span className="font-semibold text-emerald-600 dark:text-emerald-400">+ {formatCRC(tour.commissionPerPax)} / pax</span></div>
                    <div className="border-t border-zinc-200 pt-2 dark:border-zinc-700"><div className="flex justify-between"><span className="text-zinc-500 dark:text-zinc-400">Precio neto para ti</span><span className="font-bold text-zinc-900 dark:text-zinc-50">{formatCRC(tour.netPricePerPax)} / pax</span></div></div>
                  </div>
                </div>
                <Link href={`/b2b/tours/${tour.id}/book`} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">Reservar este tour<ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
