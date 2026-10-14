import {
  RECIPE_DATABASE,
  ABILITY_RECIPE_DATABASE,
  RUNE_RECIPE_DATABASE,
  STANCE_RECIPE_DATABASE,
  isRuneRecipeUnlocked,
  ESSENCE_TYPES,
} from "@mmo-idle/shared";
import type { EssenceType } from "@mmo-idle/shared";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

const emptyEssences = () =>
  Object.fromEntries(ESSENCE_TYPES.map((t) => [t, 0])) as Record<EssenceType, number>;

// ─────────────────────────────────────────────────────────────────────────
// The returning-biome T2 map (§5/§18/§19): each T2 item and the same-slot T1
// item it follows. Every T2 is a plain recipe: armour, charm and boots since
// design §24.5, weapons since their lineage trees went (class-first rework D1).
// ─────────────────────────────────────────────────────────────────────────
const RETURNING_BIOME_T2S: Array<{ t1: string; t2: string }> = [
  { t1: "iron-broadsword", t2: "knight-steelsword" },
  { t1: "plains-vest-t1", t2: "plains-vest-t2" },
  { t1: "plains-charm-t1", t2: "plains-charm-t2" },
  { t1: "plains-boots-t1", t2: "plains-boots-t2" },
  { t1: "flash-rapier", t2: "gale-needle" },
  { t1: "forest-vest-t1", t2: "forest-vest-t2" },
  { t1: "forest-charm-t1", t2: "forest-charm-t2" },
  { t1: "forest-boots-t1", t2: "forest-boots-t2" },
  { t1: "ashbrand-blade", t2: "swamp-mirebrand" },
  { t1: "swamp-vest-t1", t2: "swamp-vest-t2" },
  { t1: "swamp-charm-t1", t2: "swamp-charm-t2" },
  { t1: "swamp-boots-t1", t2: "swamp-boots-t2" },
  { t1: "heavy-hammer", t2: "quake-hammer" },
  { t1: "mountain-vest-t1", t2: "mountain-vest-t2" },
  { t1: "mountain-charm-t1", t2: "mountain-charm-t2" },
  { t1: "mountain-boots-t1", t2: "mountain-boots-t2" },
  { t1: "chaotic-axe", t2: "ruinous-axe" },
  { t1: "cave-vest-t1", t2: "cave-vest-t2" },
  { t1: "cave-charm-t1", t2: "cave-charm-t2" },
  { t1: "cave-boots-t1", t2: "cave-boots-t2" },
];

const JUNGLE_DESERT_T2_IDS = [
  "jungle-stinger-rapier", "jungle-vest-t2", "jungle-charm-t2", "jungle-boots-t2",
  "desert-sunsteel-cross", "desert-vest-t2", "desert-charm-t2", "desert-boots-t2",
];

// ── The T2 graph ─────────────────────────────────────────────────────────────

for (const { t1, t2 } of RETURNING_BIOME_T2S) {
  const predecessor = RECIPE_DATABASE.get(t1);
  const recipe = RECIPE_DATABASE.get(t2);
  assert(!!predecessor, `${t1}: predecessor recipe must exist`);
  assert(!!recipe, `${t2}: recipe must exist`);
  assert(predecessor!.slot === recipe!.slot, `${t2}: follows a same-slot T1 item`);
}

for (const id of JUNGLE_DESERT_T2_IDS) {
  assert(RECIPE_DATABASE.has(id), `${id}: recipe must exist`);
}

// Gale Needle's old on-hit sibling, Thorn Needle, was retired 2026-09-26 (it
// duplicated the Jungle Stinger Rapier).
assert(!RECIPE_DATABASE.has("thorn-needle"), "thorn-needle is retired");

// ── Catalyst economy (§2, §7, §8) ───────────────────────────────────────────
// RETIRED (Phase 2b): the catalyst wallet and every `catalystCost`/
// `reconstructCatalystCost` field are gone, and so are the evolve and
// reconstruct paths that spent them. Nothing left here to audit.

const ALL_T2_GEAR_IDS = [...RETURNING_BIOME_T2S.map((l) => l.t2), ...JUNGLE_DESERT_T2_IDS];

