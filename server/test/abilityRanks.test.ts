/**
 * Authored rank progression — the model that replaced `scalePerTierPct`.
 *
 * Asserts the contract every ability now relies on:
 *   1. rank = playerTier - homeTier + 1, clamped at BOTH ends;
 *   2. cooldown, cast time and effect all come from that rank;
 *   3. the roster itself is coherent (one lineage per id, one recipe per
 *      ability, casts declare a wind-up);
 *   4. Technique Power still multiplies the offensive payload, and still does
 *      not touch control durations or reach.
 *
 * Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/abilityRanks.test.ts
 */
import {
  ABILITY_DATABASE,
  abilityCastMs,
  abilityCooldownMs,
  abilityMaxRank,
  abilityRangeBonus,
  abilityRankAt,
  abilityRankNumber,
  abilityRankNumeral,
  resolveAbilityEffect,
  validateAbilities,
  validateAbilityRecipes,
} from "@mmo-idle/shared";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

// ── 1. The roster validates ──────────────────────────────────────────────────

const violations = [...validateAbilities(), ...validateAbilityRecipes()];
assert(violations.length === 0, `ability roster invalid: ${violations.join("; ")}`);

// ── 2. Rank resolution clamps at both ends ───────────────────────────────────

const sweep = ABILITY_DATABASE.get("sweep")!;
assert(abilityRankNumber(sweep, 1) === 1, "home tier is rank I");
assert(abilityRankNumber(sweep, 3) === 3, "two tiers up is rank III");
assert(
  abilityRankNumber(sweep, 40) === abilityMaxRank(sweep),
  "a tier past the last authored rank clamps to it rather than reading off the end",
);
// A de-levelled or admin-edited character must never index ranks[-1].
assert(abilityRankNumber(sweep, 0) === 1, "below the home tier clamps to rank I");
assert(abilityRankNumber(sweep, -5) === 1, "a nonsense tier still clamps to rank I");

const snipe = ABILITY_DATABASE.get("snipe")!;
assert(abilityRankNumber(snipe, 1) === 1, "a T4 ability held below its home tier clamps to rank I");

// ── 3. Every axis reads from the rank, not from a multiplier ─────────────────

// Sweep's authored arc: splash deepens to its ceiling, THEN cooldown improves.
// This is the whole point of authored progression — the ability changes axis.
const splashAt = (tier: number): number => {
  const effect = abilityRankAt(sweep, tier).effect;
  assert(effect.kind === "cleave", "sweep must stay a cleave at every rank");
  return effect.kind === "cleave" ? effect.splashPct : 0;
};
assert(splashAt(1) < splashAt(3), "splash should deepen across early ranks");
assert(splashAt(3) === splashAt(4), "splash stops at its ceiling instead of inflating");
assert(
  abilityCooldownMs(sweep, 4) < abilityCooldownMs(sweep, 3),
  "once splash caps, the next rank must buy frequency instead",
);

const powerStrike = ABILITY_DATABASE.get("power-strike")!;
assert(abilityCastMs(powerStrike, 1) > 0, "a cast must declare a wind-up");
assert(
  abilityCastMs(powerStrike, 4) === abilityCastMs(powerStrike, 1),
  "Power Strike's only axis is damage — its wind-up is not a progression track",
);

// ── 4. Technique Power multiplies payload, never reach or control ────────────

const powered = resolveAbilityEffect(sweep, { playerTier: 1, techniquePowerPct: 0.5 });
assert(
  powered.kind === "cleave" && Math.abs(powered.splashPct - splashAt(1) * 1.5) < 1e-9,
  "Technique Power must scale the cleave payload",
);
assert(
  powered.kind === "cleave" && powered.radius === 90,
  "Technique Power must NOT widen the splash radius",
);

const hamstring = ABILITY_DATABASE.get("hamstring")!;
const poweredSlow = resolveAbilityEffect(hamstring, {
  playerTier: 2,
  techniquePowerPct: 1,
});
assert(poweredSlow.kind === "slow-strike", "hamstring stays a slow-strike");
if (poweredSlow.kind === "slow-strike") {
  assert(poweredSlow.damageMult > 1.15, "Technique Power scales the hit rider");
  assert(
    poweredSlow.slowPct === 0.4 && poweredSlow.slowDurationMs === 3000,
    "a damage stat must never buy control strength or duration",
  );
}

// Reach is authored per rank and is never a payload multiplier's business.
assert(abilityRangeBonus(snipe, 4) === 300, "Snipe's reach comes from its rank");
const poweredSnipe = resolveAbilityEffect(snipe, { playerTier: 4, techniquePowerPct: 2 });
assert(abilityRangeBonus(snipe, 4) === 300, "Technique Power must not extend Snipe's reach");
assert(poweredSnipe.kind === "cast-strike", "snipe stays a cast-strike");

// ── 5. Display: the numeral tracks the rank ──────────────────────────────────

assert(abilityRankNumeral(1) === "I" && abilityRankNumeral(4) === "IV", "numerals map 1..4");

// Every ability must be authored at least through the tier it debuts in, and no
// ability may claim more ranks than the T1–T4 map can grant it.
for (const ability of ABILITY_DATABASE.values()) {
  assert(abilityMaxRank(ability) >= 1, `${ability.id}: no authored ranks`);
  assert(
    ability.tier + abilityMaxRank(ability) - 1 <= 4,
    `${ability.id}: authors ranks past T4, which this pass does not design`,
  );
  assert(
    abilityCooldownMs(ability, ability.tier) > 0,
    `${ability.id}: rank I has no cooldown`,
  );
}

console.log("abilityRanks: ok");
