# Map Variety Stage B — Stitched Regions Implementation Plan

**Status: IMPLEMENTED (2026-07-24).**

This is the executable plan for Stage B of the map-variety overhaul. Stage A is already
implemented and recorded in `docs/map-variety-implementation-plan.md`. Design authority is
`docs/map-variety-plan.md` v4. If this plan and that design disagree, the design wins; if
either disagrees with current code, preserve the locked design intent and adapt the plan.

The user explicitly authorized implementation after approving this plan. The implementation
is complete; this document now records the delivered design and acceptance criteria.

---

## 0. Outcome

Replace the 11×11 concentric ring map with one larger, stitched, organic world:

- one global cardinal grid with sparse occupied cells;
- one logical region per implemented tier, but no visible region boxes or borders;
- multiple ordinary traversable frontiers around a four-tier spiral;
- absent cells rendered as shattered-world void, not fake blocked nodes;
- every allowed active-biome × pace-family combination represented;
- exactly one additional native-family node per biome-region where a native exists;
- required Swarming and eligible Elite Ground coverage assigned as overlays;
- one modifier-free dungeon per active biome-tier;
- Clearing as the T1 respawn anchor, retaining its tutorial combat;
- one combat-empty sanctuary with a passive-reset altar in each of T2, T3, and T4;
- a substantially redesigned pan/zoom map and dynamically sized ops map;
- append-only support for T5–T8 without authoring placeholder late-tier nodes now.

No Stage A combat formulas, catalyst formulas, density numbers, monster balance, or dungeon
balance are changed by this stage.

---

## 1. Locked decisions

### 1.1 World form

- The player sees one continuous world map, not region tabs or separate acts.
- Regions are logical tier/content metadata over the same canvas.
- Region outlines, square panels, boundary gates, and hard border treatments are forbidden.
- Every occupied cardinally adjacent cell is traversable. Normal regional frontiers and unique
  approaches use the same ordinary adjacency rule.
- T1↔T2, T2↔T3, T3↔T4, and T4↔T1 share multiple frontier edges. T1↔T3 and T2↔T4 may not touch.
- T4 occupies the southwest quadrant and reconnects to T1, completing the spiral and shortening
  late-game backtracking; the direct danger jump is intentionally not gated.
- The current broad compass grammar survives: cold trends north, jungle east, swamp/wet west.

### 1.2 Void

- Missing grid positions are negative space rendered as the setting's void.
- A void position is not a node and has no id, data record, tooltip, pathfinding vertex,
  network state, telemetry row, collision region, or click target.
- No sea/mountain/void "blocked-node" type is introduced.
- T1–T4 should read as an irregular connected world-fragment, not isolated islands connected
  by single-cell corridors.
- Target authoring density inside the T1–T4 occupied bounding box is roughly 60–75%. This is a
  silhouette guide, not a runtime invariant.

### 1.3 Coverage

For every biome active at a tier:

1. Author exactly one normal repeatable node for every compatible pace family.
2. Author exactly one additional node using that biome's native pace family.
3. Plains has no native and therefore receives no duplicate.
4. Author exactly one modifier-free dungeon for that biome-tier.
5. Apply Swarming to at least one of the normal nodes if Swarming is legal.
6. Apply Elite Ground to at least one normal node only if it is legal and that exact
   biome-tier monster pool contains at least one static `elite` entry.
7. Density is an overlay on the pace coverage; it does not add nodes and is not crossed with
   every pace family.

Hard-banned families and density combinations remain those in
`shared/src/world/nodeModifiers.ts`.

### 1.4 Respawn anchors

- T1 has no dedicated sanctuary.
- Clearing remains a combat-capable T0 tutorial node and acts as T1's respawn anchor.
- T2, T3, and T4 each have one combat-empty sanctuary with the Clearing's passive-reset altar.
- Dying in a region respawns at that region's configured anchor.
- Sanctuary behavior is not an unlock/checkpoint system; the region definition directly owns
  its anchor.
