"use client";

import { Download, Eraser, Loader2, Mic, Pause, Play, Square } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { toggleHit } from "@/lib/song-builder/pattern";
import {
  STYLES,
  type Hit,
  type Song,
  type StylePack,
  type TrackKind,
} from "@/lib/song-builder/types";
import { TRACK_META, DEFAULT_SENSITIVITY } from "../dj-lab/song-builder/lib/constants";
import { PatternGrid } from "../dj-lab/song-builder/components/PatternGrid";
import { useAudioEngine } from "../dj-lab/song-builder/hooks/useAudioEngine";
import { useRecorder } from "../dj-lab/song-builder/hooks/useRecorder";
import { useStylePack } from "../dj-lab/song-builder/hooks/useStylePack";
import { useTransport, type VoiceTake } from "../dj-lab/song-builder/hooks/useTransport";
import { useVocalTake } from "../dj-lab/song-builder/hooks/useVocalTake";
import { createSong, patchTrack, restyle, soundFor, soundsFor, trackFor } from "../dj-lab/song-builder/lib/session";

const SIMPLE_TRACKS: TrackKind[] = ["drums", "bass", "synth"];

function starterSong(pack: StylePack, demo: boolean): Song {
  const song = createSong(pack);
  if (!demo) return song;

  // The full builder owns pattern parsing; this starter only needs a few clear,
  // editable hits and keeps the other engine voices empty.
  const steps: Record<TrackKind, number[]> = {
    drums: [0, 4, 8, 12, 16, 20, 24, 28],
    bass: [0, 6, 8, 14, 16, 22, 24, 30],
    synth: [0, 8, 16, 24],
    guitarLead: [], guitarFill: [], keys: [], brass: [], strings: [], arp: [], perc: [],
  };
  return {
    ...song,
    tracks: song.tracks.map((track) => ({
      ...track,
      hits: (steps[track.kind] ?? []).map((step) => ({ step, velocity: 0.8, tone: track.kind === "drums" ? 0.7 : 0.45 })),
    })),
  };
}

