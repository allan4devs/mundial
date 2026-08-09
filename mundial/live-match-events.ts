type LiveMatchListener = () => void;

const listeners = new Set<LiveMatchListener>();

export function subscribeLiveMatchChanges(listener: LiveMatchListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyLiveMatchChanged() {
  for (const listener of listeners) listener();
}
