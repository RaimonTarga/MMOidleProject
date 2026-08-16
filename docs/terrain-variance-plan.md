# Terrain Variance Pass — Plan

**Status:** IN PROGRESS (2026-08-14). Successor step to the square-node resize
(commit `78f25f1`). Goal, in the user's words: *"each different node should feel more
unique than they are right now."*

> ## ⚠ SCOPE — this pass is VISUAL
>
> The variance being built is **background, ground material, props, and tileset
> behaviour**. It does **not** add walls, hazards, chokepoints, or anything else that
> reshapes a fight. That was an early misreading of the brief, corrected in session.
>
> §5 below still records the **gameplay-terrain** ideas from that misreading. They are
> **PARKED, not scheduled** — kept because several are worth doing eventually, but
> nothing in §5 is in scope until the visual pass is done and the user asks for it.
>
> The live plan is **§8 (visual levers)** and **§9 (per-biome visual log)**.

This is an implementation plan. Design authority for what each biome *means* stays in
`design_docs/`; the shipped ecology truth is `docs/biome-ecology-current-state.md`
§§4, 9–11, 18–20 — read it before building, it lists what already exists so this pass
does not rebuild it.

---

## 1. Diagnosis — why nodes feel samey

Measured against the live map (170 nodes), not estimated. **Two independent systems
place terrain**, and conflating them gives the wrong diagnosis:

- **Procedural props** (`trees.ts`, `tallProps.ts` + friends) — seeded per node from the
  node ID, and they carry real trunk/rock hitboxes, so they genuinely **block movement**.
- **Authored features** (`NodeFeatureSpec`) — hand-placed templates, and the only source
  of terrain that *does* something beyond blocking (damage, slow, concealment, spawns).

| Biome | Normal nodes | Procedural props (blocking) | Authored feature layouts |
|---|---|---|---|
| mountain | 20 | — | 6 (ledge ring variants) |
| swamp | 18 | 4 trees | **2** (rot-pool templates, `% 2`) |
| cave | 18 | rock props | **0** |
| jungle | 15 | 4 trees | **2** (thicket templates, `% 2`) |
| desert | 15 | rock props | **0** |
| volcanic | 12 | rock props | **2** (lava-vent templates, `% 2`) |
| plains | 10 | 4 trees | **0** |
| forest | 10 | 15 trees | **0** |
| tundra | 10 | tundra trees | **0** (ambient chill only, non-positional) |
| graveyard (Wasteland) | 6 | wasteland trees | **0** |
| trench | 6 | **—** | **0** |

**The real gap is not "no terrain" — it is that outside swamp/jungle/volcanic/mountain,
terrain only ever BLOCKS.** No damage, no slow, no concealment, no asymmetry, no spawns.
Plains is the proof this is the right read: it has ground material, trees and props, and
it reads as a place — what it lacks is terrain that *does* anything. Trench is the single
genuine zero: no trees, no props, no features.

The second problem is duplication where authored terrain *does* exist. `authoring.ts`
assigns `featureVariant: normalIndex`, and `nodeFeatures.ts` looks templates up modulo the
array length — so swamp's 4th, 6th and 8th node are pixel-identical to its 2nd.

Three compounding causes:

1. **Hazard terrain is hand-authored literals.** ~13 templates, 92 coordinate pairs.
   Adding a node means hand-placing pools. Nobody scales that to 170.
2. **One ground material per biome.** `GROUND_LAYOUTS` gives each biome a single
   material; node-to-node variation is only *where the dirt discs land*. Subtle by
   construction.
3. **The two systems never meet.** Props scatter procedurally; features are authored.
   They were built at different times and were never joined — so the procedural half
   cannot express a hazard, and the authored half cannot scale.

---

## 2. The structural fix (do this first)

**Replace template lookup with seeded per-biome generators**, exactly the pattern
`plainsTrees.ts` / `jungleTrees.ts` / `groundLayout.ts` already use:

```ts
const rng = mulberry32(hashString(`${nodeId}:rot-pools:v1`));
```

Consequences, all of them good:

- Every node gets its own layout. 170 unique layouts instead of ~10.
- It scales to any node size for free — no repeat of the ×4/3 rescale we just did.
- New nodes cost nothing to author.
- Layouts stay **deterministic and shared**: client and server derive the same terrain
  from the node ID, which is what the existing tree system relies on. Do not break this
  — it is why terrain needs no network traffic.

Non-negotiable constraints for any generator:
- Keep gates clear (`GATE_THICK` band) and leave a walkable route between every pair of
  open exits. **Add a reachability test** — the wedge fixed in `78f25f1` is exactly what
  bad terrain generation causes.
- Respect the mover-pad; a gap narrower than `NAV_CELL_SIZE` (32px) + pad is a wall the
  A* grid cannot see through.
- Never place a blocker over the node centre spawn point or a dungeon altar.

---

## 3. The variance ladder

Three levels, deliberately separate. Only the first is about "no two nodes alike"; the
other two are what make a node *memorable*.

**L1 — Layout variance (procedural, every node).** Section 2. Cheap once built, and it
alone fixes "these two swamp nodes are literally identical."

**L2 — Node archetypes (2–4 per biome, seeded choice).** A biome picks an archetype per
node, and the archetype changes *how the fight is shaped*, not just where the props are.
This is the level that produces "oh, this is a causeway node." Most of §5 lives here.

**L3 — Signature nodes (a handful, hand-placed, whole-map).** Deliberately authored
one-offs you remember and navigate by. Rare on purpose — if everything is a landmark,
nothing is. Suggest ~6–10 across 170 nodes.

**Keep plain nodes plain.** Contrast is what makes an archetype land. If every node has a
gimmick, the gimmicks average out into noise. Target roughly: 40% baseline, 50% archetype,
10% signature.

---

## 4. Levers available today (and one that is missing)

From `NodeFeatureSpec` — all shipped, all authoring-only:

| Lever | What it does | Currently used by |
|---|---|---|
| `blocksMovement: FeatureTarget[]` | walls / chokepoints, **per-target** | mountain ledges |
| `damage` | positional DoT, has `contactBandPx` | swamp pools, lava vents |
| `statusWhileInside` | slow/chill zones (`speedMult` + `totalMs`) | jungle thickets |
| `detectionMultWhileInside` | concealment — scales monster detection | jungle thickets |
| `healWhileInside` | regen pocket, `encounterAddsOnly` flag | Void Overlord throne only |
| `spawns` (+`pullRange` override) | nests / ambush spawners | jungle bushes |
| `ambientRamp` | node-wide combat-gated ramp | volcano heat, tundra chill |
| ground zones | runtime combat-spawned circles | cave slam, wasteland pools |
| functional Wang materials | paint hitbox-accurate ground | ledges, lava |

**The single most underused lever is `blocksMovement` asymmetry.** It takes a target
list, so `['monster']` is terrain the player can cross and monsters must go around — and
`['player']` is the reverse. Across the whole map it is used **exactly once**: the Void
Overlord's `abyssal_throne` (`node-10-0`) blocks players only, and pairs that with the
map's only `healWhileInside` (monster-side, `encounterAddsOnly`) — the boss heals its adds
on ground the player cannot stand on. That one feature is the proof the lever works and
reads well; the point is that no *normal* node anywhere uses it. It is free, it is pure
authoring, and it changes fights more than any new mechanic would. Most §5 ideas lean on it.

Note the throne also demonstrates two flags worth reusing: `requiresActiveBlock` (damage
only while the block is live) and `preFinalStageOnly` (encounter-stage gating).

**The missing lever: terrain does not block line of sight.** `canReach` is pure distance
(`CollisionIndex.canReach` → `withinReach`); the mountain ledge comment says so outright —
archers shoot across the rock line. So today, cover means *pathing* cover, never *firing*
cover. Adding LoS-blocking terrain would be the single biggest change to how ranged
combat reads, and several ideas below get much better with it. It is a real engineering
task (segment-vs-shape test in the reach/targeting path, plus AI that understands it),
so it is proposed as an **explicit optional workstream in §6**, not assumed.

---

## 5. Per-biome ideas — ⚠ PARKED (gameplay terrain, NOT this pass)

*Everything in this section reshapes fights. It is out of scope for the visual pass —
see the scope banner at the top. Kept for a later decision, not scheduled.*


Each biome gets a **verb** (what its ground *does to you*) and archetypes. Numbers are
deliberately absent — placeholders would just be noise for the balance pass.

### Plains (T1, density 32, native family: none — deliberately neutral)
**Verb: exposure.** Plains is the floor biome and the tutorial for "there is nowhere to
hide." Its variance should be about *degrees of openness*, not clutter.
- **Open field** — genuinely empty. The baseline the others are read against. Keep most.
- **Hedgerow** — long thin `blocksMovement` strips forming lanes. Fights become funnel
  fights without a single new mechanic.
- **Grazing hollow** — a wide shallow `statusWhileInside` slow basin. You *can* cross it,
  you just don't want to while a pack is on you. Teaches hazard-aware movement early.
- **Cattle track** — `blocksMovement: ['monster']` scrub either side of a clear lane:
  the player's shortcut, the monsters' detour. First taste of asymmetric terrain.

### Forest (T1, density 24, alacrity)
**Verb: obstruction.** Already has the densest procedural trees; the trees ARE the terrain.
- **Old growth** — raise tree count sharply; a genuine maze where pathing matters.
- **Firebreak** — a wide straight clear corridor bisecting a dense node. A killing lane
  for ranged, a death run for melee.
- **Deadfall** — clusters of `blocksMovement` fallen trunks forming pockets you get
  cornered in. Pairs naturally with alacrity mobs that outrun you.
- **Glade** — small central clearing ringed by heavy trees. The one forest node that
  fights like plains, which is exactly why it reads as a place.

### Mountain (T2, density 16, brutality) — *already has 6 variants; extend, don't rebuild*
**Verb: commitment.** Ledge rings make you choose an entrance and live with it.
- Proceduralise the ring generator so entrance count/placement varies per node rather
  than cycling 6 hand-tuned variants across 20 nodes.
- **Switchback** — nested rings whose entrances are deliberately *not* aligned, forcing
  a long spiral. The current variants all allow near-straight crossings.
- **Scree slope** — `statusWhileInside` slow on the approach band outside the outer ring,
  so you arrive at the chokepoint already committed.
- **Watchtower** — one small ring at node centre with a single entrance. A boss-ish
  arena feel on a normal node.

