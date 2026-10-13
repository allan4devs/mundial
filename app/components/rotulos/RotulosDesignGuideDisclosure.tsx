"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, ChevronUp, Shapes } from "lucide-react";
import type { Lang } from "./types";

const SignProposals = dynamic(() => import("./SignProposals"));

export default function RotulosDesignGuideDisclosure({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const t = (es: string, en: string) => (lang === "es" ? es : en);

  return (
    <section id="guia-formatos" className="mt-10 scroll-mt-24 rounded-3xl border border-white/10 bg-zinc-900/45 p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#00C4B0]/15 text-[#65e2d5]">
            <Shapes className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#65e2d5]">
              {t("Guía opcional", "Optional guide")}
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
              {t("Formatos y criterios de diseño", "Design formats and criteria")}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
              {t(
                "Estos siete formatos son referencias visuales, no siete rótulos adicionales. Se mantienen cerrados para que el plan principal sea fácil de leer.",
                "These seven formats are visual references, not seven additional signs. They stay closed so the main plan remains easy to read.",
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls="rotulos-design-guide-content"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#00C4B0]/45 bg-[#00C4B0]/10 px-5 text-sm font-black text-[#9ff5eb] transition hover:bg-[#00C4B0]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00C4B0]"
        >
          {open ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
          {open ? t("Ocultar guía", "Hide guide") : t("Ver guía de formatos", "View format guide")}
        </button>
      </div>

      <div id="rotulos-design-guide-content" hidden={!open}>
        {open ? <SignProposals lang={lang} /> : null}
      </div>
    </section>
  );
}
