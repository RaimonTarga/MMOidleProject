// Throwaway: deterministic repro of the Volcanic approach/avoidance stall.
import {prepareSurveyBot} from '../bench/balance/ttkSurveySpec';
import {buildNavGrid,moverOverlapsBlockShapes,navigationBodyHalfExtents,getFlag,getCounter,biomeLevelCap,biomeXpForBiomeLevel} from '@mmo-idle/shared';
import {readFileSync,writeFileSync} from 'node:fs';
import {farmTargetForNode} from '../bench/balance/farmTargets';
import {createFarmWorld} from '../bench/balance/worldFactory';
import {setupArena,teardownArena} from '../bench/balance/arena';
import {hydrateHitboxCacheFromArtifact} from '../src/hitbox/cache';
import {recalculatePlayerEntityStats} from '../src/ecs/playerEntityFormulas';
import {syncArchetypeSlices} from '../src/ecs/archetypeSliceSync';

const job=JSON.parse(readFileSync(process.argv[2],'utf8'));
const maxMs=Number(process.argv[3]??30*60000);
const out=process.argv[4];
hydrateHitboxCacheFromArtifact(job.hitboxPath);
let elapsed=0,seed=job.seed>>>0;
Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
Date.now=()=>1800000000000+elapsed;
const target=farmTargetForNode(job.nodeId);
const world=createFarmWorld();world.rewardMultiplier=1;
const trace:any[]=[];(globalThis as any).__stallTrace=(e:any)=>{if(recording)trace.push({t:elapsed,...e});};
let recording=false;
setupArena(world,target);
const half=navigationBodyHalfExtents('player'),shapes=buildNavGrid(target.nodeId,'player',half).shapes;
let spawn:any=null;
for(let r=0;r<1800&&!spawn;r+=100) for(const [dx,dy] of [[0,r],[r,0],[0,-r],[-r,0]]) {const pos={x:2400+dx,y:2400+dy};if(!moverOverlapsBlockShapes(pos,shapes,half)){spawn=pos;break;}}
const {bot:player}=prepareSurveyBot(world,job.cell,spawn);
const p=player.tracksProgression;
world.fixedBiomeMasteryPlayers.delete(player.isPlayer.id);
p.biomeLevel[target.biomeGroup]=biomeLevelCap(target.contentTier-1,target.biomeGroup);
for(const [g,l] of Object.entries(p.biomeLevel))p.biomeXP[g]=biomeXpForBiomeLevel(g,l as number);
recalculatePlayerEntityStats(world,player);syncArchetypeSlices(world,player);player.hasHealth.hp=player.hasHealth.maxHp;
const hpById=new Map<string,number>();let lastXp=-1,lastXpAt=0,worstGap=0,worstAt=0;const gaps:any[]=[];
const TC=player.tracksCombat;
while(elapsed<maxMs){
  if(recording){
    trace.push({t:elapsed,phase:'pre',pos:{...player.hasPosition.current},hp:player.hasHealth.hp,
      atk:player.hasAttackTarget?.targetId??null,autoTarget:(player as any).hasAutoTarget??null,
      esc:getFlag(TC,'rune.dynamicHazardEscapeActive'),escDest:[getCounter(TC,'rune.dynamicHazardEscapeX'),getCounter(TC,'rune.dynamicHazardEscapeY')],
      move:player.hasMovePath?{dest:(player.hasMovePath as any).destination??null,avoid:(player.hasMovePath as any).avoidHazards,mode:(player.hasMovePath as any).mode}:(player as any).isMoving??null});
  }
  world.tick(100,1800000000000+elapsed);elapsed+=100;
  world.clearNodeEvents(target.nodeId);world.pendingDeaths=[];world.worldLogJournal=[];world.worldLogByPlayer.clear();
  if(recording)trace.push({t:elapsed,phase:'post',intent:player.hasAutoIntent?.reason,pos:{...player.hasPosition.current}});
  let dmg=false;for(const m of world.monsterEntities){if(m.hasPosition.nodeId!==target.nodeId)continue;const prev=hpById.get(m.entityId);if(prev!==undefined&&m.hasHealth.hp<prev)dmg=true;hpById.set(m.entityId,m.hasHealth.hp);}const xp=dmg?elapsed:lastXp;
  if(xp!==lastXp){const gap=elapsed-lastXpAt;if(gap>=60000)gaps.push({from:lastXpAt,to:elapsed,gap});lastXp=xp;lastXpAt=elapsed;if(recording&&process.argv[5]!=='keep'){recording=false;}}
  if(!recording&&elapsed-lastXpAt===60000){recording=true;console.log('stall start',lastXpAt,'pos',player.hasPosition.current);}
  if(player.isDead){console.log('dead at',elapsed);break;}
  if(elapsed%60000===0)console.log("min",elapsed/60000,"lvl",p.biomeLevel[target.biomeGroup],"cap",biomeLevelCap(target.contentTier,target.biomeGroup),"tier",p.playerTier??p.tier,"xp",xp,'hp',player.hasHealth.hp,'lastXpAt',lastXpAt);
  if(recording&&trace.length>20000)break;
}
console.log('gaps',JSON.stringify(gaps),'open',elapsed-lastXpAt);
if(out)writeFileSync(out,JSON.stringify(trace));
teardownArena(world);
