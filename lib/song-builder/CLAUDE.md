# Song Builder — shared model

This directory is part of the Song Builder. Its guide is the only thing you need:

**`app/(page_routes)/dj-lab/song-builder/CLAUDE.md`**

Read that before changing anything here. The short version for this directory: no React,
no Mongo driver and no Web Audio may be imported into `types.ts`, `pattern.ts` or
`validate.ts` — they are the contract the browser and the API both depend on.
