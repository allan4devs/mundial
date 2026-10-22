"""List every job lead from the /cv page in the mundial project.

The CV page doesn't keep jobs in MongoDB. They live in TypeScript data files:
  - data/job-search-records.ts   (imported from the Master Jobs worksheet)
  - data/job-search-new.ts       (new direct-company leads)
  - java-react-jobs-researched.ts (LinkedIn Java + React search results)
The script uses Node (v22.18+ runs .ts files directly) to load them, then prints them.

Each job also gets rating10 / ratingReason (data/job-ratings.ts, built by
scripts/rate_jobs.py) and hot (committed seed in data/hot-jobs.ts; the board's
browser override is not visible here).

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

RATINGS = CV / "data" / "job-ratings.ts"
HOT = CV / "data" / "hot-jobs.ts"


def load_optional(file, name, default):
    return load(file, name) if file.exists() else default


def main():
    ratings = load_optional(RATINGS, "JOB_RATINGS", {})
    hot = set(load_optional(HOT, "HOT_JOB_IDS", []))
    jobs = []
    for source, file, name in SOURCES:
        for j in load(file, name):
            j["source"] = source
            rating = ratings.get(j["id"], {})
            j["rating10"] = rating.get("rating10")
            j["ratingReason"] = rating.get("ratingReason", "")
            j["hot"] = j["id"] in hot
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
        rating = "-" if j["rating10"] is None else f"{j['rating10']:g}/10"
        flag = " HOT" if j["hot"] else ""
        print(f"[{j['source']}]{flag} {j.get('company')} | {j.get('title')} | {score} | rating {rating} | {j.get('url')}")

if __name__ == "__main__":
    main()
