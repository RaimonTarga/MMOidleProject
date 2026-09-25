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
const seeds=process.env.CORE_SCOUT_PROBE==='1'?[101051,101063,101081,101093]:[101009,101033];
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
// Core screen excludes every Volcanic node. Native class packages, fixed +3 gear.
for(const cls of ['squire','striker','slinger','apprentice','spirit','conduit']) {
 const melee=['squire','striker'].includes(cls);
 const cores=['core-tempered','core-force','core-survivalist','core-arcanist','core-accelerant',...(melee?['core-bruiser','core-duelist']:['core-scout','core-sniper'])];
 for(const core of cores)for(const boss of [false,true]) {
  const node=boss?[...DUNGEON_DEFS.keys()].find(id=>NODE_BIOMES[id].biomeTier===3&&NODE_BIOMES[id].biomeGroup==='cave')!:'node-t3-jungle-03';
  add(3,cls,melee?'cave-vest-t3':'jungle-vest-t3',node,core,3,'balanced',boss);
 }
}
for(const cls of ['squire','striker'])for(const core of ['core-tempered','core-bruiser','core-juggernaut'])for(const boss of [false,true]){
 const node=boss?[...DUNGEON_DEFS.keys()].find(id=>NODE_BIOMES[id].biomeTier===4&&NODE_BIOMES[id].biomeGroup==='mountain')!:'node-t4-tundra-03';
 add(4,cls,'mountain-vest-t4',node,core,3,'heavy',boss,'tanking-stance');
}
// Suitable specialist packages are screened separately, not pooled with basic roots.
for(const cls of ['apprentice','slinger'])for(const core of ['core-tempered','core-controller','core-catalyst','core-accelerant'])for(const biome of ['trench','graveyard']){
 add(4,cls,'graveyard-vest-t4',`node-t4-${biome}-03`,core,3,'light');
}
if(process.env.CORE_SCOUT_PROBE==='1'){
 cells.length=0;
 for(const cls of ['slinger','spirit'])for(const biome of ['jungle','cave'])add(3,cls,'jungle-vest-t3',`node-t3-${biome}-03`,'core-scout',3,'balanced');
}
if(process.env.CORE_SPECIALIST_PROBE==='1'){
 cells.length=0;
 for(const core of ['core-tempered','core-controller','core-arcanist'])for(const biome of ['trench','graveyard']){
  add(4,'apprentice','graveyard-vest-t4',`node-t4-${biome}-03`,core,3,'heavy');
  const c=cells.at(-1)!;c.build.skillPath=c.build.skillPath.map(id=>id==='dot-heavy-t3-a'?'dot-heavy-t3-b':id);c.id+='-frost-control';c.build.id=c.id;
 }
}
const filter=process.env.DEFENSE_CASE_FILTER;
const pattern=process.env.DEFENSE_CASE_PATTERN;
const selected=pattern?cells.filter(c=>new RegExp(pattern).test(c.id)):filter?cells.filter(c=>c.id.includes(filter)):cells;
assert(selected.every(c=>NODE_BIOMES[c.nodeId]&&NODE_BIOMES[c.nodeId].biomeGroup!=='volcanic')); if(process.env.CORE_PREFLIGHT==='1'){for(const c of selected){const world=createFarmWorld();const {view}=prepareSurveyBot(world,c,BOT_SPAWN);assert(view.selectedRange);teardownArena(world);}console.log('Core preflight: '+selected.length+' cells');return;}assert(selected.length>0);assert(new Set(selected.map(c=>c.id)).size===selected.length);
for(const c of selected)assert(ITEM_DATABASE.has(c.build.gearItemIds.armor!));
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({schema:1,source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),runnerSha256:createHash('sha256').update(readFileSync(__filename)).digest('hex'),runnerSource:readFileSync(__filename,'utf8'),diff:execFileSync('git',['diff'],{encoding:'utf8',maxBuffer:20e6}),hitboxSha256:createHash('sha256').update(readFileSync(artifact)).digest('hex'),scope:'Synthetic mature mastery, declared +0/+3/+5 gear; no acquisition, economy or live-player inference. First death ends farming. No respawn.',capMs,seeds,cells:selected},null,2));
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
   if(cell.isDungeon){const boss=[...world.monsterEntitiesInNode(cell.nodeId)].find(m=>m.isMonster.monsterTypeId===DUNGEON_DEFS.get(cell.nodeId)!.boss.bossId);if(boss){bossSeen=true;bossHpFraction=boss.hasHealth.hp/boss.hasHealth.maxHp;}else if(bossSeen){outcome=world.dungeons.get(cell.nodeId)?.status==='cooldown'?'boss_killed':'boss_missing';if(outcome==='boss_killed')bossHpFraction=0;break;}}
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
