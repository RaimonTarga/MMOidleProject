/**
 * Every weapon, armor, recovery, or mobility item a player can hold must be
 * reachable by SOME path.
 *
 * There is exactly one path for these slots: the recipe. The +N ladder, the
 * evolve/reconstruct path and the lineage trees are gone (design §24.5, class-first
 * rework D1), so a gear recipe is reachable when its unlock is a biome level its
 * biome actually reaches at the item's own tier (`checkRecipeUnlocks` grants it
 * there), or a boss clear. An item that only a retired path could reach would be a
 * dead end now, and fails here by name. `slotRetirement.test.ts` crafts every T2+
 * item on a real World at its level; this is the static census.
 */
import assert from 'node:assert/strict';
import {
  BIOME_START_TIER_BY_GROUP, RECIPE_DATABASE, biomeLevelCap,
} from '@mmo-idle/shared';
import type { EquipmentSlot, Recipe } from '@mmo-idle/shared';

const GEAR_SLOTS: readonly EquipmentSlot[] = ['weapon', 'armor', 'recovery', 'mobility'];

/**
 * Gear with no path in. EMPTY, and it stays empty.
 *
 * An entry appearing here means a player can earn a dead end. Give the recipe a
 * reachable unlock instead of widening the list.
 */
const KNOWN_UNREACHABLE: readonly string[] = [];

function whyUnreachable(recipe: Recipe): string | null {
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
  if (!GEAR_SLOTS.includes(recipe.slot)) continue;
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
  'these gear items have no craft path and are not a known gap:\n  '
    + reasons.filter((r) => stranded.some((id) => r.startsWith(`${id} `))).join('\n  '),
);

const closed = expected.filter((id) => !actual.includes(id));
assert.deepEqual(
  closed,
  [],
  `these items are reachable now — delete them from KNOWN_UNREACHABLE: ${closed.join(', ')}`,
);

// Guard the guard: a slot filter that matches nothing passes vacuously.
const gearTotal = [...RECIPE_DATABASE.values()].filter((r) => GEAR_SLOTS.includes(r.slot)).length;
assert(gearTotal > 80, `only ${gearTotal} gear recipes found — the slot filter is broken`);

console.log(`itemReachability: ok (${actual.length} known-unreachable gear items)`);