export default function AllanSongsClient() {
  const [song, setSong] = useState<Song | null>(null);
  const [message, setMessage] = useState("Start with the demo, then tap squares or sing a part.");
  const [sensitivity, setSensitivity] = useState(DEFAULT_SENSITIVITY);
  const { pack, select } = useStylePack("groovy", setMessage);
  const voiceRef = useRef<VoiceTake | null>(null);
  const engine = useAudioEngine(song, pack);
  const transport = useTransport(engine, song, pack, voiceRef, setMessage);
  const recorder = useRecorder({ engine, song, sensitivity, onHits: (kind, hits) => setSong((current) => current ? patchTrack(current, kind, { hits }) : current), onMessage: setMessage });
  const vocal = useVocalTake({ engine, transport, voice: voiceRef, name: song ? `allan-song-${song.bpm}bpm` : "allan-song", onMessage: setMessage });

  useEffect(() => {
    if (pack) setSong((current) => current ? restyle(current, pack) : starterSong(pack, true));
  }, [pack]);

  const stop = useCallback(async () => {
    transport.stop();
    await vocal.finish();
  }, [transport, vocal]);

  const togglePlay = useCallback(async () => {
    if (vocal.recording) await vocal.finish();
    else await transport.toggle();
  }, [transport, vocal]);

  const toggleStep = useCallback((kind: TrackKind, step: number) => {
    setSong((current) => {
      if (!current) return current;
      const track = trackFor(current, kind);
      if (!track) return current;
      return patchTrack(current, kind, { hits: toggleHit(track.hits, step) });
    });
  }, []);

  const rows = useMemo(() => pack && song ? SIMPLE_TRACKS.map((kind) => {
    const track = trackFor(song, kind)!;
    return { kind, track, sound: soundFor(pack, kind, track.soundId), options: soundsFor(pack, kind) };
  }) : [], [pack, song]);

  const setBpm = (bpm: number) => setSong((current) => current ? { ...current, bpm } : current);
  const setSound = (kind: TrackKind, soundId: string) => setSong((current) => current ? patchTrack(current, kind, { soundId }) : current);

  return (
    <main className="min-h-screen bg-[#10100f] text-[#f9f6ee]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-8 sm:py-10">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-[#f0a35a]">Mundial / personal studio</p>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Allan Songs</h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-[#b8b1a2]">Small ideas first. Put down a groove, hum a part, and sing over it before the idea disappears.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#b8b1a2]">{message}</div>
        </header>

        {pack && song ? <>
          <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#1b1a17] p-3 shadow-2xl shadow-black/20">
            <button type="button" onClick={togglePlay} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#f0a35a] px-5 text-sm font-black text-[#24170d] transition hover:bg-[#ffc17e]">
              {transport.playing ? <Pause size={18} /> : <Play size={18} />}{transport.playing ? "Stop" : "Play"}
            </button>
            <button type="button" onClick={() => void vocal.toggle()} className={`inline-flex min-h-12 items-center gap-2 rounded-xl border px-5 text-sm font-black transition ${vocal.recording ? "border-rose-300 bg-rose-300/20 text-rose-50" : "border-rose-200/30 bg-rose-200/10 text-rose-100 hover:bg-rose-200/20"}`}>
              {vocal.recording ? <Square size={17} /> : <Mic size={18} />}{vocal.recording ? "Finish take" : "Sing along"}
            </button>
            {vocal.take ? <a href={vocal.take.url} download={vocal.take.filename} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-sky-200/30 bg-sky-200/10 px-4 text-sm font-black text-sky-100"><Download size={17} />Save song</a> : null}
            <div className="ml-auto flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
              <span className="text-[#918b80]">BPM</span><input aria-label="Tempo" className="w-16 bg-transparent font-black outline-none" type="number" min={60} max={180} value={song.bpm} onChange={(event) => setBpm(Number(event.target.value))} />
            </div>
            <button type="button" onClick={() => { void stop(); setSong(starterSong(pack, false)); setMessage("Empty sketch. Tap a few squares and press Play."); }} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-black text-[#b8b1a2] hover:border-white/25 hover:text-white"><Eraser size={16} />Clear</button>
          </section>

          <section className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-sm font-black text-white">Choose a feel</p>
              <p className="mt-1 text-sm text-[#918b80]">The sounds, harmony and room change together.</p>
            </div>
            <div className="flex flex-wrap gap-2">{STYLES.map((style) => <button key={style} type="button" onClick={() => { void stop(); select(style); }} className={`rounded-full border px-4 py-2 text-sm font-black capitalize ${pack.style === style ? "border-[#f0a35a] bg-[#f0a35a]/15 text-[#ffc17e]" : "border-white/10 text-[#918b80] hover:border-white/25 hover:text-white"}`}>{style}</button>)}</div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#171715] p-3 sm:p-5">
            <div className="mb-4 flex items-center justify-between px-1 text-xs font-black uppercase tracking-[0.2em] text-[#746f67]"><span>Build the loop</span><span>32 steps · 2 bars</span></div>
            <div className="mb-2 grid grid-cols-[104px_1fr] gap-3 px-1 text-[10px] font-black uppercase tracking-widest text-[#746f67] sm:grid-cols-[150px_1fr]"><span>Part</span><div className="grid grid-cols-8 text-center">{Array.from({ length: 8 }, (_, index) => <span key={index}>{index + 1}</span>)}</div></div>
            <div className="grid gap-3">{rows.map(({ kind, track, sound, options }) => <InstrumentRow key={kind} kind={kind} hits={track.hits} soundId={sound.id} options={options} playStep={transport.step} recording={recorder.state.kind === kind ? recorder.state.phase : null} busy={recorder.state.phase !== "idle"} onRecord={() => void recorder.record(kind)} onCancel={recorder.cancel} onToggle={(step) => toggleStep(kind, step)} onSound={(value) => setSound(kind, value)} />)}</div>
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-[#f0a35a]/20 bg-[#f0a35a]/[0.06] p-4 text-sm text-[#c7b9a5] sm:flex-row sm:items-center sm:justify-between"><div><span className="font-black text-[#ffc17e]">Want to sing a part?</span> Use Record on a lane for one loop, or use Sing along for a full take.</div><label className="flex items-center gap-3 whitespace-nowrap"><span>Mic sensitivity</span><input type="range" min="0" max="1" step="0.01" value={sensitivity} onChange={(event) => setSensitivity(Number(event.target.value))} /></label></section>
        </> : <div className="grid min-h-[40vh] place-items-center rounded-3xl border border-white/10 bg-[#171715] text-[#918b80]"><Loader2 className="animate-spin" />Loading the sound room…</div>}
      </div>
    </main>
  );
}

type InstrumentRowProps = { kind: TrackKind; hits: readonly Hit[]; soundId: string; options: ReturnType<typeof soundsFor>; playStep: number; recording: string | null; busy: boolean; onRecord: () => void; onCancel: () => void; onToggle: (step: number) => void; onSound: (soundId: string) => void };

function InstrumentRow({ kind, hits, soundId, options, playStep, recording, busy, onRecord, onCancel, onToggle, onSound }: InstrumentRowProps) {
  const meta = TRACK_META[kind];
  return <article className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 sm:grid-cols-[150px_1fr] sm:items-center"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: meta.color }} /><div className="min-w-0"><h2 className="font-black">{meta.label}</h2><p className="truncate text-xs text-[#746f67]">{meta.cue}</p></div></div><div className="flex min-w-0 flex-wrap items-center gap-2"><button type="button" onClick={recording ? onCancel : onRecord} disabled={busy && !recording} className="min-h-9 rounded-lg border border-white/10 px-3 text-xs font-black text-[#c7b9a5] hover:border-[#f0a35a]/60 disabled:opacity-40">{recording ? (recording === "decoding" ? "Working…" : "Stop") : "Record"}</button><select aria-label={`${meta.label} sound`} value={soundId} onChange={(event) => onSound(event.target.value)} className="min-h-9 max-w-32 rounded-lg border border-white/10 bg-[#10100f] px-2 text-xs font-black text-white">{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select><div className="min-w-0 flex-1"><PatternGrid hits={hits} playStep={playStep} color={meta.color} hint="tap to add" onToggle={onToggle} /></div></div></article>;
}
