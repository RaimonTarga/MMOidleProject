/**
 * The Slinger's tier 3 pieces that live apart from the Loadout runtime (bible §10.6, §10.16):
 * Seeker's reach into cover, Tether's getaway lock, Tracer II's slow on a fleeing target, Rime
 * Round's frozen ground, Fan the Hammer's burst, Entrenched's stand-your-ground ramp and
 * Deadeye's held round. Every number is a PLACEHOLDER (`tuning.ts`, the kit params).
 */
import {
  applyStatusEffect,
  getResource,
  removeStatusEffect,
  setResource,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { bossPatternEscaping } from '../../combat/ai/bossPatterns';
import { ATTACK_HASTE_PCT_KEY } from '../../combat/engine/attackCadence';
import { applyMonsterRoot, applyMonsterSlow } from '../../combat/status/monsterControl';
import { isTracedBy } from './tracer';
import {
  ENTRENCH_FULL_MS,
  ENTRENCH_MAX_HASTE,
  FAN_HASTE_PCT,
  RIME_SLOW_MS,
  TETHER_ROOT_MS,
} from './tuning';

// ── Getting away ─────────────────────────────────────────────────────────────

/** The monster is getting away from this player: a boss in an escape step, or a body moving off. */
export function isGettingAway(player: PlayerEntity, monster: MonsterEntity): boolean {
  if (bossPatternEscaping(monster)) return true;
  const motion = monster.isMoving?.motion;
  if (!motion || (motion.direction.x === 0 && motion.direction.y === 0)) return false;
  const away = {
    x: monster.hasPosition.current.x - player.hasPosition.current.x,
    y: monster.hasPosition.current.y - player.hasPosition.current.y,
  };
  return motion.direction.x * away.x + motion.direction.y * away.y > 0;
}

// ── Seeker ───────────────────────────────────────────────────────────────────

/** Seeker: a target that burrowed, dived or hid inside reach stays a legal target. */
export function revealSeekable(world: World, player: PlayerEntity): void {
  const reach = player.performsAttack.attackRange;
  const at = player.hasPosition.current;
  for (const monster of world.concealedMonsters) {
    if (monster.hasPosition.nodeId !== player.hasPosition.nodeId || monster.isConcealed.targetable === true) continue;
    if (Math.hypot(monster.hasPosition.current.x - at.x, monster.hasPosition.current.y - at.y) > reach) continue;
    monster.isConcealed.targetable = true;
  }
}

// ── Tracer II ────────────────────────────────────────────────────────────────

/** Tracer II: a traced target that is getting away moves slower. */
export function fleeSlowTick(world: World, player: PlayerEntity, slowPct: number, now: number): void {
  for (const monster of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    if (monster.hasHealth.hp <= 0 || !isTracedBy(monster, player.isPlayer.id, now) || !isGettingAway(player, monster)) continue;
    applyMonsterSlow(world, monster, slowPct, 600, player.isPlayer.id);
  }
}

// ── Tether ───────────────────────────────────────────────────────────────────

const tetherHitsKey = (pid: string) => `slinger.tether.hits.${pid}`;
const tetherAtKey = (pid: string) => `slinger.tether.at.${pid}`;
const tetherUntilKey = (pid: string) => `slinger.tether.until.${pid}`;

/** Tether: count the rounds in a row on one target; enough of them hold it for a moment. */
export function tetherHit(player: PlayerEntity, target: MonsterEntity, rounds: number, windowMs: number, holdMs: number, now: number): void {
  const cs = target.tracksCombat;
  const pid = player.isPlayer.id;
  const inRow = now - getResource(cs, tetherAtKey(pid)) <= windowMs ? getResource(cs, tetherHitsKey(pid)) + 1 : 1;
  setResource(cs, tetherHitsKey(pid), inRow);
  setResource(cs, tetherAtKey(pid), now);
  if (inRow >= rounds) setResource(cs, tetherUntilKey(pid), now + holdMs);
}

export function isTethered(player: PlayerEntity, monster: MonsterEntity, now: number): boolean {
  return getResource(monster.tracksCombat, tetherUntilKey(player.isPlayer.id)) > now;
}

/**
 * A tethered target that tries to get away is rooted for a moment. STAND-IN: the bible says "can't dash
 * or teleport away"; no dash/teleport hook exists, so the lock is a short root while it escapes.
 */
export function tetherTick(world: World, player: PlayerEntity, now: number): void {
  for (const monster of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    if (monster.hasHealth.hp <= 0 || !isTethered(player, monster, now) || !isGettingAway(player, monster)) continue;
    applyMonsterRoot(world, monster, TETHER_ROOT_MS, player.isPlayer.id);
  }
}

// ── Rime Round ───────────────────────────────────────────────────────────────

const RIME = {
  x: 'slinger.rime.x', y: 'slinger.rime.y', r: 'slinger.rime.r', until: 'slinger.rime.until', pct: 'slinger.rime.pct',
} as const;

/** Rime Round: frozen ground at the target. One patch at a time; a new one replaces the old. */
export function layRime(player: PlayerEntity, at: { x: number; y: number }, radius: number, slowPct: number, groundMs: number, now: number): void {
  const cs = player.tracksCombat;
  setResource(cs, RIME.x, at.x);
  setResource(cs, RIME.y, at.y);
  setResource(cs, RIME.r, radius);
  setResource(cs, RIME.pct, slowPct);
  setResource(cs, RIME.until, now + groundMs);
}

/** The frozen ground while it lasts, for the HUD slice; null once it has thawed. */
export function rimeGround(player: PlayerEntity, now: number): { x: number; y: number; radius: number } | null {
  const cs = player.tracksCombat;
  if (getResource(cs, RIME.until) <= now) return null;
  return { x: Math.round(getResource(cs, RIME.x)), y: Math.round(getResource(cs, RIME.y)), radius: getResource(cs, RIME.r) };
}

/** Enemies standing on the frozen ground are slowed. */
export function rimeTick(world: World, player: PlayerEntity, now: number): void {
  const cs = player.tracksCombat;
  if (getResource(cs, RIME.until) <= now) return;
  const x = getResource(cs, RIME.x);
  const y = getResource(cs, RIME.y);
  const r = getResource(cs, RIME.r);
  for (const monster of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    if (monster.hasHealth.hp <= 0) continue;
    if (Math.hypot(monster.hasPosition.current.x - x, monster.hasPosition.current.y - y) > r) continue;
    applyMonsterSlow(world, monster, getResource(cs, RIME.pct), RIME_SLOW_MS, player.isPlayer.id);
  }
}

// ── Fan the Hammer ───────────────────────────────────────────────────────────

export const FAN_EFFECT_ID = 'slinger-fan-the-hammer';

/** After the reload spin, the first rounds fire at triple rate: a haste on the attack cadence. */
export function startFan(player: PlayerEntity): void {
  applyStatusEffect(player.tracksCombat, {
    id: FAN_EFFECT_ID, maxStacks: 1, remainingMs: 8_000, refreshable: true, sourceId: player.isPlayer.id,
    data: { [ATTACK_HASTE_PCT_KEY]: FAN_HASTE_PCT, totalMs: 8_000 },
  });
}

export function endFan(player: PlayerEntity): void {
  removeStatusEffect(player.tracksCombat, FAN_EFFECT_ID);
}

// ── Entrenched ───────────────────────────────────────────────────────────────

export const ENTRENCHED_EFFECT_ID = 'slinger-entrenched';
const STAND_SINCE = 'slinger.stand.since';
const ENTRENCH = 'slinger.entrench';

/** How far the ramp has come, 0 to 1. */
export function entrenchFraction(player: PlayerEntity): number {
  return getResource(player.tracksCombat, ENTRENCH);
}

/** Standing still ramps fire rate (and the shell); moving resets it. The stationary reload counts as standing. */
export function entrenchTick(player: PlayerEntity, now: number): void {
  const cs = player.tracksCombat;
  if (player.isMoving || getResource(cs, STAND_SINCE) === 0) setResource(cs, STAND_SINCE, now);
  const fraction = Math.min(1, Math.max(0, (now - getResource(cs, STAND_SINCE)) / ENTRENCH_FULL_MS));
  setResource(cs, ENTRENCH, fraction);
  if (fraction <= 0) {
    removeStatusEffect(cs, ENTRENCHED_EFFECT_ID);
    return;
  }
  const effect = applyStatusEffect(player.tracksCombat, {
    id: ENTRENCHED_EFFECT_ID, maxStacks: 1, remainingMs: -1, refreshable: false, sourceId: player.isPlayer.id,
    data: { totalMs: ENTRENCH_FULL_MS },
  });
  effect.data[ATTACK_HASTE_PCT_KEY] = fraction * ENTRENCH_MAX_HASTE;
}

export function clearEntrench(player: PlayerEntity): void {
  const cs = player.tracksCombat;
  setResource(cs, STAND_SINCE, 0);
  setResource(cs, ENTRENCH, 0);
  removeStatusEffect(cs, ENTRENCHED_EFFECT_ID);
}

// ── Deadeye ──────────────────────────────────────────────────────────────────

const DEADEYE_SINCE = 'slinger.deadeye.since';
const DEADEYE_HELD = 'slinger.deadeye.held';

/** The last round is no longer waiting (it fired, or the clip is empty or reloading). */
export function resetDeadeye(player: PlayerEntity): void {
  const cs = player.tracksCombat;
  if (getResource(cs, DEADEYE_SINCE) !== 0) setResource(cs, DEADEYE_SINCE, 0);
}

/**
 * Deadeye: should the last round wait? It waits until the rule's moment or `holdMs`. Called on the
 * attack that would fire it, so a hold shows up as a cancelled attack and the clip simply pauses.
 */
export function deadeyeHolds(player: PlayerEntity, momentHolds: boolean, holdMs: number, now: number): boolean {
  const cs = player.tracksCombat;
  const since = getResource(cs, DEADEYE_SINCE);
  if (since === 0) {
    setResource(cs, DEADEYE_SINCE, now);
    if (!momentHolds) {
      setResource(cs, DEADEYE_HELD, 1);
      return true;
    }
    return false;
  }
  if (momentHolds || now - since >= holdMs) return false;
  setResource(cs, DEADEYE_HELD, 1);
  return true;
}

/** Whether the round about to fly was held, and the flag cleared. */
export function takeDeadeyeHeld(player: PlayerEntity): boolean {
  const cs = player.tracksCombat;
  const held = getResource(cs, DEADEYE_HELD) > 0;
  if (held) setResource(cs, DEADEYE_HELD, 0);
  setResource(cs, DEADEYE_SINCE, 0);
  return held;
}
