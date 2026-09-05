# Landing Cinematic — Current State

Last updated: 2026-09-05 (second pass: stutter, mob routing, rotation, frame capture)

The landing page's backdrop is a short prerecorded flyover of the real game
world, looping permanently. The page renders **none** of the game to produce it —
it consumes encoded MP4s and a WebP still, nothing else.

It ships **three** clips now and rotates between them: the primary loads alone,
and variants are fetched one at a time only after it is playing.

The live spectator pane that used to open on top of it is **parked** — built,
disabled, and kept for later. See "PARKED: the live spectator pane" below.

## What ships

| Clip | Node | Look | Size |
|---|---|---|---|
| **`t1-forest`** (primary) | `node-t1-forest-02` | green canopy, a dirt trail, foxes and wolves | 2.78 MB |
| `t1-plains` | `node-t1-plains-03` | open pale grassland, herds of boar and hare, blossom trees | 3.34 MB |
| `t1-mountain` | `node-t1-mountain-02` | cold grey stone ledges, goats and bandits | 1.72 MB |

All 1280x720 · ~14 s · CRF 26 · H.264 High / yuv420p / faststart / no audio, at
25 fps except `t1-mountain` at 18 (see "Frame rate is per clip" below). **8.09 MB
in total**, in `client/public/landing/`, committed like the packed art atlases.
Only `t1-forest.webp` (245 KB) ships as a poster — the variants never need one,
because the poster is long gone by the time a rotation happens.

The roster and the play order live in `client/src/auth/landingClips.ts`. Trimming
the rotation is an edit to that list; the primary is its first entry.

Regenerate with:

```bash
pnpm dev:server        # must be up, with AUTH_DEV_BYPASS (it is in .env)
pnpm dev:client
pnpm landing:capture --clip=t1-forest
```

**Changing the primary** means three edits, not one: the first entry of
`LANDING_CLIPS`, `LANDING_POSTER_SRC`, and the hardcoded background URL of
`#landing-poster` in `client/index.html`. They must agree, or the pre-JS still
and the clip's first frame differ and the handoff visibly jumps.

## Layering on the landing page

Bottom to top:

1. **Two `<video>` elements + a poster** (`client/src/auth/LandingCinematic.tsx`) —
   mounted as a sibling *before* `.auth-gate` inside `#auth-gate`. Never inside
   `#game-wrapper`: the spectator CSS rule (`html[data-spectator]`) hides every
   `div` child of the wrapper. Two players, not one, so a rotation is a crossfade
   between a live element and one that has already buffered — never a reload.
2. **Landing gradient vignette** (`.auth-gate--landing`) — the existing backdrop that
   keeps the login panel readable. It paints over the video as a later sibling.
3. **Login panel** — left-anchored.

There is no fourth layer today: the landing page boots no Phaser game, so
`#game-wrapper` is empty and invisible.

The cinematic element is itself three layers — two stacked players with the
poster still over them — so the poster can be held until the clip is genuinely
ready and then dissolved (see Load order below). Exactly one player carries
`--live`; the class moving between them *is* the crossfade.

Before any of that there is one more layer: `#landing-poster` in
`client/index.html`, a fixed div whose CSS background is the same WebP. It paints
from static HTML before a line of application JS runs, and `AuthGate` removes it
on mount — by which point the component's own poster layer is showing the
identical, already-decoded image, so the swap is invisible.

### Load order

- Poster: immediate, from static HTML. Measured first-contentful-paint in a
  production build is **~400 ms**.
- Video: `preload="auto"`, with `src` set on a `setTimeout(0)` after React mounts
  so the download never competes with first paint. **Not**
  `requestAnimationFrame`: rAF only runs while the page is producing frames, so a
  backgrounded or occluded tab can leave the callback pending forever — which
  showed up as a landing page that silently never loaded its video at all. React
  setting `src` also does not restart a media element's resource selection, so an
  explicit `load()` follows.
- The poster is a real layer, **not** the `<video poster>` attribute. That
  attribute swaps the instant playback starts, which is both abrupt and too
  early — a browser will happily start a clip it cannot play through. The layer
  is held until a contiguous buffered range covers the whole duration, then
  dissolved over 500 ms.
- Readiness is measured in **bytes buffered**, not
  `readyState === HAVE_ENOUGH_DATA`. That flag is Chromium's *estimate* that
  playback can finish; on a slow link it stays at HAVE_FUTURE_DATA even once the
  entire file has arrived, which would leave the poster up over a ready clip.
