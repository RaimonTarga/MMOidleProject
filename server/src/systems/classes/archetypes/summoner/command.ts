/**
 * Recall (hotkey): minions drop their targets and return to their follow offsets
 * around the owner's LIVE position, so the owner can step out of a telegraph and
 * the formation comes along. Holds for `RECALL_HOLD_MS` even after arrival: in a
 * melee brawl the summons are already home, and releasing on arrival sent them
 * straight back into the fight within a tick or two. A summon that is home
 * strikes back at anything already in its reach, but never chases.
 *
 * Focus and move are gone (CD.8). Orders choose targets; Recall is the only command.
 */
import {
  getFlag,
  type Vec2,
} from '@mmo-idle/shared';
import type { World } from '../../../../world/World';
import type { MinionEntity, PlayerEntity } from '../../../../ecs/entity';
import { attachComponent, detachComponent } from '../../../../ecs/markerHelpers';
import { getFollowOffset } from './spawn';
import { RUNE_RECALL_SUMMONS_FLAG } from '../../../combat/ai/runeConfig';
import { FORMATION_RECALL_FLAG } from './formationOrders';
/** Covers a full T1 slam wind-up (Ground Slam casts for 1.8 s) pressed as it starts. */
export const RECALL_HOLD_MS = 2_000;
/** Recalled summons sprint home, so the recall outruns melee that follows them. */
export const RECALL_SPEED_MULT = 2;

export interface HasSummonerCommand {
  kind: 'recall';
  monsterId: string | null;
  pos: Vec2;
  /** When it was issued, for the `RECALL_HOLD_MS` window. */
  issuedAtMs?: number;
}

/** Recall pulls the formation off the fight. */
export function isSummonerRepositioning(owner: PlayerEntity): boolean {
  return isSummonerRecalling(owner);
}

/** The R recall, or a Recall Summons rune whose situation holds (owner on auto). */
export function isSummonerRecalling(owner: PlayerEntity): boolean {
  return owner.hasSummonerCommand?.kind === 'recall'
    || getFlag(owner.tracksCombat, FORMATION_RECALL_FLAG)
    || (owner.usesAutocombat.auto && getFlag(owner.tracksCombat, RUNE_RECALL_SUMMONS_FLAG));
}

export function clearSummonerCommand(world: World, owner: PlayerEntity): void {
  detachComponent(world, owner, 'hasSummonerCommand');
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

export function validateSummonerCommand(world: World, owner: PlayerEntity, now: number): void {
  const cmd = owner.hasSummonerCommand;
  if (!cmd) return;
  if (now - (cmd.issuedAtMs ?? now) >= RECALL_HOLD_MS) {
    clearSummonerCommand(world, owner);
  }
}

/** Where a recalled summon heads: its follow offset around the owner's live position. */
export function recallSpot(owner: PlayerEntity, minion: MinionEntity): Vec2 {
  const off = getFollowOffset(minion.isMinion.slot, owner.summonsMinions?.targetCount ?? 1);
  return { x: owner.hasPosition.current.x + off.x, y: owner.hasPosition.current.y + off.y };
}
