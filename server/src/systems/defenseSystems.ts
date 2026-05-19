import type { PlayerState, ShieldState } from '@mmo-idle/shared';
import { registerCombatListener } from './combatPipeline';
import { getCounter, addCounter, setCounter } from './combatState';
import type { World } from '../world/World';

// ── Constants ─────────────────────────────────────────────────────────────────

const EVASION_KEY = 'evasionHits';

// ── Init ──────────────────────────────────────────────────────────────────────

/**
 * Register all defense-layer combat pipeline listeners.
 * Call once at server startup, after weapon effects are registered,
 * so defense listeners run last within the onDamageTaken phase.
 *
 * Listener registration order within onDamageTaken:
 *   1. Weapon / archetype effects (may modify ctx.damage)
 *   2. Evasion check  ← registered here (may zero ctx.damage)
 *   3. Shield absorption ← registered here (only if damage > 0)
 *
 * Add new passive defense mechanics (block, reflect, thorns…) here so
 * they slot into the same ordered pipeline without touching combat.ts.
 */
export function initDefenseSystems(): void {
  // ── Evasion — registered first so it zeros damage before shields drain ────
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.defenderType !== 'player') return;
    const player = ctx.defender as PlayerState;
    if (player.evasion <= 0) return;

    const state = world.playerCombatState.get(player.id);
    if (!state) return;

    addCounter(state, EVASION_KEY, 1);
    const count = getCounter(state, EVASION_KEY);

    if (count >= player.evasion) {
      setCounter(state, EVASION_KEY, 0);
      player.evasionCount      = 0;
      ctx.damage               = 0;
      ctx.metadata['evaded']   = true;
    } else {
      player.evasionCount = count;
    }
  });

  // ── Shield absorption — skips evaded hits (damage already 0) ─────────────
  registerCombatListener('onDamageTaken', (ctx, _world) => {
    if (ctx.defenderType !== 'player') return;
    if (ctx.damage <= 0) return; // evaded or fully mitigated upstream

    const player = ctx.defender as PlayerState;
    if (player.shields.length === 0) return;

    let remaining = ctx.damage;
    for (const shield of player.shields) {
      if (remaining <= 0) break;
      const absorbed  = Math.min(shield.amount, remaining);
      shield.amount  -= absorbed;
      remaining      -= absorbed;
    }
    // Prune fully-depleted shields immediately; timed expiry handled by updateShields.
    player.shields = player.shields.filter(s => s.amount > 0);
    ctx.damage     = Math.max(0, remaining);
  });
}

// ── Shield management ─────────────────────────────────────────────────────────

/**
 * Apply a temporary shield to a player.
 *
 * @param amount     Shield HP. Caller is responsible for scaling by maxHp if needed.
 * @param durationMs Duration in ms. 0 or negative = permanent until fully depleted.
 */
export function applyShield(player: PlayerState, amount: number, durationMs: number): void {
  if (amount <= 0) return;
  player.shields.push({
    amount,
    maxAmount: amount,
    remainingMs: durationMs > 0 ? durationMs : -1,
  });
}

/**
 * Convenience: apply a shield sized as a fraction of the player's max HP.
 * e.g. applyShieldPercent(player, 0.20, 5000) → 20% maxHp shield for 5 s.
 */
export function applyShieldPercent(
  player: PlayerState,
  pct: number,
  durationMs: number,
): void {
  applyShield(player, Math.round(player.maxHp * pct), durationMs);
}

/**
 * Tick shield timers and remove expired ones.
 * Call once per world tick, before combat resolution, so shields that
 * expire mid-tick are gone before they can absorb damage in that tick.
 */
export function updateShields(world: World, dt: number): void {
  for (const player of world.players.values()) {
    if (player.shields.length === 0) continue;

    for (const shield of player.shields) {
      if (shield.remainingMs > 0) {
        shield.remainingMs = Math.max(0, shield.remainingMs - dt);
      }
    }

    // Keep: still has HP AND (permanent sentinel OR timer not yet expired)
    player.shields = player.shields.filter(
      s => s.amount > 0 && (s.remainingMs === -1 || s.remainingMs > 0),
    );
  }
}
