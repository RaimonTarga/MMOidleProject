import type { PlayerState, MonsterState } from '@mmo-idle/shared';
import type { World } from '../world/World';

// ── Event names ───────────────────────────────────────────────────────────────

export type CombatEventName =
  | 'beforeAttack'   // before cooldown-gated attack fires; set ctx.cancelled=true to abort
  | 'onAttack'       // attack confirmed, damage not yet calculated
  | 'onHit'          // damage calculated (attacker perspective); can modify ctx.damage
  | 'onDamageTaken'  // damage calculated (defender perspective); can modify ctx.damage
  | 'afterHit'       // damage applied, entity still alive (or dead — check ctx.defender.hp)
  | 'onKill';        // defender hp ≤ 0, before removal/respawn

// ── Combat context ────────────────────────────────────────────────────────────

export type CombatAttacker = PlayerState | MonsterState;
export type CombatDefender = PlayerState | MonsterState;

/**
 * Mutable bag that flows through every hook in a single attack event.
 * Handlers read and write this object; the combat system applies the
 * final values after all hooks for a phase have run.
 */
export interface CombatContext {
  attacker: CombatAttacker;
  attackerType: 'player' | 'monster';
  defender: CombatDefender;
  defenderType: 'player' | 'monster';
  /** Computed raw damage; hooks may increase or clamp it. */
  damage: number;
  /** Set to true in a beforeAttack handler to skip the entire attack. */
  cancelled: boolean;
  /**
   * Arbitrary key-value store for hooks to communicate side-band data
   * (e.g. { isCrit: true }, { afflictionApplied: 'burn' }) without
   * extending the interface for every future mechanic.
   */
  metadata: Record<string, unknown>;
}

// ── Handler type ──────────────────────────────────────────────────────────────

export type CombatEventHandler = (ctx: CombatContext, world: World) => void;

// ── Registry (module-level singleton, server-only) ────────────────────────────

const _listeners = new Map<CombatEventName, CombatEventHandler[]>();

/**
 * Subscribe a handler to a combat event.
 * Call from any server module; handlers persist for the process lifetime.
 */
export function registerCombatListener(
  event: CombatEventName,
  handler: CombatEventHandler,
): void {
  const existing = _listeners.get(event);
  if (existing) {
    existing.push(handler);
  } else {
    _listeners.set(event, [handler]);
  }
}

/**
 * Remove a previously registered handler.
 * Useful for item/buff teardown when a mechanic expires.
 */
export function unregisterCombatListener(
  event: CombatEventName,
  handler: CombatEventHandler,
): void {
  const existing = _listeners.get(event);
  if (!existing) return;
  const idx = existing.indexOf(handler);
  if (idx !== -1) existing.splice(idx, 1);
}

// ── Emitter ───────────────────────────────────────────────────────────────────

/** Run all registered handlers for an event in registration order. */
export function emitCombatEvent(
  event: CombatEventName,
  ctx: CombatContext,
  world: World,
): void {
  const handlers = _listeners.get(event);
  if (!handlers) return;
  for (const handler of handlers) {
    handler(ctx, world);
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

/** Build a fresh context for one attack. Damage starts at 0; the combat
 *  system sets it between onAttack and onHit. */
export function makeCombatContext(
  attacker: CombatAttacker,
  attackerType: 'player' | 'monster',
  defender: CombatDefender,
  defenderType: 'player' | 'monster',
): CombatContext {
  return {
    attacker,
    attackerType,
    defender,
    defenderType,
    damage: 0,
    cancelled: false,
    metadata: {},
  };
}
