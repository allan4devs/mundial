"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, Crown, Loader2, Mail, Phone, Sparkles, Upload, X } from "lucide-react";
import { cn, normalizeKey } from "../utils";

/* eslint-disable react-hooks/set-state-in-effect */

interface Props {
  playerName: string;
  open: boolean;
  onClose: () => void;
  onSaved?: (data: { email: string; phone: string; avatarDataUrl: string | null }) => void;
  isFirstTime?: boolean;
  hasPremium?: boolean;
}

type AvatarIcon = {
  id: string;
  name: string;
  displayName: string;
  country: string;
  countryCode: string;
  imageUrl: string;
  sourceUrl: string;
  provider: string;
  license: string;
  attribution: string;
  sortOrder: number;
};

// ── NSFW model (lazy, cached) ──────────────────────────────────────────────

type NsfwModel = Awaited<ReturnType<typeof import("nsfwjs")["load"]>>;

let _nsfwPromise: Promise<NsfwModel> | null = null;

function getNsfwModel(): Promise<NsfwModel> {
  if (!_nsfwPromise) {
    _nsfwPromise = (async () => {
      await import("@tensorflow/tfjs");
      const { load } = await import("nsfwjs");
      return load();
    })();
  }
  return _nsfwPromise;
}

// Analiza la imagen 3 veces con distintos crops y promedia para mayor precisión
async function isContentSafe(dataUrl: string): Promise<boolean> {
  const model = await getNsfwModel();

  // Clasificar la imagen original + 2 crops (top-left, bottom-right) para reducir falsos negativos
  async function classifyAt(sx: number, sy: number, size: number, src: string) {
    return new Promise<ReturnType<NsfwModel["classify"]>>((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        if (size === img.naturalWidth) {
          // Sin crop
          resolve(model.classify(img));
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("canvas")); return; }
        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
        const croppedImg = new Image();
        croppedImg.onload = () => resolve(model.classify(croppedImg));
        croppedImg.onerror = reject;
        croppedImg.src = canvas.toDataURL("image/jpeg", 0.9);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  // Imagen completa + 2 crops para cubrir partes que el modelo podría pasar por alto
  const [full, topLeft, bottomRight] = await Promise.all([
    classifyAt(0, 0, 256, dataUrl),      // imagen completa (ya está a 256px)
    classifyAt(0, 0, 192, dataUrl),      // cuadrante top-left
    classifyAt(64, 64, 192, dataUrl),    // cuadrante bottom-right
  ]);

  // Promediar las 3 clasificaciones por clase
  const allSets = [full, topLeft, bottomRight] as Awaited<ReturnType<NsfwModel["classify"]>>[];
  const averaged: Record<string, number> = {};
  for (const set of allSets) {
    for (const { className, probability } of set) {
      averaged[className] = (averaged[className] ?? 0) + probability / allSets.length;
    }
  }

  // Umbrales individuales por categoría
  const BLOCK_RULES = [
    { className: "Porn",   threshold: 0.15 },
    { className: "Hentai", threshold: 0.20 },
    { className: "Sexy",   threshold: 0.25 },
  ];
  for (const { className, threshold } of BLOCK_RULES) {
    if ((averaged[className] ?? 0) > threshold) return false;
  }

  // Score combinado — la suma de las 3 categorías inapropiadas
  const unsafeTotal =
    (averaged["Porn"]   ?? 0) +
    (averaged["Hentai"] ?? 0) +
    (averaged["Sexy"]   ?? 0);
  if (unsafeTotal > 0.35) return false;

  return true;
}

// ── Photo compression ──────────────────────────────────────────────────────

async function compressAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const SIZE = 256;
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("canvas")); return; }
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Component ─────────────────────────────────────────────────────────────

