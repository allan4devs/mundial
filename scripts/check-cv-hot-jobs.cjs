const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Execute the shipped TypeScript, including the provider, without generated app files.
const cache = new Map();
function load(file, mocks = {}) {
  const filename = path.resolve(__dirname, "..", file);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const localRequire = (name) => name in mocks ? mocks[name]
    : name.startsWith(".") ? load(path.resolve(path.dirname(filename), name + ".ts")) : require(name);
  new Function("require", "module", "exports", output)(localRequire, module, module.exports);
  return module.exports;
}

const base = "app/(page_routes)/cv/";
const { selectHotIds, loadHotIds, saveHotIds, loadDismissedHotIds, saveDismissedHotIds, seedHotIds } = load(base + "java-react-jobs-hot.ts");
const { defaultApplicationState, loadApps, saveApps } = load(base + "applications.ts");
const { readStoredJobs, writeStoredJobs } = load(base + "java-react-jobs-memory.ts");
const { jobPostingKey, matchesJobFilters, toJobRows } = load(base + "java-react-jobs-helpers.ts");
const { auditJobRows, jobCompanyKey } = load(base + "java-react-jobs-audit.ts");
const { HOT_LIMIT } = load(base + "java-react-jobs-constants.ts");

function row(id, rating = 9, overrides = {}) {
  return {
    index: Number(id) || 0, hot: false,
    job: {
      id, applicationSlug: `job-search/${id}`, company: `Company ${id}`, title: `Senior Engineer ${id}`,
      url: `https://example.com/jobs/${id}`, rating10: rating, listingStatus: "unknown",
      postedOn: "2026-10-20", initialStatus: "draft", firstSeen: "2026-10-21", lastSeen: "2026-10-24",
      initialPriority: 0, sourceNotes: "", nextStep: "", track: "Full Stack", stack: "React Python",
      ...overrides.job,
    },
    state: { ...defaultApplicationState(), ...overrides.state },
    ...(overrides.archiveReason ? { archiveReason: overrides.archiveReason } : {}),
  };
}
const rows = Array.from({ length: 15 }, (_, index) => row(String(index), 10 - index / 10));
assert.equal(HOT_LIMIT, 10, "The October queue has ten places");
assert.deepEqual(selectHotIds(rows, [], []), rows.slice(0, 10).map(({ job }) => job.id));
assert.equal(selectHotIds(rows, ["14"], [])[0], "14", "Eligible personal picks retain priority");
assert.ok(!selectHotIds(rows, [], ["0"]).includes("0"));
assert.deepEqual(selectHotIds(rows, [], rows.map(({ job }) => job.id)), [], "Dismissed jobs must never reappear to fill the queue");
assert.deepEqual(selectHotIds([], [], []), []);
assert.deepEqual(selectHotIds(rows.slice(0, 2), [], []), ["0", "1"]);

// Neither a preferred ID nor empty queue may revive old, reviewed, submitted, or poor-fit jobs.
for (const patch of [
  { job: { seen: true } }, { job: { listingStatus: "closed" } },
  { job: { postedOn: "2026-09-30" } },
  { job: { postedOn: undefined, firstSeen: "2026-10-24", lastSeen: "2026-10-24" } },
  { job: { postedOn: "2026-10-25" } }, { job: { rating10: 4.9 } },
  { job: { initialStatus: "applied" } }, { job: { url: "" } },
  { state: { appliedOn: "2026-10-22" } }, { archiveReason: "Outside October shortlist" },
  ...["applied", "archived", "rejected", "screening", "interviewing", "assessment", "offer"].map((status) => ({ state: { status } })),
]) {
  assert.deepEqual(selectHotIds([row("bad", 10, patch)], ["bad"], []), [], `Excluded personal pick: ${JSON.stringify(patch)}`);
}
assert.deepEqual(selectHotIds([row("threshold", 5)], [], []), ["threshold"], "Exactly 50% fit remains eligible");

const duplicatePosting = row("duplicate-url", 9.9, { job: { url: rows[0].job.url + "?source=duplicate" } });
const duplicateCompany = row("duplicate-company", 9.8, { job: { company: rows[0].job.company } });
const duplicateSelection = selectHotIds([...rows, duplicatePosting, duplicateCompany], ["duplicate-url"], []);
const duplicatesById = new Map([...rows, duplicatePosting, duplicateCompany].map((entry) => [entry.job.id, entry]));
assert.equal(new Set(duplicateSelection.map((id) => jobPostingKey(duplicatesById.get(id).job.url))).size, duplicateSelection.length);
assert.equal(new Set(duplicateSelection.map((id) => jobCompanyKey(duplicatesById.get(id).job.company))).size, duplicateSelection.length);
const reviewedDuplicate = { ...duplicatePosting, job: { ...duplicatePosting.job, seen: true } };
assert.ok(!selectHotIds([...rows, reviewedDuplicate], ["0"], []).includes("0"), "Reviewed posting aliases stay excluded");

