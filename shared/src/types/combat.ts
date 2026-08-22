export type CombatArchetype = 'cadence' | 'cooldown' | 'energy' | 'reload' | 'dot' | 'summoner' | null;

/**
 * A temporary absorb pool ("ward"). Explicitly timed and use-it-or-lose-it —
 * the counterpart to the permanent, self-recharging barrier.
 */
export interface WardState {
  amount: number;
  maxAmount: number;
  remainingMs: number;
}

/**
 * The permanent absorb pool ("barrier"). Sized as a fraction of max HP, it sits
 * in front of HP at all times and never expires. After `BARRIER_DELAY_MS` without
 * taking damage (direct hits AND DoT ticks both count) it refills at
 * `BARRIER_RECHARGE_PCT` of `max` per second.
 *
 * `recharging` is the only piece of recharge state that is networked; the
 * last-damaged timestamp lives on the server's `TracksCombat` so stamping it on
 * every hit does not dirty the slice.
 */
export interface BarrierState {
  current: number;
  max: number;
  recharging: boolean;
}

export type MonsterAIState =
  | 'idle'
  | 'wandering'
  | 'chasing'
  | 'attacking'
  | 'returning'
  | 'knocked-back';
