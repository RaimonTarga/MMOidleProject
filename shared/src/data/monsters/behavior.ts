/**
 * Monster combat behavior — the single authored source of truth for how a
 * monster fights. Mechanical flags (`isRanged`, kiting AI) derive from this via
 * the helpers below, so a monster def carries ONE behavior field, not a behavior
 * string plus parallel `isRanged`/`kite` booleans.
 *
 *   melee  — closes to melee range and attacks (lunge animation).
 *   ranged — attacks from `attackRange` without closing; no lunge.
 *   kiter  — ranged AND actively maintains standoff distance (backs away as the
 *            player closes, re-closes if they flee — see the kite band in ai.ts).
 */
export type MonsterBehavior = 'melee' | 'ranged' | 'kiter';

/** True for ranged or kiter monsters (attack from range, no lunge). */
export function monsterIsRanged(def: { behavior: MonsterBehavior }): boolean {
  return def.behavior !== 'melee';
}

/** True for kiters (maintain-distance AI). Kiters are always also ranged. */
export function monsterKites(def: { behavior: MonsterBehavior }): boolean {
  return def.behavior === 'kiter';
}
