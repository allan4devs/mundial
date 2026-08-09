"use client";

import { useState } from "react";
import {
  ChevronDown,
  GitMerge,
  ListChecks,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Save,
  Shield,
  SlidersHorizontal,
  Target,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { cn, normalizeKey } from "../utils";
import { VIEW_OPTIONS } from "../constants";
import type { ViewMode } from "../types";

interface MundialHeaderProps {
  playerName: string;
  avatarDataUrl?: string | null;
  dirtyDrafts: unknown[];
  isSavingBulk: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  loadQuiniela: () => Promise<void> | void;
  isLoading: boolean;
  saveDirtyDrafts: () => Promise<void> | void;
  openPlayerPicker: () => void;
  openProfile: () => void;
}

function ViewIcon({ id, active }: { id: ViewMode; active: boolean }) {
  const className = cn(
    "h-4 w-4 shrink-0",
    active ? "text-[#07110b]" : "text-white/55"
  );

  if (id === "next") return <Target className={className} />;
  if (id === "mine") return <ListChecks className={className} />;
  if (id === "bracket") return <GitMerge className={className} />;
  return <Users className={className} />;
}

export function MundialHeader({
  playerName,
  avatarDataUrl,
  dirtyDrafts,
  isSavingBulk,
  viewMode,
  setViewMode,
  loadQuiniela,
  isLoading,
  saveDirtyDrafts,
  openPlayerPicker,
  openProfile,
}: MundialHeaderProps) {
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const isAdmin = normalizeKey(playerName) === "ALLAN";

  const shortLabels: Record<string, string> = {
    next: "En Vivo",
    mine: "Picks",
    players: "Líderes",
    bracket: "Bracket",
  };

  return (
    <header className="sticky top-0 z-20 border-b border-[#f0b429]/20 bg-[#060a08]/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-2 px-3 py-2 sm:flex-nowrap sm:px-5 sm:py-1.5">
        {/* Logo */}
        <span className="order-1 grid h-8 w-8 shrink-0 place-items-center rounded border border-[#f0b429]/40 bg-[#f0b429] text-[#07110b] sm:h-7 sm:w-7">
          <Trophy className="h-3.5 w-3.5" />
        </span>

        {/* View tabs */}
        <div className="order-3 grid min-w-0 basis-full grid-cols-4 gap-1 sm:order-2 sm:flex sm:flex-1 sm:basis-auto">
          {VIEW_OPTIONS.map((option) => {
            const active = viewMode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setViewMode(option.id)}
                className={cn(
                  "inline-flex h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded border px-1 font-black uppercase tracking-wide transition sm:h-9 sm:flex-none sm:flex-row sm:gap-1.5 sm:px-3",
                  active
                    ? "border-[#f0b429] bg-[#f0b429] text-[#07110b] shadow-[0_0_18px_rgba(240,180,41,0.28)]"
                    : "border-white/12 bg-white/4 text-white/55 hover:border-white/25 hover:text-white/80"
                )}
              >
                <ViewIcon id={option.id} active={active} />
                <span className="max-w-full truncate text-[9px] leading-none sm:hidden">{shortLabels[option.id]}</span>
                <span className="hidden text-xs sm:inline">{option.label}</span>
              </button>
            );
          })}
        </div>

        {/* Save badge */}
        {dirtyDrafts.length > 0 && (
          <button
            type="button"
            onClick={() => void saveDirtyDrafts()}
            disabled={isSavingBulk}
            className="order-2 ml-auto inline-flex h-8 shrink-0 items-center gap-1.5 rounded border border-[#d5ff3f] bg-[#9dff34] px-2.5 text-xs font-black text-[#06121c] transition hover:bg-[#d5ff3f] disabled:opacity-50 sm:order-3 sm:ml-0"
          >
            {isSavingBulk ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>{dirtyDrafts.length}</span>
          </button>
        )}

        {/* ··· menu */}
        <div className={cn("relative order-2 shrink-0 sm:order-4", dirtyDrafts.length === 0 && "ml-auto sm:ml-0")}>
          <button
            type="button"
            onClick={() => setShowHeaderMenu((v) => !v)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded border px-2.5 text-xs font-black transition",
              showHeaderMenu
                ? "border-white/30 bg-white/12 text-white"
                : "border-white/15 bg-white/5 text-white/60 hover:border-white/30 hover:text-white/90"
            )}
            aria-label="Menú"
          >
            <span className="relative shrink-0">
              {avatarDataUrl ? (
                <img
                  src={avatarDataUrl}
                  alt="Avatar"
                  className="h-5 w-5 rounded-full object-cover ring-1 ring-[#f0b429]/60"
                />
              ) : (
                <UserRound className="h-3.5 w-3.5 text-[#f0b429]" />
              )}
            </span>
            <span className="hidden max-w-28 truncate sm:inline">{playerName || "Jugador"}</span>
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>

          {showHeaderMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowHeaderMenu(false)} />
              <div className="absolute right-0 top-full z-20 mt-1.5 w-56 overflow-hidden rounded-lg border border-[#f0b429]/20 bg-[#08130d] shadow-[0_16px_48px_rgba(0,0,0,0.7)]">
                {/* Player switcher */}
                <button
                  type="button"
                  onClick={() => {
                    openPlayerPicker();
                    setShowHeaderMenu(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-white/8"
                >
                  <UserRound className="h-4 w-4 shrink-0 text-[#f0b429]" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-white/35">Jugador</p>
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-black text-white">{playerName || "—"}</p>
                    </div>
                  </div>
                  <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-[#d5ff3f]" />
                </button>

                <div className="mx-3 h-px bg-white/10" />

                {/* Mi Perfil */}
                <button
                  type="button"
                  onClick={() => {
                    openProfile();
                    setShowHeaderMenu(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-white/8"
                >
                  <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#f0b429]/70" />
                  <span className="text-sm font-black text-white/80">Mi Perfil</span>
                </button>

                <div className="mx-3 h-px bg-white/10" />

                {/* Guardar */}
                <button
                  type="button"
                  onClick={() => {
                    void saveDirtyDrafts();
                    setShowHeaderMenu(false);
                  }}
                  disabled={isSavingBulk || !dirtyDrafts.length}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-white/8 disabled:opacity-35"
                >
                  {isSavingBulk ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/50" />
                  ) : (
                    <Save className="h-4 w-4 shrink-0 text-white/50" />
                  )}
                  <span className="text-sm font-black text-white/80">
                    Guardar{dirtyDrafts.length > 0 ? ` (${dirtyDrafts.length})` : ""}
                  </span>
                </button>

                {/* Sincronizar */}
                <button
                  type="button"
                  onClick={() => {
                    void loadQuiniela();
                    setShowHeaderMenu(false);
                  }}
                  disabled={isLoading}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-white/8 disabled:opacity-35"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/50" />
                  ) : (
                    <RefreshCw className="h-4 w-4 shrink-0 text-white/50" />
                  )}
                  <span className="text-sm font-black text-white/80">Sincronizar</span>
                </button>

                {/* Admin */}
                {isAdmin && (
                  <>
                    <div className="mx-3 h-px bg-white/10" />
                    <Link
                      href="/mundial/admin"
                      onClick={() => setShowHeaderMenu(false)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-red-900/30"
                    >
                      <Shield className="h-4 w-4 shrink-0 text-red-400" />
                      <span className="text-sm font-black text-red-400">Admin</span>
                    </Link>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
