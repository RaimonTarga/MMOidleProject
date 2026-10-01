/**
 * The Heartroot — Forest recovery lineage, the broadly-useful Recovery
 * investment (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Barrier tempo) is the matrix's assignment for Forest recovery — not the
 * item's current mechanic (skill potency), which the matrix does not model yet.
 * Lanes B/C (Affliction, Engagement) are likewise not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const HEARTROOT_LINEAGE: LineageDefinition = {
  id: 'heartroot',
  slot: 'recovery',
  homeBiome: 'forest',
  lanes: ['barrier-tempo', 'affliction', 'engagement'],

  forms: [
    { recipeId: 'forest-charm-t1', tier: 1, biome: 'forest' },
    {
      recipeId: 'forest-charm-t2', tier: 2, biome: 'forest',
      capstone: {
        id: 'heartroot-capstone-ancient', name: 'Ancient Root',
        description: 'A broken barrier now leaves a ward behind instead of nothing.',
        fx: 'barrier-tempo.ward-shell', lane: 'barrier-tempo',
        trigger: 'barrier-break', payoff: 'ward',
      },
    },
  ],

  cards: [
    {
      id: 'heartroot-t1-barrier-tempo-payoff', lineageId: 'heartroot', tier: 1, row: 'payoff', lane: 'barrier-tempo',
      name: 'Root and Bark', description: 'When the barrier gives, the root underneath does not.',
      fx: 'barrier-tempo.ward-shell', trigger: 'barrier-break', payoff: 'ward',
      face: packetDefaultFace('barrier-tempo'),
    },
    {
      id: 'heartroot-t1-affliction-payoff', lineageId: 'heartroot', tier: 1, row: 'payoff', lane: 'affliction',
      name: 'Slow Bloom', description: 'Something in the root keeps working on whatever is close.',
      fx: 'affliction.toxic-pulse', trigger: 'pulse', payoff: 'poison-stack',
      face: packetDefaultFace('affliction'),
    },
    {
      id: 'heartroot-t1-engagement-payoff', lineageId: 'heartroot', tier: 1, row: 'payoff', lane: 'engagement',
      name: 'First Breath', description: 'A guard raised at the start of a fight roots deeper than usual.',
      fx: 'engagement.sidestep-blur', trigger: 'guard-cast', payoff: 'engagement-dr',
      face: packetDefaultFace('engagement'),
    },

    // ── T2 payoff row (L3): the T1 payoff, grown up ─────────────────────────
    {
      id: 'heartroot-t2-barrier-tempo-payoff', lineageId: 'heartroot', tier: 2, row: 'payoff', lane: 'barrier-tempo',
      name: 'Deep Root', description: 'What breaks on the surface now finds a thicker root underneath.',
      fx: 'barrier-tempo.ward-shell', trigger: 'barrier-break', payoff: 'ward',
      face: packetDefaultFace('barrier-tempo'),
    },
    {
      id: 'heartroot-t2-affliction-payoff', lineageId: 'heartroot', tier: 2, row: 'payoff', lane: 'affliction',
      name: 'Steady Bloom', description: 'The root works on everything nearby now, not just whatever lingers.',
      fx: 'affliction.toxic-pulse', trigger: 'pulse', payoff: 'poison-stack',
      face: packetDefaultFace('affliction'),
    },
    {
      id: 'heartroot-t2-engagement-payoff', lineageId: 'heartroot', tier: 2, row: 'payoff', lane: 'engagement',
      name: 'Second Breath', description: "The guard raised at a fight's start now roots deeper than the first exchange alone.",
      fx: 'engagement.sidestep-blur', trigger: 'guard-cast', payoff: 'engagement-dr',
      face: packetDefaultFace('engagement'),
    },

    // ── T2 amplifier row (L5): an extra trigger kind for the same payoff ────
    {
      id: 'heartroot-t2-barrier-tempo-amplifier', lineageId: 'heartroot', tier: 2, row: 'amplifier', lane: 'barrier-tempo',
      name: 'Rooted Kill', description: 'A kill feeds the root the same way a broken barrier does.',
      fx: 'barrier-tempo.ward-shell', trigger: 'kill', payoff: 'ward', modifies: 'heartroot-t2-barrier-tempo-payoff',
      face: packetDefaultFace('barrier-tempo'),
    },
    {
      id: 'heartroot-t2-affliction-amplifier', lineageId: 'heartroot', tier: 2, row: 'amplifier', lane: 'affliction',
      name: 'Snapped Bloom', description: 'The barrier giving way also seeds the bloom the pulse alone would take longer to grow.',
      fx: 'affliction.toxic-pulse', trigger: 'barrier-break', payoff: 'poison-stack', modifies: 'heartroot-t2-affliction-payoff',
      face: packetDefaultFace('affliction'),
    },
    {
      id: 'heartroot-t2-engagement-amplifier', lineageId: 'heartroot', tier: 2, row: 'amplifier', lane: 'engagement',
      name: 'Lingering Breath', description: "The root's own cadence keeps the opening discount alive between guards.",
      fx: 'engagement.sidestep-blur', trigger: 'pulse', payoff: 'engagement-dr', modifies: 'heartroot-t2-engagement-payoff',
      face: packetDefaultFace('engagement'),
    },
  ],
};
