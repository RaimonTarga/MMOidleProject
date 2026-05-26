import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import {
  DEFAULT_SNIPE_BASELINE_CD_MS,
  DEFAULT_SNIPE_FULL_HP_MULT,
  FULL_HP_THRESHOLD,
} from '../core/constants';

export function registerSnipeDamage(): void {
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;

    const player = ctx.attacker;
    const monster = ctx.defender;
    if ((player.usesSkills.passives['reload.snipe'] ?? 0) <= 0) return;

    const baselineCdMs = player.usesSkills.passives['reload.snipe-baseline-cd-ms'] ?? DEFAULT_SNIPE_BASELINE_CD_MS;
    const attackSpeedDamageMult = baselineCdMs / Math.max(1, player.performsAttack.attackCooldown);
    ctx.damage = Math.max(1, Math.round(ctx.damage * attackSpeedDamageMult));

    if (monster.hasHealth.hp >= monster.hasHealth.maxHp * FULL_HP_THRESHOLD) {
      const fullHpMult = player.usesSkills.passives['reload.snipe-fullhp-mult'] ?? DEFAULT_SNIPE_FULL_HP_MULT;
      ctx.damage = Math.max(1, Math.round(ctx.damage * fullHpMult));
      ctx.metadata['reloadSnipeFullHp'] = true;
    }
  });
}