### Swamp (T2, density 13, blight) — *18 nodes, currently 2 layouts. Highest priority.*
**Verb: attrition.** Rot pools that punish sloppy routing.
- Proceduralise pool fields first: count, radius, spacing, `tier` all from the seed.
- **Causeway** — one winding safe ridge through near-total pool coverage. The read is
  "stay on the path," and it makes `blocksMovement: ['monster']` reeds beside it lethal
  to ignore.
- **Bog basin** — pools ring the rim, centre is clear. Inverts the causeway: the fight is
  safe, the *exit* is the problem.
- **Braided channels** — many small pools in parallel lines; constant micro-routing.
- **Mire heart** — one enormous central pool. Everything happens around its edge.

### Caverns (T2, density 11, volatility) — *18 nodes, zero terrain. Highest priority.*
**Verb: confinement.** The biome most obviously missing terrain — caves that are open
fields read as a bug.
- **Chamber-and-tunnel** — the defining archetype: `blocksMovement` rock walls carving
  the node into 2–4 chambers joined by tunnels. Cave should be the game's corridor biome.
- **Pillar hall** — a forest of small blockers. Great with volatility (things that
  explode) since you can break contact.
- **Collapse** — a node where one whole quadrant is walled off. Simple, and instantly
  legible as "this place is different."
- **Flooded floor** — `statusWhileInside` slow across low ground, dry ledges above.

### Jungle (T2, density 27, alacrity) — *15 nodes, 2 layouts*
**Verb: ambush.** Thickets already do concealment + slow + spawns; the pieces are good,
the layouts are not.
- Proceduralise thicket fields; vary coverage hard from node to node.
- **Blind trail** — a narrow clear path with thicket on both sides the whole way. Pure
  ambush corridor.
- **Canopy clearing** — one big open centre, thicket ring. You get to *choose* to fight
  in the open, and pay travel time for it.
- **Overgrown ruin** — thickets plus `blocksMovement` stonework: concealment and walls
  interacting is a shape no other biome has.

### Desert (T2, density 11, predation)
**Verb: distance.** The standoff biome — low density, tough mobs, long sightlines.
- **Open pan** — the baseline; nothing at all, and that IS the identity.
- **Dune field** — `statusWhileInside` slow bands in parallel ridges perpendicular to
  travel. Kiting becomes expensive in one axis and cheap in the other. Strongly
  directional terrain — nothing else in the game does this.
- **Oasis** — brings `healWhileInside` to a normal node for the first time (today only the
  Void Overlord throne uses it): a small regen pocket that is also the most contested
  ground on the node. Player-side rather than the throne's monster-side use.
- **Ruin line** — sparse `blocksMovement` pillars: the only cover on an open map, and
  (if LoS ships) the archetype that most wants it.

### Tundra (T3, density 11, brutality) — *currently ambient chill only, zero positional*
**Verb: exposure over time.** Chill is a soft timer; it deserves positional counterpoint.
- **Windbreak** — `blocksMovement` ice walls that also **suppress the ambient chill ramp
  while sheltered**. Terrain that turns the biome's own soft timer off is a genuinely new
  interaction, and the ramp system is already node-scoped so this needs a small extension.
- **Crevasse field** — long thin impassable cracks; long detours, brutal with slow stacks.
- **Whiteout** — `detectionMultWhileInside` *inverted* (reduce detection) across the whole
  node: mobs notice you late, so you walk into groups. Reuses the jungle lever backwards.
- **Frozen lake** — one huge open low-friction centre. If a speed-*up* status is possible,
  this is where it belongs.

### Volcanic (T3, density 24, blight) — *12 nodes, 2 layouts*
**Verb: greed.** Heat ramp rewards staying and punishes staying longer.
- Proceduralise vent fields.
- **Vent maze** — dense vents, narrow safe routes. The read is "every second costs."
- **Caldera rim** — one enormous central lava mass; fight on the ring around it.
- **Flow** — vents in a moving-looking line across the node, splitting it in two.
- **Dormant** — deliberately no vents. The heat ramp alone. Contrast node.

### Wasteland (T4, density 27, blight)
**Verb: accumulation.** Corpse registry + raises already ship here (§11 of the ecology
doc); terrain should feed them.
- **Boneyard** — `blocksMovement` bone drifts that funnel a swarm into you.
- **Graves** — a field of `spawns` features with small `pullRange`: things come *out of
  the ground* where you stand, rather than charging in. The jungle-bush trick, re-skinned.
- **Salted earth** — broad weak `damage` field over most of the node; nowhere is fully
  safe, which suits the swarm identity.

### Deep-Sea Trench (T4, density 7, predation)
**Verb: dread.** Lowest density in the game — few, terrifying things. Terrain should make
it feel *big and dark*, not busy.
- **Abyssal plain** — vast and empty. Correct, and cheapest.
- **Vent chimneys** — sparse tall blockers; the only landmarks in a void.
- **Kelp column** — `detectionMultWhileInside` concealment that works *for the monsters*.
- **Drop-off** — a single impassable line splitting the node; you commit to a side.

### Clearing / Sanctuary (hub nodes)
Leave alone. They are paved plazas and their sameness is the point — they read as safe
*because* they are identical. Any variance here works against them.

---

## 6. Staging

| Stage | Work | Why this order |
|---|---|---|
| **A** | Procedural generator framework + reachability test; port swamp, jungle, volcanic off templates | Fixes the worst offenders and builds the tool the rest needs |
| **B** | Terrain for the empty biomes, highest node-count first: cave (18), desert (15), plains (10), forest (10) | 85 nodes go from nothing to something |
| **C** | Archetype layer (L2) — seeded archetype choice per node | Turns "different" into "memorable" |
| **D** | Tundra, Wasteland, Trench, mountain generator extension | Later tiers, shallower per the roadmap |
| **E** | Ground-material variety — more than one material per biome | Visual half of the problem |
| **F** | Signature nodes (L3) | Last: needs everything else as backdrop |
| **?** | **Optional: LoS-blocking terrain** (§4) | Biggest gameplay change here. Own decision, own budget, do not bundle |

Balance numbers stay out of scope throughout — per standing workflow, those are the
user's to tune directly.

---

## 7. Open questions for review

1. **Archetype assignment: seeded or authored?** Seeded is free and scales; authored per
   node in `regionT*.ts` gives deliberate progression (e.g. every biome's *first* node is
   the gentle one). Hybrid — seeded with authored overrides — is probably right.
2. **Should terrain vary by tier?** A T4 swamp could be denser than a T2 swamp using the
   same generator with a tier-scaled coverage parameter. Cheap, and it makes returning to
   a familiar biome at a higher tier feel like progression.
3. **How much asymmetric (`['monster']`-only) terrain?** It is the strongest lever here
   and has exactly one precedent (the Void Overlord throne, player-blocking), so there is
   no evidence at all for how the *monster*-blocking direction reads on a normal node.
   Worth prototyping on one plains archetype before committing.
4. **Is LoS worth it?** (§4/§6.) Several ideas are merely good without it and excellent
   with it. It is the one item here that is real engineering rather than authoring.
5. **Does `ambientRamp` suppression (tundra windbreak) justify extending the ramp system?**
   It is the only idea proposed that needs a system change rather than authoring.

---

## 8. Visual variance — the levers (THIS PASS)

What actually differs between two nodes of the same biome today, and what can.

| Lever | Where | Before this pass | Variance it buys |
|---|---|---|---|
| **Ground material** | `GROUND_LAYOUTS[biome]` styles array | exactly ONE style per biome | the floor itself changes node to node |
| **Ground pattern** | `patterns` weighted list | 1–4 per biome | where the patches sit |
| `invert` | style flag | jungle only | flips what reads as floor vs. patch |
| **Decor count** | `BIOME_DECOR[].count` | fixed — identical on every node | how thickly dressed a node is |
| **Decor kit subset** | `BIOME_DECOR[].variance` | did not exist | *which* props appear at all |
| `edgeJitter` | per-biome constant | fixed | how ragged patch edges read |
| `backgroundColor` | per biome | one flat colour | *(considered, not adopted)* |

`computeGroundLayout` already did `pickWeighted(rng, styles)` — **multi-material support
was there the whole time, just never used.** Several biomes have a second sheet that was
generated, reviewed and accepted, then left reachable only through the developer ground
bake-off:

- **cave** — `rubble` (now wired, see §9)
- **forest** — `light-undergrowth` (still unwired)

Check the bake-off list before commissioning art for any biome; the art may already exist.

### The decor variance mechanism

`BiomeDecorArt.variance?: { min, max, group? }` (`client/src/sprites.ts`), applied in
`paintBiomeDecor` (`client/src/scenes/game/overlays.ts`).

- Per node, a spec's `count` is multiplied by a seeded roll in `[min, max]`.
- **`min: 0` lets a spec vanish from a node entirely** — that is the kit-subset lever.
- **`group` makes specs share ONE roll.** This matters more than it looks: independent
  rolls *average out*. Three bone specs each at `[0, 2.4]` produced bone counts of 4–11
  and **zero** bone-free nodes across 21 caves — measured, not guessed. Grouping them
  makes the kit's character props move as one.
- **Absent `variance` = exactly `count` on every node**, i.e. the old behaviour. Opting in
  is per-spec, so biomes not yet designed are untouched.
- The roll is drawn *before* the texture-exists check, so a missing texture cannot shift
  the rng stream and reshuffle every later spec's placement.

### Node-size coupling (learned the hard way)

The square-node resize scaled `mobDensity`, tree counts and tall-prop counts ×4/3 but
**missed `BIOME_DECOR` counts**, which are absolute constants in a different package.
Every biome silently went ~25% sparser. Fixed globally (496 → 659 props).

**Any future node-size change must scale all four**: mob density, tree counts, tall-prop
counts, and decor counts.

---

## 9. Per-biome visual log

### Caverns — DONE (2026-08-14), pending visual review

Baseline: one ground material (`patrol-path`), 27 props/node identical on all 21 nodes.

1. **Two ground materials.** `rubble` wired as a second weighted style (patrol-path w3 /
   rubble w2). Rubble takes the layouts that do *not* imply a route — `off-center-patch`
   and `scatter` rather than a path someone walks — so it reads as unworked cave.
   Outcome: **7 rubble / 14 patrol-path** across 21 nodes. No art cost; the sheet was
   already on disk and `preloadWangGround` already queued it.
