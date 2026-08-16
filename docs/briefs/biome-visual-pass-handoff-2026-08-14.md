> **SUPERSEDED (2026-08-16)** by
> [`biome-visual-pass-handoff-2026-08-16.md`](./biome-visual-pass-handoff-2026-08-16.md).
> Still the reference for the systems built before mountain (tint, decor variance, forest
> trails, swamp pools) and for traps 1–8. Per-biome status here is out of date.

# Biome Visual Pass — Session Handoff (2026-08-14)

Continuation brief for the node-resize + biome-visual-variance program. Written because
the originating session got long. Everything here is verified against the code, not
recalled.

**Branch:** `feat/biome-ecology-pass2` — pushed through `5f09a2f`.
**Living plan:** [`docs/terrain-variance-plan.md`](../terrain-variance-plan.md) — read
§8 (visual levers) and §9 (per-biome log). §1–§7 are an earlier, **parked** gameplay-terrain
plan; do not start on those.

---

## ⚠ FIRST: swamp is committed but NOT yet visually reviewed

Every biome in this program is reviewed in-game by the user before it is considered
settled. **Swamp (`5f09a2f`) was committed at the end of the session for safety, without
that review having happened.** Treat its numbers as provisional — pool coverage, prop
density and the tier-1 tint may all come back for adjustment. Do not build on top of them
assuming they are final.

The working tree ALSO carries ~35 unrelated modified files from other sessions (admin,
Balance Lab, HUD, reports). **Always `git add` explicit paths — never `git add -A`.**

## What this program is

Two linked efforts, in order:

1. **Node resize.** Nodes went 3200×2400 → 3200×3200 → **4800×4800**.
2. **Biome visual pass.** Making each node feel like its own place, one biome at a time.
   The user reviews each in-game before it is committed.

**Scope is VISUAL:** background, ground material, props, tileset behaviour, tint. It does
**not** add walls, hazards, or anything that reshapes a fight. An early session misread this
and planned gameplay terrain; that work is parked in §1–§7 of the plan doc.

---

## Node geometry (current)

| | value |
|---|---|
| Node | **4800 × 4800** (23.04M px²) |
| Divides cleanly by | 64px Wang cell (75), 32px nav cell (150) |
| Crossing one axis | 40.0s at `PLAYER_SPEED` 120 |
| Density policy | **props scale with AREA (×2.25); mobs scale ×1.5** — a bigger node should read as roomier to fight in, not just longer |

**Four things must scale together on any future resize:** biome `mobDensity`,
`MONSTERS_PER_NODE`, tree counts, and `BIOME_DECOR` counts. The decor counts live in
`client/src/sprites.ts` — a different package from the rest — and were missed by a resize
once already, leaving every biome ~25% sparser than intended.

---

## Systems built (use these, don't rebuild)

### Tint — `client/src/render/biomeTint.ts`
Keyed **`biomeGroup -> biomeTier`**, not by node id. The world runs to **8 tiers**, so T4 is
the middle of the arc, not the end. A tier with no entry renders untinted, which is how a
biome opts out at its base tier.

Two rendering paths, and they are not interchangeable:
- **Overlay rectangle** at `TINT_DEPTH` (`BG_DECOR + 0.5`) washes ground + ground decor +
  feature art. Needed because Phaser's `TilemapLayer` does not implement the Tint component
  and `Tile` exposes no tint either — ground cannot be recoloured directly.
- **`nodeTintMultiply`** tints trees and y-sorted decor directly, because those straddle the
  overlay's depth band (roots below entities, canopies above) and it cannot reach them.

Current alphas run **0.32–0.66**. `~0.30` is the floor for a wash that reads as deliberate.

### Decor variance — `BiomeDecorArt.variance` in `client/src/sprites.ts`
Per-node count multiplier `{ min, max, group? }`. Applied in `paintBiomeDecor`.
Absent = fixed count on every node (unconverted biomes are untouched).

**Use `group`.** Independent rolls average out and produce weak variance; grouped specs share
one roll per node, which is what makes one node an ossuary and the next bare stone.

### Shared per-node layouts
`shared/src/world/forestPaths.ts` and `shared/src/world/swampPools.ts`. Both seeded from the
node id, both consumed by client rendering AND by systems the server owns. See the traps
below for why they must live in `shared/`.

---

## Traps that have already cost time

