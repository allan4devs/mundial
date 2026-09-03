// ---------------------------------------------------------------------------
// songForge — procedural, copyright-free song generation for the Song Builder.
//
// Everything here is synthesised from scratch with the Web Audio API and
// rendered offline into plain AudioBuffers. Each part (drums / bass / chords /
// melody) is rendered to the *exact same* total length — `bars` bars at the
// chosen BPM — so when the Song Builder loops each layer on its own, they stay
// perfectly locked. No samples ship, nothing is uploaded, no licences involved.
// ---------------------------------------------------------------------------

export type GenreId = "lofi" | "trap" | "house" | "drill" | "phonk" | "afro" | "boombap";
export type ScaleId = "minor" | "major" | "minorPent" | "dorian" | "phrygian";
export type Role = "drums" | "bass" | "chords" | "melody";

export type GeneratedLoop = {
  name: string;
  role: Role;
  color: string;
  buffer: AudioBuffer;
};

export type GenerateResult = {
  bpm: number;
  bars: number;
  keyLabel: string;
  genre: GenreId;
  loops: GeneratedLoop[];
};

type ChordStep = { deg: number; type: keyof typeof CHORDS };

type GenreDef = {
  id: GenreId;
  name: string;
  emoji: string;
  blurb: string;
  bpm: number;
  scale: ScaleId;
  swing: number;
  bassStyle: "sub" | "pulse" | "walk";
  chordStyle: "stab" | "pad" | "sparse";
  melodyVoice: "bell" | "pluck" | "soft" | "cowbell";
  melodyDensity: number; // 0..1, chance a melody slot fires
  drums: DrumPattern;
  prog: ChordStep[];
  drive808: number;
};

type DrumPattern = {
  kick: string;
  snare: string;
  clap: string;
  hatC: string;
  hatO: string;
  perc: string;
  rolls: boolean; // trap/drill-style hat rolls
};

// ---------------------------------------------------------------------------
// Music theory
// ---------------------------------------------------------------------------

const PC_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const KEYS = PC_NAMES;

const SCALES: Record<ScaleId, number[]> = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  minorPent: [0, 3, 5, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
};

const CHORDS = {
  min: [0, 3, 7],
  maj: [0, 4, 7],
  min7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  dom7: [0, 4, 7, 10],
  sus2: [0, 2, 7],
  min9: [0, 3, 7, 10, 14],
};

const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);

/** Nth degree of `scale` above `root` (in MIDI), degrees wrap into higher octaves. */
function scaleNote(root: number, scale: ScaleId, degree: number) {
  const s = SCALES[scale];
  const len = s.length;
  const oct = Math.floor(degree / len);
  const idx = ((degree % len) + len) % len;
  return root + oct * 12 + s[idx];
}

const scaleLabel: Record<ScaleId, string> = {
  minor: "minor",
  major: "major",
  minorPent: "minor pentatonic",
  dorian: "dorian",
  phrygian: "phrygian",
};

// ---------------------------------------------------------------------------
// Seeded RNG (mulberry32) so "remix" gives fresh-but-repeatable variations.
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Voices — each schedules an absolute-time hit into `dest`.
// ---------------------------------------------------------------------------

const COLORS: Record<Role, string> = {
  drums: "#f97316",
  bass: "#22c55e",
  chords: "#38bdf8",
  melody: "#e879f9",
};

function makeNoise(ctx: BaseAudioContext) {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.2), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
  return buf;
}

function makeDrive(amount: number) {
  const n = 1024;
  const c = new Float32Array(n);
  const k = amount * 60;
  for (let i = 0; i < n; i += 1) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return c;
}

function kick(
  ctx: BaseAudioContext,
  dest: AudioNode,
  t: number,
  o: { fStart: number; fEnd: number; decay: number; gain: number; drive?: number },
) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(o.fStart, t);
  osc.frequency.exponentialRampToValueAtTime(o.fEnd, t + o.decay * 0.85);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.decay);
  if (o.drive && o.drive > 0) {
    const ws = ctx.createWaveShaper();
    ws.curve = makeDrive(o.drive);
    osc.connect(ws);
    ws.connect(g);
  } else {
    osc.connect(g);
  }
  g.connect(dest);
  osc.start(t);
  osc.stop(t + o.decay + 0.05);
  // click transient
  const c = ctx.createOscillator();
  c.type = "square";
  c.frequency.setValueAtTime(o.fStart * 2.4, t);
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(o.gain * 0.5, t);
  cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
  c.connect(cg);
  cg.connect(dest);
  c.start(t);
  c.stop(t + 0.03);
}