2. **Grouped decor variance.** Kit split into two families that each move as one:
   `debris` (rubble + rock shards, `[0.5, 1.55]`) and `bones` (animal + humanoid +
   ribcage, `[0, 2.2]`).
   Outcome: debris 20–40, bones 3–11, total **31–46 per node** (was a flat 36).

**Open for review:** no node landed at zero bones (~8% chance each, 21 nodes — plausible
luck). Whether that matters is a look question. 3 bones on a 3200² node already reads as
sparse and 11 as an ossuary, so chasing zero may make it read as missing art instead. The
dial is the `bones` group `max` — lowering it widens the share of the range that rounds
to nothing.

### Clearing + Sanctuaries — DONE (2026-08-14), pending visual review

Baseline: `hubPlaza` produced two detached paving discs, ONE southern trail, and three
stray scatter blobs — it read as "some paving happened here", not as a plaza. Sanctuaries
had **no `BIOME_DECOR` entry at all** and rendered completely bare.

1. **The motif.** `hubPlaza` rewritten: one plaza (two hard-overlapping discs that merge
   into a single court reaching north to seat the altar) plus **four roads to the four
   cardinal edges**. Every hub node has all four cardinal exits, so the roads match real
   topology. Deliberately NOT built on `looseTrail` — that drops ~30% of its segments to
   read as an organic game trail, which is right for a worn path and wrong for a road; a
   gap in one of these reads as a bug. New `plazaRoad` overlaps its segments so the road
   is continuous, with a sine waver so it is not CAD-straight. The stray scatter is gone:
   it diluted the shape the node is supposed to be legible as.
   *Verified: paving reaches all four edges on all four hubs, zero gaps along the roads.*
2. **Props off the plaza and paths.** `avoidsDirt` already meant "do not spawn on the
   upper material", and in the hub layouts that material IS the plaza and roads — so this
   was a one-flag change. The two garden-stone specs were the only ones missing it.
   *Verified: all 85 props per node still place successfully despite the bigger paved area.*
3. **Sanctuaries get the kit.** Clearing's array extracted to `HUB_DECOR` and shared. They
   are the same kind of place; what separates them is tint, not different props.
4. **Altar geometry made node-relative.** It was a flat `-320` offset and `560` size,
   authored against the original 3200x2400 node and **missed by both resizes** — it had
   quietly shrunk to about a third of its intended share. Now
   `RUNE_ALTAR_NORTH_OFFSET = NODE_HEIGHT * 0.1` and `RUNE_ALTAR_SIZE = NODE_WIDTH * 0.175`
   (480 / 840 today). North of centre because the node centre is the player spawn.

**Tint** (`client/src/render/biomeTint.ts`). Phaser's `TilemapLayer` does not implement the
Tint component and `Tile` exposes no tint either, so the ground cannot be recoloured
directly — the wash is a depth-banded rectangle instead. It sits at `BG_DECOR + 0.5`: over
ground, decor and feature art (altar included), under every creature. So the PLACE shifts
while players and minions keep their true palette, which matters most in the node where you
stand around inspecting gear.

**Calibration — read this before authoring any tint.** The first attempt ran alpha
0.13–0.30 and was reported as having *no visible effect whatsoever*. It was not a bug: the
depth stack was verified clean and the rectangle does render. The scene is simply dark
enough that a low-alpha wash vanishes into it. **Treat ~0.20 as the floor for "subtle but
perceptible"**, not as a moderate value.

**Keyed by `biomeGroup -> biomeTier`, not by node id.** The world runs to **eight tiers**,
so T4 is the middle of the arc, not the end — any progression needs headroom above the
tiers that exist today. Tiers with no entry render untinted, which is how a biome opts out
at its base tier. This is also the general mechanism for "a biome shifts as you climb":
a T2 plains can take a warm sunset wash while T1 plains stays untouched. Add a biome group
to the table and it works; nothing here is sanctuary-specific.

Sanctuaries walk toward the Abyss palette (`0x0a0014`) and the Overlord's violet
(`0xc44dff`) — the last safe ground looking progressively touched by what you are heading
toward. Alpha climbs in even 0.05 steps so no single tier is a jump.

| Tier | Colour | Alpha |
|---|---|---|
| clearing (tier 0) | — none — | — |
| 2 | `0x2f4f9e` cold blue | 0.36 |
| 3 | `0x3d43a4` | 0.41 |
| 4 | `0x4a2f9e` indigo | 0.46 |
| 5 | `0x5c2fae` | 0.51 |
| 6 | `0x7132bd` | 0.56 |
| 7 | `0x8a34c4` violet | 0.61 |
| 8 | `0xa63ad6` void violet | 0.66 |

Other biomes: plains T2 `0xc4622a` @ 0.32, forest T2 `0x1f6b70` @ 0.34.

**The altar sits dead centre**, on the player spawn — you arrive standing on it. It carries
no `blocksMovement`, so sharing that ground is fine. That also let the plaza collapse from
two overlapping discs to a single round court: the altar previously sat north of centre to
avoid swallowing the spawn, which forced a second lobe of paving and made the court read as
a dumbbell. Size is `NODE_WIDTH * 0.11667` — a fraction, so it cannot silently drift the way
the original literal `560` did through two resizes, but reproducing exactly that 560px today.

### Plains + all dungeons — DONE (2026-08-14), pending visual review

Plains was deliberately left plain: it is the floor biome and the baseline the rest of the
world is read against. Two changes only.

**1. Every dungeon gets an arena court.** New `dungeon-court` ground pattern — ONE round
court at the node centre under the altar, and nothing anywhere else. Dungeons previously
rolled whatever their biome's normal pattern produced (a wandering path, an off-centre
patch), so a boss node looked like any other node of its biome.

`computeGroundLayout` keeps the biome's ground MATERIAL and overrides only the pattern, so
a cave dungeon still reads as cave. Verified across all 26 dungeons: single disc, radius
537–569, altar seated in every one.

**Applies to 21 of 26.** Swamp (3) and volcanic (2) dungeons are unaffected *by design*:
their authored rot pools and lava vents drive a FUNCTIONAL Wang sheet that owns the whole
node, and `buildWangGroundLayer` discards the decorative layout entirely on those nodes
(`const layout = functional ? null : computeGroundLayout(...)`). Their hazard floor already
is the arena. Worth remembering before assuming any future ground work reaches every node.

**Jungle dungeons behave differently and correctly.** Jungle is `invert: true`, so its discs
are clearings in dominant overgrowth — the court there is open floor ringed by jungle rather
than paving on bare ground. Same intent, inverted expression.

**2. Props keep off the arena floor.** On a dungeon node the only "dirt" is the court, so
every spec avoids it, not just those that set `avoidsDirt`. Plains is exactly why: its
pebble clusters and low shrubs do not set the flag — pebbles on a worn path read fine, a
shrub sprouting mid-arena does not.

**Dungeon altar drift fixed.** It rendered at a hardcoded `setDisplaySize(250, 250)` and was
missed by BOTH node resizes — a ~5% span on a 4800 node, reading as ground clutter rather
than the centrepiece of a boss arena. Now `DUNGEON_ALTAR_SIZE = NODE_WIDTH * 0.11667` (560,
matching the rune altar) and exported from shared so the render site cannot drift from it.
**Third instance of the same bug class**, after the rune altar's size and its north offset:
a flat pixel literal for something sized *against the node*.

Swept for others afterwards. Most absolute constants in this area are **correctly** absolute
because they are sized against SPRITES, not the node — the tree `EDGE_MARGIN_*` values
(360/500/520) stop a 500px tree overhanging an edge, `edgeMargin = 110` does the same for
46px decor, and `spacingPad = 34` is a minimum gap between two props. Scaling any of those
with the node would push dressing inward for no reason.

The one remaining candidate is `centerClearRadius = 340` in `paintBiomeDecor`, which keeps
props off the node centre and IS node-intent. It still clears the 560px altar (280 half-width)
so it is not currently broken, and on hub and dungeon nodes the plaza/court already covers
that ground — but it is the one to revisit if the altar ever grows again.

**Plains T2 sunset.** `plains: { 2: { 0xc4622a, alpha 0.20 } }` — T1 untouched, T2 warm and
low. Six nodes each. Also the first non-sanctuary use of the tier-tint table, confirming it
generalises as intended.

**Plains dressing variance (follow-up, same session).** A variance audit against Caverns
showed plains had good ground-SHAPE variance (4 weighted patterns, 5-13 discs) and
**zero dressing variance** — every node carried an identical 230 props, because `variance`
had only ever been applied to the cave kit.

- **Four independent decor groups** rather than one: `grass`, `bloom`, `stone`, `scrub`.
  Independent axes multiply into distinct reads (bloomed-and-clean, bare-and-stony); a
  single shared roll would only make a node uniformly dense or uniformly sparse.
  Measured: grass 76-162, flowers 10-68, pebbles 12-87, shrubs 6-33, **total 172-292**.
- **Tree count seeded 6-12** (was a flat 9). `PLAINS_TREES_PER_NODE` is raised to 12 and
  reframed as a CEILING with `PLAINS_TREES_MIN_PER_NODE = 6` — the average holds while
  gaining spread, and `<= PLAINS_TREES_PER_NODE` stays the only safe assertion, which is
  what the collision tests already relied on. Dungeons stay fixed at 7: the arena court is
  what a boss node must read as, and a varying tree ring muddies it.

**A repeated lesson worth generalising:** a `min: 0` variance group does NOT mean "sometimes
absent". Reaching zero needs the far tail of the roll, so it effectively never happens —
measured at 0/21 for cave bones and 0/12 for plains flowers. Treat `min: 0` as "swings hard
toward nothing" and, if genuine absence is wanted, that needs an explicit presence roll
rather than a low floor.

**Still open for plains:** it has only one Wang sheet (`grass-dirt-wang.png`) and no accepted
alternate sitting unused, so a second ground material is the one remaining lever and it costs
art. Cave and forest both have a spare sheet already paid for; plains does not.

### Forest — DONE (2026-08-14), pending visual review

Baseline: identical everywhere. All 10 normal nodes carried exactly 34 trees and 119 props,
and the only ground pattern was `tree-canopy` (foliage pooled under the trees).

