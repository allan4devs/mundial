/** Typed calls to `/api/dj-lab/songs`. Every one carries this browser's owner key. */

import { OWNER_HEADER, type Song, type SongWire } from "@/lib/song-builder/types";
import { ownerKey } from "./session";

const BASE = "/api/dj-lab/songs";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", [OWNER_HEADER]: ownerKey(), ...init?.headers },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error ?? `The song library replied ${response.status}.`);
  }
  return body as T;
}

/** Recent songs from everyone, or `mine` for the ones this browser can edit. */
export async function fetchSongs(options: { mine?: boolean; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (options.mine) params.set("mine", "1");
  if (options.limit) params.set("limit", String(options.limit));
  const query = params.toString();
  const { songs } = await request<{ songs: SongWire[] }>(query ? `?${query}` : "");
  return songs;
}

export async function fetchSong(id: string) {
  const { song } = await request<{ song: SongWire }>(`/${id}`);
  return song;
}

/** Creates the song, or overwrites it when this browser saved it originally. */
export async function saveSong(song: Song) {
  const { song: saved } = await request<{ song: SongWire }>("", {
    method: "POST",
    body: JSON.stringify({
      id: song.id,
      title: song.title,
      author: song.author,
      bpm: song.bpm,
      steps: song.steps,
      root: song.root,
      scale: song.scale,
      tracks: song.tracks,
    }),
  });
  return saved;
}

export async function deleteSong(id: string) {
  await request<{ ok: true }>(`/${id}`, { method: "DELETE" });
}
