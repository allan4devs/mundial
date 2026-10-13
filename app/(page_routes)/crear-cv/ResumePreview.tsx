"use client";

import { useEffect, useRef, useState } from "react";
import type { ResumeData, ResumeSettings } from "./types";
import { sectionLabels } from "./i18n";
import { TEMPLATES } from "./templates";

// A4 / Letter at 96dpi, in CSS px.
const PAPER_PX: Record<ResumeSettings["paper"], { w: number; h: number }> = {
  a4: { w: 794, h: 1123 },
  letter: { w: 816, h: 1056 },
};

/** The bare white sheet — used both on screen (scaled) and in the print node
 *  (natural size). */
export function ResumeSheet({
  data,
  settings,
  watermark,
}: {
  data: ResumeData;
  settings: ResumeSettings;
  watermark?: string | null;
}) {
  const Template = TEMPLATES[settings.template];
  const labels = sectionLabels(settings.cvLang);
  const paper = PAPER_PX[settings.paper];

  return (
    <div
      className="cvx-sheet relative overflow-hidden bg-white text-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.10)] print:shadow-none"
      style={{ width: paper.w, minHeight: paper.h }}
    >
      <Template data={data} settings={settings} labels={labels} />
      {watermark ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-2">
          <span className="rounded-full bg-zinc-900/5 px-2 py-0.5 text-[9px] font-medium tracking-wide text-zinc-400">
            {watermark}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/** On-screen preview: scrollable, auto-fits width, honours a manual zoom. */
export function ResumePreview({
  data,
  settings,
  watermark,
  zoom,
}: {
  data: ResumeData;
  settings: ResumeSettings;
  watermark?: string | null;
  zoom: number;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [fit, setFit] = useState(0.5);
  const paperW = PAPER_PX[settings.paper].w;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const avail = el.clientWidth - 48; // padding budget
      setFit(Math.max(0.2, Math.min(1.1, avail / paperW)));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [paperW]);

  const scale = fit * zoom;
  const paper = PAPER_PX[settings.paper];

  return (
    <div ref={wrapRef} className="h-full w-full overflow-auto bg-zinc-200/70 p-6">
      <div
        className="mx-auto"
        style={{ width: paper.w * scale, height: paper.h * scale }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: paper.w }}>
          <ResumeSheet data={data} settings={settings} watermark={watermark} />
        </div>
      </div>
    </div>
  );
}
