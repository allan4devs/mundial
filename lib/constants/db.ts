/** Collection names on the shared (MONGODB_DB) database. */
export const COLLECTIONS = {
  DJ_TRACKS: "dj_tracks",
  /** Song Builder v1 — one document per style pack (its tuning and its sounds). */
  SONG_BUILDER_STYLES: "dj_song_builder_styles",
  MUNDIAL_ANALYTICS: "mundial_analytics",
  MUNDIAL_PREMIUM: "mundial_premium",
  MUNDIAL_PREMIUM_PREDICTIONS: "mundial_premium_predictions",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
