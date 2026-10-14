import { NODE_BIOMES } from '@mmo-idle/shared';

export type BenchScenarioId = 'idle' | 'autoCombatSameNode' | 'spreadNodes';

export interface BenchScenario {
  id: BenchScenarioId;
  label: string;
  autoCombat: boolean;
  nodeForIndex: (index: number, total: number) => string;
}

const T1_PLAINS = 'node-t1-plains-01';

/** Authored T1 nodes. The Clearing is tier 0 and is not a fight. */
const T1_NODES = Object.entries(NODE_BIOMES)
  .filter(([, info]) => info.biomeTier === 1 && info.biomeGroup !== 'clearing')
  .map(([id]) => id);

export const BENCH_SCENARIOS: Record<BenchScenarioId, BenchScenario> = {
  idle: {
    id: 'idle',
    label: 'Idle players (no auto-combat)',
    autoCombat: false,
    nodeForIndex: () => T1_PLAINS,
  },
  autoCombatSameNode: {
    id: 'autoCombatSameNode',
    label: 'Auto-combat, all in one T1 plains node',
    autoCombat: true,
    nodeForIndex: () => T1_PLAINS,
  },
  spreadNodes: {
    id: 'spreadNodes',
    label: 'Auto-combat, spread across T1 nodes',
    autoCombat: true,
    nodeForIndex: (index) => {
      const nodeId = T1_NODES[index % T1_NODES.length];
      if (!nodeId) throw new Error('NODE_BIOMES has no T1 nodes for spreadNodes');
      return nodeId;
    },
  },
};

export function resolveScenario(id: string): BenchScenario | null {
  return BENCH_SCENARIOS[id as BenchScenarioId] ?? null;
}