- Sanctuary nodes do not spawn monsters, grant progression, carry modifiers, count toward
  coverage, or act as dungeons.
- Towns, NPCs, fast travel, vendors, and other sanctuary services remain out of scope; the
  shared passive-reset altar is the sanctuary's sole service.

### 1.5 Migration and future tiers

- Every existing character position resets to Clearing when Stage B lands.
- Gear, skills, runes, player tier, biome levels/XP, recipes, bestiary, essences, family
  catalysts, and biome-tier boss clears survive.
- Node-id-keyed exploration state is reset rather than remapped.
- T5–T8 get no nodes, void reservations, or fake locked layouts now.
- Bounds and all map consumers derive dynamically so future regions append beyond T4 without
  moving T1–T4 or changing map-system code.

### 1.6 Naming

- Region, sanctuary, landmark, and ordinary node names ship as obvious editable placeholders.
- Normal nodes do not require 140 unique lore names in this stage.
- Stable internal node ids must not encode mutable display names or density assignments.

---

## 2. Implemented-region content budget

The active biome schedule is defined by authored monster pools, matching the current world.

| Region | Active biomes | Normal nodes after native duplicate | Dungeons | Sanctuary/anchor |
|---|---|---:|---:|---:|
| T1 | Forest, Mountain, Plains, Swamp, Cave | 27 | 5 | Clearing |
| T2 | Forest, Mountain, Plains, Swamp, Cave, Jungle, Desert | 37 | 7 | 1 empty |
| T3 | Mountain, Swamp, Cave, Jungle, Tundra, Desert, Volcanic | 38 | 7 | 1 empty |
| T4 | Mountain, Jungle, Tundra, Desert, Volcanic, Wasteland, Trench | 38 | 7 | 1 empty |

Totals:

- 140 normal repeatable nodes;
- 26 modifier-free dungeons;
- 3 empty sanctuaries;
- 1 Clearing tutorial/anchor;
- **170 gameplay nodes in T1–T4.**

### 2.1 Per-biome normal-node counts

Allowed-family count plus one native duplicate:

| Biome | Allowed pace families | Native duplicate | Normal nodes per active region |
|---|---:|---:|---:|
| Plains | 5 | 0 | 5 |
| Forest | 4 | 1 Alacrity | 5 |
| Mountain | 4 | 1 Brutality | 5 |
| Swamp | 5 | 1 Blight | 6 |
| Cave | 5 | 1 Volatility | 6 |
| Jungle | 4 | 1 Alacrity | 5 |
| Desert | 4 | 1 Predation | 5 |
| Tundra | 4 | 1 Brutality | 5 |
| Volcanic | 5 | 1 Blight | 6 |
| Wasteland (`graveyard`) | 5 | 1 Blight | 6 |
| Trench | 5 | 1 Predation | 6 |

### 2.2 Density coverage with current content

Swarming is required once per active biome-tier except where banned. Under the current ban
table, Wasteland is the only active biome-tier that forbids Swarming.

Elite Ground is required only for these currently legal, elite-backed pools:

- Jungle T2;
- Jungle T3;
- Jungle T4;
- Tundra T4;
- Volcanic T4;
- Wasteland T4.

Validation derives this list from the live biome pool and `MONSTER_DATABASE`; the
implementation does not hardcode stale eligibility.

---

## 3. Canonical shared world model

### 3.1 Replace parallel authored maps with one source

The current biome assignment (`NODE_BIOMES`) and modifier assignment (`NODE_MODIFIERS`) are
separate hand-authored records keyed by coordinate-shaped ids. Stage B made drift between
those records too easy to tolerate.

Introduce one canonical shared authoring shape, split into per-region data files for
maintainability:

```ts
type WorldRegionId = `t${number}`;

type WorldNodeKind =
  | 'normal'
  | 'dungeon'
  | 'sanctuary'
  | 'tutorial'
  | 'unique';

interface WorldMapCoord {
  row: number;
  col: number;
}

interface WorldNodeAuthoring {
  id: string;
  displayName: string;
  regionId: WorldRegionId;
  map: WorldMapCoord;
  kind: WorldNodeKind;
  biomeGroup: string;
  biomeTier: number;
  pace?: PaceFamily;
  density?: DensityModifier;
  bossTypeId?: string;
  mobDensity?: number;
  featureSetId?: string;
  featureVariant?: number;
}

interface WorldRegionDefinition {
  id: WorldRegionId;
  tier: number;
  displayName: string;
  respawnNodeId: string;
}
```

Suggested files:

```text
shared/src/world/map/
  types.ts
  regions.ts
  regionT1.ts
  regionT2.ts
  regionT3.ts
  regionT4.ts
  registry.ts
  validation.ts
  coordinates.ts
```

`registry.ts` composes the four authored arrays and derives:

- `WORLD_NODES: ReadonlyMap<string, WorldNodeAuthoring>`;
- `WORLD_REGIONS`;
- `NODE_ID_BY_MAP_CELL`;
- `WORLD_MAP_BOUNDS`;
- `NODE_BIOMES` compatibility projection for non-map consumers;
- `NODE_MODIFIERS` compatibility projection for Stage A systems;
- pure lookup helpers for kind, region, coordinates, and adjacency.

There must be one authored source, not synchronized biome/modifier/position tables.

Move world-assignment validation out of `nodeModifiers.ts` into `map/validation.ts` during this
cutover. Modifier vocabulary and pure reshaping math may be imported by the map authoring
layer, but they must not import the composed world registry back and create a module cycle.
`isModifierExcludedNode` can become a pure node-kind helper or a registry helper; it should no
longer require parallel top-level maps.

### 3.2 Stable ids are opaque

Internal ids are stable authoring keys independent of coordinates, display names, and density:

```text
node-clearing
node-t1-forest-01
node-t1-forest-dungeon
node-t2-sanctuary
node-t4-volcanic-04
```

Do not include `alacrity`, `swarming`, or a placeholder location name in an id. Those fields
will be retuned during playtesting and must not invalidate persistence or analytics.

All code that splits a node id to discover row/column must be removed. Coordinates come from
the registry.

### 3.3 Sparse adjacency

For an ordinary node, cardinal exits are derived by looking up occupied coordinates at:

```text
(row - 1, col) north
(row + 1, col) south
(row, col - 1) west
(row, col + 1) east
```

Absent coordinates create closed edges and void on the map. Derived exits become the shared
authority used by:

- server transitions and `NODE_REGISTRY`;
- collision gate generation;
- client neighbor-scene rendering;
- player pathfinding;
- auto-traverse and party follow;
- map path previews;
- admin/ops navigation.

The client must not retain a second grid-neighbor BFS. Export one pure shared shortest-path
helper or one shared adjacency iterator and use it on both sides.

### 3.4 Dynamic bounds

`WORLD_MAP_BOUNDS` is derived from real coordinates:

```ts
{ minRow, maxRow, minCol, maxCol, rows, cols }
```

No runtime consumer may keep `11`, `10`, `GRID_ROWS`, `GRID_COLS`, `ORIGIN_ROW`, or
`ORIGIN_COL` as world-size authority. Centered player-facing coordinates, if retained, are
computed relative to Clearing's authored map coordinate.

---

## 4. World layout authoring

### 4.1 Author the topology before wiring gameplay

Create a checked-in ASCII or Markdown atlas alongside the region data during implementation.
It is a review aid, not a second runtime source. Each occupied cell should show a short node
token; blank cells are void.

Authoring sequence:

1. Place Clearing and the T1 biome clusters.
2. Shape T1 with loops and short branches.
3. Grow a multi-edge T1/T2 frontier rather than a chokepoint.
4. Continue clockwise through T2/T3 and T3/T4, then close the spiral with T4/T1.
5. Place each region's sanctuary near a natural entry area without forcing all traffic through
   it.
6. Place each biome's dungeon on a regional edge or corner-like cell, far from that region's
   respawn anchor.
7. Introduce modest exterior cuts and interior void fractures.
8. Leave open expansion space beyond T4 conceptually, but do not author placeholder cells.

