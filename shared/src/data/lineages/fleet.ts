/**
 * The Fleet — Plains mobility lineage, kill momentum (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Kill chain) is the Fleet's existing mechanic. Lanes B/C (Tempo, Empowered)
 * are the matrix's assignment, not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const FLEET_LINEAGE: LineageDefinition = {
  id: 'fleet',
  slot: 'mobility',
  homeBiome: 'plains',
  lanes: ['kill-chain', 'tempo', 'empowered'],

  forms: [
    { recipeId: 'plains-boots-t1', tier: 1, biome: 'plains' },
    {
      recipeId: 'plains-boots-t2', tier: 2, biome: 'plains',
      capstone: {
        id: 'fleet-capstone-gale', name: 'Gale Boots',
        description: 'A kill now keeps the recovery window open instead of letting it lapse.',
        fx: 'kill-chain.recovery-pulse', lane: 'kill-chain',
        trigger: 'kill', payoff: 'recovery-window',
      },
    },
  ],

  cards: [
    {
      id: 'fleet-t1-kill-chain-payoff', lineageId: 'fleet', tier: 1, row: 'payoff', lane: 'kill-chain',
      name: 'Running Start', description: 'A kill puts spring back in your step and your wounds both.',
      fx: 'kill-chain.recovery-pulse', trigger: 'kill', payoff: 'recovery-window',
      face: packetDefaultFace('kill-chain'),
    },
    {
      id: 'fleet-t1-tempo-payoff', lineageId: 'fleet', tier: 1, row: 'payoff', lane: 'tempo',
      name: 'Coiled Stance', description: 'The instant before the sprint is the one that counts.',
      fx: 'tempo.evasive-blur', trigger: 'standing', payoff: 'speed-window',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'fleet-t1-empowered-payoff', lineageId: 'fleet', tier: 1, row: 'payoff', lane: 'empowered',
      name: 'Charging Start', description: 'The opening hit lands with a full head of speed behind it.',
      fx: 'empowered.guard-spark', trigger: 'first-hit', payoff: 'vulnerability',
      face: packetDefaultFace('empowered'),
    },

    // ── T2 payoff row (L3): the T1 payoff, grown up ─────────────────────────
    {
      id: 'fleet-t2-kill-chain-payoff', lineageId: 'fleet', tier: 2, row: 'payoff', lane: 'kill-chain',
      name: 'Full Stride', description: 'Every kill now puts more spring back than the last one spent.',
      fx: 'kill-chain.recovery-pulse', trigger: 'kill', payoff: 'recovery-window',
      face: packetDefaultFace('kill-chain'),
    },
    {
      id: 'fleet-t2-tempo-payoff', lineageId: 'fleet', tier: 2, row: 'payoff', lane: 'tempo',
      name: 'Held Coil', description: 'The instant before the sprint now carries further once it lets go.',
      fx: 'tempo.evasive-blur', trigger: 'standing', payoff: 'speed-window',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'fleet-t2-empowered-payoff', lineageId: 'fleet', tier: 2, row: 'payoff', lane: 'empowered',
      name: 'Full Charge', description: 'The opening hit now lands with enough speed behind it to leave a mark.',
      fx: 'empowered.guard-spark', trigger: 'first-hit', payoff: 'vulnerability',
      face: packetDefaultFace('empowered'),
    },

    // ── T2 amplifier row (L5): an extra trigger kind for the same payoff ────
    {
      id: 'fleet-t2-kill-chain-amplifier', lineageId: 'fleet', tier: 2, row: 'amplifier', lane: 'kill-chain',
      name: 'Opening Stride', description: 'The opening hit of a fight banks the same spring a kill would.',
      fx: 'kill-chain.recovery-pulse', trigger: 'first-hit', payoff: 'recovery-window', modifies: 'fleet-t2-kill-chain-payoff',
      face: packetDefaultFace('kill-chain'),
    },
    {
      id: 'fleet-t2-tempo-amplifier', lineageId: 'fleet', tier: 2, row: 'amplifier', lane: 'tempo',
      name: 'Killing Coil', description: 'A kill releases the coil just as well as standing still winds it.',
      fx: 'tempo.evasive-blur', trigger: 'kill', payoff: 'speed-window', modifies: 'fleet-t2-tempo-payoff',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'fleet-t2-empowered-amplifier', lineageId: 'fleet', tier: 2, row: 'amplifier', lane: 'empowered',
      name: 'Standing Charge', description: 'Holding still before you close marks the target before the first hit even lands.',
      fx: 'empowered.guard-spark', trigger: 'standing', payoff: 'vulnerability', modifies: 'fleet-t2-empowered-payoff',
      face: packetDefaultFace('empowered'),
    },
  ],
};
