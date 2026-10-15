/**
 * The moments registry (class-first build plan §3.7, F6): the server side of the shared
 * vocabulary in `shared/src/classKits/moments.ts`. Every class system and the free standing
 * orders ask it the same questions about a fight.
 *
 * A moment is either a STATE (true while it holds: your HP is low, the target is an elite),
 * read from this tick's fight snapshot, or an EVENT (it happened: an enemy started a wind-up,
 * a hit took a big share of your HP), recorded on the player when it happens and active for
 * that tick and the next, so a reader that runs earlier in the tick than the recorder still
 * sees it. A runtime that must react once per event dedupes with `momentTick`.
 *
 * Events come from two places: EDGES of the snapshot (a fact turning on between two ticks),
 * fired when the snapshot refreshes at the top of the tick, and the combat pipeline
 * (`initMomentListeners`). Moments the content doesn't need yet are not implemented and
 * read false (`momentImplemented` says which).
 */
import {
  getCounter,
  getString,
  isMomentId,
  MOMENTS,
  setCounter,
  setString,
  type ConditionRef,
  type MomentId,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { registerCombatListener } from '../engine/combatPipeline';
import { fightSnapshotFor, monsterGone, refreshFightSnapshot, type FightSnapshot } from './fightSnapshot';

type StatePredicate = (snapshot: FightSnapshot, param: number) => boolean;

/** The states, read from the fight snapshot. */
const STATES: Partial<Record<MomentId, StatePredicate>> = {
  'hp-low': (s, p) => s.hpPct < p,
  // Enemies on you: the rune engine's "three or more enemies" measure.
  'enemies-near': (s, p) => s.aggroCount >= p,
  'touched': (s) => s.enemyInContact,
  'carrying-dot': (s) => s.dotStacks > 0,
  'moving': (s) => s.moving,
  'out-of-combat': (s) => !s.inCombat,
  'inside-telegraph': (s) => s.telegraphs.length > 0,
  'target-low': (s, p) => s.targetHpPct !== undefined && s.targetHpPct < p,
  'target-elite': (s) => s.targetIsElite,
  'target-plated': (s) => s.targetPlated,
  // A full bar of your marks: today the DoT inventory's own ceiling.
  'target-full': (s) => s.targetAtMaxDotStacks,
  'target-shielded': (s) => s.targetShielded,
  'target-closing-fast': (s) => s.fastClosing,
  // Today only a boss getting away; ordinary fleeing and kiting arrive with T2.
  'target-flees': (s) => s.targetEscaping,
};

/** The events, recorded as they happen. A param, when the moment has one, is a floor on the recorded value. */
const EVENTS: ReadonlySet<MomentId> = new Set<MomentId>([
  'enemy-winds-up',
  'enemy-casts',
  'telegraph-at-me',
  'control-on-me',
  'debuff-landed',
  'dot-landed',
  'enemy-joins',
  'target-dies',
  'big-hit',
  'repeat-hits',
  'dodged',
]);

export function momentImplemented(id: MomentId): boolean {
  return STATES[id] !== undefined || EVENTS.has(id);
}

const tickKey = (id: MomentId) => `moment.${id}.tick`;
const valueKey = (id: MomentId) => `moment.${id}.value`;

/** Record an event on the player for this tick; the largest value of the tick is kept. */
export function recordMoment(world: World, player: PlayerEntity, id: MomentId, value = 1): void {
  const cs = player.tracksCombat;
  // Stored one up, so a missing counter (0) never reads as tick 0.
  const stamp = world.tickCounter + 1;
  const sameTick = getCounter(cs, tickKey(id)) === stamp;
  setCounter(cs, tickKey(id), stamp);
  setCounter(cs, valueKey(id), sameTick ? Math.max(getCounter(cs, valueKey(id)), value) : value);
}

/** The world tick this event last fired on, if it ever did. */
export function momentTick(player: PlayerEntity, id: MomentId): number | undefined {
  const stamp = getCounter(player.tracksCombat, tickKey(id));
  return stamp > 0 ? stamp - 1 : undefined;
}

function paramOf(id: MomentId, param: number | undefined): number {
  const info = MOMENTS[id] as { param?: { default: number } };
  return param ?? info.param?.default ?? 0;
}

/** Whether a moment holds for this player now. Unimplemented moments read false. */
export function momentActive(
  world: World,
  player: PlayerEntity,
  id: MomentId,
  param: number | undefined,
  now: number,
): boolean {
  const state = STATES[id];
  if (state) return state(fightSnapshotFor(world, player, now), paramOf(id, param));
  if (!EVENTS.has(id)) return false;
  const tick = momentTick(player, id);
  if (tick === undefined || tick < world.tickCounter - 1) return false;
  const info = MOMENTS[id] as { param?: unknown };
  return info.param === undefined || getCounter(player.tracksCombat, valueKey(id)) >= paramOf(id, param);
}

/**
 * Whether every condition holds (an empty list holds). Moments are read here; a class's own
 * state conditions (`resolve-at-least`, `sigils-at-least`) go to `classState`, and read
 * false without it.
 */
export function conditionsHold(
  world: World,
  player: PlayerEntity,
  conditions: readonly ConditionRef[],
  now: number,
  classState?: (condition: ConditionRef) => boolean,
): boolean {
  return conditions.every((condition) => {
    const holds = isMomentId(condition.id)
      ? momentActive(world, player, condition.id, condition.param, now)
      : classState?.(condition) ?? false;
    return condition.not ? !holds : holds;
  });
}

/**
 * Refresh the player's fight snapshot for this tick and fire its edge events. Called once
 * per live player at the top of the tick, by the auto-combat derivation.
 */
export function updatePlayerMoments(world: World, player: PlayerEntity, now: number): FightSnapshot {
  const { snapshot, previous } = refreshFightSnapshot(world, player, now);
  if (snapshot.enemyCharging && !previous?.enemyCharging) recordMoment(world, player, 'enemy-winds-up');
  if (snapshot.enemyCasting && !previous?.enemyCasting) recordMoment(world, player, 'enemy-casts');
  if (snapshot.windupAtMe && !previous?.windupAtMe) recordMoment(world, player, 'telegraph-at-me');
  if (snapshot.controlled && !previous?.controlled) recordMoment(world, player, 'control-on-me');
  if (snapshot.debuffCount > (previous?.debuffCount ?? 0)) recordMoment(world, player, 'debuff-landed');
  if (snapshot.dotStacks > (previous?.dotStacks ?? 0)) recordMoment(world, player, 'dot-landed');
  if (snapshot.aggroCount > (previous?.aggroCount ?? 0)) recordMoment(world, player, 'enemy-joins');
  if (previous?.targetId && monsterGone(world, previous.targetId)) recordMoment(world, player, 'target-dies');
  return snapshot;
}

const REPEAT_BY_KEY = 'moment.repeat-hits.by';
const REPEAT_COUNT_KEY = 'moment.repeat-hits.count';

/**
 * The events the combat pipeline sees: a big hit (its share of max HP), one enemy's hits in
 * a row, and a full dodge. Registered once, from `initCombatSystems`.
 */
export function initMomentListeners(): void {
  registerCombatListener('afterHit', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player') return;
    const player = ctx.defender;
    if (ctx.metadata['evadeFull'] === true) {
      recordMoment(world, player, 'dodged');
      return;
    }
    if (ctx.damage > 0) {
      recordMoment(world, player, 'big-hit', ctx.damage / Math.max(1, player.hasHealth.maxHp));
    }
    const cs = player.tracksCombat;
    const attackerId = ctx.attacker.isMonster.id;
    const streak = getString(cs, REPEAT_BY_KEY) === attackerId ? getCounter(cs, REPEAT_COUNT_KEY) + 1 : 1;
    setString(cs, REPEAT_BY_KEY, attackerId);
    setCounter(cs, REPEAT_COUNT_KEY, streak);
    recordMoment(world, player, 'repeat-hits', streak);
  });
}
