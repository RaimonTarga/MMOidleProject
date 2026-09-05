# Landing Cinematic Background — Feasibility and Design Brief

> **ARCHIVED — implemented 2026-09-05; live state in
> [`docs/landing-cinematic-current-state.md`](../../landing-cinematic-current-state.md).**
> Kept for its rationale and its options comparison. Several of its estimates
> were measured wrong in practice — notably the bitrate budget (CRF 23 costs
> ~3.9 Mbps, not 1.2–2.5), the poster size, and the assumption that the spectator
> deferred-asset pass could gate the handoff as a single batch. The current-state
> doc records what was actually measured.

**Investigation as written, 2026-09-05 (superseded).**
Verified against `develop` at `647144ea`. Where this brief and the code disagree, the code wins.

Published copy: <https://claude.ai/code/artifact/a93d3e07-6661-460f-8ba8-2bf693dc122e>

---

## 0. Verdict

**Feasible, and cheaply.** The existing game scene already does almost everything a
capture mode needs. The spectator path proves the client can boot with no HUD, no
input, no audio and no player of its own; the dev `debug:teleportToNode` intent
already puts an authenticated session in any node on demand.

The genuinely new code is:

- one camera-path module in the client (~120 lines),
- one dev-only URL flag,
- one capture script wrapping the Playwright that is already a root devDependency.

**No server change. No shared-protocol change. No new runtime dependency.**

Two calls are needed from the designer before implementation: where the encoded
clips live (§11 D1), and what happens when a working spectator breaks (§11 D2).

---

## 1. How the landing / spectator / render stack works today

### 1.1 The landing screen is not a separate page

`client/index.html` always boots the full Phaser game plus every React HUD root.
`client/src/auth/AuthGate.tsx` renders an overlay on top of it. When there is no
session token, `client/src/auth/lobbyState.ts:25` stamps
`document.documentElement.dataset.spectator = 'true'`, and one rule in
`client/src/auth/authGate.css:43-46` hides both sidebars and **every `div` child of
`#game-wrapper`** — leaving the bare Phaser canvas behind a translucent login panel.

> **Trap.** That rule targets `div` children specifically. Anything new mounted
> inside `#game-wrapper` as a `div` disappears in spectator mode. This is why the
> video element belongs in `#auth-gate` (§7), not in the wrapper.

### 1.2 The world is genuinely on show

`.auth-gate--landing` uses `place-items: center start` and a left-to-right gradient
that is fully transparent past ~51% of the width. **The right half of the screen is
unobscured live world.** Whatever replaces it has to hold up at full brightness —
this is not a background that can hide behind a scrim.

### 1.3 Spectator boot is deliberately slim, and it shows

`preloadGameAssets` (`client/src/scenes/game/sceneSetup.ts:387`) queues only the
sprite atlas and `shadows.json` for spectators. `startDeferredSpectatorAssets`
(`:435`) then streams biomes, trees, effects, emotes and decor **after** `create()`
has already run. Until that lands, a node paints as a flat biome fill.

That window — canvas alive, world not yet dressed — is exactly what the prerecorded
video exists to cover.

### 1.4 The camera has one behaviour and no free mode

`updateGameScene` (`sceneSetup.ts:560`) recomputes camera scroll every frame from a
single `base`:

- the own player (`getOwnBase`), or
- the pinned spectator target's interpolation base, or
- the node centre as fallback,

through `computeCameraScroll` and a lerp. There is no detached camera, no waypoint
system, no cinematic hook.

Zoom is viewport-derived (`client/src/render/cameraZoom.ts`): **exactly `1` on
desktop**, below `1` only under the mobile breakpoint.

### 1.5 An empty node has no monsters

`onNodeOccupancyChange` in `server/src/world/nodeLifecycle.ts` freezes a node the
moment occupancy drops to zero, destroying every monster in it. A capture therefore
needs a **real player entity standing in the node for the whole clip**. The
spectator manager works around this for the Clearing with an explicit thaw lease;
nothing equivalent exists for arbitrary nodes.

