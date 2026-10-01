/**
 * The Wraps — Forest mobility lineage, straightforward traversal (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Engagement) is the matrix's assignment for Forest mobility — not the item's
 * current mechanic (out-of-combat speed), which the matrix does not model yet.
 * Lanes B/C (Tempo, Affliction) are likewise not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const WRAPS_LINEAGE: LineageDefinition = {
  id: 'wraps',
  slot: 'mobility',
  homeBiome: 'forest',
  lanes: ['engagement', 'tempo', 'affliction'],

  forms: [
    { recipeId: 'forest-boots-t1', tier: 1, biome: 'forest' },
    {
      recipeId: 'forest-boots-t2', tier: 2, biome: 'forest',
      capstone: {
        id: 'wraps-capstone-windstep', name: 'Windstep',
        description: 'The opening exchange now costs even less, every fight, not just the first.',
        fx: 'engagement.windstep', lane: 'engagement',
        trigger: 'first-hit', payoff: 'engagement-dr',
      },
    },
  ],

  cards: [
    {
      id: 'wraps-t1-engagement-payoff', lineageId: 'wraps', tier: 1, row: 'payoff', lane: 'engagement',
      name: 'Quiet Approach', description: 'Closing the distance unseen softens whatever meets you first.',
      fx: 'engagement.sidestep-blur', trigger: 'first-hit', payoff: 'engagement-dr',
      face: packetDefaultFace('engagement'),
    },
    {
      id: 'wraps-t1-tempo-payoff', lineageId: 'wraps', tier: 1, row: 'payoff', lane: 'tempo',
      name: 'Ready Wraps', description: 'Held loose and ready, they let go all at once.',
      fx: 'tempo.evasive-blur', trigger: 'standing', payoff: 'speed-window',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'wraps-t1-affliction-payoff', lineageId: 'wraps', tier: 1, row: 'payoff', lane: 'affliction',
      name: 'Trail of Spores', description: 'Where one falls, the ground keeps working on the next.',
      fx: 'affliction.toxic-pulse', trigger: 'kill', payoff: 'poison-stack',
      face: packetDefaultFace('affliction'),
    },

    // ── T2 payoff row (L3): the T1 payoff, grown up ─────────────────────────
    {
      id: 'wraps-t2-engagement-payoff', lineageId: 'wraps', tier: 2, row: 'payoff', lane: 'engagement',
      name: 'Silent Approach', description: 'Closing the distance unseen now softens far more than just the first contact.',
      fx: 'engagement.sidestep-blur', trigger: 'first-hit', payoff: 'engagement-dr',
      face: packetDefaultFace('engagement'),
    },
    {
      id: 'wraps-t2-tempo-payoff', lineageId: 'wraps', tier: 2, row: 'payoff', lane: 'tempo',
      name: 'Loaded Wraps', description: 'Held ready even longer, they let go with that much more behind them.',
      fx: 'tempo.evasive-blur', trigger: 'standing', payoff: 'speed-window',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'wraps-t2-affliction-payoff', lineageId: 'wraps', tier: 2, row: 'payoff', lane: 'affliction',
      name: 'Wide Trail', description: 'Where one falls, the ground now works on everything nearby, not just the next step.',
      fx: 'affliction.toxic-pulse', trigger: 'kill', payoff: 'poison-stack',
      face: packetDefaultFace('affliction'),
    },

    // ── T2 amplifier row (L5): an extra trigger kind for the same payoff ────
    {
      id: 'wraps-t2-engagement-amplifier', lineageId: 'wraps', tier: 2, row: 'amplifier', lane: 'engagement',
      name: 'Braced Approach', description: 'Holding still before you close keeps the discount live without needing the first hit.',
      fx: 'engagement.sidestep-blur', trigger: 'standing', payoff: 'engagement-dr', modifies: 'wraps-t2-engagement-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('engagement'),
    },
    {
      id: 'wraps-t2-tempo-amplifier', lineageId: 'wraps', tier: 2, row: 'amplifier', lane: 'tempo',
      name: 'Released Wraps', description: 'A kill lets the wraps go just as well as holding still winds them.',
      fx: 'tempo.evasive-blur', trigger: 'kill', payoff: 'speed-window', modifies: 'wraps-t2-tempo-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'wraps-t2-affliction-amplifier', lineageId: 'wraps', tier: 2, row: 'amplifier', lane: 'affliction',
      name: 'First Spores', description: 'The opening hit of a fight seeds the trail without waiting on a kill.',
      fx: 'affliction.toxic-pulse', trigger: 'first-hit', payoff: 'poison-stack', modifies: 'wraps-t2-affliction-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('affliction'),
    },

    // ── T3 keystone row (design §4 amended 2026-10-01): one shared keystone per
    // packet, this lineage's own flavour of it. Run 3 W1-B.
    {
      id: 'wraps-t3-engagement-keystone', lineageId: 'wraps', tier: 3, row: 'keystone', lane: 'engagement',
      name: 'Every Quiet Approach', description: 'Every new target meets the same quiet discount the first one did.',
      fx: 'engagement.keystone', trigger: 'first-hit', payoff: 'damage-window',
      face: packetDefaultFace('engagement'),
    },
    {
      id: 'wraps-t3-tempo-keystone', lineageId: 'wraps', tier: 3, row: 'keystone', lane: 'tempo',
      name: 'Wraps Never Settle', description: "The echo keeps answering. It doesn't stop until a hit misses or no fresh target is close.",
      fx: 'tempo.keystone', trigger: 'hit-nth', payoff: 'echo-hit',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'wraps-t3-affliction-keystone', lineageId: 'wraps', tier: 3, row: 'keystone', lane: 'affliction',
      name: 'Spores Never Fade', description: 'Hit it again before the dose fades and the clock never gets the chance to run out.',
      fx: 'affliction.keystone', trigger: 'hit-nth', payoff: 'poison-stack',
      face: packetDefaultFace('affliction'),
    },

    // ── T4 cross row (design §4): a second lane's payoff at ROW_SCALAR.cross ──
    {
      id: 'wraps-t4-engagement-cross', lineageId: 'wraps', tier: 4, row: 'cross', lane: 'engagement',
      name: 'Ready Approach', description: 'Held loose before the approach, they let go the same way they would standing still.',
      fx: 'engagement.sidestep-blur', trigger: 'standing', payoff: 'speed-window', borrowsLane: 'tempo',
      face: packetDefaultFace('engagement'),
    },
    {
      id: 'wraps-t4-tempo-cross', lineageId: 'wraps', tier: 4, row: 'cross', lane: 'tempo',
      name: 'Spored Wraps', description: 'A kill lets the wraps go and seeds the trail both.',
      fx: 'tempo.evasive-blur', trigger: 'kill', payoff: 'poison-stack', borrowsLane: 'affliction',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'wraps-t4-affliction-cross', lineageId: 'wraps', tier: 4, row: 'cross', lane: 'affliction',
      name: 'Trailing Approach', description: 'The ground the first hit lands on is already working on the next one.',
      fx: 'affliction.toxic-pulse', trigger: 'first-hit', payoff: 'engagement-dr', borrowsLane: 'engagement',
      face: packetDefaultFace('affliction'),
    },
  ],
};
