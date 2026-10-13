import Link from "next/link";
import { Clock, LogOut } from "lucide-react";

export default function B2BPendingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Cuenta pendiente de aprobación
        </h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400">
          Tu solicitud está siendo revisada por nuestro equipo. Te notificaremos por correo
          electrónico cuando tu cuenta esté activa.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Volver al sitio
          </Link>
          <Link
            href="/api/b2b/auth/logout"
            className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
