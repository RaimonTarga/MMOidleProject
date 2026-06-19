import {
  computeDotClassDamagePerStack,
  getStatusEffect,
  hasStatusEffect,
  applyStatusEffect,
  getTotalStacks,
  resolveDotClassProfile,
} from '@mmo-idle/shared';
import { registerCombatListener } from '../../../../combat/engine/combatPipeline';
import type { World } from '../../../../../world/World';
import {
  DOT_EFFECT_ID,
  SMOLDER_EFFECT, FROZEN_EFFECT,
  SE_VULN_PER_STACK, FREEZE_BONUS,
} from './core/constants';
import {
  FRENZY_FX, FRENZY_DURATION_MS, FRENZY_ONHIT_PER_TIER, FRENZY_UNLOCK_TIER,
} from './paths/_constants';
import {
  applyInvigoratingToxins,
  tryPoisonExplosion,
  tryEternalDoom,
} from './paths/poison';
import {
  tryFanTheFlames,
  tryIgnition,
  trySmolderingEmber,
  tryConflagration,
} from './paths/fire';
import {
  tryPermafrost,
  tryRimeshatter,
  tryWindSpirit,
  tryFreezingCold,
  tryGlacialFracture,
} from './paths/frost';
import type { DotT3PathContext } from './paths/_types';
import { updatePermafrost } from './ticks/permafrost';
import { updateConflagration } from './ticks/conflagration';
import { updateChillAndFreeze } from './ticks/chillFreeze';
import { updateFrenzy } from './ticks/frenzy';
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

    const profile = resolveDotClassProfile(passives, player.usesSkills.selectedSubVariant);
    const { maxStacks, conversionPct: convPct, tickIntervalMs, durationMs } = profile;
    // Class DoT stack value is generated from base attack, not final ctx.damage.
    // T3 specs may transform stack behavior, but they share the base profile contract.
    const dmgPerStack = computeDotClassDamagePerStack(player.dealsDamage.attack, profile);

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
    if (tryIgnition(pc))         return;
    if (trySmolderingEmber(pc))  return;
    if (tryConflagration(pc))    return;
    if (tryPermafrost(pc))       return;
    if (tryRimeshatter(pc))      return;
    if (tryWindSpirit(pc))       return;
    if (tryFreezingCold(pc))     return;
    if (tryGlacialFracture(pc))  return;
  });

  // ── onHit: Zealot Frenzy — grant/refresh the buff on a max-stack hit, and apply
  // the on-hit-damage half while it's active (the attack-speed half is in updateFrenzy).
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    const player = ctx.attacker;
    if (!player.appliesDots) return;
    if ((player.usesSkills.passives['dot.frenzy'] ?? 0) <= 0) return;

    const maxStacks = Math.round(player.usesSkills.passives['dot.max-stacks'] ?? 6);
    const stacks = getTotalStacks(ctx.defender.tracksCombat, DOT_EFFECT_ID);
    if (maxStacks > 0 && stacks >= maxStacks) {
      applyStatusEffect(player.tracksCombat, {
        id: FRENZY_FX, instanced: false, refreshable: true,
        remainingMs: FRENZY_DURATION_MS, sourceId: player.isPlayer.id,
        data: { totalMs: FRENZY_DURATION_MS },
      });
    }
    if (getStatusEffect(player.tracksCombat, FRENZY_FX)) {
      const tierMult = Math.max(1, (player.tracksProgression?.playerTier ?? FRENZY_UNLOCK_TIER) - FRENZY_UNLOCK_TIER + 1);
      ctx.damage += Math.round(FRENZY_ONHIT_PER_TIER * tierMult);
    }
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
  updateFrenzy(world);
  mirrorDotT3PlayerSlices(world);
  mirrorStatusEffectsToClient(world);
  mirrorTargetStatus(world);
}

// ── Public re-exports (preserve dotT3 module API) ────────────────────────────
export { computeEternalDoomDamage } from '@mmo-idle/shared';
export { getSmolderMult, getFrozenMult, getFrostbiteDotTakenMult, isMonsterFrozen } from './core/selectors';
export { DOT_T3_BUFFS } from './core/buffs';
