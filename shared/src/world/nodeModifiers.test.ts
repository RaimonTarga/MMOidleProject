import {
  validateNodeModifiers,
  paceStatScalars,
  paceMechanicOverlay,
  catalystFamilyLabel,
  densitySpawnFactor,
  densityRewardMult,
  elitePoolWeight,
  PACE_FAMILIES,
  PACE_MAGNITUDE_BY_TIER,
  type PaceFamily,
} from './nodeModifiers';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

// ── 1. Authored map is valid ──────────────────────────────────────────────────
const violations = validateNodeModifiers();
assert(
  violations.length === 0,
  `NODE_MODIFIERS invalid:\n  ${violations.join('\n  ')}`,
);

// ── 2. Scalar neutrality sanity per family/tier ───────────────────────────────
for (const tier of [1, 2, 3, 4]) {
  const m = PACE_MAGNITUDE_BY_TIER[tier];
  assert(m !== undefined && m > 0, `magnitude for tier ${tier}`);

  // Alacrity & brutality keep DPS neutral: attackMult / cooldownMult ≈ 1.
  for (const fam of ['alacrity', 'brutality'] as PaceFamily[]) {
    const s = paceStatScalars(fam, tier);
    const ratio = s.attackMult / s.attackCooldownMult;
    assert(
      ratio >= 0.95 && ratio <= 1.05,
      `${fam} T${tier} DPS ratio off budget: ${ratio}`,
    );
  }

  // Volatility: (1−M) baseline × average cadence multiplier over its cycle ≈ 1.
  const vScalars = paceStatScalars('volatility', tier);
  const overlay = paceMechanicOverlay('volatility', tier, {
    stats: { attack: 100, attackCooldown: 1000 } as never,
    dotEffect: undefined,
    cadenceFinisher: undefined,
  });
  assert(overlay.cadence !== undefined, `volatility T${tier} has cadence`);
  const { everyNAttacks, multiplier } = overlay.cadence!;
  const avgCadence =
    ((everyNAttacks - 1) * 1 + multiplier) / everyNAttacks;
  const avgDamage = vScalars.attackMult * avgCadence;
  assert(
    avgDamage >= 0.9 && avgDamage <= 1.05,
    `volatility T${tier} cycle average off budget: ${avgDamage}`,
  );

  // Alacrity moves faster; brutality does not.
  assert(paceStatScalars('alacrity', tier).moveSpeedMult > 1, 'alacrity faster');
  assert(paceStatScalars('brutality', tier).moveSpeedMult === 1, 'brutality move');

  // Predation opener > 1.
  const pOverlay = paceMechanicOverlay('predation', tier, undefined);
  assert(
    (pOverlay.openingStrikeMult ?? 0) > 1,
    `predation T${tier} opener > 1`,
  );
}

// ── 3. Blight overlay: preserve debuffId when amplifying ───────────────────────
const authoredDot = {
  debuffId: 'venom',
  damagePerStack: 10,
  maxStacks: 4,
  tickIntervalMs: 1000,
};
const amplified = paceMechanicOverlay('blight', 3, {
  stats: { attack: 50, attackCooldown: 1000 } as never,
  dotEffect: authoredDot as never,
  cadenceFinisher: undefined,
});
assert(amplified.dot !== undefined, 'blight amplifies present dot');
assert(amplified.dot!.debuffId === 'venom', 'blight preserves debuffId');
assert(
  amplified.dot!.damagePerStack > authoredDot.damagePerStack,
  'blight raises damagePerStack',
);

// Blight synthesizes a DoT for a monster without one.
const synth = paceMechanicOverlay('blight', 2, {
  stats: { attack: 40, attackCooldown: 800 } as never,
  dotEffect: undefined,
  cadenceFinisher: undefined,
});
assert(synth.dot !== undefined, 'blight synthesizes dot when absent');
assert(synth.dot!.damagePerStack >= 1, 'synthesized dot has ≥1 per stack');

// ── 4. Label fallbacks ─────────────────────────────────────────────────────────
assert(catalystFamilyLabel('alacrity') === 'Alacrity Catalyst', 'known label');
assert(catalystFamilyLabel('mystery') === 'Mystery Catalyst', 'fallback label');

// ── 5. Density helpers ─────────────────────────────────────────────────────────
assert(densitySpawnFactor(undefined) === 1, 'no density spawn factor');
assert(densitySpawnFactor('swarming') > 1, 'swarming spawns more');
assert(densitySpawnFactor('elite-ground') < 1, 'elite-ground spawns fewer');
assert(
  Math.abs(densitySpawnFactor('swarming') * densityRewardMult('swarming') - 1) < 1e-9,
  'swarming reward neutrality',
);
assert(
  elitePoolWeight('elite-ground', true) > elitePoolWeight('swarming', true),
  'elite-ground favors elites over swarming',
);
assert(elitePoolWeight(undefined, true) === 1, 'no density = flat weight');

// Every family maps to a color/summary/label (sanity over the enum).
for (const fam of PACE_FAMILIES) {
  assert(catalystFamilyLabel(fam).endsWith('Catalyst'), `label for ${fam}`);
}

console.log('nodeModifiers.test: ok');