**Trails, and why they live in `shared/`.** New `shared/src/world/forestPaths.ts` picks a
seeded trail per node: `ring` (O), `cross` (X, diagonal — deliberately unlike the hub's
cardinal roads), `partial` (a loop with a bite out of it, or an X missing arms, so the node
reads as forest never fully cut through), or `none`.

This could not live in the client renderer. **Trees carry trunk hitboxes, so they are
collision and are generated server-side** — a trail is only a trail if nothing stands in it,
so the tree scatter has to see the same geometry. Ground rendering and decor scatter read
that one layout too, which is what keeps the painted trail, the gap in the treeline and the
gap in the undergrowth describing the same shape. Derived from the node id, so both sides
agree with nothing on the wire.

Trails paint **inverted** (foliage dominant, discs are the bare floor you walk on) — the same
trick jungle uses for its clearings. Two consequences worth knowing:

- The shape overrides the weighted pattern roll for that node, because the decision has
  already been made in shared. Nodes that roll `none` fall through to `tree-canopy` unchanged.
- **Props need an explicit path test, not `avoidsDirt`.** Under inversion `isDirt` is true
  OFF the trail and false ON it, so the flag would scatter undergrowth straight down the
  middle of the path. `isOnForestPath` is checked directly instead.

*Verified: 0 trunks sitting on a trail across all 12 nodes. Shape spread over the 10 normal
nodes came out ring 3 / cross 3 / partial 3 / none 1.*

**Dungeon density.** `FOREST_DUNGEON_TREE_MULTIPLIER` 5 -> 2. It was putting **170 trunks**
on a dungeon node at ~368px mean spacing — a wall rather than a treeline — and the x2.25
resize had quietly made it worse (75 before). Now 80 trees at ~537px, still clearly denser
than open forest (759-924px) but somewhere you can fight and path. Dungeons stay a FIXED
count on purpose: the clearing and its treeline are the shape a boss node must read as.

**Normal tree count seeded 24-40** (was a flat 34), same ceiling framing as plains.
**Decor variance on three groups** — `undergrowth` (ferns + broadleaf), `fungi` (mushrooms),
`litter` (leaf litter). Totals 73-157 against a flat 119.

**T2 tint** `0x1f6b70` at 0.22 — a cool green-blue so the same trees read as older and
deeper in, light through a heavier canopy rather than a different place.

**Open for review:** only 1 of 10 nodes rolled `none`. The weights favour it (3 vs 2/2/2) so
that is seed luck, but if unbroken forest should be more common — it is the contrast that
makes a trail feel like a route — raise the `none` weight in `SHAPE_WEIGHTS`.

**Watch:** a `cross` node generates ~104 trail discs, and `isDirt` is O(discs) per query.
Node paint runs it over every Wang corner (~5.8k), so ~600k checks per cross node. Fine at
this size, but it is the first layout dense enough to be worth remembering.

### THE TINT BUG — read this before touching tints again

Tints were reported invisible **twice**. The first response was to raise the alphas
(0.13-0.30 -> 0.24-0.34). That was wrong: the numbers were never the problem.

**`paintActiveNode` does not call `paintNodeStatic`.** They are two entirely separate
paint paths. `paintNodeStatic` builds the four NEIGHBOUR previews; the node you are
actually standing in is assembled by `paintActiveNode` from `scene.bgWang` /
`scene.bgTile` / decor. The tint rectangle was only ever wired into the first one — so it
existed only on four previews, each already buried under a 0.6-alpha black fog.

The verification that "passed" only ever checked that `nodeTint()` returned a colour from
the lookup table. It never checked that anything got drawn. **A data-level check is not a
rendering check**, and that gap is what let the same bug survive two rounds.

Fixed by giving the active path its own `updateNodeTintForNode` (+ `scene.nodeTintOverlay`).

**Trees needed a second mechanism.** The overlay only washes what renders below its depth
band. Tree roots draw just under the entities and canopies draw above them (y-sorted, so
you walk behind a trunk), putting them either side of any band that excludes creatures. On
a forest node the trees ARE the visual, so an untinted treeline over washed ground reads as
a bug. Phaser Images do support tint (only `TilemapLayer` does not), so trees and y-sorted
decor are tinted directly via `nodeTintMultiply` — the wash pre-mixed from white toward the
colour by its alpha, since `setTint` multiplies rather than alpha-blends. Flat ground decor
is deliberately NOT tinted this way: it already sits under the overlay, and doing both would
double the effect.

### Forest dungeon — the clearing is the shape

`DUNGEON_CENTER_TREE_CLEAR_RADIUS` 760 -> `NODE_WIDTH * 0.32` (1536), multiplier 2 -> 1.5.

At 760 the trees read as a loose collection covering most of the node with a small hole
punched in it. The arena is meant to BE the shape, with the treeline forming a rough circle
around it and filling out to the borders behind. Measured: 60 trees (was 170), nearest trunk
at 1552 against a 1536 clearing, farthest 2900 (the corners), ~510px mean spacing in the
treed band.


### Tint strength — final calibration

Three passes to land this, and only the last one was actually about the numbers:

1. **0.13–0.30** — reported invisible. Root cause was the WIRING bug above, not the value.
2. **0.20–0.34** — now genuinely rendering, still judged too subtle.
3. **0.32–0.66** — current. Treat **~0.30 as the floor** for a wash that reads as deliberate;
   below that it looks like a rendering artefact rather than mood.

**The two paths need different alphas to look the same.** The overlay composites
(`base*(1-a) + tint*a`); the image path multiplies (`base * mix/255`). Those agree only where
the base is white — on a mid or dark pixel like tree bark, multiply shifts the colour far
less, so trees came out visibly under-tinted against ground washed at the same alpha.
`IMAGE_TINT_BOOST = 1.35` pulls the multiply path back toward parity. It is an empirical
correction, not a derivation: exact parity is impossible, since multiply cannot lighten and
compositing can.

### Swamp — DONE (2026-08-14), pending visual review

**Correcting §1:** this doc claimed swamp had 2 authored layouts. It had **six** normal
templates, and 9 distinct layouts across 21 nodes. The real duplication was ACROSS TIERS —
`t1-swamp-01`, `t2-swamp-01` and `t3-swamp-01` were the same node three times, because the
same six templates were reused at every tier. Within a tier the six nodes were already
distinct.

**Pools are generated now** (`shared/src/world/swampPools.ts`), replacing the template
table. 21/21 distinct layouts. Rot strength still climbs with tier (`damagePerStack` =
biomeTier) — that was the only thing the per-tier templates actually varied, and it is one
number rather than a whole layout.

**Coverage-first, not count-first.** The generator picks a water BUDGET as a fraction of the
node and lets pool count fall out of it. Picking a count first lets total water swing wildly
between nodes; picking coverage first keeps a node of few large pools and a node of many
small ones equally crossable. Coverage now runs **5.4–8.5%** against the authored 8.3–9.4%,
so the ceiling came down as asked.

Two guards learned by measuring:
- **Radius is capped so the budget cannot be eaten by one or two enormous pools.** The first
  version produced a node of two vast bogs 2340px apart — within budget, but barely reading
  as swamp. The cap solves for `MIN_POOLS` pools of that size.
- **A minimum gap between pool edges.** Pools that touch merge into one bog and destroy the
  read the biome is built on: hazard-aware routing needs visible lanes BETWEEN the water.

Pools carry no `blocksMovement`, so there is no reachability risk here — unlike a wall
generator, this one cannot wedge a node.

**Props no longer stand in the water.** They already avoided feature SHAPES, but at
`featurePad = 30` against the functional sheet's `inflatePx: 32` — the sheet paints the
hazard *outside* its collision shape, so a prop could clear the shape and still be standing
in visible water. Pad raised to 64. *Verified: 0 props inside the painted pool edge.*

**Density up.** Base counts x1.6 (117 -> 189) with variance on four groups; placed props now
**133–215 per node** against a flat 117.

**Tint** darkens across all three tiers rather than shifting hue for its own sake:
`0x24301f` @0.26 (murky green) -> `0x1b2a28` @0.36 (colder) -> `0x131f26` @0.46 (dead water).
Unlike plains and forest, **tier 1 is tinted too** — swamp should read gloomier than its T1
peers from the first visit, so the wash is biome identity here, not only tier progression.

**Next biomes, in order:** mountain, caves.

### Mountain — DONE (2026-08-16), pending visual review

Baseline: 24 nodes sharing **six** ledge layouts, one ground material, 124 props identical
on every node, no tint.

**Correcting §1 again:** the duplication was the same shape as swamp's but total. The six
authored entrance sets were indexed by `featureVariant`, which runs 0–5 within a tier, so
`t1-mountain-01`, `t2-mountain-01`, `t3-mountain-01` and `t4-mountain-01` were the *same
node four times*. Every mountain layout in the game existed six times over.

**Ledges are generated now** (`shared/src/world/mountainPasses.ts`). 24/24 distinct.

The rings roll **independently**, which is the change that matters most. The old table drove
both rings from one entrance list, so the inner gap always sat radially behind the outer one
and every node was a straight run to the middle. Decoupled, you arrive in the corridor and
have to find the way up — which is the "guarded ascent" the biome is named for.

**This is the first generator in the pass that makes WALLS.** Swamp pools carry no
`blocksMovement` and cannot wedge a node; ledges can. Reachability is structural rather than
checked after the fact: the rings are concentric squares, so the corridor between them is an
annulus and is connected however the gaps fall. Outside reaches the corridor iff the outer
ring has ≥1 gap; the corridor reaches the centre iff the inner ring has ≥1 gap. Both floors
are enforced at generation. `collision.test.ts` then asserts one walkable component on the
real nav grid for **every** mountain node, not a sampled few.

Measured: **13–16 ledge segments/node** (was 10–14), gaps **3–5 outer / 2–3 inner**. The
rings still read as walls: the outer is 12–27% open across its perimeter, the inner 8–18%.

**Chokepoints are 5–8 per normal node**, one per opening. A dungeon has only its 1–2
doorkeepers, which is inherent to a single-entrance arena — but its wall still carries 6–8
posts for ledge-vaulting monsters, and those now patrol *along* the circle rather than on an
axis. The first pass at 2–4 outer / 1–3 inner
gaps bottomed out at *three* openings on a whole node, which read as sealed rather than
guarded and left too few `holdsChokepoints` monsters posted; the user called it and the gap
ranges went up. For reference the old authored layouts gave 6–12, but that counted one post
per entrance *per ring* with every entrance duplicated on both rings — one post per actual
gap is the right unit, and 5–8 of them sits in the same place.

