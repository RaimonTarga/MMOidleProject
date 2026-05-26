import {
  applyStatusEffect, getStatusEffect, getTotalStacks, hasStatusEffect,
  removeStatusEffect,
} from '@mmo-idle/shared';
import { attachMarker, detachMarker } from '../../../../../../ecs/markerHelpers';
import { applyKnockback } from '../../../../../combat/damage/knockback';
import { DOT_EFFECT_ID, CHILL_EFFECT, FROZEN_EFFECT, FREEZE_MS } from '../core/constants';
import { hasPassive, markMonsterDot, clearMonsterDot } from '../core/helpers';
import type { DotT3PathContext } from './_types';
import {
  PERM_MAX_STACKS, PERM_MAX_HITS,
  CHILL_MAX, CHILL_MS,
  GLACIAL_FRACTURE_KNOCKBACK_PX, GLACIAL_FRACTURE_KNOCKBACK_MS,
} from './_constants';

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
    data: { damagePerStack: dmgPerStack, nextTickIn: tickIntervalMs, tickIntervalMs },
  });
  fc.data.damagePerStack = dmgPerStack;
  fc.data.tickIntervalMs = tickIntervalMs;

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
    data: { damagePerStack: dmgPerStack, nextTickIn: tickIntervalMs, tickIntervalMs },
  });
  gf.data.damagePerStack = dmgPerStack;
  gf.data.tickIntervalMs = tickIntervalMs;
  markMonsterDot(world, monster);
  ctx.metadata['dotHandled'] = true;
  return true;
}
