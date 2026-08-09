"use client";

import { useEffect, useState } from "react";
import { Loader2, Trophy, Users, X } from "lucide-react";
import type { Viewer } from "../types";

type Profile = {
  displayName: string;
  notificationEmail: string;
  notificationEmailVerified: boolean;
  notificationConsent: boolean;
  preferences: {
    pickClosingReminder: boolean;
    resultsDigest: boolean;
    timezone: string;
  };
};

type Achievement = {
  id: string;
  name: string;
  description: string;
  unlockedAt: string | null;
};

type PrivateLeague = {
  id: string;
  name: string;
  memberCount: number;
  owner: boolean;
  inviteExpiresAt: string | null;
};

type Props = {
  open: boolean;
  viewer: Exclude<Viewer, null>;
  onClose: () => void;
  onLogout: () => void;
  onRefresh: () => Promise<void>;
};

async function jsonRequest(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    cache: "no-store",
    credentials: "same-origin",
    ...init,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "No se pudo completar.");
  return body;
}

export function GrowthPanel({ open, viewer, onClose, onLogout, onRefresh }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leagues, setLeagues] = useState<PrivateLeague[]>([]);
  const [leagueName, setLeagueName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [newInvite, setNewInvite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setBusy(true);
    setError("");
    try {
      const [profileData, achievementData, leagueData] = await Promise.all([
        jsonRequest("/api/scores/profile"),
        jsonRequest("/api/scores/achievements"),
        jsonRequest("/api/scores/private-leagues"),
      ]);
      setProfile(profileData.profile);
      setAchievements(achievementData.achievements ?? []);
      setLeagues(leagueData.leagues ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo cargar.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (open) void load();
  }, [open]);

  if (!open) return null;

  async function saveProfile() {
    if (!profile) return;
    setBusy(true);
    setError("");
    try {
      const data = await jsonRequest("/api/scores/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      setProfile(data.profile);
      await onRefresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  async function createLeague() {
    setBusy(true);
    setError("");
    try {
      const data = await jsonRequest("/api/scores/private-leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: leagueName }),
      });
      setLeagueName("");
      setNewInvite(data.inviteCode ?? "");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo crear.");
      setBusy(false);
    }
  }

  async function joinLeague() {
    setBusy(true);
    setError("");
    try {
      await jsonRequest("/api/scores/private-leagues", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });
      setInviteCode("");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo unir.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <section className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-white/10 bg-[#071018] p-4 shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#9dff34]">
              Mi espacio
            </p>
            <h2 className="text-lg font-black">{viewer.displayName}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 p-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error ? <p className="mt-3 rounded-lg bg-red-950/50 p-2 text-sm text-red-200">{error}</p> : null}
        {busy && !profile ? <Loader2 className="mx-auto mt-8 h-6 w-6 animate-spin" /> : null}

        {profile ? (
          <div className="mt-4 space-y-4">
            <div className="space-y-2 rounded-xl border border-white/10 bg-black/25 p-3">
              <h3 className="font-black">Perfil y avisos</h3>
              <input
                value={profile.displayName}
                onChange={(event) => setProfile({ ...profile, displayName: event.target.value })}
                maxLength={60}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
                placeholder="Nombre"
              />
              <input
                type="email"
                value={profile.notificationEmail}
                onChange={(event) => setProfile({ ...profile, notificationEmail: event.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
                placeholder="Email para avisos"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={profile.notificationConsent}
                  onChange={(event) =>
                    setProfile({ ...profile, notificationConsent: event.target.checked })
                  }
                />
                Acepto recibir avisos de Scores
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={profile.preferences.pickClosingReminder}
                  disabled={!profile.notificationConsent}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      preferences: {
                        ...profile.preferences,
                        pickClosingReminder: event.target.checked,
                      },
                    })
                  }
                />
                Recordarme antes del cierre
              </label>
              {profile.notificationEmail && !profile.notificationEmailVerified ? (
                <p className="text-xs text-amber-200/80">
                  El envío queda pausado hasta verificar el email.
                </p>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveProfile()}
                className="w-full rounded-lg bg-[#9dff34] py-2 text-sm font-black text-black disabled:opacity-50"
              >
                Guardar perfil
              </button>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <h3 className="flex items-center gap-2 font-black">
                <Trophy className="h-4 w-4 text-amber-300" /> Logros
              </h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`rounded-lg border p-2 text-xs ${
                      achievement.unlockedAt
                        ? "border-amber-300/30 bg-amber-300/10"
                        : "border-white/10 opacity-45"
                    }`}
                  >
                    <p className="font-black">{achievement.name}</p>
                    <p className="mt-1 text-white/55">{achievement.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-white/10 bg-black/25 p-3">
              <h3 className="flex items-center gap-2 font-black">
                <Users className="h-4 w-4 text-cyan-300" /> Ligas privadas
              </h3>
              {leagues.map((league) => (
                <div key={league.id} className="flex justify-between rounded-lg bg-black/30 p-2 text-sm">
                  <span className="font-bold">{league.name}</span>
                  <span className="text-white/50">{league.memberCount} miembros</span>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={leagueName}
                  onChange={(event) => setLeagueName(event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
                  placeholder="Nueva liga"
                />
                <button type="button" disabled={busy} onClick={() => void createLeague()} className="rounded-lg border border-white/15 px-3 text-sm font-bold">
                  Crear
                </button>
              </div>
              {newInvite ? (
                <p className="rounded-lg bg-cyan-950/40 p-2 text-xs text-cyan-100">
                  Código de invitación: <strong>{newInvite}</strong>. Guárdelo ahora.
                </p>
              ) : null}
              <div className="flex gap-2">
                <input
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
                  placeholder="Código para unirse"
                />
                <button type="button" disabled={busy} onClick={() => void joinLeague()} className="rounded-lg border border-white/15 px-3 text-sm font-bold">
                  Unirme
                </button>
              </div>
            </div>

            <button type="button" onClick={onLogout} className="w-full rounded-lg border border-red-400/30 py-2 text-sm font-bold text-red-200">
              Cerrar sesión
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
