/**
 * Every armor, recovery, or mobility item a player can hold must be reachable
 * by SOME path — the non-weapon sibling of weaponReachability.test.ts.
 *
 * Since design §24.5 there is exactly one path for these slots: the recipe. The
 * +N ladder and the evolve/reconstruct path are retired on every slot, and the
 * armour, charm and boots lineage trees are parked, so none of their items is a
 * gated door any more. A non-weapon recipe is therefore reachable when:
 *
 *  - it is plain-craftable: no `evolvesFrom` and not a gated lineage form
 *    (`isGatedLineageForm`, the craft guard's one check), and
 *  - its unlock is a biome level its biome actually reaches at the item's own
 *    tier (`checkRecipeUnlocks` grants it there), or a boss clear.
 *
 * The evolve leg this test used to walk (own the predecessor, push it to +3, or
 * pay `reconstructCost`) is gone; an item that only it could reach would be a
 * dead end now, and fails here by name. `slotRetirement.test.ts` crafts every
 * non-weapon T2+ item on a real World at its level; this is the static census.
 */
import assert from 'node:assert/strict';
import {
  BIOME_START_TIER_BY_GROUP, RECIPE_DATABASE, biomeLevelCap, isGatedLineageForm,
} from '@mmo-idle/shared';
import type { EquipmentSlot, Recipe } from '@mmo-idle/shared';

const NON_WEAPON_SLOTS: readonly EquipmentSlot[] = ['armor', 'recovery', 'mobility'];

/**
 * Non-weapon items with no path in. EMPTY, and it stays empty.
 *
 * An entry appearing here means a player can earn a dead end. Give the recipe a
 * reachable unlock instead of widening the list.
 */
const KNOWN_UNREACHABLE: readonly string[] = [];

function whyUnreachable(recipe: Recipe): string | null {
  if (recipe.evolvesFrom) return `still names a predecessor (${recipe.evolvesFrom}); the evolve path is retired`;
  if (isGatedLineageForm(recipe.id)) return 'is a gated lineage form, which crafting refuses';
  if (recipe.requiredBossClear) return null;
  const start = BIOME_START_TIER_BY_GROUP[recipe.recipeGroup] ?? (recipe.recipeGroup === 'clearing' ? 0 : undefined);
  if (start === undefined) return `'${recipe.recipeGroup}' is not a biome with nodes`;
  const cap = biomeLevelCap(Math.max(recipe.tier, start, 1), recipe.recipeGroup);
  if (recipe.requiredBiomeLevel > cap) {
    return `needs ${recipe.recipeGroup} ${recipe.requiredBiomeLevel}, but the biome caps at ${cap} at T${recipe.tier}`;
  }
  return null;
}

const unreachable: string[] = [];
const reasons: string[] = [];
for (const [id, recipe] of RECIPE_DATABASE) {
  if (!NON_WEAPON_SLOTS.includes(recipe.slot)) continue;
  const why = whyUnreachable(recipe);
  if (why) {
    unreachable.push(id);
    reasons.push(`${id} ${why}`);
  }
}

const expected = [...KNOWN_UNREACHABLE].sort();
const actual = [...unreachable].sort();

const stranded = actual.filter((id) => !expected.includes(id));
assert.deepEqual(
  stranded,
  [],
  'these armor/recovery/mobility items have no craft path and are not a known gap:\n  '
    + reasons.filter((r) => stranded.some((id) => r.startsWith(`${id} `))).join('\n  '),
);

const closed = expected.filter((id) => !actual.includes(id));
assert.deepEqual(
  closed,
  [],
  `these items are reachable now — delete them from KNOWN_UNREACHABLE: ${closed.join(', ')}`,
);

// Guard the guard: a slot filter that matches nothing passes vacuously.
const nonWeaponTotal = [...RECIPE_DATABASE.values()].filter((r) => NON_WEAPON_SLOTS.includes(r.slot)).length;
assert(nonWeaponTotal > 50, `only ${nonWeaponTotal} non-weapon recipes found — the slot filter is broken`);

console.log(`itemReachability: ok (${actual.length} known-unreachable armor/recovery/mobility items)`);
