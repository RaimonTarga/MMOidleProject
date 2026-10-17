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
 * The T3 specializations (bible §12.6) bend these resources in place: Afterglow, Tempered, Iaido,
 * Cascade, Subjugator and Crescendo live here; Thousand Cuts, Afterimage and Frenzy touch the
 * Order's beats and finisher (`order.ts`) and keep their state here.
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
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import { fightSnapshotFor } from '../../../combat/moments/fightSnapshot';
import { momentActive } from '../../../combat/moments/moments';
import { isHardControlled } from '../../../combat/status/playerHardControl';
import { activateRecoveryBoost } from '../../../defense/regen/recovery';
import {
  AFTERGLOW,
  CASCADE,
  CASCADE_EXTRA_STEPS,
  CRESCENDO,
  IAIDO,
  IAIDO_CAST_EDGE_MULT,
  IAIDO_CAST_EXTRA_STEPS,
  SUBJUGATOR,
  SUBJUGATOR_CONTROL_BEATS,
  TEMPERED,
  TEMPERED_KEEP,
  strikerSpecOf,
} from './strikerT3';

export const STRIKER_LIGHT = 'striker-light';
export const STRIKER_BALANCED = 'striker-balanced';
export const STRIKER_HEAVY = 'striker-heavy';

/** Light: a lit beat hits this much harder. PLACEHOLDER (OV-STRIKER: 0.25 -> 0.5; Light had about half
 * Balanced's and Heavy's boss dps in classBossSim and lost the T3 Volcanic boss at 20% left.
 * OV2-STRIKER: 0.5 -> 1.5; the finisher still carried half of Light's boss damage (bible §12.5:
 * ~75 / 25 combo / finisher), and Light lost the T2 Desert boss at 18% left and the Mountain at
 * 8%; at 1.5 it won all seven T2 and every T3/T4 boss in classBossSim). */
export const SHINE_DAMAGE_PCT = 1.5;
/** Balanced: each step of the edge adds this much to a damage technique and the finisher (§12.5: ~+15%). */
export const EDGE_STEP_PCT = 0.15;
/** Heavy: a soft beat adds this much to the finisher; a setup multiplies the total by `MOMENTUM_SETUP_MULT`. */
export const MOMENTUM_PER_BEAT = 0.25;
export const MOMENTUM_SETUP_MULT = 1.5;
/** Heavy: Momentum stops here (Crescendo lifts the cap). */
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
  /** Afterglow: a break left the shine lit for one more combo; the next finisher puts it out. */
  fading: boolean;
  /** Afterimage: the damage the combo's beats held back, one slash each, for the finisher to replay. */
  held: number[];
  /** Frenzy: finishers landed since the fight began (reset when the fight goes quiet). */
  fightFinishers: number;
  /** Frenzy: the finisher that is armed now is the second, lighter one. */
  secondFinisher: boolean;
  /** Pressure Point: the next finisher on this target hits harder by this share. */
  pressure: { targetId: string; pct: number } | null;
  /** Hunter's Blade: the target the last swing was on. */
  lastTargetId: string | null;
  /** Watchful: an ambush landed on this tick or the last. */
  ambushGuard: boolean;
}

const states = new WeakMap<PlayerEntity, StrikerT2State>();

export function strikerT2(player: PlayerEntity): StrikerT2State {
  let state = states.get(player);
  if (!state) {
    state = {
      critMult: 0, lit: false, edge: 0, momentum: 0, fading: false, held: [], fightFinishers: 0,
      secondFinisher: false, pressure: null, lastTargetId: null, ambushGuard: false,
    };
    states.set(player, state);
  }
  return state;
}

/** A break: the shine goes out, the edge resets, Momentum drains (§12.2). */
export function breakStrikerResource(player: PlayerEntity): void {
  const state = strikerT2(player);
  // Afterglow: the shine outlasts the break by one combo (the next finisher puts it out).
  if (strikerSpecOf(player) === AFTERGLOW && state.lit) state.fading = true;
  else state.lit = false;
  state.edge = 0;
  state.momentum = 0;
  state.held.length = 0;
  state.secondFinisher = false;
}

