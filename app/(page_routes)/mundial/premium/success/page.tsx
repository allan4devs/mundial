"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Crown, Sparkles, Trophy } from "lucide-react";

function SuccessContent() {
  const params = useSearchParams();
  const name = params.get("name") ?? "Jugador";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#07110b] px-4 text-white [background-image:linear-gradient(135deg,#06100b_0%,#0b2216_45%,#14351d_74%,#07110b_100%)]">
      <div className="w-full max-w-lg text-center">
        {/* Glow ring */}
        <div className="relative mx-auto mb-8 h-28 w-28">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#f0b429]/20" />
          <div className="absolute inset-2 animate-pulse rounded-full bg-[#f0b429]/15" />
          <div className="absolute inset-0 grid place-items-center rounded-full border-2 border-[#f0b429]/60 bg-[#f0b429]/10">
            <CheckCircle2 className="h-12 w-12 text-[#9dff34]" />
          </div>
        </div>

        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#f0b429]/30 bg-[#f0b429]/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#f0b429]">
          <Sparkles className="h-3 w-3" /> Premium Activado
        </div>

        <h1 className="mt-4 text-4xl font-black leading-tight text-white">
          ¡Bienvenido al<br />
          <span className="text-[#f0b429]">club Premium!</span>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-white/55">
          <strong className="text-white">{decodeURIComponent(name)}</strong>, tu pago fue procesado exitosamente. Ya podés apostar en las 10 categorías exclusivas y hacer tus pronósticos de eliminación.
        </p>

        <div className="my-8 grid grid-cols-2 gap-3 text-left sm:grid-cols-3">
          {[
            { e: "🏆", t: "Campeón del Torneo" },
            { e: "👟", t: "Bota de Oro" },
            { e: "🎯", t: "Marcador de la Final" },
            { e: "🔮", t: "Mis Semifinalistas" },
            { e: "⭐", t: "MVP del Torneo" },
            { e: "🎰", t: "Combo Maestro" },
          ].map((f) => (
            <div key={f.t} className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.04] px-3 py-2.5">
              <span className="text-base">{f.e}</span>
              <span className="text-xs font-bold leading-tight text-white/60">{f.t}</span>
            </div>
          ))}
        </div>

        <Link
          href="/mundial"
          className="inline-flex items-center gap-2.5 rounded-xl border border-[#f0b429]/50 bg-[#f0b429] px-8 py-4 text-base font-black text-[#07110b] shadow-[0_0_32px_rgba(240,180,41,0.35)] transition hover:bg-[#f5c842] hover:shadow-[0_0_48px_rgba(240,180,41,0.5)]"
        >
          <Crown className="h-5 w-5" />
          Ir a mis apuestas Premium
          <Trophy className="h-5 w-5" />
        </Link>

        <p className="mt-6 text-xs text-white/30">
          Revisá tu correo para el email de bienvenida con todos los detalles.
        </p>
      </div>
    </main>
  );
}

export default function PremiumSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
