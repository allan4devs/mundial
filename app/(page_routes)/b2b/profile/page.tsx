import { redirect } from "next/navigation";
import { Mail, Building2, UserRound } from "lucide-react";
import B2BNav from "@/app/components/b2b/B2BNav";
import { getOperatorFromCookies } from "@/lib/b2b-auth";
import { findOperatorById } from "@/lib/models/operator";
import NotificationsSettings from "./NotificationsSettings";

const DEFAULT_NOTIFICATION_PREFERENCES = {
  bookingCreated: true,
  bookingReminder24h: true,
  bookingStatusChanges: true,
  weeklyPerformanceDigest: true,
  partnerNetworkUpdates: true,
};

export default async function B2BProfilePage() {
  const operatorToken = await getOperatorFromCookies();
  if (!operatorToken) redirect("/b2b/login");
  if (operatorToken.status === "pending") redirect("/b2b/pending");

  const operator = await findOperatorById(operatorToken.id);
  if (!operator) redirect("/b2b/login");

  const preferences = operator.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES;

  return (
    <div>
      <B2BNav operatorName={operatorToken.name} company={operatorToken.company} />

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
        <section className="h-fit rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Perfil B2B</p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Configuración de cuenta</h1>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/70">
              <p className="inline-flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"><UserRound className="h-3.5 w-3.5" />Nombre</p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{operator.name}</p>
            </div>
            <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/70">
              <p className="inline-flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"><Building2 className="h-3.5 w-3.5" />Empresa</p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{operator.company}</p>
            </div>
            <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/70">
              <p className="inline-flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"><Mail className="h-3.5 w-3.5" />Email</p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{operator.email}</p>
            </div>
          </div>
        </section>

        <NotificationsSettings initialPreferences={preferences} />
      </main>
    </div>
  );
}
