import assert from 'node:assert/strict';
import { runicPointLoadoutCost, withReferenceAbilityWiring } from '@mmo-idle/shared';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const raw=JSON.parse(readFileSync(join(__dirname,'volcanoHeatCases.json'),'utf8'));
import type { EncounterCell } from './encounterCounterplaySpec';
export const T4_ID='volcano-heat-management-01';
export const T4_CELLS=raw as (EncounterCell & {policy?:string})[];
export const T4_SNAPSHOTS=Object.fromEntries(T4_CELLS.map(c=>[c.snapshotId,c.progressionSnapshot]));
export const T4_BLOCKS=Object.fromEntries(T4_CELLS.flatMap(c=>[[c.id,{cells:[c],durationMs:c.durationMs,pilotIds:[]}],['qualification-'+c.id,{cells:[c],durationMs:c.durationMs,pilotIds:[]}]]));
export function assertT4Definitions(){assert.equal(T4_CELLS.length,26);assert.equal(new Set(T4_CELLS.map(c=>c.id)).size,26);for(const c of T4_CELLS){assert(runicPointLoadoutCost({rules:withReferenceAbilityWiring(c.runeRules!,c.abilities!),abilities:c.abilities!,stances:c.stance?[c.stance]:[],rites:[]})<=c.progressionSnapshot!.rp);}}
assertT4Definitions();
