import {prepareSurveyBot} from '../../server/bench/balance/ttkSurveySpec';
import {buildNavGrid,moverOverlapsBlockShapes,navigationBodyHalfExtents} from '../../shared/src/index';
import {DEFAULT_RUNE_LOADOUT, runicPointLoadoutCost, runeBudgetForGlobalMastery, globalMastery} from '../../shared/src/index';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {performance} from 'node:perf_hooks';
import {GAME_CONFIG,RECIPE_DATABASE,ITEM_DATABASE,ESSENCE_TYPES,biomeLevelCap,biomeXpForBiomeLevel,upgradeCostFor} from '../../shared/src/index';
import {representativeBuildsPerClass} from '../../server/bench/balance/progression';
import {farmTargetForNode} from '../../server/bench/balance/farmTargets';
import {createFarmWorld} from '../../server/bench/balance/worldFactory';
import {materializeBot,BENCH_BOT_ID} from '../../server/bench/balance/botFactory';
import {setupArena,teardownArena,BOT_SPAWN} from '../../server/bench/balance/arena';
import {hydrateHitboxCacheFromArtifact} from '../../server/src/hitbox/cache';
import {recalculatePlayerEntityStats} from '../../server/src/ecs/playerEntityFormulas';
import {syncArchetypeSlices} from '../../server/src/ecs/archetypeSliceSync';
import {upgradeItem} from '../../server/src/systems/player/economy/itemUpgrade';

