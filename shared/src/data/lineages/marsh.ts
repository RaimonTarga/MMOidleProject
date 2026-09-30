/**
 * The Marsh — Swamp mobility lineage, slow resistance (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Control) is the Marsh's existing mechanic — resisting slow. Lanes B/C
 * (Affliction, Bulwark) are the matrix's assignment, not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const MARSH_LINEAGE: LineageDefinition = {
  id: 'marsh',
  slot: 'mobility',
  homeBiome: 'swamp',
  lanes: ['control', 'affliction', 'bulwark'],

  forms: [
    { recipeId: 'swamp-boots-t1', tier: 1, biome: 'swamp' },
    {
      recipeId: 'swamp-boots-t2', tier: 2, biome: 'swamp',
      capstone: {
        id: 'marsh-capstone-wetland', name: 'Wetland Anchor',
        description: 'Holding still now keeps the ground treacherous instead of settling.',
        fx: 'control.chill-blur', lane: 'control',
        trigger: 'standing', payoff: 'stun',
      },
    },
  ],

  cards: [
    {
      id: 'marsh-t1-control-payoff', lineageId: 'marsh', tier: 1, row: 'payoff', lane: 'control',
      name: 'Sucking Ground', description: 'Hold your footing on the marsh and whatever follows does not.',
      fx: 'control.chill-blur', trigger: 'standing', payoff: 'stun',
      face: packetDefaultFace('control'),
    },
    {
      id: 'marsh-t1-affliction-payoff', lineageId: 'marsh', tier: 1, row: 'payoff', lane: 'affliction',
      name: 'Bog Gas', description: 'A kill stirs up the marsh floor around it.',
      fx: 'affliction.toxic-pulse', trigger: 'kill', payoff: 'poison-stack',
      face: packetDefaultFace('affliction'),
    },
    {
      id: 'marsh-t1-bulwark-payoff', lineageId: 'marsh', tier: 1, row: 'payoff', lane: 'bulwark',
      name: 'Sure Footing', description: 'The opening hit finds ground that was already braced for it.',
      fx: 'bulwark.plating-chip', trigger: 'first-hit', payoff: 'plating-stack',
      face: packetDefaultFace('bulwark'),
    },
  ],
};
