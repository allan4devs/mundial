"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { BringToFront, Copy, Minus, Plus, RotateCcw, SendToBack, Trash2 } from "lucide-react";
import { useEditableSignCanvas } from "./canvasContext";
import {
  constrainTranslationToCanvas,
  normalizedCenterAnchor,
  resizeFromCorner,
  translationForAnchor,
  ZERO_TRANSLATION,
  type CornerResizeStart,
  type RectLike,
  type ResizeHandle,
} from "./geometry";
import { localize, type LocalizedText, type PixelTranslation } from "./types";

const TRANSLATE_X_PROPERTY = "--rotulo-layout-x";
const TRANSLATE_Y_PROPERTY = "--rotulo-layout-y";
const SCALE_PROPERTY = "--rotulo-layout-scale";
const INTERACTIVE_DESCENDANT_SELECTOR =
  "a,button,input,select,textarea,[contenteditable='true'],[data-layout-object-controls]";
const DEFAULT_MINIMUM_SCALE = 0.2;
const DEFAULT_MAXIMUM_SCALE = 4;

type ReservedDivProps =
  | "children"
  | "className"
  | "style"
  | "role"
  | "tabIndex"
  | "aria-label"
  | "onBlur"
  | "onFocus"
  | "onKeyDown"
  | "onKeyUp"
  | "onPointerCancel"
  | "onPointerDown"
  | "onPointerMove"
  | "onPointerUp"
  | "onLostPointerCapture";

export type MovableGroupProps = Omit<ComponentPropsWithoutRef<"div">, ReservedDivProps> & {
  groupId: string;
  label: LocalizedText;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  inspector?: ReactNode;
  readOnlyRole?: "img";
  readOnlyLabel?: LocalizedText;
  resizable?: boolean;
  deletable?: boolean;
  minimumScale?: number;
  maximumScale?: number;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onReset?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
};

type PointerSession = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startTranslation: PixelTranslation;
  canvasRect: RectLike;
  itemRect: DOMRect;
};

type PendingPointer = {
  clientX: number;
  clientY: number;
};

type ResizeSession = {
  pointerId: number;
  start: CornerResizeStart;
  handleNode: HTMLSpanElement;
};

