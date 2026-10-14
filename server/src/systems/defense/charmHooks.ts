import { abilityHasTag, type AbilityDef } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../ecs/entity';
import type { World } from '../../world/World';
import { restoreBarrierFraction } from './barrier/barrier';
import { advanceRecoveryRamp, triggerRecoveryPulse } from './regen/recovery';

/**
 * Charm Guard hooks (2026-09-26). Charms own the Recovery side of abilities: each
 * line's delivery mechanic answers to its own biome's Guard. GUARDS ONLY — a
 * Technique never triggers charm healing (design axiom: no defense scaling with
 * offense). Called once per Guard activation, after the Guard's own effect.
 *
 *   Mountain  Mitigation Guard (Brace/Endure/Bramble) -> restore barrier
 *   Tundra    Control Guard (Break Free)              -> restore barrier
 *   Swamp     Cleanse Guard (Cleanse/Break Free)      -> Recovery pulse now
 *   Jungle    any Guard                               -> advance ramping Recovery
 *
 * Cave's hook is a state, not an event (absorb while a Mitigation Guard buff is
 * up) and lives in `damageAbsorb.ts`.
 */
export function onGuardFired(world: World, player: PlayerEntity, ability: AbilityDef): void {
  const passives = player.usesSkills.passives;

  let barrier = 0;
  if (abilityHasTag(ability, 'mitigation')) barrier += passives['guard.barrier-refill-pct'] ?? 0;
  if (abilityHasTag(ability, 'control')) barrier += passives['guard.barrier-refill-on-control-pct'] ?? 0;
  if (barrier > 0) restoreBarrierFraction(world, player, barrier);

  if (abilityHasTag(ability, 'cleanse') && (passives['guard.cleanse-pulse'] ?? 0) > 0) {
    triggerRecoveryPulse(player);
  }

  const advanceMs = passives['guard.recovery-ramp-advance-ms'] ?? 0;
  if (advanceMs > 0) advanceRecoveryRamp(player, advanceMs);
}