- Skipped entirely on `prefers-reduced-motion: reduce`, `connection.saveData`, or
  an `effectiveType` of `2g`/`slow-2g`. The poster alone is a complete experience.
- `muted` + `playsinline` + `loop`. Playback is started explicitly once buffered,
  and a refused autoplay (iOS Low Power Mode refuses even muted playback) is not
  an error state — the poster simply stays.

### Rotation

Strictly sequential, and that is the whole design.

- The **primary is alone on the critical path.** A variant is requested only once
  the primary is on screen, and then only after a further 4 s. One variant is in
  flight at a time. A visitor who logs straight in downloads one clip, not 21 MB.
  This ordering is not a guess: when the landing page fetched its video alongside
  the game's own asset set, the two competed for the same connection pool and the
  clip took 71-83 s to buffer instead of 200 ms.
- A variant is only shown once it is **buffered through**, by the same byte-level
  check the primary uses, and the handoff waits for the outgoing clip to reach
  the last 900 ms of its loop — so every clip is seen whole. A variant that never
  buffers is simply never shown; the current clip keeps looping.
- After a handoff the outgoing element's `src` is dropped and reloaded, so a long
  visit does not accumulate five decoded clips in memory.
- The order is **primary first, variants shuffled**. A fixed order would spend
  the bandwidth on the second clip without ever showing anyone the fourth.
- All of it is behind the same `shouldSkipVideo()` gate as the primary: reduced
  motion, `saveData` and 2g get the poster and nothing else.

### Measured start-up

`pnpm landing:verify --block-live` blocks the socket so the prerecorded layer can
be measured as a delivery question rather than a race against the spectator.

| | first paint (FCP) | poster → buffered clip | stalls |
|---|---|---|---|
| Production build, `express.static` | ~400 ms | 6.4–7.1 s | none |
| Vite dev over the Docker bind mount | 2.5–3.8 s | 71–83 s | none |

The dev figures are a development-machine artifact, not delivery behaviour: the
clip trickles in at roughly 0.12 s of video per second of wall clock while the
game's own asset preload saturates the connection pool. In the production build
the whole clip arrives in about 200 ms. Neither case ever stalls once playing,
because the poster is held until the clip is complete.

These were measured against a 4.1 MB primary. The primary is 2.78 MB now, so the
poster-to-clip figures should be read as an upper bound rather than re-measured
truth — and they cover the PRIMARY only, which is the only clip a visitor waits
on.

## The stutter, and what it actually was

The first pass shipped a clip that visibly juddered. The suspicion at the time
was the encoder. **It was not**, and the encoder settings were never the problem:
measuring per-frame horizontal displacement (SAD over a cropped band, in the
scratchpad) shows the shipped clip panning cleanly at ~11 px/frame with, roughly
every 8-14 frames, **one frame of zero displacement followed by one of double**.
That reads as a lurch, and no CRF affects it.

The same pattern is present in Playwright's **raw recording**, which settles the
question. Three measurements pinned it down:

1. The raw WebM is strict CFR — every inter-frame gap is exactly 40 ms. So
   ffmpeg's `fps=25` filter resamples nothing and cannot be the cause.
2. The staged scene paints at about **23 fps**, under the recorder's 25 fps grid.
   The recorder emits a frame per slot regardless, so ~2 slots a second are the
   previous frame shown again.
3. The camera advanced by each frame's REAL delta. A frame arriving late carried
   its extra milliseconds into the camera, and the next grid slot sampled it a
   double step further on.

Three changes fix it, and each is small:

- **The game is capped to the capture frame rate** (`fps: { limit }` in
  `main.ts`, from `cinematicRenderFps()`), so the render cadence matches the
  recorder's instead of free-running against it.
- **The camera steps once per rendered frame**, a fixed `frameStepMs`, never a
  real delta. A late frame now costs a repeat, never a lurch.
- **Repeats are dropped at encode time** and the survivors re-timed onto an even
  grid, so one rendered frame is one output frame is one camera step.

Measured afterwards on the same shot: the displacement series is a clean ease
(-4 → -11 → -4) with the authored holds as exact 22-frame runs of zero, and two
residual double-steps in 320 frames instead of about thirty. The residue is a
paint the recorder never captured at all, which cannot be recovered without
re-rendering.

