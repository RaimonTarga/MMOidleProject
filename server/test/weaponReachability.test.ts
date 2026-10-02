/**
 * Every weapon a player can hold must be reachable by SOME path.
 *
 * A weapon recipe is reachable when it can be plain-crafted (no `evolvesFrom`,
 * which `craftRecipe` refuses) or when a lineage lists it as a `LineageForm` and
 * so sells it behind a gate. Phase 2b removed the old weapon evolve/reconstruct
 * path, and the lineage trees only wire T1 -> T2 so far, which left every T3/T4
 * weapon with no way in at all: not craftable, no longer evolvable, and in no
 * tree.
 *
 * This is a sequencing gap between Phase 2b (removal) and Phase 5 (the T2+ band
 * and the re-homing table), not a bug in either, and closing it is authoring
 * work the designer owns. The allowlist below is the agreed size of the hole, so
 * the gap is enforced rather than remembered:
 *
 * - author a T3/T4 form and this test fails until you DELETE its id here, so the
 *   allowlist can never outlive the gap;
 * - strand a weapon that used to be reachable and it fails too, naming the
 *   recipe.
 *
 * The allowlist goes to zero when every weapon lives in a tree. Do not add to it
 * to make a failure go away — a new entry means a player earned a dead end.
 */
import assert from 'node:assert/strict';
import { LINEAGE_DATABASE, RECIPE_DATABASE } from '@mmo-idle/shared';

/**
 * Weapons with no path in. EMPTY, and it stays empty: the T3/T4 forms were authored
 * in design §18.5, so every weapon recipe is either craftable or sold by a tree.
 *
 * An entry appearing here again means a player can earn a dead end. Author the form
 * instead of widening the list.
 */
const KNOWN_UNREACHABLE: readonly string[] = [];

const formRecipeIds = new Set<string>();
for (const [, lineage] of LINEAGE_DATABASE) {
  for (const form of lineage.forms) formRecipeIds.add(form.recipeId);
}

const unreachable: string[] = [];
for (const [id, recipe] of RECIPE_DATABASE) {
  if (recipe.slot !== 'weapon') continue;
  // `craftRecipe` refuses anything with `evolvesFrom`, so that is the whole
  // craftability test; a form entry is the only other way in.
  if (!recipe.evolvesFrom) continue;
  if (formRecipeIds.has(id)) continue;
  unreachable.push(id);
}

const expected = [...KNOWN_UNREACHABLE].sort();
const actual = [...unreachable].sort();

const stranded = actual.filter((id) => !expected.includes(id));
assert.deepEqual(
  stranded,
  [],
  `these weapons have no craft path, no evolve path and no lineage form, and are not a known gap: ${stranded.join(', ')}`,
);

const closed = expected.filter((id) => !actual.includes(id));
assert.deepEqual(
  closed,
  [],
  `these weapons are reachable now — delete them from KNOWN_UNREACHABLE: ${closed.join(', ')}`,
);

// A tree with no weapon forms at all would make the check above vacuous.
assert(formRecipeIds.size > 0, 'no lineage lists any form; the reachability check is vacuous');

console.log(`weaponReachability: ok (${actual.length} known-unreachable weapons)`);
