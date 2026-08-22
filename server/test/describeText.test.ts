// Wiring smoke test for the client's `ui/describe` module — the seam that turns
// authored data into the numbers a player reads.
//
// It lives here because `scripts/run-tests.mjs` only discovers `server/test/` and
// `shared/src/`, and this is pure data-in/string-out logic with no DOM: the
// module's whole job is to never show a player a raw key, a wrong unit, or a
// NaN, and that is exactly what a test can hold. Nothing here asserts balance
// numbers — only that every authored shape produces something legible.

import {
  ABILITY_DATABASE,
  RITE_DATABASE,
  SKILL_TREE,
  STANCE_DATABASE,
} from "@mmo-idle/shared";
import { describeAbility } from "../../client/src/ui/describe/abilityText";
import { formatPassiveValue, passiveLines } from "../../client/src/ui/describe/passiveText";
import { statEffectLines } from "../../client/src/ui/describe/statEffectText";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const BAD = /NaN|undefined|\[object/;

// ── Every authored ability describes itself ──────────────────────────────────

const context = {
  playerTier: 3,
  passives: { "technique.power-pct": 0.2, "guard.potency-pct": 0.15 },
  attack: 120,
  maxHp: 800,
};

for (const ability of ABILITY_DATABASE.values()) {
  const described = describeAbility(ability, context);
  assert(described.trigger.length > 0, `${ability.id}: no trigger sentence`);
  assert(described.shape.length > 0, `${ability.id}: no shape sentence`);
  assert(described.lines.length > 0, `${ability.id}: no effect lines`);

  for (const line of described.lines) {
    assert(!BAD.test(line.value), `${ability.id}/${line.key}: bad value "${line.value}"`);
    assert(line.label.length > 0, `${ability.id}/${line.key}: no label`);
  }

  // Cooldown is universal — an ability that cannot state its cooldown is a hole
  // in the readout, whatever else it manages to say.
  assert(
    described.lines.some((line) => line.key === "cooldown"),
    `${ability.id}: no cooldown line`,
  );

  // A cast has to state its wind-up: it is the entire cost of the shape.
  if (ability.shape === "cast") {
    assert(
      described.lines.some((line) => line.key === "cast"),
      `${ability.id}: cast ability without a wind-up line`,
    );
  }
}

// Progression is AUTHORED, not scaled: describing an ability above its home tier
// reads a different RANK — a different value with no multiplier attached — and
// says which rank it is. A fabricated "×1.3 tier deepening" line here would be a
// lie about how the number was produced.
const sweep = ABILITY_DATABASE.get("sweep")!;
const atHome = describeAbility(sweep, { ...context, playerTier: sweep.tier, passives: {} });
const deepened = describeAbility(sweep, { ...context, playerTier: sweep.tier + 2, passives: {} });
const homeSplash = atHome.lines.find((line) => line.key === "splashPct")!;
const deepSplash = deepened.lines.find((line) => line.key === "splashPct")!;
assert(homeSplash.value !== deepSplash.value, "a later rank did not change the reported value");
assert(atHome.rank === "I", `home tier should be rank I, got ${atHome.rank}`);
assert(deepened.rank === "III", `two tiers up should be rank III, got ${deepened.rank}`);
assert(homeSplash.breakdown === undefined, "an authored rank carries no multiplier breakdown");
assert(deepSplash.breakdown === undefined, "an authored rank carries no multiplier breakdown");

// A REAL multiplier still has to show its authored base and where it came from.
const powered = describeAbility(sweep, {
  ...context,
  playerTier: sweep.tier,
  passives: { "technique.power-pct": 0.3 },
});
const poweredSplash = powered.lines.find((line) => line.key === "splashPct")!;
assert(poweredSplash.value !== homeSplash.value, "Technique Power did not change the value");
assert(
  poweredSplash.breakdown?.includes("Technique Power") === true,
  "a multiplied value must name the multiplier and its authored base",
);

// Every ability past its last authored rank clamps rather than reading past the
// end of the table — the T5+ story until bespoke ranks are written.
for (const ability of ABILITY_DATABASE.values()) {
  const beyond = describeAbility(ability, { ...context, playerTier: ability.tier + 12 });
  assert(
    beyond.rankLabel.includes("fully deepened"),
    `${ability.id}: rank should clamp past its last authored rank`,
  );
}

// An ability with extra reach must SAY so — that reach is the whole reason it is
// worth a slot, and it is invisible in every other line.
const snipe = ABILITY_DATABASE.get("snipe")!;
const sniped = describeAbility(snipe, { ...context, playerTier: snipe.tier, attackRange: 12 });
const reach = sniped.lines.find((line) => line.key === "rangeBonus");
assert(!!reach, "Snipe must report its ability reach");
assert(reach.value === "312px", `Snipe reach should fold in attack range, got ${reach.value}`);

// ── Units ────────────────────────────────────────────────────────────────────
// The failure this module exists to prevent is a fraction reported as "+0.18".

assert(formatPassiveValue("defense.barrier-pct", 0.15) === "15%", "-pct must render as a percentage");
assert(formatPassiveValue("defense.dot-resistance", 0.18) === "18%", "unit-less fractions must render as percentages");
assert(formatPassiveValue("defense.barrier-delay-ms", 8000) === "8s", "ms must render as seconds");
assert(formatPassiveValue("defense.barrier-delay-ms", 250) === "250ms", "sub-second ms stays in ms");
assert(formatPassiveValue("cadence.empowered-mult", 2.5) === "×2.5", "-mult must render as a multiplier");
assert(formatPassiveValue("cadence.threshold-mod", -2, { signed: true }) === "−2", "signed values keep their sign");

// ── Every authored passive shape produces legible rows ───────────────────────

const sources: { id: string; effects?: Record<string, number> }[] = [
  ...[...SKILL_TREE.values()].map((node) => ({
    id: node.id,
    effects: node.mechanicEffects as Record<string, number> | undefined,
  })),
  ...[...STANCE_DATABASE.values()].map((stance) => ({
    id: stance.id,
    effects: stance.mechanicEffects as Record<string, number> | undefined,
  })),
  ...[...RITE_DATABASE.values()].map((rite) => ({
    id: rite.id,
    effects: rite.mechanicEffects as Record<string, number> | undefined,
  })),
];

for (const source of sources) {
  for (const line of passiveLines(source.effects, { signed: true })) {
    assert(!BAD.test(line.value), `${source.id}/${line.key}: bad value "${line.value}"`);
    assert(!BAD.test(line.detail), `${source.id}/${line.key}: bad detail "${line.detail}"`);
    // A label that still contains a namespace or a dash means humanize() missed.
    assert(!line.label.includes("."), `${source.id}/${line.key}: raw key leaked into the label`);
    assert(line.label.length > 0, `${source.id}/${line.key}: empty label`);
  }
}

// Companion keys collapse into one row rather than three.
const barrierRows = passiveLines({
  "defense.barrier-pct": 0.15,
  "defense.barrier-delay-ms": 8000,
  "defense.barrier-recharge-pct": 0.4,
});
assert(barrierRows.length === 1, `companion keys should collapse, got ${barrierRows.length} rows`);
assert(barrierRows[0].value === "15%", `wrong headline value: ${barrierRows[0].value}`);
assert(
  barrierRows[0].detail.includes("8s") && barrierRows[0].detail.includes("40%"),
  `companions missing from detail: ${barrierRows[0].detail}`,
);

// A bare flag reads as a switch, not as the quantity "1".
const flagRow = passiveLines({ "cadence.detonation": 1 });
assert(flagRow[0].value === "Enabled", `flag should read as Enabled, got ${flagRow[0].value}`);

// ── Stat effects ─────────────────────────────────────────────────────────────

for (const node of SKILL_TREE.values()) {
  for (const line of statEffectLines(node.statEffects)) {
    assert(!BAD.test(line.value), `${node.id}/${line.key}: bad stat value "${line.value}"`);
    assert(/^[+−]/.test(line.value), `${node.id}/${line.key}: stat delta must be signed`);
  }
}

// A negative delta is a real trade and has to read as one.
const tradeoff = statEffectLines({ attack: -15, damageReduction: 0.15 });
assert(tradeoff.find((l) => l.key === "attack")!.good === false, "a stat loss must not read as a gain");
assert(tradeoff.find((l) => l.key === "damageReduction")!.value === "+15%", "fractions render as percentages");

console.log("describeText: ok");
