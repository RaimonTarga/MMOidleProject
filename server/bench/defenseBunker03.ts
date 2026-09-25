import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync,appendFileSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {ITEM_DATABASE,applyStatusEffect} from '@mmo-idle/shared';
import {BREADTH_CELLS} from './balance/playerBreadthSpec';
import {prepareSurveyBot} from './balance/ttkSurveySpec';
import {createBalanceWorld} from './balance/worldFactory';
import {teardownArena} from './balance/arena';
import {setAttackTarget} from '../src/systems/combat/ai/targeting';
import {makeCombatContext,emitCombatEvent} from '../src/systems/combat/engine/combatPipeline';
import {updateCombatState} from '../src/systems/combat/engine/combatState';
import {updateDefensiveSystems} from '../src/systems/defense';

const out=resolve(process.argv[2]);assert(!existsSync(out));mkdirSync(out,{recursive:true});
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),diff:execFileSync('git',['diff'],{encoding:'utf8',maxBuffer:20e6}),runnerSource:readFileSync(__filename,'utf8'),scope:'Synthetic fixed direct-hit stream, no AI, movement, offensive kills or environmental hazards. Heavy frame and Tanking Stance. Explicit Guard on/off: 45% base strength amplified by authored Guard potency, 3.5 seconds every 6 seconds; synthetic schedule, not Rune AI or cooldown evidence. 60-second cap, passive recovery/debt/shields and native defensive pipeline. Equal gross DPS between profiles. Not farming/boss evidence.'},null,2));
let completed=0;
const nowOriginal=Date.now;let now=0;Date.now=()=>now;
try{
for(const cls of ['squire','striker'])for(const tier of [4])for(const family of ['mountain','tundra','graveyard'])for(const plus of [3,5])for(const profile of ['small','large'])for(const core of ['core-arcanist','core-juggernaut'])for(const guard of [false,true])for(const variant of ['baseline']){
 now=0;const id=family+'-vest-t'+tier,original=ITEM_DATABASE.get(id)!;
 const item=structuredClone(original);
 if(variant==='desert-dr')item.statModifiers.damageReduction=(item.statModifiers.damageReduction??0)+.06;
 if(variant==='jungle-frequency')item.statModifiers.evasion=(item.statModifiers.evasion??0)+.10;
 if(variant==='jungle-strength')item.mechanicEffects={...item.mechanicEffects,'defense.evade-mitigation':(item.mechanicEffects?.['defense.evade-mitigation']??0)+.05};
 ITEM_DATABASE.set(id,item);
 const world=createBalanceWorld();
 try{
  const c=structuredClone(BREADTH_CELLS.find(c=>c.tier===tier&&c.className===cls&&c.frame==='heavy'&&c.role==='farm'&&!c.controlCaseId&&!c.id.includes('-far-'))!);assert(c);
  c.build.gearItemIds.armor=id;c.build.gearItemIds.core=core;c.upgradeLevel=plus;c.stance='tanking-stance';
  const {bot}=prepareSurveyBot(world,c,{x:400,y:400});
  const monster=world.createMonster(c.nodeId,'magma-brute',{x:400,y:400})!;assert(monster);setAttackTarget(world,bot,monster.isMonster.id);
  const interval=profile==='small'?500:2000,gross=(profile==='small'?30:120)*(tier===4?1.6:1);
  let hits=0,evades=0,damage=0,maxHit=0,minHp=bot.hasHealth.hp;
  for(;now<60000;now+=100){
   updateCombatState(world,100);
   if(guard&&now%6000===0)applyStatusEffect(bot.tracksCombat,{id:'ability-guard',sourceId:bot.isPlayer.id,remainingMs:3500,data:{drPct:Math.min(.9,.45*(1+(bot.usesSkills.passives['guard.potency-pct']??0)))}});
   updateDefensiveSystems(world,100,now);
   if(bot.hasHealth.hp<=0||bot.isDead)break;
   if(now%interval===0){
    const ctx=makeCombatContext(monster,'monster',bot,'player');
    emitCombatEvent('onAttack',ctx,world);ctx.metadata.incomingGross=gross;
    ctx.damage=Math.max(1,Math.round(Math.max(0,gross-bot.mitigatesDamage.plating)*(1-bot.mitigatesDamage.damageReduction)));
    emitCombatEvent('onDamageTaken',ctx,world);
    hits++;if(ctx.metadata.evaded)evades++;damage+=ctx.damage;maxHit=Math.max(maxHit,ctx.damage);
    bot.hasHealth.hp=Math.max(0,bot.hasHealth.hp-ctx.damage);
   }
   minHp=Math.min(minHp,bot.hasHealth.hp);if(bot.hasHealth.hp<=0||bot.isDead)break;
  }
  appendFileSync(resolve(out,'rows.jsonl'),JSON.stringify({cls,tier,family,plus,profile,core,guard,variant,elapsedMs:now,hp:bot.hasHealth.hp,maxHp:bot.hasHealth.maxHp,dead:bot.hasHealth.hp<=0||!!bot.isDead,hits,evades,damage,maxHit,minHp})+'\n');completed++;
 }finally{ITEM_DATABASE.set(id,original);teardownArena(world);}
}
writeFileSync(resolve(out,'complete.json'),JSON.stringify({completed,expected:96}));assert.equal(completed,96);
console.log('Fixed threat rows: '+completed);
}finally{Date.now=nowOriginal;}
