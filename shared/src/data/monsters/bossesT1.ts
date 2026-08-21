import type { MonsterDefinition } from './types';

// ─────────────────────────────────────────────────────────────────────────
// BOSS REBALANCE — T1 + T2 (Pass 1). Follows boss-design.md.
//
// T1 NUMERICAL PASS (2026-08-21) — read this before touching a T1 boss stat.
//
// All five T1 bosses are END-OF-TIER encounters. They are NOT a five-step ladder
// following the Plains->Forest->Swamp->Mountain->Caverns railroad: the player runs
// the railroad on normal content, banks global mastery and +4/+5 gear, and only
// then starts clearing dungeons. Biome sets a boss's MECHANICS, never its
// progression level, so the Plains boss is not an "early" boss.
//
// They are tuned to one difficulty BAND, spending the budget differently:
//   Razorback   adds / concurrency — weakest personal hit, swarm does half the work
//   Greatbear   sustained pressure — highest steady dps, no spike, no attrition
//   Toadeater   DoT attrition      — longest fight, ~85% unmitigable damage
//   Behemoth    burst              — the tier's biggest single hit (cap exam)
//   Broodmother endurance          — widest armour spread + plating corrosion
//
// Measured with `server/bench/bossExam.ts` (5 armour sets x 6 class roots per boss;
// the guard is stripped so the numbers are the boss and nothing else). Target band:
// ~30s time-to-kill and ~1.1-1.35 health bars spent over the full fight. NOTE that
// `--mode boss` in the balance bench does NOT fight bosses — see bossExam's header.
//
// T1: Slow bosses gain CLEAVE (aoeAttack) so summon-spam can't body-block them —
//     see the anti-summon guardrail in boss-design.md.
// T2: + ONE phase at 50% HP (the tier's new layer — escalation, not a 2nd shape;
//     true shape-swaps/range-flips start at T3 via `morph`). Slow bosses cleave.
//
// Cleave criterion = SLOW swing rate (vulnerable to body-block), not hit size:
//   cleave  -> Mountain, Swamp, Cave (speed <= ~30)
//   single  -> Plains, Forest, Desert, Jungle (fast enough to keep pace)
// aoeAttack: { radius, damageMult } — every swing splashes damageMult x attack to
//   others within radius of the target (full damage to the primary target).
//
// Phases use enrage (atk x atkMult, cd x cdMult) + stat-buff (movement speed).
// No two enrages on one boss (last-write-wins restore bug) — speed pressure uses
// stat-buff. Phase buffs omit durationMs = permanent for the rest of the life.
//
// DESERT/JUNGLE bosses moved out of "deferred" — those biomes debut at T2, so
// they get the full T2 treatment now. `glacial-colossus` (Tundra) is DELETED:
// Tundra debuts at T3, its boss is frost-plated-rime-mammoth.
//
// Stat anchors (boss-design.md): boss HP ~9-10x median trash & >=2x toughest
// elite; per-hit ~1.3-1.4x the biome's biggest trash hit; Mtn/Cave slams ~40-50%
// of player pool (trip the cap). Rewards/essence = placeholder (economy deferred).
// ─────────────────────────────────────────────────────────────────────────

