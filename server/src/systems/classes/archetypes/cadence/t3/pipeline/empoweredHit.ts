import { applyStatusEffect, removeStatusEffect } from '@mmo-idle/shared';
import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { attachMarker } from '../../../../../../ecs/markerHelpers';
import { evadeBlocksDebuffs } from '../../../../../defense/mitigation/evasion';
import {
  HEMORRHAGE_MULT,
  HEMORRHAGE_TICK_MS,
  HEMORRHAGE_TICKS,
  AFTERSHOCK_ATTACKS,
  CURSED_FINALE_SHRED_CAP,
  RAMPAGE_MAX_STACKS,
  RAMPAGE_MULT_PER_STACK,
  CRESCENDO_FLAT_PER_STACK,
  SWIFTBLADE_EFFECT,
} from '../core/constants';
import { recomputeRampageStats } from '../core/rampage';

export function registerCadenceEmpoweredHit(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (!ctx.metadata['empoweredAttack']) return;

    const entity = ctx.attacker;
    if (!entity.usesCadence) return;

    const player = entity;
    const cadence = entity.usesCadence;
    const passives = player.usesSkills.passives;

    // Swiftblade: the finisher strikes multiple times. We do NOT multiply damage
    // here — each extra strike is dealt as its own damage instance (separate
    // number + dual-slash FX) in the afterHit listener, once this hit's final
    // damage is known. Tag this primary hit so it renders the same dual slash.
    const triggerCount = Math.max(1, Math.round(passives['cadence.trigger-count'] ?? 1));
    if (triggerCount > 1) {
      const existing = ctx.metadata['clientEffects'];
      ctx.metadata['clientEffects'] = Array.isArray(existing)
        ? [...existing, SWIFTBLADE_EFFECT]
        : [SWIFTBLADE_EFFECT];
    }

    // Resonance (Wavecrest): amplify the finisher by the resonance stacks accrued
    // from this cycle's buildup attacks, then clear them. (Equivalent to the old
    // threshold-1 constant in normal play, but driven by the actual buildup count
    // so it matches the Resonance buff badge exactly.)
    const momentumPerHit = passives['cadence.momentum-buildup'] ?? 0;
    if (momentumPerHit > 0) {
      ctx.damage = Math.round(ctx.damage * (1 + cadence.resonanceStacks * momentumPerHit));
      cadence.resonanceStacks = 0;
    }

    // Metronome: add the flat bonus accumulated across the buildup, then reset.
    if ((passives['cadence.metronome'] ?? 0) > 0) {
      ctx.damage += cadence.metronomeBonus;
      cadence.metronomeBonus = 0;
      cadence.metronomeStacks = 0;
    }

    // Rampage: each finisher adds a stack — shorter combo, faster attacks, weaker
    // regulars, stronger finisher. At the cap the next finisher OVERLOADS: stacks
    // crash to 0 and rampage stops (recompute restores threshold/cooldown), so the
    // power can't be sustained indefinitely. Stacks decay slowly out of combat.
    // TODO(engine): stacks reset on recalc (re-equip) because the slice is rebuilt.
    if ((passives['cadence.rampage'] ?? 0) > 0) {
      if (cadence.rampageStacks >= RAMPAGE_MAX_STACKS) {
        cadence.rampageStacks = 0; // overload — rampage crashes
      } else {
        cadence.rampageStacks++;
        cadence.rampageDecayMs = 0;
      }
      recomputeRampageStats(player);
      if (cadence.rampageStacks > 0) {
        ctx.damage = Math.round(ctx.damage * (1 + cadence.rampageStacks * RAMPAGE_MULT_PER_STACK));
      }
    }

    // Crescendo: consume all in-combat time-stacks, each adding a flat bonus.
    if ((passives['cadence.crescendo'] ?? 0) > 0 && cadence.crescendoStacks > 0) {
      const flat = Math.round(passives['cadence.crescendo-flat'] ?? CRESCENDO_FLAT_PER_STACK);
      ctx.damage += cadence.crescendoStacks * flat;
      cadence.crescendoStacks = 0;
    }

    // Hemorrhage: convert finisher damage to a non-stacking bleed DoT.
    if ((passives['cadence.hemorrhage'] ?? 0) > 0 && ctx.defenderType === 'monster' && !evadeBlocksDebuffs(ctx)) {
      const monsterState = ctx.defender.tracksCombat;
      const damagePerTick = Math.max(1, Math.round(ctx.damage * HEMORRHAGE_MULT / HEMORRHAGE_TICKS));
      removeStatusEffect(monsterState, 'cadence-hemorrhage');
      applyStatusEffect(monsterState, {
        id:          'cadence-hemorrhage',
        instanced:   false,
        remainingMs: -1,
        sourceId:    player.isPlayer.id,
        data: {
          damagePerTick,
          ticksLeft:      HEMORRHAGE_TICKS,
          nextTickIn:     HEMORRHAGE_TICK_MS,
          tickIntervalMs: HEMORRHAGE_TICK_MS,
        },
      });
      attachMarker(world, ctx.defender, 'hasHemorrhage');
      ctx.damage = 0;
    }

    // Verdict (cadence-balanced-t3-c): banking the finisher into the pool and the
    // execute check both need this hit's FINAL damage / the target's post-hit HP,
    // so they run in the afterHit listener (pipeline/verdict.ts), not here.

    // Cursed Finale: vulnerability and capped plating-shred debuffs on the target.
    const vulnPct      = passives['cadence.debuff-vuln-pct']      ?? 0;
    const vulnMs       = passives['cadence.debuff-vuln-ms']       ?? 5000;
    const platingShred = passives['cadence.debuff-plating-shred'] ?? 0;
    const shredCap     = passives['cadence.debuff-shred-cap']     ?? CURSED_FINALE_SHRED_CAP;
    if ((vulnPct > 0 || platingShred > 0) && ctx.defenderType === 'monster' && !evadeBlocksDebuffs(ctx)) {
      const monsterState = ctx.defender.tracksCombat;
      if (vulnPct > 0) {
        applyStatusEffect(monsterState, {
          id: 'vulnerability',
          instanced: false,
          refreshable: true,
          remainingMs: vulnMs,
          sourceId: player.isPlayer.id,
          data: { damageMultiplier: 1 + vulnPct / 100 },
        });
      }
      if (platingShred > 0) {
        // Total shred = stacks × platingReduction; cap by clamping the stack count.
        const maxStacks = shredCap > 0 ? Math.max(1, Math.floor(shredCap / platingShred)) : 0;
        applyStatusEffect(monsterState, {
          id: 'plating-shred',
          instanced: false,
          maxStacks,
          remainingMs: -1,
          sourceId: player.isPlayer.id,
          data: { platingReduction: platingShred },
        });
      }
    }

    // Aftershock: arm the next few regular attacks to fire their on-hit twice.
    if ((passives['cadence.aftershock'] ?? 0) > 0) {
      cadence.aftershockCharges = AFTERSHOCK_ATTACKS;
    }

    // Rising Tide echo: arm the post-finisher echo counter for subsequent hits.
    // The hit count comes from the node value (momentum-echo) so authoring it on
    // the skill node actually takes effect (it doubles as the unlock gate).
    const echoHits = Math.round(passives['cadence.momentum-echo'] ?? 0);
    if (echoHits > 0) {
      cadence.echo = echoHits;
    }

    ctx.metadata['cadenceTrigger'] = true;
  });
}
