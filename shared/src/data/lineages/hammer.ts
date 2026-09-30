/**
 * The Hammer — Mountain weapon lineage, the stagger fantasy (design §3.2).
 *
 * Lanes: Empowered / Control / Engagement. Derived from the empowered-multiplier
 * bonus the hammer already carries, the stagger it wants to be about, and the
 * Mountain's approach boots.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';

export const HAMMER_LINEAGE: LineageDefinition = {
  id: 'hammer',
  slot: 'weapon',
  homeBiome: 'mountain',
  lanes: ['empowered', 'control', 'engagement'],

  forms: [
    { recipeId: 'heavy-hammer', tier: 1, biome: 'mountain' },
    {
      recipeId: 'quake-hammer', tier: 2, biome: 'mountain',
      capstone: {
        id: 'hammer-capstone-quake', name: 'Aftershock',
        description: 'The crash rings the ground and everything standing on it.',
        fx: 'empowered.quake-ring', lane: 'empowered',
        trigger: 'mechanic-fired', payoff: 'stun',
      },
    },
  ],

  cards: [
    {
      id: 'hammer-t1-empowered-stat', lineageId: 'hammer', tier: 1, row: 'stat', lane: 'empowered',
      name: 'Overhead', description: 'Everything above you becomes part of the blow.',
      fx: 'empowered.trail',
    },
    {
      id: 'hammer-t1-control-stat', lineageId: 'hammer', tier: 1, row: 'stat', lane: 'control',
      name: 'Crushing Weight', description: 'Heavy enough that being hit changes your plans.',
      fx: 'control.trail',
    },
    {
      id: 'hammer-t1-engagement-stat', lineageId: 'hammer', tier: 1, row: 'stat', lane: 'engagement',
      name: 'Closing Stride', description: 'The last three steps are the loud ones.',
      fx: 'engagement.trail',
    },

    {
      id: 'hammer-t1-empowered-payoff', lineageId: 'hammer', tier: 1, row: 'payoff', lane: 'empowered',
      name: 'Sunder', description: 'Your mechanic caves in the target’s plating.',
      fx: 'empowered.plating-crack', trigger: 'mechanic-fired', payoff: 'plating-shred',
    },
    {
      id: 'hammer-t1-control-payoff', lineageId: 'hammer', tier: 1, row: 'payoff', lane: 'control',
      name: 'Hobble', description: 'Every third hit leaves the target dragging.',
      fx: 'control.frost-drag', trigger: 'hit-nth', payoff: 'slow',
    },
    {
      id: 'hammer-t1-engagement-payoff', lineageId: 'hammer', tier: 1, row: 'payoff', lane: 'engagement',
      name: 'Set Feet', description: 'Opening a fight braced turns the first exchange aside.',
      fx: 'engagement.brace-sparks', trigger: 'first-hit', payoff: 'engagement-dr',
    },
  ],
};
