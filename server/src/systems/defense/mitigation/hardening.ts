import { getResource, setResource } from '@mmo-idle/shared';
import { registerCombatListener } from '../../combat/engine/combatPipeline';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';

const BONUS_KEY = 'hardeningBonus';

/**
 * Returns the current integer plating bonus from hardening.
 * Used by the buff descriptor to display stacks.
 */
export function getHardeningBonus(player: PlayerEntity): number {
  return Math.round(getResource(player.tracksCombat, BONUS_KEY));
}

/**
 * Remove the accumulated hardening bonus from `mitigatesDamage.plating` and
 * zero the resource. Safe to call when bonus is already 0.
 *
 * Called from:
 *   - `recalculatePlayerEntityStats` (before stats are rebuilt from equipment)
 *   - `updateDefensiveSystems` when the player leaves combat (OOC)
 *   - the `onDamageTaken` listener when a big hit triggers a reset
 */
export function resetHardening(player: PlayerEntity): void {
  const bonus = Math.round(getResource(player.tracksCombat, BONUS_KEY));
  if (bonus <= 0) return;
  player.mitigatesDamage.plating -= bonus;
  setResource(player.tracksCombat, BONUS_KEY, 0);
}

/**
 * Register the `onDamageTaken` listener that resets hardening when a single
 * hit deals ≥ `defense.hardening-reset-pct × maxHp` HP damage.
 * Runs last in the pipeline so we measure final HP damage (after shields etc.).
 */
export function registerHardening(): void {
  registerCombatListener('onDamageTaken', (ctx, _world) => {
    if (ctx.defenderType !== 'player') return;
    const player = ctx.defender;
    const resetPct = player.usesSkills.passives['defense.hardening-reset-pct'] ?? 0;
    if (resetPct <= 0) return;
    if (ctx.damage >= player.hasHealth.maxHp * resetPct) {
      resetHardening(player);
    }
  });
}

/**
 * Per-tick ramp: while the player has an active attack target, gain
 * `defense.hardening-per-sec` plating per second up to `defense.hardening-max`.
 * Modifies `mitigatesDamage.plating` in place and marks the slice dirty.
 */
export function runHardening(world: World, player: PlayerEntity, dt: number): void {
  const perSec = player.usesSkills.passives['defense.hardening-per-sec'] ?? 0;
  if (perSec <= 0) return;
  if (player.hasAttackTarget === undefined) return;

  const maxBonus = player.usesSkills.passives['defense.hardening-max'] ?? 0;
  const cs = player.tracksCombat;
  const prevBonus = getResource(cs, BONUS_KEY);
  if (prevBonus >= maxBonus) return;

  const newBonus = Math.min(prevBonus + (perSec * dt) / 1000, maxBonus);
  const platDelta = Math.round(newBonus) - Math.round(prevBonus);
  setResource(cs, BONUS_KEY, newBonus);

  if (platDelta > 0) {
    player.mitigatesDamage.plating += platDelta;
    markSliceDirty(world, player, 'mitigatesDamage');
  }
}
