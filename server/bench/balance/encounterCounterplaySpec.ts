import assert from 'node:assert/strict';
import { runicPointLoadoutCost } from '@mmo-idle/shared';
import { PROGRESSION_CELLS, type ProgressionCell } from './overnightProgressionSpec';
export const ENCOUNTER_ID='encounter-counterplay-01';
export type EncounterCell=ProgressionCell & {referenceObservationId:string;referenceSource:string;durationMs:number};
const references:Record<string,string>={
 J1:'op-t3-striker-light-jungle-t3-developed',
 J2:'op-t3-apprentice-balanced-jungle-t3-developed',
 V1:'op-t3-striker-light-volcanic-t3-developed',
 P1:'op-t2-squire-light-plains-boss',
 M1:'op-t3-apprentice-balanced-mountain-boss',
 E1:'op-t3-apprentice-balanced-volcanic-boss',
};
export const ENCOUNTER_CELLS:EncounterCell[]=[];
for(const [block,prefix] of Object.entries(references))for(const seed of [101009,101033]){
 const ref=PROGRESSION_CELLS.find(c=>c.id===`${prefix}-s${seed}`);assert(ref);
 for(const arm of seed===101009?['control','candidate']:['candidate','control']){
  const c=structuredClone(ref) as EncounterCell;
  c.id=`ec-${block}-s${seed}-${arm}`;c.build.id=c.id;
  Object.assign(c,{block,arm,comparisonId:`ec-${block}-s${seed}`,durationMs:c.role==='farm'?600000:300000,
   referenceObservationId:ref.id,referenceSource:'c14d62afa2267b57207e1ef8b65c3fd90144c0a6'});
  if(arm==='candidate'){
   if(block==='J1'||block==='J2'){assert.equal(c.build.gearItemIds.armor,'swamp-vest-t3');c.build.gearItemIds.armor='mountain-vest-t3';}
   if(block==='V1'){assert.equal(c.stance,'offensive-stance');c.stance='defensive-stance';}
   if(block==='P1'){assert(!c.abilities!.guards.includes('brace'));c.abilities!.guards.push('brace');}
   if(block==='M1'){assert(!c.abilities!.guards.includes('endure'));c.abilities!.guards.push('endure');}
   if(block==='E1'){
    assert.deepEqual(c.abilities!.techniques,['sweep']);c.abilities!.techniques=['detonate'];
    const i=c.runeRules!.findIndex(r=>r.conditionId==='target-casting'&&r.actionId==='use-ability'&&r.targetAbilityId==='brace');assert(i>=0);
    c.runeRules![i]={conditionId:'target-max-stacks',actionId:'use-ability',targetAbilityId:'detonate'};
   }
  }
  const cost=runicPointLoadoutCost({rules:c.runeRules!,abilities:c.abilities!,stances:c.stance?[c.stance]:[],rites:[]});
  assert(cost<=c.progressionSnapshot!.rp,`${c.id}: ${cost}/${c.progressionSnapshot!.rp} RP`);
  ENCOUNTER_CELLS.push(c);
 }
}
export const ENCOUNTER_BLOCKS:Record<string,{cells:EncounterCell[];durationMs:number;pilotIds:string[]}>=Object.fromEntries(ENCOUNTER_CELLS.map(c=>[c.id,{cells:[c],durationMs:c.durationMs,pilotIds:[]} ]));
for(const c of ENCOUNTER_CELLS){const key=`qualification-${c.seed}-${c.role}-${c.boss??c.durationMs}`;
 (ENCOUNTER_BLOCKS[key]??={cells:[],durationMs:c.durationMs,pilotIds:[]}).cells.push(c);}
export function assertEncounterDefinitions(){
 assert.equal(ENCOUNTER_CELLS.length,24);assert.equal(new Set(ENCOUNTER_CELLS.map(c=>c.id)).size,24);
 for(let i=0;i<24;i+=2){const a=ENCOUNTER_CELLS[i],b=ENCOUNTER_CELLS[i+1];assert.equal(a.comparisonId,b.comparisonId);assert.notEqual(a.arm,b.arm);assert.equal(a.arm,a.seed===101009?'control':'candidate');}
}
assertEncounterDefinitions();
