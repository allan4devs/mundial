# CV job audit ? October 24, 2026

Audited 500 catalog jobs: **10 active HOT jobs**, one per company; **490 in Archive**. 129 jobs have deterministic fit below 50% and are all excluded from the shortlist.

This snapshot uses committed application statuses. The board also applies saved browser-local Seen, application status, submitted date, and HOT dismissal history after loading; that can reduce the ten visible jobs. Pipeline statuses, notes, and dates are preserved. No production deployment or browser acceptance test is included.

Rules: actual publication from October 1?24, 2026; at least 50% deterministic fit; unseen/unapplied; no prior company contact; one company and posting URL; keep the ten best by fit, publication date, current availability evidence, and priority. All other records remain searchable in Archive with a reason. Publication dates use employer/ATS evidence, never first/last seen. Fit is a rules-based catalog score, not a hiring probability.

## Ranked October shortlist

| Rank | Company and posting | Fit | Published |
|---:|---|---:|---|
| 1 | [CodeRoad ? Fullstack Developer (Python/ React)](https://job-boards.greenhouse.io/coderoad/jobs/4458046009) | 90% | 2026-10-19 |
| 2 | [Truelogic ? Senior Full-Stack Engineer (Modern Backend + React) - Global Insights & Strategy](https://jobs.truelogic.io/jobs/9af508a7-c9ab-4634-954e-4ffa8126f7a8) | 90% | 2026-10-13 |
| 3 | [Encora/Coforge ? Senior Full Stack AI Engineer (Solution Architecture)](https://job-boards.greenhouse.io/encora10/jobs/5263262007) | 85% | 2026-10-12 |
| 4 | [Improving ? Senior Full-Stack Engineer](https://www.getonbrd.com/jobs/programming/senior-full-stack-engineer-improving-remote) | 80% | 2026-10-07 |
| 5 | [Total Performance Consulting ? Full Stack Web Developer](https://job-boards.greenhouse.io/perform-careers/jobs/4435248009) | 80% | 2026-10-06 |
| 6 | [Nortal ? (EG0072) Senior AI Engineer (Full Stack)](https://job-boards.greenhouse.io/nortal/jobs/5271111007) | 70% | 2026-10-21 |
| 7 | [BNamericas ? Senior Full-Stack Engineer AI Native](https://www.getonbrd.com/jobs/programacion/senior-full-stack-engineer-ai-native-bnamericas-remote) | 70% | 2026-10-06 |
| 8 | [Vetclaims.ai ? Senior Software Engineer](https://www.getonbrd.com/jobs/programacion/senior-software-engineer-vetclaims-ai-remote) | 65% | 2026-10-24 |
| 9 | [Backblaze ? Software Engineer, Open Source AI](https://job-boards.greenhouse.io/backblaze/jobs/5442462008) | 60% | 2026-10-12 |
| 10 | [Zaelot ? Back-end Software Engineer](https://www.getonbrd.com/jobs/programming/backend-software-engineer-zaelot-remote-fbc2) | 55% | 2026-10-07 |

Publication evidence and role caveats are retained in the source records and [complete audit snapshot](cv-job-audit-2026-10-24.json). Total Performance Consulting lists LATAM but does not explicitly state remote work; confirm its arrangement before applying. CodeRoad requests 2?4 years, so its level is Mid. Availability badges remain advisory and can be checked through the existing row action.

## Archive reasons

Reasons below are mutually exclusive first reasons; for example, a low-fit previously applied job is counted under application history.

| Reason | Jobs |
|---|---:|
| Application history: applied | 46 |
| Application history: rejected | 8 |
| Application history: screening | 6 |
| Missing company or posting link | 2 |
| Company or posting already viewed / contacted | 28 |
| Publication date unverified | 294 |
| Below 50% deterministic fit | 94 |
| Application history: assessment | 1 |
| Listing closed | 2 |
| Outside October 1–24, 2026 | 9 |

The JSON lists all 490 archived records with their fit, original application status, posting URL, and archive reason. Company aliases include FullStack Labs/FullStack, Encora/Coforge, Bluelight Consulting/Bluelight, Luxoft Singapore/Luxoft, TIMS/We Are TIMS, and Perform/Total Performance Consulting. Previously skipped jobs never refill HOT unless preferences are explicitly reset.

## Validation

- `node scripts/check-cv-job-audit.cjs`: date provenance, 50% boundary, company history/aliases, ranking, complete archive partition, preserved history and browser storage reload.
- `node scripts/check-cv-hot-jobs.cjs`: ten-job cap, eligibility, skip/refill, company/URL deduplication, storage, provider actions, and filter independence.
- `npm.cmd run typecheck`, focused ESLint, and `git diff --check`.

Rebuild ratings and the committed shortlist with `python -B scripts/rate_jobs.py --seed-hot`. Inspect current static counts with `node scripts/check-cv-job-audit.cjs --report`; add `--full-report` for every archived record.
