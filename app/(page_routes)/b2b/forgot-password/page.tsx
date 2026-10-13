"use client";

import { useState } from "react";
import Link from "next/link";
import { Compass, Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/b2b/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ocurrió un error. Intenta de nuevo.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg">
              <Compass className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Portal B2B</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            La Vieja Adventures – Acceso para operadores
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {sent ? (
            <div className="text-center">
              <Mail className="mx-auto mb-4 h-10 w-10 text-emerald-600" />
              <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Revisa tu correo
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
              </p>
              <Link
                href="/b2b/login"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver al login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                ¿Olvidaste tu contraseña?
              </h2>
              <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
                Ingresa tu correo y te enviaremos un enlace para restablecerla.
              </p>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:ring-emerald-900"
                    placeholder="tu@empresa.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Mail className="h-4 w-4" />
                  {loading ? "Enviando..." : "Enviar enlace"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                <Link
                  href="/b2b/login"
                  className="inline-flex items-center gap-1.5 font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Volver al login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
