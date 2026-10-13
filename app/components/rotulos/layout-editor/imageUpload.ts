"use client";

/**
 * Procesa una imagen del lado del cliente antes de guardarla: la redimensiona
 * y comprime para que quepa en localStorage junto con el resto del diseño.
 */

const MAX_SOURCE_FILE_BYTES = 20 * 1024 * 1024;
const MAX_OUTPUT_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;
const ACCEPTED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export type ProcessedImage = {
  src: string;
  aspectRatio: number;
};

export type ImageUploadErrorReason =
  | "unsupported-type"
  | "too-large"
  | "decode-failed"
  | "canvas-unavailable"
  | "encode-failed";

export class ImageUploadError extends Error {
  reason: ImageUploadErrorReason;

  constructor(reason: ImageUploadErrorReason) {
    super(reason);
    this.reason = reason;
  }
}

export async function processImageFile(file: File): Promise<ProcessedImage> {
  if (!ACCEPTED_MIME_TYPES.has(file.type)) {
    throw new ImageUploadError("unsupported-type");
  }
  if (file.size > MAX_SOURCE_FILE_BYTES) {
    throw new ImageUploadError("too-large");
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap || bitmap.width <= 0 || bitmap.height <= 0) {
    throw new ImageUploadError("decode-failed");
  }

  try {
    const scale = Math.min(1, MAX_OUTPUT_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new ImageUploadError("canvas-unavailable");

    context.drawImage(bitmap, 0, 0, width, height);

    const preserveAlpha = file.type === "image/png" || file.type === "image/gif";
    const src = canvas.toDataURL(preserveAlpha ? "image/png" : "image/jpeg", JPEG_QUALITY);
    if (!src.startsWith("data:image/")) throw new ImageUploadError("encode-failed");

    return { src, aspectRatio: width / height };
  } finally {
    bitmap.close?.();
  }
}
