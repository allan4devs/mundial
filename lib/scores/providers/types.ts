import type { MatchStatus, Sport } from "../types";

/** Canonical fixture after adapter normalization */
export type ProviderFixture = {
  provider: string;
  providerMatchId: string;
  competitionId: string;
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
  startsAt: Date;
  venue?: string;
  status: MatchStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  homeLiveScore?: number | null;
  awayLiveScore?: number | null;
  period?: string | null;
  clock?: string | null;
  liveMinute?: number | null;
  liveNote?: string;
};

export type ScoreProvider = {
  id: string;
  name: string;
  /** Fetch fixtures for a competition id known to this provider */
  fetchFixtures: (competitionId: string) => Promise<ProviderFixture[]>;
};
