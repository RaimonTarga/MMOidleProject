/**
 * The Wing — Cave mobility lineage, stealth (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Engagement) is the matrix's assignment for Cave mobility — a first-strike
 * read on the item's stealth mechanic. Lanes B/C (Kill chain, Control) are
 * likewise not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const WING_LINEAGE: LineageDefinition = {
  id: 'wing',
  slot: 'mobility',
  homeBiome: 'cave',
  lanes: ['engagement', 'kill-chain', 'control'],

  forms: [
    { recipeId: 'cave-boots-t1', tier: 1, biome: 'cave' },
    {
      recipeId: 'cave-boots-t2', tier: 2, biome: 'cave',
      capstone: {
        id: 'wing-capstone-cavern', name: 'Cavern Sprint',
        description: 'The opening exchange keeps costing less, wherever the dark takes you next.',
        fx: 'engagement.sidestep-blur', lane: 'engagement',
        trigger: 'first-hit', payoff: 'engagement-dr',
      },
    },
  {
    recipeId: 'volcanic-boots-t3', tier: 3, biome: 'volcanic',
    capstone: {
      id: 'wing-capstone-ember-spark', name: 'Ember Spark',
      description: 'A kill restores the spark a solid hit just knocked loose.',
      fx: 'kill-chain.kill-pulse', lane: 'kill-chain',
      trigger: 'kill', payoff: 'speed-window',
    },
  },

  ],

  cards: [
    {
      id: 'wing-t1-engagement-payoff', lineageId: 'wing', tier: 1, row: 'payoff', lane: 'engagement',
      name: 'Silent Drop', description: 'Out of the dark, the first hit lands on you softer than it should.',
      fx: 'engagement.sidestep-blur', trigger: 'first-hit', payoff: 'engagement-dr',
      face: packetDefaultFace('engagement'),
    },
    {
      id: 'wing-t1-kill-chain-payoff', lineageId: 'wing', tier: 1, row: 'payoff', lane: 'kill-chain',
      name: 'Wingbeat', description: 'A kill and you are already airborne toward the next.',
      fx: 'kill-chain.recovery-pulse', trigger: 'kill', payoff: 'recovery-window',
      face: packetDefaultFace('kill-chain'),
    },
    {
      id: 'wing-t1-control-payoff', lineageId: 'wing', tier: 1, row: 'payoff', lane: 'control',
      name: 'Ambush Perch', description: 'Wait long enough in the dark and the pounce stuns on contact.',
      fx: 'control.chill-blur', trigger: 'standing', payoff: 'stun',
      face: packetDefaultFace('control'),
    },
  ],
};
