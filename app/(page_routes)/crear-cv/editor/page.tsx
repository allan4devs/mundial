"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  FileText,
  FileUp,
  Mail,
  Minus,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Sparkles,
  Type,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/helpers/utils";
import type { BuilderState, CoverLetterData, ResumeData, ResumeSettings, TemplateId } from "../types";
import { ACCENTS, emptyResume, sampleState } from "../sample";
import { TEMPLATE_META, UI } from "../i18n";
import { TEMPLATE_ORDER, isFreeTemplate } from "../templates";
import { ResumePreview, ResumeSheet } from "../ResumePreview";
import { EditorForm } from "../EditorForm";
import { CoverLetterPanel, PrintableLetter } from "../CoverLetterPanel";
import { Paywall } from "../Paywall";
import { buildCoverLetter } from "../coverLetter";
import {
  exportStateJSON,
  loadLicense,
  loadState,
  readStateFromFile,
  saveState,
} from "../storage";

const blankCover: CoverLetterData = {
  company: "",
  role: "",
  recipient: "",
  channel: "",
  hook: "",
  override: null,
};

export default function EditorPage() {
  const { lang } = useLanguage();
  const ui = UI[lang];

  const [state, setState] = useState<BuilderState | null>(null);
  const [pro, setPro] = useState(false);
  const [view, setView] = useState<"edit" | "show">("edit");
  const [rightPane, setRightPane] = useState<"preview" | "cover">("preview");
  const [zoom, setZoom] = useState(1);
  const [saved, setSaved] = useState(true);
  const [paywall, setPaywall] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<TemplateId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dlOpen, setDlOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // hydrate once
  useEffect(() => {
    setState(loadState() ?? sampleState(lang));
    setPro(Boolean(loadLicense()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounced autosave
  useEffect(() => {
    if (!state) return;
    setSaved(false);
    const t = setTimeout(() => {
      saveState(state);
      setSaved(true);
    }, 500);
    return () => clearTimeout(t);
  }, [state]);

  const patchData = useCallback(
    (p: Partial<ResumeData>) => setState((s) => (s ? { ...s, data: { ...s.data, ...p } } : s)),
    [],
  );
  const patchSettings = useCallback(
    (p: Partial<ResumeSettings>) =>
      setState((s) => (s ? { ...s, settings: { ...s.settings, ...p } } : s)),
    [],
  );
  const patchCover = useCallback(
    (p: Partial<CoverLetterData>) => setState((s) => (s ? { ...s, cover: { ...s.cover, ...p } } : s)),
    [],
  );

  const requireProOr = useCallback(
    (fn: () => void) => {
      if (pro) fn();
      else setPaywall(true);
    },
    [pro],
  );

  const onActivated = useCallback(() => {
    setPro(true);
    if (pendingTemplate) {
      patchSettings({ template: pendingTemplate });
      setPendingTemplate(null);
    }
  }, [pendingTemplate, patchSettings]);

  // The résumé is the default print target; `cvx-printing-letter` swaps to the
  // cover letter for one paint. A manual Ctrl+P (no class) still prints the CV.
  const printLetterFlag = useCallback(() => {
    if (typeof window === "undefined") return;
    document.body.classList.add("cvx-printing-letter");
    const done = () => {
      document.body.classList.remove("cvx-printing-letter");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    setTimeout(() => window.print(), 60);
  }, []);

  const printResume = useCallback(() => {
    setDlOpen(false);
    setTimeout(() => window.print(), 60);
  }, []);
  const printLetter = useCallback(() => {
    setDlOpen(false);
    requireProOr(printLetterFlag);
  }, [printLetterFlag, requireProOr]);

  const letterText = useMemo(
    () =>
      state
        ? state.cover.override ??
          buildCoverLetter(state.data, { ...state.cover, override: null }, state.settings.cvLang)
        : "",
    [state],
  );

  if (!state) {
    return <div className="fixed inset-0 grid place-items-center bg-zinc-100 text-sm text-zinc-400">…</div>;
  }

  const { data, settings, cover } = state;
  const watermark = pro ? null : ui.watermark;

  function pickTemplate(id: TemplateId) {
    if (!pro && !isFreeTemplate(id)) {
      setPendingTemplate(id);
      setPaywall(true);
      return;
    }
    patchSettings({ template: id });
  }

  function loadSample() {
    setMenuOpen(false);
    setState({ ...sampleState(settings.cvLang), settings });
  }
  function startBlank() {
    setMenuOpen(false);
    setState({ data: emptyResume(), settings, cover: { ...blankCover } });
  }
  function resetAll() {
    setMenuOpen(false);
    if (!window.confirm(lang === "es" ? "¿Borrar todo y empezar de cero?" : "Erase everything and start over?"))
      return;
    setState(sampleState(settings.cvLang));
  }
  async function onImport(file: File) {
    setMenuOpen(false);
    try {
      setState(await readStateFromFile(file));
    } catch {
      window.alert(lang === "es" ? "No se pudo leer ese archivo." : "Could not read that file.");
    }
  }

  const btn =
    "inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900";

  return (
    <>
      <style>{`
        @media screen { .cvx-print { display: none; } }
        @media print {
          @page { size: ${settings.paper}; margin: 0; }
          html, body { background: #fff !important; }
          body * { visibility: hidden !important; }
          .cvx-print, .cvx-print * { visibility: visible !important; }
          .cvx-print { position: absolute; left: 0; top: 0; width: 100%; }
          .cvx-print--resume { display: block; }
          .cvx-print--letter { display: none; }
          body.cvx-printing-letter .cvx-print--resume { display: none; }
          body.cvx-printing-letter .cvx-print--letter { display: block; }
          .cvx-sheet { box-shadow: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
        }
      `}</style>

      <div className="cvx-app fixed inset-0 flex flex-col overflow-hidden bg-zinc-100 font-[family-name:var(--font-manrope)]">
        {/* ── toolbar ── */}
        <header className="z-20 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-zinc-200 bg-white px-3 py-2">
          <Link href="/crear-cv" className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-500 transition-colors hover:text-zinc-900">
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">{ui.back}</span>
          </Link>
          <div className="h-5 w-px bg-zinc-200" />
          <span className="text-[13px] font-bold tracking-tight text-zinc-900">{ui.builderTitle}</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              saved ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-700",
            )}
          >
            {saved ? <Check size={10} /> : null}
            {saved ? ui.save : ui.saving}
          </span>

          {/* template */}
          <label className="flex items-center gap-1.5">
            <span className="hidden text-[10px] font-bold uppercase tracking-wide text-zinc-400 md:inline">
              {ui.template}
            </span>
            <select
              value={settings.template}
              onChange={(e) => pickTemplate(e.target.value as TemplateId)}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-[12px] font-semibold text-zinc-700 outline-none focus:border-teal-500"
            >
              {TEMPLATE_ORDER.map((id) => (
                <option key={id} value={id}>
                  {TEMPLATE_META[id][lang]}
                  {!pro && !isFreeTemplate(id) ? " · Pro" : ""}
                </option>
              ))}
            </select>
          </label>

          {/* accent */}
          <div className="hidden items-center gap-1 sm:flex">
            {ACCENTS.map((c, i) => {
              const active = settings.accent.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  title={ui.accent}
                  onClick={() => (i === 0 || pro ? patchSettings({ accent: c }) : setPaywall(true))}
                  className={cn(
                    "h-5 w-5 rounded-full border transition-transform hover:scale-110",
                    active ? "border-zinc-900 ring-2 ring-zinc-900/15" : "border-black/10",
                  )}
                  style={{ backgroundColor: c }}
                />
              );
            })}
          </div>

          {/* cv language */}
          <div className="flex overflow-hidden rounded-lg border border-zinc-300">
            {(["es", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => patchSettings({ cvLang: l })}
                className={cn(
                  "px-2 py-1.5 text-[11px] font-bold uppercase",
                  settings.cvLang === l ? "bg-zinc-900 text-white" : "bg-white text-zinc-500 hover:bg-zinc-50",
                )}
              >
                {l}
              </button>
            ))}
          </div>

          {/* font size */}
          <div className="hidden items-center gap-1 rounded-lg border border-zinc-300 px-1 md:flex">
            <Type size={12} className="text-zinc-400" />
            <button
              type="button"
              onClick={() => requireProOr(() => patchSettings({ fontScale: Math.max(0.9, settings.fontScale - 0.05) }))}
              className="p-1 text-zinc-500 hover:text-zinc-900"
            >
              <Minus size={12} />
            </button>
            <span className="w-8 text-center text-[11px] tabular-nums text-zinc-500">
              {Math.round(settings.fontScale * 100)}
            </span>
            <button
              type="button"
              onClick={() => requireProOr(() => patchSettings({ fontScale: Math.min(1.15, settings.fontScale + 0.05) }))}
              className="p-1 text-zinc-500 hover:text-zinc-900"
            >
              <Plus size={12} />
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* download */}
            <div className="relative">
              <button type="button" onClick={() => setDlOpen((o) => !o)} className={btn}>
                <Download size={13} />
                <span className="hidden sm:inline">{ui.download}</span>
                <ChevronDown size={12} />
              </button>
              {dlOpen && (
                <div
                  className="absolute right-0 top-full z-30 mt-1 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-xl"
                  onMouseLeave={() => setDlOpen(false)}
                >
                  <MenuItem icon={<FileText size={13} />} onClick={printResume}>
                    {ui.downloadPdf} — {ui.resume}
                  </MenuItem>
                  <MenuItem icon={<Mail size={13} />} onClick={printLetter}>
                    {ui.downloadPdf} — {ui.coverLetter}
                    {!pro && <span className="ml-1 text-[10px] font-bold text-teal-600">Pro</span>}
                  </MenuItem>
                  <div className="my-1 border-t border-zinc-100" />
                  <MenuItem icon={<Download size={13} />} onClick={() => (setDlOpen(false), exportStateJSON(state))}>
                    {ui.exportJson}
                  </MenuItem>
                  <MenuItem icon={<FileUp size={13} />} onClick={() => (setDlOpen(false), fileRef.current?.click())}>
                    {ui.importJson}
                  </MenuItem>
                </div>
              )}
            </div>

            {pro ? (
              <span className="hidden items-center gap-1 rounded-full bg-teal-600 px-2.5 py-1 text-[11px] font-bold text-white sm:inline-flex">
                <Check size={11} />
                {ui.proActive}
              </span>
            ) : (
              <Link
                href="/crear-cv/precios"
                className="hidden items-center gap-1 rounded-full bg-teal-600 px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-teal-700 sm:inline-flex"
              >
                <Sparkles size={12} />
                {ui.unlockPro}
              </Link>
            )}

            {/* overflow */}
            <div className="relative">
              <button type="button" onClick={() => setMenuOpen((o) => !o)} className={cn(btn, "px-2")}>
                <MoreHorizontal size={15} />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-xl"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <MenuItem icon={<Sparkles size={13} />} onClick={loadSample}>
                    {ui.loadSample}
                  </MenuItem>
                  <MenuItem icon={<FileText size={13} />} onClick={startBlank}>
                    {ui.startBlank}
                  </MenuItem>
                  <div className="my-1 border-t border-zinc-100" />
                  <MenuItem icon={<RotateCcw size={13} />} onClick={resetAll}>
                    {ui.reset}
                  </MenuItem>
                </div>
              )}
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = "";
            }}
          />
        </header>

        {/* ── body ── */}
        <div className="flex min-h-0 flex-1">
          {/* form */}
          <section
            className={cn(
              "min-w-0 flex-1 overflow-y-auto bg-zinc-50 p-3 lg:max-w-[460px] lg:flex-none lg:border-r lg:border-zinc-200",
              view === "edit" ? "block" : "hidden lg:block",
            )}
          >
            <EditorForm data={data} onChange={patchData} ui={ui} />
            <p className="mt-3 px-1 text-[10.5px] leading-snug text-zinc-400">
              {lang === "es"
                ? "Tus datos se guardan solo en este navegador. Exportá el .json para respaldarlos."
                : "Your data is stored only in this browser. Export the .json to back it up."}
            </p>
          </section>

          {/* right pane */}
          <section
            className={cn(
              "min-w-0 flex-1 flex-col",
              view === "show" ? "flex" : "hidden lg:flex",
            )}
          >
            <div className="flex items-center gap-1 border-b border-zinc-200 bg-white px-3 py-1.5">
              <PaneTab active={rightPane === "preview"} onClick={() => setRightPane("preview")} icon={<FileText size={13} />}>
                {ui.preview}
              </PaneTab>
              <PaneTab active={rightPane === "cover"} onClick={() => setRightPane("cover")} icon={<Mail size={13} />}>
                {ui.coverLetter}
              </PaneTab>

              {rightPane === "preview" && (
                <div className="ml-auto flex items-center gap-1">
                  <button type="button" onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                    <Minus size={13} />
                  </button>
                  <span className="w-10 text-center text-[11px] tabular-nums text-zinc-500">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button type="button" onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                    <Plus size={13} />
                  </button>
                </div>
              )}
            </div>

            {rightPane === "preview" ? (
              <div className="min-h-0 flex-1">
                <ResumePreview data={data} settings={settings} watermark={watermark} zoom={zoom} />
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto bg-white p-4">
                <CoverLetterPanel
                  data={data}
                  cover={cover}
                  cvLang={settings.cvLang}
                  ui={ui}
                  onCover={patchCover}
                  onPrint={printLetter}
                />
              </div>
            )}
          </section>
        </div>

        {/* mobile tab bar */}
        <nav className="flex shrink-0 border-t border-zinc-200 bg-white lg:hidden">
          <MobileTab active={view === "edit"} onClick={() => setView("edit")} icon={<FileText size={16} />}>
            {ui.edit}
          </MobileTab>
          <MobileTab
            active={view === "show" && rightPane === "preview"}
            onClick={() => {
              setView("show");
              setRightPane("preview");
            }}
            icon={<Download size={16} />}
          >
            {ui.preview}
          </MobileTab>
          <MobileTab
            active={view === "show" && rightPane === "cover"}
            onClick={() => {
              setView("show");
              setRightPane("cover");
            }}
            icon={<Mail size={16} />}
          >
            {ui.coverLetter}
          </MobileTab>
        </nav>
      </div>

      {/* print-only nodes */}
      <div className="cvx-print cvx-print--resume">
        <ResumeSheet data={data} settings={settings} watermark={watermark} />
      </div>
      <div className="cvx-print cvx-print--letter">
        <PrintableLetter text={letterText} />
      </div>

      <Paywall open={paywall} ui={ui} onClose={() => setPaywall(false)} onActivated={onActivated} />
    </>
  );
}

function MenuItem({
  icon,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
    >
      <span className="text-zinc-400">{icon}</span>
      <span className="flex-1">{children}</span>
    </button>
  );
}

function PaneTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors",
        active ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function MobileTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors",
        active ? "text-teal-600" : "text-zinc-400",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
