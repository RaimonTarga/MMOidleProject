// ─── Authored per-node modifier assignments (Map Variety Stage A) ─────────────
//
// One PACE family per non-excluded node (its personality + catalyst key), plus an
// optional DENSITY modifier on a sparing subset. Authored by hand against the
// current 11×11 grid (`NODE_BIOMES`); Stage B replaces the grid with regions and
// this table is re-authored then (acknowledged throwaway — the SYSTEMS are not).
//
// EXCLUDED (no entry here): clearing, test room, the Void Overlord throne, and
// ALL DUNGEON NODES — dungeons are static hand-designed exams and are never
// reshaped (user decision 2026-07-24).
//
// Rules enforced by `validateNodeModifiers()` (see nodeModifiers.ts):
//   - hard pace/density bans per biome (design §1.5 table)
//   - every pace family on ≥1 node within each tier band
//   - each biome's native family STRICTLY most frequent + present per tier band
//   - Elite Ground only where the biome's pool has an elite (Swarming: anywhere)
// Foreign (non-native) families are the authored minority spice per biome.
// This is balance-adjacent data — the user reviews/retunes it directly.
//
// Grouped by biome, roughly following the geographic wedges in `nodeBiomes.ts`.

import type { NodeModifierInfo } from './nodeModifiers';

