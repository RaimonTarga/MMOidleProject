// Wiring smoke test for seal-based tier advancement.
//
// A "seal" is a boss FIRST-CLEAR, not stored state: `bossesCleared` already
// persists one `biomeGroup:tier` key per boss felled, so seals held at tier T are
// the distinct entries whose tier part is T. Advancement is seals-only, sources
// are any distinct biome boss AT the player's current tier, and the requirement
// scales with tier.
//
// Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/tierSeals.test.ts

import {
  SEALS_REQUIRED_BY_TIER,
  SEAL_REQUIREMENT_CAP,
  bossClearKey,
  bossSealSourcesAtTier,
  sealsHeldAtTier,
  sealsRequiredForTier,
  tierAdvancementProgress,
  validateTierAdvancement,
} from "@mmo-idle/shared";
import { checkSealTierAdvance } from "../src/systems/player/progression/questSystem";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

// ── The boot invariant must hold for the shipped table ───────────────────────

assert(
  validateTierAdvancement().length === 0,
  `tier advancement table is unreachable: ${validateTierAdvancement().join("; ")}`,
);

// Every gated tier must leave the player a route CHOICE — demanding every boss
// at the tier turns "pick your biomes" into a completion checklist.
for (const [tierKey, required] of Object.entries(SEALS_REQUIRED_BY_TIER)) {
  const available = bossSealSourcesAtTier(Number(tierKey)).length;
  assert(
    available > required,
    `tier ${tierKey} demands ${required} of ${available} sources — no route choice left`,
  );
  assert(
    required <= SEAL_REQUIREMENT_CAP,
    `tier ${tierKey} demands ${required} seals, above the ${SEAL_REQUIREMENT_CAP} plateau`,
  );
}

// ── Counting seals ──────────────────────────────────────────────────────────

const cleared = [
  bossClearKey("forest", 1),
  bossClearKey("mountain", 1),
  bossClearKey("cave", 2),
];

assert(sealsHeldAtTier(cleared, 1) === 2, "two distinct T1 seals expected");
assert(sealsHeldAtTier(cleared, 2) === 1, "one T2 seal expected");
assert(sealsHeldAtTier(cleared, 3) === 0, "no T3 seals expected");

// Lower-tier clears must NOT count toward a higher tier — the locked rule is
// "any distinct boss AT your tier".
assert(
  sealsHeldAtTier([bossClearKey("forest", 1), bossClearKey("mountain", 1)], 2) === 0,
  "T1 clears must not count toward T2 advancement",
);

// Duplicate keys can't inflate the count, and a repeat clear mints nothing.
assert(
  sealsHeldAtTier([bossClearKey("forest", 1), bossClearKey("forest", 1)], 1) === 1,
  "the same biome boss must only ever count once",
);

// Non-biome tokens share the bossesCleared list and must never count.
assert(
  sealsHeldAtTier(["ultimate:void-overlord"], 1) === 0,
  "the void-overlord token is not a tier seal",
);
assert(
  sealsHeldAtTier(["not-a-biome:1"], 1) === 0,
  "an unknown biome group must not mint a seal",
);

// ── Tier 0 is not seal-gated (no bosses exist at tier 0) ─────────────────────

assert(sealsRequiredForTier(0) === 0, "tier 0 must not be seal-gated");
assert(
  tierAdvancementProgress([], 0).canAdvance === false,
  "tier 0 must never advance via the seal path — the tutorial quest owns it",
);

// ── The gate opens exactly at the requirement, not before ────────────────────

const t1Required = sealsRequiredForTier(1);
const t1Sources = bossSealSourcesAtTier(1);
assert(t1Required > 0, "tier 1 should be seal-gated");

const oneShort = t1Sources.slice(0, t1Required - 1).map((g) => bossClearKey(g, 1));
assert(
  tierAdvancementProgress(oneShort, 1).canAdvance === false,
  "one seal short must not advance",
);

const exact = t1Sources.slice(0, t1Required).map((g) => bossClearKey(g, 1));
const atGate = tierAdvancementProgress(exact, 1);
assert(atGate.canAdvance === true, "meeting the requirement exactly must advance");
assert(atGate.held === t1Required, "held count should equal the requirement");

// ── remainingSources answers "where do I get the next one" ───────────────────

assert(
  atGate.remainingSources.length === t1Sources.length - t1Required,
  "remainingSources should exclude biomes already cleared at this tier",
);
for (const group of atGate.remainingSources) {
  assert(
    !exact.includes(bossClearKey(group, 1)),
    `${group} is already cleared and must not be listed as remaining`,
  );
}

// A tier above the authored table is a ceiling, not an impossible gate.
assert(sealsRequiredForTier(99) === 0, "unmapped tiers must not be gated");
assert(
  tierAdvancementProgress([], 99).canAdvance === false,
  "an ungated tier must not auto-advance",
);

// ── The server-side advance applies the tier and the skill point ─────────────

// checkSealTierAdvance only reads/writes tracksProgression, so a minimal stand-in
// exercises it without standing up a World and a real boss kill.
function fakePlayer(bossesCleared: string[], playerTier: number) {
  return {
    tracksProgression: { bossesCleared, playerTier, skillPoints: 0 },
  } as unknown as Parameters<typeof checkSealTierAdvance>[0];
}

const short = fakePlayer(oneShort, 1);
assert(checkSealTierAdvance(short).advanced === false, "short of the gate must not advance");
assert(short.tracksProgression.playerTier === 1, "a refused advance must not change the tier");
assert(short.tracksProgression.skillPoints === 0, "a refused advance must not grant a skill point");

const ready = fakePlayer([...exact], 1);
const advance = checkSealTierAdvance(ready);
assert(advance.advanced === true, "meeting the gate must advance");
assert(advance.prevTier === 1 && advance.newTier === 2, "advance must report both tiers");
assert(ready.tracksProgression.playerTier === 2, "player tier must increment");
assert(ready.tracksProgression.skillPoints === 1, "advancing must grant one skill point");

// Re-running on the same state must NOT advance again: the player is now at
// tier 2 and holds no tier-2 seals. This is what makes the check safe to call on
// every boss kill.
assert(
  checkSealTierAdvance(ready).advanced === false,
  "advancing must not chain — a repeat call on the same clears must be inert",
);
assert(ready.tracksProgression.playerTier === 2, "tier must not double-advance");

console.log("tierSeals: ok");
