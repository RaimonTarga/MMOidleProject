import assert from 'node:assert/strict';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { MONSTER_DATABASE, NODE_BIOMES, RESOLVED_NODE_FEATURES, DUNGEON_DEFS,
  buildNavGrid, navigationBodyHalfExtents, moverOverlapsBlockShapes, composePlayerView } from '@mmo-idle/shared';
import { createFarmWorld } from './worldFactory';
import { setupArena, BOT_SPAWN } from './arena';
import { prepareSurveyBot } from './ttkSurveySpec';
import { BREADTH_CELLS } from './playerBreadthSpec';
import { fastPassReadback, assertFastPassHitboxes } from './playerFastPassSpec';
import { EnduranceProgress } from './enduranceProgress';
import { hydrateHitboxCacheFromArtifact } from '../../src/hitbox/cache';
import { ensureDungeon, tickDungeons } from '../../src/systems/world/dungeons/dungeon';

// One fresh process per observation: no shared IDs, RNG, caches or treatment state across arms.
const [manifestPath, indexText] = process.argv.slice(2);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const spec = manifest.cases[Number(indexText)];
assert(spec);
const out = join(manifest.out, spec.id); mkdirSync(out);
const write = (name:string, value:unknown) => writeFileSync(join(out,name),JSON.stringify(value,null,2)+'\n');
const sha = (value:unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert(hydrateHitboxCacheFromArtifact(manifest.hitboxes)>0);
assert.equal(MONSTER_DATABASE.get('ash-slinger')!.stats.attack,70);
assert.equal(MONSTER_DATABASE.get('ember-skink')!.stats.attack,60);
assert.equal(MONSTER_DATABASE.get('ember-skink')!.dotEffect!.damagePerStack,8);
assert.equal(MONSTER_DATABASE.get('ashspitter-salamander')!.stats.attack,95);
assert.equal(MONSTER_DATABASE.get('ashspitter-salamander')!.dotEffect!.damagePerStack,12);
for (const features of Object.values(RESOLVED_NODE_FEATURES)) for(const f of features) {
  if(f.ambientRamp?.effectId !== 'volcanic-heat') continue;
  assert.equal(f.ambientRamp.payload.incomingDamagePct,.035);
}
// Reconstruct original values in memory only; the full arm uses unmodified local source.
if(spec.arm !== 'full') {
  MONSTER_DATABASE.get('ash-slinger')!.stats.attack=84;
  MONSTER_DATABASE.get('ember-skink')!.stats.attack=75;
  MONSTER_DATABASE.get('ember-skink')!.dotEffect!.damagePerStack=13;
  MONSTER_DATABASE.get('ashspitter-salamander')!.stats.attack=110;
  MONSTER_DATABASE.get('ashspitter-salamander')!.dotEffect!.damagePerStack=16;
}
if(spec.arm === 'baseline') for (const features of Object.values(RESOLVED_NODE_FEATURES)) for(const f of features) {
  if(f.ambientRamp?.effectId === 'volcanic-heat') f.ambientRamp.payload.incomingDamagePct=.045;
}
let rng=spec.seed>>>0;
Math.random=()=>{rng+=0x6D2B79F5;let t=rng;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
let now=1800000000000; Date.now=()=>now;
const wallNow=()=>performance.now();
const role=spec.mode==='boss'?'boss':'farm';
const identity=`breadth-t${spec.tier}-${spec.className}-balanced${spec.tier===4?'-b':''}`;
const template=BREADTH_CELLS.find(c=>c.identityId===identity&&c.role===role&&c.playerTreatment==='untreated');
assert(template, identity);
const cell=structuredClone(template); cell.id=spec.id; cell.build.id=spec.id;
const bossId=spec.tier===3?'cinder-shell-magma-salamander':'caldera-sovereign';
cell.nodeId=spec.mode==='boss' ? [...DUNGEON_DEFS.values()].find(d=>d.boss.bossId===bossId)!.nodeId : `node-t${spec.tier}-${spec.biome}-03`;
cell.isDungeon=spec.mode==='boss';
const world=createFarmWorld();
setupArena(world,{nodeId:cell.nodeId,biomeGroup:NODE_BIOMES[cell.nodeId].biomeGroup,contentTier:spec.tier,isDungeon:cell.isDungeon});
let pos={...BOT_SPAWN};
if(spec.mode!=='boss') {
  const half=navigationBodyHalfExtents('player'), shapes=buildNavGrid(cell.nodeId,'player',half).shapes;
  let found=false;
  for(let r=0;r<1800&&!found;r+=100) for(const [dx,dy] of [[0,r],[r,0],[0,-r],[-r,0]]) {
    const p={x:2400+dx,y:2400+dy};
    if(!moverOverlapsBlockShapes(p,shapes,half)){pos=p;found=true;break;}
  }
  assert(found,'safe spawn missing');
} else {
  world.suppressRepopulation=true;
  ensureDungeon(world,cell.nodeId); const state=world.dungeons.get(cell.nodeId)!; assert(state);
  for(const id of state.guardianIds)world.removeMonsterEntity(id);
  state.guardianIds=[];state.guardiansEngaged=true;state.status='bossAwakening';state.bossAwakensAtMs=-1;
}
const {bot,view}=prepareSurveyBot(world,cell,pos);
// Fixed mature mastery across all arms; kills are work, not an uncontrolled progression treatment.
world.fixedBiomeMasteryPlayers.add(bot.isPlayer.id);
if(spec.mode==='boss')tickDungeons(world,now);
const roster=()=>[...world.monsterEntitiesInNode(cell.nodeId)].map(m=>({id:m.entityId,type:m.isMonster.monsterTypeId,hp:m.hasHealth.hp,pos:{...m.hasPosition.current},attack:m.dealsDamage.attack}));
const initial=roster(); assert(initial.length>0);
if(spec.mode==='boss')assert(initial.some(m=>m.type===bossId),'boss did not awaken');
assertFastPassHitboxes([bot,...world.monsterEntitiesInNode(cell.nodeId)]);
const packageReadback=fastPassReadback(cell,bot,view.globalMastery);
write('ready.json',{spec,cell,sharedEntry:require.resolve('@mmo-idle/shared'),view,packageReadback,initial,
  geometryHash:sha(initial.map(({hp,attack,...m})=>m)),
  playerHash:sha({skills:bot.usesSkills,health:bot.hasHealth,mitigation:bot.mitigatesDamage,progression:bot.tracksProgression,inventory:bot.holdsInventory}),
  heat:RESOLVED_NODE_FEATURES[cell.nodeId]?.find(f=>f.ambientRamp)?.ambientRamp,
  monsters:['ash-slinger','ember-skink','ashspitter-salamander'].map(id=>MONSTER_DATABASE.get(id))});
const progress=new EnduranceProgress(bot.isPlayer.id);
const incoming:Record<string,{hp:number;absorbed:number;events:number}>={};
let maxHeat=0,heatSum=0,firstKillHeat:number|null=null,activeMs=0,minHpFraction=1;
let outcome='window-ended',elapsed=0,bossKilled=false;
let events:unknown[]=[];let samples:unknown[]=[];const endpoints:unknown[]=[];
const flush=()=>{for(const [name,rows] of [['events.jsonl',events],['samples.jsonl',samples]] as const)if(rows.length)appendFileSync(join(out,name),rows.map(x=>JSON.stringify(x)).join('\n')+'\n');events=[];samples=[];};
world.worldLogJournal=[];world.worldLogByPlayer.clear();world.takeNodeEvents(cell.nodeId);
const wallStart=wallNow();
for(;elapsed<spec.durationMs;elapsed+=100) {
  if(wallNow()-wallStart>120000){outcome='wall-ceiling';break;}
  now=1800000000000+elapsed;
  world.tick(100,now);
  const heat=bot.tracksCombat.statusEffects.find(e=>e.id==='volcanic-heat')?.stacks??0;
  maxHeat=Math.max(maxHeat,heat);heatSum+=heat;
  const attackers=[...world.aggroedMonsters].filter(m=>m.hasAggroTarget.targetKind==='player'&&m.hasAggroTarget.targetId===bot.isPlayer.id).map(m=>m.isMonster.monsterTypeId);
  if(attackers.length||bot.hasAttackTarget)activeMs+=100;
  for(const e of world.worldLogJournal) {
    progress.ingest(e,elapsed+100);
    if(e.kind==='damage'&&e.target.id===bot.isPlayer.id){const key=e.damageType+':'+e.source.name;const x=incoming[key]??={hp:0,absorbed:0,events:0};x.hp+=e.hpDamage;x.absorbed+=e.absorbed;x.events++;}
    if(e.kind==='kill'&&e.victim.actorType==='monster'){
      firstKillHeat??=heat;
      if(spec.mode==='boss'&&initial.some(m=>m.id===e.victim.id&&m.type===bossId))bossKilled=true;
    }
    events.push({atMs:elapsed,tickEndMs:elapsed+100,event:e});
  }
  world.worldLogJournal=[];world.worldLogByPlayer.clear();world.takeNodeEvents(cell.nodeId);
  minHpFraction=Math.min(minHpFraction,bot.hasHealth.hp/bot.hasHealth.maxHp);
  if(elapsed%1000===0)samples.push({tickEndMs:elapsed+100,hp:bot.hasHealth.hp,heat,attackers,pos:{...bot.hasPosition.current},target:bot.hasAttackTarget?.targetId??null,work:progress.snapshot(elapsed+100)});
  if((elapsed+100)%60000===0){endpoints.push({atMs:elapsed+100,hp:bot.hasHealth.hp,heat,work:progress.snapshot(elapsed+100)});flush();}
  if(bot.isDead||bot.hasHealth.hp<=0){outcome='player-died';elapsed+=100;break;}
  if(bossKilled){outcome='boss-killed';elapsed+=100;break;}
}
flush();
const result={...spec,nodeId:cell.nodeId,outcome,elapsedMs:elapsed,wallMs:wallNow()-wallStart,work:progress.snapshot(elapsed),incoming,
  maxHeat,meanHeat:heatSum/Math.max(1,elapsed/100),firstKillHeat,activeMs,minHpFraction,terminalHp:bot.hasHealth.hp,
  terminalHeat:bot.tracksCombat.statusEffects.find(e=>e.id==='volcanic-heat')?.stacks??0,endpoints,
  noProgressTailMs:elapsed-progress.lastProgressMs,bossKilled,terminalRoster:roster()};
write('result.json',result); console.log(JSON.stringify({id:spec.id,outcome,kills:progress.kills,elapsed}));
process.exit(0);
