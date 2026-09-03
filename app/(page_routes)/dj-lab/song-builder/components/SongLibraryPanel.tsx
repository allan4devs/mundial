"use client";

import { FilePlus2, Library, Loader2, Save, Sparkles, Trash2 } from "lucide-react";
import { memo } from "react";

import { MAX_AUTHOR_LENGTH, MAX_TITLE_LENGTH } from "@/lib/song-builder/types";
import type { SongCardProps, SongLibraryPanelProps } from "../props";
import { PanelTitle } from "./ui";

/**
 * Save, load and delete. The shelf is shared — every visitor sees every song —
 * but only the browser that saved one may overwrite or remove it, so the delete
 * button only appears on the "Mine" tab.
 */
export const SongLibraryPanel = memo(function SongLibraryPanel({
  library,
  song,
  onSong,
  onNew,
  onDemo,
}: SongLibraryPanelProps) {
  const { songs, scope, setScope, loading, saving } = library;

  return (
    <section className="rounded-lg border border-white/10 bg-black/30 p-4">
      <PanelTitle eyebrow="Mongo" title="Song library" icon={<Library size={22} className="text-emerald-200" />} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label>
          <span className="text-[0.68rem] font-black uppercase text-slate-500">Title</span>
          <input
            className="mt-1 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm font-black text-white"
            value={song.title}
            maxLength={MAX_TITLE_LENGTH}
            onChange={(event) => onSong({ title: event.target.value })}
          />
        </label>
        <label>
          <span className="text-[0.68rem] font-black uppercase text-slate-500">Author</span>
          <input
            className="mt-1 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm font-black text-white"
            value={song.author}
            maxLength={MAX_AUTHOR_LENGTH}
            placeholder="anon"
            onChange={(event) => onSong({ author: event.target.value })}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => library.save(song)}
          disabled={saving}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-emerald-300/35 bg-emerald-300/10 px-4 text-sm font-black text-emerald-100 transition hover:border-emerald-200 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save song
        </button>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-slate-200 transition hover:border-white/25"
        >
          <FilePlus2 size={16} />
          New song
        </button>
        <button
          type="button"
          onClick={onDemo}
          title="Load a hand-written groove — no microphone needed"
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-slate-200 transition hover:border-white/25"
        >
          <Sparkles size={16} />
          Demo groove
        </button>
      </div>

      <div className="mt-5 flex items-center gap-2">
        {(["all", "mine"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setScope(option)}
            className={`min-h-9 rounded-md border px-3 text-xs font-black uppercase transition ${
              scope === option
                ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
                : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/25"
            }`}
          >
            {option === "all" ? "Everyone" : "Mine"}
          </button>
        ))}
        {loading ? <Loader2 size={14} className="animate-spin text-slate-500" /> : null}
      </div>

      <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto pr-1">
        {songs.length === 0 && !loading ? (
          <p className="rounded-md border border-white/10 bg-black/40 p-3 text-sm text-slate-400">
            Nothing saved yet. Record a row, then hit Save song.
          </p>
        ) : null}

        {songs.map((entry) => (
          <SongCard
            key={entry.id}
            entry={entry}
            active={entry.id === song.id}
            removable={scope === "mine"}
            onOpen={library.open}
            onRemove={library.remove}
          />
        ))}
      </div>
    </section>
  );
});

const SongCard = memo(function SongCard({ entry, active, removable, onOpen, onRemove }: SongCardProps) {
  const hits = entry.tracks.reduce((total, track) => total + track.hits.length, 0);

  return (
    <div
      className={`flex items-center gap-2 rounded-md border p-3 ${
        active ? "border-emerald-300/40 bg-emerald-300/[0.07]" : "border-white/10 bg-black/40"
      }`}
    >
      <button type="button" onClick={() => onOpen(entry.id)} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-black text-white">{entry.title}</p>
        <p className="truncate text-[0.7rem] text-slate-500">
          {entry.author} · {entry.bpm} bpm · {entry.steps} steps · {hits} hits
        </p>
        <p className="mt-1 truncate font-mono text-[0.65rem] tracking-widest text-slate-600">
          {entry.tracks.find((track) => track.hits.length)?.pattern ?? "silent"}
        </p>
      </button>

      {removable ? (
        <button
          type="button"
          onClick={() => onRemove(entry.id)}
          aria-label={`Delete ${entry.title}`}
          className="rounded-md border border-white/10 p-2 text-slate-400 transition hover:border-rose-300/40 hover:text-rose-200"
        >
          <Trash2 size={14} />
        </button>
      ) : null}
    </div>
  );
});
