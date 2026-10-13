# Local CV generator

`/cv` accepts a pasted job description and creates a separate, saved CV for that role. It also retains the quick browser keyword comparison. `/cv/profile` edits the source profile, skills, and employer-specific accomplishments. `/cv/archive` preserves all original data-driven CV variants. Existing generated snapshots and failed attempts stay accessible at `/cv/generated/<id>`; retry links restore their saved JD.

## Local matching engine

The Node.js generator runs entirely in this application. No external AI, model download, API key, or paid inference service is needed. It is deterministic retrieval and assembly of supported facts, not a general-purpose language model.

1. `jd.ts` removes HTML, duplicate lines, navigation, logo labels, and copied application fields. `engine.ts` locates the job title/company and extracts literal, quoted requirements with the existing technical dictionary. Benefits and company boilerplate are excluded from ranking when recognizable headings are present.
2. `ranking.ts` learns term rarity from the current evidence corpus and scores overlap with the JD. Controlled aliases, requirement priority, and role focus supplement this relevance score.
3. `engine.ts` selects a grounded profile, chooses skills to cover distinct requested technologies, and ranks accomplishments within their actual employer. It retains all employers, reserves space for each, and prioritizes recent work. A short profile focus sentence uses exact, supported skill labels.
4. `validate.ts` checks evidence IDs, employer attribution, metrics, chronology, keyword quotes, and content budgets before a result becomes printable. Identity, contacts, education, languages, employer names, historical titles, periods, and locations remain from the master CV.
5. Gaps describe terms absent from the source facts. Supported keywords omitted for space appear separately. Basic keyword coverage does not establish required years, exact versions, certifications, or hiring fit; review those requirements before applying.

This engine selects and combines existing wording. It does not invent achievements or infer expertise in one product from a related product. Dictionary matching has limits for unusual titles, unknown tools, negation, and nuanced qualifications. The quick browser comparison is a broader dictionary reference, not the generation validator or an ATS score.

## Facts and archives

`sources.ts` reads the flat `cv-data-*.ts` modules through `cv-data.ts`. Only variants matching the master's candidate identity are consolidated; Oscar's CV remains a separate archive. Evidence has stable IDs and archive attribution. Employment evidence must match canonical company and period, including the known mapping from current La Vieja Adventures work to independent consulting.

The profile editor starts with consolidated skills and short employer-specific evidence. Saved edits become the complete factual source for that admin's future generations; deleted or corrected archive claims are not silently reintroduced. Editing the profile does not modify the archives or previously saved CVs. Generated output never trains subsequent output. The relevance statistics are rebuilt from source facts each time.

## Storage and authentication

The existing MongoDB and admin/JWT configuration are required. CV generation does not read `OPENAI_API_KEY`, `OPENAI_MODEL`, or `OPENAI_CV_MODEL`. Existing AI features elsewhere in the application keep their own configuration.

- `cv_profiles`: editable source facts, isolated by admin ID.
- `cv_generations`: durable ID, owner, source snapshot/hash, cleaned JD, extraction, result/failure, and timestamps. New records use `local-cv-engine-v2`, with an empty provider-call history. Historical provider records are preserved.
- `cv_generation_locks`: atomic, expiring per-admin lock against overlapping generation. Interrupted pending records display retry state after four minutes.

Generation/profile APIs require admin authentication and reject cross-origin mutations. The latest 30 attempts appear in history; older records remain addressable. A database outage can still prevent saving and is reported explicitly.

Saved results offer an A4 print/PDF view, text download/copy, JSON export, keyword evidence, and the cleaned JD. The browser measures page overflow; content budgets alone do not guarantee a one-page print fit.

## Job URL and form scanner

`/cv/scraper` reads a public job or application page. The original `/cv/srapper` URL and `/cv/scrapper` redirect there. CV Studio links to the scanner through **Import a job URL**.

The scanner extracts readable page text, JSON-LD job postings, links, forms, and input/textarea/select fields, including controls associated with a form elsewhere in the document. It preserves labels, required flags, options, upload constraints, and other field attributes. Password, hidden, and token-like values are omitted. Limits and incomplete extraction appear in scan notes.

Review and edit either a job posting or the full page text, then choose **Use in CV generator**. This explicitly replaces the generator draft in the same browser tab using the shared session-storage key. Import requires 100–40,000 characters; it opens the generator for review. Copy/text download and JSON scan export are also available. Storage or clipboard failures leave the text on screen with a recovery message.

`POST /api/scrape` accepts `{ "url": "https://…" }`; the original `GET /api/scrape?url=…` contract remains supported. Both require the existing admin session, reject foreign origins, and return uncached results or `{ error, code }`. Public HTTP/HTTPS URLs only: DNS answers are checked and pinned to the connection, every redirect is revalidated, and the download is limited to 20 seconds and 2 MB both before and after decompression. Scans can be cancelled from the screen.

The scanner reads downloaded HTML. It does not execute page JavaScript, open embedded application frames, or submit applications. Sites requiring those flows or blocking automated access need a direct public job URL or manually pasted text. Extracted posting dates and salary are source data; they do not confirm that a vacancy is still open.

## Verification

Run `node scripts/check-cv-generator.cjs`, `node scripts/check-cv-scraper-extract.cjs`, `node scripts/check-cv-scraper-fetch.cjs`, targeted ESLint, TypeScript checks, and the application build. The generator regression script isolates persistence and authentication in memory and asserts zero provider calls. It covers source integrity, ownership, retries, input cleanup, local extraction, and learning from profile edits. Scanner checks use HTML fixtures and mocked network responses to verify extraction, public-address rules, redirects, size/time limits, and authenticated API behavior. Live API/database verification is separate. Visual and printing confirmation remain manual; do not open Playwright.
