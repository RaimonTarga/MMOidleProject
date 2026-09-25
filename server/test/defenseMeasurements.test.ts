import assert from 'node:assert/strict';
import { applyStatusEffect } from '@mmo-idle/shared';
import { createBalanceWorld } from '../bench/balance/worldFactory';
import { BREADTH_CELLS } from '../bench/balance/playerBreadthSpec';
import { prepareSurveyBot } from '../bench/balance/ttkSurveySpec';
import { makeCombatContext, emitCombatEvent, setCombatMeasurementObserver, type CombatMeasurement } from '../src/systems/combat/engine/combatPipeline';
import { applyWard } from '../src/systems/defense/barrier/wards';
import { runMonsterAttack } from '../src/systems/combat/engine/combat';

function run(observe:boolean){
 const world=createBalanceWorld();
 const cell=structuredClone(BREADTH_CELLS.find(c=>c.identityId==='breadth-t3-slinger-light'&&c.role==='farm')!);
 const {bot}=prepareSurveyBot(world,cell,{x:400,y:400});
 bot.usesSkills.passives={};bot.evadesHits.dodgeRate=0;bot.tracksProgression.activeStance=null;
 if(bot.hasBarrier)bot.hasBarrier.current=0;
 applyWard(world,bot,30,5000);
 applyStatusEffect(bot.tracksCombat,{id:'ability-guard',sourceId:bot.isPlayer.id,remainingMs:3000,data:{drPct:.5}});
 const monster=world.createMonster(cell.nodeId,'magma-brute',{x:400,y:400})!;
 const rows:CombatMeasurement[]=[];
 if(observe)setCombatMeasurementObserver(world,r=>rows.push(r));
 const ctx=makeCombatContext(monster,'monster',bot,'player');ctx.damage=100;
 emitCombatEvent('onDamageTaken',ctx,world);
 const first=ctx.damage;setCombatMeasurementObserver(world);
 const count=rows.length;emitCombatEvent('onDamageTaken',ctx,world);
 assert.equal(rows.length,count,'observer cleanup prevents further measurements');
 return {first,rows};
}
const a=run(false),b=run(true);
assert.equal(b.first,a.first);
assert.equal(b.first,20,'50 Guard reduction, then 30 ward absorption');
assert.equal(b.rows.filter(r=>r.layer==='initAbilitySystems').reduce((n,r)=>n+r.before-r.after,0),50);
assert.equal(b.rows.filter(r=>r.layer==='registerWardAbsorb').reduce((n,r)=>n+r.before-r.after,0),30);
assert.equal(b.rows.reduce((n,r)=>n+r.before-r.after,0),80,'attribution telescopes to total mitigation');
console.log('defenseMeasurements: ok');
{
 const world=createBalanceWorld();
 const cell=structuredClone(BREADTH_CELLS.find(c=>c.identityId==='breadth-t3-slinger-light'&&c.role==='farm')!);
 const {bot}=prepareSurveyBot(world,cell,{x:400,y:400});
 bot.usesSkills.passives={};bot.evadesHits.dodgeRate=0;bot.tracksProgression.activeStance=null;
 if(bot.hasBarrier)bot.hasBarrier.current=0;
 bot.hasHealth.maxHp=1000;bot.hasHealth.hp=1000;bot.mitigatesDamage.plating=15;bot.mitigatesDamage.damageReduction=.25;
 const monster=world.createMonster(cell.nodeId,'magma-brute',{x:400,y:400})!;monster.dealsDamage.attack=20;
 const rows:CombatMeasurement[]=[];setCombatMeasurementObserver(world,r=>rows.push(r));
 runMonsterAttack(world,monster,bot,1000,4);
 assert.equal(bot.hasHealth.hp,951);
 assert.equal(rows.find(r=>r.layer==='plating')!.before,80,'charged gross, not base attack');
 assert.equal(rows.find(r=>r.layer==='plating')!.after,65);
 assert.equal(rows.find(r=>r.layer==='baseDR')!.after,48.75);
 assert.equal(rows.find(r=>r.layer==='rounding/minimum-hit')!.after,49);
 setCombatMeasurementObserver(world);
}
console.log('defenseMeasurements charged attribution: ok');