### Detecting a repeat is the subtle part

`mpdecimate` cannot do it. The raw recording is VP8, so a repeated frame is
re-encoded to slightly different pixels each time; thresholds loose enough to
catch that are loose enough to eat the path's authored holds, where the camera is
deliberately still.

The discriminator is **run length, not magnitude**. On a 320x180 grey downscale
the mean absolute frame difference separates cleanly — a moving frame scores
4-15, a repeat scores under 1 — but a hold scores just as low as a repeat. A
repeat is one or two isolated frames; a hold is twenty-odd consecutive ones. So
the pass drops a still frame only when it is part of a run of at most two.

This holds only while the render rate is CLOSE to the capture rate. At a wide
1920x1080 viewport the software renderer manages ~10 fps, repeats arrive in runs
of three, and the detector correctly refuses to treat them as repeats — leaving
the padding in. The rule is therefore: **do not capture at a viewport the
renderer cannot keep near the capture fps.**

### What was tried and rejected

- **Hardware GL in headless Chromium** (`--use-angle=gl --enable-gpu`,
  behind `--gpu`) measured *slower* than the SwiftShader default here: the path
  took 16.8 s instead of 15.0 s. The flag is kept, defaulted off.
- **A headed browser**, hoping for a real GPU, never reached ready at all within
  15 minutes.
- **Widening the shot** to 1920x1080 and downscaling: 2.25x the world in frame,
  but the renderer drops to ~10 fps and the world plays back a third too fast.
  The `--out-width`/`--out-height` split that supports it is kept and works; it
  is the render rate, not the pipeline, that rules it out on this machine.

## Why the frames come from CDP, not Playwright's recorder

The second complaint after the stutter was that the picture went **soft while the
camera moved and looked fine when it was still**, even with monsters moving. That
is the signature of a bitrate-starved master, and it was.

Playwright's `recordVideo` writes VP8 at about **1.29 Mbps**. A static frame costs
that encoder almost nothing; a full-frame pan gives every macroblock a motion
vector and a residual at once, and 1.29 Mbps cannot pay for it. So the master
itself was soft in motion, and nothing downstream could recover it.

Measured rather than assumed. Re-encoding one VP8 take at **CRF 10 / 14 Mbps**
was indistinguishable from CRF 26 / 2.6 Mbps — moving-frame sharpness 29.71
against 29.28. When five times the bitrate buys 1.4%, the bits are not the
constraint; the source is.

Frames now come from CDP `Page.startScreencast` — one JPEG (quality 95) per
composited paint, acknowledged one at a time — and Playwright's video recorder is
not used at all. Results on the same shot:

| | moving/still sharpness | note |
|---|---|---|
| VP8 recorder | 0.947 | visibly soft in motion |
| CDP screencast | **0.998** | motion-specific softness gone |

Three consequences worth knowing:

- **CRF 26 is still transparent**, now against a sharp master: 33.80 at CRF 26
  versus 33.89 at CRF 14, for a ninth of the size. The doc's original encode
  sweep survives the change.
- **The payload got SMALLER**: 21 MB to 10.4 MB across five clips. VP8's own
  blocking and ringing were high-frequency noise that H.264 then had to spend
  bits reproducing. Removing a lossy generation is cheaper than compressing it.
- **Repeated frames essentially vanished** — 6 per take instead of ~106 — because
  a screencast frame is a paint rather than a slot on a fixed grid. The dedup
  pass is kept as a guard, and a run reporting zero repeats is the healthy case.

Frame format is `--frame-format` / `--frame-quality`. JPEG 95 is the default and
**lower is worse in both directions**: quality 80 did not raise the render rate
(18.8-20.1 fps across the whole range — the paint is the bottleneck, not the JPEG
encode) and inflated the final encode to 8.9 MB by giving H.264 ringing artifacts
to reproduce. PNG is available and lossless, but costs Chromium more per frame,
and a paint the screencast cannot keep up with is a LOST CAMERA STEP — the
stutter, back again.

### Collecting every paint: the screencast is a sampler

`Page.screencast` does **not** hand over one message per painted frame. It grabs
whatever surface is current when it is ready to send the next one, and a paint
that finishes while no acknowledgement is outstanding is dropped rather than
queued. Because the cinematic camera advances one fixed step per RENDERED frame,
a dropped paint is a dropped CAMERA STEP — it lands in the finished clip as a
double or triple jump.

