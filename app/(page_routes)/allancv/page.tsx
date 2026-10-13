"use client";

import { useEffect, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { CvDocument } from "../cv/cv/CvDocument";
import { A4, PRINT_CSS } from "../cv/design";
import {
  contactInfo,
  density,
  education,
  experience,
  highlights,
  languages,
  personalInfo,
  primarySkills,
  secondarySkills,
  summary,
} from "../cv/data/cv-data-java-react";
import type { CvData } from "../cv/types";

// Read-only presentation of the Java + React 2026 master résumé from /cv,
// stripped of all workspace chrome (no editor, variant switcher, JD audit or
// application tracker). The whole sheet is scaled to fit the viewport on screen
// so it reads as one page; it prints / saves to PDF as one clean A4 via the
// shared print stylesheet.

const cv: CvData = {
  density,
  personalInfo,
  contactInfo,
  primarySkills,
  secondarySkills,
  education,
  languages,
  summary,
  highlights,
  experience,
};

// Hardening on top of the shared PRINT_CSS: kill any forced full-viewport
// heights so the single .cv-sheet can never spill onto a second physical page.
const ONE_PAGE_PRINT_CSS = `
@media print {
  html, body { height: auto !important; min-height: 0 !important; }
}
`;

export default function AllanCvPage() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // scale-to-fit on both axes: the entire sheet fits the viewport, never upscaled
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const apply = () =>
      setScale(Math.min(1, wrap.clientWidth / A4.wPx, wrap.clientHeight / A4.hPx));
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(wrap);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-4 print:block print:min-h-0 print:bg-white print:p-0">
      <style>{PRINT_CSS}</style>
      <style>{ONE_PAGE_PRINT_CSS}</style>

      <button
        type="button"
        onClick={() => window.print()}
        title="Print / Save as PDF"
        className="cv-print-hide fixed right-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50"
      >
        <Printer size={13} />
        Save as PDF
      </button>

      <div
        ref={wrapRef}
        className="flex h-[calc(100vh-2rem)] w-full max-w-4xl items-center justify-center print:h-auto print:max-w-none"
      >
        <div
          className="cv-scale-box relative"
          style={{ width: A4.wPx * scale, height: A4.hPx * scale, maxWidth: "100%" }}
        >
          <div
            className="cv-scale-layer origin-top-left"
            style={{ width: A4.wPx, height: A4.hPx, transform: `scale(${scale})` }}
          >
            <CvDocument cv={cv} />
          </div>
        </div>
      </div>
    </main>
  );
}
