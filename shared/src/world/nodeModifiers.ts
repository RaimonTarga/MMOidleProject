// ─── Node modifiers ───────────────────────────────────────────────────────────
//
// Every non-excluded node carries exactly ONE modifier, which is both its
// personality and its catalyst key. This module owns:
//   - the modifier vocabulary, labels, summaries, and badge colors
//   - the biome ban table + native-modifier table
//   - the PURE, DETERMINISTIC reshaping math applied to non-boss monsters
//   - spawn-count and reward scaling
//   - validation of the authored per-node assignment (`NODE_MODIFIERS`)
//
// Unlike the previous design, modifiers may reshape DEFENCE and POPULATION as well
// as offence, and they are not threat-budget-neutral — each is a net difficulty
// increase paid for with a reward multiplier. Bosses remain immune, and dungeons are
// excluded entirely (static hand-designed exams).
//
// There are no "mechanic overlays" any more: the old blight/volatility/predation
// families synthesised DoTs, counted bursts and opening strikes onto monsters at
// spawn. All five current modifiers are plain scalars plus a spawn count, so the
// overlay machinery (and the `moddedByNode` component that carried it) is gone.
//
// All magnitudes below are PLACEHOLDER — the user owns numeric tuning; they live in
// one block so they are trivially retunable.

import { NODE_BIOMES, TEST_ROOM_NODE_ID } from './nodeBiomes';
import { NODE_MODIFIERS } from './nodeModifierMap';
import {
  MODIFIER_BANS,
  NATIVE_MODIFIER,
  NODE_MODIFIER_FAMILIES,
  type NodeModifierFamily,
  type NodeModifierInfo,
} from './nodeModifierTypes';

export {
  MODIFIER_BANS,
  NATIVE_MODIFIER,
  NODE_MODIFIER_FAMILIES,
};
export type { NodeModifierFamily, NodeModifierInfo };

// ── Labels / player-facing copy ───────────────────────────────────────────────

export const MODIFIER_LABELS: Record<NodeModifierFamily, string> = {
  alacrity: 'Alacrity',
  heavy: 'Heavy',
  swarming: 'Swarming',
  dominion: 'Dominion',
  fortified: 'Fortified',
};

/** One-line threat summary shown on the map. */
export const MODIFIER_SUMMARIES: Record<NodeModifierFamily, string> = {
  alacrity:
    'Monsters attack and move faster, and hit just as hard.',
  heavy:
    'Slower attacks that land much harder — fewer, bigger spikes.',
  swarming:
    'Far more monsters. Volume is the threat.',
  dominion:
    'Fewer monsters, each stronger in every respect — the horde falls silent, something bigger walks.',
  fortified:
    'Monsters are armoured well past their kind — the same fight, twice as long.',
};

/** Badge accent hues (readable in light+dark; user may retint). */
export const MODIFIER_COLORS: Record<NodeModifierFamily, string> = {
  alacrity: '#4fc3f7',  // cyan — quick
  heavy: '#e57373',     // red — heavy
  swarming: '#ffb74d',  // amber — many
  dominion: '#ba68c8',  // purple — the big one
  fortified: '#90a4ae', // steel — armour
};

/**
 * Player-facing catalyst name for a modifier, e.g. `alacrity` → "Alacrity Catalyst".
 * Falls back to capitalizing an unknown key, which keeps stale wallet entries from a
 * previous modifier set readable rather than blank.
 */
export function catalystFamilyLabel(family: string): string {
  const name =
    MODIFIER_LABELS[family as NodeModifierFamily] ??
    family.charAt(0).toUpperCase() + family.slice(1);
  return `${name} Catalyst`;
}

// ── Magnitudes (PLACEHOLDER — user tunes here) ────────────────────────────────

/**
 * Modifier strength by node tier. Modifiers are a small distinction in T1 and grow
 * into a real one by T4 — a new player should barely notice which node they picked,
 * a late player should plan around it.
 */
export const MODIFIER_MAGNITUDE_BY_TIER: Record<number, number> = {
  1: 0.05,
  2: 0.1,
  3: 0.15,
  4: 0.2,
};

/**
 * Extra attack granted by `heavy` on top of its slower cadence, as a multiple of M.
 * `heavy` is net-positive DPS by design: attack ×(1 + HEAVY_ATTACK_FACTOR×M) against
 * a cadence of ×(1 + M), so at M=0.05 it deals ~5% more DPS in ~10% bigger bites.
 */
