import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { SURVEY_CELLS, type SurveyCell } from './ttkSurveySpec';

export type DurabilityCell = SurveyCell & { treatment: 'control' | 'hp-low' | 'hp-high' };
// One natural node per biome, not a claim to exhaustive node/elite coverage.
const nodes = ['cave-02','mountain-04','swamp-03','jungle-03','tundra-03','desert-03','volcanic-03'];
export const DURABILITY_CELLS: DurabilityCell[] = [
  ...SURVEY_CELLS.filter(c => c.tier < 3 && !c.alternate && c.role !== 'swarm')
    .map(c => ({ ...c, id: `dur-${c.id}-control`, treatment: 'control' as const })),
  ...nodes.flatMap(node => SURVEY_CELLS.filter(c => c.tier === 3 && c.role === 'solo').flatMap(c => {
    const group = node.slice(0, -3);
    return (['control','hp-low','hp-high'] as const).map(treatment => {
      const id = `dur-t3-${group}-${c.className}-${c.alternate ? 'weapon-alt' : 'baseline'}-${treatment}`;
      return { ...c, id, role: group, nodeId: `node-t3-${node}`, treatment,
        build: { ...c.build, id, gearItemIds: { ...c.build.gearItemIds,
          armor: `${group}-vest-t3`, recovery: `${group}-charm-t3` } } };
    });
  })),
];

export function hpMultiplier(cell: DurabilityCell, type: string): number {
  if (cell.treatment === 'control' || cell.tier !== 3) return 1;
  if (cell.role === 'desert' && !['dune-stalker','desert-basilisk'].includes(type)) return 1;
  const swarm = ['jungle','volcanic'].includes(cell.role);
  return cell.treatment === 'hp-low' ? (swarm ? 1.10 : 1.25) : (swarm ? 1.20 : 1.50);
}

// In-process, reversible definition overlay: normal spawning AND repopulation
// inherit identical HP treatment. No live data file or combat formula is edited.
export function installDurabilityTreatment(cell: DurabilityCell) {
  const saved = [...MONSTER_DATABASE].map(([id, def]) => [id, def.stats.hp] as const);
  const changes: { type: string; before: number; after: number }[] = [];
  for (const [id, hp] of saved) {
    const def = MONSTER_DATABASE.get(id)!;
    // Only definitions in the observed node can spawn there; restore ALL entries
    // on exit. Treatment is never carried into the next independent world.
    const factor = def.biome === cell.role ? hpMultiplier(cell, id) : 1;
    if (factor !== 1) {
      def.stats.hp = Math.round(hp * factor);
      changes.push({ type: id, before: hp, after: def.stats.hp });
    }
  }
  return { changes, restore() {
    for (const [id, hp] of saved) MONSTER_DATABASE.get(id)!.stats.hp = hp;
    for (const [id, hp] of saved) assert.equal(MONSTER_DATABASE.get(id)!.stats.hp, hp);
  } };
}
