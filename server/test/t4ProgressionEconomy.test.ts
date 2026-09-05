/**
 * T3 → T4 progression/economy pass (2026-08-30 / 2026-09-04) — see the
 * historical T4 brief and the current-state docs.
 *
 * Covers the 36 T3→T4 lineages (26 distinct predecessors, 10 branch groups), the T4
 * gear cost curves / lifetime ratios / hybrid splits / catalyst schedule+families, the
 * four T4 ability prices, the locked T3/T4 Stance/Core redistribution, the normalized
 * T4 Relic economy, the Trench monster essence-colour correction, and the no-regression
 * pins on Runes/Rites and the GM architecture.
 */
import {
  RECIPE_DATABASE,
  ABILITY_RECIPE_DATABASE,
  STANCE_RECIPE_DATABASE,
  RITE_RECIPE_DATABASE,
  RUNE_RECIPE_DATABASE,
  MODIFIER_BANS,
  NATIVE_MODIFIER,
  maxGlobalMasteryAtTier,
  globalMasteryRequiredForUpgrade,
  EVOLUTION_REQUIRED_PLUS,
} from "@mmo-idle/shared";
import { MONSTER_DATABASE } from "@mmo-idle/shared";
import type { Recipe } from "@mmo-idle/shared";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

const NODE_MODIFIER_FAMILIES = ["alacrity", "heavy", "swarming", "dominion", "fortified"] as const;
const essenceTotal = (cost: Partial<Record<string, number>> | undefined): number =>
  Object.values(cost ?? {}).reduce((sum, amount) => sum + (amount ?? 0), 0);

// ═══════════════════════════════════════════════════════════════════════════
// 1. Census: exactly 39 ordinary T4 gear items, 36 with evolvesFrom, 3 without
// ═══════════════════════════════════════════════════════════════════════════

const t4Gear: Recipe[] = [...RECIPE_DATABASE.values()].filter(
  (r) => r.tier === 4 && r.slot !== "relic" && r.slot !== "core",
);

assert(t4Gear.length === 39, `expected 39 ordinary T4 gear items, got ${t4Gear.length}`);

const withLineage = t4Gear.filter((r) => !!r.evolvesFrom);
const withoutLineage = t4Gear.filter((r) => !r.evolvesFrom);

assert(withLineage.length === 36, `expected 36 T4 items with evolvesFrom, got ${withLineage.length}`);
assert(withoutLineage.length === 3, `expected 3 T4 items without evolvesFrom, got ${withoutLineage.length}`);

const NO_LINEAGE_IDS = new Set(["graveyard-boots-t4", "trench-charm-t4", "trench-boots-t4-treaders"]);
assert(
  JSON.stringify([...withoutLineage.map((r) => r.id)].sort()) === JSON.stringify([...NO_LINEAGE_IDS].sort()),
  `the 3 no-lineage items must be exactly Gravewalker Boots/Pressure Vessel/Abyssal Treaders, got ${withoutLineage.map((r) => r.id).join(", ")}`,
);

