import { FAST_PASS_BLOCKS, FAST_PASS_SEED, fastPassReadback, assertFastPassDefinitions, assertFastPassHitboxes } from '../bench/balance/playerFastPassSpec';
import {profileNavigationObservation,recordNavigationTick} from '../bench/balance/navigationObservation';
import {DURABILITY37_BLOCKS,DURABILITY37_INTEGRATION_SEEDS,DURABILITY37_LADDER_SEEDS,installDurability37Treatment,assertDurability37Definitions,durability37WindowMs} from '../bench/balance/durability37Spec';
import {DURABILITY36_BLOCKS,DURABILITY36_ARMOR_SEEDS,DURABILITY36_LADDER_SEEDS,installDurability36Treatment,assertDurability36Definitions} from '../bench/balance/durability36Spec';
import {DURABILITY35_BLOCKS,DURABILITY35_SEEDS,installDurability35Treatment,assertDurability35Definitions} from '../bench/balance/durability35Spec';
import {DURABILITY34_BLOCKS,DURABILITY34_JUNGLE_SEEDS,DURABILITY34_MOUNTAIN_SEEDS,installDurability34Treatment,assertDurability34Definitions} from '../bench/balance/durability34Spec';
import {DURABILITY33_BLOCKS,DURABILITY33_REPAIR_SEEDS,DURABILITY33_BREADTH_SEEDS,DURABILITY33_ENTRY_SEEDS,installDurability33Treatment,assertDurability33Definitions} from '../bench/balance/durability33Spec';
import {DURABILITY32_BLOCKS,DURABILITY32_SEEDS,DURABILITY32_REPAIR_SEEDS,installDurability32Treatment,assertDurability32Definitions} from '../bench/balance/durability32Spec';
import {DURABILITY30_BLOCKS,DURABILITY30_SEEDS,DURABILITY30_JUNGLE_SEEDS,installDurability30Treatment} from '../bench/balance/durability30Spec';
import {DURABILITY29_BLOCKS,DURABILITY29_SEEDS,installDurability29Treatment} from '../bench/balance/durability29Spec';
import {DURABILITY28_BLOCKS,DURABILITY28_SEEDS,installDurability28Treatment} from '../bench/balance/durability28Spec';
import {DURABILITY27_BLOCKS,DURABILITY27_SEEDS,installDurability27Treatment} from '../bench/balance/durability27Spec';
import {DURABILITY26_BLOCKS,DURABILITY26_SEEDS,installDurability26Treatment} from '../bench/balance/durability26Spec';
import {DURABILITY25_BLOCKS,DURABILITY25_SEEDS,installDurability25Treatment} from '../bench/balance/durability25Spec';
import {DURABILITY24_BLOCKS,DURABILITY24_SEEDS,installDurability24Treatment} from '../bench/balance/durability24Spec';
import {DURABILITY23_BLOCKS,DURABILITY23_SEEDS,installDurability23Treatment} from '../bench/balance/durability23Spec';
import {DURABILITY22_BLOCKS,DURABILITY22_SEEDS,installDurability22Treatment} from '../bench/balance/durability22Spec';
import {DURABILITY21_BLOCKS,DURABILITY21_SEEDS} from '../bench/balance/durability21Spec';
import { NIGHT5_BLOCKS,NIGHT5_SEEDS,installNight5Treatment,type Night5Cell } from '../bench/balance/night5Spec';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { NODE_BIOMES, MONSTER_DATABASE, composePlayerView, buildNavGrid, moverOverlapsBlockShapes, navigationBodyHalfExtents, getString } from '@mmo-idle/shared';
import { createFarmWorld } from '../bench/balance/worldFactory';
import { setupArena, teardownArena } from '../bench/balance/arena';
import { SURVEY_CELLS,SURVEY_SEEDS,prepareSurveyBot,type SurveyCell } from '../bench/balance/ttkSurveySpec';
import { SurveyMetrics } from '../bench/balance/ttkSurveyMetrics';
import { hydrateHitboxCacheFromArtifact } from '../src/hitbox/cache';
import { checkpointDefinitionsHash } from '../src/admin/progressionCheckpoint';
import { DURABILITY_CELLS, installDurabilityTreatment, type DurabilityCell } from '../bench/balance/durabilityTrialSpec';
import { activePlayerDamageFeatures, playerInFeatureContact } from '../src/systems/world/nodeFeatures';
import { DURABILITY2_CELLS, installDurability2Treatment, type Durability2Cell } from '../bench/balance/durability2Spec';
import { DURABILITY3_CELLS, installDurability3Treatment, type Durability3Cell } from '../bench/balance/durability3Spec';
import { DURABILITY4_CELLS, DURABILITY4_SEEDS, installDurability4Treatment, type Durability4Cell } from '../bench/balance/durability4Spec';
import { DURABILITY5_CELLS, DURABILITY5_SEEDS, assertDurability5Definitions } from '../bench/balance/durability5Spec';

