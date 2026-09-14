/** No ticks: qualify the actual V1v Tundra return checkpoint and dungeon route. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { NODE_BIOMES, biomeLevelCap, upgradeCeilingFromGlobalMastery, emptyEquipment, emptyAttunedAbilities, emptyEquippedStances, DUNGEON_DEFS, registerDevItems, ITEM_DATABASE, type T1CharacterSnapshot, composePlayerView, worldNodeExits, shortestWorldPath } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { captureProgressionCheckpoint, restoreProgressionCheckpoint, checkpointGameplayState } from '../src/admin/progressionCheckpoint';
import { validateBuild, buildRP } from '../../bot/src/loadout/loadout';
import { CAMPAIGN_T4_V1Y as route, V1Y_ENTRY_PATH, V1Y_FARM_PATH, V1Y_PURCHASES, V1Y_UPGRADES } from '../../bot/src/routes/campaignT4V1y';
import { unlockSkill } from '../src/systems/player/progression/skills';
import { evolveItem } from '../src/systems/player/economy/itemEvolution';
import { upgradeItem } from '../src/systems/player/economy/itemUpgrade';
import { equipItem, unequipItem } from '../src/systems/player/economy/inventory';
import { checkRecipeUnlocks } from '../src/systems/player/progression/rewards';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import type { RouteStep } from '../../bot/src/route/types';
const [input, output] = process.argv.slice(2);
assert(input && output && !existsSync(output), 'Exact checkpoint and NEW output file required');
const bytes = readFileSync(input), sha256 = createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256, 'd910df5f3950ca5f28c39ded7ce770848bf60b1566edc894de1cab20f2f4409b');
const source = (JSON.parse(bytes.toString()) as T1CharacterSnapshot).progressionCheckpoint!;
// Match the development server's item registry; these items are not granted.
registerDevItems(ITEM_DATABASE);
const blank: PersistedPlayerSlices = {
  isPlayer: { id: 'v1v', name: 'v1v' }, hasPosition: { current: { x: 300, y: 300 }, nodeId: 'node-t3-sanctuary', speed: 120 }, hasHealth: { hp: 100, maxHp: 100, recovery: 10 },
  tracksProgression: { level: 0, skillPoints: 0, playerTier: 0, currentSkillTier: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 }, catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {}, bossesCleared: [], clearedNodes: [], visitedNodes: [], runesOwned: [], runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [], attunedAbilities: emptyAttunedAbilities(), knownStances: [], equippedStances: emptyEquippedStances(), activeStance: null, knownRites: [], equippedRites: [] },
  holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
  usesSkills: { unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: null },
};
const world = new World(), player = world.attachPlayerEntity(blank, 'v1v');
const restored = restoreProgressionCheckpoint(world, player, { capture: source, boundaryId: route.progressionEntry!.boundaryId, revisionPolicy: 'explicit-current-revision' });
assert.deepEqual(checkpointGameplayState(restored.persistent), checkpointGameplayState(source.persistent));
assert.equal(restored.definitionsHash, source.definitionsHash, 'Unexpected gameplay definition drift');
assert.equal(restored.view.selectedRange, 'energy-range-far');
assert.equal(restored.view.equipment.mobility, 'desert-boots-t2');
assert.equal(restored.view.itemUpgrades['desert-boots-t2'], 5);
assert(restored.view.bossesCleared.includes('volcanic:3'));
assert(restored.view.bossesCleared.includes('tundra:3'));
assert.equal(restored.view.playerTier, 4);
assert.equal(restored.view.globalMastery, 120);
assert.equal(restored.view.skillPoints, 1);
assert.equal(restored.persistent.tracksProgression.biomeLevel.mountain, 22);
const model = world.getPlayerEntity(player.isPlayer.id)!;
assert(unlockSkill(world, model, 'energy-heavy-t3-a'));
assert.equal(model.tracksProgression.skillPoints, 0);
assert.equal(model.usesSkills.selectedRange, 'energy-range-far');
const receipts: unknown[] = [];
function purchases(steps: RouteStep[]) {
  for (const step of steps) {
    const before = structuredClone(model.tracksProgression.essences);
    switch(step.type) {
      case 'unequip': assert(unequipItem(world, model, step.slot)); break;
      case 'evolveItem': { const result = evolveItem(world, model, step.recipeId, step.mode); assert(result.success, JSON.stringify(result)); break; }
      case 'equip': for (const id of step.definitionIds) assert(equipItem(world, model, id)); break;
      case 'upgrade': { const result = upgradeItem(world, model, step.definitionId); assert(result.success, JSON.stringify(result)); break; }
      default: assert.fail('Unexpected purchase step');
    }
    receipts.push({ step, before, after: structuredClone(model.tracksProgression.essences) });
  }
}
assert.equal(upgradeCeilingFromGlobalMastery(120, 4), 0);
purchases(V1Y_PURCHASES);
const baseView = structuredClone(composePlayerView(model)!);
const builds = route.steps.filter(s => s.type === 'configureBuild').map(s => s.build);
for (const build of builds) assert.deepEqual(validateBuild(build, baseView), []);
for (const path of [V1Y_ENTRY_PATH, V1Y_FARM_PATH]) {
  for (const direction of [path, [...path].reverse()]) for (let i=1; i<direction.length; i++) {
    assert(Object.values(worldNodeExits(direction[i-1])).includes(direction[i]));
    assert.deepEqual(shortestWorldPath(direction[i-1], direction[i]), [direction[i-1], direction[i]]);
  }
  for (const node of path) {
    const biome = NODE_BIOMES[node]; assert(biome && biome.biomeTier <= 4 && !biome.isDungeon);
    assert(!['volcanic', 'tundra', 'trench', 'graveyard'].includes(biome.biomeGroup));
  }
}
assert.equal(NODE_BIOMES[V1Y_FARM_PATH[1]].biomeGroup, 'mountain');
assert.equal(NODE_BIOMES[V1Y_FARM_PATH[1]].modifier, 'heavy');
assert.equal(biomeLevelCap(4, 'mountain'), 24);
// Future earned mastery modeled only for purchase qualification; no XP/currency
// granted, no combat, and no model checkpoint is exported for gameplay.
model.tracksProgression.biomeLevel.mountain = 24;
checkRecipeUnlocks(model); recalculatePlayerEntityStats(world, model);
assert.equal(composePlayerView(model)!.globalMastery, 122);
assert.equal(upgradeCeilingFromGlobalMastery(122, 4), 1);
purchases(V1Y_UPGRADES);
const finalView = structuredClone(composePlayerView(model)!);
for (const build of builds) assert.deepEqual(validateBuild(build, finalView), []);
for (const id of ['mountain-vest-t4', 'mountain-charm-t4']) assert.equal(finalView.itemUpgrades[id], 1);
assert(!route.steps.some(s => s.type === 'attemptBoss'));
assert.equal(route.steps.filter(s => s.type === 'unlockSkill').length, 1);
writeFileSync(output, JSON.stringify({ mode: 'setup-only-hypothetical-future-mastery', ticks: 0,
  sha256, initialStateHash: restored.stateHash, definitionsHash: restored.definitionsHash,
  initialGM: restored.view.globalMastery, initialMountain: restored.persistent.tracksProgression.biomeLevel.mountain,
  paths: [V1Y_ENTRY_PATH, V1Y_FARM_PATH], buildRP: builds.map(buildRP), receipts,
  baseView, finalView, warning: 'Only Mountain24 modeled, wallet is actual input. Not a playable checkpoint or victory evidence.' }, null, 2));
console.log('V1y actual input, Voidwalker unlock, ordinary purchases, earned +1 gates and bidirectional paths qualified; zero ticks');
