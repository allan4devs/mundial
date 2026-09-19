# Song Builder v1 — the only guide for this project

**This file is the whole contract.** When you work on the Song Builder, read this and the
files you are changing. Nothing else.

`../archive/song-builder-v0/` is a frozen, much more complicated app that was replaced on
purpose, and its *structure* is still not a model for anything here — no layer racks, no
sample pools, no spectral panels. One thing was worth taking from it and has been taken:
its `songForge.ts` knew how instruments are actually built, and that knowledge now lives in
`lib/voices/`. Do not go back for its architecture.

---

## The sentence

> You beat-box a rhythm into one of ten rows, pick a style, hear it played back by that
> style's instruments — then sing over the loop and keep the mix.

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
- **play**, **sing**, **tempo**, **sensitivity**, **demo groove**, **clear all**
- **download**, which exists only once a take does — never a dead control to explain
- ten rows, each with exactly three things: **record**, a **sound picker**, and the **grid**
  — plus the row's **name**, which is also its mute

**Sing is the one thing that leaves the browser.** It runs the loop with the microphone
open, mixes the band off the master bus with the voice, and hands back a wav. It paid for
itself by collapsing the two copies of "open a microphone, record it to a blob" into
`lib/mic.ts` — which is also what got `useRecorder.ts` back under its line cap. If it ever
grows a knob (a level, a count of loops, a format picker), that is the sign it was the
wrong shape.

Anything a mixer would add to a row — level, solo, audition, per-row decode — was
deliberately removed. So was saving songs. Do not put them back without deleting something
of equal weight.

**Mute is the one that came back**, and it paid for itself by not being furniture: the
row's name *is* the switch. Clicking it drops that strip's fader to zero and greys the row
— dot, label and every hit on the grid — so "which instruments am I hearing" is answered by
the same pixels that answer "which instrument is this". It rides the sound's own level
inside `applyStrip`, which is why a silenced row also leaves the reverb, the delay and a
sung take: the sends hang off the far end of the strip. A mute that only skipped notes in
the scheduler would leave all three ringing. There is still no level and no solo — with ten
rows, "off" is a decision anyone can make, and "how far off" is not.

**Text is an option too.** Prose that restates what a control already says is not free, so
it goes: a style blurb next to buttons already labelled groovy/rock/pop, a hint under a
picker that already names the sound, a "Loop 5.0s" stat next to a button reading
"Record 5.0s", a paragraph explaining what the status line says anyway. The one line of
guidance a row does carry (`TRACK_META.cue`) is shown only while that row is empty, then
gets out of the way. Before adding a label, check whether the thing beside it already
said it.

## The signal path

Worth having in your head before you touch anything that makes noise, because almost every
"it sounds wrong" question is answered by knowing which box it went through.

```
hit ──► playHit ──► chordAt / noteFor ──► a voice builds a graph for one note
                                              │
row strip:  drive ─► register HPF ─► low/mid/high ─► level ─► duck ─► pan ─┬─► dry
                                                                          ├─► reverb send
                                                                          └─► delay send
master:  BUS_TRIM ─► glue ─► makeup ─► saturation ─► weight/air ─► brickwall ─► out ─► speakers
                ▲                                                                     └─► a sung take
                └──── reverb return ── delay return ────┘
```

Five things in that diagram are the whole difference between this and a demo, and each one
is somebody's first instinct to delete:

1. **`noteFor` sits before the voice, not inside it.** Pitch is decided by the pack's chord
   progression, once, for every row at that step.
2. **The sends are post-fader**, hanging off the far end of the strip. A row turned down,
   ducked or muted leaves the reverb too.
3. **The returns land on `input`**, before the glue — so the room is compressed and
   saturated with everything else, instead of sitting behind it.
4. **`BUS_TRIM` comes first.** It is what leaves the master chain something to do.
5. **The kick's duck is drawn, not detected.** The scheduler knows the future; a sidechain
   detector would only know the past.

## Where things live

Three directories, and that is all there is.

**`lib/song-builder/`** — the shared model. No React and no Web Audio.