### 1.6 Dev staging affordances already exist

`server/src/net/playerHandlers.ts` registers, all skipped in production:

| Intent | Line | Effect |
|---|---|---|
| `debug:teleportToNode` | `:577` | any node id, **no tier gate** |
| `debug:respawnNode` | `:619` | regenerate the node's monsters |
| `debug:equipPhaseTester` | `:627` | godmode weapon + armor |

Together these are a complete scene-staging API.

### 1.7 Playwright is already here

`playwright ^1.62` is a root devDependency and `tools/uishot/shot.ts` is a working
Chromium driver with viewport control, console-error capture and a `pnpm ui:shot`
script. A capture tool is a sibling of that file, not a new dependency.

### 1.8 The render fact that shapes the video targets

The game does **not** set Phaser's global `pixelArt` flag. Sprites are pixel-art
source drawn 1:1 with default linear filtering; `cam.roundPixels = true` only snaps
scroll to whole pixels (a Wang-seam fix — see the comment at `sceneSetup.ts:470`).

So the canvas is **not** crisp integer-scaled pixel art. A naive "capture small,
nearest-neighbour upscale" reads as blur, not as retro. See §6.

---

## 2. What can be reused

Every capability the brief asks for already has a seam. The only red row is the camera.

| Capture-mode requirement | Status | Existing seam |
|---|---|---|
| Enter a chosen node | exists | `debug:teleportToNode` — dev-only, unrestricted |
| Load that node's environment | exists | `instantReskinNode` → `paintActiveNode` + `rebuildNeighborLayer` |
| Suppress HUD / React roots | exists | the `data-spectator` CSS rule; reuse the attribute directly |
| Suppress player controls | exists | the five `scene.spectatorMode ? () => {} : attach…` guards (`sceneSetup.ts:499-503`) |
| Suppress audio | exists | `scene.sound.mute` + skipped `initAudio` (`:460`) |
| Hide the anchor player | trivial | `state.sprite.get(ownId).setVisible(false)` |
| Hide nameplates / HP bars / telegraphs | trivial | skip the `drawLabels` / `drawHealthBars` / `drawCooldownBars` calls |
| Spawn / refresh monsters | exists | `debug:respawnNode` |
| Keep the node thawed | exists | the anchor player's own occupancy |
| Survive while filming | exists | `debug:equipPhaseTester` |
| **Detach the camera from a player** | **to build** | one early-return in `updateGameScene` |
| **Follow a scripted path** | **to build** | new `cinematicCamera` module (~120 lines) |
| Activate a boss | defer | needs the anchor to enter combat — §10 |

---

## 3. Recommended capture architecture

**Capture runs an authenticated dev session, not a spectator session.**

The spectator path is tempting because HUD suppression comes free, but the *server*
picks the spectator's node and target: you cannot aim it at a specific biome, and
the node would freeze the moment the watched player left. An authenticated session
controls its own node and holds the thaw lease itself.

So: a **`?cinematic=<clipId>` query flag, gated behind `DEV_TOOLS_ENABLED`**, that
borrows the spectator suppression switches without being a spectator.

```
capture.ts ──▶ dev client ──▶ dev server
(Playwright)   ?cinematic=      (real world,
               plains-drift      real monsters)
                    │
                    ▼
              raw .webm ──▶ ffmpeg ──▶ .mp4 + .webp
        (recordVideo)     (trim·xfade·crf)   client/public/landing/
```

### What the flag turns on

- sets `data-spectator` so the sidebars and overlays hide;
- skips input attach, movement tick, HUD events, audio;
- hides the own sprite, labels, HP bars, cooldown/cast bars, target indicator,
  exit markers, minimap;
