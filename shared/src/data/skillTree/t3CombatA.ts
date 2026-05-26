import type { SkillNode } from './types';

export const t3CombatEntriesA = [
  // ── Tier 3: Path modifiers (cadence-light — fully implemented) ────────────
  //
  // Three choices per path (class × sub-variant = 15 paths × 3 = 45 nodes).
  // cadence-light is the first path with real mechanical options; all others
  // are placeholder (to be designed). mechanicEffects values accumulate into
  // player.passives and are read by the relevant archetype system at runtime.

  ['cadence-light-t3-a', {
    id: 'cadence-light-t3-a', name: 'Accelerando', tier: 3,
    classId: 'cadence-root', subVariantId: 'light',
    parent: 'cadence-light', children: [],
    description: 'Each cadence finisher grants a stack of attack speed (up to 5 stacks). Stacks are lost on death or re-equip.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.speed-stack': 1 },
  }],
  ['cadence-light-t3-b', {
    id: 'cadence-light-t3-b', name: 'Cursed Finale', tier: 3,
    classId: 'cadence-root', subVariantId: 'light',
    parent: 'cadence-light', children: [],
    description: 'Your cadence finisher curses the target: increases their damage taken by 25% for 5 seconds, and permanently reduces their flat plating by 5 (stacks with no cap). The triggering finisher itself benefits from the vulnerability.',
    cost: 1, statEffects: {},
    // NOTE: 'cadence.debuff-plating-shred' is currently a static flat value (-5 per stack).
    // This is intentionally simple for now but likely needs to scale with player stats
    // or monster level in later tiers to remain relevant. Change the value here when scaling is designed.
    mechanicEffects: {
      'cadence.debuff-vuln-pct': 25,
      'cadence.debuff-vuln-ms':  5000,
      'cadence.debuff-plating-shred': 5,
    },
  }],
  ['cadence-light-t3-c', {
    id: 'cadence-light-t3-c', name: 'Double Time', tier: 3,
    classId: 'cadence-root', subVariantId: 'light',
    parent: 'cadence-light', children: [],
    description: 'Your cadence finisher strikes twice. Both hits apply the full damage multiplier.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.trigger-count': 2 },
  }],

  // ── Tier 3: Cadence — Balanced ─────────────────────────────────────────────

  ['cadence-balanced-t3-a', {
    id: 'cadence-balanced-t3-a', name: 'Rapid Tempo', tier: 3,
    classId: 'cadence-root', subVariantId: 'balanced',
    parent: 'cadence-balanced', children: [],
    description: 'Shortens your combo sequence by 2, letting you reach the finisher more often.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.threshold-mod': -2 },
  }],
  ['cadence-balanced-t3-b', {
    id: 'cadence-balanced-t3-b', name: 'Rising Tide', tier: 3,
    classId: 'cadence-root', subVariantId: 'balanced',
    parent: 'cadence-balanced', children: [],
    description: 'Each attack building toward the finisher amplifies it by 20%. After a finisher, your next 5 attacks deal 50% bonus damage.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.momentum-buildup': 0.20, 'cadence.momentum-echo': 5 },
  }],
  ['cadence-balanced-t3-c', {
    id: 'cadence-balanced-t3-c', name: 'Delayed Verdict', tier: 3,
    classId: 'cadence-root', subVariantId: 'balanced',
    parent: 'cadence-balanced', children: [],
    description: 'Your finisher tags the enemy with a detonation charge. After 3 seconds it explodes for damage equal to the sum of the attacks that built up to the finisher. Re-tagging resets the fuse.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.detonation': 1 },
  }],

  // ── Tier 3: Cadence — Heavy ────────────────────────────────────────────────

  ['cadence-heavy-t3-a', {
    id: 'cadence-heavy-t3-a', name: 'Overwhelming Force', tier: 3,
    classId: 'cadence-root', subVariantId: 'heavy',
    parent: 'cadence-heavy', children: [],
    description: 'Your combo sequence requires 2 more attacks, but the finisher deals 200% damage (3× multiplier instead of 2×).',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.threshold-mod': 2, 'cadence.damage-mult-add': 1 },
  }],
  ['cadence-heavy-t3-b', {
    id: 'cadence-heavy-t3-b', name: 'Hemorrhage', tier: 3,
    classId: 'cadence-root', subVariantId: 'heavy',
    parent: 'cadence-heavy', children: [],
    description: 'Your finisher converts all its damage into a bleeding wound: a non-stacking damage-over-time effect dealing 150% of the finisher damage over 4 seconds. Re-triggering refreshes the wound.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.hemorrhage': 1 },
  }],
  ['cadence-heavy-t3-c', {
    id: 'cadence-heavy-t3-c', name: 'Iron Patience', tier: 3,
    classId: 'cadence-root', subVariantId: 'heavy',
    parent: 'cadence-heavy', children: [],
    description: 'Each attack building the sequence stores 30% of its damage as potential energy. Your finisher consumes all stored charge, adding it as bonus damage — the longer the buildup, the heavier the blow.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.charge-buildup': 0.30 },
  }],

  // ── Tier 3: Cooldown — Light ──────────────────────────────────────────────────

  ['cooldown-light-t3-a', {
    id: 'cooldown-light-t3-a', name: 'Overdrive', tier: 3,
    classId: 'cooldown-root', subVariantId: 'light',
    parent: 'cooldown-light', children: [],
    description: 'Your execution strikes no harder than usual — instead, it triggers a burst of speed: 50% faster attacks for 2.5 s. Roughly half-uptime by default. Pending balance.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.overdrive': 1 },
  }],
  ['cooldown-light-t3-b', {
    id: 'cooldown-light-t3-b', name: 'Eternal Cycle', tier: 3,
    classId: 'cooldown-root', subVariantId: 'light',
    parent: 'cooldown-light', children: [],
    description: 'Your execution cycle stretches to 10 s, but each attack builds charge that increases attack damage while active (falls off after 10 s idle). The execution deals no inherent multiplier — instead it deals attack × stacks, then resets the charge.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.eternal-cycle': 1, 'cooldown.empowered-cd-ms': 5000 },
  }],
  ['cooldown-light-t3-c', {
    id: 'cooldown-light-t3-c', name: 'Temporal Extension', tier: 3,
    classId: 'cooldown-root', subVariantId: 'light',
    parent: 'cooldown-light', children: [],
    description: 'Your execution deals no extra damage. Instead it grants a buff that adds flat on-hit damage to every attack. Each attack extends the buff by 1 second — keep fighting to keep it alive.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.temporal-extension': 1 },
  }],

  // ── Tier 3: Cooldown — Balanced ───────────────────────────────────────────────

  ['cooldown-balanced-t3-a', {
    id: 'cooldown-balanced-t3-a', name: 'Acceleration', tier: 3,
    classId: 'cooldown-root', subVariantId: 'balanced',
    parent: 'cooldown-balanced', children: [],
    description: 'Each attack shaves 1 second off your execution cooldown. Your timing still matters — the reduction is real, not a reset.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.acceleration-ms': 1000 },
  }],
  ['cooldown-balanced-t3-b', {
    id: 'cooldown-balanced-t3-b', name: 'Battery', tier: 3,
    classId: 'cooldown-root', subVariantId: 'balanced',
    parent: 'cooldown-balanced', children: [],
    description: 'Every second your execution cooldown ticks down, you gain a stack of accumulated power that increases attack damage. The execution spends all stacks.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.battery': 1 },
  }],
  ['cooldown-balanced-t3-c', {
    id: 'cooldown-balanced-t3-c', name: 'Alignment', tier: 3,
    classId: 'cooldown-root', subVariantId: 'balanced',
    parent: 'cooldown-balanced', children: [],
    description: 'After your execution fires, a 2-second attack speed surge follows (+50%). When that window closes, the remaining cooldown is halved — creating a fast-slow-fast rhythm unique to this path.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.alignment': 1 },
  }],

  // ── Tier 3: Reload — Light ───────────────────────────────────────────────────

  ['reload-light-t3-a', {
    id: 'reload-light-t3-a', name: 'Exploding Clip', tier: 3,
    classId: 'reload-root', subVariantId: 'light',
    parent: 'reload-light', children: [],
    description: 'The last bullet in every clip explodes outward for 3× damage. A high spike on an already aggressive rhythm.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'reload.exploding-clip': 1 },
  }],
  ['reload-light-t3-b', {
    id: 'reload-light-t3-b', name: 'Preemptive Strike', tier: 3,
    classId: 'reload-root', subVariantId: 'light',
    parent: 'reload-light', children: [],
    description: 'The first bullet in every fresh clip is loaded with extra force — dealing 2.5× damage before the fight has even settled in.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'reload.preemptive-strike': 1 },
  }],
  ['reload-light-t3-c', {
    id: 'reload-light-t3-c', name: 'High Powered', tier: 3,
    classId: 'reload-root', subVariantId: 'light',
    parent: 'reload-light', children: [],
    description: 'Tight 3-round clip, but each empty chamber adds 50% more damage to the next shot. Shot 1 is normal. Shot 2 hits 50% harder. Shot 3 hits 100% harder.',
    cost: 1, statEffects: {},
    // reload.max-ammo is additive: light frame gives +5, this node gives -2 → net 3 rounds.
    mechanicEffects: { 'reload.high-powered': 1, 'reload.max-ammo': -2 },
  }],

  // ── Tier 3: Reload — Balanced ─────────────────────────────────────────────────

  ['reload-balanced-t3-a', {
    id: 'reload-balanced-t3-a', name: 'Death Mark', tier: 3,
    classId: 'reload-root', subVariantId: 'balanced',
    parent: 'reload-balanced', children: [],
    description: 'Each attack applies a Death Mark stack to the target (up to 10). Reloading detonates all stacks on the current target for attack × stacks × 0.5 bonus damage.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'reload.death-mark': 1 },
  }],
  ['reload-balanced-t3-b', {
    id: 'reload-balanced-t3-b', name: 'Continuous Firing', tier: 3,
    classId: 'reload-root', subVariantId: 'balanced',
    parent: 'reload-balanced', children: [],
    description: 'Each attack builds up to 4 reload speed stacks (200 ms each, reset on reload). Reloading also grants a 30% attack damage buff for 3 s.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'reload.cont-firing': 1 },
  }],
  ['reload-balanced-t3-c', {
    id: 'reload-balanced-t3-c', name: 'Finishing Strike', tier: 3,
    classId: 'reload-root', subVariantId: 'balanced',
    parent: 'reload-balanced', children: [],
    description: 'The last bullet in every clip scales with the target\'s missing HP. 1.5× at full health, rising to 3× at 90% missing. An execution mechanic that rewards letting enemies bleed low.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'reload.finishing-strike': 1 },
  }],

  // ── Tier 3: Reload — Heavy ────────────────────────────────────────────────────

  ['reload-heavy-t3-a', {
    id: 'reload-heavy-t3-a', name: 'Laser', tier: 3,
    classId: 'reload-root', subVariantId: 'heavy',
    parent: 'reload-heavy', children: [],
    description: 'Replaces your magazine with a continuous laser. It fires every server tick while a target is in range, building Heat from 0% to 100%. At 100% Heat it overheats and cannot fire again until fully cooled.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'reload.laser': 1,
      'reload.laser-damage-per-tick-pct': 0.15,
      'reload.laser-heat-per-tick': 2,
      'reload.laser-cool-per-tick': 2.5,
    },
  }],
  ['reload-heavy-t3-b', {
    id: 'reload-heavy-t3-b', name: 'Snipe', tier: 3,
    classId: 'reload-root', subVariantId: 'heavy',
    parent: 'reload-heavy', children: [],
    description: 'Loads only 3 heavy shells. Your firing cadence is fixed and slow, ignoring attack speed, but attack speed instead scales shot damage. Shots deal extra damage against enemies still at full health.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'reload.snipe': 1,
      'reload.max-ammo': -9,
      'reload.snipe-cooldown-ms': 2500,
      'reload.snipe-baseline-cd-ms': 1000,
      'reload.snipe-fullhp-mult': 2,
    },
  }],
  ['reload-heavy-t3-c', {
    id: 'reload-heavy-t3-c', name: 'Gatling', tier: 3,
    classId: 'reload-root', subVariantId: 'heavy',
    parent: 'reload-heavy', children: [],
    description: 'Doubles your magazine and doubles your attack speed again, turning the reload path into sustained suppressive fire. Each hit applies a very small knockback, but the enlarged weapon doubles your reload recovery window.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'reload.gatling': 1,
      'reload.max-ammo': 12,
      'reload.reload-time-ms': 4000,
    },
  }],

  // ── Tier 3: Cooldown — Heavy ──────────────────────────────────────────────────

  ['cooldown-heavy-t3-a', {
    id: 'cooldown-heavy-t3-a', name: 'Entropy Collapse', tier: 3,
    classId: 'cooldown-root', subVariantId: 'heavy',
    parent: 'cooldown-heavy', children: [],
    description: 'Your execution deals no direct damage. Instead it inflicts a wound that ticks every second for 8 s. Each tick scales with the target\'s missing health — the weaker they are, the harder it burns. 4× multiplier at 90% missing HP.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.entropy-collapse': 1 },
  }],
  ['cooldown-heavy-t3-b', {
    id: 'cooldown-heavy-t3-b', name: 'Singular Extraction', tier: 3,
    classId: 'cooldown-root', subVariantId: 'heavy',
    parent: 'cooldown-heavy', children: [],
    description: 'Normal attacks deal no damage. Your execution fires on a greatly shortened cooldown and hits for significantly more. Leaving combat for 4 s resets your preparation — patience earns nothing here.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.singular-extraction': 1, 'cooldown.empowered-cd-ms': -6000 },
  }],
  ['cooldown-heavy-t3-c', {
    id: 'cooldown-heavy-t3-c', name: 'Channeled Beam', tier: 3,
    classId: 'cooldown-root', subVariantId: 'heavy',
    parent: 'cooldown-heavy', children: [],
    description: 'Your execution becomes a 3-second concentrated channel: you stand still and continuously deal damage to your target. If the target dies mid-channel, you briefly attempt to reacquire before the beam ends.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.channeled-beam': 1 },
  }],
] satisfies [string, SkillNode][];
