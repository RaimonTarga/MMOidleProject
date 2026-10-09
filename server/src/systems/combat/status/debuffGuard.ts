import {
  applyStatusEffect,
  hasStatusEffect,
  statusPolicyFor,
  type StatusEffect,
  type StatusEffectConfig,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import { getDebuffResistanceMult } from '../../defense/regen/healing';
import { refusesHardControl } from './playerHardControl';

/**
 * THE ADMISSION CHECK for a harmful status on its way onto a player: the keystone
 * refusals (design §22.4), asked by the common writers — `applyResistedPlayerDebuff`
 * and the monster-ability rider writer — so a refusal source only has to apply its
 * status, and no applier restates the rule.
 *
 *  - Unyielding (Endure): hard control and roots — a zero-speed slow is hard
 *    control by `statusPolicyFor` — are refused while it stands. Stuns are refused
 *    at `applyStun`, the one place a stun enters the world.
 */
export function playerRefusesStatus(
  player: PlayerEntity,
  id: string,
  data: Record<string, number> = {},
): boolean {
  if (!player.tracksCombat) return false;
  return statusPolicyFor(id, data).hardControl && refusesHardControl(player.tracksCombat);
}

/** Equipment resistance weakens monster-delivered non-DoT magnitudes only.
 * Durations, stack counts, roots and environmental ramps retain their own rules.
 * Store the resolved payload so combat consumers and buff previews agree.
 */
export function resistedPlayerDebuffMagnitude(player: PlayerEntity, key: string, value: number): number {
  const mult = getDebuffResistanceMult(player);
  if (key === 'speedMult') return value > 0 && value < 1 ? 1 - (1 - value) * mult : value;
  switch (key) {
    case 'reductionPerStack':
    case 'damageTakenPct':
    case 'moveSlowPerHit':
    case 'moveSlowMaxPct':
    case 'atkSlowPerHit':
    case 'atkSlowMaxPct':
    case 'platingPerStack':
      return value > 0 ? value * mult : value;
    default: return value;
  }
}

export function applyResistedPlayerDebuff(player: PlayerEntity, config: StatusEffectConfig): StatusEffect | undefined {
  if (playerRefusesStatus(player, config.id, config.data)) return undefined;
  if (config.data?.isDot || config.data?.isAmbientRamp || config.data?.isNodeFeature || config.data?.isGroundZone) {
    return applyStatusEffect(player.tracksCombat, config);
  }
  const data = Object.fromEntries(Object.entries(config.data ?? {}).map(([key, value]) =>
    [key, resistedPlayerDebuffMagnitude(player, key, value)]));
  return applyStatusEffect(player.tracksCombat, { ...config, data });
}

/**
 * Generic player debuff-immunity gate, checked before any monster-sourced
 * debuff (mark, slow, antiheal, ramp, DoT) lands on a player.
 *
 * This used to live under the Conduit's tier-3 path folder because Vital Burst
 * was its only producer. That path system is gone, so today NOTHING grants this
 * effect and the guard always passes. It is kept because the mechanism is
 * generic and the six call sites in the combat engine are the correct place to
 * ask the question — a future immunity source only has to apply the effect.
 */
export const DEBUFF_IMMUNE_EFFECT = 'debuff-immune';

export function canApplyPlayerDebuff(player: PlayerEntity): boolean {
  if (!player.tracksCombat) return true;
  return !hasStatusEffect(player.tracksCombat, DEBUFF_IMMUNE_EFFECT);
}
