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

## ⚠ FIRST: the next task is cave guard behaviour

The user's words: *"later we'll have to modify the cave guards behavior to stick to those
paths."* Caves now have real patrol routes that the ground paints, but the guards' behaviour
around them has not been touched. **This is the top of the queue.**

Research already done, so it is not re-derived:

- **Patrolling already follows the path exactly.** `getCavePatrols(nodeId).routes` feeds both
  the painted discs and the server's patrol waypoints, so a brute walking its route IS walking
  the drawn line. Nothing to fix there.
- **Wander is already tight enough.** `CAVE_PATROL_WANDER_RADIUS = 80` against a path
  half-width of 82, so idle drift stays on the path by construction.
- **The actual gaps are chase and return.** `CAVE_PATROL_LEASH = 980` lets a guard leave the
  beat to chase, and the return is a straight line back to `controlsMonster.spawn` — neither
  is path-aware. A guard that chases across the node walks home through the rock rather than
  back along its route.
- **Only three cave monsters patrol at all**: `cave-brute`, `cave-troll`, `cavern-troll` (they
  are the ones with a `patrol` block in `shared/src/data/monsters/cave.monsters.ts`). Lurkers,
  spiders and gargoyles roam solo *by design* — the file says so explicitly. Do not "fix" them
  into patrollers without asking.
- Relevant code: `assignCavePatrol` / `cavePatrolRoutes` in
  `server/src/systems/world/spawning/index.ts`, and `advancePatrol` in
  `server/src/systems/combat/ai/ai.ts`.

**Balance numbers are the user's.** Leash/pull/wander values are theirs to set — propose,
do not tune.

---

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

### Mountain (24 nodes) — DONE, not yet visually reviewed

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

### Caves (21 nodes) — pass 2 DONE, not yet visually reviewed

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

## Per-biome status

| Biome | Nodes | State |
|---|---|---|
| Clearing / Sanctuary | 1 + 3 | DONE |
| Caverns / **Caves** | 21 | **pass 2 DONE 2026-08-16, NOT visually reviewed** |
| Plains | 12 | DONE — deliberately kept plain |
| Forest | 12 | DONE |
| Swamp | 21 | DONE (`5f09a2f`), never visually confirmed |
| **Mountain** | 24 | **DONE 2026-08-16, NOT visually reviewed** |
| Jungle, desert, tundra, volcanic, wasteland, trench | | not started |

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
