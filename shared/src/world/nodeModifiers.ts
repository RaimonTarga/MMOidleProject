// ─── Node modifiers ───────────────────────────────────────────────────────────
//
// Progression rework Phase 2b (2026-10-01): node modifiers no longer reshape
// combat or rewards. T1 nodes get their personality from an authored family
// BLEND (`shared/src/data/families/`, `world/map/authoring.ts` `blends`) and
// the shard/capstone economy it drives. T2-T4 have no family tables yet, so
// their nodes still carry a `modifier` — it is AUTHORING IDENTITY ONLY now:
// the node-count source for a biome with no blend list
// (`normalNodeCountForBiome`), the input to display names (`displayNames.ts`),
// and the input to the hand-cut region masks (`validateBiomeCoverage`). There
// is no stat scalar, no population scalar, and no reward multiplier left —
// a Heavy node and an Alacrity node play identically.
//
// This module therefore keeps only:
//   - the modifier vocabulary, labels and badge colors (player-facing identity)
//   - the biome ban table + native-modifier table (re-exported for authoring)
//   - validation of the authored per-node assignment (`NODE_MODIFIERS`)
//
// The old catalyst wallet, the per-family reward premium, and the pure stat/
// population reshaping math (`modifierStatScalars`, `modifierSpawnFactor`,
// `modifierRewardMult`, `modifiedDamageReduction`, `modifiedDotDamagePerStack`)
// are DELETED, not merely unused — the family table that will eventually
// replace T2-T4 modifiers should not find any math to reuse here, only the
// authoring surface (node count + names + masks) it needs to keep working.

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

/**
 * One-line flavor shown on the map for a node with no family blend (T2-T4).
 * Identity only — no line here describes a stat, population or reward effect,
 * because none exists any more (Phase 2b).
 */
export const MODIFIER_SUMMARIES: Record<NodeModifierFamily, string> = {
  alacrity: 'A quicker-paced named variant of this biome.',
  heavy: 'A weightier named variant of this biome.',
  swarming: 'A denser named variant of this biome.',
  dominion: 'A named variant of this biome, after what walks it.',
  fortified: 'A sturdier-sounding named variant of this biome.',
};

/** Badge accent hues (readable in light+dark; user may retint). */
export const MODIFIER_COLORS: Record<NodeModifierFamily, string> = {
  alacrity: '#4fc3f7',  // cyan — quick
  heavy: '#e57373',     // red — heavy
  swarming: '#ffb74d',  // amber — many
  dominion: '#ba68c8',  // purple — the big one
  fortified: '#90a4ae', // steel — armour
};

// ── Exclusions + validation ───────────────────────────────────────────────────

/**
 * Nodes excluded from the modifier system entirely: the Clearing, the dev test
 * room, non-combat nodes (`mobDensity: 0`, currently sanctuaries), ALL
 * dungeon nodes — dungeons are static hand-designed exams and never carry one
 * (user decision 2026-07-24) — and a blend-authored node whose `modifier`
 * field was deleted outright (Phase 2b, 2026-10-01, T1 only: `info.blend &&
 * !info.modifier` is the live signal, since T2's own blends stay
 * dual-authored with BOTH fields for now — see `authoring.ts`'s
 * `dropsModifier`).
 */
export function isModifierExcludedNode(nodeId: string): boolean {
  if (nodeId === TEST_ROOM_NODE_ID) return true;
  const info = NODE_BIOMES[nodeId];
  if (!info) return true;
  if (info.biomeGroup === 'clearing') return true;
  if (info.mobDensity === 0) return true; // sanctuary or another non-combat node
  if (info.isDungeon) return true; // static exam — no modifier
  if (info.blend && !info.modifier) return true; // blend replaced modifier (Phase 2b, T1)
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
