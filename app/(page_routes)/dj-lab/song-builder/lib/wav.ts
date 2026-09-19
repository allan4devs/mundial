/**
 * The take file.
 *
 * `MediaRecorder` hands back Opus in a WebM container, which half the world
 * cannot open by double-clicking it. A sung take is the one thing in this studio
 * that leaves the browser, so it leaves as a plain 16-bit PCM wav.
 */

const HEADER_BYTES = 44;
const BYTES_PER_SAMPLE = 2;

export function encodeWav(buffer: AudioBuffer): Blob {
  const channels = Math.min(2, buffer.numberOfChannels);
  const frames = buffer.length;
  const dataBytes = frames * channels * BYTES_PER_SAMPLE;

  const view = new DataView(new ArrayBuffer(HEADER_BYTES + dataBytes));
  ascii(view, 0, "RIFF");
  view.setUint32(4, HEADER_BYTES - 8 + dataBytes, true);
  ascii(view, 8, "WAVE");
  ascii(view, 12, "fmt ");
  view.setUint32(16, 16, true); // rest of this chunk
  view.setUint16(20, 1, true); // uncompressed PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * BYTES_PER_SAMPLE, true); // byte rate
  view.setUint16(32, channels * BYTES_PER_SAMPLE, true); // frame size
  view.setUint16(34, 8 * BYTES_PER_SAMPLE, true);
  ascii(view, 36, "data");
  view.setUint32(40, dataBytes, true);

  // Channels are interleaved frame by frame, which is what wav means by stereo.
  const source = Array.from({ length: channels }, (_, channel) => buffer.getChannelData(channel));
  let offset = HEADER_BYTES;
  for (let frame = 0; frame < frames; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, source[channel][frame]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += BYTES_PER_SAMPLE;
    }
  }

  return new Blob([view.buffer], { type: "audio/wav" });
}

function ascii(view: DataView, at: number, text: string) {
  for (let i = 0; i < text.length; i += 1) view.setUint8(at + i, text.charCodeAt(i));
}
