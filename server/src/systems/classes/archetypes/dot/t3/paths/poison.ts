import { applyStatusEffect, getTotalStacks } from '@mmo-idle/shared';
import { DOT_EFFECT_ID } from '../core/constants';
import { hasPassive, markMonsterDot, clearMonsterDot } from '../core/helpers';
import type { DotT3PathContext } from './_types';
import {
  PE_MAX_STACKS, PE_BURST_TICKS,
  ED_MAX_STACKS, ED_BASE_STACKS, ED_DIMINISH_RATE,
  IT_ATK_PER_STACK,
} from './_constants';

/**
 * Invigorating Toxins (Light).
 * Adds a flat damage bonus per existing DoT stack on the target. Falls
 * through — does NOT set `dotHandled`, so the base prototype still applies
 * a stack after this runs.
 */
export function applyInvigoratingToxins(pc: DotT3PathContext): void {
  if (!hasPassive(pc.player, 'dot.invigorating-toxins')) return;
  const stacks = getTotalStacks(pc.monsterState, DOT_EFFECT_ID);
  if (stacks > 0) pc.ctx.damage += stacks * IT_ATK_PER_STACK;
}

/**
 * Poison Explosion (Light).
 * 20-stack cap; on hit at max, all stacks are consumed for a 10-tick burst.
 */
export function tryPoisonExplosion(pc: DotT3PathContext): boolean {
  if (!hasPassive(pc.player, 'dot.poison-explosion')) return false;
  const { ctx, world, player, monster, monsterState, dmgPerStack, durationMs, tickIntervalMs } = pc;
  const passives = player.usesSkills.passives;
  const maxStacks = Math.max(1, Math.round(passives['dot.poison-explosion-max-stacks'] ?? PE_MAX_STACKS));
  const burstTicks = Math.max(0, passives['dot.poison-explosion-burst-ticks'] ?? PE_BURST_TICKS);

  const pe = applyStatusEffect(monsterState, {
    id: DOT_EFFECT_ID, maxStacks, instanced: false,
    sourceId: player.isPlayer.id, remainingMs: durationMs, refreshable: true,
    data: { damagePerStack: dmgPerStack, nextTickIn: tickIntervalMs, tickIntervalMs, tickOnExpire: 1 },
  });
  pe.data.damagePerStack = dmgPerStack;
  pe.data.tickIntervalMs = tickIntervalMs;
  pe.data.tickOnExpire = 1;
  if (getTotalStacks(monsterState, DOT_EFFECT_ID) >= maxStacks) {
    const burst = maxStacks * dmgPerStack * burstTicks;
    ctx.damage += burst;
    clearMonsterDot(world, monster, monsterState);
    // Real empowered detonation: crit styling + the standard empowered AoE splash.
    ctx.metadata['empoweredAttack'] = true;
    const existing = ctx.metadata['clientEffects'];
    ctx.metadata['clientEffects'] = Array.isArray(existing)
      ? [...existing, 'poison-explosion']
      : ['poison-explosion'];
    console.log(`[PoisonExplosion] ${player.isPlayer.id}: detonated → +${burst} burst`);
  } else {
    markMonsterDot(world, monster);
  }
  ctx.metadata['dotHandled'] = true;
  return true;
}

/**
 * Eternal Doom (Light).
 * No cap (50-stack ceiling for safety). Ticks use the diminishing-returns
 * formula (`computeEternalDoomDamage`) in the prototype updater.
 */
export function tryEternalDoom(pc: DotT3PathContext): boolean {
  if (!hasPassive(pc.player, 'dot.eternal-doom')) return false;
  const { ctx, world, player, monster, monsterState, dmgPerStack, durationMs, tickIntervalMs } = pc;
  const passives = player.usesSkills.passives;
  const maxStacks = Math.max(1, Math.round(passives['dot.eternal-doom-max-stacks'] ?? ED_MAX_STACKS));
  const fullStacks = Math.max(0, Math.round(passives['dot.eternal-doom-full-stacks'] ?? ED_BASE_STACKS));
  const diminishRate = Math.max(0, passives['dot.eternal-doom-diminish-rate'] ?? ED_DIMINISH_RATE);

  const ed = applyStatusEffect(monsterState, {
    id: DOT_EFFECT_ID, maxStacks, instanced: false,
    sourceId: player.isPlayer.id, remainingMs: durationMs, refreshable: true,
    data: {
      damagePerStack: dmgPerStack, nextTickIn: tickIntervalMs, tickIntervalMs, tickOnExpire: 1,
      isEternalDoom: 1, edFullStacks: fullStacks, edDiminishRate: diminishRate,
    },
  });
  ed.data.damagePerStack = dmgPerStack;
  ed.data.tickIntervalMs = tickIntervalMs;
  ed.data.tickOnExpire = 1;
  markMonsterDot(world, monster);
  ctx.metadata['dotHandled'] = true;
  return true;
}
