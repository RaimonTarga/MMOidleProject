import assert from 'node:assert/strict';
import { applyStatusEffect, getResource, setResource, setCooldown } from '@mmo-idle/shared';
import { createBalanceWorld } from '../bench/balance/worldFactory';
import { BREADTH_CELLS } from '../bench/balance/playerBreadthSpec';
import { prepareSurveyBot } from '../bench/balance/ttkSurveySpec';
import { makeCombatContext, emitCombatEvent } from '../src/systems/combat/engine/combatPipeline';
import { runMonsterAttack } from '../src/systems/combat/engine/combat';
import { applyWard } from '../src/systems/defense/barrier/wards';
import { runDebtDrain } from '../src/systems/defense/mitigation/hitToDot';
import { updateEngagementDr, getEngagementDrRemaining } from '../src/systems/defense/mitigation/engagementDr';
import { runStationaryDr, getStationaryDrBonus } from '../src/systems/defense/mitigation/stationaryDr';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import { DEBT_POOL_KEY } from '../src/systems/defense/core/pools';
import { applyMonsterAoe } from '../src/systems/combat/damage/aoeDamage';

function fixture(){
 const world=createBalanceWorld();
 const c=structuredClone(BREADTH_CELLS.find(c=>c.identityId==='breadth-t3-slinger-light'&&c.role==='farm')!);
 const {bot}=prepareSurveyBot(world,c,{x:400,y:400});
 bot.usesSkills.passives={};bot.evadesHits.dodgeRate=0;bot.mitigatesDamage.plating=0;bot.mitigatesDamage.damageReduction=0;
 bot.hasHealth.maxHp=1000;bot.hasHealth.hp=1000;bot.tracksProgression.activeStance=null;
 if(bot.hasBarrier)bot.hasBarrier.current=0;
 const monster=world.createMonster(c.nodeId,'magma-brute',{x:400,y:400})!;assert(monster);
 const hit=(damage:number)=>{const ctx=makeCombatContext(monster,'monster',bot,'player');ctx.damage=damage;ctx.metadata.incomingGross=damage;emitCombatEvent('onAttack',ctx,world);emitCombatEvent('onDamageTaken',ctx,world);return ctx;};
 return{world,bot,monster,hit};
}
{
 const{world,bot,monster}=fixture();bot.mitigatesDamage.plating=15;monster.dealsDamage.attack=20;
 runMonsterAttack(world,monster,bot,1000,4);assert.equal(bot.hasHealth.hp,935,'charge scales gross 20 to 80 before subtracting 15 plating');
}
{
 const{world,bot,hit}=fixture();applyWard(world,bot,100,5000);
 applyStatusEffect(bot.tracksCombat,{id:'ability-guard',remainingMs:3000,totalMs:3000,stacks:1,data:{drPct:.5}});
 const ctx=hit(100);assert.equal(ctx.damage,0);assert.equal(bot.holdsWards?.wards[0].amount,50,'Guard protects ward capacity');
}
{
 const{world,bot,hit}=fixture();bot.usesSkills.passives={'defense.hit-to-dot-pct':.3,'defense.dot-resistance':.25};
 const ctx=hit(10);assert.equal(ctx.damage,7);
  assert.equal(getResource(bot.tracksCombat,DEBT_POOL_KEY),2.25);
 bot.usesSkills.passives['defense.dot-resistance']=.9;
 for(let i=0;i<4;i++){setCooldown(bot.tracksCombat,'debtTick',0);runDebtDrain(world,bot);}
 assert.equal(bot.hasHealth.hp,997.75,'fractional debt conserved and resistance snapshotted');
  assert.equal(getResource(bot.tracksCombat,DEBT_POOL_KEY),0);
}
{
 const{world,bot,monster,hit}=fixture();bot.usesSkills.passives={'defense.engagement-dr-pct':.35,'defense.engagement-dr-ms':6000};
 setAttackTarget(world,bot,monster.isMonster.id);
 updateEngagementDr(world,bot,3000);assert.equal(getEngagementDrRemaining(bot),0,'approach does not spend opening protection');
 assert.equal(hit(100).damage,65,'opening protects first hit');
 updateEngagementDr(world,bot,6000);assert.equal(hit(100).damage,100,'fresh attacks do not refresh');
 for(const m of [...world.monsterEntities])world.removeMonsterEntity(m.isMonster.id);
 setAttackTarget(world,bot,null);
 updateEngagementDr(world,bot,6000);assert.equal(getEngagementDrRemaining(bot),0);
 assert.equal(hit(100).damage,65,'quiet window rearms');
}
{
 const{world,bot,monster}=fixture();bot.usesSkills.passives={'defense.stationary-dr-pct':.2,'defense.stationary-dr-ramptime-ms':3000};
 runStationaryDr(world,bot,3000);assert.equal(getStationaryDrBonus(bot),0,'no out-of-combat charging');
 setAttackTarget(world,bot,monster.isMonster.id);runStationaryDr(world,bot,3000);assert.equal(getStationaryDrBonus(bot),.2);
 for(let i=0;i<13;i++){bot.hasPosition.current.x+=1;runStationaryDr(world,bot,100);}
 assert.equal(getStationaryDrBonus(bot),0,'forced displacement sheds protection');
}
{
 const{world,bot,monster}=fixture();applyWard(world,bot,100,5000);applyMonsterAoe(world,monster,bot.hasPosition.current,100,40);
 assert.equal(bot.hasHealth.hp,1000,'secondary splash must respect wards');
 assert.equal(bot.holdsWards?.wards[0].amount,60);
}
{
 const{world,bot,hit}=fixture();bot.usesSkills.passives={'defense.hardening-reset-pct':.25};
 setResource(bot.tracksCombat,'hardeningBonus',8);bot.mitigatesDamage.plating=8;
 applyWard(world,bot,1000,5000);
 assert.equal(hit(300).damage,0);
 assert.equal(getResource(bot.tracksCombat,'hardeningBonus'),4,'gross shielded impact cracks half the earned plating');
 assert.equal(bot.mitigatesDamage.plating,4);
}
console.log('defenseRedesign: ok');
