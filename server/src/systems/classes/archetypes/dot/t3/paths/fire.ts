import {
  applyStatusEffect, getStatusEffect, getTotalStacks, hasStatusEffect,
} from '@mmo-idle/shared';
import { attachMarker } from '../../../../../../ecs/markerHelpers';
import { DOT_EFFECT_ID, SMOLDER_EFFECT, CONF_EFFECT_ID } from '../core/constants';
import { hasPassive, markMonsterDot, clearMonsterDot } from '../core/helpers';
import type { DotT3PathContext } from './_types';
import {
  FTF_STACKS_PER_HIT, FTF_DMG_MULT, FTF_BONUS_MULT,
  CONF_TICK_MS, CONF_DMG_FACTOR,
} from './_constants';
import { CONF_TICKS } from '../core/constants';

/**
 * Fan the Flames (Balanced).
 * Applies 2 stacks/hit at 50% damage. Hitting at max stacks deals a
 * bonus = maxStacks × basePerStack × 3 instead of refreshing.
 */
export function tryFanTheFlames(pc: DotT3PathContext): boolean {
  if (!hasPassive(pc.player, 'dot.fan-the-flames')) return false;
  const { ctx, world, player, monster, monsterState, maxStacks, dmgPerStack, durationMs, tickIntervalMs } = pc;

  const ftfDmg        = dmgPerStack * FTF_DMG_MULT;
  const currentStacks = getTotalStacks(monsterState, DOT_EFFECT_ID);
  if (currentStacks >= maxStacks) {
    ctx.damage += Math.floor(maxStacks * dmgPerStack * FTF_BONUS_MULT);
    console.log(`[FanTheFlames] ${player.isPlayer.id}: at max — +${Math.floor(maxStacks * dmgPerStack * FTF_BONUS_MULT)} bonus`);
  } else {
    const toApply = Math.min(FTF_STACKS_PER_HIT, maxStacks - currentStacks);
    let ftfEff = applyStatusEffect(monsterState, {
      id: DOT_EFFECT_ID, maxStacks, instanced: false,
      sourceId: player.isPlayer.id, remainingMs: durationMs, refreshable: true,
      data: { damagePerStack: ftfDmg, nextTickIn: tickIntervalMs, tickIntervalMs },
    });
    for (let i = 1; i < toApply; i++) {
      ftfEff = applyStatusEffect(monsterState, {
        id: DOT_EFFECT_ID, maxStacks, instanced: false,
        sourceId: player.isPlayer.id, remainingMs: durationMs, refreshable: true,
        data: { damagePerStack: ftfDmg, nextTickIn: tickIntervalMs, tickIntervalMs },
      });
    }
    ftfEff.data.damagePerStack = ftfDmg;
    ftfEff.data.tickIntervalMs = tickIntervalMs;
    if (ftfEff.stacks >= maxStacks) ftfEff.data.nextTickIn = tickIntervalMs;
  }
  markMonsterDot(world, monster);
  ctx.metadata['dotHandled'] = true;
  return true;
}

/**
 * Smoldering Ember (Balanced).
 * Applies a DoT stack as normal, then mirrors the current stack count into
 * the `dot-smolder` debuff. Smolder stacks add a % vulnerability that
 * `onDamageTaken` reads (via `getSmolderMult`).
 */
export function trySmolderingEmber(pc: DotT3PathContext): boolean {
  if (!hasPassive(pc.player, 'dot.smoldering-ember')) return false;
  const { ctx, world, player, monster, monsterState, maxStacks, dmgPerStack, durationMs, tickIntervalMs } = pc;

  const se = applyStatusEffect(monsterState, {
    id: DOT_EFFECT_ID, maxStacks, instanced: false,
    sourceId: player.isPlayer.id, remainingMs: durationMs, refreshable: true,
    data: { damagePerStack: dmgPerStack, nextTickIn: tickIntervalMs, tickIntervalMs },
  });
  se.data.damagePerStack = dmgPerStack;
  se.data.tickIntervalMs = tickIntervalMs;
  if (se.stacks >= maxStacks) se.data.nextTickIn = tickIntervalMs;

  const burnStacks = getTotalStacks(monsterState, DOT_EFFECT_ID);
  let smolder = getStatusEffect(monsterState, SMOLDER_EFFECT);
  if (!smolder) {
    smolder = applyStatusEffect(monsterState, {
      id: SMOLDER_EFFECT, maxStacks: 0, instanced: false,
      remainingMs: durationMs, sourceId: player.isPlayer.id, data: {},
    });
  }
  smolder.stacks = burnStacks;
  smolder.remainingMs = durationMs; // refresh alongside the dot
  attachMarker(world, monster, 'hasSmolder');
  markMonsterDot(world, monster);
  ctx.metadata['dotHandled'] = true;
  return true;
}

/**
 * Conflagration (Balanced).
 * Suppresses normal stacking while `dot-conf` is active. Hitting at max DoT
 * stacks consumes all and starts a 5-tick fast burn that bypasses the
 * normal DoT updater.
 */
export function tryConflagration(pc: DotT3PathContext): boolean {
  if (!hasPassive(pc.player, 'dot.conflagration')) return false;
  const { ctx, world, player, monster, monsterState, maxStacks, dmgPerStack, durationMs, tickIntervalMs } = pc;

  if (hasStatusEffect(monsterState, CONF_EFFECT_ID)) {
    ctx.metadata['dotHandled'] = true;
    return true;
  }
  const currentStacks = getTotalStacks(monsterState, DOT_EFFECT_ID);
  if (currentStacks >= maxStacks) {
    clearMonsterDot(world, monster, monsterState);
    const confDmg = Math.round(maxStacks * dmgPerStack * CONF_DMG_FACTOR);
    applyStatusEffect(monsterState, {
      id: CONF_EFFECT_ID, instanced: false, maxStacks: 1,
      remainingMs: CONF_TICKS * CONF_TICK_MS + 1,
      sourceId: player.isPlayer.id,
      data: {
        damagePerTick:  confDmg,
        nextTickIn:     CONF_TICK_MS,
        tickIntervalMs: CONF_TICK_MS,
        ticksLeft:      CONF_TICKS,
      },
    });
    attachMarker(world, monster, 'hasConflagration');
    console.log(`[Conflagration] ${player.isPlayer.id}: triggered — ${confDmg}/tick × ${CONF_TICKS}`);
  } else {
    const cf = applyStatusEffect(monsterState, {
      id: DOT_EFFECT_ID, maxStacks, instanced: false,
      sourceId: player.isPlayer.id, remainingMs: durationMs, refreshable: true,
      data: { damagePerStack: dmgPerStack, nextTickIn: tickIntervalMs, tickIntervalMs },
    });
    cf.data.damagePerStack = dmgPerStack;
    cf.data.tickIntervalMs = tickIntervalMs;
    if (cf.stacks >= maxStacks) cf.data.nextTickIn = tickIntervalMs;
    markMonsterDot(world, monster);
  }
  ctx.metadata['dotHandled'] = true;
  return true;
}
