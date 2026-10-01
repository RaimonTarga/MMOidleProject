/**
 * The Hide — Cave armor lineage, the %DR generalist wall (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Bulwark) is the Hide's existing mechanic. Lanes B/C (Kill chain, Engagement)
 * are the matrix's assignment, not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const HIDE_LINEAGE: LineageDefinition = {
  id: 'hide',
  slot: 'armor',
  homeBiome: 'cave',
  lanes: ['bulwark', 'kill-chain', 'engagement'],

  forms: [
    { recipeId: 'cave-vest-t1', tier: 1, biome: 'cave' },
    {
      recipeId: 'cave-vest-t2', tier: 2, biome: 'cave',
      capstone: {
        id: 'hide-capstone-dire', name: 'Dire Resolve',
        description: 'Every hit you hold through keeps the hide toughening, not just the first.',
        fx: 'bulwark.plating-chip', lane: 'bulwark',
        trigger: 'standing', payoff: 'plating-stack',
      },
    },
  ],

  cards: [
    {
      id: 'hide-t1-bulwark-payoff', lineageId: 'hide', tier: 1, row: 'payoff', lane: 'bulwark',
      name: 'Thick Hide', description: 'Hold still long enough and the hide toughens on its own.',
      fx: 'bulwark.plating-chip', trigger: 'standing', payoff: 'plating-stack',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'hide-t1-kill-chain-payoff', lineageId: 'hide', tier: 1, row: 'payoff', lane: 'kill-chain',
      name: 'Second Wind', description: 'A clean dodge is as good as a breath.',
      fx: 'kill-chain.recovery-pulse', trigger: 'evade', payoff: 'recovery-window',
      face: packetDefaultFace('kill-chain'),
    },
    {
      id: 'hide-t1-engagement-payoff', lineageId: 'hide', tier: 1, row: 'payoff', lane: 'engagement',
      name: 'Weathered Scar', description: 'The opening hit lands on ground that has taken worse.',
      fx: 'engagement.sidestep-blur', trigger: 'hit-taken', payoff: 'engagement-dr',
      face: packetDefaultFace('engagement'),
    },
  ],
};
