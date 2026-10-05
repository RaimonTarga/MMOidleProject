# Rosters (legibility run, part C): what changed

Design §26.3: *a node fields its dominant family and at most one guest family. One
node per biome, placed before the dungeon, is the crossroads that fields all three.*
Branch `feat/lg-rosters` (worktree `../mmo-lin-w1c`), T1 only. The T2–T4 blends are
not touched and are listed as a follow-up below.

## What a T1 node is now

The authoring is in `shared/src/world/map/regionT1.ts` (header comment). The tests are
`shared/src/world/nodeRosters.test.ts`, plus `server/test/variantBlend.test.ts` for the
arrival rule and the live spawner.

| shape | shares | where | spawns per ten |
|---|---|---|---|
| pure | `{A: 1}` | outward | 10 |
| pair | `{A: 0.7, B: 0.3}` | outward | 7 / 3 |
| door pair | `{A: 0.6, B: 0.4}` | a biome's first two arrivals | 6 / 4 |
| crossroads | `{A: .34, B: .33, C: .33}` | the cell the dungeon is entered from | 4 / 3 / 3 |

Every pair and pure is in exact tenths, so the shares on the map are the shares that
spawn (`blendSpawnCycle`; the brief's 75/25 example would spawn 8/2).

The rules, all tested:

- **The crossroads.** One per biome. It is the -01 cell in all five biomes, the only
  cell (Plains, Forest, Swamp), or the later-met of two cells (Mountain, Cave), that
  opens onto the biome's T1 dungeon. It is the last of the dungeon's cells a player
  meets from every entry the T1 routes use. Its shares are near-equal with a strict
  leader, so it pays one shard.
- **No other T1 node fields three families.** A pair has a clear leader (at least 60%)
  and a visible guest (at least 20%). There is no near-even split.
- **Territories.** Every family of a biome leads at least one node that is **not** the
  crossroads. That keeps a home for each of the three home shards even if the
  crossroads later rolls its shard per kill.
- **Variety.** No two nodes of a biome field the same set of families. A node's bodies
  therefore tell you its roster, and its roster tells you its shard.
- **Doors** (entry pressure, restated in roster form). A biome's first two arrivals,
  from every entry the T1 routes use, are a pair or the crossroads, never a pure. Their
  leader takes at most 6 spawns in 10. The old rule was "no family at 60% or more" over
  three-family proportions, and a roster of a leader plus one guest cannot meet it.
- **Authoring guideline, not tested.** A biome's heaviest family is never a pure: Plains
  Swarm, Forest Pack, Mountain Ridge, Cave Brute and Swamp Coven, as named in the
  entry-pressure pass's own comments.

Node count (25), node ids and the mask are unchanged.

## The nodes, before → after

Arrival = the bot's order (nearest uncleared by BFS, ties N > S > E > W) from where the
T1 routes enter the biome: Plains from the Clearing, Forest from Plains, Swamp from
Forest, Mountain from Swamp, Cave from mountain-04/05 (from mountain-01..03 Cave's
first two arrivals swap). "both others" = the crossroads fields all three families.

| biome | node | arrival | before | after (roster) | dominant | guest | shard | crossroads |
|---|---|---:|---|---|---|---|---|:--:|
| plains | `plains-01` Swiftgrass Meadow | 3 | Herd 70 / Swarm 20 / Sky 10 | Herd 34 / Swarm 33 / Sky 33 | Herd | both others | Anvil Shard (empowered) | yes |
| plains | `plains-02` Stonehoof Steppe | 2 | Herd 45 / Swarm 45 / Sky 10 | Herd 60 / Swarm 40 | Herd | Swarm | Anvil Shard (empowered) |  |
| plains | `plains-03` Thousandgrass Fields | 4 | Sky 70 / Herd 20 / Swarm 10 | Sky 100 | Sky | — (pure) | Bone Shard (kill-chain) |  |
| plains | `plains-04` Crownherd Prairie | 5 | Swarm 70 / Sky 20 / Herd 10 | Swarm 70 / Sky 30 | Swarm | Sky | Sigil Shard (technique) |  |
| plains | `plains-05` Sodwall Plain | 1 | Herd 34 / Swarm 33 / Sky 33 | Herd 60 / Sky 40 | Herd | Sky | Anvil Shard (empowered) |  |
| forest | `forest-01` Windstep Grove | 5 | Pack 70 / Grove 20 / Canopy 10 | Pack 34 / Grove 33 / Canopy 33 | Pack | both others | Gale Shard (tempo) | yes |
| forest | `forest-02` Nestwood Thicket | 4 | Grove 70 / Canopy 20 / Pack 10 | Grove 100 | Grove | — (pure) | Spark Shard (engagement) |  |
| forest | `forest-03` Crownleaf Wood | 3 | Canopy 70 / Pack 20 / Grove 10 | Canopy 100 | Canopy | — (pure) | Venom Shard (affliction) |  |
| forest | `forest-04` Ironbark Hollow | 1 | Pack 34 / Grove 33 / Canopy 33 | Pack 60 / Canopy 40 | Pack | Canopy | Gale Shard (tempo) |  |
| forest | `forest-05` Whisperwood Run | 2 | Pack 45 / Grove 45 / Canopy 10 | Pack 60 / Grove 40 | Pack | Grove | Gale Shard (tempo) |  |
| mountain | `mountain-01` Stonefall Ridge | 5 | Ridge 70 / Hopper 20 / Crag 10 | Ridge 34 / Crag 33 / Hopper 33 | Ridge | both others | Shackle Shard (control) | yes |
| mountain | `mountain-02` Cliffnest Shelf | 2 | Crag 45 / Ridge 45 / Hopper 10 | Crag 60 / Ridge 40 | Crag | Ridge | Anvil Shard (empowered) |  |
| mountain | `mountain-03` Crownpeak Rise | 3 | Crag 70 / Ridge 20 / Hopper 10 | Ridge 70 / Hopper 30 | **Crag → Ridge** | Hopper | **Anvil Shard → Shackle Shard** (control) |  |
| mountain | `mountain-04` Wallrock Pass | 4 | Hopper 70 / Crag 20 / Ridge 10 | Hopper 100 | Hopper | — (pure) | Spark Shard (engagement) |  |
| mountain | `mountain-05` Deepstone Crag | 1 | Crag 34 / Ridge 33 / Hopper 33 | Crag 60 / Hopper 40 | Crag | Hopper | Anvil Shard (empowered) |  |
| cave | `cave-01` Rushing Grotto | 5 | Brood 70 / Brute 20 / Deep 10 | Brood 34 / Brute 33 / Deep 33 | Brood | both others | Gale Shard (tempo) | yes |
| cave | `cave-02` Loadstone Vault | 4 | Brute 70 / Deep 20 / Brood 10 | Brute 70 / Deep 30 | Brute | Deep | Anvil Shard (empowered) |  |
| cave | `cave-03` Spidernest Grotto | 3 | Deep 70 / Brood 20 / Brute 10 | Deep 100 | Deep | — (pure) | Bone Shard (kill-chain) |  |
| cave | `cave-04` Blackfang Chamber | 2 | Brood 45 / Brute 45 / Deep 10 | Brood 60 / Brute 40 | Brood | Brute | Gale Shard (tempo) |  |
| cave | `cave-05` Gatewall Hollow | 1 | Brood 34 / Brute 33 / Deep 33 | Brood 60 / Deep 40 | Brood | Deep | Gale Shard (tempo) |  |
| swamp | `swamp-01` Rushing Reedfen | 2 | Mire 45 / Coven 45 / Stalker 10 | Mire 34 / Coven 33 / Stalker 33 | Mire | both others | Venom Shard (affliction) | yes |
| swamp | `swamp-02` Sunkroot Bog | 1 | Mire 34 / Coven 33 / Stalker 33 | Mire 60 / Stalker 40 | Mire | Stalker | Venom Shard (affliction) |  |
| swamp | `swamp-03` Leechbrood Mire | 4 | Stalker 70 / Mire 20 / Coven 10 | Stalker 100 | Stalker | — (pure) | Bone Shard (kill-chain) |  |
| swamp | `swamp-04` Blackwater Crown | 3 | Mire 70 / Coven 20 / Stalker 10 | Mire 70 / Coven 30 | Mire | Coven | Venom Shard (affliction) |  |
| swamp | `swamp-05` Rootwall Marsh | 5 | Coven 70 / Stalker 20 / Mire 10 | Coven 70 / Stalker 30 | Coven | Stalker | Shackle Shard (control) |  |

The crossroads: **plains-01 Swiftgrass Meadow, forest-01 Windstep Grove,
mountain-01 Stonefall Ridge, cave-01 Rushing Grotto, swamp-01 Rushing Reedfen.**

## Currency (design §24.3: a node pays its leader's shard)

**One node changed its dominant: `node-t1-mountain-03` Crownpeak Rise, Crag → Ridge
(Anvil Shard → Shackle Shard).**

Before, the Ridge led only mountain-01, a Ridge 70 cell that sits on the dungeon. That
cell became the crossroads. Ridge still leads it by a hair, but the territory rule wants
a Ridge node that is not the crossroads. Mountain-03 is the only Crag cell that is not a
door, so it took the old ridge-70 composition (Ridge 70 / Hopper 30). Mountain's node
count per shard goes from Empowered 3 / Control 1 / Engagement 1 to Empowered 2 /
Control 2 / Engagement 1.

The alternative was to keep mountain-03 on Crag and let the Ridge lead only the
crossroads. That changes no currency, but the Mountain's Control shard would then come
only from a node where Ridge is 4 of 10 bodies. The designer can choose it. It takes
two edits: mountain-03's blend, and the territory rule in `nodeRosters.test.ts`, which
would then have to count the crossroads.

Every other node keeps its leader and shard. Each crossroads is led by a hair by the
family that led the cell before, so no crossroads changed currency. This is
**PROVISIONAL**: §26.3 leaves "one shard or a roll per kill" open, and per-kill rolling
is not implemented. Per-shard node counts in the other four biomes are unchanged.

## Entry pressure: the heaviest family at the doors

Spawn picks of each biome's heaviest family per ten, from `blendSpawnCycle`, before →
after. The doors are the first two arrivals, and plains-05, forest-04 and mountain-05
are the nodes the tutorial hands every class. The table counts picks, not bodies: a
Pack pick fields three wolves.

| biome | heaviest family | door picks per 10, before → after | biome total per 50 picks, before → after |
|---|---|---|---|
| plains | Swarm | 05: 3 → 0, 02: 4 → 4 | 17 → 14 |
| forest | Pack | 04: 4 → 6, 05: 5 → 6 | 19 → 16 |
| mountain | Ridge | 05: 3 → 0, 02: 4 → 4 | 17 → 15 |
| cave | Brute | 05: 3 → 0, 04: 4 → 4 | 17 → 14 |
| swamp | Coven | 02: 3 → 0, 01: 4 → 3 | 17 → 13 |

**Forest is the one biome where door pressure rises.** forest-04, the tutorial's Forest
node, goes from 4 to 6 Pack picks in 10, and forest-05 from 5 to 6. Both cells were Pack
territory, and a Pack-led roster cannot drop below 50% Pack. Across the biome Pack picks
fall (19 → 16 per 50), because the old pack-70 cell is now the crossroads (Pack 4). This
is not measured; the entry-pressure pass measured forest-04 with the bot. If E's sweep
shows a Forest regression, the fix is to re-lead forest-04 to Canopy (Canopy 60 / Grove
40, no wolves at the first arrival) and forest-03 to Pack (Pack 70 / Grove 30). Both are
data-only. The cost is two currency moves (forest-04 Gale → Venom, forest-03 Venom →
Gale), and Forest's per-shard counts do not change.

In the other four biomes the heaviest family leaves the first door entirely and keeps
the second door at its old count. On the Mountain, the archer/hopper pair (the
documented entry wall) is split across the two doors. In full it meets only at
mountain-03 (Ridge 70 / Hopper 30, the old ridge-70 cell's composition moved from the
5th to the 3rd arrival) and at the crossroads.

## The spawner

`resolveNodeBlend` and `blendSpawnPick` (`shared/src/world/nodeBlends.ts`) and the
server's `spawnMonster` (read-only for this part) handle one- and two-family blends
correctly. No spawner code changed.

- **One family `{A: 1}`.** It resolves to `{A: 1}` with a non-empty pool and a 10-slot
  cycle of A. Every pick is A's own mob.
- **Two families.** 60/40 cycles 6/4 and 70/30 cycles 7/3, exactly. No other family
  appears.
- **No division by zero.** `renormalizeBlend` and `blendSpawnCycle` both return empty
  when the total is ≤ 0, and the pick guards an empty cycle and an empty pool.
- **A guest the tier cannot field** (tested on Swamp T2, which has no Mire body). It is
  dropped and its share moves onto the leader. The node narrows to one family and never
  widens.
- **The one path back to the whole pool.** `spawnMonster` rolls the biome's flat pool
  only when the blend resolves to nothing, which needs a blend with no fielded family
  at all. `nodeShards.test.ts` §4 makes that unreachable for every real node: a node's
  leader always has a body in its tier pool.

`nodeRosters.test.ts` §1 proves the seam with thirty picks per case. The
`variantBlend.test.ts` live-spawn block runs a real `World` and `spawnMonster` on a
Plains pure, a pair and the crossroads. Each spawns exactly three cycles of its own
roster (30, 18/12 and 12/9/9) and nothing else.

## Family-contract bench (`server/bench/familyContracts.ts`), T1

How it was run, from `server/`, once on the base commit (`04725e0b`, before) and once
on this branch (after):

```
FAM_TIERS=1 FAM_KILLS=10 FAM_SEEDS=101009,101033,101063 FAM_CAP_MS=180000 \
  LANE_HITBOX=<scratchpad>/hitboxes.json \
  node --conditions=development --import tsx bench/familyContracts.ts <out-dir>
```

This is a modest run: 10 kills per cell instead of 30, 3 seeds instead of 4, and a
180 s cap instead of 600 s. Each run was 15 synthetic nodes × 3 seeds, 372 measured
runs. Wall clock: 15.8 min before and 16.0 min after, on a shared machine.

**The rosters cannot move this instrument, and they did not.** By design it overwrites
each host node's authored blend in memory with `{family: 1}` before measuring (its
header, point 1). It picks hosts by node id, which is also unchanged. So the authored
roster appears only in the report's "authored blend (OVERWRITTEN)" column. The two runs agree exactly: all 372 measured rows and every contract row in the JSON are identical, and so are all per-cell log lines. The `.md` reports differ only in the header (commit, time) and that one column.

