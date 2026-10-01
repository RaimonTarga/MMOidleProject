/**
 * The Treads — Mountain mobility lineage, continuous gap closing (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Engagement) is the Treads' existing mechanic — approach speed. Lanes B/C
 * (Empowered, Control) are the matrix's assignment, not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const TREADS_LINEAGE: LineageDefinition = {
  id: 'treads',
  slot: 'mobility',
  homeBiome: 'mountain',
  lanes: ['engagement', 'empowered', 'control'],

  forms: [
    { recipeId: 'mountain-boots-t1', tier: 1, biome: 'mountain' },
    {
      recipeId: 'mountain-boots-t2', tier: 2, biome: 'mountain',
      capstone: {
        id: 'treads-capstone-stride', name: 'Mountain Stride',
        description: 'Every opening exchange now lands as light as the first, all fight long.',
        fx: 'engagement.sidestep-blur', lane: 'engagement',
        trigger: 'first-hit', payoff: 'engagement-dr',
      },
    },
  ],

  cards: [
    {
      id: 'treads-t1-engagement-payoff', lineageId: 'treads', tier: 1, row: 'payoff', lane: 'engagement',
      name: 'Closing Ground', description: 'The last three steps are the ones that matter, and they cost you less now.',
      fx: 'engagement.sidestep-blur', trigger: 'first-hit', payoff: 'engagement-dr',
      face: packetDefaultFace('engagement'),
    },
    {
      id: 'treads-t1-empowered-payoff', lineageId: 'treads', tier: 1, row: 'payoff', lane: 'empowered',
      name: 'Rooted Charge', description: 'Anchor first and whatever closes on you finds an opening.',
      fx: 'empowered.guard-spark', trigger: 'standing', payoff: 'vulnerability',
      face: packetDefaultFace('empowered'),
    },
    {
      id: 'treads-t1-control-payoff', lineageId: 'treads', tier: 1, row: 'payoff', lane: 'control',
      name: 'Aftershock Step', description: 'A kill leaves the ground around you unsteady for anything else nearby.',
      fx: 'control.chill-blur', trigger: 'kill', payoff: 'stun',
      face: packetDefaultFace('control'),
    },
  ],
};
