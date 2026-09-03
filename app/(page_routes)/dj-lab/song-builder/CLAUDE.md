# Song Builder v1 — the only guide for this project

**This file is the whole contract.** When you work on the Song Builder, read this and the
files you are changing. Nothing else. In particular: do **not** read or copy patterns from
`../archive/song-builder-v0/` — that is a frozen, much more complicated app that was
replaced on purpose. Its existence is not a reason to do anything.

---

## The sentence

> You beat-box a rhythm into one of five rows, the studio decodes it into steps,
> and plays it back as a real instrument.

That sentence is the product. Keep it true and keep it that short.

## The rule

**Every change must leave the studio easier to explain out loud.**

Before adding anything, say the sentence above with your change in it. If the sentence
gets longer, the change has to pay for itself by deleting something. "Growing" here means
the thing does more with *fewer* moving parts, not more parts.

Three consequences, in order of how often they bite:

1. **No code without a caller.** No helper, type, option or config field that nothing
   uses today. Speculative extension points are the thing that killed v0. If you find
   yourself writing "this will be useful when…", stop and write it when.
   (The one legitimate exception: a type that only appears inside an exported signature —
   `Rig`, `Onset`, `Instrument`, `SongTuning`, `SchedulerDeps`, `LibraryScope` — still has
   to be exported. Those are not dead; leave them.)
2. **One knob per concept.** The decoder has exactly one user-facing knob (Sensitivity).
   If a second one seems necessary, the first one is wrong.
3. **Data over branches.** New sounds, new demo grooves and new presets are entries in a
   table. If adding one means touching a function, the table is shaped wrong.

## Where things live

Three directories, and that is all there is.

**`lib/song-builder/`** — the shared model. No React, no Mongo driver, no Web Audio.
Both the browser and the API import it, so it is also the shape a training set would take.

| file | holds |
| --- | --- |
| `types.ts` | `TRACK_KINDS`, `Hit`/`Track`/`Song`/`SongWire`, all limits, `stepSeconds`/`loopSeconds` |
| `pattern.ts` | the `....\|..!` codec, `normalizeHits`, `toggleHit` |
| `validate.ts` | untrusted JSON → `SongInput`, `SongBuilderError` |
| `songs.ts` | the Mongo repository (collection `dj_song_builder_songs`) |

**`app/api/dj-lab/songs/`** — `route.ts` (GET list, POST save) and `[id]/route.ts`
(GET one, DELETE). Thin: parse, call the repository, map errors. No logic.

**`app/(page_routes)/dj-lab/song-builder/`** — the studio.

| file | holds |
| --- | --- |
| `SongBuilderClient.tsx` | the shell: owns the song, hands stable kind-taking callbacks down |
| `lib/analyze.ts` | **the decoder** — envelope, brightness, onset picking, quantise |
| `lib/voices.ts` | the synths. Each is a factory returning a stateless `Voice` |
| `lib/instruments.ts` | the preset registry + `playHit` (the only place `tone` is interpreted) |
| `lib/scheduler.ts` | the look-ahead clock, audition, count-in |
| `lib/session.ts` | song factories (incl. the demo groove), track patching, owner key |
| `lib/audio.ts` `lib/music.ts` `lib/api.ts` `lib/constants.ts` `lib/format.ts` | plumbing |
| `hooks/` | `useAudioEngine`, `useRecorder`, `useTransport`, `useSongLibrary`, `useLatest` |
| `components/` | `TrackRow`, `PatternGrid`, `TransportBar`, `SongLibraryPanel`, `StudioHeader`, `StudioNotes`, `ui` |
| `props.ts` | every component's prop type, in one place |

## Invariants

Break one of these and you are building a different app.

- **Five rows.** `TRACK_KINDS` is fixed. A sixth instrument is a preset on an existing row.
- **One loop.** The mic is open for exactly `loopSeconds(bpm, steps)`. There is no
  arrangement, no song sections, no second loop.
- **`hits` is the truth; the pattern string is derived** on read. Never store both.
- **A hit is three numbers** — `step`, `velocity`, `tone`. Adding a fourth is a real
  decision: it changes the wire format, the validator and what a model must predict.
- **`tone` is interpreted in exactly one place** (`playHit` + `drumKit`). Keep it that way.
- **Voices are stateless.** A `Voice` builds a throwaway graph for one note at one time
  and schedules its own stop. Nothing persists between notes.