### 4.2 Organic-layout constraints

- Every region's induced subgraph is connected.
- The full graph is connected.
- Every normal node has at least one exit.
- Avoid long one-cell-wide corridors.
- Avoid large rectangular blocks with no missing cells.
- Avoid excessive isolated holes that make routes visually noisy.
- Each intended spiral pair (T1↔T2, T2↔T3, T3↔T4, T4↔T1) has at least two cross-region
  edges, preferably distributed along a short frontier rather than sharing one articulation node.
- No T1↔T3 or T2↔T4 adjacency.
- Prefer at least two useful routes between sanctuary, major biome clusters, and frontier.
- Dungeons occupy corner-like edge cells, remain at least four Manhattan steps from the
  regional respawn anchor, directly touch their own connected biome cluster, and cannot be
  required transit nodes.
- Biome allocation avoids uninterrupted horizontal or vertical runs longer than five nodes.
- A sanctuary cannot be required transit for all routes through its region.

### 4.3 Placeholder content

Use predictable display placeholders:

```text
Region 1
Region 2
T2 Sanctuary
T3 Jungle 03
T4 Volcanic Dungeon
```

The user will rename regions and nodes during playtesting. Keep display names isolated in
authoring records so this is a data-only edit.

---

## 5. Validation as executable specification

Add a pure shared validator that returns human-readable violations and runs in tests and dev
boot. It must verify:

### 5.1 Identity and coordinates

- ids are unique;
- coordinates are unique;
- region ids exist;
- region tier matches node biome tier except Clearing's documented T0/T1 exception;
- every region respawn id exists and belongs to that region;
- no coordinate or exit is inferred from an id string.

### 5.2 Kind rules

- `normal`: exactly one pace; optional legal density; spawnable biome pool exists;
- `dungeon`: no pace/density; boss pool or explicit boss exists;
- `sanctuary`: no pace/density/boss; effective mob density is zero;
- `tutorial`: Clearing only; no pace/density; spawnable T0 pool allowed;
- `unique`: no pace/density unless a future design explicitly permits it; no unique nodes are
  authored in this stage.

### 5.3 Coverage matrix

For every active biome-tier:

- every allowed pace family occurs exactly once;
- native family occurs exactly twice;
- Plains families each occur exactly once;
- banned pace families occur zero times;
- required Swarming occurs at least once where legal and zero times where banned;
- Elite Ground occurs at least once iff legal and the exact pool contains an elite;
- Elite Ground occurs zero times without an eligible pool;
- exactly one modifier-free dungeon exists.

### 5.4 Graph rules

- full-world connectivity;
- per-region connectivity;
- no orphan node;
- reciprocal exits;
- only cardinal-coordinate neighbors are connected in the normal grid;
- at least two frontier edges for T1↔T2, T2↔T3, T3↔T4, and T4↔T1;
- no T1↔T3 or T2↔T4 frontier edge;
- every dungeon has at most two same-region neighbors and is at least four Manhattan steps
  from its regional respawn anchor;
- every dungeon directly touches its own biome, every biome/dungeon cluster is connected, and
  no same-biome straight run exceeds five nodes;
- no dungeon or sanctuary is an articulation point for the entire region;
- a shortest path exists from Clearing to every node.

### 5.5 Count snapshot

Until biome rosters change, assert:

- 140 normal;
- 26 dungeon;
- 3 sanctuary;
- 1 tutorial;
- 0 unique;
- 170 total.

If content changes intentionally, update the design table and snapshot together.

---

## 6. Shared and server implementation phases

### Phase B1 — shared sparse-world foundation

Primary files:

- new `shared/src/world/map/*`;
- `shared/src/world/nodeBiomes.ts`;
- `shared/src/world/nodeModifierMap.ts`;
- `shared/src/world/nodeModifiers.ts`;
- `shared/src/collision/nodeAdjacency.ts`;
- `shared/src/collision/gates.ts`;
- `shared/src/config/gameConfig.ts`;
- `shared/src/index.ts`.

