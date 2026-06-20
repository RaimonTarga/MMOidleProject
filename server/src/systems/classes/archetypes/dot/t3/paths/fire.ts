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
  IGNITION_VALUE_MULT,
} from './_constants';
import { CONF_TICKS } from '../core/constants';

/**
 * Ignition (Balanced).
 * The first attack on a fresh (un-burned) target instantly applies ALL fire
 * stacks at a reduced per-tick value; once burning, attacks refresh normally.
 */
export function tryIgnition(pc: DotT3PathContext): boolean {
  if (!hasPassive(pc.player, 'dot.ignition')) return false;
  const { ctx, world, player, monster, monsterState, maxStacks, dmgPerStack, durationMs, tickIntervalMs, convPct } = pc;
  const ignitionValueMult = Math.max(0, player.usesSkills.passives['dot.ignition-stack-damage-mult'] ?? IGNITION_VALUE_MULT);

  const current = getTotalStacks(monsterState, DOT_EFFECT_ID);
  if (current === 0) {
    // Firebrand: front-load every stack at reduced tick value + a searing brand FX.
    const igDmg = Math.max(1, Math.round(dmgPerStack * ignitionValueMult));
    let eff = applyStatusEffect(monsterState, {
      id: DOT_EFFECT_ID, maxStacks, instanced: false,
      sourceId: player.isPlayer.id, remainingMs: durationMs, refreshable: true,
      data: { damagePerStack: igDmg, nextTickIn: tickIntervalMs, tickIntervalMs, tickOnExpire: 1 },
    });
    for (let i = 1; i < maxStacks; i++) {
      eff = applyStatusEffect(monsterState, {
        id: DOT_EFFECT_ID, maxStacks, instanced: false,
        sourceId: player.isPlayer.id, remainingMs: durationMs, refreshable: true,
        data: { damagePerStack: igDmg, nextTickIn: tickIntervalMs, tickIntervalMs, tickOnExpire: 1 },
      });
    }
    eff.data.damagePerStack = igDmg;
    eff.data.tickIntervalMs = tickIntervalMs;
    eff.data.tickOnExpire = 1;
    const existing = ctx.metadata['clientEffects'];
    ctx.metadata['clientEffects'] = Array.isArray(existing) ? [...existing, 'firebrand'] : ['firebrand'];
  } else if (current >= maxStacks) {
    // Already branded at max — this hit bypasses the DoT conversion and lands as a
    // full 100% direct attack (undo the main handler's convPct cut), and just refreshes
    // the existing burn's duration (no new stack, per-tick value unchanged).
    ctx.damage = Math.max(1, Math.round(ctx.damage / Math.max(0.01, 1 - convPct)));
    const eff = getStatusEffect(monsterState, DOT_EFFECT_ID);
    if (eff) eff.remainingMs = durationMs;
  } else {
    // Partial stacks — refresh/add a single stack at the standard value.
    const eff = applyStatusEffect(monsterState, {
      id: DOT_EFFECT_ID, maxStacks, instanced: false,
      sourceId: player.isPlayer.id, remainingMs: durationMs, refreshable: true,
      data: { damagePerStack: dmgPerStack, nextTickIn: tickIntervalMs, tickIntervalMs, tickOnExpire: 1 },
    });
    eff.data.damagePerStack = dmgPerStack;
    eff.data.tickIntervalMs = tickIntervalMs;
    eff.data.tickOnExpire = 1;
  }
  markMonsterDot(world, monster);
  ctx.metadata['dotHandled'] = true;
  return true;
}

/**
 * Fan the Flames (Balanced).
 * Applies 2 stacks/hit at 50% damage. Hitting at max stacks deals a
 * bonus = maxStacks × basePerStack × 3 instead of refreshing.
 */