- emits `debug:teleportToNode` + `debug:equipPhaseTester`, then `debug:respawnNode`;
- hands the camera to the clip's path;
- exposes `window.__cinematic` so Playwright can await readiness and completion.

### The anchor player

The session's character is the thaw lease: present, immortal, invisible, out of the
way. Park it at a node corner — `selectMonsterAggroCandidate`
(`server/src/systems/combat/ai/monsterTargeting.ts:31`) only pulls monsters within
their own finite `hasAwareness.pullRange`, which is far smaller than the 4800 px
node, so a corner anchor leaves the filmed area's population undisturbed. Godmode
gear covers whatever wanders in.

---

## 4. Recommended camera implementation

A generalized cinematic engine is **not** warranted. A slow flyover needs a polyline
through node space, the ability to linger, and an ease so start and stop don't read
mechanical.

```ts
// client/src/scenes/game/cinematic/clips.ts — data only, no logic
export interface CinematicClip {
  id: string;
  nodeId: string;                     // e.g. 'node-t1-plains-03'
  anchor: { x: number; y: number };   // where the invisible player parks
  path: Array<{
    x: number; y: number;             // camera CENTRE in node coords, 0..4800
    holdMs?: number;                  // linger here before moving on
  }>;
  travelMs: number;                   // total time MOVING (holds add on top)
}
```

**Playback.** Precompute segment lengths once, then each frame advance a cursor by
`delta`, map elapsed → distance with `easeInOutSine` over the whole path, and
`cam.centerOn(...)` the point converted through `nodeToSceneCoords`. Holds are dead
time that pause the cursor. Driving from accumulated `delta` rather than the wall
clock keeps clip length consistent with the frames actually rendered.

**Deliberately omitted:**

- **Zoom** stays at 1. Any value below it triggers linear-filtered downscaling of
  pixel art and softens the whole frame.
- **Per-waypoint easing** makes a slow drift stutter; one global ease is smoother.
- **Target tracking** depends on non-deterministic monster positions. A path routed
  through a dense area is more reliable and costs nothing.

**Bounds.** Clamping through the existing `peekSceneBounds` helper is cheap
insurance against a typo'd waypoint producing a frame of void.

**Fades.** In ffmpeg, not in Phaser. Capture clean; fades then become re-tunable
without a recapture, and the loop seam can be a proper tail→head crossfade rather
than a dip to black.

---

## 5. Recording and encoding pipeline

### 5.1 The constraint that rules out determinism

**True frame-by-frame determinism is not achievable here.** World state arrives over
a socket at 5 Hz in real time. Phaser 3.90's `TimeStep.step(time)` *can* be driven
manually (it takes an explicit time argument), so the render clock is steppable —
but stepping it faster or slower than wall clock desynchronises it from the snapshot
stream and entity interpolation breaks. **Capture has to run in real time.**

### 5.2 Options

| Option | Quality | Pacing | Res / FPS control | Effort |
|---|---|---|---|---|
| **Playwright `recordVideo`** ← pick | VP8, visibly lossy at defaults — but it is a master, not the ship asset | ~25 fps target, variable; ffmpeg `fps=30` resamples it flat | size: yes · fps: no | ~20 lines |
| CDP `Page.startScreencast` | JPEG frames, quality tunable to near-lossless | best available — every frame carries a timestamp | size: yes · fps: capped, not fixed | ~80 lines + frame writer |
| `page.screenshot()` per frame | lossless PNG | **unusable** — 50–150 ms per shot cannot sustain 30 fps against a live server | full | low |
| OBS by hand | excellent | excellent | full | **not reproducible** — fails the one-command goal |

**Start with `recordVideo`.** It is the smallest thing that produces a shippable
asset, and because the master is immediately re-encoded, VP8 generation loss is the
only thing at stake. If the first clip shows judder that `fps=30` resampling cannot
hide, the screencast path is a drop-in replacement behind the same script — the
camera work, staging and encode all stay identical.

### 5.3 The workflow

