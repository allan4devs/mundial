"use client";

import { Bold, Italic, Underline } from "lucide-react";
import { TEXT_FONT_FAMILY_OPTIONS, localizeInsertableLabel } from "./insertableCatalog";
import type { Lang, TextFontFamily } from "./types";

type TextEffectsToolbarProps = {
  lang: Lang;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontFamily: TextFontFamily;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onToggleUnderline: () => void;
  onFontFamilyChange: (value: TextFontFamily) => void;
};

function toggleButtonClass(active: boolean) {
  return `inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-black transition ${
    active
      ? "border-[#00C4B0] bg-[#00C4B0]/20 text-[#9ff5eb]"
      : "border-white/20 bg-zinc-950 text-white/70 hover:border-white/40"
  }`;
}

/** Barra de negrita/cursiva/subrayado + tipografía, compartida por el texto agregado y los campos propios del rótulo. */
export default function TextEffectsToolbar({
  lang,
  bold,
  italic,
  underline,
  fontFamily,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onFontFamilyChange,
}: TextEffectsToolbarProps) {
  return (
    <div className="col-span-full grid gap-2 border-t border-white/10 pt-2 sm:grid-cols-[auto_minmax(140px,1fr)] sm:items-end">
      <div
        className="flex items-center gap-1"
        role="group"
        aria-label={lang === "es" ? "Formato de texto" : "Text formatting"}
      >
        <button
          type="button"
          onClick={onToggleBold}
          aria-pressed={bold}
          title={lang === "es" ? "Negrita" : "Bold"}
          className={toggleButtonClass(bold)}
        >
          <Bold className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onToggleItalic}
          aria-pressed={italic}
          title={lang === "es" ? "Cursiva" : "Italic"}
          className={toggleButtonClass(italic)}
        >
          <Italic className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onToggleUnderline}
          aria-pressed={underline}
          title={lang === "es" ? "Subrayado" : "Underline"}
          className={toggleButtonClass(underline)}
        >
          <Underline className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <label className="grid gap-1 text-left text-[10px] font-black uppercase tracking-[0.12em] text-zinc-300">
        {lang === "es" ? "Tipografía" : "Typography"}
        <select
          value={fontFamily}
          onChange={(event) => onFontFamilyChange(event.target.value as TextFontFamily)}
          className="min-h-10 rounded-lg border border-white/25 bg-zinc-950 px-2 text-sm font-bold normal-case tracking-normal text-white outline-none focus:border-[#00C4B0]"
        >
          {TEXT_FONT_FAMILY_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {localizeInsertableLabel(option.label, lang)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
