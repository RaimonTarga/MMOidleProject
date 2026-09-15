/** Setup-only: actual Mountain return, paid relic effects, independent Volcano finish matrix. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DUNGEON_DEFS, resolveEnergyMax, resolveEnergyRelicProfile, relicRatingsFromPassives, emptyEquipment, emptyAttunedAbilities, emptyEquippedStances, registerDevItems, ITEM_DATABASE, type T1CharacterSnapshot, composePlayerView, worldNodeExits, shortestWorldPath } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { restoreProgressionCheckpoint, checkpointGameplayState } from '../src/admin/progressionCheckpoint';
import { validateBuild, buildRP } from '../../bot/src/loadout/loadout';
import { CAMPAIGN_T4_VOLCANO_FINISH_ROUTES, VOLCANO_FINISH_CASES } from '../../bot/src/routes/campaignT4VolcanoFinish';
import { ROUTES } from '../../bot/src/routes';
const route = CAMPAIGN_T4_VOLCANO_FINISH_ROUTES[0];
import { craftRecipe } from '../src/systems/player/economy/crafting';
import { equipItem } from '../src/systems/player/economy/inventory';
const [input, output] = process.argv.slice(2);
assert(input && output && !existsSync(output), 'Exact checkpoint and NEW output file required');
const bytes = readFileSync(input), sha256 = createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256, '866db03766d0e7cd4ceeeea48506bd9c11c2a9eaf0f72037e49a0cc20c052f98');
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
assert.equal(restored.view.globalMastery, 132);
assert.equal(restored.view.skillPoints,0);
assert(restored.view.unlockedSkills.includes('energy-heavy-t3-a'));
assert.equal(restored.view.equipment.relic,null);
assert(restored.view.knownAbilities.includes('expose-weakness'));
assert(restored.view.bossesCleared.includes('mountain:4'));
assert(!restored.view.bossesCleared.includes('volcanic:4'));
for (const id of ['mountain-vest-t4','mountain-charm-t4']) assert.equal(restored.view.itemUpgrades[id],2);
const model=world.getPlayerEntity(player.isPlayer.id)!;
assert.equal(resolveEnergyMax(model.usesSkills.passives,4),200);
const before=structuredClone({essences:model.tracksProgression.essences,catalysts:model.tracksProgression.catalysts});
assert(craftRecipe(world,model,'relic-colossus-heart').success);
assert(equipItem(world,model,'relic-colossus-heart'));
assert.equal(resolveEnergyMax(model.usesSkills.passives,4),280);
const relicView=structuredClone(composePlayerView(model)!);
const after=structuredClone({essences:model.tracksProgression.essences,catalysts:model.tracksProgression.catalysts});
assert.equal(before.essences.blue-after.essences.blue,3300);
assert.equal((before.catalysts.heavy??0)-(after.catalysts.heavy??0),10);
const gainPerHit = model.usesSkills.passives['energy.per-hit'];
const dischargeMultiplier = model.usesSkills.passives['energy.empowered-mult'];
if (typeof gainPerHit !== 'number' || typeof dischargeMultiplier !== 'number') {
  throw new Error('Missing qualified energy passives');
}
assert.equal(gainPerHit,20);
assert.equal(dischargeMultiplier,6);
const profile=resolveEnergyRelicProfile(gainPerHit,200,dischargeMultiplier,relicRatingsFromPassives(model.usesSkills.passives));
assert.equal(profile.gainPerHit.after,14); assert.equal(profile.dischargeMultiplier.after,8);
assert.equal(CAMPAIGN_T4_VOLCANO_FINISH_ROUTES.length,4);
assert.equal(new Set(CAMPAIGN_T4_VOLCANO_FINISH_ROUTES.map(r=>r.id)).size,4);
const results=[];
for(const [i,r] of CAMPAIGN_T4_VOLCANO_FINISH_ROUTES.entries()) {
  const c=VOLCANO_FINISH_CASES[i];
  assert.equal(ROUTES.get(r.id), r);
  assert.equal(r.progressionEntry?.boundaryId, 'night3-mountain-control-r1-returned');
  const fight = r.steps.find(s=>s.type==='configureBuild' && s.build.abilities?.techniques.includes('frenzy'));
  assert(fight?.type==='configureBuild');
  assert.equal(fight.build.abilities!.techniques.includes('expose-weakness'), c.expose);
  assert.equal(buildRP(fight.build).total, c.expose ? 42 : 35);

  const path = [route.progressionEntry!.nodeId, ...r.steps.filter(s=>s.type==='travel').map(s=>s.to.kind==='node'?s.to.nodeId:'')];
  for(const direction of [path]) for(let j=1;j<direction.length;j++) {
    assert(Object.values(worldNodeExits(direction[j-1])).includes(direction[j]));
    assert.deepEqual(shortestWorldPath(direction[j-1],direction[j]),[direction[j-1],direction[j]]);
  }
  const builds=r.steps.filter(s=>s.type==='configureBuild').map(s=>s.build);
  for(const b of builds) assert.deepEqual(validateBuild(b,c.relic?relicView:restored.view),[]);
  assert.equal(r.stopOnFirstDeath,true);
  assert.equal(r.steps.filter(s=>s.type==='craft').length,c.relic?1:0);
  assert(!r.steps.some(s=>['upgrade','evolveItem','unlockSkill'].includes(s.type)));
  const attempts=r.steps.filter(s=>s.type==='attemptBoss');
  assert.equal(attempts.length,1);
  assert.equal(attempts[0].maxAttempts,1);
  assert(DUNGEON_DEFS.has('node-t4-volcanic-dungeon'));
  results.push({id:r.id,path,relic:c.relic,expose:c.expose,rp:builds.map(buildRP)});
}
writeFileSync(output,JSON.stringify({mode:'setup-only',ticks:0,sha256,initialStateHash:restored.stateHash,
 definitionsHash:restored.definitionsHash,before,after,profile,results,
 warning:'Ordinary relic purchase on disposable restored state; no ticks or exported playable checkpoints.'},null,2));
console.log('Volcano finish: actual input, paid relic, four legal builds and paths passed; zero ticks');
