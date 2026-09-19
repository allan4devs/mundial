# Song Builder v1 — the only guide for this project

**This file is the whole contract.** When you work on the Song Builder, read this and the
files you are changing. Nothing else. In particular: do **not** read or copy patterns from
`../archive/song-builder-v0/` — that is a frozen, much more complicated app that was
replaced on purpose. Its existence is not a reason to do anything.

---

## The sentence

> You beat-box a rhythm into one of five rows, pick a style, and hear it played back by
> that style's instruments.

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
   (Two legitimate exceptions. A type that only appears inside an exported signature —
   `Rig`, `Strip`, `Onset`, `Voice`, `Scheduler`, `SchedulerDeps` — still has to be
   exported. And `encodePattern` has no in-app caller on purpose: the decoder harness
   below prints patterns with it. Those are not dead; leave them.)
2. **One knob per concept.** The decoder has exactly one user-facing knob (Sensitivity),
   and it applies live to every take at once — which is why no row has a "re-decode"
   button. If a second knob seems necessary, the first one is wrong.
3. **Data over branches.** Sounds, styles and the demo groove are rows in a table — three
   of them in Mongo. If adding one means touching a function, the table is shaped wrong.

## What is on screen, and what is not

**The whole studio is one screen and never scrolls** (at `lg` and up). The layout is a
fixed-height column: the header bar and the transport take what they need, and the five
rows split whatever is left — so a row is ~120px on a 768px-tall laptop and ~180px on a
1080p monitor, and the grid cells stretch to fill. Below `lg` it falls back to normal flow
and scrolls, because five instrument rows genuinely do not fit on a phone.

That constraint is why the header is a single bar rather than a hero block, why the
transport is one line, and why a row's controls sit beside its grid instead of above it.
Anything you add has to come out of another element's height.

The screen is **instruments and beat times**. That is the whole interface:

- one **style selector** (groovy / rock / pop), which is a Mongo document
- **play**, **tempo**, **sensitivity**, **demo groove**, **clear all**
- five rows, each with exactly three things: **record**, a **sound picker**, and the **grid**

Anything a mixer would add to a row — level, mute, solo, audition, per-row decode — was
deliberately removed. So was saving songs. Do not put them back without deleting something
of equal weight.

**Text is an option too.** Prose that restates what a control already says is not free, so
it goes: a style blurb next to buttons already labelled groovy/rock/pop, a hint under a
picker that already names the sound, a "Loop 5.0s" stat next to a button reading
"Record 5.0s", a paragraph explaining what the status line says anyway. The one line of
guidance a row does carry (`TRACK_META.cue`) is shown only while that row is empty, then
gets out of the way. Before adding a label, check whether the thing beside it already
said it.

## Where things live

Three directories, and that is all there is.

**`lib/song-builder/`** — the shared model. No React and no Web Audio.

| file | holds |
| --- | --- |
| `types.ts` | `TRACK_KINDS`, `STYLES`, `VOICE_IDS`, `Hit`/`Track`/`Song`, `Sound`/`Amp`/`Eq`/`StylePack`, `STEPS`, `stepSeconds`/`loopSeconds` |
| `pattern.ts` | `normalizeHits`, `toggleHit`, and the `....\|..!` codec (used by the demo groove and the harness, not by the screen) |
| `styles.ts` | the seeded sound registry and its Mongo reader (`dj_song_builder_styles`) |

**`app/api/dj-lab/sounds/route.ts`** — `GET ?style=rock` returns one style pack. Thin.

**`app/(page_routes)/dj-lab/song-builder/`** — the studio.

