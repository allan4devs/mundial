"""List every job lead from the /cv page in the mundial project.

The CV page doesn't keep jobs in MongoDB. They live in TypeScript data files:
  - data/job-search-records.ts   (imported from the Master Jobs worksheet)
  - data/job-search-new.ts       (new direct-company leads)
  - java-react-jobs-researched.ts (LinkedIn Java + React search results)
The script uses Node (v22.18+ runs .ts files directly) to load them, then prints them.

Usage:  python scripts/get_jobs.py [--json] [--csv jobs.csv]
"""
import csv, json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CV = ROOT / "app" / "(page_routes)" / "cv"
SOURCES = [
    ("worksheet", CV / "data" / "job-search-records.ts", "JOB_SEARCH_RECORDS"),
    ("new", CV / "data" / "job-search-new.ts", "NEW_JOB_SEARCH_RECORDS"),
    ("linkedin", CV / "java-react-jobs-researched.ts", "RESEARCHED_JOBS"),
]

NODE = """
const [file, name] = process.argv.slice(1);
const mod = await import(require('url').pathToFileURL(file).href);
process.stdout.write(JSON.stringify(mod[name] ?? []));
""".replace("require('url')", "(await import('node:url'))")

def load(file, name):
    out = subprocess.run(["node", "--no-warnings", "--input-type=module", "-e", NODE, str(file), name],
                         capture_output=True, text=True, encoding="utf-8", check=True)
    return json.loads(out.stdout)

def main():
    jobs = []
    for source, file, name in SOURCES:
        for j in load(file, name):
            j["source"] = source
            jobs.append(j)
    if "--json" in sys.argv:
        print(json.dumps(jobs, indent=2, ensure_ascii=False)); return
    if "--csv" in sys.argv:
        path = sys.argv[sys.argv.index("--csv") + 1]
        keys = sorted({k for j in jobs for k in j})
        with open(path, "w", newline="", encoding="utf-8-sig") as fh:
            w = csv.DictWriter(fh, fieldnames=keys); w.writeheader(); w.writerows(jobs)
        print(f"Wrote {len(jobs)} jobs to {path}"); return
    counts = {s: sum(j["source"] == s for j in jobs) for s, _, _ in SOURCES}
    print(f"{len(jobs)} jobs found {counts}\n")
    for j in jobs:
        score = j.get("matchScore", j.get("match", ""))
        print(f"[{j['source']}] {j.get('company')} | {j.get('title')} | {score} | {j.get('url')}")

if __name__ == "__main__":
    main()
