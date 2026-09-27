# Aspects and Catalysts — Current State

**Audited:** 2026-09-27
**Source authority:** shared item/progression data and the authoritative reward
and crafting paths. The historical implementation plan is
[archived](archive/aspects-catalysts-plan.md).

This page replaces the former pre-implementation snapshot. Essence labels,
catalyst wallets, progress accumulation, family-keyed costs, client views, and
persistence are implemented. Numeric reward weights and costs remain balance
inputs, not settled design promises.

## Essence / Aspect economy

Essence keeps color keys in persistence, protocol, and recipe data:

- red, blue, green, yellow, and purple are the five EssenceType values;
- the player-facing labels are Deep, Stone, Wild, Might, and Rot;
- ESSENCE_LABELS and essenceLabel in shared/src/items.ts are the display
  authority; UI and player-facing messages should not capitalize raw keys;
- BIOME_PRIMARY_ESSENCE supplies the default essence identity for authored
  biome recipes;
- the wallet lives in TracksProgression.essences and is included in PlayerView;
- monster definitions author essence type and amount, with tier and node
  modifier reward multipliers applied by the server kill-reward path;
- crafting, upgrades, evolution, and reconstruction spend essence through their
  server-authoritative economy helpers.

Late-tier Essence multipliers intentionally differ from mastery XP multipliers.
Do not infer progression pacing from the raw item reward field alone; use the
current GAME_CONFIG reward functions and measured reports.

## Catalyst families

Catalysts are keyed by the node's combat modifier, not by biome:

| Family | Player-facing label |
| --- | --- |
| alacrity | Alacrity Catalyst |
| heavy | Heavy Catalyst |
| swarming | Swarming Catalyst |
| dominion | Dominion Catalyst |
| fortified | Fortified Catalyst |

The canonical list is NODE_MODIFIER_FAMILIES in
shared/src/world/nodeModifierTypes.ts. The modifier assignment and native/ban
tables are in shared/src/world/nodeModifierTypes.ts and
shared/src/world/nodeModifierMap.ts. Dungeons, Clearing, the test room, and
other nodes without a normal node modifier do not grant catalyst progress.

## Grant and mint rules

The authoritative path is grantMonsterRewards in
server/src/systems/player/progression/rewards.ts:

1. Resolve the node's modifier and the monster's authored catalystWeight.
   Without an explicit weight, the monster's base Essence reward is used.
2. Apply the node reward premium and the development reward multiplier.
3. Apply the tier-specific catalyst progress multiplier; T1 currently grants
   half progress while the universal threshold remains unchanged.
4. Accumulate the result in catalystProgress[modifier].
5. Mint whole catalysts whenever the accumulator crosses
   GAME_CONFIG.CATALYST_PROGRESS_PER_UNIT (currently 100), carrying the
   remainder into the next kill.

The development reward multiplier scales Essence, biome XP, and catalyst
progress together. A run that uses a value other than 1 is non-canonical for
economy conclusions. Bosses use the node's reward identity for ordinary reward
credit, but dungeon nodes have no modifier and therefore no catalyst grant.

## Spending and presentation

Recipes and upgrade/evolution/reconstruction steps may carry a
catalystCost or reconstructCatalystCost keyed by a modifier family. Server
crafting/evolution/upgrade paths validate and subtract both Essence and
Catalysts. The client uses the same shared affordability and preview rules for
Make, Upgrade, and Evolution/Reconstruction surfaces.

TracksProgression carries both catalysts and catalystProgress. PlayerView,
character summaries, admin progression actions, and the Materials panel expose
the same family-keyed records. The authoritative accumulator may be fractional
at T1; the HUD rounds its displayed progress without changing the stored value.

## Persistence and migration

The family-keyed wallet is sanitized on load by
server/src/db/playerRepo.ts. Migration 0002 wiped the old biome-keyed catalyst
wallet because the keys cannot be safely translated to the new modifier
families. Unknown or retired keys are dropped during hydration. New saves start
with empty catalyst maps and acquire family entries through kills or explicit
admin/test profiles.

The focused re-key and reward-contract coverage is
server/test/catalystRekey.test.ts. It verifies family-keyed progress and minting,
no biome-keyed entries, no catalyst credit from Clearing or dungeons, and
family-keyed reconstruction costs.

## Known balance boundaries

The current modifier magnitudes, reward factors, monster weights, threshold, and
most catalyst costs are authored tuning inputs. The implementation makes the
economy real; it does not claim that the current values are final or that a
synthetic accelerated run proves live pacing.

If adding a new modifier family, update the shared vocabulary, node assignment
validation, wallet hydration, client icon/label maps, recipe costs, and focused
tests together. If changing a key set, preserve or explicitly migrate saved
wallets rather than silently reviving old biome-keyed entries.