This shipped broken once and is worth recognising by its signature: **a stutter
one to two seconds into a clip, on some biomes and not others.** Early in the
path the camera is still easing in at 2-4 px/frame, so a missing step doubles a
small number and is obvious; by mid-clip it is one frame in eight and reads as
nothing. Which clips were affected looked like a rendering property of the biome
and was not — it was simply which captures happened to lose paints.

Two changes fixed it:

- **The frame handler does the least possible work.** It keeps the payload as the
  base64 string it arrived as, acknowledges, and returns. No decode, no disk —
  frames are written after the take. 400 frames is about 130 MB of strings, which
  is nothing next to losing them. Acking *before* the write, with the write still
  in the handler, was measured and was NOT enough: forest still lost 30 of 395.
- **The camera counts its own steps** (`beacon.frames`) and the driver compares
  that against the frames it collected. One step, one frame; any shortfall is
  reported as `LOST n of m painted frames`.

The check matters more than the fix, because the fix is not absolute: a single
frame still goes missing perhaps one run in three. It is now visible instead of
silent, and a re-run clears it. **Do not ship a clip whose capture reported a
loss.** If losses persist, lower `--fps` until they stop — the collector cannot
keep up with the paint rate.

Verification is a per-frame displacement measurement (projection matching on both
axes — a thin-band horizontal search silently produces garbage on a diagonal path
or a periodic ground). All five shipped clips now give the identical monotone
ramp, 2 px/frame rising to 8, which is what a deterministic camera on a fixed
path length is supposed to produce.

### Frame rate is per clip

The camera is always exact: it steps once per rendered frame by construction. The
WORLD is not — it was filmed in real time and is laid on the output grid, so a
page painting under the capture rate plays its monsters back fast.

Most nodes paint 18-21 fps against `--fps=25`, so their world runs 1.2-1.4x. That
is not visible on wandering idle animations, and 25 fps of camera motion is worth
more than exact monster timing. `node-t1-mountain-02` is the exception: its ledge
tilemap paints at only 14.9 fps, which put the world at **1.68x** and made the
goats visibly scurry, so it is captured with `--fps=18` and ships at 18 fps.

The capture prints the ratio and the `--fps` that would make it 1.0x whenever it
is more than 5% off. Trading frame rate for world fidelity is a per-clip
judgement, so it is a flag rather than a default.

## The other bug: capture recorded a black screen

Worth knowing because it will recur. `suppressCinematicChrome()` sets
`data-spectator` to reuse the spectator rule that hides the sidebars and overlay
divs. The parked spectator PANE rules key off the same attribute, and they shrink
`#game-wrapper` and hold it at `opacity: 0` until `data-spectator-ready` — which a
capture never sets. Every recording came out a flat `#050510`, the body colour,
while the beacon cheerfully reported the node painted with 41 monsters in it.

The pane rules are now scoped `:not([data-cinematic])`. If capture ever goes
black again, look at what else keys off `data-spectator`.

## PARKED: the live spectator pane

**Status 2026-09-05: built, then disabled. Kept in the codebase to finish later.**

The landing page today is the prerecorded backdrop, the poster and the login
panel. Nothing else. A visitor with no credential boots **no Phaser game and no
socket** (`isLandingOnlySession` in `client/src/net/session.ts`), so the pane
never appears.

### Why it was parked

The pane rendered **black**. The frame, border, `LIVE — <name>` label, reveal
timing and the readiness gate were all correct — but no world was visible inside
the frame. It also could not be interacted with.

**Leading hypothesis, UNTESTED:** Phaser's `Scale.RESIZE` mode re-measures its
parent on a *window* resize, not on the parent element changing size. The pane is
created by shrinking `#game-wrapper` from CSS after boot, so the canvas may stay
at its original full-window size while the wrapper clips it. The first thing to
try is a `ResizeObserver` on the wrapper calling `game.scale.refresh()`.

This was not confirmed — the work was stopped before the diagnosis finished, in
favour of polishing the video. Treat the hypothesis as a lead, not an answer.

### The park is also a win worth keeping

Disabling it made the landing page much lighter, which is what the feature was
for in the first place. A visitor now downloads the video and nothing else,
instead of the video **and** the entire game asset set — which were measured
competing for the same connection pool, and were the reason the clip took 71–83 s
to buffer in dev.

### What is kept, and where

Nothing was deleted. All of it works as written; it simply is not reached.

