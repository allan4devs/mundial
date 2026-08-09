import assert from "node:assert/strict";
import { resolveRuntimeSecret } from "../lib/security/runtime-secret.ts";

assert.equal(
  resolveRuntimeSecret("EXAMPLE_SECRET", "configured", "development", true),
  "configured",
  "configured production secret is accepted"
);
assert.throws(
  () => resolveRuntimeSecret("EXAMPLE_SECRET", undefined, "known-fallback", true),
  /EXAMPLE_SECRET is required in production/,
  "production fails closed instead of using a known fallback"
);
assert.equal(
  resolveRuntimeSecret("EXAMPLE_SECRET", undefined, "development", false),
  "development",
  "local development retains an explicit fallback"
);

console.log("scores secret tests: OK");
