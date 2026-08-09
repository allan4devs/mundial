import type { Match, Sport } from "../types";

/** Plug-in league / competition source. Enable/disable without touching store logic. */
export type ScoreSource = {
  id: string;
  name: string;
  sport: Sport;
  /** When false, source is hidden from UI and not seeded. */
  enabled: boolean;
  /** Optional initial fixtures (insert-only on empty league). */
  seed?: () => SeedMatch[];
};

export type SeedMatch = Omit<
  Match,
  | "homeScore"
  | "awayScore"
  | "homeLiveScore"
  | "awayLiveScore"
  | "liveStatus"
  | "liveMinute"
  | "liveNote"
  | "forceClosed"
> &
  Partial<
    Pick<
      Match,
      | "homeScore"
      | "awayScore"
      | "homeLiveScore"
      | "awayLiveScore"
      | "liveStatus"
      | "liveMinute"
      | "liveNote"
      | "forceClosed"
    >
  >;
