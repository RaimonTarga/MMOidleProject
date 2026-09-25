/** Exploratory T4 scaling study. Runtime-only treatments; no production data edits. */
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
import { registerCombatListener, unregisterCombatListener, type CombatContext } from '../../src/systems/combat/engine/combatPipeline';
import { setAttackTarget } from '../../src/systems/combat/ai/targeting';
import { ensureDungeon, tickDungeons } from '../../src/systems/world/dungeons/dungeon';
import { BOT_SPAWN } from './arena';

type Arm = 'baseline' | 'speed30' | 'threshold3' | 'speed30threshold3' | 'gain10' | 'cap100' | 'laserFlat25' | 'laserFlat75' | 'laserSoft';
interface Spec { path:string; arm:Arm; plus:number; weapon?:string; core?:string; relic?:string; armor?:boolean; seed:number; mode:'probe'|'farm'|'boss'; durationMs:number }
const [mode='smoke', output='../reports/t4-scaling-study-2026-09-25'] = process.argv.slice(2);
mkdirSync(output,{recursive:true});
assert(hydrateHitboxCacheFromArtifact('D:/mmo-idle/volcano-heat-management-01/hitboxes.json')>0);
const specs:Spec[]=[];
function add(path:string,arms:Arm[],options:Partial<Spec>={}) {
  for(const arm of arms)specs.push({path,arm,plus:5,seed:173,mode:'probe',durationMs:120000,...options});
}
if(mode==='smoke') add('cadence-heavy-t3-a',['baseline','speed30'],{durationMs:10000});
else if(mode==='probes') {
  for(const path of ['cadence-heavy-t3-a','cadence-heavy-t3-b','cadence-heavy-t3-c','cadence-balanced-t3-b',
    'energy-heavy-t3-a','energy-heavy-t3-b','energy-heavy-t3-c','energy-balanced-t3-b',
    'reload-heavy-t3-a','reload-heavy-t3-b','cooldown-heavy-t3-c','cooldown-heavy-t3-b',
    'dot-balanced-t3-a','dot-balanced-t3-b','dot-light-t3-b'])for(const plus of [0,5])add(path,['baseline'],{plus});
  for(const plus of [0,5])for(const weapon of ['trench-abyssal-axe','jungle-deathfang-rapier','mountain-earthsunder-maul']) {
    add('cadence-heavy-t3-a',['baseline','speed30'],{plus,weapon});
    add('energy-heavy-t3-b',['baseline','gain10'],{plus,weapon});
  }
  for(const core of ['core-catalyst','core-tempered']) {
    add('reload-heavy-t3-a',['baseline','laserFlat25'],{core});
    add('cooldown-heavy-t3-c',['baseline'],{core});
  }
  for(const weapon of ['jungle-deathfang-rapier','tundra-glacial-rimebrand','mountain-earthsunder-maul']) {
    add('reload-heavy-t3-a',['baseline','laserFlat25'],{weapon});
    add('cooldown-heavy-t3-c',['baseline'],{weapon});
  }
  add('cadence-heavy-t3-c',['baseline','cap100'],{durationMs:600000});
  for(const path of ['energy-heavy-t3-a','energy-heavy-t3-b','energy-heavy-t3-c'])add(path,['baseline'],{armor:true});
} else if(mode==='followup') {
  add('cadence-heavy-t3-a',['baseline','speed30']);
  add('energy-heavy-t3-b',['baseline','gain10']);
  for(const core of ['core-catalyst','core-tempered'])add('reload-heavy-t3-a',['baseline','laserFlat75'],{core});
  for(const plus of [0,5])add('cadence-heavy-t3-a',['baseline','speed30'],{plus,weapon:'graveyard-plague-axe'});
  for(const relic of ['relic-hastebound-dial','relic-equilibrium-shard','relic-glacial-bell']) {
    add('cadence-heavy-t3-a',['baseline','speed30'],{weapon:'graveyard-plague-axe',relic});
    add('energy-heavy-t3-b',['baseline','gain10'],{relic});
  }
} else if(mode==='farm-followup') {
  for(const seed of [173,947]) {
    for(const plus of [0,5])add('reload-heavy-t3-a',['baseline','laserFlat75'],{mode:'farm',seed,plus,durationMs:300000});
    add('cadence-heavy-t3-a',['baseline','speed30'],{mode:'farm',seed,weapon:'graveyard-plague-axe',durationMs:300000});
  }
} else if(mode==='soft') {
  for(const plus of [0,5])add('reload-heavy-t3-a',['baseline','laserSoft'],{plus});
  for(const seed of [173,947])for(const plus of [0,5])add('reload-heavy-t3-a',['baseline','laserSoft'],{mode:'farm',seed,plus,durationMs:300000});
  add('reload-heavy-t3-a',['baseline','laserSoft'],{mode:'boss',durationMs:300000});
} else if(mode==='structural') {
  for(const weapon of ['graveyard-plague-axe','jungle-deathfang-rapier','mountain-warmaul'])add('cadence-heavy-t3-a',['baseline','threshold3','speed30threshold3'],{weapon});
  add('cadence-heavy-t3-a',['baseline','threshold3','speed30threshold3'],{weapon:'graveyard-plague-axe',relic:'relic-glacial-bell'});
  for(const path of ['cadence-heavy-t3-b','cadence-balanced-t3-b','cadence-light-t3-c','energy-heavy-t3-b','dot-balanced-t3-a'])add(path,['baseline'],{weapon:'graveyard-plague-axe',relic:'relic-glacial-bell'});
} else if(mode==='boss') {
  for(const seed of [173,947]) {
    const opts={mode:'boss' as const,seed,durationMs:300000};
    add('cadence-heavy-t3-a',['baseline','speed30'],{...opts,weapon:'graveyard-plague-axe'});
    add('energy-heavy-t3-b',['baseline','gain10'],opts);
    add('reload-heavy-t3-a',['baseline','laserFlat75'],opts);
    add('cooldown-heavy-t3-c',['baseline'],opts);
    add('energy-heavy-t3-a',['baseline'],opts);
    add('cadence-heavy-t3-c',['baseline','cap100'],opts);
  }
} else if(mode==='farm') {
  for(const seed of [173,947])for(const plus of [0,5]) {
    add('cadence-heavy-t3-a',['baseline','speed30'],{mode:'farm',seed,plus,durationMs:300000});
    add('energy-heavy-t3-b',['baseline','gain10'],{mode:'farm',seed,plus,durationMs:300000});
    add('reload-heavy-t3-a',['baseline','laserFlat25'],{mode:'farm',seed,plus,durationMs:300000});
  }
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
  if(spec.arm==='speed30'||spec.arm==='speed30threshold3')bot.usesSkills.passives['cadence.rampage-aps-per-stack-ms']=30;
  if(spec.arm==='threshold3'||spec.arm==='speed30threshold3')bot.usesSkills.passives['cadence.rampage-threshold-floor']=3;
  if(spec.arm==='gain10')bot.usesSkills.passives['energy.critical-mass-gain-per-stack']=0.10;
  const laserScale=(ctx:CombatContext)=>{if(ctx.attacker===bot&&ctx.metadata['reloadLaser']) {
    if(spec.arm==='laserFlat25')ctx.metadata['onHitDamageMult']=0.25;
    if(spec.arm==='laserFlat75')ctx.metadata['onHitDamageMult']=0.75;
    if(spec.arm==='laserSoft') {
      const n=(key:string,fallback=0)=>typeof ctx.metadata[key]==='number'?ctx.metadata[key] as number:fallback;
      const input=(bot.dealsDamage.onHitDamage+n('imbueOnHitBonus')+n('onHitDamageBonus'))*n('onHitDamageMult',1)+n('onHitDamageBonusAfterShot');
      const output=Math.min(30,input)+Math.max(0,input-30)*0.6;
      ctx.metadata['onHitDamageBonusAfterShot']=n('onHitDamageBonusAfterShot')+output-input;
    }
  }};
  registerCombatListener('onHit',laserScale);
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
    if(spec.arm==='cap100'&&bot.usesCadence)bot.usesCadence.crescendoTimerMs=Math.min(bot.usesCadence.crescendoTimerMs,69900);
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
  unregisterCombatListener('onHit',laserScale);
  const result={index,spec,outcome,elapsedMs:elapsed,damage:progress.hpDamage,dps:progress.hpDamage/(elapsed/1000),kills:progress.kills,incoming,minCd,maxRampage,maxCritical,windows,sources,terminalHp:bot.hasHealth.hp,bossId,bossType,bossKilled,wallMs:performance.now()-start};
  writeFileSync(join(output,`${mode}-${index}.json`),JSON.stringify({receipt,result,rawColumns:['timeMs','hpDamage','rampage','criticalMass','cooldownMs'],raw},null,2));
  results.push(result);console.log(JSON.stringify(result));
  world.detachPlayerEntity(bot.isPlayer.id);
}
writeFileSync(join(output,`${mode}-results.json`),JSON.stringify(results,null,2));
writeFileSync(join(output,`${mode}-complete.json`),JSON.stringify({complete:true,rows:results.length}));
process.exit(0);
