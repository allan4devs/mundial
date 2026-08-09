/** Collection names on the shared (MONGODB_DB) database. */
export const COLLECTIONS = {
  DJ_TRACKS: "dj_tracks",
  MUNDIAL_ANALYTICS: "mundial_analytics",
  MUNDIAL_PREMIUM: "mundial_premium",
  MUNDIAL_PREMIUM_PREDICTIONS: "mundial_premium_predictions",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
