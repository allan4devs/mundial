/**
 * The microphone, and the two different things this studio asks of it.
 *
 * A beat-box take wants the signal untouched: the browser's voice processing
 * smears exactly the transients the onset detector is listening for. A sung take
 * has the band coming out of the speakers while the mic is open, so there echo
 * cancellation is the whole point - it keeps the loop out of the vocal, and the
 * clean band is mixed back in off the master bus anyway.
 */

export type MicIntent = "beatbox" | "sing";

const CONSTRAINTS: Record<MicIntent, MediaTrackConstraints> = {
  beatbox: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  sing: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
};

export function openMic(intent: MicIntent) {
  return navigator.mediaDevices.getUserMedia({ audio: CONSTRAINTS[intent] });
}

/** Releases the device, so the browser's recording indicator actually goes away. */
export function closeMic(stream: MediaStream | null) {
  for (const track of stream?.getTracks() ?? []) track.stop();
}

export type Capture = {
  /** Stops recording and resolves everything captured so far. */
  stop: () => Promise<Blob>;
  /** Throws the recording away - a cancelled take. */
  abort: () => void;
};

/**
 * Records a stream to a blob, starting immediately.
 *
 * Chrome and Firefox prefer Opus; Safari ignores the hint and records MP4.
 * Either way what comes back is decoded before anything looks at it.
 */
export function captureStream(stream: MediaStream): Capture {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("This browser cannot record audio. Try Chrome, Edge or Firefox.");
  }

  const supported = MediaRecorder.isTypeSupported("audio/webm");
  const recorder = new MediaRecorder(stream, supported ? { mimeType: "audio/webm" } : undefined);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  recorder.start();

  return {
    stop: () =>
      new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
        recorder.stop();
      }),
    abort: () => {
      recorder.onstop = null;
      if (recorder.state !== "inactive") recorder.stop();
    },
  };
}

export function micMessage(error: unknown) {
  if (error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError")) {
    return "The microphone is blocked. Allow it in the address bar and try again.";
  }
  if (error instanceof DOMException && error.name === "NotFoundError") {
    return "No microphone found. Plug one in and try again.";
  }
  return error instanceof Error ? error.message : "The take could not be recorded.";
}
