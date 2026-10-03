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
  // Parked for the second playtest (design §24.5): data kept, tree unreachable.
  parked: true,
  homeBiome: 'plains',
  lanes: ['kill-chain', 'tempo', 'empowered'],

  forms: [
    { recipeId: 'plains-boots-t1', tier: 1, biome: 'plains' },
    {
      recipeId: 'plains-boots-t2', tier: 2, biome: 'plains',
      capstone: {
        id: 'fleet-capstone-gale', name: 'Gale Boots',
        description: 'A kill now keeps the recovery window open instead of letting it lapse.',
        fx: 'kill-chain.wind-chaser', lane: 'kill-chain',
        trigger: 'kill', payoff: 'recovery-window',
      },
    },
  {
    recipeId: 'graveyard-boots-t4', tier: 4, biome: 'graveyard',
    capstone: {
      id: 'fleet-capstone-grave-momentum', name: 'Grave Momentum',
      description: 'Every kill you leave behind lends its leftover hurry to your next stride.',
      fx: 'kill-chain.wind-chaser', lane: 'kill-chain',
      trigger: 'kill', payoff: 'speed-window',
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
      name: 'Coiled Stance', description: 'Holding ready a beat before you move is what makes the first hit miss.',
      fx: 'tempo.evasive-blur', trigger: 'standing', payoff: 'evasion-window',
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
      name: 'Held Coil', description: 'The longer you hold the coil, the harder the first hit is to land.',
      fx: 'tempo.evasive-blur', trigger: 'standing', payoff: 'evasion-window',
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
      amplifies: 'trigger',
      face: packetDefaultFace('kill-chain'),
    },
    {
      id: 'fleet-t2-tempo-amplifier', lineageId: 'fleet', tier: 2, row: 'amplifier', lane: 'tempo',
      name: 'Killing Coil', description: 'A kill releases the coil just as well as standing still winds it.',
      fx: 'tempo.evasive-blur', trigger: 'kill', payoff: 'evasion-window', modifies: 'fleet-t2-tempo-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'fleet-t2-empowered-amplifier', lineageId: 'fleet', tier: 2, row: 'amplifier', lane: 'empowered',
      name: 'Standing Charge', description: 'Holding still before you close marks the target before the first hit even lands.',
      fx: 'empowered.guard-spark', trigger: 'standing', payoff: 'vulnerability', modifies: 'fleet-t2-empowered-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('empowered'),
    },

    // ── T3 keystone row (design §4 amended 2026-10-01): one shared keystone per
    // packet, this lineage's own flavour of it. Run 3 W1-B.
    {
      id: 'fleet-t3-kill-chain-keystone', lineageId: 'fleet', tier: 3, row: 'keystone', lane: 'kill-chain',
      name: 'Spring Fully Loaded', description: 'A kill pays the mechanic back in full, right there.',
      fx: 'kill-chain.keystone', trigger: 'kill', payoff: 'recovery-window',
      face: packetDefaultFace('kill-chain'),
    },
    {
      id: 'fleet-t3-tempo-keystone', lineageId: 'fleet', tier: 3, row: 'keystone', lane: 'tempo',
      name: 'Coil Never Slack', description: "The echo keeps answering. It doesn't stop until a hit misses or no fresh target is close.",
      fx: 'tempo.keystone', trigger: 'hit-nth', payoff: 'echo-hit',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'fleet-t3-empowered-keystone', lineageId: 'fleet', tier: 3, row: 'keystone', lane: 'empowered',
      name: 'Full Charge Ahead', description: 'What the mechanic marks, the ground around it marks too.',
      fx: 'empowered.keystone', trigger: 'mechanic-fired', payoff: 'echo-hit',
      face: packetDefaultFace('empowered'),
    },

    // ── T4 cross row (design §4): a second lane's payoff at ROW_SCALAR.cross ──
    {
      id: 'fleet-t4-kill-chain-cross', lineageId: 'fleet', tier: 4, row: 'cross', lane: 'kill-chain',
      name: 'Coiled Stride', description: 'The stillness before the sprint banks the same spring a kill does.',
      fx: 'kill-chain.recovery-pulse', trigger: 'standing', payoff: 'speed-window', borrowsLane: 'tempo',
      face: packetDefaultFace('kill-chain'),
    },
    {
      id: 'fleet-t4-tempo-cross', lineageId: 'fleet', tier: 4, row: 'cross', lane: 'tempo',
      name: 'Charging Coil', description: 'The instant before the sprint still lands with a full head of speed behind it.',
      fx: 'tempo.evasive-blur', trigger: 'first-hit', payoff: 'vulnerability', borrowsLane: 'empowered',
      face: packetDefaultFace('tempo'),
    },
    {
      id: 'fleet-t4-empowered-cross', lineageId: 'fleet', tier: 4, row: 'cross', lane: 'empowered',
      name: 'Charged Spring', description: 'A kill puts the same spring back as the charge the opening hit carried.',
      fx: 'empowered.guard-spark', trigger: 'kill', payoff: 'recovery-window', borrowsLane: 'kill-chain',
      face: packetDefaultFace('empowered'),
    },
  ],
};
