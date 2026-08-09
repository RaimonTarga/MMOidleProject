import { playerIncomingDamageMult } from '@mmo-idle/shared';
import { registerCombatListener } from '../engine/combatPipeline';

/**
 * P3 — the incoming half of the player damage amplifiers (Biome Ecology Pass 2).
 *
 * The outgoing half has no listener: `playerOutgoingDamageMult` is read once
 * inline in the player attack path, next to `shared.damage-mult`, because it
 * scales the attack rather than the hit taken.
 *
 * ORDER IS LOAD-BEARING. This registers BEFORE `initDefenseSystems()`, so within
 * `onDamageTaken` the amplifier runs ahead of evasion, the damage-cap and shields:
 * an amplified spike is still clipped by the cap the player paid for, and the
 * shield absorbs the amplified amount rather than the base one. Registering it
 * after the cap would let a stacking vulnerability walk straight through the one
 * defensive layer that exists to answer spikes.
 *
 * Deliberately a pipeline listener rather than an inline read in `runMonsterAttack`:
 * every path that resolves a hit on a player through the pipeline is covered, and
 * `ctx.metadata.incomingGross` stays honest as "what the monster swung for"
 * (Avenger/Vengeance scale off that, and shouldn't be paid twice for a debuff).
 */
export function initPlayerAmplifiers(): void {
  registerCombatListener('onDamageTaken', (ctx, _world) => {
    if (ctx.defenderType !== 'player') return;
    if (ctx.damage <= 0) return;
    const mult = playerIncomingDamageMult(ctx.defender.tracksCombat);
    if (mult <= 1) return;
    ctx.damage = Math.max(1, Math.round(ctx.damage * mult));
    ctx.metadata['incomingAmplified'] = true;
  });
}