```bash
# after `pnpm dev:server` and `pnpm dev:client`
pnpm landing:capture --clip=plains-drift

# which internally does:
#  1. launch chromium at 1280x720, recordVideo → .landing/raw/
#  2. goto localhost:3000/?cinematic=plains-drift
#  3. await window.__cinematic.ready  (assets + node painted + path armed)
#  4. await window.__cinematic.done   (path finished)
#  5. close context, then ffmpeg:
ffmpeg -i raw.webm \
  -vf "fps=30,scale=1280:720:flags=lanczos,\
       split[a][b];[a]trim=0:13,setpts=PTS-STARTPTS[main];\
       [b]trim=13:15,setpts=PTS-STARTPTS[tail];\
       [main][tail]xfade=transition=fade:duration=1:offset=12" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 23 -preset slow \
  -an -movflags +faststart plains-drift.mp4
ffmpeg -i plains-drift.mp4 -frames:v 1 -q:v 82 plains-drift.webp
```

---

## 6. Video targets, and the pixel-art assumption that does not hold

Two facts from the codebase say **be careful** with "capture small and upscale":

1. The canvas is *not* nearest-neighbour scaled pixel art (§1.8). There is no crisp
   integer upscale to lean on — an aggressive downscale-then-CSS-upscale reads as
   blur, not as pixels.
2. Desktop camera zoom is exactly 1, so **capture viewport pixels are world pixels**.
   Capturing at 1280×720 frames 1280×720 world px with no resampling at all. That is
   the cleanest possible source frame, and it is a reason to pick the capture size
   for *framing* rather than for file size.

Working the other way: a slow global pan over dense pixel detail is genuinely *hard*
to encode. Every frame has motion everywhere and high-frequency detail in every tile.
Do **not** budget as if this were a soft gradient loop.

| Parameter | Recommendation | Why |
|---|---|---|
| Capture viewport | 1280 × 720 | 1:1 with world px at desktop zoom; a generous slice of a 4800 px node |
| Ship resolution | 1280 × 720 | 1.5× CSS upscale on a 1080p display, behind a vignette and a login panel. Bump to 1600×900 only if it visibly disappoints. |
| Frame rate | 30 fps | 24 saves ~20% but slow linear pans judder at 24 |
| Rate control | H.264 `-crf 23 -preset slow` | quality-targeted; a fixed bitrate on this content either wastes bytes or smears the pan |
| Expected bitrate | 1.2 – 2.5 Mbps | verify on the first real clip |
| Budget for 15 s | ≤ 2.5 MB | if CRF 23 overshoots, raise to 25 **before** dropping resolution |
| Container / codec | MP4, H.264 High, `yuv420p`, `+faststart` | universal decode including older iOS; ship one source for the MVP |
| Second variant | later — AV1 or VP9 WebM | ~40–50% smaller, but a second encode step and a second binary per clip |
| Poster | WebP q82, **exact first frame**, 40–80 KB | anything else and the poster→video handoff visibly jumps |
| Loop length | 12 – 15 s | low end of the 10–20 s brief: visitors leave quickly and every second is bytes |

### Playback attributes

`muted`, `playsinline`, `loop`, `autoplay`, `preload="none"`, with the `poster`
attribute carrying the still. Set `src` only after first paint, so the poster is
instant and the video is off the critical path.

- On `navigator.connection.saveData`, or an `effectiveType` of `2g` / `slow-2g`,
  skip the video entirely — the poster is already a complete experience.
- Under `prefers-reduced-motion: reduce`, don't autoplay (see §11 D3).
- With 3–4 loops eventually, **choose the clip before touching the DOM** and set
  exactly one `src` and one `poster`. Never ship a `<video>` with several `<source>`
  variations of the same clip — that is how a landing page quietly downloads four
  megabytes.

---

## 7. Landing poster / video / spectator loading sequence

### 7.1 Layering