import { DURABILITY6_CELLS, installDurability6Treatment, assertDurability6Definitions, type Durability6Cell } from '../bench/balance/durability6Spec';

import { DURABILITY7_CELLS, DURABILITY7_SEEDS, installDurability7Treatment, assertDurability7Definitions, type Durability7Cell } from '../bench/balance/durability7Spec';

import { DURABILITY8_CELLS, installDurability8Treatment, type Durability8Cell } from '../bench/balance/durability8Spec';

import { NIGHT4_SURVEY, NIGHT4_AOE, NIGHT4_FOLLOWUP, installNight4Treatment, type Night4Followup } from '../bench/balance/night4Spec';

import { DURABILITY9_ROSTER, DURABILITY9_BEAR, installDurability9Treatment, assertDurability9Definitions, type Durability9Cell } from '../bench/balance/durability9Spec';

import { DURABILITY10_SWAMP, DURABILITY10_JUNGLE, installDurability10Treatment, type Durability10Cell } from '../bench/balance/durability10Spec';

import { DURABILITY11_CELLS, DURABILITY11_SEEDS, assertDurability11Definitions } from '../bench/balance/durability11Spec';

import { DURABILITY12_MOVEMENT, DURABILITY12_SWARM, DURABILITY12_MOVEMENT_SEEDS, DURABILITY12_SEEDS } from '../bench/balance/durability12Spec';
import { DURABILITY13_MOVEMENT, DURABILITY13_SWARM, DURABILITY13_MOVEMENT_SEEDS, DURABILITY13_SWARM_SEEDS } from '../bench/balance/durability13Spec';
import { DURABILITY15_CELLS, DURABILITY15_SEEDS, installDurability15Treatment, assertDurability15Definitions, type Durability15Cell } from '../bench/balance/durability15Spec';
import { DURABILITY16_CELLS, DURABILITY16_SEEDS, installDurability16Treatment, assertDurability16Definitions, type Durability16Cell } from '../bench/balance/durability16Spec';
import { DURABILITY17_CELLS, DURABILITY17_SEEDS, installDurability17Treatment, assertDurability17Definitions, type Durability17Cell } from '../bench/balance/durability17Spec';
import { DURABILITY18_CELLS, DURABILITY18_SEEDS, installDurability18Treatment, assertDurability18Definitions, type Durability18Cell } from '../bench/balance/durability18Spec';
import { DURABILITY19_CELLS, DURABILITY19_SEEDS, installDurability19Treatment, assertDurability19Definitions, type Durability19Cell } from '../bench/balance/durability19Spec';
import { DURABILITY20_CELLS, DURABILITY20_SEEDS, installDurability20Treatment, assertDurability20Definitions, type Durability20Cell } from '../bench/balance/durability20Spec';
import { getAutoTargetId } from '../src/systems/combat/ai/targetPriority';

