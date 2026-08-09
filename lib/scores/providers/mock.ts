import type { ProviderFixture, ScoreProvider } from "./types";

/** Mock feed: deterministic demo data (no external API). */
export const mockProvider: ScoreProvider = {
  id: "mock",
  name: "Mock feed",
  async fetchFixtures(competitionId: string): Promise<ProviderFixture[]> {
    const startsAt = new Date("2030-06-01T02:00:00.000Z");
    if (competitionId === "nba") {
      return [
        {
          provider: "mock",
          providerMatchId: "nba-demo-1",
          competitionId: "nba",
          sport: "basketball",
          homeTeam: "Lakers",
          awayTeam: "Celtics",
          startsAt,
          venue: "Crypto.com Arena",
          status: "scheduled",
          homeScore: null,
          awayScore: null,
        },
        {
          provider: "mock",
          providerMatchId: "nba-demo-2",
          competitionId: "nba",
          sport: "basketball",
          homeTeam: "Warriors",
          awayTeam: "Nuggets",
          startsAt: new Date("2030-06-02T02:00:00.000Z"),
          venue: "Chase Center",
          status: "scheduled",
          homeScore: null,
          awayScore: null,
        },
      ];
    }
    return [];
  },
};
