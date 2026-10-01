# Node Variants (Family Blends) — Current State

**Audited:** 2026-10-01 (progression rework run 3: T3/T4 families and blends for every
biome, the T1 third-mob close-out, and the T1 mask re-cut — on top of the Phase 2a/5
work that first shipped this system for Plains/Forest/T1 and then Jungle/Desert/T2).

**Design authority:** [`design_docs/progression-rework-design.md`](../design_docs/progression-rework-design.md)
§12, §18.7–§18.9. **History:** [`archive/progression-rework-plan.md`](archive/progression-rework-plan.md)
§2.1–§2.3 and the Phase 5 family/blend progress notes are the detailed build log. Where
this page and that history disagree, read the code.

"Variant" is this system's working name for a node that carries a **family blend**
instead of a node modifier. A blended node is a composition of its biome's monster
families, and because each family drops one shard, the blend also says what the node
pays.

## 1. Families (`shared/src/data/families/index.ts`)

Every non-boss monster of a covered biome belongs to **exactly one family**
(`lineageMaterials.test.ts`'s partition sweep enforces this for every entry in
`FAMILY_BIOMES` — a mob in no family is a kill that pays no shard). A `FamilyDefinition`
names `monsterIds`, `drops` (the `PacketId` shard every kill in this family grants) and
`punishes` (the lane this family is built to pressure — see §6).

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
- **A later-tier gap of the same shape remains open, and is explicitly not a code fix.**
  Jungle's T2 pool fields only `jungle-ape` and two Undergrowth members — none of
  Jungle Stalker's three named members exist below T3/T4 — so a T2 node that names
  Stalker as dominant still re-scales onto Ape/Undergrowth at spawn time. Flagged for the
  designer alongside the Desert Dealer-line split (§1).
- Pack mobs (e.g. a wolf alpha fielding followers) mean a family's share of **spawn
  picks** runs ahead of its share of **bodies on the field**.
- A family's own monster list is deduplicated for spawning: a mob once listed twice to
  weight the old flat roll would otherwise just alternate two copies of itself.
- **Every node authored this run changes spawn composition** relative to any pre-rework
  baseline (T2/T3/T4 all moved from a flat per-biome pool to a blend for the first time
  this run, the same class of change the T1 Mountain de-duplication caused earlier). No
  monster numbers were touched; only which family a node favours and how often.

## 4. Rewards

Shard-granting is **monster-family-based, not node-based** — see
[`lineages-current-state.md`](lineages-current-state.md) §10. A node's blend decides
which family you are likely to fight (and therefore which shard you are likely to earn);
the grant itself reads the dead monster's own family membership, so a non-family monster
drops no shard regardless of node, and a family monster drops its shard even off-blend.

## 5. Map presentation

The node info panel's headline band shows the blend's dominant family, every family
present with its share and shard (a lane-coloured `ShardIcon`), a summary row of mobs
actually fielded, and the families this tier's pool cannot field listed as absent. A
dungeon's boss band names the capstone material it drops. Nodes with no blend keep the
plain, reward/stat-inert modifier-named band. Shard and capstone chips in the materials
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
beats it.** A concurrent bench pass in this same run (`reports/progression-phase1/
lane-matrix-run3.md`, design §18.9's criterion: median uplift ±3 percentage points,
ordinal encounter check) is remapping `drops` for any family where the bench is clear —
favoured lane ranks last on the family's own 70/20/10 node with both seeds agreeing, and
one other lane ranks first with both seeds agreeing. Read that report for which families
actually moved; this page intentionally does not restate per-family verdicts that a
sibling task may still be changing.

## 7. Tests

`shared/src/data/lineages/coverage.test.ts` covers the lineage-card side.
`server/test/variantBlend.test.ts` covers blend authoring (shares sum to 1, every key
belongs to the node's own biome) per tier, the largest-remainder spawn cycle, and a
thirty-spawn world run per tier asserting the resolved composition matches the authored
blend within one mob per ten slots. `server/test/lineageMaterials.test.ts` covers the
family partition (every `FAMILY_BIOMES` biome, every tier) and the `UNSOURCED_FAMILIES`
tripwire. Blend shape and coverage are also folded into `validateWorldMap`, so a
malformed blend fails dev boot rather than shipping silently.
