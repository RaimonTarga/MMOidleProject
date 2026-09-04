/**
 * T3 progression/economy pass (2026-08-30) — see
 * `docs/briefs/T3_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-30.md`.
 *
 * Covers the retirement-aware mastery architecture, the 22 T2→T3 lineages, the T3 gear
 * cost curves / hybrid splits / catalyst schedule, and the ability / stance / rite prices.
 */
import {
  RECIPE_DATABASE,
  ABILITY_RECIPE_DATABASE,
  STANCE_RECIPE_DATABASE,
  RITE_RECIPE_DATABASE,
  RUNE_RECIPE_DATABASE,
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
  checkEvolve,
  requiredPlusFor,
  EVOLUTION_REQUIRED_PLUS,
  ESSENCE_TYPES,
} from "@mmo-idle/shared";
import type { EssenceType } from "@mmo-idle/shared";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

const fullEssences = () =>
  Object.fromEntries(ESSENCE_TYPES.map((t) => [t, 1_000_000])) as Record<EssenceType, number>;
const fullCatalysts = (): Record<string, number> =>
  ({ alacrity: 999, heavy: 999, swarming: 999, dominion: 999, fortified: 999 });

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
// 2. T2 → T3 lineage
// ═══════════════════════════════════════════════════════════════════════════

/** The 22 approved lineages: 20 continuing-biome + 2 Plains→Volcanic cross-biome. */
const T3_LINEAGES: Array<{ t2: string; t3: string }> = [
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
  // Cross-biome: the retiring starter biome's mechanics matured in Volcanic.
  { t2: "plains-vest-t2", t3: "volcanic-vest-t3" },
  { t2: "plains-charm-t2", t3: "volcanic-charm-t3" },
];

/** T3 items that debut with no predecessor. */
const T3_NEW_ITEMS = [
  "tundra-permafrost-maul", "tundra-rimebrand", "tundra-vest-t3", "tundra-charm-t3",
  "tundra-boots-t3", "volcanic-cinderlash", "volcanic-boots-t3",
];

/** T2 identities that deliberately END at T2 — no T3 item may name them. */
const DEAD_END_T2_IDS = [
  "knight-steelsword", "plains-boots-t2", "gale-needle", "thorn-needle",
  "forest-vest-t2", "forest-charm-t2", "forest-boots-t2",
];

const T3_GEAR = [...RECIPE_DATABASE.values()].filter(
  (r) => r.tier === 3 && r.slot !== "core" && r.slot !== "relic",
);

assert(T3_GEAR.length === 29, `29 T3 gear items expected, got ${T3_GEAR.length}`);
// Designer decision 2026-09-04 returned the gate to +3 (see
// shared/src/systems/evolution.ts and
// docs/briefs/t2-bossless-progression-campaign-2026-09-03.md section 12): the
// canonical T1 routes were never updated for +5, so it taxed genuinely-invested
// predecessors rather than rewarding commitment.
assert(EVOLUTION_REQUIRED_PLUS === 3, "evolution requires a +3 predecessor (reverted from +5)");

// 2a. Exactly the 22 approved lineages exist, by id.
{
  const live = T3_GEAR.filter((r) => r.evolvesFrom).map((r) => `${r.evolvesFrom}->${r.id}`).sort();
  const want = T3_LINEAGES.map((l) => `${l.t2}->${l.t3}`).sort();
  assert(live.length === 22, `exactly 22 T3 lineages expected, got ${live.length}`);
  assert(JSON.stringify(live) === JSON.stringify(want), `T3 lineage map mismatch:\n live ${live}\n want ${want}`);
}

for (const { t2, t3 } of T3_LINEAGES) {
  const pred = RECIPE_DATABASE.get(t2);
  const recipe = RECIPE_DATABASE.get(t3);
  assert(!!pred, `${t2}: predecessor must exist`);
  assert(!!recipe, `${t3}: recipe must exist`);
  assert(recipe!.evolvesFrom === t2, `${t3}: must evolve from ${t2}`);
  assert(requiredPlusFor(recipe!) === 3, `${t3}: evolution must require +3`);
  assert(pred!.tier === recipe!.tier - 1, `${t3}: predecessor must sit exactly one tier below`);
  assert(pred!.slot === recipe!.slot, `${t3}: predecessor must occupy the same slot`);
  assert(!!recipe!.reconstructCost, `${t3}: an evolved recipe needs a reconstruct path`);
}

