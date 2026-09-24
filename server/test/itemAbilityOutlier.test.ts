import assert from 'node:assert/strict';
import {ITEM_DATABASE,itemMechanicEffectsAt,ABILITY_DATABASE,resolveAbilityEffect,modifiedAbilityCooldownMs,runicPointLoadoutCost} from '@mmo-idle/shared';
import {T4_CELLS,installOutlierCandidate} from '../bench/balance/itemAbilityOutlierSpec';
import {slowResistedMult} from '../src/systems/world/mobility/mobilityBoots';
import type {PlayerEntity} from '../src/ecs/entity';
const baseline=JSON.stringify([...ITEM_DATABASE]);
for(const c of T4_CELLS){
 const change=installOutlierCandidate(c);
 if(c.candidate){
  const id=c.candidate==='A'?'core-arcanist':c.build.gearItemIds.mobility!;
  const item=ITEM_DATABASE.get(id)!,plus=c.upgradeLevel!,p=itemMechanicEffectsAt(item,c.candidate==='A'?0:plus);
  if(c.candidate==='D')assert.equal(p['mobility.kite-speed-pct'],.3);
  if(c.candidate==='S'){
   const expected=(item.tier===2?.4:.5)+.02*plus;assert(Math.abs(p['mobility.slow-resistance']-expected)<1e-10);
   const player={usesSkills:{passives:p}} as PlayerEntity;
   assert.equal(slowResistedMult(player,0),0);assert(Math.abs(slowResistedMult(player,.5)-(1-.5*(1-expected)))<1e-10);
  }
  if(c.candidate==='A'){
   const a=ABILITY_DATABASE.get('power-strike')!,guard=ABILITY_DATABASE.get('endure')!;
   assert.equal((resolveAbilityEffect(a,{playerTier:4,techniquePowerPct:.3}) as any).damageMult,4.5*1.3);
   assert.equal(modifiedAbilityCooldownMs(a,4,p),8000);
   assert.deepEqual(resolveAbilityEffect(guard,{playerTier:4,techniquePowerPct:.3}),resolveAbilityEffect(guard,{playerTier:4}));
  }
 }
 change?.restore();assert.equal(JSON.stringify([...ITEM_DATABASE]),baseline,'candidate leaked into subsequent controls');
 const cost=runicPointLoadoutCost({rules:c.runeRules!,abilities:c.abilities!,stances:c.stance?[c.stance]:[],rites:c.rites??[]});assert(cost<=c.progressionSnapshot!.rp);
}
console.log('itemAbilityOutlier.test.ts: ok (definitions, resolution, isolation; no combat)');
