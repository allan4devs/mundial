// Mirrored from race.ts serializer
export type RacePlayerView = {
  id: string;
  name: string;
  ready: boolean;
  pct: number;
  x: number | null;
  y: number | null;
  finished: boolean;
  rank: number | null;
  finishedAt: number | null;
};

export type RaceRoomView = {
  code: string;
  hostId: string;
  status: 'lobby' | 'racing' | 'finished';
  levelIndex: number;
  players: RacePlayerView[];
  startedAt: string | null;
  updatedAt: string;
  version: number;
};
