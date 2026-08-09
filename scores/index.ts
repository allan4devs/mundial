export { getScoresDb, SCORES_DB_NAME, SCORES_COLLECTIONS } from "./db";
export type {
  Match,
  Prediction,
  LeaderboardEntry,
  Draft,
  LiveStatus,
  MatchStatus,
  Sport,
  WinnerSide,
  Competition,
} from "./types";
export { computePoints, buildLeaderboard } from "./scoring";
export { serializePublicLeaderboard } from "./public-serialization";
export {
  SCORES_ACHIEVEMENTS,
  recordScoresAnalyticsEvent,
  createInviteCode,
  inviteCodeHash,
  normalizeNotificationEmail,
  normalizeTimezone,
  type ScoresAnalyticsEvent,
} from "./growth";
export {
  ensureScoresData,
  readMatches,
  readCompetitions,
  isMatchClosed,
  serializeMatch,
  toIso,
  type MatchDoc,
  type PredictionDoc,
  type CompetitionDoc,
} from "./store";
export { listSources, getSource, isSourceEnabled } from "./sources";
export type { ScoreSource, SeedMatch } from "./sources";
export { requireAdmin, isAdminResult } from "./auth";
export {
  readViewer,
  ensureIdentityIndexes,
  issueSession,
  normalizeDisplayName,
  normalizeNameKey,
  pinError,
  createPinHash,
  verifyPinHash,
  isLocked,
  recordFailedPin,
  clearFailed,
  clearSession,
  SCORES_SESSION_COOKIE,
  type ScoresViewer,
  type ScoresIdentityDoc,
} from "./identity";
export { writeAdminAudit } from "./audit";
export { parseScore, maxScoreForSport, cleanText, parseIsoDate } from "./validators";
export { syncCompetition, markStaleCompetitions, rescoreMatch } from "./sync";
export { listProviders, getProvider } from "./providers";
export { rateLimit } from "./rate-limit";
export { savePredictionForViewer, PredictionsError } from "./predictions-service";
