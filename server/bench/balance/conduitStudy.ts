import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { DUNGEON_DEFS, NODE_BIOMES, SUMMONER_CORE_TUNING, SUMMONER_FRAME_TUNING,
  buildNavGrid, navigationBodyHalfExtents, moverOverlapsBlockShapes, globalMastery,
  runeBudgetForGlobalMastery } from '@mmo-idle/shared';
import { createFarmWorld } from './worldFactory';
import { setupArena, BOT_SPAWN } from './arena';
import { prepareSurveyBot, type SurveyCell } from './ttkSurveySpec';
import { BREADTH_CELLS } from './playerBreadthSpec';
import { fastPassReadback, assertFastPassHitboxes } from './playerFastPassSpec';
import { EnduranceProgress } from './enduranceProgress';
import { ConduitRecorder } from './conduitRecorder';
import { hydrateHitboxCacheFromArtifact } from '../../src/hitbox/cache';
import { ensureDungeon, tickDungeons } from '../../src/systems/world/dungeons/dungeon';

type Arm = 'baseline' | 'tax15' | 'hp25' | 'combined' | 'tax0' | 'hp50' | 'hp100';
interface Case { id:string; arm:Arm; seed:number; cell:SurveyCell; durationMs:number }
interface Manifest { out:string; hitboxes:string; cases:Case[]; stage:string }
const [mode, path, argument] = process.argv.slice(2);
const write=(file:string,value:unknown)=>writeFileSync(file,JSON.stringify(value,null,2)+'\n');
const sha=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
if(mode==='prepare') {
  const stage=argument??'t1';
  const arms:Arm[]=stage==='t1'?['baseline','tax15','hp25']:JSON.parse(process.argv[5]??'["baseline","tax15"]');
  let cells:SurveyCell[]=[];
  if(stage==='t1') {
    const contexts=[
      {name:'arrival-plains',group:'plains',mastery:{clearing:4},plus:0,kit:'clearing',weapon:'primordial-club',abilities:[],guards:[],boss:false},
      {name:'equipped-plains',group:'plains',mastery:{clearing:4,plains:4},plus:0,kit:'plains',weapon:'iron-broadsword',abilities:['sweep'],guards:[],boss:false},
      {name:'forest',group:'forest',mastery:{clearing:4,plains:6,forest:3},plus:1,kit:'plains',weapon:'flash-rapier',abilities:['sweep'],guards:['second-wind'],boss:false},
      {name:'plains-boss',group:'plains',mastery:{clearing:4,plains:6,forest:3},plus:1,kit:'plains',weapon:'flash-rapier',abilities:['sweep'],guards:['second-wind'],boss:true},
      {name:'developed-mountain',group:'mountain',mastery:{plains:4,forest:4,swamp:4,mountain:5,cave:5},plus:3,kit:'mountain',weapon:'chaotic-axe',abilities:['sweep'],guards:['brace'],boss:false},
      {name:'developed-cave',group:'cave',mastery:{plains:4,forest:4,swamp:4,mountain:5,cave:5},plus:3,kit:'mountain',weapon:'chaotic-axe',abilities:['sweep'],guards:['brace'],boss:false},
      {name:'mountain-boss',group:'mountain',mastery:{plains:6,forest:6,swamp:6,mountain:6,cave:6},plus:5,kit:'mountain',weapon:'chaotic-axe',abilities:['sweep'],guards:['brace'],boss:true},
    ];
    for(const x of contexts) {
      const nodeId=x.boss?[...DUNGEON_DEFS.values()].find(d=>d.biomeTier===1&&NODE_BIOMES[d.nodeId].biomeGroup===x.group)!.nodeId:`node-t1-${x.group}-03`;
      const mastery:Record<string,number>=Object.fromEntries(Object.entries(x.mastery).filter(([,v])=>v!==undefined)) as Record<string,number>;
      const gm=globalMastery(mastery), id=x.name;
      cells.push({id,className:'conduit',tier:1,role:x.boss?'boss':'farm',isDungeon:x.boss,nodeId,alternate:false,upgradeLevel:x.plus,stance:null,
        progressionSnapshot:{id,tier:1,mastery,gm,rp:runeBudgetForGlobalMastery(gm),plus:x.plus},
        abilities:{techniques:x.abilities,guards:x.guards},
        runeRules:[{conditionId:'always',actionId:'auto-path-enemy'},{conditionId:'always',actionId:'wait-for-regen'},
          {conditionId:'always',actionId:'wait-for-summons'},
          ...(x.plus>=3?[{conditionId:'inside-telegraph',actionId:'step-back'},{conditionId:'always',actionId:'avoid-hazards'}]:[])],
        build:{id,classRoot:'summoner-root',skillPath:['summoner-root'],contentTier:1,playerTier:1,gearTier:1,
          gearItemIds:{weapon:x.weapon,armor:`${x.kit}-vest-t1`,recovery:`${x.kit}-charm-t1`,mobility:`${x.kit}-boots-t1`}}});
    }
  } else {
    const tier=Number(stage.slice(1));
    cells=BREADTH_CELLS.filter(c=>c.tier===tier&&c.className==='conduit'&&c.playerTreatment==='untreated').map(c=>structuredClone(c));
    // Include the earlier developed-Cave concern and a second ordinary biome per frame.
    if(tier===2)for(const c of [...cells].filter(c=>c.role==='farm'))for(const group of ['cave','jungle','desert']) {
      const d=structuredClone(c);d.id+='-'+group;d.nodeId=`node-t2-${group}-03`;cells.push(d);
    }
    if(tier===3)for(const c of [...cells].filter(c=>c.role==='farm'&&!c.id.includes('-far-'))) {
      const d=structuredClone(c);d.id+='-tundra';d.nodeId='node-t3-tundra-03';cells.push(d);
    }
  }
  const cases:Case[]=cells.flatMap(cell=>[101009,101033].flatMap(seed=>arms.map(arm=>({id:`${cell.id}-${seed}-${arm}`,arm,seed,cell,durationMs:300000}))));
  mkdirSync(path,{recursive:true});
  write(join(path,'manifest.json'),{stage,out:path,hitboxes:'D:/mmo-idle/volcano-heat-management-01/hitboxes.json',dtMs:100,synthetic:true,economyEligible:false,
    treatmentNotes:'Process-local constants only. HP arms multiply formation HP by the named percentage and divide the 0.30 replacement ratio by that multiplier; rounding can change a payment by 1 HP. tax15 halves payment. No timer changes; ready.json records the resolved profile.',cases});
  console.log(JSON.stringify({stage,cases:cases.length}));process.exit(0);
}
assert(mode==='run'||mode==='qualify');
const manifest:Manifest=JSON.parse(readFileSync(path,'utf8')),spec=manifest.cases[Number(argument)];assert(spec);
const out=join(manifest.out,spec.id);mkdirSync(out);
assert(hydrateHitboxCacheFromArtifact(manifest.hitboxes)>0);
// Every observation gets a new OS process; these mutations never reach gameplay source.
if(spec.arm==='tax15'||spec.arm==='combined')Object.assign(SUMMONER_CORE_TUNING,{reconstructionHpCostRatio:0.15});
if(spec.arm==='tax0')Object.assign(SUMMONER_CORE_TUNING,{reconstructionHpCostRatio:0});
if(['hp25','hp50','hp100','combined'].includes(spec.arm)) {
  const hpMult=spec.arm==='hp100'?2:spec.arm==='hp50'?1.5:1.25;
  for(const frame of Object.values(SUMMONER_FRAME_TUNING))frame.totalSummonHpPct*=hpMult;
  Object.assign(SUMMONER_CORE_TUNING,{reconstructionHpCostRatio:(spec.arm==='combined'?0.15:0.3)/hpMult});
}
let rng=spec.seed>>>0;
Math.random=()=>{rng+=0x6D2B79F5;let t=rng;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
let now=1800000000000;Date.now=()=>now;
const cell=structuredClone(spec.cell),world=createFarmWorld();
setupArena(world,{nodeId:cell.nodeId,biomeGroup:NODE_BIOMES[cell.nodeId].biomeGroup,contentTier:cell.tier,isDungeon:!!cell.isDungeon});
let pos={...BOT_SPAWN};
if(!cell.isDungeon) {
  const half=navigationBodyHalfExtents('player'),shapes=buildNavGrid(cell.nodeId,'player',half).shapes;
  let found=false;
  for(let r=0;r<1800&&!found;r+=100)for(const [dx,dy]of [[0,r],[r,0],[0,-r],[-r,0]]) {
    const p={x:2400+dx,y:2400+dy};if(!moverOverlapsBlockShapes(p,shapes,half)){pos=p;found=true;break;}
  }
  assert(found);
} else {
  world.suppressRepopulation=true;ensureDungeon(world,cell.nodeId);
  const state=world.dungeons.get(cell.nodeId)!;assert(state);
  for(const id of state.guardianIds)world.removeMonsterEntity(id);
  state.guardianIds=[];state.guardiansEngaged=true;state.status='bossAwakening';state.bossAwakensAtMs=-1;
}
const {bot,view}=prepareSurveyBot(world,cell,pos);world.fixedBiomeMasteryPlayers.add(bot.isPlayer.id);
if(cell.isDungeon)tickDungeons(world,now);
const initial=[...world.monsterEntitiesInNode(cell.nodeId)].map(m=>({id:m.entityId,type:m.isMonster.monsterTypeId,hp:m.hasHealth.hp,pos:m.hasPosition.current}));
assert(initial.length);assertFastPassHitboxes([bot,...world.monsterEntitiesInNode(cell.nodeId)]);
const bossType=cell.isDungeon?[...DUNGEON_DEFS.values()].find(d=>d.nodeId===cell.nodeId)?.boss.bossId:undefined;
const bossId=cell.isDungeon?initial.find(m=>m.type===bossType)?.id:undefined;
if(cell.isDungeon)assert(bossId,'Actual boss must exist');
const recorder=new ConduitRecorder(world,bot,'untreated');
write(join(out,'ready.json'),{spec,sharedEntry:require.resolve('@mmo-idle/shared'),package:fastPassReadback(cell,bot,view.globalMastery),view,initial,
  profile:recorder.profileReceipt(),geometryHash:sha(initial),ownerHash:sha({skills:bot.usesSkills,health:bot.hasHealth,mitigation:bot.mitigatesDamage}),bossId,bossType});
if(mode==='qualify'){console.log(spec.id+' qualified');process.exit(0);}
const progress=new EnduranceProgress(bot.isPlayer.id);let elapsed=0,outcome='window-ended',bossKilled=false;
const endpoints:unknown[]=[],events:unknown[]=[],incoming:Record<string,number>={};
world.worldLogJournal=[];world.worldLogByPlayer.clear();world.takeNodeEvents(cell.nodeId);
const wallStart=performance.now();
for(;elapsed<spec.durationMs;elapsed+=100) {
  if(performance.now()-wallStart>120000){outcome='wall-ceiling';break;}
  now=1800000000000+elapsed;recorder.beforeTick(elapsed,100,now);world.tick(100,now);recorder.afterTick();
  for(const e of world.worldLogJournal) {
    progress.ingest(e,elapsed+100);
    if(e.kind==='damage'&&e.target.id===bot.isPlayer.id)incoming[e.source.name]=(incoming[e.source.name]??0)+e.hpDamage;
    if(e.kind==='kill'&&e.victim.id===bossId)bossKilled=true;
    events.push({tickStartMs:elapsed,tickEndMs:elapsed+100,event:e});
  }
  world.worldLogJournal=[];world.worldLogByPlayer.clear();world.takeNodeEvents(cell.nodeId);
  if((elapsed+100)%60000===0)endpoints.push({atMs:elapsed+100,hp:bot.hasHealth.hp,work:progress.snapshot(elapsed+100)});
  if(bot.isDead||bot.hasHealth.hp<=0){outcome='player-died';elapsed+=100;break;}
  if(bossKilled){outcome='boss-killed';elapsed+=100;break;}
}
const conduit=recorder.finish(outcome);write(join(out,'conduit.json'),conduit);
writeFileSync(join(out,'events.jsonl'),events.map(e=>JSON.stringify(e)).join('\n')+'\n');
const result={id:spec.id,arm:spec.arm,seed:spec.seed,caseId:cell.id,tier:cell.tier,nodeId:cell.nodeId,role:cell.role,
  outcome,elapsedMs:elapsed,kills:progress.kills,work:progress.snapshot(elapsed),endpoints,incoming,bossKilled,bossId,bossType,
  terminalHp:bot.hasHealth.hp,maxHp:bot.hasHealth.maxHp,wallMs:performance.now()-wallStart,
  availability:conduit.liveAuthoredOffenseFraction,zeroSummonsMs:conduit.zeroSummonsMs,blockedMs:conduit.readyHpBlockedMs,
  replacements:conduit.successfulReplacements,hpPaid:conduit.totalHpPaid,queueHeal:conduit.queueScopedHealingHp,
  meanQueue:conduit.meanQueueDepth,removals:conduit.lives.filter(l=>l.endAtMs!==null).length};
write(join(out,'result.json'),result);console.log(JSON.stringify(result));process.exit(0);
