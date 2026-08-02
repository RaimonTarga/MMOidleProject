// Regression test for the core range gate + the bench bot's canonical loadout.
//
// WHY THIS EXISTS: `coreIsActive` compared its `close|mid|far` range tag against
// `usesSkills.selectedRange` with strict equality, but selectedRange holds the
// FULL tier-2 skill id (`cadence-range-close`) — so no directional core ever
// activated. The server gate and both client indicators read the same helper, so
// they agreed with each other and the bug read as intended behaviour for as long
// as cores have existed. Nothing covered it. Now something does.
//
// Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/coreRangeGate.test.ts

import {
  ABILITY_DATABASE,
  RECIPE_DATABASE,
  abilitySlotCount,
  coreIsActive,
  globalMastery,
  isDirectionalCore,
} from "@mmo-idle/shared";
import { enumerateBuildsForContentTier } from "../bench/balance/progression";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

// ── The gate itself ──────────────────────────────────────────────────────────

// A directional core matches the full skill id, not a bare range word.
assert(
  coreIsActive("close", "cadence-range-close"),
  "close core must activate for a close build",
);
assert(
  coreIsActive("far", "reload-range-far"),
  "far core must activate for a far build, on any class",
);
assert(
  !coreIsActive("close", "cadence-range-far"),
  "close core must NOT activate for a far build",
);
assert(
  !coreIsActive("mid", null),
  "a directional core cannot be active before a range is chosen",
);

// Universal/party ignore range entirely, including before a range is picked.
assert(coreIsActive("universal", null), "universal core is always active");
assert(coreIsActive("party", "dot-range-mid"), "party core is always active");
assert(coreIsActive(undefined, null), "an untagged item is never gated");

assert(isDirectionalCore("close") && !isDirectionalCore("universal"),
  "only close/mid/far are directional");

// Guard against the original bug shape returning: a bare range word must not match.
assert(!coreIsActive("close", "close"),
  "a bare range word is not a selectedRange value and must not match");

// ── Every authored directional core is reachable by some build ───────────────

const directionalCores = [...RECIPE_DATABASE.values()].filter(
  (r) => r.slot === "core" && isDirectionalCore(r.rangeTag),
);
assert(directionalCores.length > 0, "expected at least one directional core authored");
for (const core of directionalCores) {
  assert(
    coreIsActive(core.rangeTag, `cadence-range-${core.rangeTag}`),
    `directional core ${core.id} (${core.rangeTag}) is unreachable by any build`,
  );
}

// ── Bench bots wear a core, and it is one that is actually ACTIVE ────────────

// Content tier 3 exercises the range-node path — which crashed with
// `unlock failed: range-close` until the range suffix was class-prefixed, so
// every content tier >= 3 was unrunnable.
const builds = enumerateBuildsForContentTier(3, "cave");
assert(builds.length > 0, "expected T3 builds to enumerate");

let sawCore = false;
for (const build of builds) {
  const range = build.skillPath.find((id) => id.includes("-range-")) ?? null;
  assert(range !== null, `T3 build ${build.id} should have picked a range node`);
  assert(
    range.startsWith(build.classRoot.replace(/-root$/, "")),
    `range node ${range} must be class-prefixed (the unlock-failure bug)`,
  );

  const coreId = build.gearItemIds.core;
  if (!coreId) continue; // no core authored at this tier/biome yet — see below
  sawCore = true;
  const recipe = RECIPE_DATABASE.get(coreId);
  assert(!!recipe, `core ${coreId} missing from RECIPE_DATABASE`);
  assert(
    coreIsActive(recipe!.rangeTag, range),
    `bench build ${build.id} equipped ${coreId} (${recipe!.rangeTag}) which is INACTIVE for ${range}`,
  );
}

// Cores are currently authored only in forest at the T2 band, so a T3 cave run
// legitimately finds none. Assert the selector at least ran rather than silently
// skipping — if this ever fires, cores stopped resolving, not stopped existing.
assert(
  sawCore || directionalCores.every((c) => c.tier !== 3),
  "no bench build equipped a core despite T3 cores being authored",
);

// ── The canonical loadout is populated, not empty ────────────────────────────

// Rebuilt here rather than imported so the test fails loudly if botFactory stops
// filling these — an empty loadout is exactly the silent regression to catch.
const slots = abilitySlotCount(4);
const techniques = [...ABILITY_DATABASE.values()].filter(
  (a) => a.slot === "technique" && a.tier <= 4,
);
const guards = [...ABILITY_DATABASE.values()].filter(
  (a) => a.slot === "guard" && a.tier <= 4,
);
assert(
  techniques.length >= slots.technique,
  `T4 grants ${slots.technique} technique slots but only ${techniques.length} abilities exist to fill them`,
);
assert(
  guards.length >= slots.guard,
  `T4 grants ${slots.guard} guard slots but only ${guards.length} abilities exist to fill them`,
);

// Global Mastery must reflect more than one biome, or the rune budget and the
// item-upgrade ceiling are both computed from a fiction.
assert(
  globalMastery({ forest: 6, plains: 6, clearing: 4 }) === 12,
  "globalMastery must sum real biomes and exclude the clearing",
);

console.log("coreRangeGate: ok");
