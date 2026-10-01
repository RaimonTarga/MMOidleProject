/**
 * The Fleet — Plains mobility lineage, kill momentum (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Kill chain) is the Fleet's existing mechanic. Lanes B/C (Tempo, Empowered)
 * are the matrix's assignment, not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const FLEET_LINEAGE: LineageDefinition = {
  id: 'fleet',
  slot: 'mobility',
  homeBiome: 'plains',
  lanes: ['kill-chain', 'tempo', 'empowered'],

  forms: [
    { recipeId: 'plains-boots-t1', tier: 1, biome: 'plains' },
    {
      recipeId: 'plains-boots-t2', tier: 2, biome: 'plains',
      capstone: {
        id: 'fleet-capstone-gale', name: 'Gale Boots',
        description: 'A kill now keeps the recovery window open instead of letting it lapse.',
        fx: 'kill-chain.recovery-pulse', lane: 'kill-chain',
        trigger: 'kill', payoff: 'recovery-window',
      },
    },
  {
    recipeId: 'graveyard-boots-t4', tier: 4, biome: 'graveyard',
    capstone: {
      id: 'fleet-capstone-grave-momentum', name: 'Grave Momentum',
      description: 'Every kill you leave behind lends its leftover hurry to your next stride.',
      fx: 'kill-chain.kill-pulse', lane: 'kill-chain',
      trigger: 'kill', payoff: 'speed-window',
    },
  },

  ],

  cards: [
    {
      id: 'fleet-t1-kill-chain-payoff', lineageId: 'fleet', tier: 1, row: 'payoff', lane: 'kill-chain',
      name: 'Running Start', description: 'A kill puts spring back in your step and your wounds both.',
      fx: 'kill-chain.recovery-pulse', trigger: 'kill', payoff: 'recovery-window',
      face: packetDefaultFace('kill-chain'),
    },
    {
      id: 'fleet-t1-tempo-payoff', lineageId: 'fleet', tier: 1, row: 'payoff', lane: 'tempo',
      name: 'Coiled Stance', description: 'The instant before the sprint is the one that counts.',
      fx: 'tempo.evasive-blur', trigger: 'standing', payoff: 'speed-window',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'fleet-t1-empowered-payoff', lineageId: 'fleet', tier: 1, row: 'payoff', lane: 'empowered',
      name: 'Charging Start', description: 'The opening hit lands with a full head of speed behind it.',
      fx: 'empowered.guard-spark', trigger: 'first-hit', payoff: 'vulnerability',
      face: packetDefaultFace('empowered'),
    },
  ],
};
