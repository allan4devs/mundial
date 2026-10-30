# Comp storage

Comp reads its catalog from `comp_companies` in the existing MongoDB database (`MONGODB_URI`, optional `MONGODB_DB`, default `lva`). On the first API request, the existing catalog and its role/source evidence are imported with stable company IDs. The `comp_migrations` collection records completion; retries do not overwrite existing companies. JSON files remain only as the initial import source and for the existing research scripts.

Likes, dislikes, and edited careers links are saved in browser storage when signed out or when MongoDB is unavailable. Signed-in admins sync preferences to `comp_preferences`, scoped to their account. API writes require the admin session and reject cross-origin requests.

On the first signed-in visit, browser preferences under `cv-company-preferences-v1` are imported without overwriting existing MongoDB preferences. Browser data is removed only after a successful import. If it fails, reload to retry. Other devices use the same saved preferences when signed in to the same account.

The directory exposes 12 category tabs derived from company evidence. Counts exclude dislikes from browsing categories and preserve the existing Companies/Like separation. Search and filters apply within each category.

Validation: `node scripts/check-comp-storage.cjs` checks catalog import, preference ownership, non-destructive migration, reaction exclusivity, URL validation, API authentication, and origin checks with an in-memory database. Live migration requires configured MongoDB credentials.

`node scripts/check-comp-reactions.cjs` checks guest reaction controls, persistence after reload, saved tabs, and undo with a component hook harness.
