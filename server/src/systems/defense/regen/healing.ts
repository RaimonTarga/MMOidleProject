import type { TracksCombat } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/components/player';

/**
 * Returns the healing multiplier for this entity (1 = full, 0.1 = hard floor).
 * Reads the 'antiheal' status effect; each stack reduces healing by
 * effect.data['reductionPerStack'] (default 0.20).
 * Apply this multiplier to every player heal source for consistency.
 */
export function getAntiHealMult(cs: TracksCombat): number {
  const effect = cs.statusEffects.find(e => e.id === 'antiheal');
  if (!effect) return 1;
  const reductionPerStack = effect.data['reductionPerStack'] ?? 0.20;
  return Math.max(0.1, 1 - effect.stacks * reductionPerStack);
}

/**
 * Returns [0, 1] — how much of a non-DoT debuff's magnitude reaches the player.
 * Future debuff-application code should multiply potency by this before applying.
 * Resistance is capped at 90% (multiplier floor 0.10).
 */
export function getDebuffResistanceMult(player: PlayerEntity): number {
  const resist = Math.min(0.9, player.usesSkills.passives['defense.debuff-resistance'] ?? 0);
  return 1 - resist;
}

/**
 * Apply healing to a player with antiheal and maxHp cap applied.
 * Use for every player heal source so antiheal is consistent.
 */
export function applyHealToPlayer(
  player: PlayerEntity,
  cs: TracksCombat,
  amount: number,
): void {
  if (amount <= 0) return;
  player.hasHealth.hp = Math.min(
    player.hasHealth.maxHp,
    player.hasHealth.hp + amount * getAntiHealMult(cs),
  );
}
