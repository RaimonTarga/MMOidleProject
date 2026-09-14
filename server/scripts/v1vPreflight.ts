/** No ticks: qualify the actual V1u2 Volcano return checkpoint and dungeon route. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { emptyEquipment, emptyAttunedAbilities, emptyEquippedStances, DUNGEON_DEFS, registerDevItems, ITEM_DATABASE, type T1CharacterSnapshot, composePlayerView, worldNodeExits, shortestWorldPath } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { restoreProgressionCheckpoint, checkpointGameplayState } from '../src/admin/progressionCheckpoint';
import { validateBuild, buildRP } from '../../bot/src/loadout/loadout';
import { CAMPAIGN_T3_V1V as route, V1V_PATH } from '../../bot/src/routes/campaignT3V1v';
import { craftAbilityRecipe } from '../src/systems/player/economy/abilityCrafting';
import { dungeonNodeFor } from '../../bot/src/state/observation';
const [input, output] = process.argv.slice(2);
assert(input && output && !existsSync(output), 'Exact checkpoint and NEW output file required');
const bytes = readFileSync(input), sha256 = createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256, '49afc1c9815457e7aac5ab10580c7e917d4359ca0e365f36ec9e7b9385f9a18a');
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
assert(!restored.view.bossesCleared.includes('tundra:3'));
assert.equal(restored.view.globalMastery, 114);
const entity = world.getPlayerEntity('v1v')!;
const beforeBlue = entity.tracksProgression.essences.blue;
assert(craftAbilityRecipe(world, entity, 'ability-recipe-break-free').success);
assert.equal(entity.tracksProgression.essences.blue, beforeBlue - 190);
const view = composePlayerView(entity)!;
for (const path of [V1V_PATH, [...V1V_PATH].reverse()]) for (let i=1; i<path.length; i++) {
  assert(Object.values(worldNodeExits(path[i-1])).includes(path[i]));
  assert.deepEqual(shortestWorldPath(path[i-1],path[i]),[path[i-1],path[i]]);
}
assert(!V1V_PATH.slice(0,-1).some(n=>n.includes('tundra')||n.includes('volcanic')));
const builds = route.steps.filter(s => s.type === 'configureBuild').map(s => s.build);
for (const build of builds) assert.deepEqual(validateBuild(build, view), []);
const attempts = route.steps.filter(s => s.type === 'attemptBoss');
assert.equal(attempts.length, 1); assert.equal(attempts[0].maxAttempts, 1); assert(route.stopOnFirstDeath);
assert(!route.steps.some(s => ['craft', 'upgrade', 'unlockSkill'].includes(s.type)));
const node = dungeonNodeFor('tundra', 3)!; assert(DUNGEON_DEFS.has(node));
writeFileSync(output, JSON.stringify({ mode: 'setup-only', ticks: 0, sha256, restored, dungeon: DUNGEON_DEFS.get(node), buildRP: builds.map(buildRP), paths: V1V_PATH, purchase: { ability: "break-free", blueSpent: 190, beforeBlue, afterBlue: view.essences.blue } }, null, 2));
console.log(`V1v preflight passed: ${node}; paid input restored, builds legal, one attempt, zero ticks`);
