import type { SkillNode } from './types';

export const t3CombatEntriesA = [
  // ── Tier 3: Path modifiers (cadence-light — fully implemented) ────────────
  //
  // Three choices per path (class × sub-variant = 15 paths × 3 = 45 nodes).
  // cadence-light is the first path with real mechanical options; all others
  // are placeholder (to be designed). mechanicEffects values accumulate into
  // player.passives and are read by the relevant archetype system at runtime.

  ['cadence-light-t3-a', {
    id: 'cadence-light-t3-a', name: 'Shockblade', tier: 3,
    classId: 'cadence-root', subVariantId: 'light',
    parent: 'cadence-light', children: [],
    description: 'After your finisher, your next 3 regular attacks fire their on-hit damage twice. Gain extra scaling on-hit damage.',
    cost: 1, statEffects: {},
    // 'cadence.aftershock-onhit-per-tier': flat on-hit damage = (playerTier + 1) × this.
    mechanicEffects: { 'cadence.aftershock': 1, 'cadence.aftershock-onhit-per-tier': 10 },
  }],
  ['cadence-light-t3-b', {
    id: 'cadence-light-t3-b', name: 'Scrapper', tier: 3,
    classId: 'cadence-root', subVariantId: 'light',
    parent: 'cadence-light', children: [],
    description: 'Your finisher curses the target: +25% damage taken for 5 seconds, and permanently reduces their flat plating by 5 (capped at 20 total per target). The triggering finisher benefits from the vulnerability.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'cadence.debuff-vuln-pct': 25,
      'cadence.debuff-vuln-ms':  5000,
      'cadence.debuff-plating-shred': 5,
      'cadence.debuff-shred-cap': 20,
    },
  }],
  ['cadence-light-t3-c', {
    id: 'cadence-light-t3-c', name: 'Swiftblade', tier: 3,
    classId: 'cadence-root', subVariantId: 'light',
    parent: 'cadence-light', children: [],
    description: 'Your finisher strikes twice. Both hits apply the full multiplier. Neither hit counts toward the next combo.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.trigger-count': 2 },
  }],

  // ── Tier 3: Cadence — Balanced ─────────────────────────────────────────────

  ['cadence-balanced-t3-a', {
    id: 'cadence-balanced-t3-a', name: 'Maestro', tier: 3,
    classId: 'cadence-root', subVariantId: 'balanced',
    parent: 'cadence-balanced', children: [],
    description: 'Each regular attack in the buildup adds flat attack damage to every subsequent attack in that cycle, including the finisher. Stacks reset after each finisher.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.metronome': 1, 'cadence.metronome-flat': 12 },
  }],
  ['cadence-balanced-t3-b', {
    id: 'cadence-balanced-t3-b', name: 'Wavecrest', tier: 3,
    classId: 'cadence-root', subVariantId: 'balanced',
    parent: 'cadence-balanced', children: [],
    description: 'Each attack building toward the finisher amplifies it by 20%. After a finisher, your next 4 attacks deal 50% bonus damage.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.momentum-buildup': 0.20, 'cadence.momentum-echo': 4 },
  }],
  ['cadence-balanced-t3-c', {
    id: 'cadence-balanced-t3-c', name: 'Justicar', tier: 3,
    classId: 'cadence-root', subVariantId: 'balanced',
    parent: 'cadence-balanced', children: [],
    description: 'Each finisher banks 30% of its damage into a Verdict — a stored pool of execution power that persists across targets. When a target\'s remaining health is at or below your Verdict, your finisher executes it instantly and spends the pool.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.detonation': 1 },
  }],

  // ── Tier 3: Cadence — Heavy ────────────────────────────────────────────────

  ['cadence-heavy-t3-a', {
    id: 'cadence-heavy-t3-a', name: 'Berserker', tier: 3,
    classId: 'cadence-root', subVariantId: 'heavy',
    parent: 'cadence-heavy', children: [],
    description: 'Each finisher grants a Rampage stack (up to 10): −1 combo threshold (floor 2), faster attacks, weaker regular hits, and a stronger finisher multiplier. At 10 stacks the next finisher overloads and resets Rampage to 0. Stacks decay slowly out of combat.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.rampage': 1 },
  }],
  ['cadence-heavy-t3-b', {
    id: 'cadence-heavy-t3-b', name: 'Hemomancer', tier: 3,
    classId: 'cadence-root', subVariantId: 'heavy',
    parent: 'cadence-heavy', children: [],
    description: 'Your finisher deals no direct damage — instead it converts into a bleeding wound (non-stacking) dealing 150% of the finisher damage over 4 seconds. Re-triggering refreshes the wound.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.hemorrhage': 1 },
  }],
  ['cadence-heavy-t3-c', {
    id: 'cadence-heavy-t3-c', name: 'Juggernaut', tier: 3,
    classId: 'cadence-root', subVariantId: 'heavy',
    parent: 'cadence-heavy', children: [],
    description: 'Every second in active combat, gain a Crescendo stack. When your finisher fires it consumes all stacks, each adding flat bonus damage to that hit. Stacks decay slowly out of combat. Does not affect regular attacks.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.crescendo': 1, 'cadence.crescendo-flat': 18 },
  }],

  // ── Tier 3: Cooldown — Light ──────────────────────────────────────────────────

  // NOTE(naming): "Overdrive" collides with the Energy Light spec of the same
  // working name — both need distinct final class titles at the naming pass.
  ['cooldown-light-t3-a', {
    id: 'cooldown-light-t3-a', name: 'Assassin', tier: 3,
    classId: 'cooldown-root', subVariantId: 'light',
    parent: 'cooldown-light', children: [],
    description: 'Your execution deals its normal damage and triggers a 2.5s burst of double attack speed (~half-uptime at the 5s cooldown). The timer keeps ticking through the burst.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.overdrive': 1 },
  }],
  ['cooldown-light-t3-b', {
    id: 'cooldown-light-t3-b', name: 'Transcendant', tier: 3,
    classId: 'cooldown-root', subVariantId: 'light',
    parent: 'cooldown-light', children: [],
    description: 'Each attack during the 5s execution cooldown banks a stack of flat damage (falls off after 10s idle). The execution fires at its normal 1.5× plus all stacked flat bonus, then clears the stacks.',
    cost: 1, statEffects: {},
    // CD stays at the light frame's 5000ms (no override) — the old +5000ms that
    // pushed it to "10s" was a bug; description corrected to 5s.
    mechanicEffects: { 'cooldown.eternal-cycle': 1 },
  }],
  ['cooldown-light-t3-c', {
    id: 'cooldown-light-t3-c', name: 'Sunderer', tier: 3,
    classId: 'cooldown-root', subVariantId: 'light',
    parent: 'cooldown-light', children: [],
    description: 'Your execution bypasses 100% of the target\'s plating. For 2 seconds afterward, your regular attacks bypass 50% of plating.',
    cost: 1, statEffects: {},
    // TODO(engine): the planned 10% DR pierce during the window has no ctx hook yet.
    mechanicEffects: { 'cooldown.rupture': 1, 'cooldown.rupture-dr-pierce': 0.10 },
  }],

  // ── Tier 3: Cooldown — Balanced ───────────────────────────────────────────────

  ['cooldown-balanced-t3-a', {
    id: 'cooldown-balanced-t3-a', name: 'Reverb', tier: 3,
    classId: 'cooldown-root', subVariantId: 'balanced',
    parent: 'cooldown-balanced', children: [],
    description: 'The attacks you land during one cooldown window charge your NEXT execution: each attack adds bonus damage to the following execution (the current one fires normally). The charge resets each execution.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.reverb': 1, 'cooldown.reverb-bonus-per-attack': 0.04 },
  }],
  ['cooldown-balanced-t3-b', {
    id: 'cooldown-balanced-t3-b', name: 'Dynamo', tier: 3,
    classId: 'cooldown-root', subVariantId: 'balanced',
    parent: 'cooldown-balanced', children: [],
    description: 'Every second your execution cooldown ticks down, you gain a stack of accumulated power that increases attack damage. The execution spends all stacks.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.battery': 1 },
  }],
  ['cooldown-balanced-t3-c', {
    id: 'cooldown-balanced-t3-c', name: 'Stalwart', tier: 3,
    classId: 'cooldown-root', subVariantId: 'balanced',
    parent: 'cooldown-balanced', children: [],
    description: 'The longer your execution cooldown runs uninterrupted, the more both your attack damage and the execution\'s bonus ramp — peaking at the full natural 7s. Triggering early yields a proportionally smaller payoff.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.patience-paid': 1 },
  }],

  // ── Tier 3: Reload — Light ───────────────────────────────────────────────────

  ['reload-light-t3-a', {
    id: 'reload-light-t3-a', name: 'Duelist', tier: 3,
    classId: 'reload-root', subVariantId: 'light',
    parent: 'reload-light', children: [],
    description: 'The last bullet of every clip deals 3.5× damage. Every 5 shots delivers a payoff hit.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'reload.exploding-clip': 1, 'reload.exploding-clip-mult': 3.5 },
  }],
  ['reload-light-t3-b', {
    id: 'reload-light-t3-b', name: 'Dualslinger', tier: 3,
    classId: 'reload-root', subVariantId: 'light',
    parent: 'reload-light', children: [],
    description: 'Even shots deal 2× attack damage with no on-hit damage; odd shots deal 2× on-hit damage with no attack damage. On-hit TRIGGERS (DoT, procs) still fire on every shot. Rewards a genuinely balanced attack/on-hit gear split.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'reload.alternating-cadence': 1 },
  }],
  ['reload-light-t3-c', {
    id: 'reload-light-t3-c', name: 'Sniper', tier: 3,
    classId: 'reload-root', subVariantId: 'light',
    parent: 'reload-light', children: [],
    description: 'Loads only 3 heavy shells at a fixed slow cadence (ignoring attack speed). Attack speed instead scales per-shot damage, and shots deal bonus damage against full-health targets. Fast 1.2s reload.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'reload.snipe': 1,
      'reload.max-ammo': -2,            // light frame is 5 rounds → 3 shells
      'reload.snipe-cooldown-ms': 2500,
      'reload.snipe-baseline-cd-ms': 1000,
      'reload.snipe-fullhp-mult': 2,
    },
  }],

  // ── Tier 3: Reload — Balanced ─────────────────────────────────────────────────

  ['reload-balanced-t3-a', {
    id: 'reload-balanced-t3-a', name: 'Bounty hunter', tier: 3,
    classId: 'reload-root', subVariantId: 'balanced',
    parent: 'reload-balanced', children: [],
    description: 'Each attack applies a Death Mark stack to the target (up to 10). Reloading detonates all stacks on the current target for attack × stacks × 0.65 bonus damage.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'reload.death-mark': 1, 'reload.death-mark-detonate-mult': 0.65 },
  }],
  ['reload-balanced-t3-b', {
    id: 'reload-balanced-t3-b', name: 'Blunderbuss', tier: 3,
    classId: 'reload-root', subVariantId: 'balanced',
    parent: 'reload-balanced', children: [],
    description: 'Fires all 10 rounds at once as a point-blank volley, then reloads (2s). Close range mandatory — the reach penalty is preserved. Each pellet deals normal damage; the burst shoves enemies back.',
    cost: 1, statEffects: { attackRange: -100 },
    mechanicEffects: {
      'reload.blunderbuss': 1,
      'reload.blunderbuss-spread-rad': 0.65,
      'reload.blunderbuss-knockback-distance-per-pellet': 7,
      'reload.blunderbuss-knockback-ms-per-pellet': 14,
    },
  }],
  ['reload-balanced-t3-c', {
    id: 'reload-balanced-t3-c', name: 'Desperado', tier: 3,
    classId: 'reload-root', subVariantId: 'balanced',
    parent: 'reload-balanced', children: [],
    description: 'Each reload completion grants a stack of attack speed (up to 5). Stacks persist through combat and decay slowly out of combat. Rewards continuous, uninterrupted fighting.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'reload.momentum': 1,
      'reload.momentum-aps-per-stack': 0.06,
      'reload.momentum-max-stacks': 5,
    },
  }],

  // ── Tier 3: Reload — Heavy ────────────────────────────────────────────────────

  // TODO(naming): "Laser" replaces Exploding Clip in the heavy slot. The full
  // heat-based firing system is the highest-cost spec in the doc; this reuses the
  // existing implemented laser mechanic. Re-evaluate against the design's heat model.
  ['reload-heavy-t3-a', {
    id: 'reload-heavy-t3-a', name: 'Melter', tier: 3,
    classId: 'reload-root', subVariantId: 'heavy',
    parent: 'reload-heavy', children: [],
    description: 'Replaces your magazine with a continuous laser. It fires every server tick while a target is in range, building Heat from 0% to 100%. At 100% Heat it overheats and cannot fire again until fully cooled.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'reload.laser': 1,
      'reload.laser-damage-per-tick-pct': 0.18,
      'reload.laser-heat-per-tick': 2,
      'reload.laser-cool-per-tick': 2.5,
    },
  }],
  ['reload-heavy-t3-b', {
    id: 'reload-heavy-t3-b', name: 'Warmonger', tier: 3,
    classId: 'reload-root', subVariantId: 'heavy',
    parent: 'reload-heavy', children: [],
    description: 'Attack speed ramps up with every shot fired through the 14-round clip, resetting on reload. Only the heavy clip is large enough to reach the full ramp — fire every round before reloading.',
    cost: 1, statEffects: {},
    // Reuses the clip-ramp mechanic; max-stacks spans the 14-round clip (shots 1→14).
    mechanicEffects: {
      'reload.hair-trigger': 1,
      'reload.hair-trigger-pct-per-shot': 0.05,
      'reload.hair-trigger-max-stacks': 13,
    },
  }],
  ['reload-heavy-t3-c', {
    id: 'reload-heavy-t3-c', name: 'Cannoneer', tier: 3,
    classId: 'reload-root', subVariantId: 'heavy',
    parent: 'reload-heavy', children: [],
    description: 'On reload completion, fire a burst of bonus damage proportional to how many shots were used in the previous clip. A full 14-round clip yields the maximum burst.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'reload.siege': 1, 'reload.siege-damage-per-shot': 0.5 },
  }],

  // ── Tier 3: Cooldown — Heavy ──────────────────────────────────────────────────

  ['cooldown-heavy-t3-a', {
    id: 'cooldown-heavy-t3-a', name: 'Avenger', tier: 3,
    classId: 'cooldown-root', subVariantId: 'heavy',
    parent: 'cooldown-heavy', children: [],
    description: 'Your execution deals bonus damage equal to a portion of all damage you have taken since your last execution (with a minimum floor so it never feels dead). The fixed 9s window makes the payoff predictable.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.vengeance': 1, 'cooldown.vengeance-mult': 1.5, 'cooldown.vengeance-floor': 30 },
  }],
  ['cooldown-heavy-t3-b', {
    id: 'cooldown-heavy-t3-b', name: 'Destroyer', tier: 3,
    classId: 'cooldown-root', subVariantId: 'heavy',
    parent: 'cooldown-heavy', children: [],
    description: 'Normal attacks deal no damage. Your execution fires on a greatly shortened cooldown (4s) and hits for far more (5× instead of 3×). On-hit gear and charm triggers still fire on regular attacks. Leaving combat for 4s resets preparation.',
    cost: 1, statEffects: {},
    // Heavy frame is 9000ms / 3.0×; deltas land it at 4000ms / 5.0×.
    mechanicEffects: { 'cooldown.singular-extraction': 1, 'cooldown.empowered-cd-ms': -5000, 'cooldown.empowered-mult': 2.0 },
  }],
  // TODO(engine): Channeled Beam is NOT production-ready — the channel firing mode
  // needs engine work before this spec goes live (see t3-spec-designs-reference.md).
  // The node ships so the path is visible; the existing channeledBeam tick is a stub.
  ['cooldown-heavy-t3-c', {
    id: 'cooldown-heavy-t3-c', name: 'Devout Priest', tier: 3,
    classId: 'cooldown-root', subVariantId: 'heavy',
    parent: 'cooldown-heavy', children: [],
    description: 'Your execution becomes a 3-second concentrated channel: you stand still and continuously deal damage to your target. If the target dies mid-channel, you briefly attempt to reacquire before the beam ends.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.channeled-beam': 1 },
  }],
] satisfies [string, SkillNode][];
