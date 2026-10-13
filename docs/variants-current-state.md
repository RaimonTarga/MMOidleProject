# Node Variants (Family Blends) — Current State

**Audited:** 2026-10-01 (progression rework run 3: T3/T4 families and blends for every
biome, the T1 third-mob close-out, and the T1 mask re-cut — on top of the Phase 2a/5
work that first shipped this system for Plains/Forest/T1 and then Jungle/Desert/T2).
Updated 2026-10-03 (verbs-that-fire run, task C): every node pays a family it fields — the
eight T2–T4 territories with no body at their tier were re-led (§4).
Updated 2026-10-12 (distinctness batch): six new mobs give those families bodies, and the
eight nodes are back on their authored leads (§3, §4).

**Design authority:** [`design_docs/progression-rework-design.md`](../design_docs/progression-rework-design.md)
§12, §18.7–§18.9. **History:** [`archive/progression-rework-plan.md`](archive/progression-rework-plan.md)
§2.1–§2.3 and the Phase 5 family/blend progress notes are the detailed build log. Where
this page and that history disagree, read the code.

"Variant" is this system's working name for a node that carries a **family blend**
instead of a node modifier. A blended node is a composition of its biome's monster
families, and its DOMINANT family says what the node pays: since design §24.3 every
kill in a node pays that one shard (`nodeShard`), minority bodies included.

## 1. Families (`shared/src/data/families/index.ts`)

Every non-boss monster of a covered biome belongs to **exactly one family**
(`lineageMaterials.test.ts`'s partition sweep enforces this for every entry in
`FAMILY_BIOMES` — a mob in no family is a kill that pays no shard). A `FamilyDefinition`
names `monsterIds`, `drops` (the `PacketId` shard a node this family dominates pays, for
every kill there — design §24.3) and `punishes` (the lane this family is built to
pressure — see §6). Since design §24.4 a T1 biome's three families drop exactly its
weapon lineage's three lanes (Sky → kill-chain, Grove → engagement, Hopper → engagement,
Brood → tempo moved to make that true; `punishes` unchanged, which leaves the Brood
favouring and punishing Tempo — a named exception in `lineageMaterials.test.ts`).

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

Every T1 blend now **resolves exactly as authored** (see §3) and `UNSOURCED_FAMILIES` in
`lineageMaterials.test.ts` — the exemption list for a family with no live spawn location —
is **empty**: `desert-stalker`, the last entry on that list, is sourced now that Desert's
T3+ pool fields a Stalker member.

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

Currency: every node kept its dominant (and shard) except `node-t1-mountain-03`, Crag →
Ridge (Anvil → Shackle), so the Ridge kept a territory when its old ridge-70 cell became
the crossroads. The crossroads pays its by-a-hair leader's shard — the family that led
the cell before, so no crossroads changed currency. **PROVISIONAL**: §26.3 leaves "one
shard or a roll per kill" open. `isCrossroadsNode` / `ROSTER_TIERS` (`nodeBlends.ts`)
name the shape; T2–T4 blends are still three-family proportions (follow-up). Full
before → after table: `reports/legibility/rosters.md`.

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
  exactly as authored, with no family dropped and rescaled away. Engagement shards are
  now **earned** from Plains Sky kills rather than credited by a harness shim.
- **The later-tier gaps are filled (2026-10-12).** Six T2–T4 biome tiers used to field
  only two of their three families. Each now has a tier-native body, the same move as
  design §18.8's third T1 mobs: Bog Leech (Swamp Mire T2), Jungle Ocelot (Jungle Stalker
  T2), Venom Dart Frog (Jungle Undergrowth T3), Dune Antlion (Desert Scorpion T3), Fen
  Shoebill (Swamp Stalker T3), Summit Slinger (Mountain Ridge T4); numbers PLACEHOLDER.
  The one family still bodiless at a tier by design is Desert Stalker at T2 (T3+ only).
  A bodiless family may keep a minority share — it is dropped and re-scaled away at
  spawn time and pays nothing — but it must not LEAD a blend (§4).
