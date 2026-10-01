/**
 * The Barrier — Mountain recovery lineage, raw Barrier capacity (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Barrier tempo) is the Barrier's existing mechanic. Lanes B/C (Bulwark,
 * Empowered) are the matrix's assignment, not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const BARRIER_LINEAGE: LineageDefinition = {
  id: 'barrier',
  slot: 'recovery',
  homeBiome: 'mountain',
  lanes: ['barrier-tempo', 'bulwark', 'empowered'],

  forms: [
    { recipeId: 'mountain-charm-t1', tier: 1, biome: 'mountain' },
    {
      recipeId: 'mountain-charm-t2', tier: 2, biome: 'mountain',
      capstone: {
        id: 'barrier-capstone-bulwark', name: 'Bulwark Heart',
        description: 'A broken barrier now refills and keeps the ward from fading right away.',
        fx: 'barrier-tempo.ward-shell', lane: 'barrier-tempo',
        trigger: 'barrier-break', payoff: 'ward',
      },
    },
  {
    recipeId: 'tundra-charm-t3', tier: 3, biome: 'tundra',
    capstone: {
      id: 'barrier-capstone-frozen-ground', name: 'Frozen Ground',
      description: "Frostward's chill keeps the plate restacking instead of resetting, the longer you hold your ground.",
      fx: 'bulwark.plating-chip', lane: 'bulwark',
      trigger: 'standing', payoff: 'plating-stack',
    },
  },

  ],

  cards: [
    {
      id: 'barrier-t1-barrier-tempo-payoff', lineageId: 'barrier', tier: 1, row: 'payoff', lane: 'barrier-tempo',
      name: 'Granite Refill', description: 'When the barrier cracks, the mountain sends more.',
      fx: 'barrier-tempo.ward-shell', trigger: 'barrier-break', payoff: 'ward',
      face: packetDefaultFace('barrier-tempo'),
    },
    {
      id: 'barrier-t1-bulwark-payoff', lineageId: 'barrier', tier: 1, row: 'payoff', lane: 'bulwark',
      name: 'Cairn Guard', description: 'Raising a guard stacks stone on stone.',
      fx: 'bulwark.plating-chip', trigger: 'guard-cast', payoff: 'plating-stack',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'barrier-t1-empowered-payoff', lineageId: 'barrier', tier: 1, row: 'payoff', lane: 'empowered',
      name: 'Pressure Point', description: "The barrier's own hum finds the weak spot for you.",
      fx: 'empowered.guard-spark', trigger: 'pulse', payoff: 'vulnerability',
      face: packetDefaultFace('empowered'),
    },

    // ── T2 payoff row (L3): the T1 payoff, grown up ─────────────────────────
    {
      id: 'barrier-t2-barrier-tempo-payoff', lineageId: 'barrier', tier: 2, row: 'payoff', lane: 'barrier-tempo',
      name: 'Mountain Refill', description: 'The mountain sends more than it used to, every time the barrier gives.',
      fx: 'barrier-tempo.ward-shell', trigger: 'barrier-break', payoff: 'ward',
      face: packetDefaultFace('barrier-tempo'),
    },
    {
      id: 'barrier-t2-bulwark-payoff', lineageId: 'barrier', tier: 2, row: 'payoff', lane: 'bulwark',
      name: 'Standing Cairn', description: 'Every guard raised now stacks stone the last one left behind.',
      fx: 'bulwark.plating-chip', trigger: 'guard-cast', payoff: 'plating-stack',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'barrier-t2-empowered-payoff', lineageId: 'barrier', tier: 2, row: 'payoff', lane: 'empowered',
      name: 'Deep Pressure', description: 'The hum finds the weak point and keeps leaning on it a while longer.',
      fx: 'empowered.guard-spark', trigger: 'pulse', payoff: 'vulnerability',
      face: packetDefaultFace('empowered'),
    },

    // ── T2 amplifier row (L5): an extra trigger kind for the same payoff ────
    {
      id: 'barrier-t2-barrier-tempo-amplifier', lineageId: 'barrier', tier: 2, row: 'amplifier', lane: 'barrier-tempo',
      name: 'Cairn Refill', description: 'A kill sends the same refill a broken barrier does.',
      fx: 'barrier-tempo.ward-shell', trigger: 'kill', payoff: 'ward', modifies: 'barrier-t2-barrier-tempo-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('barrier-tempo'),
    },
    {
      id: 'barrier-t2-bulwark-amplifier', lineageId: 'barrier', tier: 2, row: 'amplifier', lane: 'bulwark',
      name: 'Resonant Cairn', description: "The barrier's own cadence keeps stacking stone between guards.",
      fx: 'bulwark.plating-chip', trigger: 'pulse', payoff: 'plating-stack', modifies: 'barrier-t2-bulwark-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'barrier-t2-empowered-amplifier', lineageId: 'barrier', tier: 2, row: 'amplifier', lane: 'empowered',
      name: 'Cracked Pressure', description: 'The barrier giving way finds the same weak point the hum does.',
      fx: 'empowered.guard-spark', trigger: 'barrier-break', payoff: 'vulnerability', modifies: 'barrier-t2-empowered-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('empowered'),
    },

    // ── T3 keystone row (design §4 amended 2026-10-01): one shared keystone per
    // packet, this lineage's own flavour of it. Run 3 W1-B.
    {
      id: 'barrier-t3-barrier-tempo-keystone', lineageId: 'barrier', tier: 3, row: 'keystone', lane: 'barrier-tempo',
      name: 'Granite Unbroken', description: 'Above half health, nothing you take stops the shell from mending.',
      fx: 'barrier-tempo.keystone', trigger: 'hit-taken', payoff: 'ward',
      face: packetDefaultFace('barrier-tempo'),
    },
    {
      id: 'barrier-t3-bulwark-keystone', lineageId: 'barrier', tier: 3, row: 'keystone', lane: 'bulwark',
      name: 'Cairn Immovable', description: "Stationary DR and plate stacks hold for two seconds after you've already moved on.",
      fx: 'bulwark.keystone', trigger: 'standing', payoff: 'plating-stack',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'barrier-t3-empowered-keystone', lineageId: 'barrier', tier: 3, row: 'keystone', lane: 'empowered',
      name: 'Full Pressure', description: 'What the mechanic marks, the ground around it marks too.',
      fx: 'empowered.keystone', trigger: 'mechanic-fired', payoff: 'echo-hit',
      face: packetDefaultFace('empowered'),
    },

    // ── T4 cross row (design §4): a second lane's payoff at ROW_SCALAR.cross ──
    {
      id: 'barrier-t4-barrier-tempo-cross', lineageId: 'barrier', tier: 4, row: 'cross', lane: 'barrier-tempo',
      name: 'Granite Cairn', description: 'Raising a guard sends the same refill the mountain does when the barrier cracks.',
      fx: 'barrier-tempo.ward-shell', trigger: 'guard-cast', payoff: 'plating-stack', borrowsLane: 'bulwark',
      face: packetDefaultFace('barrier-tempo'),
    },
    {
      id: 'barrier-t4-bulwark-cross', lineageId: 'barrier', tier: 4, row: 'cross', lane: 'bulwark',
      name: 'Pressured Cairn', description: "The crystal's hum finds the weak spot between guards too.",
      fx: 'bulwark.plating-chip', trigger: 'pulse', payoff: 'vulnerability', borrowsLane: 'empowered',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'barrier-t4-empowered-cross', lineageId: 'barrier', tier: 4, row: 'cross', lane: 'empowered',
      name: 'Pressured Refill', description: 'When the barrier gives, the hum finds the weak spot right along with it.',
      fx: 'empowered.guard-spark', trigger: 'barrier-break', payoff: 'ward', borrowsLane: 'barrier-tempo',
      face: packetDefaultFace('empowered'),
    },
  ],
};
