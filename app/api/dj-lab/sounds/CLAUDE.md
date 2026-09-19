# Song Builder — sound API

This route is part of the Song Builder. Its guide is the only thing you need:

**`app/(page_routes)/dj-lab/song-builder/CLAUDE.md`**

Read that before changing anything here. The short version for this directory: the route
stays thin — validate the style, call `lib/song-builder/styles.ts`, map errors. Any logic
that grows here belongs in the reader or the normalizer instead.
