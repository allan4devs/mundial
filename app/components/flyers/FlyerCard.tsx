"use client";

import { useCallback, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { Download, Loader2 } from "lucide-react";
import SignLayoutEditor from "../rotulos/layout-editor/SignLayoutEditor";
import type { Lang } from "../rotulos/types";
import FlyerPanel from "./FlyerPanel";
import type { Flyer } from "./types";

type FlyerCardProps = {
  flyer: Flyer;
  lang: Lang;
  /** Solo la primera tarjeta de la cuadrícula: evita el aviso de LCP. */
  eager?: boolean;
};

/** Ancho de exportación en píxeles; el alto sale solo del marco 2:3. */
const EXPORT_WIDTH = 2160;
const EXPORT_HEIGHT = 3240;

type DownloadStatus = "idle" | "working" | "error";

/** Tarjeta de vista previa: código, formato, el lienzo editable tipo Canva y la descarga HQ. */
export default function FlyerCard({ flyer, lang, eager }: FlyerCardProps) {
  const artworkRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<DownloadStatus>("idle");

  const handleDownload = useCallback(async () => {
    const node = artworkRef.current;
    if (!node || status === "working") return;

    setStatus("working");
    try {
      const width = node.getBoundingClientRect().width;
      const pixelRatio = width > 0 ? EXPORT_WIDTH / width : 4;
      const blob = await toBlob(node, { pixelRatio, cacheBust: true });
      if (!blob) throw new Error("No se pudo generar la imagen.");

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `laviejaadventures-${flyer.code.toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus("idle");
    } catch (error) {
      console.error("No se pudo exportar el flyer", error);
      setStatus("error");
    }
  }, [flyer.code, status]);

  return (
    <article
      data-flyer-card
      className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 p-4 shadow-xl shadow-black/30 sm:p-5 xl:rounded-[2rem] xl:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-[#65e2d5]">{flyer.code}</span>
        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-300">
          2:3 · IG
        </span>
      </div>

      <SignLayoutEditor signId={flyer.code} signLabel={flyer.title} lang={lang}>
        <FlyerPanel ref={artworkRef} flyer={flyer} eager={eager} />
      </SignLayoutEditor>

      <button
        type="button"
        onClick={handleDownload}
        disabled={status === "working"}
        title={
          lang === "es"
            ? `Descargar PNG ${EXPORT_WIDTH} × ${EXPORT_HEIGHT}px`
            : `Download PNG ${EXPORT_WIDTH} × ${EXPORT_HEIGHT}px`
        }
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#00C4B0]/50 bg-[#00C4B0]/15 px-4 text-sm font-black uppercase tracking-[0.05em] text-[#9ff5eb] transition hover:border-[#00C4B0]/80 hover:bg-[#00C4B0]/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00C4B0] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "working" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {lang === "es" ? "Generando…" : "Generating…"}
          </>
        ) : (
          <>
            <Download className="h-4 w-4" aria-hidden />
            {lang === "es" ? "Descargar HQ" : "Download HQ"}
          </>
        )}
      </button>
      {status === "error" ? (
        <p className="mt-2 text-center text-xs font-semibold text-red-300">
          {lang === "es"
            ? "No se pudo generar la imagen. Intente de nuevo."
            : "Could not generate the image. Please try again."}
        </p>
      ) : null}
    </article>
  );
}
