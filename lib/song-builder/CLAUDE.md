# Song Builder — shared model

This directory is part of the Song Builder. Its guide is the only thing you need:

**`app/(page_routes)/dj-lab/song-builder/CLAUDE.md`**

Read that before changing anything here. The short version for this directory: `types.ts`,
`pattern.ts` and `harmony.ts` are the contract the browser and the API both depend on, so
no React, no Mongo driver and no Web Audio may be imported into them. `harmony.ts` in
particular is pure arithmetic on MIDI numbers and is the file that decides whether ten rows
are a song or ten people in a room — it is worth a `tsx` harness after any edit.
`styles.ts` is the one file here that talks to Mongo, and it re-seeds a stored document
whenever `SEED_VERSION` moves past the one in the database.
