/**
 * The T4 supports' abilities that run on a timer and take a strength, so Choir can echo them and
 * Final Command can fire them double (T4-CONDUIT; bible §7.16): Icewarden's ice shell and the
 * Mirage's decoy. Kept apart from `summonPiecesT4.ts` so the T3 echo can call them without a cycle.
 */
import { applyStatusEffect, getStatusEffect, type ConduitPiece } from '@mmo-idle/shared';
import type { MinionEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { applyTaunt } from '../../../combat/ai/targeting';
import { playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { jobMult, livingMinions } from './summonPiecesT2';
import { ICE_SHELL_EFFECT_ID } from './t4Shared';

/** Icewarden: wrap the most hurt summon that has no shell in ice that absorbs damage. */
export function shellAbility(world: World, owner: PlayerEntity, source: MinionEntity, piece: ConduitPiece, strength: number): void {
  let pick: MinionEntity | undefined;
  let worst = Infinity;
  for (const candidate of livingMinions(world, owner)) {
    if (getStatusEffect(candidate.tracksCombat, ICE_SHELL_EFFECT_ID)) continue;
    const fraction = candidate.hasHealth.hp / candidate.hasHealth.maxHp;
    if (fraction < worst) { worst = fraction; pick = candidate; }
  }
  const ms = piece.params.shellMs ?? 0;
  const shield = (piece.params.shellPct ?? 0) * jobMult(owner, piece) * strength;
  if (!pick || shield <= 0 || ms <= 0) return;
  applyStatusEffect(pick.tracksCombat, {
    id: ICE_SHELL_EFFECT_ID, maxStacks: 1, remainingMs: ms, refreshable: true, sourceId: source.isMinion.id,
    data: { shield: Math.round(pick.hasHealth.maxHp * shield), totalMs: ms },
  });
}

/**
 * Mirage: a copy of you draws the enemies that are after you for a few seconds. The copy is not an
 * entity yet (no temporary summon exists): the Mirage's own body stands in as the decoy, so the
 * enemies near it that are fighting you turn on it. Enemies that ignore taunts do not chase it.
 */
export function mirageAbility(world: World, owner: PlayerEntity, source: MinionEntity, piece: ConduitPiece, strength: number, now: number): void {
  const ms = (piece.params.mirageMs ?? 0) * strength;
  if (ms <= 0) return;
  for (const monster of playerAoeTargets(world, owner, source.hasPosition.current, (piece.params.mirageRadius ?? 0) * jobMult(owner, piece))) {
    const aggro = monster.hasAggroTarget;
    if (monster.hasHealth.hp <= 0 || aggro?.targetKind !== 'player' || aggro.targetId !== owner.isPlayer.id) continue;
    applyTaunt(world, monster, { id: source.isMinion.id, kind: 'minion' }, ms, now);
  }
}
