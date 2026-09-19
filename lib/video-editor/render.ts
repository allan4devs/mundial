import { clamp, clipDuration, dimensions, type Clip, type Look, type Project, type TextLayer } from "./types";

/** The export service applies these same color operations, in this order. */
export const LOOK_FILTERS: Record<Look, string> = {
  original: "none",
  vivid: "saturate(1.2) contrast(1.08)",
  warm: "sepia(0.18) saturate(1.1)",
  mono: "grayscale(1)",
  cinema: "saturate(0.8) contrast(1.12)",
};

export function clipOpacity(clip: Clip, local: number) {
  const duration = clipDuration(clip);
  const fade = Math.min(clip.fade, duration / 2);
  return fade > 0 ? clamp(Math.min(local / fade, (duration - local) / fade), 0, 1) : 1;
}

export function drawVideoFrame(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  clip: Clip,
  local: number,
  width: number,
  height: number,
) {
  context.save();
  context.fillStyle = "#000000";
  context.fillRect(0, 0, width, height);
  if (video.readyState >= 2 && video.videoWidth && video.videoHeight) {
    const scale = (clip.fit === "cover" ? Math.max : Math.min)(width / video.videoWidth, height / video.videoHeight) * clip.zoom;
    const drawWidth = video.videoWidth * scale;
    const drawHeight = video.videoHeight * scale;
    context.filter = LOOK_FILTERS[clip.look] || "none";
    context.globalAlpha = clipOpacity(clip, local);
    context.drawImage(video, (width - drawWidth) * clip.x, (height - drawHeight) * clip.y, drawWidth, drawHeight);
  }
  context.restore();
}

export type TextBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  lineHeight: number;
  padding: number;
  lines: string[];
};

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r/g, "").split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = "";
      // Breaking long words also handles URLs, hashtags, and unspaced scripts.
      for (const character of word) {
        if (line && context.measureText(line + character).width > maxWidth) {
          lines.push(line);
          line = character;
        } else line += character;
      }
    }
    lines.push(line);
  }
  return lines;
}

export function textBounds(context: CanvasRenderingContext2D, layer: TextLayer, width: number, height: number): TextBounds {
  const fontSize = Math.max(8, layer.size * width);
  const padding = fontSize * 0.24;
  const lineHeight = fontSize * 1.15;
  context.save();
  context.font = `700 ${fontSize}px Arial, sans-serif`;
  const lines = wrapText(context, layer.text, width * 0.88 - padding * 2);
  const boxWidth = Math.min(width * 0.88, Math.max(fontSize * 0.45, ...lines.map((line) => context.measureText(line).width)) + padding * 2);
  const boxHeight = lines.length * lineHeight + padding * 2;
  context.restore();
  return { x: layer.x * width - boxWidth / 2, y: layer.y * height - boxHeight / 2, width: boxWidth, height: boxHeight, fontSize, lineHeight, padding, lines };
}

export function drawTextLayer(context: CanvasRenderingContext2D, layer: TextLayer, width: number, height: number) {
  if (!layer.text.trim()) return;
  const box = textBounds(context, layer, width, height);
  context.save();
  const hasBackground = layer.background && layer.background !== "transparent";
  if (hasBackground) {
    context.fillStyle = layer.background;
    context.beginPath();
    context.roundRect(box.x, box.y, box.width, box.height, box.fontSize * 0.16);
    context.fill();
  } else {
    context.shadowColor = "rgba(0,0,0,0.65)";
    context.shadowBlur = box.fontSize * 0.12;
    context.shadowOffsetY = box.fontSize * 0.035;
  }
  context.font = `700 ${box.fontSize}px Arial, sans-serif`;
  context.textAlign = layer.align;
  context.textBaseline = "middle";
  context.fillStyle = layer.color;
  const x = layer.align === "left" ? box.x + box.padding : layer.align === "right" ? box.x + box.width - box.padding : layer.x * width;
  box.lines.forEach((line, index) => {
    context.fillText(line, x, box.y + box.padding + box.lineHeight * (index + 0.5));
  });
  context.restore();
}

/** Text is rasterized once in the browser so downloaded typography matches the preview. */
export function renderTextImages(project: Project, resolution: 720 | 1080): { id: string; data: string }[] {
  const { width, height } = dimensions(project.aspect, resolution);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo preparar el texto del video.");
  return project.texts.map((layer) => {
    context.clearRect(0, 0, width, height);
    drawTextLayer(context, layer, width, height);
    return { id: layer.id, data: canvas.toDataURL("image/png") };
  });
}
