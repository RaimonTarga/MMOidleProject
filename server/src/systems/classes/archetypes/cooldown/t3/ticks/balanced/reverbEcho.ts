import { removeStatusEffect } from '@mmo-idle/shared';
import type { World } from '../../../../../../../world/World';
import type { MonsterEntity, PlayerEntity } from '../../../../../../../ecs/entity';
import { runPlayerAttack } from '../../../../../../combat/engine/combat';
import { HOLD_EMPOWERED_ATTACK } from '../../../../../../combat/engine/empoweredAttacks';
import { isInvulnerableMonster } from '../../../../../../combat/invulnerability';
import { hasPassive } from '../../core/helpers';
import { reverbEchoDueAtMs, reverbEchoPending } from '../../core/selectors';
import { REVERB_ECHO_FX } from '../../core/constants';
import { REVERB_ECHO_HIT } from '../../pipeline/reverbEcho';

/**
 * Reverb's echo tick (design §22.5). When the recharge reaches the halfway mark,
 * the pending echo lands on whatever the player is hitting THEN — the attack
 * target the combat loop holds, if it is still alive, on this node and in reach.
 * With nothing in reach the echo is LOST, not held: it is a beat on the clock,
 * and a beat that finds no one is a beat that missed.
 *
 * The echo is a real attack (`runPlayerAttack`), so it pays plating and DR, rolls
 * the target's dodge, procs on-hit gear and feeds kills and rewards like any
 * swing; `registerReverbEcho` gives it its multiplier on the way through. It does
 * not touch `lastAttackAt` — it is the execution's beat, not one of the player's
 * swings.
 */
export function updateReverbEcho(world: World, now: number): void {
  for (const player of world.cooldownPlayers) {
    if (!reverbEchoPending(player)) continue;
    // The path was reset away while an echo was due: nothing left to echo.
    if (!hasPassive(player, 'cooldown.reverb')) {
      removeStatusEffect(player.tracksCombat, REVERB_ECHO_FX);
      continue;
    }
    if (player.usesCooldown.executionCooldownMs > reverbEchoDueAtMs(player)) continue;

    // Due now: spent whether or not it finds a body.
    removeStatusEffect(player.tracksCombat, REVERB_ECHO_FX);
    const target = echoTarget(world, player);
    if (!target) continue;

    runPlayerAttack(world, player, target, now, {
      attackOrigin: player.hasPosition.current,
      aggroSource: { id: player.isPlayer.id, kind: 'player' },
      // The hold keeps an execution that is already waiting (a Refund kill can
      // ready it on the same beat) exactly where it is: the echo never spends it.
      metadata: { [REVERB_ECHO_HIT]: true, [HOLD_EMPOWERED_ATTACK]: true },
    });
  }
}

/** What the player is hitting at the halfway mark, if it is still in reach. */
function echoTarget(world: World, player: PlayerEntity): MonsterEntity | undefined {
  if (player.cannotAttack) return undefined;
  const targetId = player.hasAttackTarget?.targetId;
  if (!targetId) return undefined;
  const target = world.getMonsterEntity(targetId);
  if (!target || target.hasHealth.hp <= 0) return undefined;
  if (target.hasPosition.nodeId !== player.hasPosition.nodeId) return undefined;
  if (isInvulnerableMonster(target)) return undefined;
  if (!world.collision.canReach(player, target, player.performsAttack.attackRange)) return undefined;
  return target;
}