export const bossMonsterEntriesT1 = [
  // ════════════════════════ T1 BOSSES (pure shape, no phase) ════════════════════════

  // PLAINS — honest bruiser, no gimmick. The floor. (fast enough: single-target)
  ['tusked-razorback', {
    id: 'tusked-razorback', name: 'Tusked Razorback', color: 0xddaa44,
    isBoss: true,
    // Weakest personal hit of the five ON PURPOSE: roughly half this fight's damage
    // comes out of the swarm, so the razorback itself is priced as the smaller half
    // of its own encounter. 34 is still under 2x the Boar, the biome's biggest trash hit.
    stats: { hp: 1700, attack: 34, plating: 4, damageReduction: 0.02, speed: 50, attackRange: 15, attackCooldown: 2000, pullRange: 280 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 100, essenceType: 'yellow', level: 5, biomeXp: 150, catalystBundle: 5 }, // one-time first-clear bundle (placeholder)
    ai: { wanderRadius: 120, leashRange: 750, idleMinMs: 1500, idleMaxMs: 4500 },
    // PLAINS EXAM = "survive the swarm". T1 stays simple: one 50% beat where the
    // razorback rallies a slime swarm (adds despawn on boss death) + a light enrage.
    // Numbers placeholder — user balance pass; structure formalizes in Step 13.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'spawn-adds', monsterTypeId: 'plains-slime', count: 4, maxAlive: 6, offsetRange: 220 },
          { type: 'spawn-adds', monsterTypeId: 'boar', count: 1, maxAlive: 6, offsetRange: 220 },
          { type: 'enrage', atkMult: 1.1, cdMult: 0.9 },
        ] },
      ],
      // The swarm is HALF this encounter's output, so it is left at its authored
      // strength and the boss's own stat block pays for it instead.
      repeating: [
        { intervalMs: 10_000, initialDelayMs: 4_000, actions: [
          { type: 'spawn-adds', monsterTypeId: 'plains-slime', count: 2, maxAlive: 5, offsetRange: 220 },
        ] },
      ],
    },
  }],

  // FOREST — fast, frequent, frail. The evasion exam. (fast: single-target)
  ['gnarled-greatbear', {
    id: 'gnarled-greatbear', name: 'Gnarled Greatbear', color: 0x33aa44,
    isBoss: true,
    // The tier's SUSTAINED-pressure boss: no spike, no adds, no attrition — just the
    // fastest cadence and the highest steady incoming DPS of the five. `attack` is low
    // BECAUSE every beat is two full pipeline hits and the cadence ramps: 24 x2 / 1.4s
    // = 34 dps raw, ~56 dps once the ramp caps and the 50% enrage has fired. At the old
    // 36 the combo+ramp+enrage stack reached ~99 dps and killed all 30 bench builds.
    //
    // ⚠ THIS BOSS IS PARKED ON THE PLATING CLIFF and cannot be tuned off it here.
    // End-of-T1 plating runs 9 (cave set) to 29 (plains set) against a ~180 HP pool,
    // and plating is a flat subtract with a 1-damage floor, so a 24-damage hit deals
    // ~1 to a plains-geared player and ~19 to a cave-geared one. Raising the hit above
    // 29 fixes the spread but multiplies total damage far faster than any cadence cut
    // can absorb — you cannot have "fast, frequent, small hits" AND a sane total at
    // this plating scale. The MEDIAN is on band; the armour spread (~3.5x, vs ~1.8x for
    // the other four) is the gear problem from mitigation-rebalance-handoff-2026-08-18,
    // not a boss problem. Re-measure this boss FIRST after the mitigation pass.
    stats: { hp: 2000, attack: 24, plating: 0, damageReduction: 0, speed: 60, attackRange: 15, attackCooldown: 1400, pullRange: 300 },
    behavior: 'melee', attackStyle: 'bear-claws', biome: 'forest',
    rewards: { essence: 100, essenceType: 'green', level: 5, biomeXp: 150, catalystBundle: 5 },
    ai: { wanderRadius: 160, leashRange: 800, idleMinMs: 1200, idleMaxMs: 4000 },
    consecutiveHits: 2,
    // Caps at +28% after 4 ticks = 12s, comfortably inside the fight, so the ramp is
    // a beat the player actually meets rather than a number that never lands.
    rampOnCombat: { stat: 'attackSpeed', perTickPct: 0.07, maxPct: 0.28, tickIntervalMs: 3000 },
    // FOREST EXAM = a clean claw duel. Every swing is a two-hit bear-claw combo,
    // and its attack cadence ramps while the pull remains active. No adds.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'enrage', atkMult: 1.1, cdMult: 0.85 },
        ] },
      ],
    },
  }],

  // MOUNTAIN — slow charging mega-slam that trips the cap. Burst exam. Cleaves.
  ['crag-behemoth', {
    id: 'crag-behemoth', name: 'Crag Behemoth', color: 0x8899bb,
    isBoss: true,
    stats: { hp: 2100, attack: 56, plating: 0, damageReduction: 0, speed: 22, attackRange: 18, attackCooldown: 3500, pullRange: 280 },
    behavior: 'melee', attackStyle: 'quake', biome: 'mountain',
    rewards: { essence: 105, essenceType: 'blue', level: 5, biomeXp: 158, catalystBundle: 5 },
    ai: { wanderRadius: 120, leashRange: 750, idleMinMs: 2000, idleMaxMs: 5000 },
    chargeOnAggro: { speedMult: 3.0, durationMs: 1200 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
    // 56 x1.9 = 106 — the tier's biggest single hit, ~55-60% of an end-of-T1 pool.
    // Above the 40-50% anchor in boss-design.md on purpose: this is the one T1 fight
    // that is supposed to make the damage cap (mountain plate / Striker root) read as
    // the difference between surviving the slam and not. Every 10s, three casts a fight.
    chargedAttack: {
      name: 'Ground Slam', castMs: 2400, cooldownMs: 10000, initialCooldownMs: 4500,
      multiplier: 1.9, fx: 'strong-kick', aoe: { radius: 155 },
    },
    // MOUNTAIN EXAM = "break the guarded position". T1: at 50% it digs in (a timed
    // shield) while you grind it down. (T1 adds removed except Plains.)
    // Numbers placeholder — user balance pass; structure formalizes in Step 13.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'shield', drAdd: 0.3, durationMs: 5000 },
        ] },
      ],
    },
  }],

  // SWAMP — trivial direct hit, real (beatable) DoT. dot-resist exam. Cleaves
  // (slow: a body-blocked DoT swing lands on summons instead of the player).
  ['grave-toadeater', {
    id: 'grave-toadeater', name: 'Grave Toadeater', color: 0x1e3d1e,
    isBoss: true,
    // The tier's ATTRITION boss: the longest fight, the smallest hits, and ~85% of its
    // damage arriving through channels plating and DR never touch. The direct slap stays
    // trivial (13 is exactly the Mud Toad's hit) — the toxin and the rot pool are the boss.
    stats: { hp: 2100, attack: 13, plating: 2, damageReduction: 0.02, speed: 28, attackRange: 15, attackCooldown: 2600, pullRange: 260 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 100, essenceType: 'purple', level: 5, biomeXp: 150, catalystBundle: 5 },
    ai: { wanderRadius: 100, leashRange: 700, idleMinMs: 2000, idleMaxMs: 5500 },
    // 4 x4 = 16 dps at cap, reached after 3 swings (7.8s) and held there because each
    // landed hit refreshes the whole duration. Was 3 x3 = 9 dps — LESS
    // poison than the Mire Ooze trash mob (6 x3 = 18) in the biome whose whole identity
    // is poison, which is most of why this boss was the tier's pushover.
    dotEffect: { debuffId: 'grave-toadeater-poison', label: 'Toad Poison', damagePerStack: 4, maxStacks: 4, tickIntervalMs: 1000, durationMs: 4000 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
    chargedAttack: {
      name: 'Bile Pool', castMs: 1200, cooldownMs: 8500, initialCooldownMs: 4000,
      multiplier: 1.0, fx: 'strong-kick', aoe: { radius: 105 },
      pool: { durationMs: 7000, damagePerTick: 3, tickIntervalMs: 1000, slowSpeedMult: 0.65 },
    },
    // SWAMP EXAM = "survive the rot". The boss plants its own telegraphed pool;
    // at 50% it gets a light enrage. No encounter adds.
    // Numbers placeholder — user balance pass; structure formalizes in Step 13.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'enrage', atkMult: 1.15, cdMult: 0.85 },
        ] },
      ],
    },
  }],

  // CAVE — tanky mixed elite: high HP, DR + plating, charges. Endurance exam. Cleaves.
  ['obsidian-broodmother', {
    id: 'obsidian-broodmother', name: 'Obsidian Broodmother', color: 0x334455,
    isBoss: true,
    // Lowest raw HP of the five and still the hardest to chew through: plating 6 + 10%
    // DR give it by far the tier's widest armour spread, so a fast chip build meets
    // several times the effective HP a heavy hitter does. That is the endurance exam.
    stats: { hp: 1750, attack: 47, plating: 6, damageReduction: 0.10, speed: 24, attackRange: 18, attackCooldown: 2800, pullRange: 240 },
    behavior: 'melee', attackStyle: 'quake', biome: 'cave',
    rewards: { essence: 110, essenceType: 'red', level: 5, biomeXp: 165, catalystBundle: 5 },
    ai: { wanderRadius: 80, leashRange: 680, idleMinMs: 2500, idleMaxMs: 6500 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
    appliesPlatingShred: { platingPerStack: 1, maxStacks: 6 },
    // 47 x1.8 = 85, ~47% of an end-of-T1 pool — squarely on the cap-exam anchor in
    // boss-design.md, and deliberately a step below the Behemoth's 106: Caverns is the
    // endurance exam, Mountain is the burst one.
    chargedAttack: {
      name: 'Obsidian Slam', castMs: 1700, cooldownMs: 9500, initialCooldownMs: 4500,
      multiplier: 1.8, fx: 'strong-kick', aoe: { radius: 125 },
    },
    // CAVE EXAM = "survive the elite" (a durable %DR sponge). T1: at 50% it digs in
    // (timed shield) — the focus stays on grinding the durable boss; Heavy Strike
    // (single-target burst) and Second Wind (sustain) both pay off here.
    // (T1 adds removed except Plains.) Numbers placeholder — user pass.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'shield', drAdd: 0.25, durationMs: 5000 },
        ] },
      ],
    },
  }],

  
] satisfies [string, MonsterDefinition][];
