import { getResource, setResource, isCooldownActive, setCooldown } from '@mmo-idle/shared';
import { registerCombatListener } from '../../combat/engine/combatPipeline';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';

const BONUS_KEY = 'hardeningBonus';

// ── Hardening max-DR pulse (defense.hardening-max-dr-*) ───────────────────────
const DR_CAP = 0.9; // mirrors the shared stats.ts DR clamp
const MAX_DR_APPLIED_KEY = 'hardeningMaxDrApplied';
const MAX_DR_CD = 'hardeningMaxDrWindow';

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

/** Current hardening max-DR pulse bonus applied (0..1). For the buff descriptor. */
export function getHardeningMaxDrBonus(player: PlayerEntity): number {
  return getResource(player.tracksCombat, MAX_DR_APPLIED_KEY);
}

/** Remove the max-DR pulse bonus and zero tracking (recalc / leaving combat). */
export function resetHardeningMaxDr(player: PlayerEntity): void {
  const applied = getResource(player.tracksCombat, MAX_DR_APPLIED_KEY);
  if (applied <= 0) return;
  player.mitigatesDamage.damageReduction -= applied;
  setResource(player.tracksCombat, MAX_DR_APPLIED_KEY, 0);
}

/**
 * Per-tick: while hardening sits at max stacks, grant `hardening-max-dr-bonus`
 * damage reduction and keep refreshing a `hardening-max-dr-ms` linger window. When
 * hardening drops from max (e.g. reset by a big hit), the DR lingers for the rest
 * of that window, then fades. Applied in place (networked) and clamped to DR_CAP.
 */
export function runHardeningMaxDr(world: World, player: PlayerEntity): void {
  const cs = player.tracksCombat;
  const applied = getResource(cs, MAX_DR_APPLIED_KEY);
  const drBonus = player.usesSkills.passives['defense.hardening-max-dr-bonus'] ?? 0;

  if (drBonus <= 0) {
    if (applied > 0) {
      resetHardeningMaxDr(player);
      markSliceDirty(world, player, 'mitigatesDamage');
    }
    return;
  }

  const drMs = player.usesSkills.passives['defense.hardening-max-dr-ms'] ?? 0;
  const maxBonus = player.usesSkills.passives['defense.hardening-max'] ?? 0;
  const atMax = maxBonus > 0 && drMs > 0 && getResource(cs, BONUS_KEY) >= maxBonus;

  if (atMax) {
    if (applied <= 0) {
      const grant = Math.min(drBonus, Math.max(0, DR_CAP - player.mitigatesDamage.damageReduction));
      if (grant > 0) {
        player.mitigatesDamage.damageReduction += grant;
        setResource(cs, MAX_DR_APPLIED_KEY, grant);
        markSliceDirty(world, player, 'mitigatesDamage');
      }
    }
    setCooldown(cs, MAX_DR_CD, drMs); // refresh the linger window while at max
    return;
  }

  // Dropped from max: hold the DR until the linger window lapses, then remove it.
  if (applied > 0 && !isCooldownActive(cs, MAX_DR_CD)) {
    player.mitigatesDamage.damageReduction -= applied;
    setResource(cs, MAX_DR_APPLIED_KEY, 0);
    markSliceDirty(world, player, 'mitigatesDamage');
  }
}
