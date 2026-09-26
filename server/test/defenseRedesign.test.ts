import assert from 'node:assert/strict';
import { tickCooldowns } from '@mmo-idle/shared';
import { createBalanceWorld } from '../bench/balance/worldFactory';
import { BREADTH_CELLS } from '../bench/balance/playerBreadthSpec';
import { prepareSurveyBot } from '../bench/balance/ttkSurveySpec';
import { makeCombatContext, emitCombatEvent } from '../src/systems/combat/engine/combatPipeline';
import { updateEngagementDr, getEngagementDrRemaining } from '../src/systems/defense/mitigation/engagementDr';
import { runStationaryDr, getStationaryDrBonus } from '../src/systems/defense/mitigation/stationaryDr';
import { runReactivePlating, getReactivePlatingBonus } from '../src/systems/defense/mitigation/reactivePlating';
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

// Rebudget mechanisms: Desert opening DR, Tundra stationary DR.
{
 const{world,bot,monster,hit}=fixture();bot.usesSkills.passives={'defense.engagement-dr-pct':.35,'defense.engagement-dr-ms':6000};
 setAttackTarget(world,bot,monster.isMonster.id);
 updateEngagementDr(world,bot,3000);assert.equal(getEngagementDrRemaining(bot),0,'approach does not spend opening protection');
 assert.equal(hit(100).damage,65,'opening protects first hit');
 updateEngagementDr(world,bot,6000);assert.equal(hit(100).damage,100,'fresh attacks do not refresh');
 for(const m of [...world.monsterEntities])world.removeMonsterEntity(m.isMonster.id);
 setAttackTarget(world,bot,null);
 updateEngagementDr(world,bot,3000);assert.equal(hit(100).damage,100,'three quiet seconds do not rearm');
 for(const m of [...world.monsterEntities])world.removeMonsterEntity(m.isMonster.id);
 updateEngagementDr(world,bot,4000);assert.equal(getEngagementDrRemaining(bot),0);
 assert.equal(hit(100).damage,65,'four quiet seconds rearm');
}
{
 const{world,bot,monster,hit}=fixture();bot.usesSkills.passives={'defense.stationary-dr-pct':.2,'defense.stationary-dr-ramptime-ms':3000};
 hit(0);runStationaryDr(world,bot,3000);assert.equal(getStationaryDrBonus(bot),0,'no out-of-combat charging');
 setAttackTarget(world,bot,monster.isMonster.id);
 tickCooldowns(bot.tracksCombat,5000);runStationaryDr(world,bot,3000);
 assert.equal(getStationaryDrBonus(bot),0,'holding a target without being attacked does not charge');
 hit(0);runStationaryDr(world,bot,3000);assert.equal(getStationaryDrBonus(bot),.2,'standing under attack charges');
 tickCooldowns(bot.tracksCombat,2000);runStationaryDr(world,bot,1000);
 assert(Math.abs(getStationaryDrBonus(bot)-.1)<1e-9,'once the attacks stop it fades over two seconds, not at once');
 runStationaryDr(world,bot,1000);assert.equal(getStationaryDrBonus(bot),0,'nothing carries into the next fight');
 hit(0);runStationaryDr(world,bot,3000);
 for(let i=0;i<13;i++){bot.hasPosition.current.x+=1;runStationaryDr(world,bot,100);}
 assert.equal(getStationaryDrBonus(bot),0,'forced displacement sheds protection');
}
// Volcanic reactive plating: +1 per hit to the cap, heavy hits never crack it,
// then single stacks fade after the hold window.
{
 const{world,bot,hit}=fixture();bot.usesSkills.passives={'defense.hit-plating-per-stack':1,'defense.hit-plating-max-stacks':4,'defense.hit-plating-duration-ms':3000};
 for(let i=0;i<6;i++){hit(10);runReactivePlating(world,bot,100);}
 assert.equal(getReactivePlatingBonus(bot),4,'stacks cap');assert.equal(bot.mitigatesDamage.plating,4);
 hit(900);runReactivePlating(world,bot,100);assert.equal(getReactivePlatingBonus(bot),4,'a heavy hit does not crack it');
 tickCooldowns(bot.tracksCombat,3000);runReactivePlating(world,bot,500);
 assert.equal(getReactivePlatingBonus(bot),3,'after the hold, one stack fades at a time');
 runReactivePlating(world,bot,1500);assert.equal(getReactivePlatingBonus(bot),0);assert.equal(bot.mitigatesDamage.plating,0);
}
console.log('defenseRedesign: ok');
