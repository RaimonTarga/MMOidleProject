/**
 * The Robe — Plains armor lineage, plating for frequent light hits (design §17).
 *
 * PROVISIONAL. Authored in the overnight run from design §17's non-weapon lane
 * matrix (proposed, not approved) so the defensive trees exist to playtest. Lane
 * A (Bulwark) is the Robe's existing mechanic — flat plating. Lanes B/C (Empowered,
 * Tempo) are the matrix's assignment, not yet bench-reviewed.
 *
 * No numbers here — see `types.ts`.
 */
import type { LineageDefinition } from './types';
import { packetDefaultFace } from './packets';

export const ROBE_LINEAGE: LineageDefinition = {
  id: 'robe',
  slot: 'armor',
  homeBiome: 'plains',
  lanes: ['bulwark', 'empowered', 'tempo'],

  forms: [
    { recipeId: 'plains-vest-t1', tier: 1, biome: 'plains' },
    {
      recipeId: 'plains-vest-t2', tier: 2, biome: 'plains',
      capstone: {
        id: 'robe-capstone-enduring', name: "Fortified Stance",
        description: 'Standing your ground keeps the plates building instead of resetting.',
        fx: 'bulwark.plating-chip', lane: 'bulwark',
        trigger: 'standing', payoff: 'plating-stack',
      },
    },
  {
    recipeId: 'desert-vest-t2', tier: 2, biome: 'desert',
    capstone: {
      id: 'robe-capstone-last-stand', name: 'Last Stand',
      description: 'The first hit absorbed becomes plate for the rest of the fight.',
      fx: 'bulwark.plating-chip', lane: 'bulwark',
      trigger: 'hit-taken', payoff: 'plating-stack',
    },
  },

  ],

  cards: [
    {
      id: 'robe-t1-bulwark-payoff', lineageId: 'robe', tier: 1, row: 'payoff', lane: 'bulwark',
      name: 'Braced Plating', description: 'Hold your ground and the plates settle closer together.',
      fx: 'bulwark.plating-chip', trigger: 'standing', payoff: 'plating-stack',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'robe-t1-empowered-payoff', lineageId: 'robe', tier: 1, row: 'payoff', lane: 'empowered',
      name: 'Answered Blow', description: 'Whatever just hit you regrets it a beat later.',
      fx: 'empowered.guard-spark', trigger: 'hit-taken', payoff: 'vulnerability',
      face: packetDefaultFace('empowered'),
    },
    {
      id: 'robe-t1-tempo-payoff', lineageId: 'robe', tier: 1, row: 'payoff', lane: 'tempo',
      name: 'Light on Your Feet', description: 'A clean dodge carries straight into the next step.',
      fx: 'tempo.evasive-blur', trigger: 'evade', payoff: 'speed-window',
      face: packetDefaultFace('tempo'),
    },

    // ── T2 payoff row (L3): the T1 payoff, grown up ─────────────────────────
    {
      id: 'robe-t2-bulwark-payoff', lineageId: 'robe', tier: 2, row: 'payoff', lane: 'bulwark',
      name: 'Locked Formation', description: 'Hold your ground long enough and the plates stop settling — they lock.',
      fx: 'bulwark.plating-chip', trigger: 'standing', payoff: 'plating-stack',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'robe-t2-empowered-payoff', lineageId: 'robe', tier: 2, row: 'payoff', lane: 'empowered',
      name: 'Marked Retaliation', description: 'What hits you now wears the mark long after the blow lands.',
      fx: 'empowered.guard-spark', trigger: 'hit-taken', payoff: 'vulnerability',
      face: packetDefaultFace('empowered'),
    },
    {
      id: 'robe-t2-tempo-payoff', lineageId: 'robe', tier: 2, row: 'payoff', lane: 'tempo',
      name: 'Clean Break', description: 'A dodge this practiced carries you well past the next step.',
      fx: 'tempo.evasive-blur', trigger: 'evade', payoff: 'speed-window',
      face: packetDefaultFace('tempo'),
    },

    // ── T2 amplifier row (L5): an extra trigger kind for the same payoff ────
    {
      id: 'robe-t2-bulwark-amplifier', lineageId: 'robe', tier: 2, row: 'amplifier', lane: 'bulwark',
      name: 'Reflexive Bracing', description: 'A clean dodge settles the plates in just as well as standing fast.',
      fx: 'bulwark.plating-chip', trigger: 'evade', payoff: 'plating-stack', modifies: 'robe-t2-bulwark-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'robe-t2-empowered-amplifier', lineageId: 'robe', tier: 2, row: 'amplifier', lane: 'empowered',
      name: 'Lingering Mark', description: 'Hold your ground and the mark spreads to whatever is still close.',
      fx: 'empowered.guard-spark', trigger: 'standing', payoff: 'vulnerability', modifies: 'robe-t2-empowered-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('empowered'),
    },
    {
      id: 'robe-t2-tempo-amplifier', lineageId: 'robe', tier: 2, row: 'amplifier', lane: 'tempo',
      name: 'Undeterred Step', description: 'Taking a hit does not cost you the rhythm a dodge started.',
      fx: 'tempo.evasive-blur', trigger: 'hit-taken', payoff: 'speed-window', modifies: 'robe-t2-tempo-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('tempo'),
    },

    // ── T3 keystone row (design §4 amended 2026-10-01): one shared keystone per
    // packet, this lineage's own flavour of it. Run 3 W1-B.
    {
      id: 'robe-t3-bulwark-keystone', lineageId: 'robe', tier: 3, row: 'keystone', lane: 'bulwark',
      name: 'Rooted Plating', description: "Stationary DR and plate stacks hold for two seconds after you've already moved on.",
      fx: 'bulwark.keystone', trigger: 'standing', payoff: 'plating-stack',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'robe-t3-empowered-keystone', lineageId: 'robe', tier: 3, row: 'keystone', lane: 'empowered',
      name: 'Answered in Full', description: 'What the mechanic marks, the ground around it marks too.',
      fx: 'empowered.keystone', trigger: 'mechanic-fired', payoff: 'echo-hit',
      face: packetDefaultFace('empowered'),
    },
    {
      id: 'robe-t3-tempo-keystone', lineageId: 'robe', tier: 3, row: 'keystone', lane: 'tempo',
      name: 'Never Quite Still', description: "The dodge-step keeps answering. It doesn't stop until a hit lands clean or nothing fresh is close.",
      fx: 'tempo.keystone', trigger: 'hit-nth', payoff: 'echo-hit',
      face: packetDefaultFace('tempo'),
    },

    // ── T4 cross row (design §4): a second lane's payoff at ROW_SCALAR.cross ──
    {
      id: 'robe-t4-bulwark-cross', lineageId: 'robe', tier: 4, row: 'cross', lane: 'bulwark',
      name: 'Plated Retaliation', description: "What hits you while you're braced regrets it a beat later, same as any other blow.",
      fx: 'bulwark.plating-chip', trigger: 'hit-taken', payoff: 'vulnerability', borrowsLane: 'empowered',
      face: packetDefaultFace('bulwark'),
    },
    {
      id: 'robe-t4-empowered-cross', lineageId: 'robe', tier: 4, row: 'cross', lane: 'empowered',
      name: 'Marked and Gone', description: 'The clean dodge still carries the mark it would have taken standing still.',
      fx: 'empowered.guard-spark', trigger: 'evade', payoff: 'speed-window', borrowsLane: 'tempo',
      face: packetDefaultFace('empowered'),
    },
    {
      id: 'robe-t4-tempo-cross', lineageId: 'robe', tier: 4, row: 'cross', lane: 'tempo',
      name: 'Grounded Step', description: 'Holding your ground settles the plates the same way the dodge used to.',
      fx: 'tempo.evasive-blur', trigger: 'standing', payoff: 'plating-stack', borrowsLane: 'bulwark',
      face: packetDefaultFace('tempo'),
    },
  ],
};
