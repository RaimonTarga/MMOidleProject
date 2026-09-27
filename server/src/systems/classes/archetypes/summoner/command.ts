/**
 * Shift+click summoner commands — server-only owner state (`hasSummonerCommand`).
 * Focus: all mobile minions prioritize the clicked enemy over auto targeting.
 * Move: mobile minions path to the clicked spot (clamped to leash).
 * Recall (hotkey): minions drop their targets and return to their follow offsets
 * around the owner's LIVE position, so the owner can step out of a telegraph and
 * the formation comes along. Holds for `RECALL_HOLD_MS` even after arrival: in a
 * melee brawl the summons are already home, and releasing on arrival sent them
 * straight back into the fight within a tick or two. A summon that is home
 * strikes back at anything already in its reach, but never chases.
 */
import {
  distanceSq,
  getFlag,
  pointInHitbox,
  posHitboxFromEntity,
  resolveSummonerProfile,
  type Vec2,
} from '@mmo-idle/shared';
import type { World } from '../../../../world/World';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import { attachComponent, detachComponent } from '../../../../ecs/markerHelpers';
import { getFollowOffset } from './spawn';
import { RUNE_RECALL_SUMMONS_FLAG } from '../../../combat/ai/runeConfig';

const LEASH_MARGIN = 4;
const ARRIVE_TOL = 10;
const ARRIVE_TOL_SQ = ARRIVE_TOL * ARRIVE_TOL;
/** Covers a full T1 slam wind-up (Ground Slam casts for 1.8 s) pressed as it starts. */
export const RECALL_HOLD_MS = 2_000;
/** Recalled summons sprint home, so the recall outruns melee that follows them. */
export const RECALL_SPEED_MULT = 2;

function computeLeashRadius(owner: PlayerEntity): number {
  return resolveSummonerProfile({
    selectedSubVariant: owner.usesSkills.selectedSubVariant,
    selectedRange: owner.usesSkills.selectedRange,
    unlockedSkills: owner.usesSkills.unlockedSkills,
    passives: owner.usesSkills.passives,
  }).leashRadius;
}

export interface HasSummonerCommand {
  kind: 'focus' | 'move' | 'recall';
  monsterId: string | null;
  pos: Vec2;
  /** Recall only: when it was issued, for the `RECALL_HOLD_MS` window. */
  issuedAtMs?: number;
}

/** Move and recall both pull the formation off the fight. */
export function isSummonerRepositioning(owner: PlayerEntity): boolean {
  return owner.hasSummonerCommand?.kind === 'move' || isSummonerRecalling(owner);
}

/** The R recall, or a Recall Summons rune whose situation holds (owner on auto). */
export function isSummonerRecalling(owner: PlayerEntity): boolean {
  return owner.hasSummonerCommand?.kind === 'recall'
    || (owner.usesAutocombat.auto && getFlag(owner.tracksCombat, RUNE_RECALL_SUMMONS_FLAG));
}

function clampToLeash(owner: PlayerEntity, desired: Vec2, leashRadius: number): Vec2 {
  const op = owner.hasPosition.current;
  const dx = desired.x - op.x;
  const dy = desired.y - op.y;
  const distSq = dx * dx + dy * dy;
  const max = Math.max(0, leashRadius - LEASH_MARGIN);
  if (distSq <= max * max) return desired;
  const d = Math.sqrt(distSq) || 1;
  return {
    x: op.x + (dx / d) * max,
    y: op.y + (dy / d) * max,
  };
}

export function findMonsterAtPoint(
  world: World,
  nodeId: string,
  point: Vec2,
): MonsterEntity | null {
  let best: MonsterEntity | null = null;
  let bestDistSq = Infinity;
  for (const m of world.monsterEntitiesInNode(nodeId)) {
    if (m.hasHealth.hp <= 0) continue;
    const ph = posHitboxFromEntity(m);
    if (!pointInHitbox(point, ph)) continue;
    const distSq = distanceSq(point, m.hasPosition.current);
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      best = m;
    }
  }
  return best;
}

