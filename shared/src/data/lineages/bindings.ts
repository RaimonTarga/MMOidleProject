/**
 * The Bindings — Forest armor lineage, evasion that softens direct hits
 * (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Engagement) pairs with the Bindings' native face (Light frame = Avoid) even
 * though the item's own mechanic is evasion, not an opening burst — the matrix's
 * assignment, not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const BINDINGS_LINEAGE: LineageDefinition = {
  id: 'bindings',
  slot: 'armor',
  homeBiome: 'forest',
  lanes: ['engagement', 'tempo', 'affliction'],

  forms: [
    { recipeId: 'forest-vest-t1', tier: 1, biome: 'forest' },
    {
      recipeId: 'forest-vest-t2', tier: 2, biome: 'forest',
      capstone: {
        id: 'bindings-capstone-phantom', name: 'Phantom Guard',
        description: 'Every opening exchange now leaves the attacker worse for it, not just you better.',
        fx: 'engagement.sidestep-blur', lane: 'engagement',
        trigger: 'hit-taken', payoff: 'engagement-dr',
      },
    },
  {
    recipeId: 'jungle-vest-t2', tier: 2, biome: 'jungle',
    capstone: {
      id: 'bindings-capstone-spore-veil', name: 'Spore Veil',
      description: 'Slip the hit clean, and the air you left behind does the rest.',
      fx: 'affliction.venom-pips', lane: 'affliction',
      trigger: 'evade', payoff: 'poison-stack',
    },
  },

  ],

  cards: [
    {
      id: 'bindings-t1-engagement-payoff', lineageId: 'bindings', tier: 1, row: 'payoff', lane: 'engagement',
      name: 'Opening Guard', description: 'The first exchange costs you less than it looks.',
      fx: 'engagement.sidestep-blur', trigger: 'hit-taken', payoff: 'engagement-dr',
      face: packetDefaultFace('engagement'),
    },
    {
      id: 'bindings-t1-tempo-payoff', lineageId: 'bindings', tier: 1, row: 'payoff', lane: 'tempo',
      name: 'Slip and Go', description: 'A dodge that clears space also covers it.',
      fx: 'tempo.evasive-blur', trigger: 'evade', payoff: 'speed-window',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'bindings-t1-affliction-payoff', lineageId: 'bindings', tier: 1, row: 'payoff', lane: 'affliction',
      name: 'Jungle Weave', description: "Hold still and whatever grips you starts to regret it.",
      fx: 'affliction.toxic-pulse', trigger: 'standing', payoff: 'poison-stack',
      face: packetDefaultFace('affliction'),
    },

    // ── T2 payoff row (L3): the T1 payoff, grown up ─────────────────────────
    {
      id: 'bindings-t2-engagement-payoff', lineageId: 'bindings', tier: 2, row: 'payoff', lane: 'engagement',
      name: 'Guarded Opening', description: 'The first exchange of any fight now costs noticeably less, every time.',
      fx: 'engagement.sidestep-blur', trigger: 'hit-taken', payoff: 'engagement-dr',
      face: packetDefaultFace('engagement'),
    },
    {
      id: 'bindings-t2-tempo-payoff', lineageId: 'bindings', tier: 2, row: 'payoff', lane: 'tempo',
      name: 'Vanishing Step', description: 'The dodge that used to just clear space now launches you past it.',
      fx: 'tempo.evasive-blur', trigger: 'evade', payoff: 'speed-window',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'bindings-t2-affliction-payoff', lineageId: 'bindings', tier: 2, row: 'payoff', lane: 'affliction',
      name: 'Deep Weave', description: 'What grips you while you hold still now digs in deeper than before.',
      fx: 'affliction.toxic-pulse', trigger: 'standing', payoff: 'poison-stack',
      face: packetDefaultFace('affliction'),
    },

    // ── T2 amplifier row (L5): an extra trigger kind for the same payoff ────
    {
      id: 'bindings-t2-engagement-amplifier', lineageId: 'bindings', tier: 2, row: 'amplifier', lane: 'engagement',
      name: 'Braced Opening', description: 'Plant your feet before the exchange starts and the discount is already there waiting.',
      fx: 'engagement.sidestep-blur', trigger: 'standing', payoff: 'engagement-dr', modifies: 'bindings-t2-engagement-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('engagement'),
    },
    {
      id: 'bindings-t2-tempo-amplifier', lineageId: 'bindings', tier: 2, row: 'amplifier', lane: 'tempo',
      name: 'Uninterrupted', description: 'Eating a hit does not break the step a dodge would have started.',
      fx: 'tempo.evasive-blur', trigger: 'hit-taken', payoff: 'speed-window', modifies: 'bindings-t2-tempo-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'bindings-t2-affliction-amplifier', lineageId: 'bindings', tier: 2, row: 'amplifier', lane: 'affliction',
      name: 'Reflexive Grip', description: "A clean dodge leaves the weave's grip behind just as surely as standing still does.",
      fx: 'affliction.toxic-pulse', trigger: 'evade', payoff: 'poison-stack', modifies: 'bindings-t2-affliction-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('affliction'),
    },

    // ── T3 keystone row (design §4 amended 2026-10-01): one shared keystone per
    // packet, this lineage's own flavour of it. Run 3 W1-B.
    {
      id: 'bindings-t3-engagement-keystone', lineageId: 'bindings', tier: 3, row: 'keystone', lane: 'engagement',
      name: 'Every Exchange', description: 'Every new opponent the fight turns to gets the same discount the first one did.',
      fx: 'engagement.keystone', trigger: 'first-hit', payoff: 'damage-window',
      face: packetDefaultFace('engagement'),
    },
    {
      id: 'bindings-t3-tempo-keystone', lineageId: 'bindings', tier: 3, row: 'keystone', lane: 'tempo',
      name: 'Never Quite Gone', description: "The dodge-step keeps answering. It doesn't stop until a hit lands clean or nothing fresh is close.",
      fx: 'tempo.keystone', trigger: 'hit-nth', payoff: 'echo-hit',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'bindings-t3-affliction-keystone', lineageId: 'bindings', tier: 3, row: 'keystone', lane: 'affliction',
      name: 'Never Lets Go', description: 'Hold the grip on before the dose fades and the clock never gets the chance to run out.',
      fx: 'affliction.keystone', trigger: 'hit-nth', payoff: 'poison-stack',
      face: packetDefaultFace('affliction'),
    },

    // ── T4 cross row (design §4): a second lane's payoff at ROW_SCALAR.cross ──
    {
      id: 'bindings-t4-engagement-cross', lineageId: 'bindings', tier: 4, row: 'cross', lane: 'engagement',
      name: 'Phantom Step', description: 'The discounted opening still clears space the way a dodge would.',
      fx: 'engagement.sidestep-blur', trigger: 'evade', payoff: 'speed-window', borrowsLane: 'tempo',
      face: packetDefaultFace('engagement'),
    },
    {
      id: 'bindings-t4-tempo-cross', lineageId: 'bindings', tier: 4, row: 'cross', lane: 'tempo',
      name: 'Weeping Step', description: 'Holding still after the dodge leaves the same grip the weave does.',
      fx: 'tempo.evasive-blur', trigger: 'standing', payoff: 'poison-stack', borrowsLane: 'affliction',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'bindings-t4-affliction-cross', lineageId: 'bindings', tier: 4, row: 'cross', lane: 'affliction',
      name: 'Guarded Weave', description: 'What grips you in the opening exchange costs you less for the privilege.',
      fx: 'affliction.toxic-pulse', trigger: 'hit-taken', payoff: 'engagement-dr', borrowsLane: 'engagement',
      face: packetDefaultFace('affliction'),
    },
  ],
};
