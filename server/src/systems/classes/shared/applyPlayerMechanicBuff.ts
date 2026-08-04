import {
  applyStatusEffect,
  relicRatingsFromPassives,
  resolveRelicMagnitudeMultiplier,
  SCALABLE_MECHANIC_BUFFS,
  scaleMechanicMagnitude,
  scaleMechanicEffectConfig,
  type StatusEffect,
  type StatusEffectConfig,
  type TracksCombat,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';

/** Resolve an approved beneficial magnitude held directly on class state. */
export function playerMechanicBuffMagnitude(
  source: PlayerEntity,
  effectId: string,
  field: string,
  value: number,
): number {
  const mult = resolveRelicMagnitudeMultiplier(
    relicRatingsFromPassives(source.usesSkills.passives).buffEffect,
  );
  return scaleMechanicMagnitude(effectId, field, value, mult, SCALABLE_MECHANIC_BUFFS);
}

/** Apply an explicitly registered root-mechanic buff using the source's Relic. */
export function applyPlayerMechanicBuff(
  source: PlayerEntity,
  targetState: TracksCombat,
  config: StatusEffectConfig,
): StatusEffect {
  const mult = resolveRelicMagnitudeMultiplier(
    relicRatingsFromPassives(source.usesSkills.passives).buffEffect,
  );
  return applyStatusEffect(
    targetState,
    scaleMechanicEffectConfig(config, mult, SCALABLE_MECHANIC_BUFFS),
  );
}
