/**
 * The Marsh — Swamp mobility lineage, slow resistance (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Control) is the Marsh's existing mechanic — resisting slow. Lanes B/C
 * (Affliction, Bulwark) are the matrix's assignment, not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const MARSH_LINEAGE: LineageDefinition = {
  id: 'marsh',
  slot: 'mobility',
  homeBiome: 'swamp',
  lanes: ['control', 'affliction', 'bulwark'],

  forms: [
    { recipeId: 'swamp-boots-t1', tier: 1, biome: 'swamp' },
    {
      recipeId: 'swamp-boots-t2', tier: 2, biome: 'swamp',
      capstone: {
        id: 'marsh-capstone-wetland', name: 'Wetland Anchor',
        description: 'Holding still now keeps the ground treacherous instead of settling.',
        fx: 'control.chill-blur', lane: 'control',
        trigger: 'standing', payoff: 'stun',
      },
    },
  {
    recipeId: 'trench-boots-t4-treaders', tier: 4, biome: 'trench',
    capstone: {
      id: 'marsh-capstone-deep-ballast', name: 'Deep Ballast',
      description: 'Every hit taken settles the ballast a little deeper, until it holds like plate.',
      fx: 'bulwark.plating-chip', lane: 'bulwark',
      trigger: 'hit-taken', payoff: 'plating-stack',
    },
  },

  ],

  cards: [
    {
      id: 'marsh-t1-control-payoff', lineageId: 'marsh', tier: 1, row: 'payoff', lane: 'control',
      name: 'Sucking Ground', description: 'Hold your footing on the marsh and whatever follows does not.',
      fx: 'control.chill-blur', trigger: 'standing', payoff: 'stun',
      face: packetDefaultFace('control'),
    },
    {
      id: 'marsh-t1-affliction-payoff', lineageId: 'marsh', tier: 1, row: 'payoff', lane: 'affliction',
      name: 'Bog Gas', description: 'A kill stirs up the marsh floor around it.',
      fx: 'affliction.toxic-pulse', trigger: 'kill', payoff: 'poison-stack',
      face: packetDefaultFace('affliction'),
    },
    {
      id: 'marsh-t1-bulwark-payoff', lineageId: 'marsh', tier: 1, row: 'payoff', lane: 'bulwark',
      name: 'Sure Footing', description: 'The opening hit finds ground that was already braced for it.',
      fx: 'bulwark.plating-chip', trigger: 'first-hit', payoff: 'plating-stack',
      face: packetDefaultFace('bulwark'),
    },

    // ── T2 payoff row (L3): the T1 payoff, grown up ─────────────────────────
    {
      id: 'marsh-t2-control-payoff', lineageId: 'marsh', tier: 2, row: 'payoff', lane: 'control',
      name: 'Deep Mire', description: 'Hold your footing long enough and the marsh stops letting go at all.',
      fx: 'control.chill-blur', trigger: 'standing', payoff: 'stun',
      face: packetDefaultFace('control'),
    },
    {
      id: 'marsh-t2-affliction-payoff', lineageId: 'marsh', tier: 2, row: 'payoff', lane: 'affliction',
      name: 'Rising Gas', description: 'Every kill now stirs up more of the marsh floor than the last one did.',
      fx: 'affliction.toxic-pulse', trigger: 'kill', payoff: 'poison-stack',
      face: packetDefaultFace('affliction'),
    },
    {
      id: 'marsh-t2-bulwark-payoff', lineageId: 'marsh', tier: 2, row: 'payoff', lane: 'bulwark',
      name: 'Braced Footing', description: 'Ground braced this well keeps answering long after the opening hit.',
      fx: 'bulwark.plating-chip', trigger: 'first-hit', payoff: 'plating-stack',
      face: packetDefaultFace('bulwark'),
    },

    // ── T2 amplifier row (L5): an extra trigger kind for the same payoff ────
    {
      id: 'marsh-t2-control-amplifier', lineageId: 'marsh', tier: 2, row: 'amplifier', lane: 'control',
      name: 'Killing Mire', description: 'A kill locks the mire shut just as hard as holding your footing does.',
      fx: 'control.chill-blur', trigger: 'kill', payoff: 'stun', modifies: 'marsh-t2-control-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('control'),
    },
    {
      id: 'marsh-t2-affliction-amplifier', lineageId: 'marsh', tier: 2, row: 'amplifier', lane: 'affliction',
      name: 'First Gas', description: 'The opening hit stirs the marsh floor without waiting on a kill.',
      fx: 'affliction.toxic-pulse', trigger: 'first-hit', payoff: 'poison-stack', modifies: 'marsh-t2-affliction-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('affliction'),
    },
    {
      id: 'marsh-t2-bulwark-amplifier', lineageId: 'marsh', tier: 2, row: 'amplifier', lane: 'bulwark',
      name: 'Settled Footing', description: 'Holding your ground after the opener keeps the plate coming on its own.',
      fx: 'bulwark.plating-chip', trigger: 'standing', payoff: 'plating-stack', modifies: 'marsh-t2-bulwark-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('bulwark'),
    },
  ],
};
