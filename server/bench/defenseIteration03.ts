import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, appendFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { DUNGEON_DEFS, NODE_BIOMES, ITEM_DATABASE, getResource } from '@mmo-idle/shared';
import { BREADTH_CELLS } from './balance/playerBreadthSpec';
import { prepareSurveyBot, SURVEY_CELLS, type SurveyCell } from './balance/ttkSurveySpec';
import { createFarmWorld } from './balance/worldFactory';
import { setupArena, teardownArena, BOT_SPAWN } from './balance/arena';
import { ensureDungeon } from '../src/systems/world/dungeons/dungeon';
import { hydrateHitboxCacheFromArtifact, writeHitboxArtifact } from '../src/hitbox/cache';
import { setCombatMeasurementObserver, registerCombatListener, unregisterCombatListener, type CombatEventHandler } from '../src/systems/combat/engine/combatPipeline';

// Separate in-memory worlds, no HTTP listeners, DB migrations or existing experiment mutations.
async function main(){
const out=resolve(process.argv[2] ?? '../reports/defense-redesign-01/baseline');
assert(!existsSync(out), `Refusing to overwrite ${out}`);
mkdirSync(out,{recursive:true});
const artifact=resolve('../reports/defense-redesign-01/hitboxes.json');
if(!existsSync(artifact)) await writeHitboxArtifact(artifact);
assert(hydrateHitboxCacheFromArtifact(artifact)>0);
const capMs=180000;
const variant=process.env.DEFENSE_VARIANT??'baseline';assert(['baseline','desert-dr','jungle-frequency','jungle-strength'].includes(variant));
const overrides:unknown[]=[];
for(const tier of [3,4]){
 const id=(variant==='desert-dr'?'desert-vest-t':'jungle-vest-t')+tier;
 const item=structuredClone(ITEM_DATABASE.get(id)!);
 if(variant==='desert-dr')item.statModifiers.damageReduction=(item.statModifiers.damageReduction??0)+.06;
 if(variant==='jungle-frequency')item.statModifiers.evasion=(item.statModifiers.evasion??0)+.10;
 if(variant==='jungle-strength')item.mechanicEffects={...item.mechanicEffects,'defense.evade-mitigation':(item.mechanicEffects?.['defense.evade-mitigation']??0)+.05};
 if(variant!=='baseline'){ITEM_DATABASE.set(id,item);overrides.push(item);}
}
const declaredSeeds=process.env.DEFENSE_FRESH_SEEDS==='1'?[202109,202127,202151,202171]:[202001,202021,202049,202061];
const seeds=process.env.DEFENSE_SEED?[Number(process.env.DEFENSE_SEED)]:declaredSeeds;assert(seeds.every(s=>declaredSeeds.includes(s)));
const traceAll=process.env.DEFENSE_TRACE_ALL==='1';
const cells:SurveyCell[]=[];
function add(tier:number,cls:string,armor:string,node:string,core?:string,plus=3,frame='balanced',boss=false,stance?:string|null){
 const base=BREADTH_CELLS.find(c=>c.tier===tier&&c.className===cls&&c.frame===frame&&c.role===(boss?'boss':'farm')&&!c.controlCaseId&&(!c.id.includes('-far-')))!;
 assert(base,`${tier}/${cls}/${frame}`);
 const cell=structuredClone(base); cell.nodeId=node; cell.upgradeLevel=plus; cell.isDungeon=boss;
 cell.build.gearItemIds.armor=armor;
 if(core)cell.build.gearItemIds.core=core;
 if(stance!==undefined)cell.stance=stance;
 cell.id=`${tier}-${cls}-${frame}-${armor}-${node}-${core??'reference'}-p${plus}-${stance??'default'}`;cell.build.id=cell.id;
 cells.push(cell);
}
// All classes, T3/T4, home and Volcano. Fixed core packages.
for(const cls of ['squire','striker','slinger','apprentice','spirit','conduit'])
 for(const tier of [3,4])for(const family of ['desert','jungle'])
  for(const biome of [family,'volcanic'])add(tier,cls,family+'-vest-t'+tier,'node-t'+tier+'-'+biome+'-03');
const filter=process.env.DEFENSE_CASE_FILTER;
const pattern=process.env.DEFENSE_CASE_PATTERN;
const selected=pattern?cells.filter(c=>new RegExp(pattern).test(c.id)):filter?cells.filter(c=>c.id.includes(filter)):cells;
assert(selected.every(c=>NODE_BIOMES[c.nodeId])); if(process.env.DEFENSE_PREFLIGHT==='1'){for(const c of selected){const world=createFarmWorld();const {view}=prepareSurveyBot(world,c,BOT_SPAWN);assert(view.selectedRange);teardownArena(world);}console.log('Core preflight: '+selected.length+' cells');return;}assert(selected.length>0);assert(new Set(selected.map(c=>c.id)).size===selected.length);
for(const c of selected)assert(ITEM_DATABASE.has(c.build.gearItemIds.armor!));
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({schema:2,variant,traceAll,overrides,source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),runnerSha256:createHash('sha256').update(readFileSync(__filename)).digest('hex'),runnerSource:readFileSync(__filename,'utf8'),diff:execFileSync('git',['diff'],{encoding:'utf8',maxBuffer:20e6}),hitboxSha256:createHash('sha256').update(readFileSync(artifact)).digest('hex'),scope:'Synthetic mature mastery, declared +0/+3/+5 gear; no acquisition, economy or live-player inference. First death ends farming. No respawn.',capMs,seeds,cells:selected},null,2));
const originalRandom=Math.random,originalNow=Date.now;
let completed=0;
for(const cell of selected)for(const seed of seeds){
 let state=seed;Math.random=()=>{state|=0;state=state+0x6D2B79F5|0;let t=Math.imul(state^state>>>15,1|state);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
 let now=0;Date.now=()=>now;
 const world=createFarmWorld();world.suppressRepopulation=!!cell.isDungeon;
 const target={nodeId:cell.nodeId,biomeGroup:NODE_BIOMES[cell.nodeId].biomeGroup,contentTier:cell.tier,isDungeon:!!cell.isDungeon};
 let deathCause:unknown=null; const originalKill=world.killPlayer.bind(world);world.killPlayer=(id,cause)=>{deathCause=cause;originalKill(id,cause);};const samples:unknown[]=[];let dawnActiveMs=0;
 const layers:Record<string,number>={};let hpLost=0,hpHealed=0,hpWrites=0,evades=0,hitCount=0;
 setCombatMeasurementObserver(world,m=>{const key=m.event+':'+m.layer;layers[key]=(layers[key]??0)+m.before-m.after;});
 const nominalDamageByType:Record<string,number>={};let loggedAbsorbed=0;
 const journalPush=world.worldLogJournal.push.bind(world.worldLogJournal);
 world.worldLogJournal.push=(...events)=>{for(const e of events){if(e.kind==='damage'&&e.target.actorType==='player'){nominalDamageByType[e.damageType]=(nominalDamageByType[e.damageType]??0)+e.hpDamage;loggedAbsorbed+=e.absorbed;}}return journalPush(...events);};
 let kills=0,maxHit=0,fullHpLethalHits=0,damage=0;const hits:unknown[]=[];
 const listener:CombatEventHandler=ctx=>{if(ctx.defenderType==='player'){hitCount++;if(ctx.metadata.evaded)evades++;maxHit=Math.max(maxHit,ctx.damage);damage+=ctx.damage;if(ctx.damage>=ctx.defender.hasHealth.maxHp)fullHpLethalHits++;hits.push({t:now,attacker:ctx.attackerType==='monster'?ctx.attacker.isMonster.monsterTypeId:ctx.attackerType,hpBefore:ctx.defender.hasHealth.hp,damage:ctx.damage,gross:ctx.metadata.incomingGross,ability:ctx.metadata.abilityName,evaded:ctx.metadata.evaded});if(!traceAll&&hits.length>25)hits.shift();}};
 const kill:CombatEventHandler=ctx=>{if(ctx.defenderType==='monster')kills++;};
 registerCombatListener('onDamageTaken',listener);registerCombatListener('onKill',kill);
 try{
  setupArena(world,target);
  if(cell.isDungeon){ensureDungeon(world,cell.nodeId);const d=world.dungeons.get(cell.nodeId)!;assert(d);for(const id of d.guardianIds)world.removeMonsterEntity(id);d.guardianIds=[];d.guardiansEngaged=true;d.status='bossAwakening';d.bossAwakensAtMs=-1;}
  const {bot,view}=prepareSurveyBot(world,cell,BOT_SPAWN);const starting={hp:bot.hasHealth.maxHp,plating:bot.mitigatesDamage.plating,dr:bot.mitigatesDamage.damageReduction,equipment:bot.holdsInventory.equipment,skills:bot.usesSkills.unlockedSkills,passives:bot.usesSkills.passives};
  let trackedHp=bot.hasHealth.hp;
  Object.defineProperty(bot.hasHealth,'hp',{enumerable:true,configurable:true,get:()=>trackedHp,set:(v:number)=>{if(v<trackedHp)hpLost+=trackedHp-v;else hpHealed+=v-trackedHp;hpWrites++;trackedHp=v;}});
  let outcome='timeout',bossSeen=false,bossHpFraction=1,minHp=1,lowHpMs=0;
  for(;now<capMs;){world.tick(100,now);now+=100;world.pendingDeaths=[];if(getResource(bot.tracksCombat,'engagementDrRemainingMs')>0)dawnActiveMs+=100;if(now%1000===0){samples.push({t:now,x:bot.hasPosition.current.x,y:bot.hasPosition.current.y,target:bot.hasAttackTarget?.targetId,hp:bot.hasHealth.hp,debt:getResource(bot.tracksCombat,'damageDebtPool'),dawn:getResource(bot.tracksCombat,'engagementDrRemainingMs'),effects:structuredClone(bot.tracksCombat.statusEffects)});if(!traceAll&&samples.length>30)samples.shift();}minHp=Math.min(minHp,bot.hasHealth.hp/bot.hasHealth.maxHp);if(bot.hasHealth.hp/bot.hasHealth.maxHp<.25)lowHpMs+=100;
   if(bot.hasHealth.hp<=0||bot.isDead){outcome='bot_died';break;}
   if(cell.isDungeon){const boss=[...world.monsterEntitiesInNode(cell.nodeId)].find(m=>m.isMonster.monsterTypeId===DUNGEON_DEFS.get(cell.nodeId)!.boss.bossId);if(boss){bossSeen=true;bossHpFraction=boss.hasHealth.hp/boss.hasHealth.maxHp;}else if(bossSeen){outcome=world.dungeons.get(cell.nodeId)?.status==='cooldown'?'boss_killed':'boss_missing';if(outcome==='boss_killed')bossHpFraction=0;break;}}
   if(bot.hasHealth.hp<=0||bot.isDead){outcome='bot_died';break;}
  }
  const row={id:cell.id,seed,outcome,elapsedMs:now,kills,bossSeen,bossHpFraction,minHp,lowHpMs,hpEnd:bot.hasHealth.hp,maxHit,fullHpLethalHits,damage,starting,lastHits:hits,deathCause,dawnActiveMs,samples,layers,hpLost,hpHealed,hpWrites,hitCount,evades,nominalDamageByType,loggedAbsorbed};
  appendFileSync(resolve(out,'rows.jsonl'),JSON.stringify(row)+'\n');
  console.log(JSON.stringify({completed:++completed,total:selected.length*seeds.length,id:cell.id,seed,outcome,kills,elapsedMs:now}));
 }catch(error){appendFileSync(resolve(out,'failures.jsonl'),JSON.stringify({id:cell.id,seed,error:String(error)})+'\n');throw error;}
 finally{setCombatMeasurementObserver(world);unregisterCombatListener('onDamageTaken',listener);unregisterCombatListener('onKill',kill);teardownArena(world);Math.random=originalRandom;Date.now=originalNow;}
}
writeFileSync(resolve(out,'complete.json'),JSON.stringify({completed,expected:selected.length*seeds.length}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