function snare(
  ctx: BaseAudioContext,
  dest: AudioNode,
  noise: AudioBuffer,
  t: number,
  o: { tone: number; decay: number; gain: number },
) {
  const n = ctx.createBufferSource();
  n.buffer = noise;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1400;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(o.gain, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + o.decay);
  n.connect(hp);
  hp.connect(ng);
  ng.connect(dest);
  n.start(t);
  n.stop(t + o.decay + 0.05);
  const body = ctx.createOscillator();
  body.type = "triangle";
  body.frequency.setValueAtTime(o.tone, t);
  body.frequency.exponentialRampToValueAtTime(o.tone * 0.75, t + o.decay * 0.6);
  const bg = ctx.createGain();
  bg.gain.setValueAtTime(o.gain * 0.6, t);
  bg.gain.exponentialRampToValueAtTime(0.0001, t + o.decay * 0.6);
  body.connect(bg);
  bg.connect(dest);
  body.start(t);
  body.stop(t + o.decay);
}

function clap(ctx: BaseAudioContext, dest: AudioNode, noise: AudioBuffer, t: number, gain: number) {
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1600;
  bp.Q.value = 1.3;
  bp.connect(dest);
  const offs = [0, 0.011, 0.022, 0.036];
  offs.forEach((off, i) => {
    const n = ctx.createBufferSource();
    n.buffer = noise;
    const g = ctx.createGain();
    const dec = i === offs.length - 1 ? 0.16 : 0.028;
    g.gain.setValueAtTime(gain, t + off);
    g.gain.exponentialRampToValueAtTime(0.0001, t + off + dec);
    n.connect(g);
    g.connect(bp);
    n.start(t + off);
    n.stop(t + off + dec + 0.05);
  });
}

function hat(
  ctx: BaseAudioContext,
  dest: AudioNode,
  noise: AudioBuffer,
  t: number,
  o: { open: boolean; gain: number },
) {
  const n = ctx.createBufferSource();
  n.buffer = noise;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 7200;
  const g = ctx.createGain();
  const decay = o.open ? 0.28 : 0.045;
  g.gain.setValueAtTime(o.gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  n.connect(hp);
  hp.connect(g);
  g.connect(dest);
  n.start(t);
  n.stop(t + decay + 0.05);
}

/** Rimshot / clave-style tick. */
function rim(ctx: BaseAudioContext, dest: AudioNode, t: number, gain: number) {
  const o = ctx.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(1700, t);
  o.frequency.exponentialRampToValueAtTime(800, t + 0.03);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g);
  g.connect(dest);
  o.start(t);
  o.stop(t + 0.06);
}

function sub808(
  ctx: BaseAudioContext,
  dest: AudioNode,
  t: number,
  freq: number,
  dur: number,
  o: { gain: number; glideFrom?: number; drive: number },
) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  if (o.glideFrom) {
    osc.frequency.setValueAtTime(o.glideFrom, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + Math.min(0.12, dur * 0.5));
  } else {
    osc.frequency.setValueAtTime(freq, t);
  }
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain, t + 0.012);
  g.gain.setValueAtTime(o.gain, t + Math.max(0.03, dur - 0.06));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  if (o.drive > 0) {
    const ws = ctx.createWaveShaper();
    ws.curve = makeDrive(o.drive);
    osc.connect(ws);
    ws.connect(g);
  } else {
    osc.connect(g);
  }
  g.connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/** Generic subtractive synth note (bass pulses, chord tones, leads). */
