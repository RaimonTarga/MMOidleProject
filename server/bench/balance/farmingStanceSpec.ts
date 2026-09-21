import assert from 'node:assert/strict';
import { NODE_BIOMES } from '@mmo-idle/shared';
import { BREADTH_CELLS, type BreadthCell } from './playerBreadthSpec';

export const FARMING_STANCE_IDENTITIES = [
  'breadth-t3-striker-balanced', 'breadth-t3-squire-balanced',
  'breadth-t3-apprentice-balanced', 'breadth-t3-conduit-balanced',
  'breadth-t3-conduit-heavy', 'breadth-t4-conduit-heavy-a',
] as const;
export interface FarmingStanceCell extends BreadthCell {
  arm: 'offensive' | 'defensive';
  comparisonId: string;
  originalCaseId: string;
  reconstructionPolicy: 'production-r2' | 'not-applicable';
}
// Fixed before observation: Tundra exchanges Volcanic pressure for Chill/ice ecology;
// Desert exchanges Graveyard attrition for Heat and its authored ranged/controller ecology.
export const FARMING_STANCE_CELLS: FarmingStanceCell[] = FARMING_STANCE_IDENTITIES.flatMap(identityId => {
  const original = BREADTH_CELLS.find(c => c.identityId === identityId && c.role === 'farm' && !c.controlCaseId)!;
  assert(original && original.stance === 'offensive-stance');
  assert.equal(original.nodeId, original.tier === 3 ? 'node-t3-volcanic-03' : 'node-t4-graveyard-03');
  return [original.nodeId, original.tier === 3 ? 'node-t3-tundra-03' : 'node-t4-desert-03'].flatMap(nodeId => {
    const node = NODE_BIOMES[nodeId];
    assert(node && node.biomeTier === original.tier && !node.isDungeon && !node.bossTypeId);
    const comparisonId = `stance-01-${identityId}-${nodeId}`;
    return (['offensive', 'defensive'] as const).map(arm => {
      const cell = structuredClone(original) as FarmingStanceCell;
      Object.assign(cell, { id: `${comparisonId}-${arm}`, nodeId, arm, comparisonId,
        originalCaseId: original.id, stance: `${arm}-stance`,
        reconstructionPolicy: cell.className === 'conduit' ? 'production-r2' : 'not-applicable' });
      cell.build.id = cell.id;
      cell.preparationNotes = original.preparationNotes.filter(n => !n.startsWith('Offensive stance'));
      cell.preparationNotes.push(`${arm} stance is attuned and active throughout; no stance switching.`);
      return cell;
    });
  });
});
assert.equal(FARMING_STANCE_CELLS.length, 24);
export const FARMING_STANCE_BLOCKS = Object.fromEntries(FARMING_STANCE_CELLS.map(cell =>
  [cell.id, { cells: [cell], durationMs: 300000, pilotIds: [] }]));
