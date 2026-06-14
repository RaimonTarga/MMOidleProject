import { computeScaledDotDamage, getStatusEffect } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { getCheatDeathHealPool, getDefenseAbsorbPool, getDefenseBurstPool, getDefenseDebtPool } from './pools';

// Display-only HP-bar forecast: how much pending damage will hit the player
// (ticking DoT + deferred hit-to-DoT debt), and how much heal-over-time
// (regen/absorb pools) is queued. Mirrored onto hasStatus each tick so the HP
// bar can render the red (pending damage) and dark-green (regen) layers.
// Read-only — never feeds back into combat math.

const DOT_EFFECT_ID = 'dot';

function forecastIncomingDot(player: PlayerEntity): number {
  const cs = player.tracksCombat;

  // Ticking monster-applied DoT: scaled base, DR at half value, dot-resist.
  let total = 0;
  const dot = getStatusEffect(cs, DOT_EFFECT_ID);
  if (dot && dot.stacks > 0 && dot.remainingMs > 0) {
    const perTick = computeScaledDotDamage(dot);
    const dotResist = Math.min(0.9, player.usesSkills.passives['defense.dot-resistance'] ?? 0);
    const drForDot = player.mitigatesDamage.damageReduction * 0.5;
    const mitigatedPerTick = perTick * (1 - drForDot) * (1 - dotResist);
    const tickMs = dot.data['tickIntervalMs'] || 1000;
    const ticksLeft = Math.ceil(dot.remainingMs / tickMs);
    total += mitigatedPerTick * ticksLeft;
  }

  // Deferred hit-to-DoT debt — the whole pool will drain onto the player as HP loss.
  total += getDefenseDebtPool(cs);

  return Math.max(0, Math.round(total));
}

function forecastPendingHeal(player: PlayerEntity): number {
  const cs = player.tracksCombat;
  return Math.round(getDefenseBurstPool(cs) + getDefenseAbsorbPool(cs) + getCheatDeathHealPool(cs));
}

export function mirrorHpForecast(world: World): void {
  for (const player of world.livePlayers) {
    if (!player.hasStatus) continue;
    player.hasStatus.incomingDot = forecastIncomingDot(player);
    player.hasStatus.pendingHeal = forecastPendingHeal(player);
  }
}
