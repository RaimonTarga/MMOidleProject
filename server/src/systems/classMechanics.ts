import type { World } from '../world/World';

// ── Per-class mechanic registry ───────────────────────────────────────────────
//
// Two-phase pattern:
//   Phase 1 (anywhere, before startup):  registerClassMechanic(className, initFn)
//   Phase 2 (startup, before World):     activateClassMechanics(className)
//
// activateClassMechanics calls each registered init function, which registers
// combat pipeline listeners. Those listeners use isClassActive as their guard,
// so they fire only for players whose selectedClass matches.
//
// Call activateClassMechanics once per class at server startup. Calling it a
// second time would double-register all listeners — do not do that.

type MechanicInit = () => void;

const _registry = new Map<string, MechanicInit[]>();

/**
 * Register a mechanic init function for a class.
 * The function will be called by activateClassMechanics.
 * Multiple mechanics can be registered for the same class.
 */
export function registerClassMechanic(className: string, init: MechanicInit): void {
  const list = _registry.get(className);
  if (list) {
    list.push(init);
  } else {
    _registry.set(className, [init]);
  }
}

/**
 * Call all init functions registered for a class.
 * Invoke once per class at server startup (before the World is created).
 */
export function activateClassMechanics(className: string): void {
  const mechanics = _registry.get(className) ?? [];
  for (const init of mechanics) init();
}

// ── Class check helper ────────────────────────────────────────────────────────

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
  const player = world.players.get(entityId);
  return player?.selectedClass === className;
}
