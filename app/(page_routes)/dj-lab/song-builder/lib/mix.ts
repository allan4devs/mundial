/**
 * The master chain, the two shared effect buses, and the chain a sung take runs
 * through. This is the difference between ten instruments and a record.
 *
 * Ten rows landing straight on the speakers is what a demo sounds like: dry,
 * flat, centred, and either too quiet or clipping. What is here is the chain any
 * mix would have at the end of it, in the order it is always in -
 *
 *   rows -> glue compressor -> saturation -> tilt -> brickwall -> out
 *
 * plus one reverb and one tempo-synced delay hung off the side, fed by per-row
 * sends. Sharing one room between every row is the whole trick: it is what makes
 * ten separately synthesised parts sound like they were recorded together.
 */

import { stepSeconds, type Space } from "@/lib/song-builder/types";
import {
  AIR_DB,
  AIR_HZ,
  BUS_TRIM,
  GLUE,
  LIMITER,
  MAKEUP,
  MASTER_LEVEL,
  RAMP_SECONDS,
  SATURATION,
  WEIGHT_DB,
  WEIGHT_HZ,
} from "./constants";
import { impulseResponse, tapeCurve } from "./dsp";

/**
 * Where everything meets. `input` is the dry landing for rows and for the two
 * returns; `output` is both the speakers and the tap a sung take records off.
 */
export type MasterBus = {
  input: GainNode;
  reverbBus: GainNode;
  delayBus: GainNode;
  output: GainNode;
  /** Held so `applySpace` can retune the room without rebuilding the graph. */
  room: ConvolverNode;
  wet: GainNode;
  delay: DelayNode;
  feedback: GainNode;
};

export function createMasterBus(ctx: AudioContext): MasterBus {
  const input = ctx.createGain();
  input.gain.value = BUS_TRIM;

  // Glue: slow, shallow, and always working. It is not there to catch peaks -
  // that is the limiter's job - but to make ten rows breathe as one thing.
  const glue = ctx.createDynamicsCompressor();
  glue.threshold.value = GLUE.threshold;
  glue.knee.value = GLUE.knee;
  glue.ratio.value = GLUE.ratio;
  glue.attack.value = GLUE.attack;
  glue.release.value = GLUE.release;

  const makeup = ctx.createGain();
  makeup.gain.value = MAKEUP;

  const saturator = ctx.createWaveShaper();
  saturator.curve = tapeCurve(SATURATION);
  saturator.oversample = "4x";

  // A smile, gently: weight underneath, air on top. More than a couple of dB
  // here is a sign that some row's own EQ is wrong.
  const weight = ctx.createBiquadFilter();
  weight.type = "lowshelf";
  weight.frequency.value = WEIGHT_HZ;
  weight.gain.value = WEIGHT_DB;

  const air = ctx.createBiquadFilter();
  air.type = "highshelf";
  air.frequency.value = AIR_HZ;
  air.gain.value = AIR_DB;

  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = LIMITER.threshold;
  limiter.knee.value = LIMITER.knee;
  limiter.ratio.value = LIMITER.ratio;
  limiter.attack.value = LIMITER.attack;
  limiter.release.value = LIMITER.release;

  const output = ctx.createGain();
  output.gain.value = MASTER_LEVEL;

  input.connect(glue);
  glue.connect(makeup);
  makeup.connect(saturator);
  saturator.connect(weight);
  weight.connect(air);
  air.connect(limiter);
  limiter.connect(output);
  output.connect(ctx.destination);

  const { reverbBus, room, wet } = createReverb(ctx, input);
  const { delayBus, delay, feedback } = createDelay(ctx, input);

  return { input, reverbBus, delayBus, output, room, wet, delay, feedback };
}

/**
 * The room. Its return lands on the dry bus rather than after it, so the reverb
 * is compressed and saturated along with everything else - which is the reason a
 * mix sounds like one space rather than a dry mix with a wet one behind it.
 */
function createReverb(ctx: AudioContext, master: AudioNode) {
  const reverbBus = ctx.createGain();

  // Nothing under 220 Hz belongs in a reverb: low end in the tail is the most
  // common single reason a mix sounds like a car park.
  const cut = ctx.createBiquadFilter();
  cut.type = "highpass";
  cut.frequency.value = 220;

  const room = ctx.createConvolver();
  const wet = ctx.createGain();
  wet.gain.value = 0;

  reverbBus.connect(cut);
  cut.connect(room);
  room.connect(wet);
  wet.connect(master);
  return { reverbBus, room, wet };
}

/**
 * The delay. Its time is set in sixteenths and resolved against the tempo, so it
 * is always in time with the song - a delay that is not synced is just a smear.
 */