**1. `paintActiveNode` ≠ `paintNodeStatic`.** Two completely separate paint paths.
`paintNodeStatic` builds only the four **neighbour previews** (themselves under a 0.6-alpha
black fog); the node you stand in is assembled by `paintActiveNode` from `scene.bgWang` /
`scene.bgTile` / decor. Wiring the tint into only the first made it invisible in play, and
that survived **two** rounds of "make it stronger". **Anything node-wide must be wired into
both paths.**

**2. A data check is not a render check.** The verification that let #1 survive only
confirmed `nodeTint()` returned a colour from the lookup table. It never confirmed anything
was drawn. When the user reports not seeing something, suspect wiring before tuning values.

**3. `min: 0` on a variance group does NOT mean "sometimes absent".** Reaching zero needs the
far tail of the roll — measured 0/21 for cave bones, 0/12 for plains flowers. It means
"swings hard toward nothing". Genuine absence needs an explicit presence roll.

**4. Functional Wang sheets discard the decorative ground layout entirely.**
`buildWangGroundLayer` does `const layout = functional ? null : computeGroundLayout(...)`.
Swamp (rot pools) and volcanic (lava vents) nodes are functional, so ground-layout work does
not reach them. That is why the dungeon court covers 21 of 26 dungeons, not all of them.

**5. `invert: true` flips what `avoidsDirt` means.** Under inversion `isDirt` is true OFF the
discs. Forest trails paint inverted, so `avoidsDirt` would have scattered undergrowth down
the middle of every path; props use an explicit `isOnForestPath` test instead.

**6. Functional sheets paint OUTSIDE their collision shape** (`inflatePx: 32`). `featurePad`
must exceed it or props stand in visible water. It was 30 against 32; now 64.

**7. Flat pixel literals for node-sized things drift.** Bitten three times — the rune altar's
size and offset, and the dungeon altar's 250px. Express as a fraction of `NODE_WIDTH`.
**But not everything:** tree `EDGE_MARGIN_*`, decor `edgeMargin`, `spacingPad` are sized
against SPRITES and are correctly absolute. Scaling those would push dressing inward for
nothing.

**8. Trees are collision.** They carry trunk hitboxes and are generated server-side. Any
layout trees must avoid (a trail, a clearing) has to live in `shared/`, not the renderer.

---

**9. `invert` also breaks the DUNGEON rule, not just `avoidsDirt`.** The decor scatter's
"nothing grows on an arena floor" test used `isDirt`, but a court is a SHAPE and `isDirt`
flips under inversion — so on an inverted dungeon every point *outside* the court read as
arena floor and the whole node's scatter was rejected. Three jungle dungeons had been
placing zero props on master because of it. `GroundLayout.inDisc` is the invert-blind
test; use it whenever you mean the shape rather than the material.

**10. Adding an rng draw to a shared generator reshuffles every biome already reviewed.**
The new `variance.presence` roll is drawn ONLY when a spec declares it, for exactly this
reason — an unconditional draw would have re-rolled plains, forest, caverns and swamp
placements that the user has already signed off.

**11. A biome can have a system that LOOKS wired and is not.** Cave had a `patrol-path`
material, monsters with patrol loops, and a server-side patrol assignment — and no
relationship between any of them: the route table was a module-level constant with no
`nodeId` in it, identical on all 21 nodes, describing a completely different shape from the
painted path. Check that the two ends read the SAME layout, not merely that both exist.

**12. Check the ART before building on a sheet.** `cave/floor-rubble-wang.png` was wired as a
second material in the caverns pass and is near-black in BOTH its halves, so its autotiling
is invisible. It was shipped as variance that could not be seen. Open the PNG.

## Per-biome status

