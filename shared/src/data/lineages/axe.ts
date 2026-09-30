/**
 * The Axe — Cave weapon lineage, the dead-swing chaos weapon (design §3.2).
 *
 * Lanes: Tempo / Kill chain / Empowered. Derived from the chaotic cadence it
 * already has (a dead swing every Nth hit), its 1.10 aps, and the Cave being the
 * premium biome.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';

export const AXE_LINEAGE: LineageDefinition = {
  id: 'axe',
  slot: 'weapon',
  homeBiome: 'cave',
  lanes: ['tempo', 'kill-chain', 'empowered'],

  forms: [
    { recipeId: 'chaotic-axe', tier: 1, biome: 'cave' },
    {
      recipeId: 'ruinous-axe', tier: 2, biome: 'cave',
      capstone: {
        id: 'axe-capstone-ruinous', name: 'Ruin Afterimage',
        description: 'The swing you wasted still lands, a beat behind you.',
        fx: 'tempo.ruin-afterimage', lane: 'tempo',
        trigger: 'hit-nth', payoff: 'echo-hit',
      },
    },
  ],

  cards: [
    {
      id: 'axe-t1-tempo-stat', lineageId: 'axe', tier: 1, row: 'stat', lane: 'tempo',
      name: 'Loose Grip', description: 'Let the head do the work and it comes back faster.',
      fx: 'tempo.trail',
    },
    {
      id: 'axe-t1-kill-chain-stat', lineageId: 'axe', tier: 1, row: 'stat', lane: 'kill-chain',
      name: 'Bloodscent', description: 'You move differently once something has gone down.',
      fx: 'kill-chain.trail',
    },
    {
      id: 'axe-t1-empowered-stat', lineageId: 'axe', tier: 1, row: 'stat', lane: 'empowered',
      name: 'Hewing Arc', description: 'A longer arc, and everything in it.',
      fx: 'empowered.trail',
    },

    {
      id: 'axe-t1-tempo-payoff', lineageId: 'axe', tier: 1, row: 'payoff', lane: 'tempo',
      name: 'Double Bite', description: 'Every third hit bites twice.',
      fx: 'tempo.ghost-strike', trigger: 'hit-nth', payoff: 'echo-hit',
    },
    {
      id: 'axe-t1-kill-chain-payoff', lineageId: 'axe', tier: 1, row: 'payoff', lane: 'kill-chain',
      name: 'Frenzy Step', description: 'A kill puts the next swings on a faster clock.',
      fx: 'kill-chain.kill-pulse', trigger: 'kill', payoff: 'speed-window',
    },
    {
      id: 'axe-t1-empowered-payoff', lineageId: 'axe', tier: 1, row: 'payoff', lane: 'empowered',
      name: 'Split Guard', description: 'Your mechanic leaves the target easier to hurt.',
      fx: 'empowered.weak-point', trigger: 'mechanic-fired', payoff: 'vulnerability',
    },
  ],
};
