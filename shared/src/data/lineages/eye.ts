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
        fx: 'affliction.bog-eye', lane: 'affliction',
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

    // ── T2 payoff row (L3): the T1 payoff, grown up ─────────────────────────
    {
      id: 'eye-t2-affliction-payoff', lineageId: 'eye', tier: 2, row: 'payoff', lane: 'affliction',
      name: 'Weeping Rot', description: 'The air the eye leaves caustic now stays that way between pulses.',
      fx: 'affliction.toxic-pulse', trigger: 'pulse', payoff: 'poison-stack',
      face: packetDefaultFace('affliction'),
    },
    {
      id: 'eye-t2-control-payoff', lineageId: 'eye', tier: 2, row: 'payoff', lane: 'control',
      name: 'Hard Stare', description: 'Whatever broke the barrier now flinches harder, and longer, for it.',
      fx: 'control.chill-blur', trigger: 'barrier-break', payoff: 'stun',
      face: packetDefaultFace('control'),
    },
    {
      id: 'eye-t2-kill-chain-payoff', lineageId: 'eye', tier: 2, row: 'payoff', lane: 'kill-chain',
      name: 'Deep Green', description: "The eye's glow now holds toward healing well past the kill that lit it.",
      fx: 'kill-chain.recovery-pulse', trigger: 'kill', payoff: 'recovery-window',
      face: packetDefaultFace('kill-chain'),
    },

    // ── T2 amplifier row (L5): an extra trigger kind for the same payoff ────
    {
      id: 'eye-t2-affliction-amplifier', lineageId: 'eye', tier: 2, row: 'amplifier', lane: 'affliction',
      name: 'Broken Rot', description: 'The barrier giving way leaves the same rot behind a pulse would.',
      fx: 'affliction.toxic-pulse', trigger: 'barrier-break', payoff: 'poison-stack', modifies: 'eye-t2-affliction-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('affliction'),
    },
    {
      id: 'eye-t2-control-amplifier', lineageId: 'eye', tier: 2, row: 'amplifier', lane: 'control',
      name: 'Killing Stare', description: 'A kill draws the same flinching stare the broken barrier does.',
      fx: 'control.chill-blur', trigger: 'kill', payoff: 'stun', modifies: 'eye-t2-control-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('control'),
    },
    {
      id: 'eye-t2-kill-chain-amplifier', lineageId: 'eye', tier: 2, row: 'amplifier', lane: 'kill-chain',
      name: 'Guarded Green', description: 'Raising a guard turns the eye toward healing without waiting on a kill.',
      fx: 'kill-chain.recovery-pulse', trigger: 'guard-cast', payoff: 'recovery-window', modifies: 'eye-t2-kill-chain-payoff',
      amplifies: 'trigger',
      face: packetDefaultFace('kill-chain'),
    },

    // ── T3 keystone row (design §4 amended 2026-10-01): one shared keystone per
    // packet, this lineage's own flavour of it. Run 3 W1-B.
    {
      id: 'eye-t3-affliction-keystone', lineageId: 'eye', tier: 3, row: 'keystone', lane: 'affliction',
      name: 'Weeping Never Fades', description: 'Hit it again before the dose fades and the clock never gets the chance to run out.',
      fx: 'affliction.keystone', trigger: 'hit-nth', payoff: 'poison-stack',
      face: packetDefaultFace('affliction'),
    },
    {
      id: 'eye-t3-control-keystone', lineageId: 'eye', tier: 3, row: 'keystone', lane: 'control',
      name: 'Stare Ladder', description: 'Hit something already slowed and it roots; hit something rooted and it stuns — once per step, per target.',
      fx: 'control.keystone', trigger: 'hit-nth', payoff: 'stun',
      face: packetDefaultFace('control'),
    },
    {
      id: 'eye-t3-kill-chain-keystone', lineageId: 'eye', tier: 3, row: 'keystone', lane: 'kill-chain',
      name: 'Clean Green', description: 'A kill pays the mechanic back in full, right there.',
      fx: 'kill-chain.keystone', trigger: 'kill', payoff: 'recovery-window',
      face: packetDefaultFace('kill-chain'),
    },

    // ── T4 cross row (design §4): a second lane's payoff at ROW_SCALAR.cross ──
    {
      id: 'eye-t4-affliction-cross', lineageId: 'eye', tier: 4, row: 'cross', lane: 'affliction',
      name: 'Weeping Stare', description: 'The barrier breaking makes whatever broke it flinch, same as the weeping light does.',
      fx: 'affliction.toxic-pulse', trigger: 'barrier-break', payoff: 'stun', borrowsLane: 'control',
      face: packetDefaultFace('affliction'),
    },
    {
      id: 'eye-t4-control-cross', lineageId: 'eye', tier: 4, row: 'cross', lane: 'control',
      name: 'Stared Green', description: 'A kill turns the stare toward healing as surely as it turns the glow.',
      fx: 'control.chill-blur', trigger: 'kill', payoff: 'recovery-window', borrowsLane: 'kill-chain',
      face: packetDefaultFace('control'),
    },
    {
      id: 'eye-t4-kill-chain-cross', lineageId: 'eye', tier: 4, row: 'cross', lane: 'kill-chain',
      name: 'Green Weep', description: 'The eye\'s pulse leaves the air caustic on the same beat it heals.',
      fx: 'kill-chain.recovery-pulse', trigger: 'pulse', payoff: 'poison-stack', borrowsLane: 'affliction',
      face: packetDefaultFace('kill-chain'),
    },
  ],
};
