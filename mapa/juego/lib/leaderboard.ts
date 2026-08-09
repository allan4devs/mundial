import type { LeaderboardEntry } from '../types';
import { LEADERBOARD_KEY } from '../constants/storage';

export function readLeaderboard(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LEADERBOARD_KEY) ?? '[]') as LeaderboardEntry[];
    return Array.isArray(parsed) ? parsed.filter((entry) => entry?.name) : [];
  } catch {
    return [];
  }
}

export function writeLeaderboard(entries: LeaderboardEntry[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries.slice(0, 20)));
}

export function upsertLeaderboard(name: string, crystalsToAdd: number, score: number) {
  const safeName = name.trim().slice(0, 24);
  if (!safeName) return readLeaderboard();

  const entries = readLeaderboard();
  const existing = entries.find((entry) => entry.name.toLowerCase() === safeName.toLowerCase());

  if (existing) {
    existing.name = safeName;
    existing.crystals += crystalsToAdd;
    existing.bestScore = Math.max(existing.bestScore, score);
    existing.lastPlayedAt = Date.now();
  } else {
    entries.push({
      name: safeName,
      crystals: Math.max(0, crystalsToAdd),
      bestScore: Math.max(0, score),
      lastPlayedAt: Date.now(),
    });
  }

  entries.sort((a, b) => b.crystals - a.crystals || b.bestScore - a.bestScore || b.lastPlayedAt - a.lastPlayedAt);
  writeLeaderboard(entries);
  return entries;
}
