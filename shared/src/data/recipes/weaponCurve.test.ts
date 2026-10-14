/**
 * The weapon curve is authored at FULL power, and nothing else may grant it.
 *
 * The 2026-09-26 weapon normalization authored every weapon in `+5` terms — read
 * `gale-needle`'s own comment, "Attack 9->17 (+5: 14->35). The old curve was
 * T1-sized, so a +5 Flash Rapier matched a +0 Gale Needle." Every monster, boss
 * and node number in the game was then calibrated against a player holding a
 * fully upgraded weapon (`bossExam.ts`: "gear fully upgraded").
 *
 * The lineage rework deleted the `+1..+5` ladder from weapon recipes
 * (`d5f7494b`), on the rationale that "Tier-2+ weapon power now comes exclusively
 * from the lineage tree". Within a tier the lineage tree's replacement is band 1,
 * which run 4's own lane matrix measured at **+2.0% median uplift at T1** — against
 * a ladder worth **+31% DPS**. So every weapon silently dropped to its `+0` value
 * while the content kept its `+5` calibration, which is what walled the tutorial
 * Striker on the Plains boss (0/11, a first-try win in September) and widened the
 * Greatbear's spread at the gate. The ladder's totals are folded into the base
 * stats instead: the grind is still gone (one craft is full power, per design §0),
 * but the authored curve is back.
 *
 * This suite pins both halves of that, because the failure mode is silence — a
 * weapon losing its power source throws nothing and fails no test:
 *
 *   1. No weapon recipe carries an `upgrades` ladder, so the base stat is the only
 *      source of weapon power and cannot be double-counted.
 *   2. Every weapon's base Attack is the authored full-power number.
 *
 * It is a pin, not a balance claim: when the designer retunes the curve, this table
 * moves with it in the same commit.
 */
import { RECIPE_DATABASE } from './index';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

/** Authored full-power Attack per weapon — the pre-removal `+5` total. */
const WEAPON_ATTACK = new Map<string, number>([
  // Tier 0
  ['primordial-club', 8],
  // Tier 1
  ['ashbrand-blade', 18],
  ['chaotic-axe', 29],
  ['flash-rapier', 12],
  ['heavy-hammer', 38],
  ['iron-broadsword', 19],
  // Tier 2
  ['desert-sunsteel-cross', 65],
  ['gale-needle', 35],
  ['jungle-stinger-rapier', 24],
  ['knight-steelsword', 51],
  ['quake-hammer', 85],
  ['ruinous-axe', 60],
  ['swamp-mirebrand', 47],
  // Tier 3
  ['cave-cataclysm-axe', 112],
  ['desert-pilgrim-quarterstaff', 90],
  ['desert-solar-cross', 112],
  ['jungle-venomthorn-rapier', 50],
  ['mountain-avalanche-maul', 164],
  ['swamp-blightbrand', 86],
  ['tundra-permafrost-maul', 162],
  ['tundra-rimebrand', 132],
  ['volcanic-cinderlash', 70],
  // Tier 4
  ['desert-sunmonk-warstaff', 192],
  ['desert-zenith-cross', 212],
  ['graveyard-plague-axe', 258],
  ['jungle-deathfang-rapier', 108],
  ['mountain-earthsunder-maul', 486],
  ['mountain-warmaul', 370],
  ['trench-abyssal-axe', 257],
  ['tundra-glacial-rimebrand', 310],
  ['tundra-glacial-tyrant-maul', 378],
  ['volcanic-blightbrand', 172],
  ['volcanic-eruption-lash', 119],
]);

const weapons = [...RECIPE_DATABASE.values()].filter((r) => r.slot === 'weapon');
assert(weapons.length > 0, 'no weapon recipes found');

// 1. The base stat is the only source of weapon power.
const laddered = weapons.filter((r) => (r.upgrades?.length ?? 0) > 0).map((r) => r.id);
assert(
  laddered.length === 0,
  `weapon recipes must carry no +N ladder (power is folded into base stats): ${laddered.join(', ')}`,
);

// 2. Every generic weapon is at its authored full-power Attack, and the table covers them all.
const problems: string[] = [];
const generic = weapons.filter((r) => !r.classes);
for (const recipe of generic) {
  const expected = WEAPON_ATTACK.get(recipe.id);
  if (expected === undefined) {
    problems.push(`${recipe.id}: not in WEAPON_ATTACK — add its authored full-power Attack`);
    continue;
  }
  const actual = recipe.stats?.attack ?? 0;
  if (actual !== expected) {
    problems.push(`${recipe.id}: Attack ${actual}, authored full power is ${expected}`);
  }
}
for (const id of WEAPON_ATTACK.keys()) {
  if (!generic.some((r) => r.id === id)) problems.push(`${id}: in WEAPON_ATTACK but no longer a weapon recipe`);
}

// 3. Class weapons (class-first build plan §3.6) copy a generic weapon of their biome until
// the class tracks retune them, so each one's Attack is a pinned full-power Attack from its
// own biome.
const pinnedByGroup = new Map<string, Set<number>>();
for (const recipe of generic) {
  const attack = WEAPON_ATTACK.get(recipe.id);
  if (attack === undefined) continue;
  const pinned = pinnedByGroup.get(recipe.recipeGroup) ?? new Set<number>();
  pinned.add(attack);
  pinnedByGroup.set(recipe.recipeGroup, pinned);
}
for (const recipe of weapons.filter((r) => r.classes)) {
  const attack = recipe.stats?.attack ?? 0;
  if (!pinnedByGroup.get(recipe.recipeGroup)?.has(attack)) {
    problems.push(`${recipe.id}: Attack ${attack} is no ${recipe.recipeGroup} generic weapon's full-power Attack`);
  }
}
assert(problems.length === 0, `weapon curve drift:\n  ${problems.join('\n  ')}`);

console.log('weaponCurve.test.ts: ok');
