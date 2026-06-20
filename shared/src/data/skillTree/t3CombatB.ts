import type { SkillNode } from './types';

export const t3CombatEntriesB = [
  // ── Tier 3: Energy — Light ────────────────────────────────────────────────────

  ['energy-light-t3-a', {
    id: 'energy-light-t3-a', name: 'Stormdancer', tier: 3,
    classId: 'energy-root', subVariantId: 'light',
    parent: 'energy-light', children: [],
    description: 'Your lightning condenses into daggers. Blue Shift at low energy hits harder; Red Shift at high energy hits lighter but attacks faster, moves faster, and evades more. Energy builds slowly while you Flash the same fight and decays back to Blue Shift over 2 seconds when you disengage.',
    cost: 1, statEffects: { evasion: 0.25 },
    mechanicEffects: {
      'energy.flash': 1,
      'energy.flash-energy-per-hit': 5,
      'energy.flash-max-damage-shift-pct': 0.45,
      'energy.flash-max-speed-bonus-pct': 0.45,
      'energy.flash-max-evasion-bonus-pct': 0.45,
      'energy.flash-shift-decay-ms': 2_000,
    },
  }],
  // NOTE(naming): "Overdrive" collides with the Cooldown Light spec of the same
  // working name — both need distinct final class titles at the naming pass.
  ['energy-light-t3-b', {
    id: 'energy-light-t3-b', name: 'Surge', tier: 3,
    classId: 'energy-root', subVariantId: 'light',
    parent: 'energy-light', children: [],
    description: 'Discharge deals no damage — instead it triggers Overdrive: a significant attack-damage bonus (favouring high base-ATK weapons, not APS). Energy then decays from full to empty; when it empties, Overdrive ends and you rebuild.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'energy.overdrive': 1,
      'energy.overdrive-attack-damage-pct': 0.40,
      'energy.overdrive-decay-per-sec': 18,
    },
  }],
  ['energy-light-t3-c', {
    id: 'energy-light-t3-c', name: 'Channeler', tier: 3,
    classId: 'energy-root', subVariantId: 'light',
    parent: 'energy-light', children: [],
    description: 'Discharge is suppressed. While energy stays above the threshold you build unlimited Flow stacks, each adding flat on-hit damage (not attack damage), scaling per tier with diminishing returns as stacks pile up. But energy decay ramps the longer you sustain — eventually it outpaces you and resets. Ramps through 3 channel stages (10 / 20 / 21+). No attack-speed bonus.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'energy.upkeep': 1,
      'energy.upkeep-stack-interval-ms': 1_000,
      'energy.upkeep-decay-base': 12,
      'energy.upkeep-decay-ramp-per-sec': 1.5,
      'energy.upkeep-band-1-end': 10,
      'energy.upkeep-band-2-end': 20,
      'energy.upkeep-band-3-end': 50,
      'energy.upkeep-band-1-onhit-per-tier': 2,
      'energy.upkeep-band-2-onhit-per-tier': 1,
      'energy.upkeep-band-3-onhit-per-tier': 0.5,
      'energy.upkeep-overflow-onhit-per-tier': 0.25,
    },
  }],

  // ── Tier 3: Energy — Balanced ─────────────────────────────────────────────────

  ['energy-balanced-t3-a', {
    id: 'energy-balanced-t3-a', name: 'Equinox', tier: 3,
    classId: 'energy-root', subVariantId: 'balanced',
    parent: 'energy-balanced', children: [],
    description: 'Each discharge flips you between two states. Charge State: slow energy gain, +on-hit damage (flat, scaling per tier), slower attacks, ending in a weak discharge. Discharge State: fast energy gain, +attack damage, faster attacks, ending in a strong discharge. Always in one phase working toward the next.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'energy.binary-cycle': 1,
      'energy.binary-charge-onhit-bonus': 0.30,
      'energy.binary-charge-onhit-per-tier': 6,
      'energy.binary-discharge-attack-bonus': 0.30,
      'energy.binary-charge-gain-mult': 0.6,
      'energy.binary-discharge-gain-mult': 1.5,
      'energy.binary-charge-speed-factor': 1.25,
      'energy.binary-discharge-speed-factor': 0.75,
      'energy.binary-charge-discharge-mult': 0.8,
      'energy.binary-discharge-discharge-mult': 1.3,
    },
  }],
  ['energy-balanced-t3-b', {
    id: 'energy-balanced-t3-b', name: 'Stormbringer', tier: 3,
    classId: 'energy-root', subVariantId: 'balanced',
    parent: 'energy-balanced', children: [],
    description: 'Discharge becomes a storm of 4 uniform empowered strikes (1.5× each) — the discharge itself is the first, then your next 3 regular attacks. Each is a real empowered attack, so on-hit and empowered-triggered gear all apply.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'energy.awakened-lightning': 1,
      'energy.awakened-strike-count': 4,
      'energy.awakened-damage-mult': 1.5,
    },
  }],
  ['energy-balanced-t3-c', {
    id: 'energy-balanced-t3-c', name: 'Aetherist', tier: 3,
    classId: 'energy-root', subVariantId: 'balanced',
    parent: 'energy-balanced', children: [],
    description: 'Your attack damage oscillates with your current energy: 0.5× at empty, 1× at half (neutral), up to 2× at full. A continuous wave — strongest just before discharge, weakest right after. Neutral on average, all about timing.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'energy.charge-state': 1,
      'energy.charge-state-min-mult': 0.5,
      'energy.charge-state-max-mult': 2.0,
    },
  }],

  // ── Tier 3: Energy — Heavy ────────────────────────────────────────────────────

  ['energy-heavy-t3-a', {
    id: 'energy-heavy-t3-a', name: 'Voidwalker', tier: 3,
    classId: 'energy-root', subVariantId: 'heavy',
    parent: 'energy-heavy', children: [],
    description: 'Doubles your max energy (200), and +100 more for each tier beyond this one (300 next tier, 400 after, …). Energy generation accelerates the fuller the pool. If a basic hit would kill via the discharge\'s projected damage, it triggers an immediate early discharge, spending the stored energy.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'energy.singularity-execute': 1,
      'energy.max-bonus': 100,
      'energy.per-hit': 10,
      'energy.singularity-gain-accel-scale': 0.5,
    },
  }],
  ['energy-heavy-t3-b', {
    id: 'energy-heavy-t3-b', name: 'Invoker', tier: 3,
    classId: 'energy-root', subVariantId: 'heavy',
    parent: 'energy-heavy', children: [],
    description: 'Each consecutive discharge (no long gap between them) adds a stack, up to 3: more discharge damage AND faster energy gain. Stacks reset after 5 seconds without dealing damage. Rewards uninterrupted farming.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'energy.critical-mass': 1,
      'energy.critical-mass-max-stacks': 3,
      'energy.critical-mass-discharge-per-stack': 0.20,
      'energy.critical-mass-gain-per-stack': 0.20,
      'energy.critical-mass-reset-ms': 5_000,
    },
  }],
  ['energy-heavy-t3-c', {
    id: 'energy-heavy-t3-c', name: 'Tempest', tier: 3,
    classId: 'energy-root', subVariantId: 'heavy',
    parent: 'energy-heavy', children: [],
    description: 'Discharge deals normal damage and brands the target with a Storm instead of a burst — a damage-over-time debuff worth 6× your attack over its base 4.5s, extended +1s by each normal attack (up to 7.5s, adding more total damage). Near-permanent uptime even with a slow weapon; discharges refresh it.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'energy.endless-storm': 1,
      'energy.endless-storm-total-mult': 6.0,
      'energy.endless-storm-tick-ms': 1_000,
      'energy.endless-storm-duration-ms': 4_500,
      'energy.endless-storm-extend-ms': 1_000,
      'energy.endless-storm-max-ms': 7_500,
    },
  }],

  // ── Tier 3: DoT — Light (Poison) ─────────────────────────────────────────────

  ['dot-light-t3-a', {
    id: 'dot-light-t3-a', name: 'Venomslinger', tier: 3,
    classId: 'dot-root', subVariantId: 'light',
    parent: 'dot-light', children: [],
    description: 'Your poison can stack up to 10 (overriding the 8-stack cap). Reaching 10 stacks instantly detonates them all for 10 full ticks of damage in a single burst, then clears all stacks.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'dot.poison-explosion': 1,
      'dot.poison-explosion-max-stacks': 10,
      'dot.poison-explosion-burst-ticks': 10,
    },
  }],
  ['dot-light-t3-b', {
    id: 'dot-light-t3-b', name: 'Cultist', tier: 3,
    classId: 'dot-root', subVariantId: 'light',
    parent: 'dot-light', children: [],
    description: 'Your doom has no stack limit. The first 8 stacks deal full damage per tick. Each additional stack beyond 8 adds damage at 50% effectiveness, naturally plateauing around 30–40 stacks. Ticks twice as fast (same total damage). Rewards long, sustained fights.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'dot.eternal-doom': 1,
      'dot.tick-interval-ms': 500,
      'dot.eternal-doom-full-stacks': 8,
      'dot.eternal-doom-diminish-rate': 0.5,
      'dot.eternal-doom-max-stacks': 40,
    },
  }],
  ['dot-light-t3-c', {
    id: 'dot-light-t3-c', name: 'Zealot', tier: 3,
    classId: 'dot-root', subVariantId: 'light',
    parent: 'dot-light', children: [],
    description: 'Hitting a target at max poison stacks grants Frenzy for 6s (refreshed on each such hit): a flat attack-speed bonus plus on-hit damage that scales per tier. Fast attacks keep stacks maxed and the buff up — a self-sustaining loop.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'dot.frenzy': 1,
      'dot.frenzy-duration-ms': 6_000,
      'dot.frenzy-attack-speed-pct': 0.25,
      'dot.frenzy-onhit-per-tier': 10,
    },
  }],

  // ── Tier 3: DoT — Balanced (Fire) ────────────────────────────────────────────

  ['dot-balanced-t3-a', {
    id: 'dot-balanced-t3-a', name: 'Pyromancer', tier: 3,
    classId: 'dot-root', subVariantId: 'balanced',
    parent: 'dot-balanced', children: [],
    description: 'Each hit applies 2 burn stacks instead of 1, but each stack deals 50% of normal tick damage. Hitting a target already at max stacks deals bonus direct damage equal to 2× the max-stack DoT damage.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'dot.fan-the-flames': 1,
      'dot.fan-the-flames-stacks-per-hit': 2,
      'dot.fan-the-flames-stack-damage-mult': 0.5,
      'dot.fan-the-flames-max-stack-bonus-mult': 1.25,
    },
  }],
  ['dot-balanced-t3-b', {
    id: 'dot-balanced-t3-b', name: 'Firebrand', tier: 3,
    classId: 'dot-root', subVariantId: 'balanced',
    parent: 'dot-balanced', children: [],
    description: 'Your first attack on a fresh (or fully un-burned) target sears in all 6 fire stacks at once, at 60% tick value each. Once a target is fully branded, your attacks against it bypass the fire conversion entirely and land as full 100% direct hits while the burn keeps ticking (and refreshes its duration).',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'dot.ignition': 1,
      'dot.ignition-stack-damage-mult': 0.6,
    },
  }],
  ['dot-balanced-t3-c', {
    id: 'dot-balanced-t3-c', name: 'Cinder Lord', tier: 3,
    classId: 'dot-root', subVariantId: 'balanced',
    parent: 'dot-balanced', children: [],
    description: 'When a target reaches max burn stacks, all stacks are consumed and replaced with Conflagration: a single raging blaze that delivers the same total damage as the full burn in a rapid-fire flurry of ticks. Cannot stack further while Conflagration burns.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'dot.conflagration': 1,
      'dot.conflagration-ticks': 10,
      'dot.conflagration-tick-ms': 250,
      'dot.conflagration-damage-factor': 1,
    },
  }],

  // ── Tier 3: DoT — Heavy (Frost) ──────────────────────────────────────────────

  ['dot-heavy-t3-a', {
    id: 'dot-heavy-t3-a', name: 'Icebreaker', tier: 3,
    classId: 'dot-root', subVariantId: 'heavy',
    parent: 'dot-heavy', children: [],
    description: 'Below max frost stacks, attacks convert at the normal 70%. At max stacks (3), your direct attacks deal full damage (0% conversion) while the frost keeps ticking — and the target takes an 5% damage-reduction debuff, so the full-power hits land even harder.',
    cost: 1, statEffects: {},
    // TODO(balance): verify full-power direct hits interact correctly with high-plating enemies.
    mechanicEffects: {
      'dot.rimeshatter': 1,
      'dot.rimeshatter-dr-reduction': 0.05,
      'dot.rimeshatter-duration-ms': 2_000,
    },
  }],
  ['dot-heavy-t3-b', {
    id: 'dot-heavy-t3-b', name: 'Winter Warden', tier: 3,
    classId: 'dot-root', subVariantId: 'heavy',
    parent: 'dot-heavy', children: [],
    description: 'Each hit also applies a Chill stack (up to 9), each reducing the target\'s movement and attack speed by 5%. At 9 Chill stacks the target is Frozen for 2 seconds — a severe slow (not full CC) that also makes it take 35% bonus damage from all sources — then the chill resets.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'dot.freezing-cold': 1,
      'dot.chill-max-stacks': 9,
      'dot.chill-move-slow-per-stack': 0.05,
      'dot.chill-attack-slow-per-stack': 0.05,
      'dot.chill-duration-ms': 6_000,
      'dot.freeze-duration-ms': 2_000,
      'dot.freeze-damage-taken-pct': 0.35,
      'dot.freeze-move-slow-pct': 0.80,
      'dot.freeze-attack-slow-pct': 2.0,
    },
  }],
  ['dot-heavy-t3-c', {
    id: 'dot-heavy-t3-c', name: 'Wind Spirit', tier: 3,
    classId: 'dot-root', subVariantId: 'heavy',
    parent: 'dot-heavy', children: [],
    description: 'Your frost conversion becomes total: 100% of attack damage is converted into DoT, with a stronger frost multiplier. Hitting a target already at max frost stacks applies Frostbite, increasing DoT damage taken by 2% per stack, up to 10 stacks for 4 seconds.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'dot.wind-spirit': 1,
      'dot.conversion-pct': 0.30,
      'dot.frostbite-dot-taken-pct': 0.02,
      'dot.frostbite-max-stacks': 10,
      'dot.frostbite-duration-ms': 4000,
      'dot.mechanic-mult': -0.10
    },
  }],

  
] satisfies [string, SkillNode][];
