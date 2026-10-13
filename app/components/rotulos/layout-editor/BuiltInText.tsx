"use client";

import { useEffect, useState } from "react";
import MovableGroup from "./MovableGroup";
import TextEffectsToolbar from "./TextEffectsToolbar";
import { textEffectClassesFrom } from "./insertableCatalog";
import { useEditableSignCanvas } from "./canvasContext";
import type { LocalizedText, StoredTextFormat, TextFontFamily } from "./types";

type BuiltInTextProps = {
  /** Id estable dentro del panel; también sirve como llave de posición/tamaño. */
  groupId: string;
  label: LocalizedText;
  /** Texto original del plan (data.ts); se usa si no hay override guardado. */
  text: string;
  defaultFontFamily: TextFontFamily;
  defaultBold?: boolean;
  /** Clases fijas: tamaño, color, trazo, sombra. Nunca incluya negrita/cursiva/subrayado/fuente aquí. */
  className: string;
  as?: "p" | "span" | "div";
  movableClassName?: string;
  maxLength?: number;
  deletable?: boolean;
};

/**
 * Envuelve un campo propio del rótulo (kicker, título, subtítulo, CTA) para
 * que se pueda mover, formatear (negrita/cursiva/subrayado/tipografía) y
 * reescribir desde el mismo editor tipo Canva que ya mueve objetos.
 *
 * El formato vive junto a la posición en `StoredGroupLayout.text`, así que
 * "Restablecer" en la barra flotante también revierte el texto al original.
 */
export default function BuiltInText({
  groupId,
  label,
  text,
  defaultFontFamily,
  defaultBold = true,
  className,
  as,
  movableClassName = "",
  maxLength = 120,
  deletable = true,
}: BuiltInTextProps) {
  const Tag = as ?? "p";
  const { lang, getSavedLayout, commitLayout, announce } = useEditableSignCanvas();
  const saved = getSavedLayout(groupId);
  const format: StoredTextFormat = saved?.text ?? {};
  const content = format.content ?? text;
  const [draft, setDraft] = useState(content);

  useEffect(() => {
    setDraft(content);
  }, [content]);

  const bold = format.bold ?? defaultBold;
  const italic = format.italic === true;
  const underline = format.underline === true;
  const fontFamily = format.fontFamily ?? defaultFontFamily;
  const typeClasses = textEffectClassesFrom({ bold, italic, underline }, fontFamily);

  const updateFormat = (patch: Partial<StoredTextFormat>) => {
    commitLayout(groupId, {
      anchor: saved?.anchor ?? { x: 0.5, y: 0.5 },
      scale: saved?.scale ?? 1,
      ...(saved?.hidden ? { hidden: true } : {}),
      text: { ...format, ...patch },
    });
  };

  const saveContent = () => {
    const value = draft.trim().slice(0, maxLength);
    setDraft(value || text);
    updateFormat({ content: !value || value === text ? undefined : value });
    announce(lang === "es" ? "Texto actualizado." : "Text updated.");
  };

  return (
    <MovableGroup
      groupId={groupId}
      label={label}
      className={movableClassName}
      deletable={deletable}
      inspector={
        <div className="grid min-w-56 gap-2">
          <label className="grid gap-1 text-left text-[10px] font-black uppercase tracking-[0.12em] text-zinc-300">
            {lang === "es" ? "Contenido" : "Content"}
            <input
              type="text"
              value={draft}
              maxLength={maxLength}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={saveContent}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              className="min-h-10 rounded-lg border border-white/25 bg-zinc-950 px-3 text-sm font-bold normal-case tracking-normal text-white outline-none focus:border-[#00C4B0]"
            />
          </label>
          <TextEffectsToolbar
            lang={lang}
            bold={bold}
            italic={italic}
            underline={underline}
            fontFamily={fontFamily}
            onToggleBold={() => updateFormat({ bold: !bold })}
            onToggleItalic={() => updateFormat({ italic: !italic })}
            onToggleUnderline={() => updateFormat({ underline: !underline })}
            onFontFamilyChange={(value) => updateFormat({ fontFamily: value })}
          />
        </div>
      }
    >
      <Tag className={`${className} ${typeClasses}`}>{content}</Tag>
    </MovableGroup>
  );
}
