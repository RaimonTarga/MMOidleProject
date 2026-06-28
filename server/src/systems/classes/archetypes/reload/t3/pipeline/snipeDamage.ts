import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { DEFAULT_SNIPE_FULL_HP_MULT, FULL_HP_THRESHOLD } from '../core/constants';

/**
 * Snipe onHit: bonus damage against full-health targets. The attack-speed→damage
 * conversion and the hard-set cadence are handled in recalculatePlayerStats (the
 * attack-speed STAT is converted there, weapon APS ignored).
 */
export function registerSnipeDamage(): void {
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;

    const player = ctx.attacker;
    const monster = ctx.defender;
    if ((player.usesSkills.passives['reload.snipe'] ?? 0) <= 0) return;

    const fullHpThreshold = player.usesSkills.passives['reload.snipe-fullhp-threshold'] ?? FULL_HP_THRESHOLD;
    if (monster.hasHealth.hp >= monster.hasHealth.maxHp * fullHpThreshold) {
      const fullHpMult = player.usesSkills.passives['reload.snipe-fullhp-mult'] ?? DEFAULT_SNIPE_FULL_HP_MULT;
      ctx.damage = Math.max(1, Math.round(ctx.damage * fullHpMult));
      ctx.metadata['reloadSnipeFullHp'] = true;
      // Tag the full-HP shot as empowered for the aesthetic only — yellow "!" crit
      // styling + empowered ring. (Set after the mult so it's only the bonus shot.)
      ctx.metadata['empoweredAttack'] = true;
    }
  });
}
