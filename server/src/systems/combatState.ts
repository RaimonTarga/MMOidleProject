import type { World } from '../world/World';
import {
  tickCooldowns,
  tickStatusEffectDurations,
} from '@mmo-idle/shared';

/**
 * Run at the top of every world tick so cooldowns and status effect durations are
 * decremented before any combat or AI system reads them.
 */
export function updateCombatState(world: World, dt: number): void {
  for (const e of world.playerEntities) {
    tickCooldowns(e.tracksCombat, dt);
    tickStatusEffectDurations(e.tracksCombat, dt);
  }
  for (const e of world.monsterEntities) {
    tickCooldowns(e.tracksCombat, dt);
    tickStatusEffectDurations(e.tracksCombat, dt);
  }
}
