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
import { COMBAT_ELAPSED_KEY } from '../core/pools';
import { SLINGER_RECOVERY_X } from '../../classes/archetypes/reload/slinger';
import { registerCombatListener } from '../../combat/engine/combatPipeline';
import { applyHealToPlayer } from './healing';

/**
 * The Recovery engine — one healing rate, many switches.
 *
 * Recovery is the canonical in-combat HP-restoration rate and it is FLAT:
 * **1 Recovery = 1 HP per second while 100% Recovery is active**, held on
 * `hasHealth.recovery` (seeded per player tier by the stat recalc, then added
 * to by charms and skills). It does not scale with max HP — the pool is a
 * budget, the rate is a choice (design bible §15, Phase 0b).
 *
 * In combat, effects do NOT invent their own heals. They ACTIVATE a fraction of
 * that one rate:
 *
 *     healingPerSecond = recovery × activeFraction
 *
 * Fractions from different sources ADD (Squire 10% + Swamp pulse 30% + Second
 * Wind 50% = 90%), and are deliberately uncapped — under a flat rate they
 * multiply an authored number, so stacking is bounded by what the tier's gear
 * adds up to. A source that is already running REFRESHES its own window rather
 * than stacking a second copy of itself.
 *
 * Out of combat (past `COMBAT_REGEN_DELAY`) healing is NOT Recovery: it is a
 * fixed `maxHp × OOC_RECOVERY_PCT` per second, independent of the stat, so
 * downtime never depends on in-combat tuning. A node hazard suppresses only
 * that branch.
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

/**
 * The multiplier lines (Cairnstone, Counterbalance, Stone Patience): a timed factor on the
 * always-on share. Own resources, one window; the larger factor wins while it is live.
 */
const BOOST_MS_KEY = 'recovery.boostMs';
const BOOST_X_KEY = 'recovery.boostX';

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
 * Multiply the always-on in-combat share for a window (Recovery "doubles" or "triples").
 * Refreshes its own window; a weaker factor never downgrades a live stronger one.
 */
export function activateRecoveryBoost(
  cs: TracksCombat,
  factor: number,
  durationMs: number = GAME_CONFIG.RECOVERY_BOOST_MS,
): void {
  if (factor <= 1 || durationMs <= 0) return;
  const liveMs = getResource(cs, BOOST_MS_KEY);
  const liveX = liveMs > 0 ? getResource(cs, BOOST_X_KEY) : 1;
  setResource(cs, BOOST_MS_KEY, Math.max(liveMs, durationMs));
  setResource(cs, BOOST_X_KEY, Math.max(liveX, factor));
}

/** The factor on the always-on share right now: the live boost times Rhythm's build-up. */
function shareMultiplier(player: PlayerEntity): number {
  const cs = player.tracksCombat;
  let factor = getResource(cs, BOOST_MS_KEY) > 0 ? getResource(cs, BOOST_X_KEY) : 1;
  // Rhythm: rises with the length of the fight, up to its maximum.
  const passives = player.usesSkills.passives;
  const rhythmMax = passives['defense.recovery-rhythm-max'] ?? 0;
  if (rhythmMax > 1) {
    const rampMs = Math.max(1, passives['defense.recovery-rhythm-ms'] ?? 20000);
    const t = Math.min(1, getResource(cs, COMBAT_ELAPSED_KEY) / rampMs);
    factor *= 1 + (rhythmMax - 1) * t;
  }
  // The Slinger's Recovery lines (Breathing Room, Fleet, Snake Oil) write one factor each tick.
  const slinger = getResource(cs, SLINGER_RECOVERY_X);
  if (slinger > 0) factor *= slinger;
  return factor;
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
  if (getResource(cs, BOOST_MS_KEY) !== 0) setResource(cs, BOOST_MS_KEY, 0);
  if (getResource(cs, BOOST_X_KEY) !== 0) setResource(cs, BOOST_X_KEY, 0);
}

/**
 * Sum of every Recovery fraction currently switched on, as a fraction (0.9 = 90%).
 * Read-only — safe for HUD descriptors and tests. This is IN-COMBAT access only:
 * out of combat it is 0, because out-of-combat healing is the fixed
 * `oocRecoveryPerSecond` rate and not a share of the stat.
 */
export function activeRecoveryFraction(
  player: PlayerEntity,
  inCombat: boolean,
  _oocSuppressed = false,
): number {
  if (!inCombat) return 0;
  const cs = player.tracksCombat;
  const passives = player.usesSkills.passives;

  // The always-on share every class has, plus lines that add to it (Old Guard), times
  // the multiplier lines. The other sources below are separate and are not multiplied.
  let fraction = (GAME_CONFIG.RECOVERY_COMBAT_BASE_SHARE + (passives['defense.recovery-active-pct'] ?? 0))
    * shareMultiplier(player);

  // Ramping access: interpolated from start→max over the ramp window.
  fraction += rampFraction(player);

  for (const id of TIMED_SOURCE_IDS) {
    const { msKey, pctKey } = TIMED_SOURCES[id];
    if (getResource(cs, msKey) > 0) fraction += getResource(cs, pctKey);
  }
  return fraction;
}

