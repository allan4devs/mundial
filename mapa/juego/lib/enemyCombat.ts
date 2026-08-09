// Shared, player-friendly stomp / side-hit detection for every monster.
//
// A "stomp" (the ghost lands on top of the bug and defeats it) is favoured
// whenever the player is clearly ABOVE the enemy and descending — regardless
// of a razor-thin vertical band — so jumping on a killer bug reliably kills it.

export const STOMP_X = 0.64;      // horizontal overlap for a stomp
export const STOMP_MIN_Y = 0.28;  // player must be at least this far above enemy centre
export const STOMP_MAX_Y = 1.05;  // ...but still in contact range (not floating above)
export const DESCEND_MAX_VY = 1.8; // count as "coming down" (small +vy tolerated)

export const SIDE_X = 0.54;       // tighter than stomp so being on top never damages
export const SIDE_Y = 0.44;

/** True when the player is landing on top of the enemy (should defeat it). */
export const isStomp = (dx: number, dy: number, playerVelY: number): boolean => (
  Math.abs(dx) < STOMP_X && dy > STOMP_MIN_Y && dy < STOMP_MAX_Y && playerVelY <= DESCEND_MAX_VY
);

/** True when the player touches the enemy from the side / below (takes a hit). */
export const isSideHit = (dx: number, dy: number): boolean => (
  Math.abs(dx) < SIDE_X && Math.abs(dy) < SIDE_Y
);
