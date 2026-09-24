import assert from 'node:assert/strict';
import { ITEM_DATABASE, runicPointLoadoutCost } from '@mmo-idle/shared';
import { T4_CELLS as closing } from './t4ClosingSpec';
import { PROGRESSION_CELLS as progression } from './overnightProgressionSpec';
import type { EncounterCell } from './encounterCounterplaySpec';
export const T4_ID='item-ability-outlier-pass-01';
export type OutlierCell=EncounterCell & {candidate?:'D'|'S'|'A'; rites?:string[]};
export const T4_CELLS:OutlierCell[]=[];
const seeds=[101009,101033];
function reference(spec:string,seed:number){const c=closing.find(c=>c.seed===seed&&c.block==='T'&&c.build.skillPath.at(-1)===spec&&!c.id.endsWith('-alt'));assert(c);return structuredClone(c);}
function add(base:EncounterCell,key:string,arm:string,change:(c:OutlierCell)=>void=()=>{}) {
 const c=structuredClone(base) as OutlierCell;
 c.referenceObservationId=base.id;c.referenceSource='historical package only; fresh current-source control';
 c.id=`outlier-${key}-${arm}-s${c.seed}`;c.build.id=c.id;c.comparisonId=`${key}-s${c.seed}`;c.block=key;c.durationMs=600000;c.arm=arm==='candidate'?'candidate':'control';
 c.preparationNotes=[`Fixed ${key}/${arm} contrast. Native timing. No Blood Offering; no automatic maintenance-rule additions.`,...base.preparationNotes];
 change(c);const cost=runicPointLoadoutCost({rules:c.runeRules!,abilities:c.abilities!,stances:c.stance?[c.stance]:[],rites:c.rites??[]});
 assert(cost<=c.progressionSnapshot!.rp,`${c.id}: ${cost}/${c.progressionSnapshot!.rp}`);T4_CELLS.push(c);
}
for(const seed of seeds){
 // Existing successful ranged packages; two distinct T4 delivery cases, not failed Desert fixtures.
 for(const [name,spec] of [['desert-ritualist','summoner-balanced-t3-c'],['desert-ranger','reload-light-t3-a']]){
  const b=reference(spec,seed);b.build.gearItemIds.mobility='desert-boots-t4';
  for(const arm of ['control','candidate'])add(b,name,arm,c=>{if(arm==='candidate')c.candidate='D';});
 }
 // Established T2 melee Desert and T3 ranged Swamp: actual slow-bearing ecology.
 for(const [name,prefix,boot] of [['swamp-t2','op-t2-squire-light-desert-t2-desert-established','swamp-boots-t2'],['swamp-t3','op-t3-slinger-light-swamp-t3-developed','swamp-boots-t3']]){
  const b=progression.find(c=>c.id===`${prefix}-s${seed}`);assert(b);
  for(const arm of ['control','candidate'])add({...structuredClone(b),durationMs:600000,referenceObservationId:b.id,referenceSource:'overnight-t1-t3-progression-01'},name,arm,c=>{c.build.gearItemIds.mobility=boot;if(arm==='candidate')c.candidate='S';});
 }
 for(const [name,spec] of [['arcanist-reverb','cooldown-balanced-t3-a'],['arcanist-idolwright','summoner-heavy-t3-c']]){
  const b=reference(spec,seed);b.build.gearItemIds.core='core-arcanist';b.build.gearItemIds.mobility='mountain-boots-t4';
  if(name.endsWith('idolwright'))b.abilities!.techniques=['power-strike','frenzy'];
  assert(b.abilities!.techniques.includes('power-strike'));
  for(const arm of ['current','candidate','tempered'])add(b,name,arm,c=>{if(arm==='candidate')c.candidate='A';if(arm==='tempered')c.build.gearItemIds.core='core-tempered';});
 }
 // Power Strike (6 RP) versus Quick Strike (5 RP, one RP left free). These measure the exact whole ability choice,
 // not pure cast time and not an add/remove marginal contribution.
 for(const [name,spec] of [['ability-reverb','cooldown-balanced-t3-a'],['ability-idolwright','summoner-heavy-t3-c']]){
  const b=reference(spec,seed);b.abilities!.techniques=['power-strike','frenzy'];
  for(const arm of ['power-strike','quick-strike'])add(b,name,arm,c=>{c.abilities!.techniques=[arm,'frenzy'];});
 }
 // Existing sparse Tundra fixture, real transitions possible; no promised activation count.
 for(const rite of ['swift-repose','ability-reprieve']){
  const b=reference('cooldown-balanced-t3-a',seed);b.nodeId='node-t4-tundra-01';b.abilities!.techniques=['power-strike','frenzy'];
  for(const arm of ['control','rite'])add(b,`rite-${rite}`,arm,c=>{c.rites=arm==='rite'?[rite]:[];});
 }
}
export const T4_SNAPSHOTS=Object.fromEntries(T4_CELLS.map(c=>[c.snapshotId,c.progressionSnapshot]));
export const T4_BLOCKS:Record<string,{cells:OutlierCell[];durationMs:number;pilotIds:string[]}>=Object.fromEntries(T4_CELLS.map(c=>[c.id,{cells:[c],durationMs:c.durationMs,pilotIds:[]}]));
// One cell per zero-tick child keeps numerical candidate mutations strictly isolated.
for(const c of T4_CELLS)T4_BLOCKS[`qualification-${c.id}`]={cells:[c],durationMs:c.durationMs,pilotIds:[]};
export function assertT4Definitions(){assert.equal(T4_CELLS.length,44);assert.equal(new Set(T4_CELLS.map(c=>c.id)).size,44);for(const c of T4_CELLS){assert(!c.rites?.includes('blood-offering'));assert(!/volcanic|graveyard-dungeon/.test(c.nodeId));}}
assertT4Definitions();
// Test-only numerical proposals. Production definitions on develop are untouched.
// Each child restores the exact authored object; controls never receive candidates.
export function installOutlierCandidate(c:OutlierCell){
 const id=c.candidate==='A'?'core-arcanist':c.candidate?c.build.gearItemIds.mobility:undefined;
 if(!id)return null;
 const item=ITEM_DATABASE.get(id)!;assert(item);const before=structuredClone(item);
 if(c.candidate==='A'){assert.equal(item.mechanicEffects!['technique.power-pct'],.2);item.mechanicEffects={...item.mechanicEffects,'technique.power-pct':.3};}
 if(c.candidate==='D')item.mechanicEffects={...item.mechanicEffects,'mobility.kite-speed-pct':item.tier===2?.2:item.tier===3?.25:.3};
 if(c.candidate==='S'){
  item.mechanicEffects={...item.mechanicEffects,'mobility.slow-resistance':item.tier===2?.4:.5};
  item.upgrades=item.upgrades!.map(u=>({...u,mechanicEffects:{...u.mechanicEffects,'mobility.slow-resistance':.02}}));
 }
 return {restore(){Object.assign(item,before);}};
}
