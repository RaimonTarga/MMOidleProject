/**
 * The Wing — Cave mobility lineage, stealth (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Engagement) is the matrix's assignment for Cave mobility — a first-strike
 * read on the item's stealth mechanic. Lanes B/C (Kill chain, Control) are
 * likewise not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const WING_LINEAGE: LineageDefinition = {
  id: 'wing',
  slot: 'mobility',
  homeBiome: 'cave',
  lanes: ['engagement', 'kill-chain', 'control'],

  forms: [
    { recipeId: 'cave-boots-t1', tier: 1, biome: 'cave' },
    {
      recipeId: 'cave-boots-t2', tier: 2, biome: 'cave',
      capstone: {
        id: 'wing-capstone-cavern', name: 'Cavern Sprint',
        description: 'The opening exchange keeps costing less, wherever the dark takes you next.',
        fx: 'engagement.sidestep-blur', lane: 'engagement',
        trigger: 'first-hit', payoff: 'engagement-dr',
      },
    },
  ],

  cards: [
    {
      id: 'wing-t1-engagement-payoff', lineageId: 'wing', tier: 1, row: 'payoff', lane: 'engagement',
      name: 'Silent Drop', description: 'Out of the dark, the first hit lands on you softer than it should.',
      fx: 'engagement.sidestep-blur', trigger: 'first-hit', payoff: 'engagement-dr',
      face: packetDefaultFace('engagement'),
    },
    {
      id: 'wing-t1-kill-chain-payoff', lineageId: 'wing', tier: 1, row: 'payoff', lane: 'kill-chain',
      name: 'Wingbeat', description: 'A kill and you are already airborne toward the next.',
      fx: 'kill-chain.recovery-pulse', trigger: 'kill', payoff: 'recovery-window',
      face: packetDefaultFace('kill-chain'),
    },
    {
      id: 'wing-t1-control-payoff', lineageId: 'wing', tier: 1, row: 'payoff', lane: 'control',
      name: 'Ambush Perch', description: 'Wait long enough in the dark and the pounce stuns on contact.',
      fx: 'control.chill-blur', trigger: 'standing', payoff: 'stun',
      face: packetDefaultFace('control'),
    },

    // ── T2 payoff row (L3): the T1 payoff, grown up ─────────────────────────
    {
      id: 'wing-t2-engagement-payoff', lineageId: 'wing', tier: 2, row: 'payoff', lane: 'engagement',
      name: 'Deeper Dark', description: 'Out of the dark, the first hit now lands softer than it ever did before.',
      fx: 'engagement.sidestep-blur', trigger: 'first-hit', payoff: 'engagement-dr',
      face: packetDefaultFace('engagement'),
    },
    {
      id: 'wing-t2-kill-chain-payoff', lineageId: 'wing', tier: 2, row: 'payoff', lane: 'kill-chain',
      name: 'Second Wingbeat', description: 'A kill now carries you further airborne than the last one did.',
      fx: 'kill-chain.recovery-pulse', trigger: 'kill', payoff: 'recovery-window',
      face: packetDefaultFace('kill-chain'),
    },
    {
      id: 'wing-t2-control-payoff', lineageId: 'wing', tier: 2, row: 'payoff', lane: 'control',
      name: 'Patient Perch', description: 'Wait long enough in the dark and the pounce stuns harder on contact.',
      fx: 'control.chill-blur', trigger: 'standing', payoff: 'stun',
      face: packetDefaultFace('control'),
    },

    // ── T2 amplifier row (L5): an extra trigger kind for the same payoff ────
    {
      id: 'wing-t2-engagement-amplifier', lineageId: 'wing', tier: 2, row: 'amplifier', lane: 'engagement',
      name: 'Settled Dark', description: 'Waiting in the dark before you drop keeps the discount live without the first hit.',
      fx: 'engagement.sidestep-blur', trigger: 'standing', payoff: 'engagement-dr', modifies: 'wing-t2-engagement-payoff',
      face: packetDefaultFace('engagement'),
    },
    {
      id: 'wing-t2-kill-chain-amplifier', lineageId: 'wing', tier: 2, row: 'amplifier', lane: 'kill-chain',
      name: 'Opening Wingbeat', description: 'The opening hit of a fight launches you airborne without waiting on a kill.',
      fx: 'kill-chain.recovery-pulse', trigger: 'first-hit', payoff: 'recovery-window', modifies: 'wing-t2-kill-chain-payoff',
      face: packetDefaultFace('kill-chain'),
    },
    {
      id: 'wing-t2-control-amplifier', lineageId: 'wing', tier: 2, row: 'amplifier', lane: 'control',
      name: 'Killing Perch', description: 'A kill stuns the next one close just as hard as the patient pounce does.',
      fx: 'control.chill-blur', trigger: 'kill', payoff: 'stun', modifies: 'wing-t2-control-payoff',
      face: packetDefaultFace('control'),
    },
  ],
};
