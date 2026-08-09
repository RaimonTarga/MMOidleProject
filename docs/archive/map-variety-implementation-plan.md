> **ARCHIVED (2026-08-09) — Stage A implemented 2026-07-24 (`feat/map-variety-stage-a`).**
> Living design authority: `docs/map-variety-plan.md`. Stage B is archived alongside this doc at
> `docs/archive/map-variety-regions-implementation-plan.md`. Kept as the executed Stage A record.

# Map Variety — Implementation Plan (Stage A)

**Status: Stage A EXECUTED (2026-07-24) on `feat/map-variety-stage-a` — corrections below
applied; Stage B is planned separately in
`docs/archive/map-variety-regions-implementation-plan.md`.** Design authority is the current living
`docs/map-variety-plan.md` — if this plan and that doc disagree, the
design doc wins; if either disagrees with code reality, read the code and adapt while
preserving design intent. This plan was written against a fresh read of the code; all
file:line anchors below were verified on 2026-07-24 and may have drifted slightly — treat
them as "start looking here," not gospel.

**Executor notes (read before starting):**
- Read `docs/map-variety-plan.md` fully first, especially §1 (modifiers), §2 (economy),
  §7 (pre-made implementation decisions). Then skim `design_docs/design-bible.md` §1 (core
  invariants — determinism, budget separation) and CLAUDE.md (repo conventions).
- **Stage A only.** Everything runs on the existing 11×11 grid. Stage B (regions) is
  outlined at the bottom for context and MUST NOT be implemented under this plan — it gets
  its own plan after Stage A ships and is playtested.
- **All balance numbers in this plan are PLACEHOLDERS.** The user owns numeric tuning and
  edits those values directly. Your job is correct structure, clearly-named constants in
  one place, and sane starting values — never spend effort "balancing."
- Work phase by phase (A1→A5). Each phase ends with `pnpm typecheck` and `pnpm test` green.
  Tests are plain tsx scripts with hand-rolled asserts (see CLAUDE.md "Tests") — no vitest.
  Tests must not touch Postgres/Redis; construct `World` directly.
- Commit at each phase boundary (on `develop` or a feature branch per user preference at
  execution time).

---

## 0. Ground truth — the seams (verified 2026-07-24)

| Concern | Location |
|---|---|
| Node table (biome/tier per node id) | `shared/src/world/nodeBiomes.ts` — `NODE_BIOMES`, `NodeBiomeInfo` (has optional `mobDensity` override; throne node has `mobDensity: 0`) |
| Monster stat instantiation (single choke point) | `server/src/systems/world/spawning/index.ts:212` `createMonster` — dungeon mults precedent at :233-240 (`DUNGEON_HP_MULT`/`DUNGEON_ATK_MULT`, skipped for `isBoss`); sets `dealsDamage.attack`, `performsAttack.attackCooldown`, `hasPosition.speed`, `controlsMonster.baseSpeed` before `ecs.add` |
| Spawn pool pick (uniform random) | same file `spawnMonster` :326-335 — `biome.monsterPoolByTier[biomeTier]`, uniform `Math.random()` pick |
| Population target | `server/src/world/World.ts:530` `getMobDensity(nodeId)` — node override → biome `mobDensity` → `GAME_CONFIG.MONSTERS_PER_NODE` |
| Gauntlet dungeons spawn path | `server/src/systems/world/dungeons/gauntlet.ts:529,588,640,851` — all via `world.createMonster`/`world.spawnPack`, so per-node stat reshaping applies automatically; guardian opening-strike injection precedent: `tracksDungeon.openingStrikeMult` |
| Monster empowered mechanics (cadence / cooldown / opening strike) | `server/src/systems/combat/engine/monsterMechanics.ts:52` `monsterEmpoweredMultiplier(monster, def, now)` — counters on `tracksCombat`; opening strike already supports an entity-level override: `monster.tracksDungeon?.openingStrikeMult ?? def?.openingStrike?.multiplier` (:86) |
| Where empowered mult is consumed | `server/src/systems/combat/engine/combat.ts:567` (monster→player hit path; `slowEffect` at :705) |
| Monster on-hit DoT read sites (3, all use the same fallback chain) | `monster.scriptsBoss?.dotEffectOverride ?? def?.dotEffect` at `server/src/systems/classes/archetypes/dot/dotPrototype.ts:371` (on-hit application), `server/src/systems/combat/damage/dotTickEvent.ts:87`, `server/src/systems/combat/buffs/buffSync.ts:318` |
| Monster def mechanic fields to reuse | `shared/src/data/monsters/types.ts` — `dotEffect` (:367), `cadenceFinisher` (:443), `empoweredCooldown` (:452), `openingStrike` (:461), `elite?: boolean` (:279) |
| Catalyst grant choke point | `server/src/systems/player/progression/rewards.ts:43` `grantCatalystProgress(recipient, key, weight)`; called at :192-196 with `biomeGroup` (`nodeId` is in scope at :181); boss first-clear `catalystBundle` at :239-244 keyed `info.biomeGroup` |
| Catalyst wallet | `TracksProgression.catalysts` / `catalystProgress`, both `Record<string, number>` (`shared/src/components/core/networkedSlices.ts:233`); networked as whole slice — no protocol change needed |
| Catalyst display name | `shared/src/biomeDatabase.ts:38` `catalystLabel(group)` — signature `(key: string) => string`, used in ~10 files (client crafting/stances/rites/abilities/map/CatalystPanel + 4 server economy files). Keep the signature; change the body |
| Catalyst cost fields | `Recipe.catalystCost` / `reconstructCatalystCost` — `Partial<Record<string, number>>` (`shared/src/data/recipes/types.ts:46,92`); `UpgradeStep` cost + `upgradeCatalystCostFor`/`checkUpgrade` in `shared/src/items.ts` + `shared/src/systems/itemUpgrades.ts:97-121,155` |
| Existing authored catalyst sinks (to re-key in A3) | grep `catalystCost` in `shared/src` — `data/recipes/forest.recipes.ts`, `stanceRecipes.ts`, `riteRecipes.ts`, `abilityRecipes.ts`, evolution `reconstructCatalystCost` (`systems/evolution.ts`) |
| Wallet persistence | `server/src/db/playerRepo.ts:200-201` (hydrate defaults `?? {}`), :251-252 (fresh-player seed). Migrations: `server/src/db/migrations/0000_*.sql`, `0001_*.sql` (numbered SQL, run at boot) |
| Map node panel (info contract home) | `client/src/ui/map/NodeInfo.tsx` (already renders `catalystCost` rows via `catalystLabel`); tile colors/badges in `client/src/ui/map/constants.tsx`; the grid component is in the same dir |
| Catalyst wallet HUD | `client/src/hud/CatalystPanel.tsx` — iterates wallet entries, labels via `catalystLabel` |
| Networked monster keys (do NOT add the new component) | `shared/src/protocol/networkedEntity.ts:71` |

