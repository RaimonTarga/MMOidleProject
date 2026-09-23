import assert from 'node:assert/strict';
import { SKILL_TREE, NODE_BIOMES, DUNGEON_DEFS, runicPointLoadoutCost } from '@mmo-idle/shared';
import { BREADTH_CELLS } from './playerBreadthSpec';
import type { EncounterCell } from './encounterCounterplaySpec';
export const T4_ID='t4-specialization-screen-01';
export const T4_SNAPSHOT={id:'t4-established-gm148',tier:4,mastery:{plains:12,forest:12,swamp:18,cave:18,mountain:24,jungle:18,desert:18,volcanic:12,tundra:12,graveyard:4,trench:0},gm:148,rp:45,plus:4};
export const T4_CONTEXTS=[
 {id:'F1',node:'node-t4-volcanic-01',boss:null},
 {id:'F2',node:'node-t4-tundra-01',boss:null},
 {id:'B1',node:'node-t4-mountain-dungeon',boss:'iron-crest-titan'},
 {id:'B2',node:'node-t4-graveyard-dungeon',boss:'charnel-crown-sovereign'},
];
const roots=['striker','squire','apprentice','slinger','conduit','spirit'];
const frames=['light','balanced','heavy'];
export const T4_CELLS:EncounterCell[]=[];
// Rotate the frame/path/context offsets between roots so early partials cover all axes.
for(const seed of [101009,101033])for(let round=0;round<36;round++)for(let ri=0;ri<6;ri++){
 const context=T4_CONTEXTS[(round+ri)%4],variant=(Math.floor(round/4)+ri)%9;
 const frame=frames[variant%3],path=['a','b','c'][Math.floor(variant/3)];
 const identityId=`breadth-t4-${roots[ri]}-${frame}-${path}`;
 const old=BREADTH_CELLS.find(c=>c.identityId===identityId&&c.playerTreatment==='untreated'&&c.role===(context.boss?'boss':'farm'));assert(old);
 const c=structuredClone(old) as EncounterCell;
 const id=`t4-${roots[ri]}-${frame}-${path}-${context.id}-s${seed}`;
 Object.assign(c,{id,seed,block:context.id,arm:'control',comparisonId:id,identityId,snapshotId:T4_SNAPSHOT.id,progressionSnapshot:T4_SNAPSHOT,
  referenceObservationId:old.id,referenceSource:'historical-player-breadth-only',durationMs:context.boss?300000:600000,
  nodeId:context.node,isDungeon:!!context.boss,targetTypes:context.boss?[context.boss]:[],upgradeLevel:4});
 c.build.id=id;if(context.boss)c.boss=context.boss;
 const spec=c.build.skillPath.at(-1)!;
 // Medium Apprentice references and genuinely high-Attack Heavy references.
 if(c.className==='apprentice')c.build.gearItemIds.weapon=frame==='heavy'?'mountain-earthsunder-maul':'graveyard-plague-axe';
 c.build.gearItemIds.armor='mountain-vest-t4';
 c.build.gearItemIds.recovery='mountain-charm-t4';
 c.build.gearItemIds.mobility='mountain-boots-t4';
 c.stance='defensive-stance';
 const stationary=['cooldown-heavy-t3-c','reload-heavy-t3-a','energy-light-t3-c','dot-heavy-t3-c'].includes(spec);
 c.runeRules=c.runeRules!.filter(r=>r.actionId!=='orbit'&&r.targetAbilityId!=='brace');
 if(c.range!=='close'&&!stationary)c.runeRules.push({conditionId:'in-combat',actionId:'orbit'});
 const swarm=context.id==='F1'||context.id==='B2';
 const heavy=c.build.gearItemIds.weapon==='mountain-earthsunder-maul'||(c.className==='squire'&&frame!=='light'&&!stationary);
 const autoConsumesOrUncapped=['dot-light-t3-a','dot-light-t3-b','dot-balanced-t3-c'].includes(spec);
 const aoe=c.className==='apprentice'&&!autoConsumesOrUncapped?'contagion':heavy?'slam':'sweep';
 c.abilities={techniques:swarm?[aoe,'expose-weakness']:['expose-weakness'],guards:['second-wind','brace','cleanse']};
 if(swarm&&aoe==='slam')c.runeRules.push({conditionId:'n-aggro-3',actionId:'use-ability',targetAbilityId:'slam'});
 if(swarm&&aoe==='contagion')c.runeRules.push({conditionId:'target-max-stacks',actionId:'use-ability',targetAbilityId:'contagion'});
 if(context.id==='B2')c.runeRules.unshift({conditionId:'in-combat',actionId:'focus-lowest-hp'});
 if(context.id==='B1')c.abilities.guards.push('endure');
 if(context.id==='F2')c.abilities.guards.push('break-free');
 c.preparationNotes=[SKILL_TREE.get(spec)!.description,
  ...(autoConsumesOrUncapped?['Slam/Sweep substitutes for Fully Afflicted Contagion: this path consumes max stacks immediately or has an uncapped stacking identity. No unreachable max-stack rule.']:[]),
  'Established GM148/45 RP; ordinary T4 +4, core/relic +0; finite prior paid ownership, no acquisition-time claim.',
  'Defensive stance throughout; native Guard triggers; telegraph escape and hazard avoidance remain. No Wait It Out or low-health Flee.',
  stationary?'Stationary/channel payoff: Orbit omitted; deliberate danger escape can interrupt payoff.':'Native close exception or mid-range Orbit as declared.',
  swarm?`${aoe}: ${aoe==='slam'?'Surrounded (3 aggro) only':aoe==='contagion'?'Fully Afflicted; copies owned payload without consuming it':'production native delivery'}; repeated add/pack work.`:'Single-target Expose Weakness; no automatic AoE windup at a lone target.',
  context.id==='B1'?'T4 Titan Charge -> conditional Earthshatter -> fault lines; native Endure tanking support plus lane escape, not inherited T3 timing.':'Persistent mitigation and recovery complement reactive Guard cooldown gaps.',
  'Unused RP preserves the defining mechanism and avoids redundant casts; this is one credible package, not an optimum.'
 ];
 const cost=runicPointLoadoutCost({rules:c.runeRules,abilities:c.abilities,stances:[c.stance],rites:[]});assert(cost<=45,`${id}: ${cost}/45 RP`);
 T4_CELLS.push(c);
}
export const T4_BLOCKS:Record<string,{cells:EncounterCell[];durationMs:number;pilotIds:string[]}>=Object.fromEntries(T4_CELLS.map(c=>[c.id,{cells:[c],durationMs:c.durationMs,pilotIds:[]}]));
for(const seed of [101009,101033])for(const context of T4_CONTEXTS){const cells=T4_CELLS.filter(c=>c.seed===seed&&c.block===context.id);T4_BLOCKS[`qualification-${seed}-${context.id}`]={cells,durationMs:cells[0].durationMs,pilotIds:[]};}
export function assertT4Definitions(){
 assert.equal(T4_CELLS.length,432);assert.equal(new Set(T4_CELLS.map(c=>c.id)).size,432);
 const paths=[...SKILL_TREE.values()].filter(n=>/^(cadence|cooldown|dot|reload|summoner|energy)-(light|balanced|heavy)-t3-[abc]$/.test(n.id));
 assert.equal(paths.length,54);assert.deepEqual([...new Set(T4_CELLS.map(c=>c.build.skillPath.at(-1)))].sort(),paths.map(n=>n.id).sort());
 for(const context of T4_CONTEXTS){assert.equal(T4_CELLS.filter(c=>c.block===context.id).length,108);assert.equal(NODE_BIOMES[context.node].biomeTier,4);if(context.boss)assert.equal(DUNGEON_DEFS.get(context.node)?.boss.bossId,context.boss);}
}
assertT4Definitions();
