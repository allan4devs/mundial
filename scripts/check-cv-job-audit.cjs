const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const cache = new Map();
function load(file) {
  const filename = path.resolve(__dirname, "..", file);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const localRequire = (name) => name.startsWith(".") ? load(path.resolve(path.dirname(filename), name + ".ts")) : require(name);
  new Function("require", "module", "exports", output)(localRequire, module, module.exports);
  return module.exports;
}

const base = "app/(page_routes)/cv/";
const { auditJobRows, jobCompanyKey } = load(base + "java-react-jobs-audit.ts");
const { defaultApplicationState } = load(base + "applications.ts");
const { isArchivedRow, selectJobRows, jobPostingKey, toJobRows } = load(base + "java-react-jobs-helpers.ts");

function row(id, overrides = {}) {
  return {
    index: Number(id) || 0, hot: false,
    job: {
      id, applicationSlug: `job-search/${id}`, company: `Company ${id}`, title: "Senior Full Stack Engineer",
      url: `https://example.com/jobs/${id}`, rating10: 8, listingStatus: "unknown", initialStatus: "draft",
      postedOn: "2026-10-20", firstSeen: "2026-10-21", lastSeen: "2026-10-24", track: "Full Stack",
      ...overrides.job,
    },
    state: { ...defaultApplicationState(), ...overrides.state },
  };
}
const active = (rows) => rows.filter((entry) => !isArchivedRow(entry));
const audited = (fixture) => auditJobRows(fixture);
const isKept = (fixture) => active(audited([fixture])).length === 1;

assert.ok(isKept(row("50", { job: { rating10: 5, matchScore: 1 } })), "Retain exactly 50% using the comparable rating");
assert.ok(!isKept(row("49", { job: { rating10: 4.9, matchScore: 99 } })), "Legacy source score cannot rescue <50% fit");
for (const postedOn of [undefined, "", "invalid", "2026-09-30", "2025-10-20", "2026-11-01", "2026-10-25", "2026-10-99"]) {
  assert.ok(!isKept(row("date", { job: { postedOn, firstSeen: "2026-10-24", lastSeen: "2026-10-24" } })), `Reject missing, old, invalid, or future posted date: ${postedOn}`);
}
assert.ok(isKept(row("first", { job: { postedOn: "2026-10-01" } })));
assert.ok(isKept(row("today", { job: { postedOn: "2026-10-24" } })));
for (const patch of [
  { job: { seen: true } }, { job: { listingStatus: "closed" } }, { job: { url: "" } },
  { job: { initialStatus: "applied" } }, { state: { appliedOn: "2026-10-10" } },
  ...["applied", "screening", "interviewing", "assessment", "offer", "rejected", "archived"].map((status) => ({ state: { status } })),
]) {
  const result = audited([row("old", patch)])[0];
  assert.ok(isArchivedRow(result), `Archive used/closed job ${JSON.stringify(patch)}`);
  assert.ok(result.archiveReason, "Removed records explain their archive reason");
}

for (const [first, second] of [
  ["FullStack", "FullStack Labs"], ["Bluelight", "Bluelight Consulting"],
  ["Encora", "Coforge"], ["Encora", "Encora/Coforge"],
  ["Luxoft", "Luxoft Singapore"], ["Capgemini", "Capgemini Engineering"],
]) assert.equal(jobCompanyKey(first), jobCompanyKey(second), `Company aliases ${first}/${second}`);
assert.notEqual(jobCompanyKey("First Factory"), jobCompanyKey("Factory One"));

// Any viewed or sent role blocks fresh roles from the same company, including aliases.
for (const patch of [{ job: { seen: true } }, { state: { status: "applied" } }, { job: { initialStatus: "rejected" } }, { state: { appliedOn: "2026-09-12" } }]) {
  const history = row("history", { ...patch, job: { company: "FullStack Labs", postedOn: "2026-08-01", ...patch.job } });
  const fresh = row("fresh", { job: { company: "FullStack", rating10: 10 } });
  const result = audited([fresh, history]);
  assert.equal(active(result).length, 0, "Company application/review history excludes fresh sibling openings");
  assert.ok(result.every(({ archiveReason }) => archiveReason));
}

const fixtures = Array.from({ length: 13 }, (_, index) => row(String(index), { job: { rating10: 10 - index / 10 } }));
const inputSnapshot = JSON.stringify(fixtures);
const ranking = audited(fixtures);
assert.equal(active(ranking).length, 10, "Only ten ranked companies stay active");
assert.equal(JSON.stringify(fixtures), inputSnapshot, "Audit does not mutate source records or application history");
assert.deepEqual(active(ranking).sort((a, b) => a.auditRank - b.auditRank).map(({ job }) => job.id), Array.from({ length: 10 }, (_, index) => String(index)));
assert.deepEqual(active(ranking).map(({ auditRank }) => auditRank).sort((a, b) => a - b), [1,2,3,4,5,6,7,8,9,10]);
assert.ok(ranking.slice(10).every(({ archiveReason }) => archiveReason));
const dismissed = auditJobRows(fixtures, ["0"]);
assert.equal(active(dismissed).length, 10);
assert.ok(!active(dismissed).some(({ job }) => job.id === "0"));
assert.ok(active(dismissed).some(({ job }) => job.id === "10"), "Skipping promotes the next company before applying the cap");
assert.equal(active(auditJobRows(fixtures, fixtures.map(({ job }) => job.id))).length, 0, "Exhausted skipped jobs never recycle");

