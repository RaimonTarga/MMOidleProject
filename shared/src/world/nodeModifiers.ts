// ─── Node modifiers (Map Variety Stage A) ─────────────────────────────────────
//
// Every non-excluded node carries exactly one PACE family (its personality and
// catalyst key) and optionally one DENSITY modifier. This module owns:
//   - the family/density vocabulary, labels, summaries, and badge colors
//   - the biome ban tables + native-family table (design §1.5)
//   - the PURE, DETERMINISTIC reshaping math applied to non-boss monsters
//   - validation of the authored per-node assignment (`NODE_MODIFIERS`)
//
// It reshapes a monster's OFFENSE only (attack / cadence / opening / DoT /
// movement pressure) around a threat-budget-neutral centre — never HP, never
// player stats (design §1.3). All magnitudes below are PLACEHOLDER — the user
// owns numeric tuning; they live in one block so they are trivially retunable.

import type { MonsterDefinition } from '../data/monsters/types';
import type { MonsterDotEffect } from '../components/targeting/scriptsBoss';
import { NODE_BIOMES, TEST_ROOM_NODE_ID } from './nodeBiomes';
import { NODE_MODIFIERS } from './nodeModifierMap';
// Runtime-only refs used inside validateNodeModifiers (function body, not module
// top level) — safe despite the biomeDatabase → nodeModifiers import cycle.
import { BIOME_DATABASE } from '../biomeDatabase';
import { MONSTER_DATABASE } from '../monsterDatabase';

// ── Vocabulary ────────────────────────────────────────────────────────────────

export type PaceFamily =
  | 'alacrity'
  | 'brutality'
  | 'blight'
  | 'volatility'
  | 'predation';

/** Canonical order — used for fixed UI ordering (catalyst panel, legends). */
export const PACE_FAMILIES: PaceFamily[] = [
  'alacrity',
  'brutality',
  'blight',
  'volatility',
  'predation',
];

export type DensityModifier = 'swarming' | 'elite-ground';

export const DENSITY_MODIFIERS: DensityModifier[] = ['swarming', 'elite-ground'];

export interface NodeModifierInfo {
  pace: PaceFamily;
  density?: DensityModifier;
}

// ── Labels / player-facing copy ─────────────────────────────────────────────

export const PACE_FAMILY_LABELS: Record<PaceFamily, string> = {
  alacrity: 'Alacrity',
  brutality: 'Brutality',
  blight: 'Blight',
  volatility: 'Volatility',
  predation: 'Predation',
};

export const DENSITY_LABELS: Record<DensityModifier, string> = {
  swarming: 'Swarming',
  'elite-ground': 'Elite Ground',
};

/** One-line threat summary shown on the map (design §1.2 table). */
export const PACE_FAMILY_SUMMARIES: Record<PaceFamily, string> = {
  alacrity:
    'Faster, lighter attacks — monsters strike and move quicker but hit softer.',
  brutality:
    'Slower, heavier attacks — bigger spikes at a lower tempo.',
  blight:
    'Attacks carry damage-over-time; existing DoT is amplified and direct hits soften.',
  volatility:
    'Deterministic but irregular pressure — skip-beats and counted bursts.',
  predation:
    'Much harder opening strikes against full-HP targets, with weaker follow-up.',
};

export const DENSITY_SUMMARIES: Record<DensityModifier, string> = {
  swarming: 'Far more monsters, biased away from elites — volume is the threat.',
  'elite-ground':
    'Fewer monsters, biased toward the biome’s toughest entries — the horde falls silent, something bigger walks.',
};

/** Badge accent hues (readable in light+dark; user may retint). */
export const PACE_FAMILY_COLORS: Record<PaceFamily, string> = {
  alacrity: '#4fc3f7', // cyan — quick
  brutality: '#e57373', // red — heavy
  blight: '#81c784', // green — rot/DoT
  volatility: '#ba68c8', // purple — chaos
  predation: '#ffb74d', // amber — ambush
};

/**
 * Player-facing catalyst name for a pace family, e.g. `alacrity` → "Alacrity
 * Catalyst". Falls back to capitalizing an unknown key (mirrors the old
 * biome-keyed `catalystLabel` fallback behavior).
 */
export function catalystFamilyLabel(family: string): string {
  const name =
    PACE_FAMILY_LABELS[family as PaceFamily] ??
    family.charAt(0).toUpperCase() + family.slice(1);
  return `${name} Catalyst`;
}

// ── Ban / native tables (design §1.5) ─────────────────────────────────────────

/** Pace families a biome may NEVER carry ("✖ redundant" counts as banned). */
export const PACE_HARD_BANS: Record<string, PaceFamily[]> = {
  forest: ['brutality'],
  mountain: ['alacrity'],
  jungle: ['brutality'],
  desert: ['alacrity'],
  tundra: ['alacrity'],
};