/** A setup (§12.8): a technique that changes the beat after it, rather than hitting. */
export function isSetupFamily(family: string): boolean {
  return family === 'attack-setup' || family === 'finisher-setup';
}

/** What the discipline does to a beat's swing, before the technique runs. */
export function disciplineBeatMult(
  player: PlayerEntity,
  disciplineId: string | null,
  damageTechnique: boolean,
  /** The technique is a cast (Iaido: it cuts with double the edge). */
  cast = false,
): number {
  const state = strikerT2(player);
  let mult = 1;
  if (disciplineId === STRIKER_LIGHT && state.lit) mult *= 1 + SHINE_DAMAGE_PCT;
  if (disciplineId === STRIKER_BALANCED && damageTechnique) {
    const steps = state.edge * (cast && strikerSpecOf(player) === IAIDO ? IAIDO_CAST_EDGE_MULT : 1);
    mult *= 1 + EDGE_STEP_PCT * steps;
  }
  return mult;
}

/** What kind of beat landed, for the specializations that read it. */
export interface LandedBeat {
  /** A damage-family technique (Cascade). */
  damageTechnique?: boolean;
  /** A cast beat (Iaido). */
  cast?: boolean;
  /** A control technique (Subjugator). */
  control?: boolean;
}

/** A beat landed (swing or cast): the edge rises a step; Momentum builds or is multiplied. */
export function landStrikerBeat(player: PlayerEntity, disciplineId: string | null, setup: boolean, beat: LandedBeat = {}): void {
  const state = strikerT2(player);
  const spec = strikerSpecOf(player);
  if (disciplineId === STRIKER_BALANCED) {
    state.edge++;
    if (spec === CASCADE && beat.damageTechnique) state.edge += CASCADE_EXTRA_STEPS;
    if (spec === IAIDO && beat.cast) state.edge += IAIDO_CAST_EXTRA_STEPS;
  } else if (disciplineId === STRIKER_HEAVY) {
    // Subjugator: a control technique builds Momentum like two soft beats, then multiplies as a setup.
    const base = spec === SUBJUGATOR && beat.control
      ? state.momentum + MOMENTUM_PER_BEAT * SUBJUGATOR_CONTROL_BEATS
      : state.momentum;
    const next = setup ? base * MOMENTUM_SETUP_MULT : base + MOMENTUM_PER_BEAT;
    // Crescendo: Momentum stops capping.
    state.momentum = spec === CRESCENDO ? next : Math.min(MOMENTUM_CAP, next);
  }
}

/** Crescendo: a swing spent waiting for the finisher's release builds Momentum like a soft beat, uncapped. */
export function buildWaitingMomentum(player: PlayerEntity): void {
  if (strikerSpecOf(player) !== CRESCENDO) return;
  strikerT2(player).momentum += MOMENTUM_PER_BEAT;
}

/** The finisher's discipline multiplier. */
export function disciplineFinisherMult(player: PlayerEntity, disciplineId: string | null): number {
  const state = strikerT2(player);
  if (disciplineId === STRIKER_BALANCED) return 1 + EDGE_STEP_PCT * state.edge;
  if (disciplineId === STRIKER_HEAVY) return 1 + state.momentum;
  // Afterglow: the shine also lights the finisher.
  if (disciplineId === STRIKER_LIGHT && state.lit && strikerSpecOf(player) === AFTERGLOW) return 1 + SHINE_DAMAGE_PCT;
  return 1;
}

/**
 * The finisher landed: the edge and Momentum are spent; Light lights the next combo.
 * Tempered keeps half the edge; Afterglow's fading shine goes out here instead of relighting.
 */
