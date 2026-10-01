/**
 * The Pulse — Cave recovery lineage, damage-to-Absorb conversion (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Bulwark) is the matrix's assignment for Cave recovery — a ward-like read on
 * the item's Absorb mechanic. Lanes B/C (Affliction, Control) are likewise not
 * yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const PULSE_LINEAGE: LineageDefinition = {
  id: 'pulse',
  slot: 'recovery',
  homeBiome: 'cave',
  lanes: ['bulwark', 'affliction', 'control'],

  forms: [
    { recipeId: 'cave-charm-t1', tier: 1, biome: 'cave' },
    {
      recipeId: 'cave-charm-t2', tier: 2, biome: 'cave',
      capstone: {
        id: 'pulse-capstone-resonant', name: 'Resonant Core',
        description: 'Raising a guard now keeps the pulse stacking plate instead of resetting it.',
        fx: 'bulwark.plating-chip', lane: 'bulwark',
        trigger: 'guard-cast', payoff: 'plating-stack',
      },
    },
  {
    recipeId: 'trench-charm-t4', tier: 4, biome: 'trench',
    capstone: {
      id: 'pulse-capstone-deep-shock', name: 'Deep Shock',
      description: "The ward's break rings all the way to the hull, and staggers anything close enough to feel it.",
      fx: 'control.chill-blur', lane: 'control',
      trigger: 'barrier-break', payoff: 'stun',
    },
  },

  ],

  cards: [
    {
      id: 'pulse-t1-bulwark-payoff', lineageId: 'pulse', tier: 1, row: 'payoff', lane: 'bulwark',
      name: 'Steady Beat', description: "Raising a guard sets the crystal's pulse to plate you.",
      fx: 'bulwark.plating-chip', trigger: 'guard-cast', payoff: 'plating-stack',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'pulse-t1-affliction-payoff', lineageId: 'pulse', tier: 1, row: 'payoff', lane: 'affliction',
      name: 'Resonant Ache', description: 'Each beat of the crystal leaves something lingering nearby.',
      fx: 'affliction.toxic-pulse', trigger: 'pulse', payoff: 'poison-stack',
      face: packetDefaultFace('affliction'),
    },
    {
      id: 'pulse-t1-control-payoff', lineageId: 'pulse', tier: 1, row: 'payoff', lane: 'control',
      name: 'Shattering Chime', description: "The barrier breaking rings loud enough to stagger what's close.",
      fx: 'control.chill-blur', trigger: 'barrier-break', payoff: 'stun',
      face: packetDefaultFace('control'),
    },

    // ── T2 payoff row (L3): the T1 payoff, grown up ─────────────────────────
    {
      id: 'pulse-t2-bulwark-payoff', lineageId: 'pulse', tier: 2, row: 'payoff', lane: 'bulwark',
      name: 'Deep Beat', description: 'Raising a guard now sets a rhythm the plate keeps answering to.',
      fx: 'bulwark.plating-chip', trigger: 'guard-cast', payoff: 'plating-stack',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'pulse-t2-affliction-payoff', lineageId: 'pulse', tier: 2, row: 'payoff', lane: 'affliction',
      name: 'Lasting Ache', description: 'Each beat now leaves more behind than the last one cleared.',
      fx: 'affliction.toxic-pulse', trigger: 'pulse', payoff: 'poison-stack',
      face: packetDefaultFace('affliction'),
    },
    {
      id: 'pulse-t2-control-payoff', lineageId: 'pulse', tier: 2, row: 'payoff', lane: 'control',
      name: 'Louder Chime', description: "The barrier breaking rings loud enough now to stagger more than what's closest.",
      fx: 'control.chill-blur', trigger: 'barrier-break', payoff: 'stun',
      face: packetDefaultFace('control'),
    },

    // ── T2 amplifier row (L5): an extra trigger kind for the same payoff ────
    {
      id: 'pulse-t2-bulwark-amplifier', lineageId: 'pulse', tier: 2, row: 'amplifier', lane: 'bulwark',
      name: 'Resonant Plate', description: "The crystal's own cadence keeps the plate coming between guards.",
      fx: 'bulwark.plating-chip', trigger: 'pulse', payoff: 'plating-stack', modifies: 'pulse-t2-bulwark-payoff',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'pulse-t2-affliction-amplifier', lineageId: 'pulse', tier: 2, row: 'amplifier', lane: 'affliction',
      name: 'Shattered Ache', description: 'The barrier giving way also seeds the ache the pulse alone would take longer to build.',
      fx: 'affliction.toxic-pulse', trigger: 'barrier-break', payoff: 'poison-stack', modifies: 'pulse-t2-affliction-payoff',
      face: packetDefaultFace('affliction'),
    },
    {
      id: 'pulse-t2-control-amplifier', lineageId: 'pulse', tier: 2, row: 'amplifier', lane: 'control',
      name: 'Killing Chime', description: 'A kill rings the chime just as loud as the barrier breaking does.',
      fx: 'control.chill-blur', trigger: 'kill', payoff: 'stun', modifies: 'pulse-t2-control-payoff',
      face: packetDefaultFace('control'),
    },
  ],
};
