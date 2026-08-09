type LiveChatListener = (matchId: string) => void;

const listeners = new Set<LiveChatListener>();

export function subscribeLiveChatChanges(listener: LiveChatListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyLiveChatChanged(matchId: string) {
  for (const listener of listeners) {
    listener(matchId);
  }
}
