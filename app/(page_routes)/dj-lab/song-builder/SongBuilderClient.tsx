"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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
 * noise lives behind `useAudioEngine`; the microphone behind `useRecorder`.
 *
 * The layout is a fixed-height column: header and transport take what they need,
 * the five rows split the rest. Above `lg` nothing scrolls — the whole studio is
 * one screen. Below it the column falls back to normal flow, because five
 * instrument rows genuinely do not fit on a phone.
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
  const transport = useTransport(engine, song, pack, setMessage);
  const stopTransport = transport.stop;

  const setHits = useCallback((kind: TrackKind, hits: Hit[]) => {
    setSong((current) => (current ? patchTrack(current, kind, { hits }) : current));
  }, []);

  const recorder = useRecorder({ engine, song, sensitivity, onHits: setHits, onMessage: setMessage });
  const startTake = recorder.record;

  const onRecord = useCallback(
    (kind: TrackKind) => {
      // Stop the loop first: on speakers it bleeds into the take, and the decoder
      // hears the other rows as extra hits.
      stopTransport();
      void startTake(kind);
    },
    [startTake, stopTransport],
  );

  // A new pack means a new style: build the song on the first one, and re-seat
  // the rhythms on every one after that.
  useEffect(() => {
    if (!pack) return;
    setSong((current) => (current ? restyle(current, pack) : createSong(pack)));
  }, [pack]);

  const onStyle = useCallback(
    (style: Style) => {
      stopTransport();
      select(style);
    },
    [select, stopTransport],
  );

  const onBpm = useCallback((bpm: number) => {
    setSong((current) => (current ? { ...current, bpm } : current));
  }, []);

  const onSound = useCallback((kind: TrackKind, soundId: string) => {
    setSong((current) => (current ? patchTrack(current, kind, { soundId }) : current));
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
    stopTransport();
    setSong(createDemoSong(pack));
    setMessage("Demo groove loaded. Hit Play, then record over any row to make it yours.");
  }, [pack, stopTransport]);

  const onClear = useCallback(() => {
    if (!pack) return;
    stopTransport();
    setSong(createSong(pack));
    setMessage(WELCOME);
  }, [pack, stopTransport]);

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
                onToggle={transport.toggle}
                onStyle={onStyle}
                onBpm={onBpm}
                onSensitivity={setSensitivity}
                onDemo={onDemo}
                onClear={onClear}
              />

              <div className="grid min-h-0 flex-1 gap-2 lg:grid-rows-5">
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
                    onRecord={onRecord}
                    onCancel={recorder.cancel}
                    onToggleStep={onToggleStep}
                    onSound={onSound}
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