Mount the `<video>` as a **sibling before `.auth-gate` inside `#auth-gate`**, not
inside `#game-wrapper` (§1.1). `#auth-gate` already sits above the canvas with
`pointer-events: none`, and the gate's own gradient then paints over the video as a
later sibling — which is exactly the vignette that keeps the login panel readable.

```
top     login panel                    .auth-login-panel
        landing gradient vignette      .auth-gate--landing
        <video poster>  ← NEW          fades to 0 on handoff
bottom  Phaser canvas (live spectator)  #game-wrapper
```

### 7.2 What "spectator ready" has to mean

"The Phaser canvas exists" is nowhere near sufficient — `create()` runs as soon as
the sprite atlas and `shadows.json` land, long before any biome art or world state
has arrived. Readiness must mean **all** of the following, held for **8 consecutive
rendered frames** so a mid-retarget doesn't slip through:

1. socket connected and **not** paused (`spectate:status` reports `paused: false`);
2. at least one `spectate:snapshot` applied — `scene.spectatorSnapshotNodeId !== null`;
3. `scene.cameraScrollReady === true`, so the camera has taken its first
   authoritative scroll and won't visibly snap;
4. the current node's ground art is actually present — the Wang layer
   (`scene.bgWang`) or its `BIOME_TEXTURES` entry exists, so the pane isn't showing
   the flat biome fill;
5. the deferred spectator asset pass has fired its `complete` hook, so effects and
   emotes don't pop in after the fade;
6. at least one entity is rendered — an empty node is technically ready and visually
   dead.

None of that is currently exposed. It is one predicate evaluated in
`updateGameScene` and one Jotai atom that `AuthGate` reads. Crossfade over ~600 ms,
then `video.pause()`, clear `src`, `video.load()` — that releases the decoder rather
than leaving a hidden video running behind a live game.

### 7.3 Failure and slowness

- **Slow spectator:** nothing happens, and that is the design. No timeout, no error
  state, no spinner. The loop keeps playing and the readiness watch stays armed.
- **Failed spectator:** the manager caps spectators at 16 server-wide and 2 per
  address; over that, `spectate:error` arrives instead of snapshots. Treat that as
  "never ready", not as an error to show. The prerecorded loop is a complete,
  permanent fallback and should never be framed to the visitor as a degraded state.

---

## 8. MVP clip recommendation

**`plains-drift` · 14 s · one Tier 1 Plains node · four waypoints.**

A single unbroken lateral drift with two brief holds — one over a tree cluster, one
over a monster group — ending near where it started so the loop seam is a short
crossfade rather than a cut. No zoom, no boss, no player.

- **Why Plains.** It is where the Wang ground system was prototyped, and it has
  authored trees, a decor kit and walk-behind depth sorting. It is also the content
  a new player actually meets first, so the landing loop is an honest promise. Tier 1
  keeps the anchor session trivial — no progression to fake.
- **Alternate: Tier 1 Forest.** Denser canopy gives a lateral pan more depth and
  occlusion interest. Worth capturing as a second take in the same session.
- **Avoid for now: Volcanic and dungeons.** Volcanic renders as plain basalt (lava
  pools are wired but never authored). Dungeon nodes carry altars and gauntlet
  framing that read as game systems rather than world.

Pick the exact node **by eye** before authoring waypoints. `pnpm ui:shot` already
drives the client at a fixed viewport, so a sweep of a handful of
`node-t1-plains-*` / `node-t1-forest-*` ids costs minutes and settles the framing
argument with pictures.

### The eventual set — four loops, one idea each

Resist one loop per biome. Four loops that each do a different *job* beat eleven
that all do the same one:

1. **World drift** — the MVP. Terrain, decor, ambient monsters. The default.
2. **Encounter** — a path that lingers on a genuine fight, filmed with a bot as the
   combatant rather than the anchor.
3. **Atmosphere** — a near-static hold on a strong environment (cavern, tundra)
   where the motion is ambient, not camera. Cheapest to encode, best on a slow line.
