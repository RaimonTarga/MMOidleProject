# Node Variants (Family Blends) — Current State

> Class-first rework (2026-10-15): lineage shards, capstones, and the node `drops` payment removed; see the bible.

**Audited:** 2026-10-01 (progression rework run 3: T3/T4 families and blends for every
biome, the T1 third-mob close-out, and the T1 mask re-cut — on top of the Phase 2a/5
work that first shipped this system for Plains/Forest/T1 and then Jungle/Desert/T2).
Updated 2026-10-03 (verbs-that-fire run, task C): eight T2–T4 territories whose leader
had no body at their tier were re-led, then restored on 2026-10-12 once those families
had a body (§3). That pass was about which family leads the node. It does not pay a shard.

**Design authority:** [`design_docs/progression-rework-design.md`](../design_docs/progression-rework-design.md)
§12, §18.7–§18.9. **History:** [`archive/progression-rework-plan.md`](archive/progression-rework-plan.md)
§2.1–§2.3 and the Phase 5 family/blend progress notes are the detailed build log. Where
this page and that history disagree, read the code.

"Variant" is this system's working name for a node that carries a **family blend**
instead of a node modifier. A blended node is a composition of its biome's monster
families. Its dominant family is the node's territory. Kills do not pay a family shard.

## 1. Families (`shared/src/data/families/index.ts`)

Every non-boss monster of a covered biome belongs to **exactly one family**
(`server/test/families.test.ts` enforces the partition). A `FamilyDefinition` names
`monsterIds` and `punishes` (a play style the family is built to pressure). It has no
`drops` field. The shard each family used to pay is gone.

**Coverage today: all eleven biomes that have monster content at all, T1 through T4.**