function synthNote(
  ctx: BaseAudioContext,
  dest: AudioNode,
  t: number,
  freq: number,
  dur: number,
  o: {
    type: OscillatorType;
    cutoff: number;
    q?: number;
    attack: number;
    release: number;
    gain: number;
    voices?: number;
    detune?: number;
    sweep?: number; // filter env: cutoff multiplies to this over attack, then back
  },
) {
  const filt = ctx.createBiquadFilter();
  filt.type = "lowpass";
  filt.Q.value = o.q ?? 0.7;
  const sustain = Math.max(0.03, dur);
  filt.frequency.setValueAtTime(o.cutoff, t);
  if (o.sweep && o.sweep !== 1) {
    filt.frequency.setValueAtTime(o.cutoff * o.sweep, t);
    filt.frequency.exponentialRampToValueAtTime(Math.max(80, o.cutoff), t + Math.min(0.25, sustain));
  }
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(o.gain, t + o.attack);
  amp.gain.setValueAtTime(o.gain, t + sustain);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + sustain + o.release);
  filt.connect(amp);
  amp.connect(dest);
  const stop = t + sustain + o.release + 0.05;
  const voices = o.voices ?? 1;
  for (let v = 0; v < voices; v += 1) {
    const osc = ctx.createOscillator();
    osc.type = o.type;
    osc.frequency.value = freq;
    if (voices > 1) osc.detune.value = (v - (voices - 1) / 2) * (o.detune ?? 10);
    osc.connect(filt);
    osc.start(t);
    osc.stop(stop);
  }
}

// ---------------------------------------------------------------------------
// Genre definitions
// ---------------------------------------------------------------------------

export const GENRES: { id: GenreId; name: string; emoji: string; blurb: string; bpm: number }[] = [
  { id: "lofi", name: "Lo-Fi", emoji: "🌧️", blurb: "Dusty, jazzy, chilled", bpm: 78 },
  { id: "trap", name: "Trap", emoji: "🔥", blurb: "Booming 808s, fast hats", bpm: 140 },
  { id: "house", name: "House", emoji: "🪩", blurb: "Four-on-the-floor groove", bpm: 124 },
  { id: "drill", name: "Drill", emoji: "🥶", blurb: "Dark sliding 808s", bpm: 142 },
  { id: "phonk", name: "Phonk", emoji: "💀", blurb: "Memphis cowbell menace", bpm: 130 },
  { id: "afro", name: "Afro", emoji: "🌍", blurb: "Warm syncopated bounce", bpm: 106 },
  { id: "boombap", name: "Boom Bap", emoji: "🎧", blurb: "Punchy 90s swing", bpm: 90 },
];

