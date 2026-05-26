export type CombatArchetype = 'cadence' | 'cooldown' | 'energy' | 'reload' | 'dot' | null;

export interface ShieldState {
  amount: number;
  maxAmount: number;
  remainingMs: number;
}

export type MonsterAIState =
  | 'idle'
  | 'wandering'
  | 'chasing'
  | 'attacking'
  | 'returning'
  | 'knocked-back';
