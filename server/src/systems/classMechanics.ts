import type { World } from '../world/World';

// The two-phase register/activate pattern was superseded in S5 by the
// MechanicModule registry in server/src/systems/classes/registry.ts.
// Only `isClassActive` survives here because it's used as a runtime gate
// inside `registerEmpoweredMultiplier` for the optional `attackerClass`
// option.

/**
 * True if the player's selectedClass matches className.
 * Always returns false for non-player entities (monsters have no class).
 *
 * Use this as the single gating call inside combat listeners instead of
 * sprinkling player.selectedClass comparisons across files.
 */
export function isClassActive(
  world: World,
  entityId: string,
  className: string,
): boolean {
  const player = world.getPlayerEntity(entityId);
  return player?.usesSkills.selectedClass === className;
}
