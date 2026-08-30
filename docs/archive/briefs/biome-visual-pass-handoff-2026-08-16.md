> **ARCHIVED — pass closed 2026-08-17.** Live record is `docs/terrain-variance-plan.md` SS8-9.
> Kept for traps 1-22 (the mistakes that cost time) and the test-subset timings — read before
> touching biome visuals or ground rendering.

# Biome Visual Pass — Session Handoff (2026-08-16)

Continuation brief. Supersedes
[`biome-visual-pass-handoff-2026-08-14.md`](./biome-visual-pass-handoff-2026-08-14.md) —
read that one for the systems built before mountain (tint, decor variance, forest trails,
swamp pools) and for traps 1–8, which all still apply. This brief covers **mountain** and
**caves**, and the traps learned on them.

**Branch:** `feat/biome-ecology-pass2`.
**Living plan:** [`docs/terrain-variance-plan.md`](../terrain-variance-plan.md) §8 (levers)
and §9 (per-biome log). §1–§7 are a parked gameplay-terrain plan; do not start on those.

---

## ✅ The visual pass is COMPLETE (2026-08-17)

All eleven biomes are done, reviewed in-game and approved (swamp excepted — see the status
table). Nothing in this brief is an open queue any more; it is kept for **traps 1-22** and for
the measured numbers behind each biome's decisions.

The cave-guard behaviour item that used to head this brief was researched but never actioned,
and is still open if it is wanted: `CAVE_PATROL_LEASH = 980` lets a guard leave its beat to
chase, and the return is a straight line back to `controlsMonster.spawn` rather than a walk
back along the route. Patrolling itself already follows the painted path exactly, and idle
wander is already tight enough (`CAVE_PATROL_WANDER_RADIUS = 80` against a path half-width of
82). Only three cave monsters patrol at all — `cave-brute`, `cave-troll`, `cavern-troll`;
lurkers, spiders and gargoyles roam solo by design. Relevant code: `assignCavePatrol` /
`cavePatrolRoutes` in `server/src/systems/world/spawning/index.ts`, and `advancePatrol` in
`server/src/systems/combat/ai/ai.ts`. **Leash/pull/wander values are the user's to set.**

## Testing: run the subset, not the suite

Measured this session:

| | time |
|---|---|
| `shared/src/collision/collision.test.ts` alone | **6s** |
| The 7 layout-relevant files | **~40s** |
| Full `pnpm test` (76 files) | **~5 min** |

For world/biome/layout work the relevant files are `collision.test.ts` plus
`approachGoalStandable`, `navWaypointWedge`, `monsterSpawnTerrain`, `dungeons`, `ambientRamp`,
`tundraChill`. **Iterate on those; run the full `pnpm test` once before committing** — which
is all CLAUDE.md actually asks for. Running the whole suite after every sub-change cost about
20 wasted minutes last session.

`collision.test.ts` is the one that matters most here: it carries the reachability,
hitbox-budget and prop-clearance invariants for every generated layout.

Run one file with:
`pnpm --filter @mmo-idle/server exec tsx --conditions=development ../shared/src/collision/collision.test.ts`

---

## What shipped this session

### Mountain (24 nodes) — DONE, reviewed and approved

- **Ledges generated per node** — `shared/src/world/mountainPasses.ts`. Was 6 authored
  entrance sets indexed by `featureVariant` (0–5 *within* a tier), so `t1/t2/t3/t4-mountain-01`
  were the same node four times. Now 24/24 distinct. Rings roll **independently**, so you
  arrive in the corridor and have to find the way up.
- **Passes**: the ground paints the route worn through each node's own ledge gaps. Verified 0
  gap centres fall off the painted pass.
- **`scree` wired** as a second material (18 stone / 6 scree). It **inverts** — its upper is
  loose pebble wash, the opposite of a path, so scree covers the node and passes wear back to
  bedrock.