export function tryFanTheFlames(pc: DotT3PathContext): boolean {
  if (!hasPassive(pc.player, 'dot.fan-the-flames')) return false;
  const { ctx, world, player, monster, monsterState, maxStacks, dmgPerStack, durationMs, tickIntervalMs } = pc;
  const passives = player.usesSkills.passives;
  const stacksPerHit = Math.max(1, Math.round(passives['dot.fan-the-flames-stacks-per-hit'] ?? FTF_STACKS_PER_HIT));
  const stackDamageMult = Math.max(0, passives['dot.fan-the-flames-stack-damage-mult'] ?? FTF_DMG_MULT);
  const maxStackBonusMult = Math.max(0, passives['dot.fan-the-flames-max-stack-bonus-mult'] ?? FTF_BONUS_MULT);

  const ftfDmg        = dmgPerStack * stackDamageMult;
  const currentStacks = getTotalStacks(monsterState, DOT_EFFECT_ID);
  if (currentStacks >= maxStacks) {
    ctx.damage += Math.floor(maxStacks * dmgPerStack * maxStackBonusMult);
    // Aesthetic-only crit on the full-stack bonus hit (yellow "!"), no AoE.
    ctx.metadata['empoweredAttack'] = true;
    ctx.metadata['suppressEmpoweredAoe'] = true;
    console.log(`[FanTheFlames] ${player.isPlayer.id}: at max — +${Math.floor(maxStacks * dmgPerStack * maxStackBonusMult)} bonus`);
  } else {
    const toApply = Math.min(stacksPerHit, maxStacks - currentStacks);
    let ftfEff = applyStatusEffect(monsterState, {
      id: DOT_EFFECT_ID, maxStacks, instanced: false,
      sourceId: player.isPlayer.id, remainingMs: durationMs, refreshable: true,
      data: { damagePerStack: ftfDmg, nextTickIn: tickIntervalMs, tickIntervalMs, tickOnExpire: 1 },
    });
    for (let i = 1; i < toApply; i++) {
      ftfEff = applyStatusEffect(monsterState, {
        id: DOT_EFFECT_ID, maxStacks, instanced: false,
        sourceId: player.isPlayer.id, remainingMs: durationMs, refreshable: true,
        data: { damagePerStack: ftfDmg, nextTickIn: tickIntervalMs, tickIntervalMs, tickOnExpire: 1 },
      });
    }
    ftfEff.data.damagePerStack = ftfDmg;
    ftfEff.data.tickIntervalMs = tickIntervalMs;
    ftfEff.data.tickOnExpire = 1;
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
    data: { damagePerStack: dmgPerStack, nextTickIn: tickIntervalMs, tickIntervalMs, tickOnExpire: 1 },
  });
  se.data.damagePerStack = dmgPerStack;
  se.data.tickIntervalMs = tickIntervalMs;
  se.data.tickOnExpire = 1;

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
  const passives = player.usesSkills.passives;
  const ticks = Math.max(1, Math.round(passives['dot.conflagration-ticks'] ?? CONF_TICKS));
  const confTickMs = Math.max(100, Math.round(passives['dot.conflagration-tick-ms'] ?? CONF_TICK_MS));
  const damageFactor = Math.max(0, passives['dot.conflagration-damage-factor'] ?? CONF_DMG_FACTOR);

  if (hasStatusEffect(monsterState, CONF_EFFECT_ID)) {
    ctx.metadata['dotHandled'] = true;
    return true;
  }
  const currentStacks = getTotalStacks(monsterState, DOT_EFFECT_ID);
  if (currentStacks >= maxStacks) {
    clearMonsterDot(world, monster, monsterState);
    const confDmg = Math.round(maxStacks * dmgPerStack * damageFactor);
    applyStatusEffect(monsterState, {
      id: CONF_EFFECT_ID, instanced: false, maxStacks: 1,
      remainingMs: ticks * confTickMs + 1,
      sourceId: player.isPlayer.id,
      data: {
        damagePerTick:  confDmg,
        nextTickIn:     confTickMs,
        tickIntervalMs: confTickMs,
        ticksLeft:      ticks,
        totalTicks:     ticks,
      },
    });
    attachMarker(world, monster, 'hasConflagration');
    console.log(`[Conflagration] ${player.isPlayer.id}: triggered — ${confDmg}/tick × ${ticks}`);
  } else {
    const cf = applyStatusEffect(monsterState, {
      id: DOT_EFFECT_ID, maxStacks, instanced: false,
      sourceId: player.isPlayer.id, remainingMs: durationMs, refreshable: true,
      data: { damagePerStack: dmgPerStack, nextTickIn: tickIntervalMs, tickIntervalMs, tickOnExpire: 1 },
    });
    cf.data.damagePerStack = dmgPerStack;
    cf.data.tickIntervalMs = tickIntervalMs;
    cf.data.tickOnExpire = 1;
    markMonsterDot(world, monster);
  }
  ctx.metadata['dotHandled'] = true;
  return true;
}
