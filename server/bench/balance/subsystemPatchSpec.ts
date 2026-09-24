import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runicPointLoadoutCost } from '@mmo-idle/shared';
import type { EncounterCell } from './encounterCounterplaySpec';
export const T4_ID = 'subsystem-patch-candidate-01';
export const T4_CELLS = JSON.parse(readFileSync(join(__dirname, 'subsystemPatchCases.json'), 'utf8')) as EncounterCell[];
export const T4_SNAPSHOTS = Object.fromEntries(T4_CELLS.map(c => [c.snapshotId, c.progressionSnapshot]));
export const T4_BLOCKS = Object.fromEntries(T4_CELLS.flatMap(c => [
  [c.id, { cells: [c], durationMs: c.durationMs, pilotIds: [] }],
  ['qualification-' + c.id, { cells: [c], durationMs: c.durationMs, pilotIds: [] }],
]));
export function assertT4Definitions() {
  assert.equal(T4_CELLS.length, 24);
  assert.equal(new Set(T4_CELLS.map(c => c.id)).size, 24);
  for (const block of ['A', 'B', 'C']) assert.equal(T4_CELLS.filter(c => c.block === block).length, 8);
  for (const c of T4_CELLS) {
    assert([101009, 101033].includes(c.seed));
    assert.equal(c.durationMs, 600000);
    assert.equal(c.role, 'farm');
    assert(!/volcanic|graveyard|dungeon/.test(c.nodeId));
    assert(runicPointLoadoutCost({ rules: c.runeRules!, abilities: c.abilities!, stances: [c.stance!], rites: [] }) <= c.progressionSnapshot!.rp);
  }
}
assertT4Definitions();
