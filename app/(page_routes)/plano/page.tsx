"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as RMouseEvent,
  type PointerEvent as RPointerEvent,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileUp,
  Grid3x3,
  HelpCircle,
  Magnet,
  Maximize,
  Minus,
  Plus,
  Redo2,
  Ruler,
  Sparkles,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { cn } from "@/lib/helpers/utils";
import { CanvasSurface, RULER, type GhostRect } from "./CanvasSurface";
import { Palette } from "./Palette";
import { Inspector } from "./Inspector";
import {
  buildSampleObjects,
  CATALOG_BY_ID,
  ZONE_BY_ID,
  ZONE_PRESETS,
} from "./catalog";
import {
  clean,
  localPoint,
  pickAt,
  resizeRect,
  screenToWorld,
  snapVec,
  unionBounds,
  type Anchor,
  type View,
} from "./geometry";
import {
  DEFAULT_DOC,
  exportInventoryCSV,
  exportJSON,
  exportPNG,
  exportSVG,
  loadDoc,
  normalizeDoc,
  saveDoc,
} from "./storage";
import type { PlanMachine, PlanObject, PlanRect, Tool, Vec2 } from "./types";

type Gesture =
  | { type: "pan"; startClient: Vec2; startOffset: Vec2 }
  | { type: "move"; id: string; startWorld: Vec2; startObj: PlanObject }
  | { type: "resize"; id: string; anchor: Anchor; startRect: PlanRect }
  | { type: "rotate"; id: string; center: Vec2 }
  | { type: "draw"; startWorld: Vec2 }
  | null;

const ZOOM_MIN = 0.12;
const ZOOM_MAX = 8;
const uid = (p: string) =>
  p +
  (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10));

