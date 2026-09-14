/** No ticks. Actual input restore, then explicitly hypothetical gate/budget qualification. Never writes a checkpoint. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { emptyEquipment, emptyAttunedAbilities, emptyEquippedStances, DUNGEON_DEFS, registerDevItems, ITEM_DATABASE, type T1CharacterSnapshot, composePlayerView, biomeLevelCap, globalMastery, runeBudgetForGlobalMastery } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { restoreProgressionCheckpoint, checkpointGameplayState } from '../src/admin/progressionCheckpoint';
import { validateBuild, buildRP } from '../../bot/src/loadout/loadout';
import { CAMPAIGN_T3_V1U_PREP as route, CAMPAIGN_T3_V1U_BOSS, V1U_BOSS_BUILD, V1U_AFFLICTION_BUILD, V1U_PURCHASES, V1U_FINAL_UPGRADES, V1U_EARLY_MASTERY, V1U_LATE_MASTERY } from '../../bot/src/routes/campaignT3V1u';
import { V1P_TUNDRA_BUILD } from '../../bot/src/routes/campaignT3V1p';
import { NIGHT2_TRAVEL_BUILD } from '../../bot/src/routes/campaignNight2Bridge';
import { craftAbilityRecipe } from '../src/systems/player/economy/abilityCrafting';
import { craftRecipe } from '../src/systems/player/economy/crafting';
import { evolveItem } from '../src/systems/player/economy/itemEvolution';
import { upgradeItem } from '../src/systems/player/economy/itemUpgrade';
import { equipItem, unequipItem } from '../src/systems/player/economy/inventory';
import { checkRecipeUnlocks } from '../src/systems/player/progression/rewards';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import type { RouteStep } from '../../bot/src/route/types';
import { dungeonNodeFor } from '../../bot/src/state/observation';
const [input, output] = process.argv.slice(2);
assert(input && output && !existsSync(output), 'Exact checkpoint and NEW output file required');
const bytes = readFileSync(input), sha256 = createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256, 'db973d37bd7371212665e03d06adbb7e977fb9fa964acbd347ee49aa0944ec79');
const source = (JSON.parse(bytes.toString()) as T1CharacterSnapshot).progressionCheckpoint!;
// Match the development server's item registry; these items are not granted.
registerDevItems(ITEM_DATABASE);
const blank: PersistedPlayerSlices = {
  isPlayer: { id: 'v1u', name: 'v1u' }, hasPosition: { current: { x: 300, y: 300 }, nodeId: 'node-t3-sanctuary', speed: 120 }, hasHealth: { hp: 100, maxHp: 100, recovery: 10 },
  tracksProgression: { level: 0, skillPoints: 0, playerTier: 0, currentSkillTier: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 }, catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {}, bossesCleared: [], clearedNodes: [], visitedNodes: [], runesOwned: [], runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [], attunedAbilities: emptyAttunedAbilities(), knownStances: [], equippedStances: emptyEquippedStances(), activeStance: null, knownRites: [], equippedRites: [] },
  holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
  usesSkills: { unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: null },
};
const world = new World(), player = world.attachPlayerEntity(blank, 'v1u');
const restored = restoreProgressionCheckpoint(world, player, { capture: source, boundaryId: route.progressionEntry!.boundaryId, revisionPolicy: 'explicit-current-revision' });
assert.deepEqual(checkpointGameplayState(restored.persistent), checkpointGameplayState(source.persistent));
assert.equal(restored.definitionsHash, source.definitionsHash, 'Unexpected gameplay definition drift');
assert.equal(restored.view.selectedRange, 'energy-range-far');
assert.equal(restored.view.equipment.mobility, 'desert-boots-t2');
assert.equal(restored.view.itemUpgrades['desert-boots-t2'], 5);
assert(!restored.view.bossesCleared.includes('volcanic:3'));
assert.deepEqual(validateBuild(V1P_TUNDRA_BUILD, restored.view), []);
assert.deepEqual(validateBuild(NIGHT2_TRAVEL_BUILD, restored.view), []);
assert(restored.view.knownStances.includes('offensive-stance'));
// Everything below models future earned gates for arithmetic only. There are no
// combat ticks, awarded kills or exportable saves. The real route must farm them.
const model = world.getPlayerEntity('v1u')!;
const receipts: unknown[] = [];
function modelGates(gates: { group: string; level: number }[]) {
  for (const { group, level } of gates) {
    assert(level <= biomeLevelCap(3, group), `Unreachable ${group} gate`);
    model.tracksProgression.biomeLevel[group] = level;
  }
  checkRecipeUnlocks(model);
  recalculatePlayerEntityStats(world, model);
}
function purchases(steps: RouteStep[]) {
  for (const step of steps) {
    const before = structuredClone({ essences: model.tracksProgression.essences, catalysts: model.tracksProgression.catalysts });
    switch (step.type) {
      case 'learnAbility': assert(craftAbilityRecipe(world, model, step.recipeId).success, step.recipeId); break;
      case 'craft': for (const id of step.recipeIds) assert(craftRecipe(world, model, id).success, id); break;
      case 'evolveItem': { const r = evolveItem(world, model, step.recipeId, step.mode); assert(r.success, `${step.recipeId}: ${r.reason}`); break; }
      case 'upgrade': while ((model.holdsInventory.itemUpgrades[step.definitionId] ?? 0) < step.toPlus) {
        const r = upgradeItem(world, model, step.definitionId); assert(r.success, `${step.definitionId}: ${r.reason}`);
      } break;
      case 'unequip': assert(unequipItem(world, model, step.slot)); break;
      case 'equip': for (const id of step.definitionIds) if (!Object.values(model.holdsInventory.equipment).includes(id)) assert(equipItem(world, model, id), id); break;
      default: assert.fail(`Unhandled purchase ${step.type}`);
    }
    receipts.push({ step, before, after: structuredClone({ essences: model.tracksProgression.essences, catalysts: model.tracksProgression.catalysts }) });
  }
}
modelGates(V1U_EARLY_MASTERY);
assert.equal(globalMastery(model.tracksProgression.biomeLevel), 90);
model.tracksProgression.essences.blue = 4000; // Authored Mountain farming floor.
purchases(V1U_PURCHASES);
assert.deepEqual(validateBuild(V1P_TUNDRA_BUILD, composePlayerView(model)!), []);
assert.deepEqual(validateBuild(V1U_AFFLICTION_BUILD, composePlayerView(model)!), []);
modelGates(V1U_LATE_MASTERY);
model.tracksProgression.essences.red = 3000; // Authored Cave farming floor.
assert.equal(globalMastery(model.tracksProgression.biomeLevel), 114);
purchases(V1U_FINAL_UPGRADES);
const finalView = composePlayerView(model)!;
for (const build of [V1U_BOSS_BUILD, V1P_TUNDRA_BUILD, NIGHT2_TRAVEL_BUILD]) assert.deepEqual(validateBuild(build, finalView), []);
assert(!route.steps.some(s => s.type === 'attemptBoss'));
assert.equal(CAMPAIGN_T3_V1U_BOSS.steps.filter(s => s.type === 'attemptBoss').length, 1);
assert(!CAMPAIGN_T3_V1U_BOSS.steps.some(s => ['craft', 'upgrade', 'evolveItem', 'learnAbility', 'unlockSkill'].includes(s.type)));
const node = dungeonNodeFor('volcanic', 3)!; assert(DUNGEON_DEFS.has(node));
writeFileSync(output, JSON.stringify({ mode: 'setup-only-with-hypothetical-earned-gates', ticks: 0,
  warning: 'Future mastery and wallet floors were modeled, not earned. This file is NOT a checkpoint or combat evidence.',
  sha256, initialStateHash: restored.stateHash, definitionsHash: restored.definitionsHash,
  initialPersistentFidelity: true, modeledGates: [...V1U_EARLY_MASTERY, ...V1U_LATE_MASTERY],
  modeledWalletFloors: { blue: 4000, red: 3000 }, receipts,
  modeledFinal: { equipment: finalView.equipment, upgrades: finalView.itemUpgrades,
    gm: finalView.globalMastery, rp: buildRP(V1U_BOSS_BUILD), budget: runeBudgetForGlobalMastery(finalView.globalMastery),
    essences: finalView.essences, catalysts: finalView.catalysts }, dungeon: node }, null, 2));
console.log(`V1u setup qualification passed: actual input fidelity; modeled purchases/build legal; boss RP ${buildRP(V1U_BOSS_BUILD).total}; zero combat ticks`);
