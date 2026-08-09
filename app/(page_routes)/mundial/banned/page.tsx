"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldOff, AlertTriangle, ChevronRight, Mail } from "lucide-react";
import Link from "next/link";

const VISITOR_KEY = "penalitos-vid";
const PLAYER_KEY = "mundial-player-name";

export default function BannedPage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem(PLAYER_KEY) ?? "";
    const visitorId = localStorage.getItem(VISITOR_KEY) ?? "";
    if (!storedName && !visitorId) {
      // No identity to check — send back
      router.replace("/mundial");
      return;
    }

    queueMicrotask(() => setPlayerName(storedName || null));

    const params = new URLSearchParams();
    if (storedName) params.set("playerName", storedName.toUpperCase());
    if (visitorId) params.set("visitorId", visitorId);

    fetch(`/api/mundial/ban/status?${params}`)
      .then((r) => r.json() as Promise<{ banned?: boolean; reason?: string }>)
      .then((data) => {
        if (!data.banned) {
          // Not banned — go home
          router.replace("/mundial");
        } else {
          setBanReason(data.reason ?? null);
        }
      })
      .catch(() => { /* show generic page */ })
      .finally(() => setChecked(true));
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-[#060e08] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-white/60" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060e08] flex flex-col items-center justify-center px-4 py-16">
      {/* Icon block */}
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full border-2 border-red-500/30 bg-red-950/40">
        <ShieldOff className="h-12 w-12 text-red-400" />
      </div>

      {/* Title */}
      <h1 className="mb-3 text-center text-3xl font-black text-white sm:text-4xl">
        Cuenta suspendida
      </h1>
      <p className="mb-8 max-w-sm text-center text-base text-white/55 leading-relaxed">
        Tu participación en la <strong className="text-white/80">Quiniela Mundial 2026</strong> ha sido suspendida temporalmente por un administrador.
      </p>

      {/* Reason card */}
      {banReason && (
        <div className="mb-8 w-full max-w-sm rounded-2xl border border-red-500/25 bg-red-950/30 p-5">
          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-red-400/70">Motivo de la suspensión</p>
          <p className="text-sm text-red-200/90 leading-relaxed">{banReason}</p>
        </div>
      )}

      {/* Warning */}
      <div className="mb-8 flex w-full max-w-sm items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <p className="text-xs text-amber-200/75 leading-relaxed">
          El proceso de recuperación de cuenta es <strong className="text-amber-200">extenso y riguroso</strong>. Requiere verificación de identidad completa y puede tomar varios días hábiles. Asegúrate de que tu suspensión fue aplicada por error antes de iniciarlo.
        </p>
      </div>

      {/* CTA */}
      <Link
        href={{
          pathname: "/mundial/banned/recover",
          query: playerName ? { playerName } : undefined,
        }}
        className="group mb-6 flex w-full max-w-sm items-center justify-between rounded-2xl border border-white/12 bg-white/5 p-5 transition hover:border-white/20 hover:bg-white/8"
      >
        <div>
          <p className="text-sm font-black text-white">Iniciar proceso de recuperación</p>
          <p className="mt-0.5 text-xs text-white/45">Verificación de identidad completa · ~20 minutos</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-white/35 transition group-hover:translate-x-0.5 group-hover:text-white/60" />
      </Link>

      {/* Contact */}
      <div className="flex items-center gap-2 text-xs text-white/30">
        <Mail className="h-3.5 w-3.5" />
        <span>¿Necesitas ayuda? Contacta a soporte por correo.</span>
      </div>
    </div>
  );
}