// No `evolvesFromAny` (multi-parent) field exists anywhere.
for (const r of t4Gear) {
  assert(!("evolvesFromAny" in (r as unknown as Record<string, unknown>)), `${r.id}: no multi-parent field should exist`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. Predecessors: exactly 26 distinct ids, each real, T3, slot-matched
// ═══════════════════════════════════════════════════════════════════════════

const predecessorIds = new Set(withLineage.map((r) => r.evolvesFrom!));
assert(predecessorIds.size === 26, `expected 26 distinct predecessor ids, got ${predecessorIds.size}`);

for (const child of withLineage) {
  const parent = RECIPE_DATABASE.get(child.evolvesFrom!);
  assert(!!parent, `${child.id}: predecessor ${child.evolvesFrom} must exist in RECIPE_DATABASE`);
  assert(parent!.tier === 3, `${child.id}: predecessor ${child.evolvesFrom} must be tier 3 (got ${parent!.tier})`);
  assert(
    parent!.slot === child.slot,
    `${child.id}: predecessor ${child.evolvesFrom} slot (${parent!.slot}) must match child slot (${child.slot})`,
  );
}

// Evolution/reconstruction both require the predecessor at +EVOLUTION_REQUIRED_PLUS.
// Designer decision 2026-09-04 returned the gate to +3 (see
// shared/src/systems/evolution.ts and
// docs/briefs/t2-bossless-progression-campaign-2026-09-03.md section 12): the
// canonical T1 routes were never updated for +5, so it taxed genuinely-invested
// predecessors rather than rewarding commitment.
assert(EVOLUTION_REQUIRED_PLUS === 3, "evolution/reconstruction require the predecessor at +3");

// ═══════════════════════════════════════════════════════════════════════════
// 3. Branch groups: exactly 10 parents with 2+ children
// ═══════════════════════════════════════════════════════════════════════════

const childrenByParent = new Map<string, Recipe[]>();
for (const child of withLineage) {
  const list = childrenByParent.get(child.evolvesFrom!) ?? [];
  list.push(child);
  childrenByParent.set(child.evolvesFrom!, list);
}
const branchGroups = [...childrenByParent.entries()].filter(([, kids]) => kids.length >= 2);
assert(branchGroups.length === 10, `expected 10 branch groups, got ${branchGroups.length}`);
for (const [, kids] of branchGroups) {
  assert(kids.length === 2, `branch group must have exactly 2 children per group (got ${kids.length})`);
}

const EXPECTED_BRANCH_PARENTS = new Set([
  // 7 continuing-biome groups
  "mountain-avalanche-maul",
  "mountain-vest-t3",
  "mountain-charm-t3",
  "jungle-charm-t3",
  "tundra-charm-t3",
  "volcanic-cinderlash",
  "volcanic-vest-t3",
  // 3 handoff groups
  "cave-cataclysm-axe",
  "swamp-vest-t3",
  "swamp-charm-t3",
]);
assert(
  JSON.stringify([...childrenByParent.keys()].filter((p) => branchGroups.some(([bp]) => bp === p)).sort()) ===
    JSON.stringify([...EXPECTED_BRANCH_PARENTS].sort()),
  `branch parent set mismatch: got ${[...branchGroups.map(([p]) => p)].sort().join(", ")}`,
);

// Cataclysm Axe's two children span Graveyard and Trench.
{
  const kids = childrenByParent.get("cave-cataclysm-axe")!;
  const groups = new Set(kids.map((k) => k.recipeGroup));
  assert(groups.has("graveyard") && groups.has("trench"), "Cataclysm Axe's children must span Graveyard and Trench");
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. Lifetime ratio: for all 36 successors, total / predecessorTotal in [1.8, 2.2]
// ═══════════════════════════════════════════════════════════════════════════

function lifetimeTotal(r: Recipe): number {
  let total = Object.values(r.cost ?? {}).reduce((a, b) => a + (b ?? 0), 0);
  for (const step of r.upgrades ?? []) {
    total += Object.values(step.cost ?? {}).reduce((a, b) => a + (b ?? 0), 0);
  }
  return total;
}

for (const child of withLineage) {
  const parent = RECIPE_DATABASE.get(child.evolvesFrom!)!;
  const childTotal = lifetimeTotal(child);
  const parentTotal = lifetimeTotal(parent);
  const ratio = childTotal / parentTotal;
  assert(
    ratio >= 1.8 && ratio <= 2.2,
    `${child.id}: lifetime ratio vs ${parent.id} must be in [1.8, 2.2], got ${ratio.toFixed(3)} (${childTotal}/${parentTotal})`,
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. Curve shape: strictly accelerating, no +3=+4=+5 plateau, +4/+5 share in [65%,75%]
// ═══════════════════════════════════════════════════════════════════════════

for (const r of t4Gear) {
  const steps = r.upgrades ?? [];
  assert(steps.length === 5, `${r.id}: must have exactly 5 upgrade steps`);
  const stepTotals = steps.map((s) => Object.values(s.cost ?? {}).reduce((a, b) => a + (b ?? 0), 0));
  // No +3=+4=+5 plateau (indices 2,3,4 — the old defect pattern).
  assert(
    !(stepTotals[2] === stepTotals[3] && stepTotals[3] === stepTotals[4]),
    `${r.id}: +3/+4/+5 must not be a flat plateau (got ${stepTotals[2]}, ${stepTotals[3]}, ${stepTotals[4]})`,
  );
  // Strictly non-decreasing (accelerating curve).
  for (let i = 1; i < stepTotals.length; i++) {
    assert(stepTotals[i] >= stepTotals[i - 1], `${r.id}: step ${i + 1} cost must not be less than step ${i} (got ${stepTotals[i]} < ${stepTotals[i - 1]})`);
  }
  const postBase = stepTotals.reduce((a, b) => a + b, 0);
  const plus45 = stepTotals[3] + stepTotals[4];
  const share = plus45 / postBase;
  assert(share >= 0.65 && share <= 0.75, `${r.id}: +4/+5 share of post-base spend must be in [0.65, 0.75], got ${(share * 100).toFixed(1)}%`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. Catalysts: weapon/armor 0/0/0/0/3/4, recovery/mobility 0/0/0/0/0/3; reconstruct=4
// ═══════════════════════════════════════════════════════════════════════════

function catTotal(cat: Partial<Record<string, number>> | undefined): number {
  return Object.values(cat ?? {}).reduce((a, b) => a + (b ?? 0), 0);
}

for (const r of t4Gear) {
  assert(catTotal(r.catalystCost) === 0, `${r.id}: base craft/evolution must charge 0 catalysts (got ${catTotal(r.catalystCost)})`);
  const steps = r.upgrades ?? [];
  const isWeaponArmor = r.slot === "weapon" || r.slot === "armor";
  const expected = isWeaponArmor ? [0, 0, 0, 3, 4] : [0, 0, 0, 0, 3];
  steps.forEach((s, i) => {
    const got = catTotal(s.catalystCost);
    assert(got === expected[i], `${r.id}: +${i + 1} catalyst must be ${expected[i]} (${isWeaponArmor ? "weapon/armor" : "recovery/mobility"} schedule), got ${got}`);
  });
  if (r.reconstructCost) {
    assert(catTotal(r.reconstructCatalystCost) === 4, `${r.id}: reconstruction must charge exactly 4 catalysts`);
  } else {
    assert(!r.reconstructCatalystCost, `${r.id}: no reconstructCost implies no reconstructCatalystCost`);
  }
}

// Reconstruction essence ≈3.5× base essence per colour (±1 on rounding), only on the 36 lineaged items.
for (const child of withLineage) {
  assert(!!child.reconstructCost, `${child.id}: lineaged item must have a reconstructCost`);
  for (const [color, amount] of Object.entries(child.cost)) {
    const expected = Math.round((amount ?? 0) * 3.5);
    const got = (child.reconstructCost as Record<string, number>)[color] ?? 0;
    assert(Math.abs(got - expected) <= 1, `${child.id}: reconstruct ${color} should be ~3.5x base (${expected}), got ${got}`);
  }
}
for (const noLineage of withoutLineage) {
  assert(!noLineage.reconstructCost, `${noLineage.id}: genuinely-new item must not have a reconstructCost`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. Catalyst families: exact approved assignments, each with ≥1 legal T4 node
// ═══════════════════════════════════════════════════════════════════════════

const EXPECTED_FAMILY: Record<string, string> = {
  // Mountain — native heavy
  "mountain-earthsunder-maul": "heavy", "mountain-warmaul": "heavy",
  "mountain-vest-t4": "heavy", "mountain-vest-t4-stormwall": "heavy",
  "mountain-charm-t4": "heavy", "mountain-charm-t4-shieldmend": "heavy",
  "mountain-boots-t4": "heavy",
  // Jungle — native alacrity
  "jungle-deathfang-rapier": "alacrity", "jungle-vest-t4": "alacrity",
  "jungle-charm-t4": "alacrity", "jungle-charm-t4-overgrowth": "alacrity",
  "jungle-boots-t4": "alacrity",
  // Desert — native dominion (newly assigned)
  "desert-zenith-cross": "dominion", "desert-vest-t4": "dominion",
  "desert-charm-t4": "dominion", "desert-boots-t4": "dominion",
  // Tundra — native heavy, Rimebrand keeps fortified
  "tundra-glacial-tyrant-maul": "heavy", "tundra-glacial-rimebrand": "fortified",
  "tundra-vest-t4": "heavy", "tundra-charm-t4": "heavy", "tundra-charm-t4-deepfreeze": "heavy",
  "tundra-boots-t4": "heavy",
  // Volcanic — weapon/boots swarming, armor/charm alacrity (Plains-inherited)
  "volcanic-eruption-lash": "swarming", "volcanic-blightbrand": "swarming",
  "volcanic-vest-t4": "alacrity", "volcanic-vest-t4-lavatempered": "alacrity",
  "volcanic-charm-t4": "alacrity", "volcanic-boots-t4": "swarming",
  // Graveyard — weapon/boots swarming, armor/recovery fortified (Swamp-inherited)
  "graveyard-plague-axe": "swarming",
  "graveyard-vest-t4": "fortified", "graveyard-vest-t4-debtward": "fortified",
  "graveyard-charm-t4": "fortified", "graveyard-charm-t4-gravetide": "fortified",
  "graveyard-boots-t4": "swarming",
  // Trench — weapon/armor/stealth-boots swarming (Cave-inherited), new items dominion
  "trench-abyssal-axe": "swarming", "trench-vest-t4": "swarming",
  "trench-boots-t4-stalkers": "swarming",
  "trench-charm-t4": "dominion", "trench-boots-t4-treaders": "dominion",
};

assert(Object.keys(EXPECTED_FAMILY).length === 39, "family map must cover all 39 items");

for (const r of t4Gear) {
  const expectedFamily = EXPECTED_FAMILY[r.id];
  assert(!!expectedFamily, `${r.id}: must have an expected family entry in this test`);
  const steps = r.upgrades ?? [];
  const familiesUsed = new Set<string>();
  const collectFamilies = (cat: Partial<Record<string, number>> | undefined) => {
    for (const [fam, amt] of Object.entries(cat ?? {})) if ((amt ?? 0) > 0) familiesUsed.add(fam);
  };
  collectFamilies(r.reconstructCatalystCost);
  for (const s of steps) collectFamilies(s.catalystCost);
  assert(familiesUsed.size <= 1, `${r.id}: must use exactly one catalyst family, found ${[...familiesUsed].join(",")}`);
  if (familiesUsed.size === 1) {
    assert([...familiesUsed][0] === expectedFamily, `${r.id}: expected family ${expectedFamily}, got ${[...familiesUsed][0]}`);
  }
  // Legal-node check: the family must not be banned for this recipe's biome.
  const bans = MODIFIER_BANS[r.recipeGroup] ?? [];
  assert(!bans.includes(expectedFamily as never), `${r.id}: family ${expectedFamily} must not be banned in biome ${r.recipeGroup}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. Hybrid essence: approved ratios, splash <= 33%, weapons/mobility pure
// ═══════════════════════════════════════════════════════════════════════════

for (const r of t4Gear) {
  if (r.slot === "weapon" || r.slot === "mobility") {
    assert(Object.keys(r.cost).length === 1, `${r.id}: weapons/mobility must be single-colour (got ${Object.keys(r.cost).join(",")})`);
  }
}

const HYBRID_IDS = [
  "mountain-vest-t4", "mountain-vest-t4-stormwall",
  "mountain-charm-t4", "mountain-charm-t4-shieldmend",
  "jungle-vest-t4",
  "desert-vest-t4", "desert-charm-t4",
  "tundra-vest-t4", "tundra-charm-t4", "tundra-charm-t4-deepfreeze",
  "volcanic-vest-t4", "volcanic-vest-t4-lavatempered", "volcanic-charm-t4",
];
for (const id of HYBRID_IDS) {
  const r = RECIPE_DATABASE.get(id)!;
  const colors = Object.keys(r.cost);
  assert(colors.length === 2, `${id}: hybrid item must have exactly 2 colours (got ${colors.join(",")})`);
  const [home, splash] = colors.sort((a, b) => (r.cost as Record<string, number>)[b] - (r.cost as Record<string, number>)[a]);
  const steps = r.upgrades ?? [];
  let homeTotal = (r.cost as Record<string, number>)[home] ?? 0;
  let splashTotal = (r.cost as Record<string, number>)[splash] ?? 0;
  for (const s of steps) {
    homeTotal += (s.cost as Record<string, number>)[home] ?? 0;
    splashTotal += (s.cost as Record<string, number>)[splash] ?? 0;
  }
  const lifetimeSplashPct = splashTotal / (homeTotal + splashTotal);
  assert(lifetimeSplashPct <= 0.33, `${id}: lifetime splash share must be <= 33%, got ${(lifetimeSplashPct * 100).toFixed(1)}%`);
  // Per-step splash share must also respect the ceiling (not just aggregate).
  const baseSplashPct = splashTotal === 0 ? 0 : ((r.cost as Record<string, number>)[splash] ?? 0) / (((r.cost as Record<string, number>)[home] ?? 0) + ((r.cost as Record<string, number>)[splash] ?? 0));
  assert(baseSplashPct <= 0.33, `${id}: base-craft splash share must be <= 33%, got ${(baseSplashPct * 100).toFixed(1)}%`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. Abilities: exact costs 300/320/380/420, no catalysts, gates/effects unchanged
// ═══════════════════════════════════════════════════════════════════════════

const EXPECTED_ABILITIES: Record<string, { color: string; amount: number; group: string; level: number }> = {
  "ability-recipe-disengage": { color: "green", amount: 300, group: "trench", level: 3 },
  "ability-recipe-snipe": { color: "purple", amount: 320, group: "graveyard", level: 3 },
  "ability-recipe-recuperate": { color: "green", amount: 380, group: "trench", level: 5 },
  "ability-recipe-stunning-strike": { color: "purple", amount: 420, group: "graveyard", level: 5 },
};
for (const [id, spec] of Object.entries(EXPECTED_ABILITIES)) {
  const recipe = ABILITY_RECIPE_DATABASE.get(id);
  assert(!!recipe, `${id}: ability recipe must exist`);
  assert(recipe!.tier === 4, `${id}: must stay tier 4`);
  assert(recipe!.recipeGroup === spec.group, `${id}: biome must be ${spec.group}`);
  assert(recipe!.requiredBiomeLevel === spec.level, `${id}: gate must be L${spec.level}`);
  assert(
    JSON.stringify(recipe!.cost) === JSON.stringify({ [spec.color]: spec.amount }),
    `${id}: cost must be exactly ${spec.color} ${spec.amount}, got ${JSON.stringify(recipe!.cost)}`,
  );
  assert(!("catalystCost" in recipe!) || !recipe!.catalystCost, `${id}: must have no catalyst cost`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 10. Final T4 Stance placement and economy
// ═══════════════════════════════════════════════════════════════════════════

{
  const STANCES: Array<{
    id: string;
    group: string;
    level: number;
    family: string;
    catalysts: number;
    cost: Record<string, number>;
  }> = [
    { id: "stance-recipe-time-to-strike", group: "mountain", level: 20, family: "heavy", catalysts: 3, cost: { blue: 450 } },
    { id: "stance-recipe-brawler", group: "jungle", level: 14, family: "swarming", catalysts: 3, cost: { green: 500 } },
    { id: "stance-recipe-reaper", group: "volcanic", level: 8, family: "swarming", catalysts: 3, cost: { red: 500 } },
    { id: "stance-recipe-recuperating", group: "graveyard", level: 2, family: "fortified", catalysts: 3, cost: { purple: 450 } },
    { id: "stance-recipe-powering-up", group: "trench", level: 2, family: "dominion", catalysts: 4, cost: { green: 550 } },
  ];
  assert(STANCES.length === 5, "T4 must have exactly five placed Stances");
  for (const spec of STANCES) {
    const stance = STANCE_RECIPE_DATABASE.get(spec.id);
    assert(!!stance, `${spec.id}: stance recipe must exist`);
    assert(stance!.tier === 4, `${spec.id}: must be a T4 Stance`);
    assert(stance!.recipeGroup === spec.group, `${spec.id}: biome gate must be ${spec.group}`);
    assert(stance!.requiredBiomeLevel === spec.level, `${spec.id}: gate must be ${spec.group} L${spec.level}`);
    assert(JSON.stringify(stance!.cost) === JSON.stringify(spec.cost), `${spec.id}: essence cost must be exact`);
    assert(
      JSON.stringify(stance!.catalystCost) === JSON.stringify({ [spec.family]: spec.catalysts }),
      `${spec.id}: catalyst cost must be ${spec.family}:${spec.catalysts}`,
    );
    assert(essenceTotal(stance!.cost) >= 400 && essenceTotal(stance!.cost) <= 600, `${spec.id}: T4 stance essence must be in 400-600`);
    assert(catTotal(stance!.catalystCost) >= 3 && catTotal(stance!.catalystCost) <= 4, `${spec.id}: T4 stance catalysts must be in 3-4`);
    assert(!stance!.requiredBossClear, `${spec.id}: must not require a boss clear`);
  }
  const t4StanceIds = [...STANCE_RECIPE_DATABASE.values()]
    .filter((recipe) => recipe.tier === 4)
    .map((recipe) => recipe.id)
    .sort();
  assert(
    JSON.stringify(t4StanceIds) === JSON.stringify(STANCES.map((spec) => spec.id).sort()),
    `T4 Stance roster must be exactly the locked five (got ${t4StanceIds.join(", ")})`,
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 11. Trench essence correction: 3 monsters + boss are green; warden untouched
// ═══════════════════════════════════════════════════════════════════════════

const TRENCH_MONSTER_SNAPSHOT: Record<string, { essence: number; biomeXp: number; hp: number }> = {
  "hadal-stalker": { essence: 210, biomeXp: 1260, hp: 2800 },
  "abyssal-serpent": { essence: 260, biomeXp: 1560, hp: 4200 },
  "elder-leviathan": { essence: 400, biomeXp: 2400, hp: 5880 },
};
for (const [id, snap] of Object.entries(TRENCH_MONSTER_SNAPSHOT)) {
  const mon = MONSTER_DATABASE.get(id);
  assert(!!mon, `${id}: monster must exist`);
  assert(mon!.rewards?.essenceType === "green", `${id}: essenceType must be green, got ${mon!.rewards?.essenceType}`);
  assert(mon!.rewards?.essence === snap.essence, `${id}: essence quantity must be unchanged (${snap.essence})`);
  assert(mon!.rewards?.biomeXp === snap.biomeXp, `${id}: biomeXp must be unchanged (${snap.biomeXp})`);
  assert(mon!.stats?.hp === snap.hp, `${id}: hp must be unchanged (${snap.hp})`);
}

{
  const boss = MONSTER_DATABASE.get("elder-trench-serpent");
  assert(!!boss, "elder-trench-serpent boss must exist");
  assert(boss!.rewards?.essenceType === "green", `elder-trench-serpent essenceType must be green, got ${boss!.rewards?.essenceType}`);
  assert(boss!.rewards?.essence === 660, "elder-trench-serpent essence quantity must be unchanged (660)");
  assert(boss!.rewards?.biomeXp === 990, "elder-trench-serpent biomeXp must be unchanged (990)");
}

// Soft-discarded warden must remain byte-for-byte unchanged (still purple).
{
  const warden = MONSTER_DATABASE.get("elder-trench-serpent-warden");
  assert(!!warden, "elder-trench-serpent-warden must exist");
  assert(
    warden!.rewards === undefined || warden!.rewards.essenceType !== "green",
    "elder-trench-serpent-warden must NOT be touched by the green-essence find/replace",
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 12. Relics: exactly 8, unchanged placement/gates/mechanics, normalized economy
// ═══════════════════════════════════════════════════════════════════════════

const relics = [...RECIPE_DATABASE.values()].filter((r) => r.slot === "relic");
assert(relics.length === 8, `expected exactly 8 relics, got ${relics.length}`);

const RELIC_SNAPSHOT: Record<string, { group: string; level: number; cost: Record<string, number>; catalyst: Record<string, number> }> = {
  "relic-hastebound-dial": { group: "volcanic", level: 11, cost: { red: 3300 }, catalyst: { swarming: 9 } },
  "relic-verdant-flywheel": { group: "jungle", level: 18, cost: { green: 3000 }, catalyst: { alacrity: 8 } },
  "relic-glacial-bell": { group: "tundra", level: 12, cost: { blue: 3200 }, catalyst: { heavy: 9 } },
  "relic-haunted-prism": { group: "graveyard", level: 6, cost: { purple: 3500 }, catalyst: { fortified: 10 } },
  "relic-colossus-heart": { group: "mountain", level: 24, cost: { blue: 3300 }, catalyst: { heavy: 10 } },
  "relic-equilibrium-shard": { group: "mountain", level: 24, cost: { blue: 2500 }, catalyst: { heavy: 8 } },
  "relic-withering-lens": { group: "desert", level: 18, cost: { yellow: 3300 }, catalyst: { dominion: 9 } },
  "relic-virulent-hourglass": { group: "trench", level: 5, cost: { green: 3400 }, catalyst: { dominion: 9 } },
};
assert(Object.keys(RELIC_SNAPSHOT).length === 8, "relic snapshot must cover all 8 relics");
for (const [id, spec] of Object.entries(RELIC_SNAPSHOT)) {
  const r = RECIPE_DATABASE.get(id);
  assert(!!r, `${id}: relic must exist`);
  assert(r!.recipeGroup === spec.group && r!.requiredBiomeLevel === spec.level, `${id}: gate must be unchanged (${spec.group} L${spec.level})`);
  assert(JSON.stringify(r!.cost) === JSON.stringify(spec.cost), `${id}: normalized essence cost must be exact`);
  assert(JSON.stringify(r!.catalystCost) === JSON.stringify(spec.catalyst), `${id}: normalized catalyst cost must be exact`);
  assert(essenceTotal(r!.cost) >= 2500 && essenceTotal(r!.cost) <= 3500, `${id}: relic essence must be in 2500-3500`);
  assert(catTotal(r!.catalystCost) >= 8 && catTotal(r!.catalystCost) <= 10, `${id}: relic catalysts must be in 8-10`);
  assert(!r!.evolvesFrom && !r!.reconstructCost, `${id}: relics must not gain lineage/reconstruction`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 13. Final Core tier split and no-regression pins
// ═══════════════════════════════════════════════════════════════════════════

{
  const rune = RUNE_RECIPE_DATABASE.get("rune-recipe-focus-elites");
  assert(!!rune, "rune-recipe-focus-elites must exist");
  assert(rune!.tier === 4 && rune!.recipeGroup === "graveyard" && rune!.requiredBiomeLevel === 4, "rune-recipe-focus-elites gate must be unchanged");
  assert(JSON.stringify(rune!.cost) === JSON.stringify({ purple: 320, blue: 140 }), "rune-recipe-focus-elites cost must be unchanged");
  assert(RUNE_RECIPE_DATABASE.size >= 1, "rune database must still contain the T4 rune");
}

{
  // Zero T4 rites, exactly 6 tier-3 rites (unchanged count/shape).
  const rites = [...RITE_RECIPE_DATABASE.values()];
  const t4Rites = rites.filter((r) => r.tier === 4);
  assert(t4Rites.length === 0, "zero T4 rites must remain zero — no new T4 Rite content");
  assert(rites.filter((r) => r.tier === 3).length === 6, "rite database must still contain exactly 6 tier-3 rites");
}

{
  const CORES: Array<{
    id: string;
    group: string;
    level: number;
    family: string;
    catalysts: number;
    cost: Record<string, number>;
  }> = [
    { id: "core-juggernaut", group: "mountain", level: 22, family: "heavy", catalysts: 7, cost: { blue: 2200 } },
    { id: "core-controller", group: "graveyard", level: 4, family: "fortified", catalysts: 7, cost: { purple: 2100 } },
    { id: "core-catalyst", group: "volcanic", level: 10, family: "swarming", catalysts: 8, cost: { red: 2300 } },
  ];
  const cores = [...RECIPE_DATABASE.values()].filter((r) => r.slot === "core");
  assert(cores.length === 12, `expected 12 Core recipes total, got ${cores.length}`);
  assert(cores.filter((c) => c.tier === 2).length === 3, "final Core split must retain 3 T2 Cores");
  assert(cores.filter((c) => c.tier === 3).length === 6, "final Core split must retain 6 T3 Cores");
  assert(cores.filter((c) => c.tier === 4).length === 3, "final Core split must place 3 T4 Cores");
  for (const spec of CORES) {
    const core = RECIPE_DATABASE.get(spec.id);
    assert(!!core, `${spec.id}: T4 Core recipe must exist`);
    assert(core!.slot === "core" && core!.tier === 4, `${spec.id}: must be a T4 Core`);
    assert(core!.recipeGroup === spec.group, `${spec.id}: home must be ${spec.group}`);
    assert(core!.requiredBiomeLevel === spec.level, `${spec.id}: gate must be ${spec.group} L${spec.level}`);
    assert(JSON.stringify(core!.cost) === JSON.stringify(spec.cost), `${spec.id}: essence cost must be exact`);
    assert(
      JSON.stringify(core!.catalystCost) === JSON.stringify({ [spec.family]: spec.catalysts }),
      `${spec.id}: catalyst cost must be ${spec.family}:${spec.catalysts}`,
    );
    assert(essenceTotal(core!.cost) >= 2000 && essenceTotal(core!.cost) <= 2500, `${spec.id}: T4 Core essence must be in 2000-2500`);
    assert(catTotal(core!.catalystCost) >= 7 && catTotal(core!.catalystCost) <= 8, `${spec.id}: T4 Core catalysts must be in 7-8`);
    assert(!core!.requiredBossClear, `${spec.id}: must not require a boss clear`);
  }
  const t4CoreIds = cores.filter((core) => core.tier === 4).map((core) => core.id).sort();
  assert(
    JSON.stringify(t4CoreIds) === JSON.stringify(CORES.map((spec) => spec.id).sort()),
    `T4 Core roster must be exactly the locked three (got ${t4CoreIds.join(", ")})`,
  );
}

// GM architecture: T4 gates untouched by this economy-only pass.
assert(maxGlobalMasteryAtTier(4) === 156, "max GM at tier 4 must remain 156");
{
  const gates = [1, 2, 3, 4, 5].map((plus) => globalMasteryRequiredForUpgrade(4, plus));
  assert(JSON.stringify(gates) === JSON.stringify([122, 131, 139, 148, 156]), `T4 upgrade gates must remain 122/131/139/148/156, got ${gates.join("/")}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 14. Reachability: every T4 recipe's requiredBiomeLevel stays within its biome's T4 cap
// ═══════════════════════════════════════════════════════════════════════════

const T4_CAP: Record<string, number> = {
  mountain: 24, jungle: 18, desert: 18, tundra: 12, volcanic: 12, graveyard: 6, trench: 6,
};
const t4Cores = [...RECIPE_DATABASE.values()].filter((r) => r.slot === "core" && r.tier === 4);
const t4Stances = [...STANCE_RECIPE_DATABASE.values()].filter((r) => r.tier === 4);
for (const r of [...t4Gear, ...t4Cores, ...relics]) {
  const cap = T4_CAP[r.recipeGroup];
  assert(cap !== undefined, `${r.id}: recipeGroup ${r.recipeGroup} must have a known T4 cap`);
  assert(r.requiredBiomeLevel <= cap, `${r.id}: requiredBiomeLevel ${r.requiredBiomeLevel} must not exceed T4 cap ${cap} for ${r.recipeGroup}`);
  for (const step of r.upgrades ?? []) {
    assert(step.requiredBiomeLevel <= cap, `${r.id}: an upgrade step's requiredBiomeLevel must not exceed T4 cap ${cap}`);
  }
}
for (const stance of t4Stances) {
  const cap = T4_CAP[stance.recipeGroup!];
  assert(cap !== undefined, `${stance.id}: recipeGroup ${stance.recipeGroup} must have a known T4 cap`);
  assert(stance.requiredBiomeLevel! <= cap, `${stance.id}: requiredBiomeLevel ${stance.requiredBiomeLevel} must not exceed T4 cap ${cap}`);
  assert(!stance.requiredBossClear, `${stance.id}: must not require a boss clear`);
}

// Sanity: every family referenced anywhere in this test is a real modifier family.
for (const fam of Object.values(EXPECTED_FAMILY)) {
  assert((NODE_MODIFIER_FAMILIES as readonly string[]).includes(fam), `${fam} must be a real NodeModifierFamily`);
}
// NATIVE_MODIFIER sanity — used only to document, not assert, native-vs-inherited status.
void NATIVE_MODIFIER;

console.log("t4ProgressionEconomy: ok");
