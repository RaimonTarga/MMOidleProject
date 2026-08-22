import {
  GAME_CONFIG,
  getResource,
  setResource,
  isCooldownActive,
  setCooldown,
  type TracksCombat,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { applyHealToPlayer } from './healing';

/**
 * The Recovery engine — one healing rate, many switches.
 *
 * Recovery is the canonical HP-restoration rate: **1 Recovery = 1% of max HP per
 * second while 100% Recovery is active**, held on `hasHealth.recovery`. Out of
 * combat (past `COMBAT_REGEN_DELAY`) the player runs at 100%.
 *
 * In combat, effects do NOT invent their own `% max HP` heals. They ACTIVATE a
 * fraction of that one rate:
 *
 *     healingPerSecond = maxHp × (recovery / 100) × activeFraction
 *
 * Fractions from different sources ADD (Squire 10% + Swamp pulse 30% + Second
 * Wind 50% = 90%), and are deliberately uncapped for now — extreme stacking is a
 * balance question, not an architecture one. A source that is already running
 * REFRESHES its own window rather than stacking a second copy of itself.
 *
 * Everything lands through `applyHealToPlayer`, so antiheal and the overheal ward
 * apply once, in one place.
 */

// ── Timed Recovery sources ───────────────────────────────────────────────────
//
// Each timed source stores two resources on TracksCombat: how much longer it is
// active, and the fraction it activates. The fraction is stored rather than
// re-read from passives so that a source resolved at fire time (a tier-scaled,
// potency-scaled skill) keeps the value it was activated with even if gear
// changes mid-window.

/**
 * `skill` and `skill-2` are the two GUARD SLOTS' Recovery skills, not two kinds
 * of skill. Second Wind (strong/short) and Recuperate (weak/long) are deliberate
 * opposites and may be equipped together; sharing one source would let the
 * stronger fraction ride the longer window — strictly better than either
 * ability as authored.
 */
export type RecoverySourceId = 'pulse' | 'kill' | 'guard' | 'skill' | 'skill-2';

interface TimedSource {
  /** Remaining active time, ms. */
  msKey: string;
  /** Fraction of the Recovery rate this source is currently switching on. */
  pctKey: string;
}

const TIMED_SOURCES: Record<RecoverySourceId, TimedSource> = {
  pulse: { msKey: 'recovery.pulseMs', pctKey: 'recovery.pulsePct' },
  kill:  { msKey: 'recovery.killMs',  pctKey: 'recovery.killPct'  },
  guard: { msKey: 'recovery.guardMs', pctKey: 'recovery.guardPct' },
  skill: { msKey: 'recovery.skillMs', pctKey: 'recovery.skillPct' },
  'skill-2': { msKey: 'recovery.skill2Ms', pctKey: 'recovery.skill2Pct' },
};

const TIMED_SOURCE_IDS = Object.keys(TIMED_SOURCES) as RecoverySourceId[];

/** Cooldown key gating the periodic pulse's cadence. */
const PULSE_CD = 'recoveryPulse';

/** Ramp progress (ms of continuous combat) for the ramping-access mechanic. */
const RAMP_TIMER_KEY = 'recovery.rampMs';

/**
 * Switch on a fraction of the player's Recovery for a window.
 *
 * Refreshes the source's own timer instead of adding a second copy — this is
 * what makes the Plains kill buff a chain-farming mechanic (further kills extend
 * the window) rather than a stacking heal. The larger fraction wins while a
 * window is live, so a weaker refresh can never downgrade a stronger one.
 */
export function activateRecovery(
  cs: TracksCombat,
  source: RecoverySourceId,
  fraction: number,
  durationMs: number,
): void {
  if (fraction <= 0 || durationMs <= 0) return;
  const { msKey, pctKey } = TIMED_SOURCES[source];
  const liveMs = getResource(cs, msKey);
  const livePct = liveMs > 0 ? getResource(cs, pctKey) : 0;
  setResource(cs, msKey, Math.max(liveMs, durationMs));
  setResource(cs, pctKey, Math.max(livePct, fraction));
}

/**
 * Clear every timed Recovery source and the ramp.
 *
 * Death and node teardown do NOT need this — `resetTracksCombat` wipes all
 * resources wholesale — and windows are short enough to self-clear anyway. It
 * exists so a caller that needs a known-clean slate (tests, future admin actions)
 * does not have to know which resource keys the engine owns.
 */
export function resetRecoverySources(cs: TracksCombat): void {
  for (const id of TIMED_SOURCE_IDS) {
    const { msKey, pctKey } = TIMED_SOURCES[id];
    if (getResource(cs, msKey) !== 0) setResource(cs, msKey, 0);
    if (getResource(cs, pctKey) !== 0) setResource(cs, pctKey, 0);
  }
  if (getResource(cs, RAMP_TIMER_KEY) !== 0) setResource(cs, RAMP_TIMER_KEY, 0);
}

/**
 * Sum of every Recovery fraction currently switched on, as a fraction (0.9 = 90%).
 * Read-only — safe for HUD descriptors and tests. Out of combat this is 1 (the
 * player recovers at the full rate once the OOC delay has elapsed).
 */
export function activeRecoveryFraction(
  player: PlayerEntity,
  inCombat: boolean,
  oocSuppressed = false,
): number {
  // Out of combat, past the OOC delay, the player recovers at the full rate —
  // unless a node hazard is suppressing it (standing in lava does not heal you).
  if (!inCombat) return oocSuppressed ? 0 : 1;
  const cs = player.tracksCombat;
  const passives = player.usesSkills.passives;

  // Permanent-while-in-combat access (Squire root, stances).
  let fraction = passives['defense.recovery-active-pct'] ?? 0;

  // Ramping access: interpolated from start→max over the ramp window.
  fraction += rampFraction(player);

  for (const id of TIMED_SOURCE_IDS) {
    const { msKey, pctKey } = TIMED_SOURCES[id];
    if (getResource(cs, msKey) > 0) fraction += getResource(cs, pctKey);
  }
  return fraction;
}

/** HP restored per second at the given active fraction. */
export function recoveryPerSecond(player: PlayerEntity, fraction: number): number {
  return player.hasHealth.maxHp * ((player.hasHealth.recovery ?? 0) / 100) * fraction;
}

function rampFraction(player: PlayerEntity): number {
  const startPct = player.usesSkills.passives['defense.recovery-ramp-start-pct'] ?? 0;
  if (startPct <= 0) return 0;
  const maxPct = player.usesSkills.passives['defense.recovery-ramp-max-pct'] ?? startPct;
  const rampTimeMs = player.usesSkills.passives['defense.recovery-ramp-ramptime-ms'] ?? 10000;
  const elapsed = getResource(player.tracksCombat, RAMP_TIMER_KEY);
  const t = rampTimeMs > 0 ? Math.min(1, elapsed / rampTimeMs) : 1;
  return startPct + (maxPct - startPct) * t;
}

/**
 * Per-tick Recovery. Advances every timed source, fires the periodic pulse, then
 * applies the summed rate exactly once.
 *
 * Timers decay whether or not the player is in combat — a window that was running
 * when the fight ended should not be waiting to resume — but only the in-combat
 * fractions are *paid out* in combat. Out of combat the player is already at 100%,
 * which is more than any stacked combat access, so the sources are irrelevant there.
 *
 * `oocSuppressed` blocks the out-of-combat rate only (a node-feature hazard); it
 * deliberately leaves in-combat access alone, since those effects are what a
 * player fighting inside a hazard is relying on.
 */
export function runRecovery(
  world: World,
  player: PlayerEntity,
  dt: number,
  inCombat: boolean,
  oocSuppressed = false,
): void {
  const cs = player.tracksCombat;
  const passives = player.usesSkills.passives;

  // Ramp progress accrues only while fighting; reset by resetRecoveryRamp.
  const rampTimeMs = passives['defense.recovery-ramp-ramptime-ms'] ?? 10000;
  if (inCombat && (passives['defense.recovery-ramp-start-pct'] ?? 0) > 0) {
    setResource(cs, RAMP_TIMER_KEY, Math.min(getResource(cs, RAMP_TIMER_KEY) + dt, rampTimeMs));
  }

  // Periodic pulse: every interval, switch the pulse source on for its window.
  const pulsePct = passives['defense.recovery-pulse-pct'] ?? 0;
  const pulseIntervalMs = passives['defense.recovery-pulse-interval-ms'] ?? 0;
  if (inCombat && pulsePct > 0 && pulseIntervalMs > 0 && !isCooldownActive(cs, PULSE_CD)) {
    const durationMs = passives['defense.recovery-pulse-duration-ms'] ?? GAME_CONFIG.RECOVERY_PULSE_MS;
    activateRecovery(cs, 'pulse', pulsePct, durationMs);
    setCooldown(cs, PULSE_CD, pulseIntervalMs);
  }

  const fraction = activeRecoveryFraction(player, inCombat, oocSuppressed);

  // Decay after reading, so a source activated this tick pays out for this tick.
  for (const id of TIMED_SOURCE_IDS) {
    const { msKey, pctKey } = TIMED_SOURCES[id];
    const left = getResource(cs, msKey);
    if (left <= 0) continue;
    const next = left - dt;
    if (next <= 0) {
      setResource(cs, msKey, 0);
      setResource(cs, pctKey, 0);
    } else {
      setResource(cs, msKey, next);
    }
  }

  if (fraction <= 0) return;
  applyHealToPlayer(player, cs, recoveryPerSecond(player, fraction) * (dt / 1000), world);
}

/**
 * Reset the ramp timer when the player leaves combat so the next engagement
 * starts fresh from `start-pct`. No-op if the mechanic isn't present.
 */
export function resetRecoveryRamp(player: PlayerEntity): void {
  if ((player.usesSkills.passives['defense.recovery-ramp-start-pct'] ?? 0) <= 0) return;
  setResource(player.tracksCombat, RAMP_TIMER_KEY, 0);
}
