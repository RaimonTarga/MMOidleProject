import { addResource, getResource, setResource } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { registerCombatListener } from '../../combat/engine/combatPipeline';
import { ABSORB_POOL_KEY, POOL_DRAIN_MS, COMBAT_ELAPSED_KEY } from '../core/pools';
import { applyHealToPlayer } from '../regen/healing';

/**
 * Register the damage-absorb listener on `onDamageTaken`.
 *
 * Converts `defense.absorb-pct` of the final damage taken into a HoT pool
 * that drains back to the player over POOL_DRAIN_MS (antiheal applied on
 * drain in `runAbsorbDrain`). Purely defensive — scales with damage received,
 * not damage dealt.
 */
export function registerDamageAbsorb(): void {
  registerCombatListener('onDamageTaken', (ctx, _world) => {
    if (ctx.defenderType !== 'player') return;
    if (ctx.damage <= 0) return;
    if (ctx.metadata["isDot"]) return;

    const player = ctx.defender;
    const flatPct = player.usesSkills.passives['defense.absorb-pct'] ?? 0;

    // Ramping absorb (Deepfreeze Ward): climbs from start→max over a fight.
    // Takes the larger of the flat and ramped values (no item carries both).
    let absorbPct = flatPct;
    const rampMax = player.usesSkills.passives['defense.absorb-ramp-max-pct'] ?? 0;
    if (rampMax > 0) {
      const start    = player.usesSkills.passives['defense.absorb-ramp-start-pct'] ?? 0;
      const ramptime = player.usesSkills.passives['defense.absorb-ramptime-ms'] ?? 0;
      const elapsed  = getResource(player.tracksCombat, COMBAT_ELAPSED_KEY);
      const progress = ramptime > 0 ? Math.min(1, elapsed / ramptime) : 1;
      absorbPct = Math.max(flatPct, start + (rampMax - start) * progress);
    }
    if (absorbPct <= 0) return;

    addResource(player.tracksCombat, ABSORB_POOL_KEY, ctx.damage * absorbPct);
  });
}

/**
 * Per-tick absorb pool drain — heals the player from the pool over
 * POOL_DRAIN_MS. Antiheal is applied via `applyHealToPlayer`. Pool zeroes
 * out below 0.5 to avoid asymptotic trickle.
 */
export function runAbsorbDrain(world: World, player: PlayerEntity, dt: number): void {
  const cs = player.tracksCombat;
  const absorbPool = getResource(cs, ABSORB_POOL_KEY);
  if (absorbPool <= 0) return;

  const healAmount = absorbPool * (dt / POOL_DRAIN_MS);
  const absorbLeft = absorbPool - healAmount;
  setResource(cs, ABSORB_POOL_KEY, absorbLeft < 0.5 ? 0 : absorbLeft);
  applyHealToPlayer(player, cs, healAmount, world);
}
