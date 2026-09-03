# Song Builder — API routes

These routes are part of the Song Builder. Its guide is the only thing you need:

**`app/(page_routes)/dj-lab/song-builder/CLAUDE.md`**

Read that before changing anything here. The short version for this directory: routes stay
thin — parse, call `lib/song-builder/songs.ts`, map `SongBuilderError` to a status. Any
logic that grows here belongs in the repository or the validator instead.