- **Decor** 51–145/node (base held at 124), 6/24 nodes with no hardy grass, 4/24 no boulders.
- **Tint** T2–T4 cold ramp; T1 untouched.
- **Chokepoints 5–8/node**, one per opening.
- **Dungeons are a single circular arena wall** with 1–2 entrances, not two square rings.
  Radius 1213–1305, openings 542–747px. Built from 96px SQUARES stepped at 82px along the arc,
  because feature rects do not rotate.

### Caves (21 nodes) — pass 2 DONE, reviewed and approved

- **Patrol routes are real** — `shared/src/world/cavePatrols.ts`. See trap 11 below for what
  was broken. Shape is an **outer circuit with two arms crossing the middle**, fixed as the
  biome signature; only proportions vary (inset 731–1028px). Three routes/node: circuit as a
  `loop`, each arm as a `pingpong`.
- **Paths are narrow**: half-width 82px (forest trail is 154, mountain pass 134).
- **Patrolled vs. wild** is decided in `shared/` and the ground reports it: **11 patrolled /
  7 wild**. Wild caves are unbroken stone, no route, brutes roam.
- **`rubble` REMOVED** as a cave material — see trap 12.
- **Rock formations**: 15/node (other rock biomes stay at 9), and they now block to their
  silhouette (~105–125px wide, halfW 132–156 pre-scale). **Height deliberately unchanged** —
  a deeper base makes a rock block from well below its footprint.
- **Cave dungeons are ritual sites**: 4 converging spokes, 7–8 standing stones, blocking, ring
  broken at every spoke. Spokes run to the node's **real exits** (topped up with diagonals),
  which is also what keeps the ring off the centre-to-gate travel lanes.

---

### Desert (18 nodes) — DONE, reviewed and approved

- **Caravan tracks** — `shared/src/world/desertTracks.ts`. **11/15 open nodes tracked**, plus
  an arrival road on all 3 dungeons. Two open-pan shapes, `through` (edge to edge) and
  `broken` (arrives and fails, tail dissolving into sand). The track deliberately does NOT
  serve the node's exits — a road going somewhere else.
- **The road is THIN, LONG and DASHED** (half-width 91px, narrowest route line in the game;
  patches of 700–1500px with 220–520px of swept sand between). Width is the wrong lever on
  open sand — a wide band reads as a discoloured area, not as something travelled.
- **Trackless nodes are byte-identical to before.** The track overrides the pattern roll only
  where one exists, so the other eight nodes keep the exact `sparse-scatter` draw they made.
- **Every desert spec now sets `avoidsDirt`** (no other biome does — hardpan always means
  scoured ground here) *plus* an explicit `isOnDesertTrack` clearance test, because
  `avoidsDirt` tests the disc exactly and cannot express a margin.
- **Four decor variance groups**, two of them presence-rolled: props **37–112/node, mean 77**
  (was a flat 85), **6/18 nodes with no scrub at all**. 0 props on hardpan, 0 on a track.
- **Hoodoos clear a track by 210px** (cave uses 190 for a beat), asserted in
  `collision.test.ts` and in the new `server/test/desertTracks.test.ts`.
- **Desert dungeons are the END OF THE ROAD.** The one biome that does NOT exempt its
  dungeons from its route layout: an `arrival` road comes in from a real travel gate,
  straight to the arena court, and stops there. Never rolled — all 3 have one. It runs along
  a centre-to-gate travel lane, which costs nothing (rocks already clear those lanes, and the
  dungeon decor rule already rejects every layout disc).