export default function PlanoPage() {
  // ── doc meta ──
  const [name, setName] = useState(DEFAULT_DOC.name);
  const [gridSize, setGridSize] = useState(DEFAULT_DOC.gridSize);
  const [pxPerM, setPxPerM] = useState(DEFAULT_DOC.pxPerM);

  // ── document ──
  const [objects, setObjects] = useState<PlanObject[]>([]);
  const objectsRef = useRef(objects);
  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  // ── editor state ──
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [pendingCatalogId, setPendingCatalogId] = useState<string | null>(null);
  const [rectZoneId, setRectZoneId] = useState<string>(ZONE_PRESETS[0].id);
  const [tab, setTab] = useState<"props" | "inv">("props");

  // ── view ──
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Vec2>({ x: RULER + 48, y: RULER + 48 });
  const view = useMemo<View>(() => ({ ppm: pxPerM * zoom, offset }), [pxPerM, zoom, offset]);
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  // ── toggles ──
  const [snapOn, setSnapOn] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showDims, setShowDims] = useState(true);
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // ── transient ──
  const [cursorWorld, setCursorWorld] = useState<Vec2 | null>(null);
  const [draftRect, setDraftRect] = useState<GhostRect | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);

  // ── refs ──
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgElRef = useRef<SVGSVGElement | null>(null);
  const gestureRef = useRef<Gesture>(null);
  const dragBaselineRef = useRef<PlanObject[] | null>(null);
  const undoRef = useRef<PlanObject[][]>([]);
  const redoRef = useRef<PlanObject[][]>([]);
  const spaceRef = useRef(false);
  const loadedRef = useRef(false);
  const fittedRef = useRef(false);
  const lastEditRef = useRef<{ id: string; t: number }>({ id: "", t: 0 });
  const [hist, setHist] = useState({ u: 0, r: 0 }); // undo/redo stack depths, for the toolbar
  const syncHist = useCallback(
    () => setHist({ u: undoRef.current.length, r: redoRef.current.length }),
    [],
  );

  const snapStep = snapOn ? gridSize : 0.05;
  const selected = useMemo(
    () => objects.find((o) => o.id === selectedId) ?? null,
    [objects, selectedId],
  );

  // ───────────────────────────────────────────────
  // history
  // ───────────────────────────────────────────────
  const pushUndo = useCallback(
    (snapshot: PlanObject[]) => {
      undoRef.current.push(snapshot);
      if (undoRef.current.length > 120) undoRef.current.shift();
      redoRef.current = [];
      syncHist();
    },
    [syncHist],
  );

  const commit = useCallback(
    (updater: (prev: PlanObject[]) => PlanObject[]) => {
      pushUndo(objectsRef.current);
      setObjects((prev) => updater(prev));
    },
    [pushUndo],
  );

  const undo = useCallback(() => {
    if (!undoRef.current.length) return;
    redoRef.current.push(objectsRef.current);
    const prev = undoRef.current.pop()!;
    setObjects(prev);
    setSelectedId((id) => (id && prev.some((o) => o.id === id) ? id : null));
    syncHist();
  }, [syncHist]);

  const redo = useCallback(() => {
    if (!redoRef.current.length) return;
    undoRef.current.push(objectsRef.current);
    const next = redoRef.current.pop()!;
    setObjects(next);
    setSelectedId((id) => (id && next.some((o) => o.id === id) ? id : null));
    syncHist();
  }, [syncHist]);

  // ───────────────────────────────────────────────
  // load / persist / resize
  // ───────────────────────────────────────────────
  useEffect(() => {
    const d = loadDoc();
    if (d) {
      setName(d.name);
      setGridSize(d.gridSize);
      setPxPerM(d.pxPerM);
      setObjects(d.objects);
    }
    loadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    const t = window.setTimeout(() => {
      saveDoc({ version: 1, name, gridSize, pxPerM, objects, updatedAt: "" });
    }, 400);
    return () => window.clearTimeout(t);
  }, [name, gridSize, pxPerM, objects]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // ───────────────────────────────────────────────
  // view helpers
  // ───────────────────────────────────────────────
  const toWorld = useCallback((clientX: number, clientY: number): Vec2 => {
    const svg = svgElRef.current;
    if (!svg) return { x: 0, y: 0 };
    return screenToWorld(localPoint(svg, clientX, clientY), viewRef.current);
  }, []);

  const zoomAround = useCallback(
    (factor: number, pivotLocal: Vec2) => {
      setZoom((z) => {
        const nz = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z * factor));
        const v = viewRef.current;
        const worldAt = screenToWorld(pivotLocal, v);
        const nppm = pxPerM * nz;
        setOffset({
          x: pivotLocal.x - worldAt.x * nppm,
          y: pivotLocal.y - worldAt.y * nppm,
        });
        return nz;
      });
    },
    [pxPerM],
  );

  const zoomButtons = useCallback(
    (factor: number) => zoomAround(factor, { x: size.w / 2, y: size.h / 2 }),
    [zoomAround, size.w, size.h],
  );

  const fitView = useCallback(
    (objs: PlanObject[] = objectsRef.current) => {
      if (size.w < 40 || size.h < 40) return;
      const b = unionBounds(objs) ?? { minX: 0, minY: 0, maxX: 20, maxY: 14 };
      const availW = Math.max(80, size.w - RULER - 32);
      const availH = Math.max(80, size.h - RULER - 32);
      const bw = Math.max(1, b.maxX - b.minX);
      const bh = Math.max(1, b.maxY - b.minY);
      const nz = Math.min(
        ZOOM_MAX,
        Math.max(ZOOM_MIN, Math.min(availW / (bw * pxPerM), availH / (bh * pxPerM)) * 0.92),
      );
      const nppm = pxPerM * nz;
      const cx = (b.minX + b.maxX) / 2;
      const cy = (b.minY + b.maxY) / 2;
      setZoom(nz);
      setOffset({
        x: RULER + (size.w - RULER) / 2 - cx * nppm,
        y: RULER + (size.h - RULER) / 2 - cy * nppm,
      });
    },
    [pxPerM, size.w, size.h],
  );

  useEffect(() => {
    if (fittedRef.current || !loadedRef.current || size.w < 40) return;
    fittedRef.current = true;
    if (objectsRef.current.length) fitView(objectsRef.current);
  }, [size.w, size.h, fitView]);

  // ───────────────────────────────────────────────
  // mutations
  // ───────────────────────────────────────────────
  const nextAssetTag = useCallback((code: string) => {
    const used = objectsRef.current
      .filter((o): o is PlanMachine => o.kind === "machine" && o.assetTag.startsWith(code + "-"))
      .map((o) => parseInt(o.assetTag.slice(code.length + 1), 10))
      .filter((n) => Number.isFinite(n));
    const n = (used.length ? Math.max(...used) : 0) + 1;
    return `${code}-${String(n).padStart(2, "0")}`;
  }, []);

  const addMachine = useCallback(
    (catalogId: string, at: Vec2) => {
      const cat = CATALOG_BY_ID[catalogId];
      if (!cat) return;
      const p = snapVec(at, snapStep);
      const m: PlanMachine = {
        id: uid("m_"),
        kind: "machine",
        catalogId,
        label: cat.label,
        assetTag: nextAssetTag(cat.code),
        x: clean(p.x),
        y: clean(p.y),
        w: cat.w,
        h: cat.h,
        rotation: 0,
        status: "ok",
      };
      commit((prev) => [...prev, m]);
      setSelectedId(m.id);
    },
    [commit, nextAssetTag, snapStep],
  );

  const addRect = useCallback(
    (r: GhostRect) => {
      const preset = ZONE_BY_ID[rectZoneId] ?? ZONE_PRESETS[ZONE_PRESETS.length - 1];
      const sameLabel = objectsRef.current.filter(
        (o) => o.kind === "rect" && o.label.startsWith(preset.label),
      ).length;
      const rect: PlanRect = {
        id: uid("r_"),
        kind: "rect",
        label: sameLabel ? `${preset.label} ${sameLabel + 1}` : preset.label,
        x: clean(r.x),
        y: clean(r.y),
        w: clean(r.w),
        h: clean(r.h),
        color: preset.color,
        zone: preset.id,
      };
      commit((prev) => [rect, ...prev]); // rects live at the back of the z-order
      setSelectedId(rect.id);
      setTool("select");
    },
    [commit, rectZoneId],
  );

  const updateObject = useCallback(
    (id: string, patch: Partial<PlanRect> & Partial<PlanMachine>) => {
      const now = Date.now();
      const grouped = lastEditRef.current.id === id && now - lastEditRef.current.t < 700;
      lastEditRef.current = { id, t: now };

      const apply = (prev: PlanObject[]) =>
        prev.map((o) => {
          if (o.id !== id) return o;
          const merged = { ...o, ...patch } as PlanObject;
          merged.x = clean(merged.x);
          merged.y = clean(merged.y);
          merged.w = Math.max(0.1, clean(merged.w));
          merged.h = Math.max(0.1, clean(merged.h));
          if (merged.kind === "machine") {
            merged.rotation = ((Math.round(merged.rotation) % 360) + 360) % 360;
          }
          return merged;
        });

      if (grouped) setObjects(apply);
      else commit(apply);
    },
    [commit],
  );

  const deleteObject = useCallback(
    (id: string) => {
      commit((prev) => prev.filter((o) => o.id !== id));
      setSelectedId((s) => (s === id ? null : s));
    },
    [commit],
  );

  const duplicateObject = useCallback(
    (id: string) => {
      const src = objectsRef.current.find((o) => o.id === id);
      if (!src) return;
      const d = Math.max(0.3, gridSize);
      let clone: PlanObject;
      if (src.kind === "rect") {
        clone = { ...src, id: uid("r_"), x: clean(src.x + d), y: clean(src.y + d) };
        commit((prev) => [clone, ...prev]);
      } else {
        const cat = CATALOG_BY_ID[src.catalogId];
        clone = {
          ...src,
          id: uid("m_"),
          x: clean(src.x + d),
          y: clean(src.y + d),
          assetTag: cat ? nextAssetTag(cat.code) : src.assetTag,
        };
        commit((prev) => [...prev, clone]);
      }
      setSelectedId(clone.id);
    },
    [commit, gridSize, nextAssetTag],
  );

  const rotateSelected = useCallback(
    (delta: number) => {
      if (!selected || selected.kind !== "machine") return;
      updateObject(selected.id, { rotation: selected.rotation + delta });
    },
    [selected, updateObject],
  );

  const nudge = useCallback(
    (dx: number, dy: number) => {
      if (!selected) return;
      commit((prev) =>
        prev.map((o) =>
          o.id === selected.id ? { ...o, x: clean(o.x + dx), y: clean(o.y + dy) } : o,
        ),
      );
    },
    [selected, commit],
  );

  const exportCSV = useCallback(
    () =>
      exportInventoryCSV({
        version: 1,
        name,
        gridSize,
        pxPerM,
        objects: objectsRef.current,
        updatedAt: "",
      }),
    [name, gridSize, pxPerM],
  );

  const setSvgEl = useCallback((el: SVGSVGElement | null) => {
    svgElRef.current = el;
  }, []);
  const noop = useCallback(() => {}, []);

  const focusObject = useCallback(
    (id: string) => {
      const o = objectsRef.current.find((x) => x.id === id);
      setSelectedId(id);
      setTab("props");
      if (!o || size.w < 40) return;
      const c =
        o.kind === "rect" ? { x: o.x + o.w / 2, y: o.y + o.h / 2 } : { x: o.x, y: o.y };
      const nppm = pxPerM * zoom;
      setOffset({
        x: RULER + (size.w - RULER) / 2 - c.x * nppm,
        y: RULER + (size.h - RULER) / 2 - c.y * nppm,
      });
    },
    [pxPerM, zoom, size.w, size.h],
  );

  // ───────────────────────────────────────────────
  // pointer gestures
  // ───────────────────────────────────────────────
  const endGesture = useCallback(() => {
    const g = gestureRef.current;
    const baseline = dragBaselineRef.current;
    if (g && baseline && (g.type === "move" || g.type === "resize" || g.type === "rotate")) {
      if (baseline !== objectsRef.current) pushUndo(baseline);
    }
    if (g?.type === "draw") {
      const d = draftRect;
      if (d && d.w >= 0.15 && d.h >= 0.15) addRect(d);
      setDraftRect(null);
    }
    gestureRef.current = null;
    dragBaselineRef.current = null;
  }, [pushUndo, draftRect, addRect]);

  const onPointerDown = useCallback(
    (e: RPointerEvent) => {
      if (e.button === 2) return;
      const svg = svgElRef.current;
      if (!svg) return;
      svg.setPointerCapture?.(e.pointerId);
      const world = toWorld(e.clientX, e.clientY);
      const wantsPan = e.button === 1 || tool === "pan" || spaceRef.current;

      if (wantsPan) {
        gestureRef.current = {
          type: "pan",
          startClient: { x: e.clientX, y: e.clientY },
          startOffset: { ...viewRef.current.offset },
        };
        return;
      }

      if (tool === "rect") {
        const s = snapVec(world, snapStep);
        gestureRef.current = { type: "draw", startWorld: s };
        setDraftRect({ x: s.x, y: s.y, w: 0, h: 0 });
        setSelectedId(null);
        return;
      }

      if (tool === "machine" && pendingCatalogId) {
        addMachine(pendingCatalogId, world);
        return;
      }

      // select
      const hit = pickAt(objectsRef.current, world);
      if (hit) {
        setSelectedId(hit.id);
        gestureRef.current = { type: "move", id: hit.id, startWorld: world, startObj: hit };
        dragBaselineRef.current = objectsRef.current;
      } else {
        setSelectedId(null);
        gestureRef.current = {
          type: "pan",
          startClient: { x: e.clientX, y: e.clientY },
          startOffset: { ...viewRef.current.offset },
        };
      }
    },
    [tool, pendingCatalogId, snapStep, toWorld, addMachine],
  );

  const onHandleDown = useCallback(
    (anchor: Anchor, e: RPointerEvent) => {
      e.stopPropagation();
      if (!selected || selected.kind !== "rect") return;
      svgElRef.current?.setPointerCapture?.(e.pointerId);
      gestureRef.current = { type: "resize", id: selected.id, anchor, startRect: selected };
      dragBaselineRef.current = objectsRef.current;
    },
    [selected],
  );

  const onRotateDown = useCallback(
    (e: RPointerEvent) => {
      e.stopPropagation();
      if (!selected || selected.kind !== "machine") return;
      svgElRef.current?.setPointerCapture?.(e.pointerId);
      gestureRef.current = {
        type: "rotate",
        id: selected.id,
        center: { x: selected.x, y: selected.y },
      };
      dragBaselineRef.current = objectsRef.current;
    },
    [selected],
  );

  const onPointerMove = useCallback(
    (e: RPointerEvent) => {
      const world = toWorld(e.clientX, e.clientY);
      setCursorWorld(world);
      const g = gestureRef.current;
      if (!g) {
        if (tool === "select") {
          const hit = pickAt(objectsRef.current, world);
          setHoverId(hit?.id ?? null);
        } else if (hoverId) {
          setHoverId(null);
        }
        return;
      }

      if (g.type === "pan") {
        setOffset({
          x: g.startOffset.x + (e.clientX - g.startClient.x),
          y: g.startOffset.y + (e.clientY - g.startClient.y),
        });
        return;
      }

      if (g.type === "draw") {
        const s = snapVec(world, snapStep);
        setDraftRect({
          x: Math.min(s.x, g.startWorld.x),
          y: Math.min(s.y, g.startWorld.y),
          w: Math.abs(s.x - g.startWorld.x),
          h: Math.abs(s.y - g.startWorld.y),
        });
        return;
      }

      if (g.type === "move") {
        const dx = world.x - g.startWorld.x;
        const dy = world.y - g.startWorld.y;
        setObjects((prev) =>
          prev.map((o) => {
            if (o.id !== g.id) return o;
            const nx = g.startObj.x + dx;
            const ny = g.startObj.y + dy;
            const sp = snapVec({ x: nx, y: ny }, snapStep);
            return { ...o, x: clean(sp.x), y: clean(sp.y) };
          }),
        );
        return;
      }

      if (g.type === "resize") {
        const r = resizeRect(g.startRect, g.anchor, world, snapStep);
        setObjects((prev) =>
          prev.map((o) => (o.id === g.id && o.kind === "rect" ? { ...o, ...r } : o)),
        );
        return;
      }

      if (g.type === "rotate") {
        const ang = Math.atan2(world.y - g.center.y, world.x - g.center.x);
        let deg = (ang * 180) / Math.PI + 90;
        if (!e.altKey) deg = Math.round(deg / 15) * 15;
        deg = ((Math.round(deg) % 360) + 360) % 360;
        setObjects((prev) =>
          prev.map((o) => (o.id === g.id && o.kind === "machine" ? { ...o, rotation: deg } : o)),
        );
      }
    },
    [toWorld, tool, hoverId, snapStep],
  );

  const onPointerUp = useCallback(
    (e: RPointerEvent) => {
      svgElRef.current?.releasePointerCapture?.(e.pointerId);
      endGesture();
    },
    [endGesture],
  );

  const onPointerLeave = useCallback(() => {
    setCursorWorld(null);
    setHoverId(null);
  }, []);

  const onDoubleClick = useCallback(
    (e: RMouseEvent) => {
      const world = toWorld(e.clientX, e.clientY);
      const hit = pickAt(objectsRef.current, world);
      if (hit) {
        setSelectedId(hit.id);
        setTab("props");
      } else {
        fitView();
      }
    },
    [toWorld, fitView],
  );

  // native non-passive wheel
  useEffect(() => {
    const svg = svgElRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.006 : 0.0012));
      zoomAround(factor, localPoint(svg, e.clientX, e.clientY));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [zoomAround]);

  // ───────────────────────────────────────────────
  // keyboard
  // ───────────────────────────────────────────────
  useEffect(() => {
    const isField = (t: EventTarget | null) =>
      t instanceof HTMLElement &&
      (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !spaceRef.current && !isField(e.target)) {
        spaceRef.current = true;
        setSpaceHeld(true);
        e.preventDefault();
        return;
      }
      const mod = e.ctrlKey || e.metaKey;

      if (e.key === "Escape") {
        setTool("select");
        setPendingCatalogId(null);
        setDraftRect(null);
        setSelectedId(null);
        gestureRef.current = null;
        setExportOpen(false);
        setShowHelp(false);
        return;
      }

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (selectedId) duplicateObject(selectedId);
        return;
      }

      if (isField(e.target)) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          e.preventDefault();
          deleteObject(selectedId);
        }
        return;
      }
      if (e.key === "v" || e.key === "V") setTool("select");
      else if (e.key === "h" || e.key === "H") setTool("pan");
      else if (e.key === "b" || e.key === "B") setTool("rect");
      else if (e.key === "r") rotateSelected(15);
      else if (e.key === "R") rotateSelected(-15);
      else if (e.key === "f" || e.key === "F") fitView();
      else if (e.key === "+" || e.key === "=") zoomButtons(1.2);
      else if (e.key === "-" || e.key === "_") zoomButtons(1 / 1.2);
      else if (e.key === "0") {
        setZoom(1);
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const d = e.shiftKey ? 1 : snapOn ? gridSize : 0.1;
        if (e.key === "ArrowLeft") nudge(-d, 0);
        else if (e.key === "ArrowRight") nudge(d, 0);
        else if (e.key === "ArrowUp") nudge(0, -d);
        else if (e.key === "ArrowDown") nudge(0, d);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceRef.current = false;
        setSpaceHeld(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    selectedId,
    snapOn,
    gridSize,
    undo,
    redo,
    duplicateObject,
    deleteObject,
    rotateSelected,
    nudge,
    fitView,
    zoomButtons,
  ]);

  // ───────────────────────────────────────────────
  // header actions
  // ───────────────────────────────────────────────
  const loadSample = () => {
    if (objectsRef.current.length && !window.confirm("Reemplazar el plano actual con el ejemplo?")) return;
    const objs = buildSampleObjects();
    pushUndo(objectsRef.current);
    setObjects(objs);
    setSelectedId(null);
    setName("Gimnasio — ejemplo");
    requestAnimationFrame(() => fitView(objs));
  };

  const clearAll = () => {
    if (!objectsRef.current.length) return;
    if (!window.confirm("Vaciar el plano? Podés deshacer con Ctrl+Z.")) return;
    pushUndo(objectsRef.current);
    setObjects([]);
    setSelectedId(null);
  };

  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const doc = normalizeDoc(JSON.parse(String(reader.result)));
        pushUndo(objectsRef.current);
        setName(doc.name);
        setGridSize(doc.gridSize);
        setPxPerM(doc.pxPerM);
        setObjects(doc.objects);
        setSelectedId(null);
        fittedRef.current = false;
      } catch {
        window.alert("No se pudo leer el archivo JSON.");
      }
    };
    reader.readAsText(file);
  };

  const doc = { version: 1 as const, name, gridSize, pxPerM, objects, updatedAt: "" };

  const ghost = useMemo(() => {
    if (tool !== "machine" || !pendingCatalogId || !cursorWorld) return null;
    const cat = CATALOG_BY_ID[pendingCatalogId];
    if (!cat) return null;
    const p = snapVec(cursorWorld, snapStep);
    return { x: p.x, y: p.y, w: cat.w, h: cat.h, color: "#22d3ee" };
  }, [tool, pendingCatalogId, cursorWorld, snapStep]);

  const machineCount = objects.reduce((n, o) => n + (o.kind === "machine" ? 1 : 0), 0);
  const rectCount = objects.length - machineCount;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#0b1220] text-slate-200 font-[family-name:var(--font-manrope)]">
      {/* ── header ── */}
      <header className="z-20 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/10 bg-[#0e1728] px-3 py-2">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-[12px] text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">La Vieja</span>
        </Link>
        <div className="h-5 w-px bg-white/10" />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 max-w-[220px] flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[13px] font-semibold text-white hover:border-white/15 focus:border-cyan-400/60 focus:outline-none"
        />

        <div className="flex items-center gap-1">
          <IconBtn label="Deshacer (Ctrl+Z)" disabled={hist.u === 0} onClick={undo}>
            <Undo2 className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Rehacer (Ctrl+Shift+Z)" disabled={hist.r === 0} onClick={redo}>
            <Redo2 className="h-4 w-4" />
          </IconBtn>
        </div>

        <div className="flex items-center gap-1">
          <IconBtn label="Ajustar a la vista (F)" onClick={() => fitView()}>
            <Maximize className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Alejar (−)" onClick={() => zoomButtons(1 / 1.2)}>
            <Minus className="h-4 w-4" />
          </IconBtn>
          <button
            onClick={() => setZoom(1)}
            className="min-w-[46px] rounded-md border border-white/12 px-1.5 py-1 text-center text-[11px] tabular-nums text-slate-300 hover:border-white/30"
            title="Zoom 100%"
          >
            {Math.round(zoom * 100)}%
          </button>
          <IconBtn label="Acercar (+)" onClick={() => zoomButtons(1.2)}>
            <Plus className="h-4 w-4" />
          </IconBtn>
        </div>

        <div className="flex items-center gap-1">
          <Toggle active={snapOn} onClick={() => setSnapOn((v) => !v)} label="Ajuste a cuadrícula">
            <Magnet className="h-4 w-4" />
          </Toggle>
          <Toggle active={showGrid} onClick={() => setShowGrid((v) => !v)} label="Cuadrícula">
            <Grid3x3 className="h-4 w-4" />
          </Toggle>
          <Toggle active={showDims} onClick={() => setShowDims((v) => !v)} label="Cotas / medidas">
            <Ruler className="h-4 w-4" />
          </Toggle>
          <select
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            title="Tamaño de la cuadrícula"
            className="rounded-md border border-white/12 bg-transparent px-1.5 py-1 text-[11px] text-slate-300 focus:outline-none"
          >
            {[0.25, 0.5, 1].map((g) => (
              <option key={g} value={g} className="bg-[#0e1728]">
                {g} m
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={loadSample}
            className="flex items-center gap-1 rounded-md border border-white/12 px-2 py-1 text-[11px] text-slate-300 hover:border-white/30"
          >
            <Sparkles className="h-3.5 w-3.5" /> Ejemplo
          </button>
          <IconBtn label="Vaciar plano" onClick={clearAll} disabled={!objects.length}>
            <Trash2 className="h-4 w-4" />
          </IconBtn>
          <label
            className="flex cursor-pointer items-center gap-1 rounded-md border border-white/12 px-2 py-1 text-[11px] text-slate-300 hover:border-white/30"
            title="Importar JSON"
          >
            <FileUp className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Importar</span>
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importJSON(f);
                e.target.value = "";
              }}
            />
          </label>
          <div className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              className="flex items-center gap-1 rounded-md border border-white/12 px-2 py-1 text-[11px] text-slate-300 hover:border-white/30"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Exportar</span>
            </button>
            {exportOpen && (
              <div
                className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-lg border border-white/12 bg-[#0e1728] py-1 shadow-xl"
                onMouseLeave={() => setExportOpen(false)}
              >
                {[
                  { k: "json", t: "Plano (.json)" },
                  { k: "svg", t: "Dibujo (.svg)" },
                  { k: "png", t: "Imagen (.png)" },
                  { k: "csv", t: "Inventario (.csv)" },
                ].map((it) => (
                  <button
                    key={it.k}
                    onClick={() => {
                      setExportOpen(false);
                      if (it.k === "json") exportJSON(doc);
                      else if (it.k === "csv") exportInventoryCSV(doc);
                      else if (svgElRef.current && it.k === "svg") exportSVG(svgElRef.current, name);
                      else if (svgElRef.current && it.k === "png") exportPNG(svgElRef.current, name);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-[12px] text-slate-300 hover:bg-white/5"
                  >
                    {it.t}
                  </button>
                ))}
              </div>
            )}
          </div>
          <IconBtn label="Atajos de teclado" onClick={() => setShowHelp((v) => !v)}>
            <HelpCircle className="h-4 w-4" />
          </IconBtn>
        </div>
      </header>

      {/* ── body ── */}
      <div className="relative flex min-h-0 flex-1">
        {showLeft && (
          <aside className="hidden w-[248px] shrink-0 border-r border-white/10 bg-[#0e1728] md:flex">
            <Palette
              tool={tool}
              pendingCatalogId={pendingCatalogId}
              rectZoneId={rectZoneId}
              onTool={(t) => {
                setTool(t);
                if (t !== "machine") setPendingCatalogId(null);
              }}
              onPickMachine={(id) => {
                setPendingCatalogId(id);
                setTool("machine");
              }}
              onPickZone={(id) => {
                setRectZoneId(id);
                setTool("rect");
              }}
            />
          </aside>
        )}

        <main ref={wrapRef} className="relative min-w-0 flex-1 overflow-hidden">
          <CanvasSurface
            objects={objects}
            view={view}
            size={size}
            gridSize={gridSize}
            showGrid={showGrid}
            showDims={showDims}
            tool={tool}
            selectedId={selectedId}
            hoverId={hoverId}
            draftRect={draftRect}
            ghost={ghost}
            cursorWorld={cursorWorld}
            panning={spaceHeld || gestureRef.current?.type === "pan"}
            setSvgEl={setSvgEl}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
            onWheel={noop}
            onHandleDown={onHandleDown}
            onRotateDown={onRotateDown}
            onDoubleClick={onDoubleClick}
          />

          {/* empty state */}
          {objects.length === 0 && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="pointer-events-auto max-w-sm rounded-2xl border border-white/10 bg-[#0e1728]/90 p-5 text-center backdrop-blur">
                <h2 className="font-[family-name:var(--font-bricolage)] text-lg font-bold text-white">
                  Plano vacío
                </h2>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-400">
                  Usá la herramienta <b className="text-slate-200">Cuadro</b> para dibujar el piso del
                  gimnasio y las zonas, luego arrastrá máquinas del catálogo.
                </p>
                <div className="mt-3 flex justify-center gap-2">
                  <button
                    onClick={() => {
                      setTool("rect");
                      setRectZoneId(ZONE_PRESETS[0].id);
                    }}
                    className="rounded-lg bg-cyan-400 px-3 py-1.5 text-[12px] font-semibold text-cyan-950 transition hover:bg-cyan-300"
                  >
                    Dibujar el piso
                  </button>
                  <button
                    onClick={loadSample}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-[12px] text-slate-200 transition hover:border-white/35"
                  >
                    Cargar ejemplo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* tool hint */}
          {(tool === "rect" || tool === "machine") && (
            <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-white/10 bg-[#0e1728]/90 px-3 py-1 text-[11px] text-slate-300 backdrop-blur">
              {tool === "rect"
                ? `Cuadro · ${(ZONE_BY_ID[rectZoneId] ?? ZONE_PRESETS[0]).label} — arrastrá para dibujar · Esc para salir`
                : `Colocando: ${CATALOG_BY_ID[pendingCatalogId ?? ""]?.label ?? "máquina"} — clic para colocar · Esc para salir`}
            </div>
          )}

          {/* panel toggles */}
          <button
            onClick={() => setShowLeft((v) => !v)}
            className="absolute left-2 top-2 hidden rounded-md border border-white/10 bg-[#0e1728]/80 px-1.5 py-1 text-[10px] text-slate-400 backdrop-blur hover:text-white md:block"
          >
            {showLeft ? "‹ catálogo" : "catálogo ›"}
          </button>
          <button
            onClick={() => setShowRight((v) => !v)}
            className="absolute right-2 top-2 hidden rounded-md border border-white/10 bg-[#0e1728]/80 px-1.5 py-1 text-[10px] text-slate-400 backdrop-blur hover:text-white md:block"
          >
            {showRight ? "inspector ›" : "‹ inspector"}
          </button>

          {/* status bar */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 bg-[#0e1728]/95 px-3 py-1 text-[11px] tabular-nums text-slate-400 backdrop-blur">
            <span className="text-slate-500">
              X <span className="text-slate-300">{cursorWorld ? cursorWorld.x.toFixed(2) : "—"}</span> m
            </span>
            <span className="text-slate-500">
              Y <span className="text-slate-300">{cursorWorld ? cursorWorld.y.toFixed(2) : "—"}</span> m
            </span>
            <span className="text-slate-500">
              Zoom <span className="text-slate-300">{Math.round(zoom * 100)}%</span>
            </span>
            <span className="text-slate-500">
              Grid <span className="text-slate-300">{gridSize} m</span> · snap{" "}
              <span className={snapOn ? "text-cyan-300" : "text-slate-600"}>{snapOn ? "on" : "off"}</span>
            </span>
            <span className="text-slate-500">
              {rectCount} cuadros · {machineCount} máquinas
            </span>
            {selected && (
              <span className="text-slate-500">
                Sel:{" "}
                <span className="text-slate-300">
                  {selected.kind === "rect"
                    ? `${selected.w.toFixed(2)}×${selected.h.toFixed(2)} m`
                    : `${(selected as PlanMachine).assetTag} · ${selected.w.toFixed(2)}×${selected.h.toFixed(2)} m · ${Math.round((selected as PlanMachine).rotation)}°`}
                </span>
              </span>
            )}
          </div>

          {showHelp && <HelpCard onClose={() => setShowHelp(false)} />}
        </main>

        {showRight && (
          <aside className="hidden w-[300px] shrink-0 border-l border-white/10 bg-[#0e1728] lg:flex">
            <Inspector
              objects={objects}
              selected={selected}
              tab={tab}
              gridSize={gridSize}
              onTab={setTab}
              onUpdate={updateObject}
              onDelete={deleteObject}
              onDuplicate={duplicateObject}
              onFocus={focusObject}
              onExportCSV={exportCSV}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────
// header bits
// ───────────────────────────────────────────────
function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-7 w-7 place-items-center rounded-md border border-white/12 text-slate-300 transition hover:border-white/30 hover:text-white disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function Toggle({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md border transition",
        active
          ? "border-cyan-400/70 bg-cyan-400/10 text-cyan-300"
          : "border-white/12 text-slate-400 hover:border-white/30 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

function HelpCard({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [
    ["V / H / B", "Seleccionar · Mano · Cuadro"],
    ["Rueda", "Zoom al cursor"],
    ["Arrastrar vacío / Espacio", "Paneo"],
    ["Supr / Retroceso", "Borrar selección"],
    ["Ctrl+D", "Duplicar"],
    ["Ctrl+Z / Ctrl+Shift+Z", "Deshacer / Rehacer"],
    ["r / R", "Rotar máquina ±15°"],
    ["Flechas / Shift+Flechas", "Mover · paso grid / 1 m"],
    ["F", "Ajustar a la vista"],
    ["Esc", "Cancelar herramienta / deseleccionar"],
  ];
  return (
    <div className="absolute right-3 top-3 z-30 w-72 rounded-xl border border-white/12 bg-[#0e1728]/95 p-3 backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-[family-name:var(--font-bricolage)] text-[13px] font-bold text-white">
          Atajos
        </span>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <dl className="space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 text-[11.5px]">
            <dt className="shrink-0 font-mono text-cyan-300">{k}</dt>
            <dd className="text-right text-slate-400">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
