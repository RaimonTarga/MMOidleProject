import {
  removeStatusEffect,
  type PassiveKey,
  type TracksCombat,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../../../ecs/entity';
import type { World } from '../../../../../../world/World';
import { attachMarker, detachMarker } from '../../../../../../ecs/markerHelpers';
import { DOT_EFFECT_ID } from './constants';

export function hasPassive(player: PlayerEntity, key: PassiveKey): boolean {
  return (player.usesSkills.passives[key] ?? 0) > 0;
}

export function markMonsterDot(world: World, monster: MonsterEntity): void {
  attachMarker(world, monster, 'hasDot');
}

export function clearMonsterDot(world: World, monster: MonsterEntity, state: TracksCombat): void {
  removeStatusEffect(state, DOT_EFFECT_ID);
  detachMarker(world, monster, 'hasDot');
}