const storage = new Map();
global.window = { localStorage: {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
} };
saveHotIds(["14", "14"]);
saveDismissedHotIds(["0", "0"]);
assert.deepEqual(loadHotIds(), ["14"]);
assert.deepEqual(loadDismissedHotIds(), ["0"]);
const restoredIds = selectHotIds(rows, loadHotIds(), loadDismissedHotIds());
assert.equal(restoredIds[0], "14");
assert.ok(!restoredIds.includes("0"));
saveHotIds(rows.map(({ job }) => job.id));
assert.equal(loadHotIds().length, 10);
saveHotIds(null);
saveDismissedHotIds([]);
assert.equal(loadHotIds(), null);
assert.deepEqual(loadDismissedHotIds(), []);

// Browser history participates after reload; catalog refreshes retain seen and submitted evidence.
const persistedSeen = row("persisted-seen", 9, { job: { company: "Bluelight Consulting", seen: true } });
const persistedFresh = row("persisted-fresh", 10, { job: { company: "Bluelight" } });
writeStoredJobs([persistedSeen.job, persistedFresh.job]);
const restoredJobs = readStoredJobs([
  { ...persistedSeen.job, seen: undefined, postedOn: "2026-10-23" }, persistedFresh.job,
]);
assert.equal(restoredJobs[0].seen, true);
assert.equal(restoredJobs[0].postedOn, "2026-10-23", "Local edits cannot overwrite fresh source metadata");
assert.equal(auditJobRows(toJobRows(restoredJobs, defaultApplicationState, new Set())).filter((entry) => !entry.archiveReason).length, 0);
saveApps({
  [rows[0].job.applicationSlug]: { ...defaultApplicationState(), status: "applied", notes: "CV sent earlier" },
  [rows[1].job.applicationSlug]: { ...defaultApplicationState(), stage: "", notes: "", priority: 0 },
});
const restoredApps = loadApps();
assert.equal(restoredApps[rows[0].job.applicationSlug].status, "applied");
assert.deepEqual(selectHotIds(toJobRows([rows[0].job], (job) => restoredApps[job.applicationSlug], new Set()), [], []), []);
const restoredBlankApp = restoredApps[rows[1].job.applicationSlug];
assert.equal(restoredBlankApp.stage, "", "Loading saved state preserves explicitly cleared stage");
assert.equal(restoredBlankApp.notes, "", "Loading saved state preserves explicitly cleared notes");
assert.equal(restoredBlankApp.priority, 0, "Loading saved state preserves zero priority");