/** Density modifiers a biome may NEVER carry. */
export const DENSITY_BANS: Record<string, DensityModifier[]> = {
  mountain: ['elite-ground'],
  cave: ['elite-ground'],
  desert: ['elite-ground'],
  trench: ['elite-ground'],
  graveyard: ['swarming'],
};

/** Each biome's native (most-common) family. `null` = no native (Plains). */
export const NATIVE_FAMILY: Record<string, PaceFamily | null> = {
  plains: null,
  forest: 'alacrity',
  mountain: 'brutality',
  swamp: 'blight',
  cave: 'volatility',
  jungle: 'alacrity',
  desert: 'predation',
  tundra: 'brutality',
  volcanic: 'blight',
  graveyard: 'blight',
  trench: 'predation',
};

// ── Reshaping magnitudes (PLACEHOLDER — user tunes here) ───────────────────────

/** Modifier strength by node tier (design §1.3 — sharper at higher tiers). */
export const PACE_MAGNITUDE_BY_TIER: Record<number, number> = {
  1: 0.15,
  2: 0.2,
  3: 0.25,
  4: 0.3,
};

/** Blight synthesized/amplified DoT shape (PLACEHOLDER). */
const BLIGHT_DOT_MAX_STACKS = 5;
const BLIGHT_DOT_TICK_MS = 1000;
const BLIGHT_DOT_DURATION_MS = 4000;
const BLIGHT_AMPLIFY_FACTOR = 2; // existing DoT damagePerStack ×(1 + AMPLIFY×M)

/** Predation opening-strike bonus factor (PLACEHOLDER): mult = 1 + FACTOR×M. */
const PREDATION_OPENER_FACTOR = 4;

/** Volatility synthesized cadence (no def cadence): every N attacks ×(1+FACTOR×M). */
const VOLATILITY_EVERY_N = 3;
const VOLATILITY_SPIKE_FACTOR = 3;

/** Density spawn-count multipliers (PLACEHOLDER — user tunes). */
const SWARMING_SPAWN_FACTOR = 1.75;
const ELITE_GROUND_SPAWN_FACTOR = 0.5;

/** Elite-vs-non-elite pool weights per density (PLACEHOLDER). */
const SWARMING_ELITE_WEIGHT = 0.25;
const ELITE_GROUND_ELITE_WEIGHT = 4;

function magnitudeForTier(biomeTier: number): number {
  return PACE_MAGNITUDE_BY_TIER[biomeTier] ?? 0;
}

// ── Stat reshaping (pure, threat-budget-neutral by construction) ───────────────

export interface PaceStatScalars {
  attackMult: number;
  attackCooldownMult: number;
  moveSpeedMult: number;
}

/**
 * Plain-scalar reshaping applied at spawn. Cooldown is time-between-attacks, so
 * a smaller cooldownMult = faster attacks. Each family keeps DPS on budget:
 *   - alacrity   : attack ×(1−M), cooldown ×(1−M) (DPS-neutral), move ×(1+M/2)
 *   - brutality  : attack ×(1+M), cooldown ×(1+M) (spikier, slower), move ×1
 *   - blight     : attack ×(1−M) (throughput returns as DoT), cooldown/move ×1
 *   - volatility : attack ×(1−M) (average restored by the counted burst)
 *   - predation  : attack ×(1−M/2) (the opener carries the rest)
 */
export function paceStatScalars(
  family: PaceFamily,
  biomeTier: number,
): PaceStatScalars {
  const m = magnitudeForTier(biomeTier);
  switch (family) {
    case 'alacrity':
      return {
        attackMult: 1 - m,
        attackCooldownMult: 1 - m,
        moveSpeedMult: 1 + m / 2,
      };
    case 'brutality':
      return {
        attackMult: 1 + m,
        attackCooldownMult: 1 + m,
        moveSpeedMult: 1,
      };
    case 'blight':
      return { attackMult: 1 - m, attackCooldownMult: 1, moveSpeedMult: 1 };
    case 'volatility':
      return { attackMult: 1 - m, attackCooldownMult: 1, moveSpeedMult: 1 };
    case 'predation':
      return { attackMult: 1 - m / 2, attackCooldownMult: 1, moveSpeedMult: 1 };
  }
}

// ── Mechanic overlays (added/amplified mechanics — ride `moddedByNode`) ────────

