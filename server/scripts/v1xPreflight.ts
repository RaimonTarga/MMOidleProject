/** No ticks: qualify the actual V1v Tundra return checkpoint and dungeon route. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tierAdvancementProgress, sealsHeldAtTier, emptyEquipment, emptyAttunedAbilities, emptyEquippedStances, DUNGEON_DEFS, registerDevItems, ITEM_DATABASE, type T1CharacterSnapshot, composePlayerView, worldNodeExits, shortestWorldPath } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { captureProgressionCheckpoint, restoreProgressionCheckpoint, checkpointGameplayState } from '../src/admin/progressionCheckpoint';
import { validateBuild, buildRP } from '../../bot/src/loadout/loadout';
import { CAMPAIGN_T3_V1X as route, V1X_LEGS } from '../../bot/src/routes/campaignT3V1x';
import { checkSealTierAdvance } from '../src/systems/player/progression/questSystem';
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
assert.equal(sealsHeldAtTier(restored.view.bossesCleared, 3), 2);
assert.equal(tierAdvancementProgress(restored.view.bossesCleared, 3).required, 4);
const builds = route.steps.filter(s => s.type === 'configureBuild').map(s => s.build);
for (const build of builds) assert.deepEqual(validateBuild(build, restored.view), []);
assert(!route.steps.some(s => ['craft', 'upgrade', 'learnAbility', 'unlockSkill'].includes(s.type)));
assert.equal(route.stopOnFirstDeath, true);
const attempts = route.steps.filter(s => s.type === 'attemptBoss');
assert.deepEqual(attempts.map(s => [s.biomeGroup, s.tier, s.maxAttempts]), [['mountain', 3, 1], ['cave', 3, 1]]);
const tierChecks = route.steps.filter(s => s.type === 'assert').map(s => s.condition);
assert(tierChecks.some(c => c.type === 'not' && c.of.type === 'playerTierAtLeast' && c.of.tier === 4));
assert(tierChecks.some(c => c.type === 'playerTierAtLeast' && c.tier === 4));
for (const { group, path } of V1X_LEGS) {
  assert(!restored.view.bossesCleared.includes(`${group}:3`));
  for (const direction of [path, [...path].reverse()]) for (let i = 1; i < direction.length; i++) {
    assert(Object.values(worldNodeExits(direction[i-1])).includes(direction[i]));
    assert.deepEqual(shortestWorldPath(direction[i-1], direction[i]), [direction[i-1], direction[i]]);
  }
  assert(!path.some(n => n.includes('tundra') || n.includes('volcanic')));
  const dungeon = DUNGEON_DEFS.get(path.at(-1)!)!; assert(dungeon);
  results.push({ group, path, dungeon });
}
// Disposable setup-only state: simulate first-clear notifications through the
// authoritative handler. This is NOT a playable checkpoint or victory evidence.
const simulationWorld = new World();
const simulationBlank = simulationWorld.attachPlayerEntity(structuredClone(blank), 'v1x-seal-simulation');
restoreProgressionCheckpoint(simulationWorld, simulationBlank, { capture: source, boundaryId: route.progressionEntry!.boundaryId, revisionPolicy: 'explicit-current-revision' });
const simulation = simulationWorld.getPlayerEntity(simulationBlank.isPlayer.id)!;
assert.equal(simulation.tracksProgression.skillPoints, 0);
assert.equal(checkSealTierAdvance(simulation).advanced, false);
simulation.tracksProgression.bossesCleared.push('mountain:3');
assert.equal(sealsHeldAtTier(simulation.tracksProgression.bossesCleared, 3), 3);
assert.equal(checkSealTierAdvance(simulation).advanced, false);
assert.equal(simulation.tracksProgression.playerTier, 3);
assert.equal(simulation.tracksProgression.skillPoints, 0);
simulation.tracksProgression.bossesCleared.push('cave:3');
assert.equal(sealsHeldAtTier(simulation.tracksProgression.bossesCleared, 3), 4);
assert.equal(checkSealTierAdvance(simulation).advanced, true);
assert.equal(simulation.tracksProgression.playerTier, 4);
assert.equal(simulation.tracksProgression.skillPoints, 1);
assert.equal(checkSealTierAdvance(simulation).advanced, false);
assert.equal(simulation.tracksProgression.skillPoints, 1);
const qualifiedCapture = captureProgressionCheckpoint(simulationWorld, simulation, 'setup-only-not-for-play');
assert.equal(qualifiedCapture.view.playerTier, 4);
assert.equal(qualifiedCapture.view.skillPoints, 1);
assert.equal(qualifiedCapture.persistent.hasPosition.nodeId, 'node-t3-sanctuary');
writeFileSync(output, JSON.stringify({ mode: 'setup-only', ticks: 0, sha256,
  restored, results, buildRP: builds.map(buildRP), simulatedProgression: '2 -> 3 (T3, zero points) -> 4 (T4, one point); repeated check does not advance' }, null, 2));
console.log('V1x: actual input, builds, both return paths and authored 2/3/4-seal transition passed; zero ticks');
