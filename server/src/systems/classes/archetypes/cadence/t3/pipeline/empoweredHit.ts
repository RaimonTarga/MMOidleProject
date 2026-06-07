import { applyStatusEffect, removeStatusEffect } from '@mmo-idle/shared';
import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { attachMarker } from '../../../../../../ecs/markerHelpers';
import { evadeBlocksDebuffs } from '../../../../../defense/mitigation/evasion';
import {
  CADENCE_MAX_SPEED_STACKS,
  CADENCE_SPEED_PER_STACK_MS,
  DETONATION_FUSE_MS,
  DETONATION_MULT,
  HEMORRHAGE_MULT,
  HEMORRHAGE_TICK_MS,
  HEMORRHAGE_TICKS,
  MOMENTUM_ECHO_HITS,
} from '../core/constants';

const CADENCE_THRESHOLD_DEFAULT = 5;

export function registerCadenceEmpoweredHit(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (!ctx.metadata['empoweredAttack']) return;

    const entity = ctx.attacker;
    if (!entity.usesCadence) return;

    const player = entity;
    const cadence = entity.usesCadence;
    const passives = player.usesSkills.passives;

    // Double Time: multiply again for extra hits (already multiplied once above).
    const triggerCount = Math.max(1, Math.round(passives['cadence.trigger-count'] ?? 1));
    if (triggerCount > 1) {
      ctx.damage = Math.round(ctx.damage * triggerCount);
    }

    // Rising Tide: additional multiplier based on how many normal hits built up to this finisher.
    const momentumPerHit = passives['cadence.momentum-buildup'] ?? 0;
    if (momentumPerHit > 0) {
      const normalHits = (cadence.threshold || CADENCE_THRESHOLD_DEFAULT) - 1;
      ctx.damage = Math.round(ctx.damage * (1 + normalHits * momentumPerHit));
    }

    // Iron Patience: add all stored charge to finisher damage, then clear.
    if ((passives['cadence.charge-buildup'] ?? 0) > 0) {
      ctx.damage += cadence.charge;
      cadence.charge = 0;
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

    // Delayed Verdict: tag the target with accumulated pre-finisher damage.
    if ((passives['cadence.detonation'] ?? 0) > 0 && ctx.defenderType === 'monster' && !evadeBlocksDebuffs(ctx)) {
      const monsterState = ctx.defender.tracksCombat;
      removeStatusEffect(monsterState, 'cadence-detonation');
      applyStatusEffect(monsterState, {
        id:          'cadence-detonation',
        instanced:   false,
        remainingMs: -1,
        sourceId:    player.isPlayer.id,
        data: {
          damage: Math.round(cadence.seqDmg * DETONATION_MULT),
          fuseMs: DETONATION_FUSE_MS,
        },
      });
      attachMarker(world, ctx.defender, 'hasDetonation');
    }
    cadence.seqDmg = 0;

    // Accelerando: gain a speed stack on each finisher.
    if ((passives['cadence.speed-stack'] ?? 0) > 0) {
      if (cadence.speedStacks < CADENCE_MAX_SPEED_STACKS) {
        cadence.speedStacks++;
        player.performsAttack.attackCooldown = Math.max(
          200,
          player.performsAttack.attackCooldown - CADENCE_SPEED_PER_STACK_MS,
        );
      }
    }

    // Cursed Finale: vulnerability and plating-shred debuffs on the target.
    const vulnPct      = passives['cadence.debuff-vuln-pct']      ?? 0;
    const vulnMs       = passives['cadence.debuff-vuln-ms']       ?? 5000;
    const platingShred = passives['cadence.debuff-plating-shred'] ?? 0;
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
        applyStatusEffect(monsterState, {
          id: 'plating-shred',
          instanced: false,
          remainingMs: -1,
          sourceId: player.isPlayer.id,
          data: { platingReduction: platingShred },
        });
      }
    }

    // Rising Tide echo: arm the post-finisher echo counter for subsequent hits.
    if ((passives['cadence.momentum-echo'] ?? 0) > 0) {
      cadence.echo = MOMENTUM_ECHO_HITS;
    }

    ctx.metadata['cadenceTrigger'] = true;
  });
}
