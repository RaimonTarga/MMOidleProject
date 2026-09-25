/** Matched source-candidate evaluation: no runtime balance overrides. */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DUNGEON_DEFS, NODE_BIOMES, buildNavGrid, navigationBodyHalfExtents, moverOverlapsBlockShapes } from '@mmo-idle/shared';
import { createFarmWorld } from './worldFactory';
import { setupArena } from './arena';
import { BREADTH_CELLS } from './playerBreadthSpec';
import { prepareSurveyBot } from './ttkSurveySpec';
import { EnduranceProgress } from './enduranceProgress';
import { hydrateHitboxCacheFromArtifact } from '../../src/hitbox/cache';
import { setAttackTarget } from '../../src/systems/combat/ai/targeting';
import { ensureDungeon, tickDungeons } from '../../src/systems/world/dungeons/dungeon';
import { BOT_SPAWN } from './arena';

interface Spec { path:string; plus:number; weapon?:string; core?:string; relic?:string; armor?:boolean; node?:string; seed:number; mode:'probe'|'farm'|'boss'; durationMs:number }
const [mode='smoke', output='../reports/t4-scaling-candidate-01'] = process.argv.slice(2);
mkdirSync(output,{recursive:true});
assert(hydrateHitboxCacheFromArtifact('D:/mmo-idle/volcano-heat-management-01/hitboxes.json')>0);
const specs:Spec[]=[];
const packages = [
 {path:'cadence-heavy-t3-a'}, {path:'cadence-heavy-t3-a',weapon:'graveyard-plague-axe'},
 {path:'cadence-heavy-t3-c'}, {path:'energy-heavy-t3-a'}, {path:'energy-heavy-t3-b'},
 {path:'reload-heavy-t3-a'}, {path:'cooldown-heavy-t3-c'},
];
if(mode==='smoke') specs.push({...packages[0],plus:5,seed:173,mode:'farm',durationMs:10000});
else if(mode==='farm') {
 for(const pkg of packages)for(const plus of [0,5])for(const seed of [173,947])for(const node of ['node-t4-graveyard-03','node-t4-jungle-03'])
  specs.push({...pkg,plus,seed,node,mode:'farm',durationMs:300000});
} else if(mode==='boss') {
 for(const pkg of packages)for(const plus of [0,5])for(const node of ['node-t4-mountain-dungeon','node-t4-jungle-dungeon'])
  specs.push({...pkg,plus,seed:173,node,mode:'boss',durationMs:300000});
} else if(mode==='probe') {
 for(const pkg of packages)for(const plus of [0,5])
  specs.push({...pkg,plus,seed:173,mode:'probe',durationMs:pkg.path==='cadence-heavy-t3-c'?600000:120000});
 for(const plus of [0,5])specs.push({path:'energy-heavy-t3-a',plus,seed:173,mode:'probe',durationMs:120000,armor:true});
} else throw new Error('Unknown mode');
const unique=specs.filter((s,i,a)=>a.findIndex(t=>JSON.stringify(t)===JSON.stringify(s))===i);
writeFileSync(join(output,`${mode}-manifest.json`),JSON.stringify({mode,synthetic:true,economyEligible:false,dtMs:100,
  note:'Mature mastery at both +0 and +5; +0 is a lower-upgrade sensitivity, NOT earned T4 entry. Probe pins actors and disables incoming damage; production combat tick and full prepared package. No rites.',specs:unique},null,2));
