/** Setup only: actual named artifact, normal purchases, no ticks or experiment launch. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { emptyEquipment, emptyAttunedAbilities, emptyEquippedStances, composePlayerView, type T1CharacterSnapshot } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { restoreProgressionCheckpoint, checkpointGameplayState } from '../src/admin/progressionCheckpoint';
import { craftRuneRecipe } from '../src/systems/player/economy/runeCrafting';
import { craftAbilityRecipe } from '../src/systems/player/economy/abilityCrafting';
import { craftRecipe } from '../src/systems/player/economy/crafting';
import { upgradeItem } from '../src/systems/player/economy/itemUpgrade';
import { equipItem } from '../src/systems/player/economy/inventory';
import { validateBuild, buildRP } from '../../bot/src/loadout/loadout';
import { V1R_BUILDS, CAMPAIGN_T3_V1R_ROUTES } from '../../bot/src/routes/campaignT3V1r';
import { NIGHT2_TRAVEL_BUILD } from '../../bot/src/routes/campaignNight2Bridge';
const [input, output] = process.argv.slice(2);
assert(input && output && !existsSync(output), 'Supply exact checkpoint and a NEW output file');
const bytes = readFileSync(input), sha256 = createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256, '015a40785122af6b2a684827e344f0d2465d1b4462d6866801fbc4d9dad5cf55');
const source = (JSON.parse(bytes.toString()) as T1CharacterSnapshot).progressionCheckpoint!;
const results = [];
for (const [arm, build] of Object.entries(V1R_BUILDS)) {
  const world = new World();
  const id = `v1r-${arm}`;
  const blank: PersistedPlayerSlices = {
    isPlayer: { id, name: id }, hasPosition: { current: { x: 300, y: 300 }, nodeId: 'node-t3-sanctuary', speed: 120 }, hasHealth: { hp: 100, maxHp: 100, recovery: 10 },
    tracksProgression: { level: 0, skillPoints: 0, playerTier: 0, currentSkillTier: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 }, catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {}, bossesCleared: [], clearedNodes: [], visitedNodes: [], runesOwned: [], runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [], attunedAbilities: emptyAttunedAbilities(), knownStances: [], equippedStances: emptyEquippedStances(), activeStance: null, knownRites: [], equippedRites: [] },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: { unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: null },
  };
  const initial = world.attachPlayerEntity(blank, id);
  const restored = restoreProgressionCheckpoint(world, initial, { capture: source, boundaryId: source.boundaryId, revisionPolicy: 'explicit-current-revision' });
  assert.deepEqual(checkpointGameplayState(restored.persistent), checkpointGameplayState(source.persistent));
  const player = world.getPlayerEntity(id)!;
  if (arm === 'focus') assert(craftRuneRecipe(world, player, 'rune-recipe-focus-lowest-hp').success);
  if (arm === 'pursuit') {
    assert(craftAbilityRecipe(world, player, 'ability-recipe-hamstring').success);
    assert(craftRecipe(world, player, 'desert-boots-t2').success);
    for (let plus = 1; plus <= 5; plus++) assert(upgradeItem(world, player, 'desert-boots-t2').success, `Boots +${plus}`);
    assert(equipItem(world, player, 'desert-boots-t2'));
  }
  const view = composePlayerView(player)!;
  assert.deepEqual(validateBuild(build, view), []);
  assert.deepEqual(validateBuild(NIGHT2_TRAVEL_BUILD, view), []);
  const route = CAMPAIGN_T3_V1R_ROUTES.find(r => r.id === `spirit-volcano-${arm}-t3-v1r`)!;
  assert.equal(route.progressionEntry?.boundaryId, source.boundaryId);
  assert(!route.steps.some(s => ['unlockSkill', 'attemptBoss', 'chooseClass'].includes(s.type)));
  const farm = route.steps.find(s => s.type === 'farm' && s.observeForMs === 60000);
  assert(farm && farm.type === 'farm' && farm.until.type === 'elapsedMs' && farm.until.ms === 0, 'Measurement must not wait for full recovery in Volcano');
  results.push({ arm, ticks: 0, combatRP: buildRP(build), travelRP: buildRP(NIGHT2_TRAVEL_BUILD),
    startingStateHash: restored.stateHash, build, essences: view.essences, catalysts: view.catalysts, equipment: view.equipment, upgrades: view.itemUpgrades });
}
writeFileSync(output, JSON.stringify({ mode: 'setup-only', sha256, sourceRevision: source.sourceRevision, cases: results }, null, 2));
console.log(JSON.stringify(results, null, 2));
