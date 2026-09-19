"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { toggleHit } from "@/lib/song-builder/pattern";
import {
  TRACK_KINDS,
  loopSeconds,
  type Hit,
  type Song,
  type Style,
  type TrackKind,
} from "@/lib/song-builder/types";
import { StudioHeader } from "./components/StudioHeader";
import { TrackRow } from "./components/TrackRow";
import { TransportBar } from "./components/TransportBar";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { useLatest } from "./hooks/useLatest";
import { useRecorder } from "./hooks/useRecorder";
import { useStylePack } from "./hooks/useStylePack";
import { useTransport } from "./hooks/useTransport";
import type { VoiceTake } from "./hooks/useTransport";
import { useVocalTake } from "./hooks/useVocalTake";
import { DEFAULT_SENSITIVITY } from "./lib/constants";
import { auditionHit } from "./lib/scheduler";
import {
  createDemoSong,
  createSong,
  patchTrack,
  restyle,
  soundFor,
  soundsFor,
  trackFor,
} from "./lib/session";

const WELCOME = "Hit Record on a row, wait for the four count-in clicks, then beat-box your rhythm.";

/**
 * The studio shell.
 *
 * It owns the song and hands stable, kind-taking callbacks down to the five
 * rows. The sounds come from Mongo via `useStylePack`; everything that makes
 * noise lives behind `useAudioEngine`; the microphone behind `useRecorder` when
 * a row is being beat-boxed, and behind `useVocalTake` when the whole loop is
 * being sung over.
 *
 * The layout is a fixed-height column: header and transport are always on screen,
 * and the ten rows take the rest and scroll inside it. Ten rows stopped fitting a
 * laptop viewport, so the frame stayed fixed and the list gave way — the controls
 * you reach for mid-take (Play, Sing, Download) must never scroll off.
 *
 * The song is null until the first style pack lands, which is the one loading
 * state in the app.
 */
