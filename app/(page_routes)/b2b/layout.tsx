import Link from "next/link";
import { ArrowLeft, Building2, ShieldCheck, UserRound } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Portal B2B – La Vieja Adventures",
  description: "Portal para operadores turísticos, hoteles y agentes de viaje.",
};

export default function B2BLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="b2b-shell min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="b2b-topbar sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="b2b-topbar-inner mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-md dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a La Vieja Adventures
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-lg dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            <UserRound className="h-4 w-4" />
            Usuario normal
          </Link>
          <Link
            href="/b2b/login"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg"
          >
            <Building2 className="h-4 w-4" />
            Login B2B
          </Link>
          <Link
            href="/b2b/admin"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg"
          >
            <ShieldCheck className="h-4 w-4" />
            Admin B2B
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
