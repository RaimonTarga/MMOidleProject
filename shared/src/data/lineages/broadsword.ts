/**
 * The Broadsword — Plains weapon lineage, the generalist floor (design §3.2).
 *
 * Lanes: Kill chain / Empowered / Tempo. Derived from the Plains being the swarm
 * biome and from the technique CDR/power the sword already leans on.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';

export const BROADSWORD_LINEAGE: LineageDefinition = {
  id: 'broadsword',
  slot: 'weapon',
  homeBiome: 'plains',
  lanes: ['kill-chain', 'empowered', 'tempo'],

  forms: [
    { recipeId: 'iron-broadsword', tier: 1, biome: 'plains' },
    {
      recipeId: 'knight-steelsword', tier: 2, biome: 'plains',
      capstone: {
        id: 'broadsword-capstone-steelsword', name: 'Steel Vigil',
        description: 'Each kill opens a window where your wounds close fast.',
        fx: 'kill-chain.steel-vigil', lane: 'kill-chain',
        trigger: 'kill', payoff: 'recovery-window',
      },
    },
  ],

  cards: [
    {
      id: 'broadsword-t1-kill-chain-stat', lineageId: 'broadsword', tier: 1, row: 'stat', lane: 'kill-chain',
      name: 'Warpath', description: 'Ground covered between one body and the next.',
      fx: 'kill-chain.trail',
    },
    {
      id: 'broadsword-t1-empowered-stat', lineageId: 'broadsword', tier: 1, row: 'stat', lane: 'empowered',
      name: 'Weight Behind It', description: 'The whole shoulder goes into the swing.',
      fx: 'empowered.trail',
    },
    {
      id: 'broadsword-t1-tempo-stat', lineageId: 'broadsword', tier: 1, row: 'stat', lane: 'tempo',
      name: 'Drilled Form', description: 'Ten thousand repetitions, no wasted motion.',
      fx: 'tempo.trail',
    },

    {
      id: 'broadsword-t1-kill-chain-payoff', lineageId: 'broadsword', tier: 1, row: 'payoff', lane: 'kill-chain',
      name: 'Momentum', description: 'A kill hurries the next swing.',
      fx: 'kill-chain.kill-pulse', trigger: 'kill', payoff: 'speed-window',
    },
    {
      id: 'broadsword-t1-empowered-payoff', lineageId: 'broadsword', tier: 1, row: 'payoff', lane: 'empowered',
      name: 'Find the Gap', description: 'Your mechanic leaves the target open.',
      fx: 'empowered.weak-point', trigger: 'mechanic-fired', payoff: 'vulnerability',
    },
    {
      id: 'broadsword-t1-tempo-payoff', lineageId: 'broadsword', tier: 1, row: 'payoff', lane: 'tempo',
      name: 'Follow Through', description: 'Every third hit carries into a second.',
      fx: 'tempo.ghost-strike', trigger: 'hit-nth', payoff: 'echo-hit',
    },
  ],
};
