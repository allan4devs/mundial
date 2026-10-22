# Lead search notes (run 2026-10-22)

Profile: remote LATAM or Costa Rica; full-stack / back-end / front-end; Node, Java, React, Python; senior or mid.
Only add a lead if it is live, open to CR/LATAM, not a duplicate, and scores >= 9 with `scripts/rate_jobs.py` logic.

## Dedupe
1. Dump all tracker rows (J*, N*, LinkedIn ids) to JSON.
2. Company+role key: lowercase, strip punctuation/extra spaces, compare `norm(company)+norm(title)`. Also check by eye
   for reposts of the same role under a slightly different title.
3. URL key: drop the query string, trailing `/` and `/apply`, then compare (same logic as `url_key()` in rate_jobs.py).

## Scoring shortcut (rate_jobs.py)
Start 1. CR +3, LATAM-only +2.5. Each of Java/React/Node/Python in the TITLE +1, in stack/track only +0.5, TS +0.5 (cap 3).
Full-stack +2, back/front-end +1.5, "<stack> engineer" +1.5, plain software engineer +1. Senior +1, mid 0, junior -2.
Rule of thumb: LATAM-only roles need 2.5 stack points (2 stack words in title + TS) to reach 9; CR-eligible roles need
2 stack words in the title, or 1 in the title plus 2 in the stack. Generic titles ("Senior Full Stack Developer") top out at 8.5.

## Queries (WebSearch)
- `"Senior Full Stack" Python React remote "Costa Rica" job posted <month year>`
- `"Senior Full Stack" OR "Senior Fullstack" "Node" "React" remote LATAM Torre OR getonbrd OR himalayas <date>`
- `<company> "<title>" Java Spring React Latin America breezy OR workable OR careers`
- Aggregators that surface leads: torre.ai, himalayas.app, jobgether, remoterocketship, freehire.me, builtin, getonbrd, WithMira.

## Live-check APIs
- Greenhouse: https://boards-api.greenhouse.io/v1/boards/<board>/jobs[/<id>]
- Ashby: https://api.ashbyhq.com/posting-api/job-board/<org>
- Lever: https://api.lever.co/v0/postings/<org>?mode=json  (or /<id>)
- SmartRecruiters: https://api.smartrecruiters.com/v1/companies/<Co>/postings?country=cr  (and /<id> for details)
- BambooHR: https://<org>.bamboohr.com/careers/list  and /careers/<id>/detail
- Recruitee: https://<org>.recruitee.com/api/offers/
- Bulk scan: loop the company slugs through the GH/Ashby/Lever APIs and filter titles by stack + location regex
  (slugs tried: truelogic gorillalogic wizeline nearsure leantech azumo sophilabs bairesdev distillery bluelightconsulting
  jobsity ioet fullstacklabs dlocal globant unosquare endava 10pearls avenuecode blankfactor perficient improving nexton ...).

## Added this run
N0159 Ruzora Senior Full-Stack Python (React+Python) 9.5; N0160 Truelogic Senior Full-Stack (Modern Backend + React) 9;
N0161 iDelsoft Senior SWE Python/React 9.5.

## Rejected (skip next time unless reposted)
- Duplicates: Truelogic Real Estate (N0064), Airtm (N0142), Abstra Java/React (N0125), Deel LATAM (J0108; not CR),
  Encora Full Stack AI (N0015), Ruzora TS React+Node (N0098), Bluelight (J0024/J0025/J0057/J0199/J0201/N0038/N0075),
  CSC Generation (J0207), Darwoft (N0047), Nortal (J0041/J0038).
- Closed: Truelogic Python/React Advertising, BairesDev Python+React, Confiz Level V, Gorilla Logic Node/React AA,
  Encora React/Node 5263247007, TCIT getonbrd, Launchpad Technologies Senior Full-Stack Java (Remotive 404; and 8 anyway).
- Below 9 (8.5): Encora Senior Java Engineer (CR, GH 5265557007), Gorilla Logic Senior Fullstack Java AA,
  Confiz Level IV CR, JBS Dev Senior Full Stack (CR), Software Mind Senior Fullstack JS/TS (CR, SR 744000155321629),
  IDRE/SeedTrust. Lower: Encora Senior Backend, Trafilea, Howdy (no CR), Jalasoft, Agility IO, Able.

# Run 2 (2026-10-22, lots 1-5): 42 leads added, N0162-N0203
Bar 8.5 (8.0 allowed). Result: 9.5 x1, 9.0 x9, 8.5 x14, 8.0 x18. The target was 100; only 42 passed the live + eligibility + dedupe checks.

## New sources
- LinkedIn guest search (public, no login), the biggest source:
  https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=<kw>&location=Costa%20Rica&f_WT=2&f_TPR=r2592000&start=<0..75>
  and the same with location=Latin%20America. Job detail and live check: https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/<id>
  ("No longer accepting applications" = closed). About 40 keywords were used (senior full stack, full stack react/java/python/node,
  react/node/java/python developer, backend engineer, nestjs, spring boot, fastapi, mern, typescript engineer, product engineer, ...),
  plus a second pass without f_TPR. 1,682 cards, about 1,180 after title/dedupe filters, 42 after scoring and eligibility checks.
- Bulk ATS scan over about 525 company slugs (slugs.txt): Greenhouse (?content=true), Ashby (?includeCompensation=true),
  Lever, Workable (POST apply.workable.com/api/v3/accounts/<slug>/jobs), Recruitee. Only 121 slugs resolved, and the yield was low (about 10).
- BambooHR Gorilla Logic: https://gorillalogic.bamboohr.com/careers/list (careers/34 = Senior Fullstack Java AA).
- Scripts (kept on the box in /workspace/lead): scan2.py (ATS), score.py (ATS scoring/dedupe), li.py / li2.py / li3.py (LinkedIn
  search, details, scoring), append.py (adds a lot to job-search-new.ts).

## Extra dedupe/eligibility rules learned
- Fuzzy title match: same company (first 5 normalized chars) and difflib ratio > 0.8 counts as a duplicate. This catches reposts and typos
  (for example Airtm "Enginner").
- LATAM is only accepted when the location, the title or an explicit sentence says the role is remote from LATAM. A line like "company present in LATAM"
  does not count (rejected: ALIANDO, Homie, ACL, Clara). Country-only roles ("Mexico Only", "- Brasil") are rejected.
- Rejected this run: JBS Dev Senior Full Stack CR (already J0013), Confiz Full Stack Level IV CR (no longer listed),
  Oowlish Python & React (BR/MX/AR/CO only), Truelogic Founding FullStack (Hybrid NYC), Truelogic Mental Health (Bogota),
  Crossing Hurdles (part-time AI-training gig), IBM Fullstack UI/UX (non-core), 3Pillar C++/Python.