/** HP restored per second at the given active fraction: the flat rate × fraction. */
export function recoveryPerSecond(player: PlayerEntity, fraction: number): number {
  return (player.hasHealth.recovery ?? 0) * fraction;
}

/**
 * Out-of-combat healing rate (HP/s): a fixed share of max HP, independent of the
 * Recovery stat. Zero while a node hazard suppresses it.
 */
export function oocRecoveryPerSecond(player: PlayerEntity, oocSuppressed = false): number {
  if (oocSuppressed) return 0;
  // A class line may speed it up (the Striker's Deep Breath).
  const faster = 1 + (player.usesSkills.passives['defense.ooc-recovery-pct'] ?? 0);
  return player.hasHealth.maxHp * GAME_CONFIG.OOC_RECOVERY_PCT * faster;
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
 * Per-tick healing. Advances every timed source, fires the periodic pulse, then
 * applies exactly one heal: the summed in-combat rate while fighting, or the
 * fixed out-of-combat rate otherwise.
 *
 * Timers decay whether or not the player is in combat — a window that was running
 * when the fight ended should not be waiting to resume — but only the in-combat
 * fractions are *paid out* in combat.
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

  const perSecond = inCombat
    ? recoveryPerSecond(player, activeRecoveryFraction(player, true))
    : oocRecoveryPerSecond(player, oocSuppressed);

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

  const boostLeft = getResource(cs, BOOST_MS_KEY);
  if (boostLeft > 0) {
    if (boostLeft - dt <= 0) {
      setResource(cs, BOOST_MS_KEY, 0);
      setResource(cs, BOOST_X_KEY, 0);
    } else {
      setResource(cs, BOOST_MS_KEY, boostLeft - dt);
    }
  }

  if (perSecond <= 0) return;
  applyHealToPlayer(player, cs, perSecond * (dt / 1000), world);
}

/**
 * Fire the periodic Recovery pulse NOW and restart its interval (Swamp charm
 * Cleanse hook). No-op without a pulse mechanic equipped.
 */
export function triggerRecoveryPulse(player: PlayerEntity): void {
  const passives = player.usesSkills.passives;
  const pulsePct = passives['defense.recovery-pulse-pct'] ?? 0;
  const pulseIntervalMs = passives['defense.recovery-pulse-interval-ms'] ?? 0;
  if (pulsePct <= 0 || pulseIntervalMs <= 0) return;
  const durationMs = passives['defense.recovery-pulse-duration-ms'] ?? GAME_CONFIG.RECOVERY_PULSE_MS;
  activateRecovery(player.tracksCombat, 'pulse', pulsePct, durationMs);
  setCooldown(player.tracksCombat, PULSE_CD, pulseIntervalMs);
}

/**
 * Move the ramping-Recovery timer forward by `ms` (Jungle charm Guard hook),
 * clamped to the ramp time. No-op without a ramp mechanic equipped.
 */
export function advanceRecoveryRamp(player: PlayerEntity, ms: number): void {
  const passives = player.usesSkills.passives;
  if ((passives['defense.recovery-ramp-start-pct'] ?? 0) <= 0 || ms <= 0) return;
  const rampTimeMs = passives['defense.recovery-ramp-ramptime-ms'] ?? 10000;
  const cs = player.tracksCombat;
  setResource(cs, RAMP_TIMER_KEY, Math.min(getResource(cs, RAMP_TIMER_KEY) + ms, rampTimeMs));
}

/**
 * Reset the ramp timer when the player leaves combat so the next engagement
 * starts fresh from `start-pct`. No-op if the mechanic isn't present.
 */
export function resetRecoveryRamp(player: PlayerEntity): void {
  if ((player.usesSkills.passives['defense.recovery-ramp-start-pct'] ?? 0) <= 0) return;
  setResource(player.tracksCombat, RAMP_TIMER_KEY, 0);
}

/**
 * Cairnstone: a hit over a share of your max HP multiplies the always-on Recovery share
 * for a few seconds. Reads the final damage, so the cap, plating and shields have landed.
 */
export function registerRecoveryBoostOnBigHit(): void {
  registerCombatListener('afterHit', (ctx) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.damage <= 0) return;
    const player = ctx.defender;
    const passives = player.usesSkills.passives;
    const factor = passives['defense.recovery-hit-x'] ?? 0;
    if (factor <= 1) return;
    if (ctx.damage < player.hasHealth.maxHp * (passives['defense.recovery-hit-pct'] ?? 0.25)) return;
    activateRecoveryBoost(player.tracksCombat, factor);
  });
}
