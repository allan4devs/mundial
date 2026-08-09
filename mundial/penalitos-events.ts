type PenalitosListener = () => void;

const listeners = new Set<PenalitosListener>();

export function subscribePenalitosChanges(listener: PenalitosListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyPenalitosChanged() {
  for (const listener of listeners) {
    listener();
  }
}
