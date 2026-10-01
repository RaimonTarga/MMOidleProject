/**
 * The Wrappings — Swamp armor lineage, DoT-resistance that spreads incoming
 * damage into debt (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Affliction) is the Wrappings' existing mechanic. Lanes B/C (Control, Barrier
 * tempo) are the matrix's assignment, not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const WRAPPINGS_LINEAGE: LineageDefinition = {
  id: 'wrappings',
  slot: 'armor',
  homeBiome: 'swamp',
  lanes: ['affliction', 'control', 'barrier-tempo'],

  forms: [
    { recipeId: 'swamp-vest-t1', tier: 1, biome: 'swamp' },
    {
      recipeId: 'swamp-vest-t2', tier: 2, biome: 'swamp',
      capstone: {
        id: 'wrappings-capstone-bog', name: 'Bog-Bound',
        description: 'Holding your ground keeps the caustic weave spreading instead of fading.',
        fx: 'affliction.toxic-pulse', lane: 'affliction',
        trigger: 'standing', payoff: 'poison-stack',
      },
    },
  ],

  cards: [
    {
      id: 'wrappings-t1-affliction-payoff', lineageId: 'wrappings', tier: 1, row: 'payoff', lane: 'affliction',
      name: 'Caustic Weave', description: "Stand your ground and the wrappings turn what's on them into a weapon.",
      fx: 'affliction.toxic-pulse', trigger: 'standing', payoff: 'poison-stack',
      face: packetDefaultFace('affliction'),
    },
    {
      id: 'wrappings-t1-control-payoff', lineageId: 'wrappings', tier: 1, row: 'payoff', lane: 'control',
      name: 'Mire Step', description: 'Step wrong on marsh ground and it does not forgive you.',
      fx: 'control.chill-blur', trigger: 'evade', payoff: 'stun',
      face: packetDefaultFace('control'),
    },
    {
      id: 'wrappings-t1-barrier-tempo-payoff', lineageId: 'wrappings', tier: 1, row: 'payoff', lane: 'barrier-tempo',
      name: 'Debt Ward', description: 'Part of every hit taken comes back as a shell instead.',
      fx: 'barrier-tempo.ward-shell', trigger: 'hit-taken', payoff: 'ward',
      face: packetDefaultFace('barrier-tempo'),
    },

    // ── T2 payoff row (L3): the T1 payoff, grown up ─────────────────────────
    {
      id: 'wrappings-t2-affliction-payoff', lineageId: 'wrappings', tier: 2, row: 'payoff', lane: 'affliction',
      name: 'Caustic Bloom', description: 'Stand long enough and the weave turns from a nuisance into a dose.',
      fx: 'affliction.toxic-pulse', trigger: 'standing', payoff: 'poison-stack',
      face: packetDefaultFace('affliction'),
    },
    {
      id: 'wrappings-t2-control-payoff', lineageId: 'wrappings', tier: 2, row: 'payoff', lane: 'control',
      name: 'Mire Snap', description: 'The ground that lets you go does not let go of whatever follows.',
      fx: 'control.chill-blur', trigger: 'evade', payoff: 'stun',
      face: packetDefaultFace('control'),
    },
    {
      id: 'wrappings-t2-barrier-tempo-payoff', lineageId: 'wrappings', tier: 2, row: 'payoff', lane: 'barrier-tempo',
      name: 'Compounding Debt', description: 'Every hit taken now pays back more shell than it cost in the first place.',
      fx: 'barrier-tempo.ward-shell', trigger: 'hit-taken', payoff: 'ward',
      face: packetDefaultFace('barrier-tempo'),
    },

    // ── T2 amplifier row (L5): an extra trigger kind for the same payoff ────
    {
      id: 'wrappings-t2-affliction-amplifier', lineageId: 'wrappings', tier: 2, row: 'amplifier', lane: 'affliction',
      name: 'Reflexive Dose', description: 'A clean dodge seeds the same dose that standing still would.',
      fx: 'affliction.toxic-pulse', trigger: 'evade', payoff: 'poison-stack', modifies: 'wrappings-t2-affliction-payoff',
      face: packetDefaultFace('affliction'),
    },
    {
      id: 'wrappings-t2-control-amplifier', lineageId: 'wrappings', tier: 2, row: 'amplifier', lane: 'control',
      name: 'Punished Miss', description: 'Eating a hit snaps the mire shut just as hard as a dodge would.',
      fx: 'control.chill-blur', trigger: 'hit-taken', payoff: 'stun', modifies: 'wrappings-t2-control-payoff',
      face: packetDefaultFace('control'),
    },
    {
      id: 'wrappings-t2-barrier-tempo-amplifier', lineageId: 'wrappings', tier: 2, row: 'amplifier', lane: 'barrier-tempo',
      name: 'Standing Debt', description: 'Holding your ground pays the same shell a hit taken would.',
      fx: 'barrier-tempo.ward-shell', trigger: 'standing', payoff: 'ward', modifies: 'wrappings-t2-barrier-tempo-payoff',
      face: packetDefaultFace('barrier-tempo'),
    },
  ],
};
