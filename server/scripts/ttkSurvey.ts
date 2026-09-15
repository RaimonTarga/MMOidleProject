import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { NODE_BIOMES, MONSTER_DATABASE, composePlayerView, buildNavGrid, moverOverlapsBlockShapes, navigationBodyHalfExtents } from '@mmo-idle/shared';
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

const args=Object.fromEntries(process.argv.slice(2).map(x=>{const i=x.indexOf('=');return i<0?[x.replace(/^--/,''),'true']:[x.slice(2,i),x.slice(i+1)];}));
const mode=args.mode??'qualify'; assert(['qualify','pilot','run'].includes(mode));
assert(!args.trial || ['durability','durability2','durability3','durability4'].includes(args.trial));
const trialCells = args.trial === 'durability4' ? DURABILITY4_CELLS : args.trial === 'durability3' ? DURABILITY3_CELLS : args.trial === 'durability2' ? DURABILITY2_CELLS : args.trial === 'durability' ? DURABILITY_CELLS : SURVEY_CELLS;
const trialSeeds=args.trial==='durability4'?DURABILITY4_SEEDS:SURVEY_SEEDS;
const out=resolve(args.out??'');assert(args.out&&!existsSync(out),'NEW output directory required');
assert(args.hitboxes && hydrateHitboxCacheFromArtifact(args.hitboxes)>0,'Frozen hitbox artifact required; no square-hitbox fallback');
const sha=(s:string|Buffer)=>createHash('sha256').update(s).digest('hex');
const revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(args.revision) assert.equal(revision,args.revision,'Wrong frozen checkout');
mkdirSync(out,{recursive:true});
const manifest={schema:1,mode,revision,definitionsHash:checkpointDefinitionsHash(),hitboxesSha256:sha(readFileSync(args.hitboxes)),
  trial:args.trial??'ttk-survey',synthetic:true,economyEligible:false,dtMs:100,durationMs:mode==='pilot'?30000:300000,seeds:trialSeeds,cells:trialCells};
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
  const overlay = args.trial === 'durability4' ? installDurability4Treatment(cell as Durability4Cell) : args.trial === 'durability3' ? installDurability3Treatment(cell as Durability3Cell) : args.trial === 'durability2' ? installDurability2Treatment(cell as Durability2Cell) : args.trial === 'durability' ? installDurabilityTreatment(cell as DurabilityCell) : null;
  try {
    const target={nodeId:cell.nodeId,biomeGroup:NODE_BIOMES[cell.nodeId].biomeGroup,contentTier:cell.tier,isDungeon:false};
    setupArena(world,target);
    const {bot,view}=prepareSurveyBot(world,cell,safeSpawn(cell.nodeId));
    const roster=()=>[...world.monsterEntitiesInNode(cell.nodeId)].map(m=>({id:m.entityId,type:m.isMonster.monsterTypeId,hp:m.hasHealth.hp,maxHp:m.hasHealth.maxHp,pos:{...m.hasPosition.current}}));
    const initial=roster(); assert(initial.length>0,'Empty initial population');
    const ready={cell:cell.id,seed,synthetic:true,view,initialRoster:initial,initialRosterHash:sha(JSON.stringify(initial)),
      geometryRosterHash:sha(JSON.stringify(initial.map(({hp,maxHp,...r})=>r))),
      hpTreatment:overlay?.changes.filter(c=>initial.some(m=>m.type===c.type))??[],
      initialStats:[...world.monsterEntitiesInNode(cell.nodeId)].map(m=>({id:m.entityId,type:m.isMonster.monsterTypeId,attack:m.dealsDamage.attack,plating:m.mitigatesDamage.plating,dr:m.mitigatesDamage.damageReduction}))};
    if(['durability2','durability3','durability4'].includes(args.trial)) assert(initial.some(m=>m.type===(cell as Durability2Cell).eliteType),'Missing target elite');
    if(mode==='qualify') return ready;
    const dir=join(out,cell.id+'-s'+seed);mkdirSync(dir);
    writeFileSync(join(dir,'ready.json'),JSON.stringify(ready,null,2));
    const metrics=new SurveyMetrics(bot.isPlayer.id);
    const register=()=>{for(const m of world.monsterEntitiesInNode(cell.nodeId)) metrics.register(m.entityId,m.isMonster.monsterTypeId,MONSTER_DATABASE.get(m.isMonster.monsterTypeId)?.name??m.isMonster.monsterTypeId,m.hasHealth.maxHp);};
    register(); const log:unknown[]=[],samples:unknown[]=[];const lastHp=new Map<string,number>();
    let elapsed=0,outcome='window-ended',minHp=1,attackBeats=0,lastAttack=0;
    const wallStart=realNow();
    world.worldLogJournal=[];world.worldLogByPlayer.clear();world.takeNodeEvents(cell.nodeId);
    for(;elapsed<manifest.durationMs;elapsed+=100) {
      if(realNow()-wallStart>120000) {outcome='wall-ceiling';break;}
      now=1800000000000+elapsed; register();
      world.tick(100,now);
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
      metrics.closeIfCleared(elapsed);
      metrics.sampleRecovery(elapsed,v.hp>=v.maxHp&&v.barrier>=v.barrierMax&&v.incomingDot===0);
      if(elapsed%1000===0) samples.push({atMs:elapsed,hp:v.hp,barrier:v.barrier,incomingDot:v.incomingDot,target:v.attackTargetId,lastAttackAt:v.lastAttackAt,autoIntent:v.autoIntent,pos:v.pos,
        staticDamageContacts:activePlayerDamageFeatures(world,cell.nodeId).filter(f=>playerInFeatureContact(bot.hasPosition.current,f)).map(f=>({id:f.id,effect:f.damage?.effectId})),
        movement:bot.hasMovePath ? structuredClone(bot.hasMovePath) : null, monsters:roster().map(m=>({id:m.id,type:m.type,hp:m.hp}))});
      if(bot.isDead || bot.hasHealth.hp<=0) {outcome='player-died';break;}
      world.pendingDeaths=[];
    }
    metrics.close(elapsed,outcome);
    const result={cell:cell.id,seed,outcome,elapsedMs:elapsed,minHpFraction:minHp,attackBeats,initialRosterHash:ready.initialRosterHash,...metrics.result()};
    writeFileSync(join(dir,'events.jsonl'),log.map(e=>JSON.stringify(e)).join('\n')+'\n');
    writeFileSync(join(dir,'samples.jsonl'),samples.map(e=>JSON.stringify(e)).join('\n')+'\n');
    writeFileSync(join(dir,'summary.json'),JSON.stringify(result,null,2));return result;
  } finally {try {teardownArena(world);} finally {overlay?.restore();Date.now=realNow;Math.random=realRandom;}}
}
const results:unknown[]=[];
const batchWallStart=realNow();
try {
  const pilotIds:Record<string,string[]>={
    durability4:['dur4-t2-solo-conduit-heavy-plate8','dur4-t3-small-group-conduit-heavy-plate16','dur4-eagle-spirit-baseline-dive1.25'],
    durability3:['dur3-ttk-t2-conduit-small-group-baseline-both-soft','dur3-ttk-t3-apprentice-solo-baseline-dr','dur3-ttk-t2-slinger-solo-weapon-alt-plating'],
    durability2:['dur2-ttk-t2-slinger-solo-baseline-hp-high-soft','dur2-ttk-t3-conduit-small-group-weapon-alt-hp-high','dur2-ttk-t3-squire-solo-baseline-control'],
    durability:['dur-t3-desert-squire-baseline-hp-high','dur-t3-volcanic-striker-baseline-control','dur-t3-jungle-conduit-weapon-alt-hp-low'],
  };
  const cells=mode==='pilot' ? (args.trial ? trialCells.filter(c=>pilotIds[args.trial].includes(c.id)) : SURVEY_CELLS.filter(c=>(c.tier===1&&c.className==='striker'&&c.role==='solo')||(c.tier===3&&c.className==='conduit'&&c.role==='swarm'&&!c.alternate)||(c.tier===2&&c.className==='slinger'&&c.role==='small-group'&&!c.alternate))) : trialCells;
  for(const cell of cells) for(const seed of mode==='qualify'||mode==='pilot'?[trialSeeds[0]]:trialSeeds) {
    assert(realNow()-batchWallStart < 4*60*60*1000,'Four-hour batch ceiling; partial artifacts retained');
    results.push(run(cell,seed));writeFileSync(join(out,'index.json'),JSON.stringify(results,null,2));
    console.log(cell.id,seed,'complete');
    assert(process.memoryUsage().rss<2*1024**3,'RSS safety ceiling; partial artifacts retained');
  }
  writeFileSync(join(out,'complete.json'),JSON.stringify({cells:cells.length,runs:results.length,mode}));
} catch(error) {writeFileSync(join(out,'failed.json'),JSON.stringify({error:String(error),completed:results.length}));throw error;}