**Dungeons get a different shape entirely: ONE circular wall around the arena, with one or
two ways in.** Two nested squares read as terrain you work your way through; a boss node
should read as a single enclosure you commit to entering, so the layout says "arena" the
moment it is on screen rather than "more mountain".

Measured across the four mountain dungeons: radius **1213–1305**, openings **542–747px** of
arc, **76–91** wall segments, 3 nodes with two entrances and 1 with a single one. Nothing
lands on the altar court.

Three implementation notes worth keeping:
- **Feature rects do not rotate**, so a curve has to be approximated. The wall is a run of
  96px SQUARES stepped along the arc — squares, because the same shape follows the ring at
  any angle — at a pitch of 82px, below the thickness so consecutive squares always overlap.
  At the cardinal points, where the step is most nearly along one axis, a pitch equal to the
  thickness would leave them merely touching. ~90 blocking shapes/node is unremarkable: a
  dense forest node already carries 60.
- **The art derives the circle back out of the segments**, exactly as the square rings
  recover their bounds. The collision squares ARE the wall, so the drawn rock and the
  blocking rock cannot drift apart. `drawMountainElevation` dispatches on the id (`_circle_N`
  never matches the square parser) — without that, an arena would have had invisible walls,
  because `buildNodePlaceholderFeatures` skips placeholders for every `mountain_` feature.
- **Dungeons draw from their own seed** (`:mountain-arena:v1`). With only four dungeon nodes
  in the world, a 50/50 entrance count is a hand-countable sample, and the shared stream
  happened to give all four a single entrance — the "one or two" the layout is meant to show
  would never have appeared. Splitting the seed also leaves the 20 normal nodes untouched.

**Passes — the ground now shows the route.** Each node paints the path worn through its own
ledge gaps: in from the node border, through an outer gap, along the corridor to the nearest
way up, through the inner gap to the centre. Derived from the same layout that places the
ledges, so the painted path cannot miss the hole it runs through — *verified: 0 of the gap
centres across all 24 nodes fall off the painted pass*.

**Two materials, read in opposite directions.** `scree` was generated and accepted long ago
and never wired past the bake-off (the cave `rubble` situation exactly). The two sheets mean
opposite things, so they invert against each other:
- `stone`'s upper is pale cracked flagstone — a trodden surface — so passes paint it over the
  dark mottled base.
- `scree`'s upper is loose pebble wash, the opposite of a path, so that style **inverts**:
  scree covers the node and the passes wear back to smooth bedrock.

Outcome: **18 stone / 6 scree** across 24 nodes (weights 3:2).

**Density unchanged, distribution varied** — bare rock is the biome, so base counts stay at
124 (the "keep plains plain" call). Four groups: `rubble` (backbone, never clears), `hardy`
and `boulder` (roll for presence), `lichen`. Placed **51–145 per node** against a flat 124,
with **6/24 nodes carrying no hardy grass** and **4/24 no boulders**.

**`presence` — the lever §8 said was missing.** `min: 0` does not buy absence; reaching zero
through the multiplier needs the far tail of the roll (measured 0/21 cave nodes, 0/12 plains).
`BiomeDecorVariance.presence` is an explicit per-group probability, opt-in, and drawn only
when a spec declares it — rolling it unconditionally would consume an extra rng draw for
every already-reviewed biome and reshuffle their committed placements.

**Tint** is the first four-tier ramp, so the steps are smaller than swamp's three: T1 stays
untouched bare rock (the plains/forest convention), then `0x7d8f9e` @0.30 → `0x6d8499` @0.38
→ `0x5c7794` @0.46 — light thinning with altitude, with headroom left above T4.

#### Two bugs found on the way

**An inverted dungeon rejected its entire decor scatter.** The rule "nothing grows on an
arena floor" tested `isDirt`, but the court is a SHAPE and `isDirt` flips under `invert` — so
on an inverted dungeon every point *outside* the court read as arena floor. `GroundLayout`
now exposes `inDisc` (disc membership ignoring `invert`) and the dungeon rule uses it.

This was **pre-existing, not introduced here**: the three jungle dungeons have been placing
**zero** biome decor on master. They now place 180. Scree mountain dungeons would have been
two more instances of it.

**A stale comment.** `nodeFeatures.ts` claimed the client painted the ledge rects with a
mountain ledge Wang tileset. It has not since the procedural cliff renderer landed;
`ground-ledge-wang.png` is now **dead art** on disk, referenced nowhere.

#### Open for review

- Whether mountain should stay at its 124 base once the passes are eating floor space.
- Dungeon arenas drop to 1–2 chokepoint posts (from 4–6 under the old square rings). Fewer
  `holdsChokepoints` monsters guard a boss node's door. Flagged, not tuned.

**Next biome:** caves.

### Caves — pass 2, DONE (2026-08-16), pending visual review

The caverns entry above wired rubble as a second material and varied the decor. This pass
fixes something more fundamental that entry did not notice.

**The painted patrol path and the walked patrol route were unrelated systems.** Caves already
had a `patrol-path` ground material, brutes/trolls with patrol loops, and a server-side
patrol assignment. Nothing connected the three. `CAVE_PATROL_ROUTES` was a module-level
constant with **no `nodeId` in it** — the same routes on all 21 cave nodes — running a 4080px
rectangle 360px from the node edges, while the floor painted a wandering `loose-center-path`
or a ~700px `ring-path` through the middle. **The guards walked the rim and the painted path
went somewhere else.** That is why the biome "was meant to have paths to patrol but just
didn't".

`shared/src/world/cavePatrols.ts` is now the single layout all three ends read — the same
role `mountainPasses` plays for ledges. The worn path on the floor IS the route the troll
walks.

**The beat is an outer circuit with two arms crossing through the middle** — a garrison walks
a perimeter and cuts across it, and the floor now shows both. This is the biome's signature
shape, so it is FIXED rather than rolled; only its proportions vary (circuit inset 731–1028px,
crossing point drifting up to 168px off dead centre).

Note this is the shape the old hard-coded constants already described — a rectangle plus a
vertical and a horizontal pingpong. Nothing was wrong with the intent. What was missing was
that anything drew it, and that it varied per node.

Three routes per patrolled node: the circuit as a **loop**, and each arm as a **pingpong**, so
an arm's guard meets you head-on rather than always arriving from the same side.

**Paths are narrow** — half-width 82px, against 144 in the first attempt and 154/134 for a
forest trail and a mountain pass. Those are routes a whole biome moves along; this is the line
worn by a handful of individual guards walking the same beat.

**Patrolled vs. wild is decided in `shared/`, and the ground reports it** rather than the
other way round. A cave is held territory or it is not: patrolled nodes wear the beat into
the floor, wild nodes are unbroken stone with no route, and their brutes roam. Outcome:
**10 patrolled / 8 wild / 3 dungeons**, 2–3 routes and 34–72 path discs per patrolled node.

**`rubble` is REMOVED as a cave material.** Both halves of that sheet are near-black, so the
autotiling between them is invisible and it renders as a flat dark slab — the user identified
it as broken. Cave is back to ONE sheet, which is the right one: its base is dark cave stone
and its **upper material is brown worn earth**, so the upper literally is the route. That is
why the patrolled/wild distinction is carried by the PATTERN here, not by the material. The
sheet stays in the bake-off list relabelled `BROKEN (no contrast)` so it is not wired again.

**Rock formations: more of them, and they block to their silhouette.** Caves now carry **15**
per node against the 9 the other rock biomes use — a cavern should read as a space broken up
by rock, not an open floor with a few boulders on it, and the formations are what the beat
threads between. Their base hitbox was also far too narrow: a 465px formation blocked across
only ~60px once scaled, so you walked through most of the visible rock. Cave trunks now block
**~105–125px wide** (halfW 132–156 before scaling). Height is deliberately unchanged — a
deeper base would make them block from well below their footprint.

They keep off the beat, since they are collision and one standing in the path would block the
guard that walks it. *Verified: 0 formations on a patrol path across all 21 nodes, and every
node still one walkable component with 15 wider rocks on it*, both asserted in
`collision.test.ts`.

#### Cave dungeons — the ritual site

Radial paths converging on the altar, ringed by standing stones: the one thing a cave boss
room can be that a cave corridor cannot is somewhere that was **built**.

The stones are the biome's existing tall rock formations, repositioned rather than newly
authored, so they keep the trunk collision they already carry — blocking, with the ring
broken at every spoke. Measured: radius **1149–1182**, **4 spokes**, **7–8 stones**, one
walkable component on all three.

Two things that shaped it:
- **Spokes run to the node's REAL exits.** Not a rolled rotation. It ties the site to the
  map's topology so the paths lead where you actually walk, and — not optional — it keeps the
  stone ring off the centre-to-gate travel lanes that every other rock formation in the game
  is required to clear. Cave dungeons are dead ends with only 1–2 exits, so the spoke count
  is topped up to four with diagonals, which cannot threaten the cardinal lanes. A site with
  a single path reads as a corridor, not as somewhere converged upon.
- **Cave dungeons force the worked floor.** A ritual site was built, so its court and spokes
  paint the worn-earth upper material. Same principle as mountain's scree: the material has
  to agree with what the shape claims happened here.

This is the one place the "a dungeon is a court and nothing else" rule is relaxed, at the
user's explicit request.

#### Open for review

- **11 patrolled / 7 wild** comes from `PATROLLED_CHANCE = 0.53`, set against the actual draw
  rather than as a nominal probability — over eighteen nodes the draw matters more than the
  constant, and the nominal 0.66 left only three wild caves. One constant to move.
- Cave bones still use `min: 0` for absence, which the caverns entry flagged and which
  `presence` (added in the mountain pass) now actually solves. Not applied — it would reshuffle
  caverns placements the user has already reviewed.

### Desert — DONE (2026-08-16), pending visual review

Baseline: one ground material (`hardpan`), 2–3 wind-stripped pockets per node, 85 props
identical on all 18 nodes, no tint. The user's read going in was that the biome was already
mostly right and the work was to keep props off its paths — which turned out to mean two
things, because the paths it should have did not exist yet.

