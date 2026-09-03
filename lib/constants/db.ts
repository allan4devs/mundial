/** Collection names on the shared (MONGODB_DB) database. */
export const COLLECTIONS = {
  DJ_TRACKS: "dj_tracks",
  /** Song Builder v1 — one document per saved five-row song. */
  SONG_BUILDER_SONGS: "dj_song_builder_songs",
  MUNDIAL_ANALYTICS: "mundial_analytics",
  MUNDIAL_PREMIUM: "mundial_premium",
  MUNDIAL_PREMIUM_PREDICTIONS: "mundial_premium_predictions",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
