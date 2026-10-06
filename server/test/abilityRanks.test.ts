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
  TECHNIQUE_TEMPO_MIN_CYCLE_MS,
  abilityCastMs,
  abilityCooldownMs,
  abilityMaxRank,
  abilityRangeBonus,
  abilityRankAt,
  abilityRankNumber,
  abilityRankNumeral,
  abilityTempoRefundMs,
  resolveAbilityEffect,
  validateAbilities,
  validateAbilityRecipes,
} from "@mmo-idle/shared";

function assert(condition: unknown, message: string): void {
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
assert(abilityRankNumber(snipe, 1) === 1, "a T2 ability held below its home tier clamps to rank I");

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

// Frequency is the second axis, but it is bought as TEMPO, not as a shorter
// authored cooldown. A flat cut pays every build the same; Tempo pays per
// landed attack, which is what makes Sweep a real answer for the slow, heavy
// builds that struggle most against a pack. Rank I stays deliberately free of
// it so the first rank teaches only "arm, then hit".
assert(
  abilityTempoRefundMs(sweep, 1) === 0,
  "Sweep I must own no Tempo mechanic",
);
for (const tier of [2, 3, 4]) {
  assert(
    abilityTempoRefundMs(sweep, tier) > 0,
    `Sweep at player tier ${tier} must buy frequency through Tempo`,
  );
}
assert(
  abilityCooldownMs(sweep, 2) > abilityCooldownMs(sweep, 1),
  "the Tempo ranks pay for the mechanic with a longer base cooldown",
);
assert(
  abilityCooldownMs(sweep, 2) > TECHNIQUE_TEMPO_MIN_CYCLE_MS,
  "a Tempo cooldown must sit above the minimum cycle, or Tempo does nothing",
);

const slam = ABILITY_DATABASE.get("slam")!;
assert(abilityCastMs(slam, 1) > 0, "a cast must declare a wind-up");
assert(
  abilityCastMs(slam, 4) === abilityCastMs(slam, 1),
  "Slam's wind-up is not a progression track",
);

// ── 3b. A re-home adds exactly one rank at the new home (the ability pass) ───
//
// Design §22.2/§22.8: an ability's ranks are authored per tier from its home
// tier, so moving it to an earlier tier adds ONE rank there and re-indexes
// nothing else — a player at the old home tier and above reads exactly the rank
// they read before the move. Pinned by value at the old tiers.
const castDamageAt = (id: string, tier: number): number => {
  const effect = abilityRankAt(ABILITY_DATABASE.get(id)!, tier).effect;
  return effect.kind === "cast-strike" ? effect.damageMult : NaN;
};
assert(slam.tier === 1 && abilityMaxRank(slam) === 4, "Slam re-homes to T1 with one added rank");
assert(
  castDamageAt("slam", 2) === 1.75 && castDamageAt("slam", 3) === 2.0 && castDamageAt("slam", 4) === 2.25,
  "Slam's old T2–T4 ranks are untouched and not re-indexed",
);
assert(abilityCooldownMs(slam, 1) === 10000 && abilityCastMs(slam, 1) === 1600,
  "Slam rank I keeps Power Strike's cooldown and wind-up");
const chargeAt = (tier: number): number => {
  const effect = abilityRankAt(ABILITY_DATABASE.get("charge")!, tier).effect;
  return effect.kind === "reposition" ? effect.empowerMult ?? NaN : NaN;
};
assert(ABILITY_DATABASE.get("charge")!.tier === 1, "Charge re-homes to T1");
assert(chargeAt(2) === 2.2 && chargeAt(3) === 2.5 && chargeAt(4) === 2.8,
  "Charge's old T2–T4 ranks are untouched");
const rootAt = (tier: number): number => {
  const effect = abilityRankAt(ABILITY_DATABASE.get("binding-strike")!, tier).effect;
  return effect.kind === "root-strike" ? effect.rootMs : NaN;
};
assert(ABILITY_DATABASE.get("binding-strike")!.tier === 2, "Binding Strike re-homes to T2");
assert(rootAt(3) === 1500 && rootAt(4) === 2000, "Binding Strike's old T3–T4 ranks are untouched");
const imbue = ABILITY_DATABASE.get("imbue-lightning")!;
assert(imbue.tier === 3 && imbue.shape === "instant", "Imbue Lightning re-homes to T3 and is instant");
assert(abilityCastMs(imbue, 3) === 0 && abilityCastMs(imbue, 4) === 0, "an instant authors no wind-up");
assert(snipe.tier === 2 && abilityRangeBonus(snipe, 2) === 300, "Snipe re-homes to T2 with its reach");
assert(castDamageAt("snipe", 4) === 3.0, "Snipe's T4 rank is untouched");
const contagion = ABILITY_DATABASE.get("contagion")!;
assert(contagion.shape === "armed" && abilityCastMs(contagion, 2) === 0, "Contagion is armed, with no wind-up");

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

const bindingStrike = ABILITY_DATABASE.get("binding-strike")!;
const poweredRoot = resolveAbilityEffect(bindingStrike, {
  playerTier: 2,
  techniquePowerPct: 1,
});
assert(poweredRoot.kind === "root-strike", "binding strike stays a root-strike");
if (poweredRoot.kind === "root-strike") {
  assert(poweredRoot.damageMult > 1.2, "Technique Power scales the hit rider");
  assert(
    poweredRoot.rootMs === 1500,
    "a damage stat must never buy control duration",
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
