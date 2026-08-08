import type { MonsterDefinition } from './types';

// ══════════════════════════════════════════════════════════════════════════
// GRAVEYARD — EXTREME high density · PLAGUE DoT · undead swarm
// Threat is DoT accumulation from overwhelming numbers, not per-hit size.
// Per-hit runs low; the SUM of 5–10 simultaneous attackers + stacking DoT is
// lethal. Answer: dot-resist + hit-to-dot armor, regen-burst charm.
// Anti-Far: raw speed + density. No kiters (the swarm IS the threat).
// ══════════════════════════════════════════════════════════════════════════
export const graveyardMonsterEntries = [


  ['bone-crawler', {
    id: 'bone-crawler', name: 'Bone Crawler', color: 0x886688,
    // Swarm backbone. Fast, low individual HP, disease DoT every hit. The threat
    // is 8 of them at once. DPS 54 × (1000/1200) = 45 each (× the pack).
    stats: { hp: 520, attack: 54, plating: 0, damageReduction: 0, speed: 78, attackRange: 12, attackCooldown: 1200, pullRange: 290 },
    behavior: 'melee', attackStyle: 'poison', biome: 'graveyard',
    rewards: { essence: 30, essenceType: 'purple', level: 3, biomeXp: 180 },
    ai: { wanderRadius: 330, leashRange: 820, idleMinMs: 600, idleMaxMs: 2500 },
    dotEffect: { debuffId: 'bone-rot', label: 'Bone Rot', damagePerStack: 6, maxStacks: 5, tickIntervalMs: 1000, durationMs: 2000 },
  }],

  ['plague-hound', {
    id: 'plague-hound', name: 'Plague Hound', color: 0x664466,
    // Fast charging runner: closes instantly, spreads heavy disease DoT. Keeps
    // the pressure constant. DPS 76 × (1000/1500) = 51 + strong DoT.
    stats: { hp: 800, attack: 76, plating: 0, damageReduction: 0, speed: 70, attackRange: 12, attackCooldown: 1500, pullRange: 270 },
    behavior: 'melee', attackStyle: 'poison', biome: 'graveyard',
    rewards: { essence: 50, essenceType: 'purple', level: 3, biomeXp: 300 },
    ai: { wanderRadius: 290, leashRange: 750, idleMinMs: 700, idleMaxMs: 3000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 900 },
    dotEffect: { debuffId: 'hound-plague', label: 'Hound Plague', damagePerStack: 8, maxStacks: 5, tickIntervalMs: 1100, durationMs: 2500 },
    // Its ruptured carcass leaves a short-lived toxic denial circle. Placeholder
    // values â€” the balance pass owns damage, footprint, and lifetime.
    onDeath: {
      spawnHazard: {
        kind: 'toxic-pool', radius: 78, durationMs: 6000,
        damagePerTick: 18, tickIntervalMs: 1000, slowSpeedMult: 0.7,
      },
    },
  }],

  ['carrion-vulture', {
    id: 'carrion-vulture', name: 'Carrion Vulture', color: 0x996699,
    // Ranged contagion-lobber: stationary, fires disease projectiles from afar.
    // Background DoT while the swarm engages. DPS 64 × (1000/1700) = 38 + DoT.
    stats: { hp: 680, attack: 64, plating: 0, damageReduction: 0, speed: 46, attackRange: 200, attackCooldown: 1700, pullRange: 260 },
    behavior: 'ranged', attackStyle: 'poison', biome: 'graveyard',
    rewards: { essence: 40, essenceType: 'purple', level: 3, biomeXp: 240 },
    ai: { wanderRadius: 240, leashRange: 650, idleMinMs: 1200, idleMaxMs: 4000 },
    dotEffect: { debuffId: 'carrion-blight', label: 'Carrion Blight', damagePerStack: 7, maxStacks: 5, tickIntervalMs: 1000, durationMs: 2200 },
  }],

  ['charnel-brute', {
    id: 'charnel-brute', name: 'Charnel Brute', color: 0x553355,
    // Bone amalgam hulk — a shambling mass of many beasts' fused bones.
    // Slow bone-armored anchor. CADENCE every 4 = a 216 necrotic slam + massive
    // DoT burst. Heavy plating (16) rewards Rupture/pierce. The swarm's anchor.
    // avg/attack (3·90+216)/4 = 121.5 → ×(1000/3200) = 38 + DoT.
    stats: { hp: 1800, attack: 90, plating: 16, damageReduction: 0.08, speed: 18, attackRange: 15, attackCooldown: 3200, pullRange: 155 },
    behavior: 'melee', attackStyle: 'poison', biome: 'graveyard',
    rewards: { essence: 160, essenceType: 'purple', level: 4, biomeXp: 960 },
    ai: { wanderRadius: 110, leashRange: 460, idleMinMs: 4000, idleMaxMs: 11000 },
    cadenceFinisher: { everyNAttacks: 4, multiplier: 2.4 },   // 216
    dotEffect: { debuffId: 'charnel-decay', label: 'Decay', damagePerStack: 10, maxStacks: 5, tickIntervalMs: 1000, durationMs: 3500 },
    // Killing the swarm's anchor sends a short necrotic surge through nearby undead.
    // Placeholder values â€” the balance pass owns radius, duration, and cap.
    onDeath: { empowerAllies: { radius: 220, damagePct: 0.12, durationMs: 6000, maxStacks: 3 } },
  }],

  ['gravewright', {
    id: 'gravewright', name: 'Gravewright', color: 0xbb88cc,
    // Skeletal shaman-elk (undead stag whose antlers drip plague-light — no zombies,
    // no humanoids: the wasteland is all undead BEASTS).
    // ELITE backline NECROMANCER — the graveyard rework's centerpiece. Hangs back and
    // RAISES UNDEAD on a timer (capped at 4 alive); its risen dead CRUMBLE the instant
    // it dies (rewards.ts despawns tracked spawn-adds), so killing it stems the tide.
    // Squishy + ranged → reachable and dies fast once you commit. Yellow elite outline;
    // the `focus-elites` rune (taught by the graveyard recipe) is the intended counter.
    stats: { hp: 720, attack: 40, plating: 0, damageReduction: 0, speed: 40, attackRange: 200, attackCooldown: 1900, pullRange: 300 },
    behavior: 'ranged', attackStyle: 'magic', biome: 'graveyard',
    elite: true,
    rewards: { essence: 70, essenceType: 'purple', level: 3, biomeXp: 420 },
    ai: { wanderRadius: 200, leashRange: 640, idleMinMs: 1500, idleMaxMs: 4500 },
    dotEffect: { debuffId: 'grave-curse', label: 'Grave Curse', damagePerStack: 6, maxStacks: 4, tickIntervalMs: 1000, durationMs: 2500 },
    bossScript: {
      repeating: [
        // Raise undead every 5s, capped at 4 living (the cap = no flood). Placeholder
        // numbers — user balance pass (Step 15) owns rate/count/cap vs base density.
        { intervalMs: 5000, initialDelayMs: 2500, actions: [{ type: 'spawn-adds', monsterTypeId: 'plague-rat', count: 2, offsetRange: 180, maxAlive: 4 }] },
      ],
    },
  }],

  ['plague-rat', {
    id: 'plague-rat', name: 'Bone Rat', color: 0xaa88aa,
    // Ultra-fast trivial filler — the overwhelming-density unit. Individually
    // nothing; in packs of 8+ the tick-fast attacks make evasion-rate matter and
    // the cumulative DoT compounds fast. DPS 46 × (1000/950) = 48.
    stats: { hp: 400, attack: 46, plating: 0, damageReduction: 0, speed: 92, attackRange: 12, attackCooldown: 950, pullRange: 310 },
    behavior: 'melee', attackStyle: 'poison', biome: 'graveyard',
    rewards: { essence: 22, essenceType: 'purple', level: 3, biomeXp: 130 },
    ai: { wanderRadius: 360, leashRange: 860, idleMinMs: 400, idleMaxMs: 2000 },
    dotEffect: { debuffId: 'rat-plague', label: 'Rat Plague', damagePerStack: 6, maxStacks: 3, tickIntervalMs: 1000, durationMs: 1800 },
  }],

] satisfies [string, MonsterDefinition][];