| Piece | State |
|---|---|
| `client/src/scenes/game/spectatorReady.ts` | intact — the six-condition, 8-frame readiness gate |
| `spectatorVisualReadyAtom` + `data-spectator-ready` in `lobbyState.ts` | intact |
| `html[data-spectator] #game-wrapper` rules in `authGate.css` | intact, marked DEAD RULES |
| The two-pass deferred spectator asset load in `sceneSetup.ts` | intact and still worth having |
| The Clearing-fallback removal (server) | **kept and live** — see below |
| `pnpm landing:verify --with-player` | intact; parks a real character so the pane can be tested |

### Still to resolve before re-enabling

1. **The black pane.** Above.
2. **Frame shape.** It was a 16:9 box anchored to the right edge. It should
   instead complement the login panel — matching its height and roughly its
   proportions, so the two read as a pair. Deriving the panel's box with a
   `ResizeObserver` into CSS variables is the robust way to keep them aligned
   across viewport sizes.
3. **Peek space.** The gameplay camera may look half a view past a node edge
   (`peekSceneBounds`) and pins there within 80 px of the boundary, so a watched
   player standing at an entrance fills part of the frame with unpainted
   neighbour space. Pre-existing spectator behaviour, far more noticeable in a
   small frame.
4. **Idle pause.** After ten minutes the stream pauses and the pane would freeze
   on its last frame rather than closing.

### The Clearing fallback removal is NOT parked

This shipped and is live. `SpectateStatus.mode` is `"player" | "idle"`, `nodeId`
is optional, an idle viewer receives no snapshots, and the Clearing is never
thawed on a spectator's behalf — the manager's thaw lease is gone.

It was the feature's only server change. `server/test/spectatorManager.test.ts`
covers it and was mutation-checked by restoring the fallback node and confirming
the suite fails.

It stands on its own merits regardless of the pane: pointing idle viewers at an
empty stone circle was a worse first impression than showing nothing, and it also
consumed a thawed node to do it.

## Capture mode

Dev-only, gated on `DEV_TOOLS_ENABLED`. **Nothing here runs in production or for a
visitor** — the landing page consumes the encoded video, never a live render.

`?cinematic=<clipId>` runs an authored clip; `?cinematicNode=<id>&cinematicAt=x,y[,zoom]`
parks the camera for scouting.

The capture session is an **authenticated dev session, not a spectator session**.
A spectator cannot choose its node (the server picks the target) and cannot hold a
node thawed — `onNodeOccupancyChange` freezes a node the instant occupancy hits
zero and destroys every monster in it. So the run needs a real character standing
in the filmed node.

Staging is entirely existing dev intents — **no server or shared-protocol change**:

1. `debug:equipPhaseTester` — the anchor is immortal before anything can reach it.
2. `debug:teleportToNode` — thaws the node and spawns its population.
3. `debug:respawnNode` — a full, freshly placed roster, then a 2.5 s settle.

The anchor lands at `rightmostEntranceTarget` (x ≈ 4770 in `node-t1-forest-02`),
far outside the camera's range on the authored path, and is hidden client-side
along with every label, bar, marker and minimap.

| File | Role |
|---|---|
| `client/src/scenes/game/cinematic/clips.ts` | the clip table — data only |
| `client/src/scenes/game/cinematic/mode.ts` | URL resolution, clip validation, the `window.__cinematic` beacon |
| `client/src/scenes/game/cinematic/camera.ts` | arc-length path player, holds, one global `easeInOutSine`, fixed per-frame stepping |
| `client/src/scenes/game/cinematic/route.ts` | picks the shot from the live monster positions |
| `client/src/scenes/game/cinematic/staging.ts` | the debug-intent sequence |
| `client/src/scenes/game/cinematic/suppress.ts` | per-frame overlay and anchor hiding |
| `tools/landing/capture.ts` | Playwright driver + ffmpeg encode |
| `tools/landing/verify.ts` | screenshots the real landing page through its layers |
| `tools/landing/session.ts` | cached anchor guest credential |

### Camera

Deliberately not a general cinematic engine: a polyline through node space, an
optional hold per waypoint, one global ease. **No zoom in clips** (anything below
1 softens linear-filtered pixel art; the scout hook has zoom purely as a survey
affordance), no per-waypoint easing (it makes a slow drift stutter), no target
tracking (monster positions differ every capture).

