/** Setup-only: actual V1y return, then hypothetical earned mastery and ordinary +2 purchases. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { NODE_BIOMES, biomeLevelCap, upgradeCeilingFromGlobalMastery, emptyEquipment, emptyAttunedAbilities, emptyEquippedStances, registerDevItems, ITEM_DATABASE, type T1CharacterSnapshot, composePlayerView, worldNodeExits, shortestWorldPath } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { restoreProgressionCheckpoint, checkpointGameplayState } from '../src/admin/progressionCheckpoint';
import { validateBuild, buildRP } from '../../bot/src/loadout/loadout';
import { CAMPAIGN_T4_V1Z as route, V1Z_LEGS, V1Z_UPGRADES } from '../../bot/src/routes/campaignT4V1z';
import { upgradeItem } from '../src/systems/player/economy/itemUpgrade';
import { checkRecipeUnlocks } from '../src/systems/player/progression/rewards';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
const [input, output] = process.argv.slice(2);
assert(input && output && !existsSync(output), 'Exact checkpoint and NEW output file required');
const bytes = readFileSync(input), sha256 = createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256, 'f15a9997537cfabef079ab66f30ac51637ad08fe95a410f89b31f8ee37a2bf83');
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
assert.equal(restored.view.globalMastery, 124);
assert.equal(restored.view.skillPoints, 0);
assert(restored.view.unlockedSkills.includes('energy-heavy-t3-a'));
assert.equal(restored.persistent.tracksProgression.biomeLevel.jungle, 12);
assert.equal(restored.persistent.tracksProgression.biomeLevel.desert, 16);
assert.equal(restored.persistent.tracksProgression.biomeLevel.mountain, 24);
const model = world.getPlayerEntity(player.isPlayer.id)!;
for (const id of ['mountain-vest-t4', 'mountain-charm-t4']) assert.equal(restored.view.itemUpgrades[id], 1);
const builds = route.steps.filter(s => s.type === 'configureBuild').map(s => s.build);
for (const build of builds) assert.deepEqual(validateBuild(build, restored.view), []);
const stages: unknown[] = [];
for (const { group, path } of V1Z_LEGS) {
  for (const direction of [path, [...path].reverse()]) for (let i=1; i<direction.length; i++) {
    assert(Object.values(worldNodeExits(direction[i-1])).includes(direction[i]));
    assert.deepEqual(shortestWorldPath(direction[i-1], direction[i]), [direction[i-1], direction[i]]);
  }
  for (const node of path) {
    const b=NODE_BIOMES[node]; assert(b && b.biomeTier===4 && !b.isDungeon);
    assert(['sanctuary', 'mountain', 'jungle', 'desert'].includes(b.biomeGroup));
  }
  assert.equal(NODE_BIOMES[path.at(-1)!].biomeGroup, group);
  assert.equal(biomeLevelCap(4, group), 18);
  // Model ONLY future mastery for gate arithmetic. Never export a playable save.
  model.tracksProgression.biomeLevel[group]=18;
  checkRecipeUnlocks(model); recalculatePlayerEntityStats(world, model);
  stages.push({ group, gm: composePlayerView(model)!.globalMastery });
}
assert.deepEqual(stages, [{ group:'jungle', gm:130 }, { group:'desert', gm:132 }]);
assert.equal(upgradeCeilingFromGlobalMastery(130,4),1);
assert.equal(upgradeCeilingFromGlobalMastery(132,4),2);
const receipts=[];
for (const step of V1Z_UPGRADES) {
  assert(step.type==='upgrade');
  const before=structuredClone(model.tracksProgression.essences);
  const r=upgradeItem(world,model,step.definitionId); assert(r.success,JSON.stringify(r));
  assert.equal(model.holdsInventory.itemUpgrades[step.definitionId],2);
  receipts.push({ step, before, after:structuredClone(model.tracksProgression.essences) });
}
const finalView=structuredClone(composePlayerView(model)!);
for(const build of builds) assert.deepEqual(validateBuild(build,finalView),[]);
assert(!route.steps.some(s=>['unlockSkill','attemptBoss','evolveItem','craft'].includes(s.type)));
assert.equal(route.steps.filter(s=>s.type==='farm' && s.observeForMs===300000).length,2);
writeFileSync(output,JSON.stringify({mode:'setup-only-hypothetical-earned-mastery',ticks:0,sha256,
  initialStateHash:restored.stateHash,definitionsHash:restored.definitionsHash,initialView:structuredClone(restored.view),
  paths:V1Z_LEGS.map(c=>c.path),buildRP:builds.map(buildRP),stages,receipts,finalView,
  warning:'Jungle18/Desert18 modeled only for gate qualification; no currency grant or playable output.'},null,2));
console.log('V1z actual input, both builds/paths, mastery caps and actual-wallet +2 purchases qualified; zero ticks');
