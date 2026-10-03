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
  // Parked for the second playtest (design §24.5): data kept, tree unreachable.
  parked: true,
  homeBiome: 'swamp',
  lanes: ['control', 'affliction', 'bulwark'],

  forms: [
    { recipeId: 'swamp-boots-t1', tier: 1, biome: 'swamp' },
    {
      recipeId: 'swamp-boots-t2', tier: 2, biome: 'swamp',
      capstone: {
        id: 'marsh-capstone-wetland', name: 'Wetland Anchor',
        description: 'Holding still now keeps the ground treacherous instead of settling.',
        fx: 'control.wetland-anchor', lane: 'control',
        trigger: 'standing', payoff: 'stun',
      },
    },
  {
    recipeId: 'trench-boots-t4-treaders', tier: 4, biome: 'trench',
    capstone: {
      id: 'marsh-capstone-deep-ballast', name: 'Deep Ballast',
      description: 'Every hit taken settles the ballast a little deeper, until it holds like plate.',
      fx: 'bulwark.ballast-plate', lane: 'bulwark',
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

    // ── T3 keystone row (design §4 amended 2026-10-01): one shared keystone per
    // packet, this lineage's own flavour of it. Run 3 W1-B.
    {
      id: 'marsh-t3-control-keystone', lineageId: 'marsh', tier: 3, row: 'keystone', lane: 'control',
      name: 'Mire Ladder', description: 'Hit something already slowed and it roots; hit something rooted and it stuns — once per step, per target.',
      fx: 'control.keystone', trigger: 'hit-nth', payoff: 'stun',
      face: packetDefaultFace('control'),
    },
    {
      id: 'marsh-t3-affliction-keystone', lineageId: 'marsh', tier: 3, row: 'keystone', lane: 'affliction',
      name: 'Gas Never Clears', description: 'Hit it again before the dose fades and the clock never gets the chance to run out.',
      fx: 'affliction.keystone', trigger: 'hit-nth', payoff: 'poison-stack',
      face: packetDefaultFace('affliction'),
    },
    {
      id: 'marsh-t3-bulwark-keystone', lineageId: 'marsh', tier: 3, row: 'keystone', lane: 'bulwark',
      name: 'Footing Immovable', description: "Stationary DR and plate stacks hold for two seconds after you've already moved on.",
      fx: 'bulwark.keystone', trigger: 'standing', payoff: 'plating-stack',
      face: packetDefaultFace('bulwark'),
    },

    // ── T4 cross row (design §4): a second lane's payoff at ROW_SCALAR.cross ──
    {
      id: 'marsh-t4-control-cross', lineageId: 'marsh', tier: 4, row: 'cross', lane: 'control',
      name: 'Gassy Ground', description: 'A kill stirs the marsh floor the same way holding your footing locks it.',
      fx: 'control.chill-blur', trigger: 'kill', payoff: 'poison-stack', borrowsLane: 'affliction',
      face: packetDefaultFace('control'),
    },
    {
      id: 'marsh-t4-affliction-cross', lineageId: 'marsh', tier: 4, row: 'cross', lane: 'affliction',
      name: 'Braced Gas', description: 'The opening hit finds ground already working on the next step.',
      fx: 'affliction.toxic-pulse', trigger: 'first-hit', payoff: 'plating-stack', borrowsLane: 'bulwark',
      face: packetDefaultFace('affliction'),
    },
    {
      id: 'marsh-t4-bulwark-cross', lineageId: 'marsh', tier: 4, row: 'cross', lane: 'bulwark',
      name: 'Sure Mire', description: 'Holding your footing locks the ground the same way standing in the mire does.',
      fx: 'bulwark.plating-chip', trigger: 'standing', payoff: 'stun', borrowsLane: 'control',
      face: packetDefaultFace('bulwark'),
    },
  ],
};
