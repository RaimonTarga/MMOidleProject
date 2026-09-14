/** No ticks: qualify the actual V1v Tundra return checkpoint and dungeon route. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { emptyEquipment, emptyAttunedAbilities, emptyEquippedStances, DUNGEON_DEFS, registerDevItems, ITEM_DATABASE, type T1CharacterSnapshot, composePlayerView, worldNodeExits, shortestWorldPath } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { restoreProgressionCheckpoint, checkpointGameplayState } from '../src/admin/progressionCheckpoint';
import { validateBuild, buildRP } from '../../bot/src/loadout/loadout';
import { CAMPAIGN_T3_V1W_ROUTES, V1W_CASES } from '../../bot/src/routes/campaignT3V1w';
const route = CAMPAIGN_T3_V1W_ROUTES[0];
import { craftAbilityRecipe } from '../src/systems/player/economy/abilityCrafting';
import { dungeonNodeFor } from '../../bot/src/state/observation';
const [input, output] = process.argv.slice(2);
assert(input && output && !existsSync(output), 'Exact checkpoint and NEW output file required');
const bytes = readFileSync(input), sha256 = createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256, '6f849c4c5686491156fa929c54862f59a2f90b61269abd505d59fa732f4f35e1');
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
assert.equal(restored.view.playerTier, 3);
assert.equal(restored.view.globalMastery, 114);
const results = [];
for (const [index, route] of CAMPAIGN_T3_V1W_ROUTES.entries()) {
  const { group, path } = V1W_CASES[index];
  assert(!restored.view.bossesCleared.includes(`${group}:3`));
  for (const direction of [path, [...path].reverse()]) for (let i = 1; i < direction.length; i++) {
    assert(Object.values(worldNodeExits(direction[i-1])).includes(direction[i]));
    assert.deepEqual(shortestWorldPath(direction[i-1], direction[i]), [direction[i-1], direction[i]]);
  }
  assert(!path.some(n => n.includes('tundra') || n.includes('volcanic')));
  const builds = route.steps.filter(s => s.type === 'configureBuild').map(s => s.build);
  for (const build of builds) assert.deepEqual(validateBuild(build, restored.view), []);
  assert(!route.steps.some(s => ['craft', 'upgrade', 'learnAbility', 'unlockSkill'].includes(s.type)));
  const attempts = route.steps.filter(s => s.type === 'attemptBoss');
  assert.equal(attempts.length, 1); assert.equal(attempts[0].maxAttempts, 1);
  const dungeon = DUNGEON_DEFS.get(path.at(-1)!)!; assert(dungeon);
  results.push({ group, path, rp: builds.map(buildRP), dungeon });
}
writeFileSync(output, JSON.stringify({ mode: 'setup-only', ticks: 0, sha256, restored, results }, null, 2));
console.log('V1w: actual two-seal input and all five builds/paths passed; zero ticks');
