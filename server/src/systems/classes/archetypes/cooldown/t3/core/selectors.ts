import {
  getStatusEffect,
  relicRatingsFromPassives,
  resolveCooldownRelicProfile,
  type TracksCombat,
  type UsesCooldown,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../../../../ecs/entity';
import { resolveExecutionCooldownMs } from '../../cooldownPrototype';
import {
  OVERDRIVE_BUFF_MS, ALIGNMENT_BUFF_MS, TEMPORAL_MAX_MS,
  PATIENCE_PAID_RAMP_MS, RUPTURE_WINDOW_MS,
  EC_CHARGE_FX, TE_BUFF_FX, BAT_CHARGE_FX, REVERB_ECHO_FX, REVERB_ECHO_AT_SHARE,
  ETERNAL_CYCLE_FLAT_PER_STACK, ETERNAL_CYCLE_UNLOCK_TIER,
  BATTERY_ATK_PER_STACK, PATIENCE_PAID_ATK_MAX, PATIENCE_PAID_EXEC_MAX,
  VENGEANCE_MULTIPLIER, VENGEANCE_FLOOR,
} from './constants';

/**
 * Patience Paid ramp factor (0..1): how far the uninterrupted execution cooldown
 * has progressed, capped at the natural ramp window. At execution time the timer
 * is ~0 so this reads ~1 on a full natural cycle; an early trigger reads lower.
 */
export function rampFactorFor(cd: UsesCooldown, player: PlayerEntity): number {
  const rampMs = Math.max(
    100,
    player.usesSkills.passives['cooldown.patience-ramp-ms'] ?? PATIENCE_PAID_RAMP_MS,
  );
  const passives = player.usesSkills.passives;
  const cdMs = resolveCooldownRelicProfile(
    passives['cooldown.empowered-cd-ms'] ?? rampMs,
    passives['cooldown.empowered-mult'] ?? 2,
    relicRatingsFromPassives(passives),
  ).cooldownMs.after;
  const elapsed = cdMs - cd.executionCooldownMs;
  return Math.max(0, Math.min(1, elapsed / rampMs));
}

// ── buffSync HUD selectors ───────────────────────────────────────────────────

export function getOverdrivePct(player: PlayerEntity): number {
  if (!player.hasOverdrive) return 0;
  const durationMs = Math.max(
    100,
    player.usesSkills.passives['cooldown.overdrive-duration-ms'] ?? OVERDRIVE_BUFF_MS,
  );
  return Math.round((player.hasOverdrive.remainingMs / durationMs) * 100);
}

export function getRupturePct(player: PlayerEntity): number {
  const ms = player.usesCooldown?.ruptureWindowMs ?? 0;
  const windowMs = Math.max(1, player.usesSkills.passives['cooldown.rupture-window-ms'] ?? RUPTURE_WINDOW_MS);
  return ms > 0 ? Math.round((ms / windowMs) * 100) : 0;
}

export function getEternalChargeStacks(state: TracksCombat): number {
  return getStatusEffect(state, EC_CHARGE_FX)?.stacks ?? 0;
}

/**
 * Transcendant flat damage per banked stack — authored on the node
 * (cooldown.eternal-cycle-flat) and scaled per tier above the unlock tier
 * (base × max(1, playerTier − ETERNAL_CYCLE_UNLOCK_TIER + 1)).
 */
export function eternalCycleFlatPerStack(player: PlayerEntity): number {
  const base = player.usesSkills.passives['cooldown.eternal-cycle-flat'] ?? ETERNAL_CYCLE_FLAT_PER_STACK;
  const tier = player.tracksProgression?.playerTier ?? ETERNAL_CYCLE_UNLOCK_TIER;
  const tierMult = Math.max(1, tier - ETERNAL_CYCLE_UNLOCK_TIER + 1);
  return Math.round(base * tierMult);
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

export function batteryDamagePerStack(player: PlayerEntity): number {
  return Math.max(0, player.usesSkills.passives['cooldown.battery-damage-per-stack'] ?? BATTERY_ATK_PER_STACK);
}

export function patienceAttackMax(player: PlayerEntity): number {
  return Math.max(0, player.usesSkills.passives['cooldown.patience-attack-max'] ?? PATIENCE_PAID_ATK_MAX);
}

export function patienceExecutionMax(player: PlayerEntity): number {
  return Math.max(0, player.usesSkills.passives['cooldown.patience-execution-max'] ?? PATIENCE_PAID_EXEC_MAX);
}

/** Avenger: damage banked since the last execution (the buff's stack count). */
export function getVengeanceDamage(player: PlayerEntity): number {
  return Math.round(player.usesCooldown?.vengeanceDamageTaken ?? 0);
}

/** Avenger: the bonus the next execution would currently deal. */
export function getVengeanceBonus(player: PlayerEntity): number {
  const mult  = player.usesSkills.passives['cooldown.vengeance-mult']  ?? VENGEANCE_MULTIPLIER;
  const floor = player.usesSkills.passives['cooldown.vengeance-floor'] ?? VENGEANCE_FLOOR;
  return Math.max(floor, Math.round((player.usesCooldown?.vengeanceDamageTaken ?? 0) * mult));
}

/**
 * Reverb: the share of the execution's own multiplier its echo lands at — the
 * node's `cooldown.reverb-echo-strength`, with no fallback (no node, no echo).
 */
export function reverbEchoStrength(player: PlayerEntity): number {
  return Math.max(0, player.usesSkills.passives['cooldown.reverb-echo-strength'] ?? 0);
}

/**
 * Reverb: the recharge still to run at the moment the echo is due — the halfway
 * mark of the LIVE cycle, so whatever changes the recharge (a frame, a relic)
 * moves the echo with it.
 */
export function reverbEchoDueAtMs(player: PlayerEntity): number {
  return resolveExecutionCooldownMs(player) * REVERB_ECHO_AT_SHARE;
}

/** Reverb: whether an echo is waiting for the halfway mark. */
export function reverbEchoPending(player: PlayerEntity): boolean {
  return getStatusEffect(player.tracksCombat, REVERB_ECHO_FX) !== undefined;
}

/**
 * Reverb's clock for the buff bar: how long until the pending echo lands, out of
 * the half-cycle it waits. Read off the recharge timer itself rather than kept as
 * a second countdown, so a refund that shortens the recharge (the Knight window,
 * a Refund kill) moves the clock and the echo together. Null when none is due.
 */
export function getReverbEchoClock(
  player: PlayerEntity,
): { remainingMs: number; totalMs: number } | null {
  const cd = player.usesCooldown;
  if (!cd || !getStatusEffect(player.tracksCombat, REVERB_ECHO_FX)) return null;
  const dueAtMs = reverbEchoDueAtMs(player);
  const totalMs = Math.max(1, resolveExecutionCooldownMs(player) - dueAtMs);
  const remainingMs = Math.max(0, Math.min(totalMs, cd.executionCooldownMs - dueAtMs));
  return { remainingMs, totalMs };
}

export function getAlignmentPct(player: PlayerEntity): number {
  if (!player.hasAlignment) return 0;
  return Math.round((player.hasAlignment.remainingMs / ALIGNMENT_BUFF_MS) * 100);
}

export function getChannelingRemainingPct(player: PlayerEntity): number {
  return Math.max(0, Math.min(100, 100 - (player.isChanneling?.pct ?? 0)));
}