// ── Upgrade economy (§3, §17, §19) ─────────────────────────────────────────

function essenceSum(cost: Partial<Record<EssenceType, number>> | undefined): number {
  return Object.values(cost ?? {}).reduce((a, b) => a + (b ?? 0), 0);
}

function normalizedCost(cost: Partial<Record<string, number>> | undefined): string {
  return JSON.stringify(Object.entries(cost ?? {}).sort(([a], [b]) => a.localeCompare(b)));
}

type T2RewardSpec = {
  id: string;
  group: string;
  level: number;
  cost: Record<string, number>;
  essenceBand: readonly [number, number];
};

const T2_STANCE_REWARDS: T2RewardSpec[] = [
  { id: "stance-recipe-offensive", group: "plains", level: 7, cost: { yellow: 60 }, essenceBand: [50, 70] },
  { id: "stance-recipe-defensive", group: "plains", level: 7, cost: { yellow: 60 }, essenceBand: [50, 70] },
  { id: "stance-recipe-fleeting", group: "swamp", level: 8, cost: { purple: 110 }, essenceBand: [90, 120] },
];

const T2_CORE_REWARDS: T2RewardSpec[] = [
  { id: "core-tempered", group: "cave", level: 12, cost: { red: 500 }, essenceBand: [450, 600] },
  { id: "core-survivalist", group: "jungle", level: 6, cost: { green: 500 }, essenceBand: [450, 600] },
  { id: "core-force", group: "desert", level: 6, cost: { yellow: 500 }, essenceBand: [450, 600] },
];

for (const spec of T2_STANCE_REWARDS) {
  const recipe = STANCE_RECIPE_DATABASE.get(spec.id);
  assert(!!recipe, `${spec.id}: stance recipe must exist`);
  assert(recipe!.tier === 2, `${spec.id}: must stay tier 2`);
  assert(recipe!.recipeGroup === spec.group, `${spec.id}: biome gate must be ${spec.group}`);
  assert(recipe!.requiredBiomeLevel === spec.level, `${spec.id}: unlock level must be ${spec.group} L${spec.level}`);
  assert(normalizedCost(recipe!.cost) === normalizedCost(spec.cost), `${spec.id}: essence cost changed unexpectedly`);
  assert(!recipe!.requiredBossClear, `${spec.id}: must not require a boss clear`);
  const total = essenceSum(recipe!.cost);
  assert(total >= spec.essenceBand[0] && total <= spec.essenceBand[1], `${spec.id}: stance essence total is outside its band`);
}

for (const spec of T2_CORE_REWARDS) {
  const recipe = RECIPE_DATABASE.get(spec.id);
  assert(!!recipe, `${spec.id}: core recipe must exist`);
  assert(recipe!.tier === 2, `${spec.id}: must stay tier 2`);
  assert(recipe!.recipeGroup === spec.group, `${spec.id}: biome gate must be ${spec.group}`);
  assert(recipe!.requiredBiomeLevel === spec.level, `${spec.id}: unlock level must be ${spec.group} L${spec.level}`);
  assert(normalizedCost(recipe!.cost) === normalizedCost(spec.cost), `${spec.id}: essence cost changed unexpectedly`);
  assert(!recipe!.requiredBossClear, `${spec.id}: must not require a boss clear`);
  const total = essenceSum(recipe!.cost);
  assert(total >= spec.essenceBand[0] && total <= spec.essenceBand[1], `${spec.id}: core essence total is outside its band`);
}

for (const id of ALL_T2_GEAR_IDS) {
  const recipe = RECIPE_DATABASE.get(id)!;
  if (!recipe.upgrades || recipe.upgrades.length !== 5) continue;
  const steps = recipe.upgrades.map((u) => essenceSum(u.cost));
  // Non-decreasing and meaningfully accelerating: each step at least as large as
  // the previous, and +5 strictly larger than +1 (the curve must actually climb).
  for (let i = 1; i < steps.length; i++) {
    assert(steps[i] >= steps[i - 1], `${id}: upgrade cost must not decrease from +${i} to +${i + 1}`);
  }
  assert(steps[4] > steps[0], `${id}: +5 must cost strictly more than +1 (accelerating curve)`);
  const postBase = steps.reduce((a, b) => a + b, 0);
  const plus4and5Share = (steps[3] + steps[4]) / postBase;
  assert(
    plus4and5Share >= 0.65,
    `${id}: +4/+5 must hold at least 65% of post-base spend (got ${(plus4and5Share * 100).toFixed(1)}%)`,
  );
}

