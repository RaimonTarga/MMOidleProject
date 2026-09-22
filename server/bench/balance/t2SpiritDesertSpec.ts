import assert from 'node:assert/strict';
import { T2_MULTI_CELLS, T2_LOW_HP_RULE, type T2MultiCell } from './t2MultiBiomeSpec';
export interface FollowupCell extends T2MultiCell { openingFocus: boolean; }
export const FOLLOWUP_CELLS: FollowupCell[] = [];
for (const seed of [101009, 101021]) {
  for (const identity of ['spirit-light', 'spirit-balanced', 'slinger-light', 'striker-light', 'striker-balanced']) {
    const blockB = identity.startsWith('striker');
    for (const biome of blockB ? ['desert'] : ['swamp', 'mountain']) {
      const old = T2_MULTI_CELLS.find(c => c.identityId === `breadth-t2-${identity}` && c.biome === biome && c.seed === seed && c.arm === 'primary')!;
      assert(old);
      const arms = blockB ? ['native', 'opening-lowhp'] : ['stinger', 'axe'];
      for (const arm of seed === 101009 ? arms : [...arms].reverse()) {
        const c = structuredClone(old) as FollowupCell;
        const comparisonId = `t2sd-${identity}-${biome}-s${seed}`;
        Object.assign(c, { id: `${comparisonId}-${arm}`, comparisonId, block: blockB ? 'B' : 'A', arm,
          referenceCaseId: old.id, delayedFocus: false, openingFocus: arm === 'opening-lowhp' });
        c.build.id = c.id;
        if (!blockB) {
          c.build.gearItemIds.weapon = arm === 'stinger' ? 'jungle-stinger-rapier' : 'ruinous-axe';
          c.abilities!.techniques = [biome === 'swamp' ? 'sweep' : 'power-strike'];
        }
        if (c.openingFocus) c.runeRules = [T2_LOW_HP_RULE, ...c.runeRules!];
        c.preparationNotes = [old.preparationNotes[0], 'Mature synthetic T2; original mastery, ordinary +5 clamped per item, core unchanged.',
          'Fixed 32-cell follow-up; no midpoint edits, extra combat, Wait It Out, Endure or numerical treatments.',
          blockB ? 'Both policies reserve 90 yellow initially; candidate crafts and validates Focus Lowest HP at time zero.' : 'Fixed support and Technique; whole weapon comparison.'];
        FOLLOWUP_CELLS.push(c);
      }
    }
  }
}
assert.equal(FOLLOWUP_CELLS.length, 32);
assert.equal(new Set(FOLLOWUP_CELLS.map(c => c.id)).size, 32);
export const FOLLOWUP_BLOCKS = Object.fromEntries([
  ...FOLLOWUP_CELLS.map(c => [c.id, { cells: [c], durationMs: 600000, pilotIds: [] }]),
  ['qualification', { cells: FOLLOWUP_CELLS, durationMs: 600000, pilotIds: [] }],
]);