const DEFS: Record<GenreId, GenreDef> = {
  lofi: {
    id: "lofi",
    name: "Lo-Fi",
    emoji: "🌧️",
    blurb: "Dusty, jazzy, chilled",
    bpm: 78,
    scale: "minor",
    swing: 0.16,
    bassStyle: "walk",
    chordStyle: "pad",
    melodyVoice: "soft",
    melodyDensity: 0.4,
    drive808: 0,
    prog: [
      { deg: 0, type: "min7" },
      { deg: 5, type: "maj7" },
      { deg: 3, type: "min7" },
      { deg: 4, type: "dom7" },
    ],
    drums: {
      kick: "X-------x-----x-",
      snare: "----X-------X---",
      clap: "----------------",
      hatC: "x-x-x-x-x-x-x-x-",
      hatO: "--------------o-",
      perc: "----------------",
      rolls: false,
    },
  },
  trap: {
    id: "trap",
    name: "Trap",
    emoji: "🔥",
    blurb: "Booming 808s, fast hats",
    bpm: 140,
    scale: "minor",
    swing: 0,
    bassStyle: "sub",
    chordStyle: "sparse",
    melodyVoice: "bell",
    melodyDensity: 0.5,
    drive808: 0.35,
    prog: [
      { deg: 0, type: "min" },
      { deg: 0, type: "min" },
      { deg: 5, type: "maj" },
      { deg: 6, type: "maj" },
    ],
    drums: {
      kick: "X-----x-----x---",
      snare: "--------X-------",
      clap: "--------X-------",
      hatC: "xxxxxxxxxxxxxxxx",
      hatO: "------------x---",
      perc: "----------------",
      rolls: true,
    },
  },
  house: {
    id: "house",
    name: "House",
    emoji: "🪩",
    blurb: "Four-on-the-floor groove",
    bpm: 124,
    scale: "minor",
    swing: 0,
    bassStyle: "pulse",
    chordStyle: "stab",
    melodyVoice: "pluck",
    melodyDensity: 0.35,
    drive808: 0,
    prog: [
      { deg: 0, type: "min" },
      { deg: 5, type: "maj" },
      { deg: 2, type: "maj" },
      { deg: 4, type: "min" },
    ],
    drums: {
      kick: "X---x---X---x---",
      snare: "----X-------X---",
      clap: "----X-------X---",
      hatC: "x-x-x-x-x-x-x-x-",
      hatO: "--x---x---x---x-",
      perc: "----------------",
      rolls: false,
    },
  },
  drill: {
    id: "drill",
    name: "Drill",
    emoji: "🥶",
    blurb: "Dark sliding 808s",
    bpm: 142,
    scale: "phrygian",
    swing: 0,
    bassStyle: "sub",
    chordStyle: "sparse",
    melodyVoice: "bell",
    melodyDensity: 0.4,
    drive808: 0.25,
    prog: [
      { deg: 0, type: "min" },
      { deg: 6, type: "maj" },
      { deg: 5, type: "maj" },
      { deg: 4, type: "min" },
    ],
    drums: {
      kick: "X-----x---x-----",
      snare: "--------x-x-----",
      clap: "--------x-------",
      hatC: "x-xx-x-xx-x-xx-x",
      hatO: "------------x---",
      perc: "----------------",
      rolls: true,
    },
  },
  phonk: {
    id: "phonk",
    name: "Phonk",
    emoji: "💀",
    blurb: "Memphis cowbell menace",
    bpm: 130,
    scale: "minor",
    swing: 0.08,
    bassStyle: "sub",
    chordStyle: "sparse",
    melodyVoice: "cowbell",
    melodyDensity: 0.55,
    drive808: 0.5,
    prog: [
      { deg: 0, type: "min" },
      { deg: 0, type: "min" },
      { deg: 3, type: "min" },
      { deg: 5, type: "maj" },
    ],
    drums: {
      kick: "X-------x-------",
      snare: "----X-------X---",
      clap: "----------------",
      hatC: "x-x-x-x-x-x-x-x-",
      hatO: "----------------",
      perc: "----------------",
      rolls: false,
    },
  },
  afro: {
    id: "afro",
    name: "Afro",
    emoji: "🌍",
    blurb: "Warm syncopated bounce",
    bpm: 106,
    scale: "dorian",
    swing: 0.05,
    bassStyle: "walk",
    chordStyle: "stab",
    melodyVoice: "pluck",
    melodyDensity: 0.4,
    drive808: 0,
    prog: [
      { deg: 0, type: "min7" },
      { deg: 3, type: "dom7" },
      { deg: 0, type: "min7" },
      { deg: 4, type: "min7" },
    ],
    drums: {
      kick: "X--x--X---x--x--",
      snare: "----o-------o---",
      clap: "----------------",
      hatC: "--x-x---x-x---x-",
      hatO: "------x-------x-",
      perc: "x--x--x--x--x--x",
      rolls: false,
    },
  },
  boombap: {
    id: "boombap",
    name: "Boom Bap",
    emoji: "🎧",
    blurb: "Punchy 90s swing",
    bpm: 90,
    scale: "minor",
    swing: 0.14,
    bassStyle: "walk",
    chordStyle: "pad",
    melodyVoice: "soft",
    melodyDensity: 0.35,
    drive808: 0,
    prog: [
      { deg: 0, type: "min7" },
      { deg: 3, type: "min7" },
      { deg: 5, type: "maj7" },
      { deg: 4, type: "dom7" },
    ],
    drums: {
      kick: "X-----x-x-------",
      snare: "----X-------X---",
      clap: "----------------",
      hatC: "x-x-x-x-x-x-x-x-",
      hatO: "----------------",
      perc: "----------------",
      rolls: false,
    },
  },
};

// ---------------------------------------------------------------------------
// Part rendering
// ---------------------------------------------------------------------------

const vel = (c: string) => (c === "X" ? 1 : c === "x" ? 0.72 : c === "o" ? 0.5 : 0);

function stepTime(step: number, s16: number, swing: number) {
  const swung = step % 2 === 1 ? swing * s16 : 0;
  return step * s16 + swung;
}

