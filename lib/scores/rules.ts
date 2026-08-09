export type MatchClosureInput = {
  forceClosed?: boolean;
  status?: string;
  liveStatus?: string;
  predictionClosesAt?: Date | string | null;
  startsAt?: Date | string | null;
  kickoffAt?: Date | string | null;
};

/** Security boundary: malformed dates fail closed. */
export function isMatchClosed(match: MatchClosureInput, now = new Date()) {
  if (match.forceClosed) return true;
  const status = match.status || match.liveStatus;
  if (status === "finished" || status === "cancelled") return true;
  if (status === "postponed") return false;

  const rawCloseAt =
    match.predictionClosesAt ??
    match.startsAt ??
    match.kickoffAt;
  const closeAt = new Date(rawCloseAt ?? "").getTime();
  if (Number.isNaN(closeAt)) return true;
  return closeAt <= now.getTime();
}
