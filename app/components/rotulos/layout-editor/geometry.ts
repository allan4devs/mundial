import type { NormalizedCenterAnchor, PixelTranslation } from "./types";

export type RectLike = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ResizeHandle = "nw" | "ne" | "se" | "sw";

export type CornerResizeStart = {
  canvas: RectLike;
  item: RectLike;
  handle: ResizeHandle;
  pointerX: number;
  pointerY: number;
  translation: PixelTranslation;
  scale: number;
  minimumScale: number;
  maximumScale: number;
};

export type CornerResizeResult = {
  translation: PixelTranslation;
  scale: number;
};

export const ZERO_TRANSLATION: PixelTranslation = Object.freeze({ x: 0, y: 0 });

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function rectEdge(rect: RectLike) {
  return {
    left: rect.left,
    right: rect.left + rect.width,
    top: rect.top,
    bottom: rect.top + rect.height,
  };
}

function resizeCorners(item: RectLike, handle: ResizeHandle) {
  const edge = rectEdge(item);

  switch (handle) {
    case "nw":
      return { fixedX: edge.right, fixedY: edge.bottom, handleX: edge.left, handleY: edge.top };
    case "ne":
      return { fixedX: edge.left, fixedY: edge.bottom, handleX: edge.right, handleY: edge.top };
    case "sw":
      return { fixedX: edge.right, fixedY: edge.top, handleX: edge.left, handleY: edge.bottom };
    case "se":
      return { fixedX: edge.left, fixedY: edge.top, handleX: edge.right, handleY: edge.bottom };
  }
}

function maximumFactorInsideCanvas(
  canvas: RectLike,
  fixedX: number,
  fixedY: number,
  diagonalX: number,
  diagonalY: number,
): number {
  const edge = rectEdge(canvas);
  const horizontal =
    diagonalX > 0
      ? (edge.right - fixedX) / diagonalX
      : diagonalX < 0
        ? (edge.left - fixedX) / diagonalX
        : Number.POSITIVE_INFINITY;
  const vertical =
    diagonalY > 0
      ? (edge.bottom - fixedY) / diagonalY
      : diagonalY < 0
        ? (edge.top - fixedY) / diagonalY
        : Number.POSITIVE_INFINITY;

  return Math.max(0, Math.min(horizontal, vertical));
}

/**
 * Uniform resize with the opposite corner pinned, matching a design-canvas
 * corner handle. Pointer movement is projected onto the original diagonal so
 * the object never stretches the official artwork on only one axis.
 */
export function resizeFromCorner(
  start: CornerResizeStart,
  pointerX: number,
  pointerY: number,
): CornerResizeResult {
  const { fixedX, fixedY, handleX, handleY } = resizeCorners(start.item, start.handle);
  const diagonalX = handleX - fixedX;
  const diagonalY = handleY - fixedY;
  const diagonalLengthSquared = diagonalX * diagonalX + diagonalY * diagonalY;
  if (diagonalLengthSquared <= 0 || start.scale <= 0) {
    return { translation: start.translation, scale: start.scale };
  }

  const projectedHandleX = handleX + pointerX - start.pointerX;
  const projectedHandleY = handleY + pointerY - start.pointerY;
  const projectedFactor =
    ((projectedHandleX - fixedX) * diagonalX +
      (projectedHandleY - fixedY) * diagonalY) /
    diagonalLengthSquared;
  const minimumFactor = start.minimumScale / start.scale;
  const configuredMaximumFactor = start.maximumScale / start.scale;
  const canvasMaximumFactor = maximumFactorInsideCanvas(
    start.canvas,
    fixedX,
    fixedY,
    diagonalX,
    diagonalY,
  );
  const maximumFactor = Math.max(
    minimumFactor,
    Math.min(configuredMaximumFactor, canvasMaximumFactor),
  );
  const factor = clamp(projectedFactor, minimumFactor, maximumFactor);
  const nextHandleX = fixedX + diagonalX * factor;
  const nextHandleY = fixedY + diagonalY * factor;
  const startCenterX = start.item.left + start.item.width / 2;
  const startCenterY = start.item.top + start.item.height / 2;
  const nextCenterX = (fixedX + nextHandleX) / 2;
  const nextCenterY = (fixedY + nextHandleY) / 2;

  return {
    scale: start.scale * factor,
    translation: {
      x: start.translation.x + nextCenterX - startCenterX,
      y: start.translation.y + nextCenterY - startCenterY,
    },
  };
}

function constrainedAxis(
  canvasStart: number,
  canvasSize: number,
  itemStart: number,
  itemSize: number,
  currentTranslation: number,
  nextTranslation: number,
): number {
  const baseStart = itemStart - currentTranslation;
  const minimum = canvasStart - baseStart;
  const maximum = canvasStart + canvasSize - (baseStart + itemSize);

  if (minimum <= maximum) return clamp(nextTranslation, minimum, maximum);

  // An oversized group cannot fit on both edges; keep its center on the canvas.
  const canvasCenter = canvasStart + canvasSize / 2;
  const baseCenter = baseStart + itemSize / 2;
  return canvasCenter - baseCenter;
}

/** Keeps the full movable group inside its current artboard. */
export function constrainTranslationToCanvas(
  canvas: RectLike,
  item: RectLike,
  currentTranslation: PixelTranslation,
  nextTranslation: PixelTranslation,
): PixelTranslation {
  return {
    x: constrainedAxis(
      canvas.left,
      canvas.width,
      item.left,
      item.width,
      currentTranslation.x,
      nextTranslation.x,
    ),
    y: constrainedAxis(
      canvas.top,
      canvas.height,
      item.top,
      item.height,
      currentTranslation.y,
      nextTranslation.y,
    ),
  };
}

/** Converts the rendered center into a resolution-independent anchor. */
export function normalizedCenterAnchor(canvas: RectLike, item: RectLike): NormalizedCenterAnchor {
  if (canvas.width <= 0 || canvas.height <= 0) return { x: 0.5, y: 0.5 };

  return {
    x: clamp((item.left + item.width / 2 - canvas.left) / canvas.width, 0, 1),
    y: clamp((item.top + item.height / 2 - canvas.top) / canvas.height, 0, 1),
  };
}

/**
 * Recomputes the pixel translation for a saved center after any responsive
 * resize. The item's untransformed center is recovered from its current
 * translation, so repeated applications do not accumulate drift.
 */
export function translationForAnchor(
  canvas: RectLike,
  item: RectLike,
  currentTranslation: PixelTranslation,
  anchor: NormalizedCenterAnchor,
): PixelTranslation {
  const baseCenterX = item.left + item.width / 2 - currentTranslation.x;
  const baseCenterY = item.top + item.height / 2 - currentTranslation.y;
  const desired = {
    x: canvas.left + clamp(anchor.x, 0, 1) * canvas.width - baseCenterX,
    y: canvas.top + clamp(anchor.y, 0, 1) * canvas.height - baseCenterY,
  };

  return constrainTranslationToCanvas(canvas, item, currentTranslation, desired);
}
