import { applyStatusEffect } from '@mmo-idle/shared';
import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { applyPlayerDebuff } from '../../../../shared/applyPlayerDebuff';
import { evadeBlocksDebuffs } from '../../../../../defense/mitigation/evasion';
import {
  DEATH_MARK_EFFECT_ID,
  DEFAULT_DEATH_MARK_DURATION_MS,
  DEFAULT_DEATH_MARK_MAX,
  DEFAULT_SUPPRESS_MAX,
  DEFAULT_SUPPRESS_SHRED,
  SUPPRESS_SHRED_EFFECT_ID,
} from '../core/constants';

function usesStandardMagazine(passives: Record<string, number | undefined>): boolean {
  if ((passives['reload.laser'] ?? 0) > 0) return false;
  if ((passives['reload.snipe'] ?? 0) > 0) return false;
  if ((passives['reload.gatling'] ?? 0) > 0) return false;
  return true;
}

export function registerReloadBalancedT3(): void {
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;
    if (evadeBlocksDebuffs(ctx)) return;

    const player = ctx.attacker;
    if (!player.usesReload) return;

    const passives = player.usesSkills.passives;
    if (!usesStandardMagazine(passives)) return;

    const monsterState = ctx.defender.tracksCombat;
    const sourceId = player.isPlayer.id;

    if ((passives['reload.death-mark'] ?? 0) > 0) {
      applyStatusEffect(monsterState, {
        id: DEATH_MARK_EFFECT_ID,
        maxStacks: Math.max(1, Math.round(passives['reload.death-mark-max'] ?? DEFAULT_DEATH_MARK_MAX)),
        refreshable: true,
        remainingMs: DEFAULT_DEATH_MARK_DURATION_MS,
        sourceId,
        data: {},
      });
    }

    if ((passives['reload.suppressing-fire'] ?? 0) > 0) {
      const shred =
        passives['reload.suppress-shred'] ?? DEFAULT_SUPPRESS_SHRED;
      applyPlayerDebuff(player, monsterState, {
        id: SUPPRESS_SHRED_EFFECT_ID,
        maxStacks: Math.round(
          passives['reload.suppress-max-stacks'] ?? DEFAULT_SUPPRESS_MAX,
        ),
        refreshable: false,
        remainingMs: -1,
        sourceId,
        data: { platingReduction: shred },
      });
    }
  });
}
