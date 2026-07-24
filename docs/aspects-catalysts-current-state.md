# Aspects + Catalysts — Current State (pre-implementation)

**Steps:** 1 (Aspect Essence economy) + 2 (Biome Catalysts), implemented together.
**Companion:** `docs/archive/aspects-catalysts-plan.md`. **Index:** `docs/system-rework-roadmap.md`.
**Audited:** 2026-06-23 (code read, not assumed).

---

## Essences (Step 1)

- `EssenceType = 'red' | 'blue' | 'green' | 'yellow' | 'purple'` — `shared/src/items.ts:3`.
  `ESSENCE_TYPES`, `ESSENCE_COLORS` alongside. Flat across all tiers (no per-tier essence).
- `BIOME_PRIMARY_ESSENCE` (`items.ts:15`) maps each biome group → one essence.
- Wallet: `TracksProgression.essences: Record<EssenceType, number>`
  (`shared/src/components/core/networkedSlices.ts:213`).
- Monster drop shape: `rewards: { essence: number; essenceType: EssenceType; level; biomeXp? }`
  (`shared/src/data/monsters/types.ts:242`) — single essence per mob, flat amount.
- Essence granted in `rewardPlayer` / `applyKillRewardsToPlayer`
  (`server/src/systems/player/progression/rewards.ts:30,152`). Tier multiplier
  `GAME_CONFIG.BIOME_ESSENCE_TIER_MULT` is applied (currently *dampens* late game).
- Spent in `craftRecipe` (`server/src/systems/player/economy/crafting.ts:50-63`) and
  `upgradeItem` / `checkUpgrade` (`server/src/systems/player/economy/itemUpgrade.ts:60`,
  `shared/src/systems/itemUpgrades.ts:97-121`).
- **Display:** the player-facing name is derived directly from the key
  (`type.charAt(0).toUpperCase()...`) in `client/src/hud/EssencePanel.tsx:53`. **No label map exists.**
  `EssenceType` / `ESSENCE_COLORS` referenced in ~41 files (client HUD, crafting, runes,
  bestiary, admin, server reason strings).
- Persistence: stored as a JSON object `{red,blue,green,yellow,purple}` per player row;
  default seeded in `server/src/db/playerRepo.ts:226`, snapshotted at `:155`.

## Monster data files (Step 1 authoring + Step 2 weights)

18 files under `shared/src/data/monsters/` (`plains/forest/swamp/mountain/cave` +
`jungle/desert/volcano/tundra/graveyard/trench` + `advancedBiomesB` + `bossesT1..T4` +
`tutorial`), assembled via `index.ts` into `MONSTER_DATABASE`.

> **Update 2026-07-24 (Map Variety Stage A):** catalysts are now keyed by **combat
> family** (`alacrity`/`brutality`/`blight`/`volatility`/`predation`), not by biome
> group. The five families, per-node assignment table, and reshaping math live in
> `shared/src/world/nodeModifiers.ts` + `nodeModifierMap.ts`. Every kill grants the
> **node's pace family** catalyst (`NODE_MODIFIERS[nodeId].pace`) via
> `grantCatalystProgress` in `rewards.ts`; density modifiers normalize per-kill reward
> throughput inversely (`densityRewardMult`). `catalystLabel` delegates to
> `catalystFamilyLabel`. Authored sinks (forest recipes, stances, rites) were re-tagged
> by each item's own combat expression. **Player wallets were wiped** (migration
> `0002_wipe_catalyst_wallets.sql`) and are hydrate-sanitized to family keys on load
> (`playerRepo.ts`). All magnitudes/tags are PLACEHOLDER (user tunes). Design authority:
> `docs/map-variety-plan.md`; plan: `docs/map-variety-implementation-plan.md`.

## Catalysts (Step 2) — **nothing exists**

- No catalyst currency, wallet, progress counter, monster weight, or recipe-cost axis.
- `TracksProgression` is networked **as a whole slice** (`NETWORKED_PLAYER_KEYS` in
  `shared/src/protocol/networkedEntity.ts:55`) — new fields on it sync automatically.
- Reward granting (incl. party same-node sharing) flows through `grantMonsterRewards` →
  `applyKillRewardsToPlayer` (`rewards.ts:227,152`); the party loop already re-invokes
  `applyKillRewardsToPlayer` per same-node member.
- Recipe/upgrade costs are `Partial<Record<EssenceType, number>>` only
  (`Recipe.cost` in `shared/src/data/recipes/types.ts:39`; `UpgradeStep.cost` in `items.ts:73`).
- First-clear boss state persists via `TracksProgression.bossesCleared`
  (appended in `rewards.ts:204-209`) — the natural hook for one-time boss catalyst bundles.

## Resolved choices folded in (2026-06-23 Q&A + this session)

- **Rename = display-name only.** Keep internal keys; add an `ESSENCE_LABELS` map.
  Mapping: Might←yellow, Wild←green, Rot←purple, Stone←blue, Deep←red.
- **Catalysts: one per biome group**, uncapped, wallet keyed by biome group string.
- **Per-mob essence variety, catalyst weights, and catalyst recipe costs are all
  authored now** with sensible placeholders (user retunes — balance is user-owned).
</content>
</invoke>
