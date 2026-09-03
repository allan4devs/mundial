"use client";

import { useCallback, useEffect, useState } from "react";

import { toggleHit } from "@/lib/song-builder/pattern";
import {
  loopSeconds,
  type Hit,
  type Song,
  type Track,
  type TrackKind,
} from "@/lib/song-builder/types";
import { SongLibraryPanel } from "./components/SongLibraryPanel";
import { StudioHeader } from "./components/StudioHeader";
import { StudioNotes } from "./components/StudioNotes";
import { TrackRow } from "./components/TrackRow";
import { TransportBar } from "./components/TransportBar";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { useLatest } from "./hooks/useLatest";
import { useRecorder } from "./hooks/useRecorder";
import { useSongLibrary } from "./hooks/useSongLibrary";
import { useTransport } from "./hooks/useTransport";
import { DEFAULT_SENSITIVITY } from "./lib/constants";
import { auditionHit, auditionTrack } from "./lib/scheduler";
import {
  createSong,
  patchTrack,
  recallAuthor,
  rememberAuthor,
  resizeSong,
  trackFor,
} from "./lib/session";

const WELCOME = "Hit Record on a row, wait for the four count-in clicks, then beat-box your rhythm.";

/**
 * The studio shell.
 *
 * It owns the song and hands stable, kind-taking callbacks down to the five rows.
 * Everything that makes noise lives behind `useAudioEngine`; the microphone and
 * the decoder behind `useRecorder`; persistence behind `useSongLibrary`.
 */
export default function SongBuilderClient() {
  const [song, setSong] = useState<Song>(createSong);
  const [master, setMaster] = useState(0.9);
  const [sensitivity, setSensitivity] = useState(DEFAULT_SENSITIVITY);
  const [message, setMessage] = useState(WELCOME);

  const songRef = useLatest(song);

  const engine = useAudioEngine(song, master);
  const transport = useTransport(engine, song, setMessage);
  const stopTransport = transport.stop;

  const setHits = useCallback((kind: TrackKind, hits: Hit[]) => {
    setSong((current) => patchTrack(current, kind, { hits }));
  }, []);

  const recorder = useRecorder({ engine, song, sensitivity, onHits: setHits, onMessage: setMessage });

  const openSong = useCallback(
    (loaded: Song) => {
      stopTransport();
      setSong(loaded);
    },
    [stopTransport],
  );

  const library = useSongLibrary({ onOpen: openSong, onMessage: setMessage });

  // The author name is a browser preference, not part of the song being edited.
  useEffect(() => {
    const remembered = recallAuthor();
    if (remembered) setSong((current) => ({ ...current, author: remembered }));
  }, []);

  const patchSong = useCallback((patch: Partial<Song>) => {
    setSong((current) => {
      const next = { ...current, ...patch };
      if (patch.author !== undefined) rememberAuthor(patch.author);
      return patch.steps !== undefined ? resizeSong(next, patch.steps) : next;
    });
  }, []);

  const onPatchTrack = useCallback((kind: TrackKind, patch: Partial<Track>) => {
    setSong((current) => patchTrack(current, kind, patch));
  }, []);

  const onToggleStep = useCallback(
    (kind: TrackKind, step: number) => {
      const current = songRef.current;
      const hits = toggleHit(trackFor(current, kind).hits, step, current.steps);
      const next = patchTrack(current, kind, { hits });
      setSong(next);

      // Hearing the step you just placed is the whole point of a grid editor.
      if (hits.length > trackFor(current, kind).hits.length) {
        void engine.getRig().then((rig) => {
          auditionHit({
            ctx: rig.ctx,
            out: rig.buses.get(kind) ?? rig.master.input,
            song: next,
            track: trackFor(next, kind),
            step,
          });
        });
      }
    },
    [engine, songRef],
  );

  const onAudition = useCallback(
    (kind: TrackKind) => {
      const current = songRef.current;
      void engine.getRig().then((rig) => {
        auditionTrack({
          ctx: rig.ctx,
          out: rig.buses.get(kind) ?? rig.master.input,
          song: current,
          track: trackFor(current, kind),
        });
      });
    },
    [engine, songRef],
  );

  const onClear = useCallback((kind: TrackKind) => {
    setSong((current) => patchTrack(current, kind, { hits: [] }));
  }, []);

  const onNew = useCallback(() => {
    stopTransport();
    setSong({ ...createSong(), author: recallAuthor() });
    setMessage(WELCOME);
  }, [stopTransport]);

  const take = loopSeconds(song.bpm, song.steps);
  const beatSeconds = 60 / song.bpm;
  const busy = recorder.state.phase !== "idle";

  return (
    <main className="min-h-screen bg-[#080a0d] text-slate-100">
      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(34,197,94,0.24),transparent_36%),radial-gradient(circle_at_82%_8%,rgba(56,189,248,0.16),transparent_34%),linear-gradient(180deg,#10131a,#080a0d)]">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
          <StudioHeader message={message} />

          <TransportBar
            song={song}
            playing={transport.playing}
            master={master}
            sensitivity={sensitivity}
            loopSeconds={take}
            onToggle={transport.toggle}
            onSong={patchSong}
            onMaster={setMaster}
            onSensitivity={setSensitivity}
          />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
            <div className="grid content-start gap-3">
              {song.tracks.map((track) => (
                <TrackRow
                  key={track.kind}
                  track={track}
                  steps={song.steps}
                  playStep={transport.step}
                  envelope={recorder.envelopes[track.kind]}
                  recording={recorder.state.kind === track.kind ? recorder.state : null}
                  beatSeconds={beatSeconds}
                  takeSeconds={take}
                  hasTake={recorder.hasTake(track.kind)}
                  busy={busy}
                  onRecord={recorder.record}
                  onCancel={recorder.cancel}
                  onRedecode={recorder.redecode}
                  onToggleStep={onToggleStep}
                  onPatch={onPatchTrack}
                  onAudition={onAudition}
                  onClear={onClear}
                />
              ))}
            </div>

            <div className="grid content-start gap-5">
              <SongLibraryPanel library={library} song={song} onSong={patchSong} onNew={onNew} />
              <StudioNotes />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
