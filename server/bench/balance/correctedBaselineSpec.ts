import assert from 'node:assert/strict';
const raw = require('./correctedBaselineCases.json');
import type { EncounterCell } from './encounterCounterplaySpec';
export const T4_ID='corrected-baseline-followup-01';
export const T4_CELLS=raw as EncounterCell[];
export const T4_SNAPSHOTS=Object.fromEntries(T4_CELLS.map(c=>[c.snapshotId,c.progressionSnapshot]));
export const T4_BLOCKS:Record<string,{cells:EncounterCell[];durationMs:number;pilotIds:string[]}>=Object.fromEntries(T4_CELLS.map(c=>[c.id,{cells:[c],durationMs:c.durationMs,pilotIds:[]}]));
for(const seed of [101009,101033])for(const node of [...new Set(T4_CELLS.map(c=>c.nodeId))]){const cells=T4_CELLS.filter(c=>c.seed===seed&&c.nodeId===node);T4_BLOCKS['qualification-'+seed+'-'+node]={cells,durationMs:cells[0].durationMs,pilotIds:[]};}
export function assertT4Definitions(){assert.equal(T4_CELLS.length,32);assert.equal(new Set(T4_CELLS.map(c=>c.id)).size,32);for(const [b,n] of [['C4',16],['C1',4],['V4',12]] as const)assert.equal(T4_CELLS.filter(c=>c.block===b).length,n);for(const c of T4_CELLS){assert(!c.nodeId.includes('graveyard'));assert(!c.runeRules?.some(r=>r.actionId==='wait-it-out'));assert.equal(c.durationMs,c.block==='C1'?1200000:c.role==='boss'?300000:600000);}}
assertT4Definitions();
