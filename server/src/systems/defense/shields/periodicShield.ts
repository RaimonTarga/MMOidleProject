import { isCooldownActive, setCooldown } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { applyShieldPercent } from './shields';

/**
 * Per-tick periodic combat shield. While in combat and the cooldown is ready,
 * applies a shield sized at `defense.shield-pct × maxHp` for
 * `defense.shield-duration-ms` (or permanent if absent).
 *
 * The cooldown ticks down regardless of combat state, so on first combat entry
 * the cooldown is 0 → shield fires immediately. Subsequent applications repeat
 * every `defense.shield-interval-ms` while in combat; the cooldown freezes
 * (checked but not reset) while out of combat.
 */
export function runPeriodicShield(world: World, player: PlayerEntity, inCombat: boolean): void {
  if (!inCombat) return;
  const shieldPct        = player.usesSkills.passives['defense.shield-pct'] ?? 0;
  const shieldIntervalMs = player.usesSkills.passives['defense.shield-interval-ms'] ?? 0;
  if (shieldPct <= 0 || shieldIntervalMs <= 0) return;

  const cs = player.tracksCombat;
  if (isCooldownActive(cs, 'shieldRegen')) return;

  const shieldDurationMs = player.usesSkills.passives['defense.shield-duration-ms'] ?? -1;
  applyShieldPercent(world, player, shieldPct, shieldDurationMs);
  setCooldown(cs, 'shieldRegen', shieldIntervalMs);
}