| Biome | Nodes | State |
|---|---|---|
| Clearing / Sanctuary | 1 + 3 | **DONE** — single central plaza + 4 cardinal roads, altar dead-centre on spawn, sanctuaries share `HUB_DECOR`, sanctuary tint ramps T2→T8 |
| Caverns | 21 | **DONE** — `rubble` wired as a 2nd ground material (7/21 nodes), grouped decor variance 35–124/node |
| Plains | 12 | **DONE** — deliberately kept plain. 4 decor variance groups (172–292), trees 6–12, T2 sunset tint |
| Forest | 12 | **DONE** — seeded trails (ring/cross/partial/none), trees 24–40, dungeon 170→60 trees with a 1536 clearing, T2 green-blue tint |
| All dungeons | 26 | **DONE** — `dungeon-court` pattern on 21; swamp/volcanic keep hazard floors |
| **Swamp** | 21 | **DONE, committed `5f09a2f`, NOT visually reviewed** — procedural pools (21/21 distinct), coverage 5.4–8.5%, props 133–215, 3-tier darkening tint |
| **Mountain** | 24 | **DONE (2026-08-16), NOT yet visually reviewed** — generated ledge rings (24/24 distinct), passes painted through the gaps, `scree` wired as a 2nd material (18 stone / 6 scree), decor 51–145, 5–8 chokepoints, 4-tier cold ramp; **dungeons are a single circular arena wall** with 1–2 entrances, not the two square rings |
| **Caves** | 21 | **pass 2 DONE (2026-08-16), NOT yet visually reviewed** — generated patrol routes that the guards actually walk (10 patrolled / 8 wild), `rubble` REMOVED as broken art, cave dungeons rebuilt as ritual sites |
| Jungle, desert, tundra, volcanic, wasteland, trench | | not started |

**User's stated order:** plains → forest → swamp → mountain → **caves**.

---

## What the user has asked for, per biome

Direct quotes and decisions, so intent is not re-derived:

- **Keep plains plain.** "I wouldn't make many changes from what they are right now."
- **Dungeons**: "all the dungeons have the road/low path in the middle, with the altar, and
  no road/path anywhere else." Done.
- **Forest**: happy with overall layout and tree density; wanted path variations (O, X,
  incomplete) with nothing on the paths; dungeon should be "a loose circle of trees
  surrounding the clearing… not close to the center, aligned with the borders".
- **Swamp**: more pool variance, more prop density, props not in pools, "pool surface…
  can't be too much".
- **Tints**: they were twice reported invisible (that was bug #1). Now working and at a
  strength the user approved. They like the idea of subtle per-tier tints across biomes —
  e.g. the plains T2 sunset was their own suggestion.

### Open dials the user may want to revisit
- Forest `SHAPE_WEIGHTS` — only 1 of 10 nodes rolled `none` (unbroken forest is the contrast
  that makes a trail read as a route).
- Swamp **tier 1 is tinted**, unlike plains/forest whose T1 is the untouched baseline. Called
  out to them as a judgement call; not yet confirmed.
- `MIN_CAMERA_ZOOM` 0.4 / `MOBILE_TARGET_VIEW_WIDTH` 1350 are a **stopgap**. The user plans a
  separate mobile UI pass.
- Plains cannot get a second ground material without new art — it has one Wang sheet and no
  accepted spare. **Forest still has an unused `light-undergrowth` sheet**, already paid for.

---

## Working agreement

- **One biome at a time.** The user verifies visually, then says commit.
- **Ask before deciding.** They have answered `AskUserQuestion` rounds readily and prefer
  being asked over having choices assumed.
- **Balance numbers are theirs.** Monster `pullRange`/`leashRange`, `acquireRadius`, and
  damage values are edited by the user directly — do not tune them. Density scaling tied to a
  geometry change is fine; a balance pass is not.
- **Verify by measuring.** Every claim in the plan doc's §9 came from a throwaway `tsx`
  script in `server/test/_*.test.ts` (underscore prefix = skipped by the runner) that imports
  the real functions and prints per-node results. Delete it after. This is how the pool
  coverage, trail/trunk collisions, and prop-in-water counts were all confirmed.
- `pnpm typecheck` and `pnpm test` (76 files, ~5 min) must both be green before committing.

---

## Commits so far

```
5f09a2f feat(world): generate swamp pools per node, and keep props out of the water
cfe7d0b feat(client): forest trails, and fix the tint that was never drawn
848657d feat(client): give plains dressing variance, not just shape variance
a223f39 feat(client): start the biome visual pass -- caverns, hubs, dungeon courts
5ce76c7 feat(world): grow nodes to 4800 square, both axes together
78f25f1 feat(world): make nodes square, and fix the wedge that exposed
```

`78f25f1` also fixed a real auto-combat **wedge** exposed by the resize: the far-approach
goal in `autoTarget.ts` could land inside a blocker, and the mover then oscillated forever
instead of routing around. Guarded by `server/test/approachGoalStandable.test.ts`, which
asserts the invariant across **every** trunk — a single hard-coded trunk is exactly how it
hid before.
