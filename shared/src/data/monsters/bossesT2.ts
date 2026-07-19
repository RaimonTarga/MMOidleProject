import type { MonsterDefinition } from './types';

// ─────────────────────────────────────────────────────────────────────────
// BOSS REBALANCE — T1 + T2 (Pass 1). Follows boss-design.md.
//
// T1: HP bumped ~1.8x (they read weaker than cave elites). NO phases (T1 = the
//     "pure shape" floor). Slow bosses gain CLEAVE (aoeAttack) so summon-spam
//     can't body-block them — see the anti-summon guardrail in boss-design.md.
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

export const bossMonsterEntriesT2 = [

  // ════════════════════════ T2 BOSSES (+ one phase @50%) ════════════════════════

  // PLAINS — honest big bruiser; phase is the simplest: it just gets angrier.
  ['gorging-razortusk', {
    id: 'gorging-razortusk', name: 'Gorging Razortusk', color: 0xcc9922,
    isBoss: true,
    stats: { hp: 3200, attack: 45, plating: 8, damageReduction: 0.05, speed: 46, attackRange: 15, attackCooldown: 2200, pullRange: 320 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 150, essenceType: 'yellow', level: 5, biomeXp: 225 },
    ai: { wanderRadius: 140, leashRange: 850, idleMinMs: 2000, idleMaxMs: 5500 },
    // PLAINS EXAM = "survive the swarm", T2 escalation: a constant slime trickle plus
    // two phase beats (50% = enrage + slime wave, 25% = a boar pair + more slimes).
    // Adds despawn on boss death. Numbers placeholder — user balance pass.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'enrage', atkMult: 1.30, cdMult: 0.85 },
          { type: 'spawn-adds', monsterTypeId: 'plains-slime', count: 5, offsetRange: 220 },
        ] },
        { hpPct: 0.25, actions: [
          { type: 'spawn-adds', monsterTypeId: 'boar', count: 2, offsetRange: 220 },
          { type: 'spawn-adds', monsterTypeId: 'plains-slime', count: 4, offsetRange: 220 },
        ] },
      ],
      repeating: [
        { intervalMs: 10000, initialDelayMs: 6000, actions: [
          { type: 'spawn-adds', monsterTypeId: 'plains-slime', count: 2, offsetRange: 240 },
        ] },
      ],
    },
  }],

  // FOREST — fast, frequent, frail; phase pushes frequency higher (cd down).
  ['apex-timberclaw', {
    id: 'apex-timberclaw', name: 'Apex Timberclaw', color: 0x226622,
    isBoss: true,
    stats: { hp: 3000, attack: 30, plating: 0, damageReduction: 0, speed: 60, attackRange: 18, attackCooldown: 1500, pullRange: 310 },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 155, essenceType: 'green', level: 5, biomeXp: 232 },
    ai: { wanderRadius: 130, leashRange: 830, idleMinMs: 1200, idleMaxMs: 4000 },
    // FOREST EXAM = "survive the pack", T2 escalation: sustained pack pressure on a
    // timer plus two readable phase beats (50% = enrage + wolf wave, 25% = a lieutenant
    // Dire Wolf joins). Adds despawn on boss death. Numbers placeholder — user pass.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'enrage', atkMult: 1.15, cdMult: 0.70 }, // frequency surge
          { type: 'spawn-adds', monsterTypeId: 'wolf', count: 3, offsetRange: 200 },
        ] },
        { hpPct: 0.25, actions: [
          { type: 'spawn-adds', monsterTypeId: 'ancient-wolf', count: 1, offsetRange: 200 }, // lieutenant
          { type: 'spawn-adds', monsterTypeId: 'wolf', count: 2, offsetRange: 200 },
        ] },
      ],
      repeating: [
        { intervalMs: 12000, initialDelayMs: 8000, actions: [
          { type: 'spawn-adds', monsterTypeId: 'wolf', count: 1, offsetRange: 220 },
        ] },
      ],
    },
  }],

  // MOUNTAIN — flagship burst-check: ~40%-pool slam, slow, charges, reach. Cleaves.
  ['stoneplate-juggernaut', {
    id: 'stoneplate-juggernaut', name: 'Stoneplate Juggernaut', color: 0x667788,
    isBoss: true,
    stats: { hp: 4000, attack: 60, plating: 10, damageReduction: 0.05, speed: 20, attackRange: 72, attackCooldown: 4200, pullRange: 320 },
    behavior: 'melee', attackStyle: 'quake', biome: 'mountain',
    rewards: { essence: 160, essenceType: 'blue', level: 5, biomeXp: 240 },
    ai: { wanderRadius: 120, leashRange: 850, idleMinMs: 3000, idleMaxMs: 7500 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
    // MOUNTAIN EXAM = "break the guarded position", T2 escalation: it calls a pair of
    // Boulder Throwers (ranged behind the frontline) at 50% and periodically digs in
    // (a timed shield) — break the defended position before the ranged grind wins.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'enrage', atkMult: 1.30, cdMult: 0.85 }, // deeper, faster cap-trips
          { type: 'spawn-adds', monsterTypeId: 'peak-archer', count: 2, offsetRange: 240 },
        ] },
      ],
      repeating: [
        { intervalMs: 14000, initialDelayMs: 9000, actions: [
          { type: 'shield', drAdd: 0.25, durationMs: 4000 },
        ] },
      ],
    },
  }],

  // SWAMP — tiny direct, the venom is the fight; phase makes it apply faster. Cleaves.
  ['mire-gorged-behemoth', {
    id: 'mire-gorged-behemoth', name: 'Mire-Gorged Behemoth', color: 0x2a4011,
    isBoss: true,
    stats: { hp: 2700, attack: 18, plating: 6, damageReduction: 0.08, speed: 30, attackRange: 15, attackCooldown: 2800, pullRange: 300 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 155, essenceType: 'purple', level: 5, biomeXp: 232 },
    ai: { wanderRadius: 110, leashRange: 800, idleMinMs: 2500, idleMaxMs: 6000 },
    dotEffect: { debuffId: 'mire-gorged-venom', label: 'Gorged Venom', damagePerStack: 4, maxStacks: 4, tickIntervalMs: 1000, durationMs: 5000 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
    // SWAMP EXAM = "survive the rot", T2 escalation: arena pools + at 50% it stacks
    // venom faster (enrage) AND calls two Mire Hex Spitters (ranged DoT kiters) to
    // grind you through the marsh. Adds despawn on boss death. Numbers placeholder.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'enrage', atkMult: 1.10, cdMult: 0.70 }, // DoT stacks faster
          { type: 'spawn-adds', monsterTypeId: 'mire-hex-spitter', count: 2, offsetRange: 260 },
        ] },
      ],
    },
  }],

  // CAVE — endurance bruiser: high HP, DR + plating, cap-slam, charges. Cleaves.
  ['chitinous-dreadbore', {
    id: 'chitinous-dreadbore', name: 'Chitinous Dreadbore', color: 0x442244,
    isBoss: true,
    stats: { hp: 3500, attack: 65, plating: 12, damageReduction: 0.12, speed: 20, attackRange: 72, attackCooldown: 3600, pullRange: 280 },
    behavior: 'melee', attackStyle: 'quake', biome: 'cave',
    rewards: { essence: 160, essenceType: 'red', level: 5, biomeXp: 240 },
    ai: { wanderRadius: 90, leashRange: 800, idleMinMs: 3000, idleMaxMs: 7500 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
    // CAVE EXAM = "survive the elite", T2 escalation: at 50% it enrages, closes faster,
    // AND a Cave Troll elite joins — now you must outlast two armored brutes. Add
    // despawns on boss death. Numbers placeholder — user balance pass.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'enrage', atkMult: 1.25, cdMult: 0.90 },
          { type: 'stat-buff', stat: 'speed', mult: 1.2 }, // closes faster (permanent)
          { type: 'spawn-adds', monsterTypeId: 'cave-troll', count: 1, offsetRange: 240 },
        ] },
      ],
    },
  }],

  // DESERT (debut T2) — the DUEL exam "win the duel". The Emperor opens with a lethal
  // alpha strike (openingStrike → last-stand answers); at 50% it summons Dust-Djinn
  // painters that paint Sun Mark, and the Emperor's markedStrike cashes the mark for
  // an amplified hit (cleanse the mark or eat it). Keeps its slow. Single-target.
  ['dune-stalker-emperor', {
    id: 'dune-stalker-emperor', name: 'Dune-Stalker Emperor', color: 0xddcc44,
    isBoss: true,
    stats: { hp: 3000, attack: 40, plating: 12, damageReduction: 0.08, speed: 42, attackRange: 40, attackCooldown: 2600, pullRange: 340 },
    behavior: 'melee', attackStyle: 'sandblast', biome: 'desert',
    rewards: { essence: 150, essenceType: 'yellow', level: 5, biomeXp: 225 },
    ai: { wanderRadius: 140, leashRange: 880, idleMinMs: 2000, idleMaxMs: 5500 },
    slowEffect: { speedMult: 0.6, durationMs: 2000 }, // debuff identity
    openingStrike: { multiplier: 2.5 },   // placeholder — user balance pass
    markedStrike: { multiplier: 2.0 },    // placeholder — user balance pass
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'enrage', atkMult: 1.20, cdMult: 0.85 },
          { type: 'stat-buff', stat: 'speed', mult: 1.3 },
          { type: 'spawn-adds', monsterTypeId: 'dust-djinn', count: 2, offsetRange: 280 },
        ] },
      ],
    },
  }],

  // JUNGLE (debut T2) — fast, frequent, squishy (plating stripped); phase = frequency
  // storm + chase. ECOLOGY exam "survive the ambush": opens with a pounce (openingStrike
  // → damage-cap answers), and at 50% the pack leaps from the thickets (spawn-adds:
  // snakes + an ape) so the ambush identity carries into the boss room. Adds are
  // lone mobs (createMonster), not packs — no recursion. Single-target.
  ['jungle-dread-gorger', {
    id: 'jungle-dread-gorger', name: 'Jungle Dread-Gorger', color: 0x117722,
    isBoss: true,
    stats: { hp: 2900, attack: 40, plating: 0, damageReduction: 0.03, speed: 56, attackRange: 18, attackCooldown: 2400, pullRange: 320 },
    behavior: 'melee', attackStyle: 'slash', biome: 'jungle',
    rewards: { essence: 145, essenceType: 'green', level: 5, biomeXp: 218 },
    ai: { wanderRadius: 150, leashRange: 840, idleMinMs: 1800, idleMaxMs: 4500 },
    openingStrike: { multiplier: 2.5 },   // placeholder — user balance pass
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'enrage', atkMult: 1.10, cdMult: 0.70 },
          { type: 'stat-buff', stat: 'speed', mult: 1.35 },
          { type: 'spawn-adds', monsterTypeId: 'jungle-snake', count: 2, offsetRange: 260 },
          { type: 'spawn-adds', monsterTypeId: 'jungle-ape', count: 1, offsetRange: 260 },
        ] },
      ],
    },
  }],
] satisfies [string, MonsterDefinition][];
