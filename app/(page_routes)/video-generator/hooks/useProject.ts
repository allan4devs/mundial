"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EMPTY_PROJECT, type Project } from "@/lib/video-editor/types";

const KEY = "reel-studio-project-v1";

export function parseProject(value: unknown): Project {
  if (!value || typeof value !== "object") throw new Error("El archivo no contiene un proyecto.");
  const p = value as Project;
  const number = (n: unknown, lo: number, hi: number) => typeof n === "number" && Number.isFinite(n) && n >= lo && n <= hi;
  const id = (v: unknown) => typeof v === "string" && v.length > 0 && v.length < 300;
  const hex = (v: unknown) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);
  if (p.version !== 1 || typeof p.name !== "string" || p.name.length > 120 || !["9:16", "1:1", "16:9", "4:5"].includes(p.aspect) || !Array.isArray(p.clips) || p.clips.length > 100 || !Array.isArray(p.texts) || p.texts.length > 30) throw new Error("Proyecto incompatible o demasiado grande.");
  if (p.clips.some(c => !c || !id(c.id) || !id(c.assetId) || !number(c.in, 0, 86400) || !number(c.out, c.in + 0.05, 86400) || !number(c.speed, 0.25, 4) || !number(c.volume, 0, 1) || !number(c.x, 0, 1) || !number(c.y, 0, 1) || !number(c.zoom, 1, 3) || !number(c.fade, 0, 2) || !["cover", "contain"].includes(c.fit) || !["original", "vivid", "warm", "mono", "cinema"].includes(c.look))) throw new Error("Hay clips con ajustes inválidos.");
  if (p.texts.some(t => !t || !id(t.id) || typeof t.text !== "string" || t.text.length > 500 || !number(t.start, 0, 86400) || !number(t.end, t.start + 0.05, 86400) || !number(t.x, 0, 1) || !number(t.y, 0, 1) || !number(t.size, 0.02, 0.25) || !hex(t.color) || !(t.background === "transparent" || hex(t.background)) || !["left", "center", "right"].includes(t.align))) throw new Error("Hay textos con ajustes inválidos.");
  const m = p.music;
  if (m !== null && (!m || !id(m.assetId) || !number(m.in, 0, 86400) || !number(m.out, m.in + 0.05, 86400) || !number(m.offset, 0, 86400) || !number(m.volume, 0, 1) || !number(m.fadeIn, 0, 10) || !number(m.fadeOut, 0, 10) || typeof m.loop !== "boolean")) throw new Error("La pista de audio tiene ajustes inválidos.");
  if (new Set([...p.clips, ...p.texts].map(item => item.id)).size !== p.clips.length + p.texts.length) throw new Error("El proyecto contiene identificadores repetidos.");
  return p;
}

export function useProject() {
  const [project, setProject] = useState<Project>(EMPTY_PROJECT);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const [storageError, setStorageError] = useState("");
  const current = useRef(project);
  const past = useRef<Project[]>([]);
  const future = useRef<Project[]>([]);
  const gesture = useRef<Project | null>(null);
  const restored = useRef(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const p = parseProject(JSON.parse(raw)); current.current = p; setProject(p); restored.current = true; }
    } catch { setStorageError("No se pudo recuperar el borrador anterior. Puedes abrir un archivo de proyecto."); }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    setSaved(false);
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(project)); setSaved(true); }
      catch { setStorageError("No se pudo guardar en este navegador. Descarga tu proyecto para conservarlo."); }
    }, 450);
    return () => clearTimeout(timer);
  }, [project, ready]);

  const change = useCallback((next: Project, commit = true) => {
    const previous = current.current;
    if (!commit && !gesture.current) gesture.current = previous;
    if (commit) {
      const base = gesture.current ?? previous;
      if (JSON.stringify(base) !== JSON.stringify(next)) { past.current = [...past.current.slice(-59), base]; future.current = []; }
      gesture.current = null;
    }
    current.current = next;
    setProject(next);
    setRevision(v => v + 1);
  }, []);

  const travel = useCallback((direction: "undo" | "redo") => {
    if (gesture.current) { past.current.push(gesture.current); gesture.current = null; future.current = []; }
    const source = direction === "undo" ? past : future;
    const target = direction === "undo" ? future : past;
    const next = source.current.pop();
    if (!next) return;
    target.current.push(current.current);
    current.current = next;
    setProject(next);
    setRevision(v => v + 1);
  }, []);

  return { project, current, change, ready, saved, storageError, restored, revision, canUndo: past.current.length > 0, canRedo: future.current.length > 0, undo: () => travel("undo"), redo: () => travel("redo") };
}
