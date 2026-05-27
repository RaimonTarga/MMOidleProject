export type BenchScenarioId = 'idle' | 'autoCombatSameNode' | 'spreadNodes';

export interface BenchScenario {
  id: BenchScenarioId;
  label: string;
  autoCombat: boolean;
  nodeForIndex: (index: number, total: number) => string;
}

const CLEARING = 'node-5-5';

export const BENCH_SCENARIOS: Record<BenchScenarioId, BenchScenario> = {
  idle: {
    id: 'idle',
    label: 'Idle players (no auto-combat)',
    autoCombat: false,
    nodeForIndex: () => CLEARING,
  },
  autoCombatSameNode: {
    id: 'autoCombatSameNode',
    label: 'Auto-combat, all in clearing',
    autoCombat: true,
    nodeForIndex: () => CLEARING,
  },
  spreadNodes: {
    id: 'spreadNodes',
    label: 'Auto-combat, one player per node grid slot',
    autoCombat: true,
    nodeForIndex: (index) => {
      const row = 1 + Math.floor(index / 9);
      const col = 1 + (index % 9);
      return `node-${Math.min(row, 9)}-${Math.min(col, 9)}`;
    },
  },
};

export function resolveScenario(id: string): BenchScenario | null {
  return BENCH_SCENARIOS[id as BenchScenarioId] ?? null;
}
