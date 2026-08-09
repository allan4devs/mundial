import type { ScoreProvider } from "./types";

export const manualProvider: ScoreProvider = {
  id: "manual",
  name: "Manual",
  async fetchFixtures() {
    return [];
  },
};
