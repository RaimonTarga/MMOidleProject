import assert from 'node:assert/strict';
import { getResource, setResource } from '@mmo-idle/shared';
import { createBalanceWorld } from '../bench/balance/worldFactory';
import { BREADTH_CELLS } from '../bench/balance/playerBreadthSpec';
import { prepareSurveyBot } from '../bench/balance/ttkSurveySpec';
import { makeCombatContext, emitCombatEvent } from '../src/systems/combat/engine/combatPipeline';
import { applyWard } from '../src/systems/defense/barrier/wards';
import { updateEngagementDr, getEngagementDrRemaining } from '../src/systems/defense/mitigation/engagementDr';
import { runStationaryDr, getStationaryDrBonus } from '../src/systems/defense/mitigation/stationaryDr';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';

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

// Rebudget mechanisms: Desert opening DR, Tundra stationary DR, Volcano cracking.
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
 const{world,bot,hit}=fixture();bot.usesSkills.passives={'defense.hardening-reset-pct':.25};
 setResource(bot.tracksCombat,'hardeningBonus',8);bot.mitigatesDamage.plating=8;
 applyWard(world,bot,1000,5000);
 assert.equal(hit(300).damage,0);
 assert.equal(getResource(bot.tracksCombat,'hardeningBonus'),4,'gross shielded impact cracks half the earned plating');
 assert.equal(bot.mitigatesDamage.plating,4);
}
console.log('defenseRedesign: ok');
