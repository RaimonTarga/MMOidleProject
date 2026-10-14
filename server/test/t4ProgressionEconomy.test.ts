/**
 * T3 → T4 progression/economy pass (2026-08-30 / 2026-09-04) — see the
 * historical T4 brief and the current-state docs.
 *
 * Covers the 36 T3→T4 lineages (26 distinct predecessors, 10 branch groups), the T4
 * gear cost curves / lifetime ratios / hybrid splits / catalyst schedule+families, the
 * four T4 ability prices, the normalized
 * T4 Relic economy, the Trench monster essence-colour correction, and the no-regression
 * pins on Runes and the GM architecture.
 */
import {
  RECIPE_DATABASE,
  ABILITY_RECIPE_DATABASE,
  maxGlobalMasteryAtTier,
  globalMasteryRequiredForUpgrade,
} from "@mmo-idle/shared";
import { MONSTER_DATABASE } from "@mmo-idle/shared";
import type { Recipe } from "@mmo-idle/shared";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

const essenceTotal = (cost: Partial<Record<string, number>> | undefined): number =>
  Object.values(cost ?? {}).reduce((sum: number, amount) => sum + (amount ?? 0), 0);

// ═══════════════════════════════════════════════════════════════════════════
// 1. Census: exactly 40 ordinary T4 gear items, 37 successions, 3 without
// ═══════════════════════════════════════════════════════════════════════════

// The shared and generic gear; class gear (class-first build plan §3.6) has its own suite.
const t4Gear: Recipe[] = [...RECIPE_DATABASE.values()].filter(
  (r) => r.tier === 4 && r.slot !== "relic" && !r.classes,
);

assert(t4Gear.length === 40, `expected 40 ordinary T4 gear items, got ${t4Gear.length}`);

/**
 * The approved T3→T4 successions, child → parent. Every T4 item is a plain recipe
 * (the evolve path went with the lineage trees, class-first rework D1), so the
 * rows are FROZEN here as the economy's reference: the branch groups below are
 * still the authored relationships between those items.
 */
const T4_SUCCESSIONS: Readonly<Record<string, string>> = {
  "jungle-deathfang-rapier": "jungle-venomthorn-rapier",
  "jungle-vest-t4": "jungle-vest-t3",
  "jungle-charm-t4": "jungle-charm-t3",
  "jungle-charm-t4-overgrowth": "jungle-charm-t3",
  "jungle-boots-t4": "jungle-boots-t3",
  "mountain-earthsunder-maul": "mountain-avalanche-maul",
  "mountain-warmaul": "mountain-avalanche-maul",
  "mountain-vest-t4": "mountain-vest-t3",
  "mountain-vest-t4-stormwall": "mountain-vest-t3",
  "mountain-charm-t4": "mountain-charm-t3",
  "mountain-charm-t4-shieldmend": "mountain-charm-t3",
  "mountain-boots-t4": "mountain-boots-t3",
  "tundra-glacial-tyrant-maul": "tundra-permafrost-maul",
  "tundra-glacial-rimebrand": "tundra-rimebrand",
  "tundra-vest-t4": "tundra-vest-t3",
  "tundra-charm-t4": "tundra-charm-t3",
  "tundra-charm-t4-deepfreeze": "tundra-charm-t3",
  "tundra-boots-t4": "tundra-boots-t3",
  "desert-zenith-cross": "desert-solar-cross",
  "desert-sunmonk-warstaff": "desert-pilgrim-quarterstaff",
  "desert-vest-t4": "desert-vest-t3",
  "desert-charm-t4": "desert-charm-t3",
  "desert-boots-t4": "desert-boots-t3",
  "volcanic-eruption-lash": "volcanic-cinderlash",
  "volcanic-blightbrand": "volcanic-cinderlash",
  "volcanic-vest-t4": "volcanic-vest-t3",
  "volcanic-vest-t4-lavatempered": "volcanic-vest-t3",
  "volcanic-charm-t4": "volcanic-charm-t3",
  "volcanic-boots-t4": "volcanic-boots-t3",
  "graveyard-plague-axe": "cave-cataclysm-axe",
  "graveyard-vest-t4": "swamp-vest-t3",
  "graveyard-vest-t4-debtward": "swamp-vest-t3",
  "graveyard-charm-t4": "swamp-charm-t3",
  "graveyard-charm-t4-gravetide": "swamp-charm-t3",
  "trench-abyssal-axe": "cave-cataclysm-axe",
  "trench-vest-t4": "cave-vest-t3",
  "trench-boots-t4-stalkers": "cave-boots-t3",
};
const parentOf = (child: Recipe): string => T4_SUCCESSIONS[child.id]!;

const withLineage = t4Gear.filter((r) => T4_SUCCESSIONS[r.id] !== undefined);
const withoutLineage = t4Gear.filter((r) => T4_SUCCESSIONS[r.id] === undefined);

assert(withLineage.length === 37, `expected 37 T4 successions, got ${withLineage.length}`);
assert(withoutLineage.length === 3, `expected 3 T4 items without a predecessor, got ${withoutLineage.length}`);

const NO_LINEAGE_IDS = new Set(["graveyard-boots-t4", "trench-charm-t4", "trench-boots-t4-treaders"]);
assert(
  JSON.stringify([...withoutLineage.map((r) => r.id)].sort()) === JSON.stringify([...NO_LINEAGE_IDS].sort()),
  `the 3 no-lineage items must be exactly Gravewalker Boots/Pressure Vessel/Abyssal Treaders, got ${withoutLineage.map((r) => r.id).join(", ")}`,
);

