"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { KeyRound, Lock, X } from "lucide-react";
import { activateLicense } from "./storage";
import type { UiStrings } from "./i18n";

export function Paywall({
  open,
  ui,
  onClose,
  onActivated,
}: {
  open: boolean;
  ui: UiStrings;
  onClose: () => void;
  onActivated: () => void;
}) {
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  function tryActivate() {
    if (activateLicense(code)) {
      setErr(false);
      onActivated();
      onClose();
    } else {
      setErr(true);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-sm print:hidden"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Lock size={15} className="text-teal-600" />
            <h2 className="text-[13px] font-bold text-zinc-900">{ui.paywallTitle}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          <p className="text-[13px] leading-relaxed text-zinc-600">{ui.paywallBody}</p>

          <Link
            href="/crear-cv/precios"
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-teal-600 px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-teal-700"
          >
            {ui.paywallCta}
          </Link>

          <button
            type="button"
            onClick={() => setShowCode((s) => !s)}
            className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-zinc-500 hover:text-zinc-800"
          >
            <KeyRound size={13} />
            {ui.haveCode}
          </button>

          {showCode && (
            <div className="mt-2">
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setErr(false);
                  }}
                  placeholder={ui.enterCode}
                  className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[13px] uppercase tracking-wide text-zinc-800 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={tryActivate}
                  className="shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-[13px] font-bold text-white hover:bg-zinc-700"
                >
                  {ui.activate}
                </button>
              </div>
              {err && <p className="mt-1 text-[11.5px] font-medium text-rose-600">{ui.badCode}</p>}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
