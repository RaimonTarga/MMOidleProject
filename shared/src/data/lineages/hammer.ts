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

  {
    recipeId: 'tundra-permafrost-maul', tier: 3, biome: 'tundra',
    capstone: {
      id: 'hammer-capstone-permafrost', name: 'Brittle Ground',
      description: 'Cracked plating holds the cold, and the cold holds the mover down.',
      fx: 'control.frost-drag', lane: 'control',
      trigger: 'hit-nth', payoff: 'slow',
    },
  },

  // ── T3 forms (design §18.5) ─────────────────────────────────────────────
  //
  // Authored from the existing `evolvesFrom` graph so no weapon dead-ends:
  // removing the +N ladder left every T3/T4 weapon craftable by nothing and
  // evolvable by nothing. The band above T2 carries FORMS ONLY — its cards are
  // Phase 5's, with the amplifier row and the T2+ magnitude columns.
  {
    recipeId: 'mountain-avalanche-maul', tier: 3, biome: 'mountain',
    capstone: {
      id: 'hammer-capstone-avalanche', name: 'Avalanche',
      description: 'The plate goes first, and it goes all at once.',
      fx: 'empowered.plating-crack', lane: 'empowered',
      trigger: 'mechanic-fired', payoff: 'plating-shred',
    },
  },
  {
    recipeId: 'mountain-earthsunder-maul', tier: 4, biome: 'mountain',
    capstone: {
      id: 'hammer-capstone-earthsunder', name: 'Earthsunder',
      description: 'What it lands on stops, and stays stopped long enough to notice.',
      fx: 'control.mire-grasp', lane: 'control',
      trigger: 'mechanic-fired', payoff: 'stun',
    },
  },
  {
    recipeId: 'mountain-warmaul', tier: 4, biome: 'mountain',
    capstone: {
      id: 'hammer-capstone-warmaul', name: 'Braced for It',
      description: 'The opening exchange is the one the bearer has already decided to survive.',
      fx: 'engagement.brace-sparks', lane: 'engagement',
      trigger: 'first-hit', payoff: 'engagement-dr',
    },
  },
  {
    recipeId: 'tundra-glacial-tyrant-maul', tier: 4, biome: 'tundra',
    capstone: {
      id: 'hammer-capstone-glacial-tyrant', name: 'Tyrant\'s Weight',
      description: 'Cold enough that the swing arrives before the sound of it.',
      fx: 'empowered.quake-ring', lane: 'empowered',
      trigger: 'mechanic-fired', payoff: 'damage-window',
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
