// lib/realtime/online-game.ts
// Utilidades genéricas para juegos en vivo: suscripción/notify y conteo de espectadores.

export type LiveGameListener = (gameId: string) => void;

type ViewerCountDoc = {
  _id: string;
  viewerCount?: number;
  version?: number;
  updatedAt?: Date;
};

const gameListeners = new Set<LiveGameListener>();

export function subscribeLiveGameChanges(listener: LiveGameListener): () => void {
  gameListeners.add(listener);
  return () => gameListeners.delete(listener);
}

export function notifyLiveGameChanged(gameId: string) {
  for (const listener of gameListeners) {
    try {
      listener(gameId);
    } catch (err) {
      // swallow listener errors to avoid breaking the notifier
      if (console && console.error) console.error(err);
    }
  }
}


// In-memory viewer counter (fallback/fast path).
const viewerCounts = new Map<string, number>();

export function incViewerCount(gameId: string): number {
  const current = viewerCounts.get(gameId) ?? 0;
  const next = current + 1;
  viewerCounts.set(gameId, next);
  return next;
}

export function decViewerCount(gameId: string): number {
  const current = viewerCounts.get(gameId) ?? 0;
  const next = Math.max(0, current - 1);
  if (next === 0) viewerCounts.delete(gameId);
  else viewerCounts.set(gameId, next);
  return next;
}

export function getViewerCount(gameId: string): number {
  return viewerCounts.get(gameId) ?? 0;
}

export function resetViewerCount(gameId: string): void {
  viewerCounts.delete(gameId);
}

// Mongo-backed viewer counters (for persistence and multi-process sync).
// `db` should be a connected MongoDB `Db` instance. These functions atomically
// increment/decrement the `viewerCount` field on the game's document.
export async function incViewerCountDb(db: import("mongodb").Db, gameId: string): Promise<number> {
  const col = db.collection<ViewerCountDoc>("ghost_game_state");
  const updated = await col.findOneAndUpdate({ _id: gameId }, { $inc: { viewerCount: 1, version: 1 }, $set: { updatedAt: new Date() } }, { returnDocument: "after" });
  const vc = updated?.viewerCount ?? 0;
  viewerCounts.set(gameId, vc);
  return vc;
}

export async function decViewerCountDb(db: import("mongodb").Db, gameId: string): Promise<number> {
  const col = db.collection<ViewerCountDoc>("ghost_game_state");
  const updated = await col.findOneAndUpdate({ _id: gameId }, { $inc: { viewerCount: -1, version: 1 }, $set: { updatedAt: new Date() } }, { returnDocument: "after" });
  const vc = Math.max(0, updated?.viewerCount ?? 0);
  // ensure non-negative
  if (vc === 0) await col.updateOne({ _id: gameId }, { $set: { viewerCount: 0 } });
  viewerCounts.set(gameId, vc);
  return vc;
}

export const DEFAULT_MAX_HISTORY = 50;