| file | holds |
| --- | --- |
| `types.ts` | `TRACK_KINDS`, `STYLES`, `VOICE_IDS`, `DRUM_PIECES`, `CHORD_TYPES`, `HARMONY_ROLES`, `Hit`/`Track`/`Song`, `Sound`/`Amp`/`Eq`/`Mix`/`Space`/`StylePack`, `STEPS`, `stepSeconds`/`loopSeconds` |
| `pattern.ts` | `normalizeHits`, `toggleHit`, and the `....\|..!` codec (used by the demo groove and the harness, not by the screen) |
| `harmony.ts` | **the key** — scales, chord tables, `chordAt`, `chordVoicing`, and `noteFor`, which is the one function that decides what note a hit plays |
| `styles.ts` | the seeded sound registry, the per-row seating plan, and its Mongo reader (`dj_song_builder_styles`) |

**`app/api/dj-lab/sounds/route.ts`** — `GET ?style=rock` returns one style pack. Thin.

**`app/(page_routes)/dj-lab/song-builder/`** — the studio.

| file | holds |
| --- | --- |
| `SongBuilderClient.tsx` | the shell: owns the song, hands stable kind-taking callbacks down |
| `lib/analyze.ts` | **the decoder** — envelope, brightness, onset picking, quantise |
| `lib/voices/index.ts` | the engines addressed by name, the `kit`, `pieceFor`, and `playHit` — the seam where a mouth noise becomes a note in a chord |
| `lib/voices/drums.ts` | fourteen drum pieces, each built the way that drum is built |
| `lib/voices/synths.ts` | six pitched engines: a Karplus-Strong string, a layered bass, stabs, pads, an FM bell, brass |
| `lib/voices/env.ts` | `VoiceArgs`, envelopes, noise, stereo placement |
| `lib/audio.ts` | the context and a row's **channel strip** — drive, filter, EQ, level, duck, pan, two sends |
| `lib/mix.ts` | **the desk** — glue, saturation, tilt, brickwall, the shared reverb and delay, and the chain a sung take runs through |
| `lib/dsp.ts` | the raw materials: shaping curves, noise, a synthesised room, the humaniser's hash |
| `lib/mic.ts` | the two ways this studio opens the microphone, and recording any stream to a blob |
| `lib/wav.ts` | the take file — 16-bit PCM, because nothing opens a WebM by double-clicking it |
| `lib/scheduler.ts` | the look-ahead clock **and the groove** — swing, humanising, accents, the sidechain |
| `lib/session.ts` | song factories (incl. the demo groove), `soundFor`, `restyle` |
| `lib/constants.ts` `lib/format.ts` | plumbing, and every number the desk is tuned with |
| `hooks/` | `useStylePack` (Mongo), `useAudioEngine`, `useRecorder`, `useVocalTake`, `useTransport`, `useLatest` |
| `components/` | `TrackRow`, `PatternGrid`, `TransportBar`, `StudioHeader`, `ui` |
| `props.ts` | every component's prop type, in one place |

## Invariants

Break one of these and you are building a different app.

- **Ten rows, and they are a frequency map.** `TRACK_KINDS` is not a wish list: `bass`
  owns everything under 200 Hz, `drums` and `perc` are unpitched, and the seven pitched
  rows are spaced by `transpose` (keys/strings/synth/fill +12, brass +19, lead +24, arp
  +36) and carved apart by each sound's three EQ bands. Ten voices at once mask each other
  unless every one has a slot. An eleventh row is only worth adding if you can name the
  empty band it sits in — otherwise it is a sound on an existing row.
- **The studio boots playable.** The first pack builds `createDemoSong`, not an empty
  grid: pressing Play before touching anything has to make noise, because most first
  visits never grant microphone access at all. `createSong` is what Clear all gives you.
- **One loop, 32 steps, fixed.** `STEPS` is a constant, not a setting. The mic is open for
  exactly `loopSeconds(bpm)`.
- **Sounds live in Mongo; songs do not live anywhere.** The registry is a database
  document so it can be retuned without a deploy. What the user builds is lost on reload,
  and that is the trade that let the whole library UI be deleted.
- **A sung take is an object URL and nothing else.** No upload, no history, no second copy,
  no list of past takes — the next take revokes the last one. Reload and it is gone, same
  as the song. Download is the only way out, which is why the status line says so.