- **Tint** T2 untinted (desert's base tier — there is no T1 desert), T3 bleached ochre, T4
  dust-red.
- **The first cut was invisible in play, and one cause was a rendering finding.** Half the
  biome had no road including the entry node (fixed by the weights above), AND the autotiler
  was destroying the line: `edgeJitter` wobbles every corner test by up to 1.4 CELLS = 90
  world px, against a 125px road. The solid core was ~70px with a wide speckled fringe, so it
  painted as a smudge. `DirtDisc.jitter` (default 1, road discs pass 0.35) now lets a LINE be
  crisp on the same node where a BLOB stays ragged. **Nothing already reviewed moves.**
- Ruled out first, so do not re-derive: both paint paths reach `computeGroundLayout`,
  `preloadWangGround` queues the desert sheet, and hardpan's base-to-upper contrast is ΔLum
  **48.7** — third strongest of the ten ground sheets, double the visible cave patrol path.

### Cave tints — added 2026-08-16

Caves had no tint entry at all. T1 stays untinted, T2 `0x2f6b6b` @ 0.32 (mineral teal, wet
stone), T3 `0x5a3f8c` @ 0.44 (crystal violet — `crystal-gargoyle` and `deep-spider` back it
on screen). The ramp says the ROCK changed, not just the light.

### Jungle (18 nodes) — DONE, reviewed and approved

- **Thickets are generated** — `shared/src/world/jungleBushes.ts`. Was TWO authored sets
  across fifteen walkable nodes, at identical coordinates and identical radii; now 15/15
  distinct, 4-6 thickets at radii 360-500. `denseBush` gameplay values untouched.
- **Four ARRANGEMENTS, dealt not rolled**: gauntlet / ring / cluster / scatter, 4/4/4/3. See
  trap 17 — rolling could not hit the mix at this sample size.
- **Trees follow the arrangement**, 6-13 (was flat 9): a cluster node keeps its open ground,
  a scatter node carries a real canopy. 0 nodes fall short of target.
- **Jungle dungeons are a HACKED CLEARING**: no thickets (which also removed three debug
  placeholder circles — `boss_bush_*` ids never matched the `jungle_bush` art scatter), a
  clearing at `0.135 * W` with jitter damped to **0.3** so its edge reads as CUT, and the
  trees ringing it in an annulus just outside that edge (934-1191 against a 648 clearing).
- **Decor**: four variance groups on the heaviest kit in the game (it had none). Props
  **70-243/node, mean 160** (was flat 180); 6/18 nodes with no flowers, 6/18 with no stones.
- **Tint** T2 untinted (jungle's base tier), T3/T4 on the NEW `saturate` mode — jungle gets
  more VIVID with depth, not dimmer. The first attempt was a wash and read as mud; a wash
  cannot add contrast, only remove it. See traps 18-19.
- **Thicket sprites are now tinted** — they never were (y-sorted, so above the overlay band,
  and `buildFeatureScatterImages` never called `nodeTintMultiply`).
- Dead code removed: both jungle templates, the dungeon set, `JUNGLE_NORMAL_TEMPLATES` and
  `JUNGLE_TREES_PER_NODE`.

### Volcano (14 nodes) + Tundra (12 nodes) — DONE 2026-08-17, reviewed and approved

- **Volcanic lava is generated** — `shared/src/world/volcanicLakes.ts`. Was FOUR authored
  layouts across fourteen nodes (two alternating on the twelve walkable ones); now 14/14
  distinct. **Exactly 3 lakes at r 456-753**, coverage **6.6-9.0% -> 14.2-17.0%**. Coverage
  is a BALANCE number (lava burns) and is flagged as the first dial to move.
- **Lake radii are DEALT from the area budget**, not drawn per lake. Once the count is
  fixed, `[MIN_RADIUS, budget-solved-for-count]` is a range of ~27px, so independent draws
  gave three near-identical circles (607/623/654). Splitting the AREA into uneven shares
  (+/-45%) keeps coverage exact AND gives a big/middling/small trio.
- Borrows swamp's coverage-first budget but inverts its intent: swamp's `MIN_POOLS = 3` stops
  a budget being eaten by two huge bogs; volcano's floor is **2** because that is exactly
  what it wants.
- **Volcanic rock formations 9 -> 15**, matching caves.
- **Tundra ice is generated** — `shared/src/world/tundraLakes.ts`. Was 5-14 small discs
  (~3%); now **2-3 lakes at r 649-755, 11.5-19.5%**, 12/12 distinct.
- **Trees and props now keep OFF the ice.** They could not before: the ice was client-only
  renderer state, so server-side trees grew out of the lakes, and only the vegetation props
  set `avoidsDirt`. 0 trees and 0 props on ice; the prop kit still places its full 159.
- **Tundra dungeons inverted**: arena is cleared solid ground, lakes pushed to the sides
  (was: the arena court itself was painted as ice).
- `DirtDisc.jitter` damped to **0.55** for a lake shore — smooth but not cut, between the
  desert road's 0.35 and full wobble.
- Dead code removed: all four volcanic legacy templates and both template id constants.
- **Tints, added as a deliberate pair.** Volcano `saturate` (T3 `0xd4521a` @0.30, T4 @0.46) —
  firelight on grey basalt, lava pops. Tundra `wash` (T3 `0x3a5c8c` @0.30, T4 `0x1e3559`
  @0.42) — the one biome where a wash is clearly right, because snow is bright and has
  contrast to spare, so dimming toward blue IS the blue-hour effect rather than a cost.
  Both tint their BASE tier (both start at T3, so neither has an "ordinary" tier to hold
  as a baseline — swamp's reasoning). Tundra stays properly blue and dark, deliberately
  unlike mountain's pale desaturated grey-blue.

### Wasteland (7 nodes) + Trench (7 nodes) — DONE 2026-08-17, reviewed and approved

- **Two premises were already true**, do not re-do them: wasteland props ALREADY sit on the
  ash (`avoidsDirt` on nothing, by design), and neither biome has any features at all.
- **Wasteland: the path pattern is GONE.** `loose-center-path` held 2/7 of the roll and on ash
  art read as a long patch, not a road. Replaced by `ash-drift` — lobed banks (2-4 overlapping
  discs walking in a shared direction), 3-6 per node, each with its own size scale.
- **Wasteland decor**: four variance groups where there were none (`drifts`, `thorns`,
  `bones`, `remains` presence-rolled at 0.55).
- **Wasteland dungeon = THE GRAVE ROWS.** Rows, not a ring — four dungeons already use rings.
  43 markers in 9 rows, fraying with distance, and the arena is a GAP in the grid so the rows
  continue on the far side. Grid rotated per node so it does not parallel the border.
- **Trench density**: decor 103 -> 155 props, rock formations 9 -> 15. Five variance groups.
- **Trench dungeon = THE WHALE FALL.** A spine of vertebrae laid ACROSS the node — the only
  dungeon shape in the game with a direction. Existing vertebra art, rotated to the spine
  tangent, tapering ribcage-to-tail. 12 vertebrae; rocks clear it.
- **Tints: conjecture recorded, nothing wired**, at the user's request. Wasteland desaturating
  grey wash is achievable today (a wash toward neutral grey IS desaturation). Trench "darker"
  is easy but "higher contrast" is IMPOSSIBLE with a rectangle — see trap 21.

## Traps learned this session (9–12 continue the earlier brief's list)

**9. `invert` breaks the DUNGEON rule, not just `avoidsDirt`.** The decor scatter's "nothing
grows on an arena floor" test used `isDirt`, but a court is a SHAPE and `isDirt` flips under
inversion — so on an inverted dungeon every point *outside* the court read as arena floor and
the whole node's scatter was rejected. **Three jungle dungeons had been placing zero props on
master.** `GroundLayout.inDisc` is the invert-blind test; use it whenever you mean the shape
rather than the material.

**10. Adding an rng draw to a shared generator reshuffles every biome already reviewed.** The
new `variance.presence` roll is drawn ONLY when a spec declares it, for exactly this reason.

**11. A biome can have a system that LOOKS wired and is not.** Cave had a `patrol-path`
material, monsters with patrol loops, and a server-side patrol assignment — and no
relationship between any of them: `CAVE_PATROL_ROUTES` was a module-level constant with **no
`nodeId` in it**, identical on all 21 nodes, describing a completely different shape from the
painted path. Check that two ends read the SAME layout, not merely that both exist.

**12. Open the PNG before building on a sheet.** `cave/floor-rubble-wang.png` was wired as a
second material in the caverns pass and is near-black in BOTH halves, so its autotiling is
invisible. It shipped as variance nobody could see. It is now removed and relabelled
`BROKEN (no contrast)` in the bake-off list so it is not wired a third time.

**13. A generator that makes WALLS can wedge a node.** Swamp pools could not; mountain ledges
can. Reachability there is structural (concentric squares ⇒ the corridor is a connected
annulus; ≥1 gap per ring enforced at generation) and `collision.test.ts` asserts one walkable
component on the real nav grid for **every** node, not a sample.

**14. Hitbox changes have two budgets.** Widening cave rock bases tripped the shared
`halfH <= 25` invariant because the first attempt raised height along with width. Width and
height mean different things for a top-down base: width is silhouette, height is how far
*below* the sprite it blocks.

---

**15. A disc count is not a coverage measurement.** A desert track with 12 discs measured
0.45% node coverage where its disc count implied ~3%: a quarter-turn had picked both edge
points either side of one corner, so the entire road lay off the map bar a disc. Fixed twice
over — adjacent-side ends are forced away from the shared corner, and a `broken` run is now a
fraction of the **on-node** crossing (Liang-Barsky clip) rather than of the raw segment. The
throwaway script printed both numbers, which is the only reason it was caught; printing one
would have shown a healthy-looking track.

**16. `edgeJitter` can destroy a thin shape while leaving a fat one perfect.** The autotiler
wobbles each corner test by up to `edgeJitter` CELLS — desert's 1.4 is 90 world px. That is
free character on a 200px blob and fatal on a 180px-wide road, which painted as a smudge with
a speckled fringe. Blobs want ragged edges, lines want crisp ones, and a single node carries
both — so the damping is per DISC (`DirtDisc.jitter`, default 1), never per biome. Check the
jitter-to-width ratio before concluding a shape is "too subtle" and reaching for the size.

**17. `mulberry32` seeded from a string hash has a clumpy FIRST draw, and a small biome cannot
roll its way to a distribution.** Rolling one of four arrangements per jungle node gave 6/5/2/2
against a target of 4/4/4/3 — 7 of 15 node ids produced a first draw above 0.818, exactly one
band. Burning a draw just moves the clump (the second draw had nothing above 0.81, starving the
opposite band). When a biome has ~15 nodes and you need a MIX, **deal from a shuffled deck**
(largest-remainder allocation + fixed-seed Fisher-Yates over sorted node ids): deterministic,
both ends agree, and the player is guaranteed to meet every variant. Roll only where any
outcome is acceptable on any node.

**18. Only MULTIPLY, ADD, SCREEN and ERASE are real blend modes under Phaser WebGL.** Every
other `Phaser.BlendModes` constant — OVERLAY, SOFT_LIGHT, HARD_LIGHT, SATURATION, COLOR,
COLOR_BURN — is initialised to the DEFAULT `[ONE, ONE_MINUS_SRC_ALPHA]` in `WebGLRenderer.js`
(checked against 3.90), i.e. plain alpha blending. They exist for the Canvas renderer, which
maps them to CSS composite operations. Setting one under WebGL silently does nothing and
looks exactly like a value that is too weak — the same failure shape as the original tint
wiring bug. If a grade needs contrast or saturation, it has to be built out of MULTIPLY.

**19. A wash cannot make anything more vivid; it can only reduce contrast.** Blending toward
a colour moves every pixel toward that colour, so on art already in that hue (dark green
foliage under a dark green wash) it removes exactly the contrast that made the art read.
Multiply CAN saturate, if you choose the colour correctly: keep the hue's brightest channel
at 255 and cut the others. Jungle T4 went from multiplying every channel to ~50% (mud) to
`(60%, 100%, 73%)` — same brightness on the greens, the competing channels removed.

**20. A "few and big" generator cannot satisfy a large centre exclusion on a square node.**
Both the volcanic and tundra dungeon layouts came out with one lake or NONE. A lake must fit
between the arena clearance and the node edge, and the furthest a lake centre can sit from
the middle is `sqrt(2) * (half - edgeMargin - r)`, in a corner. Against tundra's 0.3 arena
clearance that admits nothing above r≈612 — below that biome's own MINIMUM radius — so every
candidate was rejected and the node came back empty. Give dungeons their own smaller radius
band rather than shrinking the arena, and assert "at least one" in the test so an empty node
cannot return silently.

**21. A rectangle overlay can never increase contrast — that needs a shader.** Compositing a
rect over the scene is at best a linear `y = kx + b` with `k <= 1`, and MULTIPLY (the only
useful real WebGL blend mode here, see trap 18) scales all channels by the same factor, which
SHRINKS the differences between them. Darker is easy; "darker with more contrast" needs an
S-curve, i.e. a post-processing pipeline. Say so up front rather than shipping a wash and
hoping it reads as contrast.

**22. Decay has to stay legible AS decay.** The wasteland grave rows were frayed with a wander
comparable to the gap between markers, and thinned hard on top — the grid dissolved into a
17-marker scatter, destroying the one idea the layout existed for. Any "ordered thing falling
apart" effect needs its disorder bounded well under its order's spacing, or it stops reading
as ordered at all. Assert the STRUCTURE in the test (recover the row axis by best fit and
check the markers still quantise onto distinct lines), not just the count.

## Per-biome status

| Biome | Nodes | State |
|---|---|---|
| Clearing / Sanctuary | 1 + 3 | DONE |
| Caverns / Caves | 21 | DONE — visually reviewed; **tints added 2026-08-16** (T2 teal, T3 violet) |
| Plains | 12 | DONE — deliberately kept plain |
| Forest | 12 | DONE |
| **Swamp** | 21 | DONE (`5f09a2f`) — **the one biome never visually confirmed** |
| Mountain | 24 | DONE — visually reviewed |
| Desert | 18 | DONE — reviewed and approved |
| Jungle | 18 | DONE — reviewed and approved |
| Volcanic | 14 | DONE — reviewed and approved |
| Tundra | 12 | DONE — reviewed and approved |
| Wasteland | 7 | DONE — reviewed and approved |
| Trench | 7 | DONE — reviewed and approved |

> **CLOSED (2026-08-17):** every biome above has now been reviewed in-game and approved by
> the user, with the single exception of **swamp** — committed early for safety before its
> review happened, and never covered since. Treat swamp's numbers as provisional.
>
> This brief is therefore a HISTORICAL record rather than a live queue. Its value now is
> traps 1-22 and the measured numbers; the living per-biome truth is
> [`docs/terrain-variance-plan.md`](../terrain-variance-plan.md) §9, and §10 records what was
> deliberately deferred.

---

## Open dials (flagged, deliberately not tuned)

- **Mountain dungeon arenas have 1–2 chokepoint posts**, down from 4–6 under the old square
  rings — inherent to a single-entrance enclosure. The wall still carries 6–8 vaulting posts.
- **Mountain decor base** stays at 124 now that passes eat floor space.
- **Cave 11/7 patrolled split** is `PATROLLED_CHANCE = 0.53`, set against the actual draw
  rather than as a nominal probability — over 18 nodes the draw matters more than the constant.
- **Cave bones still use `min: 0`** for absence, which `presence` (added in the mountain pass)
  now actually solves. Not applied: it would reshuffle caverns placements already reviewed.
- Forest `SHAPE_WEIGHTS`, swamp T1 tint, and `MIN_CAMERA_ZOOM` remain open from the previous
  brief.

---

## Working agreement (unchanged)

- **One biome at a time.** The user verifies visually, then says commit.
- **Ask before deciding.** They answer `AskUserQuestion` rounds readily and prefer being asked.
- **Balance numbers are theirs.** Density scaling tied to a geometry change is fine; a balance
  pass is not.
- **Verify by measuring.** Throwaway `server/test/_*.test.ts` scripts (underscore = skipped by
  the runner) that import the real functions and print per-node results. Delete after. Every
  number in the plan doc's §9 came from one, and they caught the zero-decor dungeons, the
  props-in-water, and the hitbox overflow.
- **Always `git add` explicit paths** — the tree carries unrelated work from other sessions.