Work:

1. Add the canonical node/region types and derived indexes.
2. Make coordinate and adjacency helpers registry-backed.
3. Derive compatibility exports used by current biome/modifier systems.
4. Move map-assignment validation out of the modifier-math module to avoid a registry cycle.
5. Replace tier-band modifier validation with exact per-region coverage validation.
6. Derive Clearing-relative display coordinates without parsing ids.
7. Add the full shared validation suite before authoring all nodes.

Exit criteria:

- a small fixture sparse map proves bounds, adjacency, void gaps, and paths;
- no shared map helper assumes 11×11 or parses an id;
- Stage A modifier math remains unchanged.

### Phase B2 — author the T1–T4 world

Primary files:

- new per-region authoring files;
- `shared/src/world/nodeFeatures.ts`;
- `shared/src/biomeDatabase.ts`;
- `shared/src/dungeons/gauntletDatabase.ts` as needed;
- `shared/src/quests/questDatabase.ts` for reachable dungeon boss lists.

Work:

1. Check in the reviewed sparse atlas and 170 canonical node records.
2. Assign exact pace coverage and one native duplicate.
3. Assign required density overlays without creating extra nodes.
4. Add one dungeon per active biome-tier.
5. Add T2–T4 sanctuary records.
6. Add a presentation-only `sanctuary` biome definition with an empty pool and zero density;
   it may reuse Clearing presentation assets initially and is excluded from progression by
   node kind.
7. Give all entries placeholder display names.
8. Ensure tier advancement quest targets match the actually reachable dungeon bosses.

Exit criteria:

- validator returns zero violations;
- node-count snapshot matches §5.5;
- every authored normal node has a valid monster pool;
- every dungeon has an authored boss exam.

### Phase B3 — server registry, transitions, and pathing

Primary files:

- `server/src/world/nodeRegistry.ts`;
- `server/src/world/nodePath.ts`;
- `server/src/world/World.ts`;
- `server/src/systems/world/transitions.ts`;
- `server/src/systems/world/autoTraverse.ts`;
- `server/src/systems/world/partyFollow.ts`;
- `server/src/systems/world/spawning/index.ts`;
- relevant admin teleport/respawn actions.

Work:

1. Build `NODE_REGISTRY` by iterating canonical shared nodes rather than enumerating a
   rectangle.
2. Populate exits from shared sparse adjacency.
3. Replace server-local node-id parsing and direction logic.
4. Ensure transition spawning works on every reciprocal exit.
5. Make sanctuaries population-free and dungeon-free.
6. Keep node freeze/thaw behavior; 170 definitions must not mean 170 active simulations.
7. Keep manual travel unrestricted by tier unless an existing rule already restricts it.
8. Let auto-traverse use the new shared graph.

Playtest watch item:

`areAllNonBossNodesClearedAtTier` currently makes auto-traverse visit every normal node before
considering a biome complete. Under exhaustive coverage this becomes 5–6 nodes per biome.
Preserve that behavior for Stage B, but flag it for playtest rather than silently weakening
completion semantics.

Exit criteria:

- player, party, and auto-traverse movement can reach every real node;
- void coordinates can never be targeted or transitioned into;
- thaw/population remains lazy;
- no runtime world-size constant remains.

### Phase B4 — node features and unique-node identity

Current terrain/features include hardcoded coordinate ids for Clearing, the dormant throne
encounter, mountain ledge
variants, swamp hazards, jungle thickets, volcanic heat, and dungeon exams.

Primary files:

- `shared/src/world/nodeFeatures.ts`;
- `server/src/systems/world/nodeFeatures.ts`;
- `client/src/scenes/game/overlays.ts`;
- `client/src/scenes/game/voidThrone.ts`;
- `client/src/scenes/game/runeAltar.ts`;
- `client/src/sprites.ts`;
- terrain/tree helpers that branch on node id.

Work:

1. Replace coordinate-id feature maps with `featureSetId` / `featureVariant` metadata.
2. Keep Clearing identity behind an exported constant; leave dormant throne code unbound to
   the current map until its redesign.
