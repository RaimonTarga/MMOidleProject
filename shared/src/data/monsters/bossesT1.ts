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
    // of its own encounter.
    //
    // POST-DEFENSE-REWORK NERF (2026-09-26): attack 34->26 and a thinner swarm (below).
    // The fight was priced against the old ~14-plating Plains vest, which floored a
    // 12-damage slime to 1; the rework left that vest at 3 plating, so each slime hit
    // lands ~7 and the swarm half of the fight roughly doubled. Measured on the T1
    // boss lab (server/scripts/_t1BossLab.ts): Striker went 0/875 builds, and only
    // kiting Slingers won reliably.
    stats: { hp: 1700, attack: 26, plating: 4, damageReduction: 0.02, speed: 50, attackRange: 15, attackCooldown: 2000, pullRange: 280 },
    behavior: 'melee', attackStyle: 'gore', biome: 'plains',
    rewards: { essence: 100, essenceType: 'yellow', level: 5, biomeXp: 150 },
    ai: { wanderRadius: 120, leashRange: 750, idleMinMs: 1500, idleMaxMs: 4500 },
    targeting: { prefersPlayers: true },
    // PLAINS EXAM = "survive the swarm". T1 teaches the pure identity: a trickle of
    // reinforcements, and one 50% RALLY where the razorback calls a wave and drives
    // the whole herd faster. The old self-enrage is gone on purpose — Plains
    // escalates by CONCURRENCY, never by the boss becoming a better duellist.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'cast', castMs: 2000, label: 'Rallying Cry', castFx: 'roar', actions: [
            // 2026-09-26: 4 slimes + a boar (maxAlive 6) -> 2 slimes (maxAlive 4), no boar.
            { type: 'spawn-adds', monsterTypeId: 'plains-slime', count: 2, maxAlive: 4, offsetRange: 220 },
            { type: 'roar', attackSpeedPct: 0.20, durationMs: 8000, radius: 320 },
          ] },
        ] },
      ],
      // The swarm is HALF this encounter's output. The adds keep their authored
      // stats (plains-slime is a Plains anchor monster); the trickle is thinned
      // instead: 2 every 10s (maxAlive 5) -> 1 every 12s (maxAlive 3), 2026-09-26.
      repeating: [
        { intervalMs: 12_000, initialDelayMs: 4_000, actions: [
          { type: 'cast', castMs: 2000, label: 'Rallying Cry', castFx: 'roar', actions: [
            { type: 'spawn-adds', monsterTypeId: 'plains-slime', count: 1, maxAlive: 3, offsetRange: 220 },
          ] },
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
    //
    // POST-DEFENSE-REWORK NERF (2026-09-26): attack 24->18. The plating cliff above
    // is gone (the rework left end-of-T1 plating at 0-6), so each claw now lands
    // ~16 instead of ~10, and the fight went 0/5250 on the T1 boss lab across every
    // class and build. At 18, every class's best build wins; 19 leaves Spirit on a
    // knife-edge and 20 is mostly losses. DO NOT answer this boss with a Frenzy
    // stack cap: players die before 4 stacks, and a capped boss stops spending
    // 1.5s of every 6s casting, so a cap made the fight HARDER on the bench.
    stats: { hp: 1800, attack: 18, plating: 0, damageReduction: 0, speed: 60, attackRange: 15, attackCooldown: 1900, pullRange: 300 },
    behavior: 'melee', attackStyle: 'bear-claws', biome: 'forest',
    rewards: { essence: 100, essenceType: 'green', level: 5, biomeXp: 150 },
    ai: { wanderRadius: 160, leashRange: 800, idleMinMs: 1200, idleMaxMs: 4000 },
    targeting: { prefersPlayers: true },
    consecutiveHits: 2,
    // FOREST EXAM = a clean claw duel. Every swing is a two-hit bear-claw combo.
    // Bestial Frenzy replaces the invisible cadence ramp: every 6 seconds it takes
    // a readable 1.5s cast, then permanently gains another 20% attack-speed and
    // 10% movement-speed stack with no stack cap.
    bossScript: {
      repeating: [
        { intervalMs: 6000, initialDelayMs: 5000, actions: [
          { type: 'cast', castMs: 1500, label: 'Bestial Frenzy', fx: 'frenzy', actions: [
            { type: 'stat-buff', stat: 'attackSpeed', mult: 1.20, moveSpeedMult: 1.10, label: 'bestial-frenzy' },
          ] },
        ] },
      ],
    },
  }],

  // MOUNTAIN — TELEGRAPHED CATASTROPHIC IMPACT. One enormous readable hit, and the
  // whole fight is whether you can answer it. Everything else is deliberately plain.
  ['crag-behemoth', {
    id: 'crag-behemoth', name: 'Crag Behemoth', color: 0x8899bb,
    isBoss: true,
    stats: { hp: 2100, attack: 56, plating: 0, damageReduction: 0, speed: 22, attackRange: 18, attackCooldown: 3500, pullRange: 280 },
    behavior: 'melee', attackStyle: 'quake', biome: 'mountain',
    rewards: { essence: 105, essenceType: 'blue', level: 5, biomeXp: 158 },
    ai: { wanderRadius: 120, leashRange: 750, idleMinMs: 2000, idleMaxMs: 5000 },
    targeting: { prefersPlayers: true },
    // `chargeOnAggro` REMOVED with the 2026-09-04 encounter redesign: a speed burst
    // on aggro is not a charge, it just made the opening seconds unreadable, and the
    // lineage's actual committed charge is the cast below.
    // 56 x1.9 = 106 — the tier's biggest single hit, ~55-60% of an end-of-T1 pool.
    // Above the 40-50% anchor in boss-design.md on purpose: this is the one T1 fight
    // that is supposed to make the damage cap (mountain plate / Striker root) read as
    // the difference between surviving the impact and not. Every 10s, three a fight.
    //
    // MOUNTAIN'S LINEAGE PRIMITIVE, as an ORDERED PATTERN. The circular Ground Slam
    // it replaces asked the same question the Cave slam already asks ("leave the
    // circle"); Mountain's is "read a DIRECTION, get off the line, then punish".
    // Damage, cast and cooldown are all carried over untouched — only the shape of
    // the answer changed. halfWidth 78 keeps the lane the same width as the old
    // circle was wide, so the ground it denies is unchanged.
    //
    // The sequence is the whole encounter: wind-up (tracking, then committed) →
    // the boss actually RUNS the lane → a pronounced recovery it can be punished in.
    // Every later Mountain tier deepens this same spine rather than adding a
    // separate mechanic on top.
    bossPattern: {
      chargeInstinct: { speedPct: 0.30, castReductionPct: 0.30, minCastMs: 400 },
      id: 'crag-charge', name: 'Crag Charge',
      damageMultiplier: 1.9, cooldownMs: 10000, initialCooldownMs: 4500,
      steps: [
        { kind: 'cast', name: 'Crag Charge', castMs: 2400, fx: 'charge-lane',
          lane: { length: 620, halfWidth: 78, lockAtCastPct: 0.5 } },
        // 620px at 470px/s ≈ 1.3s of travel; maxTravelMs is the obstruction guard.
        { kind: 'charge', speed: 470, maxTravelMs: 2000 },
        { kind: 'recovery', label: 'Winded', durationMs: 1000 },
      ],
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
    rewards: { essence: 100, essenceType: 'purple', level: 5, biomeXp: 150 },
    ai: { wanderRadius: 100, leashRange: 700, idleMinMs: 2000, idleMaxMs: 5500 },
    targeting: { prefersPlayers: true },
    // 3 x4 = 12 dps at cap, reached after 3 swings (7.8s) and held there because each
    // landed hit refreshes the whole duration. Was 4 x4 = 16 dps — approved 2026-08-28
    // after live evidence showed poison, not direct hits or Bile Pool, was the fatal
    // pressure in two clean boss fights (Striker died ~31% HP both times, ~38.2s each).
    // 2026-09-27: 3 -> 2 when DoTs went back to paying half of player DR (win rate held).
    dotEffect: { debuffId: 'grave-toadeater-poison', label: 'Toad Poison', damagePerStack: 2, maxStacks: 4, tickIntervalMs: 1000, durationMs: 7000 },
    chargedAttack: {
      name: 'Bile Pool', castMs: 1200, cooldownMs: 8500, initialCooldownMs: 4000,
      multiplier: 1.0, fx: 'bile-spew', aoe: { radius: 105, impactFx: 'pool-spawn' },
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

  // CAVE — THE BURROWER. Read the mound, leave the circle — or drag it up.
  ['obsidian-broodmother', {
    id: 'obsidian-broodmother', name: 'Obsidian Broodmother', color: 0x334455,
    isBoss: true,
    // Lowest raw HP of the five and still the hardest to chew through: plating 6 + 10%
    // DR give it by far the tier's widest armour spread, so a fast chip build meets
    // several times the effective HP a heavy hitter does. That is the endurance exam.
    stats: { hp: 1750, attack: 40, plating: 6, damageReduction: 0.10, speed: 24, attackRange: 18, attackCooldown: 2800, pullRange: 240 },
    behavior: 'melee', attackStyle: 'quake', biome: 'cave',
    rewards: { essence: 110, essenceType: 'red', level: 5, biomeXp: 165 },
    ai: { wanderRadius: 80, leashRange: 680, idleMinMs: 2500, idleMaxMs: 6500 },
    targeting: { prefersPlayers: true },
    // CAVE T1 (boss-lineage redesign 2026-09-27): THE BURROWER, moved down from T2.
    // Burrow -> a visible mound travels toward you -> it surfaces and erupts.
    // The lesson: read the mound, leave the circle.
    //
    // The mound is TARGETABLE: enough damage on it drags the boss up early,
    // STAGGERED (the stun tell), and the eruption fizzles — the damage answer, like
    // the Mountain plate. Slow shortens its travel. Stepping out of the circle, or
    // Guarding it, are always answers.
    //
    // CUT: Breach and plating shred (the designer disliked erosion-as-plating; the
    // lineage's erosion is now a damage-taken debuff from T2's sinkholes).
    bossPattern: {
      id: 'brood-emergence', name: 'Burrow',
      damageMultiplier: 1.6, cooldownMs: 10000, initialCooldownMs: 4500,
      stoppedBy: {
        damage: { pctMaxHp: 0.07, staggerMs: 2500, label: 'Dragged Up' },
      },
      steps: [
        { kind: 'cast', name: 'Burrow', castMs: 700, fx: 'burrow', guardable: false },
        { kind: 'conceal', name: 'Burrowed', marker: 'burrow', durationMs: 3200, burst: { mult: 2.2, ms: 900 },
          relocate: 'near-target', emergeGap: 0, travelSpeed: 340, targetable: true,
          feint: { retreatToPx: 420, untilPct: 0.30 }, surfacesOnContact: true },
        // Escapable from dead centre at T1 (130px against a 1.2s tell at 120px/s):
        // the entry lesson is to read it and walk out.
        { kind: 'impact', name: 'Eruption', anchor: 'self', radius: 130,
          damageMult: 1.0, telegraphMs: 1200, fx: 'deep-core-eruption' },
        { kind: 'recovery', label: 'Surfaced', durationMs: 1000 },
      ],
    },
    // One gentle escalation: it burrows more often in the back half.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'empower-charged', cooldownMult: 0.80 },
        ] },
      ],
    },
  }],

  
] satisfies [string, MonsterDefinition][];