**Desert is the first biome whose route layout is mostly ABSENT.** `shared/src/world/
desertTracks.ts` generates at most one caravan track per node and, on most nodes, none:
`none` is weighted 5/9 against forest's 3/9. Open pan is the identity here, so a track is a
landmark rather than a texture. Outcome: **7 tracked / 8 open pan / 3 dungeons exempt**,
coverage 1.9–5.0% of the node on a tracked one.

**The track does not serve the node's exits, and that is the point.** It enters one edge and
leaves another at positions deliberately kept out of the middle third of each side, so it
never lines up with a gate. It is a road going somewhere else, crossing ground you happen to
be standing on. The hub's cardinal roads are the deliberate opposite — those exist to match
real topology.

Two shapes, both non-inverted (hardpan is scoured ground, so the road IS the upper material,
exactly as a mountain `stone` pass is):

- **`through`** — edge to edge, mostly straight across with a 30% chance of a quarter turn,
  under one long slow drift rather than forest's short hand-cut sway.
- **`broken`** — arrives from an edge and stops, tail dissolving into sand (radius tapers,
  discs start dropping out). A road that fails is a stronger desolation read than one that
  works: something used to come this way.

A tracked node keeps 1–2 of its usual wind-stripped pockets. A node that traded every scoured
patch for a road would lose the texture that makes open pan read as desert rather than as a
blank sheet with a line drawn on it.

**Trackless nodes render byte-identical to before this pass.** The track overrides the
pattern roll only when one exists, so the weighted `sparse-scatter` / `off-center-patch`
draw on the other eight nodes is untouched — the same discipline trap 10 forced on the
`variance.presence` roll.

**Every desert spec now sets `avoidsDirt`**, which no other biome does. Hardpan here always
means ground the wind scoured bare, whether that is a pocket or a road, and nothing settles
on scoured ground. The decor scatter additionally tests `isOnDesertTrack` with the same 20px
clearance the other three route biomes use, because `avoidsDirt` tests the disc exactly and a
stone cluster one pixel off the edge of a road is still a stone cluster in the road.

**Four decor variance groups**, because the desolation lever in this biome is EMPTINESS
rather than a change of dressing. `stones` and `debris` are backbone and swing wide but never
vanish; `scrub` (the only living thing in the kit) and `cairns` roll `presence` and do.
Outcome: **37–112 props/node, mean 77**, with **6/18 nodes carrying no scrub at all** — dead
ground — and 7/18 no stacked stone. *Verified: 0 props on hardpan and 0 on a track across all
18 nodes.*

**Hoodoos clear a track by 210px**, more than cave's 190 for a patrol beat: a desert formation
is the tallest thing for a screen in every direction, so one straddling the road is the
loudest possible way to say nothing ever travelled it. Asserted in `collision.test.ts`
alongside the cave beat, and in `server/test/desertTracks.test.ts`.

**Tint T3–T4.** Desert has no T1 — it starts at tier 2 — so **T2 is its honest baseline and
stays untouched**, the same convention plains T1 and mountain T1 keep. T3 takes a bleached
ochre haze (`0xc79a4e`, 0.32) and T4 dust-red (`0xa8542e`, 0.42): somewhere that has been
burning for longer, not a different desert. Deliberately not cooling toward night — volcanic
owns "hotter still", and desert's identity is exposure.

#### Desert dungeons — the end of the road

Every other biome exempts its dungeons from its route layout, because a road across an arena
fights the one thing a boss node has to read as. **Desert takes the opposite line, at the
user's request.** The road does not cross the court — it ENDS at it.

The `arrival` shape is never rolled: every desert boss node has one and only they do. It
comes in from a REAL travel gate, straight to the court, and stops. That is the deliberate
inversion of the rest of the biome: open-pan tracks refuse to serve the node's gates because
they are going somewhere else, so the one road that arrives the way you do, and terminates on
the altar, reads as the destination all of them were heading for.

Three details that make it work:

- **It runs along a centre-to-gate travel lane, which costs nothing.** Rock formations are
  already required to clear those lanes, so nothing can stand in the road; and on a dungeon
  node the decor scatter rejects every disc of the ground layout, so it ends up swept as well
  as clear. No new exclusion was needed for either.
- **The sway is a fixed half-wave** (`fixedSway: 1`), so the drift returns to the line at both
  ends. An open-pan track rolls its sway and does not care where it lands; a road that has to
  arrive somewhere exact does.
- **It stops at `0.08 * W`, well inside the court rather than at its rim.** The last disc of a
  run lands anywhere within one `TRACK_STEP` of its target, so a road aimed at the rim can
  finish a step short and leave a band of sand between road and court — the one seam that
  would break the shape. Caught by the test asserting on PAINT (`distance − radius`) rather
  than on disc centres, which is the same distinction trap 15 is about.

#### Why the first cut was invisible, and the fix

The user could not find a road in play. Two causes, one of them a genuine rendering finding:

**1. Half the biome had no road, including the door.** `SHAPE_WEIGHTS` kept `none` at 5/9,
which gave 7 tracked nodes out of 15 — and `t2-desert-01`, the node you enter the desert
through coming from swamp, was one of the eight blanks. Weights are now even (3/3/3):
**11/15 tracked**, and the entry node carries a `through` road.

**2. `edgeJitter` was eating the line.** The autotiler wobbles every corner test by up to
`edgeJitter` CELLS, and desert's is 1.4 — **90 world px** of random noise against a road
whose half-width was 125. The solid core was therefore only ~70px, with a wide speckled
fringe either side: the road painted as a *smudge*, not a line. This is the same class of
problem as trap 12 (open the art) but one layer further in — the art was fine and the
autotiler was destroying the shape.

`DirtDisc.jitter` (default 1) is the fix: a per-disc multiplier on the biome's edge wobble,
so a **line can be crisp on the same node where a blob is ragged**. Road discs pass 0.35;
the wind pockets beside them keep the full 1.4, because a blob *should* look eroded. Nothing
already reviewed moves — absent means 1.

**Ruled out before touching anything**, so it is not re-derived: both paint paths reach
`computeGroundLayout` (trap 1), `preloadWangGround` queues the desert sheet, and the sheet's
base-to-upper contrast is **ΔLum 48.7 — third strongest of the ten ground sheets**, double
the cave patrol path's 23. The art was never the problem.

#### The road is thin, long and dashed

The user's brief on seeing it: *"more pronounced, maybe longer, but not thick, rather thin
patches."* Width is the wrong lever on open sand — a wide band reads as a discoloured area
rather than as something travelled. So:

- **Half-width 125 → 91px**, now the narrowest route line in the game (cave's beat is 82, a
  forest trail 154, a mountain pass 134).
- **A chain of worn stretches**, not one ribbon: patches of 700–1500px separated by 220–520px
  of swept sand. Wind does not scour a road evenly, and at this width a dashed line carries
  "something crossed here" better than a continuous strip. Both ENDS are always emitted
  whatever the patch phase, so a road still runs off the node edge and an arrival road still
  reaches its court.
- **`broken` runs much further before failing** — 0.6–0.9 of the on-node crossing, up from
  0.45–0.75 — and its tail now drops whole stretches rather than individual discs, because
  sand takes a road in lengths.

Outcome: **11/15 open nodes tracked** (plus all 3 dungeon roads), 27–52 discs per road, props
84.8/node mean (was 77 at the sparser weights, 85 before the pass). *Verified: still 0 props
on hardpan and 0 on a track.*

#### The corner-clip defect (worth keeping)

The first draft let a quarter-turn track pick both its edge points either side of the same
corner. `t3-desert-02` came out with its entire road off the map bar one disc — 0.45%
coverage against the 3% its disc count implied. Two fixes, both kept:

- Adjacent-side ends are now forced to the half of each edge AWAY from the shared corner.
- A `broken` run is a fraction of the **on-node** crossing (Liang-Barsky clip), not of the
  raw segment. "Three-quarters of the way across" now means that on every geometry.

`desertTracks.test.ts` asserts ≥6 discs land strictly inside the node, so this cannot come
back silently. **A disc count is not a coverage measurement** — the throwaway script printed
both, which is the only reason it was caught.

#### Open for review

- **11/15 tracked** is `SHAPE_WEIGHTS` at 3/3/3. This went UP from 7/15 to make the feature
  findable; if the biome now reads too travelled, raising `none` is the one constant. Only
  `t2-desert-03`, `t3-desert-03`, `t4-desert-03` and `t4-desert-05` are unbroken pan now.
- **`ROAD_JITTER = 0.35` and `PATCH`/`GAP` are the look dials.** Lower jitter = crisper line;
  longer gaps = more dashed. Both are per-road and cannot affect another biome.
- **Mean props 77 against the old flat 85** (−9%). The variance ranges hold their group means
  at ~1.0, but the two `presence` groups average below it by construction. Raising a presence
  group's `max` is the dial if the biome now reads too bare.
- Desert still has **one Wang sheet and no accepted alternate**, the same position plains is
  in. A second material would need new art.

### Cave tints — added 2026-08-16

Caves shipped their pass 2 with no tint entry at all. Added, on the same tier-indexed ramp
everything else uses:

- **T1 untinted** — honest cave stone, the baseline convention plains, forest and mountain
  all keep at their base tier.
- **T2 `0x2f6b6b` @ 0.32** — mineral teal, wet stone.
- **T3 `0x5a3f8c` @ 0.44** — crystal violet.

The ramp says the ROCK changed rather than only the light, which is the one thing a descent
can do that an ascent cannot. T3 has support on screen already: `deep-spider`, `cavern-troll`
and `crystal-gargoyle` are all down there. Headroom is deliberate — a T4+ cave can push
further violet toward the Abyss palette without rewriting these.


### Jungle — DONE (2026-08-16), pending visual review

Baseline: the user liked the look and asked only for variance between nodes. Measuring it
found why there was none.

**Fifteen walkable jungle nodes shared TWO authored bush layouts.** A four-bush set and a
three-bush set, alternating by `featureVariant`, at *identical coordinates and identical
radii* every time — so the biome's defining feature sat in the same place on every node in
the game. All three dungeons shared one identical set. Same disease mountain had with its six
entrance sets, one severity worse, and jungle was the last biome still on a template table.

`shared/src/world/jungleBushes.ts` generates them per node now: **4–6 thickets, radii
360–500**, all fifteen layouts distinct. The `denseBush` gameplay values are untouched — only
WHERE and HOW MANY varies.

#### Arrangements, and why they are dealt rather than rolled

What makes two nodes feel different is not coordinates, it is the relationship between cover
and open ground. Four arrangements:

- **`gauntlet`** — thickets flank a lane through the node; crossing means running a corridor
  with cover on both sides. The ambush read at its strongest.
- **`ring`** — cover on the perimeter, middle open. You fight in the clear and every approach
  is through a thicket.
- **`cluster`** — one dense mass (the only case thickets may MERGE), rest of the node open.
- **`scatter`** — the read the authored sets had, kept as the neutral case.

**They are DEALT from a shuffled deck, not rolled per node**, and that is a finding worth
keeping. An independent roll gave scatter 6, gauntlet 5, ring 2, cluster 2 against a target of
4/4/4/3 — the most distinctive arrangement on two nodes and the neutral one on six. The cause
is not the weights: **`mulberry32` seeded from a string hash produces a FIRST draw that clumps
for structured seeds** — 7 of the 15 jungle node ids came out above 0.818, which was exactly
the scatter band. Burning a draw only moves the clump (the second draw had nothing above 0.81
at all, which starves scatter instead).

Fifteen samples will never look uniform. The deck (largest-remainder allocation + fixed-seed
Fisher-Yates over sorted node ids) guarantees the mix and guarantees the player meets all four
arrangements, which is the entire point of having them. Outcome: **cluster 4, ring 4, gauntlet
4, scatter 3.**

#### Trees follow the arrangement

Tree count was flat at 9. It now runs **6–13, decided by the arrangement rather than rolled
independently**: a `cluster` node already has its cover in one mass and wants the rest open
(6–9), a `scatter` node has thin cover everywhere and can hold a proper canopy (10–13).
Independent rolls would average this out and every node would read as "some trees, some
bushes". *Verified: 0 nodes fall short of their target, so the two constraints (thicket
clearance 490px + tree separation 620px) still leave room at the top of the band.*

#### Jungle dungeons — the hacked clearing

Bushes removed entirely, at the user's request. That also fixed a defect: the three dungeon
thickets were named `boss_bush_a/b/c`, and the art scatter matches `jungle_bush` — so they
never had art and **rendered as the debug hazard placeholder** (a translucent circle with
concentric rings) on all three boss nodes.

The clearing is jungle that was CUT, not jungle that happens to be open. The inverted layout
already gave the right shape (the disc is a pocket of open floor in dominant overgrowth); what
was missing was the EDGE. Every other court takes the autotiler's full `edgeJitter` so its
outline reads as worn — correct for an arena that was uncovered, wrong for one hacked out with
blades. **The clearing damps jitter to 0.3**, the same lever the desert road uses for the
opposite reason, and the boundary reads as a cut line.

Radius is `0.135 * W` rather than the standard `0.115`, because the trees now **ring** it:
trunks sit in a narrow annulus just outside the cut edge (measured 934–1191 against a 648
clearing), evenly spaced with angle and radius jitter so it reads as a treeline, not a fence.
At the standard radius the ring closed in tight enough to read as a wall. Same principle as
the cave dungeon's standing stones: same trees, same collision, placed with intent.

#### Decor and tint

**Four decor variance groups** on the heaviest kit in the game (it had none). Backbone groups
`undergrowth` (ferns + broadleaf) and `vines` swing wide but never vanish — a jungle floor
without ferns is not a thinner jungle, it is a different biome. Character groups `flowers` and
`stones` roll presence and do vanish. Outcome: **props 70–243/node, mean 160** (was a flat
180), with **6/18 nodes carrying no flowering accent and 6/18 no mossy stone**.

**Tint T3–T4.** T2 untinted — it is jungle's base tier, the same honest-baseline convention
plains T1, mountain T1 and desert T2 keep. T3 `0x1f5a2e` @ 0.32 (humid green, the canopy
closes), T4 `0x143f26` @ 0.42 (choked). Deliberately kept green rather than drifting to
black-green: swamp already owns "dead and cold" three tiers deep, and two biomes converging on
one wash makes both weaker.

#### Dead code removed

The two jungle template entries (`node-3-7`, `node-3-8`), the dungeon set (`node-2-8`), the
`JUNGLE_NORMAL_TEMPLATES` id list, and the now-meaningless `JUNGLE_TREES_PER_NODE` constant
are all deleted. The `collision.test.ts` tree-count invariant now asserts against the node's
own `jungleTreeTarget` instead of one flat number for the biome.

#### Open for review

- **Arrangement mix 4/4/4/3** is `ARRANGEMENT_WEIGHTS`. Because it is dealt, changing a weight
  changes the guaranteed count rather than a probability.
- **Thicket count 4–6 and radii 360–500** — the authored sets ran 3–4 at 390–480, so both were
  widened. Gameplay values (2x detection, 0.55 speed) are untouched and remain the user's.
- **Props mean 160 against the old flat 180** (−11%), the same presence-group arithmetic the
  desert pass flagged.


### Tint modes — `wash` vs `saturate` (2026-08-17)

The jungle tint was rejected on sight: trees came out muddy. The cause is structural, not a
value, and it produced a second mode rather than a tweak.

**A `wash` (the original model, an alpha-blended rectangle plus a matched multiply on
sprites) can only pull pixels TOWARD one colour.** On a biome whose art is already in that
hue it deletes the contrast that made the art read — jungle foliage under a deep-green wash
multiplies to roughly 50% on every channel, which is mud. That is inherent to the operation:
a wash is atmosphere (haze, failing light, cold air), and atmosphere flattens.

**`saturate` multiplies by the hue with its brightest channel left at full**, cutting only the
competing channels. Jungle T4 moved from `(48%, 57%, 52%)` — uniformly dark — to
`(60%, 100%, 73%)`: greens untouched, the red and blue that were greying the canopy out
removed. Deeper jungle is now *ranker* jungle rather than dimmer jungle, which is what the
user asked for.

Two things fell out of it:

- **The two render paths become exact.** In `saturate` mode the ground rectangle is a
  MULTIPLY at full alpha by the same colour the sprites are tinted with, so the overlay and
  the trees are literally the same operation. `IMAGE_TINT_BOOST` — the empirical fudge that
  exists because an alpha-blended rectangle and a multiply tint can never match — does not
  apply in this mode at all.
- **Blend modes are mostly unavailable.** See trap 18: OVERLAY / SOFT_LIGHT / SATURATION are
  no-ops under Phaser WebGL. MULTIPLY-with-a-chosen-colour is the only route to saturation,
  which is why the mode is built the way it is rather than as a blend-mode switch.

Mode is per biome and absent means `wash`, so **no already-reviewed ramp moved.** Only jungle
is on `saturate`. If it reads well there, plains/forest/desert are the candidates to follow —
all three are washes over art that is already in the wash's own hue.

**Thicket sprites were never tinted at all.** `buildFeatureScatterImages` never called
`nodeTintMultiply`, and the props are y-sorted, so they draw above the overlay band and it
could not reach them either — a tinted jungle node showed washed ground with full-colour
bushes standing on it. Fixed the same way trees are, including the flat/y-sorted distinction
so non-ySort scatter is not double-tinted.


### Volcano + Tundra — DONE (2026-08-17), pending visual review

The user was happy with both overall and asked for four specific things: bigger/more lava,
more volcanic rock, tundra ice in big frozen-lake chunks rather than small patches, and
nothing standing on the ice. Measuring first found the same template disease a third time.

#### Volcano

**Twelve walkable nodes shared TWO authored vent layouts** (four-vent and three-vent sets,
alternating at identical coordinates), plus two more for the dungeons — four distinct
layouts across fourteen nodes. `shared/src/world/volcanicLakes.ts` generates them now:
**14/14 distinct**.

**Lava is few and big.** 2–3 lakes at r 620–770 on a normal node, against 3–4 vents at
r 360–450 before. Coverage went **6.6–9.0% → 12.2–17.3%**, at the user's explicit request —
and it is flagged in the source as a BALANCE number, because every point of it is floor that
burns. `MIN_COVERAGE`/`MAX_COVERAGE` is the constant to move if volcanic plays too
punishingly.

It borrows swamp's **coverage-first** idea (pick the area budget, let the COUNT fall out of
it) but inverts its intent. Swamp's `MIN_POOLS = 3` exists to stop the budget being eaten by
two enormous bogs, because a swamp wants a crossable field. Volcano wants exactly what swamp
guards against, so its floor is **2** — that single constant is what makes a lake able to
take half the budget.

**Rock formations 9 → 15**, matching caves. A caldera should read as broken ground the lava
threads between. They already clear feature footprints by 260px, so they keep off the lava
for free, and `collision.test.ts` still passes with 15 of them on every node.

#### Tundra

**The ice was five to fourteen small discs (r 80–415), about 3% of the node** — a rash of
patches. It is now **2–3 frozen lakes at r 649–755, 11.5–19.5%**, generated per node, 12/12
distinct.

**The important half is that it moved into `shared/`.** The ice was pure renderer state,
which is exactly why nothing respected it:

- **Trees stood in the middle of the lakes.** Trees carry trunk hitboxes and are generated
  server-side, so they could not see a client-only ground pattern — trap 8 all over again,
  the same reason forest trails had to move.
- **Props sat on the surface.** Only the seven vegetation specs set `avoidsDirt`; the rocks
  and drifts did not, which was right when the ice was wind-polished patches and wrong now
  that it is a lake.

Both now test the shared layout directly (`isOnTundraLake`), trees with a 150px shore
clearance. *Verified: 0 trees and 0 props on ice across all 12 nodes, and the kit still
places its full 159 props.*

**Tundra dungeons inverted.** The old `dungeon-court` pattern painted the arena floor itself
as ice, so the boss was fought on the lake. At the user's call the arena is now cleared solid
ground with the lakes pushed to the sides — terrain you can be pushed toward rather than the
floor you stand on.

**Jitter is damped to 0.55** on a lake disc: a lake freezes to a smooth edge, and the
autotiler's full 1.2 cells of per-corner wobble made the shoreline read as a torn patch. Not
as hard as the jungle clearing's 0.3 — a shore is irregular, just not ragged. Third use of
`DirtDisc.jitter` and the first where the answer was neither extreme.

#### The dungeon geometry defect (worth keeping)

Both generators produced **too little or NO lava/ice on dungeon nodes** on the first cut —
one lake on the T3 volcanic dungeon, zero on the T4, and zero on both tundra dungeons.