The design note "the family contracts and the lane bench re-read the blends" therefore
applies only to the lane bench (`server/bench/lineage/laneMeasure.ts`: one row per
distinct resolved blend). That bench is A's file and is listed as a follow-up.

**After (this branch)**, with every cell identical to the before run. `node` is the
synthetic host, the first free cell of the biome in id order, forced to 100% of the
family; it is not the family's roster node. For example, Crag is measured on
mountain-01, which is now the crossroads.

| family | node | tier | band | favours | punishes | fav uplift | pun uplift | margin (fav − pun) | ± half-spread | TTK-N ratio (pun/fav) | carriers f/p | G1 | G3 | G4 | G5 | verdict |
|---|---|---:|---:|---|---|---:|---:|---:|---:|---:|---|:--:|:--:|:--:|:--:|---|
| Herd | `node-t1-plains-01` | 1 | 1 | empowered | tempo | +0.0% | +4.3% | -5.6% | +9.5% | 0.81 | 3/2 | yes | NO | NO | yes | inverted (inside noise) |
| Swarm | `node-t1-plains-02` | 1 | 1 | technique | empowered | +13.8% | +0.0% | +20.4% | +12.5% | 1.17 | 1/3 | yes | yes | yes | yes | holds (decisive) |
| Sky | `node-t1-plains-03` | 1 | 1 | kill-chain | affliction | +9.8% | +3.2% | +0.0% | +14.8% | 0.80 | 3/2 | yes | NO | NO | NO | holds (inside noise) |
| Pack | `node-t1-forest-01` | 1 | 1 | tempo | empowered | -6.9% | +0.0% | -5.7% | +13.1% | 0.90 | 2/3 | yes | NO | NO | yes | inverted (inside noise) |
| Grove | `node-t1-forest-02` | 1 | 1 | engagement | tempo | +14.7% | +7.5% | +7.8% | +7.3% | 1.24 | 2/2 | yes | yes | yes | yes | holds (decisive) |
| Canopy | `node-t1-forest-03` | 1 | 1 | affliction | control | +1.7% | +14.2% | -12.3% | +3.1% | 1.17 | 2/2 | yes | yes | yes | NO | inverted (inside noise) |
| Crag | `node-t1-mountain-01` | 1 | 1 | empowered | affliction | +0.0% | -4.5% | +6.5% | +10.2% | 1.05 | 3/2 | yes | NO | NO | yes | holds (inside noise) |
| Ridge | `node-t1-mountain-02` | 1 | 1 | control | kill-chain | +11.4% | +5.6% | +7.1% | +1.6% | 1.07 | 2/3 | yes | yes | yes | yes | holds (decisive) |
| Hopper | `node-t1-mountain-03` | 1 | 1 | engagement | empowered | +13.0% | +0.0% | +9.7% | +9.4% | 1.62 | 2/3 | yes | NO | yes | yes | holds (inside noise) |
| Brood | `node-t1-cave-01` | 1 | 1 | tempo | tempo | +11.2% | +11.2% | +0.0% | +0.0% | 1.00 | 2/2 | yes | NO | NO | NO | holds (inside noise) |
| Brute | `node-t1-cave-02` | 1 | 1 | empowered | affliction | +0.0% | +13.5% | -13.2% | +1.7% | 1.13 | 3/2 | yes | yes | yes | NO | inverted (inside noise) |
| Deep | `node-t1-cave-03` | 1 | 1 | kill-chain | engagement | +6.1% | +15.8% | -12.2% | +2.8% | 0.59 | 3/2 | yes | yes | yes | yes | **INVERTED (decisive)** |
| Mire | `node-t1-swamp-01` | 1 | 1 | affliction | empowered | +9.4% | +7.0% | +1.7% | +7.8% | 1.28 | 2/3 | yes | NO | NO | yes | holds (inside noise) |
| Coven | `node-t1-swamp-02` | 1 | 1 | control | tempo | +2.4% | +7.7% | -4.7% | +6.8% | 0.88 | 2/2 | yes | NO | NO | yes | inverted (inside noise) |
| Stalker | `node-t1-swamp-03` | 1 | 1 | kill-chain | bulwark | +10.3% | — | — | — | — | 3/0 | NO | NO | NO | NO | _not measured_ |

