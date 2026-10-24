const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Execute the actual TypeScript modules without generating files in the app.
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
const { defaultApplicationState } = load(base + "applications.ts");
const { jobPostingKey, matchesJobFilters, toJobRows } = load(base + "java-react-jobs-helpers.ts");

function row(id, rating, overrides = {}) {
  return {
    index: Number(id), hot: false,
    job: { id, url: `https://example.com/jobs/${id}`, rating10: rating, listingStatus: "unknown", ...overrides.job },
    state: { ...defaultApplicationState(), ...overrides.state },
  };
}
const rows = Array.from({ length: 8 }, (_, index) => row(String(index), 10 - index));
assert.deepEqual(selectHotIds(rows, [], []), ["0", "1", "2", "3", "4"]);
assert.deepEqual(selectHotIds(rows, ["7"], []), ["7", "0", "1", "2", "3"]);
assert.deepEqual(selectHotIds(rows, [], ["0"]), ["1", "2", "3", "4", "5"]);
for (const patch of [
  { job: { seen: true } },
  { state: { status: "archived" } },
  { job: { listingStatus: "closed" } },
  { state: { status: "rejected" } },
]) {
  const reviewed = [row("0", 10, patch), ...rows.slice(1)];
  assert.deepEqual(selectHotIds(reviewed, ["0"], []), ["1", "2", "3", "4", "5"]);
}
assert.deepEqual(selectHotIds(rows.slice(0, 2), [], []), ["0", "1"]);
assert.deepEqual(selectHotIds([], [], []), []);
assert.deepEqual(selectHotIds(rows, [], rows.map(({ job }) => job.id)), ["0", "1", "2", "3", "4"]);
assert.deepEqual(selectHotIds(rows, [], ["0", "1", "2", "3", "4", "5", "6"]), ["7", "0", "1", "2", "3"]);
assert.deepEqual(selectHotIds(rows, [], ["6", "5", "4", "3", "2", "1", "0"]), ["7", "6", "5", "4", "3"]);
const hardExcluded = rows.slice(0, 4).map((entry) => ({ ...entry, job: { ...entry.job, seen: true } }));
assert.deepEqual(selectHotIds([...hardExcluded, ...rows.slice(4)], [], rows.map(({ job }) => job.id)), ["4", "5", "6", "7"]);
for (let mask = 0; mask < 256; mask++) {
  const skippedIds = rows.filter((_, index) => mask & (1 << index)).map(({ job }) => job.id);
  const selected = selectHotIds(rows, ["7", "7", "missing"], skippedIds);
  assert.equal(selected.length, 5, `Keep five for skip combination ${mask}`);
  assert.equal(new Set(selected).size, 5);
  const withExclusions = selectHotIds([...hardExcluded, ...rows.slice(4)], [], skippedIds);
  assert.equal(withExclusions.length, 4, "Only hard exclusions may reduce an exhausted queue");
}

// Do not recommend already-started applications ahead of equally good new prospects.
assert.deepEqual(selectHotIds([
  row("0", 10, { state: { status: "interviewing" } }),
  row("1", 10, { state: { status: "applied" } }),
  row("2", 8),
], [], []), ["2", "0", "1"]);
assert.deepEqual(selectHotIds([
  row("0", 9),
  row("1", 9, { job: { listingStatus: "open" } }),
  row("2", 9, { state: { priority: 5 } }),
], [], []), ["1", "2", "0"]);
assert.deepEqual(selectHotIds([
  row("0", 9, { job: { lastSeen: "2026-09-01" } }),
  row("1", 9, { job: { lastSeen: "invalid date" } }),
  row("2", 9, { job: { lastSeen: "2026-10-22" } }),
], [], []), ["2", "0", "1"]);

const duplicate = row("8", 10, { job: { url: rows[0].job.url + "?source=duplicate" } });
assert.deepEqual(selectHotIds([...rows, duplicate], ["8", "0", "missing"], []), ["8", "1", "2", "3", "4"]);
assert.deepEqual(selectHotIds([...rows, duplicate], ["8"], ["0"]), ["1", "2", "3", "4", "5"]);
const reviewedDuplicate = { ...duplicate, job: { ...duplicate.job, seen: true } };
assert.deepEqual(selectHotIds([...rows, reviewedDuplicate], ["0"], []), ["1", "2", "3", "4", "5"]);