const job=JSON.parse(readFileSync(process.argv[2],'utf8'));
const start=performance.now();
const hitboxes=hydrateHitboxCacheFromArtifact(job.hitboxPath);
if(hitboxes===0) throw Error('Baked hitboxes required');
let runtimeCensored=false; let elapsed=0,seed=job.seed>>>0;
const random=Math.random,clock=Date.now;
Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
Date.now=()=>1800000000000+elapsed;
const target=farmTargetForNode(job.nodeId);
const build=job.cell.build;
const nativeIds:string[]=job.gearIds;
const world=createFarmWorld();world.rewardMultiplier=1;const probe:any[]=[];let intervenedAt:number|null=null;let probeKillsBefore:number|null=null;
(world as any).__rewardProbe=(phase:string,e:any,detail:any)=>{if(e.isPlayer&&elapsed>=20*60000&&elapsed%1000===0)probe.push(JSON.parse(JSON.stringify({phase,elapsedMs:elapsed,pos:e.hasPosition.current,hp:e.hasHealth.hp,detail,path:e.hasMovePath})));};
const records:any[]=[]; let plateau=false,lastXpAt=0,lastXp=-1; const diagnostics:any[]=[];const killTypes:Record<string,number>={};const intentMs:Record<string,number>={};let activeMs=0,movingMs=0;let lastPos:any=null;
try {
  setupArena(world,target);
  const half=navigationBodyHalfExtents('player'),shapes=buildNavGrid(target.nodeId,'player',half).shapes;
  let spawn:any=null;
  for(let r=0;r<1800&&!spawn;r+=100) for(const [dx,dy] of [[0,r],[r,0],[0,-r],[-r,0]]) {
    const pos={x:2400+dx,y:2400+dy};if(!moverOverlapsBlockShapes(pos,shapes,half)){spawn=pos;break;}
  }
  if(!spawn)throw Error('No safe spawn');
  const {bot:player}=prepareSurveyBot(world,job.cell,spawn);
  const p=player.tracksProgression;
  const historicalReadback=JSON.parse(JSON.stringify({mastery:p.biomeLevel,upgrades:player.holdsInventory.itemUpgrades,equipment:player.holdsInventory.equipment,abilities:p.attunedAbilities,runes:p.runesEquipped}));
  const entry=biomeLevelCap(target.contentTier-1,target.biomeGroup),cap=biomeLevelCap(target.contentTier,target.biomeGroup);
  world.fixedBiomeMasteryPlayers.delete(player.isPlayer.id);
  p.biomeLevel[target.biomeGroup]=entry;
  for(const [group,level] of Object.entries(p.biomeLevel))p.biomeXP[group]=biomeXpForBiomeLevel(group,level);
  const rp=runicPointLoadoutCost({rules:p.runesEquipped,abilities:p.attunedAbilities,stances:p.attunedStances??[],rites:p.equippedRites});
  const rpBudget=runeBudgetForGlobalMastery(globalMastery(p.biomeLevel));
  if(rp>rpBudget)throw Error(`Preserved loadout exceeds entry budget: ${rp}/${rpBudget}`);
  recalculatePlayerEntityStats(world,player);syncArchetypeSlices(world,player);player.hasHealth.hp=player.hasHealth.maxHp;
  const base:any=Object.fromEntries(ESSENCE_TYPES.map(c=>[c,0]));
  const costs:any={3:{...base},5:{...base}};
  for(const id of nativeIds) {
    const recipe=RECIPE_DATABASE.get(id)!;
    for(const [c,n] of Object.entries(recipe.cost)) base[c]+=n;
    for(const plus of [3,5]) {
      for(const [c,n] of Object.entries(recipe.cost)) costs[plus][c]+=n;
      for(let i=1;i<=plus;i++) for(const [c,n] of Object.entries(upgradeCostFor(ITEM_DATABASE.get(id)!,i,job.arm === 'baseline' ? world.t1EconomyConfigForPlayer(BENCH_BOT_ID).t1Plus5EssenceCostMultiplier : world.t1EconomyConfigByPlayerId.get(BENCH_BOT_ID)?.t1Plus5EssenceCostMultiplier)!)) costs[plus][c]+=n;
    }
  }
  const debt=job.mode==='buy'?{...base}:Object.fromEntries(ESSENCE_TYPES.map(c=>[c,0]));
  const gross={...p.essences};let last={...p.essences};
  const funds:any={3:null,5:null};let mastery:any=null,death:any=null,all3:any=null,all5:any=null;
  const snapshots:any[]=[];let previousLevel=entry;
  const snapshot=()=>({elapsedMs:elapsed,level:p.biomeLevel[target.biomeGroup],xp:p.biomeXP[target.biomeGroup],gross:{...gross},wallet:{...p.essences},catalysts:{...p.catalysts},catalystProgress:{...p.catalystProgress},upgrades:{...player.holdsInventory.itemUpgrades},hp:player.hasHealth.hp});
  const initial={...snapshot(),build:JSON.parse(JSON.stringify(build)),loadout:{abilities:p.attunedAbilities,stances:p.attunedStances,rites:p.equippedRites,runes:p.runesEquipped},stats:{hp:player.hasHealth.maxHp,attack:player.dealsDamage.attack},biomeLevels:{...p.biomeLevel}};
  const blockers:Record<string,number>={};
  while(elapsed<job.maxMs) {
    world.tick(100,1800000000000+elapsed);elapsed+=100;
    world.clearNodeEvents(target.nodeId);world.pendingDeaths=[];
    for(const e of world.worldLogJournal) if(e.kind==='kill'&&e.victim.actorType==='monster') killTypes[e.victim.name]=(killTypes[e.victim.name]??0)+1;
    world.worldLogJournal=[];world.worldLogByPlayer.clear();
    const intent=player.hasAutoIntent?.reason??'none';intentMs[intent]=(intentMs[intent]??0)+100;
    if(player.hasAttackTarget)activeMs+=100;
    const pos=player.hasPosition.current;if(lastPos&&Math.hypot(pos.x-lastPos.x,pos.y-lastPos.y)>.01)movingMs+=100;lastPos={...pos};
    if(p.biomeXP[target.biomeGroup]!==lastXp){lastXp=p.biomeXP[target.biomeGroup];lastXpAt=elapsed;}
    if(elapsed%10000===0) diagnostics.push({tickEndMs:elapsed,xp:lastXp,pos:{...pos},hp:player.hasHealth.hp,intent:player.hasAutoIntent,target:player.hasAttackTarget,heat:player.tracksCombat.statusEffects.filter(e=>e.id.includes('heat')),monsters:[...world.monsterEntities].filter(m=>!m.isDead&&m.hasPosition.nodeId===target.nodeId).map(m=>({id:m.isMonster.id,type:m.isMonster.monsterTypeId,hp:m.hasHealth.hp,pos:m.hasPosition.current,aggro:m.hasAggroTarget})),runtimeKeys:Object.keys(player).filter(k=>/path|nav|move|avoid|recover|wait/i.test(k))});
    if(job.intervene&&intervenedAt===null&&elapsed-lastXpAt>=60000){intervenedAt=elapsed;probeKillsBefore=Object.values(killTypes).reduce((a,b)=>a+b,0);p.runesEquipped=p.runesEquipped.filter(r=>r.actionId!=='avoid-hazards');probe.push({phase:'intervention',elapsedMs:elapsed,action:'remove-avoid-hazards'});}if(elapsed-lastXpAt>=180000){plateau=true;break;}
    for(const c of ESSENCE_TYPES) gross[c]+=Math.max(0,p.essences[c]-last[c]);
    for(const plus of [3,5]) if(funds[plus]===null&&ESSENCE_TYPES.every(c=>gross[c]>=costs[plus][c])) funds[plus]=elapsed;
    if(p.biomeLevel[target.biomeGroup]!==previousLevel) {snapshots.push(snapshot());previousLevel=p.biomeLevel[target.biomeGroup];}
    if(mastery===null&&p.biomeLevel[target.biomeGroup]>=cap) mastery=snapshot();
    if(player.isDead) {death=snapshot();break;} if(mastery && job.stopAtMastery)break;
    if(job.mode==='buy'&&elapsed%1000===0) {
      // Synthetic base gear is advanced on credit; repay its actual per-color
      // acquisition before spending rewards on production upgradeItem calls.
      for(const c of ESSENCE_TYPES) {const pay=Math.min(debt[c],p.essences[c]);debt[c]-=pay;p.essences[c]-=pay;}
      if(ESSENCE_TYPES.every(c=>debt[c]===0)) {
        const lowest=Math.min(...nativeIds.map(id=>player.holdsInventory.itemUpgrades[id]??0));
        for(const id of nativeIds) if((player.holdsInventory.itemUpgrades[id]??0)===lowest&&lowest<5) {
          const result=upgradeItem(world,player,id);
          if(result.success) records.push({elapsedMs:elapsed,itemId:id,plus:result.newLevel,wallet:{...p.essences}});
          else blockers[result.reason??'unknown']=(blockers[result.reason??'unknown']??0)+1;
        }
      }
    }
    const minPlus=Math.min(...nativeIds.map(id=>player.holdsInventory.itemUpgrades[id]??0));
    if(job.mode==='buy'&&all3===null&&minPlus>=3) all3=elapsed;
    if(job.mode==='buy'&&all5===null&&minPlus>=5) all5=elapsed;
    last={...p.essences};
    if(elapsed%60000===0) snapshots.push(snapshot()); if(elapsed%10000===0) writeFileSync(job.output+'.progress.json',JSON.stringify({wallSeconds:(performance.now()-start)/1000,state:snapshot()})); if(performance.now()-start>(job.wallLimitMs??900000)){runtimeCensored=true;break;}
  }
  const result={probe,intervenedAt,probeKillsBefore,diagnostics,killTypes,intentMs,activeMs,movingMs,plateau,lastXpAt,runtimeCensored,historicalReadback,rp,rpBudget,job,hitboxes,build,initial,entry,cap,budget:biomeXpForBiomeLevel(target.biomeGroup,cap)-biomeXpForBiomeLevel(target.biomeGroup,entry),costs,mastery,death,fundingTimes:funds,actualAll3Ms:all3,actualAll5Ms:all5,acquisitionDebt:debt,final:snapshot(),snapshots,purchases:records,blockers,wallSeconds:(performance.now()-start)/1000,
    limitations:['Historical surviving loadout validated through prepareSurveyBot, then target biome reset to segment entry; mastery freeze removed','Mature gear and owned abilities retained: a conditional throughput screen, not an earned arrival journey','Native reference set costs are funding benchmarks, not the equipped mixed-biome set or actual purchases','No cross-biome routing or revivals; first death stops each run']};
  mkdirSync(dirname(job.output),{recursive:true});writeFileSync(job.output,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({id:job.id,wallSeconds:result.wallSeconds,masteryMs:mastery?.elapsedMs??null,deathMs:death?.elapsedMs??null,level:result.final.level,funds,all3,all5}));
} finally {teardownArena(world);Math.random=random;Date.now=clock;}