const args=Object.fromEntries(process.argv.slice(2).map(x=>{const i=x.indexOf('=');return i<0?[x.replace(/^--/,''),'true']:[x.slice(2,i),x.slice(i+1)];}));
const fastPass = args.trial === 'player-fast-pass';
const fastBlock = fastPass ? FAST_PASS_BLOCKS[args.block] : undefined;
if (fastPass) { assert(fastBlock && args.block.endsWith('-farm'), 'Unknown farm block'); assertFastPassDefinitions(); }
const night5=args.trial==='durability37'?DURABILITY37_BLOCKS[args.block]:args.trial==='durability36'?DURABILITY36_BLOCKS[args.block]:args.trial==='durability35'?DURABILITY35_BLOCKS[args.block]:args.trial==='durability34'?DURABILITY34_BLOCKS[args.block]:args.trial==='durability33'?DURABILITY33_BLOCKS[args.block]:args.trial==='durability32'?DURABILITY32_BLOCKS[args.block]:args.trial==='durability30'?DURABILITY30_BLOCKS[args.block]:args.trial==='durability29'?DURABILITY29_BLOCKS[args.block]:args.trial==='durability28'?DURABILITY28_BLOCKS[args.block]:args.trial==='durability27'?DURABILITY27_BLOCKS[args.block]:args.trial==='durability26'?DURABILITY26_BLOCKS[args.block]:args.trial==='durability25'?DURABILITY25_BLOCKS[args.block]:args.trial==='durability24'?DURABILITY24_BLOCKS[args.block as keyof typeof DURABILITY24_BLOCKS]:args.trial==='durability23'?DURABILITY23_BLOCKS[args.block]:args.trial==='durability22'?DURABILITY22_BLOCKS[args.block]:args.trial==='durability21'?DURABILITY21_BLOCKS[args.block]:args.trial==='night5'?NIGHT5_BLOCKS[args.block]:undefined;
if(['night5','durability21','durability22','durability23','durability24','durability25','durability26','durability27','durability28','durability29','durability30','durability32','durability33','durability34','durability35','durability36','durability37'].includes(args.trial)) assert(night5,'Unknown night5 block');
const mode=args.mode??'qualify'; assert(['qualify','pilot','run'].includes(mode));
assert(!args.trial || fastPass || ['durability37','durability36','durability35','durability34','durability33','durability32','durability30','durability29','durability28','durability27','durability26','durability25','durability24','durability23','durability22','durability21','night5','durability20','durability19','durability18','durability17','durability16','durability15','durability13movement','durability13swarm','durability12movement','durability12swarm','durability11','durability10swamp','durability10jungle','durability9roster','durability9bear','durability','durability2','durability3','durability4','durability5','durability6','durability7','durability8','night4survey','night4followup','night4aoe'].includes(args.trial));
const trialCells = fastBlock ? fastBlock.cells : night5 ? night5.cells : args.trial === 'durability20' ? DURABILITY20_CELLS : args.trial === 'durability19' ? DURABILITY19_CELLS : args.trial === 'durability18' ? DURABILITY18_CELLS : args.trial === 'durability17' ? DURABILITY17_CELLS : args.trial === 'durability16' ? DURABILITY16_CELLS : args.trial === 'durability15' ? DURABILITY15_CELLS : args.trial === 'durability13movement' ? DURABILITY13_MOVEMENT : args.trial === 'durability13swarm' ? DURABILITY13_SWARM : args.trial === 'durability12movement' ? DURABILITY12_MOVEMENT : args.trial === 'durability12swarm' ? DURABILITY12_SWARM : args.trial === 'durability11' ? DURABILITY11_CELLS : args.trial === 'durability10swamp' ? DURABILITY10_SWAMP : args.trial === 'durability10jungle' ? DURABILITY10_JUNGLE : args.trial === 'durability9roster' ? DURABILITY9_ROSTER : args.trial === 'durability9bear' ? DURABILITY9_BEAR : args.trial === 'night4survey' ? NIGHT4_SURVEY : args.trial === 'night4followup' ? NIGHT4_FOLLOWUP : args.trial === 'night4aoe' ? NIGHT4_AOE : args.trial === 'durability8' ? DURABILITY8_CELLS : args.trial === 'durability7' ? DURABILITY7_CELLS : args.trial === 'durability6' ? DURABILITY6_CELLS : args.trial === 'durability5' ? DURABILITY5_CELLS : args.trial === 'durability4' ? DURABILITY4_CELLS : args.trial === 'durability3' ? DURABILITY3_CELLS : args.trial === 'durability2' ? DURABILITY2_CELLS : args.trial === 'durability' ? DURABILITY_CELLS : SURVEY_CELLS;
const trialSeeds=fastPass?[FAST_PASS_SEED]:args.trial==='durability37'?(args.block==='mob-integration'?DURABILITY37_INTEGRATION_SEEDS:DURABILITY37_LADDER_SEEDS):args.trial==='durability36'?(args.block==='mountain-armor'?DURABILITY36_ARMOR_SEEDS:DURABILITY36_LADDER_SEEDS):args.trial==='durability35'?DURABILITY35_SEEDS:args.trial==='durability34'?(args.block==='mountain-guard'?DURABILITY34_MOUNTAIN_SEEDS:DURABILITY34_JUNGLE_SEEDS):args.trial==='durability33'?(args.block==='jungle-repair'?DURABILITY33_REPAIR_SEEDS:args.block==='mountain-entry'?DURABILITY33_ENTRY_SEEDS:DURABILITY33_BREADTH_SEEDS):args.trial==='durability32'?(args.block==='jungle-repair'?DURABILITY32_REPAIR_SEEDS:DURABILITY32_SEEDS):args.trial==='durability30'?(args.block==='jungle'?DURABILITY30_JUNGLE_SEEDS:DURABILITY30_SEEDS):args.trial==='durability29'?DURABILITY29_SEEDS:args.trial==='durability28'?DURABILITY28_SEEDS:args.trial==='durability27'?DURABILITY27_SEEDS:args.trial==='durability26'?DURABILITY26_SEEDS:args.trial==='durability25'?DURABILITY25_SEEDS:args.trial==='durability24'?DURABILITY24_SEEDS:args.trial==='durability23'?DURABILITY23_SEEDS:args.trial==='durability22'?DURABILITY22_SEEDS:args.trial==='durability21'?DURABILITY21_SEEDS:night5?NIGHT5_SEEDS:args.trial==='durability20'?DURABILITY20_SEEDS:args.trial==='durability19'?DURABILITY19_SEEDS:args.trial==='durability18'?DURABILITY18_SEEDS:args.trial==='durability17'?DURABILITY17_SEEDS:args.trial==='durability16'?DURABILITY16_SEEDS:args.trial==='durability15'?DURABILITY15_SEEDS:args.trial==='durability13movement'?DURABILITY13_MOVEMENT_SEEDS:args.trial==='durability13swarm'?DURABILITY13_SWARM_SEEDS:args.trial==='durability12movement'?DURABILITY12_MOVEMENT_SEEDS:args.trial==='durability12swarm'?DURABILITY12_SEEDS:args.trial==='durability11'?DURABILITY11_SEEDS:args.trial==='durability7'?DURABILITY7_SEEDS:args.trial==='durability5'?DURABILITY5_SEEDS:args.trial==='durability4'?DURABILITY4_SEEDS:SURVEY_SEEDS;
if(args.trial==='durability37') assertDurability37Definitions();
if(args.trial==='durability36') assertDurability36Definitions();
if(args.trial==='durability35') assertDurability35Definitions();
if(args.trial==='durability34') assertDurability34Definitions();
if(args.trial==='durability33') assertDurability33Definitions();
if(args.trial==='durability32') assertDurability32Definitions();
if(args.trial==='durability5') assertDurability5Definitions();
if(args.trial==='durability20') assertDurability20Definitions();
if(args.trial==='durability19') assertDurability19Definitions();
if(args.trial==='durability18') assertDurability18Definitions();
if(args.trial==='durability17') assertDurability17Definitions();
if(args.trial==='durability16') assertDurability16Definitions();
if(args.trial==='durability15') assertDurability15Definitions();
if(args.trial==='durability6') assertDurability6Definitions();
if(args.trial==='durability7') assertDurability7Definitions();
if(args.trial?.startsWith('durability9')) assertDurability9Definitions();
if(args.trial==='durability11') assertDurability11Definitions();
const out=resolve(args.out??'');assert(args.out&&!existsSync(out),'NEW output directory required');
assert(args.hitboxes && hydrateHitboxCacheFromArtifact(args.hitboxes)>0,'Frozen hitbox artifact required; no square-hitbox fallback');
const sha=(s:string|Buffer)=>createHash('sha256').update(s).digest('hex');
const revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(args.revision) assert.equal(revision,args.revision,'Wrong frozen checkout');
mkdirSync(out,{recursive:true});
const manifest={schema:1,mode,revision,navigationDiagnostics:args['navigation-diagnostics']==='true',definitionsHash:checkpointDefinitionsHash(),hitboxesSha256:sha(readFileSync(args.hitboxes)),
  sampleEveryMs:args.trial==='durability12movement'||args.trial==='durability13movement'?100:1000,block:args.block,trial:args.trial??'ttk-survey',synthetic:true,economyEligible:false,dtMs:100,durationMs:mode==='pilot'?30000:night5?.durationMs??300000,seeds:trialSeeds,cells:trialCells};
