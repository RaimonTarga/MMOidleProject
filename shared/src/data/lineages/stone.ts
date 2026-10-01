/**
 * The Stone — Plains recovery lineage, on-kill Recovery for chained packs
 * (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Kill chain) is the Stone's existing mechanic. Lanes B/C (Tempo, Engagement)
 * are the matrix's assignment, not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const STONE_LINEAGE: LineageDefinition = {
  id: 'stone',
  slot: 'recovery',
  homeBiome: 'plains',
  lanes: ['kill-chain', 'tempo', 'engagement'],

  forms: [
    { recipeId: 'plains-charm-t1', tier: 1, biome: 'plains' },
    {
      recipeId: 'plains-charm-t2', tier: 2, biome: 'plains',
      capstone: {
        id: 'stone-capstone-stalwart', name: 'Stalwart Heartbeat',
        description: 'The window a kill opens now refuses to fully close before the next one.',
        fx: 'kill-chain.recovery-pulse', lane: 'kill-chain',
        trigger: 'kill', payoff: 'recovery-window',
      },
    },
  {
    recipeId: 'desert-charm-t2', tier: 2, biome: 'desert',
    capstone: {
      id: 'stone-capstone-oasis-guard', name: 'Oasis Guard',
      description: 'A guard raised in the mirage-haze starts the fight already half-cleansed.',
      fx: 'engagement.sidestep-blur', lane: 'engagement',
      trigger: 'guard-cast', payoff: 'cleanse',
    },
  },

  ],

  cards: [
    {
      id: 'stone-t1-kill-chain-payoff', lineageId: 'stone', tier: 1, row: 'payoff', lane: 'kill-chain',
      name: 'Warmth of the Kill', description: 'Every kill keeps the stone glowing a little longer.',
      fx: 'kill-chain.recovery-pulse', trigger: 'kill', payoff: 'recovery-window',
      face: packetDefaultFace('kill-chain'),
    },
    {
      id: 'stone-t1-tempo-payoff', lineageId: 'stone', tier: 1, row: 'payoff', lane: 'tempo',
      name: 'Steady Hum', description: "The stone's pulse quickens your step along with your heart.",
      fx: 'tempo.evasive-blur', trigger: 'pulse', payoff: 'speed-window',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'stone-t1-engagement-payoff', lineageId: 'stone', tier: 1, row: 'payoff', lane: 'engagement',
      name: 'Sunrise Guard', description: 'Raise your guard and the opening exchange costs less.',
      fx: 'engagement.sidestep-blur', trigger: 'guard-cast', payoff: 'engagement-dr',
      face: packetDefaultFace('engagement'),
    },

    // ── T2 payoff row (L3): the T1 payoff, grown up ─────────────────────────
    {
      id: 'stone-t2-kill-chain-payoff', lineageId: 'stone', tier: 2, row: 'payoff', lane: 'kill-chain',
      name: 'Banked Warmth', description: 'Every kill now banks more warmth than the last one spent.',
      fx: 'kill-chain.recovery-pulse', trigger: 'kill', payoff: 'recovery-window',
      face: packetDefaultFace('kill-chain'),
    },
    {
      id: 'stone-t2-tempo-payoff', lineageId: 'stone', tier: 2, row: 'payoff', lane: 'tempo',
      name: 'Resonant Hum', description: "The stone's pulse now carries your stride long after it fades.",
      fx: 'tempo.evasive-blur', trigger: 'pulse', payoff: 'speed-window',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'stone-t2-engagement-payoff', lineageId: 'stone', tier: 2, row: 'payoff', lane: 'engagement',
      name: 'First Light', description: 'Raising a guard now softens the whole opening exchange, not just the first hit.',
      fx: 'engagement.sidestep-blur', trigger: 'guard-cast', payoff: 'engagement-dr',
      face: packetDefaultFace('engagement'),
    },

    // ── T2 amplifier row (L5): an extra trigger kind for the same payoff ────
    {
      id: 'stone-t2-kill-chain-amplifier', lineageId: 'stone', tier: 2, row: 'amplifier', lane: 'kill-chain',
      name: 'Guarded Warmth', description: 'Raising a guard banks the same warmth a kill would.',
      fx: 'kill-chain.recovery-pulse', trigger: 'guard-cast', payoff: 'recovery-window', modifies: 'stone-t2-kill-chain-payoff',
      face: packetDefaultFace('kill-chain'),
    },
    {
      id: 'stone-t2-tempo-amplifier', lineageId: 'stone', tier: 2, row: 'amplifier', lane: 'tempo',
      name: 'Broken Rhythm', description: "The barrier giving way also kicks the stone's hum into your stride.",
      fx: 'tempo.evasive-blur', trigger: 'barrier-break', payoff: 'speed-window', modifies: 'stone-t2-tempo-payoff',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'stone-t2-engagement-amplifier', lineageId: 'stone', tier: 2, row: 'amplifier', lane: 'engagement',
      name: 'Standing Light', description: "The stone's own cadence keeps the opening discount topped up between guards.",
      fx: 'engagement.sidestep-blur', trigger: 'pulse', payoff: 'engagement-dr', modifies: 'stone-t2-engagement-payoff',
      face: packetDefaultFace('engagement'),
    },
  ],
};