// 2b. Genuinely-new T3 items carry no lineage at all.
for (const id of T3_NEW_ITEMS) {
  const recipe = RECIPE_DATABASE.get(id);
  assert(!!recipe, `${id}: recipe must exist`);
  assert(recipe!.evolvesFrom === undefined, `${id}: must have NO predecessor`);
  assert(recipe!.reconstructCost === undefined, `${id}: must have NO reconstruct cost`);
}
assert(T3_GEAR.filter((r) => !r.evolvesFrom).length === T3_NEW_ITEMS.length, "22 + 7 must account for all 29");

// 2c. The confirmed dead ends: nothing anywhere points back at them.
for (const dead of DEAD_END_T2_IDS) {
  assert(!!RECIPE_DATABASE.get(dead), `${dead}: the dead-end T2 item must still exist`);
  const heirs = [...RECIPE_DATABASE.values()].filter((r) => r.evolvesFrom === dead);
  assert(heirs.length === 0, `${dead} is a deliberate dead end but ${heirs.map((h) => h.id)} evolve(s) from it`);
}

// 2d. Multi-parent evolution was explicitly REJECTED — no such field may exist.
for (const recipe of RECIPE_DATABASE.values()) {
  assert(
    !("evolvesFromAny" in (recipe as Record<string, unknown>)),
    `${recipe.id}: multi-parent evolution is rejected; evolvesFrom is single-parent by design`,
  );
  if (recipe.evolvesFrom !== undefined) {
    assert(typeof recipe.evolvesFrom === "string", `${recipe.id}: evolvesFrom must be a single id`);
    assert(RECIPE_DATABASE.has(recipe.evolvesFrom), `${recipe.id}: evolvesFrom ${recipe.evolvesFrom} must resolve`);
  }
}

// 2e. One step below the gate cannot evolve, the gate itself can — spot-checked
//     on a continuing lineage AND on the cross-biome Plains→Volcanic handoff.
//     (Was +4/+5; the gate returned to +3 on 2026-09-04, so this is +2/+3. The
//     SHAPE is the invariant, not the literal levels.)
for (const { t2, t3 } of [
  { t2: "quake-hammer", t3: "mountain-avalanche-maul" },
  { t2: "plains-vest-t2", t3: "volcanic-vest-t3" },
  { t2: "plains-charm-t2", t3: "volcanic-charm-t3" },
]) {
  const recipe = RECIPE_DATABASE.get(t3)!;
  const notReady = checkEvolve({
    recipe, inventory: [t2], itemUpgrades: { [t2]: 2 },
    essences: fullEssences(), catalysts: fullCatalysts(),
  });
  assert(!notReady.ok, `${t3}: a +2 ${t2} must NOT evolve`);
  const ready = checkEvolve({
    recipe, inventory: [t2], itemUpgrades: { [t2]: 3 },
    essences: fullEssences(), catalysts: fullCatalysts(),
  });
  assert(ready.ok, `${t3}: a +3 ${t2} must evolve (got: ${ready.reason})`);
}

