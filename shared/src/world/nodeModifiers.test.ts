import {
  validateNodeModifiers,
  modifierStatScalars,
  modifiedDamageReduction,
  modifierDetails,
  modifierSpawnFactor,
  modifierRewardMult,
  catalystFamilyLabel,
  MODIFIER_LABELS,
  MODIFIER_SUMMARIES,
  MODIFIER_COLORS,
  NODE_MODIFIER_FAMILIES,
  MODIFIER_MAGNITUDE_BY_TIER,
  MODIFIER_BANS,
  NATIVE_MODIFIER,
} from './nodeModifiers';
import { NODE_MODIFIERS } from './nodeModifierMap';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

// ── 1. Authored map is valid ──────────────────────────────────────────────────
const violations = validateNodeModifiers();
assert(
  violations.length === 0,
  `NODE_MODIFIERS invalid:\n  ${violations.join('\n  ')}`,
);

// ── 2. Exactly five modifiers, each fully described ───────────────────────────
assert(NODE_MODIFIER_FAMILIES.length === 5, 'five modifiers');
assert(
  new Set(NODE_MODIFIER_FAMILIES).size === 5,
  'modifier list has no duplicates',
);
for (const family of NODE_MODIFIER_FAMILIES) {
  assert(Boolean(MODIFIER_LABELS[family]), `${family} has a label`);
  assert(Boolean(MODIFIER_SUMMARIES[family]), `${family} has a summary`);
  assert(Boolean(MODIFIER_COLORS[family]), `${family} has a color`);
  assert(
    catalystFamilyLabel(family) === `${MODIFIER_LABELS[family]} Catalyst`,
    `${family} catalyst label`,
  );
}

// ── 3. Every modifier is a NET difficulty increase ────────────────────────────
// This is the load-bearing property of the new design: the old families were
// threat-budget-neutral, these are not. A modifier must raise offence throughput,
// durability, or population — never leave a node at parity, and never soften it.
for (const tier of [1, 2, 3, 4]) {
  const m = MODIFIER_MAGNITUDE_BY_TIER[tier];
  assert(m !== undefined && m > 0, `magnitude for tier ${tier}`);

  for (const family of NODE_MODIFIER_FAMILIES) {
    const s = modifierStatScalars(family, tier);
    const dpsMult = s.attackMult / s.attackCooldownMult;
    const spawn = modifierSpawnFactor(family);
    const tougher =
      s.hpMult > 1 || s.platingMult > 1 || s.incomingDamageMult < 1;
    const harder = dpsMult > 1.0001 || tougher || spawn > 1;
    assert(harder, `${family} T${tier} must be a net difficulty increase`);
    assert(dpsMult >= 0.9999, `${family} T${tier} must not LOWER dps`);

    // Rewards must pay for the added difficulty.
    assert(modifierRewardMult(family) > 1, `${family} pays extra reward`);
  }
}

// ── 4. Per-modifier shape ─────────────────────────────────────────────────────
const tier = 2;
const m = MODIFIER_MAGNITUDE_BY_TIER[tier]!;

// alacrity: faster attacks AND faster movement, with damage untouched.
const alacrity = modifierStatScalars('alacrity', tier);
assert(alacrity.attackMult === 1, 'alacrity leaves attack damage alone');
assert(alacrity.attackCooldownMult < 1, 'alacrity attacks faster');
assert(alacrity.moveSpeedMult > 1, 'alacrity moves faster');
assert(modifierSpawnFactor('alacrity') === 1, 'alacrity does not change count');

// heavy: bigger hits, slower cadence, net more damage.
const heavy = modifierStatScalars('heavy', tier);
assert(heavy.attackMult > 1 + m, 'heavy hits harder than its cadence loss');
assert(heavy.attackCooldownMult > 1, 'heavy attacks slower');
assert(
  heavy.attackMult / heavy.attackCooldownMult > 1,
  'heavy is net dps-positive',
);

// swarming: population only, stats untouched.
const swarming = modifierStatScalars('swarming', tier);
assert(
  swarming.attackMult === 1 &&
    swarming.attackCooldownMult === 1 &&
    swarming.hpMult === 1 &&
    swarming.platingMult === 1 &&
    swarming.incomingDamageMult === 1 &&
    swarming.moveSpeedMult === 1,
  'swarming changes no stat',
);
assert(modifierSpawnFactor('swarming') > 1, 'swarming raises the count');