const results:unknown[]=[];
for(const [index,spec] of unique.entries()) {
  let rng=spec.seed>>>0;Math.random=()=>{rng+=0x6D2B79F5;let t=rng;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
  let now=1800000000000;Date.now=()=>now;
  const cell=structuredClone(BREADTH_CELLS.find(c=>c.role===(spec.mode==='boss'?'boss':'farm')&&c.playerTreatment==='untreated'&&c.build.skillPath.includes(spec.path))!);assert(cell);
  cell.upgradeLevel=spec.plus;
  if(spec.node)cell.nodeId=spec.node;
  assert(NODE_BIOMES[cell.nodeId]);
  if(spec.weapon)cell.build.gearItemIds.weapon=spec.weapon;
  if(spec.core)cell.build.gearItemIds.core=spec.core;
  if(spec.relic)cell.build.gearItemIds.relic=spec.relic;
  const world=createFarmWorld();world.suppressRepopulation=spec.mode!=='farm';
  setupArena(world,{nodeId:cell.nodeId,biomeGroup:NODE_BIOMES[cell.nodeId].biomeGroup,contentTier:4,isDungeon:spec.mode==='boss'});
  const half=navigationBodyHalfExtents('player'),shapes=buildNavGrid(cell.nodeId,'player',half).shapes;
  let pos={x:2400,y:2400},found=false;
  for(let r=0;r<1800&&!found;r+=100)for(const [dx,dy] of [[0,r],[r,0],[0,-r],[-r,0]]) {
    const p={x:2400+dx,y:2400+dy};if(!moverOverlapsBlockShapes(p,shapes,half)){pos=p;found=true;break;}
  }
  assert(found);
  if(spec.mode==='boss') {
    pos={...BOT_SPAWN};ensureDungeon(world,cell.nodeId);
    const state=world.dungeons.get(cell.nodeId)!;assert(state);
    for(const id of state.guardianIds)world.removeMonsterEntity(id);
    state.guardianIds=[];state.guardiansEngaged=true;state.status='bossAwakening';state.bossAwakensAtMs=-1;
  }
  const {bot,view}=prepareSurveyBot(world,cell,pos);world.fixedBiomeMasteryPlayers.add(bot.isPlayer.id);
  if(spec.mode==='boss')tickDungeons(world,now);
  const bossType=spec.mode==='boss'?[...DUNGEON_DEFS.values()].find(d=>d.nodeId===cell.nodeId)?.boss.bossId:undefined;
  const bossId=spec.mode==='boss'?[...world.monsterEntitiesInNode(cell.nodeId)].find(m=>m.isMonster.monsterTypeId===bossType)?.isMonster.id:undefined;
  if(spec.mode==='boss')assert(bossId,'Actual dungeon boss must exist');
  let target:ReturnType<typeof world.createMonster>=null;
  if(spec.mode==='probe') {
    for(const m of [...world.monsterEntitiesInNode(cell.nodeId)])world.removeMonsterEntity(m.isMonster.id);
    target=world.createMonster(cell.nodeId,'plains-slime',{x:pos.x+24,y:pos.y});assert(target);
    Object.assign(target.hasHealth,{hp:1e9,maxHp:1e9,recovery:0});
    Object.assign(target.mitigatesDamage,{plating:spec.armor?50:0,damageReduction:spec.armor?0.4:0,evasion:0});
    target.dealsDamage.attack=0;target.performsAttack.attackCooldown=1e12;target.performsAttack.lastAttackAt=now;
    target.hasPosition.speed=0;
    setAttackTarget(world,bot,target.isMonster.id);
  }
  const receipt={spec,cell,view,bossType,bossId,passives:structuredClone(bot.usesSkills.passives),stats:{attack:bot.dealsDamage.attack,onHit:bot.dealsDamage.onHitDamage,cd:bot.performsAttack.attackCooldown,hp:bot.hasHealth.maxHp},target:target?.mitigatesDamage};
  const progress=new EnduranceProgress(bot.isPlayer.id),windows:unknown[]=[],sources:Record<string,number>={};
  let elapsed=0,outcome='window-ended',minCd=bot.performsAttack.attackCooldown,maxRampage=0,maxCritical=0,incoming=0,bossKilled=false;
  const raw:unknown[]=[];let tickDamage=0;
  world.worldLogJournal=[];world.worldLogByPlayer.clear();world.takeNodeEvents(cell.nodeId);
  const start=performance.now();
  for(;elapsed<spec.durationMs;elapsed+=100) {
    if(performance.now()-start>90000){outcome='wall-ceiling';break;}
    now=1800000000000+elapsed;
    if(target) {
      bot.hasHealth.hp=bot.hasHealth.maxHp;bot.hasPosition.current={...pos};target.hasPosition.current={x:pos.x+24,y:pos.y};
      target.performsAttack.lastAttackAt=now;setAttackTarget(world,bot,target.isMonster.id);
    }
    world.tick(100,now);tickDamage=0;
    for(const e of world.worldLogJournal) {
      progress.ingest(e,elapsed+100);
      if(e.kind==='kill'&&e.victim.id===bossId)bossKilled=true;
      if(e.kind==='damage'&&e.target.id===bot.isPlayer.id)incoming+=e.hpDamage;
      if(e.kind==='damage'&&e.target.actorType==='monster'&&e.source.id===bot.isPlayer.id) {
        tickDamage+=e.hpDamage;
        const key=JSON.stringify((e as any).tags??(e as any).damageKind??'damage');sources[key]=(sources[key]??0)+e.hpDamage;
      }
    }
    if(tickDamage)raw.push([elapsed+100,tickDamage,bot.usesCadence?.rampageStacks??null,bot.usesEnergy?.criticalMassStacks??null,bot.performsAttack.attackCooldown]);
    minCd=Math.min(minCd,bot.performsAttack.attackCooldown);maxRampage=Math.max(maxRampage,bot.usesCadence?.rampageStacks??0);maxCritical=Math.max(maxCritical,bot.usesEnergy?.criticalMassStacks??0);
    world.worldLogJournal=[];world.worldLogByPlayer.clear();world.takeNodeEvents(cell.nodeId);
    if([10000,30000,60000,120000,300000,600000].includes(elapsed+100))windows.push({atMs:elapsed+100,...progress.snapshot(elapsed+100)});
    if(bot.isDead||bot.hasHealth.hp<=0){outcome='player-died';elapsed+=100;break;}
    if(bossKilled){outcome='boss-killed';elapsed+=100;break;}
  }
  const result={index,spec,outcome,elapsedMs:elapsed,damage:progress.hpDamage,dps:progress.hpDamage/(elapsed/1000),kills:progress.kills,incoming,minCd,maxRampage,maxCritical,windows,sources,terminalHp:bot.hasHealth.hp,bossId,bossType,bossKilled,wallMs:performance.now()-start};
  writeFileSync(join(output,`${mode}-${index}.json`),JSON.stringify({receipt,result,rawColumns:['timeMs','hpDamage','rampage','criticalMass','cooldownMs'],raw},null,2));
  results.push(result);console.log(JSON.stringify(result));
  world.detachPlayerEntity(bot.isPlayer.id);
}
writeFileSync(join(output,`${mode}-results.json`),JSON.stringify(results,null,2));
writeFileSync(join(output,`${mode}-complete.json`),JSON.stringify({complete:true,rows:results.length}));
process.exit(0);
