import { computeLinearDotDamage, isMonsterDotStatusEffectId } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import { attackCadenceMult } from "../../combat/engine/attackCadence";
import type { World } from '../../../world/World';
import { getCheatDeathHealPool, getDefenseAbsorbPool, getDefenseDebtPool } from './pools';

// Display-only HP-bar forecast: how much pending damage will hit the player
// (ticking DoT + deferred hit-to-DoT debt), and how much heal-over-time
// (absorb + post-cheat-death pools) is queued. Mirrored onto hasStatus each tick
// so the HP bar can render the red (pending damage) and dark-green (regen) layers.
//
// Recovery is deliberately absent: it is a RATE, not a queued pool, so there is no
// finite amount owed to draw past current HP. The Recovery buff tile surfaces it.
// Read-only — never feeds back into combat math.

function forecastIncomingDot(player: PlayerEntity): number {
  const cs = player.tracksCombat;

  // Ticking monster-applied DoT: linear base, DR at half value, dot-resist.
  let total = 0;
  const dots = cs.statusEffects.filter((effect) =>
    isMonsterDotStatusEffectId(effect.id) && effect.stacks > 0 && effect.remainingMs > 0,
  );
  for (const dot of dots) {
    const perTick = computeLinearDotDamage(dot);
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
  return Math.round(getDefenseAbsorbPool(cs) + getCheatDeathHealPool(cs));
}

export function mirrorHpForecast(world: World): void {
  for (const player of world.livePlayers) {
    if (!player.hasStatus) continue;
    player.hasStatus.incomingDot = forecastIncomingDot(player);
    player.hasStatus.pendingHeal = forecastPendingHeal(player);
    // Temporary attack haste/slow is applied as a multiplier at the cadence gate
    // and never written into `attackCooldown`, so it has to be mirrored
    // explicitly or nothing that displays the stat can ever see it. Same
    // function the gate itself uses — see `combat/engine/attackCadence.ts`.
    player.hasStatus.attackCadenceMult = attackCadenceMult(player.tracksCombat);
  }
}