| file | holds |
| --- | --- |
| `SongBuilderClient.tsx` | the shell: owns the song, hands stable kind-taking callbacks down |
| `lib/analyze.ts` | **the decoder** — envelope, brightness, onset picking, quantise |
| `lib/voices.ts` | the five synth engines, addressed by name, plus `playHit` |
| `lib/audio.ts` | the context, the master bus, and a row's **amp + EQ channel strip** |
| `lib/scheduler.ts` | the look-ahead clock, step audition, count-in |
| `lib/session.ts` | song factories (incl. the demo groove), `soundFor`, `restyle` |
| `lib/music.ts` `lib/constants.ts` `lib/format.ts` | plumbing |
| `hooks/` | `useStylePack` (Mongo), `useAudioEngine`, `useRecorder`, `useTransport`, `useLatest` |
| `components/` | `TrackRow`, `PatternGrid`, `TransportBar`, `StudioHeader`, `ui` |
| `props.ts` | every component's prop type, in one place |

## Invariants

Break one of these and you are building a different app.

- **Five rows.** `TRACK_KINDS` is fixed. A sixth instrument is a sound on an existing row.
- **One loop, 32 steps, fixed.** `STEPS` is a constant, not a setting. The mic is open for
  exactly `loopSeconds(bpm)`.
- **Sounds live in Mongo; songs do not live anywhere.** The registry is a database
  document so it can be retuned without a deploy. What the user builds is lost on reload,
  and that is the trade that let the whole library UI be deleted.
- **`hits` is the truth; the pattern string is derived.** Never store both.
- **A hit is three numbers** — `step`, `velocity`, `tone`. A fourth changes the wire
  format, the normalizer, and what a model must predict.
- **`tone` is interpreted in exactly one place** (`playHit` + the `kit` voice).
- **Voices are stateless and know nothing about amps or EQ.** A voice builds a throwaway
  graph for one note and schedules its own stop. The amplifier and the three EQ bands are
  the row's *strip*, built once in `useAudioEngine` and only ever retuned — which is why
  changing sound mid-loop never cuts a ringing note.
- **One screen, no scrolling.** `lg:h-[100dvh] lg:overflow-hidden` on the shell, rows in a
  `lg:grid-rows-5` that fills the remaining height. Nothing inside a row may have a fixed
  height that stops it shrinking; that is what `min-h-0` is doing everywhere.
- **No audio assets.** Everything is synthesised; there is no `public/` in this repo.
- **Every note is scheduled on the audio clock**, never fired from a timer.
- **A hand-edited sound document must never break the studio.** `normalizeStylePack`
  clamps and falls back; a row with no valid sounds gets the seeded ones.

## Budgets

| thing | cap | now |
| --- | --- | --- |
| rows | 5 | 5 |
| sounds per row per style | 4 | 2 |
| controls on a row | 3 | 3 |
| decoder knobs exposed to the user | 1 | 1 (Sensitivity) |
| lines in a file | 200 | see below |
| total lines | 3,000 | ~2,630 |

Files over 200 lines: `voices.ts` (288), `analyze.ts` (253), `useRecorder.ts` (224),
`styles.ts` (209), `SongBuilderClient.tsx` (208). `voices.ts` and `styles.ts` are tables of
independent entries, so length is fine. The rest are at their limit: adding to them means
splitting by responsibility, never by line count.

## Recipes

**Add a sound.** One `sound(...)` line in `SEED` in `lib/song-builder/styles.ts`, or a
push into the `sounds` array of an existing document in `dj_song_builder_styles`. It
needs a `voice` from `VOICE_IDS`, a `config` bag that voice understands, an `amp` and an
`eq`. Nothing else changes — the picker, the scheduler and the channel strip all read it.
The seed only runs on an empty collection, so editing `SEED` alone will not change a
database that already has documents.

**Add a style.** Add it to `STYLES` in `types.ts` and add its pack to `SEED`. The selector
renders from `STYLES`, so that is the whole change.

**Add a synth engine.** A `Voice` in `voices.ts`, its id in `VOICE_IDS`, and an entry in
the `VOICES` map. Read every knob through `num(config, "name", fallback)` so a document
missing a key still plays.

**Change the decoder.** Three pure functions in `lib/analyze.ts`: `analyzeVoice`
(features) → `detectOnsets` (peak picking) → `quantizeHits` (snap). Replace one; do not
add a fourth stage. Verify with the harness below before believing it works.

