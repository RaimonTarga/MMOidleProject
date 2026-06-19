import {
  applyStatusEffect, getStatusEffect, getTotalStacks, hasStatusEffect,
  removeStatusEffect, BRITTLE_EFFECT_ID,
} from '@mmo-idle/shared';
import { attachMarker, detachMarker } from '../../../../../../ecs/markerHelpers';
import { applyKnockback } from '../../../../../combat/damage/knockback';
import {
  DOT_EFFECT_ID, CHILL_EFFECT, FROZEN_EFFECT, FREEZE_MS,
  FROSTBITE_DOT_TAKEN_PER_STACK, FROSTBITE_EFFECT, FROSTBITE_MS,
} from '../core/constants';
import { hasPassive, markMonsterDot, clearMonsterDot } from '../core/helpers';
import type { DotT3PathContext } from './_types';
import {
  PERM_MAX_STACKS, PERM_MAX_HITS,
  CHILL_MAX, CHILL_MS,
  GLACIAL_FRACTURE_KNOCKBACK_PX, GLACIAL_FRACTURE_KNOCKBACK_MS,
  RIMESHATTER_DR_DEBUFF, RIMESHATTER_DR_MS,
  FROSTBITE_MAX_STACKS,
} from './_constants';

/**
 * Rimeshatter (Heavy).
 * Below max frost stacks: normal 70% conversion (apply a stack). At max stacks:
 * the hit deals full direct damage (the dispatcher's conversion cut is undone),
 * the stacks are MAINTAINED (kept ticking), and a DR debuff is applied so the
 * full-power direct hits land harder. The DR debuff reuses the brittle effect,
 * which the mitigation layer already reads.
 */
