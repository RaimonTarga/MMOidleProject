/**
 * Every armor, recovery, or mobility item a player can hold must be reachable
 * by SOME path — the non-weapon sibling of weaponReachability.test.ts.
 *
 * A non-weapon (armor/recovery/mobility) recipe is reachable when:
 *
 *  - it is plain-craftable (no `evolvesFrom`, which is the same structural
 *    test weaponReachability.test.ts uses for "craftable"), or
 *  - a lineage lists it as a `LineageForm` (sold behind a tier gate), or
 *  - it sits on the still-live non-weapon +N/evolve chain. Unlike weapons,
 *    `checkEvolve`/`checkReconstruct` (shared/src/systems/evolution.ts) reject
 *    an evolve/reconstruct ONLY when `recipe.slot === 'weapon'` — this is last
 *    night's deliberate divergence (Phase 2b removed the weapon evolve path
 *    and moved weapons onto lineage forms only; armor/charm/boots kept the
 *    ladder). So a non-weapon recipe with `evolvesFrom` is reachable when
 *    EITHER it carries its own `reconstructCost` (a direct path that needs no
 *    predecessor at all — `checkReconstruct`), OR its `evolvesFrom` predecessor
 *    is itself reachable (own it, push it to +3, `checkEvolve`).
 *
 * Verified against the actual recipe data (2026-10-01): every one of the 43
 * non-weapon recipes with `evolvesFrom` outside a lineage tree (16 armor, 16
 * recovery, 11 mobility) carries a `reconstructCost` today, so the recursive
 * predecessor-walk never has to fire to pass this test right now. It is still
 * the honest definition, not a shortcut to "has reconstructCost": the day
 * Phase 4's exit retires the non-weapon ladder (reconstructCost dropped, or
 * the +N path turned off for these slots — the designer's stated plan), any
 * recipe that leg was carrying stops resolving and THIS test fails on it by
 * name, the same tripwire role weaponReachability.test.ts already plays for
 * weapons.
 *
 * This wave's re-homing table (design §18, W1-E) separately adds 11 new
 * non-weapon doors (3 armor, 4 recovery, 4 mobility) as `LineageForm`s. Those
 * 11 roots carry no `evolvesFrom` of their own, so the plain-craft leg alone
 * already marked them reachable before they were ever added to a tree — the
 * form entry is what the gate/capstone economy needs, not what reachability
 * needed. The allowlist below is empty and must stay that way: this is the
 * wave that was supposed to close every known non-weapon gap.
 */
import assert from 'node:assert/strict';
import { LINEAGE_DATABASE, RECIPE_DATABASE } from '@mmo-idle/shared';
import type { EquipmentSlot } from '@mmo-idle/shared';

const NON_WEAPON_SLOTS: readonly EquipmentSlot[] = ['armor', 'recovery', 'mobility'];

/**
 * Non-weapon items with no path in. EMPTY, and it stays empty: W1-E's
 * re-homing table authored a door for every root this biome slice needed.
 *
 * An entry appearing here means a player can earn a dead end. Author the form
 * (or restore the reconstruct/evolve path) instead of widening the list.
 */
const KNOWN_UNREACHABLE: readonly string[] = [];

const formRecipeIds = new Set<string>();
for (const [, lineage] of LINEAGE_DATABASE) {
  for (const form of lineage.forms) formRecipeIds.add(form.recipeId);
}

const reachableCache = new Map<string, boolean>();

function isReachable(id: string, seen: Set<string>): boolean {
  const cached = reachableCache.get(id);
  if (cached !== undefined) return cached;
  // A cycle in `evolvesFrom` is a data bug, not a path — treat it as unreachable
  // rather than recursing forever.
  if (seen.has(id)) return false;
  seen.add(id);

  const recipe = RECIPE_DATABASE.get(id);
  let ok: boolean;
  if (!recipe) {
    ok = false;
  } else if (!recipe.evolvesFrom) {
    ok = true; // plain-craftable: craftRecipe only refuses an `evolvesFrom` recipe
  } else if (formRecipeIds.has(id)) {
    ok = true; // sold as a lineage form regardless of its own evolve chain
  } else if (recipe.reconstructCost) {
    ok = true; // checkReconstruct: a direct path, no predecessor required
  } else {
    ok = isReachable(recipe.evolvesFrom, seen); // checkEvolve: predecessor must be reachable
  }
  reachableCache.set(id, ok);
  return ok;
}

const unreachable: string[] = [];
for (const [id, recipe] of RECIPE_DATABASE) {
  if (!NON_WEAPON_SLOTS.includes(recipe.slot)) continue;
  if (!isReachable(id, new Set())) unreachable.push(id);
}

const expected = [...KNOWN_UNREACHABLE].sort();
const actual = [...unreachable].sort();

const stranded = actual.filter((id) => !expected.includes(id));
assert.deepEqual(
  stranded,
  [],
  'these armor/recovery/mobility items have no craft path, no evolve/reconstruct path, ' +
    `and no lineage form, and are not a known gap: ${stranded.join(', ')}`,
);

const closed = expected.filter((id) => !actual.includes(id));
assert.deepEqual(
  closed,
  [],
  `these items are reachable now — delete them from KNOWN_UNREACHABLE: ${closed.join(', ')}`,
);

// A tree with no non-weapon forms at all would make the check above vacuous.
assert(formRecipeIds.size > 0, 'no lineage lists any form; the reachability check is vacuous');

// Guard the guard: a slot filter that matches nothing passes vacuously too.
const nonWeaponTotal = [...RECIPE_DATABASE.values()].filter((r) => NON_WEAPON_SLOTS.includes(r.slot)).length;
assert(nonWeaponTotal > 50, `only ${nonWeaponTotal} non-weapon recipes found — the slot filter is broken`);

console.log(`itemReachability: ok (${actual.length} known-unreachable armor/recovery/mobility items)`);
