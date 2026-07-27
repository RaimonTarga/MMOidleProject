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

// Tier deepening is reported, not silently applied: a scaling ability described
// above its home tier must differ from the same ability at its home tier, and
// must say why.
const sweep = ABILITY_DATABASE.get("sweep")!;
const atHome = describeAbility(sweep, { ...context, playerTier: sweep.tier, passives: {} });
const deepened = describeAbility(sweep, { ...context, playerTier: sweep.tier + 2, passives: {} });
const homeSplash = atHome.lines.find((line) => line.key === "splashPct")!;
const deepSplash = deepened.lines.find((line) => line.key === "splashPct")!;
assert(homeSplash.value !== deepSplash.value, "tier deepening did not change the reported value");
assert(homeSplash.breakdown === undefined, "unscaled value should carry no breakdown");
assert(deepSplash.breakdown !== undefined, "scaled value must show its authored base");

// ── Units ────────────────────────────────────────────────────────────────────
// The failure this module exists to prevent is a fraction reported as "+0.18".

assert(formatPassiveValue("defense.shield-pct", 0.15) === "15%", "-pct must render as a percentage");
assert(formatPassiveValue("defense.dot-resistance", 0.18) === "18%", "unit-less fractions must render as percentages");
assert(formatPassiveValue("defense.shield-interval-ms", 8000) === "8s", "ms must render as seconds");
assert(formatPassiveValue("defense.shield-interval-ms", 250) === "250ms", "sub-second ms stays in ms");
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
const shieldRows = passiveLines({
  "defense.shield-pct": 0.15,
  "defense.shield-interval-ms": 8000,
  "defense.shield-duration-ms": 4000,
});
assert(shieldRows.length === 1, `companion keys should collapse, got ${shieldRows.length} rows`);
assert(shieldRows[0].value === "15%", `wrong headline value: ${shieldRows[0].value}`);
assert(
  shieldRows[0].detail.includes("8s") && shieldRows[0].detail.includes("4s"),
  `companions missing from detail: ${shieldRows[0].detail}`,
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
