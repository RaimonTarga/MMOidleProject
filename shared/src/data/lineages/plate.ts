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
  ],
};