- Pack mobs (e.g. a wolf alpha fielding followers) mean a family's share of **spawn
  picks** runs ahead of its share of **bodies on the field**.
- A family's own monster list is deduplicated for spawning: a mob once listed twice to
  weight the old flat roll would otherwise just alternate two copies of itself.
- **Every node authored this run changes spawn composition** relative to any pre-rework
  baseline (T2/T3/T4 all moved from a flat per-biome pool to a blend for the first time
  this run, the same class of change the T1 Mountain de-duplication caused earlier). No
  monster numbers were touched; only which family a node favours and how often.

## 4. Rewards

Shard-granting is **node-based** (design §24.3) — see
[`lineages-current-state.md`](lineages-current-state.md) §10. Every node is categorised
under its AUTHORED blend's dominant family (largest share, ties in family-table order:
`nodeFamily`), and every non-boss kill in it pays that family's `drops` (`nodeShard`),
whatever the body's own family — so pack followers filed under another family pay what
the map says (review P16, closed by construction). A node with no blend (a dungeon) keeps
the old per-monster rule: the dead mob's own family shard, nothing for a mob in no family.

**Every node pays a family it fields** (`nodeShards.test.ts` section 4, every node in the
registry, no allowlist): the family a node is categorised under has at least one member
in its biome's tier pool, the spawner fields it, and it leads what the node actually
spawns. Eight T2–T4 nodes broke this until the verbs-that-fire run (2026-10-03, review
L16, course-correction report item 15): each named as leader a family with no body at its
tier, so it paid that family's shard while spawning two others. Each was re-led by a
family it fields, chosen to keep the spawns as they were unless that left one of the
tier's fielded families leading fewer than two nodes. All PROVISIONAL, the designer's:

| Node | Was (leader → shard) | Now (blend → shard) | Spawns |
|---|---|---|---|
| t2-swamp-01 | Mire → Venom | Coven 70 / Stalker 30 → Shackle | unchanged (7/3) |
| t2-swamp-04 | Mire (45/45 tie) → Venom | Coven 80 / Stalker 20 → Shackle | unchanged (8/2) |
| t2-swamp-05 | Mire → Venom | Stalker 60 / Coven 40 → Bone | Coven 5/5 → Stalker 6/4 (Bone from two nodes, not one) |
| t2-jungle-03 | Stalker → Spark | Undergrowth 60 / Ape 40 → Venom | Ape 7/3 → Undergrowth 6/4 (Venom from two nodes; Ape would lead four of five) |
| t3-jungle-02 | Undergrowth → Venom | Stalker 70 / Ape 30 → Spark | unchanged (7/3) |
| t3-desert-02 | Scorpion → Shackle | Stalker 70 / Basilisk 30 → Bone | unchanged (7/3) |
| t3-swamp-03 | Stalker → Bone | Mire 70 / Coven 30 → Venom | unchanged (7/3) |
| t4-mountain-02 | Ridge → Shackle | Hopper 70 / Crag 30 → Spark | unchanged (7/3) |

**Restored 2026-10-12:** with the six gap mobs in the pools, all eight nodes are back on
their authored leads (the "Was" column; `regionT2.ts`/`regionT3.ts`/`regionT4.ts`). The
table stays for the history of the call.

