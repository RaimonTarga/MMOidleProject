/**
 * The Plate — Mountain armor lineage, Guard-amplifying heavy plate (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Bulwark) is the Plate's existing mechanic. Lanes B/C (Barrier tempo, Control)
 * are the matrix's assignment, not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const PLATE_LINEAGE: LineageDefinition = {
  id: 'plate',
  slot: 'armor',
  homeBiome: 'mountain',
  lanes: ['bulwark', 'barrier-tempo', 'control'],

  forms: [
    { recipeId: 'mountain-vest-t1', tier: 1, biome: 'mountain' },
    {
      recipeId: 'mountain-vest-t2', tier: 2, biome: 'mountain',
      capstone: {
        id: 'plate-capstone-crusader', name: "Crusader's Ground",
        description: 'Holding ground now keeps building plate long after the usual limit.',
        fx: 'bulwark.plating-chip', lane: 'bulwark',
        trigger: 'standing', payoff: 'plating-stack',
      },
    },
  {
    recipeId: 'tundra-vest-t3', tier: 3, biome: 'tundra',
    capstone: {
      id: 'plate-capstone-glacial-ground', name: 'Glacial Ground',
      description: 'Holding position under fire leaves the ground around you frozen for anything that closes.',
      fx: 'control.chill-blur', lane: 'control',
      trigger: 'standing', payoff: 'stun',
    },
  },

  ],

  cards: [
    {
      id: 'plate-t1-bulwark-payoff', lineageId: 'plate', tier: 1, row: 'payoff', lane: 'bulwark',
      name: 'Guard Footing', description: 'Plant your feet and the plate answers in kind.',
      fx: 'bulwark.plating-chip', trigger: 'standing', payoff: 'plating-stack',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'plate-t1-barrier-tempo-payoff', lineageId: 'plate', tier: 1, row: 'payoff', lane: 'barrier-tempo',
      name: 'Granite Answer', description: 'A hit taken cracks the barrier open, not you.',
      fx: 'barrier-tempo.ward-shell', trigger: 'hit-taken', payoff: 'ward',
      face: packetDefaultFace('barrier-tempo'),
    },
    {
      id: 'plate-t1-control-payoff', lineageId: 'plate', tier: 1, row: 'payoff', lane: 'control',
      name: 'Sidestep and Check', description: 'Step clear and put them off balance for it.',
      fx: 'control.chill-blur', trigger: 'evade', payoff: 'stun',
      face: packetDefaultFace('control'),
    },

    // ── T2 payoff row (L3): the T1 payoff, grown up ─────────────────────────
    {
      id: 'plate-t2-bulwark-payoff', lineageId: 'plate', tier: 2, row: 'payoff', lane: 'bulwark',
      name: 'Unyielding Footing', description: 'The longer you hold the line, the less the plate has to answer for.',
      fx: 'bulwark.plating-chip', trigger: 'standing', payoff: 'plating-stack',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'plate-t2-barrier-tempo-payoff', lineageId: 'plate', tier: 2, row: 'payoff', lane: 'barrier-tempo',
      name: 'Granite Reply', description: 'Every hit that lands now cracks into a shell thick enough to matter.',
      fx: 'barrier-tempo.ward-shell', trigger: 'hit-taken', payoff: 'ward',
      face: packetDefaultFace('barrier-tempo'),
    },
    {
      id: 'plate-t2-control-payoff', lineageId: 'plate', tier: 2, row: 'payoff', lane: 'control',
      name: 'Check and Topple', description: 'Step clear and whatever missed you staggers harder for the miss.',
      fx: 'control.chill-blur', trigger: 'evade', payoff: 'stun',
      face: packetDefaultFace('control'),
    },

    // ── T2 amplifier row (L5): an extra trigger kind for the same payoff ────
    {
      id: 'plate-t2-bulwark-amplifier', lineageId: 'plate', tier: 2, row: 'amplifier', lane: 'bulwark',
      name: 'Reflex Plating', description: 'A clean dodge settles the plate exactly like holding the line would.',
      fx: 'bulwark.plating-chip', trigger: 'evade', payoff: 'plating-stack', modifies: 'plate-t2-bulwark-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'plate-t2-barrier-tempo-amplifier', lineageId: 'plate', tier: 2, row: 'amplifier', lane: 'barrier-tempo',
      name: 'Held Shell', description: 'Holding ground tops the shell up on its own, hit or no hit.',
      fx: 'barrier-tempo.ward-shell', trigger: 'standing', payoff: 'ward', modifies: 'plate-t2-barrier-tempo-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('barrier-tempo'),
    },
    {
      id: 'plate-t2-control-amplifier', lineageId: 'plate', tier: 2, row: 'amplifier', lane: 'control',
      name: 'Punished Contact', description: 'Taking the hit staggers them back just as hard as dodging it would.',
      fx: 'control.chill-blur', trigger: 'hit-taken', payoff: 'stun', modifies: 'plate-t2-control-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('control'),
    },
  ],
};