Not a tuning miss, a geometric impossibility. A lake must fit between the arena clearance and
the node edge, and on a square node the furthest a lake centre can sit from the middle is
`sqrt(2) * (half - edgeMargin - r)` — in a corner. Solving against tundra's 0.3 arena
clearance admits nothing above r≈612, which is **below that biome's own minimum radius**, so
the loop rejected every candidate and returned an empty node.

**A "few and big" generator cannot satisfy a large centre exclusion on a square node.** Both
biomes now carry a separate dungeon band (roughly r 400–560 at 7–12% coverage), which is also
the read the boss exam wants: lava ringing the edges with the middle clear. The smoke test
asserts every volcanic and tundra node has at least one lake, so an empty node cannot come
back silently.

#### Open for review

- **Volcanic coverage 12.2–17.3%** is the balance dial, and it roughly doubled.
- **Volcanic rock 15/node** — one constant (`VOLCANIC_TALL_PROPS_PER_NODE`).
- **Tundra coverage 11.5–19.5%.** Purely a look number (the ice does nothing), but it costs
  the nine trees floor space, so it is bounded by placement rather than by taste.
- Neither biome got decor variance or a tint this pass — the user is happy with both as they
  are, and neither was asked for.


#### Volcano + tundra tints (2026-08-17)

Added after the layout work, and they are a deliberate PAIR: at T3-T4 these two biomes sit
beside each other on the map, so one goes hotter and more vivid while the other goes colder
and dimmer.

**Volcano — `saturate`.** T3 `0xd4521a` @ 0.30, T4 the same hue at 0.46. It is the clearest
case for the mode: basalt and ash are mid-grey, so a warm multiply (255, 183, 152 at T4)
reads as firelight thrown across the rock and makes the lava lakes pop. A wash toward orange
would have pulled ash and lava toward each other, flattening exactly the contrast the biome
is built on.

**Tundra — `wash`, and it is the one biome where a wash is clearly right rather than a
compromise.** T3 `0x3a5c8c` @ 0.30, T4 `0x1e3559` @ 0.42.

The jungle failure was a dark wash over dark art — it deleted the contrast that made foliage
read as foliage. Snow is the opposite case: near-white, high-luminance, with contrast to
spare. Blending it toward blue gives the blue-hour read the biome wants, and the dimming IS
the effect rather than a cost. On the snow base tile (215, 224, 235) the ramp lands at
(168, 184, 207) then (137, 152, 174) — unmistakably dusk, nowhere near crushed. Saturating
instead would have kept the glare, which fights deep winter.

Kept properly blue and dark, deliberately unlike mountain's pale desaturated grey-blue
(mountain T4 lands at (113, 130, 149) on mid rock). Mountain is thin air with the colour
washing out of it; tundra is dusk on snow. Two cold biomes converging on one grey would make
both weaker.

**Both biomes tint their base tier**, unlike plains/forest/mountain/desert/jungle. Volcanic
and tundra both start at T3, so there is no "ordinary" tier of either to hold as a baseline —
the same call swamp makes, where the wash is biome identity rather than only tier
progression.

**Tint coverage after this pass:** every biome group except wasteland and trench, which are
the two still awaiting their layout pass.


#### Volcano — 3 lakes, and why the radii are dealt (2026-08-17)

Two lakes did not read as a caldera in play (user's call), so `LAKE_COUNT` is **3**, with the
coverage budget held where it was. Raising the count without touching the budget makes each
lake smaller rather than making the node hotter — a composition change, not a balance one.
Outcome: **3 lakes on every normal node, r 456-753, coverage 14.2-17.0%** (was 12.2-17.3% at
two lakes).

**Fixing the count exposed a second problem: the sizes collapsed.** Radius was drawn from
`[MIN_RADIUS, budget solved for the count]`, and once the count is fixed those two bounds sit
almost on top of each other — one node measured 607/623/654, a spread under 8%. Three
near-identical circles read as one shape stamped three times.

Radii are now **dealt from the AREA budget**: split it into uneven shares (±45%), take
`sqrt(share / pi)` for each, place largest first because a big lake has the fewest legal
positions. Coverage stays an exactly controlled number and the composition stops looking
generated — 753/527/521 and 710/604/549 rather than three of the same.

Dungeons use the same count at a smaller size, matching the authored boss layouts (three
vents ringing a clear arena). At four the even share fell BELOW the dungeon radius floor, so
every lake clamped to it — which silently inflated dungeon coverage to 9.5-11.1% and threw
away the size variation the shares exist to create. At three, nothing clamps: 8.5-9.2%.


### Wasteland + Deep-Sea Trench — DONE (2026-08-17), pending visual review

The last two biomes. The user was happy with both and asked for variation, plus more density
in the trench, plus "think of a way to make the dungeons special".

Two premises were already satisfied and are worth recording so nobody re-does them:

- **Wasteland props already sit on the ash.** The kit sets `avoidsDirt` on nothing, and its
  comment says so explicitly ("bones settle ON the ash drifts by design"). No change needed.
- **Neither biome has any features at all** — no hazards, no positional terrain, nothing.
  Both are pure decor plus trees or rocks, single-tier T4, seven nodes each.

#### Wasteland — drifts, not roads

The user's instinct that the ground did not read as paths was correct: `loose-center-path`
held 2/7 of the pattern roll, and on ash art it has no worn-track character, so a trail
through it just looked like a patch that happened to be long. **The path pattern is gone
entirely** — the biome now rolls one pattern, `ash-drift`.

An ash bank is a CLUSTER of two to four overlapping discs walking away from a start point,
not a circle: a single disc reads as a stamped blob, overlapping lobes read as something the
wind piled up, and the lobes share a drift direction so the bank has a heading. Three to six
banks per node, each with its own size scale, so a node can hold one broad drift and three
small ones.

**Four decor variance groups** on a kit that had none: `drifts`, `thorns`, `bones` (long
bones + skulls) and `remains` (the collapsed ribcages, presence-rolled at 0.55 so the big
finds appear on about half the nodes).

#### Wasteland dungeon — the grave rows

Every other special dungeon in the game is a ring or a radius: cave's standing stones,
jungle's cut clearing, mountain's circular wall, desert's road to the middle. A fifth would
have read as the same idea again.

So this one is **rows** — regimented lines of dead trees marching across the node, the only
orderly thing left anywhere in the world, on the biome that was literally called `graveyard`
before the art rename. The order is the horror: something laid these out.

- **The rows fray**: jitter grows with distance from the centre, crisp by the arena and
  falling apart at the edges. Rows that decay read as something that was maintained and then
  was not; perfect rows everywhere would read as a texture.
- **The arena is a GAP in the grid**, not a circle imposed on it — markers are dropped where
  the court is, so the rows visibly continue on the far side. The graves were cleared here,
  rather than being arranged around a clearing.
- The grid is rotated per node, because a grid parallel to the node border reads as a
  tilemap artefact rather than as a graveyard.

Measured: **43 markers in 9 rows, 5-7 per row**, arena clear, one walkable component.

**The tuning failure worth keeping:** the first cut set the fray at 0.055 of the node — a
wander comparable to the gap between markers — and thinned survivors hard. The grid dissolved
into a 17-marker scatter, which is the exact thing rows exist to avoid. Decay has to stay
legible AS decay: the wander is now bounded well under half the marker spacing. The smoke
test recovers the row axis by best fit and asserts the markers still quantise onto distinct
lines, so this cannot regress quietly.

#### Trench — density

Decor **103 -> 155 props** per node (+50%) and rock formations **9 -> 15**, matching caves
and volcanic. A chemosynthetic trench floor should be crowded, and the formations are what
the tubeworms and anemones grow around. Five variance groups added (`coral`, `worms`,
`anemones`, `silt`, `whalebone`). Nav still resolves to one walkable component with 15
collision rocks on every node.

#### Trench dungeon — the whale fall

A whale fall is the iconic deep-sea landmark: a carcass that sinks to the abyssal floor and
feeds an ecosystem for decades. The arena is built around one.

**The shape is a LINE, and that is the point.** Every other special dungeon resolves inward
on the middle; a spine laid across the node is the only one with a direction, so the room
reads differently the instant it is on screen.

Built from the existing `trench_whale_vertebra` art, scaled up and **rotated to the spine's
tangent** — vertebrae that do not turn with the curve read as a row of unrelated stones
rather than one animal — and tapering from ribcage to tail. There is no rib art in the biome,
so the skeleton is the spine alone. Measured: **12 vertebrae, scale 0.73-1.47**, rock
formations clear of it.

**The bow-versus-S defect, which is a correctness matter rather than a taste one:** the first
cut bowed the spine with a cosine, whose maximum curvature sits at the CENTRE — exactly where
the altar gap removes the vertebrae. The result was two straight arms meeting at a visible
20-degree kink across the altar. An S-curve (`sin`) is straight through the middle and bends
out at the flanks, so the carcass stays continuous no matter how wide the gap is. The smoke
test compares the headings of the two vertebrae nearest the centre and fails on a kink.

#### Tints — CONJECTURE ONLY, deliberately not wired

The user asked for these to be recorded rather than built ("something for future me"). Both
biomes are single-tier T4, so there is no ramp to evaluate yet.

**Wasteland — desaturate to look deader.** Achievable today with the existing `wash` mode and
nothing new: *blending toward a neutral grey IS desaturation*, because it pulls every channel
toward the same value. Suggested `0x6b6560` at ~0.30 — a warm-neutral ash grey rather than a
cold one, so it reads as dust rather than as fog. Wiring cost: one entry in
`BIOME_TIER_TINTS`.

**Trench — darker with higher contrast.** Half of this is easy and half is not, and the hard
half is the reason it is not being attempted:

- *Darker* is a `wash` toward near-black blue, e.g. `0x0a1826` at ~0.35.
- *Higher contrast* *cannot be done with the current mechanism at all.* Contrast means darks
  darker AND lights lighter, and the only real WebGL blend modes available are MULTIPLY, ADD,
  SCREEN and ERASE (trap 18). MULTIPLY scales every channel by the same factor, which shrinks
  the differences between them — it reduces contrast. Compositing a rectangle can only ever
  be a linear `y = kx + b` with `k <= 1`. Genuine contrast needs an S-curve, which means a
  **post-processing pipeline (a shader)**, not a rectangle.

So the honest position: trench can have "darker" today and "higher contrast" only once a
render pipeline exists. That is the extra wiring the user did not want to take on, and it is
correctly deferred.