const HEAVY_ATTACK_FACTOR = 2;

/** `fortified` plating multiplier factor: plating ×(1 + FORTIFIED_PLATING_FACTOR×M). */
const FORTIFIED_PLATING_FACTOR = 2;

/**
 * `dominion` raises HP and armour by M and move speed by M/2 (a bigger monster
 * should not also be the fastest thing in the biome), but its ATTACK gets the same
 * ×(1+2M) as `heavy`.
 *
 * The attack factor is load-bearing, not flavour. Dominion removes bodies, and
 * sustained pressure is `d(N+1)/2` — so cutting the count drags pressure DOWN before
 * any stat rise. At the original ×(1+M) that made Dominion the SAFEST modifier in
 * every biome, quietly below an unmodified node, which is the opposite of its intent.
 * ×(1+2M) covers the body loss and leaves it a genuine increase.
 */
const DOMINION_MOVE_FACTOR = 0.5;
const DOMINION_ATTACK_FACTOR = 2;

/**
 * Spawn-count multipliers BY TIER. Damage taken from a pull is QUADRATIC in the
 * number of concurrent attackers (see tools/tier-table.ts), so these swing much
 * harder than they read, and they are deliberately timid.
 *
 * Population enters sustained pressure through `(N+1)/2`, which is far more sensitive
 * than any stat multiplier: a spread wider than the ×1.20 progression step between
 * biomes lets a Swarming Plains out-pressure a Dominion Forest and the biome order
 * stops being readable. Keeping the whole tier's spread inside that step is the
 * constraint these numbers exist to satisfy.
 */
const SWARMING_SPAWN_BY_TIER: Record<number, number> = {
  1: 1.08,
  2: 1.12,
  3: 1.16,
  4: 1.2,
};
const DOMINION_SPAWN_BY_TIER: Record<number, number> = {
  1: 0.95,
  2: 0.92,
  3: 0.88,
  4: 0.85,
};

/**
 * Per-kill reward premium, as a multiple of M: the payout is `1 + factor × M`, so it
 * scales with the tier exactly as the difficulty does.
 *
 * `swarming` is deliberately near zero: it already pays more per hour simply by
 * providing more bodies, so a large per-kill bonus on top would make it the only node
 * type worth farming. `dominion` pays most because it removes bodies AND strengthens
 * what remains, so each kill carries the whole difficulty increase.
 */
const MODIFIER_REWARD_FACTOR: Record<NodeModifierFamily, number> = {
  alacrity: 1,
  heavy: 0.8,
  swarming: 0.2,
  dominion: 2,
  fortified: 1.25,
};

function magnitudeForTier(biomeTier: number): number {
  return MODIFIER_MAGNITUDE_BY_TIER[biomeTier] ?? 0;
}

// ── Stat reshaping (pure) ─────────────────────────────────────────────────────

export interface ModifierStatScalars {
  attackMult: number;
  /** Time BETWEEN attacks, so below 1 means faster. */
  attackCooldownMult: number;
  moveSpeedMult: number;
  hpMult: number;
  platingMult: number;
  /**
   * Multiplier on the damage the monster TAKES, folded into damageReduction as
   * `DR' = 1 - (1 - DR) × incomingDamageMult`. Expressing it this way keeps the
   * result below 1 for any input and works even when the monster has DR 0, which a
   * naive `DR × k` cannot do.
   */
  incomingDamageMult: number;
}

const NEUTRAL: ModifierStatScalars = {
  attackMult: 1,
  attackCooldownMult: 1,
  moveSpeedMult: 1,
  hpMult: 1,
  platingMult: 1,
  incomingDamageMult: 1,
};

/**
 * Plain-scalar reshaping applied at spawn.
 *
 *   alacrity  : cadence ×(1−M) and move ×(1+M) with attack UNCHANGED, so it is a
 *               straight throughput increase — monsters are simply faster.
 *   heavy     : attack ×(1+2M) against cadence ×(1+M) — bigger bites, slower tempo,
 *               net more damage.
 *   swarming  : no stat change at all; its entire effect is population.
 *   dominion  : everything up by M (move by M/2), and population down.
 *   fortified : defence only — plating ×(1+2M) and incoming damage ×(1−M). Offence
 *               and speed untouched, so the fight is the same shape but far longer.
 */
