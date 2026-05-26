import type { SkillNode } from './types';

export const t3CombatEntriesB = [
  // ── Tier 3: Energy — Light ────────────────────────────────────────────────────

  ['energy-light-t3-a', {
    id: 'energy-light-t3-a', name: 'Flash', tier: 3,
    classId: 'energy-root', subVariantId: 'light',
    parent: 'energy-light', children: [],
    description: 'Your lightning condenses into daggers. Blue Shift at low energy hits harder; Red Shift at high energy hits lighter but attacks faster, moves faster, and evades more. Energy builds slowly while you Flash the same fight and decays back to Blue Shift over 2 seconds when you disengage.',
    cost: 1, statEffects: { evasion: 4 },
    mechanicEffects: { 'energy.flash': 1 },
  }],
  ['energy-light-t3-b', {
    id: 'energy-light-t3-b', name: 'Micro-Venting', tier: 3,
    classId: 'energy-root', subVariantId: 'light',
    parent: 'energy-light', children: [],
    description: 'The max-energy discharge is disabled. While your energy pool is above 50%, each basic attack consumes a portion of energy to deal flat bonus on-hit damage.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.micro-venting': 1 },
  }],
  ['energy-light-t3-c', {
    id: 'energy-light-t3-c', name: 'Polarity Decay', tier: 3,
    classId: 'energy-root', subVariantId: 'light',
    parent: 'energy-light', children: [],
    description: 'Reaching max energy triggers a reduced-damage discharge that clears the pool and grants 5 temporary overcharge stacks. Basic attacks consume stacks for flat bonus damage before they decay.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.polarity-decay': 1 },
  }],

  // ── Tier 3: Energy — Balanced ─────────────────────────────────────────────────

  ['energy-balanced-t3-a', {
    id: 'energy-balanced-t3-a', name: 'Alternating Currents', tier: 3,
    classId: 'energy-root', subVariantId: 'balanced',
    parent: 'energy-balanced', children: [],
    description: 'Automatically loops between two phases: Charge (doubled energy gain, +20% attack damage) and Discharge (energy drains over 3 s dealing passive tick damage, +50% attack speed).',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.alternating-currents': 1 },
  }],
  ['energy-balanced-t3-b', {
    id: 'energy-balanced-t3-b', name: 'Harmonic Equilibrium', tier: 3,
    classId: 'energy-root', subVariantId: 'balanced',
    parent: 'energy-balanced', children: [],
    description: 'Grants +60% damage to all hits, but only while the natural energy cycle keeps the pool strictly between 40% and 60%. Both too empty and too full breaks the bonus.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.harmonic-equilibrium': 1 },
  }],
  ['energy-balanced-t3-c', {
    id: 'energy-balanced-t3-c', name: 'Capacitor Shunt', tier: 3,
    classId: 'energy-root', subVariantId: 'balanced',
    parent: 'energy-balanced', children: [],
    description: 'Energy generation is split 50/50 between the active bar and a persistent reservoir (cap 500). The discharge fires normally at max energy, but its damage is amplified by the total power in the reservoir.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.capacitor-shunt': 1 },
  }],

  // ── Tier 3: Energy — Heavy ────────────────────────────────────────────────────

  ['energy-heavy-t3-a', {
    id: 'energy-heavy-t3-a', name: 'Singularity Execute', tier: 3,
    classId: 'energy-root', subVariantId: 'heavy',
    parent: 'energy-heavy', children: [],
    description: 'Doubles max energy capacity. Energy generation accelerates the fuller the pool. If a basic hit detects the target\'s health is lower than the discharge\'s projected damage, it triggers an immediate early discharge.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.singularity-execute': 1 },
  }],
  ['energy-heavy-t3-b', {
    id: 'energy-heavy-t3-b', name: 'Cascading Induction', tier: 3,
    classId: 'energy-root', subVariantId: 'heavy',
    parent: 'energy-heavy', children: [],
    description: 'Basic attacks deal 1 damage but plant Induction tags on the target (15 s duration). The discharge consumes all active tags and deals exponentially scaling burst damage based on the tag count.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.cascading-induction': 1 },
  }],
  ['energy-heavy-t3-c', {
    id: 'energy-heavy-t3-c', name: 'Superconducting Mass', tier: 3,
    classId: 'energy-root', subVariantId: 'heavy',
    parent: 'energy-heavy', children: [],
    description: 'Basic attacks deal no damage but accumulate raw attack power into a charge pool. On discharge, applies your empowered multiplier to the base hit, then adds the entire stored charge as bonus true damage bypassing all defenses. The pool resets on each discharge.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.superconducting-mass': 1 },
  }],

  // ── Tier 3: DoT — Light (Poison) ─────────────────────────────────────────────

  ['dot-light-t3-a', {
    id: 'dot-light-t3-a', name: 'Poison Explosion', tier: 3,
    classId: 'dot-root', subVariantId: 'light',
    parent: 'dot-light', children: [],
    description: 'Your poison can stack up to 20. Reaching 20 stacks detonates them all instantly, dealing the equivalent of 10 full ticks of damage in a single burst, then clearing all stacks.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.poison-explosion': 1 },
  }],
  ['dot-light-t3-b', {
    id: 'dot-light-t3-b', name: 'Eternal Doom', tier: 3,
    classId: 'dot-root', subVariantId: 'light',
    parent: 'dot-light', children: [],
    description: 'Your poison has no stack limit. The first 8 stacks deal full damage per tick. Each additional stack beyond 8 adds damage at 50% effectiveness, naturally plateauing around 30–40 stacks. Rewards long, sustained fights.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.eternal-doom': 1 },
  }],
  ['dot-light-t3-c', {
    id: 'dot-light-t3-c', name: 'Invigorating Toxins', tier: 3,
    classId: 'dot-root', subVariantId: 'light',
    parent: 'dot-light', children: [],
    description: 'While attacking a poisoned enemy, you gain +2 flat attack damage and +2% attack speed per poison stack on the target. The bonus updates continuously and drops immediately when you switch targets.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.invigorating-toxins': 1 },
  }],

  // ── Tier 3: DoT — Balanced (Fire) ────────────────────────────────────────────

  ['dot-balanced-t3-a', {
    id: 'dot-balanced-t3-a', name: 'Fan the Flames', tier: 3,
    classId: 'dot-root', subVariantId: 'balanced',
    parent: 'dot-balanced', children: [],
    description: 'Each hit applies 2 burn stacks instead of 1, but each stack deals 50% of normal tick damage. Hitting a target already at max stacks deals bonus direct damage equal to 3× the max-stack DoT damage.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.fan-the-flames': 1 },
  }],
  ['dot-balanced-t3-b', {
    id: 'dot-balanced-t3-b', name: 'Smoldering Ember', tier: 3,
    classId: 'dot-root', subVariantId: 'balanced',
    parent: 'dot-balanced', children: [],
    description: 'Each burn stack also applies a smolder debuff that increases all damage the target takes by 3% per stack, up to 18% at max stacks. Affects both your direct hits and your burn ticks.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.smoldering-ember': 1 },
  }],
  ['dot-balanced-t3-c', {
    id: 'dot-balanced-t3-c', name: 'Conflagration', tier: 3,
    classId: 'dot-root', subVariantId: 'balanced',
    parent: 'dot-balanced', children: [],
    description: 'When a target reaches max burn stacks, all stacks are consumed and replaced with Conflagration: a single intense burn that delivers the same total damage in half the time at double the tick rate. Cannot stack further while Conflagration burns.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.conflagration': 1 },
  }],

  // ── Tier 3: DoT — Heavy (Frost) ──────────────────────────────────────────────

  ['dot-heavy-t3-a', {
    id: 'dot-heavy-t3-a', name: 'Permafrost', tier: 3,
    classId: 'dot-root', subVariantId: 'heavy',
    parent: 'dot-heavy', children: [],
    description: 'Your frost is limited to 1 stack, but it ramps up with every hit you land: +1% of your ATK per hit, capped at 35% of ATK (35 hits to max). The ramp persists as long as the monster lives. Rewards staying on a single target.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.permafrost': 1 },
  }],
  ['dot-heavy-t3-b', {
    id: 'dot-heavy-t3-b', name: 'Freezing Cold', tier: 3,
    classId: 'dot-root', subVariantId: 'heavy',
    parent: 'dot-heavy', children: [],
    description: 'Each frost stack also applies a Chill stack (up to 3). Each Chill reduces the target\'s movement and attack speed by 12%. At 3 Chill stacks, the target is Frozen for 2 seconds and takes 35% bonus damage from all sources.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.freezing-cold': 1 },
  }],
  ['dot-heavy-t3-c', {
    id: 'dot-heavy-t3-c', name: 'Glacial Fracture', tier: 3,
    classId: 'dot-root', subVariantId: 'heavy',
    parent: 'dot-heavy', children: [],
    description: 'Your frost stacks make the target brittle. When you hit a target already at max frost stacks, all stacks shatter: deal bonus burst damage equal to maxStacks² × damage-per-stack, knock the target back, clear the stacks, then apply 1 fresh stack. Creates a build-then-shatter rhythm.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.glacial-fracture': 1 },
  }],
] satisfies [string, SkillNode][];
