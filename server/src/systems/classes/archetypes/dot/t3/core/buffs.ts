import { defineBuff, type BuffDescriptor } from '../../../../../combat/buffs/descriptor';
import {
  getTargetChillStacks,
  isTargetFrozen,
  getTargetFrozenRemainingPct,
  getConflagrationRemainingPct,
  isConflagrationActive,
} from './selectors';
import { getStatusEffect } from '@mmo-idle/shared';
import { FREEZE_BONUS } from './constants';
import {
  CHILL_ATK_MULT, CHILL_SPEED_MULT, IT_ATK_PER_STACK, IT_SPEED_CAP, IT_SPEED_PER_STACK,
  FRENZY_FX, FRENZY_DURATION_MS, FRENZY_APS, FRENZY_ONHIT_PER_TIER, FRENZY_UNLOCK_TIER,
} from '../paths/_constants';

export const DOT_T3_BUFFS = [
  defineBuff('dot-frenzy', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'dot') return null;
    if ((player.usesSkills.passives['dot.frenzy'] ?? 0) <= 0) return null;
    const fx = getStatusEffect(player.tracksCombat, FRENZY_FX);
    if (!fx || fx.remainingMs <= 0) return null;
    const total = fx.data['totalMs'] ?? FRENZY_DURATION_MS;
    const pct = total > 0 ? Math.round((fx.remainingMs / total) * 100) : 0;
    const tierMult = Math.max(1, (player.tracksProgression?.playerTier ?? FRENZY_UNLOCK_TIER) - FRENZY_UNLOCK_TIER + 1);
    return {
      id: 'dot-frenzy', label: 'Frenzy', stacks: 1, durationPct: pct, color: '#ff3355',
      logDetail: `+${Math.round(FRENZY_APS * 100)}% attack speed, +${FRENZY_ONHIT_PER_TIER * tierMult} on-hit damage`,
    };
  }, { category: 'dot-poison', shape: 'square' }),
  defineBuff('dot-vigor', ({ player, targetCs }) => {
    if (player.usesSkills.combatArchetype !== 'dot') return null;
    if ((player.usesSkills.passives['dot.invigorating-toxins'] ?? 0) <= 0) return null;
    if (!targetCs) return null;
    const stacks = player.appliesDots?.targetDotStacks ?? 0;
    const atkBonus = stacks * IT_ATK_PER_STACK;
    const speedBonus = Math.round(Math.min(IT_SPEED_CAP, stacks * IT_SPEED_PER_STACK) * 100);
    return stacks > 0
      ? {
          id: 'dot-vigor',
          label: 'Vigor',
          stacks,
          durationPct: -1,
          color: '#88ff44',
          logDetail: `+${atkBonus} damage, +${speedBonus}% attack speed`,
        }
      : null;
  }, { category: 'dot-poison', shape: 'circle' }),
  defineBuff('dot-conflag', ({ player, target, targetCs }) => {
    if (player.usesSkills.combatArchetype !== 'dot') return null;
    if ((player.usesSkills.passives['dot.conflagration'] ?? 0) <= 0) return null;
    if (!targetCs) return null;
    return isConflagrationActive(targetCs)
      ? {
          id: 'dot-conflag',
          label: 'Cflag',
          stacks: 1,
          durationPct: getConflagrationRemainingPct(targetCs),
          color: '#ff6600',
          logSourceName: 'DoT',
          logDetail: 'burn ticks every 500ms',
          logTargetId: target?.isMonster.id,
          logTargetName: target?.isMonster.name,
          logTargetType: target ? 'monster' : undefined,
        }
      : null;
  }, { category: 'dot-fire', shape: 'diamond' }),
  defineBuff('dot-chill', ({ player, target, targetCs }) => {
    if (player.usesSkills.combatArchetype !== 'dot') return null;
    if ((player.usesSkills.passives['dot.freezing-cold'] ?? 0) <= 0) return null;
    if (!targetCs) return null;
    const stacks = getTargetChillStacks(targetCs);
    const speedReductionPct = Math.round(stacks * CHILL_SPEED_MULT * 100);
    const attackSlowPct = Math.round(stacks * CHILL_ATK_MULT * 100);
    return stacks > 0
      ? {
          id: 'dot-chill',
          label: 'Chll',
          stacks,
          durationPct: -1,
          color: '#88ddff',
          logSourceName: 'DoT',
          logDetail: `-${speedReductionPct}% move speed, +${attackSlowPct}% attack cooldown`,
          logTargetId: target?.isMonster.id,
          logTargetName: target?.isMonster.name,
          logTargetType: target ? 'monster' : undefined,
        }
      : null;
  }, { category: 'dot-frost', shape: 'square' }),
  defineBuff('dot-frozen', ({ player, target, targetCs }) => {
    if (player.usesSkills.combatArchetype !== 'dot') return null;
    if ((player.usesSkills.passives['dot.freezing-cold'] ?? 0) <= 0) return null;
    if (!targetCs) return null;
    return isTargetFrozen(targetCs)
      ? {
          id: 'dot-frozen',
          label: 'Frzn',
          stacks: 1,
          durationPct: getTargetFrozenRemainingPct(targetCs),
          color: '#ffffff',
          logSourceName: 'DoT',
          logDetail: `+${Math.round(FREEZE_BONUS * 100)}% damage taken`,
          logTargetId: target?.isMonster.id,
          logTargetName: target?.isMonster.name,
          logTargetType: target ? 'monster' : undefined,
        }
      : null;
  }, { category: 'dot-frozen', shape: 'small-square' }),
] as const satisfies readonly BuffDescriptor[];
