export type Aspect = "9:16" | "1:1" | "16:9" | "4:5";
export type Look = "original" | "vivid" | "warm" | "mono" | "cinema";
export type Asset = { id: string; name: string; url: string; kind: "video" | "audio"; duration: number; width: number; height: number; hasAudio: boolean; thumbnail?: string };
export type Clip = { id: string; assetId: string; in: number; out: number; speed: number; volume: number; fit: "cover" | "contain"; x: number; y: number; zoom: number; look: Look; fade: number };
export type TextLayer = { id: string; text: string; start: number; end: number; x: number; y: number; size: number; color: string; background: string; align: "left" | "center" | "right" };
export type Music = { assetId: string; in: number; out: number; offset: number; volume: number; fadeIn: number; fadeOut: number; loop: boolean };
export type Project = { version: 1; name: string; aspect: Aspect; clips: Clip[]; texts: TextLayer[]; music: Music | null };
export type ExportPayload = { project: Project; resolution: 720 | 1080; textImages: { id: string; data: string }[] };
export type ExportJob = { id: string; status: "queued" | "rendering" | "done" | "error" | "cancelled"; progress: number; message: string; downloadUrl?: string };

export const EMPTY_PROJECT: Project = { version: 1, name: "Mi primer reel", aspect: "9:16", clips: [], texts: [], music: null };
export const uid = () => crypto.randomUUID();
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const clipDuration = (clip: Clip) => (clip.out - clip.in) / clip.speed;
export const durationOf = (project: Project) => project.clips.reduce((sum, clip) => sum + clipDuration(clip), 0);
export function dimensions(aspect: Aspect, resolution: 720 | 1080 = 1080) {
  const [x, y] = aspect.split(":").map(Number);
  return x > y ? { width: Math.round(resolution * x / y / 2) * 2, height: resolution } : { width: resolution, height: Math.round(resolution * y / x / 2) * 2 };
}
export function locateClip(project: Project, time: number) {
  let start = 0;
  for (let index = 0; index < project.clips.length; index++) {
    const clip = project.clips[index];
    const duration = clipDuration(clip);
    if (time < start + duration || index === project.clips.length - 1) return { clip, index, start, duration, local: clamp(time - start, 0, duration) };
    start += duration;
  }
  return null;
}
export function newClip(asset: Asset): Clip {
  return { id: uid(), assetId: asset.id, in: 0, out: asset.duration, speed: 1, volume: 1, fit: "cover", x: 0.5, y: 0.5, zoom: 1, look: "original", fade: 0 };
}
export const timeLabel = (seconds: number) => `${Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, "0")}:${(Math.max(0, seconds) % 60).toFixed(1).padStart(4, "0")}`;
