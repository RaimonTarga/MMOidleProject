/**
 * The Stone — Plains recovery lineage, on-kill Recovery for chained packs
 * (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Kill chain) is the Stone's existing mechanic. Lanes B/C (Tempo, Engagement)
 * are the matrix's assignment, not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const STONE_LINEAGE: LineageDefinition = {
  id: 'stone',
  slot: 'recovery',
  homeBiome: 'plains',
  lanes: ['kill-chain', 'tempo', 'engagement'],

  forms: [
    { recipeId: 'plains-charm-t1', tier: 1, biome: 'plains' },
    {
      recipeId: 'plains-charm-t2', tier: 2, biome: 'plains',
      capstone: {
        id: 'stone-capstone-stalwart', name: 'Stalwart Heartbeat',
        description: 'The window a kill opens now refuses to fully close before the next one.',
        fx: 'kill-chain.recovery-pulse', lane: 'kill-chain',
        trigger: 'kill', payoff: 'recovery-window',
      },
    },
  {
    recipeId: 'desert-charm-t2', tier: 2, biome: 'desert',
    capstone: {
      id: 'stone-capstone-oasis-guard', name: 'Oasis Guard',
      description: 'A guard raised in the mirage-haze starts the fight already half-cleansed.',
      fx: 'engagement.sidestep-blur', lane: 'engagement',
      trigger: 'guard-cast', payoff: 'cleanse',
    },
  },

  ],

  cards: [
    {
      id: 'stone-t1-kill-chain-payoff', lineageId: 'stone', tier: 1, row: 'payoff', lane: 'kill-chain',
      name: 'Warmth of the Kill', description: 'Every kill keeps the stone glowing a little longer.',
      fx: 'kill-chain.recovery-pulse', trigger: 'kill', payoff: 'recovery-window',
      face: packetDefaultFace('kill-chain'),
    },
    {
      id: 'stone-t1-tempo-payoff', lineageId: 'stone', tier: 1, row: 'payoff', lane: 'tempo',
      name: 'Steady Hum', description: "The stone's pulse quickens your step along with your heart.",
      fx: 'tempo.evasive-blur', trigger: 'pulse', payoff: 'speed-window',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'stone-t1-engagement-payoff', lineageId: 'stone', tier: 1, row: 'payoff', lane: 'engagement',
      name: 'Sunrise Guard', description: 'Raise your guard and the opening exchange costs less.',
      fx: 'engagement.sidestep-blur', trigger: 'guard-cast', payoff: 'engagement-dr',
      face: packetDefaultFace('engagement'),
    },
  ],
};
