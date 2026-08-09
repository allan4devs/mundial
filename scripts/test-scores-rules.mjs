/**
 * Domain rules against production modules.
 */
import assert from "node:assert/strict";
import { isMatchClosed } from "../lib/scores/rules.ts";

const now = new Date("2026-07-24T12:00:00.000Z");

assert.equal(
  isMatchClosed({ status: "scheduled", startsAt: "2026-07-24T13:00:00.000Z" }, now),
  false,
  "future open"
);
assert.equal(
  isMatchClosed({ status: "scheduled", startsAt: "2026-07-24T11:00:00.000Z" }, now),
  true,
  "past closed"
);
assert.equal(
  isMatchClosed({ status: "postponed", startsAt: "2026-07-24T11:00:00.000Z" }, now),
  false,
  "postponed stays open"
);
assert.equal(
  isMatchClosed({ status: "cancelled", startsAt: "2026-07-25T11:00:00.000Z" }, now),
  true,
  "cancelled closed"
);
assert.equal(
  isMatchClosed({ status: "scheduled", forceClosed: true, startsAt: "2026-07-25T11:00:00.000Z" }, now),
  true,
  "forceClosed"
);
assert.equal(
  isMatchClosed({ status: "scheduled", startsAt: "not-a-date" }, now),
  true,
  "invalid persisted date fails closed"
);

// Visibility: others' picks only when closed
function canSeeOthersPick(match, nowMs) {
  return isMatchClosed(match, new Date(nowMs));
}
assert.equal(canSeeOthersPick({ status: "live", startsAt: "2026-07-24T11:00:00.000Z" }, now.getTime()), true);
assert.equal(canSeeOthersPick({ status: "scheduled", startsAt: "2026-07-24T18:00:00.000Z" }, now.getTime()), false);

console.log("scores rules tests: OK");
