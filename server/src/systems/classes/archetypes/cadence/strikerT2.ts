/**
 * The Striker's Tier 2 state and gear (class-first build plan T2-STRIKER; bible §12.5, §12.16).
 *
 *  - The three disciplines' resources: Light's shine, Balanced's edge, Heavy's Momentum. Each
 *    is a small multiplier on a beat or on the finisher, kept per player here (server-only for
 *    now; the HUD strip reads it once the slice carries it, see the T2-STRIKER report).
 *  - A break (a stun, a few seconds with no target, the walk) costs each its resource, unless
 *    Unbroken or Watchful says the hit doesn't count.
 *  - The Jungle and Desert gear lines: Watchful, Chase, Close In, Shake Off.
 *
 * Every number is a PLACEHOLDER for the designer.
 */
import {
  ABILITY_SIDESTEP_EFFECT_ID,
  applyStatusEffect,
  getResource,
  getStatusEffect,
  removeStatusEffect,
  setResource,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { fightSnapshotFor } from '../../../combat/moments/fightSnapshot';
import { momentActive } from '../../../combat/moments/moments';
import { isHardControlled } from '../../../combat/status/playerHardControl';
import { activateRecoveryBoost } from '../../../defense/regen/recovery';

export const STRIKER_LIGHT = 'striker-light';
export const STRIKER_BALANCED = 'striker-balanced';
export const STRIKER_HEAVY = 'striker-heavy';

/** Light: a lit beat hits this much harder. */
export const SHINE_DAMAGE_PCT = 0.25;
/** Balanced: each step of the edge adds this much to a damage technique and the finisher (§12.5: ~+15%). */
export const EDGE_STEP_PCT = 0.15;
/** Heavy: a soft beat adds this much to the finisher; a setup multiplies the total by `MOMENTUM_SETUP_MULT`. */
export const MOMENTUM_PER_BEAT = 0.25;
export const MOMENTUM_SETUP_MULT = 1.5;
/** Heavy: Momentum stops here (Crescendo lifts the cap at T3). */
export const MOMENTUM_CAP = 2;
/** No target for this long breaks the combo's resource. */
export const BREAK_NO_TARGET_MS = 3000;

/** Shake Off, Chase and Close In: how long one tick's boost lasts (re-armed every tick). */
const BOOST_MS = 500;
const SHAKE_OFF_TIMER = 'striker.shakeOff.ms';
/** What Shake Off ends on the player: the Desert's mark, and a slow. */
const SHAKE_OFF_IDS = ['sun-mark', 'slow'] as const;

export interface StrikerT2State {
  /** Feint armed: the next beat is a critical hit for this multiple of its damage (0 = unarmed). */
  critMult: number;
  /** Light: the next combo's beats are lit. */
  lit: boolean;
  /** Balanced: steps the edge has risen this combo. */
  edge: number;
  /** Heavy: Momentum, as a bonus on the finisher (0.5 = +50%). */
  momentum: number;
  /** Hunter's Blade: the target the last swing was on. */
  lastTargetId: string | null;
  /** Watchful: an ambush landed on this tick or the last. */
  ambushGuard: boolean;
}

const states = new WeakMap<PlayerEntity, StrikerT2State>();

export function strikerT2(player: PlayerEntity): StrikerT2State {
  let state = states.get(player);
  if (!state) {
    state = { critMult: 0, lit: false, edge: 0, momentum: 0, lastTargetId: null, ambushGuard: false };
    states.set(player, state);
  }
  return state;
}

/** A break: the shine goes out, the edge resets, Momentum drains (§12.2). */
export function breakStrikerResource(player: PlayerEntity): void {
  const state = strikerT2(player);
  state.lit = false;
  state.edge = 0;
  state.momentum = 0;
}

/** A setup (§12.8): a technique that changes the beat after it, rather than hitting. */
export function isSetupFamily(family: string): boolean {
  return family === 'attack-setup' || family === 'finisher-setup';
}

/** What the discipline does to a beat's swing, before the technique runs. */
export function disciplineBeatMult(player: PlayerEntity, disciplineId: string | null, damageTechnique: boolean): number {
  const state = strikerT2(player);
  let mult = 1;
  if (disciplineId === STRIKER_LIGHT && state.lit) mult *= 1 + SHINE_DAMAGE_PCT;
  if (disciplineId === STRIKER_BALANCED && damageTechnique) mult *= 1 + EDGE_STEP_PCT * state.edge;
  return mult;
}

/** A beat landed (swing or cast): the edge rises a step; Momentum builds or is multiplied. */
export function landStrikerBeat(player: PlayerEntity, disciplineId: string | null, setup: boolean): void {
  const state = strikerT2(player);
  if (disciplineId === STRIKER_BALANCED) state.edge++;
  else if (disciplineId === STRIKER_HEAVY) {
    state.momentum = Math.min(MOMENTUM_CAP, setup ? state.momentum * MOMENTUM_SETUP_MULT : state.momentum + MOMENTUM_PER_BEAT);
  }
}

/** The finisher's discipline multiplier. */
export function disciplineFinisherMult(player: PlayerEntity, disciplineId: string | null): number {
  const state = strikerT2(player);
  if (disciplineId === STRIKER_BALANCED) return 1 + EDGE_STEP_PCT * state.edge;
  if (disciplineId === STRIKER_HEAVY) return 1 + state.momentum;
  return 1;
}

/** The finisher landed: the edge and Momentum are spent; Light lights the next combo. */
export function spendStrikerFinisher(player: PlayerEntity, disciplineId: string | null): void {
  const state = strikerT2(player);
  state.edge = 0;
  state.momentum = 0;
  state.lit = disciplineId === STRIKER_LIGHT;
}

/** Watchful: an ambush landing now keeps casts and the resource whole. */
export function strikerAmbushGuard(player: PlayerEntity): boolean {
  return strikerT2(player).ambushGuard;
}

/** Whether the player's Unbroken or Watchful says this hard control doesn't break the resource. */
function controlDoesNotBreak(player: PlayerEntity): boolean {
  const p = player.usesSkills.passives;
  return (p['defense.control-duration-cut-pct'] ?? 0) > 0 || strikerAmbushGuard(player);
}

/**
 * Each tick, for every Striker: the break rules, and the Jungle and Desert gear lines.
 * (The leaps, Charge and Pounce, run from `order.ts`, which owns the Order.)
 */
export function updateStrikerT2(world: World, dt: number, now: number): void {
  for (const player of world.livePlayers) {
    if (!player.usesCadence) continue;
    const p = player.usesSkills.passives;
    const state = strikerT2(player);
    const cs = player.tracksCombat;

    // Watchful: the ambush moment lives for this tick and the next.
    state.ambushGuard = (p['striker.ambush-proof'] ?? 0) > 0 && momentActive(world, player, 'ambush', undefined, now);

    // Breaks. Only a discipline has a resource to lose.
    const hasResource = state.lit || state.edge > 0 || state.momentum > 0;
    if (hasResource) {
      const snapshot = fightSnapshotFor(world, player, now);
      const stunned = isHardControlled(cs) && !controlDoesNotBreak(player);
      const idle = now - player.performsAttack.lastAttackAt > BREAK_NO_TARGET_MS;
      if (stunned || idle || snapshot.traveling) breakStrikerResource(player);
    }

    // Chase: Recovery is multiplied while you close on a target.
    const chase = p['striker.closing-recovery-x'] ?? 0;
    if (chase > 1 && closingOnTarget(world, player)) activateRecoveryBoost(cs, chase, BOOST_MS);

    // Close In: while a ranged enemy hits you, you move faster toward it. Rides the Sidestep
    // status' speed layer (movement already reads it); it carries no evasion.
    const closeIn = p['striker.close-in-speed-pct'] ?? 0;
    if (closeIn > 0 && closingOnTarget(world, player) && fightSnapshotFor(world, player, now).rangedAttacker) {
      const live = getStatusEffect(cs, ABILITY_SIDESTEP_EFFECT_ID);
      if (!live || (live.data['evasionPct'] ?? 0) === 0) {
        const effect = applyStatusEffect(cs, {
          id: ABILITY_SIDESTEP_EFFECT_ID,
          maxStacks: 1,
          remainingMs: BOOST_MS,
          refreshable: true,
          sourceId: player.isPlayer.id,
          data: { moveSpeedPct: closeIn, totalMs: BOOST_MS },
        });
        effect.remainingMs = BOOST_MS;
        effect.data['moveSpeedPct'] = closeIn;
      }
    }

    // Shake Off: every interval, a mark or a slow on you ends.
    const interval = p['striker.shake-off-interval-ms'] ?? 0;
    if (interval > 0) {
      const elapsed = getResource(cs, SHAKE_OFF_TIMER) + dt;
      if (elapsed < interval) setResource(cs, SHAKE_OFF_TIMER, elapsed);
      else {
        setResource(cs, SHAKE_OFF_TIMER, elapsed - interval);
        const id = SHAKE_OFF_IDS.find((effectId) => {
          const effect = getStatusEffect(cs, effectId);
          return effect !== undefined && effect.remainingMs !== 0;
        });
        if (id) removeStatusEffect(cs, id);
      }
    }
  }
}

/** The player has a target and is walking up to it (not yet in reach). */
function closingOnTarget(world: World, player: PlayerEntity): boolean {
  const targetId = player.hasAttackTarget?.targetId;
  const target = targetId ? world.getMonsterEntity(targetId) : undefined;
  if (!target || target.hasHealth.hp <= 0 || player.isMoving === undefined) return false;
  return !world.collision.canReach(player, target, player.performsAttack.attackRange);
}
