# Song Builder — shared model

This directory is part of the Song Builder. Its guide is the only thing you need:

**`app/(page_routes)/dj-lab/song-builder/CLAUDE.md`**

Read that before changing anything here. The short version for this directory: `types.ts`
and `pattern.ts` are the contract the browser and the API both depend on, so no React, no
Mongo driver and no Web Audio may be imported into them. `styles.ts` is the one file here
that talks to Mongo.
