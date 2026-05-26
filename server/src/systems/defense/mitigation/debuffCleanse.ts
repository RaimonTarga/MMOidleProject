import {
  isCooldownActive, setCooldown,
  removeStatusEffectStacks,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';

/**
 * Per-tick debuff cleanse. Every `defense.cleanse-interval-ms`, removes
 * `defense.cleanse-stacks` stacks from every non-DoT, non-instanced status
 * effect on the player (antiheal, slows, etc.).
 *
 * DoT effects (`data.isDot === 1`) are skipped; instanced effects are left to
 * a future cleanse pass when player debuffs are implemented.
 */
export function runDebuffCleanse(player: PlayerEntity): void {
  const cleanseStacks     = Math.round(player.usesSkills.passives['defense.cleanse-stacks'] ?? 0);
  const cleanseIntervalMs = player.usesSkills.passives['defense.cleanse-interval-ms'] ?? 0;
  if (cleanseStacks <= 0 || cleanseIntervalMs <= 0) return;

  const cs = player.tracksCombat;
  if (isCooldownActive(cs, 'cleanse')) return;

  const toReduce = [...new Set(
    cs.statusEffects
      .filter(e => !e.data['isDot'] && !e.instanced)
      .map(e => e.id),
  )];
  for (const id of toReduce) {
    removeStatusEffectStacks(cs, id, cleanseStacks);
  }
  setCooldown(cs, 'cleanse', cleanseIntervalMs);
}