const tied = audited([
  row("old-post", { job: { company: "Same Company", postedOn: "2026-10-01" } }),
  row("new-post", { job: { company: "Same Company", postedOn: "2026-10-23" } }),
  row("best-fit", { job: { company: "Another", rating10: 9, postedOn: "2026-10-01" } }),
]);
assert.deepEqual(active(tied).sort((a, b) => a.auditRank - b.auditRank).map(({ job }) => job.id), ["best-fit", "new-post"], "Fit leads; newer actual date wins equal-fit duplicate");
const duplicateUrl = audited([
  row("url-a", { job: { rating10: 8, url: "https://example.com/job/123" } }),
  row("url-b", { job: { rating10: 9, url: "https://example.com/job/123?utm_source=alias" } }),
]);
assert.equal(active(duplicateUrl).length, 1);
assert.equal(active(duplicateUrl)[0].job.id, "url-b");

const preserved = row("interview", { state: { status: "interviewing", notes: "Technical round Tuesday", priority: 5, appliedOn: "2026-10-02" } });
assert.deepEqual(audited([preserved])[0].state, preserved.state, "Archive retains interview status, notes, priority, and submitted date");
const filters = { query: "", statusFilter: "all", trackFilter: "all", minRating: 0, sortMode: "rating" };
assert.equal(selectJobRows({ rows: ranking, ...filters, view: "archive" }).length, 3);
assert.equal(selectJobRows({ rows: ranking, ...filters, view: "active" }).length, 10);

const { createDefaultJobs } = load(base + "java-react-jobs-data.ts");
const catalog = createDefaultJobs();
assert.equal(catalog.find((job) => job.id === "J0001").postedOn, undefined, "Worksheet discovery dates never become posting dates");
const catalogAudit = audited(toJobRows(catalog, (job) => ({ ...defaultApplicationState(), status: job.initialStatus }), new Set()));
const actualKept = active(catalogAudit);
assert.ok(actualKept.length <= 10);
assert.equal(actualKept.length, 10, "The October 24 catalog supplies all ten fresh shortlist companies");
assert.ok(actualKept.every(({ job }) => job.postedOnSource && job.rating10 >= 5), "Every committed shortlist job has publication evidence and a generated fit score");
assert.equal(new Set(actualKept.map(({ job }) => jobCompanyKey(job.company))).size, actualKept.length);
assert.equal(new Set(actualKept.map(({ job }) => jobPostingKey(job.url))).size, actualKept.length);
assert.equal(catalogAudit.length, catalog.length, "Removed jobs remain available in Archive");
assert.ok(catalogAudit.every((entry) => !isArchivedRow(entry) || Boolean(entry.archiveReason)));
if (process.argv.includes("--report") || process.argv.includes("--full-report")) {
  const reasonCounts = {};
  for (const entry of catalogAudit) {
    if (entry.archiveReason) reasonCounts[entry.archiveReason] = (reasonCounts[entry.archiveReason] ?? 0) + 1;
  }
  console.log(JSON.stringify({
    scope: "Static catalog and initial application statuses; excludes browser-local history",
    total: catalogAudit.length,
    selected: actualKept.length,
    archived: catalogAudit.length - actualKept.length,
    below50Fit: catalog.filter((job) => job.rating10 < 5).length,
    reasonCounts,
    selectedRows: actualKept.sort((a, b) => a.auditRank - b.auditRank).map(({ job, auditRank }) => ({
      rank: auditRank, id: job.id, company: job.company, title: job.title,
      fit: Math.round(job.rating10 * 10), postedOn: job.postedOn, url: job.url,
      publicationEvidence: job.postedOnSource, caveats: job.preferenceExclusion,
    })),
    ...(process.argv.includes("--full-report") ? { archivedRows: catalogAudit.filter(isArchivedRow).map(({ job, state, archiveReason }) => ({
      id: job.id, company: job.company, title: job.title, fit: Math.round(job.rating10 * 10),
      applicationStatus: state.status, reason: archiveReason, postedOn: job.postedOn ?? null, url: job.url,
    })) } : {}),
  }, null, 2));
} else {
  console.log(`Job audit checks passed: fit threshold, date provenance, future exclusion, company aliases/history, ten-company ranking, archive partition, and preserved ${catalog.length} records (${actualKept.length} active).`);
}