4. **Boss** — last, because it needs live combat staging and is the most fragile.

---

## 9. Exact minimum implementation

| File | Change | Size |
|---|---|---|
| `client/src/net/session.ts` | add `cinematicClipFromUrl()` beside the existing `watchTargetFromUrl()`, gated on `DEV_TOOLS_ENABLED` | ~12 lines |
| `client/src/scenes/game/cinematic/clips.ts` | **new** — the `CinematicClip` type and the clip table | ~50 lines |
| `client/src/scenes/game/cinematic/path.ts` | **new** — arc-length precompute, eased cursor, `centerOn`, holds, `window.__cinematic` beacon | ~110 lines |
| `client/src/scenes/game/cinematic/suppress.ts` | **new** — hide own sprite, labels, bars, markers; set `data-spectator` | ~40 lines |
| `client/src/scenes/game/GameScene.ts` | one `cinematic: CinematicClip \| null` field alongside `spectatorMode` | ~3 lines |
| `client/src/scenes/game/sceneSetup.ts` | reuse the `spectatorMode ? …` guards for cinematic mode; early-return past the camera-follow block; skip HUD draw calls; emit staging intents on connect | ~35 lines |
| `client/src/auth/AuthGate.tsx` + `authGate.css` | render the `<video>` sibling; crossfade on the readiness atom; unload after | ~45 lines |
| `client/src/auth/lobbyState.ts` | one `spectatorVisualReadyAtom` | ~4 lines |
| `tools/landing/capture.ts` | **new** — Playwright driver + ffmpeg invocation, modelled on `tools/uishot/shot.ts` | ~130 lines |
| `package.json` | `landing:capture` script, matching the `ui:shot` pattern | 1 line |
| `client/public/landing/` | the encoded `.mp4` and `.webp` | ~2.5 MB |
| `docs/` | a `landing-cinematic-current-state.md` and a line in `docs/README.md` | — |

**No server change. No shared-protocol change.** The only new tool requirement is a
local `ffmpeg` on the capture machine — for whoever regenerates clips, not a package
the app ships.

**Test.** Per the repo convention this warrants one wiring smoke test, not a pixel
comparison: construct the clip table, assert every `nodeId` resolves in
`NODE_BIOMES` and every waypoint lies inside `0..NODE_WIDTH`. That catches the
failure that actually happens — a clip pointing at a node id that a map
regeneration renamed.

---

## 10. Explicitly deferred

| Deferred | Why |
|---|---|
| **Boss capture** | Needs the anchor to actually engage — combat staging, phase timing, a fight that doesn't end mid-take. Least reliable clip to regenerate. |
| **Camera zoom and target tracking** | Zoom softens pixel art below 1; tracking depends on monster positions that differ every capture. |
| **Multiple codec variants** | One H.264 MP4 until there is a measured reason. |
| **Random clip rotation** | Meaningless with one clip; five lines when the second exists. Build the array with one entry and index it. |
| **CDP screencast capture** | Held in reserve as the upgrade path if `recordVideo` pacing disappoints. Swapping it in changes nothing outside `capture.ts`. |
| **CI regeneration** | Capture needs a running server, a database and a browser binary — none of which CI has. Clips stay hand-run, hand-approved artifacts, like the art pipeline's outputs. |

---

## 11. Risks, and the calls that need the designer

### Risks

- **Encoded clips are binaries in a git repo.** 2.5 MB per clip is fine once. Four
  clips, each regenerated whenever the biome art changes, is a repository that grows
  by megabytes per art pass and never shrinks. The single largest long-term cost.
- **The anchor player perturbs the scene it is filming.** Monsters within
  `pullRange` of the corner will walk to it and stand there, thinning the population
  elsewhere. Mitigated by distance and a long enough take — verify on the first
  capture rather than assuming.