| Biome | Families | Status |
|---|---|---|
| Plains | Herd, Swarm, Sky | PROPOSED (design-reviewed as the first slice, bible §12.1 marks Plains/Forest "locked" but open decision 2 has not formally closed) |
| Forest | Pack, Grove, Canopy | locked (first slice, design §12.1) |
| Mountain | Crag, Ridge, Hopper | PROPOSED, not yet design-reviewed (bible open decision 2) |
| Cave | Brood, Brute, Deep | PROPOSED, not yet design-reviewed |
| Swamp | Mire, Coven, Stalker | PROPOSED, not yet design-reviewed |
| Jungle | Ape, Undergrowth, Stalker | PROVISIONAL (T2 — authored run 2, approved re-homing/families brief) |
| Desert | Basilisk, Scorpion, Stalker (T3+ only) | PROVISIONAL; the scarab "Dealer" line's split across Scorpion/Stalker is an authoring choice flagged for designer review |
| Tundra | Glacial, Rime | PROVISIONAL (T3/T4, run 3 — only two legible roles in the roster's own banner names, not three) |
| Volcanic | Swarm, Anchor, Ashfall | PROVISIONAL (T3/T4, run 3) |
| Graveyard (Wasteland) | Crawler, Plague, Choir | PROVISIONAL (T3/T4, run 3) |
| Trench | Hunter, Kiter, Anchor | PROVISIONAL (T3/T4, run 3; names reuse the biome's own THE HUNTER/THE KITER/THE ANCHOR banners) |

Every T3/T4 assignment across every biome is explicitly flagged PROVISIONAL in the file's
own header, including the starter biomes' T3/T4 members (which simply joined their
existing T1-reviewed families — nothing about those families' T1 identity changed, but
their T3/T4 membership is new and unreviewed). One correctness fix landed alongside the
T3/T4 pass: `avalanche-tyrant` (Mountain's own Caprine lineage, `cliff-hopper` →
`avalanche-ram` → `avalanche-tyrant`) had been filed under `mountain-crag` since the
family table's first commit; it is now under `mountain-hopper`, where its own lineage
banner always said it belonged. A similar-shaped ambiguity in Swamp
(`swamp-hydra`/`plague-hydra` sitting in the control-caster `swamp-coven` family) was
**not** touched — unlike Avalanche-Tyrant, nothing in Swamp's existing table contradicts
itself, so moving it would be a new design opinion, not a correctness fix.

## 2. Blends (`shared/src/world/map/region{T1,T2,T3,T4}.ts`)

A `NodeBlend` is a share vector over a biome's families (shares sum to 1). For a blended
biome, **the blend list's length is the node count source**, replacing the old modifier
list. `NODE_BLENDS` now covers every normal node at every tier:

| Tier | Normal nodes with a blend | Biomes |
|---|---:|---|
| T1 | 25 | plains 5, forest 5, mountain 5, cave 5, swamp 5 |
| T2 | 37 | forest 5, plains 5, mountain 5, cave 6, swamp 6, jungle 5, desert 5 |
| T3 | 38 | tundra 5, mountain 5, cave 6, jungle 5, desert 5, volcanic 6, swamp 6 |
| T4 | 38 | mountain 5, tundra 5, jungle 5, desert 5, volcanic 6, graveyard 6, trench 6 |

138 normal nodes total. **T1's count moved from 27 to 25 this run**: the old 27 carried a
sixth Cave/Swamp node purely because those biomes' now-deleted node **modifier** used to
earn them an extra one; the vestigial `modifier` field was removed from every T1 node,
the mask re-cut to 25, and the Cave/Swamp blends trimmed to five each
(`shared/src/world/map/regionT1.ts`). Dungeons, sanctuaries, the Clearing, and any node
outside these eleven biomes carry no blend and keep today's flat per-biome pool roll —
nothing fake ever entered the `FamilyId` union to cover them.

Every T1 blend now **resolves exactly as authored** (see §3). `UNSOURCED_FAMILIES` in
`server/test/families.test.ts` — the exemption list for a family with no live spawn
location — is **empty**: `desert-stalker`, the last entry that list used to hold, is
sourced now that Desert's T3+ pool fields a Stalker member.

### 2a. T1 nodes are rosters (design §26.3, legibility run 2026-10-05)

A 70/20/10 node and a 45/45/10 node were indistinguishable by eye, so every T1 normal
node now fields its dominant family and **at most one guest**, and one node per biome,
the **crossroads**, fields all three. Shapes (`regionT1.ts` header): a pure `{A: 1}`; a
pair `{A: 0.7, B: 0.3}`, or `{A: 0.6, B: 0.4}` on a biome's two doors (first two
arrivals, the roster form of the entry-pressure rule "mixed blends first"); the
crossroads `{A: .34, B: .33, C: .33}` on the cell the dungeon is entered from (the -01
cell in every biome; Mountain and Cave have two dungeon cells and the crossroads is the
one met last). A biome's heaviest family (Plains Swarm, Forest Pack, Mountain Ridge, Cave
Brute, Swamp Coven) is never a pure. Every family leads a node that is not the
crossroads, and no two nodes of a biome share a roster. Node count and ids unchanged.

Territory: every node kept its dominant family except `node-t1-mountain-03`, Crag →
Ridge, so the Ridge kept a territory when its old ridge-70 cell became the crossroads.
The crossroads is led by the family that led the cell before. `isCrossroadsNode` /
`ROSTER_TIERS` (`nodeBlends.ts`) name the shape; T2–T4 blends are still three-family
proportions (follow-up). Full before → after table: `reports/legibility/rosters.md`.
That pass no longer pays a shard.

## 3. Spawning (`shared/src/systems/world/spawning/` and `families/index.ts`)

A blend governs **which family spawns next**, not population size — headcount and the
stat/HP tables are untouched by blend or family.

- `blendSpawnCycle(blend, slots = 10)` turns a blend into a deterministic,
  largest-remainder-rounded repeating order of families, spread rather than clumped (a
  70/20/10 node reads as 7-2-1 across ten picks). A share finer than 10% rounds away.
- The spawn cursor is per-world (a `WeakMap`), advances on each **pick** (not on
  successful placement), and is never persisted or networked.
