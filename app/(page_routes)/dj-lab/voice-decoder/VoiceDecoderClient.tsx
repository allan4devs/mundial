"use client";

import Link from "next/link";
import {
  AudioLines,
  CircleStop,
  FileAudio,
  Gauge,
  Mic,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Upload,
  Waves,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type EffectState = {
  gain: number;
  lowpass: number;
  highpass: number;
  delay: number;
  drive: number;
};

type VoiceNodes = {
  source?: AudioBufferSourceNode;
  gain?: GainNode;
  lowpass?: BiquadFilterNode;
  highpass?: BiquadFilterNode;
  delay?: DelayNode;
  feedback?: GainNode;
  drive?: WaveShaperNode;
  startedAt: number;
  offset: number;
};

const DEFAULT_EFFECTS: EffectState = {
  gain: 0.9,
  lowpass: 18000,
  highpass: 35,
  delay: 0,
  drive: 0,
};

const EXAMPLE_CLIPS = [
  {
    label: "Apollo 11 radio",
    file: "100Apollo11.mp3",
    source: "Internet Archive public domain spoken word",
  },
  {
    label: "Apollo callout",
    file: "102Apollo11.mp3",
    source: "Internet Archive public domain spoken word",
  },
  {
    label: "NASA voice clip",
    file: "1NASA.mp3",
    source: "Internet Archive public domain spoken word",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function makeDistortionCurve(amount: number) {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const drive = amount * 4;

  for (let index = 0; index < samples; index += 1) {
    const x = (index * 2) / samples - 1;
    curve[index] = ((1 + drive) * x) / (1 + drive * Math.abs(x));
  }

  return curve;
}

function getAudioContextCtor() {
  return window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

function buildPeaks(buffer: AudioBuffer, count = 900) {
  const channel = buffer.getChannelData(0);
  const blockSize = Math.max(1, Math.floor(channel.length / count));
  const peaks: number[] = [];

  for (let i = 0; i < count; i += 1) {
    let sum = 0;
    const start = i * blockSize;
    const end = Math.min(start + blockSize, channel.length);

    for (let j = start; j < end; j += 1) {
      sum += Math.abs(channel[j]);
    }

    peaks.push(Math.min(1, sum / Math.max(1, end - start) * 4));
  }

  return peaks;
}

export default function VoiceDecoderClient() {
  const [fileName, setFileName] = useState("");
  const [duration, setDuration] = useState(0);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [effects, setEffects] = useState<EffectState>(DEFAULT_EFFECTS);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Upload an MP3, WAV, or M4A to decode the waveform locally.");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const nodesRef = useRef<VoiceNodes>({ startedAt: 0, offset: 0 });
  const playingRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const currentTime = progress * duration;
  const hasAudio = Boolean(bufferRef.current);

  const stats = useMemo(() => {
    if (!peaks.length) return { peak: 0, average: 0 };
    const peak = Math.max(...peaks);
    const average = peaks.reduce((sum, value) => sum + value, 0) / peaks.length;
    return { peak: Math.round(peak * 100), average: Math.round(average * 100) };
  }, [peaks]);

  const getContext = useCallback(async () => {
    if (!contextRef.current) {
      const AudioCtor = getAudioContextCtor();
      if (!AudioCtor) throw new Error("Web Audio API is not available in this browser.");
      contextRef.current = new AudioCtor();
    }

    if (contextRef.current.state === "suspended") {
      await contextRef.current.resume();
    }

    return contextRef.current;
  }, []);

  const applyEffects = useCallback((nextEffects: EffectState) => {
    const context = contextRef.current;
    const nodes = nodesRef.current;
    if (!context) return;

    nodes.gain?.gain.setTargetAtTime(nextEffects.gain, context.currentTime, 0.02);
    nodes.lowpass?.frequency.setTargetAtTime(nextEffects.lowpass, context.currentTime, 0.025);
    nodes.highpass?.frequency.setTargetAtTime(nextEffects.highpass, context.currentTime, 0.025);
    nodes.delay?.delayTime.setTargetAtTime(nextEffects.delay / 1000, context.currentTime, 0.03);
    nodes.feedback?.gain.setTargetAtTime(clamp(nextEffects.delay / 900, 0, 0.62), context.currentTime, 0.03);
    if (nodes.drive) {
      nodes.drive.curve = makeDistortionCurve(nextEffects.drive);
      nodes.drive.oversample = "4x";
    }
  }, []);

  const setDecodedBuffer = useCallback((buffer: AudioBuffer, name: string, readyMessage: string) => {
    bufferRef.current = buffer;
    nodesRef.current = { startedAt: 0, offset: 0 };
    setFileName(name);
    setDuration(buffer.duration);
    setPeaks(buildPeaks(buffer));
    setProgress(0);
    setMessage(readyMessage);
  }, []);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const stopPlayback = useCallback((keepOffset = true) => {
    const context = contextRef.current;
    const nodes = nodesRef.current;

    if (context && keepOffset && bufferRef.current && playingRef.current) {
      const elapsed = context.currentTime - nodes.startedAt;
      nodes.offset = clamp(nodes.offset + elapsed, 0, bufferRef.current.duration);
      setProgress(bufferRef.current.duration ? nodes.offset / bufferRef.current.duration : 0);
    }

    if (nodes.source) {
      try {
        nodes.source.stop();
      } catch {
        // Source can already be stopped by the browser.
      }
      nodes.source.disconnect();
    }

    playingRef.current = false;
    nodesRef.current = { startedAt: 0, offset: keepOffset ? nodes.offset : 0 };
    setPlaying(false);
  }, []);

  const play = useCallback(async () => {
    const buffer = bufferRef.current;
    if (!buffer) {
      setMessage("Load a voice/audio file first.");
      return;
    }

    stopPlayback(true);
    const context = await getContext();
    const source = context.createBufferSource();
    const highpass = context.createBiquadFilter();
    const lowpass = context.createBiquadFilter();
    const drive = context.createWaveShaper();
    const delay = context.createDelay(1);
    const feedback = context.createGain();
    const gain = context.createGain();

    highpass.type = "highpass";
    lowpass.type = "lowpass";
    source.buffer = buffer;
    source.connect(highpass).connect(lowpass).connect(drive).connect(gain).connect(context.destination);
    drive.connect(delay).connect(feedback).connect(delay);
    delay.connect(gain);

    const offset = clamp(nodesRef.current.offset, 0, Math.max(0, buffer.duration - 0.02));
    nodesRef.current = { source, highpass, lowpass, drive, delay, feedback, gain, startedAt: context.currentTime, offset };
    applyEffects(effects);

    source.onended = () => {
      if (nodesRef.current.source === source) {
        nodesRef.current = { startedAt: 0, offset: 0 };
        setPlaying(false);
        setProgress(0);
      }
    };

    source.start(0, offset);
    setPlaying(true);
    setMessage(`Playing ${fileName || "decoded audio"} through the voice effect chain.`);
  }, [applyEffects, effects, fileName, getContext, stopPlayback]);

  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file) return;

    try {
      stopPlayback(false);
      setMessage("Decoding audio in the browser...");
      const context = await getContext();
      const data = await file.arrayBuffer();
      const buffer = await context.decodeAudioData(data.slice(0));
      setDecodedBuffer(buffer, file.name, "Waveform ready. Press play and start shaping the voice.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown decode error";
      setMessage(`Could not decode that file: ${detail}`);
    }
  }, [getContext, setDecodedBuffer, stopPlayback]);

  const loadExample = useCallback(async (file: string, label: string) => {
    try {
      stopPlayback(false);
      setMessage(`Loading example: ${label}...`);
      const context = await getContext();
      const response = await fetch(`/dj-lab/voice-examples/${file}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.arrayBuffer();
      const buffer = await context.decodeAudioData(data.slice(0));
      setDecodedBuffer(buffer, label, "Example loaded. These clips are local public-domain MP3 samples.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown example load error";
      setMessage(`Could not load example: ${detail}`);
    }
  }, [getContext, setDecodedBuffer, stopPlayback]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  const startRecording = useCallback(async () => {
    try {
      stopPlayback(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordChunksRef.current = [];
      recordStreamRef.current = stream;
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        setRecording(false);
        recordStreamRef.current?.getTracks().forEach((track) => track.stop());
        recordStreamRef.current = null;
        recorderRef.current = null;

        const blob = new Blob(recordChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        recordChunksRef.current = [];
        if (!blob.size) {
          setMessage("Recording was empty. Try again with mic permission enabled.");
          return;
        }

        try {
          const context = await getContext();
          const data = await blob.arrayBuffer();
          const buffer = await context.decodeAudioData(data.slice(0));
          setDecodedBuffer(buffer, `Mic recording ${new Date().toLocaleTimeString()}`, "Recording decoded. Now you can shape it with the FX chain.");
        } catch (error) {
          const detail = error instanceof Error ? error.message : "Unknown recording decode error";
          setMessage(`Recorded audio could not be decoded: ${detail}`);
        }
      };

      recorder.start();
      setRecording(true);
      setMessage("Recording from microphone...");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Microphone permission failed";
      setMessage(`Could not start recording: ${detail}`);
    }
  }, [getContext, setDecodedBuffer, stopPlayback]);

  const seek = useCallback((nextProgress: number) => {
    const buffer = bufferRef.current;
    if (!buffer) return;
    const wasPlaying = playing;
    stopPlayback(false);
    nodesRef.current.offset = clamp(nextProgress, 0, 1) * buffer.duration;
    setProgress(clamp(nextProgress, 0, 1));
    if (wasPlaying) void play();
  }, [play, playing, stopPlayback]);

  useEffect(() => {
    applyEffects(effects);
  }, [applyEffects, effects]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#05070d";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    if (!peaks.length) {
      ctx.fillStyle = "rgba(148,163,184,0.5)";
      ctx.font = "700 14px Arial";
      ctx.fillText("Upload audio to draw the waveform", 22, height / 2 + 5);
      return;
    }

    const barWidth = Math.max(1, width / peaks.length);
    peaks.forEach((peak, index) => {
      const x = index * barWidth;
      const barHeight = Math.max(2, peak * (height - 24));
      const played = index / peaks.length <= progress;
      ctx.fillStyle = played ? "#34d399" : "rgba(56,189,248,0.38)";
      ctx.fillRect(x, (height - barHeight) / 2, Math.max(1, barWidth - 0.5), barHeight);
    });

    const playheadX = progress * width;
    ctx.fillStyle = "#facc15";
    ctx.fillRect(playheadX - 1, 8, 2, height - 16);
  }, [peaks, progress]);

  useEffect(() => {
    if (!playing) return;

    const tick = () => {
      const context = contextRef.current;
      const buffer = bufferRef.current;
      const nodes = nodesRef.current;
      if (context && buffer) {
        const elapsed = context.currentTime - nodes.startedAt;
        const nextOffset = nodes.offset + elapsed;
        setProgress(clamp(nextOffset / buffer.duration, 0, 1));
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  useEffect(() => {
    return () => {
      stopPlayback(false);
      recorderRef.current?.stop();
      recordStreamRef.current?.getTracks().forEach((track) => track.stop());
      void contextRef.current?.close();
    };
  }, [stopPlayback]);

  return (
    <main className="min-h-screen bg-[#080a0d] text-slate-100">
      <section className="min-h-screen border-b border-white/10 bg-[radial-gradient(circle_at_16%_0%,rgba(14,165,233,0.24),transparent_34%),radial-gradient(circle_at_84%_8%,rgba(16,185,129,0.20),transparent_32%),linear-gradient(180deg,#10131a,#080a0d)]">
        <div className="mx-auto grid w-full max-w-[1500px] gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <Link href="/dj-lab" className="text-xs font-black uppercase text-sky-200 underline-offset-4 hover:underline">
                Back to DJ Lab
              </Link>
              <p className="mt-4 inline-flex items-center gap-2 rounded-md border border-sky-300/25 bg-sky-300/10 px-3 py-2 text-xs font-black uppercase text-sky-100">
                <AudioLines size={15} /> Voice Decoder
              </p>
              <h1 className="mt-3 text-4xl font-black leading-[0.92] text-white sm:text-6xl">Voice waveform lab</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                Upload a vocal or acapella, inspect the waveform, seek through it, and test a first chain of voice effects.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-black/30 p-2">
              <Stat label="Length" value={duration ? formatTime(duration) : "--"} />
              <Stat label="Peak" value={`${stats.peak}%`} />
              <Stat label="Avg" value={`${stats.average}%`} />
            </div>
          </header>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-2xl">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-emerald-300/40 bg-emerald-300/10 px-4 text-sm font-black text-emerald-100 transition hover:bg-emerald-300/15">
                    <Upload size={18} />
                    Upload MP3 or audio
                    <input className="sr-only" type="file" accept="audio/*,.mp3" onChange={(event) => void handleFile(event.target.files?.[0])} />
                  </label>

                  <button
                    type="button"
                    onClick={() => (recording ? stopRecording() : void startRecording())}
                    className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md border px-4 text-sm font-black transition ${
                      recording
                        ? "border-red-300 bg-red-400 text-black hover:bg-red-300"
                        : "border-sky-300/35 bg-sky-300/10 text-sky-100 hover:bg-sky-300/15"
                    }`}
                  >
                    <Mic size={18} />
                    {recording ? "Stop recording" : "Record mic"}
                  </button>
                </div>

                <div className="flex min-w-0 items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-2">
                  <FileAudio className="h-4 w-4 shrink-0 text-sky-200" />
                  <span className="truncate text-sm font-bold text-slate-300">{fileName || "No file loaded yet"}</span>
                </div>
              </div>

              <button
                type="button"
                className="relative h-[360px] overflow-hidden rounded-lg border border-white/10 bg-black/45 p-0 text-left"
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  seek((event.clientX - rect.left) / rect.width);
                }}
                title="Click to seek"
              >
                <canvas ref={canvasRef} className="h-full w-full" />
                <span className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-white/10 bg-black/70 px-3 py-2 text-xs font-black text-slate-300">
                  {formatTime(currentTime)} / {duration ? formatTime(duration) : "0:00"}
                </span>
              </button>

              <div className="grid gap-3 md:grid-cols-[auto_1fr_auto] md:items-center">
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!hasAudio}
                    onClick={() => (playing ? stopPlayback(true) : void play())}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-emerald-300/40 bg-emerald-300/15 px-5 text-sm font-black text-emerald-100 transition hover:bg-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {playing ? <Pause size={18} /> : <Play size={18} />}
                    {playing ? "Pause" : "Play"}
                  </button>
                  <button
                    type="button"
                    disabled={!hasAudio}
                    onClick={() => stopPlayback(false)}
                    className="grid h-12 w-12 place-items-center rounded-md border border-white/10 bg-white/[0.06] text-slate-100 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-45"
                    title="Stop"
                  >
                    <CircleStop size={18} />
                  </button>
                </div>

                <div className="rounded-md border border-white/10 bg-black/30 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs font-black uppercase text-slate-500">
                    <span>Timeline</span>
                    <span>{Math.round(progress * 100)}%</span>
                  </div>
                  <input className="w-full accent-emerald-300" type="range" min={0} max={1000} value={Math.round(progress * 1000)} onChange={(event) => seek(Number(event.target.value) / 1000)} />
                </div>

                <button
                  type="button"
                  onClick={() => setEffects(DEFAULT_EFFECTS)}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-4 text-sm font-black text-slate-100 transition hover:bg-white/[0.1]"
                >
                  <RotateCcw size={18} />
                  Reset FX
                </button>
              </div>

              <div className="rounded-md border border-sky-300/20 bg-sky-300/10 p-3">
                <p className="flex items-center gap-2 text-xs font-black uppercase text-sky-100">
                  <Waves size={15} /> Decoder log
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{message}</p>
              </div>

              <div className="rounded-md border border-white/10 bg-black/30 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase text-slate-500">Example MP3 clips</p>
                  <span className="text-[11px] font-bold text-slate-500">Public domain</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {EXAMPLE_CLIPS.map((clip) => (
                    <button
                      key={clip.file}
                      type="button"
                      onClick={() => void loadExample(clip.file, clip.label)}
                      className="min-h-14 rounded-md border border-white/10 bg-white/[0.055] px-3 text-left transition hover:border-emerald-300/45 hover:bg-white/[0.09]"
                      title={clip.source}
                    >
                      <span className="block truncate text-sm font-black text-white">{clip.label}</span>
                      <span className="mt-1 block truncate text-xs text-slate-500">{clip.file}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <aside className="grid content-start gap-4 rounded-lg border border-white/10 bg-black/45 p-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-slate-500">Effect chain</p>
                  <h2 className="mt-1 text-2xl font-black text-white">Voice FX</h2>
                </div>
                <SlidersHorizontal className="text-emerald-200" size={28} />
              </div>

              <EffectSlider label="Gain" value={effects.gain} min={0} max={1.5} step={0.01} display={`${Math.round(effects.gain * 100)}%`} onChange={(gain) => setEffects((current) => ({ ...current, gain }))} />
              <EffectSlider label="Low-pass" value={effects.lowpass} min={900} max={20000} step={100} display={`${Math.round(effects.lowpass)} Hz`} onChange={(lowpass) => setEffects((current) => ({ ...current, lowpass }))} />
              <EffectSlider label="High-pass" value={effects.highpass} min={20} max={900} step={5} display={`${Math.round(effects.highpass)} Hz`} onChange={(highpass) => setEffects((current) => ({ ...current, highpass }))} />
              <EffectSlider label="Delay" value={effects.delay} min={0} max={650} step={5} display={`${Math.round(effects.delay)} ms`} onChange={(delay) => setEffects((current) => ({ ...current, delay }))} />
              <EffectSlider label="Drive" value={effects.drive} min={0} max={1} step={0.01} display={`${Math.round(effects.drive * 100)}%`} onChange={(drive) => setEffects((current) => ({ ...current, drive }))} />

              <div className="grid grid-cols-2 gap-2">
                <InfoTile icon={<Gauge size={18} />} label="Engine" value="Web Audio" />
                <InfoTile icon={<Waves size={18} />} label="Render" value="Canvas" />
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-white/[0.06] p-3">
      <p className="text-[0.68rem] font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

function EffectSlider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="rounded-md border border-white/10 bg-white/[0.045] p-3">
      <span className="mb-2 flex items-center justify-between gap-2 text-xs font-black uppercase text-slate-500">
        <span>{label}</span>
        <span className="text-slate-300">{display}</span>
      </span>
      <input className="w-full accent-emerald-300" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/30 p-3">
      <div className="flex items-center gap-2 text-emerald-200">
        {icon}
        <p className="text-[0.68rem] font-black uppercase text-slate-500">{label}</p>
      </div>
      <p className="mt-2 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}
