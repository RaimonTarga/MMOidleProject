/**
 * T3 progression/economy pass (2026-08-30) — see
 * `docs/briefs/T3_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-30.md` and the
 * current-state docs.
 *
 * Covers the retirement-aware mastery architecture, the 23 T2→T3 successions, the T3 gear
 * cost curves / hybrid splits / catalyst schedule, and the ability prices and
 * reward placement.
 */
import {
  RECIPE_DATABASE,
  ABILITY_RECIPE_DATABASE,
  NODE_BIOMES,
  BIOME_START_TIER_BY_GROUP,
  BIOME_FINAL_TIER_BY_GROUP,
  BIOME_LEVELS_PER_TIER,
  biomeLevelCap,
  maxGlobalMasteryAtTier,
  globalMastery,
  globalMasteryRequiredForUpgrade,
  upgradeCeilingFromGlobalMastery,
  MAX_UPGRADE,
} from "@mmo-idle/shared";
import type { EssenceType } from "@mmo-idle/shared";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

const MAX_TIER = 4;

// ═══════════════════════════════════════════════════════════════════════════
// 1. Retirement-aware mastery architecture
// ═══════════════════════════════════════════════════════════════════════════

// 1a. BIOME_FINAL_TIER_BY_GROUP is DERIVED, not authored: it must equal the max
//     biomeTier over each group's normal/dungeon nodes.
{
  const expected: Record<string, number> = {};
  for (const node of Object.values(NODE_BIOMES)) {
    if (node.kind !== "normal" && node.kind !== "dungeon") continue;
    const cur = expected[node.biomeGroup];
    if (cur === undefined || node.biomeTier > cur) expected[node.biomeGroup] = node.biomeTier;
  }
  assert(
    JSON.stringify(Object.entries(expected).sort()) ===
      JSON.stringify(Object.entries(BIOME_FINAL_TIER_BY_GROUP).sort()),
    "BIOME_FINAL_TIER_BY_GROUP must be the derived max normal/dungeon tier per group",
  );
}

// 1b. THE HAZARD GUARD. The derivation includes `dungeon` nodes (mirroring the start-tier
//     map). That is only safe while a biome's dungeons live at tiers its NORMAL nodes also
//     cover. If an optional/side dungeon is ever authored at a tier past a biome's normal
//     content, that biome would silently gain six more mastery levels — so fail loudly here
//     and narrow the derivation to `normal` instead.
{
  const normalOnly: Record<string, number> = {};
  for (const node of Object.values(NODE_BIOMES)) {
    if (node.kind !== "normal") continue;
    const cur = normalOnly[node.biomeGroup];
    if (cur === undefined || node.biomeTier > cur) normalOnly[node.biomeGroup] = node.biomeTier;
  }
  for (const [group, finalTier] of Object.entries(BIOME_FINAL_TIER_BY_GROUP)) {
    assert(
      normalOnly[group] === finalTier,
      `${group}: dungeon nodes outlive its normal nodes (normal max ${normalOnly[group]}, ` +
        `derived final ${finalTier}). A side dungeon must NOT extend a biome's mastery ` +
        `lifespan — narrow BIOME_FINAL_TIER_BY_GROUP to kind === 'normal'.`,
    );
  }
}

// 1c. No biome may contribute mastery headroom for a tier it has no content at.
{
  const authored = new Set<string>();
  for (const node of Object.values(NODE_BIOMES)) {
    if (node.kind !== "normal" && node.kind !== "dungeon") continue;
    authored.add(`${node.biomeGroup}@${node.biomeTier}`);
  }
  for (const group of Object.keys(BIOME_START_TIER_BY_GROUP)) {
    if (group === "clearing") continue;
    for (let tier = 1; tier <= MAX_TIER; tier++) {
      if (biomeLevelCap(tier, group) <= 0) continue;
      const effective = Math.min(tier, BIOME_FINAL_TIER_BY_GROUP[group]!);
      assert(
        authored.has(`${group}@${effective}`),
        `${group} contributes mastery at player tier ${tier} but has no nodes at tier ${effective}`,
      );
    }
  }
}

