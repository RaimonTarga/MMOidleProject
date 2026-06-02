import { getResource, setResource } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { applyHealToPlayer } from './healing';

const RAMP_TIMER_KEY = 'rampRegenCombatMs';

/**
 * Per-tick ramping in-combat regen.
 *
 * While the player has an active attack target, a combat timer advances (capped
 * at ramptime-ms). The effective regen fraction is linearly interpolated from
 * `start-pct` to `max-pct` over that window, then applied as a fraction of the
 * player's OOC regen rate — identical to how `defense.in-combat-regen-pct` works
 * but with a warmup instead of a fixed value.
 *
 * Antiheal applies via `applyHealToPlayer`. Timer resets on leaving combat via
 * `resetRampRegen`.
 */
export function runRampRegen(world: World, player: PlayerEntity, dt: number): void {
  const startPct = player.usesSkills.passives['defense.ramp-regen-start-pct'] ?? 0;
  if (startPct <= 0) return;
  if (player.hasAttackTarget === undefined) return;

  const maxPct = player.usesSkills.passives['defense.ramp-regen-max-pct'] ?? startPct;
  const rampTimeMs = player.usesSkills.passives['defense.ramp-regen-ramptime-ms'] ?? 10000;

  const cs = player.tracksCombat;
  const combatMs = Math.min(getResource(cs, RAMP_TIMER_KEY) + dt, rampTimeMs);
  setResource(cs, RAMP_TIMER_KEY, combatMs);

  const t = rampTimeMs > 0 ? combatMs / rampTimeMs : 1;
  const currentPct = startPct + (maxPct - startPct) * t;

  const baseRegenPerMs = player.hasHealth.maxHp * ((player.hasHealth.hpRegen ?? 0) / 100) / 1000;
  applyHealToPlayer(player, cs, baseRegenPerMs * currentPct * dt, world);
}

/**
 * Reset the ramp timer when the player leaves combat so the next engagement
 * starts fresh from `start-pct`. No-op if the mechanic isn't present.
 */
export function resetRampRegen(player: PlayerEntity): void {
  if ((player.usesSkills.passives['defense.ramp-regen-start-pct'] ?? 0) <= 0) return;
  setResource(player.tracksCombat, RAMP_TIMER_KEY, 0);
}
