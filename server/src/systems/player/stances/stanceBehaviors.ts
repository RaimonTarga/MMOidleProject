/**
 * Server systems behind the four postures added 2026-09-02 (Time to Strike,
 * Reaper, Warding, Powering Up).
 *
 * They live here rather than in `stanceSwitch.ts` because that file owns the
 * SWITCH — which posture is active, the minimum dwell, the HP-gate rebuild — and
 * these own what a posture DOES once it is. The only coupling is the release
 * hook: leaving Powering Up has to spend its charge, and only the switch knows
 * when a stance is left.
 *
 * Warding is deliberately absent from this file. Its whole effect is two passives
 * (`shared.status-duration-resist` / `-potency-resist`) read by
 * `combat/status/harmfulStatus.ts` at the moment a harmful status is applied, so
 * the stance needs no listener of its own and the resistance axis stays open to
 * gear that wants it later.
 *
 * NOTE: none of these stances is placed. No recipe teaches them, so `knownStances`
 * can never contain one and every listener below is inert until a recipe is added.
 * See `docs/stances-future-design-notes.md`.
 */
import {
  POWERING_UP_MAX_CHARGE_MS,
  POWERING_UP_MIN_RELEASE_MS,
  POWERING_UP_RELEASE_ATTACK_PCT,
  POWERING_UP_RELEASE_ATTACK_SPEED_PCT,
  REAPER_MOMENTUM_ATTACK_PCT,
  REAPER_MOMENTUM_ATTACK_SPEED_PCT,
  REAPER_MOMENTUM_MS,
  TIME_TO_STRIKE_NORMAL_PENALTY,
  applyStatusEffect,
  getCounter,
  getStatusEffect,
  removeStatusEffect,
  setCounter,
  type TracksCombat,
} from "@mmo-idle/shared";
import type { PlayerEntity } from "../../../ecs/entity";
import { registerCombatListener } from "../../combat/engine/combatPipeline";
import { defineBuff } from "../../combat/buffs/descriptor";

export const TIME_TO_STRIKE_ID = "time-to-strike-stance";
export const REAPER_ID = "reaper-stance";
export const WARDING_ID = "warding-stance";
export const POWERING_UP_ID = "powering-up-stance";

/** Reaper's on-kill momentum. Outlives the stance, so it is a status, not a modifier. */
export const REAPER_MOMENTUM_EFFECT = "stance-reaper-momentum";
/** Powering Up's spent-charge burst window. */
export const POWER_RELEASE_EFFECT = "stance-power-release";
/** Powering Up's accumulating charge, in milliseconds. */
const POWER_CHARGE_COUNTER = "stance.power.chargeMs";

// ── Powering Up ───────────────────────────────────────────────────────────────

export function poweringUpChargeMs(cs: TracksCombat): number {
  return Math.max(0, Math.min(POWERING_UP_MAX_CHARGE_MS, getCounter(cs, POWER_CHARGE_COUNTER)));
}

/** True once the charge is full — the `Stance Charged` Rune situation. */
export function poweringUpFullyCharged(cs: TracksCombat): boolean {
  return poweringUpChargeMs(cs) >= POWERING_UP_MAX_CHARGE_MS;
}

/**
 * Accrue charge for one tick. Called only while Powering Up is the active stance.
 *
 * `inCombat` gates it because the design hazard here is the obvious one: a posture
 * you charge for free before every pull is not a decision, it is a loading screen.
 * Combat ending also DISCARDS the charge, so one fight cannot be used to load a
 * burst for the next.
 */
export function tickPoweringUpCharge(cs: TracksCombat, dt: number, inCombat: boolean): void {
  if (!inCombat) {
    clearPoweringUpCharge(cs);
    return;
  }
  setCounter(
    cs,
    POWER_CHARGE_COUNTER,
    Math.min(POWERING_UP_MAX_CHARGE_MS, poweringUpChargeMs(cs) + dt),
  );
}

export function clearPoweringUpCharge(cs: TracksCombat): void {
  if (getCounter(cs, POWER_CHARGE_COUNTER) !== 0) setCounter(cs, POWER_CHARGE_COUNTER, 0);
}

/**
 * Spend whatever charge was built, as a burst window lasting exactly as long as the
 * charge did. Called by the switch system when Powering Up stops being active,
 * HOWEVER it stopped — a Rune rule, a revert to default, or the player changing
 * their default posture. There is no way to leave the stance without cashing in,
 * which is what makes the charge a commitment rather than a resource to hoard.
 */
