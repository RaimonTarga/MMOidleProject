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
        fx: 'engagement.mountain-stride', lane: 'engagement',
        trigger: 'first-hit', payoff: 'engagement-dr',
      },
    },
  {
    recipeId: 'tundra-boots-t3', tier: 3, biome: 'tundra',
    capstone: {
      id: 'treads-capstone-icebreaker', name: 'Icebreaker Stride',
      description: 'Every third stride plants enough ice to root whatever you pass.',
      fx: 'control.icebreaker', lane: 'control',
      trigger: 'hit-nth', payoff: 'stun',
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

    // ── T2 payoff row (L3): the T1 payoff, grown up ─────────────────────────
    {
      id: 'treads-t2-engagement-payoff', lineageId: 'treads', tier: 2, row: 'payoff', lane: 'engagement',
      name: 'Hard Ground', description: 'The last three steps now cost even less, whatever closes the gap.',
      fx: 'engagement.sidestep-blur', trigger: 'first-hit', payoff: 'engagement-dr',
      face: packetDefaultFace('engagement'),
    },
    {
      id: 'treads-t2-empowered-payoff', lineageId: 'treads', tier: 2, row: 'payoff', lane: 'empowered',
      name: 'Deep Root', description: 'Anchor first and the opening you leave for them runs deeper than before.',
      fx: 'empowered.guard-spark', trigger: 'standing', payoff: 'vulnerability',
      face: packetDefaultFace('empowered'),
    },
    {
      id: 'treads-t2-control-payoff', lineageId: 'treads', tier: 2, row: 'payoff', lane: 'control',
      name: 'Lasting Aftershock', description: 'The ground stays unsteady longer after a kill, for anything still close.',
      fx: 'control.chill-blur', trigger: 'kill', payoff: 'stun',
      face: packetDefaultFace('control'),
    },

    // ── T2 amplifier row (L5): an extra trigger kind for the same payoff ────
    {
      id: 'treads-t2-engagement-amplifier', lineageId: 'treads', tier: 2, row: 'amplifier', lane: 'engagement',
      name: 'Braced Ground', description: 'Anchoring before the approach keeps the discount live without the first hit.',
      fx: 'engagement.sidestep-blur', trigger: 'standing', payoff: 'engagement-dr', modifies: 'treads-t2-engagement-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('engagement'),
    },
    {
      id: 'treads-t2-empowered-amplifier', lineageId: 'treads', tier: 2, row: 'amplifier', lane: 'empowered',
      name: 'Killing Root', description: 'A kill leaves the same opening anchoring first would.',
      fx: 'empowered.guard-spark', trigger: 'kill', payoff: 'vulnerability', modifies: 'treads-t2-empowered-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('empowered'),
    },
    {
      id: 'treads-t2-control-amplifier', lineageId: 'treads', tier: 2, row: 'amplifier', lane: 'control',
      name: 'Opening Shock', description: 'The opening hit unsteadies the ground without waiting on a kill.',
      fx: 'control.chill-blur', trigger: 'first-hit', payoff: 'stun', modifies: 'treads-t2-control-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('control'),
    },
  ],
};