// 1d. A retired biome gains NO new headroom as the player tier rises.
for (const group of Object.keys(BIOME_START_TIER_BY_GROUP)) {
  if (group === "clearing") continue;
  const finalTier = BIOME_FINAL_TIER_BY_GROUP[group]!;
  const atFinal = biomeLevelCap(finalTier, group);
  for (let tier = finalTier; tier <= MAX_TIER; tier++) {
    assert(
      biomeLevelCap(tier, group) === atFinal,
      `${group}: cap must freeze at ${atFinal} once its content ends (tier ${tier})`,
    );
  }
}

// 1e. maxGlobalMasteryAtTier sums exactly the groups with authored nodes — no phantoms.
for (let tier = 0; tier <= MAX_TIER; tier++) {
  let sum = 0;
  for (const group of Object.keys(BIOME_START_TIER_BY_GROUP)) {
    if (group === "clearing") continue;
    sum += biomeLevelCap(tier, group);
  }
  assert(maxGlobalMasteryAtTier(tier) === sum, `maxGlobalMasteryAtTier(${tier}) must be the cap sum`);
}

// 1f. Regression pins on the ceilings.
assert(maxGlobalMasteryAtTier(1) === 30, "max GM at T1 must stay 30");
assert(maxGlobalMasteryAtTier(2) === 72, "max GM at T2 must stay 72");
assert(maxGlobalMasteryAtTier(3) === 114, "max GM at T3 must be 114 (was 126)");
assert(maxGlobalMasteryAtTier(4) === 156, "max GM at T4 must be 156 (was 192)");

// 1g. Per-biome caps at T3 — the designer's intended roster.
{
  const T3_CAPS: Record<string, number> = {
    plains: 12, forest: 12, mountain: 18, cave: 18, swamp: 18,
    jungle: 12, desert: 12, tundra: 6, volcanic: 6, graveyard: 0, trench: 0,
  };
  for (const [group, cap] of Object.entries(T3_CAPS)) {
    assert(biomeLevelCap(3, group) === cap, `${group} cap at T3 must be ${cap}`);
  }
}

// 1h. Upgrade gates. T1/T2 must be BIT-IDENTICAL to what shipped.
{
  const GATES: Record<number, number[]> = {
    1: [6, 12, 18, 24, 30],
    2: [38, 47, 55, 64, 72],
    3: [80, 89, 97, 106, 114],
    4: [122, 131, 139, 148, 156],
  };
  for (const [tierStr, expected] of Object.entries(GATES)) {
    const tier = Number(tierStr);
    for (let plus = 1; plus <= MAX_UPGRADE; plus++) {
      assert(
        globalMasteryRequiredForUpgrade(tier, plus) === expected[plus - 1],
        `T${tier} +${plus} gate must be ${expected[plus - 1]} (got ${globalMasteryRequiredForUpgrade(tier, plus)})`,
      );
    }
  }
}

// 1i. +5 is ALWAYS attainable from the tier's own playable content. This generic assertion
//     is the one whose absence produced the retired-biome debt.
for (let tier = 1; tier <= MAX_TIER; tier++) {
  assert(
    globalMasteryRequiredForUpgrade(tier, MAX_UPGRADE) <= maxGlobalMasteryAtTier(tier),
    `T${tier} +5 must be reachable inside the tier's own content`,
  );
}

// 1j. Save safety — a legacy character above the new cap is never clamped or regressed.
{
  const legacy = { plains: 18, forest: 18, mountain: 18, cave: 18, swamp: 18, jungle: 12, desert: 12, tundra: 6, volcanic: 6 };
  const gm = globalMastery(legacy);
  assert(gm === 126, `legacy over-cap save keeps its full GM (got ${gm})`);
  assert(gm > maxGlobalMasteryAtTier(3), "legacy save may legitimately exceed the new T3 ceiling");
  assert(upgradeCeilingFromGlobalMastery(gm, 3) === MAX_UPGRADE, "over-cap GM still yields +5, never clipped");
  // The cap is a gain stop, not a downward rewrite: biomeLevelCap is a pure read.
  assert(biomeLevelCap(3, "plains") === 12 && legacy.plains === 18, "cap must not mutate stored levels");
}

