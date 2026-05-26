import { getStatusEffect, type TracksCombat } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../../../../ecs/components/player';
import {
  OVERDRIVE_BUFF_MS, ALIGNMENT_BUFF_MS, TEMPORAL_MAX_MS,
  EC_CHARGE_FX, TE_BUFF_FX, BAT_CHARGE_FX,
} from './constants';

// ── buffSync HUD selectors ───────────────────────────────────────────────────

export function getOverdrivePct(player: PlayerEntity): number {
  if (!player.hasOverdrive) return 0;
  return Math.round((player.hasOverdrive.remainingMs / OVERDRIVE_BUFF_MS) * 100);
}

export function getEternalChargeStacks(state: TracksCombat): number {
  return getStatusEffect(state, EC_CHARGE_FX)?.stacks ?? 0;
}

export function getTemporalExtPct(state: TracksCombat): number {
  const buff = getStatusEffect(state, TE_BUFF_FX);
  if (!buff || buff.remainingMs <= 0) return 0;
  const maxMs = buff.data['maxDurationMs'] ?? TEMPORAL_MAX_MS;
  return Math.round((buff.remainingMs / maxMs) * 100);
}

export function getBatteryStacks(state: TracksCombat): number {
  return getStatusEffect(state, BAT_CHARGE_FX)?.stacks ?? 0;
}

export function getAlignmentPct(player: PlayerEntity): number {
  if (!player.hasAlignment) return 0;
  return Math.round((player.hasAlignment.remainingMs / ALIGNMENT_BUFF_MS) * 100);
}

export function getChannelingRemainingPct(player: PlayerEntity): number {
  return Math.max(0, Math.min(100, 100 - (player.isChanneling?.pct ?? 0)));
}
