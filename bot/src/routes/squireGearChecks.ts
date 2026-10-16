import assert from "node:assert/strict";
import { RECIPE_DATABASE } from "@mmo-idle/shared";
import type { RouteStep } from "../route/types";

/**
 * Test helper for the Squire's T2-T4 route tests (OV-SQUIRE): split a tier's steps into one
 * segment per zone (everything before that zone's boss) and check each segment farms only
 * that zone of that tier, ends at `level`, and crafts and wears each of `gear` as soon as the
 * zone's level unlocks it; `bossGear` is worn last, right before the boss. Returns the boss step of each zone.
 */
export function checkZoneSegments(
  steps: readonly RouteStep[],
  tier: number,
  zones: readonly { biome: string; level: number; gear: readonly string[]; bossGear?: readonly string[] }[],
): RouteStep[] {
  const bossAt = steps.flatMap((step, index) => (step.type === "attemptBoss" ? [index] : []));
  assert.equal(bossAt.length, zones.length, `tier ${tier}: one boss per zone`);
  let from = 0;
  const crafted = new Set<string>();
  return zones.map(({ biome, level, gear, bossGear }, index) => {
    let segment = steps.slice(from, bossAt[index]);
    const boss = steps[bossAt[index]];
    from = bossAt[index] + 1;
    assert(boss.type === "attemptBoss" && boss.biomeGroup === biome && boss.tier === tier, `${biome}: the tier-${tier} boss`);
    for (const step of segment) {
      assert(step.type === "farm" || step.type === "craft" || step.type === "equip", `${biome}: only farms, crafts and equips`);
      if (step.type === "farm") {
        assert(step.at.kind === "biome" && step.at.biomeGroup === biome && step.at.tier === tier, `${biome}: farms the tier-${tier} zone`);
      }
    }
    for (const step of segment) if (step.type === "craft") step.recipeIds.forEach((id) => crafted.add(id));
    if (bossGear) {
      // The boss set goes on right before the boss, and every piece was crafted earlier in the tier.
      const wear = segment[segment.length - 1];
      assert(wear?.type === "equip" && wear.definitionIds.join() === bossGear.join(), `${biome}: its boss gear is worn first`);
      for (const id of bossGear) assert(crafted.has(id), `${id}: crafted before the ${biome} boss`);
      segment = segment.slice(0, -1);
    }
    const last = segment[segment.length - 1];
    assert(last?.type === "farm" && last.until.type === "biomeLevelAtLeast" && last.until.biomeGroup === biome &&
      last.until.level === level, `${biome}: farmed to ${level} before its boss`);
    for (const id of gear) {
      const recipe = RECIPE_DATABASE.get(id);
      assert(recipe, `${id} is a recipe`);
      assert.equal(recipe.recipeGroup, biome, `${id} is made in the ${biome}`);
      assert.equal(recipe.tier, tier, `${id} is tier-${tier} gear`);
      if (recipe.requiredBiomeLevel > level) continue;
      const craftAt = segment.findIndex((step) => step.type === "craft" && step.recipeIds.includes(id));
      assert(craftAt > 0, `${id}: crafted in the ${biome}`);
      const gate = segment[craftAt - 1];
      assert(gate.type === "farm" && gate.until.type === "biomeLevelAtLeast" && gate.until.level === recipe.requiredBiomeLevel,
        `${id}: crafted as soon as its level unlocks it`);
      const wear = segment[craftAt + 1];
      assert(wear.type === "equip" && wear.definitionIds.includes(id), `${id}: worn at once`);
    }
    return boss;
  });
}

/** The slots of the pieces worn before the first boss of a tier: a weapon, an armor, a charm and boots of that tier. */
export function checkFirstBossKit(gear: readonly string[], tier: number): void {
  const slots = new Set(gear.map((id) => {
    const recipe = RECIPE_DATABASE.get(id);
    assert(recipe && recipe.tier === tier, `${id}: tier-${tier} gear`);
    return recipe.slot;
  }));
  for (const slot of ["weapon", "armor", "recovery", "mobility"]) {
    assert(slots.has(slot as never), `the first tier-${tier} boss is met with a tier-${tier} ${slot}`);
  }
}
