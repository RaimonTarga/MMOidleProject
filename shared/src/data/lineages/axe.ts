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

  // ── T3 forms (design §18.5) ─────────────────────────────────────────────
  //
  // Authored from the existing `evolvesFrom` graph so no weapon dead-ends:
  // removing the +N ladder left every T3/T4 weapon craftable by nothing and
  // evolvable by nothing. The band above T2 carries FORMS ONLY — its cards are
  // Phase 5's, with the amplifier row and the T2+ magnitude columns.
  {
    recipeId: 'cave-cataclysm-axe', tier: 3, biome: 'cave',
    capstone: {
      id: 'axe-capstone-cataclysm', name: 'Cataclysm',
      description: 'The swing lands twice over, and the second one is the ground answering.',
      fx: 'empowered.quake-ring', lane: 'empowered',
      trigger: 'mechanic-fired', payoff: 'plating-shred',
    },
  },
  {
    recipeId: 'graveyard-plague-axe', tier: 4, biome: 'graveyard',
    capstone: {
      id: 'axe-capstone-plague', name: 'Plaguebearer\'s Due',
      description: 'What dies on this edge hands its rot to whatever stood too close.',
      fx: 'kill-chain.spread-arc', lane: 'kill-chain',
      trigger: 'kill', payoff: 'contagion',
    },
  },
  {
    recipeId: 'trench-abyssal-axe', tier: 4, biome: 'trench',
    capstone: {
      id: 'axe-capstone-abyssal', name: 'Abyssal Echo',
      description: 'Each swing drags a second one up out of the dark behind it.',
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
