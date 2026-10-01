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
        fx: 'engagement.sidestep-blur', lane: 'engagement',
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
      face: packetDefaultFace('engagement'),
    },
    {
      id: 'wraps-t2-tempo-amplifier', lineageId: 'wraps', tier: 2, row: 'amplifier', lane: 'tempo',
      name: 'Released Wraps', description: 'A kill lets the wraps go just as well as holding still winds them.',
      fx: 'tempo.evasive-blur', trigger: 'kill', payoff: 'speed-window', modifies: 'wraps-t2-tempo-payoff',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'wraps-t2-affliction-amplifier', lineageId: 'wraps', tier: 2, row: 'amplifier', lane: 'affliction',
      name: 'First Spores', description: 'The opening hit of a fight seeds the trail without waiting on a kill.',
      fx: 'affliction.toxic-pulse', trigger: 'first-hit', payoff: 'poison-stack', modifies: 'wraps-t2-affliction-payoff',
      face: packetDefaultFace('affliction'),
    },
  ],
};
