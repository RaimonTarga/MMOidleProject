/**
 * The Dagger — Swamp weapon lineage, the reservoir-DoT knife (design §3.2).
 *
 * Lanes: Affliction / Control / Kill chain. Derived from the reservoir DoT the
 * swamp blade already carries, the biome's chill/slow vocabulary, and contagion
 * spreading on a kill.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';

export const DAGGER_LINEAGE: LineageDefinition = {
  id: 'dagger',
  slot: 'weapon',
  homeBiome: 'swamp',
  lanes: ['affliction', 'control', 'kill-chain'],

  forms: [
    { recipeId: 'ashbrand-blade', tier: 1, biome: 'swamp' },
    {
      recipeId: 'swamp-mirebrand', tier: 2, biome: 'swamp',
      capstone: {
        id: 'dagger-capstone-mirebrand', name: 'Mire Grasp',
        description: 'A hit on something already slowed holds it fast.',
        fx: 'control.mire-grasp', lane: 'control',
        trigger: 'hit-nth', payoff: 'stun',
      },
    },
  ],

  cards: [
    {
      id: 'dagger-t1-affliction-stat', lineageId: 'dagger', tier: 1, row: 'stat', lane: 'affliction',
      name: 'Coated Edge', description: 'Re-dipped between fights, and sometimes during.',
      fx: 'affliction.trail',
    },
    {
      id: 'dagger-t1-control-stat', lineageId: 'dagger', tier: 1, row: 'stat', lane: 'control',
      name: 'Tendon Cut', description: 'You are not aiming for the vitals.',
      fx: 'control.trail',
    },
    {
      id: 'dagger-t1-kill-chain-stat', lineageId: 'dagger', tier: 1, row: 'stat', lane: 'kill-chain',
      name: 'Silent Step', description: 'Gone before the body finishes falling.',
      fx: 'kill-chain.trail',
    },

    {
      id: 'dagger-t1-affliction-payoff', lineageId: 'dagger', tier: 1, row: 'payoff', lane: 'affliction',
      name: 'Envenom', description: 'Each hit leaves another dose in the wound.',
      fx: 'affliction.venom-pips', trigger: 'hit-nth', payoff: 'poison-stack',
    },
    {
      id: 'dagger-t1-control-payoff', lineageId: 'dagger', tier: 1, row: 'payoff', lane: 'control',
      name: 'Hamstring', description: 'Every third hit takes the legs.',
      fx: 'control.frost-drag', trigger: 'hit-nth', payoff: 'slow',
    },
    {
      id: 'dagger-t1-kill-chain-payoff', lineageId: 'dagger', tier: 1, row: 'payoff', lane: 'kill-chain',
      name: 'Plaguebearer', description: 'What killed one carries to whatever stood near it.',
      fx: 'kill-chain.spread-arc', trigger: 'kill', payoff: 'contagion',
    },
  ],
};