- **The headline T1 gap from Phase 2 is closed.** Every T1 biome used to field only two of
  its three families at the T1 monster-pool tier (Swamp fielded only Mire — every Swamp
  node resolved to one family regardless of its authored blend). A third T1 mob per
  biome (`grass-kite` for Plains Sky, `bramble-pod` for Forest Canopy, `rockback-ram` for
  Mountain Crag, `brood-spiderling` for Cave Brood, `fen-hexer` for Swamp Coven, plus
  re-familying Mud Toad from Mire to Stalker) now lets all 25 authored T1 blends resolve
  exactly as authored, with no family dropped and rescaled away.
- **The later-tier gaps are filled (2026-10-12).** Six T2–T4 biome tiers used to field
  only two of their three families. Each now has a tier-native body, the same move as
  design §18.8's third T1 mobs: Bog Leech (Swamp Mire T2), Jungle Ocelot (Jungle Stalker
  T2), Venom Dart Frog (Jungle Undergrowth T3), Dune Antlion (Desert Scorpion T3), Fen
  Shoebill (Swamp Stalker T3), Summit Slinger (Mountain Ridge T4); numbers PLACEHOLDER.
  The one family still bodiless at a tier by design is Desert Stalker at T2 (T3+ only).
  A bodiless family may keep a minority share — it is dropped and re-scaled away at
  spawn time — but it must not lead a blend. `nodeTerritories.test.ts` requires every
  territory to be a family the node's tier fields.
- Pack mobs (e.g. a wolf alpha fielding followers) mean a family's share of **spawn
  picks** runs ahead of its share of **bodies on the field**.
- A family's own monster list is deduplicated for spawning: a mob once listed twice to
  weight the old flat roll would otherwise just alternate two copies of itself.
- **Every node authored this run changes spawn composition** relative to any pre-rework
  baseline (T2/T3/T4 all moved from a flat per-biome pool to a blend for the first time
  this run, the same class of change the T1 Mountain de-duplication caused earlier). No
  monster numbers were touched; only which family a node favours and how often.

## 4. Rewards

Kills do not pay a family shard, a capstone, or a lane material. The dominant family
is the node's territory. The old node-shard rule, the weapon-lane doors, and the
`drops` field are history in
[`archive/lineages-current-state.md`](archive/lineages-current-state.md).

A territory is still a family the node's tier fields
(`shared/src/world/nodeTerritories.test.ts`). Eight T2–T4 nodes once named a leader
with no body at that tier. They were re-led on 2026-10-03 and restored to their
authored leads on 2026-10-12, once those families had a body
(`regionT2.ts`, `regionT3.ts`, `regionT4.ts`). That history is about which family
leads. It is not a payment.

## 5. Map presentation

The node info panel names the territory (`territory.name`) and the leader's spawn
share ("N% of spawns here"), over the families the blend fields. The arrival banner
is "`<Family> territory`" (`arrivalTerritoryLine`). A charted world-map tile reads
"`<place> · <Family> territory`", and map search matches the territory name. A node
with no blend (a dungeon, a sanctuary, the Clearing) has no territory line.

## 6. What a family records

`FamilyDefinition` is `monsterIds` plus `punishes`, a play style the family is
built to pressure. There is no `drops` field and no shard to assign. The old rule
that `drops` defined "favours", and the tests that refused `drops === punishes`,
went with the shard currency. `punishes` remains on the family record.

## 7. Tests

`server/test/families.test.ts` covers the family partition and the empty
`UNSOURCED_FAMILIES` list. `server/test/variantBlend.test.ts` covers blend authoring
(shares sum to 1, every key belongs to the node's own biome) per tier, the
largest-remainder spawn cycle, and a thirty-spawn world run per tier.
`shared/src/world/nodeRosters.test.ts` covers the T1 roster shapes, the crossroads,
and the spawner seam. `shared/src/world/nodeTerritories.test.ts` covers one territory
per blended node, no territory on a node with no blend, and a leader the tier fields.
Blend shape is also folded into `validateWorldMap`, so a malformed blend fails dev
boot rather than shipping silently.