- **The microphone never reaches the speakers.** A take mixes the band off `rig.output`
  and the voice off the mic onto one `MediaStreamDestination`. Routing the mic to
  `ctx.destination` to "hear yourself" is a feedback loop, not a feature.
- **`hits` is the truth; the pattern string is derived.** Never store both.
- **A hit is three numbers** — `step`, `velocity`, `tone`. A fourth changes the wire
  format, the normalizer, and what a model must predict.
- **`tone` is interpreted in exactly one place** (`playHit` + the `kit` voice).
- **The style pack owns the harmony, and every row obeys it.** A pack carries a
  `progression`; `chordAt` splits the loop evenly between its chords; `noteFor` places a
  hit inside the chord under it according to the sound's `harmony` role — `root` for the
  bass, `chord` for pads and sections, `lead` for melodies, which are pulled onto a chord
  tone on the downbeats and free between them. Ten rows each mapping brightness onto its
  own scale degree is what this replaced, and it is why the studio used to sound like ten
  people tuning up. Nothing outside `harmony.ts` may decide a pitch.
- **Voices are stateless and know nothing about the desk.** A voice builds a throwaway
  graph for one note and schedules its own stop. Drive, the register filter, three EQ
  bands, level, the duck, the pan and both sends are the row's *strip*, built once in
  `useAudioEngine` and only ever retuned — which is why changing sound mid-loop never cuts
  a ringing note.
- **One room, one echo, shared by everyone.** There is exactly one reverb and one delay,
  they hang off the master, and rows reach them through post-fader sends (`Mix.reverb`,
  `Mix.delay`). Per-row effect chains are still banned; a shared bus is not one, it is the
  reason ten synthesised parts sound like one band in one place. The returns land on the
  dry bus so they are glued and saturated with everything else.
- **The kick is ducked in, not detected.** Web Audio has no sidechain input and does not
  need one: the scheduler knows when every kick lands, so `duckStrip` draws the dip on each
  strip's gain curve ahead of time. Which pieces trigger it is `DUCKING_PIECES`; how far
  each row drops is its own `Mix.duck`.
- **Gain staging before loudness.** `BUS_TRIM` exists so ten rows arrive at the glue
  *below* full scale. Raise it and the compressor stops gluing and starts levelling, the
  limiter rides the whole programme instead of its peaks, and the crest factor collapses —
  which sounds louder for a second and flat forever. The measured target is peak ≈ 0.9,
  RMS ≈ 0.34; see the checks below.
- **Nothing is rendered faster than real time.** There is still no offline bounce. Every
  buffer that is computed ahead of time — the room, the noise, the plucked strings — is a
  *source*, cached against the context, never a mixdown.
- **The frame never scrolls; the rows do.** `lg:h-[100dvh] lg:overflow-hidden` on the
  shell keeps the header and the transport permanently on screen — Play, Sing and Download
  are reached mid-take and must never scroll away. Ten rows stopped fitting a laptop
  viewport, so the row list took the `overflow-y-auto` instead, on
  `lg:auto-rows-[minmax(104px,1fr)]`: rows share the height when they fit and scroll when
  they do not. Nothing inside a row may have a fixed height that stops it shrinking; that
  is what `min-h-0` is doing everywhere.
- **No audio assets.** Everything is synthesised; there is no `public/` in this repo.
- **Every note is scheduled on the audio clock**, never fired from a timer.
- **A hand-edited sound document must never break the studio.** `normalizeStylePack`
  clamps and falls back; a row with no valid sounds gets the seeded ones.

## Budgets

| thing | cap | now |
| --- | --- | --- |
| rows | 10 | 10 |
| sounds per row per style | 4 | 4 |
| controls on a row | 3 + the name | 3 + mute |
| decoder knobs exposed to the user | 1 | 1 (Sensitivity) |
| shared effect buses | 2 | 2 (one reverb, one delay) |
| stages in the master chain | 5 | 5 (trim, glue, saturation, tilt, brickwall) |
| lines in a file | 300 | see below |
| total lines, minus the seed table | 4,000 | ~3,900 |

The 3,000-line cap was raised deliberately, once, to pay for the sound. It bought:
`lib/voices/` split three ways (drums, synths, envelopes) where there was one file,
`lib/mix.ts` and `lib/dsp.ts` where there was a gain node and a compressor, and
`harmony.ts` where there was a five-line `noteFromTone`. That is the whole increase, and
it is all *mechanism* — there is still no state, no persistence and no second screen.

