/** No ticks: qualify the actual paid V1s checkpoint and dungeon route. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { emptyEquipment, emptyAttunedAbilities, emptyEquippedStances, DUNGEON_DEFS, registerDevItems, ITEM_DATABASE, type T1CharacterSnapshot } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { restoreProgressionCheckpoint, checkpointGameplayState } from '../src/admin/progressionCheckpoint';
import { validateBuild, buildRP } from '../../bot/src/loadout/loadout';
import { CAMPAIGN_T3_V1T as route } from '../../bot/src/routes/campaignT3V1t';
import { dungeonNodeFor } from '../../bot/src/state/observation';
const [input, output] = process.argv.slice(2);
assert(input && output && !existsSync(output), 'Exact checkpoint and NEW output file required');
const bytes = readFileSync(input), sha256 = createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256, 'db973d37bd7371212665e03d06adbb7e977fb9fa964acbd347ee49aa0944ec79');
const source = (JSON.parse(bytes.toString()) as T1CharacterSnapshot).progressionCheckpoint!;
// Match the development server's item registry; these items are not granted.
registerDevItems(ITEM_DATABASE);
const blank: PersistedPlayerSlices = {
  isPlayer: { id: 'v1t', name: 'v1t' }, hasPosition: { current: { x: 300, y: 300 }, nodeId: 'node-t3-sanctuary', speed: 120 }, hasHealth: { hp: 100, maxHp: 100, recovery: 10 },
  tracksProgression: { level: 0, skillPoints: 0, playerTier: 0, currentSkillTier: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 }, catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {}, bossesCleared: [], clearedNodes: [], visitedNodes: [], runesOwned: [], runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [], attunedAbilities: emptyAttunedAbilities(), knownStances: [], equippedStances: emptyEquippedStances(), activeStance: null, knownRites: [], equippedRites: [] },
  holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
  usesSkills: { unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: null },
};
const world = new World(), player = world.attachPlayerEntity(blank, 'v1t');
const restored = restoreProgressionCheckpoint(world, player, { capture: source, boundaryId: route.progressionEntry!.boundaryId, revisionPolicy: 'explicit-current-revision' });
assert.deepEqual(checkpointGameplayState(restored.persistent), checkpointGameplayState(source.persistent));
assert.equal(restored.definitionsHash, source.definitionsHash, 'Unexpected gameplay definition drift');
assert.equal(restored.view.selectedRange, 'energy-range-far');
assert.equal(restored.view.equipment.mobility, 'desert-boots-t2');
assert.equal(restored.view.itemUpgrades['desert-boots-t2'], 5);
assert(!restored.view.bossesCleared.includes('volcanic:3'));
const builds = route.steps.filter(s => s.type === 'configureBuild').map(s => s.build);
for (const build of builds) assert.deepEqual(validateBuild(build, restored.view), []);
const attempts = route.steps.filter(s => s.type === 'attemptBoss');
assert.equal(attempts.length, 1); assert.equal(attempts[0].maxAttempts, 1); assert(route.stopOnFirstDeath);
assert(!route.steps.some(s => ['craft', 'upgrade', 'learnAbility', 'unlockSkill'].includes(s.type)));
const node = dungeonNodeFor('volcanic', 3)!; assert(DUNGEON_DEFS.has(node));
writeFileSync(output, JSON.stringify({ mode: 'setup-only', ticks: 0, sha256, restored, dungeon: DUNGEON_DEFS.get(node), buildRP: builds.map(buildRP) }, null, 2));
console.log(`V1t preflight passed: ${node}; paid input restored, builds legal, one attempt, zero ticks`);
