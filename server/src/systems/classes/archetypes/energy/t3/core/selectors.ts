import { getStatusEffect, type TracksCombat, type UsesEnergy } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../../../../ecs/components/player';
import {
  PD_OVERCHARGE_FX,
  AC_DISCHARGE_TOTAL_MS, CS_RESERVOIR_MAX,
} from './constants';

// ── buffSync HUD selectors ───────────────────────────────────────────────────

export function getOverchargeStacks(state: TracksCombat): number {
  return getStatusEffect(state, PD_OVERCHARGE_FX)?.stacks ?? 0;
}

/**
 * Legacy selector kept for API compatibility. Phase is tracked on
 * presence components now — see `getACPhaseForPlayer`.
 */
export function getACPhase(energy: UsesEnergy): 'charge' | 'discharge' | 'idle' {
  void energy;
  return 'idle';
}

export function getACPhaseForPlayer(player: PlayerEntity): 'charge' | 'discharge' | 'idle' {
  if (player.inAcDischarge) return 'discharge';
  if (player.inAcChargePhase) return 'charge';
  return 'idle';
}

export function getACDischargeRemainingPct(player: PlayerEntity): number {
  const ms = player.inAcDischarge?.remainingMs ?? 0;
  if (ms <= 0) return 0;
  return Math.round((ms / AC_DISCHARGE_TOTAL_MS) * 100);
}

export function getCapacitorReservoirPct(energy: UsesEnergy): number {
  return Math.min(100, Math.round((energy.csReservoir / CS_RESERVOIR_MAX) * 100));
}

export function getSMChargePool(energy: UsesEnergy): number {
  return Math.round(energy.smChargePool);
}