export default function SongBuilderClient() {
  const [song, setSong] = useState<Song | null>(null);
  const [sensitivity, setSensitivity] = useState(DEFAULT_SENSITIVITY);
  const [message, setMessage] = useState(WELCOME);

  const { pack, loading, select } = useStylePack("groovy", setMessage);
  const songRef = useLatest(song);
  const packRef = useLatest(pack);

  const engine = useAudioEngine(song, pack);
  // A ref, not state: a new take clears the old vocal and starts the loop in one
  // gesture, and state would still be showing the old buffer when it did.
  const voiceRef = useRef<VoiceTake | null>(null);
  const transport = useTransport(engine, song, pack, voiceRef, setMessage);
  const stopTransport = transport.stop;
  const toggleTransport = transport.toggle;

  const setHits = useCallback((kind: TrackKind, hits: Hit[]) => {
    setSong((current) => (current ? patchTrack(current, kind, { hits }) : current));
  }, []);

  const recorder = useRecorder({ engine, song, sensitivity, onHits: setHits, onMessage: setMessage });
  const startTake = recorder.record;

  // The file is named after what it is: this style, at this tempo.
  const takeName = useMemo(
    () => (pack && song ? `song-builder-${pack.style}-${song.bpm}bpm` : "song-builder-take"),
    [pack, song],
  );
  const vocal = useVocalTake({ engine, transport, voice: voiceRef, name: takeName, onMessage: setMessage });
  const finishTake = vocal.finish;

  /**
   * Everything goes quiet: the loop stops, and a sung take that was running is
   * closed out into a file rather than lost. Every control that interrupts
   * playback goes through here, so none of them has to know about the others.
   */
  const halt = useCallback(async () => {
    stopTransport();
    await finishTake();
  }, [finishTake, stopTransport]);

  const onToggle = useCallback(async () => {
    if (vocal.recording) await finishTake();
    else await toggleTransport();
  }, [finishTake, toggleTransport, vocal.recording]);

  const onRecord = useCallback(
    (kind: TrackKind) => {
      // Stop the loop first: on speakers it bleeds into the take, and the decoder
      // hears the other rows as extra hits.
      void halt().then(() => startTake(kind));
    },
    [halt, startTake],
  );

  // A new pack means a new style: build the song on the first one, and re-seat
  // the rhythms on every one after that.
  useEffect(() => {
    if (!pack) return;
    // The demo groove, not an empty grid: Play has to make noise on arrival.
    setSong((current) => (current ? restyle(current, pack) : createDemoSong(pack)));
  }, [pack]);

  const onStyle = useCallback(
    (style: Style) => {
      void halt();
      select(style);
    },
    [halt, select],
  );

  const onBpm = useCallback((bpm: number) => {
    setSong((current) => (current ? { ...current, bpm } : current));
  }, []);

  const onSound = useCallback((kind: TrackKind, soundId: string) => {
    setSong((current) => (current ? patchTrack(current, kind, { soundId }) : current));
  }, []);

  // Silencing a row is a mix decision, not an edit: the rhythm stays on the grid
  // and the strip's fader goes to zero, so it comes back exactly as it was.
  const onMute = useCallback((kind: TrackKind) => {
    setSong((current) => {
      if (!current) return current;
      const track = trackFor(current, kind);
      return track ? patchTrack(current, kind, { muted: !track.muted }) : current;
    });
  }, []);

  const onToggleStep = useCallback(
    (kind: TrackKind, step: number) => {
      const current = songRef.current;
      const currentPack = packRef.current;
      if (!current || !currentPack) return;

      const before = trackFor(current, kind)?.hits ?? [];
      const hits = toggleHit(before, step);
      const next = patchTrack(current, kind, { hits });
      setSong(next);

      // Hearing the step you just placed is the whole point of a grid editor.
      if (hits.length > before.length) {
        void engine.getRig().then((rig) => {
          const strip = rig.strips.get(kind);
          if (strip) {
            auditionHit({ ctx: rig.ctx, out: strip.input, song: next, pack: currentPack, kind, step });
          }
        });
      }
    },
    [engine, packRef, songRef],
  );

  const onDemo = useCallback(() => {
    if (!pack) return;
    void halt();
    setSong(createDemoSong(pack));
    setMessage("Demo groove loaded. Hit Play, then record over any row to make it yours.");
  }, [halt, pack]);

  const onClear = useCallback(() => {
    if (!pack) return;
    void halt();
    // Clear all means all of it - the vocal goes with the rows.
    voiceRef.current = null;
    setSong(createSong(pack));
    setMessage(WELCOME);
  }, [halt, pack]);

  const rows = useMemo(
    () =>
      pack && song
        ? TRACK_KINDS.map((kind) => {
            const track = trackFor(song, kind);
            return {
              kind,
              hits: track?.hits ?? [],
              sound: soundFor(pack, kind, track?.soundId ?? ""),
              options: soundsFor(pack, kind),
              muted: track?.muted ?? false,
            };
          })
        : [],
    [pack, song],
  );

  return (
    <main className="min-h-screen bg-[#080a0d] text-slate-100 lg:h-[100dvh] lg:overflow-hidden">
      <div className="h-full bg-[radial-gradient(circle_at_18%_0%,rgba(34,197,94,0.22),transparent_38%),radial-gradient(circle_at_82%_4%,rgba(56,189,248,0.15),transparent_36%),linear-gradient(180deg,#10131a,#080a0d)]">
        <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col gap-2.5 px-4 py-3 sm:px-6">
          <StudioHeader message={message} />

          {pack && song ? (
            <>
              <TransportBar
                pack={pack}
                bpm={song.bpm}
                playing={transport.playing}
                loading={loading}
                sensitivity={sensitivity}
                singing={vocal.recording}
                take={vocal.take}
                onToggle={onToggle}
                onSing={vocal.toggle}
                onStyle={onStyle}
                onBpm={onBpm}
                onSensitivity={setSensitivity}
                onDemo={onDemo}
                onClear={onClear}
              />

              <div className="grid min-h-0 flex-1 content-start gap-2 overflow-y-auto lg:auto-rows-[minmax(104px,1fr)]">
                {rows.map((row) => (
                  <TrackRow
                    key={row.kind}
                    kind={row.kind}
                    hits={row.hits}
                    sound={row.sound}
                    options={row.options}
                    playStep={transport.step}
                    envelope={recorder.envelopes[row.kind]}
                    recording={recorder.state.kind === row.kind ? recorder.state : null}
                    beatSeconds={60 / song.bpm}
                    takeSeconds={loopSeconds(song.bpm)}
                    busy={recorder.state.phase !== "idle"}
                    muted={row.muted}
                    onRecord={onRecord}
                    onCancel={recorder.cancel}
                    onToggleStep={onToggleStep}
                    onSound={onSound}
                    onMute={onMute}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/30 text-sm text-slate-400">
              <Loader2 size={16} className="animate-spin" />
              Loading sounds…
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
