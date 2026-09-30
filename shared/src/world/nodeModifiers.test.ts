import {
  validateNodeModifiers,
  MODIFIER_LABELS,
  MODIFIER_SUMMARIES,
  MODIFIER_COLORS,
  NODE_MODIFIER_FAMILIES,
  MODIFIER_BANS,
  NATIVE_MODIFIER,
} from './nodeModifiers';
import { NODE_MODIFIERS } from './nodeModifierMap';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

/**
 * Progression rework Phase 2b (2026-10-01): node modifiers no longer reshape
 * combat, population or rewards, and the catalyst wallet they used to mint is
 * gone. What survives is pure T2-T4 node-authoring identity — the vocabulary,
 * the ban/native tables and the coverage validation that keep node COUNT and
 * DISPLAY NAMES working. This file used to also assert the removed stat/
 * population/reward math (`modifierStatScalars`, `modifierSpawnFactor`,
 * `modifierRewardMult`, `modifiedDamageReduction`, `modifierDetails`,
 * `catalystFamilyLabel`) — that coverage is retired along with the math.
 */

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
}

// ── 3. A native modifier is never also banned for its own biome ───────────────
for (const [biome, native] of Object.entries(NATIVE_MODIFIER)) {
  if (!native) continue;
  assert(
    !(MODIFIER_BANS[biome] ?? []).includes(native),
    `${biome}: native '${native}' must not be banned`,
  );
}

// ── 4. The projection only ever carries known modifiers ───────────────────────
const known = new Set<string>(NODE_MODIFIER_FAMILIES);
for (const [nodeId, info] of Object.entries(NODE_MODIFIERS)) {
  assert(known.has(info.modifier), `${nodeId}: unknown modifier '${info.modifier}'`);
}

console.log('nodeModifiers: ok');
