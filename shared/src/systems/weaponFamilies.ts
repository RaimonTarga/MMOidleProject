/**
 * Weapon family constants and lookup maps.
 * Shared between server combat logic and client display — edit here to
 * change both behavior and the stat-sheet description at the same time.
 */
import { RECIPE_DATABASE, type Recipe } from '../recipeDatabase';
import type { WeaponDotProfile } from '../data/recipes/types';

// ── Abyss ultimate weapon ───────────────────────────────────────────────────

// ── Brittle (Tundra weapon armor-shred) ─────────────────────────────────────

/**
 * Player-applied debuff that reduces the target monster's plating and damage
 * reduction. Driven by the `weapon.brittle-plating` / `weapon.brittle-dr` /
 * `weapon.brittle-stacks` passives, so any item granting them gains the effect.
 * Stacks on each hit (capped at brittle-stacks), refreshing the timer; read at
 * damage time in effectivePlating.ts (no DoT tick). data: { platingPerStack, drPerStack }.
 */
export const BRITTLE_EFFECT_ID = 'brittle';
/** Duration refreshed on each brittle application, matching other on-hit debuffs. */
export const BRITTLE_DURATION_MS = 4_500;
/**
 * Brittle-shatter DR strip: while this effect is on a monster, its damage
 * reduction is treated as 0. Applied by weapons with `weapon.brittle-shatter-*`
 * when brittle reaches the shatter threshold; read in effectivePlating.ts.
 */
export const DR_SHATTER_EFFECT_ID = 'dr-shatter';

// ── Chaotic family (Chaotic Axe / variants) ─────────────────────────────────
// The dead-swing cadence ("every Nth hit deals 0 damage, on-hit effects still
// fire") is authored per-weapon on the recipe via the `weapon.dead-swing-interval`
// mechanic and read in runPlayerAttack — recipes are the source of truth.

/** tracksCombat counter key tracking the chaotic hit cycle (server-only runtime state). */
export const CHAOTIC_HIT_COUNTER_KEY = 'chaoticHits';

// ── Burn / reservoir DoT family (derived from recipes) ───────────────────────

export interface BurnWeaponEntry extends WeaponDotProfile {
  weaponId: string;
}

// All reservoir-DoT weapons, derived from each recipe's `weaponDot` block — that
// is the single source of truth (edit the recipe to retune). This used to merge
// in unregistered abyss-ultimate entries so edge-of-oblivion's corruption
// reservoir would survive until ultimates were wired in; ultimates were scrapped
// and their recipes deleted on 2026-07-26, so there is nothing left to merge.
// effectIds are unique per weapon (the tick loop iterates the id set).
export const BURN_FAMILY: BurnWeaponEntry[] = (() => {
  const recipesById = new Map<string, Recipe>();
  for (const recipe of RECIPE_DATABASE.values()) recipesById.set(recipe.id, recipe);
  return [...recipesById.values()]
    .filter((r): r is Recipe & { weaponDot: WeaponDotProfile } => r.weaponDot !== undefined)
    .map((r) => ({ weaponId: r.id, ...r.weaponDot }));
})();

export function weaponDotProfileForWeapon(weaponId: string): BurnWeaponEntry | undefined {
  return BURN_FAMILY.find((entry) => entry.weaponId === weaponId);
}

export function weaponDotProfileForEffect(effectId: string): BurnWeaponEntry | undefined {
  return BURN_FAMILY.find((entry) => entry.effectId === effectId);
}
