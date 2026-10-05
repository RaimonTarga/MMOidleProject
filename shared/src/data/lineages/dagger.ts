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

  {
    recipeId: 'tundra-rimebrand', tier: 3, biome: 'tundra',
    capstone: {
      id: 'dagger-capstone-numbing', name: 'Numbing Dose',
      description: 'Each cut banks another degree of cold, stacking toward something worse.',
      fx: 'affliction.toxic-pulse', lane: 'affliction',
      trigger: 'hit-nth', payoff: 'poison-stack',
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
    // ── T1 lean row (design §26.1): Attack, Speed, Effect, three ranks each ──
    // The lane is the card's colour and its shard (PROVISIONAL, legibility run:
    // Effect takes the fixed verb's lane, Attack the next, Speed the last, so all
    // three Swamp shards buy something at T1). Effect is the Dagger's own poison.
    {
      id: 'dagger-t1-attack', lineageId: 'dagger', tier: 1, row: 'stat', lane: 'control',
      leanKind: 'attack', statKey: 'attackPct',
      name: 'Attack', description: 'The cut goes in deeper.',
      fx: 'control.trail',
    },
    {
      id: 'dagger-t1-speed', lineageId: 'dagger', tier: 1, row: 'stat', lane: 'kill-chain',
      leanKind: 'speed', statKey: 'attackSpeedPct',
      name: 'Speed', description: 'The cuts come closer together.',
      fx: 'kill-chain.trail',
    },
    {
      id: 'dagger-t1-effect', lineageId: 'dagger', tier: 1, row: 'stat', lane: 'affliction',
      leanKind: 'effect', statKey: 'dotPotencyPct',
      name: 'Effect', description: 'Re-dipped between fights, and sometimes during.',
      fx: 'affliction.trail',
    },

    // ── T1 verb (design §26.1): ONE, the weapon's own — bought, never chosen ──
    {
      id: 'dagger-t1-affliction-payoff', lineageId: 'dagger', tier: 1, row: 'payoff', lane: 'affliction',
      name: 'Into the Wound', description: 'The blade goes back into what is already poisoned.',
      fx: 'affliction.venom-pips',
    },

    // ── T2 band (design §4): stat (L2), payoff (L3), amplifier (L5) ──────────
    // A lean and a verb that compose exactly like T1 (design §24.9), the verb
    // paying its payload at T2 size; the amplifier moves one axis of that pair.
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
      fx: 'affliction.venom-pips',
    },
    {
      id: 'dagger-t2-control-payoff', lineageId: 'dagger', tier: 2, row: 'payoff', lane: 'control',
      name: 'Deeper Hamstring', description: 'Every third hit takes the legs out further.',
      fx: 'control.frost-drag',
    },
    {
      id: 'dagger-t2-kill-chain-payoff', lineageId: 'dagger', tier: 2, row: 'payoff', lane: 'kill-chain',
      name: 'Greater Plaguebearer', description: 'What killed one carries further, to whatever stood near it.',
      fx: 'kill-chain.spread-arc',
    },

    // Amplifiers modify this tier's own payoff card, not the T1 one (design §4).
    {
      id: 'dagger-t2-affliction-amplifier', lineageId: 'dagger', tier: 2, row: 'amplifier', lane: 'affliction',
      name: 'Overflowing Dose', description: 'A stack above the cap spills onto whatever stands closest.',
      fx: 'affliction.venom-pips', trigger: 'hit-nth', payoff: 'poison-stack', modifies: 'dagger-t2-affliction-payoff',
      amplifies: 'targets',
    },
    {
      id: 'dagger-t2-control-amplifier', lineageId: 'dagger', tier: 2, row: 'amplifier', lane: 'control',
      name: 'Slow to Heal', description: 'The cut keeps the legs long after the wound would have closed.',
      fx: 'control.frost-drag', trigger: 'hit-nth', payoff: 'slow', modifies: 'dagger-t2-control-payoff',
      amplifies: 'duration',
    },
    {
      id: 'dagger-t2-kill-chain-amplifier', lineageId: 'dagger', tier: 2, row: 'amplifier', lane: 'kill-chain',
      name: 'Wider Plague', description: 'The plague now finds a second neighbour instead of just the one.',
      fx: 'kill-chain.spread-arc', trigger: 'kill', payoff: 'contagion', modifies: 'dagger-t2-kill-chain-payoff',
      amplifies: 'targets',
    },

    // ── T3 keystone row (design §4 amended 2026-10-01): one shared keystone per
    // packet, this lineage's own flavour of it. Run 3 W1-B.
    {
      id: 'dagger-t3-affliction-keystone', lineageId: 'dagger', tier: 3, row: 'keystone', lane: 'affliction',
      name: 'Never Fading Dose', description: 'Cut it again before the dose fades and the clock never gets the chance to run out.',
      fx: 'affliction.keystone', trigger: 'hit-nth', payoff: 'poison-stack',
    },
    {
      id: 'dagger-t3-control-keystone', lineageId: 'dagger', tier: 3, row: 'keystone', lane: 'control',
      name: 'Tendon to Bone', description: 'Hit something already dragging and it roots; hit something rooted and it stops dead — once per step, per target.',
      fx: 'control.keystone', trigger: 'hit-nth', payoff: 'stun',
    },
    {
      id: 'dagger-t3-kill-chain-keystone', lineageId: 'dagger', tier: 3, row: 'keystone', lane: 'kill-chain',
      name: 'Clean Kill', description: 'A kill pays the mechanic back in full, right there.',
      fx: 'kill-chain.keystone', trigger: 'kill', payoff: 'recovery-window',
    },

    // ── T4 cross row (design §4): a second lane's payoff at ROW_SCALAR.cross ──
    {
      id: 'dagger-t4-affliction-cross', lineageId: 'dagger', tier: 4, row: 'cross', lane: 'affliction',
      name: 'Envenomed Hamstring', description: 'Every dose left in the wound drags on the legs besides.',
      fx: 'affliction.venom-pips', trigger: 'hit-nth', payoff: 'slow', borrowsLane: 'control',
    },
    {
      id: 'dagger-t4-control-cross', lineageId: 'dagger', tier: 4, row: 'cross', lane: 'control',
      name: 'Hamstrung Plague', description: 'What the cut takes the legs from still carries, on a kill, to whatever stood near it.',
      fx: 'control.frost-drag', trigger: 'kill', payoff: 'contagion', borrowsLane: 'kill-chain',
    },
    {
      id: 'dagger-t4-kill-chain-cross', lineageId: 'dagger', tier: 4, row: 'cross', lane: 'kill-chain',
      name: 'Plague Dose', description: 'What killed one leaves a dose behind for the next thing that stands near it.',
      fx: 'kill-chain.spread-arc', trigger: 'hit-nth', payoff: 'poison-stack', borrowsLane: 'affliction',
    },
  ],
};