export const NODE_MODIFIERS: Record<string, NodeModifierInfo> = {
  // ── TUNDRA (native Brutality; Alacrity banned) ──────────────────────────────
  'node-0-1': { pace: 'brutality' },
  'node-0-2': { pace: 'blight', density: 'elite-ground' }, // hit-to-dot armor is DoT-adjacent (apt)
  'node-1-0': { pace: 'brutality' },
  'node-1-1': { pace: 'brutality' },
  'node-2-0': { pace: 'brutality' },
  'node-2-1': { pace: 'volatility' },
  'node-3-0': { pace: 'brutality' },
  'node-3-1': { pace: 'blight' },
  'node-4-0': { pace: 'brutality' },
  'node-5-0': { pace: 'predation' },

  // ── MOUNTAIN (native Brutality; Alacrity + Elite-Ground banned) ─────────────
  'node-0-3': { pace: 'brutality' },
  'node-0-4': { pace: 'brutality', density: 'swarming' }, // fun inversion
  'node-0-5': { pace: 'volatility' },
  'node-0-7': { pace: 'brutality' },
  'node-0-8': { pace: 'blight' },
  'node-1-2': { pace: 'brutality' },
  'node-1-3': { pace: 'brutality' },
  'node-2-3': { pace: 'brutality' },
  'node-2-4': { pace: 'predation' },
  'node-3-2': { pace: 'brutality' },
  'node-3-4': { pace: 'brutality' },
  'node-4-4': { pace: 'volatility' },

  // ── WASTELAND / graveyard (native Blight; Swarming banned, Elite-Ground authored) ─
  'node-0-9': { pace: 'blight', density: 'elite-ground' }, // "the horde falls silent…" (graveyard pool has an elite)
  'node-1-10': { pace: 'blight' }, // both graveyard normal nodes are Blight (native must strictly lead a 2-node biome)

  // ── CAVE (native Volatility; Elite-Ground banned) ───────────────────────────
  'node-1-5': { pace: 'volatility' },
  'node-1-6': { pace: 'volatility', density: 'swarming' }, // more of the cave's mixed pool
  'node-1-7': { pace: 'alacrity' },
  'node-1-8': { pace: 'blight' },
  'node-2-5': { pace: 'volatility' },
  'node-2-6': { pace: 'volatility' },
  'node-3-5': { pace: 'volatility' },
  'node-4-5': { pace: 'volatility' },

  // ── JUNGLE (native Alacrity; Brutality banned) ──────────────────────────────
  'node-2-9': { pace: 'alacrity' },
  'node-2-10': { pace: 'volatility' },
  'node-3-7': { pace: 'alacrity' },
  'node-3-8': { pace: 'predation' },
  'node-3-9': { pace: 'alacrity' },
  'node-4-9': { pace: 'blight' },
  'node-4-10': { pace: 'alacrity' },
  'node-5-9': { pace: 'alacrity', density: 'swarming' },
  'node-5-10': { pace: 'alacrity' },
  'node-6-10': { pace: 'alacrity', density: 'elite-ground' }, // jungle T4 pool has elites

  // ── PLAINS (no native — spread evenly across all five) ──────────────────────
  'node-4-2': { pace: 'predation' },
  'node-5-2': { pace: 'volatility' },
  'node-5-3': { pace: 'predation' },
  'node-5-4': { pace: 'brutality' },
  'node-6-3': { pace: 'volatility', density: 'swarming' },
  'node-6-4': { pace: 'alacrity' },

  // ── FOREST (native Alacrity; Brutality banned) ──────────────────────────────
  'node-4-6': { pace: 'alacrity' },
  'node-4-7': { pace: 'alacrity', density: 'swarming' }, // reinforces
  'node-5-6': { pace: 'alacrity' },
  'node-5-7': { pace: 'blight' },
  'node-5-8': { pace: 'volatility' }, // (no Elite Ground — forest pool has no elites)
  'node-6-8': { pace: 'alacrity' },

  // ── SWAMP (native Blight; no pace ban) ──────────────────────────────────────
  'node-6-5': { pace: 'blight' },
  'node-6-6': { pace: 'blight' },
  'node-7-5': { pace: 'blight' },
  'node-7-6': { pace: 'predation' },
  'node-7-7': { pace: 'blight' },
  'node-8-4': { pace: 'blight', density: 'swarming' },
  'node-8-5': { pace: 'volatility' },
  'node-8-7': { pace: 'blight' },
  'node-9-5': { pace: 'blight' }, // (no Elite Ground — swamp pool has no elites)
  'node-9-6': { pace: 'alacrity' },
  'node-9-7': { pace: 'blight' },

  // ── DESERT (native Predation; Alacrity + Elite-Ground banned) ───────────────
  'node-5-1': { pace: 'predation' },
  'node-6-0': { pace: 'predation' },
  'node-6-1': { pace: 'predation' },
  'node-7-0': { pace: 'brutality' },
  'node-7-2': { pace: 'predation' },
  'node-7-3': { pace: 'volatility' },
  'node-8-0': { pace: 'predation' },
  'node-8-1': { pace: 'predation', density: 'swarming' },
  'node-8-2': { pace: 'predation' },
  'node-9-1': { pace: 'blight' },
  'node-9-2': { pace: 'predation' },
  'node-9-3': { pace: 'predation' },
  'node-10-3': { pace: 'predation' },
  'node-10-4': { pace: 'brutality' },

  // ── VOLCANIC (native Blight; no pace ban) ───────────────────────────────────
  'node-7-8': { pace: 'blight' },
  'node-7-9': { pace: 'blight' },
  'node-7-10': { pace: 'volatility' },
  'node-8-8': { pace: 'blight' },
  'node-8-10': { pace: 'blight' },
  'node-9-8': { pace: 'alacrity' },
  'node-9-9': { pace: 'blight', density: 'swarming' },
  'node-9-10': { pace: 'blight' },
  'node-10-5': { pace: 'predation' },
  'node-10-6': { pace: 'blight', density: 'elite-ground' }, // volcanic T4 pool has an elite
  'node-10-7': { pace: 'volatility' },
  'node-10-8': { pace: 'blight' },
  'node-10-9': { pace: 'blight' },

  // ── TRENCH (native Predation; Elite-Ground banned) ──────────────────────────
  'node-10-1': { pace: 'predation', density: 'swarming' }, // flagship inversion (count-only; pool is all-elite)
};