export function ProfileModal({ playerName, open, onClose, onSaved, isFirstTime, hasPremium = false }: Props) {
  const playerKey = normalizeKey(playerName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [avatarIcons, setAvatarIcons] = useState<AvatarIcon[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const [showStickers, setShowStickers] = useState(false);

  const [checkingContent, setCheckingContent] = useState(false);

  const [loadingFetch, setLoadingFetch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !playerKey) return;
    setError("");
    setSaved(false);
    setShowUpload(false);
    setShowStickers(Boolean(isFirstTime));
    setLoadingFetch(true);
    fetch(`/api/mundial/profile?name=${encodeURIComponent(playerKey)}`)
      .then((r) => r.json())
      .then((data: { email?: string; phone?: string; avatarDataUrl?: string | null }) => {
        setEmail(data.email ?? "");
        setPhone(data.phone ?? "");
        setAvatarDataUrl(data.avatarDataUrl ?? null);
      })
      .catch(() => setError("No se pudo cargar el perfil."))
      .finally(() => setLoadingFetch(false));
  }, [isFirstTime, open, playerKey]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/mundial/avatar-icons")
      .then((r) => (r.ok ? r.json() : { icons: [] }))
      .then((data: { icons?: AvatarIcon[] }) => {
        setAvatarIcons(Array.isArray(data.icons) ? data.icons : []);
      })
      .catch(() => setAvatarIcons([]));
  }, [open]);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { setError("Solo se aceptan imágenes."); return; }
    setError("");
    setCheckingContent(true);
    try {
      const dataUrl = await compressAvatar(file);
      const safe = await isContentSafe(dataUrl);
      if (!safe) {
        setError("La imagen contiene contenido inapropiado y no puede usarse como avatar.");
        return;
      }
      setAvatarDataUrl(dataUrl);
    } catch {
      setError("No se pudo procesar la imagen.");
    } finally {
      setCheckingContent(false);
    }
  }

  async function handleSave() {
    if (!playerKey || !playerName) return;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("El email no tiene un formato válido.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/mundial/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ normalizedName: playerKey, playerName, email, phone, avatarDataUrl }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Error al guardar");
      setSaved(true);
      onSaved?.({ email, phone, avatarDataUrl });
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  const initials = playerName.trim().slice(0, 2).toUpperCase() || "?";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-2 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[#f0b429]/20 bg-[#080f0b] shadow-[0_32px_80px_rgba(0,0,0,0.9)] sm:max-h-[90dvh] sm:rounded-2xl">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-4 py-3 sm:px-5 sm:py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#f0b429]/70">Mundial 2026</p>
            <h2 className="text-base font-black text-white">
              {isFirstTime ? "¡Elegí tu avatar!" : "Mi Perfil"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/40 transition hover:border-white/25 hover:text-white/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loadingFetch ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#f0b429]/60" />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-4 p-3 min-[380px]:p-4 sm:space-y-5 sm:p-5">

              {/* Player card */}
              <div className={cn(
                "relative overflow-hidden rounded-2xl border p-3 min-[380px]:p-4",
                hasPremium
                  ? "border-[#f0b429]/35 bg-gradient-to-br from-[#1a2e10] via-[#0f1e0a] to-[#0a1505]"
                  : "border-white/10 bg-gradient-to-br from-[#111c0d] to-[#080f0b]"
              )}>
                {/* Ambient glow */}
                {hasPremium && (
                  <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#f0b429]/12 blur-2xl" />
                )}
                <div className="flex items-center gap-3 min-[380px]:gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => { setShowStickers((v) => !v); setShowUpload(false); }}
                      aria-label="Editar foto de perfil"
                      className={cn(
                        "group relative h-20 w-20 overflow-hidden rounded-2xl border-2 text-left transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#f0b429]/50 min-[380px]:h-24 min-[380px]:w-24",
                        hasPremium
                          ? "border-[#f0b429]/70 shadow-[0_0_28px_rgba(240,180,41,0.30)]"
                          : "border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.5)]",
                        showStickers && "ring-2 ring-[#f0b429]/50"
                      )}
                    >
                      {avatarDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarDataUrl} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#243d18] to-[#0e1d0a]">
                          <span className="text-3xl font-black text-[#f0b429]">{initials}</span>
                        </div>
                      )}
                      <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/65 px-2 py-1.5 text-[10px] font-black uppercase tracking-wide text-white/85 opacity-90 transition group-hover:bg-black/80">
                        <Camera className="h-3 w-3" />
                        Editar
                      </span>
                    </button>
                    {/* Remove / premium badge */}
                    {avatarDataUrl && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setAvatarDataUrl(null); }}
                        className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full border border-white/20 bg-[#1a1a1a] text-white/60 shadow transition hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    {hasPremium && (
                      <div className="absolute -bottom-1.5 -right-1.5 grid h-7 w-7 place-items-center rounded-full border-2 border-[#080f0b] bg-[#f0b429] text-[#07110b] shadow-[0_0_18px_rgba(240,180,41,0.55)]">
                        <Crown className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">Jugador</p>
                    <p className="mt-0.5 truncate text-base font-black leading-tight text-white min-[380px]:text-lg">{playerName}</p>
                    {hasPremium ? (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#f0b429]/35 bg-[#f0b429]/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#f0b429]">
                        <Crown className="h-3 w-3" />
                        Premium
                      </span>
                    ) : (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/6 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white/40">
                        Jugador
                      </span>
                    )}
                    {isFirstTime && (
                      <p className="mt-2 text-xs text-[#f0b429]/75">
                        Elegí un ídolo o subí tu foto
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Legend avatar grid */}
              <div>
                {showStickers && (
                  <div className="rounded-2xl border border-[#f0b429]/20 bg-[#0c150e] p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-[#f0b429]" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-white/60">Elegí avatar</span>
                      <span className="ml-auto rounded-full border border-[#f0b429]/30 bg-[#f0b429]/12 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#f0b429]/90">
                        LVA Custom
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 min-[390px]:grid-cols-3 min-[390px]:gap-3 sm:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => setShowUpload((v) => !v)}
                        className={cn(
                          "flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-2 text-center transition min-[390px]:min-h-[8.25rem] min-[390px]:p-3",
                          showUpload
                            ? "border-[#f0b429] bg-[#f0b429]/10 text-[#f0b429]"
                            : "border-white/15 bg-white/4 text-white/45 hover:border-white/30 hover:text-white/75"
                        )}
                      >
                        <Camera className="h-6 w-6" />
                        <span className="text-[10px] font-black uppercase leading-tight tracking-wide">Subir foto</span>
                      </button>
                    {avatarIcons.map((icon, index) => {
                      const isSelected = avatarDataUrl === icon.imageUrl;
                      return (
                        <button
                          key={icon.id}
                          type="button"
                          onClick={() => { setAvatarDataUrl(isSelected ? null : icon.imageUrl); setError(""); }}
                          title={`${icon.displayName} - ${icon.provider}`}
                          style={{ animationDelay: `${index * 55}ms` }}
                          className={cn(
                            "idol-sticker group relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border p-2 pb-2 transition min-[390px]:p-3 min-[390px]:pb-2.5",
                            isSelected
                              ? "is-selected border-[#f0b429] bg-[#f0b429]/12 shadow-[0_0_22px_rgba(240,180,41,0.28)]"
                              : "border-white/10 bg-[#101812] hover:border-[#f0b429]/35 hover:bg-[#142017]"
                          )}
                        >
                          <span className="idol-sticker-shine" />
                          <span className="idol-sticker-orbit idol-sticker-orbit-a" />
                          <span className="idol-sticker-orbit idol-sticker-orbit-b" />

                          {/* LVA badge */}
                          <span className="absolute left-2 top-2 z-10 rounded-full border border-[#9dff34]/25 bg-[#9dff34]/12 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wide text-[#d5ff3f]">
                            LVA
                          </span>

                          {/* Photo */}
                          <div className="idol-sticker-photo relative mt-3 h-16 w-16 overflow-hidden rounded-full border-2 border-white/25 bg-[#07110b] min-[390px]:h-20 min-[390px]:w-20">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={icon.imageUrl} alt={icon.displayName} className="h-full w-full object-cover" />
                            <span className="idol-photo-gloss" />
                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 ring-2 ring-[#f0b429]">
                                <Check className="h-6 w-6 text-[#f0b429] drop-shadow-[0_0_6px_rgba(240,180,41,0.9)]" />
                              </div>
                            )}
                          </div>

                          {/* Name */}
                          <span className="relative z-10 w-full truncate text-center text-[10px] font-black leading-snug text-white/75 drop-shadow-[0_1px_0_rgba(0,0,0,0.9)]">
                            {icon.name}
                          </span>

                          {/* Sparkle corner */}
                          <span className="absolute bottom-1.5 right-1.5 z-10 grid h-5 w-5 place-items-center rounded-full border border-[#f0b429]/40 bg-[#f0b429]/15 text-[#f0b429]">
                            <Sparkles className="h-3 w-3" />
                          </span>
                        </button>
                      );
                    })}
                    </div>
                  </div>
                )}
              </div>

              {/* Photo upload section */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpload((v) => !v);
                    void getNsfwModel(); // precarga el modelo
                  }}
                  className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/4 px-3.5 py-2.5 text-xs font-black text-white/50 transition hover:border-white/20 hover:text-white/75"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>O subí tu propia foto</span>
                  <span className="ml-auto text-white/25">{showUpload ? "▲" : "▼"}</span>
                </button>

                {showUpload && (
                  <div
                    className={cn(
                      "mt-2 flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition",
                      checkingContent
                        ? "cursor-wait border-[#f0b429]/50 bg-[#f0b429]/6"
                        : isDragging
                          ? "cursor-pointer border-[#f0b429] bg-[#f0b429]/8"
                          : "cursor-pointer border-white/15 hover:border-white/30"
                    )}
                    onClick={() => { if (!checkingContent) fileInputRef.current?.click(); }}
                    onDragOver={(e) => { e.preventDefault(); if (!checkingContent) setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (checkingContent) return;
                      const file = e.dataTransfer.files[0];
                      if (file) void handleFile(file);
                    }}
                  >
                    {checkingContent ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin text-[#f0b429]/70" />
                        <p className="text-xs font-bold text-white/50">Verificando imagen...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-white/30" />
                        <p className="text-xs font-bold text-white/45">Arrastrá o tocá para seleccionar</p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={checkingContent}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleFile(file);
                        e.target.value = "";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-white/8" />

              {/* Email */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/45">
                  <Mail className="h-3 w-3 text-[#f0b429]/70" />
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="tu@correo.com"
                  className="w-full rounded-lg border border-white/12 bg-white/5 px-3.5 py-2.5 text-sm font-bold text-white placeholder-white/20 outline-none transition focus:border-[#f0b429]/50 focus:bg-white/8 focus:ring-1 focus:ring-[#f0b429]/20"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/45">
                  <Phone className="h-3 w-3 text-[#f0b429]/70" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(""); }}
                  placeholder="+506 8888-8888"
                  className="w-full rounded-lg border border-white/12 bg-white/5 px-3.5 py-2.5 text-sm font-bold text-white placeholder-white/20 outline-none transition focus:border-[#f0b429]/50 focus:bg-white/8 focus:ring-1 focus:ring-[#f0b429]/20"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-900/20 px-3.5 py-2.5 text-sm font-bold text-red-300">
                  {error}
                </p>
              )}

              {/* Save */}
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-black uppercase tracking-wide transition",
                  saved
                    ? "border-[#9dff34]/50 bg-[#9dff34]/15 text-[#9dff34]"
                    : "border-[#f0b429]/40 bg-[#f0b429] text-[#07110b] hover:bg-[#f5c842] disabled:opacity-50"
                )}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
                {saving ? "Guardando..." : saved ? "¡Guardado!" : isFirstTime ? "Guardar y continuar" : "Guardar cambios"}
              </button>

            </div>
          </div>
        )}
      </div>
      <style>{`
        .idol-sticker {
          isolation: isolate;
          animation: idolStickerFloat 4.8s ease-in-out infinite both;
          background:
            radial-gradient(circle at 22% 18%, rgba(240, 180, 41, 0.20), transparent 28%),
            radial-gradient(circle at 78% 8%, rgba(157, 255, 52, 0.12), transparent 24%),
            linear-gradient(145deg, rgba(255,255,255,0.075), rgba(255,255,255,0.018) 48%, rgba(240,180,41,0.055));
        }

        .idol-sticker::before {
          content: "";
          position: absolute;
          inset: 5px;
          z-index: -1;
          border-radius: 18px;
          border: 1px dashed rgba(240, 180, 41, 0.22);
        }

        .idol-sticker::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 52%;
          z-index: -2;
          height: 52px;
          width: 76px;
          transform: translate(-50%, -50%) rotate(-8deg);
          border-radius: 999px;
          background: rgba(240, 180, 41, 0.10);
          filter: blur(12px);
        }

        .idol-sticker:hover,
        .idol-sticker.is-selected {
          transform: translateY(-3px) scale(1.035) rotate(-1deg);
        }

        .idol-sticker-photo {
          box-shadow:
            0 0 0 4px rgba(7, 17, 11, 0.82),
            0 0 0 6px rgba(240, 180, 41, 0.14),
            0 10px 22px rgba(0, 0, 0, 0.38);
        }

        .idol-photo-gloss,
        .idol-sticker-shine {
          pointer-events: none;
          position: absolute;
          inset: 0;
        }

        .idol-photo-gloss {
          background: linear-gradient(135deg, rgba(255,255,255,0.32), transparent 36%, transparent 64%, rgba(255,255,255,0.12));
          mix-blend-mode: screen;
        }

        .idol-sticker-shine {
          z-index: 4;
          transform: translateX(-135%) rotate(18deg);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
          animation: idolStickerShine 3.8s ease-in-out infinite;
        }

        .idol-sticker-orbit {
          position: absolute;
          z-index: 1;
          border-radius: 999px;
          background: #f0b429;
          box-shadow: 0 0 12px rgba(240, 180, 41, 0.75);
          opacity: 0.72;
          animation: idolStickerSparkle 2.8s ease-in-out infinite;
        }

        .idol-sticker-orbit-a {
          right: 17px;
          top: 20px;
          height: 5px;
          width: 5px;
        }

        .idol-sticker-orbit-b {
          left: 19px;
          bottom: 32px;
          height: 4px;
          width: 4px;
          animation-delay: 900ms;
        }

        @keyframes idolStickerFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(0.8deg); }
        }

        @keyframes idolStickerShine {
          0%, 58% { transform: translateX(-135%) rotate(18deg); }
          78%, 100% { transform: translateX(135%) rotate(18deg); }
        }

        @keyframes idolStickerSparkle {
          0%, 100% { transform: scale(0.75); opacity: 0.32; }
          45% { transform: scale(1.22); opacity: 0.9; }
        }

        @media (prefers-reduced-motion: reduce) {
          .idol-sticker,
          .idol-sticker-shine,
          .idol-sticker-orbit {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
