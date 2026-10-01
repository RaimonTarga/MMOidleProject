# Node Variants (Family Blends) — Current State

**Audited:** 2026-10-01 (progression rework Phase 2a, `feat/variants`; Phase 2b
economy removal did not change this system — it only deleted the node-modifier
machinery it is replacing).

**Design authority:** [`design_docs/progression-rework-design.md`](../design_docs/progression-rework-design.md)
§12. **Plan:** [`docs/progression-rework-plan.md`](progression-rework-plan.md) §2.1,
§2.3 (the "Built 2026-09-30" progress note under §2.2 is the detailed implementation
record this page summarizes). Where this page and the plan disagree, read the code.

"Variant" is this system's working name for a node that carries a **family blend**
instead of a node modifier. A blended node is not a difficulty flavour any more —
it is a composition of its biome's monster families, and because each family
drops one shard, the blend also says what the node pays.

## 1. Families (`shared/src/data/families/`)

Every non-boss monster of a covered biome belongs to **exactly one family**
(`families.test.ts`/`coverage.test.ts` enforce the partition — a mob in no family
is a kill that pays no shard). A `FamilyDefinition` names:

- `monsterIds` — the mobs that make up the family (non-boss only);
- `drops` — the `PacketId` shard every kill in this family grants;
- `punishes` — the lane this family is built to pressure (design §12; the bench
  checks this, not code — "does the intended lane win by ~30%? does the punished
  lane still clear?").

**Coverage today:** Plains and Forest are LOCKED (design-reviewed, three families
each). Mountain, Cave, and Swamp are PROPOSED — wired into node authoring (see
§2) but not yet design-reviewed (bible open decision 2). Jungle, Desert, Tundra,
Volcanic, Graveyard, and Trench have no family table at all; monsters there drop
no shards and those biomes' nodes carry node modifiers exactly as before (see
[`node-modifiers-current-state.md`](archive/node-modifiers-current-state.md) for
what a modifier still does — nothing, since Phase 2b, beyond naming the node).

## 2. Blends (`shared/src/world/map/regionT1.ts`)

A `NodeBlend` is a share vector over a biome's families (`Partial<Record<FamilyId,
number>>`, shares sum to 1). `buildRegionNodes` (`shared/src/world/map/
authoring.ts`) takes a per-biome `blends` list; **the list's length is now the
node count source** for a blended biome (it took that job from the modifier
list — `normalNodeCountForBiome` reads whichever one exists).

All five T1 biomes (plains, forest, mountain, cave, swamp) are on the blend list
today. **T1 node counts are unchanged** at mountain 5, cave 6, forest 5, plains 5,
swamp 6 (27 total) — not a clean five-per-biome, because the hand-cut T1 mask (27
cells), `validateBiomeCoverage`, and node display names are all still welded to
the **modifier** list's length and content, not the blend list's. Every T1 node
authored today therefore carries **both** a blend and a (now purely vestigial,
reward/stat-inert) `modifier` field — `buildRegionNodes` throws if a biome's blend
and modifier lists disagree in length, specifically so this coupling cannot drift
silently. Shrinking the T1 mask to 25 cells, dropping Cave/Swamp's sixth blend,
deleting the modifier field from T1 node generation, and re-deriving T1 display
names from the blend instead were all flagged as Phase 2b's job in the plan but
were **not done** in the Phase 2b economy-removal pass — see the progress note in
`docs/progression-rework-plan.md` §2.3 for why, and treat it as an open follow-up.

T2, T3, and T4 regions carry no blends at all and remain on the modifier list for
both node count and display names, unchanged.

## 3. Spawning (`shared/src/systems/world/spawning/` and `families/index.ts`)

A blend governs **which family spawns next**, not population size — `getMobDensity`
(headcount) and the stat/HP tables are untouched by blend or family.

- `blendSpawnCycle(blend, slots = 10)` turns a blend into a deterministic,
  largest-remainder-rounded repeating order of families, spread rather than
  clumped (a 70/20/10 node reads as 7-2-1 across ten picks, not "roughly 70%,
  eventually"). A share finer than 10% rounds away.
- The spawn cursor is per-world (a `WeakMap`), advances on each **pick** (not on
  successful placement, so a type terrain/spacing rejects doesn't stall the
  cycle), and is never persisted or networked — a fresh world always opens on its
  dominant family.
- **Known gap (§12.1 of the design doc, "the headline gap"):** a T1 biome's three
  families are spread across its T1/T2/T3 monster pools, and a T1 pool often
  fields only one or two of the three. Swamp T1 fields only Mire — both its mobs
  are Mire, so every Swamp T1 node resolves to a single family regardless of its
  authored blend. `resolveNodeBlend` re-scales the authored blend over whatever
  the node's own tier pool can actually field, so a node never advertises a
  family it does not spawn — but the *authored* blend (what the map shows as the
  design target) and the *resolved* blend (what actually spawns) can differ.
  Closing this needs a third T1 mob per affected biome (new monster content, a
  designer call) — it is explicitly not a code fix.
- Pack mobs (e.g. a wolf alpha fielding followers) mean a family's share of
  **spawn picks** runs ahead of its share of **bodies on the field** — "70% Herd"
  describes 70% of spawn events, not 70% of concurrent monsters.
- A family's own monster list is deduplicated for spawning purposes: duplicate
  entries that used to weight the old flat roll would just alternate two copies
  of the same mob once the blend's share is doing the weighting instead.

## 4. Rewards

Shard-granting is **monster-family-based, not node-based** — see
[`lineages-current-state.md`](lineages-current-state.md) §5. A node's blend
decides which family you are likely to fight (and therefore which shard you are
likely to earn), but the actual grant reads the dead monster's own family
membership (`shardForMonster`), so a non-family monster drops no shard
regardless of the node it died on, and a family monster drops its shard even on
a node whose blend doesn't favour that family (e.g. a stray pick from a thin
pool).

## 5. Map presentation

The node info panel's headline band shows the blend's dominant family, every
family present with its share, and the shard each one drops (a lane-coloured
`ShardIcon`, replacing `ModifierIcon` for blended nodes), with a summary row of
the mobs actually fielded and the families this tier's pool cannot field listed
as absent (so the §3 gap reports itself in game rather than silently
under-delivering). A dungeon's boss band names the capstone material it drops.
Nodes with no blend (every T2–T4 node, and any T1 node outside the covered
biomes) keep the plain modifier-named band.

## 6. Tests

`shared/src/data/lineages/coverage.test.ts` covers the lineage-card side (card
shape, numberless authoring). `server/test/variantBlend.test.ts` covers blend
authoring (shares sum to 1, every key belongs to the node's own biome), the
largest-remainder spawn cycle, and a thirty-spawn world run asserting the
resolved composition matches the authored blend within one mob per ten slots
(and that thirty spawns are exactly three identical cycles). Blend shape and
coverage are also folded into `validateWorldMap`, so a malformed blend fails dev
boot rather than shipping silently.