export function modifierStatScalars(
  family: NodeModifierFamily,
  biomeTier: number,
): ModifierStatScalars {
  const m = magnitudeForTier(biomeTier);
  if (m <= 0) return { ...NEUTRAL };

  switch (family) {
    case 'alacrity':
      return { ...NEUTRAL, attackCooldownMult: 1 - m, moveSpeedMult: 1 + m };
    case 'heavy':
      return {
        ...NEUTRAL,
        attackMult: 1 + HEAVY_ATTACK_FACTOR * m,
        attackCooldownMult: 1 + m,
      };
    case 'swarming':
      return { ...NEUTRAL };
    case 'dominion':
      return {
        attackMult: 1 + DOMINION_ATTACK_FACTOR * m,
        attackCooldownMult: 1,
        moveSpeedMult: 1 + DOMINION_MOVE_FACTOR * m,
        hpMult: 1 + m,
        platingMult: 1 + m,
        incomingDamageMult: 1 - DOMINION_MOVE_FACTOR * m,
      };
    case 'fortified':
      return {
        ...NEUTRAL,
        platingMult: 1 + FORTIFIED_PLATING_FACTOR * m,
        incomingDamageMult: 1 - m,
      };
  }
}

/**
 * Scale a monster's damage-over-time under a node modifier.
 *
 * Without this, modifiers barely touched the DoT biomes at all — roughly 78% of
 * Swamp's output is poison, so its modifier spread was ×1.04 where every other biome
 * sat near ×1.18, making Swamp nodes nearly indistinguishable from one another.
 *
 * The scale is the modifier's NET DAMAGE multiplier (`attackMult / cooldownMult`),
 * not `attackMult` alone. The rule is "a modifier multiplies the monster's total
 * damage output"; direct damage realises that through attack and cadence together,
 * DoT realises it through damage-per-stack. Scaling DoT on `attackMult` alone would
 * hand `heavy` its full +30% on poison while the −15% cadence penalty that offsets it
 * applies only to direct hits — which made a Heavy Swamp ×1.30 where a Heavy Plains
 * was ×1.13, and pushed Swamp back over Mountain in the progression.
 *
 * The trade is a little physical nuance: capped DoT throughput does not really depend
 * on how fast the stacks were applied, so `alacrity` deepening poison is a modelling
 * convention rather than a simulation. It buys uniform modifier strength across every
 * biome, which is what keeps the biome order readable.
 */
export function modifiedDotDamagePerStack(
  baseDamagePerStack: number,
  family: NodeModifierFamily | undefined,
  biomeTier: number,
): number {
  if (!family) return baseDamagePerStack;
  const { attackMult, attackCooldownMult } = modifierStatScalars(family, biomeTier);
  const damageMult = attackMult / Math.max(0.01, attackCooldownMult);
  if (damageMult === 1) return baseDamagePerStack;
  return Math.max(1, Math.round(baseDamagePerStack * damageMult));
}

/** Resolve a monster's damageReduction under a modifier, clamped to [0, 0.95]. */
export function modifiedDamageReduction(
  baseDamageReduction: number,
  incomingDamageMult: number,
): number {
  const survived = (1 - baseDamageReduction) * incomingDamageMult;
  return Math.min(0.95, Math.max(0, 1 - survived));
}

// ── Population + rewards (pure) ───────────────────────────────────────────────

/** Multiplier on a node's target monster population. */
export function modifierSpawnFactor(
  family: NodeModifierFamily | undefined,
  biomeTier: number,
): number {
  if (family === 'swarming') return SWARMING_SPAWN_BY_TIER[biomeTier] ?? 1;
  if (family === 'dominion') return DOMINION_SPAWN_BY_TIER[biomeTier] ?? 1;
  return 1;
}

/**
 * Per-kill reward multiplier for essence / biome XP / catalyst progress, rounded to
 * the nearest whole percent so both the payout and its UI row stay legible.
 */
export function modifierRewardMult(
  family: NodeModifierFamily | undefined,
  biomeTier: number,
): number {
  if (!family) return 1;
  const m = magnitudeForTier(biomeTier);
  if (m <= 0) return 1;
  return 1 + Math.round((MODIFIER_REWARD_FACTOR[family] ?? 0) * m * 100) / 100;
}

// ── UI detail rows ────────────────────────────────────────────────────────────

export interface ModifierDetail {
  label: string;
  value: string;
  direction: 'up' | 'down' | 'neutral';
}

