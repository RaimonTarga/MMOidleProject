import { resolveOnHitDamage, laserOnHitDamage } from '@mmo-idle/shared';
import type { CombatContext } from './combatPipeline';

/** All designated on-hit sources converge here after the onHit listeners. */
export function playerOnHitDamage(ctx: CombatContext): number {
  if (ctx.attackerType !== 'player') return 0;
  const number = (key: string, fallback = 0): number =>
    typeof ctx.metadata[key] === 'number' ? ctx.metadata[key] as number : fallback;
  const base = (ctx.attacker.dealsDamage.onHitDamage + number('imbueOnHitBonus') + number('onHitDamageBonus'))
    * number('onHitDamageMult', 1) + number('onHitDamageBonusAfterShot');
  return resolveOnHitDamage(
    ctx.metadata['reloadLaser'] ? laserOnHitDamage(base) : base,
    ctx.attacker.usesSkills.passives,
    1,
    ctx.formation?.onHitMagnitudeWeight ?? 1,
  );
}