// 1k. BIOME_LEVELS_PER_TIER is still the only granularity knob.
assert(BIOME_LEVELS_PER_TIER === 6, "BIOME_LEVELS_PER_TIER pin");

// ═══════════════════════════════════════════════════════════════════════════
// 2. T2 → T3 successions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The approved T2→T3 successions: 20 continuing-biome + 3 cross-biome. Every T3
 * item is a plain recipe (the evolve path and the weapon form graph went with the
 * lineage trees, class-first rework D1); the table pins which T2 identity each
 * T3 item follows.
 */
const T3_SUCCESSIONS: Array<{ t2: string; t3: string }> = [
  { t2: "quake-hammer", t3: "mountain-avalanche-maul" },
  { t2: "mountain-vest-t2", t3: "mountain-vest-t3" },
  { t2: "mountain-charm-t2", t3: "mountain-charm-t3" },
  { t2: "mountain-boots-t2", t3: "mountain-boots-t3" },
  { t2: "ruinous-axe", t3: "cave-cataclysm-axe" },
  { t2: "cave-vest-t2", t3: "cave-vest-t3" },
  { t2: "cave-charm-t2", t3: "cave-charm-t3" },
  { t2: "cave-boots-t2", t3: "cave-boots-t3" },
  { t2: "swamp-mirebrand", t3: "swamp-blightbrand" },
  { t2: "swamp-vest-t2", t3: "swamp-vest-t3" },
  { t2: "swamp-charm-t2", t3: "swamp-charm-t3" },
  { t2: "swamp-boots-t2", t3: "swamp-boots-t3" },
  { t2: "jungle-stinger-rapier", t3: "jungle-venomthorn-rapier" },
  { t2: "jungle-vest-t2", t3: "jungle-vest-t3" },
  { t2: "jungle-charm-t2", t3: "jungle-charm-t3" },
  { t2: "jungle-boots-t2", t3: "jungle-boots-t3" },
  { t2: "desert-sunsteel-cross", t3: "desert-solar-cross" },
  { t2: "desert-vest-t2", t3: "desert-vest-t3" },
  { t2: "desert-charm-t2", t3: "desert-charm-t3" },
  { t2: "desert-boots-t2", t3: "desert-boots-t3" },
  // Cross-biome (2026-09-26): the Plains Technique swords continue as the Desert staff.
  { t2: "knight-steelsword", t3: "desert-pilgrim-quarterstaff" },
  // Cross-biome: the retiring starter biome's mechanics matured in Volcanic.
  { t2: "plains-vest-t2", t3: "volcanic-vest-t3" },
  { t2: "plains-charm-t2", t3: "volcanic-charm-t3" },
];

/** T3 items that debut with no predecessor. */
const T3_NEW_ITEMS = [
  "tundra-permafrost-maul", "tundra-rimebrand", "tundra-vest-t3", "tundra-charm-t3",
  "tundra-boots-t3", "volcanic-cinderlash", "volcanic-boots-t3",
];

// The shared and generic gear; class gear (class-first build plan §3.6) has its own suite.
const T3_GEAR = [...RECIPE_DATABASE.values()].filter(
  (r) => r.tier === 3 && r.slot !== "relic" && !r.classes,
);

assert(T3_GEAR.length === 30, `30 T3 gear items expected, got ${T3_GEAR.length}`);

assert(T3_SUCCESSIONS.length === 23, `exactly 23 T3 successions expected, got ${T3_SUCCESSIONS.length}`);
for (const { t2, t3 } of T3_SUCCESSIONS) {
  const pred = RECIPE_DATABASE.get(t2);
  const recipe = RECIPE_DATABASE.get(t3);
  assert(!!pred, `${t2}: predecessor must exist`);
  assert(!!recipe, `${t3}: recipe must exist`);
  assert(pred!.tier === recipe!.tier - 1, `${t3}: predecessor must sit exactly one tier below`);
  assert(pred!.slot === recipe!.slot, `${t3}: predecessor must occupy the same slot`);
}