// Round before testing for integrality: 2 × 0.05 × 100 is 10.000000000000002 in
// floating point, which would otherwise render as "10.0".
const compactNumber = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

const signedPercent = (fraction: number): string => {
  const value = compactNumber(Math.abs(fraction) * 100);
  return `${fraction >= 0 ? '+' : '−'}${value}%`;
};

/**
 * Exact player-facing values for a modifier at a given biome tier.
 *
 * Every row here must mirror `modifierStatScalars` / `modifierSpawnFactor` /
 * `modifierRewardMult` exactly — this is a readout of the runtime, not a second
 * authoring of the numbers.
 */
export function modifierDetails(
  family: NodeModifierFamily,
  biomeTier: number,
): ModifierDetail[] {
  const m = magnitudeForTier(biomeTier);
  const rows: ModifierDetail[] = [];

  switch (family) {
    case 'alacrity':
      rows.push({ label: 'Attack interval', value: signedPercent(-m), direction: 'down' });
      rows.push({ label: 'Move speed', value: signedPercent(m), direction: 'up' });
      rows.push({ label: 'Attack damage', value: 'unchanged', direction: 'neutral' });
      break;
    case 'heavy':
      rows.push({
        label: 'Attack damage',
        value: signedPercent(HEAVY_ATTACK_FACTOR * m),
        direction: 'up',
      });
      rows.push({ label: 'Attack interval', value: signedPercent(m), direction: 'up' });
      break;
    case 'swarming':
      rows.push({
        label: 'Monster count',
        value: signedPercent(modifierSpawnFactor('swarming', biomeTier) - 1),
        direction: 'up',
      });
      rows.push({ label: 'Monster stats', value: 'unchanged', direction: 'neutral' });
      break;
    case 'dominion':
      rows.push({
        label: 'Monster count',
        value: signedPercent(modifierSpawnFactor('dominion', biomeTier) - 1),
        direction: 'down',
      });
      rows.push({ label: 'Health', value: signedPercent(m), direction: 'up' });
      rows.push({
        label: 'Attack damage',
        value: signedPercent(DOMINION_ATTACK_FACTOR * m),
        direction: 'up',
      });
      rows.push({ label: 'Plating', value: signedPercent(m), direction: 'up' });
      rows.push({
        label: 'Damage taken',
        value: signedPercent(-DOMINION_MOVE_FACTOR * m),
        direction: 'down',
      });
      rows.push({
        label: 'Move speed',
        value: signedPercent(DOMINION_MOVE_FACTOR * m),
        direction: 'up',
      });
      break;
    case 'fortified':
      rows.push({
        label: 'Plating',
        value: signedPercent(FORTIFIED_PLATING_FACTOR * m),
        direction: 'up',
      });
      rows.push({ label: 'Damage taken', value: signedPercent(-m), direction: 'down' });
      rows.push({ label: 'Offence', value: 'unchanged', direction: 'neutral' });
      break;
  }

  const reward = modifierRewardMult(family, biomeTier);
  if (reward !== 1) {
    rows.push({
      label: 'Rewards',
      value: signedPercent(reward - 1),
      direction: 'up',
    });
  }
  return rows;
}

// ── Exclusions + validation ───────────────────────────────────────────────────

/**
 * Nodes excluded from the modifier system entirely: the Clearing, the dev test
 * room, non-combat nodes (`mobDensity: 0`, currently sanctuaries), and ALL
 * dungeon nodes — dungeons are static hand-designed exams and are never
 * reshaped (user decision 2026-07-24).
 */
export function isModifierExcludedNode(nodeId: string): boolean {
  if (nodeId === TEST_ROOM_NODE_ID) return true;
  const info = NODE_BIOMES[nodeId];
  if (!info) return true;
  if (info.biomeGroup === 'clearing') return true;
  if (info.mobDensity === 0) return true; // sanctuary or another non-combat node
  if (info.isDungeon) return true; // static exam — no modifier
  return false;
}

