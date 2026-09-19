/* Real FFmpeg integration checks. Uses temporary fixtures; never modifies source videos. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
};
const media = require("../lib/video-editor/server-media.ts");
const exporter = require("../lib/video-editor/server-export.ts");
const ffmpeg = require("ffmpeg-static");
const ffprobe = require("ffprobe-static").path;
const directory = path.resolve("tmp", `video-editor-smoke-${randomUUID()}`);
const uploads = [];
function encode(args) { execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", ...args], { windowsHide: true, timeout: 30_000 }); }
async function upload(file, name) {
  const data = new FormData();
  data.append("file", new File([await fsp.readFile(file)], name));
  const request = new Request("http://localhost:3000/api/video-editor/media", { method: "POST", headers: { origin: "http://localhost:3000" }, body: data });
  const asset = await media.uploadMedia(request);
  uploads.push(asset.id);
  return asset;
}
async function finished(id) {
  const until = Date.now() + 90_000;
  while (Date.now() < until) {
    const job = await exporter.getExport(id);
    if (["done", "error", "cancelled"].includes(job.status)) return job;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  await exporter.cancelExport(id);
  throw Error("Export timed out");
}
function pixel(file, time, x, y) {
  return execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-ss", String(time), "-i", file, "-vf", `crop=2:2:${x}:${y},scale=1:1,format=rgb24`, "-frames:v", "1", "-f", "rawvideo", "pipe:1"], { windowsHide: true });
}
async function main() {
  await fsp.mkdir(directory, { recursive: true });
  encode(["-f", "lavfi", "-i", "color=red:size=320x240:rate=30:duration=1.2", "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=1.2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", path.join(directory, "red.mp4")]);
  encode(["-f", "lavfi", "-i", "color=blue:size=240x320:rate=30:duration=1.2", "-c:v", "libx264", "-pix_fmt", "yuv420p", path.join(directory, "blue.mp4")]);
  encode(["-f", "lavfi", "-i", "sine=frequency=880:sample_rate=48000:duration=0.7", path.join(directory, "music.wav")]);
  encode(["-f", "lavfi", "-i", "color=black@0:size=720x720,format=rgba,drawbox=x=300:y=300:w=120:h=120:color=white@1:t=fill:replace=1", "-frames:v", "1", path.join(directory, "text.png")]);
  const red = await upload(path.join(directory, "red.mp4"), "smoke-red.mp4");
  const blue = await upload(path.join(directory, "blue.mp4"), "smoke-blue.mp4");
  const music = await upload(path.join(directory, "music.wav"), "smoke-music.wav");
  assert.equal(red.kind, "video"); assert.equal(red.hasAudio, true); assert.equal(blue.hasAudio, false); assert.equal(music.kind, "audio");
  assert.ok(await fsp.stat(await media.thumbnailPath(red.id)));
  const library = await media.listMedia();
  assert.ok(library.exportAvailable); assert.ok(library.assets.some(asset => asset.id === red.id));
  const source = await media.mediaPath(red.id);
  const ranged = await media.streamFile(new Request("http://localhost/media", { headers: { range: "bytes=0-99" } }), source);
  assert.equal(ranged.status, 206); assert.equal((await ranged.arrayBuffer()).byteLength, 100);
  assert.equal((await media.streamFile(new Request("http://localhost/media", { headers: { range: "bytes=999999999999-" } }), source)).status, 416);
  await assert.rejects(media.mediaPath("../package.json"));
  assert.throws(() => media.assertSameOrigin(new Request("http://localhost/upload", { headers: { origin: "https://untrusted.test" } })));
  console.log("PASS discovery, metadata, uploads, thumbnail, byte ranges, traversal and origin checks");
  const clip = (assetId, options = {}) => ({ id: randomUUID(), assetId, in: 0.1, out: 1.1, speed: 1, volume: 0.3, fit: "cover", x: 0.5, y: 0.5, zoom: 1, look: "original", fade: 0, ...options });
  const project = { version: 1, name: "Integration reel", aspect: "1:1", clips: [clip(red.id, { speed: 2, look: "warm", fade: 0.1 }), clip(blue.id, { out: 0.85, speed: 0.5, fit: "contain", x: 0, y: 0.5 })], texts: [{ id: "title", text: "Test", start: 0.6, end: 1.2, x: 0.5, y: 0.5, size: 0.08, color: "#ffffff", background: "transparent", align: "center" }], music: { assetId: music.id, in: 0.1, out: 0.5, offset: 0.5, volume: 0.3, loop: true, fadeIn: 0.1, fadeOut: 0.1 } };
  const payload = { project, resolution: 720, textImages: [{ id: "title", data: `data:image/png;base64,${(await fsp.readFile(path.join(directory, "text.png"))).toString("base64")}` }] };
  await assert.rejects(exporter.validateExport({ ...payload, project: { ...project, clips: [clip(red.id, { speed: NaN })] } }));
  await assert.rejects(exporter.validateExport({ ...payload, textImages: [] }));
  const job = await exporter.startExport(payload);
  await assert.rejects(exporter.startExport(payload), /curso/);
  const done = await finished(job.id);
  assert.equal(done.status, "done", done.message);
  const download = await exporter.exportDownload(job.id);
  const probe = JSON.parse(execFileSync(ffprobe, ["-v", "error", "-show_format", "-show_streams", "-of", "json", download.file], { encoding: "utf8", windowsHide: true }));
  const video = probe.streams.find(stream => stream.codec_type === "video");
  const audio = probe.streams.find(stream => stream.codec_type === "audio");
  assert.equal(video.codec_name, "h264"); assert.equal(audio.codec_name, "aac"); assert.equal(video.width, 720); assert.equal(video.height, 720); assert.equal(video.r_frame_rate, "30/1"); assert.ok(Math.abs(Number(probe.format.duration) - 2) < 0.1);
  const first = pixel(download.file, 0.25, 360, 360); assert.ok(first[0] > first[2] * 2, "First trimmed/speed clip must be red");
  const title = pixel(download.file, 0.8, 360, 360); assert.ok(Math.min(...title) > 220, "Text image must be visible in its timing window");
  const last = pixel(download.file, 1.5, 360, 360); assert.ok(last[2] > last[0] * 2, "Text must disappear and second clip remain blue");
  const padding = pixel(download.file, 1.5, 680, 360); assert.ok(Math.max(...padding) < 20, "Contain and x=0 must pad the right side black");
  const audioBytes = execFileSync(ffmpeg, ["-v", "error", "-ss", "1.5", "-t", "0.1", "-i", download.file, "-map", "0:a", "-f", "s16le", "pipe:1"], { windowsHide: true });
  let energy = 0; for (let i = 0; i + 1 < audioBytes.length; i += 2) energy += Math.abs(audioBytes.readInt16LE(i));
  assert.ok(energy / (audioBytes.length / 2) > 100, "Music must loop beyond the original trimmed source interval");
  console.log("PASS real H264/AAC MP4: trim, speed, audio/silent clips, warm look, fades, contain/pan, timed PNG overlay, looped/offset music, exact 2s duration");
  const simple = { ...payload, project: { ...project, clips: [clip(red.id, { look: "cinema", zoom: 1.3, x: 0.8, y: 0.3 })], texts: [], music: { ...project.music, offset: 8, loop: false } }, textImages: [] };
  const second = await exporter.startExport(simple);
  assert.equal((await finished(second.id)).status, "done");
  const cancel = await exporter.startExport(payload);
  assert.equal((await exporter.cancelExport(cancel.id)).status, "cancelled");
  await finished(cancel.id);
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log("PASS no-text export, silent out-of-range music, zoom/cinema and cancellation");
  console.log(`Output available for inspection: ${download.file}`);
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  for (const id of uploads) {
    const file = path.resolve(media.MEDIA_ROOT, id);
    if (file.startsWith(path.resolve(media.MEDIA_ROOT) + path.sep) && /^smoke-(red|blue|music)-[a-f\d]{8}\.(mp4|wav)$/.test(id)) await fsp.unlink(file).catch(() => undefined);
  }
  if (directory.startsWith(path.resolve("tmp") + path.sep) && path.basename(directory).startsWith("video-editor-smoke-")) await fsp.rm(directory, { recursive: true, force: true });
});
