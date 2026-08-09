export const WS_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_WS_URL ?? `ws://${window.location.hostname}:3001`)
  : 'ws://localhost:3001';

export const PLAYER_COLORS = ['#00e676', '#ff6b35', '#4fc3f7', '#ffd700', '#e040fb', '#ff4081', '#64dd17', '#ff6d00'];
