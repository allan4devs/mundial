export { getScoresDb, SCORES_DB_NAME, SCORES_COLLECTIONS } from "./scores/db";
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
} from "./scores/types";
export { computePoints, buildLeaderboard } from "./scores/scoring/index";
export { serializePublicLeaderboard } from "./scores/public-serialization";
export {
  SCORES_ACHIEVEMENTS,
  recordScoresAnalyticsEvent,
  createInviteCode,
  inviteCodeHash,
  normalizeNotificationEmail,
  normalizeTimezone,
  type ScoresAnalyticsEvent,
} from "./scores/growth";
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
} from "./scores/store";
export { listSources, getSource, isSourceEnabled } from "./scores/sources/index";
export type { ScoreSource, SeedMatch } from "./scores/sources/index";
export { requireAdmin, isAdminResult } from "./scores/auth";
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
} from "./scores/identity";
export { writeAdminAudit } from "./scores/audit";
export { parseScore, maxScoreForSport, cleanText, parseIsoDate } from "./scores/validators";
export { syncCompetition, markStaleCompetitions, rescoreMatch } from "./scores/sync";
export { listProviders, getProvider } from "./scores/providers/index";
export { rateLimit } from "./scores/rate-limit";
export { savePredictionForViewer, PredictionsError } from "./scores/predictions-service";
