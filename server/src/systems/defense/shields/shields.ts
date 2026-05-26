import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { attachComponent, detachComponent } from '../../../ecs/markerHelpers';
import { registerCombatListener } from '../../combat/engine/combatPipeline';

/**
 * Apply a temporary shield to a player.
 *
 * @param amount     Shield HP. Caller is responsible for scaling by maxHp if needed.
 * @param durationMs Duration in ms. 0 or negative = permanent until fully depleted.
 */
export function applyShield(world: World, player: PlayerEntity, amount: number, durationMs: number): void {
  if (amount <= 0) return;
  const shield = {
    amount,
    maxAmount: amount,
    remainingMs: durationMs > 0 ? durationMs : -1,
  };
  if (player.holdsShields) {
    player.holdsShields.shields.push(shield);
  } else {
    attachComponent(world, player, 'holdsShields', { shields: [shield] });
  }
}

/**
 * Convenience: apply a shield sized as a fraction of the player's max HP.
 * e.g. applyShieldPercent(player, 0.20, 5000) → 20% maxHp shield for 5 s.
 */
export function applyShieldPercent(
  world: World,
  player: PlayerEntity,
  pct: number,
  durationMs: number,
): void {
  applyShield(world, player, Math.round(player.hasHealth.maxHp * pct), durationMs);
}

/**
 * Tick shield timers and remove expired ones.
 * Call once per world tick, before combat resolution, so shields that
 * expire mid-tick are gone before they can absorb damage in that tick.
 */
export function updateShields(world: World, dt: number): void {
  for (const player of world.shieldedPlayers) {
    const shields = player.holdsShields.shields;

    for (const shield of shields) {
      if (shield.remainingMs > 0) {
        shield.remainingMs = Math.max(0, shield.remainingMs - dt);
      }
    }

    const active = shields.filter(
      s => s.amount > 0 && (s.remainingMs === -1 || s.remainingMs > 0),
    );
    if (active.length > 0) {
      player.holdsShields.shields = active;
    } else {
      detachComponent(world, player, 'holdsShields');
    }
  }
}

/**
 * Register the shield-absorption listener on `onDamageTaken`. Walks the
 * defender's shield stack (oldest first) and drains incoming damage off each
 * shield's `amount` field until either damage is exhausted or all shields are
 * dry. Shields whose `amount` reaches zero are filtered out at the end.
 */
export function registerShieldAbsorb(): void {
  registerCombatListener('onDamageTaken', (ctx, _world) => {
    if (ctx.defenderType !== 'player') return;
    if (ctx.damage <= 0) return;

    const player = ctx.defender;
    const shieldComponent = player.holdsShields;
    if (!shieldComponent) return;

    let remaining = ctx.damage;
    for (const shield of shieldComponent.shields) {
      if (remaining <= 0) break;
      const absorbed = Math.min(shield.amount, remaining);
      shield.amount -= absorbed;
      remaining     -= absorbed;
    }
    shieldComponent.shields = shieldComponent.shields.filter(s => s.amount > 0);
    ctx.damage     = Math.max(0, remaining);
  });
}