// ═══════════════════════════════════════════════════════════════════════════
// 2. Predecessors: exactly 27 distinct ids, each real, T3, slot-matched
// ═══════════════════════════════════════════════════════════════════════════

const predecessorIds = new Set(withLineage.map(parentOf));
assert(predecessorIds.size === 27, `expected 27 distinct predecessor ids, got ${predecessorIds.size}`);

for (const child of withLineage) {
  const parent = RECIPE_DATABASE.get(parentOf(child));
  assert(!!parent, `${child.id}: predecessor ${parentOf(child)} must exist in RECIPE_DATABASE`);
  assert(parent!.tier === 3, `${child.id}: predecessor ${parentOf(child)} must be tier 3 (got ${parent!.tier})`);
  assert(
    parent!.slot === child.slot,
    `${child.id}: predecessor ${parentOf(child)} slot (${parent!.slot}) must match child slot (${child.slot})`,
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Branch groups: exactly 10 parents with 2+ children
// ═══════════════════════════════════════════════════════════════════════════

const childrenByParent = new Map<string, Recipe[]>();
for (const child of withLineage) {
  const list = childrenByParent.get(parentOf(child)) ?? [];
  list.push(child);
  childrenByParent.set(parentOf(child), list);
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
// 4. Lifetime ratio and 5. curve shape: RETIRED with the ladder on every slot
// (design §23 for weapons, §24.5 for armour/charm/boots, 2026-10-03). Both
// audited the +N ladder — a successor's craft plus five steps against its
// predecessor's, and the accelerating step curve — and every item now crafts at
// its folded +5 power for its recipe cost, so "lifetime" is the one craft. The
// weapons left these sections at Phase 2b ("Override A") for the same reason.
// What remains true is that nothing reintroduces a ladder.
// ═══════════════════════════════════════════════════════════════════════════

for (const r of t4Gear) {
  assert(!r.upgrades?.length, `${r.id}: the +N ladder is retired; no item may author upgrade steps`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. Catalysts: RETIRED, Phase 2b. The catalyst wallet and every `catalystCost`/
// `reconstructCatalystCost` field are gone — nothing left to schedule-audit.
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// 7. Catalyst families: RETIRED, Phase 2b. Items no longer carry a catalyst
// family at all (no field to assign one to), so there is nothing to audit
// against the modifier-ban table here. Node modifiers survive only as T2-T4
// node authoring identity (see shared/src/world/nodeModifiers.test.ts).
// ═══════════════════════════════════════════════════════════════════════════

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
// 9. Abilities: exact costs 300/380/420, no catalysts, gates/effects unchanged
//    (Snipe, 320, re-homed to T2 Desert 3 by the ability pass, design §22.8)
// ═══════════════════════════════════════════════════════════════════════════

const EXPECTED_ABILITIES: Record<string, { color: string; amount: number; group: string; level: number }> = {
  "ability-recipe-disengage": { color: "green", amount: 300, group: "trench", level: 3 },
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
// 11. Trench essence correction: 3 monsters + boss are green; warden untouched
// ═══════════════════════════════════════════════════════════════════════════

// REBASED 2026-09-18. The subject of this block is the essence CORRECTION -- type,
// quantity and biome XP -- and all of that is still unchanged. The `hp` entries were
// only ever a "nothing else moved" guard, and the Durability22 Trench durability
// package moved them deliberately (2800/4200/5880 -> 16800/16800/17640; the 21000
// hadal-stalker candidate was REJECTED). Rewards are untouched by that adoption,
// which is exactly what the three assertions above this one still prove.
// REBASED 2026-09-27 (T4 power curve): Trench mobs tuned to ~1 min each, so HP
// roughly doubled and rewards per kill moved x2.2 to hold reward per minute.
const TRENCH_MONSTER_SNAPSHOT: Record<string, { essence: number; biomeXp: number; hp: number }> = {
  "hadal-stalker": { essence: 462, biomeXp: 2772, hp: 34500 },
  "abyssal-serpent": { essence: 572, biomeXp: 3432, hp: 32800 },
  "elder-leviathan": { essence: 880, biomeXp: 5280, hp: 31800 },
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

// (The soft-discarded Void Overlord warden was deleted with the encounter on 2026-09-27.)

// ═══════════════════════════════════════════════════════════════════════════
// 12. Relics: no relic items (the relic slot holds the class's boss trophy, build plan §3.4)
// ═══════════════════════════════════════════════════════════════════════════

assert([...RECIPE_DATABASE.values()].every((r) => r.slot !== "relic"), "no recipe makes a relic item");

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
for (const r of t4Gear) {
  const cap = T4_CAP[r.recipeGroup];
  assert(cap !== undefined, `${r.id}: recipeGroup ${r.recipeGroup} must have a known T4 cap`);
  assert(r.requiredBiomeLevel <= cap, `${r.id}: requiredBiomeLevel ${r.requiredBiomeLevel} must not exceed T4 cap ${cap} for ${r.recipeGroup}`);
  for (const step of r.upgrades ?? []) {
    assert(step.requiredBiomeLevel <= cap, `${r.id}: an upgrade step's requiredBiomeLevel must not exceed T4 cap ${cap}`);
  }
}

console.log("t4ProgressionEconomy: ok");