The path advances **one fixed step per rendered frame**, not by the frame's real
delta — see "The stutter" above. The game is capped to the capture frame rate to
match, so a step is a real 1/25 s and the clip runs at its authored length.

Clips are validated at boot (`validateClip`): the node must exist in `NODE_BIOMES`
and every waypoint must be inside the node, or the run refuses rather than filming
a silently clamped shot.

### Where the shot points: population routing

The framing problem is arithmetic, not taste. A zoom-1 frame is 1280x720 of a
4800-square node — about **4%** of it — and a Tier-1 node holds 17-52 monsters
spread roughly uniformly. So an arbitrary frame averages one or two creatures,
and the first shipped clip had **none at all in three of four sampled frames**.
It read as forest wallpaper rather than a world with things living in it.

Routing cannot be authored, because monsters wander: a census taken minutes apart
puts the densest frame in a different quarter of the node each time. So the path
is chosen **at capture time, from the live roster**, once the node is staged and
stable and immediately before the driver is told to roll.

`planPopulationRoute` scores candidate paths and takes the best:

- Candidates are **straight lines** — 9x9 start points, 8 compass directions, a
  fixed 1700 px length. A cluster-hopping polyline frames more monsters but looks
  like a camera hunting for them; smoothness is a constraint here, not a
  trade-off.
- A monster's value falls off toward the frame edge, so a creature crossing the
  middle of the shot outscores one clipping a corner for two frames.
- Candidates whose end lands near a node edge are **rejected, not clamped**: a
  clamped path is a shorter path than the one being scored, and would win on a
  technicality — and the camera's peek clamp would stop it moving mid-shot.
- The two richest interior waypoints get the holds.
- With no monsters at all it returns null and the clip's authored fallback path
  is used, so a clip always produces footage.

Measured effect on the forest: every sampled frame now holds one to three foxes
or wolves, against zero to one before. On plains (52 monsters) it finds herds of
four to six.

**Known trade-off, unresolved:** monsters cannot stand where trees are, so
maximising monsters biases the shot toward open ground and away from the canopy
density that made the forest attractive in the first place. The scorer knows
nothing about scenery. If a future pass wants both, scenery has to enter the
score.

### The monster census

`pnpm landing:capture --scout=<node>` prints a grid of monsters per camera frame
and the single densest frame in the node, and parks there by default rather than
at the node centre. It exists because the mistake this pipeline kept making was
authoring against a mental image of the biome and filming empty ground. Each cell
is one frame's worth of node, so a digit *is* the monster count a shot parked
there would hold.

Measured Tier-1 populations (the `swarming` node of each biome): plains 52,
forest 40, mountain 26, swamp 22, cave 17.

## Tooling notes that matter

- **Persistent browser profile** (`.landing/profile`). Capture mode uses the full
  non-spectator preload, and `create()` does not run until it drains. Through the
  Docker bind mount on Windows the multi-megabyte biome PNGs take **~3 minutes**
  on a cold cache and **~10 s** warm. Without a persisted HTTP cache, iterating on
  a clip would be unusable.
- **`take.json` + `--reencode`.** The browser leg writes what it produced beside
  the raw recording, so an encode experiment replays it in seconds instead of
  re-driving the browser. The whole encode sweep below was run this way.
- **Scouting** takes many stills from one already-staged session
  (`--at="x,y;x,y,zoom;…"`), because a cold boot costs minutes and node
  comparison needs a lot of frames.
- **The take is bounded by wall clock**, using each screencast frame's own
  timestamp. True frame determinism is impossible — world state arrives over a
  socket at 5 Hz in real time, so the render clock cannot be stepped
  independently. Collection starts on the same `ready` signal that starts the
  camera, so there is no pre-roll to trim past; only frames still in flight when
  the screencast is stopped are cut, and they are cut by timestamp rather than by
  guessing how many were queued.
- **`pnpm landing:clean`** sweeps the scratch. Everything under `.landing/` is
  regenerable, but not all of it is CHEAP to regenerate: the default pass keeps
  the two browser profiles' HTTP caches (a cold profile costs a ~3 minute boot)
  and takes everything else. `--all` drops the caches too.
- **Loop seam.** The tail is folded over the head with `xfade`
  (`body = take[F..T]`, `pre = take[0..F]`, offset `T-2F`), which costs F seconds
  of runtime. The test is NOT that the last frame matches the first — the camera
  is drifting, so it cannot — but that the wrap costs no more than an ordinary
  frame step. Measured on the shipped forest clip: 20.65 mean absolute difference
  across the seam against 19.32 for a normal frame-to-frame step at the same
  point. The loop wrap is one frame of motion, like every other frame.

