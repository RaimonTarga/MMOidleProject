import { getStatusEffect, hasStatusEffect } from '@mmo-idle/shared';
import { registerCombatListener } from '../../../../combat/engine/combatPipeline';
import type { World } from '../../../../../world/World';
import {
  DOT_CONVERSION_PCT, DOT_DURATION_MS, DOT_TICK_MS,
  SMOLDER_EFFECT, FROZEN_EFFECT,
  SE_VULN_PER_STACK, FREEZE_BONUS,
} from './core/constants';
import {
  applyInvigoratingToxins,
  tryPoisonExplosion,
  tryEternalDoom,
} from './paths/poison';
import {
  tryFanTheFlames,
  trySmolderingEmber,
  tryConflagration,
} from './paths/fire';
import {
  tryPermafrost,
  tryFreezingCold,
  tryGlacialFracture,
} from './paths/frost';
import type { DotT3PathContext } from './paths/_types';
import { updatePermafrost } from './ticks/permafrost';
import { updateConflagration } from './ticks/conflagration';
import { updateChillAndFreeze } from './ticks/chillFreeze';
import { mirrorDotT3PlayerSlices, mirrorStatusEffectsToClient } from './core/mirroring';
import { mirrorTargetStatus } from '../../../../combat/targetStatus';
import { evadeBlocksDebuffs } from '../../../../defense/mitigation/evasion';

/**
 * Register all DoT T3 combat pipeline listeners.
 * Called from initDotArchetype() BEFORE the base onHit listener so that
 * T3 mechanics can set ctx.metadata['dotHandled'] to suppress the base handler.
 *
 * The T3 handler always applies the conversion damage reduction (setting
 * ctx.metadata['dotConvApplied']) so the base handler can skip it when the
 * T3 handler already ran.
 */
export function initDotT3(): void {
  // ── onHit: T3 stack application ─────────────────────────────────────────
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;
    if (evadeBlocksDebuffs(ctx)) return; // dodged hit applies no DoT/chill/freeze stacks

    const player = ctx.attacker;
    if (!player.appliesDots) return;

    const passives = player.usesSkills.passives;
    const monster = ctx.defender;
    const monsterState = monster.tracksCombat;

    const maxStacks      = Math.round(passives['dot.max-stacks']                     ?? 6);
    const convPct        = passives['dot.conversion-pct']                            ?? DOT_CONVERSION_PCT;
    const tickIntervalMs = Math.max(100, Math.round(passives['dot.tick-interval-ms'] ?? DOT_TICK_MS));
    const durationMs     = Math.round(passives['dot.duration-ms']                    ?? DOT_DURATION_MS);
    const dmgPerStack    = Math.max(1, Math.round(player.dealsDamage.attack * convPct / maxStacks));

    // Redirect convPct of direct hit damage into DoT ticks.
    // Flag prevents the base handler from double-applying this reduction for
    // paths (like Invigorating Toxins) that fall through without dotHandled.
    ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - convPct)));
    ctx.metadata['dotConvApplied'] = true;

    const pc: DotT3PathContext = {
      ctx, world, player, monster, monsterState,
      maxStacks, convPct, tickIntervalMs, durationMs, dmgPerStack,
    };

    // Fall-through: adds flat damage based on existing stacks, never claims hit.
    applyInvigoratingToxins(pc);

    if (tryPoisonExplosion(pc))  return;
    if (tryEternalDoom(pc))      return;
    if (tryFanTheFlames(pc))     return;
    if (trySmolderingEmber(pc))  return;
    if (tryConflagration(pc))    return;
    if (tryPermafrost(pc))       return;
    if (tryFreezingCold(pc))     return;
    if (tryGlacialFracture(pc))  return;
  });

  // ── onDamageTaken: Smoldering Ember vulnerability + Frozen bonus ─────────
  // Boosts direct-attack damage only; DoT tick bonuses are applied in updateDotArchetype.
  registerCombatListener('onDamageTaken', (ctx, _world) => {
    if (ctx.defenderType !== 'monster') return;
    const monsterState = ctx.defender.tracksCombat;

    const smolder = getStatusEffect(monsterState, SMOLDER_EFFECT);
    if (smolder) {
      ctx.damage = Math.round(ctx.damage * (1 + smolder.stacks * SE_VULN_PER_STACK));
    }
    if (hasStatusEffect(monsterState, FROZEN_EFFECT)) {
      ctx.damage = Math.round(ctx.damage * (1 + FREEZE_BONUS));
    }
  });
}

/** Per-tick DoT T3 update — call once per world tick. */
export function updateDotT3(world: World, dt: number): void {
  updatePermafrost(world, dt);
  updateConflagration(world, dt);
  updateChillAndFreeze(world);
  mirrorDotT3PlayerSlices(world);
  mirrorStatusEffectsToClient(world);
  mirrorTargetStatus(world);
}

// ── Public re-exports (preserve dotT3 module API) ────────────────────────────
export { computeEternalDoomDamage } from '@mmo-idle/shared';
export { getSmolderMult, getFrozenMult, isMonsterFrozen } from './core/selectors';
export { DOT_T3_BUFFS } from './core/buffs';
