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

    // ── T2 band (design §4): stat (L2), payoff (L3), amplifier (L5) ──────────
    {
      id: 'hammer-t2-empowered-stat', lineageId: 'hammer', tier: 2, row: 'stat', lane: 'empowered',
      name: 'Full Overhead', description: 'Everything above you, and the roof besides.',
      fx: 'empowered.trail',
    },
    {
      id: 'hammer-t2-control-stat', lineageId: 'hammer', tier: 2, row: 'stat', lane: 'control',
      name: 'Heavier Still', description: 'Being hit by this changes plans a lot further out than before.',
      fx: 'control.trail',
    },
    {
      id: 'hammer-t2-engagement-stat', lineageId: 'hammer', tier: 2, row: 'stat', lane: 'engagement',
      name: 'Harder Stride', description: 'The last steps before the mountain were already loud.',
      fx: 'engagement.trail',
    },

    {
      id: 'hammer-t2-empowered-payoff', lineageId: 'hammer', tier: 2, row: 'payoff', lane: 'empowered',
      name: 'Deeper Sunder', description: 'Your mechanic caves the plating in further than it used to.',
      fx: 'empowered.plating-crack', trigger: 'mechanic-fired', payoff: 'plating-shred',
    },
    {
      id: 'hammer-t2-control-payoff', lineageId: 'hammer', tier: 2, row: 'payoff', lane: 'control',
      name: 'Worse Hobble', description: 'Every third hit leaves the target dragging harder.',
      fx: 'control.frost-drag', trigger: 'hit-nth', payoff: 'slow',
    },
    {
      id: 'hammer-t2-engagement-payoff', lineageId: 'hammer', tier: 2, row: 'payoff', lane: 'engagement',
      name: 'Firmer Feet', description: 'Opening a fight braced turns aside more of the first exchange.',
      fx: 'engagement.brace-sparks', trigger: 'first-hit', payoff: 'engagement-dr',
    },

    // Amplifiers modify this tier's own payoff card, not the T1 one (design §4).
    {
      id: 'hammer-t2-empowered-amplifier', lineageId: 'hammer', tier: 2, row: 'amplifier', lane: 'empowered',
      name: 'Shattering Crack', description: 'The crack reaches whatever stands beside the target too.',
      fx: 'empowered.plating-crack', trigger: 'mechanic-fired', payoff: 'plating-shred', modifies: 'hammer-t2-empowered-payoff',
      amplifies: 'targets',
    },
    {
      id: 'hammer-t2-control-amplifier', lineageId: 'hammer', tier: 2, row: 'amplifier', lane: 'control',
      name: 'Lingering Drag', description: 'The dragging legs do not catch up before the next blow lands.',
      fx: 'control.frost-drag', trigger: 'hit-nth', payoff: 'slow', modifies: 'hammer-t2-control-payoff',
      amplifies: 'duration',
    },
    {
      id: 'hammer-t2-engagement-amplifier', lineageId: 'hammer', tier: 2, row: 'amplifier', lane: 'engagement',
      name: 'Held Ground', description: 'The braced stance holds through more than just the opening blow.',
      fx: 'engagement.brace-sparks', trigger: 'first-hit', payoff: 'engagement-dr', modifies: 'hammer-t2-engagement-payoff',
      amplifies: 'duration',
    },

    // ── T3 keystone row (design §4 amended 2026-10-01): one shared keystone per
    // packet, this lineage's own flavour of it. Run 3 W1-B.
    {
      id: 'hammer-t3-empowered-keystone', lineageId: 'hammer', tier: 3, row: 'keystone', lane: 'empowered',
      name: 'Full Overhead Crash', description: 'What the mechanic lands on, the ground around it answers for too.',
      fx: 'empowered.keystone', trigger: 'mechanic-fired', payoff: 'damage-window',
    },
    {
      id: 'hammer-t3-control-keystone', lineageId: 'hammer', tier: 3, row: 'keystone', lane: 'control',
      name: 'Grinding Halt', description: 'Hit something already dragging and it roots; hit something rooted and it stops dead — once per step, per target.',
      fx: 'control.keystone', trigger: 'hit-nth', payoff: 'stun',
    },
    {
      id: 'hammer-t3-engagement-keystone', lineageId: 'hammer', tier: 3, row: 'keystone', lane: 'engagement',
      name: 'Braced for Each', description: 'Every new target meets the same braced opening the first one did.',
      fx: 'engagement.keystone', trigger: 'first-hit', payoff: 'damage-window',
    },

    // ── T4 cross row (design §4): a second lane's payoff at ROW_SCALAR.cross ──
    {
      id: 'hammer-t4-empowered-cross', lineageId: 'hammer', tier: 4, row: 'cross', lane: 'empowered',
      name: 'Sundered Stride', description: 'The caved-in plating drags on the legs besides.',
      fx: 'empowered.plating-crack', trigger: 'hit-nth', payoff: 'slow', borrowsLane: 'control',
    },
    {
      id: 'hammer-t4-control-cross', lineageId: 'hammer', tier: 4, row: 'cross', lane: 'control',
      name: 'Hobbled Opening', description: 'The dragging target turns aside less of the next exchange.',
      fx: 'control.frost-drag', trigger: 'first-hit', payoff: 'engagement-dr', borrowsLane: 'engagement',
    },
    {
      id: 'hammer-t4-engagement-cross', lineageId: 'hammer', tier: 4, row: 'cross', lane: 'engagement',
      name: 'Braced Sunder', description: 'The braced stance still finds a seam in the plating to open.',
      fx: 'engagement.brace-sparks', trigger: 'mechanic-fired', payoff: 'plating-shred', borrowsLane: 'empowered',
    },
  ],
};