// dominion: fewer bodies, stronger in every respect.
const dominion = modifierStatScalars('dominion', tier);
assert(modifierSpawnFactor('dominion') < 1, 'dominion lowers the count');
assert(
  dominion.attackMult > 1 &&
    dominion.hpMult > 1 &&
    dominion.platingMult > 1 &&
    dominion.incomingDamageMult < 1 &&
    dominion.moveSpeedMult > 1,
  'dominion raises every aspect',
);
assert(
  dominion.moveSpeedMult < dominion.attackMult,
  'dominion move speed rises more slowly than its damage',
);

// fortified: defence only.
const fortified = modifierStatScalars('fortified', tier);
assert(
  fortified.attackMult === 1 && fortified.attackCooldownMult === 1,
  'fortified leaves offence alone',
);
assert(fortified.moveSpeedMult === 1, 'fortified leaves speed alone');
assert(fortified.platingMult > 1, 'fortified raises plating');
assert(fortified.incomingDamageMult < 1, 'fortified reduces damage taken');
assert(modifierSpawnFactor('fortified') === 1, 'fortified does not change count');

// ── 5. Damage-reduction folding stays in range ────────────────────────────────
// The multiplicative form must work from DR 0 (where a naive `DR × k` cannot) and
// must never reach 1.0, which would make a monster immortal.
assert(
  modifiedDamageReduction(0, 1 - m) > 0,
  'a 0-DR monster still gains reduction',
);
for (const baseDr of [0, 0.05, 0.1, 0.2, 0.5, 0.9, 0.95]) {
  for (const mult of [1, 0.85, 0.7, 0.5, 0.1]) {
    const dr = modifiedDamageReduction(baseDr, mult);
    assert(dr >= 0 && dr <= 0.95, `DR ${baseDr}x${mult} stays within [0, 0.95]`);
    assert(dr >= baseDr - 1e-9, `DR ${baseDr}x${mult} never drops below base`);
  }
}
// Epsilon, not equality: the fold is `1 - (1 - dr) * mult`, so an identity multiplier
// still round-trips through float subtraction (0.3 comes back as 0.30000000000000004).
assert(
  Math.abs(modifiedDamageReduction(0.3, 1) - 0.3) < 1e-9,
  'a neutral multiplier is identity',
);

// ── 6. Neutral outside the authored tiers ─────────────────────────────────────
const untiered = modifierStatScalars('dominion', 99);
assert(
  untiered.attackMult === 1 && untiered.hpMult === 1,
  'unknown tier yields no reshaping',
);

// ── 7. UI details are populated and mention the reward ────────────────────────
for (const family of NODE_MODIFIER_FAMILIES) {
  const rows = modifierDetails(family, 1);
  assert(rows.length > 0, `${family} has detail rows`);
  assert(
    rows.some((detail) => detail.label === 'Rewards'),
    `${family} surfaces its reward bonus`,
  );
  for (const detail of rows) {
    assert(detail.value.length > 0, `${family} detail '${detail.label}' has a value`);
  }
}
assert(
  modifierDetails('swarming', 1).some((d) => d.label === 'Monster count'),
  'swarming reports its count change',
);

// ── 8. A native modifier is never also banned for its own biome ───────────────
for (const [biome, native] of Object.entries(NATIVE_MODIFIER)) {
  if (!native) continue;
  assert(
    !(MODIFIER_BANS[biome] ?? []).includes(native),
    `${biome}: native '${native}' must not be banned`,
  );
}

// ── 9. The projection only ever carries known modifiers ───────────────────────
const known = new Set<string>(NODE_MODIFIER_FAMILIES);
for (const [nodeId, info] of Object.entries(NODE_MODIFIERS)) {
  assert(known.has(info.modifier), `${nodeId}: unknown modifier '${info.modifier}'`);
}

// ── 10. Unknown catalyst keys stay readable ───────────────────────────────────
// Wallets persisted under a previous modifier set keep their old keys, so the label
// helper must not return a blank or throw on them.
assert(
  catalystFamilyLabel('blight') === 'Blight Catalyst',
  'a retired catalyst key still renders',
);

console.log('nodeModifiers: ok');