function createDelay(ctx: AudioContext, master: AudioNode) {
  const delayBus = ctx.createGain();
  const delay = ctx.createDelay(2);
  const feedback = ctx.createGain();
  feedback.gain.value = 0;

  // Each repeat comes back duller and thinner, the way a tape echo does. A delay
  // that repeats verbatim fights the source it came from.
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 2600;
  const thin = ctx.createBiquadFilter();
  thin.type = "highpass";
  thin.frequency.value = 320;

  delayBus.connect(delay);
  delay.connect(tone);
  tone.connect(thin);
  thin.connect(feedback);
  feedback.connect(delay);
  thin.connect(master);
  return { delayBus, delay, feedback };
}

/** Retunes the room and the echo for a style and a tempo. Called on every change. */
export function applySpace(ctx: AudioContext, bus: MasterBus, space: Space, bpm: number) {
  const now = ctx.currentTime;
  bus.room.buffer = impulseResponse(ctx, space.size, space.damp);
  bus.wet.gain.setTargetAtTime(space.wet, now, RAMP_SECONDS);
  // Ramped, not jumped: moving a delay line abruptly is an audible click.
  bus.delay.delayTime.setTargetAtTime(space.delaySteps * stepSeconds(bpm), now, 0.05);
  bus.feedback.gain.setTargetAtTime(space.feedback, now, RAMP_SECONDS);
}

/** A take in flight: the streams being recorded, and how to unhook them. */
export type TakeChain = {
  /** Band and voice together - the thing that downloads. */
  stream: MediaStream;
  /** The treated voice alone, for playing back over a loop without doubling the band. */
  voiceStream: MediaStream;
  /** Unhooks the take from the band, leaving the band playing. */
  dispose: () => void;
};

/**
 * What a sung take is mixed through.
 *
 * A voice recorded raw over a produced backing track sounds like a voice memo
 * over a record, and no amount of singing fixes it. So the microphone gets the
 * chain a vocal always gets - rumble filter, sibilance shelf, compressor, a
 * little presence, a plate behind it - before it ever meets the band.
 *
 * None of this reaches `ctx.destination`. The take is assembled on its own
 * destination and goes straight to a file: routing the microphone anywhere near
 * the speakers is a feedback loop, not a monitoring feature. The plate is the
 * voice's own for the same reason - sending it to the master reverb would put
 * the microphone back on the speakers by the long way round.
 */
export function createTakeChain(ctx: AudioContext, band: AudioNode, voice: AudioNode): TakeChain {
  const mix = ctx.createMediaStreamDestination();
  const solo = ctx.createMediaStreamDestination();
  const sum = ctx.createGain();
  // Everything the voice becomes, before the band arrives. Recording the take
  // and the solo off the same node is what stops the version played back over
  // the loop being the raw microphone while the download is the treated one.
  const treated = ctx.createGain();

  const rumble = ctx.createBiquadFilter();
  rumble.type = "highpass";
  rumble.frequency.value = 85;
  rumble.Q.value = 0.7;

  // Not a de-esser - a de-esser needs a detector - but the shelf a de-esser
  // would land on, which takes most of the harshness out of a cheap microphone.
  const sibilance = ctx.createBiquadFilter();
  sibilance.type = "peaking";
  sibilance.frequency.value = 6800;
  sibilance.Q.value = 1.4;
  sibilance.gain.value = -3.5;

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 12;
  compressor.ratio.value = 3.5;
  compressor.attack.value = 0.006;
  compressor.release.value = 0.14;

  const presence = ctx.createBiquadFilter();
  presence.type = "peaking";
  presence.frequency.value = 3400;
  presence.Q.value = 0.8;
  presence.gain.value = 3;

  const level = ctx.createGain();
  level.gain.value = 1.15;

  const send = ctx.createGain();
  send.gain.value = 0.18;
  const plate = ctx.createConvolver();
  plate.buffer = impulseResponse(ctx, 1.1, 0.45);

  voice.connect(rumble);
  rumble.connect(sibilance);
  sibilance.connect(compressor);
  compressor.connect(presence);
  presence.connect(level);
  level.connect(treated);
  level.connect(send);
  send.connect(plate);
  plate.connect(treated);
  treated.connect(sum);
  treated.connect(solo);
  band.connect(sum);

  // One last brickwall, so the band plus a voice cannot clip the file.
  const ceiling = ctx.createDynamicsCompressor();
  ceiling.threshold.value = LIMITER.threshold;
  ceiling.knee.value = LIMITER.knee;
  ceiling.ratio.value = LIMITER.ratio;
  ceiling.attack.value = LIMITER.attack;
  ceiling.release.value = LIMITER.release;

  sum.connect(ceiling);
  ceiling.connect(mix);

  return {
    stream: mix.stream,
    voiceStream: solo.stream,
    dispose: () => {
      band.disconnect(sum);
      voice.disconnect();
      ceiling.disconnect();
      treated.disconnect();
    },
  };
}
