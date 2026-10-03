/** W1-D: every slot is full power at craft; pin the old non-weapon +5 totals. */
import { RECIPE_DATABASE } from './index';
import { NON_WEAPON_LADDERS } from './nonWeaponLadders.fixture';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const laddered = [...RECIPE_DATABASE.values()].filter(r => (r.upgrades?.length ?? 0) > 0);
assert(laddered.length === 0, `recipes must carry no +N ladder: ${laddered.map(r => r.id).join(', ')}`);
assert(NON_WEAPON_LADDERS.length === 86, 'original non-weapon ladder fixture must cover all 86 folds');
assert(new Set(NON_WEAPON_LADDERS.map(r => r.id)).size === 86, 'duplicate original ladder fixture');

const problems: string[] = [];
for (const original of NON_WEAPON_LADDERS) {
  const recipe = RECIPE_DATABASE.get(original.id);
  assert(!!recipe, `missing folded recipe: ${original.id}`);
  if (!recipe) continue;
  assert(recipe.slot === original.slot, `${original.id}: slot changed`);
  assert(original.steps.length === 5, `${original.id}: fixture must retain all five increments`);
  for (const field of ['stats', 'mechanicEffects'] as const) {
    // Independently sum the ORIGINAL base and steps, not a table of new values.
    const expected = { ...original.base[field] };
    for (const step of original.steps) {
      for (const [key, increment] of Object.entries(step[field])) {
        expected[key] = (expected[key] ?? 0) + increment;
      }
    }
    const actual: Record<string, number> = recipe[field] ?? {};
    for (const key of new Set([...Object.keys(expected), ...Object.keys(actual)])) {
      const want = expected[key] ?? 0;
      const got = actual[key] ?? 0;
      // Only tolerate IEEE-754 addition noise; even a 0.000001 fold error fails.
      if (!Number.isFinite(got) || Math.abs(got - want) > 1e-10) {
        problems.push(`${original.id}.${field}.${key}: ${got}, old +5 total ${want}`);
      }
    }
  }
}
assert(problems.length === 0, `non-weapon fold drift:\n  ${problems.join('\n  ')}`);
console.log('recipeCurve.test.ts: ok (86 original +5 totals; every slot has no ladder)');
