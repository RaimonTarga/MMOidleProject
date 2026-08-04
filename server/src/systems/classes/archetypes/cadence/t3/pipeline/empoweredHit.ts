import { removeStatusEffect } from '@mmo-idle/shared';
import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { applyPlayerDebuff } from '../../../../shared/applyPlayerDebuff';
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
  SWIFTBLADE_EFFECT,
} from '../core/constants';
import { recomputeRampageStats } from '../core/rampage';
import { crescendoMultiplier } from '../core/crescendo';

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
      if (cadence.rampageStacks >= (passives['cadence.rampage-max-stacks'] ?? RAMPAGE_MAX_STACKS)) {
        cadence.rampageStacks = 0; // overload — rampage crashes
      } else {
        cadence.rampageStacks++;
        cadence.rampageDecayMs = 0;
      }
      recomputeRampageStats(player);
      if (cadence.rampageStacks > 0) {
        const multPerStack = passives['cadence.rampage-mult-per-stack'] ?? RAMPAGE_MULT_PER_STACK;
        ctx.damage = Math.round(ctx.damage * (1 + cadence.rampageStacks * multPerStack));
      }
    }

    // Crescendo (Juggernaut): amplify the finisher by the in-combat ramp multiplier
    // (time-based, front-loaded then heavy DR — see core/crescendo.ts). Not consumed:
    // it keeps climbing while you stay in combat and resets instantly when it ends.
    if ((passives['cadence.crescendo'] ?? 0) > 0 && cadence.crescendoTimerMs > 0) {
      ctx.damage = Math.round(ctx.damage * (1 + crescendoMultiplier(cadence.crescendoTimerMs, passives)));
    }

    // Hemorrhage: convert finisher damage to a non-stacking bleed DoT. Remaining
    // ticks are tracked as the effect's stack count so the target-frame tile reads
    // as a clear countdown (4 → 3 → 2 → …) instead of a static ∞.
    if ((passives['cadence.hemorrhage'] ?? 0) > 0 && ctx.defenderType === 'monster' && !evadeBlocksDebuffs(ctx)) {
      const monsterState = ctx.defender.tracksCombat;
      const hemoMult  = passives['cadence.hemorrhage-mult'] ?? HEMORRHAGE_MULT;
      const hemoTicks = Math.max(1, Math.round(passives['cadence.hemorrhage-ticks'] ?? HEMORRHAGE_TICKS));
      const hemoTickMs = passives['cadence.hemorrhage-tick-ms'] ?? HEMORRHAGE_TICK_MS;
      const damagePerTick = Math.max(1, Math.round(ctx.damage * hemoMult / hemoTicks));
      removeStatusEffect(monsterState, 'cadence-hemorrhage');
      const bleed = applyPlayerDebuff(player, monsterState, {
        id:          'cadence-hemorrhage',
        instanced:   false,
        remainingMs: -1,
        sourceId:    player.isPlayer.id,
        data: {
          damagePerTick,
          nextTickIn:     hemoTickMs,
          tickIntervalMs: hemoTickMs,
        },
      }, { origin: 'mechanic' });
      bleed.stacks = hemoTicks; // one stack per remaining tick
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
        applyPlayerDebuff(player, monsterState, {
          id: 'vulnerability',
          instanced: false,
          refreshable: true,
          remainingMs: vulnMs,
          sourceId: player.isPlayer.id,
          data: { damageMultiplier: 1 + vulnPct / 100 },
        }, { origin: 'mechanic' });
      }
      if (platingShred > 0) {
        // Total shred = stacks × platingReduction; cap by clamping the stack count.
        // The cap is computed from the UNSCALED shred so a Controller core raises
        // per-stack strip without also raising the ceiling it was capped at.
        const maxStacks = shredCap > 0 ? Math.max(1, Math.floor(shredCap / platingShred)) : 0;
        applyPlayerDebuff(player, monsterState, {
          id: 'plating-shred',
          instanced: false,
          maxStacks,
          remainingMs: -1,
          sourceId: player.isPlayer.id,
          data: { platingReduction: platingShred },
        }, { origin: 'mechanic' });
      }
    }

    // Aftershock: arm the next few regular attacks to fire their on-hit twice.
    if ((passives['cadence.aftershock'] ?? 0) > 0) {
      cadence.aftershockCharges = Math.max(1, Math.round(passives['cadence.aftershock-attacks'] ?? AFTERSHOCK_ATTACKS));
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
