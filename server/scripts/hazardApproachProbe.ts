import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {NODE_BIOMES,MONSTER_DATABASE,RESOLVED_NODE_FEATURES,buildNavGrid,moverOverlapsBlockShapes,
 navigationBodyHalfExtents,findPathForMover,getFlag,getString,hitboxGap,posHitboxFromEntity} from '@mmo-idle/shared';
import {createFarmWorld} from '../bench/balance/worldFactory';
import {setupArena,teardownArena} from '../bench/balance/arena';
import {prepareSurveyBot} from '../bench/balance/ttkSurveySpec';
import {DURABILITY12_MOVEMENT,DURABILITY12_SWARM} from '../bench/balance/durability12Spec';
import {SurveyMetrics} from '../bench/balance/ttkSurveyMetrics';
import {getAutoTargetId} from '../src/systems/combat/ai/targetPriority';
import {hydrateHitboxCacheFromArtifact} from '../src/hitbox/cache';

// Diagnostic replay only. No stat, build, position or AI interventions.
const args=Object.fromEntries(process.argv.slice(2).map(a=>{const i=a.indexOf('=');return[a.slice(2,i),a.slice(i+1)]}));
assert(args.out&&!existsSync(args.out),'Use a new output directory');
assert(args.hitboxes&&hydrateHitboxCacheFromArtifact(args.hitboxes)>0);
mkdirSync(args.out,{recursive:true});
const cases=[
 {id:'dur12-movement-node-t3-jungle-05-squire',seed:173},
 {id:'dur12-swarm-node-t3-volcanic-03-spirit-sweep',seed:6151},
 {id:'dur12-swarm-node-t3-volcanic-05-squire-slam',seed:6151},
 {id:'dur12-movement-node-t3-swamp-05-striker',seed:173},
 {id:'dur12-movement-node-t3-jungle-05-squire',seed:3911},
 {id:'dur12-swarm-node-t3-volcanic-05-squire-sweep',seed:6151},
];
const revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
writeFileSync(join(args.out,'manifest.json'),JSON.stringify({revision,cases,synthetic:true,diagnostic:true},null,2));
for(const entry of cases){
 const cell=[...DURABILITY12_MOVEMENT,...DURABILITY12_SWARM].find(c=>c.id===entry.id)!;assert(cell);
 const oldNow=Date.now,oldRandom=Math.random;let now=1800000000000,rng=entry.seed;
 Math.random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296};Date.now=()=>now;
 const world=createFarmWorld();
 try {
 setupArena(world,{nodeId:cell.nodeId,biomeGroup:NODE_BIOMES[cell.nodeId].biomeGroup,contentTier:cell.tier,isDungeon:false});
 const pad=navigationBodyHalfExtents('player'),shapes=buildNavGrid(cell.nodeId,'player',pad).shapes;
 let spawn:{x:number;y:number}|undefined;
 outer:for(let r=0;r<1800;r+=100)for(const [dx,dy]of [[0,r],[r,0],[0,-r],[-r,0]]){const p={x:2400+dx,y:2400+dy};if(!moverOverlapsBlockShapes(p,shapes,pad)){spawn=p;break outer;}}
 assert(spawn);const {bot}=prepareSurveyBot(world,cell,spawn);
 const initial=[...world.monsterEntitiesInNode(cell.nodeId)].map(m=>({id:m.entityId,type:m.isMonster.monsterTypeId,hp:m.hasHealth.hp,maxHp:m.hasHealth.maxHp,pos:{...m.hasPosition.current}}));
 const rosterHash=createHash('sha256').update(JSON.stringify(initial)).digest('hex');
 const metrics=new SurveyMetrics(bot.isPlayer.id),samples:unknown[]=[];
 world.worldLogJournal=[];world.worldLogByPlayer.clear();world.takeNodeEvents(cell.nodeId);
 let elapsed=0;
 for(;elapsed<300000;elapsed+=100){
  now=1800000000000+elapsed;
  for(const m of world.monsterEntitiesInNode(cell.nodeId))metrics.register(m.entityId,m.isMonster.monsterTypeId,MONSTER_DATABASE.get(m.isMonster.monsterTypeId)!.name,m.hasHealth.maxHp);
  world.tick(100,now);
  for(const e of world.worldLogJournal)metrics.ingest(e,elapsed);
  world.worldLogJournal=[];world.worldLogByPlayer.clear();world.takeNodeEvents(cell.nodeId);
  if(elapsed%1000===0||(elapsed>=290000&&elapsed<291000)){
   const target=world.getMonsterEntity(getAutoTargetId(bot)??'');
   samples.push(structuredClone({atMs:elapsed,pos:bot.hasPosition.current,hp:bot.hasHealth.hp,
    lastDamageMs:Math.max(0,...[...metrics.targets.values()].map(t=>t.lastDamageMs??0)),
    combatTarget:bot.hasAttackTarget,move:bot.isMoving,path:bot.hasMovePath,blocked:getString(bot.tracksCombat,'autoApproachBlocked'),
    goalHazards:bot.hasMovePath&&(RESOLVED_NODE_FEATURES[cell.nodeId]??[]).filter(f=>moverOverlapsBlockShapes(bot.hasMovePath!.goal,[f.shape],pad)),
    flags:{escape:getFlag(bot.tracksCombat,'rune.dynamicHazardEscapeActive'),avoid:getFlag(bot.tracksCombat,'rune.avoidNodeHazards')},
    target:target&&{id:target.entityId,type:target.isMonster.monsterTypeId,pos:target.hasPosition.current,
     hp:target.hasHealth.hp,aggro:target.hasAggroTarget,awareness:target.hasAwareness,controls:target.controlsMonster,
     gap:hitboxGap(posHitboxFromEntity(bot),posHitboxFromEntity(target)),playerRange:bot.performsAttack.attackRange,
     monsterRange:target.performsAttack.attackRange,playerCanReach:world.collision.canReach(bot,target,bot.performsAttack.attackRange),
     monsterCanReach:world.collision.canReach(target,bot,target.performsAttack.attackRange),
     hazards:(RESOLVED_NODE_FEATURES[cell.nodeId]??[]).filter(f=>(f.damage?.targets.includes('player')||f.statusWhileInside?.targets.includes('player'))&&moverOverlapsBlockShapes(target.hasPosition.current,[f.shape],{x:64,y:64})),
     paths:elapsed%10000===0?[false,true].map(avoid=>findPathForMover(cell.nodeId,'player',pad,bot.hasPosition.current,target.hasPosition.current,undefined,avoid)?.slice(-3)):undefined},
   }));
  }
  if(bot.isDead||bot.hasHealth.hp<=0)break;world.pendingDeaths=[];
 }
 const lastDamageMs=Math.max(0,...[...metrics.targets.values()].map(t=>t.lastDamageMs??0));
 const summary={...entry,elapsed,lastDamageMs,initialRosterHash:rosterHash,kills:[...metrics.targets.values()].filter(t=>t.killedAtMs!==null).length};
 writeFileSync(join(args.out,entry.id+'-s'+entry.seed+'.json'),JSON.stringify({summary,samples},null,2));console.log(JSON.stringify(summary));
 }finally{teardownArena(world);Date.now=oldNow;Math.random=oldRandom;}
}
