/**
 * The Eye — Swamp recovery lineage, the periodic attrition-Recovery pulse
 * (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Affliction) is the matrix's assignment, matching the Eye's own periodic
 * `pulse` trigger even though the packet name reads offensive. Lanes B/C
 * (Control, Kill chain) are likewise not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const EYE_LINEAGE: LineageDefinition = {
  id: 'eye',
  slot: 'recovery',
  homeBiome: 'swamp',
  lanes: ['affliction', 'control', 'kill-chain'],

  forms: [
    { recipeId: 'swamp-charm-t1', tier: 1, biome: 'swamp' },
    {
      recipeId: 'swamp-charm-t2', tier: 2, biome: 'swamp',
      capstone: {
        id: 'eye-capstone-bog', name: 'Bog Eye',
        description: "The pulse now keeps deepening what's already lingering nearby instead of fading.",
        fx: 'affliction.toxic-pulse', lane: 'affliction',
        trigger: 'pulse', payoff: 'poison-stack',
      },
    },
  ],

  cards: [
    {
      id: 'eye-t1-affliction-payoff', lineageId: 'eye', tier: 1, row: 'payoff', lane: 'affliction',
      name: 'Weeping Light', description: 'Every pulse of the eye leaves the air a little more caustic.',
      fx: 'affliction.toxic-pulse', trigger: 'pulse', payoff: 'poison-stack',
      face: packetDefaultFace('affliction'),
    },
    {
      id: 'eye-t1-control-payoff', lineageId: 'eye', tier: 1, row: 'payoff', lane: 'control',
      name: "Golem's Stare", description: 'When the barrier gives, whatever broke it flinches.',
      fx: 'control.chill-blur', trigger: 'barrier-break', payoff: 'stun',
      face: packetDefaultFace('control'),
    },
    {
      id: 'eye-t1-kill-chain-payoff', lineageId: 'eye', tier: 1, row: 'payoff', lane: 'kill-chain',
      name: 'Green Light', description: "A kill turns the eye's glow toward healing for a while.",
      fx: 'kill-chain.recovery-pulse', trigger: 'kill', payoff: 'recovery-window',
      face: packetDefaultFace('kill-chain'),
    },
  ],
};
