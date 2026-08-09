type ScorerListener = () => void;

const listeners = new Set<ScorerListener>();

export function subscribeScorerChanges(listener: ScorerListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyScorerChanged() {
  for (const listener of listeners) listener();
}