3. Reuse existing deterministic feature variants across the expanded biome nodes.
4. Do not require bespoke environmental content for every pace node.
5. Ensure a node move in map coordinates does not change its in-node terrain seed unless
   explicitly desired.

Exit criteria:

- every expanded biome node retains its established biome ecology/terrain identity;
- Clearing altar remains correctly placed; the dormant throne encounter is not placed;
- no special feature depends on an obsolete coordinate-shaped id.

---

## 7. Sanctuaries, death, and migration

### Phase B5 — regional respawn

Primary files:

- `server/src/systems/world/spawning/index.ts`;
- death acknowledgement handler;
- `shared/src/protocol/socketEvents.ts`;
- `shared/src/protocol/death.ts`;
- `client/src/hud/DeathOverlay.tsx`;
- HUD/stat help copy.

Replace `respawnPlayer`'s Clearing literal with:

1. read the player's death/current node;
2. resolve its `regionId`;
3. resolve the region's `respawnNodeId`;
4. thaw that node if needed;
5. move the player to its center;
6. clear combat, targeting, motion, minions, and transient state exactly as today;
7. force a full snapshot for the destination node.

Fallback for an unknown node or malformed save is always Clearing.

Update player-facing death copy from "return to the Clearing" to the resolved anchor name.

### Phase B6 — persistence migration

Add the next game DB migration after `0002_wipe_catalyst_wallets.sql`.

The migration must:

- reset persisted `has_position.nodeId` to the new Clearing id;
- reset persisted `has_position.current` to Clearing center;
- clear `tracks_progression.clearedNodes`;
- preserve biome XP/levels, recipes, bestiary, tier, currencies, inventory, skills, and
  biome-tier boss-clear tokens;
- avoid wiping family catalysts a second time.

Also add hydrate-time defense:

- if persisted `nodeId` is not in `WORLD_NODES`, reset to Clearing;
- clamp/reset the local position if it is outside node bounds;
- sanitize obsolete node-keyed exploration entries.

Runtime-only boss respawn markers require no row migration. Preserve the global Void Overlord
cooldown if its world-state key is independent of throne node id.

Migration verification:

- run against a real local DB containing at least one pre-Stage-B character;
- verify restart/hydrate after migration;
- verify an old save fixture without running SQL still falls back safely.

---

## 8. Player map redesign

### Phase B7 — stitched pan/zoom map

Primary files:

- `client/src/ui/map/MapPanel.tsx`;
- `client/src/ui/map/OverviewMap.tsx`;
- `client/src/ui/map/NodeInfo.tsx`;
- `client/src/ui/map/pathing.ts`;
- `client/src/ui/map/constants.ts`;
- `client/src/ui/map.css`;
- map-related atoms/intents.

The current 5×5 viewport, arrow panning, 11×11 overview, and client-local BFS are placeholders
and should be replaced rather than stretched.

#### Camera

- drag/pointer pan;
- mouse-wheel zoom centered on pointer;
- touch pan and pinch zoom;
- keyboard-accessible zoom controls;
- `Fit world`, `Center on player`, and `Center on destination` controls;
- sensible min/max zoom derived from dialog size and world bounds;
- preserve camera while selecting nodes; opening normally centers the player.

#### World layer

- absolutely position only real nodes from their authored map coordinates;
- render missing cells as the void-backed map background, not DOM tiles;
- use subtle spacing/shadows/connections so occupied adjacency remains legible;
- do not draw region borders or rectangular region backgrounds;
- optional quiet placeholder region label near its sanctuary/visual center;
- retain current/destination/path/selected/dungeon/felled/highlight states;
- path preview comes from shared sparse adjacency.

#### Information and discovery

Keep all current node detail and add fast navigation:

- search by placeholder display name or biome;
- filters/toggles for tier, biome, pace family, density, dungeon, and sanctuary;
- legend for pace colors and special kinds;
- qualitative modifier summaries and catalyst family before travel;
- clear selected destination and travel action;
- route length/step count;
- no fog-of-war requirement in this stage.

