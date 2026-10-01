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

  {
    recipeId: 'desert-sunsteel-cross', tier: 2, biome: 'desert',
    capstone: {
      id: 'broadsword-capstone-sunsteel', name: 'Noon Strike',
      description: "The opening blow still carries the whole day's heat, and leaves what it hit lit for the follow-through.",
      fx: 'empowered.weak-point', lane: 'empowered',
      trigger: 'first-hit', payoff: 'damage-window',
    },
  },

  // ── T3 forms (design §18.5) ─────────────────────────────────────────────
  //
  // Authored from the existing `evolvesFrom` graph so no weapon dead-ends:
  // removing the +N ladder left every T3/T4 weapon craftable by nothing and
  // evolvable by nothing. The band above T2 carries FORMS ONLY — its cards are
  // Phase 5's, with the amplifier row and the T2+ magnitude columns.
  {
    recipeId: 'desert-pilgrim-quarterstaff', tier: 3, biome: 'desert',
    capstone: {
      id: 'broadsword-capstone-pilgrim', name: 'Pilgrim\'s Pace',
      description: 'A walking rhythm that does not break, however long the road.',
      fx: 'tempo.ghost-strike', lane: 'tempo',
      trigger: 'mechanic-fired', payoff: 'speed-window',
    },
  },
  {
    recipeId: 'desert-solar-cross', tier: 3, biome: 'desert',
    capstone: {
      id: 'broadsword-capstone-solar', name: 'Solar Weight',
      description: 'Held up, it gathers the noon; brought down, it spends it.',
      fx: 'empowered.weak-point', lane: 'empowered',
      trigger: 'mechanic-fired', payoff: 'damage-window',
    },
  },
  {
    recipeId: 'desert-sunmonk-warstaff', tier: 4, biome: 'desert',
    capstone: {
      id: 'broadsword-capstone-sunmonk', name: 'Sunmonk\'s Mercy',
      description: 'Every body it puts down pays a little of the bearer back.',
      fx: 'kill-chain.recovery-pulse', lane: 'kill-chain',
      trigger: 'kill', payoff: 'recovery-window',
    },
  },
  {
    recipeId: 'desert-zenith-cross', tier: 4, biome: 'desert',
    capstone: {
      id: 'broadsword-capstone-zenith', name: 'Zenith',
      description: 'The first blow of a fight arrives with the whole day behind it.',
      fx: 'empowered.guard-spark', lane: 'empowered',
      trigger: 'first-hit', payoff: 'damage-window',
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

    // ── T2 band (design §4): stat (L2), payoff (L3), amplifier (L5) ──────────
    {
      id: 'broadsword-t2-kill-chain-stat', lineageId: 'broadsword', tier: 2, row: 'stat', lane: 'kill-chain',
      name: 'Longer Warpath', description: 'The ground between one body and the next keeps growing.',
      fx: 'kill-chain.trail',
    },
    {
      id: 'broadsword-t2-empowered-stat', lineageId: 'broadsword', tier: 2, row: 'stat', lane: 'empowered',
      name: 'More Weight Behind It', description: 'The whole body goes into the swing now, not just the shoulder.',
      fx: 'empowered.trail',
    },
    {
      id: 'broadsword-t2-tempo-stat', lineageId: 'broadsword', tier: 2, row: 'stat', lane: 'tempo',
      name: 'Drilled Further', description: 'The repetitions kept going after the Plains.',
      fx: 'tempo.trail',
    },

    {
      id: 'broadsword-t2-kill-chain-payoff', lineageId: 'broadsword', tier: 2, row: 'payoff', lane: 'kill-chain',
      name: 'Greater Momentum', description: 'A kill hurries the next swing more than it used to.',
      fx: 'kill-chain.kill-pulse', trigger: 'kill', payoff: 'speed-window',
    },
    {
      id: 'broadsword-t2-empowered-payoff', lineageId: 'broadsword', tier: 2, row: 'payoff', lane: 'empowered',
      name: 'Widen the Gap', description: 'Your mechanic leaves the target open for longer.',
      fx: 'empowered.weak-point', trigger: 'mechanic-fired', payoff: 'vulnerability',
    },
    {
      id: 'broadsword-t2-tempo-payoff', lineageId: 'broadsword', tier: 2, row: 'payoff', lane: 'tempo',
      name: 'Harder Follow Through', description: 'Every third hit carries into a stronger second.',
      fx: 'tempo.ghost-strike', trigger: 'hit-nth', payoff: 'echo-hit',
    },

    // Amplifiers modify this tier's own payoff card, not the T1 one (design §4).
    {
      id: 'broadsword-t2-kill-chain-amplifier', lineageId: 'broadsword', tier: 2, row: 'amplifier', lane: 'kill-chain',
      name: 'Chained Momentum', description: 'A second kill before the window closes starts it again at full length.',
      fx: 'kill-chain.kill-pulse', trigger: 'kill', payoff: 'speed-window', modifies: 'broadsword-t2-kill-chain-payoff',
      amplifies: 'duration',
    },
    {
      id: 'broadsword-t2-empowered-amplifier', lineageId: 'broadsword', tier: 2, row: 'amplifier', lane: 'empowered',
      name: 'Shared Gap', description: 'Whatever stands next to the opening is open too.',
      fx: 'empowered.weak-point', trigger: 'mechanic-fired', payoff: 'vulnerability', modifies: 'broadsword-t2-empowered-payoff',
      amplifies: 'targets',
    },
    {
      id: 'broadsword-t2-tempo-amplifier', lineageId: 'broadsword', tier: 2, row: 'amplifier', lane: 'tempo',
      name: 'Second Follow Through', description: 'The carried second hit has enough left in it to carry a third.',
      fx: 'tempo.ghost-strike', trigger: 'hit-nth', payoff: 'echo-hit', modifies: 'broadsword-t2-tempo-payoff',
      amplifies: 'magnitude',
    },
  ],
};
