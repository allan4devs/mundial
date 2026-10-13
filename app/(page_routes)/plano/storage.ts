import { CATALOG_BY_ID, STATUS_META } from "./catalog";
import { zoneOfMachine } from "./geometry";
import type { PlanDoc, PlanMachine, PlanObject } from "./types";

export const STORAGE_KEY = "laviej:plano:v1";

export const DEFAULT_DOC: PlanDoc = {
  version: 1,
  name: "Plano del gimnasio",
  gridSize: 0.5,
  pxPerM: 34,
  objects: [],
  updatedAt: new Date().toISOString(),
};

// ───────────────────────────────────────────────
// Load / save (localStorage, guarded for SSR + private mode)
// ───────────────────────────────────────────────
export function loadDoc(): PlanDoc | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeDoc(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveDoc(doc: PlanDoc): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...doc, updatedAt: new Date().toISOString() }),
    );
  } catch {
    /* quota / disabled storage — silently skip, export still works */
  }
}

/** defensive: accept partial / older payloads without throwing */
export function normalizeDoc(input: unknown): PlanDoc {
  const d = (input ?? {}) as Partial<PlanDoc>;
  const objects = Array.isArray(d.objects) ? d.objects.filter(isValidObject) : [];
  return {
    version: 1,
    name: typeof d.name === "string" && d.name.trim() ? d.name : DEFAULT_DOC.name,
    gridSize: clampNum(d.gridSize, 0.1, 5, DEFAULT_DOC.gridSize),
    pxPerM: clampNum(d.pxPerM, 8, 200, DEFAULT_DOC.pxPerM),
    objects,
    updatedAt: new Date().toISOString(),
  };
}

function clampNum(v: unknown, lo: number, hi: number, fallback: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? v : fallback;
  return Math.min(hi, Math.max(lo, n));
}

function isValidObject(o: unknown): o is PlanObject {
  if (!o || typeof o !== "object") return false;
  const r = o as Record<string, unknown>;
  if (typeof r.id !== "string") return false;
  if (r.kind === "rect") {
    return ["x", "y", "w", "h"].every((k) => typeof r[k] === "number");
  }
  if (r.kind === "machine") {
    return (
      typeof r.catalogId === "string" &&
      ["x", "y", "w", "h", "rotation"].every((k) => typeof r[k] === "number")
    );
  }
  return false;
}

// ───────────────────────────────────────────────
// Downloads
// ───────────────────────────────────────────────
export function downloadBlob(data: BlobPart, filename: string, type: string): void {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "plano";

export function exportJSON(doc: PlanDoc): void {
  downloadBlob(
    JSON.stringify(doc, null, 2),
    `${slug(doc.name)}.json`,
    "application/json",
  );
}

export function exportInventoryCSV(doc: PlanDoc): void {
  const machines = doc.objects.filter(
    (o): o is PlanMachine => o.kind === "machine",
  );
  const head = [
    "activo",
    "nombre",
    "categoria",
    "estado",
    "zona",
    "ancho_m",
    "fondo_m",
    "rotacion_deg",
    "pos_x_m",
    "pos_y_m",
    "marca",
    "ultimo_servicio",
    "notas",
  ];
  const rows = machines.map((m) => {
    const cat = CATALOG_BY_ID[m.catalogId];
    return [
      m.assetTag,
      m.label,
      cat?.category ?? "",
      STATUS_META[m.status].label,
      zoneOfMachine(m, doc.objects) ?? "",
      m.w,
      m.h,
      m.rotation,
      Math.round(m.x * 100) / 100,
      Math.round(m.y * 100) / 100,
      m.brand ?? "",
      m.lastService ?? "",
      (m.notes ?? "").replace(/\s+/g, " ").trim(),
    ].map(csvCell);
  });
  const csv = [head.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  // BOM so Excel opens UTF-8 accents correctly
  downloadBlob("﻿" + csv, `${slug(doc.name)}-inventario.csv`, "text/csv");
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Serialize a live <svg> node and hand back a downloadable file. */
export function exportSVG(svg: SVGSVGElement, name: string): void {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const xml = new XMLSerializer().serializeToString(clone);
  downloadBlob(
    '<?xml version="1.0" encoding="UTF-8"?>\n' + xml,
    `${slug(name)}.svg`,
    "image/svg+xml",
  );
}

/** Rasterize a live <svg> node to PNG at 2× and download it. */
export function exportPNG(svg: SVGSVGElement, name: string): void {
  const rect = svg.getBoundingClientRect();
  const scale = 2;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(rect.width));
  clone.setAttribute("height", String(rect.height));
  const xml = new XMLSerializer().serializeToString(clone);
  const svgUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(rect.width * scale));
    canvas.height = Math.max(1, Math.round(rect.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `${slug(name)}.png`, "image/png");
    }, "image/png");
  };
  img.src = svgUrl;
}