Files over 300 lines: `styles.ts` (472) and `voices/synths.ts` (364). `styles.ts` is a
table of independent entries plus two seating plans, so length is fine. `synths.ts` is six
independent engines and splits by engine if it ever has to. Everything else is under.

The total excludes the `SEED` table in `styles.ts` (120 one-line sound entries, one per row
per style). That exclusion is the honest way to keep the budget meaningful: the cap exists
to stop *logic* sprawling, and a data table that grows when someone asks for more
instruments is not the thing it was protecting against. Counting the table, the tree is
4,737 lines.

The cap does not get raised twice. The next feature deletes first, or it does not land.

`SongBuilderClient.tsx` (262) is the one genuinely over budget for what it is, and the seam
is already visible: everything from `setHits` to `onClear` is *editing the song*, while the
rest is wiring hooks together and rendering. Split it there — a `useSongEdits` taking
`{ song, setSong, pack, engine, halt }` — the next time that file has to grow. Do not split
it anywhere else, and do not split it just to hit a number.

## Recipes

**Add a sound.** One `sound(...)` line in `SEED` in `lib/song-builder/styles.ts`, or a
push into the `sounds` array of an existing document in `dj_song_builder_styles`. It needs
a `voice` from `VOICE_IDS`, a `config` bag that voice understands, an `amp` and an `eq`.
The harmony role and the mix position come from `ROLE` and `PLACE` for that row unless the
entry overrides them, which is what keeps 120 entries down to the part that differs — a
`kit` sound is the usual exception, because it must name its three `pieces`.
`seed()` tops up every style document with any `SEED` id it is missing, so a new sound
reaches a database that already has documents. It never rewrites an entry that is already
there, so hand-retuning survives; deleting a seeded sound by hand does not.

**Change the shape of a sound.** Bump `SEED_VERSION`. Stored packs older than the code are
replaced wholesale on the next read, because a document written before a field existed
would fall back for every entry in it — all four kits would collapse to the same three
pieces and every row would land dead centre. That is worse than losing a hand-edit, so the
replace is the right default. Bumping it discards hand-retuning; that is the price.

**Add a drum piece.** A function in `lib/voices/drums.ts`, its id in `DRUM_PIECES`, and an
entry in the `PIECES` map. Then name it in some sound's `pieces`. Build it the way the real
drum is built — a kick is a pitch drop under a beater click, a hat is six squares through
two filters — not by re-tuning something that already exists.

**Change the groove.** `swing` and `progression` are fields on the pack, so both are
database edits. `ACCENTS` and `HUMANIZE_SECONDS` in `constants.ts` are global and apply to
every style; they are deliberately not per-pack, because "how human is it" is not a thing
one style should get more of than another.

**Retune the mix.** A row's place is `PLACE` in `styles.ts`; the desk's numbers are all in
the master-chain block of `constants.ts`. Change `BUS_TRIM` last and measure after, because
it is the one that decides whether the master chain is gluing or levelling.

**Add a row.** `TRACK_KINDS` in `types.ts`, an entry in `TRACK_META` (label, mouth cue,
colour), four sounds per style in `SEED`, and a line in `DEMO_ROWS` so the demo groove
plays it. Read the frequency-map invariant first: pick the `transpose` and the EQ slot
before you pick the name.

**Add a style.** Add it to `STYLES` in `types.ts` and add its pack to `SEED`. The selector
renders from `STYLES`, so that is the whole change.

**Add a synth engine.** A `Voice` in `lib/voices/synths.ts`, its id in `VOICE_IDS`, and an
entry in the `SYNTHS` map. Read every knob through `num(config, "name", fallback)` so a
document missing a key still plays, take `width` seriously (a mono stack is a patch, a
spread one is a sound), and decide whether it plays `note` or the whole `voicing` — that
choice is what makes it a lead or a section.

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
- per-row level, solo, audition or decode buttons; a master volume (mute is the row's name,
  and it is the only one of these that exists)