const storage = new Map();
global.window = { localStorage: {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
} };
saveHotIds(["7"]); // Unverified personal picks must survive reloads.
saveDismissedHotIds(["0", "0"]);
assert.deepEqual(loadHotIds(), ["7"]);
assert.deepEqual(loadDismissedHotIds(), ["0"]);
assert.deepEqual(selectHotIds(rows, loadHotIds(), loadDismissedHotIds()), ["7", "1", "2", "3", "4"]);
saveHotIds(null);
saveDismissedHotIds([]);
assert.equal(loadHotIds(), null);
assert.deepEqual(loadDismissedHotIds(), []);

// Check provider actions with a minimal hook harness; storage helpers are exercised above.
const hookState = [];
let cursor = 0;
const applications = {};
const { JobBoardProvider } = load(base + "components/JavaReactJobsContext.tsx", {
  react: {
    createContext: () => ({ Provider: () => null }),
    useMemo: (factory) => factory(),
    useCallback: (callback) => callback,
    useEffect: () => {},
    useState: (initial) => {
      const slot = cursor++;
      if (!(slot in hookState)) hookState[slot] = typeof initial === "function" ? initial() : initial;
      return [hookState[slot], (next) => { hookState[slot] = typeof next === "function" ? next(hookState[slot]) : next; }];
    },
  },
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
assert.equal(board.hotIds.length, 5);
const removedId = board.hotIds[0];
assert.equal(board.toggleHot(removedId), true);
board = renderProvider();
assert.equal(board.hotIds.length, 5);
assert.ok(!board.hotIds.includes(removedId));
const personalPick = board.rows.find(({ job, state }) => job.listingStatus === "unknown" && state.status === "draft" && job.url);
assert.ok(personalPick);
assert.equal(board.toggleHot(personalPick.job.id), true);
board = renderProvider();
assert.ok(board.hotIds.includes(personalPick.job.id));
board.updateJob(personalPick.job.id, { seen: true });
board = renderProvider();
assert.equal(board.hotIds.length, 5);
assert.ok(!board.hotIds.includes(personalPick.job.id));
const toArchive = board.hotRows[0];
board.updateApplication(toArchive.job.applicationSlug, { status: "archived" });
board = renderProvider();
assert.equal(board.hotIds.length, 5);
assert.ok(!board.hotIds.includes(toArchive.job.id));
assert.deepEqual(board.hotRows.map(({ job }) => job.id), board.hotIds, "Keep manual priority order in the rendered queue");

// Filters must never shrink or reshuffle the five visible HOT cards.
const queueBeforeFilters = [...board.hotIds];
board.setQuery("no job can match this query 189273");
board.setTrackFilter("missing track");
board.setStatusFilter("rejected");
board.setMinRating(11);
board.setSortMode("board");
board = renderProvider();
assert.equal(board.rows.length, 0);
assert.deepEqual(board.hotRows.map(({ job }) => job.id), queueBeforeFilters);
assert.equal(renderProvider("archive").hotRows.length, 0);

// Exercise replacement through the actual bundled catalog until it is exhausted.
const { createDefaultJobs } = load(base + "java-react-jobs-data.ts");
const catalog = toJobRows(createDefaultJobs(), (job) => ({ ...defaultApplicationState(), status: job.initialStatus }), new Set());
const reviewedKeys = new Set();
let reviewed = 0;
while (true) {
  const ids = selectHotIds(catalog, seedHotIds(), []);
  if (!ids.length) break;
  const selected = ids.map((id) => catalog.find(({ job }) => job.id === id));
  const keys = selected.map(({ job }) => jobPostingKey(job.url));
  assert.equal(new Set(keys).size, ids.length);
  for (const selectedRow of selected) {
    assert.ok(!reviewedKeys.has(jobPostingKey(selectedRow.job.url)));
    assert.notEqual(selectedRow.job.listingStatus, "closed");
    assert.ok(matchesJobFilters(selectedRow, { query: "", statusFilter: "all", trackFilter: "all", minRating: 0, view: "active" }));
  }
  const next = selected[0];
  reviewedKeys.add(jobPostingKey(next.job.url));
  if (reviewed % 2) next.state.status = "archived";
  else next.job.seen = true;
  reviewed++;
  assert.ok(reviewed <= catalog.length, "Reviewed jobs must never cycle back into HOT");
}
assert.ok(reviewed > 5, "The catalog must supply replacements beyond the initial HOT queue");
console.log(`HOT checks passed: five cards despite filters, ranking, manual priority, skip fallback, persistence, deduplication, and ${reviewed} unique catalog postings reviewed without repeats.`);