type KeyboardSession = {
  startTranslation: PixelTranslation;
  startScale: number;
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function cssNumber(value: number): string {
  const stableValue = Math.abs(value) < 0.0005 ? 0 : Number(value.toFixed(4));
  return String(stableValue);
}

function cssPixels(value: number): string {
  return `${cssNumber(value)}px`;
}

function isArrowKey(key: string): key is "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" {
  return key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight";
}

function isScaleKey(key: string): boolean {
  return key === "+" || key === "=" || key === "-" || key === "_";
}

function isInteractiveTarget(event: ReactKeyboardEvent<HTMLDivElement>): boolean {
  const target = event.target as Element;
  return target !== event.currentTarget && Boolean(target.closest(INTERACTIVE_DESCENDANT_SELECTOR));
}

/** Caja de contenido visible: excluye borde y padding del artboard. */
function canvasContentRect(canvas: HTMLDivElement): RectLike {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.offsetWidth > 0 ? rect.width / canvas.offsetWidth : 1;
  const scaleY = canvas.offsetHeight > 0 ? rect.height / canvas.offsetHeight : 1;
  const computed = window.getComputedStyle(canvas);
  const paddingLeft = Number.parseFloat(computed.paddingLeft) || 0;
  const paddingRight = Number.parseFloat(computed.paddingRight) || 0;
  const paddingTop = Number.parseFloat(computed.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(computed.paddingBottom) || 0;

  return {
    left: rect.left + (canvas.clientLeft + paddingLeft) * scaleX,
    top: rect.top + (canvas.clientTop + paddingTop) * scaleY,
    width: Math.max(0, canvas.clientWidth - paddingLeft - paddingRight) * scaleX,
    height: Math.max(0, canvas.clientHeight - paddingTop - paddingBottom) * scaleY,
  };
}

const HANDLE_CLASSES: Record<ResizeHandle, string> = {
  nw: "cursor-nwse-resize",
  ne: "cursor-nesw-resize",
  se: "cursor-nwse-resize",
  sw: "cursor-nesw-resize",
};

export default function MovableGroup({
  groupId,
  label,
  children,
  className = "",
  style,
  title,
  inspector,
  readOnlyRole,
  readOnlyLabel,
  resizable = true,
  deletable = true,
  minimumScale = DEFAULT_MINIMUM_SCALE,
  maximumScale = DEFAULT_MAXIMUM_SCALE,
  onDelete,
  onDuplicate,
  onReset,
  onBringToFront,
  onSendToBack,
  ...divProps
}: MovableGroupProps) {
  const {
    lang,
    isEditing,
    canvasRef,
    selectedGroupId,
    selectGroup,
    getSavedLayout,
    commitLayout,
    resetGroup,
    registerGroup,
    announce,
  } = useEditableSignCanvas();
  const nodeRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const resizeHandleRefs = useRef<Partial<Record<ResizeHandle, HTMLSpanElement>>>({});
  const translationRef = useRef<PixelTranslation>({ ...ZERO_TRANSLATION });
  const scaleRef = useRef(1);
  const pointerSessionRef = useRef<PointerSession | null>(null);
  const pendingPointerRef = useRef<PendingPointer | null>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const resizeSessionRef = useRef<ResizeSession | null>(null);
  const pendingResizeRef = useRef<PendingPointer | null>(null);
  const resizeFrameRef = useRef<number | null>(null);
  const overlayFrameRef = useRef<number | null>(null);
  const keyboardSessionRef = useRef<KeyboardSession | null>(null);
  const resolvedLabel = localize(label, lang);
  const resolvedReadOnlyLabel = readOnlyLabel ? localize(readOnlyLabel, lang) : undefined;
  const savedLayout = getSavedLayout(groupId);
  const isHidden = savedLayout?.hidden === true;
  const isSelected = isEditing && !isHidden && selectedGroupId === groupId;
  const safeMinimumScale = clamp(minimumScale, DEFAULT_MINIMUM_SCALE, DEFAULT_MAXIMUM_SCALE);
  const safeMaximumScale = clamp(maximumScale, safeMinimumScale, DEFAULT_MAXIMUM_SCALE);

  const applyTranslation = useCallback((translation: PixelTranslation) => {
    translationRef.current = { x: translation.x, y: translation.y };
    const node = nodeRef.current;
    if (!node) return;

    node.style.setProperty(TRANSLATE_X_PROPERTY, cssPixels(translation.x));
    node.style.setProperty(TRANSLATE_Y_PROPERTY, cssPixels(translation.y));
  }, []);

  const applyScale = useCallback((scale: number) => {
    const safeScale = clamp(scale, DEFAULT_MINIMUM_SCALE, DEFAULT_MAXIMUM_SCALE);
    scaleRef.current = safeScale;
    const node = nodeRef.current;
    if (!node) return;

    node.style.setProperty(SCALE_PROPERTY, cssNumber(safeScale));
  }, []);

  const syncObjectOverlay = useCallback(() => {
    if (!isSelected) return;

    const canvas = canvasRef.current;
    const node = nodeRef.current;
    if (!canvas || !node) return;

    const canvasRect = canvas.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const scaleX = canvas.offsetWidth > 0 ? canvasRect.width / canvas.offsetWidth : 1;
    const scaleY = canvas.offsetHeight > 0 ? canvasRect.height / canvas.offsetHeight : 1;
    if (scaleX <= 0 || scaleY <= 0 || canvas.clientWidth <= 0 || canvas.clientHeight <= 0) return;

    const originX = canvasRect.left + canvas.clientLeft * scaleX;
    const originY = canvasRect.top + canvas.clientTop * scaleY;
    const left = (nodeRect.left - originX) / scaleX;
    const right = (nodeRect.right - originX) / scaleX;
    const top = (nodeRect.top - originY) / scaleY;
    const bottom = (nodeRect.bottom - originY) / scaleY;
    const corners: Record<ResizeHandle, { x: number; y: number }> = {
      nw: { x: left, y: top },
      ne: { x: right, y: top },
      se: { x: right, y: bottom },
      sw: { x: left, y: bottom },
    };

    for (const handle of Object.keys(HANDLE_CLASSES) as ResizeHandle[]) {
      const handleNode = resizeHandleRefs.current[handle];
      if (!handleNode) continue;
      const halfWidth = handleNode.offsetWidth / 2;
      const halfHeight = handleNode.offsetHeight / 2;
      handleNode.style.left = `${clamp(corners[handle].x, halfWidth, canvas.clientWidth - halfWidth)}px`;
      handleNode.style.top = `${clamp(corners[handle].y, halfHeight, canvas.clientHeight - halfHeight)}px`;
      handleNode.style.visibility = "visible";
    }

    const controls = controlsRef.current;
    if (!controls) return;
    const margin = 8;
    const gap = 10;
    const controlsWidth = controls.offsetWidth;
    const controlsHeight = controls.offsetHeight;
    const availableAbove = top - margin;
    const availableBelow = canvas.clientHeight - bottom - margin;
    const placeAbove = availableAbove >= controlsHeight + gap || availableAbove >= availableBelow;
    const desiredTop = placeAbove ? top - controlsHeight - gap : bottom + gap;
    const maximumLeft = Math.max(margin, canvas.clientWidth - controlsWidth - margin);
    const maximumTop = Math.max(margin, canvas.clientHeight - controlsHeight - margin);

    controls.style.left = `${clamp((left + right - controlsWidth) / 2, margin, maximumLeft)}px`;
    controls.style.top = `${clamp(desiredTop, margin, maximumTop)}px`;
    controls.style.visibility = "visible";
  }, [canvasRef, isSelected]);

  const queueObjectOverlaySync = useCallback(() => {
    if (overlayFrameRef.current !== null) return;
    overlayFrameRef.current = requestAnimationFrame(() => {
      overlayFrameRef.current = null;
      syncObjectOverlay();
    });
  }, [syncObjectOverlay]);

  const reapplyLayout = useCallback(() => {
    if (pointerSessionRef.current || resizeSessionRef.current || keyboardSessionRef.current) return;

    const node = nodeRef.current;
    const canvas = canvasRef.current;
    if (!node || !canvas) return;

    const layout = getSavedLayout(groupId);
    applyScale(layout?.scale ?? 1);
    if (!layout) {
      applyTranslation(ZERO_TRANSLATION);
      queueObjectOverlaySync();
      return;
    }

    const nextTranslation = translationForAnchor(
      canvasContentRect(canvas),
      node.getBoundingClientRect(),
      translationRef.current,
      layout.anchor,
    );
    applyTranslation(nextTranslation);
    queueObjectOverlaySync();
  }, [applyScale, applyTranslation, canvasRef, getSavedLayout, groupId, queueObjectOverlaySync]);

  useEffect(() => {
    const unregister = registerGroup(groupId, { reapplyLayout });
    reapplyLayout();
    return unregister;
  }, [groupId, reapplyLayout, registerGroup]);

  useEffect(() => {
    if (!isSelected) return;
    const node = nodeRef.current;
    const activeElement = document.activeElement;
    if (
      !node ||
      node.contains(activeElement) ||
      controlsRef.current?.contains(activeElement)
    ) {
      return;
    }
    node.focus({ preventScroll: true });
  }, [isSelected]);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(reapplyLayout);
    observer.observe(node);
    return () => observer.disconnect();
  }, [reapplyLayout]);

  useLayoutEffect(() => {
    if (!isSelected) return;

    const canvas = canvasRef.current;
    const node = nodeRef.current;
    const controls = controlsRef.current;
    if (!canvas || !node || !controls) return;

    syncObjectOverlay();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(queueObjectOverlaySync);
    observer?.observe(canvas);
    observer?.observe(node);
    observer?.observe(controls);
    window.addEventListener("resize", queueObjectOverlaySync, { passive: true });
    window.addEventListener("scroll", queueObjectOverlaySync, {
      capture: true,
      passive: true,
    });

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", queueObjectOverlaySync);
      window.removeEventListener("scroll", queueObjectOverlaySync, true);
    };
  }, [canvasRef, isSelected, queueObjectOverlaySync, syncObjectOverlay]);

  useEffect(
    () => () => {
      if (pointerFrameRef.current !== null) cancelAnimationFrame(pointerFrameRef.current);
      if (resizeFrameRef.current !== null) cancelAnimationFrame(resizeFrameRef.current);
      if (overlayFrameRef.current !== null) cancelAnimationFrame(overlayFrameRef.current);
    },
    [],
  );

  const announceCancelled = useCallback(() => {
    announce(
      lang === "es"
        ? `Cambio cancelado para ${resolvedLabel}.`
        : `Change cancelled for ${resolvedLabel}.`,
    );
  }, [announce, lang, resolvedLabel]);

  const commitCurrentLayout = useCallback(() => {
    const node = nodeRef.current;
    const canvas = canvasRef.current;
    if (!node || !canvas) return;

    const translation = translationRef.current;
    const scale = scaleRef.current;
    if (
      Math.abs(translation.x) < 0.5 &&
      Math.abs(translation.y) < 0.5 &&
      Math.abs(scale - 1) < 0.005 &&
      !onReset
    ) {
      applyTranslation(ZERO_TRANSLATION);
      applyScale(1);
      resetGroup(groupId);
      announce(
        lang === "es"
          ? `${resolvedLabel} volvió a su estado original.`
          : `${resolvedLabel} returned to its original state.`,
      );
      return;
    }

    const anchor = normalizedCenterAnchor(canvasContentRect(canvas), node.getBoundingClientRect());
    const persisted = commitLayout(groupId, { anchor, scale });
    const percent = Math.round(scale * 100);
    announce(
      lang === "es"
        ? persisted
          ? `${resolvedLabel} guardado al ${percent}% de tamaño.`
          : `${resolvedLabel} aplicado al ${percent}% solo durante esta sesión.`
        : persisted
          ? `${resolvedLabel} saved at ${percent}% size.`
          : `${resolvedLabel} applied at ${percent}% for this session only.`,
    );
  }, [announce, applyScale, applyTranslation, canvasRef, commitLayout, groupId, lang, onReset, resetGroup, resolvedLabel]);

  const applyPendingPointer = useCallback(() => {
    const session = pointerSessionRef.current;
    const pending = pendingPointerRef.current;
    if (!session || !pending) return;

    const desired = {
      x: session.startTranslation.x + pending.clientX - session.startClientX,
      y: session.startTranslation.y + pending.clientY - session.startClientY,
    };
    const translation = constrainTranslationToCanvas(
      session.canvasRect,
      session.itemRect,
      session.startTranslation,
      desired,
    );
    applyTranslation(translation);
    syncObjectOverlay();
  }, [applyTranslation, syncObjectOverlay]);

  const runPointerFrame = useCallback(() => {
    pointerFrameRef.current = null;
    applyPendingPointer();
  }, [applyPendingPointer]);

  const clearPointerFrame = useCallback(() => {
    if (pointerFrameRef.current === null) return;
    cancelAnimationFrame(pointerFrameRef.current);
    pointerFrameRef.current = null;
  }, []);

  const endPointerSession = useCallback(
    (pointerId: number, outcome: "commit" | "cancel") => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== pointerId) return;

      clearPointerFrame();
      if (outcome === "commit") applyPendingPointer();
      pointerSessionRef.current = null;
      pendingPointerRef.current = null;
      const node = nodeRef.current;
      node?.removeAttribute("data-layout-dragging");

      if (node?.hasPointerCapture(pointerId)) {
        try {
          node.releasePointerCapture(pointerId);
        } catch {
          // Capture may already be released after browser cancellation.
        }
      }

      if (outcome === "cancel") {
        applyTranslation(session.startTranslation);
        announceCancelled();
      } else {
        commitCurrentLayout();
      }
    },
    [announceCancelled, applyPendingPointer, applyTranslation, clearPointerFrame, commitCurrentLayout],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!event.isPrimary || event.button !== 0 || pointerSessionRef.current || resizeSessionRef.current) return;
      selectGroup(groupId);

      const target = event.target as Element;
      if (target !== event.currentTarget && target.closest(INTERACTIVE_DESCENDANT_SELECTOR)) return;

      const canvas = canvasRef.current;
      const node = nodeRef.current;
      if (!canvas || !node) return;
      const canvasRect = canvasContentRect(canvas);
      const itemRect = node.getBoundingClientRect();
      if (canvasRect.width <= 0 || canvasRect.height <= 0) return;

      event.preventDefault();
      node.focus({ preventScroll: true });
      keyboardSessionRef.current = null;
      pointerSessionRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startTranslation: { ...translationRef.current },
        canvasRect,
        itemRect,
      };
      pendingPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
      node.setAttribute("data-layout-dragging", "true");

      try {
        node.setPointerCapture(event.pointerId);
      } catch {
        pointerSessionRef.current = null;
        pendingPointerRef.current = null;
        node.removeAttribute("data-layout-dragging");
      }
    },
    [canvasRef, groupId, selectGroup],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      event.preventDefault();
      pendingPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
      if (pointerFrameRef.current === null) {
        pointerFrameRef.current = requestAnimationFrame(runPointerFrame);
      }
    },
    [runPointerFrame],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      event.preventDefault();
      pendingPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
      endPointerSession(event.pointerId, "commit");
    },
    [endPointerSession],
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      endPointerSession(event.pointerId, "cancel");
    },
    [endPointerSession],
  );

  const handleLostPointerCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (pointerSessionRef.current?.pointerId === event.pointerId) {
        endPointerSession(event.pointerId, "commit");
      }
    },
    [endPointerSession],
  );

  const applyPendingResize = useCallback(() => {
    const session = resizeSessionRef.current;
    const pending = pendingResizeRef.current;
    if (!session || !pending) return;

    const result = resizeFromCorner(session.start, pending.clientX, pending.clientY);
    applyScale(result.scale);
    applyTranslation(result.translation);
    syncObjectOverlay();
  }, [applyScale, applyTranslation, syncObjectOverlay]);

  const runResizeFrame = useCallback(() => {
    resizeFrameRef.current = null;
    applyPendingResize();
  }, [applyPendingResize]);

  const clearResizeFrame = useCallback(() => {
    if (resizeFrameRef.current === null) return;
    cancelAnimationFrame(resizeFrameRef.current);
    resizeFrameRef.current = null;
  }, []);

  const endResizeSession = useCallback(
    (pointerId: number, outcome: "commit" | "cancel") => {
      const session = resizeSessionRef.current;
      if (!session || session.pointerId !== pointerId) return;

      clearResizeFrame();
      if (outcome === "commit") applyPendingResize();
      resizeSessionRef.current = null;
      pendingResizeRef.current = null;
      nodeRef.current?.removeAttribute("data-layout-resizing");

      if (session.handleNode.hasPointerCapture(pointerId)) {
        try {
          session.handleNode.releasePointerCapture(pointerId);
        } catch {
          // Capture may already be released after browser cancellation.
        }
      }

      if (outcome === "cancel") {
        applyScale(session.start.scale);
        applyTranslation(session.start.translation);
        announceCancelled();
      } else {
        commitCurrentLayout();
      }
    },
    [announceCancelled, applyPendingResize, applyScale, applyTranslation, clearResizeFrame, commitCurrentLayout],
  );

  const handleResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>, handle: ResizeHandle) => {
      if (!event.isPrimary || event.button !== 0 || resizeSessionRef.current || pointerSessionRef.current) return;
      const canvas = canvasRef.current;
      const node = nodeRef.current;
      if (!canvas || !node) return;

      event.preventDefault();
      event.stopPropagation();
      selectGroup(groupId);
      keyboardSessionRef.current = null;
      const handleNode = event.currentTarget;
      resizeSessionRef.current = {
        pointerId: event.pointerId,
        handleNode,
        start: {
          canvas: canvasContentRect(canvas),
          item: node.getBoundingClientRect(),
          handle,
          pointerX: event.clientX,
          pointerY: event.clientY,
          translation: { ...translationRef.current },
          scale: scaleRef.current,
          minimumScale: safeMinimumScale,
          maximumScale: safeMaximumScale,
        },
      };
      pendingResizeRef.current = { clientX: event.clientX, clientY: event.clientY };
      node.setAttribute("data-layout-resizing", "true");

      try {
        handleNode.setPointerCapture(event.pointerId);
      } catch {
        resizeSessionRef.current = null;
        pendingResizeRef.current = null;
        node.removeAttribute("data-layout-resizing");
      }
    },
    [canvasRef, groupId, safeMaximumScale, safeMinimumScale, selectGroup],
  );

  const handleResizePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>) => {
      const session = resizeSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      pendingResizeRef.current = { clientX: event.clientX, clientY: event.clientY };
      if (resizeFrameRef.current === null) {
        resizeFrameRef.current = requestAnimationFrame(runResizeFrame);
      }
    },
    [runResizeFrame],
  );

  const handleResizePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>) => {
      if (resizeSessionRef.current?.pointerId !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      pendingResizeRef.current = { clientX: event.clientX, clientY: event.clientY };
      endResizeSession(event.pointerId, "commit");
    },
    [endResizeSession],
  );

  const resizeBy = useCallback(
    (delta: number, commit = true) => {
      const canvas = canvasRef.current;
      const node = nodeRef.current;
      if (!canvas || !node) return;

      const nextScale = clamp(scaleRef.current + delta, safeMinimumScale, safeMaximumScale);
      applyScale(nextScale);
      const constrained = constrainTranslationToCanvas(
        canvasContentRect(canvas),
        node.getBoundingClientRect(),
        translationRef.current,
        translationRef.current,
      );
      applyTranslation(constrained);
      syncObjectOverlay();
      if (commit) commitCurrentLayout();
    },
    [applyScale, applyTranslation, canvasRef, commitCurrentLayout, safeMaximumScale, safeMinimumScale, syncObjectOverlay],
  );

  const deleteCurrent = useCallback(() => {
    if (!deletable) return;
    if (onDelete) {
      onDelete();
      return;
    }

    const canvas = canvasRef.current;
    const node = nodeRef.current;
    if (!canvas || !node) return;
    const anchor = normalizedCenterAnchor(canvasContentRect(canvas), node.getBoundingClientRect());
    commitLayout(groupId, { anchor, scale: scaleRef.current, hidden: true });
    selectGroup(null);
    canvas.parentElement
      ?.querySelector<HTMLElement>("[data-layout-canvas-tools] button")
      ?.focus({ preventScroll: true });
    announce(
      lang === "es"
        ? `${resolvedLabel} eliminado. Puede restaurarlo desde la barra de la lámina.`
        : `${resolvedLabel} deleted. You can restore it from the panel toolbar.`,
    );
  }, [announce, canvasRef, commitLayout, deletable, groupId, lang, onDelete, resolvedLabel, selectGroup]);

  const resetToOriginal = useCallback(() => {
    if (pointerSessionRef.current) endPointerSession(pointerSessionRef.current.pointerId, "cancel");
    if (resizeSessionRef.current) endResizeSession(resizeSessionRef.current.pointerId, "cancel");
    keyboardSessionRef.current = null;
    applyTranslation(ZERO_TRANSLATION);
    applyScale(1);
    if (onReset) onReset();
    else resetGroup(groupId);
    announce(
      lang === "es"
        ? `${resolvedLabel} restablecido.`
        : `${resolvedLabel} reset.`,
    );
  }, [announce, applyScale, applyTranslation, endPointerSession, endResizeSession, groupId, lang, onReset, resetGroup, resolvedLabel]);

  const cancelKeyboardSession = useCallback(() => {
    const session = keyboardSessionRef.current;
    if (!session) return false;
    keyboardSessionRef.current = null;
    applyTranslation(session.startTranslation);
    applyScale(session.startScale);
    announceCancelled();
    return true;
  }, [announceCancelled, applyScale, applyTranslation]);

  const startKeyboardSession = useCallback(() => {
    if (keyboardSessionRef.current) return;
    keyboardSessionRef.current = {
      startTranslation: { ...translationRef.current },
      startScale: scaleRef.current,
    };
  }, []);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (isInteractiveTarget(event)) return;

      if (event.key === "Escape") {
        if (pointerSessionRef.current) {
          event.preventDefault();
          endPointerSession(pointerSessionRef.current.pointerId, "cancel");
        } else if (resizeSessionRef.current) {
          event.preventDefault();
          endResizeSession(resizeSessionRef.current.pointerId, "cancel");
        } else if (!cancelKeyboardSession()) {
          selectGroup(null);
        }
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        resetToOriginal();
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && deletable) {
        event.preventDefault();
        deleteCurrent();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d" && onDuplicate) {
        event.preventDefault();
        onDuplicate();
        return;
      }

      if (isScaleKey(event.key) && resizable) {
        event.preventDefault();
        startKeyboardSession();
        const amount = event.shiftKey ? 0.2 : 0.05;
        resizeBy(event.key === "-" || event.key === "_" ? -amount : amount, false);
        return;
      }

      if (!isArrowKey(event.key) || pointerSessionRef.current || resizeSessionRef.current) return;
      const node = nodeRef.current;
      const canvas = canvasRef.current;
      if (!node || !canvas) return;
      event.preventDefault();
      startKeyboardSession();

      const step = event.shiftKey ? 16 : 4;
      const desired = { ...translationRef.current };
      if (event.key === "ArrowUp") desired.y -= step;
      if (event.key === "ArrowDown") desired.y += step;
      if (event.key === "ArrowLeft") desired.x -= step;
      if (event.key === "ArrowRight") desired.x += step;
      applyTranslation(
        constrainTranslationToCanvas(
          canvasContentRect(canvas),
          node.getBoundingClientRect(),
          translationRef.current,
          desired,
        ),
      );
    },
    [applyTranslation, cancelKeyboardSession, canvasRef, deletable, deleteCurrent, endPointerSession, endResizeSession, onDuplicate, resetToOriginal, resizable, resizeBy, selectGroup, startKeyboardSession],
  );

  const finishKeyboardSession = useCallback(() => {
    if (!keyboardSessionRef.current) return;
    keyboardSessionRef.current = null;
    commitCurrentLayout();
  }, [commitCurrentLayout]);

  const handleKeyUp = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (isInteractiveTarget(event)) return;
      if (isArrowKey(event.key) || isScaleKey(event.key)) finishKeyboardSession();
    },
    [finishKeyboardSession],
  );

  useEffect(() => {
    if (isEditing) return;
    if (pointerSessionRef.current) endPointerSession(pointerSessionRef.current.pointerId, "cancel");
    if (resizeSessionRef.current) endResizeSession(resizeSessionRef.current.pointerId, "cancel");
    const keyboardSession = keyboardSessionRef.current;
    if (keyboardSession) {
      keyboardSessionRef.current = null;
      applyTranslation(keyboardSession.startTranslation);
      applyScale(keyboardSession.startScale);
    }
  }, [applyScale, applyTranslation, endPointerSession, endResizeSession, isEditing]);

  const authorTransform = style?.transform && style.transform !== "none" ? ` ${style.transform}` : "";
  const movableStyle: CSSProperties = {
    ...style,
    visibility: isHidden ? "hidden" : style?.visibility,
    pointerEvents: isHidden ? "none" : style?.pointerEvents,
    touchAction: isEditing && !isHidden ? "none" : style?.touchAction,
    transformOrigin: style?.transformOrigin ?? "center center",
    transform: `translate3d(var(${TRANSLATE_X_PROPERTY}, 0px), var(${TRANSLATE_Y_PROPERTY}, 0px), 0) scale(var(${SCALE_PROPERTY}, 1))${authorTransform}`,
  };
  const accessibleLabel =
    lang === "es" ? `${resolvedLabel}. Objeto editable.` : `${resolvedLabel}. Editable object.`;
  const overlayHost = isSelected ? canvasRef.current : null;

  return (
    <>
      <div
        {...divProps}
        ref={nodeRef}
        role={isEditing && !isHidden ? "group" : readOnlyRole}
        tabIndex={isEditing && !isHidden ? 0 : undefined}
        aria-label={isEditing && !isHidden ? accessibleLabel : resolvedReadOnlyLabel}
        aria-hidden={isHidden ? true : undefined}
        aria-roledescription={isEditing && !isHidden ? (lang === "es" ? "objeto editable" : "editable object") : undefined}
        aria-keyshortcuts={
          isEditing && !isHidden
            ? "ArrowUp ArrowDown ArrowLeft ArrowRight + - Delete Backspace Control+D Home Escape"
            : undefined
        }
        inert={isHidden ? true : undefined}
        data-layout-movable
        data-layout-group-id={groupId}
        data-layout-editing={isEditing ? "true" : "false"}
        data-layout-selected={isSelected ? "true" : "false"}
        title={
          isEditing && !isHidden
            ? title ??
              (lang === "es"
                ? `${resolvedLabel}: seleccione, arrastre o use las flechas.`
                : `${resolvedLabel}: select, drag, or use the arrow keys.`)
            : title
        }
        className={`${
          isEditing && !isHidden
            ? isSelected
              ? "cursor-grab select-none outline-4 outline-offset-4 outline-[#F5C518] focus-visible:z-50 [&[data-layout-dragging=true]]:z-50 [&[data-layout-dragging=true]]:cursor-grabbing [&[data-layout-resizing=true]]:z-50"
              : "cursor-grab select-none outline-2 outline-offset-2 outline-dashed outline-[#F5C518]/45 hover:outline-[#F5C518]/80 focus-visible:z-50 focus-visible:outline-4 focus-visible:outline-[#F5C518]"
            : ""
        } print:pointer-events-auto print:!outline-none ${className}`}
        style={movableStyle}
        onBlur={isEditing && !isHidden ? finishKeyboardSession : undefined}
        onFocus={isEditing && !isHidden ? () => selectGroup(groupId) : undefined}
        onKeyDown={isEditing && !isHidden ? handleKeyDown : undefined}
        onKeyUp={isEditing && !isHidden ? handleKeyUp : undefined}
        onPointerCancel={isEditing && !isHidden ? handlePointerCancel : undefined}
        onPointerDown={isEditing && !isHidden ? handlePointerDown : undefined}
        onPointerMove={isEditing && !isHidden ? handlePointerMove : undefined}
        onPointerUp={isEditing && !isHidden ? handlePointerUp : undefined}
        onLostPointerCapture={isEditing && !isHidden ? handleLostPointerCapture : undefined}
      >
        {children}
      </div>

      {overlayHost
        ? createPortal(
          <>
          <div
            ref={controlsRef}
            data-layout-object-overlay
            data-layout-object-controls
            className="pointer-events-auto absolute z-[90] grid w-max max-w-[calc(100%-1rem)] gap-2 overflow-auto rounded-xl border border-white/25 bg-[#2E2A25]/98 p-2 text-white shadow-2xl print:hidden"
            style={{ visibility: "hidden" }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {inspector}
            <div className="flex items-center justify-center gap-1">
              {resizable ? (
                <>
                  <button
                    type="button"
                    onClick={() => resizeBy(-0.1)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-[#00C4B0]"
                    aria-label={lang === "es" ? "Reducir objeto" : "Make object smaller"}
                    title={lang === "es" ? "Reducir" : "Smaller"}
                  >
                    <Minus className="h-5 w-5" aria-hidden />
                  </button>
                  <span className="min-w-12 text-center text-xs font-black text-[#ffe572]">
                    {Math.round(scaleRef.current * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => resizeBy(0.1)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-[#00C4B0]"
                    aria-label={lang === "es" ? "Agrandar objeto" : "Make object larger"}
                    title={lang === "es" ? "Agrandar" : "Larger"}
                  >
                    <Plus className="h-5 w-5" aria-hidden />
                  </button>
                </>
              ) : null}
              {onDuplicate ? (
                <button
                  type="button"
                  onClick={onDuplicate}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-[#00C4B0]"
                  aria-label={lang === "es" ? "Duplicar objeto" : "Duplicate object"}
                  title={lang === "es" ? "Duplicar" : "Duplicate"}
                >
                  <Copy className="h-5 w-5" aria-hidden />
                </button>
              ) : null}
              {onBringToFront ? (
                <button
                  type="button"
                  onClick={onBringToFront}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-[#00C4B0]"
                  aria-label={lang === "es" ? "Enviar al frente" : "Bring to front"}
                  title={lang === "es" ? "Al frente" : "To front"}
                >
                  <BringToFront className="h-5 w-5" aria-hidden />
                </button>
              ) : null}
              {onSendToBack ? (
                <button
                  type="button"
                  onClick={onSendToBack}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-[#00C4B0]"
                  aria-label={lang === "es" ? "Enviar al fondo" : "Send to back"}
                  title={lang === "es" ? "Al fondo" : "To back"}
                >
                  <SendToBack className="h-5 w-5" aria-hidden />
                </button>
              ) : null}
              <button
                type="button"
                onClick={resetToOriginal}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-[#00C4B0]"
                aria-label={lang === "es" ? "Restablecer objeto" : "Reset object"}
                title={lang === "es" ? "Restablecer" : "Reset"}
              >
                <RotateCcw className="h-5 w-5" aria-hidden />
              </button>
              {deletable ? (
                <button
                  type="button"
                  onClick={deleteCurrent}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-red-400/35 bg-red-500/15 text-red-100 hover:bg-red-500/25 focus-visible:outline-2 focus-visible:outline-red-300"
                  aria-label={lang === "es" ? "Eliminar objeto" : "Delete object"}
                  title={lang === "es" ? "Eliminar" : "Delete"}
                >
                  <Trash2 className="h-5 w-5" aria-hidden />
                </button>
              ) : null}
            </div>
          </div>

          {resizable
            ? (Object.keys(HANDLE_CLASSES) as ResizeHandle[]).map((handle) => (
                <span
                  key={handle}
                  ref={(node) => {
                    if (node) resizeHandleRefs.current[handle] = node;
                    else delete resizeHandleRefs.current[handle];
                  }}
                  aria-hidden="true"
                  data-layout-object-overlay
                  className={`pointer-events-auto absolute z-[80] h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent after:absolute after:left-1/2 after:top-1/2 after:h-6 after:w-6 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:border-2 after:border-[#2E2A25] after:bg-[#F5C518] after:shadow-lg print:hidden ${HANDLE_CLASSES[handle]}`}
                  style={{ visibility: "hidden", touchAction: "none" }}
                  onPointerDown={(event) => handleResizePointerDown(event, handle)}
                  onPointerMove={handleResizePointerMove}
                  onPointerUp={handleResizePointerUp}
                  onPointerCancel={(event) => endResizeSession(event.pointerId, "cancel")}
                  onLostPointerCapture={(event) => {
                    if (resizeSessionRef.current?.pointerId === event.pointerId) {
                      endResizeSession(event.pointerId, "commit");
                    }
                  }}
                />
              ))
            : null}
          </>,
          overlayHost,
        )
        : null}
    </>
  );
}