export interface PaceMechanicOverlay {
  /** Blight: resolved (already amplified/synthesized) monster DoT. */
  dot?: MonsterDotEffect;
  /** Predation: opening-strike multiplier (composes multiplicatively). */
  openingStrikeMult?: number;
  /**
   * Volatility: counted-burst pattern. When the def already has a
   * `cadenceFinisher`, `multiplier` is a RELATIVE amplification applied on the
   * def's beats; otherwise it is the absolute spike run on the overlay's own beat.
   */
  cadence?: { everyNAttacks: number; multiplier: number };
}

/**
 * Compute the mechanic overlay for a family/tier/def. Deterministic and pure —
 * no RNG (core invariant #1). Returns `{}` for alacrity/brutality.
 */
export function paceMechanicOverlay(
  family: PaceFamily,
  biomeTier: number,
  def: Pick<MonsterDefinition, 'stats' | 'dotEffect' | 'cadenceFinisher'> | undefined,
): PaceMechanicOverlay {
  const m = magnitudeForTier(biomeTier);
  if (m <= 0) return {};

  switch (family) {
    case 'blight': {
      const existing = def?.dotEffect;
      if (existing) {
        // Amplify in place; preserve debuffId so stacking identity is kept.
        return {
          dot: {
            ...existing,
            damagePerStack: Math.max(
              1,
              Math.round(existing.damagePerStack * (1 + BLIGHT_AMPLIFY_FACTOR * m)),
            ),
          },
        };
      }
      // Synthesize a generic DoT whose full-stack throughput ≈ M × base direct DPS.
      const attack = def?.stats.attack ?? 0;
      const cooldownMs = def?.stats.attackCooldown ?? 1000;
      const baseDps = cooldownMs > 0 ? (attack * 1000) / cooldownMs : attack;
      const targetDotDps = m * baseDps;
      // fullStackDps = damagePerStack × maxStacks × (1000 / tickIntervalMs)
      const perTickDps = BLIGHT_DOT_MAX_STACKS * (1000 / BLIGHT_DOT_TICK_MS);
      const damagePerStack = Math.max(
        1,
        Math.round(perTickDps > 0 ? targetDotDps / perTickDps : targetDotDps),
      );
      return {
        dot: {
          debuffId: 'blight',
          damagePerStack,
          maxStacks: BLIGHT_DOT_MAX_STACKS,
          tickIntervalMs: BLIGHT_DOT_TICK_MS,
          durationMs: BLIGHT_DOT_DURATION_MS,
        },
      };
    }
    case 'predation':
      return { openingStrikeMult: 1 + PREDATION_OPENER_FACTOR * m };
    case 'volatility': {
      const existing = def?.cadenceFinisher;
      if (existing && existing.everyNAttacks > 0) {
        return {
          cadence: { everyNAttacks: existing.everyNAttacks, multiplier: 1 + m },
        };
      }
      return {
        cadence: {
          everyNAttacks: VOLATILITY_EVERY_N,
          multiplier: 1 + VOLATILITY_SPIKE_FACTOR * m,
        },
      };
    }
    case 'alacrity':
    case 'brutality':
      return {};
  }
}

// ── Density reshaping (pure) ───────────────────────────────────────────────────

export function densitySpawnFactor(density: DensityModifier | undefined): number {
  if (density === 'swarming') return SWARMING_SPAWN_FACTOR;
  if (density === 'elite-ground') return ELITE_GROUND_SPAWN_FACTOR;
  return 1;
}

/**
 * Inverse of the spawn factor so aggregate reward throughput stays comparable
 * (design §1.6). PLACEHOLDER — the user tunes, since elite mobs already carry
 * higher per-kill rewards.
 */
export function densityRewardMult(density: DensityModifier | undefined): number {
  const factor = densitySpawnFactor(density);
  return factor > 0 ? 1 / factor : 1;
}

/** Spawn-pool selection weight for an entry given the node density. */
export function elitePoolWeight(
  density: DensityModifier | undefined,
  isElite: boolean,
): number {
  if (density === 'swarming') return isElite ? SWARMING_ELITE_WEIGHT : 1;
  if (density === 'elite-ground') return isElite ? ELITE_GROUND_ELITE_WEIGHT : 1;
  return 1;
}

// ── Exclusions + validation ───────────────────────────────────────────────────

/**
 * Nodes excluded from the modifier system entirely (design §1.1): the clearing,
 * the dev test room, and the Void Overlord throne (the `mobDensity: 0` node).
 */
export function isModifierExcludedNode(nodeId: string): boolean {
  if (nodeId === TEST_ROOM_NODE_ID) return true;
  const info = NODE_BIOMES[nodeId];
  if (!info) return true;
  if (info.biomeGroup === 'clearing') return true;
  if (info.mobDensity === 0) return true; // throne
  return false;
}

