/**
 * The Bindings — Forest armor lineage, evasion that softens direct hits
 * (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Engagement) pairs with the Bindings' native face (Light frame = Avoid) even
 * though the item's own mechanic is evasion, not an opening burst — the matrix's
 * assignment, not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const BINDINGS_LINEAGE: LineageDefinition = {
  id: 'bindings',
  slot: 'armor',
  homeBiome: 'forest',
  lanes: ['engagement', 'tempo', 'affliction'],

  forms: [
    { recipeId: 'forest-vest-t1', tier: 1, biome: 'forest' },
    {
      recipeId: 'forest-vest-t2', tier: 2, biome: 'forest',
      capstone: {
        id: 'bindings-capstone-phantom', name: 'Phantom Guard',
        description: 'Every opening exchange now leaves the attacker worse for it, not just you better.',
        fx: 'engagement.sidestep-blur', lane: 'engagement',
        trigger: 'hit-taken', payoff: 'engagement-dr',
      },
    },
  {
    recipeId: 'jungle-vest-t2', tier: 2, biome: 'jungle',
    capstone: {
      id: 'bindings-capstone-spore-veil', name: 'Spore Veil',
      description: 'Slip the hit clean, and the air you left behind does the rest.',
      fx: 'affliction.venom-pips', lane: 'affliction',
      trigger: 'evade', payoff: 'poison-stack',
    },
  },

  ],

  cards: [
    {
      id: 'bindings-t1-engagement-payoff', lineageId: 'bindings', tier: 1, row: 'payoff', lane: 'engagement',
      name: 'Opening Guard', description: 'The first exchange costs you less than it looks.',
      fx: 'engagement.sidestep-blur', trigger: 'hit-taken', payoff: 'engagement-dr',
      face: packetDefaultFace('engagement'),
    },
    {
      id: 'bindings-t1-tempo-payoff', lineageId: 'bindings', tier: 1, row: 'payoff', lane: 'tempo',
      name: 'Slip and Go', description: 'A dodge that clears space also covers it.',
      fx: 'tempo.evasive-blur', trigger: 'evade', payoff: 'speed-window',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'bindings-t1-affliction-payoff', lineageId: 'bindings', tier: 1, row: 'payoff', lane: 'affliction',
      name: 'Jungle Weave', description: "Hold still and whatever grips you starts to regret it.",
      fx: 'affliction.toxic-pulse', trigger: 'standing', payoff: 'poison-stack',
      face: packetDefaultFace('affliction'),
    },
  ],
};