export function releasePoweringUpCharge(player: PlayerEntity): void {
  const cs = player.tracksCombat;
  const charge = poweringUpChargeMs(cs);
  clearPoweringUpCharge(cs);
  // Too little to be worth a window. Discarded rather than paid out, so tapping in
  // and out of the stance is worthless and holding it is the only way to profit.
  if (charge < POWERING_UP_MIN_RELEASE_MS) return;
  applyStatusEffect(cs, {
    id: POWER_RELEASE_EFFECT,
    maxStacks: 1,
    instanced: false,
    refreshable: true,
    remainingMs: charge,
    sourceId: player.isPlayer.id,
    data: {
      attackPct: POWERING_UP_RELEASE_ATTACK_PCT,
      attackSpeedPct: POWERING_UP_RELEASE_ATTACK_SPEED_PCT,
      totalMs: charge,
    },
  });
}

// ── Attack-speed windows ──────────────────────────────────────────────────────

/**
 * Combined attack-speed bonus from every stance-owned timed window, as a fraction.
 *
 * Read by the attack-cadence GATE in `combat.ts`, never written into
 * `performsAttack.attackCooldown`. That is not a style preference: the Zealot's
 * Frenzy already mutates that stat from a cached base, and a second mutator that
 * treats Frenzy's output as "the clean base" ratchets the cooldown toward zero over
 * a few ticks. The gate is the safe seam, and Frenzy's own haste already rides it.
 */
export function stanceAttackSpeedBonus(cs: TracksCombat): number {
  let bonus = 0;
  const momentum = getStatusEffect(cs, REAPER_MOMENTUM_EFFECT);
  if (momentum && momentum.remainingMs > 0) bonus += momentum.data["attackSpeedPct"] ?? 0;
  const release = getStatusEffect(cs, POWER_RELEASE_EFFECT);
  if (release && release.remainingMs > 0) bonus += release.data["attackSpeedPct"] ?? 0;
  return bonus;
}

// ── Combat listeners ──────────────────────────────────────────────────────────

export function initNewStanceBehaviors(): void {
  // Time to Strike: the empowered BONUS rides the pre-existing
  // `shared.empowered-mult-add` passive, so only the ordinary-hit penalty needs a
  // listener. It reads `empoweredAttack` metadata, which the archetype empowered
  // multipliers set — they register first (initAllMechanics precedes
  // initStanceCombatEffects in combatBootstrap), so by here the flag is truthful.
  registerCombatListener("onHit", (ctx) => {
    if (ctx.attackerType !== "player" || ctx.defenderType !== "monster") return;
    if (ctx.attacker.tracksProgression.activeStance !== TIME_TO_STRIKE_ID) return;
    if (ctx.metadata["empoweredAttack"]) return;
    ctx.damage = Math.max(
      ctx.damage > 0 ? 1 : 0,
      Math.round(ctx.damage * (1 - TIME_TO_STRIKE_NORMAL_PENALTY)),
    );
  });

  // Reaper's momentum DAMAGE, applied wherever the window is live — including after
  // the player has left Reaper, which is the entire point of the posture.
  registerCombatListener("onHit", (ctx) => {
    if (ctx.attackerType !== "player") return;
    const momentum = getStatusEffect(ctx.attacker.tracksCombat, REAPER_MOMENTUM_EFFECT);
    if (!momentum || momentum.remainingMs <= 0) return;
    ctx.damage = Math.round(ctx.damage * (1 + (momentum.data["attackPct"] ?? 0)));
  });

  // Powering Up's release DAMAGE. Same seam, same reason.
  registerCombatListener("onHit", (ctx) => {
    if (ctx.attackerType !== "player") return;
    const release = getStatusEffect(ctx.attacker.tracksCombat, POWER_RELEASE_EFFECT);
    if (!release || release.remainingMs <= 0) return;
    ctx.damage = Math.round(ctx.damage * (1 + (release.data["attackPct"] ?? 0)));
  });

  // Reaper arms the momentum. Only kills landed WHILE the stance is active count, so
  // the window refreshes on a killing spree held in Reaper but decays normally once
  // the player has reverted — momentum you keep spending has to be re-earned.
  registerCombatListener("onKill", (ctx) => {
    if (ctx.attackerType !== "player") return;
    const player = ctx.attacker;
    if (player.tracksProgression.activeStance !== REAPER_ID) return;
    // maxStacks 1 + refreshable: the duration resets, the magnitude never climbs.
    // (`applyStatusEffect` keeps an EXISTING effect's cap, so this stays 1 either way.)
    applyStatusEffect(player.tracksCombat, {
      id: REAPER_MOMENTUM_EFFECT,
      maxStacks: 1,
      instanced: false,
      refreshable: true,
      remainingMs: REAPER_MOMENTUM_MS,
      sourceId: player.isPlayer.id,
      data: {
        attackPct: REAPER_MOMENTUM_ATTACK_PCT,
        attackSpeedPct: REAPER_MOMENTUM_ATTACK_SPEED_PCT,
        totalMs: REAPER_MOMENTUM_MS,
      },
    });
  });
}

