/**
 * Server-side runtime shape for a named buff/debuff on an entity.
 *
 * Lives in TracksCombat.statusEffects on the server and is never sent to clients
 * directly — client-visible state (e.g. DoT stack count) is mirrored to
 * player/monster networked component views in each system's update function.
 *
 * Exported from `shared/` so pure damage formulas (computeScaledDotDamage,
 * computeEternalDoomDamage) can take StatusEffect as input without forcing
 * shared to depend on server-only TracksCombat machinery.
 */
export interface StatusEffect {
  /** Effect type identifier — e.g. 'dot', 'ashbrand-burn', 'slow'. */
  id: string;
  /** Current stack count. For non-stacking effects, always 1. */
  stacks: number;
  /** Maximum stacks allowed. 0 = no cap. Ignored for instanced effects. */
  maxStacks: number;
  /**
   * Remaining duration in ms. -1 = permanent (never expires by timer).
   * Decremented by the server's tickStatusEffectDurations each world tick.
   * When it reaches 0 the effect is automatically removed.
   */
  remainingMs: number;
  /**
   * If true, re-applying this effect resets remainingMs to the configured value.
   * No effect on instanced effects (each application is always a new entry).
   */
  refreshable: boolean;
  /**
   * If true, every application creates a new independent entry even when one
   * with the same id already exists (used for Ashbrand burns running in parallel).
   * If false, applications add a stack to the existing entry instead.
   */
  instanced: boolean;
  /** Entity that applied this effect — used for kill-credit attribution. */
  sourceId: string;
  /**
   * Effect-specific numeric payload. No enforced schema per-type.
   * Tick-based effects should store:
   *   nextTickIn    — ms until the next tick fires (decremented by the owner system).
   *   tickIntervalMs — reset value for nextTickIn after each tick.
   * Finite-tick effects additionally store:
   *   ticksLeft — remaining ticks; owner system removes the effect when this hits 0.
   */
  data: Record<string, number>;
}