/**
 * Human-readable violations of the authored `NODE_MODIFIERS` map (empty = valid).
 * Stage A approximates the "regional supply" rule by TIER BAND (biomeTier).
 */
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
      violations.push(`${nodeId}: missing pace modifier`);
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
    const paceBans = PACE_HARD_BANS[info.biomeGroup] ?? [];
    if (paceBans.includes(mod.pace)) {
      violations.push(
        `${nodeId}: pace '${mod.pace}' is hard-banned for biome '${info.biomeGroup}'`,
      );
    }
    if (mod.density) {
      const densityBans = DENSITY_BANS[info.biomeGroup] ?? [];
      if (densityBans.includes(mod.density)) {
        violations.push(
          `${nodeId}: density '${mod.density}' is banned for biome '${info.biomeGroup}'`,
        );
      }
    }
  }

  // 3. Family supply per tier band: each family on ≥1 non-dungeon node.
  const bandFamilies = new Map<number, Set<PaceFamily>>();
  for (const [nodeId, mod] of Object.entries(NODE_MODIFIERS)) {
    const info = NODE_BIOMES[nodeId];
    if (!info || info.isDungeon) continue;
    if (!bandFamilies.has(info.biomeTier)) {
      bandFamilies.set(info.biomeTier, new Set());
    }
    bandFamilies.get(info.biomeTier)!.add(mod.pace);
  }
  for (const [band, families] of bandFamilies) {
    for (const family of PACE_FAMILIES) {
      if (!families.has(family)) {
        violations.push(
          `tier band ${band}: family '${family}' missing from all non-dungeon nodes`,
        );
      }
    }
  }

  // 4. Native distribution: native is that biome's single most-frequent family
  //    globally, and present on ≥1 non-dungeon node per band the biome appears in.
  const byBiome = new Map<
    string,
    { counts: Map<PaceFamily, number>; nativeNonDungeonBands: Set<number>; bands: Set<number> }
  >();
  for (const [nodeId, mod] of Object.entries(NODE_MODIFIERS)) {
    const info = NODE_BIOMES[nodeId];
    if (!info) continue;
    let rec = byBiome.get(info.biomeGroup);
    if (!rec) {
      rec = {
        counts: new Map(),
        nativeNonDungeonBands: new Set(),
        bands: new Set(),
      };
      byBiome.set(info.biomeGroup, rec);
    }
    rec.counts.set(mod.pace, (rec.counts.get(mod.pace) ?? 0) + 1);
    rec.bands.add(info.biomeTier);
    const native = NATIVE_FAMILY[info.biomeGroup];
    if (native && mod.pace === native && !info.isDungeon) {
      rec.nativeNonDungeonBands.add(info.biomeTier);
    }
  }
  for (const [biome, rec] of byBiome) {
    const native = NATIVE_FAMILY[biome];
    if (!native) continue; // Plains — no native to enforce
    // Native must STRICTLY exceed every other family's count (ties are not enough).
    const nativeCount = rec.counts.get(native) ?? 0;
    let tiedOrBeaten: PaceFamily | null = null;
    for (const family of PACE_FAMILIES) {
      if (family === native) continue;
      if ((rec.counts.get(family) ?? 0) >= nativeCount) {
        tiedOrBeaten = family;
        break;
      }
    }
    if (tiedOrBeaten) {
      violations.push(
        `biome '${biome}': native family '${native}' (${nativeCount}) does not strictly exceed '${tiedOrBeaten}' (${rec.counts.get(tiedOrBeaten) ?? 0})`,
      );
    }
    for (const band of rec.bands) {
      if (!rec.nativeNonDungeonBands.has(band)) {
        violations.push(
          `biome '${biome}' tier band ${band}: no non-dungeon node uses native family '${native}'`,
        );
      }
    }
  }

  // 5. Density nodes need a spawn pool with BOTH an elite and a non-elite entry,
  //    or elitePoolWeight cannot bias composition (design §1.6). Future-proofs
  //    Stage B authoring too.
  for (const [nodeId, mod] of Object.entries(NODE_MODIFIERS)) {
    if (!mod.density) continue;
    const info = NODE_BIOMES[nodeId];
    if (!info) continue;
    const pool =
      BIOME_DATABASE.get(info.biomeGroup)?.monsterPoolByTier[info.biomeTier] ?? [];
    let hasElite = false;
    let hasNonElite = false;
    for (const id of pool) {
      const def = MONSTER_DATABASE.get(id);
      if (!def) continue;
      if (def.elite) hasElite = true;
      else hasNonElite = true;
    }
    if (!hasElite || !hasNonElite) {
      violations.push(
        `${nodeId}: density '${mod.density}' needs a pool with both elite and non-elite entries ` +
          `(biome '${info.biomeGroup}' tier ${info.biomeTier} has elite=${hasElite}, nonElite=${hasNonElite})`,
      );
    }
  }

  return violations;
}