- **No audio assets.** Everything is synthesised; there is no `public/` in this repo.
- **Every note is scheduled on the audio clock**, never fired from a timer.
- **Writes are owner-scoped.** `x-studio-owner` gates save and delete. There is no login
  and there should not be one.

## Budgets

| thing | cap | now |
| --- | --- | --- |
| rows | 5 | 5 |
| presets per row | 4 | 3 |
| decoder knobs exposed to the user | 1 | 1 (Sensitivity) |
| lines in a file | 200 | see below |
| total lines | 3,500 | ~3,400 |

Files over 200 lines today: `voices.ts` (278), `analyze.ts` (254), `useRecorder.ts` (230),
`TrackRow.tsx` (206), `SongBuilderClient.tsx` (206). The first is a flat list of
independent voices — a table, so length is fine. The rest are at their limit: adding to
them means splitting by responsibility, never by line count.

If a change would push the total past the budget, the budget is not the problem — the
change is.

## Recipes

**Add an instrument sound.** One entry in `INSTRUMENTS[kind]` in `lib/instruments.ts`.
Reuse a voice factory from `voices.ts` with different config first; only write a new
factory if no existing one can make the sound. Nothing else changes — the picker, the
scheduler and the saved format all read the registry.

**Add a demo groove.** Lines in `DEMO_ROWS` in `lib/session.ts`. One line per pass, with
the `tone` a take would have carried. Watch for two passes landing on the same step —
`normalizeHits` keeps the loudest and silently drops the other (this is how the demo's
backbeat got eaten once already).

**Change the decoder.** It is three pure functions in `lib/analyze.ts`: `analyzeVoice`
(features) → `detectOnsets` (peak picking) → `quantizeHits` (snap). Replace one; do not
add a fourth stage. Verify with the harness below before believing it works.

**Add a field to a saved song.** Four edits, in this order: `types.ts` (the type),
`validate.ts` (coerce and clamp it — never reject a take over a bad field),
`session.ts` (`createSong`), `lib/api.ts` (the POST body). The repository needs no change.

**Add a control.** Prop type in `props.ts`, a stable `useCallback` in the shell, and the
control in the component. Callbacks take the `TrackKind`, never close over it — that is
what makes `memo` on `TrackRow` actually work.

## Don't

Each of these is something v0 had and v1 deliberately does not:

- per-row effect chains, EQ, filters or a mixer
- file upload, chopping, waveform scrubbing, offline bounce/export
- a second grid resolution, swing, or per-row tempo
- undo stacks, autosave, drafts, or dirty-state tracking
- a settings panel of any kind
- keeping raw recorded audio around — only the analysis is kept, on purpose
- adding a library because something is mildly tedious

## Checks

There is no test runner and no ESLint config in this repo. These are the checks:

```bash
npx tsc --noEmit
npx next build --turbopack
```

For anything in `lib/analyze.ts`, `lib/pattern.ts` or `lib/session.ts`, run it directly —
they are pure and have no browser dependency at module load:

```bash
npx tsx some-check.ts     # fake the AudioBuffer:
# { numberOfChannels: 1, length, sampleRate, duration, getChannelData: () => data }
```

Two decoder regressions that a harness caught once and would catch again — check both
after touching `analyze.ts`:

- **a hit on step 0 must survive.** The first frame is seeded with room tone, not
  silence, or the downbeat is lost at index 0.
- **kick / snare / hat must land in three bands.** Brightness is
  `1 - sqrt(lowBandEnergy / totalEnergy)` at a 500 Hz split — roughly 0.05 / 0.45 / 0.87.
  Zero-crossing rate was tried and does not work: it saturates, and a snare and a hat come
  out identical.

Also worth one manual pass: room tone alone must decode to zero hits.

## Where the model goes

The stated plan is to replace the heuristics with a trained model. The seams are already
cut, and keeping them cut is most of what "simpler" buys:

- **onsets** — swap the body of `detectOnsets`. Same signature, same `Onset[]`.
- **timbre** — swap how `brightness` is estimated in `analyzeVoice`, or how `drumKit`
  reads `tone`. Nothing else looks at it.
- **pitch** — `noteFromTone` in `lib/music.ts` is the whole mapping today.

Mongo already stores the training pairs: the `Hit[]` a human accepted, per row, per song.
Do not add a separate telemetry path for this.