## Measured encode findings

Two facts about the SOURCE dominate everything else, and both were discovered by
probing the raw recording rather than assuming:

- Playwright's recorder produced **VP8 at ~1.29 Mbps** — the master was already
  heavily compressed, so output bitrate above ~3 Mbps was largely spent
  reproducing VP8's own artifacts. That was the real quality ceiling, and it is
  why the recorder is no longer used at all: see "Why the frames come from CDP"
  above. The CRF findings below still hold against the new master, but the
  absolute sizes were measured on the old one.
- It records at **25 fps**, not 30. The pipeline now encodes at 25 to match. The
  earlier `fps=30` filter was duplicating frames: no extra smoothness, more bytes,
  and timing-dependent resampling decisions that made SSIM against a separately
  built reference meaningless (it read 0.87 where the 1:1 mapping reads 0.95).

With that fixed, all measurements below are 1280x720 @ 25 fps from one take,
scored against a lossless FFV1 reference built through the identical filtergraph:

| CRF | Size | Bitrate | SSIM (Y) |
|---|---|---|---|
| 25 | 5.60 MB | 3.80 Mbps | 0.9659 |
| **26 (shipped)** | **4.94 MB** | **3.35 Mbps** | **0.9597** |
| 27 | 4.36 MB | 2.96 Mbps | 0.9527 |
| 28 | 3.82 MB | 2.60 Mbps | 0.9441 |
| 30 (previously shipped) | 2.88 MB | 1.96 Mbps | 0.9209 |

CRF 30 visibly smears the forest ground stipple into mush while leaving the trees
almost unchanged; 26 restores it and lands within 0.6% SSIM of CRF 25 for 0.66 MB
less. Above 26 the curve flattens hard — 26 to 25 buys 0.006 SSIM for +13% size.

Three things that did **not** work, each tested rather than assumed:

- **Denoise is a rounding error.** `hqdn3d` at strength 2, 6 and 10 all landed
  within 2% of no denoise. The cost is genuine detail plus continuous global
  motion, not source noise. Removed from the pipeline.
- **Lower frame rate makes it worse.** Resampling 25 to 24 fps came out *larger*
  than 25 to 30: a constant pan means fewer frames each carry more displacement.
- **Lower resolution is less efficient than a higher CRF.** 960x540 at CRF 24 is
  3.91 MB against 1280x720 at CRF 30 for 2.41 MB — downscaled pixel art becomes
  *more* high-frequency, not less. 720p is also 1:1 with world pixels at the
  desktop camera zoom of exactly 1, so the source frame is resample-free.

The poster is **245 KB**, not the 40-80 KB the investigation guessed; WebP does no
better on this content than H.264 does. Quality 40 only reaches 148 KB and
visibly degrades.

## The clips

Three ship. Five were captured, one per Tier-1 biome, all shot in that biome's
**`swarming`** node — the modifier raises the roster, and density is the single
biggest lever on whether a frame has anything alive in it.

They are deliberately identical in shape: 14 s of travel over 1700 px with two
900 ms holds, population-routed. The variable under test is the BIOME, so
everything else is held constant. 1700 px over 14 s is about **half** the speed of
the original `world-drift`; a slower drift reads as a flyover rather than a pan,
and leaves a creature in frame long enough to be seen.

| Id | Ships | Reads as |
|---|---|---|
| `t1-forest` | yes, primary | layered canopy, a winding dirt trail, foxes and wolves — the best balance of scenery and life |
| `t1-plains` | yes | herds of boar and hare under blossom trees; by far the most *alive*, though a pale flat ground |
| `t1-mountain` | yes | pale stone ledges over cold grey, goats and bandits; the strongest graphic shapes |
| `t1-cave` | **cut** | glowing golems on near-black rock: atmospheric, but reads as a near-black rectangle |
| `t1-swamp` | **cut** | still olive pools and toads: flat and low-contrast, the weakest of the five |

Cave and swamp were cut after reviewing all five side by side. It is not a
pipeline problem and not fixable by re-capturing — they hold the fewest monsters
(17 and 22, under one per frame at zoom 1) and carry the least structure. Both
are still authored in `clips.ts`, so restoring either is a capture and a line in
`landingClips.ts`. Cutting them took the payload from 10.7 MB to 8.09 MB.

