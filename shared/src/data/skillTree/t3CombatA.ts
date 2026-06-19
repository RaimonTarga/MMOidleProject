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
    // 'cadence.aftershock-onhit-per-tier': flat on-hit = this × tiers-since-unlock (1× at unlock).
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
    description: 'Time in active combat ramps a Crescendo bonus that multiplies your finisher. The first several seconds give most of the bonus; it keeps climbing forever at a diminished rate. Resets instantly when you leave combat. Does not affect regular attacks.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.crescendo': 1 },
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
    description: 'Each attack banks a stack, and every attack deals bonus flat damage per banked stack — so your hits ramp the longer you go (stacks fall off after 10s idle). The execution adds the full stacked bonus on top, then clears the stacks.',
    cost: 1, statEffects: {},
    // CD stays at the light frame's 5000ms (no override) — the old +5000ms that
    // pushed it to "10s" was a bug; description corrected to 5s.
    // 'cooldown.eternal-cycle-flat': per-stack flat = base × (playerTier − 2), 1× at tier 3.
    mechanicEffects: { 'cooldown.eternal-cycle': 1, 'cooldown.eternal-cycle-flat': 8 },
  }],
  ['cooldown-light-t3-c', {
    id: 'cooldown-light-t3-c', name: 'Sunderer', tier: 3,
    classId: 'cooldown-root', subVariantId: 'light',
    parent: 'cooldown-light', children: [],
    description: 'Your execution bypasses 100% of the target\'s plating. For 2 seconds afterward, your regular attacks bypass 50% of plating and ignore 10% of the target\'s damage reduction.',
    cost: 1, statEffects: {},
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
    description: 'Normal attacks deal no damage. Your execution fires on a greatly shortened cooldown (4s) and hits for far more (5× instead of 3×). On-hit gear and charm triggers still fire on regular attacks. Out of combat, your execution stays primed — the first strike on a new target is an execution."',
    cost: 1, statEffects: {},
    // Heavy frame is 9000ms / 3.0×; deltas land it at 4000ms / 5.0×.
    mechanicEffects: { 'cooldown.singular-extraction': 1, 'cooldown.empowered-cd-ms': -4000 },
  }],
  ['cooldown-heavy-t3-c', {
    id: 'cooldown-heavy-t3-c', name: 'Devout Priest', tier: 3,
    classId: 'cooldown-root', subVariantId: 'heavy',
    parent: 'cooldown-heavy', children: [],
    description: 'Your execution becomes a 3-second holy channel: you stand still and fire a continuous beam at your target, and every beam tick applies your on-hit effects (gear, charms, on-hit damage) — built for high on-hit over attack speed. If the target dies mid-channel, you briefly reacquire before the beam ends.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.channeled-beam': 1, 'cooldown.channeled-beam-mult': 1.0 },
  }],

  // ── Tier 3: Reload — Light ───────────────────────────────────────────────────

  ['reload-light-t3-a', {
    id: 'reload-light-t3-a', name: 'Duelist', tier: 3,
    classId: 'reload-root', subVariantId: 'light',
    parent: 'reload-light', children: [],
    description: 'The last bullet of every clip fires as an empowered shot (3.5×) with a splash — and like all empowered attacks, it scales with empowered-damage gear and passives.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'reload.exploding-clip': 1, 'reload.empowered-mult': 3.5, 'reload.max-ammo': +1 },
  }],
  ['reload-light-t3-b', {
    id: 'reload-light-t3-b', name: 'Desperado', tier: 3,
    classId: 'reload-root', subVariantId: 'light',
    parent: 'reload-light', children: [],
    description: 'Each reload completion grants a Momentum stack (up to 5): +6% attack speed and −10% reload time per stack (reaching ~1s reload at max). Stacks persist through combat and decay slowly out of combat. Rewards continuous, uninterrupted fighting.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'reload.momentum': 1,
      'reload.momentum-aps-per-stack': 0.06,
      'reload.momentum-max-stacks': 5,
      'reload.momentum-reload-reduction': 0.10,
    },
  }],
  ['reload-light-t3-c', {
    id: 'reload-light-t3-c', name: 'Sniper', tier: 3,
    classId: 'reload-root', subVariantId: 'light',
    parent: 'reload-light', children: [],
    description: 'Loads only 3 heavy shells and fires at a hard-set 0.5 APS, ignoring weapon attack speed entirely. Your bonus attack-speed stat is converted into per-shot damage instead, and shots deal 2× damage against full-health targets. Fast 1.2s reload.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'reload.snipe': 1,
      'reload.max-ammo': -2,            // light frame is 5 rounds → 3 shells
      'reload.snipe-cadence-ms': 2000,  // hard-set 0.5 APS
      'reload.snipe-as-to-dmg': 1.0,    // +attack-speed stat → +attack damage (×0.5)
      'reload.snipe-fullhp-mult': 4,
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
      'reload.blunderbuss-damage-mult': -0.50,
      'reload.blunderbuss-spread-rad': 0.65,
      'reload.blunderbuss-knockback-distance-per-pellet': 7,
      'reload.blunderbuss-knockback-ms-per-pellet': 14,
    },
  }],
  ['reload-balanced-t3-c', {
    id: 'reload-balanced-t3-c', name: 'Dualslinger', tier: 3,
    classId: 'reload-root', subVariantId: 'balanced',
    parent: 'reload-balanced', children: [],
    description: 'Even shots deal 2× attack damage with no on-hit damage; odd shots deal 2× on-hit damage with no attack damage. On-hit TRIGGERS (DoT, procs) still fire on every shot. Also grants scaling on-hit damage. Rewards a genuinely balanced attack/on-hit gear split.',
    cost: 1, statEffects: {},
    // 'reload.alternating-onhit-per-tier': flat on-hit = this × tiers-since-unlock (1× at unlock).
    mechanicEffects: { 'reload.alternating-cadence': 1, 'reload.alternating-onhit-per-tier': 20 },
  }],

  // ── Tier 3: Reload — Heavy ────────────────────────────────────────────────────

  // TODO(naming): "Laser" replaces Exploding Clip in the heavy slot. The full
  // heat-based firing system is the highest-cost spec in the doc; this reuses the
  // existing implemented laser mechanic. Re-evaluate against the design's heat model.
  ['reload-heavy-t3-a', {
    id: 'reload-heavy-t3-a', name: 'Melter', tier: 3,
    classId: 'reload-root', subVariantId: 'heavy',
    parent: 'reload-heavy', children: [],
    description: 'Replaces your magazine with a continuous laser. It fires continuously while a target is in range, building Heat from 0% to 100%. At 100% Heat it overheats and cannot fire again until fully cooled.',
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
    description: 'Attack speed ramps up with every shot fired through the high-capacity clip, resetting on reload.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'reload.hair-trigger': 1,
      'reload.hair-trigger-pct-per-shot': 0.05,
      'reload.hair-trigger-max-stacks': 15,
      'reload.max-ammo': +20,
    },
  }],
  ['reload-heavy-t3-c', {
    id: 'reload-heavy-t3-c', name: 'Cannoneer', tier: 3,
    classId: 'reload-root', subVariantId: 'heavy',
    parent: 'reload-heavy', children: [],
    description: 'Every shot banks damage into your Cannon. When you reload, the cannon charges for half the reload, then fires the entire stored pool at your target as one massive burst — then the pool resets. Reward: empty big clips, then unload the cannon.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'reload.cannon': 1, 'reload.cannon-damage-per-shot': 0.5 },
  }],

] satisfies [string, SkillNode][];
