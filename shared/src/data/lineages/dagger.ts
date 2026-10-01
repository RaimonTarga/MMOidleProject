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

  // ── T3 forms (design §18.5) ─────────────────────────────────────────────
  //
  // Authored from the existing `evolvesFrom` graph so no weapon dead-ends:
  // removing the +N ladder left every T3/T4 weapon craftable by nothing and
  // evolvable by nothing. The band above T2 carries FORMS ONLY — its cards are
  // Phase 5's, with the amplifier row and the T2+ magnitude columns.
  {
    recipeId: 'swamp-blightbrand', tier: 3, biome: 'swamp',
    capstone: {
      id: 'dagger-capstone-blightbrand', name: 'Plague Fang',
      description: 'A shallow cut that keeps opening on its own account.',
      fx: 'affliction.bleed-pips', lane: 'affliction',
      trigger: 'hit-nth', payoff: 'hemorrhage',
    },
  },
  {
    recipeId: 'tundra-glacial-rimebrand', tier: 4, biome: 'tundra',
    capstone: {
      id: 'dagger-capstone-rimebrand', name: 'Rime',
      description: 'Everything it touches finds its own joints have opinions.',
      fx: 'control.chill-blur', lane: 'control',
      trigger: 'hit-nth', payoff: 'slow',
    },
  },
  {
    recipeId: 'volcanic-blightbrand', tier: 4, biome: 'volcanic',
    capstone: {
      id: 'dagger-capstone-cinderbrand', name: 'Cinderbrand',
      description: 'The edge is still cooling, and it shares the heat with the wound.',
      fx: 'affliction.toxic-pulse', lane: 'affliction',
      trigger: 'hit-nth', payoff: 'poison-stack',
    },
  },
  {
    recipeId: 'volcanic-eruption-lash', tier: 4, biome: 'volcanic',
    capstone: {
      id: 'dagger-capstone-eruption', name: 'Eruption',
      description: 'A kill is a vent opening, and the bearer stands in the updraught.',
      fx: 'kill-chain.kill-pulse', lane: 'kill-chain',
      trigger: 'kill', payoff: 'recovery-window',
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

    // ── T2 band (design §4): stat (L2), payoff (L3), amplifier (L5) ──────────
    {
      id: 'dagger-t2-affliction-stat', lineageId: 'dagger', tier: 2, row: 'stat', lane: 'affliction',
      name: 'Twice-Coated', description: 'Re-dipped more often, in something stronger.',
      fx: 'affliction.trail',
    },
    {
      id: 'dagger-t2-control-stat', lineageId: 'dagger', tier: 2, row: 'stat', lane: 'control',
      name: 'Deeper Tendon Cut', description: 'You are still not aiming for the vitals, but it matters less now.',
      fx: 'control.trail',
    },
    {
      id: 'dagger-t2-kill-chain-stat', lineageId: 'dagger', tier: 2, row: 'stat', lane: 'kill-chain',
      name: 'Quieter Step', description: 'Gone before the body knows it has started falling.',
      fx: 'kill-chain.trail',
    },

    {
      id: 'dagger-t2-affliction-payoff', lineageId: 'dagger', tier: 2, row: 'payoff', lane: 'affliction',
      name: 'Deeper Envenom', description: 'Each hit leaves a stronger dose in the wound.',
      fx: 'affliction.venom-pips', trigger: 'hit-nth', payoff: 'poison-stack',
    },
    {
      id: 'dagger-t2-control-payoff', lineageId: 'dagger', tier: 2, row: 'payoff', lane: 'control',
      name: 'Deeper Hamstring', description: 'Every third hit takes the legs out further.',
      fx: 'control.frost-drag', trigger: 'hit-nth', payoff: 'slow',
    },
    {
      id: 'dagger-t2-kill-chain-payoff', lineageId: 'dagger', tier: 2, row: 'payoff', lane: 'kill-chain',
      name: 'Greater Plaguebearer', description: 'What killed one carries further, to whatever stood near it.',
      fx: 'kill-chain.spread-arc', trigger: 'kill', payoff: 'contagion',
    },

    // Amplifiers modify this tier's own payoff card, not the T1 one (design §4).
    {
      id: 'dagger-t2-affliction-amplifier', lineageId: 'dagger', tier: 2, row: 'amplifier', lane: 'affliction',
      name: 'Overflowing Dose', description: 'A stack above the cap spills onto whatever stands closest.',
      fx: 'affliction.venom-pips', trigger: 'hit-nth', payoff: 'poison-stack', modifies: 'dagger-t2-affliction-payoff',
    },
    {
      id: 'dagger-t2-control-amplifier', lineageId: 'dagger', tier: 2, row: 'amplifier', lane: 'control',
      name: 'Slow to Heal', description: 'The cut keeps the legs long after the wound would have closed.',
      fx: 'control.frost-drag', trigger: 'hit-nth', payoff: 'slow', modifies: 'dagger-t2-control-payoff',
    },
    {
      id: 'dagger-t2-kill-chain-amplifier', lineageId: 'dagger', tier: 2, row: 'amplifier', lane: 'kill-chain',
      name: 'Wider Plague', description: 'The plague now finds a second neighbour instead of just the one.',
      fx: 'kill-chain.spread-arc', trigger: 'kill', payoff: 'contagion', modifies: 'dagger-t2-kill-chain-payoff',
    },
  ],
};