## 1. Architecture in one paragraph

A new shared module defines the five pace families, two density modifiers, per-node
assignments (`NODE_MODIFIERS`), display labels/summaries, ban tables, validation, and the
pure reshaping math. The server applies reshaping at the existing single monster-creation
choke point: plain stat scalars are baked into the entity at spawn (same pattern as dungeon
mults), while mechanic overlays (added/amplified DoT, opening strike, counted burst) ride a
new **server-only, non-networked** component `moddedByNode` consulted by the three existing
mechanic read sites (all of which already support entity-level overrides). Catalyst granting
swaps its key from `biomeGroup` to `NODE_MODIFIERS[nodeId].pace`. Density modifiers adjust
population target and spawn-pool weighting plus an inverse reward multiplier. The client
needs zero protocol changes: `NODE_MODIFIERS` is static shared data, and wallets already
sync via `TracksProgression`.

---

## Phase A1 — shared foundation (`@mmo-idle/shared`)

New files under `shared/src/world/` (new static data location rules per CLAUDE.md: NEW data
goes in `shared/src/data/` — but this is world-structure data alongside `nodeBiomes.ts`, so
keep it in `shared/src/world/`; mirror how `nodeBiomes.ts` itself lives):

**`shared/src/world/nodeModifiers.ts`** (logic + labels):

```ts
export type PaceFamily = 'alacrity' | 'brutality' | 'blight' | 'volatility' | 'predation';
export const PACE_FAMILIES: PaceFamily[] = [...];
export type DensityModifier = 'swarming' | 'elite-ground';
export interface NodeModifierInfo { pace: PaceFamily; density?: DensityModifier }
```

- `PACE_FAMILY_LABELS` ("Alacrity", "Brutality", "Blight", "Volatility", "Predation"),
  `DENSITY_LABELS` ("Swarming", "Elite Ground").
