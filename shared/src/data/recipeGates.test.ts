/**
 * Every recipe in the game must be REACHABLE.
 *
 * Three independent kinds of drift had silently made recipes uncraftable, each
 * invisible until a player tried to buy the thing:
 *
 *   1. A recipe sits in a biome that has no nodes at its own tier (Fleeting was a
 *      T2 recipe in a Tundra that first appears at T3).
 *   2. Its `requiredBiomeLevel` is above `biomeLevelCap` at its own tier, so the
 *      gate demands a player tier higher than the recipe belongs to.
 *   3. Its `catalystCost` names a node-modifier family that is retired, or one the
 *      biome BANS — either way the player can never accumulate that catalyst.
 *
 * This suite is a gate, not a balance check: it asserts reachability only, and says
 * nothing about whether the costs are right.
 */
import { RECIPE_DATABASE } from './recipes';
import { STANCE_RECIPE_DATABASE } from '../stanceRecipes';
import { RITE_RECIPE_DATABASE } from '../riteRecipes';
import { RUNE_RECIPE_DATABASE } from '../runeRecipes';
import { ABILITY_RECIPE_DATABASE } from '../abilityRecipes';
import { biomeLevelCap } from '../config/gameConfig';
import { NODE_BIOMES } from '../world/nodeBiomes';
import {
  MODIFIER_BANS,
  NODE_MODIFIER_FAMILIES,
  type NodeModifierFamily,
} from '../world/nodeModifierTypes';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

/** Tiers each biome group actually has nodes at, straight from the authored world. */
const TIERS_BY_GROUP = new Map<string, Set<number>>();
for (const info of Object.values(NODE_BIOMES)) {
  let tiers = TIERS_BY_GROUP.get(info.biomeGroup);
  if (!tiers) TIERS_BY_GROUP.set(info.biomeGroup, (tiers = new Set()));
  tiers.add(info.biomeTier);
}

const LIVE_FAMILIES = new Set<string>(NODE_MODIFIER_FAMILIES);

/**
 * Recipes known to sit in a biome that has retired by their own tier.
 *
 * EMPTY, and it should stay that way. Such a recipe is still craftable — a biome keeps
 * levelling past its last node band — but only by grinding content the player has already
 * outgrown, and the bill is brutal at the top: the Plains relic's level-24 gate cost about
 * 12,500 extra kills of T2 monsters at player tier 4. The 2026-08-22 passes re-homed all
 * eleven offenders (3 stances, 4 rites, 1 core, 3 relics).
 *
 * If you are adding an entry here, you are choosing to ship that grind. Prefer moving the
 * recipe to a biome that still has nodes at its tier.
 */
const RETIRED_BIOME_DEBT = new Set<string>([]);

interface GatedRecipe {
  id: string;
  tier?: number;
  recipeGroup?: string;
  requiredBiomeLevel?: number;
  catalystCost?: Partial<Record<string, number>>;
}

// Materialized, not left as `.values()` iterators: the debt-list audit at the bottom
// walks the same lists again, and an iterator is empty the second time round.
const DATABASES: [string, GatedRecipe[]][] = [
  ['item', [...RECIPE_DATABASE.values()] as GatedRecipe[]],
  ['stance', [...STANCE_RECIPE_DATABASE.values()]],
  ['rite', [...RITE_RECIPE_DATABASE.values()]],
  ['rune', [...RUNE_RECIPE_DATABASE.values()] as GatedRecipe[]],
  ['ability', [...ABILITY_RECIPE_DATABASE.values()] as GatedRecipe[]],
];

const problems: string[] = [];

for (const [kind, recipes] of DATABASES) {
  for (const recipe of recipes) {
    const group = recipe.recipeGroup;
    const where = `${kind} ${recipe.id}`;

    for (const family of Object.keys(recipe.catalystCost ?? {})) {
      if (!LIVE_FAMILIES.has(family)) {
        problems.push(`${where}: catalyst '${family}' is not a live node-modifier family`);
        continue;
      }
      if (group && (MODIFIER_BANS[group] ?? []).includes(family as NodeModifierFamily)) {
        problems.push(`${where}: catalyst '${family}' is banned in biome '${group}', so it can never drop there`);
      }
    }

    if (!group || recipe.tier === undefined) continue;

    // The clearing is a tutorial hub with its own flat cap, not a tiered biome.
    if (group !== 'clearing') {
      const tiers = TIERS_BY_GROUP.get(group);
      if (!tiers) {
        problems.push(`${where}: biome group '${group}' does not exist in the world map`);
      } else if (!tiers.has(recipe.tier) && !RETIRED_BIOME_DEBT.has(where)) {
        problems.push(
          `${where}: T${recipe.tier} recipe in '${group}', which only has nodes at tier(s) ${[...tiers].sort().join('/')}`,
        );
      }
    }

    if (recipe.requiredBiomeLevel !== undefined) {
      const cap = biomeLevelCap(recipe.tier, group);
      if (recipe.requiredBiomeLevel > cap) {
        problems.push(
          `${where}: requires ${group} level ${recipe.requiredBiomeLevel}, but the cap at T${recipe.tier} is ${cap}`,
        );
      }
    }
  }
}

assert(problems.length === 0, `unreachable recipes:\n  ${problems.join('\n  ')}`);

// Guard the guard: if the collector ever stops finding recipes the suite passes
// vacuously, which is exactly how the original drift went unnoticed.
const counted = DATABASES.reduce((n, [, list]) => n + list.length, 0);
assert(counted > 100, `recipe collector found only ${counted} recipes — it is broken`);

// A fixed entry left on the debt list would stop protecting anything, so retire it.
for (const entry of RETIRED_BIOME_DEBT) {
  const [kind, id] = entry.split(' ');
  const list = DATABASES.find(([k]) => k === kind)?.[1];
  const recipe = list?.find((r) => r.id === id);
  assert(!!recipe, `RETIRED_BIOME_DEBT lists '${entry}', which no longer exists`);
  const tiers = TIERS_BY_GROUP.get(recipe!.recipeGroup ?? '');
  assert(
    !tiers || recipe!.tier === undefined || !tiers.has(recipe!.tier),
    `RETIRED_BIOME_DEBT lists '${entry}', which is no longer stale — remove the entry`,
  );
}

console.log('recipeGates.test.ts: ok');
