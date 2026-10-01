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

  // ── T3 forms (design §18.5) ─────────────────────────────────────────────
  //
  // Authored from the existing `evolvesFrom` graph so no weapon dead-ends:
  // removing the +N ladder left every T3/T4 weapon craftable by nothing and
  // evolvable by nothing. The band above T2 carries FORMS ONLY — its cards are
  // Phase 5's, with the amplifier row and the T2+ magnitude columns.
  {
    recipeId: 'jungle-venomthorn-rapier', tier: 3, biome: 'jungle',
    capstone: {
      id: 'rapier-capstone-venomthorn', name: 'Venomthorn',
      description: 'The point leaves more behind than the wound accounts for.',
      fx: 'affliction.venom-pips', lane: 'affliction',
      trigger: 'hit-nth', payoff: 'poison-stack',
    },
  },
  {
    recipeId: 'jungle-deathfang-rapier', tier: 4, biome: 'jungle',
    capstone: {
      id: 'rapier-capstone-deathfang', name: 'Deathfang',
      description: 'What it finishes carries the dose to the next thing standing.',
      fx: 'affliction.stinger-echo', lane: 'affliction',
      trigger: 'kill', payoff: 'contagion',
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

    // ── T2 band (design §13): stat (L2), payoff (L3), amplifier (L5) ─────────
    {
      id: 'rapier-t2-tempo-stat', lineageId: 'rapier', tier: 2, row: 'stat', lane: 'tempo',
      name: 'Fencer\'s Cadence', description: 'The wrist that never stopped moving now never tires.',
      fx: 'tempo.trail',
    },
    {
      id: 'rapier-t2-affliction-stat', lineageId: 'rapier', tier: 2, row: 'stat', lane: 'affliction',
      name: 'Deeper Brew', description: 'A stronger draught, cut for a longer fight.',
      fx: 'affliction.trail',
    },
    {
      id: 'rapier-t2-engagement-stat', lineageId: 'rapier', tier: 2, row: 'stat', lane: 'engagement',
      name: 'Honed Further', description: 'The duelist has had more practice since the forest.',
      fx: 'engagement.trail',
    },

    {
      id: 'rapier-t2-tempo-payoff', lineageId: 'rapier', tier: 2, row: 'payoff', lane: 'tempo',
      name: 'Running Riposte', description: 'Every third hit still lands twice, harder than it used to.',
      fx: 'tempo.ghost-strike', trigger: 'hit-nth', payoff: 'echo-hit',
    },
    {
      id: 'rapier-t2-affliction-payoff', lineageId: 'rapier', tier: 2, row: 'payoff', lane: 'affliction',
      name: 'Deep Bloodletting', description: 'A larger share of each hit keeps bleeding after it.',
      fx: 'affliction.bleed-pips', trigger: 'hit-nth', payoff: 'hemorrhage',
    },
    {
      id: 'rapier-t2-engagement-payoff', lineageId: 'rapier', tier: 2, row: 'payoff', lane: 'engagement',
      name: 'Opening Gambit', description: 'The opening hit of a fight opens a wider damage window.',
      fx: 'engagement.opening-flash', trigger: 'first-hit', payoff: 'damage-window',
    },

    // Amplifiers modify this tier's own payoff card, not the T1 one (design §4).
    {
      id: 'rapier-t2-tempo-amplifier', lineageId: 'rapier', tier: 2, row: 'amplifier', lane: 'tempo',
      name: 'Carried Wake', description: 'The echo no longer stops at the one body it found.',
      fx: 'tempo.ghost-strike', trigger: 'hit-nth', payoff: 'echo-hit', modifies: 'rapier-t2-tempo-payoff',
      amplifies: 'targets',
    },
    {
      id: 'rapier-t2-affliction-amplifier', lineageId: 'rapier', tier: 2, row: 'amplifier', lane: 'affliction',
      name: 'Spreading Rot', description: 'What a kill was bleeding does not stay with the body that fell.',
      fx: 'affliction.bleed-pips', trigger: 'kill', payoff: 'hemorrhage', modifies: 'rapier-t2-affliction-payoff',
      amplifies: 'trigger',
    },
    {
      id: 'rapier-t2-engagement-amplifier', lineageId: 'rapier', tier: 2, row: 'amplifier', lane: 'engagement',
      name: 'Fresh Opening', description: 'Every new body the duel turns to counts as a fresh opening hit.',
      fx: 'engagement.opening-flash', trigger: 'first-hit', payoff: 'damage-window', modifies: 'rapier-t2-engagement-payoff',
      amplifies: 'trigger',
    },

    // ── T3 keystone row (design §4 amended 2026-10-01): one shared keystone per
    // packet, this lineage's own flavour of it. Run 3 W1-B.
    {
      id: 'rapier-t3-tempo-keystone', lineageId: 'rapier', tier: 3, row: 'keystone', lane: 'tempo',
      name: 'Unbroken Riposte', description: "The echo keeps answering. It doesn't stop until a hit misses or no fresh blade-reach is left.",
      fx: 'tempo.keystone', trigger: 'hit-nth', payoff: 'echo-hit',
    },
    {
      id: 'rapier-t3-affliction-keystone', lineageId: 'rapier', tier: 3, row: 'keystone', lane: 'affliction',
      name: 'Brewed to Last', description: 'Cut it again before the dose fades and the clock never gets the chance to run out.',
      fx: 'affliction.keystone', trigger: 'hit-nth', payoff: 'poison-stack',
    },
    {
      id: 'rapier-t3-engagement-keystone', lineageId: 'rapier', tier: 3, row: 'keystone', lane: 'engagement',
      name: 'Every Opening', description: "Every new body the duel turns to gets the opening hit's full attention.",
      fx: 'engagement.keystone', trigger: 'first-hit', payoff: 'damage-window',
    },

    // ── T4 cross row (design §4): a second lane's payoff at ROW_SCALAR.cross ──
    {
      id: 'rapier-t4-tempo-cross', lineageId: 'rapier', tier: 4, row: 'cross', lane: 'tempo',
      name: 'Bleeding Riposte', description: 'The blade that never stops moving leaves the wound open too.',
      fx: 'tempo.ghost-strike', trigger: 'hit-nth', payoff: 'hemorrhage', borrowsLane: 'affliction',
    },
    {
      id: 'rapier-t4-affliction-cross', lineageId: 'rapier', tier: 4, row: 'cross', lane: 'affliction',
      name: 'Opening Dose', description: 'The first thrust of a fight opens a window as wide as it opens the wound.',
      fx: 'affliction.bleed-pips', trigger: 'first-hit', payoff: 'damage-window', borrowsLane: 'engagement',
    },
    {
      id: 'rapier-t4-engagement-cross', lineageId: 'rapier', tier: 4, row: 'cross', lane: 'engagement',
      name: 'Keen Return', description: 'The decided thrust comes back on itself, every third time.',
      fx: 'engagement.opening-flash', trigger: 'hit-nth', payoff: 'echo-hit', borrowsLane: 'tempo',
    },
  ],
};
