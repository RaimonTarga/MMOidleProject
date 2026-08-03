// Authoring invariants for the `core` equipment slot.
//
// WHY THIS EXISTS: `Recipe` is one shape for every slot, so the type system cannot
// say "coreEligibility is required on cores and forbidden elsewhere". `coreIsActive`
// deliberately fails OPEN on a missing value so a bad recipe can't brick a save —
// which means an untagged core would silently behave as always-on and pass every
// other test. This file is the guarantee the type can't give.
//
// Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/coreAuthoring.test.ts

import {
  RECIPE_DATABASE,
  biomeLevelCap,
  getMaxUpgrade,
  isRestrictedCore,
  ITEM_DATABASE,
} from "@mmo-idle/shared";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const cores = [...RECIPE_DATABASE.values()].filter((r) => r.slot === "core");
assert(cores.length > 0, "expected at least one core recipe authored");

// ── Every core declares an eligibility; nothing else does ────────────────────

for (const core of cores) {
  assert(
    core.coreEligibility !== undefined,
    `core ${core.id} has no coreEligibility — it would silently behave as always-on`,
  );
}

for (const recipe of RECIPE_DATABASE.values()) {
  if (recipe.slot === "core") continue;
  assert(
    recipe.coreEligibility === undefined,
    `${recipe.slot} recipe ${recipe.id} declares coreEligibility, which only cores may carry`,
  );
}

// ── The eligibility survives the recipe → item mapping ──────────────────────

// itemDatabase.ts copies the field across by hand; a dropped line here would make
// every core unrestricted at runtime while the recipes still read correctly.
for (const core of cores) {
  const item = ITEM_DATABASE.get(core.id);
  assert(!!item, `core ${core.id} missing from ITEM_DATABASE`);
  assert(
    item!.coreEligibility === core.coreEligibility,
    `core ${core.id} lost its eligibility in the recipe → item mapping ` +
      `(recipe ${core.coreEligibility}, item ${item!.coreEligibility})`,
  );
}

// ── Cores stay off the +N upgrade track ─────────────────────────────────────

// Core ranks come from the evolution chain, not from upgrading. If this ever
// returns > 0, cores gain a second power axis nobody budgeted for.
for (const core of cores) {
  const item = ITEM_DATABASE.get(core.id)!;
  assert(
    getMaxUpgrade(item) === 0,
    `core ${core.id} reports a max upgrade of ${getMaxUpgrade(item)}; cores are off the +N track`,
  );
}

// ── Tier placement: a restricted core must not be craftable before T3 ───────

// THE BUG THIS REWORK STARTED FROM. A range is not selected until PLAYER TIER 3
// (skill-tree tier 2), so a melee/ranged core placed in a T2 biome-level band is
// craftable, equippable — and permanently inert. The original cast shipped three
// such cores and nothing caught it, because every test only ever asked whether the
// GATE worked, never whether the CONTENT was reachable at a tier that could use it.
for (const core of cores) {
  if (!isRestrictedCore(core.coreEligibility)) continue;

  const capAtT2 = biomeLevelCap(2, core.recipeGroup);
  assert(
    core.requiredBiomeLevel > capAtT2,
    `restricted core ${core.id} is reachable at player tier 2 ` +
      `(${core.recipeGroup} level ${core.requiredBiomeLevel} <= T2 cap ${capAtT2}), ` +
      `but no range is chosen until tier 3 — it would be craftable and inert`,
  );

  const capAtT3 = biomeLevelCap(3, core.recipeGroup);
  assert(
    core.requiredBiomeLevel <= capAtT3,
    `restricted core ${core.id} is unreachable even at player tier 3 ` +
      `(${core.recipeGroup} level ${core.requiredBiomeLevel} > T3 cap ${capAtT3})`,
  );
}

// The starter cores exist to introduce the SLOT, so they must be reachable in T2 —
// otherwise the slot sits empty for a whole tier.
const starters = cores.filter((c) => c.tier === 2);
assert(starters.length > 0, "expected T2 starter cores");
for (const core of starters) {
  assert(
    !isRestrictedCore(core.coreEligibility),
    `T2 starter ${core.id} is restricted; no range exists yet at tier 2`,
  );
  assert(
    core.requiredBiomeLevel <= biomeLevelCap(2, core.recipeGroup),
    `T2 starter ${core.id} is not reachable at player tier 2`,
  );
}

// ── Every core carries a lineage for its future evolution branches ─────────

for (const core of cores) {
  assert(
    !!core.lineageId,
    `core ${core.id} has no lineageId; cores grow by evolving into named branches, ` +
      `and a branch needs a lineage to hang from`,
  );
}

console.log("coreAuthoring: ok");
