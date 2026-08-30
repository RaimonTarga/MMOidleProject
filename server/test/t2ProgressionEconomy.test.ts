import {
  RECIPE_DATABASE,
  ABILITY_RECIPE_DATABASE,
  RUNE_RECIPE_DATABASE,
  isRuneRecipeUnlocked,
  checkEvolve,
  checkReconstruct,
  requiredPlusFor,
  EVOLUTION_REQUIRED_PLUS,
  ESSENCE_TYPES,
} from "@mmo-idle/shared";
import type { EssenceType } from "@mmo-idle/shared";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

const emptyEssences = () =>
  Object.fromEntries(ESSENCE_TYPES.map((t) => [t, 0])) as Record<EssenceType, number>;
const fullEssences = () =>
  Object.fromEntries(ESSENCE_TYPES.map((t) => [t, 1_000_000])) as Record<EssenceType, number>;

// ─────────────────────────────────────────────────────────────────────────
// The returning-biome T2 lineage map (§5/§18/§19). Every entry here is a T2
// item that must now be an EVOLUTION of its same-slot T1 predecessor.
// ─────────────────────────────────────────────────────────────────────────
const RETURNING_BIOME_LINEAGES: Array<{ t1: string; t2: string }> = [
  { t1: "iron-broadsword", t2: "knight-steelsword" },
  { t1: "plains-vest-t1", t2: "plains-vest-t2" },
  { t1: "plains-charm-t1", t2: "plains-charm-t2" },
  { t1: "plains-boots-t1", t2: "plains-boots-t2" },
  { t1: "flash-rapier", t2: "gale-needle" },
  { t1: "flash-rapier", t2: "thorn-needle" },
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

// ── Evolution wiring ────────────────────────────────────────────────────────

assert(EVOLUTION_REQUIRED_PLUS === 5, "evolution now requires a +5 predecessor (was +3)");

for (const { t1, t2 } of RETURNING_BIOME_LINEAGES) {
  const predecessor = RECIPE_DATABASE.get(t1);
  const recipe = RECIPE_DATABASE.get(t2);
  assert(!!predecessor, `${t1}: predecessor recipe must exist`);
  assert(!!recipe, `${t2}: recipe must exist`);
  assert(recipe!.evolvesFrom === t1, `${t2}: must evolve from ${t1} (got ${recipe!.evolvesFrom})`);
  assert(requiredPlusFor(recipe!) === 5, `${t2}: evolution must require +5`);
}

for (const id of JUNGLE_DESERT_T2_IDS) {
  const recipe = RECIPE_DATABASE.get(id);
  assert(!!recipe, `${id}: recipe must exist`);
  assert(recipe!.evolvesFrom === undefined, `${id}: Jungle/Desert gear must NOT have a T1 predecessor`);
}

// Flash Rapier still branches into both Gale Needle and Thorn Needle.
assert(RECIPE_DATABASE.get("gale-needle")!.evolvesFrom === "flash-rapier", "gale-needle branches from flash-rapier");
assert(RECIPE_DATABASE.get("thorn-needle")!.evolvesFrom === "flash-rapier", "thorn-needle branches from flash-rapier");

// A +4 predecessor cannot evolve; a +5 predecessor can.
{
  const recipe = RECIPE_DATABASE.get("gale-needle")!;
  const notReady = checkEvolve({
    recipe,
    inventory: ["flash-rapier"],
    itemUpgrades: { "flash-rapier": 4 },
    essences: fullEssences(),
    catalysts: {},
  });
  assert(!notReady.ok, "gale-needle: a +4 flash-rapier must NOT be able to evolve");

  const ready = checkEvolve({
    recipe,
    inventory: ["flash-rapier"],
    itemUpgrades: { "flash-rapier": 5 },
    essences: fullEssences(),
    catalysts: {},
  });
  assert(ready.ok, "gale-needle: a +5 flash-rapier must be able to evolve");
}

// Reconstruction works with no predecessor at all, for both branches and for a
// plain returning-biome lineage.
for (const id of ["gale-needle", "thorn-needle", "knight-steelsword", "ruinous-axe"]) {
  const recipe = RECIPE_DATABASE.get(id)!;
  assert(!!recipe.reconstructCost, `${id}: must define a reconstruct path`);
  const check = checkReconstruct({ recipe, essences: fullEssences(), catalysts: { alacrity: 100, swarming: 100 } });
  assert(check.ok, `${id}: reconstruct must succeed with no predecessor and full wallets`);
}

// ── Catalyst economy (§2, §7, §8) ───────────────────────────────────────────

const WEAPON_ARMOR_SLOTS = new Set(["weapon", "armor"]);
const RECOVERY_MOBILITY_SLOTS = new Set(["recovery", "mobility"]);

// Every evolution's own evolve `catalystCost` must be empty/absent — evolution
// pays no catalyst (§7). This does not apply to reconstruct, which is checked
// separately below.
for (const { t2 } of RETURNING_BIOME_LINEAGES) {
  const recipe = RECIPE_DATABASE.get(t2)!;
  const catalystKeys = Object.keys(recipe.catalystCost ?? {});
  assert(catalystKeys.length === 0, `${t2}: evolve cost must not require a catalyst (found ${catalystKeys})`);
}

// Jungle/Desert base crafts must also be catalyst-free (§2).
for (const id of JUNGLE_DESERT_T2_IDS) {
  const recipe = RECIPE_DATABASE.get(id)!;
  const catalystKeys = Object.keys(recipe.catalystCost ?? {});
  assert(catalystKeys.length === 0, `${id}: base craft must not require a catalyst (found ${catalystKeys})`);
}

// Reconstruction always costs exactly 2 catalyst units of one family.
for (const { t2 } of RETURNING_BIOME_LINEAGES) {
  const recipe = RECIPE_DATABASE.get(t2)!;
  if (!recipe.reconstructCatalystCost) continue; // knight-steelsword: documented neutral exception
  const total = Object.values(recipe.reconstructCatalystCost).reduce((a, b) => a + (b ?? 0), 0);
  assert(total === 2, `${t2}: reconstruct must cost exactly 2 catalyst units (got ${total})`);
}

// +4/+5 catalyst schedule on every T2 gear item with an explicit upgrade track.
const ALL_T2_GEAR_IDS = [...RETURNING_BIOME_LINEAGES.map((l) => l.t2), ...JUNGLE_DESERT_T2_IDS];
for (const id of ALL_T2_GEAR_IDS) {
  const recipe = RECIPE_DATABASE.get(id)!;
  if (!recipe.upgrades || recipe.upgrades.length !== 5) continue;
  const [u1, u2, u3, u4, u5] = recipe.upgrades;
  for (const [step, label] of [[u1, "+1"], [u2, "+2"], [u3, "+3"]] as const) {
    assert(!step.catalystCost, `${id} ${label}: must not require a catalyst`);
  }
  if (WEAPON_ARMOR_SLOTS.has(recipe.slot)) {
    const c4 = Object.values(u4.catalystCost ?? {}).reduce((a, b) => a + (b ?? 0), 0);
    const c5 = Object.values(u5.catalystCost ?? {}).reduce((a, b) => a + (b ?? 0), 0);
    if (id !== "knight-steelsword") {
      assert(c4 === 1, `${id} +4: weapon/armor must cost exactly 1 catalyst (got ${c4})`);
      assert(c5 === 2, `${id} +5: weapon/armor must cost exactly 2 catalysts (got ${c5})`);
    } else {
      assert(c4 === 0 && c5 === 0, "knight-steelsword: documented catalyst-neutral exception");
    }
  } else if (RECOVERY_MOBILITY_SLOTS.has(recipe.slot)) {
    assert(!u4.catalystCost, `${id} +4: recovery/mobility must not require a catalyst`);
    const c5 = Object.values(u5.catalystCost ?? {}).reduce((a, b) => a + (b ?? 0), 0);
    assert(c5 === 1, `${id} +5: recovery/mobility must cost exactly 1 catalyst (got ${c5})`);
  }
}

// ── Upgrade economy (§3, §17, §19) ─────────────────────────────────────────

function essenceSum(cost: Partial<Record<EssenceType, number>> | undefined): number {
  return Object.values(cost ?? {}).reduce((a, b) => a + (b ?? 0), 0);
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

// Gale Needle / Thorn Needle normalization (§4): off the old ~1,920 doubling
// curve, into the specialist-weapon band.
{
  const gale = RECIPE_DATABASE.get("gale-needle")!;
  const galeTotal = essenceSum(gale.cost) + gale.upgrades!.reduce((a, u) => a + essenceSum(u.cost), 0);
  assert(galeTotal >= 900 && galeTotal <= 1100, `gale-needle total should land near 1,000 (got ${galeTotal})`);

  const thorn = RECIPE_DATABASE.get("thorn-needle")!;
  const thornTotal = essenceSum(thorn.cost) + thorn.upgrades!.reduce((a, u) => a + essenceSum(u.cost), 0);
  assert(thornTotal >= 1050 && thornTotal <= 1150, `thorn-needle total should land in 1,050-1,150 (got ${thornTotal})`);
}

// ── Techniques / Guards (§10) ───────────────────────────────────────────────

const ABILITY_COSTS: Record<string, { color: EssenceType; amount: number; level: number; group: string }> = {
  "ability-recipe-hamstring": { color: "green", amount: 70, level: 3, group: "jungle" },
  "ability-recipe-charge": { color: "yellow", amount: 70, level: 3, group: "desert" },
  "ability-recipe-bramble-guard": { color: "green", amount: 90, level: 5, group: "jungle" },
  "ability-recipe-endure": { color: "yellow", amount: 90, level: 5, group: "desert" },
};
for (const [id, spec] of Object.entries(ABILITY_COSTS)) {
  const recipe = ABILITY_RECIPE_DATABASE.get(id);
  assert(!!recipe, `${id}: recipe must exist`);
  assert(recipe!.cost[spec.color] === spec.amount, `${id}: cost must be ${spec.amount} ${spec.color} (got ${JSON.stringify(recipe!.cost)})`);
  assert(!recipe!.catalystCost, `${id}: must not require a catalyst`);
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
  assert(!recipe!.catalystCost, `${spec.id}: must not require a catalyst`);

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