// A deterministic provider fixture ensures live research cannot hide state/filter regressions.
const hookState = [];
let cursor = 0;
const applications = {};
const fixtureJobs = rows.map(({ job }) => ({
  ...job, nextStep: `Source stage ${job.id}`, sourceNotes: `Source notes ${job.id}`, initialPriority: 4,
}));
// The provider merges raw patches; loadApps-resolved explicit blanks must still win over source data.
applications[fixtureJobs[14].applicationSlug] = { status: "draft", notes: "User saved note" };
applications[fixtureJobs[13].applicationSlug] = restoredBlankApp;
const { JobBoardProvider } = load(base + "components/JavaReactJobsContext.tsx", {
  react: {
    createContext: () => ({ Provider: () => null }), useMemo: (factory) => factory(),
    useCallback: (callback) => callback, useEffect: () => {},
    useState: (initial) => {
      const slot = cursor++;
      if (!(slot in hookState)) hookState[slot] = typeof initial === "function" ? initial() : initial;
      return [hookState[slot], (next) => { hookState[slot] = typeof next === "function" ? next(hookState[slot]) : next; }];
    },
  },
  "../java-react-jobs-data": { createDefaultJobs: () => fixtureJobs.map((job) => ({ ...job })) },
  "../useApplications": {
    useApplications: () => ({
      ready: true, raw: applications,
      get: (slug) => ({ ...defaultApplicationState(), ...applications[slug] }),
      update: (slug, patch) => { applications[slug] = { ...defaultApplicationState(), ...applications[slug], ...patch }; },
    }),
  },
});
function renderProvider(view = "active") {
  cursor = 0;
  return JobBoardProvider({ children: null, view }).props.value;
}
let board = renderProvider();
assert.equal(board.hotRows.length, 10);
const sparseSavedRow = renderProvider("archive").rows.find(({ job }) => job.id === "14");
assert.equal(sparseSavedRow.state.notes, "User saved note", "Saved fields override source defaults");
assert.equal(sparseSavedRow.state.stage, "Source stage 14", "Sparse saved application preserves source stage");
assert.equal(sparseSavedRow.state.priority, 4, "Sparse saved application preserves source priority");
const blankSavedRow = renderProvider("archive").rows.find(({ job }) => job.id === "13");
assert.equal(blankSavedRow.state.stage, "", "Explicit saved empty stage is retained");
assert.equal(blankSavedRow.state.notes, "", "Explicit saved empty notes are retained");
assert.equal(blankSavedRow.state.priority, 0, "Explicit saved zero priority is retained");
board = renderProvider();
const skippedId = board.hotIds[0];
assert.equal(board.toggleHot(skippedId), true);
board = renderProvider();
assert.equal(board.hotRows.length, 10, "Skipping promotes the next eligible company");
assert.ok(!board.hotIds.includes(skippedId));
const seenJob = board.hotRows[0].job;
board.updateJob(seenJob.id, { seen: true });
board = renderProvider();
assert.ok(!board.hotIds.includes(seenJob.id));
const submittedJob = board.hotRows[0].job;
board.updateApplication(submittedJob.applicationSlug, { status: "applied", notes: "CV already sent" });
board = renderProvider();
assert.ok(!board.hotIds.includes(submittedJob.id));
assert.equal(applications[submittedJob.applicationSlug].status, "applied", "Audit preserves the application status");
assert.equal(applications[submittedJob.applicationSlug].notes, "CV already sent");
const partialUpdateJob = board.hotRows[0].job;
board.updateApplication(partialUpdateJob.applicationSlug, { status: "screening" });
assert.equal(applications[partialUpdateJob.applicationSlug].stage, `Source stage ${partialUpdateJob.id}`, "First partial status change retains seeded stage");
assert.equal(applications[partialUpdateJob.applicationSlug].notes, `Source notes ${partialUpdateJob.id}`, "First partial status change retains seeded notes");
assert.equal(applications[partialUpdateJob.applicationSlug].priority, 4, "First partial status change retains seeded priority");
const archive = renderProvider("archive");
assert.equal(archive.hotRows.length, 0);
assert.ok(archive.rows.some(({ job }) => job.id === seenJob.id));
assert.ok(archive.rows.some(({ job }) => job.id === submittedJob.id));

board = renderProvider();
const beforeFilters = [...board.hotIds];
board.setQuery("no job can match this query 189273");
board.setTrackFilter("missing track");
board.setStatusFilter("rejected");
board.setMinRating(11);
board.setSortMode("board");
board = renderProvider();
assert.equal(board.rows.length, 0);
assert.deepEqual(board.hotRows.map(({ job }) => job.id), beforeFilters, "Ordinary filters never change the HOT queue");

// Actual catalog verification does not assume research can find ten October openings.
const { createDefaultJobs } = load(base + "java-react-jobs-data.ts");
const catalog = auditJobRows(toJobRows(createDefaultJobs(), (job) => ({ ...defaultApplicationState(), status: job.initialStatus }), new Set()));
const catalogIds = selectHotIds(catalog, seedHotIds(), []);
assert.ok(catalogIds.length <= 10);
const selectedCatalog = catalog.filter(({ job }) => catalogIds.includes(job.id));
assert.equal(new Set(selectedCatalog.map(({ job }) => jobCompanyKey(job.company))).size, selectedCatalog.length);
for (const selectedRow of selectedCatalog) {
  assert.ok(matchesJobFilters(selectedRow, { query: "", statusFilter: "all", trackFilter: "all", minRating: 0, view: "active" }));
  assert.match(selectedRow.job.postedOn, /^2026-10-/);
  assert.equal(selectedRow.state.status, "draft");
  assert.ok(selectedRow.job.rating10 >= 5);
}
console.log(`HOT checks passed: ten-place cap, October-only new prospects, no skip recycling, company/URL dedupe, persistence, provider actions, filter independence, and ${catalogIds.length} catalog candidates.`);
