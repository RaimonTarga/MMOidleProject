/**
 * Pure combat estimate helpers.
 *
 * These helpers intentionally mirror the server's authoritative direct-hit
 * formulas in `server/src/systems/combat/engine/combat.ts`. They do not run the
 * combat pipeline: no archetype listeners, shields, absorbs, on-kill effects, or
 * client events. Use them for AI scoring/tooltips where a stable first-order
 * estimate is useful, not as a substitute for `runPlayerAttack`.
 */

export interface PlayerHitEstimateInput {
  attack: number;
  onHitDamage: number;
  targetPlating: number;
  targetDamageReduction: number;
  /** Flat temporary reduction from combat metadata (e.g. single-hit shred). */
  platingShred?: number;
  /** Existing shred stacks on the target, if the caller has access to them. */
  platingShredStacks?: number;
  /** Flat plating reduction per existing shred stack. */
  platingShredPerStack?: number;
  /**
   * Most archetypes use 1.0. Reload uses 0.5 to match its beforeAttack plating
   * compensation listener.
   */
  platingMult: number;
}

export interface MonsterHitEstimateInput {
  attack: number;
  targetPlating: number;
  targetDamageReduction: number;
}

function directDamageAfterMitigation(
  attack: number,
  targetPlating: number,
  targetDamageReduction: number,
  platingMult: number,
  platingShred = 0,
  platingShredStacks = 0,
  platingShredPerStack = 0,
): number {
  const effectivePlating =
    Math.max(0, targetPlating - platingShred - platingShredStacks * platingShredPerStack) *
    platingMult;
  return Math.max(0, attack - effectivePlating) * (1 - targetDamageReduction);
}

/** Expected direct HP damage of one player hit, including flat on-hit damage. */
export function estimatePlayerHitDamage(input: PlayerHitEstimateInput): number {
  return (
    Math.max(
      1,
      Math.round(
        directDamageAfterMitigation(
          input.attack,
          input.targetPlating,
          input.targetDamageReduction,
          input.platingMult,
          input.platingShred,
          input.platingShredStacks,
          input.platingShredPerStack,
        ),
      ),
    ) + Math.max(0, input.onHitDamage)
  );
}

/** True when the non-floor player hit would deal less than 1 HP damage. */
export function isGlancingHit(input: Omit<PlayerHitEstimateInput, "onHitDamage">): boolean {
  return (
    directDamageAfterMitigation(
      input.attack,
      input.targetPlating,
      input.targetDamageReduction,
      input.platingMult,
      input.platingShred,
      input.platingShredStacks,
      input.platingShredPerStack,
    ) < 1
  );
}

/** Expected direct HP damage of one monster hit against a player. */
export function estimateMonsterHitDamage(input: MonsterHitEstimateInput): number {
  return Math.max(
    1,
    Math.round(
      directDamageAfterMitigation(
        input.attack,
        input.targetPlating,
        input.targetDamageReduction,
        1,
      ),
    ),
  );
}
