import { getCounter, addCounter, setCounter } from './combatState';
import type { CombatState } from './combatState';
import { registerCombatListener } from './combatPipeline';
import type { CombatContext, CombatEventName } from './combatPipeline';
import type { World } from '../world/World';

// ── Threshold trigger system ──────────────────────────────────────────────────
//
// Generic "every N confirmed hits" effect. Class archetypes and passive nodes
// that need a hit counter should use this rather than rolling their own counter
// logic. Each registration owns its key exclusively — do not share keys between
// registrations or between this and manual counter calls.
//
// Cancelled attacks never reach onHit/afterHit, so they are automatically
// excluded from the count.

export interface AttackThresholdOptions {
  /** Restrict to one attacker type. Omit to count hits from both sides. */
  attackerType?: 'player' | 'monster';
  /**
   * Pipeline phase to fire on. Default: 'onHit' so the handler can still
   * modify ctx.damage before it is applied.
   * Use 'afterHit' for side effects that must not touch damage.
   */
  event?: CombatEventName;
  /** If set, only fires when attacker.combatArchetype matches this value. */
  attackerArchetype?: string;
}

/**
 * Register a recurring "every N successful attacks" effect.
 *
 * The counter lives at combatState.counters[key] on the attacker.
 * Counters are per-entity — each player/monster tracks their own count.
 *
 * Returns the registered handler so callers can unregister it if needed
 * (e.g. when a buff expires or an item is unequipped).
 */
export function registerAttackThreshold(
  key: string,
  threshold: number,
  onTrigger: (ctx: CombatContext, world: World, state: CombatState) => void,
  options: AttackThresholdOptions = {},
): (ctx: CombatContext, world: World) => void {
  const phase = options.event ?? 'onHit';

  const handler = (ctx: CombatContext, world: World): void => {
    if (options.attackerType && ctx.attackerType !== options.attackerType) return;
    if (options.attackerArchetype) {
      const archetype = ctx.attackerType === 'player'
        ? ctx.attacker.usesSkills.combatArchetype
        : ctx.attacker.isMonster.combatArchetype;
      if (archetype !== options.attackerArchetype) return;
    }

    const state = ctx.attacker.tracksCombat;

    addCounter(state, key, 1);
    const count = getCounter(state, key);

    if (count >= threshold) {
      setCounter(state, key, 0);
      onTrigger(ctx, world, state);
    }
  };

  registerCombatListener(phase, handler);
  return handler;
}