// 2f. Reconstruction is 3.5x the evolve essence, per colour, plus 3 catalysts.
for (const recipe of T3_GEAR) {
  if (!recipe.evolvesFrom) continue;
  const recon = recipe.reconstructCost!;
  for (const [type, amount] of Object.entries(recipe.cost)) {
    const got = recon[type as EssenceType] ?? 0;
    const want = (amount ?? 0) * 3.5;
    assert(Math.abs(got - want) <= 1, `${recipe.id}: reconstruct ${type} must be ~3.5x ${amount} (got ${got})`);
  }
  const catalysts = Object.values(recipe.reconstructCatalystCost ?? {});
  assert(catalysts.length === 1 && catalysts[0] === 3, `${recipe.id}: reconstruction must cost 3 catalysts`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. T3 gear economy
// ═══════════════════════════════════════════════════════════════════════════

const total = (c: Partial<Record<EssenceType, number>> | undefined) =>
  Object.values(c ?? {}).reduce((a: number, b) => a + (b ?? 0), 0);

/** Approved lifetime totals (base + all five steps). */
const T3_TOTALS: Record<string, number> = {
  "mountain-avalanche-maul": 2444, "mountain-vest-t3": 2228, "mountain-charm-t3": 936, "mountain-boots-t3": 658,
  "cave-cataclysm-axe": 2328, "cave-vest-t3": 2418, "cave-charm-t3": 1006, "cave-boots-t3": 666,
  "swamp-blightbrand": 2444, "swamp-vest-t3": 2358, "swamp-charm-t3": 988, "swamp-boots-t3": 688,
  "jungle-venomthorn-rapier": 2090, "jungle-vest-t3": 2070, "jungle-charm-t3": 1008, "jungle-boots-t3": 660,
  "desert-solar-cross": 2540, "desert-vest-t3": 2520, "desert-charm-t3": 1310, "desert-boots-t3": 864,
  "volcanic-cinderlash": 2540, "volcanic-vest-t3": 2112, "volcanic-charm-t3": 1100, "volcanic-boots-t3": 680,
  "tundra-permafrost-maul": 2450, "tundra-rimebrand": 2444, "tundra-vest-t3": 2200,
  "tundra-charm-t3": 1050, "tundra-boots-t3": 670,
};

for (const recipe of T3_GEAR) {
  const id = recipe.id;
  const steps = recipe.upgrades ?? [];
  assert(steps.length === 5, `${id}: must author exactly 5 upgrade steps`);

  const stepTotals = steps.map((s) => total(s.cost));
  const postBase = stepTotals.reduce((a, b) => a + b, 0);
  const lifetime = total(recipe.cost) + postBase;

  // 3a. Approved lifetime totals.
  assert(T3_TOTALS[id] !== undefined, `${id}: missing from the approved T3 cost table`);
  assert(lifetime === T3_TOTALS[id], `${id}: lifetime total must be ${T3_TOTALS[id]} (got ${lifetime})`);

  // 3b. Strictly accelerating — this alone kills the old +3=+4=+5 plateau.
  for (let i = 1; i < stepTotals.length; i++) {
    assert(stepTotals[i] > stepTotals[i - 1], `${id}: step +${i + 1} must cost more than +${i}`);
  }

  // 3c. +4/+5 hold ~70% of post-base spend.
  const share = (stepTotals[3] + stepTotals[4]) / postBase;
  assert(share >= 0.65 && share <= 0.75, `${id}: +4/+5 must be 65-75% of post-base spend (got ${(share * 100).toFixed(1)}%)`);

  // 3d. Hybrid rules. Weapons and mobility stay pure; hybrids keep home dominant.
  const lifeByColour: Partial<Record<EssenceType, number>> = {};
  for (const c of [recipe.cost, ...steps.map((s) => s.cost)]) {
    for (const [k, v] of Object.entries(c ?? {})) {
      lifeByColour[k as EssenceType] = (lifeByColour[k as EssenceType] ?? 0) + (v ?? 0);
    }
  }
  const colours = Object.entries(lifeByColour).sort((a, b) => b[1] - a[1]);
  if (recipe.slot === "weapon" || recipe.slot === "mobility") {
    assert(colours.length === 1, `${id}: ${recipe.slot} items must be a single essence colour`);
  } else {
    assert(colours.length <= 2, `${id}: at most one splash colour`);
    if (colours.length === 2) {
      const homeShare = colours[0][1] / lifetime;
      assert(homeShare >= 0.73 && homeShare <= 0.82, `${id}: home share must be 73-82% (got ${(homeShare * 100).toFixed(1)}%)`);
      assert(1 - homeShare <= 0.33, `${id}: splash must stay under the 33% ceiling`);
    }
  }

  // 3e. Catalyst schedule: nothing on the base/evolution craft or +1..+3;
  //     weapon/armor 0/0/0/0/2/3, recovery/mobility 0/0/0/0/0/2.
  assert(recipe.catalystCost === undefined, `${id}: base/evolution craft must be catalyst-free`);
  const catalystAt = (i: number) => Object.values(steps[i].catalystCost ?? {}).reduce((a: number, b) => a + (b ?? 0), 0);
  const wantSchedule = recipe.slot === "weapon" || recipe.slot === "armor"
    ? [0, 0, 0, 2, 3]
    : [0, 0, 0, 0, 2];
  for (let i = 0; i < 5; i++) {
    assert(catalystAt(i) === wantSchedule[i], `${id}: +${i + 1} must cost ${wantSchedule[i]} catalysts (got ${catalystAt(i)})`);
  }
  // Exactly one family, and the same one throughout the item.
  const families = new Set(steps.flatMap((s) => Object.keys(s.catalystCost ?? {})));
  assert(families.size === 1, `${id}: an item must charge exactly one catalyst family (got ${[...families]})`);
}

// 3f. Volcanic families were assigned for the first time — pin them.
{
  const VOLCANIC_FAMILIES: Record<string, string> = {
    "volcanic-vest-t3": "alacrity",   // inherits plains-vest-t2's tag (family follows the ITEM)
    "volcanic-charm-t3": "alacrity",  // inherits plains-charm-t2's tag
    "volcanic-cinderlash": "swarming", // genuinely new -> Volcanic's native family
    "volcanic-boots-t3": "swarming",
  };
  for (const [id, family] of Object.entries(VOLCANIC_FAMILIES)) {
    const recipe = RECIPE_DATABASE.get(id)!;
    const fams = new Set((recipe.upgrades ?? []).flatMap((s) => Object.keys(s.catalystCost ?? {})));
    assert(fams.has(family) && fams.size === 1, `${id}: must charge ${family} (got ${[...fams]})`);
  }
}

// 3g. Slot ordering per biome: weapon/armor > recovery > mobility.
{
  const byGroup = new Map<string, typeof T3_GEAR>();
  for (const r of T3_GEAR) {
    if (!byGroup.has(r.recipeGroup)) byGroup.set(r.recipeGroup, []);
    byGroup.get(r.recipeGroup)!.push(r);
  }
  for (const [group, items] of byGroup) {
    const lifetimeOf = (slot: string) =>
      items.filter((i) => i.slot === slot)
        .map((i) => total(i.cost) + (i.upgrades ?? []).reduce((a, s) => a + total(s.cost), 0));
    const minOf = (slot: string) => Math.min(...lifetimeOf(slot));
    const maxOf = (slot: string) => Math.max(...lifetimeOf(slot));
    assert(minOf("weapon") > maxOf("recovery"), `${group}: weapon must cost more than recovery`);
    assert(minOf("armor") > maxOf("recovery"), `${group}: armor must cost more than recovery`);
    assert(minOf("recovery") > maxOf("mobility"), `${group}: recovery must cost more than mobility`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. Abilities / stances / rites
// ═══════════════════════════════════════════════════════════════════════════

{
  const ABILITIES: Array<{ id: string; group: string; level: number; type: EssenceType; cost: number }> = [
    { id: "ability-recipe-binding-strike", group: "tundra", level: 3, type: "blue", cost: 150 },
    { id: "ability-recipe-frenzy", group: "volcanic", level: 3, type: "red", cost: 175 },
    { id: "ability-recipe-break-free", group: "tundra", level: 5, type: "blue", cost: 190 },
    { id: "ability-recipe-quick-strike", group: "volcanic", level: 5, type: "red", cost: 210 },
  ];
  for (const spec of ABILITIES) {
    const recipe = ABILITY_RECIPE_DATABASE.get(spec.id);
    assert(!!recipe, `${spec.id}: recipe must exist`);
    assert(recipe!.tier === 3, `${spec.id}: must stay tier 3`);
    assert(recipe!.recipeGroup === spec.group, `${spec.id}: gate biome unchanged`);
    assert(recipe!.requiredBiomeLevel === spec.level, `${spec.id}: gate level unchanged`);
    assert(recipe!.cost[spec.type] === spec.cost, `${spec.id}: cost must be ${spec.cost} ${spec.type}`);
    assert(Object.keys(recipe!.cost).length === 1, `${spec.id}: abilities stay single-colour`);
    assert(!recipe!.catalystCost, `${spec.id}: T3 abilities charge no catalysts`);
  }
  // Ordering: within each biome L3 < L5, and the whole set sits in the T3 band.
  for (const spec of ABILITIES) assert(spec.cost >= 140 && spec.cost <= 220, `${spec.id}: inside the T3 band`);
}

{
  const STANCES: Array<{ id: string; family: string; cost: Partial<Record<EssenceType, number>> }> = [
    { id: "stance-recipe-berserker", family: "dominion", cost: { red: 140, purple: 40 } },
    { id: "stance-recipe-predator", family: "alacrity", cost: { green: 130, red: 50 } },
    { id: "stance-recipe-brawler", family: "swarming", cost: { yellow: 130, red: 50 } },
    { id: "stance-recipe-execute", family: "fortified", cost: { purple: 130, red: 50 } },
  ];
  for (const spec of STANCES) {
    const recipe = STANCE_RECIPE_DATABASE.get(spec.id);
    assert(!!recipe, `${spec.id}: recipe must exist`);
    assert(recipe!.tier === 3, `${spec.id}: must stay tier 3`);
    assert(
      JSON.stringify(recipe!.catalystCost) === JSON.stringify({ [spec.family]: 2 }),
      `${spec.id}: must charge exactly 2 ${spec.family} (got ${JSON.stringify(recipe!.catalystCost)})`,
    );
    assert(JSON.stringify(recipe!.cost) === JSON.stringify(spec.cost), `${spec.id}: essence cost must be UNCHANGED`);
  }
  // T4's Recuperating Stance was explicitly out of scope for the T3 pass (catalyst
  // 7, unchanged here). The T4 economy pass (2026-08-30) later moved it to 3 — see
  // t4ProgressionEconomy.test.ts, which is now the authoritative pin for this value.
  assert(
    JSON.stringify(STANCE_RECIPE_DATABASE.get("stance-recipe-recuperating")!.catalystCost) === JSON.stringify({ alacrity: 3 }),
    "T4 Recuperating Stance catalyst must match the T4 economy pass's value (3)",
  );
}

{
  // RP costs AND all six essence costs are UNCHANGED — only catalyst family/quantity moved.
  // Rite essence is deliberately NOT monotonic in RP: RP is loadout opportunity cost,
  // essence is acquisition cost. Lingering Battle at 2 RP / 170 essence is intended.
  const RITES: Array<{ id: string; family: string; catalyst: number; cost: Partial<Record<EssenceType, number>> }> = [
    { id: "rite-recipe-swift-repose", family: "dominion", catalyst: 2, cost: { red: 120 } },
    { id: "rite-recipe-lingering-battle", family: "heavy", catalyst: 2, cost: { blue: 130, yellow: 40 } },
    { id: "rite-recipe-purification", family: "fortified", catalyst: 2, cost: { purple: 120, green: 40 } },
    { id: "rite-recipe-blood-offering", family: "swarming", catalyst: 2, cost: { red: 130, green: 40 } },
    { id: "rite-recipe-mechanic-renewal", family: "heavy", catalyst: 3, cost: { blue: 160, yellow: 60 } },
    { id: "rite-recipe-ability-reprieve", family: "dominion", catalyst: 3, cost: { red: 160, purple: 60 } },
  ];
  for (const spec of RITES) {
    const recipe = RITE_RECIPE_DATABASE.get(spec.id);
    assert(!!recipe, `${spec.id}: recipe must exist`);
    assert(recipe!.tier === 3, `${spec.id}: must stay tier 3`);
    assert(
      JSON.stringify(recipe!.catalystCost) === JSON.stringify({ [spec.family]: spec.catalyst }),
      `${spec.id}: must charge ${spec.catalyst} ${spec.family} (got ${JSON.stringify(recipe!.catalystCost)})`,
    );
    assert(
      JSON.stringify(recipe!.cost) === JSON.stringify(spec.cost),
      `${spec.id}: essence cost must be UNCHANGED (got ${JSON.stringify(recipe!.cost)})`,
    );
  }
}

// No T3 Rune content was authored, and that is deliberate — T3's RP layer is Rites.
assert(
  [...RUNE_RECIPE_DATABASE.values()].filter((r) => r.tier === 3).length === 0,
  "zero tier-3 rune recipes is intentional, not a gap to fill",
);

console.log("t3ProgressionEconomy: ok");
