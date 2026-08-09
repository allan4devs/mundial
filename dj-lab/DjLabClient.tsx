"use client";

import Link from "next/link";
import {
  Activity,
  AudioLines,
  Disc3,
  Download,
  Gauge,
  Headphones,
  Library,
  ListMusic,
  Pause,
  Play,
  Radio,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
import React, { JSX, useCallback, useEffect, useMemo, useRef, useState } from "react";

type DeckId = "A" | "B";

type Track = {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  energy: number;
  color: string;
  duration: number;
  source: "demo" | "local";
  file?: File;
};

type TracksResponse = {
  tracks?: Track[];
  error?: string;
};

type DeckState = {
  track: Track;
  playing: boolean;
  cue: number;
  loop: boolean;
  gain: number;
  bass: number;
  mid: number;
  treble: number;
  filter: number;
  tempo: number;
  pitch: number;
  fx: number;
  progress: number;
  level: number;
  phase: number;
};

type DeckAudio = {
  source?: AudioBufferSourceNode;
  demoSources?: Array<AudioBufferSourceNode | OscillatorNode>;
  demoTimer?: number;
  demoStep?: number;
  gain?: GainNode;
  bass?: BiquadFilterNode;
  mid?: BiquadFilterNode;
  treble?: BiquadFilterNode;
  filter?: BiquadFilterNode;
  delay?: DelayNode;
  feedback?: GainNode;
  panner?: StereoPannerNode;
  startedAt: number;
  offset: number;
  buffer?: AudioBuffer;
};

const demoTracks: Track[] = [
  {
    id: "rainforest-breaks",
    title: "Rainforest Breaks",
    artist: "La Vieja Lab",
    bpm: 124,
    key: "8A",
    energy: 88,
    color: "#22c55e",
    duration: 246,
    source: "demo",
  },
  {
    id: "volcanic-house",
    title: "Volcanic House",
    artist: "Arenal Systems",
    bpm: 128,
    key: "9A",
    energy: 92,
    color: "#f59e0b",
    duration: 318,
    source: "demo",
  },
  {
    id: "midnight-cumbia",
    title: "Midnight Cumbia Tech",
    artist: "Central Valley",
    bpm: 102,
    key: "4B",
    energy: 74,
    color: "#38bdf8",
    duration: 282,
    source: "demo",
  },
  {
    id: "jungle-dnb",
    title: "Jungle DnB Field Test",
    artist: "MIT Sound Crew",
    bpm: 172,
    key: "11A",
    energy: 96,
    color: "#a855f7",
    duration: 212,
    source: "demo",
  },
];

const padLabels = ["CUE 1", "CUE 2", "CUE 3", "CUE 4", "LOOP", "ROLL", "GATE", "FLUX"];

const makeDeck = (track: Track): DeckState => ({
  track,
  playing: false,
  cue: 0,
  loop: false,
  gain: 0.82,
  bass: 0,
  mid: 0,
  treble: 0,
  filter: 0,
  tempo: 0,
  pitch: 0,
  fx: 0,
  progress: 0,
  level: 0.18,
  phase: 0,
});

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function shortFileName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function midiToFrequency(note: number) {
  return 440 * 2 ** ((note - 69) / 12);
}

function getTrackRoot(track: Track) {
  const roots: Record<string, number> = {
    "4B": 45,
    "6A": 48,
    "8A": 52,
    "9A": 55,
    "11A": 57,
    "12B": 59,
  };

  return roots[track.key] ?? 52;
}

export default function DjLabClient(): JSX.Element {
  const [tracks, setTracks] = useState<Track[]>(demoTracks);
  const [deckA, setDeckA] = useState<DeckState>(() => makeDeck(demoTracks[0]));
  const [deckB, setDeckB] = useState<DeckState>(() => makeDeck(demoTracks[1]));
  const [crossfader, setCrossfader] = useState(0);
  const [masterGain, setMasterGain] = useState(0.86);
  const [recording, setRecording] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<DeckId>("A");
  const [message, setMessage] = useState("Carga archivos locales para activar mezcla real con Web Audio API.");
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const deckAudioRef = useRef<Record<DeckId, DeckAudio>>({
    A: { startedAt: 0, offset: 0 },
    B: { startedAt: 0, offset: 0 },
  });

  const decks = useMemo(() => ({ A: deckA, B: deckB }), [deckA, deckB]);

  const getAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      const context = new AudioCtor();
      const master = context.createGain();
      master.gain.value = masterGain;
      master.connect(context.destination);
      audioContextRef.current = context;
      masterRef.current = master;
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, [masterGain]);

  useEffect(() => {
    if (masterRef.current) {
      masterRef.current.gain.setTargetAtTime(masterGain, audioContextRef.current?.currentTime ?? 0, 0.015);
    }
  }, [masterGain]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/dj-tracks")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("DJ tracks request failed"))))
      .then((data: TracksResponse) => {
        if (cancelled || !Array.isArray(data.tracks) || data.tracks.length === 0) return;

        const mongoTracks = data.tracks.map((track) => ({
          ...track,
          source: "demo" as const,
        }));

        setTracks((current) => {
          const localTracks = current.filter((track) => track.source === "local");
          return [...localTracks, ...mongoTracks];
        });
        setDeckA((current) => (current.track.source === "local" ? current : makeDeck(mongoTracks[0])));
        setDeckB((current) => (current.track.source === "local" ? current : makeDeck(mongoTracks[1] ?? mongoTracks[0])));
        setMessage("Biblioteca DJ cargada desde MongoDB con tracks demo.");
      })
      .catch(() => {
        if (!cancelled) {
          setMessage("Modo respaldo: usando tracks demo locales hasta que MongoDB responda.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateDeck = useCallback((deckId: DeckId, patch: Partial<DeckState>) => {
    const setter = deckId === "A" ? setDeckA : setDeckB;
    setter((current) => ({ ...current, ...patch }));
  }, []);

  const updateAudioParams = useCallback(
    (deckId: DeckId, state: DeckState) => {
      const context = audioContextRef.current;
      const nodes = deckAudioRef.current[deckId];
      if (!context) return;

      const deckMix = deckId === "A" ? (100 - crossfader) / 100 : (100 + crossfader) / 100;
      const gainValue = clamp(state.gain * deckMix, 0, 1.4);
      nodes.gain?.gain.setTargetAtTime(gainValue, context.currentTime, 0.02);
      nodes.bass?.gain.setTargetAtTime(state.bass, context.currentTime, 0.025);
      nodes.mid?.gain.setTargetAtTime(state.mid, context.currentTime, 0.025);
      nodes.treble?.gain.setTargetAtTime(state.treble, context.currentTime, 0.025);

      if (nodes.filter) {
        const isLowPass = state.filter < 0;
        nodes.filter.type = isLowPass ? "lowpass" : "highpass";
        const frequency = isLowPass
          ? 22000 - Math.abs(state.filter) * 206
          : 24 + Math.abs(state.filter) * 92;
        nodes.filter.frequency.setTargetAtTime(clamp(frequency, 24, 22000), context.currentTime, 0.035);
        nodes.filter.Q.setTargetAtTime(0.8 + Math.abs(state.filter) / 28, context.currentTime, 0.035);
      }

      nodes.delay?.delayTime.setTargetAtTime(0.05 + state.fx * 0.004, context.currentTime, 0.04);
      nodes.feedback?.gain.setTargetAtTime(state.fx / 140, context.currentTime, 0.04);

      if (nodes.source) {
        nodes.source.playbackRate.setTargetAtTime(1 + state.tempo / 100, context.currentTime, 0.02);
      }
    },
    [crossfader],
  );

  const stopDeckAudio = useCallback((deckId: DeckId) => {
    const deckAudio = deckAudioRef.current[deckId];
    if (deckAudio.source) {
      try {
        deckAudio.source.stop();
      } catch {
        // The node may already be stopped by the browser.
      }
      deckAudio.source.disconnect();
    }
    if (deckAudio.demoTimer) {
      window.clearInterval(deckAudio.demoTimer);
    }
    deckAudio.demoSources?.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Demo sources can be one-shot drums that already ended.
      }
      source.disconnect();
    });
    deckAudioRef.current[deckId] = {
      buffer: deckAudio.buffer,
      offset: deckAudio.offset,
      startedAt: deckAudio.startedAt,
    };
  }, []);

  const createDeckChain = useCallback((context: AudioContext) => {
    const gain = context.createGain();
    const bass = context.createBiquadFilter();
    const mid = context.createBiquadFilter();
    const treble = context.createBiquadFilter();
    const filter = context.createBiquadFilter();
    const delay = context.createDelay(1);
    const feedback = context.createGain();
    const panner = context.createStereoPanner();

    bass.type = "lowshelf";
    bass.frequency.value = 180;
    mid.type = "peaking";
    mid.frequency.value = 1000;
    mid.Q.value = 0.85;
    treble.type = "highshelf";
    treble.frequency.value = 4200;
    filter.type = "lowpass";
    filter.frequency.value = 22000;

    bass
      .connect(mid)
      .connect(treble)
      .connect(filter)
      .connect(gain)
      .connect(panner)
      .connect(masterRef.current ?? context.destination);
    filter.connect(delay).connect(feedback).connect(delay);
    delay.connect(gain);

    return { bass, mid, treble, filter, gain, delay, feedback, panner };
  }, []);

  const triggerDemoDrum = useCallback(
    (context: AudioContext, input: AudioNode, track: Track, step: number) => {
      const now = context.currentTime;

      if (step % 4 === 0) {
        const kick = context.createOscillator();
        const kickGain = context.createGain();
        kick.type = "sine";
        kick.frequency.setValueAtTime(120, now);
        kick.frequency.exponentialRampToValueAtTime(42, now + 0.13);
        kickGain.gain.setValueAtTime(0.0001, now);
        kickGain.gain.exponentialRampToValueAtTime(0.72, now + 0.012);
        kickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        kick.connect(kickGain).connect(input);
        kick.start(now);
        kick.stop(now + 0.24);
      }

      if (step % 8 === 4) {
        const snare = context.createBufferSource();
        const snareFilter = context.createBiquadFilter();
        const snareGain = context.createGain();
        const buffer = context.createBuffer(1, context.sampleRate * 0.18, context.sampleRate);
        const channel = buffer.getChannelData(0);
        for (let index = 0; index < channel.length; index += 1) {
          channel[index] = (Math.random() * 2 - 1) * (1 - index / channel.length);
        }
        snare.buffer = buffer;
        snareFilter.type = "bandpass";
        snareFilter.frequency.value = 1700 + track.energy * 8;
        snareGain.gain.setValueAtTime(0.28, now);
        snareGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
        snare.connect(snareFilter).connect(snareGain).connect(input);
        snare.start(now);
      }

      if (step % 2 === 1) {
        const hat = context.createBufferSource();
        const hatFilter = context.createBiquadFilter();
        const hatGain = context.createGain();
        const buffer = context.createBuffer(1, context.sampleRate * 0.05, context.sampleRate);
        const channel = buffer.getChannelData(0);
        for (let index = 0; index < channel.length; index += 1) {
          channel[index] = (Math.random() * 2 - 1) * (1 - index / channel.length);
        }
        hat.buffer = buffer;
        hatFilter.type = "highpass";
        hatFilter.frequency.value = 7200;
        hatGain.gain.setValueAtTime(0.12, now);
        hatGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
        hat.connect(hatFilter).connect(hatGain).connect(input);
        hat.start(now);
      }
    },
    [],
  );

  const startDemoSynth = useCallback(
    (deckId: DeckId, context: AudioContext, state: DeckState) => {
      stopDeckAudio(deckId);

      const chain = createDeckChain(context);
      const root = getTrackRoot(state.track);
      const bass = context.createOscillator();
      const bassGain = context.createGain();
      const pad = context.createOscillator();
      const padGain = context.createGain();
      const shimmer = context.createOscillator();
      const shimmerGain = context.createGain();
      const now = context.currentTime;

      bass.type = "sawtooth";
      bass.frequency.value = midiToFrequency(root - 24);
      bassGain.gain.value = 0.11 + state.track.energy / 1200;
      bass.connect(bassGain).connect(chain.bass);

      pad.type = "triangle";
      pad.frequency.value = midiToFrequency(root);
      pad.detune.value = deckId === "A" ? -7 : 7;
      padGain.gain.value = 0.045;
      pad.connect(padGain).connect(chain.bass);

      shimmer.type = "square";
      shimmer.frequency.value = midiToFrequency(root + 7);
      shimmer.detune.value = deckId === "A" ? 11 : -11;
      shimmerGain.gain.value = 0.018;
      shimmer.connect(shimmerGain).connect(chain.bass);

      bass.start(now);
      pad.start(now);
      shimmer.start(now);
      triggerDemoDrum(context, chain.bass, state.track, 0);

      let demoStep = 1;
      const stepMs = Math.max(70, 60000 / (state.track.bpm * (1 + state.tempo / 100)) / 4);
      const demoTimer = window.setInterval(() => {
        triggerDemoDrum(context, chain.bass, state.track, demoStep);
        demoStep = (demoStep + 1) % 16;
        deckAudioRef.current[deckId].demoStep = demoStep;
      }, stepMs);

      deckAudioRef.current[deckId] = {
        ...chain,
        demoSources: [bass, pad, shimmer],
        demoTimer,
        demoStep,
        startedAt: now,
        offset: state.progress * state.track.duration,
      };
      updateDeck(deckId, { playing: true });
      setMessage(`Deck ${deckId} sonando con sintetizador demo: ${state.track.title}`);
      updateAudioParams(deckId, state);
    },
    [createDeckChain, stopDeckAudio, triggerDemoDrum, updateAudioParams, updateDeck],
  );

  useEffect(() => updateAudioParams("A", deckA), [deckA, updateAudioParams]);
  useEffect(() => updateAudioParams("B", deckB), [deckB, updateAudioParams]);

  const playDeck = useCallback(
    async (deckId: DeckId) => {
      const state = decks[deckId];
      const context = await getAudioContext();
      const currentAudio = deckAudioRef.current[deckId];

      if (!currentAudio.buffer && state.track.file) {
        const data = await state.track.file.arrayBuffer();
        currentAudio.buffer = await context.decodeAudioData(data.slice(0));
      }

      if (!currentAudio.buffer) {
        startDemoSynth(deckId, context, state);
        return;
      }

      stopDeckAudio(deckId);

      const source = context.createBufferSource();
      const gain = context.createGain();
      const bass = context.createBiquadFilter();
      const mid = context.createBiquadFilter();
      const treble = context.createBiquadFilter();
      const filter = context.createBiquadFilter();
      const delay = context.createDelay(1);
      const feedback = context.createGain();
      const panner = context.createStereoPanner();

      bass.type = "lowshelf";
      bass.frequency.value = 180;
      mid.type = "peaking";
      mid.frequency.value = 1000;
      mid.Q.value = 0.85;
      treble.type = "highshelf";
      treble.frequency.value = 4200;
      filter.type = "lowpass";
      filter.frequency.value = 22000;

      source.buffer = currentAudio.buffer;
      source.loop = state.loop;
      source.playbackRate.value = 1 + state.tempo / 100;
      source
        .connect(bass)
        .connect(mid)
        .connect(treble)
        .connect(filter)
        .connect(gain)
        .connect(panner)
        .connect(masterRef.current ?? context.destination);
      filter.connect(delay).connect(feedback).connect(delay);
      delay.connect(gain);

      const duration = currentAudio.buffer.duration;
      const offset = clamp(currentAudio.offset || state.progress * duration, 0, Math.max(duration - 0.05, 0));
      source.start(0, offset);

      deckAudioRef.current[deckId] = {
        source,
        gain,
        bass,
        mid,
        treble,
        filter,
        delay,
        feedback,
        panner,
        buffer: currentAudio.buffer,
        startedAt: context.currentTime,
        offset,
      };
      updateDeck(deckId, { playing: true, progress: duration ? offset / duration : 0 });
      setMessage(`Deck ${deckId} sonando: ${state.track.title}`);
      updateAudioParams(deckId, state);
    },
    [decks, getAudioContext, startDemoSynth, stopDeckAudio, updateAudioParams, updateDeck],
  );

  const pauseDeck = useCallback(
    (deckId: DeckId) => {
      const context = audioContextRef.current;
      const nodes = deckAudioRef.current[deckId];
      if (context && nodes.buffer && decks[deckId].playing) {
        const elapsed = (context.currentTime - nodes.startedAt) * (1 + decks[deckId].tempo / 100);
        nodes.offset = (nodes.offset + elapsed) % nodes.buffer.duration;
      } else if (context && decks[deckId].playing) {
        const elapsed = (context.currentTime - nodes.startedAt) * (1 + decks[deckId].tempo / 100);
        nodes.offset = (nodes.offset + elapsed) % decks[deckId].track.duration;
      }
      stopDeckAudio(deckId);
      updateDeck(deckId, { playing: false });
      setMessage(`Deck ${deckId} en pausa listo para cue.`);
    },
    [decks, stopDeckAudio, updateDeck],
  );

  const toggleDeck = useCallback(
    (deckId: DeckId) => {
      if (decks[deckId].playing) {
        pauseDeck(deckId);
      } else {
        void playDeck(deckId);
      }
    },
    [decks, pauseDeck, playDeck],
  );

  const loadTrack = useCallback(
    (deckId: DeckId, track: Track) => {
      pauseDeck(deckId);
      deckAudioRef.current[deckId] = { startedAt: 0, offset: 0 };
      updateDeck(deckId, {
        track,
        progress: 0,
        cue: 0,
        level: track.energy / 120,
        playing: false,
      });
      setSelectedDeck(deckId);
      setMessage(`Track cargado en Deck ${deckId}: ${track.title}`);
    },
    [pauseDeck, updateDeck],
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      const nextTracks: Track[] = Array.from(files).map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        title: shortFileName(file.name),
        artist: "Local audio",
        bpm: 118 + ((file.size + index * 7) % 58),
        key: ["2A", "5A", "7B", "10A", "12B"][index % 5],
        energy: 62 + ((file.size + index * 11) % 38),
        color: ["#22c55e", "#38bdf8", "#f97316", "#e879f9", "#facc15"][index % 5],
        duration: 240 + ((file.size / 1024) % 180),
        source: "local",
        file,
      }));
      setTracks((current) => [...nextTracks, ...current]);
      loadTrack(selectedDeck, nextTracks[0]);
      setMessage(`${nextTracks.length} archivo(s) listos. Deck ${selectedDeck} queda armado.`);
    },
    [loadTrack, selectedDeck],
  );

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const context = audioContextRef.current;

      setDeckA((current) => evolveDeck("A", current, context, deckAudioRef.current.A));
      setDeckB((current) => evolveDeck("B", current, context, deckAudioRef.current.B));
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    return () => {
      stopDeckAudio("A");
      stopDeckAudio("B");
      void audioContextRef.current?.close();
    };
  }, [stopDeckAudio]);

  const syncDecks = useCallback(() => {
    const target = selectedDeck === "A" ? deckB.track.bpm : deckA.track.bpm;
    const source = decks[selectedDeck].track.bpm;
    const tempo = clamp(((target - source) / source) * 100, -16, 16);
    updateDeck(selectedDeck, { tempo });
    setMessage(`SYNC Deck ${selectedDeck}: ${source} BPM hacia ${target} BPM (${tempo.toFixed(1)}%).`);
  }, [deckA.track.bpm, deckB.track.bpm, decks, selectedDeck, updateDeck]);

  const resetMixer = useCallback(() => {
    setCrossfader(0);
    setMasterGain(0.86);
    setDeckA((current) => ({ ...current, gain: 0.82, bass: 0, mid: 0, treble: 0, filter: 0, fx: 0 }));
    setDeckB((current) => ({ ...current, gain: 0.82, bass: 0, mid: 0, treble: 0, filter: 0, fx: 0 }));
    setMessage("Mixer calibrado a punto neutro.");
  }, []);

  return (
    <main className="min-h-screen bg-[#080a0d] text-slate-100">
      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(34,197,94,0.28),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.18),transparent_32%),linear-gradient(180deg,#10131a,#080a0d)]">
        <div className="mx-auto flex min-h-[calc(100vh-28px)] w-full max-w-[1800px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <header className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-black uppercase tracking-normal text-emerald-200">
                <Sparkles size={15} /> Harvard MIT Sound Contest Prototype
              </p>
              <h1 className="max-w-5xl text-4xl font-black leading-[0.92] tracking-normal text-white sm:text-6xl lg:text-7xl">
                DJ Traktor Science Lab
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                Consola profesional en Next.js con dos decks, mezcla A/B, motor Web Audio, FX, EQ,
                hot cues, loops, biblioteca y metrica de energia para estudiar mezcla, ritmo y timbre.
              </p>
              <Link
                href="/dj-lab/voice-decoder"
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md border border-sky-300/35 bg-sky-300/10 px-4 text-sm font-black text-sky-100 transition hover:border-sky-200 hover:bg-sky-300/15"
              >
                <AudioLines size={18} />
                Voice Decoder
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-black/30 p-2 backdrop-blur">
              {[
                ["Latency", "Web Audio"],
                ["Mode", "2 Decks"],
                ["Output", "Master"],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 rounded-md bg-white/[0.06] p-3">
                  <p className="text-[0.68rem] font-black uppercase text-slate-500">{label}</p>
                  <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </header>

          <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="grid gap-4">
              <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px_minmax(0,1fr)]">
                <DeckPanel
                  deckId="A"
                  state={deckA}
                  active={selectedDeck === "A"}
                  onSelect={() => setSelectedDeck("A")}
                  onToggle={() => toggleDeck("A")}
                  onChange={(patch) => updateDeck("A", patch)}
                  onLoad={(track) => loadTrack("A", track)}
                  tracks={tracks}
                />
                <MixerPanel
                  deckA={deckA}
                  deckB={deckB}
                  crossfader={crossfader}
                  masterGain={masterGain}
                  recording={recording}
                  message={message}
                  onCrossfader={setCrossfader}
                  onMaster={setMasterGain}
                  onSync={syncDecks}
                  onReset={resetMixer}
                  onRecord={() => {
                    setRecording((value) => !value);
                    setMessage(recording ? "Grabacion detenida." : "Grabacion marcada para demo de presentacion.");
                  }}
                />
                <DeckPanel
                  deckId="B"
                  state={deckB}
                  active={selectedDeck === "B"}
                  onSelect={() => setSelectedDeck("B")}
                  onToggle={() => toggleDeck("B")}
                  onChange={(patch) => updateDeck("B", patch)}
                  onLoad={(track) => loadTrack("B", track)}
                  tracks={tracks}
                />
              </div>

              <StudioStrip deckA={deckA} deckB={deckB} />
            </div>

            <LibraryPanel
              tracks={tracks}
              selectedDeck={selectedDeck}
              onSelectDeck={setSelectedDeck}
              onFiles={handleFiles}
              onLoad={loadTrack}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function evolveDeck(deckId: DeckId, deck: DeckState, context: AudioContext | null, audio: DeckAudio) {
  const duration = audio.buffer?.duration || deck.track.duration;
  let progress = deck.progress;

  if (deck.playing) {
    if (context && audio.buffer) {
      const elapsed = (context.currentTime - audio.startedAt) * (1 + deck.tempo / 100);
      progress = ((audio.offset + elapsed) % audio.buffer.duration) / audio.buffer.duration;
    } else {
      progress = (deck.progress + (1 / 60 / duration) * (1 + deck.tempo / 100)) % 1;
    }
  }

  const beat = Math.sin(Date.now() / (60000 / (deck.track.bpm * (1 + deck.tempo / 100))) + (deckId === "A" ? 0 : 1.8));
  const level = deck.playing
    ? clamp(0.24 + deck.gain * 0.52 + Math.max(0, beat) * 0.24 + deck.fx * 0.0015, 0.05, 1)
    : clamp(deck.level * 0.94, 0.08, 0.32);
  const phase = (deck.phase + (deck.track.bpm / 60 / 60) * (deck.playing ? 1 : 0.15)) % 1;

  return { ...deck, progress, level, phase };
}

function DeckPanel({
  deckId,
  state,
  active,
  tracks,
  onSelect,
  onToggle,
  onChange,
  onLoad,
}: {
  deckId: DeckId;
  state: DeckState;
  active: boolean;
  tracks: Track[];
  onSelect: () => void;
  onToggle: () => void;
  onChange: (patch: Partial<DeckState>) => void;
  onLoad: (track: Track) => void;
}) {
  const rotation = state.progress * 360 * 12;
  const remaining = (1 - state.progress) * state.track.duration;

  return (
    <article
      className={`rounded-lg border p-4 shadow-2xl transition ${
        active ? "border-emerald-300/60 bg-white/[0.085]" : "border-white/10 bg-white/[0.045]"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-slate-500">Deck {deckId}</p>
          <h2 className="mt-1 truncate text-2xl font-black text-white">{state.track.title}</h2>
          <p className="truncate text-sm text-slate-400">{state.track.artist}</p>
        </div>
        <button
          type="button"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-emerald-300/30 bg-emerald-400/15 text-emerald-100 transition hover:bg-emerald-400/25"
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
          title={state.playing ? "Pause deck" : "Play deck"}
        >
          {state.playing ? <Pause size={22} /> : <Play size={22} />}
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_110px]">
        <div className="relative mx-auto aspect-square w-full max-w-[360px] rounded-full border border-white/15 bg-[radial-gradient(circle,#1f2937_0_28%,#020617_29%_44%,#111827_45%_47%,#020617_48%)] shadow-[0_0_60px_rgba(0,0,0,0.5)]">
          <div
            className="absolute inset-[13%] rounded-full border border-white/10"
            style={{
              transform: `rotate(${rotation}deg)`,
              background: `conic-gradient(from 0deg, ${state.track.color}, transparent 24%, rgba(255,255,255,0.12) 25%, transparent 26%, ${state.track.color} 54%, transparent 55%)`,
            }}
          />
          <div className="absolute inset-[38%] grid place-items-center rounded-full border border-white/20 bg-black">
            <Disc3 className="text-white" size={46} />
          </div>
          <div className="absolute bottom-5 left-1/2 h-1 w-[44%] -translate-x-1/2 rounded-full bg-white/10">
            <div className="h-full rounded-full bg-emerald-300" style={{ width: `${state.progress * 100}%` }} />
          </div>
        </div>

        <div className="grid content-between gap-3">
          <Metric label="BPM" value={(state.track.bpm * (1 + state.tempo / 100)).toFixed(1)} />
          <Metric label="Key" value={state.track.key} />
          <Metric label="Energy" value={`${state.track.energy}%`} />
          <Metric label="Remain" value={formatTime(remaining)} />
        </div>
      </div>

      <Waveform color={state.track.color} progress={state.progress} level={state.level} />

      <div className="mt-4 grid grid-cols-4 gap-2">
        {padLabels.map((label, index) => (
          <button
            key={label}
            type="button"
            className={`min-h-12 rounded-md border text-xs font-black transition ${
              (label === "LOOP" && state.loop) || index === Math.floor(state.phase * padLabels.length)
                ? "border-emerald-300 bg-emerald-300 text-black"
                : "border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/[0.1]"
            }`}
            onClick={(event) => {
              event.stopPropagation();
              if (label === "LOOP") onChange({ loop: !state.loop });
              if (label.startsWith("CUE")) onChange({ cue: index / 8, progress: index / 8 });
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Knob label="Gain" value={state.gain} min={0} max={1.2} step={0.01} onChange={(gain) => onChange({ gain })} />
        <Knob label="FX" value={state.fx} min={0} max={100} step={1} onChange={(fx) => onChange({ fx })} suffix="%" />
        <Knob label="Tempo" value={state.tempo} min={-16} max={16} step={0.1} onChange={(tempo) => onChange({ tempo })} suffix="%" />
        <Knob label="Filter" value={state.filter} min={-100} max={100} step={1} onChange={(filter) => onChange({ filter })} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniFader label="Low" value={state.bass} onChange={(bass) => onChange({ bass })} />
        <MiniFader label="Mid" value={state.mid} onChange={(mid) => onChange({ mid })} />
        <MiniFader label="High" value={state.treble} onChange={(treble) => onChange({ treble })} />
      </div>

      <select
        className="mt-4 w-full rounded-md border border-white/10 bg-black/40 px-3 py-3 text-sm font-bold text-slate-100 outline-none"
        value={state.track.id}
        onChange={(event) => {
          const track = tracks.find((item) => item.id === event.target.value);
          if (track) onLoad(track);
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {tracks.map((track) => (
          <option key={track.id} value={track.id}>
            {track.title} - {track.bpm} BPM
          </option>
        ))}
      </select>
    </article>
  );
}

function MixerPanel({
  deckA,
  deckB,
  crossfader,
  masterGain,
  recording,
  message,
  onCrossfader,
  onMaster,
  onSync,
  onReset,
  onRecord,
}: {
  deckA: DeckState;
  deckB: DeckState;
  crossfader: number;
  masterGain: number;
  recording: boolean;
  message: string;
  onCrossfader: (value: number) => void;
  onMaster: (value: number) => void;
  onSync: () => void;
  onReset: () => void;
  onRecord: () => void;
}) {
  return (
    <aside className="rounded-lg border border-white/10 bg-black/45 p-4 shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase text-slate-500">Central mixer</p>
          <h2 className="mt-1 text-2xl font-black text-white">Club Core</h2>
        </div>
        <SlidersHorizontal className="text-emerald-200" size={28} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Meter label="A" level={deckA.level} />
        <Meter label="B" level={deckB.level} />
      </div>

      <div className="mt-6 rounded-md border border-white/10 bg-white/[0.04] p-3">
        <div className="mb-2 flex items-center justify-between text-xs font-black uppercase text-slate-500">
          <span>Crossfader</span>
          <span>{crossfader < 0 ? "A" : crossfader > 0 ? "B" : "Center"}</span>
        </div>
        <input
          className="w-full accent-emerald-300"
          type="range"
          min={-100}
          max={100}
          value={crossfader}
          onChange={(event) => onCrossfader(Number(event.target.value))}
        />
      </div>

      <div className="mt-4 rounded-md border border-white/10 bg-white/[0.04] p-3">
        <div className="mb-2 flex items-center justify-between text-xs font-black uppercase text-slate-500">
          <span>Master</span>
          <span>{Math.round(masterGain * 100)}%</span>
        </div>
        <input
          className="w-full accent-sky-300"
          type="range"
          min={0}
          max={1.2}
          step={0.01}
          value={masterGain}
          onChange={(event) => onMaster(Number(event.target.value))}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <ActionButton icon={<Gauge size={18} />} label="Sync" onClick={onSync} />
        <ActionButton icon={<RotateCcw size={18} />} label="Reset" onClick={onReset} />
        <ActionButton icon={<Radio size={18} />} label={recording ? "Stop Rec" : "Record"} active={recording} onClick={onRecord} />
        <ActionButton icon={<Download size={18} />} label="Export" onClick={() => undefined} />
      </div>

      <div className="mt-5 rounded-md border border-emerald-300/20 bg-emerald-300/10 p-3">
        <p className="flex items-center gap-2 text-xs font-black uppercase text-emerald-200">
          <Activity size={15} /> System log
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{message}</p>
      </div>

      <div className="mt-5 grid gap-2">
        {["Harmonic mixing", "Beat grid", "Phrase 32", "Limiter"].map((item, index) => (
          <div key={item} className="flex items-center justify-between rounded-md bg-white/[0.04] px-3 py-2">
            <span className="text-sm font-bold text-slate-300">{item}</span>
            <span className={`h-2.5 w-2.5 rounded-full ${index < 3 ? "bg-emerald-300" : "bg-amber-300"}`} />
          </div>
        ))}
      </div>
    </aside>
  );
}

function LibraryPanel({
  tracks,
  selectedDeck,
  onSelectDeck,
  onFiles,
  onLoad,
}: {
  tracks: Track[];
  selectedDeck: DeckId;
  onSelectDeck: (deckId: DeckId) => void;
  onFiles: (files: FileList | null) => void;
  onLoad: (deckId: DeckId, track: Track) => void;
}) {
  return (
    <aside className="rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-slate-500">Browser</p>
          <h2 className="mt-1 text-2xl font-black text-white">Music Library</h2>
        </div>
        <Library className="text-sky-200" size={30} />
      </div>

      <label className="mt-5 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-emerald-300/35 bg-emerald-300/10 p-4 text-center transition hover:bg-emerald-300/15">
        <Upload className="mb-2 text-emerald-100" />
        <span className="text-sm font-black text-white">Cargar MP3, WAV, M4A</span>
        <span className="mt-1 text-xs text-slate-400">Los archivos se quedan en tu navegador.</span>
        <input
          className="sr-only"
          type="file"
          accept="audio/*"
          multiple
          onChange={(event) => onFiles(event.target.files)}
        />
      </label>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {(["A", "B"] as DeckId[]).map((deckId) => (
          <button
            key={deckId}
            type="button"
            className={`min-h-11 rounded-md border text-sm font-black ${
              selectedDeck === deckId
                ? "border-emerald-300 bg-emerald-300 text-black"
                : "border-white/10 bg-black/30 text-slate-200"
            }`}
            onClick={() => onSelectDeck(deckId)}
          >
            Load to {deckId}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-2">
        {tracks.map((track) => (
          <button
            key={track.id}
            type="button"
            className="grid w-full grid-cols-[4px_1fr_auto] gap-3 rounded-md border border-white/10 bg-black/25 p-3 text-left transition hover:border-emerald-300/50 hover:bg-white/[0.07]"
            onClick={() => onLoad(selectedDeck, track)}
          >
            <span className="h-full rounded-full" style={{ background: track.color }} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-white">{track.title}</span>
              <span className="mt-1 block truncate text-xs text-slate-500">{track.artist}</span>
            </span>
            <span className="text-right">
              <span className="block text-sm font-black text-emerald-200">{track.bpm}</span>
              <span className="text-xs text-slate-500">{track.key}</span>
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}

function StudioStrip({ deckA, deckB }: { deckA: DeckState; deckB: DeckState }) {
  const compatibility = Math.max(0, 100 - Math.abs(deckA.track.bpm - deckB.track.bpm) * 2);

  return (
    <section className="grid gap-3 rounded-lg border border-white/10 bg-black/35 p-4 md:grid-cols-4">
      <InfoTile icon={<Headphones size={22} />} label="Cue bus" value={deckA.playing && deckB.playing ? "Dual monitor" : "Single monitor"} />
      <InfoTile icon={<AudioLines size={22} />} label="BPM match" value={`${Math.round(compatibility)}%`} />
      <InfoTile icon={<Wand2 size={22} />} label="AI suggestion" value={compatibility > 82 ? "Blend now" : "Use echo out"} />
      <InfoTile icon={<ListMusic size={22} />} label="Assignment" value="Signal flow + FFT demo" />
    </section>
  );
}

function Waveform({ color, progress, level }: { color: string; progress: number; level: number }) {
  const bars = Array.from({ length: 72 }, (_, index) => {
    const wave = Math.abs(Math.sin(index * 0.42) * Math.cos(index * 0.17));
    return 18 + wave * 64 + level * 22;
  });

  return (
    <div className="relative mt-5 h-24 overflow-hidden rounded-md border border-white/10 bg-black/35 p-2">
      <div className="flex h-full items-center gap-1">
        {bars.map((height, index) => (
          <span
            key={index}
            className="flex-1 rounded-full"
            style={{
              height: `${height}%`,
              background: index / bars.length < progress ? color : "rgba(148, 163, 184, 0.28)",
            }}
          />
        ))}
      </div>
      <div className="absolute bottom-0 top-0 w-0.5 bg-white" style={{ left: `${progress * 100}%` }} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/30 p-3">
      <p className="text-[0.68rem] font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-black text-white">{value}</p>
    </div>
  );
}

function Knob({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="rounded-md border border-white/10 bg-black/25 p-3">
      <span className="mb-2 flex items-center justify-between text-xs font-black uppercase text-slate-500">
        <span>{label}</span>
        <span className="text-slate-300">{value.toFixed(step < 1 ? 1 : 0)}{suffix}</span>
      </span>
      <input
        className="w-full accent-emerald-300"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function MiniFader({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="rounded-md border border-white/10 bg-black/25 p-3">
      <span className="mb-2 block text-center text-xs font-black uppercase text-slate-500">{label}</span>
      <input
        className="h-24 w-full accent-sky-300"
        type="range"
        min={-12}
        max={12}
        step={0.5}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="mt-1 block text-center text-xs font-black text-slate-300">{value > 0 ? "+" : ""}{value.toFixed(1)} dB</span>
    </label>
  );
}

function Meter({ label, level }: { label: string; level: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/30 p-3">
      <div className="mb-2 flex items-center justify-between text-xs font-black uppercase text-slate-500">
        <span>Deck {label}</span>
        <span>{Math.round(level * 100)}</span>
      </div>
      <div className="grid h-36 grid-cols-2 items-end gap-1">
        {[0, 1].map((channel) => (
          <div key={channel} className="relative h-full overflow-hidden rounded-sm bg-white/10">
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-400 via-amber-300 to-red-500"
              style={{ height: `${clamp(level + channel * 0.05, 0, 1) * 100}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-black transition ${
        active
          ? "border-red-300 bg-red-400 text-black"
          : "border-white/10 bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
      }`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-center gap-3 text-emerald-200">
        {icon}
        <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      </div>
      <p className="mt-3 truncate text-lg font-black text-white">{value}</p>
    </div>
  );
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
