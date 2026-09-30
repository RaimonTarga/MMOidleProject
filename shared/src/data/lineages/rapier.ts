/**
 * The Rapier — Forest weapon lineage, and the worked example the design bible
 * carries end to end (design §13).
 *
 * Lanes: Tempo / Affliction / Engagement. Derived from the weapon it already is:
 * 1.50 aps, the Jungle on-hit successor in the same family, a duelist's opener.
 *
 * The T1 band is three stat rows (L2), three payoff rows (L4), and a gate (L6)
 * with two doors — Gale Needle through the Forest boss, Stinger Rapier through
 * the Jungle boss. Both can be owned; swapping the worn form is free.
 *
 * NO NUMBERS LIVE HERE. Magnitudes, durations, costs and unlock levels all come
 * from `magnitudes.ts` — see the header of `types.ts` for why.
 */
import type { LineageDefinition } from './types';

export const RAPIER_LINEAGE: LineageDefinition = {
  id: 'rapier',
  slot: 'weapon',
  homeBiome: 'forest',
  lanes: ['tempo', 'affliction', 'engagement'],

  forms: [
    {
      // Crafted from the Make tab as today — the one form that is not a gate.
      recipeId: 'flash-rapier', tier: 1, biome: 'forest',
    },
    {
      recipeId: 'gale-needle', tier: 2, biome: 'forest',
      capstone: {
        id: 'rapier-capstone-gale-needle', name: 'Gale Wake',
        description: 'Every finisher leaves a wake that carries your next swings.',
        fx: 'tempo.gale-wake', lane: 'tempo',
        trigger: 'mechanic-fired', payoff: 'speed-window',
      },
    },
    {
      // The Jungle debut weapon, re-homed as a second door rather than a root
      // (design §2: nothing a player earns at T1 dead-ends).
      recipeId: 'jungle-stinger-rapier', tier: 2, biome: 'jungle',
      capstone: {
        id: 'rapier-capstone-stinger', name: 'Stinger Echo',
        description: 'Hits on an afflicted target strike a second time.',
        fx: 'affliction.stinger-echo', lane: 'affliction',
        trigger: 'hit-nth', payoff: 'echo-hit',
      },
    },
  ],

  cards: [
    // ── T1 stat row (L2): the one row that is a number ───────────────────────
    {
      id: 'rapier-t1-tempo-stat', lineageId: 'rapier', tier: 1, row: 'stat', lane: 'tempo',
      name: 'Quick Wrist', description: 'The blade never quite stops moving.',
      fx: 'tempo.trail',
    },
    {
      id: 'rapier-t1-affliction-stat', lineageId: 'rapier', tier: 1, row: 'stat', lane: 'affliction',
      name: 'Envenomed', description: 'Something on the edge that the forest brewed.',
      fx: 'affliction.trail',
    },
    {
      id: 'rapier-t1-engagement-stat', lineageId: 'rapier', tier: 1, row: 'stat', lane: 'engagement',
      name: 'Keen Edge', description: 'Honed for the one thrust that decides a duel.',
      fx: 'engagement.trail',
    },

    // ── T1 payoff row (L4): a trigger AND its effect, in one card ────────────
    {
      id: 'rapier-t1-tempo-payoff', lineageId: 'rapier', tier: 1, row: 'payoff', lane: 'tempo',
      name: 'Echo Strike', description: 'Every third hit lands twice.',
      fx: 'tempo.ghost-strike', trigger: 'hit-nth', payoff: 'echo-hit',
    },
    {
      id: 'rapier-t1-affliction-payoff', lineageId: 'rapier', tier: 1, row: 'payoff', lane: 'affliction',
      name: 'Bloodletting', description: 'A share of each hit keeps bleeding after it.',
      fx: 'affliction.bleed-pips', trigger: 'hit-nth', payoff: 'hemorrhage',
    },
    {
      id: 'rapier-t1-engagement-payoff', lineageId: 'rapier', tier: 1, row: 'payoff', lane: 'engagement',
      name: 'First Blood', description: 'The opening hit of a fight opens a damage window.',
      fx: 'engagement.opening-flash', trigger: 'first-hit', payoff: 'damage-window',
    },
  ],
};
