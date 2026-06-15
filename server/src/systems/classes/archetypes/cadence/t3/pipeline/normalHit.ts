import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import {
  MOMENTUM_ECHO_BONUS,
  METRONOME_FLAT_BONUS,
  METRONOME_UNLOCK_TIER,
  RAMPAGE_ATK_PEN_PER_STACK,
} from '../core/constants';

export function registerCadenceNormalHit(): void {
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.metadata['empoweredAttack']) return;

    const entity = ctx.attacker;
    if (!entity.usesCadence) return;

    const cadence = entity.usesCadence;
    const passives = entity.usesSkills.passives;

    // Metronome: apply the bonus accumulated by earlier buildup attacks to this
    // hit, then grow it for the attacks that follow (the finisher resets it). The
    // flat amount scales per tier above the unlock tier (12 / 24 / 36 / …).
    if ((passives['cadence.metronome'] ?? 0) > 0) {
      ctx.damage += cadence.metronomeBonus;
      const flatBase = Math.round(passives['cadence.metronome-flat'] ?? METRONOME_FLAT_BONUS);
      const tierMult = Math.max(
        1,
        (entity.tracksProgression?.playerTier ?? METRONOME_UNLOCK_TIER) - METRONOME_UNLOCK_TIER + 1,
      );
      cadence.metronomeBonus += flatBase * tierMult;
      cadence.metronomeStacks++;
    }

    // Rampage: regular attacks are progressively suppressed as stacks build.
    if (cadence.rampageStacks > 0) {
      const pen = Math.min(0.9, cadence.rampageStacks * RAMPAGE_ATK_PEN_PER_STACK);
      ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - pen)));
    }

    // Resonance (Wavecrest): each buildup attack stacks finisher amplification,
    // consumed/reset by the finisher in empoweredHit.
    if ((passives['cadence.momentum-buildup'] ?? 0) > 0) {
      cadence.resonanceStacks++;
    }

    // Rising Tide echo bonus: boost this hit if the echo counter is running.
    if (cadence.echo > 0 && (passives['cadence.momentum-echo'] ?? 0) > 0) {
      ctx.damage = Math.round(ctx.damage * (1 + MOMENTUM_ECHO_BONUS));
      cadence.echo--;
    }

    // Aftershock: the next few regular attacks after a finisher fire their on-hit
    // damage a second time. (Flat on-hit damage; full proc re-fire — DoT/gear
    // procs resolving twice — is TODO pending an on-hit re-trigger hook.)
    if (cadence.aftershockCharges > 0 && (passives['cadence.aftershock'] ?? 0) > 0) {
      ctx.damage += entity.dealsDamage.onHitDamage;
      cadence.aftershockCharges--;
      const existing = ctx.metadata['clientEffects'];
      ctx.metadata['clientEffects'] = Array.isArray(existing)
        ? [...existing, 'aftershock']
        : ['aftershock'];
    }
  });
}
