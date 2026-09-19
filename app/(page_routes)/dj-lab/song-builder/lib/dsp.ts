/**
 * The buffers and curves the graph is built out of.
 *
 * Nothing here connects anything: these are the raw materials - a shaping curve,
 * a second of noise, a room. They are pure functions of an `AudioContext` and a
 * few numbers, and everything that is expensive to build is cached against the
 * context that built it, because a reverb impulse is a hundred thousand calls to
 * `Math.random` and must never happen twice.
 */

const CURVE_SAMPLES = 2048;

export function dbToGain(db: number) {
  return 10 ** (db / 20);
}

/**
 * Soft asymmetric clipping - a row's drive stage.
 *
 * At `amount` 0 the curve is a straight line, so a clean sound needs no bypass.
 * The positive half is pushed harder than the negative one, which is what puts
 * even harmonics in and is the difference between "distorted" and "valve".
 */
export function driveCurve(amount: number) {
  const curve = new Float32Array(CURVE_SAMPLES);
  const k = amount * 45;
  for (let i = 0; i < CURVE_SAMPLES; i += 1) {
    const x = (i * 2) / (CURVE_SAMPLES - 1) - 1;
    const bias = x > 0 ? 1.25 : 1;
    curve[i] = ((1 + k * bias) * x) / (1 + k * bias * Math.abs(x));
  }
  return curve;
}

/**
 * Master-bus saturation.
 *
 * A gentle `tanh` with a hint of third harmonic. It is doing two jobs at once:
 * rounding the peaks so the limiter has less to catch, and gluing ten separate
 * rows into one signal - which is most of what "produced" means when you hear it.
 */
export function tapeCurve(amount: number) {
  const curve = new Float32Array(CURVE_SAMPLES);
  const drive = 1 + amount * 3;
  for (let i = 0; i < CURVE_SAMPLES; i += 1) {
    const x = (i * 2) / (CURVE_SAMPLES - 1) - 1;
    const shaped = Math.tanh(x * drive) / Math.tanh(drive);
    curve[i] = shaped - amount * 0.12 * shaped ** 3;
  }
  return curve;
}

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();

/** Two seconds of stereo white noise, reused by every drum in the session. */
export function noiseBuffer(ctx: BaseAudioContext) {
  const cached = noiseCache.get(ctx);
  if (cached) return cached;

  const buffer = ctx.createBuffer(2, Math.floor(ctx.sampleRate * 2), ctx.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  }
  noiseCache.set(ctx, buffer);
  return buffer;
}

const roomCache = new WeakMap<BaseAudioContext, Map<string, AudioBuffer>>();

/**
 * A room, synthesised.
 *
 * No impulse response ships with this studio - there are no audio assets at all -
 * so the room is built the way a reverb designer would describe one out loud:
 * a handful of early reflections in the first fifty milliseconds, then noise
 * under a decaying envelope, then a one-pole lowpass whose corner falls as the
 * tail ages so the top end dies before the bottom does. The two channels are
 * generated independently, which is what makes the tail wide instead of centred.
 */
export function impulseResponse(ctx: BaseAudioContext, size: number, damp: number) {
  const key = `${size.toFixed(2)}:${damp.toFixed(2)}`;
  const cache = roomCache.get(ctx) ?? new Map<string, AudioBuffer>();
  roomCache.set(ctx, cache);
  const cached = cache.get(key);
  if (cached) return cached;

  const rate = ctx.sampleRate;
  const preDelay = Math.floor(rate * 0.018);
  const length = preDelay + Math.floor(rate * size);
  const buffer = ctx.createBuffer(2, length, rate);
  // A longer room is also a slower one: short rooms need a steeper envelope or
  // they read as a click rather than a space.
  const decay = 2.4 + 2.6 / Math.max(0.3, size);

  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    let state = 0;
    for (let i = preDelay; i < length; i += 1) {
      const t = (i - preDelay) / (length - preDelay);
      const noise = (Math.random() * 2 - 1) * (1 - t) ** decay;
      // Coefficient falls with the tail: the room gets darker as it dies.
      const coefficient = Math.max(0.04, 1 - damp * 0.9 * t);
      state += coefficient * (noise - state);
      data[i] = state;
    }
    // Early reflections, decorrelated per channel so the onset is not a pulse.
    for (let n = 0; n < 7; n += 1) {
      const at = preDelay + Math.floor(rate * (0.004 + Math.random() * 0.05));
      if (at < length) data[at] += (Math.random() * 2 - 1) * 0.45 * (1 - n / 7);
    }
  }

  normalize(buffer);
  cache.set(key, buffer);
  return buffer;
}

/** Scales a buffer so its loudest sample is 1 - a room should not also be a fader. */
function normalize(buffer: AudioBuffer) {
  let peak = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    for (const sample of buffer.getChannelData(channel)) peak = Math.max(peak, Math.abs(sample));
  }
  if (peak <= 0) return;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) data[i] /= peak;
  }
}

/**
 * A stable pseudo-random number for one (row, step, pass) - the humaniser's
 * source of jitter.
 *
 * It has to be a hash rather than `Math.random` because the same step must land
 * the same way inside one pass of the loop no matter how many times the
 * look-ahead scheduler visits it, and a different way on the next pass.
 */
export function jitter(seed: number) {
  let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (((h ^ (h >>> 16)) >>> 0) / 4294967296) * 2 - 1;
}