writeFileSync(join(out,'manifest.json'),JSON.stringify(manifest,null,2));
const realNow=Date.now,realRandom=Math.random;
function safeSpawn(node:string) {
  const half=navigationBodyHalfExtents('player'),shapes=buildNavGrid(node,'player',half).shapes;
  for(let r=0;r<1800;r+=100) for(const [dx,dy] of [[0,r],[r,0],[0,-r],[-r,0]]) {
    const p={x:2400+dx,y:2400+dy};if(!moverOverlapsBlockShapes(p,shapes,half)) return p;
  }
  throw Error('No safe spawn '+node);
}
function run(cell:SurveyCell,seed:number) {
  let randomState=seed,now=1800000000000;
  Math.random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
  Date.now=()=>now;
  const world=createFarmWorld();
  const overlay = args.trial==='durability37'?installDurability37Treatment(cell as Night5Cell):args.trial==='durability36'?installDurability36Treatment(cell as Night5Cell):args.trial==='durability35'?installDurability35Treatment(cell as Night5Cell):args.trial==='durability34'?installDurability34Treatment(cell as Night5Cell):args.trial==='durability33'?installDurability33Treatment(cell as Night5Cell):args.trial==='durability32'?installDurability32Treatment(cell as Night5Cell):args.trial==='durability30'?installDurability30Treatment(cell as Night5Cell):args.trial==='durability29'?installDurability29Treatment(cell as Night5Cell):args.trial==='durability28'?installDurability28Treatment(cell as Night5Cell):args.trial==='durability27'?installDurability27Treatment(cell as Night5Cell):args.trial==='durability26'?installDurability26Treatment(cell as Night5Cell):args.trial==='durability25'?installDurability25Treatment(cell as Night5Cell):args.trial==='durability24'?installDurability24Treatment(cell as Night5Cell):args.trial==='durability23'?installDurability23Treatment(cell as Night5Cell):args.trial==='durability22'?installDurability22Treatment(cell as Night5Cell):night5 ? installNight5Treatment(cell as Night5Cell) : args.trial==='durability20' ? installDurability20Treatment(cell as Durability20Cell) : args.trial==='durability19' ? installDurability19Treatment(cell as Durability19Cell) : args.trial==='durability18' ? installDurability18Treatment(cell as Durability18Cell) : args.trial==='durability17' ? installDurability17Treatment(cell as Durability17Cell) : args.trial==='durability16' ? installDurability16Treatment(cell as Durability16Cell) : args.trial==='durability15' ? installDurability15Treatment(cell as Durability15Cell) : args.trial?.startsWith('durability10') ? installDurability10Treatment(cell as Durability10Cell) : args.trial?.startsWith('durability9') ? installDurability9Treatment(cell as Durability9Cell) : args.trial === 'night4followup' ? installNight4Treatment(cell as Night4Followup) : args.trial === 'durability8' ? installDurability8Treatment(cell as Durability8Cell) : args.trial === 'durability7' ? installDurability7Treatment(cell as Durability7Cell) : args.trial === 'durability6' ? installDurability6Treatment(cell as Durability6Cell) : args.trial === 'durability4' ? installDurability4Treatment(cell as Durability4Cell) : args.trial === 'durability3' ? installDurability3Treatment(cell as Durability3Cell) : args.trial === 'durability2' ? installDurability2Treatment(cell as Durability2Cell) : args.trial === 'durability' ? installDurabilityTreatment(cell as DurabilityCell) : null;
  try {
    const target={nodeId:cell.nodeId,biomeGroup:NODE_BIOMES[cell.nodeId].biomeGroup,contentTier:cell.tier,isDungeon:false};
    setupArena(world,target);
    const {bot,view}=prepareSurveyBot(world,cell,safeSpawn(cell.nodeId));
    const roster=()=>[...world.monsterEntitiesInNode(cell.nodeId)].map(m=>({id:m.entityId,type:m.isMonster.monsterTypeId,hp:m.hasHealth.hp,maxHp:m.hasHealth.maxHp,pos:{...m.hasPosition.current}}));
    if(fastPass) assertFastPassHitboxes([bot, ...world.monsterEntitiesInNode(cell.nodeId)]);
    const initial=roster(); assert(initial.length>0,'Empty initial population');
    const ready={cell:cell.id,seed,synthetic:true,view,
      ...(fastPass ? {packageReadback:fastPassReadback(cell,bot,view.globalMastery), definitionsIdentity:{base:manifest.definitionsHash,live:checkpointDefinitionsHash(),treated:false}} : {}),initialRoster:initial,initialRosterHash:sha(JSON.stringify(initial)),
      geometryRosterHash:sha(JSON.stringify(initial.map(({hp,maxHp,...r})=>r))),
      hpTreatment:overlay?.changes.filter(c=>initial.some(m=>m.type===c.type))??[],
      initialStats:[...world.monsterEntitiesInNode(cell.nodeId)].map(m=>({id:m.entityId,type:m.isMonster.monsterTypeId,attack:m.dealsDamage.attack,plating:m.mitigatesDamage.plating,dr:m.mitigatesDamage.damageReduction}))};
    if(args.trial==='durability5') assertDurability5Definitions();
    if(['durability2','durability3','durability4','durability5','durability6','durability7'].includes(args.trial)) assert(initial.some(m=>m.type===(cell as Durability2Cell).eliteType),'Missing target elite');
    if(args.trial==='durability8'||args.trial==='night4followup') for(const type of (cell as Durability8Cell).targetTypes) assert(initial.some(m=>m.type===type), 'Missing target '+type);
    if(args.trial?.startsWith('durability9')) for(const type of (cell as Durability9Cell).targetTypes) assert(initial.some(m=>m.type===type), 'Missing target '+type);
    if(args.trial?.startsWith('durability10')) for(const type of (cell as Durability10Cell).targetTypes) assert(initial.some(m=>m.type===type),'Missing target '+type);
    if(args.trial==='durability15'||args.trial==='durability16') for(const type of (cell as Durability15Cell).targetTypes) assert(initial.some(m=>m.type===type),'Missing target '+type);
    if(args.trial==='durability20') for(const type of (cell as Durability20Cell).targetTypes) assert(initial.some(m=>m.type===type),'Missing target '+type);
    if(args.trial==='durability37'||args.trial==='durability36'||args.trial==='durability35'||args.trial==='durability34'||args.trial==='durability33'||args.trial==='durability32') for(const type of (cell as Night5Cell).targetTypes) assert(initial.some(m=>m.type===type),'Missing target '+type);
    if(args.trial==='durability19') for(const type of (cell as Durability19Cell).targetTypes) assert(initial.some(m=>m.type===type),'Missing target '+type);
    if(args.trial==='durability18') for(const type of (cell as Durability18Cell).targetTypes) assert(initial.some(m=>m.type===type),'Missing target '+type);
    if(args.trial==='durability17') for(const type of (cell as Durability17Cell).targetTypes) assert(initial.some(m=>m.type===type),'Missing target '+type);
    if(args.trial==='durability11') for(const type of (cell as typeof DURABILITY11_CELLS[number]).targetTypes) assert(initial.some(m=>m.type===type),'Missing target '+type);
    if(mode==='qualify') return ready;
    const dir=join(out,cell.id+'-s'+seed);mkdirSync(dir);
    writeFileSync(join(dir,'ready.json'),JSON.stringify(ready,null,2));
    const metrics=new SurveyMetrics(bot.isPlayer.id);
    const register=()=>{for(const m of world.monsterEntitiesInNode(cell.nodeId)) metrics.register(m.entityId,m.isMonster.monsterTypeId,MONSTER_DATABASE.get(m.isMonster.monsterTypeId)?.name??m.isMonster.monsterTypeId,m.hasHealth.maxHp);};
    register(); const log:unknown[]=[],samples:unknown[]=[];const lastHp=new Map<string,number>();
    const minionLastAttack = new Map<string,number>(); let minionAttackBeats=0;
    // Durability37's integration block mixes families with different windows, so the
    // window is resolved PER CELL there and falls back to the block duration elsewhere.
    const windowMs=args.trial==='durability37'&&mode!=='pilot'?durability37WindowMs(cell as Night5Cell):manifest.durationMs;
    let elapsed=0,outcome='window-ended',minHp=1,attackBeats=0,lastAttack=0;
    let maxTickWallMs=0;
    const wallStart=realNow();
    world.worldLogJournal=[];world.worldLogByPlayer.clear();world.takeNodeEvents(cell.nodeId);
    for(;elapsed<windowMs;elapsed+=100) {
      if(realNow()-wallStart>120000) {outcome='wall-ceiling';break;}
      now=1800000000000+elapsed; register();
      const tickWallStart=realNow();world.tick(100,now);maxTickWallMs=Math.max(maxTickWallMs,realNow()-tickWallStart);recordNavigationTick(elapsed,realNow()-tickWallStart);
      for(const m of world.monsterEntitiesInNode(cell.nodeId)) {
        const previous=lastHp.get(m.entityId);
        if(previous!==undefined && m.hasHealth.hp>previous+0.001) {const t=metrics.targets.get(m.entityId);if(t&&t.firstDamageMs!==null)t.hpRegainObserved=true;}
        lastHp.set(m.entityId,m.hasHealth.hp);
        if(m.hasAttackTarget?.targetId===bot.isPlayer.id) metrics.touch(m.entityId,elapsed);
      }
      for(const e of world.worldLogJournal) {metrics.ingest(e,elapsed);log.push({atMs:elapsed,event:e});}
      world.worldLogJournal=[];world.worldLogByPlayer.clear();
      for(const e of world.takeNodeEvents(cell.nodeId)) if(e.kind==='monster-cast-start'||e.kind==='monster-cast-end') {
        const t=metrics.targets.get(e.monsterId);if(t) {if(e.kind==='monster-cast-start')t.castsStarted++;else if(e.fired)t.castsFired++;}
        log.push({atMs:elapsed,event:e});
      }
      const v=composePlayerView(bot)!;minHp=Math.min(minHp,v.hp/v.maxHp);
      if(v.lastAttackAt!==lastAttack) {attackBeats++;lastAttack=v.lastAttackAt;}
      for(const minion of world.minionEntities) {
        if(minion.isMinion.ownerPlayerId!==bot.isPlayer.id) continue;
        const last=minionLastAttack.get(minion.entityId)??0;
        if(minion.performsAttack.lastAttackAt!==last) minionAttackBeats++;
        minionLastAttack.set(minion.entityId,minion.performsAttack.lastAttackAt);
      }
      metrics.closeIfCleared(elapsed);
      metrics.sampleRecovery(elapsed,v.hp>=v.maxHp&&v.barrier>=v.barrierMax&&v.incomingDot===0);
      if(elapsed%manifest.sampleEveryMs===0) samples.push({atMs:elapsed,hp:v.hp,barrier:v.barrier,incomingDot:v.incomingDot,target:v.attackTargetId,lastAttackAt:v.lastAttackAt,autoIntent:v.autoIntent,pos:v.pos,
        summonSlots:v.summonSlots, minions:[...world.minionEntities].filter(m=>m.isMinion.ownerPlayerId===bot.isPlayer.id).map(m=>({id:m.entityId,hp:m.hasHealth.hp,maxHp:m.hasHealth.maxHp,pos:{...m.hasPosition.current},target:m.controlsMinion.currentTargetId,lastAttackAt:m.performsAttack.lastAttackAt})),
        staticDamageContacts:activePlayerDamageFeatures(world,cell.nodeId).filter(f=>playerInFeatureContact(bot.hasPosition.current,f)).map(f=>({id:f.id,effect:f.damage?.effectId})),
        lastOutgoingDamageMs:Math.max(0,...[...metrics.targets.values()].map(t=>t.lastDamageMs??0)), blockedApproach:getString(bot.tracksCombat,'autoApproachBlocked'), selectedTargetId:getAutoTargetId(bot), motion:bot.isMoving?.motion??null, movement:bot.hasMovePath ? structuredClone(bot.hasMovePath) : null, monsters:roster().map(m=>({id:m.id,type:m.type,hp:m.hp,pos:m.pos,aggro:structuredClone(world.getMonsterEntity(m.id)?.hasAggroTarget),awareness:structuredClone(world.getMonsterEntity(m.id)?.hasAwareness)}))});
      if(bot.isDead || bot.hasHealth.hp<=0) {outcome='player-died';break;}
      world.pendingDeaths=[];
    }
    metrics.close(elapsed,outcome);
    const result={cell:cell.id,seed,outcome,elapsedMs:elapsed,windowMs,minHpFraction:minHp,attackBeats,minionAttackBeats,wallElapsedMs:realNow()-wallStart,maxTickWallMs,totalAttackBeats:attackBeats+minionAttackBeats,initialRosterHash:ready.initialRosterHash,...metrics.result()};
    writeFileSync(join(dir,'events.jsonl'),log.map(e=>JSON.stringify(e)).join('\n')+'\n');
    writeFileSync(join(dir,'samples.jsonl'),samples.map(e=>JSON.stringify(e)).join('\n')+'\n');
    writeFileSync(join(dir,'summary.json'),JSON.stringify(result,null,2));return result;
  } finally {try {teardownArena(world);} finally {overlay?.restore();Date.now=realNow;Math.random=realRandom;}}
}
async function main() {
const results:unknown[]=[];
const batchWallStart=realNow();
try {
  const pilotIds:Record<string,string[]>={
    'player-fast-pass':fastBlock?.pilotIds??[],
    night5:night5?.pilotIds??[],
    durability21:night5?.pilotIds??[],
    durability22:night5?.pilotIds??[],
    durability37:night5?.pilotIds??[], durability36:night5?.pilotIds??[], durability35:night5?.pilotIds??[], durability34:night5?.pilotIds??[], durability33:night5?.pilotIds??[], durability32:night5?.pilotIds??[], durability30:night5?.pilotIds??[], durability29:night5?.pilotIds??[], durability28:night5?.pilotIds??[], durability27:night5?.pilotIds??[], durability26:night5?.pilotIds??[], durability25:night5?.pilotIds??[], durability24:night5?.pilotIds??[], durability23:night5?.pilotIds??[],
    durability20:DURABILITY20_CELLS.filter(c=>c.nodeId.endsWith('03')&&c.className==='striker'&&((c.tier===2&&['forest','cave'].includes(c.role))||(c.tier===3&&['volcanic','tundra'].includes(c.role)))).map(c=>c.id),
    durability19:DURABILITY19_CELLS.filter(c=>c.nodeId.endsWith('03')&&c.className==='striker').map(c=>c.id),
    durability18:DURABILITY18_CELLS.filter(c=>c.className==='striker').map(c=>c.id),
    durability17:DURABILITY17_CELLS.filter(c=>c.nodeId.endsWith('05')&&c.className==='squire').map(c=>c.id),
    durability16:DURABILITY16_CELLS.filter(c=>c.nodeId.endsWith('05')&&c.className==='apprentice').map(c=>c.id),
    durability15:DURABILITY15_CELLS.filter(c=>c.nodeId.endsWith('05')&&c.className==='squire').map(c=>c.id),
    durability13movement:DURABILITY13_MOVEMENT.map(c=>c.id),
    durability13swarm:[DURABILITY13_SWARM[0].id],
    durability12movement:DURABILITY12_MOVEMENT.map(c=>c.id),
    durability12swarm:[DURABILITY12_SWARM.find(c=>c.tier===2&&c.className==='squire'&&c.technique==='slam')!.id,DURABILITY12_SWARM.find(c=>c.tier===3&&c.className==='conduit'&&c.technique==='sweep')!.id],
    durability11:[DURABILITY11_CELLS.find(c=>c.role==='tundra'&&c.className==='apprentice')!.id,DURABILITY11_CELLS.find(c=>c.role==='swamp'&&c.className==='striker')!.id,DURABILITY11_CELLS.find(c=>c.role==='jungle'&&c.className==='conduit')!.id],
    durability10swamp:[DURABILITY10_SWAMP.find(c=>c.className==='apprentice'&&c.treatment==='hp2')!.id],
    durability10jungle:[DURABILITY10_JUNGLE.find(c=>c.className==='conduit'&&c.treatment==='defensive')!.id,DURABILITY10_JUNGLE.find(c=>c.className==='conduit'&&c.treatment==='ramp25')!.id],
    durability9roster:[DURABILITY9_ROSTER.find(c=>c.role==='swamp'&&c.tier===3&&c.className==='conduit'&&c.treatment==='selected')!.id,DURABILITY9_ROSTER.find(c=>c.role==='desert'&&c.tier===2&&c.className==='striker'&&c.treatment==='previous')!.id],
    durability9bear:[DURABILITY9_BEAR.find(c=>c.className==='conduit'&&c.treatment==='bear-soft')!.id,DURABILITY9_BEAR.find(c=>c.className==='apprentice'&&c.treatment==='bear-full')!.id],
    night4survey:[NIGHT4_SURVEY[0].id,NIGHT4_SURVEY[NIGHT4_SURVEY.length-1].id],
    night4followup:[NIGHT4_FOLLOWUP[1].id,NIGHT4_FOLLOWUP[NIGHT4_FOLLOWUP.length-1].id],
    night4aoe:[NIGHT4_AOE.find(c=>c.tier===2&&c.className==='squire'&&c.technique==='slam')!.id,NIGHT4_AOE.find(c=>c.tier===3&&c.className==='conduit'&&c.technique==='slam')!.id],
    durability8:['dur8-t3-desert-squire-baseline-controller-hp3','dur8-t3-tundra-conduit-baseline-bear-hp1.5','dur8-t3-tundra-conduit-baseline-bear-hp1.5-fixed-shell'],
    durability7:['dur7-t2-conduit-small-group-baseline-control','dur7-t2-conduit-small-group-baseline-eagle-soft','dur7-t2-conduit-small-group-baseline-titan-soft'],
    durability6:['dur6-t2-conduit-small-group-baseline-previous-hp','dur6-t2-conduit-small-group-baseline-selected-hp','dur6-t3-apprentice-solo-baseline-selected-hp'],
    durability5:['dur5-t2-conduit-small-group-baseline','dur5-t3-apprentice-solo-baseline','dur5-t3-slinger-small-group-weapon-alt'],
    durability4:['dur4-t2-solo-conduit-heavy-plate8','dur4-t3-small-group-conduit-heavy-plate16','dur4-eagle-spirit-baseline-dive1.25'],
    durability3:['dur3-ttk-t2-conduit-small-group-baseline-both-soft','dur3-ttk-t3-apprentice-solo-baseline-dr','dur3-ttk-t2-slinger-solo-weapon-alt-plating'],
    durability2:['dur2-ttk-t2-slinger-solo-baseline-hp-high-soft','dur2-ttk-t3-conduit-small-group-weapon-alt-hp-high','dur2-ttk-t3-squire-solo-baseline-control'],
    durability:['dur-t3-desert-squire-baseline-hp-high','dur-t3-volcanic-striker-baseline-control','dur-t3-jungle-conduit-weapon-alt-hp-low'],
  };
  const cells=mode==='pilot' ? (args.trial ? trialCells.filter(c=>pilotIds[args.trial].includes(c.id)) : SURVEY_CELLS.filter(c=>(c.tier===1&&c.className==='striker'&&c.role==='solo')||(c.tier===3&&c.className==='conduit'&&c.role==='swarm'&&!c.alternate)||(c.tier===2&&c.className==='slinger'&&c.role==='small-group'&&!c.alternate))) : trialCells;
  let budgetStopped=false;
  observations: for(const cell of cells) for(const seed of mode==='qualify'||mode==='pilot'?[trialSeeds[0]]:trialSeeds) {
    if(night5&&mode==='run'&&realNow()-batchWallStart>=(['durability21','durability22','durability23','durability24','durability25','durability26','durability27','durability28','durability29','durability30','durability32','durability33','durability34','durability35','durability36','durability37'].includes(args.trial)?30:75)*60*1000){budgetStopped=true;break observations;}
    assert(realNow()-batchWallStart < 4*60*60*1000,'Four-hour batch ceiling; partial artifacts retained');
    results.push(args['navigation-diagnostics']==='true'&&mode!=='qualify' ? await profileNavigationObservation(out,cell.id,seed,()=>run(cell,seed)) : run(cell,seed));writeFileSync(join(out,'index.json'),JSON.stringify(results,null,2));
    console.log(cell.id,seed,'complete');
    assert(process.memoryUsage().rss<2*1024**3,'RSS safety ceiling; partial artifacts retained');
  }
  writeFileSync(join(out,budgetStopped?'budget-exhausted.json':'complete.json'),JSON.stringify({cells:cells.length,runs:results.length,mode}));
} catch(error) {writeFileSync(join(out,'failed.json'),JSON.stringify({error:String(error),completed:results.length}));throw error;}

}
void main().catch(error=>{console.error(error);process.exitCode=1;});
