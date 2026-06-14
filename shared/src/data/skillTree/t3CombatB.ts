import type { SkillNode } from './types';

export const t3CombatEntriesB = [
  // ── Tier 3: Energy — Light ────────────────────────────────────────────────────

  ['energy-light-t3-a', {
    id: 'energy-light-t3-a', name: 'Stormdancer', tier: 3,
    classId: 'energy-root', subVariantId: 'light',
    parent: 'energy-light', children: [],
    description: 'Your lightning condenses into daggers. Blue Shift at low energy hits harder; Red Shift at high energy hits lighter but attacks faster, moves faster, and evades more. Energy builds slowly while you Flash the same fight and decays back to Blue Shift over 2 seconds when you disengage.',
    cost: 1, statEffects: { evasion: 0.25 },
    mechanicEffects: { 'energy.flash': 1 },
  }],
  // NOTE(naming): "Overdrive" collides with the Cooldown Light spec of the same
  // working name — both need distinct final class titles at the naming pass.
  ['energy-light-t3-b', {
    id: 'energy-light-t3-b', name: 'Surge', tier: 3,
    classId: 'energy-root', subVariantId: 'light',
    parent: 'energy-light', children: [],
    description: 'Discharge deals no damage — instead it triggers Overdrive: a significant attack-damage bonus (favouring high base-ATK weapons, not APS). Energy then decays from full to empty; when it empties, Overdrive ends and you rebuild.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.overdrive': 1 },
  }],
  ['energy-light-t3-c', {
    id: 'energy-light-t3-c', name: 'Channeler', tier: 3,
    classId: 'energy-root', subVariantId: 'light',
    parent: 'energy-light', children: [],
    description: 'Discharge is suppressed and energy decays continuously. While energy stays above the threshold, an upkeep timer builds — and your on-hit damage scales with how long you have sustained it. No attack-speed bonus.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.upkeep': 1 },
  }],

  // ── Tier 3: Energy — Balanced ─────────────────────────────────────────────────

  ['energy-balanced-t3-a', {
    id: 'energy-balanced-t3-a', name: 'Equinox', tier: 3,
    classId: 'energy-root', subVariantId: 'balanced',
    parent: 'energy-balanced', children: [],
    description: 'Each discharge flips you between two states. Charge State: faster energy gain and increased attack damage (ending in a big discharge). Discharge State: more on-hit damage (ending in a lighter discharge). Always in one phase working toward the next.',
    cost: 1, statEffects: {},
    // TODO(engine): per-state attack-speed swing not yet applied (needs a buff layer).
    mechanicEffects: { 'energy.binary-cycle': 1 },
  }],
  ['energy-balanced-t3-b', {
    id: 'energy-balanced-t3-b', name: 'Stormbringer', tier: 3,
    classId: 'energy-root', subVariantId: 'balanced',
    parent: 'energy-balanced', children: [],
    description: 'Discharge deals no instant damage. Instead it empowers your next 5 regular attacks (1.5× each), spreading the discharge across a sustained burst. On-hit fires on each empowered attack.',
    cost: 1, statEffects: {},
    // TODO(engine): empowered attacks apply 1.5× damage but don't yet set the
    // empoweredAttack flag, so empowered-triggered gear won't observe them.
    mechanicEffects: { 'energy.awakened-lightning': 1 },
  }],
  ['energy-balanced-t3-c', {
    id: 'energy-balanced-t3-c', name: 'Aetherist', tier: 3,
    classId: 'energy-root', subVariantId: 'balanced',
    parent: 'energy-balanced', children: [],
    description: 'Your attack damage scales linearly with your current energy: 50% at empty, 100% at full. A continuous oscillating wave — strongest just before discharge, weakest right after.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.charge-state': 1 },
  }],

  // ── Tier 3: Energy — Heavy ────────────────────────────────────────────────────

  ['energy-heavy-t3-a', {
    id: 'energy-heavy-t3-a', name: 'Voidwalker', tier: 3,
    classId: 'energy-root', subVariantId: 'heavy',
    parent: 'energy-heavy', children: [],
    description: 'Doubles max energy capacity. Energy generation accelerates the fuller the pool. If a basic hit detects the target\'s health is lower than the discharge\'s projected damage, it triggers an immediate early discharge.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.singularity-execute': 1 },
  }],
  ['energy-heavy-t3-b', {
    id: 'energy-heavy-t3-b', name: 'Invoker', tier: 3,
    classId: 'energy-root', subVariantId: 'heavy',
    parent: 'energy-heavy', children: [],
    description: 'Each consecutive discharge (no long gap between them) adds a stack, up to 3: more discharge damage AND faster energy gain. Stacks reset after 5 seconds without dealing damage. Rewards uninterrupted farming.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.critical-mass': 1 },
  }],
  ['energy-heavy-t3-c', {
    id: 'energy-heavy-t3-c', name: 'Tempest', tier: 3,
    classId: 'energy-root', subVariantId: 'heavy',
    parent: 'energy-heavy', children: [],
    description: 'Discharge creates a near-permanent storm on the current target, dealing continuous single-target damage until it dies. Subsequent discharges refresh the storm. The big 6× discharge still lands on top.',
    cost: 1, statEffects: {},
    // TODO(engine): storm transfer to the next target on death is not yet implemented.
    mechanicEffects: { 'energy.endless-storm': 1 },
  }],

  // ── Tier 3: DoT — Light (Poison) ─────────────────────────────────────────────

  ['dot-light-t3-a', {
    id: 'dot-light-t3-a', name: 'Venomslinger', tier: 3,
    classId: 'dot-root', subVariantId: 'light',
    parent: 'dot-light', children: [],
    description: 'Your poison can stack up to 10 (overriding the 8-stack cap). Reaching 10 stacks instantly detonates them all for 10 full ticks of damage in a single burst, then clears all stacks.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.poison-explosion': 1 },
  }],
  ['dot-light-t3-b', {
    id: 'dot-light-t3-b', name: 'Cultist', tier: 3,
    classId: 'dot-root', subVariantId: 'light',
    parent: 'dot-light', children: [],
    description: 'Your poison has no stack limit. The first 8 stacks deal full damage per tick. Each additional stack beyond 8 adds damage at 50% effectiveness, naturally plateauing around 30–40 stacks. Rewards long, sustained fights.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.eternal-doom': 1 },
  }],
  ['dot-light-t3-c', {
    id: 'dot-light-t3-c', name: 'Zealot', tier: 3,
    classId: 'dot-root', subVariantId: 'light',
    parent: 'dot-light', children: [],
    description: 'While the target is at max poison stacks (8), your attack speed doubles. The burst ends the instant stacks fall below max. Fast attacks maintain max stacks — a self-sustaining loop on a single target.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.frenzy': 1 },
  }],

  // ── Tier 3: DoT — Balanced (Fire) ────────────────────────────────────────────

  ['dot-balanced-t3-a', {
    id: 'dot-balanced-t3-a', name: 'Pyromancer', tier: 3,
    classId: 'dot-root', subVariantId: 'balanced',
    parent: 'dot-balanced', children: [],
    description: 'Each hit applies 2 burn stacks instead of 1, but each stack deals 50% of normal tick damage. Hitting a target already at max stacks deals bonus direct damage equal to 3× the max-stack DoT damage.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.fan-the-flames': 1 },
  }],
  ['dot-balanced-t3-b', {
    id: 'dot-balanced-t3-b', name: 'Firebrand', tier: 3,
    classId: 'dot-root', subVariantId: 'balanced',
    parent: 'dot-balanced', children: [],
    description: 'Your first attack on a fresh (or fully un-burned) target instantly applies all 6 fire stacks at 60% tick value each. Subsequent attacks refresh normally at the standard conversion.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.ignition': 1 },
  }],
  ['dot-balanced-t3-c', {
    id: 'dot-balanced-t3-c', name: 'Cinder Lord', tier: 3,
    classId: 'dot-root', subVariantId: 'balanced',
    parent: 'dot-balanced', children: [],
    description: 'When a target reaches max burn stacks, all stacks are consumed and replaced with Conflagration: a single intense burn that delivers the same total damage in half the time at double the tick rate. Cannot stack further while Conflagration burns.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.conflagration': 1 },
  }],

  // ── Tier 3: DoT — Heavy (Frost) ──────────────────────────────────────────────

  ['dot-heavy-t3-a', {
    id: 'dot-heavy-t3-a', name: 'Icebreaker', tier: 3,
    classId: 'dot-root', subVariantId: 'heavy',
    parent: 'dot-heavy', children: [],
    description: 'Below max frost stacks, attacks convert at the normal 70%. At max stacks (3), your direct attacks deal full damage (0% conversion) while the frost keeps ticking — and the target takes an 8% damage-reduction debuff, so the full-power hits land even harder.',
    cost: 1, statEffects: {},
    // TODO(balance): verify full-power direct hits interact correctly with high-plating enemies.
    mechanicEffects: { 'dot.rimeshatter': 1 },
  }],
  ['dot-heavy-t3-b', {
    id: 'dot-heavy-t3-b', name: 'Winter Warden', tier: 3,
    classId: 'dot-root', subVariantId: 'heavy',
    parent: 'dot-heavy', children: [],
    description: 'Each frost stack also applies a Chill stack (up to 3). Each Chill reduces the target\'s movement and attack speed by 12%. At 3 Chill stacks, the target is Frozen for 2 seconds (severe slow, not full CC) and takes 35% bonus damage from all sources.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.freezing-cold': 1 },
  }],
  ['dot-heavy-t3-c', {
    id: 'dot-heavy-t3-c', name: 'Rime Blade', tier: 3,
    classId: 'dot-root', subVariantId: 'heavy',
    parent: 'dot-heavy', children: [],
    description: 'Each active frost stack grants a flat bonus to your direct attack damage. At max stacks (3) the bonus is maximised but the stacks can no longer be refreshed — they tick down naturally. When they expire, the cycle resets and you rebuild.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.shatter-strike': 1 },
  }],
] satisfies [string, SkillNode][];