function buildDrums(
  ctx: BaseAudioContext,
  dest: AudioNode,
  noise: AudioBuffer,
  def: GenreDef,
  bars: number,
  bpm: number,
  rng: () => number,
) {
  const s16 = 60 / bpm / 4;
  const d = def.drums;
  const kParams =
    def.id === "boombap"
      ? { fStart: 115, fEnd: 46, decay: 0.3 }
      : def.id === "lofi"
        ? { fStart: 120, fEnd: 45, decay: 0.34 }
        : def.id === "house"
          ? { fStart: 150, fEnd: 52, decay: 0.26 }
          : { fStart: 140, fEnd: 44, decay: 0.3 };

  for (let bar = 0; bar < bars; bar += 1) {
    const last = bar === bars - 1;
    for (let st = 0; st < 16; st += 1) {
      const t = bar * 16 * s16 + stepTime(st, s16, def.swing);
      const k = vel(d.kick[st]);
      if (k) kick(ctx, dest, t, { ...kParams, gain: 0.95 * k, drive: def.drive808 > 0.3 ? 0.15 : 0 });
      const sn = vel(d.snare[st]);
      if (sn) {
        if (def.id === "house" || def.id === "trap" || def.id === "drill") {
          clap(ctx, dest, noise, t, 0.6 * sn + 0.1);
        } else {
          snare(ctx, dest, noise, t, { tone: def.id === "boombap" ? 200 : 185, decay: 0.2, gain: 0.6 * sn + 0.1 });
        }
      }
      if (vel(d.clap[st]) && def.id !== "house") clap(ctx, dest, noise, t, 0.5);
      const hc = vel(d.hatC[st]);
      if (hc) {
        const roll = d.rolls && rng() < 0.18;
        if (roll) {
          const n = 3;
          for (let r = 0; r < n; r += 1) {
            hat(ctx, dest, noise, t + (r * s16) / n, { open: false, gain: (0.3 - r * 0.06) * hc + 0.08 });
          }
        } else {
          hat(ctx, dest, noise, t, { open: false, gain: 0.32 * hc + 0.05 });
        }
      }
      if (vel(d.hatO[st])) hat(ctx, dest, noise, t, { open: true, gain: 0.3 });
      if (vel(d.perc[st])) rim(ctx, dest, t, 0.4);
    }
    // last-bar snare fill
    if (last && def.id !== "house") {
      for (let r = 0; r < 4; r += 1) {
        const t = (bars - 1) * 16 * s16 + (12 + r) * s16;
        snare(ctx, dest, noise, t, { tone: 200, decay: 0.09, gain: 0.22 + r * 0.08 });
      }
    }
  }
}

function buildBass(
  ctx: BaseAudioContext,
  dest: AudioNode,
  def: GenreDef,
  root: number,
  bars: number,
  bpm: number,
  rng: () => number,
) {
  const spb = 60 / bpm;
  const s16 = spb / 4;
  const barSec = spb * 4;

  for (let bar = 0; bar < bars; bar += 1) {
    const chord = def.prog[bar % def.prog.length];
    const rootMidi = scaleNote(root, def.scale, chord.deg) - 12;
    const t0 = bar * barSec;

    if (def.bassStyle === "sub") {
      // 808: root hits on a syncopated pattern, occasional octave / glide.
      const pattern = "X-----x-----x-x-";
      let prevFreq: number | undefined;
      for (let st = 0; st < 16; st += 1) {
        if (!vel(pattern[st])) continue;
        const t = t0 + st * s16;
        const oct = rng() < 0.15 ? 12 : 0;
        const freq = mtof(rootMidi + oct);
        // hold until next hit
        let nextHit = 16;
        for (let n = st + 1; n < 16; n += 1) if (vel(pattern[n])) { nextHit = n; break; }
        const dur = Math.min(barSec, (nextHit - st) * s16) * 0.96;
        const glide = def.id === "drill" && prevFreq && rng() < 0.6 ? prevFreq : undefined;
        sub808(ctx, dest, t, freq, dur, { gain: 0.85, glideFrom: glide, drive: def.drive808 });
        prevFreq = freq;
      }
    } else if (def.bassStyle === "pulse") {
      // House: rolling offbeat eighths on the root.
      for (let ei = 0; ei < 8; ei += 1) {
        if (ei % 2 === 0) continue; // offbeat only
        const t = t0 + ei * (s16 * 2);
        synthNote(ctx, dest, t, mtof(rootMidi), s16 * 1.4, {
          type: "sawtooth",
          cutoff: 500,
          attack: 0.006,
          release: 0.05,
          gain: 0.5,
          sweep: 1.6,
        });
      }
    } else {
      // Walk: root on 1, fifth on 3, passing tone into next bar.
      const fifth = rootMidi + 7;
      synthNote(ctx, dest, t0, mtof(rootMidi), spb * 1.4, {
        type: "sawtooth",
        cutoff: 420,
        attack: 0.01,
        release: 0.08,
        gain: 0.5,
      });
      synthNote(ctx, dest, t0 + spb * 2, mtof(fifth), spb * 1.2, {
        type: "sawtooth",
        cutoff: 420,
        attack: 0.01,
        release: 0.08,
        gain: 0.45,
      });
      if (rng() < 0.5) {
        synthNote(ctx, dest, t0 + spb * 3.5, mtof(rootMidi + (rng() < 0.5 ? 3 : 5)), spb * 0.45, {
          type: "sawtooth",
          cutoff: 420,
          attack: 0.01,
          release: 0.06,
          gain: 0.4,
        });
      }
    }
  }
}