**Add a control, or a line of text.** Almost always the wrong answer — read "What is on
screen" again first.
If it survives that: prop type in `props.ts`, a stable `useCallback` in the shell, the
control in the component. Callbacks take the `TrackKind`, never close over it — that is
what makes `memo` on `TrackRow` actually work.

## Don't

Each of these is something this app had at some point and deliberately does not now:

- saving, loading or listing songs; titles, authors, owner keys
- per-row level, mute, solo, audition or decode buttons; a master volume
- a grid-length, root-note or scale picker — the style pack decides all three
- the `....|..!` string printed under the grid — the grid already is the rhythm
- per-row effect chains beyond the one amp + three-band EQ the strip already has
- file upload, chopping, waveform scrubbing, offline bounce/export
- undo stacks, autosave, drafts, dirty-state tracking
- keeping raw recorded audio around — only the analysis is kept, on purpose
- adding a library because something is mildly tedious

## Checks

There is no test runner and no ESLint config in this repo. These are the checks:

```bash
npx tsc --noEmit
npx next build --turbopack
```

**Stop the dev server before running the build.** `next dev` and `next build` write to the
same `.next` directory, and on Windows running both at once corrupts it - the dev server
then loops on `ENOENT ... _buildManifest.js.tmp.*`. The fix is to stop dev, delete `.next`
(it is gitignored build cache, nothing of yours lives there) and start dev again. Prefer
`npx tsc --noEmit` alone while dev is up; it touches nothing the dev server owns.

The pure code (`lib/analyze.ts`, `lib/song-builder/pattern.ts`, `lib/session.ts`) runs
directly under `npx tsx` — fake the AudioBuffer with
`{ numberOfChannels: 1, length, sampleRate, duration, getChannelData: () => data }`.
For anything touching Mongo, load `.env` by hand and `await import()` the module
afterwards (`lib/mongo.ts` reads the URI at module scope), and wrap it all in an
`async function main()` — tsx compiles to CJS and rejects top-level await.

Two decoder regressions that a harness caught once and would catch again — check both
after touching `analyze.ts`:

- **a hit on step 0 must survive.** The first frame is seeded with room tone, not
  silence, or the downbeat is lost at index 0.
- **kick / snare / hat must land in three bands.** Brightness is
  `1 - sqrt(lowBandEnergy / totalEnergy)` at a 500 Hz split — roughly 0.05 / 0.45 / 0.88.
  Zero-crossing rate was tried and does not work: it saturates, and a snare and a hat come
  out identical.

Also worth one manual pass: room tone alone must decode to zero hits.

**For a layout change, measure it — do not eyeball it.** Chrome is installed, and Node 24
has a global `WebSocket`, so the DevTools Protocol needs nothing installed:

```
chrome.exe --headless=new --disable-gpu --hide-scrollbars --remote-debugging-port=9222   --user-data-dir=<tmp> about:blank
```

Then connect to the target from `http://localhost:9222/json/list` and use
`Runtime.evaluate` to read `document.documentElement.scrollHeight` against
`window.innerHeight` at 1366x768, 1440x800, 1728x900 and 1920x1080 — the vertical
difference must be zero at every one. `Emulation.setDeviceMetricsOverride` resizes,
`Page.captureScreenshot` proves it, and clicking the Demo button first is what makes the
screenshot worth looking at. Kill the browser when you are done.

## Where the model goes

The stated plan is to replace the heuristics with a trained model. The seams are already
cut, and keeping them cut is most of what "simpler" buys:

- **onsets** — swap the body of `detectOnsets`. Same signature, same `Onset[]`.
- **timbre** — swap how `brightness` is estimated in `analyzeVoice`, or how the `kit`
  voice reads `tone`. Nothing else looks at it.
- **pitch** — `noteFromTone` in `lib/music.ts` is the whole mapping today.
- **sound choice** — a model that picks the sound for a take writes `Track.soundId`,
  which is already just an id into the style pack.

Nothing about a user's song is stored, so training data would need a new decision, not a
new field. Do not add a telemetry path on a hunch.
