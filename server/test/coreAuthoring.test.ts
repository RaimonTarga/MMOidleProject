// Authoring invariants for the `core` equipment slot.
//
// WHY THIS EXISTS: `Recipe` is one shape for every slot, so the type system cannot
// say "coreEligibility is required on cores and forbidden elsewhere". `coreIsActive`
// deliberately fails OPEN on a missing value so a bad recipe can't brick a save —
// which means an untagged core would silently behave as always-on and pass every
// other test. This file is the guarantee the type can't give.
//
// Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/coreAuthoring.test.ts

import { RECIPE_DATABASE, getMaxUpgrade, ITEM_DATABASE } from "@mmo-idle/shared";

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

console.log("coreAuthoring: ok");