Every new leader was a lane of the weapon whose door that biome tier is. What left: Swamp
T2 pays no Venom (the Dagger's T2 door), Jungle T2 no Spark and Jungle T3 no Venom (the
Rapier's doors; the Jungle forms crown Affliction), Desert T3 and Mountain T4 no Shackle.
Two family-table notes for the designer sit behind these: `dune-stalker` is the Scorpion
line's T3 step by its own monster file but is filed under Desert Stalker, and
`bog-lurker` is the Mire Stalker's successor by its banner but is filed under Mire —
re-filing either moves the gap to a sibling node rather than closing it.

## 5. Map presentation

The node info panel's summary names the node's territory ("Territory: Pack") and its
one shard ("Drops: Gale Shards") over a composition bar; its details band reads "<Family>
territory · Every kill here drops <Shard>s, whichever family it came from", the families
present with their shares, and the families this tier's pool cannot field listed as
absent. The arrival banner says "Pack territory · every kill here drops Gale Shards"
(`arrivalTerritoryLine`), the world-map tiles carry a shard badge, and map search matches
territory and shard names. A dungeon's boss band names the capstone material it drops;
nodes with no blend show no territory and promise no shard. Shard and capstone chips in the materials
panel and the crafting wallet strip render through `GameIcon` with a lane-coloured glyph
(`shardIconSource`/`capstoneIconSource`), never a bare text glyph, and both panels group
essence/shard/capstone rows with a divider and hide untouched (zero-amount) rows.

## 6. The drops rule (design §18.7) — read this before trusting any "favours" claim

**`drops` stays the definition of "favours."** There is no separate `favours` field —
design §9 asked for one, the shipped table only ever had `drops` + `punishes`, and
§18.7 settled it: where a family's declared lane does not measurably win on that family's
own purest node, **the mobs are what must move** (a Phase 4 monster-shape finding), never
a reason to add a second field or to retune a card's magnitude per node.

**Do not treat any family's current `drops`/`punishes` pairing as a settled read of what
beats it.** Read `reports/progression-phase1/family-contracts-run4.md` for the per-family
verdict; this page deliberately does not restate them, because they move with the bestiary.

**The arbiter is the family-contract instrument, not the lane matrix** (run 4,
`server/bench/familyContracts.ts`). Run 3 tried to settle the question from the matrix's
ordinal ranking of six lanes on a blended node and could not: that ranking failed to
reproduce between two seeds for seven of nine families, and its margins moved 7–15pp
between a 90 s and a 270 s cap — more than the ±3pp band design §18.9 then judged in (the
lane-budget criterion is now design §24.1's viability floor; see
[`lineages-current-state.md`](lineages-current-state.md) §14). The
instrument that replaced it compares ONE lane against ONE lane on a node forced to 100%
the family under test, to a fixed kill count, pooled across every weapon lineage carrying
the lane, with five guards (reached-N, carriers, seed agreement, a spread that excludes
zero, and agreement between the control-normalised margin and the raw time-to-kill-N
ratio). Only a verdict with all five guards passing may move a `drops` field.

**A decisive inversion does not by itself say where `drops` should go.** With two lanes the
lane that beat the favoured one is, by construction, the lane the family PUNISHES, and
`drops === punishes` is refused by `server/test/lineageMaterials.test.ts` (one named
exception since design §24.4, the Cave Brood) and incoherent besides. The instrument's `FAM_ALL_LANES=1` pass ranks every weapon lane on the same
synthetic node, and that is what names the lane. Where the winner of the wider pass is the
punished lane itself, nothing moves and the row stays a monster-shape finding, which is
what design §18.7 says it is.

## 7. Tests

`shared/src/data/lineages/coverage.test.ts` covers the lineage-card side.
`server/test/variantBlend.test.ts` covers blend authoring (shares sum to 1, every key
belongs to the node's own biome) per tier, the largest-remainder spawn cycle, and a
thirty-spawn world run per tier asserting the resolved composition matches the authored
blend within one mob per ten slots; its "every family a tier's blends name leads a node"
rule counts only the families the tier's pool fields. `server/test/lineageMaterials.test.ts`
covers the family partition (every `FAMILY_BIOMES` biome, every tier) and the
`UNSOURCED_FAMILIES` tripwire. `shared/src/world/nodeRosters.test.ts` covers the T1 roster
shapes, the crossroads (one per biome, on the dungeon, met last), territories, roster
variety, and the spawner seam on a pure and a pair. `shared/src/world/nodeShards.test.ts` covers the node rule:
one shard per node, its leader's `drops`, and a leader the node's tier pool fields. Blend shape and coverage are also folded into `validateWorldMap`, so a
malformed blend fails dev boot rather than shipping silently.