export function clearSummonerCommand(world: World, owner: PlayerEntity): void {
  detachComponent(world, owner, 'hasSummonerCommand');
}

export function applySummonerCommand(world: World, owner: PlayerEntity, pos: Vec2): void {
  if (!owner.summonsMinions) return;
  if (owner.usesSkills.combatArchetype !== 'summoner') return;

  const rounded: Vec2 = { x: Math.round(pos.x), y: Math.round(pos.y) };
  const monster = findMonsterAtPoint(world, owner.hasPosition.nodeId, rounded);

  if (monster) {
    attachComponent(world, owner, 'hasSummonerCommand', {
      kind:      'focus',
      monsterId: monster.isMonster.id,
      pos:       rounded,
    });
    return;
  }

  attachComponent(world, owner, 'hasSummonerCommand', {
    kind:      'move',
    monsterId: null,
    pos:       rounded,
  });
}

export function applySummonerRecall(world: World, owner: PlayerEntity, now: number): void {
  if (!owner.summonsMinions) return;
  if (owner.usesSkills.combatArchetype !== 'summoner') return;
  attachComponent(world, owner, 'hasSummonerCommand', {
    kind:       'recall',
    monsterId:  null,
    pos:        { ...owner.hasPosition.current },
    issuedAtMs: now,
  });
  world.pushEvent(owner.hasPosition.nodeId, { kind: 'summons-recalled', playerId: owner.isPlayer.id });
}

/** Live focus target from an active command, or null if none / invalid. */
export function resolveCommandedFocusTarget(
  world: World,
  owner: PlayerEntity,
): MonsterEntity | null {
  const cmd = owner.hasSummonerCommand;
  if (!cmd || cmd.kind !== 'focus' || !cmd.monsterId) return null;
  const monster = world.getMonsterEntity(cmd.monsterId);
  if (!monster) return null;
  if (monster.hasHealth.hp <= 0) return null;
  if (monster.hasPosition.nodeId !== owner.hasPosition.nodeId) return null;
  return monster;
}

/** Leash-clamped move destination from an active move command. */
export function resolveCommandedMoveDestination(
  owner: PlayerEntity,
  leashRadius: number,
): Vec2 | null {
  const cmd = owner.hasSummonerCommand;
  if (!cmd || cmd.kind !== 'move') return null;
  return clampToLeash(owner, cmd.pos, leashRadius);
}

export function validateSummonerCommand(world: World, owner: PlayerEntity, now: number): void {
  const cmd = owner.hasSummonerCommand;
  if (!cmd) return;

  if (cmd.kind === 'recall') {
    if (now - (cmd.issuedAtMs ?? now) >= RECALL_HOLD_MS) {
      clearSummonerCommand(world, owner);
    }
    return;
  }

  if (cmd.kind === 'focus') {
    if (!resolveCommandedFocusTarget(world, owner)) {
      clearSummonerCommand(world, owner);
    }
    return;
  }

  const summons = owner.summonsMinions;
  if (!summons) return;

  const leashRadius = computeLeashRadius(owner);
  const desired = clampToLeash(owner, cmd.pos, leashRadius);
  for (const id of summons.minionIds) {
    if (!id) continue;
    const minion = world.getMinionEntity(id);
    if (!minion || minion.hasHealth.hp <= 0) continue;
    if (distanceSq(minion.hasPosition.current, desired) > ARRIVE_TOL_SQ) {
      return;
    }
  }
  clearSummonerCommand(world, owner);
}

/** Where a recalled summon heads: its follow offset around the owner's live position. */
export function recallSpot(owner: PlayerEntity, minion: MinionEntity): Vec2 {
  const off = getFollowOffset(minion.isMinion.slot, owner.summonsMinions?.targetCount ?? 1);
  return { x: owner.hasPosition.current.x + off.x, y: owner.hasPosition.current.y + off.y };
}
