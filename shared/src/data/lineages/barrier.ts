/**
 * The Barrier — Mountain recovery lineage, raw Barrier capacity (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Barrier tempo) is the Barrier's existing mechanic. Lanes B/C (Bulwark,
 * Empowered) are the matrix's assignment, not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const BARRIER_LINEAGE: LineageDefinition = {
  id: 'barrier',
  slot: 'recovery',
  homeBiome: 'mountain',
  lanes: ['barrier-tempo', 'bulwark', 'empowered'],

  forms: [
    { recipeId: 'mountain-charm-t1', tier: 1, biome: 'mountain' },
    {
      recipeId: 'mountain-charm-t2', tier: 2, biome: 'mountain',
      capstone: {
        id: 'barrier-capstone-bulwark', name: 'Bulwark Heart',
        description: 'A broken barrier now refills and keeps the ward from fading right away.',
        fx: 'barrier-tempo.ward-shell', lane: 'barrier-tempo',
        trigger: 'barrier-break', payoff: 'ward',
      },
    },
  {
    recipeId: 'tundra-charm-t3', tier: 3, biome: 'tundra',
    capstone: {
      id: 'barrier-capstone-frozen-ground', name: 'Frozen Ground',
      description: "Frostward's chill keeps the plate restacking instead of resetting, the longer you hold your ground.",
      fx: 'bulwark.plating-chip', lane: 'bulwark',
      trigger: 'standing', payoff: 'plating-stack',
    },
  },

  ],

  cards: [
    {
      id: 'barrier-t1-barrier-tempo-payoff', lineageId: 'barrier', tier: 1, row: 'payoff', lane: 'barrier-tempo',
      name: 'Granite Refill', description: 'When the barrier cracks, the mountain sends more.',
      fx: 'barrier-tempo.ward-shell', trigger: 'barrier-break', payoff: 'ward',
      face: packetDefaultFace('barrier-tempo'),
    },
    {
      id: 'barrier-t1-bulwark-payoff', lineageId: 'barrier', tier: 1, row: 'payoff', lane: 'bulwark',
      name: 'Cairn Guard', description: 'Raising a guard stacks stone on stone.',
      fx: 'bulwark.plating-chip', trigger: 'guard-cast', payoff: 'plating-stack',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'barrier-t1-empowered-payoff', lineageId: 'barrier', tier: 1, row: 'payoff', lane: 'empowered',
      name: 'Pressure Point', description: "The barrier's own hum finds the weak spot for you.",
      fx: 'empowered.guard-spark', trigger: 'pulse', payoff: 'vulnerability',
      face: packetDefaultFace('empowered'),
    },
  ],
};