export function spendStrikerFinisher(player: PlayerEntity, disciplineId: string | null): void {
  const state = strikerT2(player);
  const spec = strikerSpecOf(player);
  state.edge = spec === TEMPERED ? Math.floor(state.edge * TEMPERED_KEEP) : 0;
  state.momentum = 0;
  state.held.length = 0;
  if (state.fading) {
    state.fading = false;
    state.lit = false;
  } else {
    state.lit = disciplineId === STRIKER_LIGHT;
  }
  state.fightFinishers++;
}

/** Watchful: an ambush landing now keeps casts and the resource whole. */
export function strikerAmbushGuard(player: PlayerEntity): boolean {
  return strikerT2(player).ambushGuard;
}

/** Whether the player's Unbroken, Clear Mind or Watchful says this hard control doesn't break the resource. */
function controlDoesNotBreak(player: PlayerEntity): boolean {
  const p = player.usesSkills.passives;
  // Clear Mind: no debuff breaks your combo.
  return (p['defense.control-duration-cut-pct'] ?? 0) > 0 || (p['striker.clear-mind'] ?? 0) > 0 || strikerAmbushGuard(player);
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
    const hasResource = state.lit || state.edge > 0 || state.momentum > 0 || state.held.length > 0;
    if (hasResource) {
      const snapshot = fightSnapshotFor(world, player, now);
      const stunned = isHardControlled(cs) && !controlDoesNotBreak(player);
      const idle = now - player.performsAttack.lastAttackAt > BREAK_NO_TARGET_MS;
      if (stunned || idle || snapshot.traveling) breakStrikerResource(player);
    }

    // Frenzy counts the fight's finishers; a quiet spell ends the fight.
    if (now - player.performsAttack.lastAttackAt > BREAK_NO_TARGET_MS) {
      state.fightFinishers = 0;
      state.secondFinisher = false;
    }

    syncResourceSlice(world, player, state);

    // Chase: Recovery is multiplied while you close on a target.
    const chase = p['striker.closing-recovery-x'] ?? 0;
    if (chase > 1 && closingOnTarget(world, player)) activateRecoveryBoost(cs, chase, BOOST_MS);

    // Close In: while a ranged enemy hits you, you move faster toward it. Rides the Sidestep
    // status' speed layer (movement already reads it); it carries no evasion.
    const closeIn = p['striker.close-in-speed-pct'] ?? 0;
    if (closeIn > 0 && closingOnTarget(world, player) && fightSnapshotFor(world, player, now).rangedAttacker) {
      const live = getStatusEffect(cs, ABILITY_SIDESTEP_EFFECT_ID);
      if (!live || (live.data['evasionPct'] ?? 0) === 0) {
        const effect = applyStatusEffect(player.tracksCombat, {
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

/** The HUD reads the resource off the networked slice; copy it over and mark it dirty only on a change. */
function syncResourceSlice(world: World, player: PlayerEntity, state: StrikerT2State): void {
  const cadence = player.usesCadence;
  if (!cadence) return;
  const momentum = Math.round(state.momentum * 100) / 100;
  const held = state.held.length;
  if (
    cadence.lit === state.lit && cadence.edge === state.edge && cadence.momentum === momentum
    && cadence.held === held && cadence.fightFinishers === state.fightFinishers
    && cadence.frenzyArmed === state.secondFinisher
  ) return;
  cadence.lit = state.lit;
  cadence.edge = state.edge;
  cadence.momentum = momentum;
  cadence.held = held;
  cadence.fightFinishers = state.fightFinishers;
  cadence.frenzyArmed = state.secondFinisher;
  markSliceDirty(world, player, 'usesCadence');
}

/** The player has a target and is walking up to it (not yet in reach). */
function closingOnTarget(world: World, player: PlayerEntity): boolean {
  const targetId = player.hasAttackTarget?.targetId;
  const target = targetId ? world.getMonsterEntity(targetId) : undefined;
  if (!target || target.hasHealth.hp <= 0 || player.isMoving === undefined) return false;
  return !world.collision.canReach(player, target, player.performsAttack.attackRange);
}