function buildChords(
  ctx: BaseAudioContext,
  dest: AudioNode,
  def: GenreDef,
  root: number,
  bars: number,
  bpm: number,
) {
  const spb = 60 / bpm;
  const s16 = spb / 4;
  const barSec = spb * 4;

  for (let bar = 0; bar < bars; bar += 1) {
    const chord = def.prog[bar % def.prog.length];
    const rootMidi = scaleNote(root, def.scale, chord.deg) + 12; // mid register
    const freqs = CHORDS[chord.type].map((iv) => mtof(rootMidi + iv));
    const t0 = bar * barSec;

    if (def.chordStyle === "sparse") {
      // one soft held stab at the top of the bar
      freqs.forEach((f) =>
        synthNote(ctx, dest, t0, f, barSec * 0.5, {
          type: "sawtooth",
          cutoff: 1400,
          attack: 0.02,
          release: 0.3,
          gain: 0.16,
          voices: 2,
          detune: 8,
        }),
      );
    } else if (def.chordStyle === "stab") {
      // house/afro: short stabs on offbeats
      [2, 6, 10, 14].forEach((st) => {
        const t = t0 + st * s16;
        freqs.forEach((f) =>
          synthNote(ctx, dest, t, f, s16 * 1.5, {
            type: "sawtooth",
            cutoff: 2200,
            q: 1,
            attack: 0.004,
            release: 0.08,
            gain: 0.18,
            voices: 2,
            detune: 12,
            sweep: 1.5,
          }),
        );
      });
    } else {
      // pad: soft sustained chord across the whole bar
      freqs.forEach((f) =>
        synthNote(ctx, dest, t0, f, barSec * 0.92, {
          type: "sawtooth",
          cutoff: 1200,
          attack: 0.08,
          release: 0.35,
          gain: 0.14,
          voices: 3,
          detune: 7,
        }),
      );
    }
  }
}

