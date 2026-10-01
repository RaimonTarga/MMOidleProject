/**
 * The Hide — Cave armor lineage, the %DR generalist wall (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Bulwark) is the Hide's existing mechanic. Lanes B/C (Kill chain, Engagement)
 * are the matrix's assignment, not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const HIDE_LINEAGE: LineageDefinition = {
  id: 'hide',
  slot: 'armor',
  homeBiome: 'cave',
  lanes: ['bulwark', 'kill-chain', 'engagement'],

  forms: [
    { recipeId: 'cave-vest-t1', tier: 1, biome: 'cave' },
    {
      recipeId: 'cave-vest-t2', tier: 2, biome: 'cave',
      capstone: {
        id: 'hide-capstone-dire', name: 'Dire Resolve',
        description: 'Every hit you hold through keeps the hide toughening, not just the first.',
        fx: 'bulwark.hide-ward', lane: 'bulwark',
        trigger: 'standing', payoff: 'plating-stack',
      },
    },
  ],

  cards: [
    {
      id: 'hide-t1-bulwark-payoff', lineageId: 'hide', tier: 1, row: 'payoff', lane: 'bulwark',
      name: 'Thick Hide', description: 'Hold still long enough and the hide toughens on its own.',
      fx: 'bulwark.plating-chip', trigger: 'standing', payoff: 'plating-stack',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'hide-t1-kill-chain-payoff', lineageId: 'hide', tier: 1, row: 'payoff', lane: 'kill-chain',
      name: 'Second Wind', description: 'A clean dodge is as good as a breath.',
      fx: 'kill-chain.recovery-pulse', trigger: 'evade', payoff: 'recovery-window',
      face: packetDefaultFace('kill-chain'),
    },
    {
      id: 'hide-t1-engagement-payoff', lineageId: 'hide', tier: 1, row: 'payoff', lane: 'engagement',
      name: 'Weathered Scar', description: 'The opening hit lands on ground that has taken worse.',
      fx: 'engagement.sidestep-blur', trigger: 'hit-taken', payoff: 'engagement-dr',
      face: packetDefaultFace('engagement'),
    },

    // ── T2 payoff row (L3): the T1 payoff, grown up ─────────────────────────
    {
      id: 'hide-t2-bulwark-payoff', lineageId: 'hide', tier: 2, row: 'payoff', lane: 'bulwark',
      name: 'Calloused Hide', description: 'Scar tissue this deep keeps toughening long after the first stand.',
      fx: 'bulwark.plating-chip', trigger: 'standing', payoff: 'plating-stack',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'hide-t2-kill-chain-payoff', lineageId: 'hide', tier: 2, row: 'payoff', lane: 'kill-chain',
      name: 'Deep Breath', description: 'The breath a clean dodge buys you now reaches further than the moment.',
      fx: 'kill-chain.recovery-pulse', trigger: 'evade', payoff: 'recovery-window',
      face: packetDefaultFace('kill-chain'),
    },
    {
      id: 'hide-t2-engagement-payoff', lineageId: 'hide', tier: 2, row: 'payoff', lane: 'engagement',
      name: 'Old Scar', description: 'Ground this weathered barely notices what lands on it first.',
      fx: 'engagement.sidestep-blur', trigger: 'hit-taken', payoff: 'engagement-dr',
      face: packetDefaultFace('engagement'),
    },

    // ── T2 amplifier row (L5): an extra trigger kind for the same payoff ────
    {
      id: 'hide-t2-bulwark-amplifier', lineageId: 'hide', tier: 2, row: 'amplifier', lane: 'bulwark',
      name: 'Reflex Callous', description: 'A clean dodge toughens the hide exactly like holding still does.',
      fx: 'bulwark.plating-chip', trigger: 'evade', payoff: 'plating-stack', modifies: 'hide-t2-bulwark-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'hide-t2-kill-chain-amplifier', lineageId: 'hide', tier: 2, row: 'amplifier', lane: 'kill-chain',
      name: 'Second Wind, Twice', description: 'Taking a hit now buys the same breath a dodge does.',
      fx: 'kill-chain.recovery-pulse', trigger: 'hit-taken', payoff: 'recovery-window', modifies: 'hide-t2-kill-chain-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('kill-chain'),
    },
    {
      id: 'hide-t2-engagement-amplifier', lineageId: 'hide', tier: 2, row: 'amplifier', lane: 'engagement',
      name: 'Set Ground', description: 'Planting your feet before the opener keeps the discount live without a dodge.',
      fx: 'engagement.sidestep-blur', trigger: 'standing', payoff: 'engagement-dr', modifies: 'hide-t2-engagement-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('engagement'),
    },
  ],
};