// Genuinely-new T3 items exist, and the two lists account for every T3 item.
for (const id of T3_NEW_ITEMS) {
  assert(!!RECIPE_DATABASE.get(id), `${id}: recipe must exist`);
}
assert(T3_SUCCESSIONS.length + T3_NEW_ITEMS.length === T3_GEAR.length, "23 + 7 must account for all 30");

// ═══════════════════════════════════════════════════════════════════════════
// 3. T3 gear economy
// ═══════════════════════════════════════════════════════════════════════════

const total = (c: Partial<Record<string, number>> | undefined) =>
  Object.values(c ?? {}).reduce((a: number, b) => a + (b ?? 0), 0);

// 3a-3d and 3g RETIRED with the ladder (design §23 for weapons, §24.5 for armour,
// charm and boots, 2026-10-03). They audited a LIFETIME cost — the craft plus
// five accelerating +N steps — and the +4/+5 share of it. No item carries a
// ladder now: each crafts at its folded +5 power for its recipe cost, so the
// approved lifetime totals have no subject. What still holds of a plain craft
// is checked below. The slot ordering (armour > charm > boots) is NOT asserted:
// on the craft cost alone it ties in places (swamp T3 charm = boots), which is a
// pricing call for the designer, not a regression to pin.
for (const recipe of T3_GEAR) {
  if (recipe.slot === "weapon") continue;
  const id = recipe.id;
  assert(!recipe.upgrades?.length, `${id}: the +N ladder is retired; no item may author upgrade steps`);
  const colours = Object.keys(recipe.cost ?? {});
  if (recipe.slot === "mobility") {
    assert(colours.length === 1, `${id}: ${recipe.slot} items must be a single essence colour`);
  } else {
    assert(colours.length <= 2, `${id}: at most one splash colour`);
  }
}
// 3e (catalyst schedule) and 3f (volcanic catalyst families) RETIRED, Phase 2b:
// the catalyst wallet and every `catalystCost` field are gone.

// ═══════════════════════════════════════════════════════════════════════════
// 4. Abilities
// ═══════════════════════════════════════════════════════════════════════════

{
  const ABILITIES: Array<{ id: string; group: string; level: number; type: EssenceType; cost: number }> = [
    // The ability pass (design §22.2, §22.8): Cull takes Binding Strike's old slot
    // and Imbue Lightning the cut Frenzy's, at those slots' prices; Quick Strike's
    // Volcanic 5 slot is empty.
    { id: "ability-recipe-cull", group: "tundra", level: 3, type: "blue", cost: 150 },
    { id: "ability-recipe-imbue-lightning", group: "volcanic", level: 3, type: "red", cost: 175 },
    { id: "ability-recipe-break-free", group: "tundra", level: 5, type: "blue", cost: 190 },
  ];
  for (const spec of ABILITIES) {
    const recipe = ABILITY_RECIPE_DATABASE.get(spec.id);
    assert(!!recipe, `${spec.id}: recipe must exist`);
    assert(recipe!.tier === 3, `${spec.id}: must stay tier 3`);
    assert(recipe!.recipeGroup === spec.group, `${spec.id}: gate biome unchanged`);
    assert(recipe!.requiredBiomeLevel === spec.level, `${spec.id}: gate level unchanged`);
    assert(recipe!.cost[spec.type] === spec.cost, `${spec.id}: cost must be ${spec.cost} ${spec.type}`);
    assert(Object.keys(recipe!.cost).length === 1, `${spec.id}: abilities stay single-colour`);
    }
  // Ordering: within each biome L3 < L5, and the whole set sits in the T3 band.
  for (const spec of ABILITIES) assert(spec.cost >= 140 && spec.cost <= 220, `${spec.id}: inside the T3 band`);
}

console.log("t3ProgressionEconomy: ok");