- Contracts measured: **14** of 15.
- Holding: **8**, of which **3** with all five guards passing; the rest hold on the mean but sit inside the instrument's own noise.
- Inverted: **6**, of which **1** decisive (all five guards).
- Not measured: **1**.

The verdicts are the instrument's, unchanged by this part. Deep is one decisive
inversion. Five more inversions are inside the noise. Stalker is not measured because
no weapon carries Bulwark. These are monster-shape findings for the designer (design
§18.7), not roster findings. The full reports and JSON stayed in the agent's
scratchpad.

## Tests

- **New: `shared/src/world/nodeRosters.test.ts`.** It covers the spawner seam, the
  roster shapes, the crossroads (one per biome, on the dungeon, met last, near-equal
  with a strict leader), territories outside the crossroads, and roster variety. A
  mutation check confirmed it fails when a pair gains a third family, a family loses
  its territory, two nodes share a roster, or a share is not a whole tenth.
- **Changed: `server/test/variantBlend.test.ts`.** The arrival rule is restated in
  roster form. The live-spawn block now covers a pure, a pair and the crossroads,
  chosen by shape; before, it pinned plains-01 at 70/20/10.
- **Unchanged and passing: `shared/src/world/nodeShards.test.ts`.** Every node pays a
  family it fields.