/** Human-readable violations of the authored `NODE_MODIFIERS` map (empty = valid). */
export function validateNodeModifiers(): string[] {
  const violations: string[] = [];

  // 1. Coverage: every non-excluded node has exactly one entry; no strays.
  for (const nodeId of Object.keys(NODE_BIOMES)) {
    const excluded = isModifierExcludedNode(nodeId);
    const entry = NODE_MODIFIERS[nodeId];
    if (excluded && entry) {
      violations.push(`${nodeId}: excluded node must not have a modifier`);
    }
    if (!excluded && !entry) {
      violations.push(`${nodeId}: missing node modifier`);
    }
  }
  for (const nodeId of Object.keys(NODE_MODIFIERS)) {
    if (!NODE_BIOMES[nodeId]) {
      violations.push(`${nodeId}: modifier for unknown node`);
    } else if (isModifierExcludedNode(nodeId)) {
      violations.push(`${nodeId}: modifier on an excluded node`);
    }
  }

  // 2. Ban compliance.
  for (const [nodeId, mod] of Object.entries(NODE_MODIFIERS)) {
    const info = NODE_BIOMES[nodeId];
    if (!info) continue;
    const bans = MODIFIER_BANS[info.biomeGroup] ?? [];
    if (bans.includes(mod.modifier)) {
      violations.push(
        `${nodeId}: modifier '${mod.modifier}' is banned for biome '${info.biomeGroup}'`,
      );
    }
  }

  // 3. A native modifier must never also be banned for its own biome.
  for (const [biome, native] of Object.entries(NATIVE_MODIFIER)) {
    if (!native) continue;
    if ((MODIFIER_BANS[biome] ?? []).includes(native)) {
      violations.push(`biome '${biome}': native modifier '${native}' is also banned`);
    }
  }

  // 4. Supply per tier band: each modifier on ≥1 non-dungeon node.
  const bandModifiers = new Map<number, Set<NodeModifierFamily>>();
  for (const [nodeId, mod] of Object.entries(NODE_MODIFIERS)) {
    const info = NODE_BIOMES[nodeId];
    if (!info || info.isDungeon) continue;
    if (!bandModifiers.has(info.biomeTier)) {
      bandModifiers.set(info.biomeTier, new Set());
    }
    bandModifiers.get(info.biomeTier)!.add(mod.modifier);
  }
  for (const [band, families] of bandModifiers) {
    for (const family of NODE_MODIFIER_FAMILIES) {
      if (!families.has(family)) {
        violations.push(
          `tier band ${band}: modifier '${family}' missing from all non-dungeon nodes`,
        );
      }
    }
  }

  // 5. Native distribution: native is that biome's single most-frequent modifier
  //    globally, and present on ≥1 non-dungeon node per band the biome appears in.
  const byBiome = new Map<
    string,
    {
      counts: Map<NodeModifierFamily, number>;
      nativeNonDungeonBands: Set<number>;
      bands: Set<number>;
    }
  >();
  for (const [nodeId, mod] of Object.entries(NODE_MODIFIERS)) {
    const info = NODE_BIOMES[nodeId];
    if (!info) continue;
    let rec = byBiome.get(info.biomeGroup);
    if (!rec) {
      rec = { counts: new Map(), nativeNonDungeonBands: new Set(), bands: new Set() };
      byBiome.set(info.biomeGroup, rec);
    }
    rec.counts.set(mod.modifier, (rec.counts.get(mod.modifier) ?? 0) + 1);
    rec.bands.add(info.biomeTier);
    const native = NATIVE_MODIFIER[info.biomeGroup];
    if (native && mod.modifier === native && !info.isDungeon) {
      rec.nativeNonDungeonBands.add(info.biomeTier);
    }
  }
  for (const [biome, rec] of byBiome) {
    const native = NATIVE_MODIFIER[biome];
    if (!native) continue; // Plains — no native to enforce
    // Native must STRICTLY exceed every other modifier's count (ties are not enough).
    const nativeCount = rec.counts.get(native) ?? 0;
    let tiedOrBeaten: NodeModifierFamily | null = null;
    for (const family of NODE_MODIFIER_FAMILIES) {
      if (family === native) continue;
      if ((rec.counts.get(family) ?? 0) >= nativeCount) {
        tiedOrBeaten = family;
        break;
      }
    }
    if (tiedOrBeaten) {
      violations.push(
        `biome '${biome}': native modifier '${native}' (${nativeCount}) does not strictly exceed '${tiedOrBeaten}' (${rec.counts.get(tiedOrBeaten) ?? 0})`,
      );
    }
    for (const band of rec.bands) {
      if (!rec.nativeNonDungeonBands.has(band)) {
        violations.push(
          `biome '${biome}' tier band ${band}: no non-dungeon node uses native modifier '${native}'`,
        );
      }
    }
  }

  return violations;
}
