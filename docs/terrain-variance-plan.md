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
| 2 | `0x2f4f9e` cold blue | 0.24 |
| 3 | `0x3d43a4` | 0.29 |
| 4 | `0x4a2f9e` indigo | 0.34 |
| 5 | `0x5c2fae` | 0.39 |
| 6 | `0x7132bd` | 0.44 |
| 7 | `0x8a34c4` violet | 0.49 |
| 8 | `0xa63ad6` void violet | 0.54 |

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

**Next biomes, in order:** forest, swamp, mountain, caves.
