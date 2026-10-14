/**
 * The Rapier — Forest weapon lineage, and the worked example the design bible
 * carries end to end (design §13).
 *
 * Lanes: Tempo / Affliction / Engagement. Derived from the weapon it already is:
 * 1.50 aps, the Jungle on-hit successor in the same family, a duelist's opener.
 *
 * The T1 band is the lean trio (Attack, Speed, Effect, three ranks each, from L2),
 * the weapon's own verb (Flurry, L4; design §26.1 — the other two verbs and the
 * composition grammar open at T2), and a gate (L6) with two doors — Gale Needle through the Forest boss, Stinger Rapier through
 * the Jungle boss. Both can be owned; swapping the worn form is free.
 *
 * NO NUMBERS LIVE HERE. Magnitudes, durations, costs and unlock levels all come
 * from `magnitudes.ts` — see the header of `types.ts` for why.
 */
import type { LineageDefinition } from './types';

export const RAPIER_LINEAGE: LineageDefinition = {
  id: 'rapier',
  slot: 'weapon',
  // Parked by the class-first rework (D1): weapons are plain recipes, no tree.
  parked: true,
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
    // ── T1 lean row (design §26.1): Attack, Speed, Effect, three ranks each ──
    // The lane is the card's colour and its shard (PROVISIONAL, legibility run:
    // Effect takes the fixed verb's lane, Attack the first remaining one, Speed the
    // last). The Rapier has no mechanic of its own, so Effect is the size of
    // Flurry's second strike.
    {
      id: 'rapier-t1-attack', lineageId: 'rapier', tier: 1, row: 'stat', lane: 'affliction',
      leanKind: 'attack', statKey: 'attackPct',
      name: 'Attack', description: 'Honed for the one thrust that decides a duel.',
      fx: 'affliction.trail',
    },
    {
      id: 'rapier-t1-speed', lineageId: 'rapier', tier: 1, row: 'stat', lane: 'engagement',
      leanKind: 'speed', statKey: 'attackSpeedPct',
      name: 'Speed', description: 'The blade never quite stops moving.',
      fx: 'engagement.trail',
    },
    {
      id: 'rapier-t1-effect', lineageId: 'rapier', tier: 1, row: 'stat', lane: 'tempo',
      leanKind: 'effect', statKey: 'payloadScale',
      name: 'Effect', description: 'The second thrust arrives with more of the first behind it.',
      fx: 'tempo.trail',
    },

    // ── T1 verb (design §26.1): ONE, the weapon's own — bought, never chosen ──
    // No trigger, no payoff: the moment and the pure payload are the Tempo
    // packet's (`composeVerb`). Name from the approved weapon-page mockup.
    {
      id: 'rapier-t1-tempo-payoff', lineageId: 'rapier', tier: 1, row: 'payoff', lane: 'tempo',
      name: 'Flurry', description: 'Every so often the wrist runs a beat ahead of the count.',
      fx: 'tempo.ghost-strike',
    },

    // ── T2 band (design §13): stat (L2), payoff (L3), amplifier (L5) ─────────
    // A lean and a verb that compose exactly like T1 (design §24.9), the verb
    // paying its payload at T2 size; the amplifier moves one axis of that pair.
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
      fx: 'tempo.ghost-strike',
    },
    {
      id: 'rapier-t2-affliction-payoff', lineageId: 'rapier', tier: 2, row: 'payoff', lane: 'affliction',
      name: 'Deep Bloodletting', description: 'A larger share of each hit keeps bleeding after it.',
      fx: 'affliction.bleed-pips',
    },
    {
      id: 'rapier-t2-engagement-payoff', lineageId: 'rapier', tier: 2, row: 'payoff', lane: 'engagement',
      name: 'Opening Gambit', description: 'The opening hit of a fight opens a wider damage window.',
      fx: 'engagement.opening-flash',
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
