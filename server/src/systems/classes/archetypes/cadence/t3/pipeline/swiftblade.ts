import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import {
  buildSimpleBreakdown,
  recordMonsterDamagedByPlayer,
} from '../../../../../../world/worldLogCombat';
import { actorFromPlayer } from '../../../../../../world/worldLogActors';
import { SWIFTBLADE_EFFECT } from '../core/constants';

/**
 * Swiftblade (cadence-light-t3-c): the finisher strikes `trigger-count` times.
 *
 * The primary hit is dealt by the normal pipeline (its damage is finalized by the
 * time `afterHit` runs). Here we deal each EXTRA strike as its own damage instance
 * — separate damage number, own dual-slash FX — equal to that finalized per-hit
 * damage scaled by `cadence.extra-trigger-damage-mult`. We deliberately do NOT
 * use applyPlayerProcDamage's kill handling: we
 * just subtract HP and let combat.ts's own post-hit kill check resolve the death
 * exactly once (so rewards aren't double-granted).
 */
export function registerCadenceSwiftblade(): void {
  registerCombatListener('afterHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;
    if (!ctx.metadata['empoweredAttack']) return;        // finisher hits only

    const player = ctx.attacker;
    if (!player.usesCadence) return;

    const triggerCount = Math.max(
      1,
      Math.round(player.usesSkills.passives['cadence.trigger-count'] ?? 1),
    );
    if (triggerCount <= 1) return;

    const target = ctx.defender;
    const extraStrikeMult = Math.max(
      0,
      player.usesSkills.passives['cadence.extra-trigger-damage-mult'] ?? 1,
    );
    const perStrike = Math.max(0, Math.round(ctx.damage * extraStrikeMult));
    // Nothing to add if the finisher already killed the target, or it dealt no
    // direct damage (e.g. Hemorrhage converted it to a bleed).
    if (perStrike <= 0 || target.hasHealth.hp <= 0) return;

    const source = actorFromPlayer(player);
    const nodeId = player.hasPosition.nodeId;

    for (let i = 1; i < triggerCount; i++) {
      // A previous strike was lethal — stop and let combat.ts handle the kill.
      if (target.hasHealth.hp <= 0) break;

      target.hasHealth.hp -= perStrike;
      recordMonsterDamagedByPlayer(
        world,
        player.isPlayer.id,
        source,
        target,
        perStrike,
        'direct',
        buildSimpleBreakdown(perStrike, perStrike),
        ['swiftblade'],
      );
      world.pushEvent(nodeId, {
        kind: 'player-hit',
        playerId: player.isPlayer.id,
        targetId: target.isMonster.id,
        targetName: target.isMonster.name,
        damage: perStrike,
        empowered: true,
        execution: false,
        effects: [SWIFTBLADE_EFFECT],
        playerPos: { ...player.hasPosition.current },
        targetPos: { ...target.hasPosition.current },
      });
    }
  });
}
