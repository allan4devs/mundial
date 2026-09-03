"use client";

import { useCallback, useEffect, useState } from "react";

import type { Song, SongWire } from "@/lib/song-builder/types";
import * as api from "../lib/api";
import { songFromWire } from "../lib/session";
import { useLatest } from "./useLatest";

export type LibraryScope = "all" | "mine";

export type Library = {
  songs: SongWire[];
  scope: LibraryScope;
  setScope: (scope: LibraryScope) => void;
  loading: boolean;
  saving: boolean;
  save: (song: Song) => Promise<void>;
  open: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

/**
 * The Mongo-backed shelf of saved songs.
 *
 * Writes are owner-scoped server-side, so a failed save or delete is reported
 * rather than swallowed — a shared library that silently ignores you is worse
 * than one that says no.
 */
export function useSongLibrary(deps: {
  onOpen: (song: Song) => void;
  onMessage: (message: string) => void;
}): Library {
  const [songs, setSongs] = useState<SongWire[]>([]);
  const [scope, setScope] = useState<LibraryScope>("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const onOpenRef = useLatest(deps.onOpen);
  const onMessageRef = useLatest(deps.onMessage);

  const refresh = useCallback(
    async (next: LibraryScope) => {
      setLoading(true);
      try {
        setSongs(await api.fetchSongs({ mine: next === "mine" }));
      } catch (error) {
        onMessageRef.current(message(error, "The library could not be loaded."));
      } finally {
        setLoading(false);
      }
    },
    [onMessageRef],
  );

  useEffect(() => {
    void refresh(scope);
  }, [refresh, scope]);

  const save = useCallback(
    async (song: Song) => {
      setSaving(true);
      try {
        const saved = await api.saveSong(song);
        onMessageRef.current(`Saved "${saved.title}" to the library.`);
        await refresh(scope);
      } catch (error) {
        onMessageRef.current(message(error, "The song could not be saved."));
      } finally {
        setSaving(false);
      }
    },
    [onMessageRef, refresh, scope],
  );

  const open = useCallback(
    async (id: string) => {
      try {
        const wire = await api.fetchSong(id);
        onOpenRef.current(songFromWire(wire));
        onMessageRef.current(`Loaded "${wire.title}".`);
      } catch (error) {
        onMessageRef.current(message(error, "That song could not be opened."));
      }
    },
    [onMessageRef, onOpenRef],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await api.deleteSong(id);
        onMessageRef.current("Song deleted.");
        await refresh(scope);
      } catch (error) {
        onMessageRef.current(message(error, "That song could not be deleted."));
      }
    },
    [onMessageRef, refresh, scope],
  );

  return { songs, scope, setScope, loading, saving, save, open, remove };
}

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
