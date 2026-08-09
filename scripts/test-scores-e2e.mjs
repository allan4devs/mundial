import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";
import jwt from "jsonwebtoken";

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
    break;
  } catch {
    // Try the next conventional env file.
  }
}

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI is required for Scores E2E");

const dbName = `go_e2e_${Date.now()}`;
const port = 3197;
const origin = `http://127.0.0.1:${port}`;
const adminSecret = "scores-e2e-admin-secret";
const pinPepper = "scores-e2e-pin-pepper";
const nextBin = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const serverOutput = [];

const server = spawn(process.execPath, [nextBin, "dev", "-p", String(port)], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    SCORES_DB_NAME: dbName,
    SCORES_PIN_PEPPER: pinPepper,
    ADMIN_JWT_SECRET: adminSecret,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (chunk) => serverOutput.push(String(chunk)));
server.stderr.on("data", (chunk) => serverOutput.push(String(chunk)));

function cookieFrom(response) {
  const value = response.headers.get("set-cookie");
  if (!value) throw new Error("Expected Set-Cookie header");
  return value.split(";", 1)[0];
}

async function request(path, options = {}) {
  const response = await fetch(`${origin}${path}`, options);
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function waitForServer() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode != null) {
      throw new Error(`Next server exited early:\n${serverOutput.join("").slice(-4000)}`);
    }
    try {
      const { response } = await request("/api/scores/health");
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await delay(500);
  }
  throw new Error(`Timed out waiting for Next server:\n${serverOutput.join("").slice(-4000)}`);
}

async function createViewer(displayName, pin) {
  const result = await request("/api/scores/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "set", displayName, pin }),
  });
  assert.equal(result.response.status, 200, JSON.stringify(result.body));
  return cookieFrom(result.response);
}

async function putPick(matchId, cookie, homeScore, awayScore, expectedUpdatedAt) {
  return request(`/api/scores/predictions/${encodeURIComponent(matchId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({ homeScore, awayScore, expectedUpdatedAt }),
  });
}

const adminToken = jwt.sign({ id: "scores-e2e", username: "scores-e2e" }, adminSecret, {
  expiresIn: "10m",
});
const adminCookie = `b2b_admin_token=${adminToken}`;

let cleanupClient;
try {
  await waitForServer();

  const unauthorizedAdmin = await request("/api/scores/admin");
  assert.equal(unauthorizedAdmin.response.status, 401, "admin requires a cookie");

  const suffix = Date.now().toString(36);
  const cookieA = await createViewer(`Ana-${suffix}`, "483927");
  const cookieB = await createViewer(`Beto-${suffix}`, "739284");

  const bootstrapA = await request("/api/scores/bootstrap", {
    headers: { Cookie: cookieA },
  });
  assert.equal(bootstrapA.response.status, 200);
  const match = bootstrapA.body.matches.find(
    (item) => item.competitionId === "fcl" && item.status === "scheduled"
  );
  assert.ok(match, "FCL demo match exists");

  const firstA = await putPick(match.id, cookieA, 2, 0, null);
  assert.equal(firstA.response.status, 200, JSON.stringify(firstA.body));
  const firstB = await putPick(match.id, cookieB, 1, 0, null);
  assert.equal(firstB.response.status, 200, JSON.stringify(firstB.body));

  const privateA = await request("/api/scores/bootstrap", {
    headers: { Cookie: cookieA },
  });
  assert.equal(privateA.body.myPredictions.length, 1);
  assert.equal(privateA.body.publicPredictions.length, 0, "open picks stay private");

  const anonymousOpen = await request("/api/scores/bootstrap");
  assert.equal(anonymousOpen.body.myPredictions.length, 0);
  assert.equal(anonymousOpen.body.publicPredictions.length, 0);

  const expected = firstA.body.updatedAt;
  const concurrent = await Promise.all([
    putPick(match.id, cookieA, 3, 0, expected),
    putPick(match.id, cookieA, 4, 0, expected),
  ]);
  assert.deepEqual(
    concurrent.map((item) => item.response.status).sort(),
    [200, 409],
    "optimistic writes allow one winner"
  );

  const finished = await request("/api/scores/admin/match", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      matchId: match.id,
      status: "finished",
      homeScore: 2,
      awayScore: 1,
    }),
  });
  assert.equal(finished.response.status, 200, JSON.stringify(finished.body));

  const anonymousClosed = await request("/api/scores/bootstrap");
  assert.equal(anonymousClosed.body.publicPredictions.length, 2);
  assert.equal(
    JSON.stringify(anonymousClosed).includes('"userId"'),
    false,
    "anonymous payload contains no internal userId"
  );
  assert.ok(anonymousClosed.body.leaderboard.length > 0, "finished match produces ranking");

  const cancelled = await request("/api/scores/admin/match", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({ matchId: match.id, status: "cancelled" }),
  });
  assert.equal(cancelled.response.status, 200, JSON.stringify(cancelled.body));

  const afterCancel = await request("/api/scores/bootstrap");
  assert.equal(afterCancel.body.leaderboard.length, 0, "cancelled match awards no points");

  const latePick = await putPick(match.id, cookieA, 5, 0, null);
  assert.equal(latePick.response.status, 400, "closed/cancelled match rejects picks");

  console.log("scores E2E: OK");
} finally {
  server.kill();
  server.stdout.destroy();
  server.stderr.destroy();
  server.unref();
  if (/^go_e2e_\d+$/.test(dbName)) {
    cleanupClient = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 10_000 });
    try {
      await cleanupClient.connect();
      // Atlas users often cannot dropDatabase; drop collections instead.
      const db = cleanupClient.db(dbName);
      const collections = await db.listCollections().toArray();
      await Promise.all(
        collections.map((collection) =>
          db.collection(collection.name).drop().catch(() => undefined)
        )
      );
    } finally {
      await cleanupClient.close();
    }
  }
}