export function tryRimeshatter(pc: DotT3PathContext): boolean {
  if (!hasPassive(pc.player, 'dot.rimeshatter')) return false;
  const { ctx, world, player, monster, monsterState, maxStacks, convPct, dmgPerStack, durationMs, tickIntervalMs } = pc;

  const stacks = getTotalStacks(monsterState, DOT_EFFECT_ID);
  if (stacks >= maxStacks) {
    // Full-power phase: restore the direct damage the dispatcher converted to DoT.
    if (convPct < 1) ctx.damage = Math.round(ctx.damage / (1 - convPct));
    // Keep the existing stacks alive (refresh duration only, no new stack).
    const existing = getStatusEffect(monsterState, DOT_EFFECT_ID);
    if (existing) existing.remainingMs = durationMs;
    // DR debuff via the brittle effect (read by effectiveDamageReductionAfterBrittle).
    applyStatusEffect(monsterState, {
      id: BRITTLE_EFFECT_ID, instanced: false, maxStacks: 1, refreshable: true,
      remainingMs: RIMESHATTER_DR_MS, sourceId: player.isPlayer.id,
      data: { platingPerStack: 0, drPerStack: RIMESHATTER_DR_DEBUFF },
    });
  } else {
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
 * Wind Spirit (Heavy).
 * Converts the hit fully into frost DoT. The normal frost stack is applied or
 * refreshed every hit; hitting a target already at max frost stacks applies
 * Frostbite, increasing DoT damage taken for a short refreshable window.
 */
export function tryWindSpirit(pc: DotT3PathContext): boolean {
  if (!hasPassive(pc.player, 'dot.wind-spirit')) return false;
  const { ctx, world, player, monster, monsterState, maxStacks, dmgPerStack, durationMs, tickIntervalMs } = pc;

  const stacks = getTotalStacks(monsterState, DOT_EFFECT_ID);
  if (stacks >= maxStacks) {
    const passives = player.usesSkills.passives;
    const frostbiteMaxStacks = Math.max(1, Math.round(passives['dot.frostbite-max-stacks'] ?? FROSTBITE_MAX_STACKS));
    const frostbiteMs = Math.max(100, Math.round(passives['dot.frostbite-duration-ms'] ?? FROSTBITE_MS));
    const frostbiteDotTaken = Math.max(0, passives['dot.frostbite-dot-taken-pct'] ?? FROSTBITE_DOT_TAKEN_PER_STACK);
    applyStatusEffect(monsterState, {
      id: FROSTBITE_EFFECT, maxStacks: frostbiteMaxStacks, instanced: false,
      remainingMs: frostbiteMs, refreshable: true, sourceId: player.isPlayer.id,
      data: { dotTakenPerStack: frostbiteDotTaken, totalMs: frostbiteMs },
    });
  }

  const eff = applyStatusEffect(monsterState, {
    id: DOT_EFFECT_ID, maxStacks, instanced: false,
    sourceId: player.isPlayer.id, remainingMs: durationMs, refreshable: true,
    data: { damagePerStack: dmgPerStack, nextTickIn: tickIntervalMs, tickIntervalMs, tickOnExpire: 1 },
  });
  eff.data.damagePerStack = dmgPerStack;
  eff.data.tickIntervalMs = tickIntervalMs;
  eff.data.tickOnExpire = 1;
  markMonsterDot(world, monster);
  ctx.damage = 0;
  ctx.metadata['dotHandled'] = true;
  return true;
}

/**
 * Permafrost (Heavy).
 * 1 permanent stack; each subsequent hit increments `hits` (capped at
 * PERM_MAX_HITS). The tick file uses `hits` to ramp damage to 35% ATK at
 * max. Permafrost does not refresh duration — the stack stays forever.
 */
export function tryPermafrost(pc: DotT3PathContext): boolean {
  if (!hasPassive(pc.player, 'dot.permafrost')) return false;
  const { ctx, world, player, monster, monsterState, tickIntervalMs } = pc;

  const existing = getStatusEffect(monsterState, DOT_EFFECT_ID);
  if (existing && existing.data.t3Perm) {
    existing.sourceId = player.isPlayer.id; // update kill credit
    existing.data.hits = Math.min(PERM_MAX_HITS, (existing.data.hits ?? 0) + 1);
  } else if (!existing) {
    applyStatusEffect(monsterState, {
      id: DOT_EFFECT_ID, maxStacks: PERM_MAX_STACKS, instanced: false,
      remainingMs: -1, sourceId: player.isPlayer.id,
      data: {
        nextTickIn:     tickIntervalMs,
        tickIntervalMs,
        t3Perm:         1,
        hits:           1,
      },
    });
    markMonsterDot(world, monster);
  }
  ctx.metadata['dotHandled'] = true;
  return true;
}

/**
 * Freezing Cold (Heavy).
 * Applies a normal stack PLUS a chill stack. 3 chill stacks → 2s freeze
 * (chill is cleared). Frozen targets take +35% damage (handled in
 * onDamageTaken via `getFrozenMult`).
 */
export function tryFreezingCold(pc: DotT3PathContext): boolean {
  if (!hasPassive(pc.player, 'dot.freezing-cold')) return false;
  const { ctx, world, player, monster, monsterState, maxStacks, dmgPerStack, durationMs, tickIntervalMs } = pc;

  const fc = applyStatusEffect(monsterState, {
    id: DOT_EFFECT_ID, maxStacks, instanced: false,
    sourceId: player.isPlayer.id, remainingMs: durationMs, refreshable: true,
    data: { damagePerStack: dmgPerStack, nextTickIn: tickIntervalMs, tickIntervalMs, tickOnExpire: 1 },
  });
  fc.data.damagePerStack = dmgPerStack;
  fc.data.tickIntervalMs = tickIntervalMs;
  fc.data.tickOnExpire = 1;

  if (!hasStatusEffect(monsterState, FROZEN_EFFECT)) {
    applyStatusEffect(monsterState, {
      id: CHILL_EFFECT, maxStacks: CHILL_MAX, instanced: false,
      remainingMs: CHILL_MS, refreshable: true, sourceId: player.isPlayer.id, data: {},
    });
    attachMarker(world, monster, 'hasChill');
    if (getTotalStacks(monsterState, CHILL_EFFECT) >= CHILL_MAX) {
      const chillEffect = getStatusEffect(monsterState, CHILL_EFFECT);
      const sid = chillEffect?.sourceId ?? player.isPlayer.id;
      removeStatusEffect(monsterState, CHILL_EFFECT);
      detachMarker(world, monster, 'hasChill');
      applyStatusEffect(monsterState, {
        id: FROZEN_EFFECT, instanced: false, maxStacks: 1,
        remainingMs: FREEZE_MS, sourceId: sid, data: {},
      });
      attachMarker(world, monster, 'hasFrozen');
      console.log(`[FreezingCold] ${player.isPlayer.id}: ${monster.isMonster.id} frozen!`);
    }
  }
  markMonsterDot(world, monster);
  ctx.metadata['dotHandled'] = true;
  return true;
}

/**
 * Glacial Fracture (Heavy).
 * Hitting at max stacks shatters them for `maxStacks² × dmgPerStack` burst
 * damage, queues the glacial-fracture client effect, and knocks the
 * monster back away from the player. After the burst (or on a normal hit)
 * a fresh stack is applied.
 */
export function tryGlacialFracture(pc: DotT3PathContext): boolean {
  if (!hasPassive(pc.player, 'dot.glacial-fracture')) return false;
  const { ctx, world, player, monster, monsterState, maxStacks, dmgPerStack, durationMs, tickIntervalMs } = pc;

  const currentStacks = getTotalStacks(monsterState, DOT_EFFECT_ID);
  if (currentStacks >= maxStacks) {
    const burst = maxStacks * maxStacks * dmgPerStack;
    ctx.damage += burst;
    clearMonsterDot(world, monster, monsterState);
    const effects = ctx.metadata['clientEffects'];
    ctx.metadata['clientEffects'] = Array.isArray(effects)
      ? [...effects, 'glacial-fracture']
      : ['glacial-fracture'];
    applyKnockback(
      world,
      monster.isMonster.id,
      player.hasPosition.current,
      GLACIAL_FRACTURE_KNOCKBACK_PX,
      GLACIAL_FRACTURE_KNOCKBACK_MS,
    );
    console.log(`[GlacialFract] ${player.isPlayer.id}: shatter ${currentStacks} stacks → +${burst} (knockback ${GLACIAL_FRACTURE_KNOCKBACK_PX}px over ${GLACIAL_FRACTURE_KNOCKBACK_MS}ms)`);
  }
  const gf = applyStatusEffect(monsterState, {
    id: DOT_EFFECT_ID, maxStacks, instanced: false,
    sourceId: player.isPlayer.id, remainingMs: durationMs, refreshable: true,
    data: { damagePerStack: dmgPerStack, nextTickIn: tickIntervalMs, tickIntervalMs, tickOnExpire: 1 },
  });
  gf.data.damagePerStack = dmgPerStack;
  gf.data.tickIntervalMs = tickIntervalMs;
  gf.data.tickOnExpire = 1;
  markMonsterDot(world, monster);
  ctx.metadata['dotHandled'] = true;
  return true;
}
