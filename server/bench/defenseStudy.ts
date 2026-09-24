import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, appendFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { DUNGEON_DEFS, NODE_BIOMES, ITEM_DATABASE } from '@mmo-idle/shared';
import { BREADTH_CELLS } from './balance/playerBreadthSpec';
import { prepareSurveyBot, SURVEY_CELLS, type SurveyCell } from './balance/ttkSurveySpec';
import { createFarmWorld } from './balance/worldFactory';
import { setupArena, teardownArena, BOT_SPAWN } from './balance/arena';
import { ensureDungeon } from '../src/systems/world/dungeons/dungeon';
import { hydrateHitboxCacheFromArtifact, writeHitboxArtifact } from '../src/hitbox/cache';
import { registerCombatListener, unregisterCombatListener, type CombatEventHandler } from '../src/systems/combat/engine/combatPipeline';

// Separate in-memory worlds, no HTTP listeners, DB migrations or existing experiment mutations.
async function main(){
const out=resolve(process.argv[2] ?? '../reports/defense-redesign-01/baseline');
assert(!existsSync(out), `Refusing to overwrite ${out}`);
mkdirSync(out,{recursive:true});
const artifact=resolve('../reports/defense-redesign-01/hitboxes.json');
if(!existsSync(artifact)) await writeHitboxArtifact(artifact);
assert(hydrateHitboxCacheFromArtifact(artifact)>0);
const capMs=180000;
const seeds=[101009,101033];
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
const volcBoss=[...DUNGEON_DEFS.values()].find(d=>d.biomeTier===3&&d.boss.bossId==='cinder-shell-magma-salamander')!;
assert(volcBoss);
const volcNode=Object.entries(NODE_BIOMES).find(([id,n])=>n.biomeTier===3&&n.biomeGroup==='volcanic'&&id.endsWith('-03'))![0];
const bossNode=[...DUNGEON_DEFS.entries()].find(([,d])=>d===volcBoss)![0];
for(const core of ['core-tempered','core-force','core-scout','core-sniper'])for(const plus of [0,3]){
 add(3,'slinger','jungle-vest-t3',volcNode,core,plus,'light');
 add(3,'slinger','jungle-vest-t3',bossNode,core,plus,'light',true);
}
// All eight armor routes, home and cross-biome farm applications, same class packages.
for(const [tier,armors] of [[2,['plains','forest','cave','mountain','swamp','jungle','desert']],[3,['volcanic','tundra','jungle','desert','cave','mountain','swamp']],[4,['volcanic','tundra','jungle','desert','trench','mountain','graveyard']]] as const){
 for(const biome of armors)for(const cls of ['squire','slinger']){
  const node=Object.entries(NODE_BIOMES).find(([id,n])=>n.biomeTier===tier&&n.biomeGroup===biome&&id.endsWith('-03'))?.[0];
  if(node)add(tier,cls,`${biome}-vest-t${tier}`,node);
  const cross=tier===2?'node-t2-desert-03':tier===3?volcNode:'node-t4-tundra-03';
  if(node!==cross)add(tier,cls,`${biome}-vest-t${tier}`,cross);
 }
}
for(const cls of ['striker','apprentice','spirit','conduit'])for(const biome of ['volcanic','tundra','jungle'])add(3,cls,`${biome}-vest-t3`,volcNode);
for(const armor of ['tundra-vest-t4','volcanic-vest-t4','trench-vest-t4'])add(4,'squire',armor,'node-t4-tundra-03','core-juggernaut',5,'heavy',false,'tanking-stance');
const filter=process.env.DEFENSE_CASE_FILTER;
if(process.env.DEFENSE_FOLLOWUP==='1'){
 cells.length=0;
 for(const biome of ['plains','forest','cave','mountain','swamp'])for(const cls of ['squire','slinger'])for(const plus of [0,3]){
  const c=structuredClone(SURVEY_CELLS.find(c=>c.tier===1&&c.className===cls&&!c.alternate)!);
  c.nodeId=`node-t1-${biome}-03`;c.upgradeLevel=plus;c.build.gearItemIds.armor=`${biome}-vest-t1`;c.id=`follow-t1-${cls}-${biome}-p${plus}`;c.build.id=c.id;cells.push(c);
 }
 for(const armor of ['mountain-vest-t4-stormwall','volcanic-vest-t4-lavatempered','graveyard-vest-t4-debtward'])for(const cls of ['squire','slinger'])add(4,cls,armor,'node-t4-tundra-03');
 for(const cls of ['slinger','squire','striker','apprentice','spirit','conduit']){
  add(3,cls,cls==='slinger'?'jungle-vest-t3':'cave-vest-t3',bossNode,cls==='slinger'?'core-sniper':undefined,3,'balanced',true);
  const c=cells.at(-1)!;c.id+='-heat-managed';c.build.id=c.id;c.runeRules!.push({conditionId:'always',actionId:'wait-it-out',waitOutMode:'heat-managed'});
 }
}
if(process.env.DEFENSE_FOLLOWUP==='2'){
 cells.length=0;
 for(const cls of ['striker','apprentice','spirit','conduit'])for(const armor of ['cave','swamp','mountain'])add(3,cls,`${armor}-vest-t3`,volcNode);
 for(const cls of ['slinger','squire','striker','apprentice','spirit','conduit']){
  add(3,cls,cls==='slinger'?'jungle-vest-t3':'cave-vest-t3',bossNode,cls==='slinger'?'core-sniper':undefined,5,'balanced',true);
  const c=cells.at(-1)!;c.id+='-heat-managed';c.build.id=c.id;c.runeRules!.push({conditionId:'always',actionId:'wait-it-out',waitOutMode:'heat-managed'});
 }
}
const pattern=process.env.DEFENSE_CASE_PATTERN;
const selected=pattern?cells.filter(c=>new RegExp(pattern).test(c.id)):filter?cells.filter(c=>c.id.includes(filter)):cells;
assert(selected.length>0);assert(new Set(selected.map(c=>c.id)).size===selected.length);
for(const c of selected)assert(ITEM_DATABASE.has(c.build.gearItemIds.armor!));
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({schema:1,source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),diff:execFileSync('git',['diff'],{encoding:'utf8',maxBuffer:20e6}),hitboxSha256:createHash('sha256').update(readFileSync(artifact)).digest('hex'),scope:'Synthetic mature mastery, declared +0/+3/+5 gear; no acquisition, economy or live-player inference. First death ends farming. No respawn.',capMs,seeds,cells:selected},null,2));
const originalRandom=Math.random,originalNow=Date.now;
let completed=0;
for(const cell of selected)for(const seed of seeds){
 let state=seed;Math.random=()=>{state|=0;state=state+0x6D2B79F5|0;let t=Math.imul(state^state>>>15,1|state);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
 let now=0;Date.now=()=>now;
 const world=createFarmWorld();world.suppressRepopulation=!!cell.isDungeon;
 const target={nodeId:cell.nodeId,biomeGroup:NODE_BIOMES[cell.nodeId].biomeGroup,contentTier:cell.tier,isDungeon:!!cell.isDungeon};
 let kills=0,maxHit=0,fullHpLethalHits=0,damage=0;const hits:unknown[]=[];
 const listener:CombatEventHandler=ctx=>{if(ctx.defenderType==='player'){maxHit=Math.max(maxHit,ctx.damage);damage+=ctx.damage;if(ctx.damage>=ctx.defender.hasHealth.maxHp)fullHpLethalHits++;hits.push({t:now,hpBefore:ctx.defender.hasHealth.hp,damage:ctx.damage,gross:ctx.metadata.incomingGross,ability:ctx.metadata.abilityName,evaded:ctx.metadata.evaded});if(hits.length>25)hits.shift();}};
 const kill:CombatEventHandler=ctx=>{if(ctx.defenderType==='monster')kills++;};
 registerCombatListener('onDamageTaken',listener);registerCombatListener('onKill',kill);
 try{
  setupArena(world,target);
  if(cell.isDungeon){ensureDungeon(world,cell.nodeId);const d=world.dungeons.get(cell.nodeId)!;assert(d);for(const id of d.guardianIds)world.removeMonsterEntity(id);d.guardianIds=[];d.guardiansEngaged=true;d.status='bossAwakening';d.bossAwakensAtMs=-1;}
  const {bot,view}=prepareSurveyBot(world,cell,BOT_SPAWN);const starting={hp:bot.hasHealth.maxHp,plating:bot.mitigatesDamage.plating,dr:bot.mitigatesDamage.damageReduction,equipment:bot.holdsInventory.equipment,skills:bot.usesSkills.unlockedSkills,passives:bot.usesSkills.passives};
  let outcome='timeout',bossSeen=false,bossHpFraction=1,minHp=1,lowHpMs=0;
  for(;now<capMs;){world.tick(100,now);now+=100;world.pendingDeaths=[];minHp=Math.min(minHp,bot.hasHealth.hp/bot.hasHealth.maxHp);if(bot.hasHealth.hp/bot.hasHealth.maxHp<.25)lowHpMs+=100;
   if(bot.hasHealth.hp<=0||bot.isDead){outcome='bot_died';break;}
   if(cell.isDungeon){const boss=[...world.monsterEntitiesInNode(cell.nodeId)].find(m=>m.isMonster.monsterTypeId===volcBoss.boss.bossId);if(boss){bossSeen=true;bossHpFraction=boss.hasHealth.hp/boss.hasHealth.maxHp;}else if(bossSeen){outcome=world.dungeons.get(cell.nodeId)?.status==='cooldown'?'boss_killed':'boss_missing';if(outcome==='boss_killed')bossHpFraction=0;break;}}
   if(bot.hasHealth.hp<=0||bot.isDead){outcome='bot_died';break;}
  }
  const row={id:cell.id,seed,outcome,elapsedMs:now,kills,bossSeen,bossHpFraction,minHp,lowHpMs,hpEnd:bot.hasHealth.hp,maxHit,fullHpLethalHits,damage,starting,lastHits:hits};
  appendFileSync(resolve(out,'rows.jsonl'),JSON.stringify(row)+'\n');
  console.log(JSON.stringify({completed:++completed,total:selected.length*seeds.length,id:cell.id,seed,outcome,kills,elapsedMs:now}));
 }catch(error){appendFileSync(resolve(out,'failures.jsonl'),JSON.stringify({id:cell.id,seed,error:String(error)})+'\n');throw error;}
 finally{unregisterCombatListener('onDamageTaken',listener);unregisterCombatListener('onKill',kill);teardownArena(world);Math.random=originalRandom;Date.now=originalNow;}
}
writeFileSync(resolve(out,'complete.json'),JSON.stringify({completed,expected:selected.length*seeds.length}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
