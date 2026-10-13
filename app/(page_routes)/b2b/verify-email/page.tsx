"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Compass, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Suspense } from "react";

type VerificationState = {
  status: "loading" | "success" | "error";
  message: string;
};

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const missingTokenMessage = "No se encontró el token de verificación.";
  const successMessage = "¡Correo verificado! Redirigiendo al login...";

  const initialState = useMemo<VerificationState>(
    () =>
      token
        ? { status: "loading" as const, message: "" }
        : { status: "error" as const, message: missingTokenMessage },
    [token],
  );

  const [{ status, message }, setVerificationState] = useState(initialState);

  useEffect(() => {
    if (!token) {
      return;
    }

    const abortController = new AbortController();
    let redirectTimeout: ReturnType<typeof setTimeout> | undefined;

    const setSuccessState = () => {
      setVerificationState({ status: "success", message: successMessage });
      redirectTimeout = setTimeout(() => router.push("/b2b/login?verified=1"), 2000);
    };

    fetch(`/api/b2b/auth/verify-email?token=${token}`, { signal: abortController.signal })
      .then(async (res) => {
        // The API redirects on success; if we're here with a non-redirect it's an error
        if (res.redirected) {
          setSuccessState();
          return;
        }

        const data = await res.json();

        if (res.ok) {
          setSuccessState();
        } else {
          setVerificationState({
            status: "error",
            message: data.error || "No se pudo verificar el correo.",
          });
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setVerificationState({ status: "error", message: "Error de conexión. Intenta de nuevo." });
      });

    return () => {
      abortController.abort();
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg">
            <Compass className="h-7 w-7 text-white" />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-emerald-600" />
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Verificando tu correo...
              </h1>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="mx-auto mb-4 h-10 w-10 text-emerald-600" />
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                ¡Verificación exitosa!
              </h1>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="mx-auto mb-4 h-10 w-10 text-red-500" />
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Enlace inválido
              </h1>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
              <Link
                href="/b2b/register"
                className="mt-6 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                Volver al registro
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