function buildMelody(
  ctx: BaseAudioContext,
  dest: AudioNode,
  def: GenreDef,
  root: number,
  bars: number,
  bpm: number,
  rng: () => number,
) {
  const spb = 60 / bpm;
  const s16 = spb / 4;
  const grid = def.id === "trap" || def.id === "drill" || def.id === "phonk" ? 8 : 8; // eighth-note grid
  const stepSec = spb / (grid / 4);
  let degree = 7; // start an octave up-ish

  for (let bar = 0; bar < bars; bar += 1) {
    const chord = def.prog[bar % def.prog.length];
    for (let g = 0; g < grid; g += 1) {
      if (rng() > def.melodyDensity) continue;
      // bias toward chord tones on strong slots
      const strong = g % 2 === 0;
      if (strong && rng() < 0.6) {
        const tone = CHORDS[chord.type][Math.floor(rng() * CHORDS[chord.type].length)];
        degree = chord.deg + Math.round(tone / 2) + 7;
      } else {
        degree += Math.round((rng() - 0.5) * 4);
      }
      degree = Math.max(4, Math.min(15, degree));
      const midi = scaleNote(root, def.scale, degree) + 12;
      const t = bar * spb * 4 + g * stepSec + (g % 2 === 1 ? def.swing * s16 : 0);
      const dur = stepSec * (rng() < 0.3 ? 1.8 : 0.9);

      if (def.melodyVoice === "bell") {
        synthNote(ctx, dest, t, mtof(midi), dur, {
          type: "sine",
          cutoff: 4000,
          attack: 0.002,
          release: 0.25,
          gain: 0.22,
        });
        synthNote(ctx, dest, t, mtof(midi + 12), dur * 0.6, {
          type: "sine",
          cutoff: 6000,
          attack: 0.002,
          release: 0.12,
          gain: 0.08,
        });
      } else if (def.melodyVoice === "cowbell") {
        synthNote(ctx, dest, t, mtof(midi), dur * 0.5, {
          type: "square",
          cutoff: 3200,
          q: 2,
          attack: 0.002,
          release: 0.08,
          gain: 0.16,
        });
      } else if (def.melodyVoice === "pluck") {
        synthNote(ctx, dest, t, mtof(midi), dur, {
          type: "sawtooth",
          cutoff: 2600,
          q: 1,
          attack: 0.003,
          release: 0.1,
          gain: 0.2,
          sweep: 1.8,
        });
      } else {
        synthNote(ctx, dest, t, mtof(midi), dur, {
          type: "triangle",
          cutoff: 1800,
          attack: 0.01,
          release: 0.2,
          gain: 0.2,
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Offline render orchestration
// ---------------------------------------------------------------------------

function getOfflineCtor(): typeof OfflineAudioContext {
  const ctor = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!ctor) throw new Error("Offline rendering is not supported in this browser.");
  return ctor;
}

async function renderPart(
  sampleRate: number,
  durationSec: number,
  build: (ctx: OfflineAudioContext, dest: AudioNode, noise: AudioBuffer) => void,
): Promise<AudioBuffer> {
  const Ctor = getOfflineCtor();
  const ctx = new Ctor(2, Math.max(1, Math.ceil(sampleRate * durationSec)), sampleRate);
  const master = ctx.createGain();
  master.gain.value = 0.92;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -8;
  comp.ratio.value = 4;
  comp.attack.value = 0.003;
  comp.release.value = 0.18;
  master.connect(comp);
  comp.connect(ctx.destination);
  const noise = makeNoise(ctx);
  build(ctx, master, noise);
  return ctx.startRendering();
}

export async function generateSong(opts: {
  sampleRate: number;
  genre: GenreId;
  rootPc: number; // 0..11
  bpm?: number;
  bars?: number;
  seed?: number;
}): Promise<GenerateResult> {
  const def = DEFS[opts.genre];
  const bpm = opts.bpm ?? def.bpm;
  const bars = opts.bars ?? 4;
  const barSec = (60 / bpm) * 4;
  const total = barSec * bars;
  const seed = opts.seed ?? Math.floor(Math.random() * 1e9);
  // Base octave: root pitch class placed at MIDI ~45-57 range depending on part.
  const root = 45 + opts.rootPc; // low register root; parts shift up as needed.

  const loops: GeneratedLoop[] = [];

  const [drums, bass, chords, melody] = await Promise.all([
    renderPart(opts.sampleRate, total, (ctx, dest, noise) =>
      buildDrums(ctx, dest, noise, def, bars, bpm, mulberry32(seed + 1)),
    ),
    renderPart(opts.sampleRate, total, (ctx, dest) => buildBass(ctx, dest, def, root, bars, bpm, mulberry32(seed + 2))),
    renderPart(opts.sampleRate, total, (ctx, dest) => buildChords(ctx, dest, def, root, bars, bpm)),
    renderPart(opts.sampleRate, total, (ctx, dest) =>
      buildMelody(ctx, dest, def, root, bars, bpm, mulberry32(seed + 3)),
    ),
  ]);

  loops.push({ name: `${def.name} Drums`, role: "drums", color: COLORS.drums, buffer: drums });
  loops.push({ name: def.bassStyle === "sub" ? "808 Bass" : "Bass", role: "bass", color: COLORS.bass, buffer: bass });
  loops.push({ name: "Chords", role: "chords", color: COLORS.chords, buffer: chords });
  loops.push({ name: "Melody", role: "melody", color: COLORS.melody, buffer: melody });

  return {
    bpm,
    bars,
    genre: opts.genre,
    keyLabel: `${PC_NAMES[opts.rootPc]} ${scaleLabel[def.scale]}`,
    loops,
  };
}

declare global {
  interface Window {
    webkitOfflineAudioContext?: typeof OfflineAudioContext;
  }
}
