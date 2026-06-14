import {
  isCooldownActive, setCooldown,
  removeStatusEffectStacks, getStatusEffect,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { applyHealToPlayer } from '../regen/healing';

/**
 * Per-tick debuff cleanse. Every `defense.cleanse-interval-ms`, removes
 * `defense.cleanse-stacks` stacks from every non-DoT, non-instanced status
 * effect on the player (antiheal, slows, etc.).
 *
 * Heal-on-cleanse: when the pulse fires, heal `cleanse-per-stack-heal-pct` of max
 * HP per stack actually removed; if there was nothing to cleanse, heal a flat
 * `cleanse-empty-heal-pct` of max HP instead.
 *
 * DoT effects (`data.isDot === 1`) are skipped; instanced effects are left to
 * a future cleanse pass when player debuffs are implemented.
 */
export function runDebuffCleanse(world: World, player: PlayerEntity): void {
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
  let removed = 0;
  for (const id of toReduce) {
    const effect = getStatusEffect(cs, id);
    if (!effect) continue;
    removed += Math.min(effect.stacks, cleanseStacks);
    removeStatusEffectStacks(cs, id, cleanseStacks);
  }
  setCooldown(cs, 'cleanse', cleanseIntervalMs);

  // Heal-on-cleanse: per removed stack, or a flat heal when there was nothing to cleanse.
  const perStackPct = player.usesSkills.passives['defense.cleanse-per-stack-heal-pct'] ?? 0;
  const emptyPct    = player.usesSkills.passives['defense.cleanse-empty-heal-pct'] ?? 0;
  if (removed > 0 && perStackPct > 0) {
    applyHealToPlayer(player, cs, player.hasHealth.maxHp * perStackPct * removed, world);
  } else if (removed === 0 && emptyPct > 0) {
    applyHealToPlayer(player, cs, player.hasHealth.maxHp * emptyPct, world);
  }
}