- **Captures are not reproducible between machines.** Monster placement comes from a
  live world with its own state. Accept it: clips are approved artifacts, not
  deterministic build output.
- **A clip can silently go stale.** The whole point is that the landing page loads no
  game assets — so when a biome is re-arted, nothing tells you the landing video now
  shows the old one. The smoke test catches renamed nodes, not changed pixels. Add
  re-capture to the biome-visual-pass checklist.
- **1.5× CSS upscale on linear-filtered art.** 720p behind a vignette should be
  fine, and the alternative costs roughly double the bytes — but this is a judgement
  the designer's eye has to make on a real clip.

### Decisions

**D1 · Asset home.** Where do encoded clips live? `client/public/landing/` is
simplest — it lands in `client/dist` and is served by the existing
`express.static`, no infrastructure — but it puts every regeneration into git
history forever. Alternatives: Git LFS, or an object store with the URL in an env
var. *Recommendation: `client/public/` for the MVP single clip; revisit before clip
three.*

**D2 · Reconnect behaviour.** If the spectator becomes ready and then breaks (socket
drop, retarget into an unloaded biome, the 10-minute idle pause), does the video come
back, or does the live layer stay up with its own fallbacks? *Recommendation: do not
fade back on a brief drop; do reload and fade back in on the idle pause, since that
state is indefinite and the pane is frozen.*

**D3 · Reduced motion.** What does `prefers-reduced-motion` suppress? The video is
clearly motion. The live spectator is also motion, and it is the product.
*Recommendation: suppress the video (poster only) and still allow the spectator
handoff — a visitor who asked for less motion should not be denied the live world,
and the crossfade becomes a cut.*

**D4 · Framing.** Does any player appear at all? The brief leans toward no. An empty
world reads as atmospheric but slightly lifeless; a distant adventurer walking
through frame reads as an MMO. *Recommendation: capture the MVP with no player, then
once the pipeline works take a second pass with a bot walking a route through frame
and compare side by side.*

---

## 12. Recommended implementation sequence

Each step ends somewhere you can stop and look at something real. Steps 1–4 are one
sitting.

1. **Pick the node with pictures.** Sweep `node-t1-plains-*` and `node-t1-forest-*`
   with `pnpm ui:shot` at 1280×720. Settle biome and rough framing before writing any
   camera code. *(no code, minutes)*
2. **Cinematic mode in the client.** URL flag, suppression helper, clip table with one
   hand-authored path, camera early-return. Verify by opening
   `?cinematic=plains-drift` in a normal browser and watching it fly. *(the bulk of
   the new code)*
3. **Iterate the path by eye.** The actual creative work, and it wants a fast loop:
   edit waypoints, reload, watch. Do it before automating anything — the capture
   script is worthless until the clip is good. *(expect several passes)*
4. **Capture and encode.** `tools/landing/capture.ts` plus the `landing:capture`
   script. Judge the encode: bitrate, pan judder, loop seam. Adjust CRF, or switch to
   screencast capture if pacing is the problem. *(the one-command goal is met here)*
5. **Ship the video as the landing background.** Mount it, wire the poster,
   connection-aware and reduced-motion handling. **Stop here and deploy** — the
   landing page is already better than today, and the crossfade is a separate,
   independently valuable change. *(first shippable milestone)*
6. **Readiness predicate and crossfade.** The six-condition check, the eight-frame
   hold, the atom, the 600 ms fade, the decoder unload. Test with a throttled network
   profile — the interesting behaviour only shows up when the spectator is genuinely
   slow. *(the payoff)*
7. **Document and guard.** The wiring smoke test,
   `docs/landing-cinematic-current-state.md`, its line in `docs/README.md`, and a
   note on the biome-visual-pass checklist that a re-art means a re-capture.
8. **Clips two through four.** Only now, and only after revisiting D1. Each
   additional clip is a clip-table entry and one capture command — the pipeline built
   in steps 2–4 is the whole cost.
