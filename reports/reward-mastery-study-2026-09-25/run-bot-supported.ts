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
let elapsed=0,seed=job.seed>>>0;
const random=Math.random,clock=Date.now;
Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
Date.now=()=>1800000000000+elapsed;
const target=farmTargetForNode(job.nodeId);
const build=representativeBuildsPerClass(target.contentTier,target.biomeGroup,{classRoot:job.classRoot})[0];
if(!build) throw Error('Missing build');
const nativeIds:string[]=job.gearIds;
build.gearItemIds=Object.fromEntries(nativeIds.map(id=>[RECIPE_DATABASE.get(id)!.slot,id]));
const world=createFarmWorld();world.rewardMultiplier=1;
const records:any[]=[];
try {
  setupArena(world,target);
  const player=materializeBot(world,build,target,BOT_SPAWN,undefined,job.mode==='buy'?0:3);
  const p=player.tracksProgression;
  const entry=biomeLevelCap(target.contentTier-1,target.biomeGroup),cap=biomeLevelCap(target.contentTier,target.biomeGroup);
  p.biomeLevel[target.biomeGroup]=entry;p.biomeXP[target.biomeGroup]=biomeXpForBiomeLevel(target.biomeGroup,entry);
  p.runesEquipped = DEFAULT_RUNE_LOADOUT.map(r=>({...r}));
  const rp = ()=>runicPointLoadoutCost({rules:p.runesEquipped,abilities:p.attunedAbilities,stances:p.attunedStances??[],rites:p.equippedRites});
  const budgetRP = runeBudgetForGlobalMastery(globalMastery(p.biomeLevel));
  while(rp()>budgetRP) {
    if(p.attunedAbilities.techniques.length) p.attunedAbilities.techniques.pop();
    else if(p.attunedAbilities.guards.length) p.attunedAbilities.guards.pop();
    else if(p.equippedRites.length) p.equippedRites.pop();
    else if(p.attunedStances?.length) {p.attunedStances.pop();p.equippedStances.default=null;p.activeStance=null;}
    else throw Error('Default rune loadout exceeds budget');
  }
  recalculatePlayerEntityStats(world,player);syncArchetypeSlices(world,player);player.hasHealth.hp=player.hasHealth.maxHp;
  const base:any=Object.fromEntries(ESSENCE_TYPES.map(c=>[c,0]));
  const costs:any={3:{...base},5:{...base}};
  for(const id of nativeIds) {
    const recipe=RECIPE_DATABASE.get(id)!;
    for(const [c,n] of Object.entries(recipe.cost)) base[c]+=n;
    for(const plus of [3,5]) {
      for(const [c,n] of Object.entries(recipe.cost)) costs[plus][c]+=n;
      for(let i=1;i<=plus;i++) for(const [c,n] of Object.entries(upgradeCostFor(ITEM_DATABASE.get(id)!,i)!)) costs[plus][c]+=n;
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
    for(const c of ESSENCE_TYPES) gross[c]+=Math.max(0,p.essences[c]-last[c]);
    for(const plus of [3,5]) if(funds[plus]===null&&ESSENCE_TYPES.every(c=>gross[c]>=costs[plus][c])) funds[plus]=elapsed;
    if(p.biomeLevel[target.biomeGroup]!==previousLevel) {snapshots.push(snapshot());previousLevel=p.biomeLevel[target.biomeGroup];}
    if(mastery===null&&p.biomeLevel[target.biomeGroup]>=cap) mastery=snapshot();
    if(player.isDead) {death=snapshot();break;}
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
    if(elapsed%60000===0) snapshots.push(snapshot());
  }
  const result={job,hitboxes,build,initial,entry,cap,budget:biomeXpForBiomeLevel(target.biomeGroup,cap)-biomeXpForBiomeLevel(target.biomeGroup,entry),costs,mastery,death,fundingTimes:funds,actualAll3Ms:all3,actualAll5Ms:all5,acquisitionDebt:debt,final:snapshot(),snapshots,purchases:records,blockers,wallSeconds:(performance.now()-start)/1000,
    limitations:['Synthetic late-tier fixture: other biomes mastered, generated class and granted benchmark abilities','Native current-tier base gear granted on credit in buy mode; acquisition is repaid from earnings, not a real prior-tier journey','Fixed3 mode grants +3 gear and measures income, not purchase progression','No cross-biome routing or instant revivals; first death stops the run','Seeded random and 100ms simulation clock; elapsed time is simulation time']};
  mkdirSync(dirname(job.output),{recursive:true});writeFileSync(job.output,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({id:job.id,wallSeconds:result.wallSeconds,masteryMs:mastery?.elapsedMs??null,deathMs:death?.elapsedMs??null,level:result.final.level,funds,all3,all5}));
} finally {teardownArena(world);Math.random=random;Date.now=clock;}

