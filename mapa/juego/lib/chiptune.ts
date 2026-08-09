// Tiny procedural 8-bit chiptune engine (Web Audio).
// Generates a cheerful, looping platformer soundtrack — no audio files needed.

export interface Chiptune {
  setMuted: (muted: boolean) => void;
  dispose: () => void;
}

const BPM = 130;
const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// Chord progression: C major → G → A minor → F  (8 sixteenth-steps each).
const CHORDS = [
  [60, 64, 67], // C  (C E G)
  [62, 67, 71], // G  (D G B)
  [57, 60, 64], // Am (A C E)
  [53, 57, 60], // F  (F A C)
];
// Bouncy arpeggio pattern (index into the current chord) per step-in-block.
const LEAD_ARP = [0, 2, 1, 2, 0, 2, 1, 2];
const STEPS = 32; // 2 bars of 4/4 in sixteenth notes

export function createChiptune(): Chiptune {
  const Ctor = window.AudioContext
    || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) throw new Error('Web Audio API not available');
  const ctx = new Ctor();

  const master = ctx.createGain();
  master.gain.value = 0.0;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 5200;
  master.connect(lp).connect(ctx.destination);

  const TARGET_VOL = 0.22;

  // Pre-baked white-noise buffer for hi-hats.
  const noise = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  const step16 = (60 / BPM) / 4;
  let step = 0;
  let nextTime = ctx.currentTime + 0.06;
  let timer: number | null = null;

  const tone = (freq: number, t: number, dur: number, type: OscillatorType, vol: number) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  };

  const kick = (t: number) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.55, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + 0.17);
  };

  const hat = (t: number) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.14, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    src.connect(hp).connect(g).connect(master);
    src.start(t);
    src.stop(t + 0.06);
  };

  const scheduleStep = (s: number, t: number) => {
    const block = Math.floor(s / 8) % 4;
    const chord = CHORDS[block];
    const inBlock = s % 8;

    // Lead arpeggio (square), an octave up for brightness.
    tone(midiToFreq(chord[LEAD_ARP[inBlock]] + 12), t, step16 * 0.9, 'square', 0.13);

    // Bass (triangle) on eighth notes: root / fifth alternating, an octave down.
    if (inBlock % 2 === 0) {
      const bass = inBlock % 4 === 0 ? chord[0] - 12 : chord[0] - 12 + 7;
      tone(midiToFreq(bass), t, step16 * 1.7, 'triangle', 0.22);
    }

    // Drums: kick on the beat, hat on the offbeat.
    if (s % 4 === 0) kick(t);
    if (s % 2 === 1) hat(t);
  };

  const scheduler = () => {
    while (nextTime < ctx.currentTime + 0.12) {
      scheduleStep(step, nextTime);
      nextTime += step16;
      step = (step + 1) % STEPS;
    }
  };

  timer = window.setInterval(scheduler, 25);

  return {
    setMuted(muted: boolean) {
      if (ctx.state === 'suspended') void ctx.resume();
      master.gain.setTargetAtTime(muted ? 0 : TARGET_VOL, ctx.currentTime, 0.05);
    },
    dispose() {
      if (timer != null) window.clearInterval(timer);
      timer = null;
      void ctx.close();
    },
  };
}