- a grid-length, root-note or scale picker — the style pack decides all three
- the `....|..!` string printed under the grid — the grid already is the rhythm
- per-row effect chains — a row's own reverb, its own delay, its own compressor. The strip
  is fixed (drive, register filter, three EQ bands, level, duck, pan) and the two effects
  are *shared buses* a row reaches through a send. That is not the same thing, and the
  difference is the whole reason the mix sounds like one room
- file upload, chopping, waveform scrubbing, an *offline* bounce — a take is recorded in
  real time off the master bus, and there is no render-faster-than-realtime path
- undo stacks, autosave, drafts, dirty-state tracking
- keeping raw audio from a *row* take — only the analysis is kept, which is what lets one
  Sensitivity slider re-read every row at once. (A sung take is audio by definition; it
  still dies on reload.)
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

`lib/wav.ts` is pure and worth a harness after any edit: check the four-character tags at
0/8/12/36, that `data size` is `frames * channels * 2`, that a third channel is folded away,
and that `+1`/`-1` come back as `32767`/`-32768`. `setInt16` truncates rather than rounds,
so `0.5` encodes as `16383` — that is correct, not a bug to "fix".

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

`lib/song-builder/harmony.ts` and `lib/dsp.ts` are pure and run straight under `npx tsx`.
What a harness over them should assert, because each of these has been wrong at least once:

- the bass only ever plays a root, a fifth or an octave, at every brightness;
- a `chord` row never leaves the chord, on any chord in the progression;
- a `lead` lands on a chord tone when `step % 4 === 0` and is free to wander otherwise;
- brighter is higher for all three roles — the contour must survive the harmony;
- `chordVoicing` never moves a chord root more than a fifth between chords, or the
  progression audibly jumps octaves;
- the impulse response is normalised, decays to near-nothing, has no NaN, and the two
  channels differ (a mono tail is not a room);
- both shaping curves are monotonic and stay inside ±1, and `driveCurve(0)` is a line.

**The sound itself must be measured in a browser, not reasoned about.** Web Audio works in
headless Chrome — it renders to a null sink, so nodes connect, params validate and a tap
reads real samples. Launch it the way the layout check below does, then use
`Page.addScriptToEvaluateOnNewDocument` to patch `AudioNode.prototype.connect` so anything
connecting to an `AudioDestinationNode` also feeds an `AnalyserNode` (and a
`ChannelSplitter` into two more, for the stereo figures). Click Play and read
`getFloatTimeDomainData` for a few seconds. What that run must show:

| figure | expected | what it means if it is wrong |
| --- | --- | --- |
| NaN samples | 0 | one bad sample poisons every filter and compressor downstream, permanently, and the studio goes silent with no error in the console |
| peak | ~0.89 | the brickwall is doing its job |
| RMS | ~0.34 | the crest factor is ~8 dB. Much higher and the master chain is levelling, not gluing — check `BUS_TRIM` |
| L/R correlation | ~0.87 | genuinely stereo and still mono-compatible. 1.0 means the panning is not reaching the output |
| tail after Stop | decays over ~1.4 s | the reverb is connected. A hard cut means the room is not in the graph |

Two regressions that run has caught and would catch again:

- **the plucked string filled with NaN.** Karplus-Strong averages each sample with the one
  before it, so the first pass reads `data[-1]` — which is `undefined`, not zero, and
  `undefined` poisons the buffer and then the whole master bus. The excitation therefore
  fills `period + 1` samples, and the recursion starts at `period + 1`.
- **the master was over-driven.** Ten rows at full tilt arrive several times over full
  scale; without `BUS_TRIM` the measured RMS was 0.56 against the same 0.89 peak — a 4 dB
  crest factor, which is a square wave wearing a mix's clothes.

Instrumenting `AudioParam.prototype.value` and the four automation methods to flag any
non-finite write is worth doing in the same run: it turns "the studio is silent" into a
stack trace pointing at the line.

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
- **pitch** — `noteFor` in `lib/song-builder/harmony.ts` is the whole mapping today, and
  it is now three rules over a chord rather than one over a scale. A model replaces the
  rules; the chord stays, because a model that ignores the progression is a model that
  cannot play with the other nine rows.
- **sound choice** — a model that picks the sound for a take writes `Track.soundId`,
  which is already just an id into the style pack.

Nothing about a user's song is stored, so training data would need a new decision, not a
new field. Do not add a telemetry path on a hunch.
