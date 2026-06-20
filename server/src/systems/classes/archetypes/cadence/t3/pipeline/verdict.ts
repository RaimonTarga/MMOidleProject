import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import {
  buildSimpleBreakdown,
  recordMonsterDamagedByPlayer,
} from '../../../../../../world/worldLogCombat';
import { actorFromPlayer } from '../../../../../../world/worldLogActors';
import { VERDICT_BANK_PCT } from '../core/constants';

/**
 * Verdict (cadence-balanced-t3-c): each finisher banks a fraction of its damage
 * into a character-side execution pool. Whenever the finisher's target survives
 * but its remaining HP is within the banked pool, the Verdict executes it
 * instantly and the pool is spent.
 *
 * Runs in afterHit so the finisher's final damage (for banking) and the target's
 * post-hit HP (for the execute check) are both known. The execute just zeroes HP
 * and lets combat.ts's own post-hit kill check grant rewards exactly once.
 */
export function registerCadenceVerdict(): void {
  registerCombatListener('afterHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;
    if (!ctx.metadata['empoweredAttack']) return;        // finishers only

    const player = ctx.attacker;
    if (!player.usesCadence) return;
    if ((player.usesSkills.passives['cadence.detonation'] ?? 0) <= 0) return;

    const cadence = player.usesCadence;
    const target = ctx.defender;

    // Bank a fraction of this finisher's damage into the pool (persists across
    // targets). Banking happens even if the finisher itself killed the target.
    const bankPct = player.usesSkills.passives['cadence.verdict-bank-pct'] ?? VERDICT_BANK_PCT;
    cadence.verdictStored += Math.round(ctx.damage * bankPct);

    // Execute: target survived the finisher but is within the banked pool.
    if (target.hasHealth.hp > 0 && target.hasHealth.hp <= cadence.verdictStored) {
      const lethal = target.hasHealth.hp;
      target.hasHealth.hp = 0;
      recordMonsterDamagedByPlayer(
        world,
        player.isPlayer.id,
        actorFromPlayer(player),
        target,
        lethal,
        'proc',
        buildSimpleBreakdown(lethal, lethal),
        ['verdict-execute'],
      );
      world.pushEvent(player.hasPosition.nodeId, {
        kind: 'player-hit',
        playerId: player.isPlayer.id,
        targetId: target.isMonster.id,
        targetName: target.isMonster.name,
        damage: lethal,
        empowered: true,
        execution: true,
        playerPos: { ...player.hasPosition.current },
        targetPos: { ...target.hasPosition.current },
      });
      cadence.verdictStored = 0;
    }
  });
}