// ── Techniques / Guards (§10) ───────────────────────────────────────────────

const ABILITY_COSTS: Record<string, { color: EssenceType; amount: number; level: number; group: string }> = {
  // The ability pass (design §22.2, §22.8) re-homed Binding Strike and Snipe into
  // the cut Hamstring's and the moved Charge's slots, at those slots' prices.
  "ability-recipe-binding-strike": { color: "green", amount: 70, level: 3, group: "jungle" },
  "ability-recipe-snipe": { color: "yellow", amount: 70, level: 3, group: "desert" },
  "ability-recipe-bramble-guard": { color: "green", amount: 90, level: 5, group: "jungle" },
  "ability-recipe-endure": { color: "yellow", amount: 90, level: 5, group: "desert" },
};
for (const [id, spec] of Object.entries(ABILITY_COSTS)) {
  const recipe = ABILITY_RECIPE_DATABASE.get(id);
  assert(!!recipe, `${id}: recipe must exist`);
  assert(recipe!.cost[spec.color] === spec.amount, `${id}: cost must be ${spec.amount} ${spec.color} (got ${JSON.stringify(recipe!.cost)})`);
  assert(recipe!.requiredBiomeLevel === spec.level, `${id}: unlock level must stay at ${spec.group} L${spec.level}`);
  assert(recipe!.recipeGroup === spec.group, `${id}: biome gate must stay ${spec.group}`);
}

// ── Runes (§11, §19) ─────────────────────────────────────────────────────────

const SWAMP_T2_RUNES: Array<{ id: string; level: number; cost: number }> = [
  { id: "rune-recipe-surrounded", level: 7, cost: 70 },
  { id: "rune-recipe-focus-lowest-hp", level: 8, cost: 90 },
  { id: "rune-recipe-let-dots-finish", level: 9, cost: 90 },
  { id: "rune-recipe-spread-dots", level: 10, cost: 120 },
];
for (const spec of SWAMP_T2_RUNES) {
  const recipe = RUNE_RECIPE_DATABASE.get(spec.id);
  assert(!!recipe, `${spec.id}: recipe must exist`);
  assert(recipe!.tier === 2, `${spec.id}: must stay tier 2`);
  assert(recipe!.recipeGroup === "swamp", `${spec.id}: must stay in swamp`);
  assert(recipe!.requiredBiomeLevel === spec.level, `${spec.id}: must unlock at L${spec.level} (got ${recipe!.requiredBiomeLevel})`);
  assert(recipe!.cost.purple === spec.cost, `${spec.id}: cost must be ${spec.cost} purple (got ${JSON.stringify(recipe!.cost)})`);

  // Cannot unlock anywhere in Swamp's T1 band (levels 1-6).
  const lockedAtT1Cap = isRuneRecipeUnlocked(recipe!, { biomeLevel: { swamp: 6 }, bossesCleared: [] });
  assert(!lockedAtT1Cap, `${spec.id}: must NOT be reachable at swamp level 6 (T1 band)`);

  // Unlocks exactly at its own level, not before.
  const oneShort = isRuneRecipeUnlocked(recipe!, { biomeLevel: { swamp: spec.level - 1 }, bossesCleared: [] });
  assert(!oneShort, `${spec.id}: must not unlock one level early (swamp ${spec.level - 1})`);
  const atLevel = isRuneRecipeUnlocked(recipe!, { biomeLevel: { swamp: spec.level }, bossesCleared: [] });
  assert(atLevel, `${spec.id}: must unlock at swamp level ${spec.level}`);
}

console.log("t2ProgressionEconomy: ok");