#### Overview

Replace the fixed 11×11 DOM overview with a lightweight SVG/canvas minimap derived from real
bounds:

- fit the full occupied silhouette;
- show void naturally as empty background;
- show current node, destination, selected route, dungeons, and camera viewport;
- clicking/dragging the overview recenters the main camera.

#### Accessibility and performance

- all real nodes remain keyboard-focusable;
- zoom controls have labels and predictable focus;
- filters do not remove the selected/current node without a visible explanation;
- 170 DOM nodes are acceptable, but pointer-move state must avoid rerendering expensive detail
  trees on every frame;
- use requestAnimationFrame or transform refs for active panning if React state proves noisy.

Exit criteria:

- every node is selectable and reachable from the map;
- modifier, density, biome, tier, dungeon, sanctuary, and route information is available before
  travel;
- desktop and touch navigation are usable at minimum and maximum zoom;
- no UI creates elements for void cells.

---

## 9. Admin, analytics, and operational views

### Phase B8 — dynamic sparse ops map

Primary files:

- `admin/src/tabs/OpsMapTab.tsx`;
- `admin/src/tabs/opsmap/NodeTelemetryHistogram3D.tsx`;
- `admin/src/ops-map.css`;
- `admin/src/tabs/AnalyticsTab.tsx`;
- server analytics aggregation if it parses ids.

Work:

1. Iterate `WORLD_NODES`, not `GRID_ROWS × GRID_COLS`.
2. Position heat tiles from authored coordinates and dynamic bounds.
3. Exclude void positions from the heat map and 3D histogram.
4. Make the 3D histogram grid dimensions and empty cells dynamic, or replace it with a sparse
   projection if the expanded aspect ratio is unreadable.
5. Replace analytics node-coordinate regex parsing with shared coordinate lookup.
6. Keep orphan/leak telemetry flags and node pinning.
7. Show region, tier, kind, biome, pace, and density in the telemetry detail.

Exit criteria:

- all 170 definitions are inspectable;
- no ops/analytics view claims the world is 11×11;
- historical logs with old node ids display as unknown legacy locations rather than crashing.

---

## 10. Secondary consumers and cleanup

Audit every `NODE_BIOMES` consumer, but change only assumptions that Stage B invalidates.

Known categories:

- biome XP, bestiary, crafting, HUD biome display: lookup remains valid through compatibility
  projection;
- quest map highlighting: iterate canonical nodes and exclude sanctuary/unique/tutorial where
  appropriate;
- death location formatting: use authored coordinate/name/region helpers;
- audio and environmental presentation: biome lookup remains;
- dungeon database: resolve by biome-tier/kind, not coordinate;
- target-priority and reward systems: node modifier lookup remains;
- collision and neighbor rendering: shared sparse exits replace rectangular bounds;
- dev teleport/admin actions: validate against `WORLD_NODES`;
- tests/bench scripts using Clearing literals: replace meaningful runtime literals with
  `CLEARING_NODE_ID`; isolated combat tests may continue using the constant.

Remove or deprecate:

- world-size constants;
- node-id coordinate parsers;
- duplicate client BFS;
- hand-enumerated server registry nodes;
- coordinate-keyed modifier authoring;
- stale docs saying dungeons have modifiers/catalysts or regions use one gate.

---

## 11. Test plan

Tests remain plain `tsx` scripts with hand-rolled assertions and no database dependency unless
explicitly running the migration verification outside `pnpm test`.

### Shared tests

- canonical ids and coordinates unique;
- dynamic bounds exact;
- absent cell has no node/exits;
- reciprocal cardinal exits;
- direction helper on sparse neighbors;
- full and per-region connectivity;
- frontier and no-tier-skip invariants;
- exact coverage/native counts;
- density bans and elite-pool eligibility;
- dungeon/sanctuary/kind rules;
- 170-node count snapshot;
- path from Clearing to every node;
- Clearing-relative coordinate formatting.

### Server tests

