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
// ENCOUNTER REWORK (2026-08-23) — the anti-summon cleave is GONE. Every slow boss
// used to carry `aoeAttack` for one reason: a wall of summons could body-block it.
// That is now solved at the targeting layer (`targeting.prefersPlayers`), so boss
// AoE exists only where the ENCOUNTER wants it — the Slam, the pool, the Eruption.
// Those same charged attacks are the periodic sweep that keeps summons honest.
//
// Phases now have to DEEPEN the boss's one idea. `empower-charged` scales the
// signature telegraphed attack, `empower-shred` deepens Cave's corrosion, `roar`
// escalates the Plains swarm. Generic timed shields and arbitrary attack multipliers
// were removed: they made every boss the same fight with a different sprite.
//
// ⚠ NUMBERS: the T1 band above was measured WITH the old 50% shields (Mountain,
// Cave) and WITH cleave. Replacing a defensive beat with an offensive one moves both
// TTK and damage taken; re-run `server/bench/bossExam.ts` before trusting the band.
//
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

  // PLAINS — SWARM COMMANDER. The boss is only half the encounter; the herd is the
  // other half. It is deliberately NOT the tier's strongest personal attacker.
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
    targeting: { prefersPlayers: true },
    // PLAINS EXAM = "survive the swarm". T1 teaches the pure identity: a trickle of
    // reinforcements, and one 50% RALLY where the razorback calls a wave and drives
    // the whole herd faster. The old self-enrage is gone on purpose — Plains
    // escalates by CONCURRENCY, never by the boss becoming a better duellist.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'spawn-adds', monsterTypeId: 'plains-slime', count: 4, maxAlive: 6, offsetRange: 220 },
          { type: 'spawn-adds', monsterTypeId: 'boar', count: 1, maxAlive: 6, offsetRange: 220 },
          { type: 'roar', attackSpeedPct: 0.20, durationMs: 8000, radius: 320 },
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
    // = 34 dps raw, ~41 dps once the ramp caps (STALE: figures below predate the
    // 2026-08-29 removal of the 50% enrage at T1 — kept for the historical dps math).
    // ~56 dps once the ramp caps and the 50% enrage has fired. At the old
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
    //
    // DESIGNER NERF, 2026-08-25: bot playtesting (headless T1 baseline routes,
    // none of which carry evasion into this fight — see "the evasion exam"
    // above) hit repeated deaths here, all death-by-rhythm rather than a
    // single spike: killing blows landed 8-10 damage after mitigation, always
    // at `concurrentAttackers: 1` (the boss alone, not the guard pack). Cadence
    // cut per designer direction, damage left untouched: attackCooldown
    // 1400ms -> 1900ms (~26% slower swings), preserving the "fastest cadence
    // of the five" identity relative to the others (still faster than Plains'
    // 2000ms) while giving Guards/Recovery meaningfully more room between
    // hits. Re-measure against the bot baselines before tuning further.
    stats: { hp: 2000, attack: 24, plating: 0, damageReduction: 0, speed: 60, attackRange: 15, attackCooldown: 1900, pullRange: 300 },
    behavior: 'melee', attackStyle: 'bear-claws', biome: 'forest',
    rewards: { essence: 100, essenceType: 'green', level: 5, biomeXp: 150, catalystBundle: 5 },
    ai: { wanderRadius: 160, leashRange: 800, idleMinMs: 1200, idleMaxMs: 4000 },
    targeting: { prefersPlayers: true },
    consecutiveHits: 2,
    // Caps at +20% after 4 ticks = 12s, comfortably inside the fight, so the ramp is
    // a beat the player actually meets rather than a number that never lands.
    // Cut 7%/28% -> 5%/20% (T1 balance iteration 3, 2026-08-24): manual +5 Striker play
    // could not bring the boss below ~50% HP, so the post-50% enrage (since removed,
    // 2026-08-29) was not the primary cause of failure — this was a first-pass cut to
    // the pre-50% ramp alone. HP, base attack, and cadence are untouched.
    rampOnCombat: { stat: 'attackSpeed', perTickPct: 0.05, maxPct: 0.20, tickIntervalMs: 3000 },
    // FOREST EXAM = a clean claw duel. Every swing is a two-hit bear-claw combo,
    // and its attack cadence ramps while the pull remains active. No adds, no enrage
    // (T1 balance iteration, 2026-08-29: designer removed the 50% enrage entirely —
    // the cadence ramp alone carries this fight's identity at T1).
  }],

  // MOUNTAIN — TELEGRAPHED CATASTROPHIC IMPACT. One enormous readable hit, and the
  // whole fight is whether you can answer it. Everything else is deliberately plain.
  ['crag-behemoth', {
    id: 'crag-behemoth', name: 'Crag Behemoth', color: 0x8899bb,
    isBoss: true,
    stats: { hp: 2100, attack: 56, plating: 0, damageReduction: 0, speed: 22, attackRange: 18, attackCooldown: 3500, pullRange: 280 },
    behavior: 'melee', attackStyle: 'quake', biome: 'mountain',
    rewards: { essence: 105, essenceType: 'blue', level: 5, biomeXp: 158, catalystBundle: 5 },
    ai: { wanderRadius: 120, leashRange: 750, idleMinMs: 2000, idleMaxMs: 5000 },
    targeting: { prefersPlayers: true },
    chargeOnAggro: { speedMult: 3.0, durationMs: 1200 },
    // 56 x1.9 = 106 — the tier's biggest single hit, ~55-60% of an end-of-T1 pool.
    // Above the 40-50% anchor in boss-design.md on purpose: this is the one T1 fight
    // that is supposed to make the damage cap (mountain plate / Striker root) read as
    // the difference between surviving the slam and not. Every 10s, three casts a fight.
    chargedAttack: {
      name: 'Ground Slam', castMs: 2400, cooldownMs: 10000, initialCooldownMs: 4500,
      multiplier: 1.9, fx: 'strong-kick', aoe: { radius: 155 },
    },
    // MOUNTAIN EXAM = "survive the slam". The 50% beat makes the SLAM worse rather
    // than making the boss briefly unkillable: it comes around sooner and lands
    // heavier. The old timed DR shield taught nothing about this encounter, and the
    // slam is the mechanic every later Mountain boss evolves.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'empower-charged', multiplierMult: 1.15, cooldownMult: 0.80 },
        ] },
      ],
    },
  }],

  // SWAMP — ROT / ATTRITION. The direct hit is nothing; the poison and the pool are
  // the fight. The arena is as dangerous as the monster standing in it.
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
    targeting: { prefersPlayers: true },
    // 3 x4 = 12 dps at cap, reached after 3 swings (7.8s) and held there because each
    // landed hit refreshes the whole duration. Was 4 x4 = 16 dps — approved 2026-08-28
    // after live evidence showed poison, not direct hits or Bile Pool, was the fatal
    // pressure in two clean boss fights (Striker died ~31% HP both times, ~38.2s each).
    dotEffect: { debuffId: 'grave-toadeater-poison', label: 'Toad Poison', damagePerStack: 3, maxStacks: 4, tickIntervalMs: 1000, durationMs: 4000 },
    chargedAttack: {
      name: 'Bile Pool', castMs: 1200, cooldownMs: 8500, initialCooldownMs: 4000,
      multiplier: 1.0, fx: 'strong-kick', aoe: { radius: 105 },
      // Effectively permanent (10 min): the rot stays until the Toadeater dies or
      // despawns, so the arena only ever shrinks. No fight is meant to run that long.
      pool: { durationMs: 600000, damagePerTick: 3, tickIntervalMs: 1000, slowSpeedMult: 0.65 },
    },
    // SWAMP EXAM = "survive the rot". At 50% the ROT escalates: pools come around
    // far sooner and sit wider, so the arena keeps shrinking. The boss's own slap is
    // left alone — a swamp boss that suddenly hits hard is a different encounter.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'empower-charged', cooldownMult: 0.60, radiusMult: 1.15 },
        ] },
      ],
    },
  }],

  // CAVE — ENDURANCE / DEFENSIVE EROSION. The longer it lasts, the less armour you
  // have left. Its own bulk buys the time its corrosion needs.
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
    targeting: { prefersPlayers: true },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    appliesPlatingShred: { platingPerStack: 1, maxStacks: 6 },
    // 47 x1.8 = 85, ~47% of an end-of-T1 pool — squarely on the cap-exam anchor in
    // boss-design.md, and deliberately a step below the Behemoth's 106: Caverns is the
    // endurance exam, Mountain is the burst one.
    chargedAttack: {
      name: 'Obsidian Slam', castMs: 1700, cooldownMs: 9500, initialCooldownMs: 4500,
      multiplier: 1.8, fx: 'strong-kick', aoe: { radius: 125 },
    },
    // CAVE EXAM = "your shell erodes". At 50% the corrosion deepens: three more
    // stacks of plating shred, so the back half of the fight is fought in measurably
    // worse armour than the front half. That is the lineage's whole idea, and it
    // replaces the generic timed shield the boss used to gain here.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'empower-shred', maxStacksAdd: 3 },
        ] },
      ],
    },
  }],

  
] satisfies [string, MonsterDefinition][];