- `PACE_FAMILY_SUMMARIES: Record<PaceFamily, string>` — one-line player-facing threat text
  straight from the design doc §1.2 table (e.g. alacrity: "Faster, lighter attacks — monsters
  strike and move quicker but hit softer."). Used by map UI.
- `PACE_FAMILY_COLORS: Record<PaceFamily, string>` — hex accents for badges (pick five
  readable hues; user may retint).
- `catalystFamilyLabel(family: string): string` → `"Alacrity Catalyst"` with the same
  capitalize-fallback behavior as today's `catalystLabel` for unknown keys.
- Ban tables (from design §1.5 table — "✖ redundant" counts as banned for authoring):
  - `PACE_HARD_BANS: Record<string, PaceFamily[]>` = forest `[brutality]`, mountain
    `[alacrity]`, jungle `[brutality]`, desert `[alacrity]`, tundra `[alacrity]`; all others `[]`.
  - `DENSITY_BANS: Record<string, DensityModifier[]>` = mountain/cave/desert/trench
    `['elite-ground']`, graveyard `['swarming']`; others `[]`.
  - `NATIVE_FAMILY: Record<string, PaceFamily | null>` = plains `null`, forest `alacrity`,
    mountain `brutality`, swamp `blight`, cave `volatility`, jungle `alacrity`, desert
    `predation`, tundra `brutality`, volcanic `blight`, graveyard `blight`, trench `predation`.
- **Reshaping math** (pure, deterministic, PLACEHOLDER magnitudes in one exported constant
  block so the user can tune them in one place):
  - `PACE_MAGNITUDE_BY_TIER: Record<number, number>` = `{1: 0.15, 2: 0.20, 3: 0.25, 4: 0.30}`
    (tier 0 / unknown → 0). Call it `M` below.
  - `paceStatScalars(family, biomeTier): { attackMult; attackCooldownMult; moveSpeedMult }`
    — threat-budget-neutral by construction (design §1.3):
    - alacrity: attack ×(1−M), cooldown ×(1−M) (DPS-neutral), move ×(1+M/2)
    - brutality: attack ×(1+M), cooldown ×(1+M), move ×1
    - blight: attack ×(1−M), cooldown ×1, move ×1 (removed throughput returns as DoT)
    - volatility: attack ×(1−M), cooldown ×1, move ×1 (average restored by the burst)
    - predation: attack ×(1−M/2), cooldown ×1, move ×1 (opener carries the rest)
  - `paceMechanicOverlay(family, biomeTier, def): PaceMechanicOverlay` where
    `PaceMechanicOverlay = { dot?: MonsterDotEffect; openingStrikeMult?: number; cadence?: { everyNAttacks: number; multiplier: number } }`:
    - **blight:** if `def.dotEffect` exists → return an amplified copy (damagePerStack
      ×(1+2M), same `debuffId` so stacking identity is preserved); else synthesize a generic
      DoT whose total tick throughput ≈ M × the monster's base direct DPS
      (damagePerStack derived from `def.stats.attack` and cooldown; maxStacks 5,
      tickIntervalMs 1000, durationMs 4000 — PLACEHOLDER; element defaults per the existing
      flavor fallback).
    - **predation:** `openingStrikeMult = 1 + 4M` (composes multiplicatively with any
      existing `def.openingStrike` / `tracksDungeon` injection at the read site).
    - **volatility:** if `def.cadenceFinisher` exists → no new pattern; instead return
      `cadence` matching the def's `everyNAttacks` with multiplier ×(1+M) relative (the read
      site multiplies). If absent → `cadence = { everyNAttacks: 3, multiplier: 1 + 3M }`
      (with the (1−M) baseline this averages ≈ (1−M)(1+M) ≈ 1 — neutral). Deterministic
      counter, no RNG (core invariant #1).
    - alacrity/brutality: no overlay (`{}`).
  - `densitySpawnFactor(density): number` = swarming 1.75, elite-ground 0.5 (PLACEHOLDER).
  - `densityRewardMult(density): number` = swarming 1/1.75, elite-ground 1/0.5 (PLACEHOLDER —
    §1.6 reward-throughput neutrality; user will tune since elite mobs already carry higher
    per-kill rewards).
  - `elitePoolWeight(density, isElite): number` — swarming: elite 0.25 / non-elite 1;
    elite-ground: elite 4 / non-elite 1; none: 1 (PLACEHOLDER).
- `validateNodeModifiers(): string[]` — returns human-readable violations (empty = valid):
  1. every node in `NODE_BIOMES` has an entry EXCEPT the exclusions (clearing `node-5-5`,
     the test room, and the throne node — identify it as the `NODE_BIOMES` entry with
     `mobDensity: 0`);
  2. no assignment violates `PACE_HARD_BANS` / `DENSITY_BANS`;
  3. within every tier band (group nodes by `biomeTier` — Stage A's approximation of the
     regional supply rule) each of the five families appears on ≥1 **non-dungeon** node;
  4. for every biome with a native family: the native family is that biome's single most
     frequent assignment across all its nodes, and appears on ≥1 non-dungeon node of that
     biome within each tier band where the biome exists.

**`shared/src/world/nodeModifierMap.ts`** (pure data): `NODE_MODIFIERS:
Record<string, NodeModifierInfo>` keyed by current grid node ids. In A1, author a **minimal
provisional map** sufficient for tests (it will be fully authored + validated in A5) — but
it must already pass `validateNodeModifiers()`, so in practice author the full ~118 rows
now with placeholder judgment and refine in A5. Dungeon nodes get a pace family like any
node. Include `Wasteland`'s Elite Ground node(s) (biome key `graveyard`).

Export everything through the shared package index (follow how `nodeBiomes.ts` is exported).

**Test:** `shared/src/world/nodeModifiers.test.ts` — `validateNodeModifiers()` returns `[]`;
scalar neutrality sanity (for each family/tier: `attackMult / attackCooldownMult` within
[0.95, 1.05] for alacrity/brutality; volatility average over its cycle within [0.9, 1.05]);
blight overlay preserves `debuffId` when amplifying; label fallbacks behave.

**Done when:** typecheck green, new test green, no server/client changes yet.

---

## Phase A2 — server application (spawning + combat)

1. **New component** `moddedByNode` (server-only scratch, NOT networked — do not touch
   `NETWORKED_MONSTER_KEYS`): add optional key to `ServerEntity`/`MonsterEntity` in
   `server/src/ecs/entity.ts`:
   ```ts
   moddedByNode?: {
     family: PaceFamily;
     dot?: MonsterDotEffect;          // resolved overlay (already amplified/synthesized)
     openingStrikeMult?: number;
     cadence?: { everyNAttacks: number; multiplier: number };
   };
   ```
   Check `server/src/ecs/markerInvariants.ts` — if it validates unknown component keys,
   register the new one accordingly. Component presence gates behavior (CLAUDE.md ECS rule):
   unmodified monsters (bosses, clearing/test-room spawns) simply never carry it.

2. **`createMonster`** (`spawning/index.ts:212`): after the dungeon-mult block and only when
   `!isBoss`, look up `NODE_MODIFIERS[nodeId]`. If present:
   - apply `paceStatScalars` to `atkBase` (post-dungeon-mult — dungeon scaling and modifier
     reshaping compose; the modifier is budget-neutral within itself), to
     `def.stats.attackCooldown` (into `performsAttack.attackCooldown`), and to speed (both
     `hasPosition.speed` and `controlsMonster.baseSpeed`) — all set before `ecs.add`, so no
     dirty-marking is needed (same as dungeon mults today);
   - compute `paceMechanicOverlay(family, biomeTier, def)` and, if non-empty or always (
     simpler: always when a modifier exists), attach `moddedByNode` via `addComponent` after
     `ecs.add` (mirror how `scriptsBoss` is attached at :304-310).
   - Round attack/cooldown like the dungeon path does. Bosses (`isBoss`) skip everything —
     design §1.1 boss immunity. Gauntlet guardians/waves/trash flow through this same
     function (see ground-truth table) and are intentionally modified.

3. **Mechanic read-site routing:**
   - Add `effectiveMonsterDot(monster, def)` in `server/src/systems/combat/engine/monsterMechanics.ts`
     with precedence `scriptsBoss.dotEffectOverride ?? moddedByNode.dot ?? def.dotEffect`,
     and replace the three read sites (`dotPrototype.ts:371`, `dotTickEvent.ts:87`,
     `buffSync.ts:318`). Because only the *source* of the effect changes, evade rules
     (`evadeBlocksDebuffs`), shield-bypass semantics, and buff UI flow through unchanged.
   - Opening strike (`monsterMechanics.ts:86`): fold `moddedByNode.openingStrikeMult` in
     **multiplicatively** with the existing chain (`tracksDungeon` injection and
     `def.openingStrike` both still apply).
   - Cadence (`monsterMechanics.ts:60-65`): when `moddedByNode.cadence` exists and the def
     has NO `cadenceFinisher`, run the overlay pattern with its own private counter key
     (do not share `CADENCE_COUNTER_KEY`). When the def HAS one, A1's overlay resolution
     already returned an amplification of the def pattern — implement as: overlay multiplier
     applies on the same beats as the def cadence (multiply into the same branch), never as
     a second independent counter. Keep the "call EXACTLY ONCE per confirmed attack"
     contract documented at the top of that file.

4. **Density:**
   - `World.getMobDensity` (`World.ts:530`): multiply the resolved target by
     `densitySpawnFactor(NODE_MODIFIERS[nodeId]?.density)` and round. Keep the
     `NodeBiomeInfo.mobDensity` override semantics (throne stays 0).
   - `spawnMonster` (`spawning/index.ts:326-335`): replace the uniform pool pick with a
     weighted pick using `elitePoolWeight(density, def.elite === true)`. Deterministic
     weighting shape, `Math.random()` selection is fine (spawn composition is not a combat
     outcome; existing spawning already uses RNG).

5. **Tests** (`server/test/nodeModifiers.wiring.test.ts`, pattern per CLAUDE.md — attach,
   tick, assert invariants, no balance numbers):
   - pick (or temporarily inject into `NODE_MODIFIERS` via a test-room-adjacent approach —
     simplest is to select real node ids per family from the authored map) an alacrity node:
     spawned non-boss monster has `attackCooldown` < def value and `attack` < def value;
     a brutality node inverts both; boss spawn in a modified dungeon node keeps def stats
     and has no `moddedByNode`.
   - blight node, monster without `dotEffect`: `moddedByNode.dot` present;
     `effectiveMonsterDot` returns it; with an authored-dot monster, same `debuffId`,
     higher `damagePerStack`.
   - volatility node: overlay cadence fires on the expected counted beat via
     `monsterEmpoweredMultiplier` (call it N times, assert the Nth multiplier > 1, others = 1).
   - density: `getMobDensity` scales; weighted pick smoke (with a pool containing one
     `elite: true` entry, elite-ground weight > swarming weight — assert via the weight
     helper directly, not via RNG sampling).

**Done when:** typecheck + full `pnpm test` green (existing combat/spatial suites must not
regress — monsters in nodes WITHOUT modifiers, e.g. test-room fixtures, must be bit-identical
to before; every test World that spawns via biome pools should be checked for accidental
modifier pickup and, if a fixture node is now modified, the fixture's expectations updated
deliberately, not papered over).

---

## Phase A3 — economy re-key (catalyst grant, sinks, migration)

1. **Grant** (`rewards.ts`): at :192-196 replace the `biomeGroup` key with
   `NODE_MODIFIERS[nodeId]?.pace` (`nodeId` in scope at :181). No modifier (clearing, test
   room, throne) → skip the grant entirely. Boss first-clear bundle at :239-244: key by the
   node's pace family (same lookup; `monster.hasPosition.nodeId` in scope). Keep
   `markSliceDirty` calls. `catalystWeight`/`catalystBundle` per-monster fields are keyless
   and stay untouched.
2. **Density reward neutrality** (§1.6): in `applyKillRewardsToPlayer`, multiply
   `scaledEssence`, the `biomeXp` passed to `applyBiomeXP`, and `catalystWeight` by
   `densityRewardMult(NODE_MODIFIERS[nodeId]?.density)` (round, min 1 where the existing
   code enforces min 1). One helper call, three usages, loud `// PLACEHOLDER — user tunes`
   comment on the constants (in shared, not here).
3. **Label swap**: reimplement `catalystLabel` (`biomeDatabase.ts:38`) to delegate to
   `catalystFamilyLabel` from the new module (keep name/signature/export so all ~10 call
   sites compile unchanged). Optionally re-export under the new name too.
4. **Wallet wipe** (design §2.4 + §7 migration decision):
   - SQL migration `server/src/db/migrations/0002_wipe_catalyst_wallets.sql` — read
     `0000_groovy_synch.sql` for the exact table/column names, then reset the
     `catalysts`/`catalystProgress` keys inside the progression JSON column to `{}` for all
     rows (jsonb `||` overwrite or `jsonb_set`, matching however the column is shaped).
     Verify the migration runner picks it up at boot (it runs migrations in order).
   - Belt-and-braces hydrate sanitization at `playerRepo.ts:200-201`: filter both records to
     keys in `PACE_FAMILIES` on load, so any stray biome-keyed balance can never resurface.
5. **Re-key authored sinks** (design §2.3 — the item's OWN combat expression, never its
   biome): grep `catalystCost` and `reconstructCatalystCost` across `shared/src` and re-key
   every entry from biome-group keys to family keys, **amounts unchanged**. Tagging guide
   (from design-bible §5–6 + design doc §2.3):
   - Offense by pressure produced: rapier/on-hit/flurry → `alacrity`; hammer/empowered/
     seismic → `brutality`; DoT-conversion/frost/plague → `blight`; chaotic-axe lines →
     `volatility`; ambush/execute → `predation`.
   - Defense/recovery by threat answered: evasion & anti-fast-hit → `alacrity`; damage-cap/
     shield/anti-spike → `brutality`; dot-resist/absorb → `blight`; premium %DR & reliable
     generalist walls → `volatility`; last-stand/opening-burst survival → `predation`.
   - Stances/rites/abilities: by the combat behavior they grant (e.g. attack-speed stance →
     `alacrity`). When genuinely ambiguous, pick the closest family and leave a one-line
     `// family-tag rationale:` comment — the user will review tags as part of tuning.
   - Do NOT touch essence costs, `EssenceType`, `ESSENCE_LABELS`, or `BIOME_PRIMARY_ESSENCE`.
6. **Flexible Broadsword payment (OPTIONAL — mechanism only, skip if it balloons):** add
   `catalystCostFlexible?: number` to `Recipe` + `UpgradeStep`; affordability = sum of all
   five family wallets ≥ N; spend = deterministic greedy from the largest balance down;
   display label "N Catalyst (any family)". Wire into `crafting.ts`/`itemUpgrade.ts`/
   `checkUpgrade` and the client `CostDisplay`/afford helpers. No recipe uses it yet — it
   exists so a future Broadsword milestone can (design §2.3). If skipped, leave a TODO in
   the types and note it in the A5 doc update.
7. **Tests** (`server/test/catalystRekey.test.ts`): kill (or call
   `applyKillRewardsToPlayer`-adjacent seam via a constructed World) in a known-family node
   → progress accrues under that family key and mints at
   `CATALYST_PROGRESS_PER_UNIT`; node without modifier → no grant; boss bundle lands under
   the family key; a family-keyed `catalystCost` recipe blocks/spends correctly (reuse the
   existing crafting test pattern if one exists — check `server/test/` for the closest
   fixture). If step 6 was built: flexible affordability + greedy spend test.

**Done when:** typecheck + tests green; grep for `catalystCost` shows zero biome-group keys
remaining; boot against local db applies migration 0002 cleanly (`pnpm dev:server` once,
if the environment allows — otherwise note it for the user to verify).

---

## Phase A4 — client: the map information contract (design §1.4/§3, v1 = map UI only)

No protocol changes; everything reads static shared data + existing atoms.

1. **Map tiles** (`client/src/ui/map/` — grid component + `constants.tsx`): per-node family
   badge (small colored glyph/letter chip using `PACE_FAMILY_COLORS`; make sure it doesn't
   fight the existing dungeon badge) and a distinct marker for density (e.g. dot or double
   border). Legend: add family names+colors to whatever legend/help the map already has, or
   a small fixed legend strip if none exists.
2. **`NodeInfo.tsx`**: new "Modifier" section directly under the sticky header (before the
   dungeon warning): family name + `PACE_FAMILY_SUMMARIES` line + "Grants: <X> Catalyst" +
   density label/summary when present. Data straight from `NODE_MODIFIERS[nodeId]`. Recipe
   catalyst-cost rows already render correctly after A3's label swap.
3. **Current-node HUD chip**: wherever the current node/biome name is surfaced in the HUD
   (check `client/src/hud/` top strip components / `MenuButtons`/status area — locate by
   grepping for the biome-name display), add a compact family chip (+ density tag). Keep it
   one small element — the map panel is the detail view.
4. **`CatalystPanel.tsx`**: render the five families in fixed `PACE_FAMILIES` order with
   `PACE_FAMILY_COLORS` accents (wallet keys are now families; the existing
   hidden-until-first-earned behavior can stay).
5. Monster rows in `NodeInfo` keep showing base def stats in v1 (per §7 visuals decision).
   Optional one-liner: a note in the Monsters section header like "Stats shown are base —
   this node's modifier reshapes them." Do not rebuild per-monster stat math client-side.

**Done when:** typecheck green; `pnpm dev:client` renders map badges, node panel modifier
section, HUD chip, and family-keyed catalyst panel without console errors. (Visual polish
beyond legibility is out of scope — the user will restyle.)

---

## Phase A5 — assignment authoring, invariants, docs

1. **Author the full `NODE_MODIFIERS` map** (~118 nodes = `NODE_BIOMES` minus clearing,
   test room, throne) against the design rules: hard bans respected; all five families on
   non-dungeon nodes in every tier band; each non-Plains biome's native family most frequent
   for that biome overall and present on ≥1 non-dungeon node per band it appears in; Plains
   spread ~evenly across all five; density placements sparingly (≤ ~1 in 4 nodes), including
   at least one Wasteland (`graveyard`) Elite Ground node and NO banned combos; dungeons get
   pace families too (pick deliberately — a Brutality-family dungeon's trash reshapes spikier).
   Foreign (non-native) families are the authored minority per biome (~25–40% of that biome's
   nodes, PLACEHOLDER ratio). The user reviews this table like any balance data — make it
   readable (grouped by ring/band with comments, mirroring `nodeBiomes.ts` layout).
2. **Dev-boot invariant**: wire `validateNodeModifiers()` into the existing dev-boot
   invariant pass (grep server boot/`World` for where marker/network invariants run;
   CLAUDE.md: "Dev boot runs marker/network invariants") — throw on violations in dev,
   same severity as the existing checks.
3. **Docs** (per CLAUDE.md docs lifecycle):
   - `docs/aspects-catalysts-current-state.md`: update the catalyst section — keyed by pace
     family, granted by node modifier, sinks re-keyed, wallets wiped (one dated paragraph;
     don't rewrite the file).
   - `docs/system-rework-status.md`: add a dated log entry for Stage A and flip the
     "Map traversal" row note to reference `docs/map-variety-plan.md` (design locked;
     Stage B pending).
   - `docs/map-variety-plan.md` §6: point the "Implementation plan" bullet at this file
     (Stage A shipped / Stage B pending, once true).
4. Full `pnpm typecheck` + `pnpm test` green; run `pnpm play` if the environment allows for
   a final smoke.

---

## Landmines / notes for the executor

- **Determinism invariant**: no new RNG in combat outcomes. Volatility is counter-based;
  the only RNG added is spawn-pool *composition* weighting, which is pre-combat.
- **Budget separation**: modifiers touch monster offense shape only — never player stats,
  never monster HP (leave HP alone in Stage A; the design's "threat budget" is carried by
  attack/cadence/DoT/opener reshaping).
- **Do not** rename essence anything, touch `BIOME_ESSENCE_TIER_MULT`, hand-edit packed
  atlases under `client/public/assets`, or add networked per-tick booleans (CLAUDE.md).
- **Freeze/thaw**: monsters are ephemeral and re-created through `createMonster` on thaw —
  modifiers reapply naturally; persist nothing about them.
- **Party rewards**: the same-node member loop re-invokes `applyKillRewardsToPlayer`
  per member (rewards.ts:227 area) — the family re-key and density mult ride it for free;
  verify in the A3 test with two players if cheap.
- **`_`-prefixed test files** are skipped by the runner — name real tests normally.
- **Bench parity**: combat listeners register only via `initCombatSystems()`
  (`server/src/systems/combatBootstrap.ts`). A2 touches read sites inside existing systems,
  not new listeners — if you DO need a listener, register it there so benches stay identical.
- If `tools/` (balance TUI, dps-report) hardcodes catalyst/biome assumptions, fix compile
  errors minimally; deep tool support for families is not in scope.

## Stage B — regions

The former outline is superseded by the dedicated executable plan in
`docs/archive/map-variety-regions-implementation-plan.md`. Stage B now uses one global sparse stitched
grid, exhaustive allowed biome × pace coverage plus native duplicates, curated density
coverage, multiple organic region frontiers, Clearing as T1's respawn anchor, true sanctuaries
at T2–T4, and dynamic pan/zoom player and ops maps. Do not implement Stage B from this Stage A
record.

## Acceptance checklist (Stage A complete)

- [ ] Every non-excluded node has exactly one pace family (+ optional density), validated at
      dev boot and in tests.
- [ ] Non-boss monsters in modified nodes spawn with reshaped stats/mechanics; bosses are
      untouched; unmodified-node spawns are byte-identical to pre-change behavior.
- [ ] Kills grant family-keyed catalyst progress (density-normalized); bundles family-keyed;
      no biome-group catalyst key exists anywhere in code or data.
- [ ] Player wallets wiped by migration + hydrate-sanitized.
- [ ] All authored sinks cost family catalysts per the item's own combat tag.
- [ ] Map shows family + density + granted catalyst before travel; node panel has the
      modifier section; HUD shows the current node's chip; CatalystPanel lists five families.
- [ ] `pnpm typecheck` and `pnpm test` green; docs updated per A5.3.

---

# Stage A audit — correction list (2026-07-24, post-implementation review)

Stage A was implemented on `feat/map-variety-stage-a` (5 commits, A1–A5) and audited against
this plan + the design doc. **Verdict: faithful and high quality.** Verified clean: reshape
math and validator semantics; boss immunity; determinism (the only new RNG is pre-combat
spawn composition); `moddedByNode` server-only and absent from `NETWORKED_MONSTER_KEYS`;
all three monster-DoT read sites routed through `effectiveMonsterDot` with correct
precedence; opening-strike and cadence composition (including the separate private counter
for synthesized Volatility); rewards/bundle re-key with density normalization; party loop
rides through; hydrate sanitization; drizzle journal + snapshot chain (`prevId` verified);
sink re-keys with per-item rationale comments (abilityRecipes/evolution had no authored
costs — nothing was missed); boot invariant severity matches the existing networked-keys
check; `pnpm typecheck` clean and **28/28 tests pass (re-verified independently, not taken
from the implementer's report)**; the user's uncommitted art/UI work was not touched.

The following corrections remain, ranked. Fix in order; each is small.

> **Resolution (applied 2026-07-24, same branch):**
> - **C1** — DONE via option (b): `CatalystPanel.tsx` no longer imports the untracked
>   `GameIcon`/`economyIcons`; it renders a colored `◇` glyph. Branch is self-contained.
>   Re-integrate `GameIcon` whenever the icon-overhaul work lands.
> - **C2** — DONE. Validator now requires every density node's pool to hold ≥1 elite AND
>   ≥1 non-elite. Authored 7 `elite: true` flags on the genuinely-toughest mob of each
>   affected pool (**boar**, **wolf**, **ironwood-golem/Ironclaw Badger**, **swamp-hydra/
>   Moss-Shell Snapper**, **plague-hydra/Plague-Shell Snapper**, **desert-basilisk**,
>   **magma-brute/Magma Tortoise**) — *player-visible (yellow outline + focus-elites); user
>   should sanity-check these picks*. Two all-elite pools can't host Swarming: cave Swarming
>   moved from T3 `node-1-6` to T1 `node-3-5`; trench Swarming (`node-10-1`) dropped (needs a
>   non-elite trench mob first — recorded as a gap).
> - **C3** — DONE: `runMigrations()` ran against the local Postgres (`gamedb`); migration
>   `0002_wipe_catalyst_wallets` applied cleanly (3 migrations recorded) and all 5 character
>   rows verified `catalysts={}` / `catalystProgress={}`.
> - **C4** — DONE: native-most-frequent check is now strict (must exceed every other family).
> - **C5** — DONE: both doc headers reworded.
> - **C6** — recorded only (no code change), as instructed.
>
> **Round-2 revisions (2026-07-24, after playtest feedback) — supersede parts of the above:**
> - **Elite flags reverted.** The 7 `elite: true` flags were removed — the user marks elites
>   themselves. Instead, **Elite Ground is now only valid on a biome whose pool already has an
>   elite**; the validator enforces this (Swarming carries no elite requirement — it is count-
>   only). Forest `node-5-8` and swamp `node-9-5` lost their Elite Ground (those biomes have no
>   elites); cave `node-1-6` and trench `node-10-1` Swarming were restored (no re-site needed).
> - **Dungeons are now excluded from the modifier system entirely** (static exams — see design
>   §1.1 revision). `isModifierExcludedNode` returns true for `isDungeon`; `NODE_MODIFIERS` has
>   no dungeon entries (93 nodes, down from 118). Consequence: dungeon kills / boss bundles grant
>   no family catalyst.
> - **Map legend removed** — the bottom legend strip overlapped the down-navigation arrow. The
>   per-tile badges, the node-panel Modifier section, and the HUD chip still carry the info; a
>   legend can return with the Stage-B map/region rework.

## C1 — BLOCKER (merge/CI): the branch is not self-contained

The committed `client/src/hud/CatalystPanel.tsx` imports `../ui/GameIcon` and
`../ui/economyIcons` — files that exist **only as untracked working-tree files** (the
user's in-progress icon-overhaul work; verified absent from both `develop` and the feature
branch via `git ls-tree`). Typecheck passes locally only because those files happen to sit
in the working tree; a fresh checkout or CI run of this branch fails.

Resolution is a **user sequencing decision** — ask, then do one of:
- **(a) Land the icon work first** (commit the UI-icon overhaul to `develop`, rebase/merge
  the feature branch after). Keeps the GameIcon integration as written.
- **(b) Make the branch independent**: replace the `GameIcon`/`CATALYST_PLACEHOLDER_ICON`
  usage in `CatalystPanel.tsx` with a plain colored glyph span (the `◇` fallback it already
  declares), dropping both imports. ~10 lines; re-integrate icons whenever that work lands.

## C2 — density pool bias silently no-ops in three biomes

`elitePoolWeight` can only bias composition where the pool has `elite: true` entries.
Plains, forest, and swamp author **zero** elite flags, yet the Stage A map places density
nodes there: forest `node-4-7` (swarming) + `node-5-8` (elite-ground), swamp `node-8-4`
(swarming) + `node-9-5` (elite-ground), plains `node-6-3` (swarming). On those nodes only
the count/reward halves of density work; composition doesn't change — Elite Ground there is
"fewer of the same mobs," not "the biome's toughest walk."

Fix both halves:
1. **Validator**: extend `validateNodeModifiers()` — for every node with a `density`
   modifier, the biome's `monsterPoolByTier[biomeTier]` must contain ≥1 `elite: true` AND
   ≥1 non-elite entry; violation otherwise. (This also future-proofs Stage B authoring.)
2. **Data**: satisfy the new check by authoring `elite: true` on the genuinely toughest
   entries of the affected plains/forest/swamp tier pools (propose the specific monsters
   from the pool stats and list them for the user's approval — the `elite` flag also feeds
   bestiary display and the `focus-elites` rune, so it's player-visible), OR re-site those
   five density placements onto biomes that already have elites. Prefer authoring flags —
   the placements themselves are well-chosen.

## C3 — migration 0002 has never touched a real database

`0002_wipe_catalyst_wallets.sql` is statically correct (table/column names match
`0000_groovy_synch.sql`; single statement; snapshot chain verified) but was never executed
(no Postgres in the implementation environment). Before merge: `pnpm db:up`, then
`pnpm dev:server`, confirm the boot log applies `0002_wipe_catalyst_wallets`, and
spot-check one character row shows `"catalysts":{}` / `"catalystProgress":{}`. If the
local DB was already wiped/reset at some point this is a 2-minute formality.

## C4 — minor: native-most-frequent validator accepts ties

The "single most frequent" check picks the first maximum in `PACE_FAMILIES` order, so a
native family that TIES another passes when it happens to sort earlier. Make it strict:
native count must exceed every other family's count for that biome. Re-run the validator;
adjust `nodeModifierMap.ts` if any biome only passed via the tie laxity.

## C5 — minor: stale doc headers

- `docs/map-variety-plan.md` header still says "**No implementation plan exists yet and
  none is approved**" — false since this plan was written and executed. Reword to point
  here with Stage A status.
- This file's own status header says "READY TO EXECUTE" — flip to
  "Stage A EXECUTED (2026-07-24) on `feat/map-variety-stage-a`; corrections below; Stage B
  unplanned."

## C6 — tuning notes for the user's balance pass (record only — do NOT "fix" in code)

- Volatility on monsters that already have a `cadenceFinisher` lands slightly *under*
  budget: base attack ×(1−M) but the spike only gains ×(1+M) on the def's beats.
- Blight's synthesized DoT reaches its budgeted throughput only at full stacks — short
  fights under-deliver.
- `densityRewardMult` on Elite Ground stacks with elites' already-higher per-kill rewards —
  elite-ground may overpay as authored.
- All magnitudes (`PACE_MAGNITUDE_BY_TIER`, opener/spike factors, density factors/weights)
  are PLACEHOLDER by design; they live in one block in `nodeModifiers.ts`.

## Also not yet verified (cheap, alongside C3)

- `pnpm build` (full production build) hasn't been run by the auditor — typecheck was
  clean, but run the build once before merge.
- In-game eyeball of the map badges/legend/NodeInfo section/HUD chip (cosmetic collisions
  with the dungeon badge are possible; the user will restyle regardless).