- **Related runs:** 27/27 files pass. That covers nodeShards, nodeRosters, variantBlend,
  lineageMaterials, benchNodeShards, areaInformation, farmLoop, durability35Matrix,
  compositionPairs, monsterSpawnTerrain, regionalRespawn, collision ×5, validation,
  bestiary ×2, tutorial, tutorialAnchors, and the bot's harness, farmBlockedStall,
  readiness, liveRouteActions, t1Routes.semantic and laneProfiles.
- **`pnpm typecheck`:** clean.
- **Full suite (`TEST_JOBS=4 pnpm test`):** **384/384 passed** in 556 s. The
  feat/legibility baseline was 383/383; the extra file is `nodeRosters.test.ts`.

## Follow-ups (out of scope here)

- **T2–T4 rosters.** 113 normal nodes are still three-family proportions. `ROSTER_TIERS`
  (`nodeBlends.ts`) is the switch, and the roster test reads it.
- **Lane bench re-read.** `server/bench/lineage/laneMeasure.ts` builds one row per
  distinct resolved blend, so its node set changes with the rosters. It is A's bench.
- **The map and banner for a crossroads.** `isCrossroadsNode(nodeId)` is exported from
  shared. Today the banner says "<leader> territory" on a node where that leader is 4
  of 10 bodies; "Crossroads · drops <shard>" would read truer. That is D's banner.
- **Display names that now contradict their roster.** These names come from the old
  modifier-keyed name table, not from the families. *Spidernest Grotto* (cave-03, pure
  Deep) has no spiders, *Crownherd Prairie* (plains-04, Swarm/Sky) has no Herd, and
  *Leechbrood Mire* (swamp-03, pure Stalker) has no Mire family. Each was already a
  minority before the roster pass.
- **The guide's own order.** `tutorialNodeFor` breaks hop ties alphabetically, so
  the guide's second Forest arrival is forest-03, now a pure Canopy (mild), not
  forest-05. Before the roster pass it was Canopy 70, so this is not new; the arrival
  test reads the bot's order.
- **Forest door pressure.** Measure it in E's sweep (forest-04 concurrency against the
  entry-pressure pass's 0.50 mean attackers). The fallback is above.
- **Contract hosts.** The bench could now host a family on its authored pure node
  instead of a forced one: plains-03 Sky, forest-02 Grove, forest-03 Canopy,
  mountain-04 Hopper, cave-03 Deep, swamp-03 Stalker.
