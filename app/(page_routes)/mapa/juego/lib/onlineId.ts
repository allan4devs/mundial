export function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function getOrCreateId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('race_player_id');
  if (!id) { id = genId(); localStorage.setItem('race_player_id', id); }
  return id;
}

export function getSavedName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('race_player_name') ?? '';
}