`world-drift` (`node-t1-forest-02`, authored waypoints, 12 s) is kept in
`CINEMATIC_CLIPS` as the hand-authored reference the routed clips are compared
against. It is no longer shipped.

Two framing lessons from authoring it by hand, both still true:

1. A zoom-1 frame is only ~1/14 of a 4800² node. Trees are ~385 world px wide, so
   a frame fits about three across — waypoints must be placed against actual
   feature positions, not a mental image of the node.
2. The node's trees sit in two rows about 700 px apart, which is one full frame
   height. A path along the gap between them puts trunks at the frame edges and
   nothing in the middle.

### Cost is content, not settings

At the same CRF 26 the five captured clips span 2.9x, entirely because of how
much high-frequency detail their ground carries — plains 3.34 MB against swamp
1.15 MB. On the old VP8 master the spread was 3.3x over roughly double the
absolute sizes. Choosing the biome is still a bigger lever on page weight than
any encoder setting.

Sparse biomes also need tighter paths: tundra and cave both look striking in
close-up but leave large empty areas at a zoom-1 frame.

## Other candidates

Kept in `CINEMATIC_CANDIDATES` as capture inputs, not delivery. Regenerate any
with `pnpm landing:capture --clip=<id> --out=.landing/candidates`.

| Id | Node | Look |
|---|---|---|
| `jungle-thicket` | `node-t2-jungle-02` | near-black ground under vivid fern rosettes; the richest texture captured |
| `tundra-lakes` | `node-t3-tundra-02` | pale blue-white snow, frozen lakes as large flat shapes, a frost bear |
| `cave-glow` | `node-t2-cave-03` | dark teal cavern, stalagmites, glowing creatures as bright emissive accents |

## Deliberately not built

Boss capture, camera zoom in clips, per-monster target tracking, multiple codec
variants, CI regeneration, object storage / Git LFS.

## No entry in `pnpm test`

The clip table, the router and the player all live in `client/src`, and
`scripts/run-tests.mjs` only discovers `server/test`, `shared/src` and `bot/src` —
a client test would either violate the package boundaries or need the runner
changed. `planPopulationRoute` is a pure function and would be trivial to test if
the runner ever reaches the client.

The guards that exist are `validateClip` at session resolution, which refuses the
run and prints the offending waypoint (mutation-checked by pushing a waypoint out
of bounds and confirming the run aborts), and `pnpm landing:verify --rotation`,
which drives the real landing page and reports the clip it rotated to.

## Open decisions

- **Asset home.** `client/public/landing/` is simplest and needs no
  infrastructure, but the rotation took the committed payload from 4.3 MB to
  **8.09 MB**, and every regeneration of any clip lands another copy in git
  history. Much less pressing than it looked — dropping the VP8 generation
  roughly halved it, and cutting two clips took another 2.6 MB — but three files
  still churn. Object storage or Git LFS is the real answer. (Decision D1.)
- **Scenery vs. population in the router.** The scorer maximises monsters, which
  biases away from trees. See "Where the shot points" above.
- **Pane camera and peek space.** See "Known: the pane can show peek space"
  above. Clamping the spectator camera to the node footprint would remove it, at
  the cost of changing live spectator behaviour beyond the landing page.
- **Idle pause.** After ten minutes the stream pauses and the pane freezes on its
  last frame. It is not closed. Closing it (or dimming it) on pause may read
  better than a frozen window; no evidence yet either way.
- **Whether a player should appear.** The shipped clip has none. A distant
  adventurer walking through frame would read as more MMO; it needs a side-by-side
  comparison to judge.

## Primary seams

- Landing composition: `client/src/auth/AuthGate.tsx`, `LandingCinematic.tsx`,
  `landingClips.ts` (the roster and play order), `authGate.css`,
  `client/index.html`
- Readiness: `client/src/scenes/game/spectatorReady.ts`,
  `spectatorVisualReadyAtom` in `client/src/auth/lobbyState.ts`
- Capture mode: `client/src/scenes/game/cinematic/` (`route.ts` chooses the shot)
- Render cadence for a capture: `fps.limit` in `client/src/main.ts`
- Tooling: `tools/landing/`
- Related: [spectator-landing-current-state.md](spectator-landing-current-state.md)