- registry includes only real nodes plus test room;
- transition across every direction and representative frontier;
- no transition into void;
- sanctuary population remains zero after thaw/ensure;
- dungeon spawn remains unmodified by node modifiers;
- normal pace/density spawn wiring still applies;
- death in T1 respawns at Clearing;
- death in T2/T3/T4 respawns at the matching sanctuary;
- unknown saved node falls back to Clearing;
- auto-traverse crosses regions and reaches a remote target;
- party follow crosses a sparse frontier;
- altar special behavior survives the new id; the dormant throne behavior remains unbound.

### Client/admin verification

- typecheck all packages;
- browser QA at full-world fit, medium zoom, and close zoom;
- pan, wheel, pinch, keyboard zoom, minimap recenter;
- player/destination/path highlight through multiple regions;
- search and every filter;
- modifier/density/dungeon/sanctuary detail;
- ops heat and 3D/sparse telemetry selection;
- mobile dialog sizing and touch gestures;
- background-tab/resync while map is open.

### Required commands

```text
pnpm typecheck
pnpm test
pnpm build
```

Also run the focused spatial/collision suite after adjacency changes:

```text
pnpm test:spatial
```

---

## 12. Phase order and commit boundaries

Implement in this order:

1. **B1 shared sparse-world foundation**
2. **B2 world authoring + validation**
3. **B3 server registry/transitions/pathing**
4. **B4 feature metadata migration**
5. **B5 regional respawn**
6. **B6 persistence migration**
7. **B7 player map redesign**
8. **B8 admin/analytics**
9. **B9 integration QA, docs, and playtest handoff**

Each phase ends with relevant focused tests plus `pnpm typecheck`. Full `pnpm test` runs at
every phase that changes shared/server behavior and before handoff. The implementation was
validated at handoff with the full repository checks listed below.

---

## 13. Explicitly out of scope

- T5–T8 biome rosters, nodes, bosses, sanctuaries, or art;
- unique final names for ~140 farming nodes;
- new monster or dungeon balance;
- changing modifier percentages or density reward normalization;
- pace × density Cartesian coverage;
- runtime-promoted elite monsters;
- blocked sea, mountain, or void nodes;
- fog of war;
- region locks or boss-gated borders;
- towns, NPCs, vendors, fast travel, or sanctuary services;
- in-world pace/density palette swaps or new PixelLab generation;
- world events or rotating modifiers;
- remapping old node exploration state.

---

## 14. Acceptance checklist

- [x] One canonical shared authoring source owns node identity, position, region, kind, biome,
      tier, pace, density, boss override, and feature variant.
- [x] The player and ops maps derive sparse coordinates and bounds without 11×11 constants.
- [x] Void appears only as empty map space; it never becomes a node.
- [x] The whole world and every region are connected.
- [x] The four intended spiral frontiers have multiple traversable edges and no hard border/gate.
- [x] Every allowed active-biome × pace-family combination exists exactly once.
- [x] Every native family has exactly one additional node; Plains has none.
- [x] Required Swarming and eligible Elite Ground coverage passes validation.
- [x] Exactly one modifier-free dungeon exists per active biome-tier.
- [x] Clearing remains the Tiny Wisp tutorial and is T1's respawn anchor.
- [x] T2–T4 each have one combat-empty sanctuary, a passive-reset altar, and regional respawn.
- [x] Existing characters migrate to Clearing while non-node progression survives.
- [x] All coordinate parsing from node ids is removed from runtime map logic.
- [x] Paths, transitions, neighbor rendering, auto-traverse, and party follow use shared sparse
      adjacency.
- [x] The map supports drag/pan, wheel/pinch zoom, recentering, overview navigation, search,
      filters, selection, and route information.
- [x] Admin heat/telemetry and analytics support the sparse dynamic world.
- [x] T5–T8 can append data without moving T1–T4 or changing map-system architecture.
- [x] `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm test:spatial` pass.

Automated validation is complete. A final interactive visual pass remains recommended because
the in-app browser bridge was unavailable during implementation handoff.
