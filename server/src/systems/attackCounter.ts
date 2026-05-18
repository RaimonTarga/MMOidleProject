import { getCounter, addCounter, setCounter } from './combatState';
import type { CombatState } from './combatState';
import { registerCombatListener } from './combatPipeline';
import type { CombatContext, CombatEventName } from './combatPipeline';
import type { World } from '../world/World';

// ── Standalone counter helpers ────────────────────────────────────────────────
//
// Thin semantic wrappers over combatState.counters.
// Use a named key to track a specific counter on an entity's CombatState.
// Callers are responsible for choosing non-colliding keys.

const DEFAULT_HIT_KEY = 'hitCount';

export function getAttackCount(state: CombatState, key = DEFAULT_HIT_KEY): number {
  return getCounter(state, key);
}

/** Increment by 1 and return the new count. */
export function incrementAttackCount(state: CombatState, key = DEFAULT_HIT_KEY): number {
  addCounter(state, key, 1);
  return getCounter(state, key);
}

export function resetAttackCount(state: CombatState, key = DEFAULT_HIT_KEY): void {
  setCounter(state, key, 0);
}

// ── Threshold trigger system ──────────────────────────────────────────────────

export interface AttackThresholdOptions {
  /**
   * Restrict to one attacker type. Omit to count hits from both players and monsters.
   */
  attackerType?: 'player' | 'monster';
  /**
   * Pipeline phase to fire on. Default: 'onHit' so the handler can still
   * modify ctx.damage before it is applied.
   * Use 'afterHit' for side effects that should not touch damage.
   */
  event?: CombatEventName;
  /**
   * If set, only fires when the attacker's combatArchetype matches this value.
   * Uses the shared CombatArchetype field — no cast or import needed at the call site.
   */
  attackerArchetype?: string;
}

/**
 * Register a recurring "every N successful attacks" effect.
 *
 * The counter lives at combatState.counters[key] on the attacker and is
 * owned exclusively by this registration — do not share a key between two
 * registerAttackThreshold calls or between this and manual incrementAttackCount
 * calls, as that would double-count.
 *
 * Cancelled attacks never reach onHit/afterHit, so they are automatically
 * excluded from the count — no explicit guard is needed.
 *
 * Counters are per-entity: each player/monster has their own CombatState,
 * so thresholds fire independently for every attacker.
 */
export function registerAttackThreshold(
  key: string,
  threshold: number,
  onTrigger: (ctx: CombatContext, world: World) => void,
  options: AttackThresholdOptions = {},
): void {
  const phase = options.event ?? 'onHit';

  registerCombatListener(phase, (ctx, world) => {
    if (options.attackerType && ctx.attackerType !== options.attackerType) return;
    if (options.attackerArchetype && ctx.attacker.combatArchetype !== options.attackerArchetype) return;

    const state = ctx.attackerType === 'player'
      ? world.playerCombatState.get(ctx.attacker.id)
      : world.monsterCombatState.get(ctx.attacker.id);
    if (!state) return;

    const newCount = incrementAttackCount(state, key);

    if (newCount >= threshold) {
      resetAttackCount(state, key);
      onTrigger(ctx, world);
    }
  });
}

// ── Prototype effect: every 5th player hit deals double damage ────────────────
//
// This is a proof-of-concept that exercises the threshold system end-to-end.
// It is intentionally simple: deterministic, no RNG, visible in the damage log.
//
// Replace or gate this behind a feature flag once real class mechanics land.
// The counter key 'bonusHitCounter' is reserved for this effect.

export function initPrototypeBonusHit(): void {
  registerAttackThreshold(
    'bonusHitCounter',
    5,
    (ctx, _world) => {
      const base = ctx.damage;
      ctx.damage = base * 2;

      // Signal the event through metadata so future VFX/UI systems can react
      // without coupling to console output.
      ctx.metadata['bonusHit']    = true;
      ctx.metadata['bonusDamage'] = base; // the extra damage added

      console.log(
        `[BonusHit] ${ctx.attacker.id} 5th-hit triggered on ${ctx.defender.id}: ` +
        `${base} → ${ctx.damage} damage (+${base})`,
      );
    },
    { attackerType: 'player', event: 'onHit', attackerArchetype: 'cadence' },
  );
}