/** Clears every stance-owned window. Used when a character's build is reset. */
export function clearStanceWindows(cs: TracksCombat): void {
  removeStatusEffect(cs, REAPER_MOMENTUM_EFFECT);
  removeStatusEffect(cs, POWER_RELEASE_EFFECT);
  clearPoweringUpCharge(cs);
}

// ── Buff-bar projection ───────────────────────────────────────────────────────

function durationPct(remainingMs: number, totalMs: number): number {
  return totalMs > 0 && remainingMs > 0 ? (remainingMs / totalMs) * 100 : -1;
}

const asPct = (v: number): string => `+${Math.round(v * 100)}%`;

export const STANCE_BUFFS = [
  defineBuff(
    "stance-reaper",
    ({ playerCs }) => {
      if (!playerCs) return null;
      const fx = getStatusEffect(playerCs, REAPER_MOMENTUM_EFFECT);
      if (!fx || fx.remainingMs <= 0) return null;
      const atk = fx.data["attackPct"] ?? 0;
      const aps = fx.data["attackSpeedPct"] ?? 0;
      return {
        id: "stance-reaper",
        label: "Momentum",
        stacks: 1,
        durationPct: durationPct(fx.remainingMs, fx.data["totalMs"] ?? 0),
        remainingMs: fx.remainingMs,
        color: "#d4506a",
        logDetail: `${asPct(atk)} damage, ${asPct(aps)} attack speed (kill)`,
        values: [
          { label: "Damage", value: asPct(atk), good: true },
          { label: "Attack speed", value: asPct(aps), good: true },
        ],
      };
    },
    { category: "neutral", shape: "diamond", color: "#d4506a", label: "Momentum" },
  ),
  // The charge is shown as a FILLING clock rather than a draining one: it is the
  // only buff in the game that gets better the longer it sits, and a sweep running
  // the usual direction would read as "about to expire".
  defineBuff(
    "stance-charge",
    ({ player, playerCs }) => {
      if (!playerCs) return null;
      if (player.tracksProgression.activeStance !== POWERING_UP_ID) return null;
      const charge = poweringUpChargeMs(playerCs);
      if (charge <= 0) return null;
      const full = poweringUpFullyCharged(playerCs);
      return {
        id: "stance-charge",
        label: full ? "Charged" : "Charging",
        stacks: 1,
        durationPct: (charge / POWERING_UP_MAX_CHARGE_MS) * 100,
        color: full ? "#ffd54a" : "#8a7fd0",
        logDetail: full
          ? "fully charged — leaving the stance spends it"
          : `charging (${(charge / 1000).toFixed(1)}s banked)`,
        values: [
          {
            label: "Charge",
            value: `${(charge / 1000).toFixed(1)}s / ${(POWERING_UP_MAX_CHARGE_MS / 1000).toFixed(0)}s`,
            good: true,
          },
        ],
      };
    },
    { category: "neutral", shape: "circle", color: "#8a7fd0", label: "Charge" },
  ),
  defineBuff(
    "stance-release",
    ({ playerCs }) => {
      if (!playerCs) return null;
      const fx = getStatusEffect(playerCs, POWER_RELEASE_EFFECT);
      if (!fx || fx.remainingMs <= 0) return null;
      const atk = fx.data["attackPct"] ?? 0;
      const aps = fx.data["attackSpeedPct"] ?? 0;
      return {
        id: "stance-release",
        label: "Unleashed",
        stacks: 1,
        durationPct: durationPct(fx.remainingMs, fx.data["totalMs"] ?? 0),
        remainingMs: fx.remainingMs,
        color: "#ffd54a",
        logDetail: `${asPct(atk)} damage, ${asPct(aps)} attack speed (released charge)`,
        values: [
          { label: "Damage", value: asPct(atk), good: true },
          { label: "Attack speed", value: asPct(aps), good: true },
        ],
      };
    },
    { category: "neutral", shape: "diamond", color: "#ffd54a", label: "Unleashed" },
  ),
] as const;
