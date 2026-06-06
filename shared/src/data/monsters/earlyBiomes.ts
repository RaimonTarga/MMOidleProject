import type { MonsterDefinition } from './types';

// ─────────────────────────────────────────────────────────────────────────
// MONSTER REFACTOR — starter biomes (Plains/Forest/Mountain/Swamp/Cave), T1+T2.
//
// Core fix (diagnosed problem: every biome was the same fast/tank/ranged trio,
// recolored, so no biome taught its own mitigation). Each starter biome now
// expresses ONE dominant damage-SHAPE matched to its armor's mitigation:
//
//   PLAINS    swarm of small fast hits      -> answered by PLATING (flat subtract)
//   FOREST    fast, FREQUENT attacks         -> answered by EVASION (flat %, scales w/ hit count)
//   MOUNTAIN  rare, HUGE hits (trip the cap) -> answered by DAMAGE-CAP
//   SWAMP     low direct dmg, heavy DoT       -> answered by DOT-RESIST (+ debt loop)
//   CAVE      few ELITE, MIXED shapes         -> answered by %DR (the universal mitigation)
//
// Tuned against player-power-curve §7: T1 ~HP90 / H_med~12, T2 ~HP200 / H_med~23.
// MOUNTAIN/CAVE big-hitters deliberately exceed the generic trash H_big so they
// reach the damage cap (≈25% of player maxHP: ~40-50 at T1, ~55-70 at T2).
//
// CHARGE = closes the gap for SLOW big-hitters (anti-kite for the ponderous).
// HIGH BASE SPEED = the fast-ambusher identity. RANGED = anti-kite from afar.
// Squishy biomes (plains/forest) carry NO plating/DR (fast weapons shred them —
// intended); CAVE elites carry DR/plating (where slow/piercing weapons earn keep).
//
// Rewards / ai wander+leash / colors / ids kept as-is. A few NAMES no longer
// match their refactored shape (flagged inline) — rename in the cosmetic pass.
// Advanced biomes (jungle/tundra/desert/volcanic) are DEFERRED below, untouched.
// ─────────────────────────────────────────────────────────────────────────

export const earlyBiomeMonsterEntries = [
  // ══ PLAINS — swarm of small, fast, low-per-hit mobs; volume is the threat ══
  ['plains-slime', {
    id: 'plains-slime', name: 'Plains Slime', color: 0xddee55,
    // Swarm filler. Tiny hits that plating eats to nothing; dangerous only in numbers.
    stats: { hp: 50, attack: 9, plating: 0, damageReduction: 0, speed: 46, attackRange: 12, attackCooldown: 2000, pullRange: 190 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 3, essenceType: 'yellow', level: 1, biomeXp: 10 },
    ai: { wanderRadius: 250, leashRange: 640, idleMinMs: 1200, idleMaxMs: 4000 },
  }],

  ['boar', {
    id: 'boar', name: 'Boar', color: 0xcc8844,
    // Swarm-catcher: charges in so the player can't simply walk away from the pack.
    stats: { hp: 80, attack: 12, plating: 0, damageReduction: 0, speed: 50, attackRange: 12, attackCooldown: 1900, pullRange: 205 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 5, essenceType: 'yellow', level: 1, biomeXp: 18 },
    ai: { wanderRadius: 260, leashRange: 660, idleMinMs: 1000, idleMaxMs: 3500 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
  }],

  // ══ FOREST — fast movement + FREQUENT attacks; low per-hit; evasion's home ══
  ['forest-slime', {
    id: 'forest-slime', name: 'Forest Slime', color: 0x55ff55,
    // Attacks faster than its plains cousin — frequency over force.
    stats: { hp: 60, attack: 9, plating: 0, damageReduction: 0, speed: 54, attackRange: 12, attackCooldown: 1500, pullRange: 210 },
    behavior: 'melee', attackStyle: 'impact', biome: 'forest',
    rewards: { essence: 5, essenceType: 'green', level: 1, biomeXp: 18 },
    ai: { wanderRadius: 230, leashRange: 620, idleMinMs: 1200, idleMaxMs: 4000 },
  }],

  ['wolf', {
    id: 'wolf', name: 'Wolf', color: 0xaaaacc,
    // Fast baseline speed IS the anti-kite — no charge needed. Frequent light bites.
    stats: { hp: 60, attack: 11, plating: 0, damageReduction: 0, speed: 82, attackRange: 12, attackCooldown: 1200, pullRange: 255 },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 7, essenceType: 'green', level: 1, biomeXp: 25 },
    ai: { wanderRadius: 290, leashRange: 720, idleMinMs: 700, idleMaxMs: 2800 },
  }],

  // ══ MOUNTAIN — rare HUGE hits that trip the cap; slow + charge to connect ══
  ['cliff-hopper', {
    id: 'cliff-hopper', name: 'Cliff Hopper', color: 0x99aacc,
    // SHAPE CHANGED: now a slow charging bruiser (atk trips the ~25%-HP cap), not a
    // fast mob. Charges once to close, then lumbers. TODO rename in cosmetic pass.
    stats: { hp: 170, attack: 36, plating: 0, damageReduction: 0, speed: 28, attackRange: 12, attackCooldown: 3500, pullRange: 275 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 12, essenceType: 'blue', level: 1, biomeXp: 42 },
    ai: { wanderRadius: 200, leashRange: 640, idleMinMs: 1500, idleMaxMs: 4500 },
    chargeOnAggro: { speedMult: 3.0, durationMs: 1200 },
  }],

  ['ridge-archer', {
    id: 'ridge-archer', name: 'Ridge Archer', color: 0x778899,
    // Hurls boulders — a big, slow hit from range. Punishes standing still; the
    // ranged half of mountain's "stand and trade" pressure. No charge (ranged).
    stats: { hp: 200, attack: 32, plating: 0, damageReduction: 0, speed: 26, attackRange: 210, attackCooldown: 3500, pullRange: 350 },
    behavior: 'melee', attackStyle: 'gunshot', isRanged: true, biome: 'mountain',
    rewards: { essence: 15, essenceType: 'blue', level: 1, biomeXp: 52 },
    ai: { wanderRadius: 210, leashRange: 600, idleMinMs: 1500, idleMaxMs: 4500 },
  }],

  // ══ SWAMP — low DIRECT damage, heavy DoT; dot-resist + debt is the answer ══
  // (Per request: base attack lowered, DoT raised — same-ish DPS, DoT-weighted.)
  ['bog-slime', {
    id: 'bog-slime', name: 'Bog Slime', color: 0x558833,
    // A weak slap, but the toxin does the real work over time.
    stats: { hp: 110, attack: 4, plating: 0, damageReduction: 0, speed: 28, attackRange: 12, attackCooldown: 2200, pullRange: 165 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 10, essenceType: 'purple', level: 1, biomeXp: 35 },
    ai: { wanderRadius: 160, leashRange: 530, idleMinMs: 2000, idleMaxMs: 5500 },
    dotEffect: { damagePerStack: 3, maxStacks: 4, tickIntervalMs: 1000, durationMs: 2400 },
  }],

  ['mud-toad', {
    id: 'mud-toad', name: 'Mud Toad', color: 0x778844,
    // Sturdier; a feeble strike but a deeper, faster-stacking poison.
    stats: { hp: 145, attack: 5, plating: 2, damageReduction: 0, speed: 30, attackRange: 12, attackCooldown: 2400, pullRange: 180 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 12, essenceType: 'purple', level: 1, biomeXp: 42 },
    ai: { wanderRadius: 180, leashRange: 550, idleMinMs: 1800, idleMaxMs: 5000 },
    dotEffect: { damagePerStack: 4, maxStacks: 4, tickIntervalMs: 1000, durationMs: 2600 },
  }],

  // ══ CAVE — few ELITE mobs, MIXED shapes (fast + bruiser); %DR answers all ══
  // Cave is the intended exception: variety is the point, and the universal
  // answer is flat %DR. Cave elites carry DR/plating — slow/piercing weapons
  // earn their keep here (unlike the squishy plains/forest mobs).
  ['cave-lurker', {
    id: 'cave-lurker', name: 'Cave Lurker', color: 0x664466,
    // The fast elite of the pair — quick, armored a little, relentless.
    stats: { hp: 200, attack: 14, plating: 4, damageReduction: 0.05, speed: 60, attackRange: 12, attackCooldown: 1400, pullRange: 220 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 20, essenceType: 'red', level: 1, biomeXp: 70 },
    ai: { wanderRadius: 200, leashRange: 560, idleMinMs: 2000, idleMaxMs: 6000 },
  }],

  ['cave-brute', {
    id: 'cave-brute', name: 'Cave Brute', color: 0x443344,
    // The bruiser elite — a cap-tripping slam, slow, charges to connect, and
    // armored enough that fast weapons don't trivially shred it.
    stats: { hp: 350, attack: 40, plating: 2, damageReduction: 0.10, speed: 18, attackRange: 12, attackCooldown: 3800, pullRange: 145 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 26, essenceType: 'red', level: 1, biomeXp: 90 },
    ai: { wanderRadius: 130, leashRange: 460, idleMinMs: 3000, idleMaxMs: 8000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
  }],

  // ══════════════════════ TIER 2 ══════════════════════

  // ── PLAINS T2 — bigger swarm: a pack runner, a charger, a ranged poke ──
  ['prairie-wolf', {
    id: 'prairie-wolf', name: 'Prairie Wolf', color: 0xddaa55,
    // Fastest plains mob; high base speed is its anti-kite. Glassy, low per-hit.
    stats: { hp: 100, attack: 15, plating: 0, damageReduction: 0, speed: 92, attackRange: 12, attackCooldown: 1200, pullRange: 275 },
    behavior: 'melee', attackStyle: 'slash', biome: 'plains',
    rewards: { essence: 12, essenceType: 'yellow', level: 1, biomeXp: 35 },
    ai: { wanderRadius: 290, leashRange: 720, idleMinMs: 700, idleMaxMs: 2800 },
  }],

  ['stampede-bull', {
    id: 'stampede-bull', name: 'Stampede Bull', color: 0xdd5500,
    // Swarm-catcher charger; thick hide gives a little DR but hits stay modest.
    stats: { hp: 150, attack: 20, plating: 0, damageReduction: 0.05, speed: 62, attackRange: 12, attackCooldown: 1700, pullRange: 235 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 14, essenceType: 'yellow', level: 1, biomeXp: 40 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 800, idleMaxMs: 3000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
  }],

  ['savanna-hawk', {
    id: 'savanna-hawk', name: 'Savanna Hawk', color: 0xddcc66,
    // Ranged poke — pecks from distance, the anti-kite-from-afar of the plains.
    stats: { hp: 90, attack: 17, plating: 0, damageReduction: 0, speed: 50, attackRange: 165, attackCooldown: 2400, pullRange: 245 },
    behavior: 'melee', attackStyle: 'slash', isRanged: true, biome: 'plains',
    rewards: { essence: 13, essenceType: 'yellow', level: 1, biomeXp: 38 },
    ai: { wanderRadius: 280, leashRange: 680, idleMinMs: 1000, idleMaxMs: 3200 },
  }],

  // ── FOREST T2 — fast charger, a frantic frequent-attacker, a ranged thorn ──
  ['ancient-wolf', {
    id: 'ancient-wolf', name: 'Ancient Wolf', color: 0x8888ff,
    // Explosive fast charger; closes instantly then bites in a blur.
    stats: { hp: 165, attack: 20, plating: 0, damageReduction: 0, speed: 96, attackRange: 12, attackCooldown: 1100, pullRange: 280 },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 16, essenceType: 'green', level: 1, biomeXp: 45 },
    ai: { wanderRadius: 300, leashRange: 750, idleMinMs: 600, idleMaxMs: 2500 },
    chargeOnAggro: { speedMult: 3.0, durationMs: 900 },
  }],

  ['ironwood-golem', {
    id: 'ironwood-golem', name: 'Ironwood Golem', color: 0x556633,
    // SHAPE CHANGED: no longer a DR tank (off-identity for forest). Now a slow-
    // moving but VERY fast-ATTACKING sentinel — frequency is the threat evasion
    // answers; squishy (no DR) so it still dies to burst. TODO rename.
    stats: { hp: 150, attack: 15, plating: 0, damageReduction: 0, speed: 22, attackRange: 15, attackCooldown: 900, pullRange: 150 },
    behavior: 'melee', attackStyle: 'impact', biome: 'forest',
    rewards: { essence: 20, essenceType: 'green', level: 1, biomeXp: 58 },
    ai: { wanderRadius: 120, leashRange: 480, idleMinMs: 2500, idleMaxMs: 7000 },
  }],

  ['canopy-sprite', {
    id: 'canopy-sprite', name: 'Canopy Sprite', color: 0x88ff44,
    // Ranged thorn-volleys; frequent, light, from the treetops.
    stats: { hp: 140, attack: 18, plating: 0, damageReduction: 0, speed: 48, attackRange: 190, attackCooldown: 2400, pullRange: 250 },
    behavior: 'melee', attackStyle: 'gunshot', isRanged: true, biome: 'forest',
    rewards: { essence: 17, essenceType: 'green', level: 1, biomeXp: 50 },
    ai: { wanderRadius: 240, leashRange: 650, idleMinMs: 1200, idleMaxMs: 3500 },
  }],

  // ── MOUNTAIN T2 — everything hits like a truck and trips the cap ──
  ['granite-titan', {
    id: 'granite-titan', name: 'Granite Titan', color: 0x99aabb,
    // The flagship cap-tripper: a slow, charging slam well over 25% of player HP.
    // No DR — it's a glass cannon you survive via the cap, not a sponge.
    stats: { hp: 350, attack: 70, plating: 0, damageReduction: 0, speed: 18, attackRange: 15, attackCooldown: 3800, pullRange: 160 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 28, essenceType: 'blue', level: 1, biomeXp: 80 },
    ai: { wanderRadius: 110, leashRange: 460, idleMinMs: 3500, idleMaxMs: 9000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
  }],

  ['stone-eagle', {
    id: 'stone-eagle', name: 'Stone Eagle', color: 0xccdde8,
    // REBALANCED: was a fast low-hitter. Now a swooping dive-bomber — faster than
    // the titan but still a heavy hit; the charge IS the dive.
    stats: { hp: 240, attack: 50, plating: 0, damageReduction: 0, speed: 40, attackRange: 12, attackCooldown: 2800, pullRange: 285 },
    behavior: 'melee', attackStyle: 'slash', biome: 'mountain',
    rewards: { essence: 24, essenceType: 'blue', level: 1, biomeXp: 68 },
    ai: { wanderRadius: 320, leashRange: 800, idleMinMs: 500, idleMaxMs: 2000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
  }],

  ['peak-archer', {
    id: 'peak-archer', name: 'Peak Archer', color: 0xaabbcc,
    // Ranged cap-tripper — a devastating boulder from extreme range; stand still
    // and a single shot can carve a quarter of your HP. No charge (ranged).
    stats: { hp: 280, attack: 60, plating: 0, damageReduction: 0, speed: 28, attackRange: 240, attackCooldown: 3500, pullRange: 265 },
    behavior: 'melee', attackStyle: 'gunshot', isRanged: true, biome: 'mountain',
    rewards: { essence: 26, essenceType: 'blue', level: 1, biomeXp: 75 },
    ai: { wanderRadius: 200, leashRange: 600, idleMinMs: 2000, idleMaxMs: 5000 },
  }],

  // ── SWAMP T2 — DoT engines; trivial direct hits, brutal stacking poison ──
  ['swamp-hydra', {
    id: 'swamp-hydra', name: 'Swamp Hydra', color: 0x335533,
    // Multi-headed DoT engine; lives long enough to stack poison deep. Direct
    // bite is almost nothing — the venom is the whole fight.
    stats: { hp: 320, attack: 8, plating: 0, damageReduction: 0.10, speed: 28, attackRange: 15, attackCooldown: 2200, pullRange: 185 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 24, essenceType: 'purple', level: 1, biomeXp: 68 },
    ai: { wanderRadius: 170, leashRange: 560, idleMinMs: 2500, idleMaxMs: 7000 },
    dotEffect: { damagePerStack: 8, maxStacks: 5, tickIntervalMs: 1000, durationMs: 2400 },
  }],

  ['bog-witch', {
    id: 'bog-witch', name: 'Bog Witch', color: 0x884499,
    // Ranged curse — flings a weak hex that festers; the DoT poke of the marsh.
    stats: { hp: 180, attack: 10, plating: 0, damageReduction: 0.05, speed: 38, attackRange: 180, attackCooldown: 2200, pullRange: 215 },
    behavior: 'melee', attackStyle: 'magic', isRanged: true, biome: 'swamp',
    rewards: { essence: 22, essenceType: 'purple', level: 1, biomeXp: 62 },
    ai: { wanderRadius: 200, leashRange: 580, idleMinMs: 1500, idleMaxMs: 4500 },
    dotEffect: { damagePerStack: 6, maxStacks: 4, tickIntervalMs: 1000, durationMs: 2400 },
  }],

  ['mire-stalker', {
    id: 'mire-stalker', name: 'Mire Stalker', color: 0x445533,
    // Ambush venom-hunter; light touch, heavy toxin, and it dodges some blows.
    stats: { hp: 280, attack: 7, plating: 0, damageReduction: 0.12, speed: 32, attackRange: 12, attackCooldown: 2600, pullRange: 155 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 26, essenceType: 'purple', level: 1, biomeXp: 75 },
    ai: { wanderRadius: 170, leashRange: 540, idleMinMs: 2000, idleMaxMs: 6000 },
    dotEffect: { damagePerStack: 6, maxStacks: 4, tickIntervalMs: 1000, durationMs: 2800 },
    evadeEvery: 5,
  }],

  // ── CAVE T2 — three distinct ELITE shapes: fast/dodgy, bruiser, ranged ──
  ['giant-spider', {
    id: 'giant-spider', name: 'Giant Spider', color: 0x992266,
    // Fast ambush hunter; DR hide + evasion make it slippery, plus a little venom.
    stats: { hp: 360, attack: 22, plating: 0, damageReduction: 0.08, speed: 72, attackRange: 12, attackCooldown: 1800, pullRange: 220 },
    behavior: 'melee', attackStyle: 'poison', biome: 'cave',
    rewards: { essence: 30, essenceType: 'red', level: 1, biomeXp: 85 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 800, idleMaxMs: 3200 },
    evadeEvery: 5,
    dotEffect: { damagePerStack: 6, maxStacks: 3, tickIntervalMs: 1000, durationMs: 2000 },
  }],

  ['cave-troll', {
    id: 'cave-troll', name: 'Cave Troll', color: 0x334433,
    // Colossal slow bruiser; cap-tripping slam, charges to close, heavy DR + plating.
    // The elite where slow/piercing weapons pay off.
    stats: { hp: 640, attack: 65, plating: 4, damageReduction: 0.15, speed: 15, attackRange: 15, attackCooldown: 3600, pullRange: 150 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 45, essenceType: 'red', level: 1, biomeXp: 145 },
    ai: { wanderRadius: 130, leashRange: 470, idleMinMs: 3000, idleMaxMs: 8500 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
  }],

  ['cave-gargoyle', {
    id: 'cave-gargoyle', name: 'Cave Gargoyle', color: 0x554455,
    // Ranged elite — hurls stalactites from its perch; armored and patient.
    stats: { hp: 430, attack: 32, plating: 3, damageReduction: 0.10, speed: 22, attackRange: 200, attackCooldown: 3200, pullRange: 185 },
    behavior: 'melee', attackStyle: 'gunshot', isRanged: true, biome: 'cave',
    rewards: { essence: 35, essenceType: 'red', level: 1, biomeXp: 100 },
    ai: { wanderRadius: 130, leashRange: 460, idleMinMs: 2500, idleMaxMs: 7000 },
  }],

    // ══ JUNGLE T2 — fast, frequent, evasive swarm (Forest successor) ══
  ['jungle-snake', {
    id: 'jungle-snake', name: 'Jungle Snake', color: 0x33cc44,
    // The frantic frequent-attacker: low per-hit but strikes constantly (frequency
    // is what evasion answers), plus a light creeping venom. Squishy, very fast.
    stats: { hp: 150, attack: 16, plating: 0, damageReduction: 0, speed: 76, attackRange: 12, attackCooldown: 1100, pullRange: 270 },
    behavior: 'melee', attackStyle: 'poison', biome: 'jungle',
    rewards: { essence: 14, essenceType: 'green', level: 1, biomeXp: 38 },
    ai: { wanderRadius: 290, leashRange: 740, idleMinMs: 600, idleMaxMs: 2600 },
    dotEffect: { damagePerStack: 6, maxStacks: 3, tickIntervalMs: 1000, durationMs: 1500 },
  }],
 
  ['jungle-ape', {
    id: 'jungle-ape', name: 'Jungle Ape', color: 0xaa6633,
    // Fast charging bruiser — closes the gap, hits a bit harder. DR removed: Jungle
    // is the evasion biome (squishy like Forest), not a DR biome.
    stats: { hp: 190, attack: 26, plating: 0, damageReduction: 0, speed: 62, attackRange: 12, attackCooldown: 1700, pullRange: 240 },
    behavior: 'melee', attackStyle: 'impact', biome: 'jungle',
    rewards: { essence: 16, essenceType: 'green', level: 1, biomeXp: 44 },
    ai: { wanderRadius: 250, leashRange: 660, idleMinMs: 1000, idleMaxMs: 3800 },
    chargeOnAggro: { speedMult: 2.8, durationMs: 1000 },
  }],
 
  ['jungle-blowdarter', {
    id: 'jungle-blowdarter', name: 'Jungle Blowdarter', color: 0x55bb44,
    // Re-added: Jungle's ranged poke (its Canopy-Sprite analog). Hidden in foliage,
    // spits poisoned darts — frequent light hits + DoT from range. Squishy.
    stats: { hp: 140, attack: 16, plating: 0, damageReduction: 0, speed: 48, attackRange: 190, attackCooldown: 1900, pullRange: 250 },
    behavior: 'melee', attackStyle: 'poison', isRanged: true, biome: 'jungle',
    rewards: { essence: 14, essenceType: 'green', level: 1, biomeXp: 38 },
    ai: { wanderRadius: 250, leashRange: 660, idleMinMs: 1200, idleMaxMs: 4000 },
    dotEffect: { damagePerStack: 6, maxStacks: 4, tickIntervalMs: 1000, durationMs: 2100 },
  }],
 
  // ══ DESERT T2 — debuff/slow/root appliers; lockdown is the threat ══
  ['sand-scorpion', {
    id: 'sand-scorpion', name: 'Sand Scorpion', color: 0xddbb44,
    // Fast slow-applier: a sting that saps your speed (speedMult 0.5) so the rest
    // of the pack can keep up with you. Light DR. The mobile debuffer.
    stats: { hp: 170, attack: 20, plating: 0, damageReduction: 0.08, speed: 52, attackRange: 12, attackCooldown: 2000, pullRange: 210 },
    behavior: 'melee', attackStyle: 'poison', biome: 'desert',
    rewards: { essence: 14, essenceType: 'yellow', level: 1, biomeXp: 40 },
    ai: { wanderRadius: 240, leashRange: 640, idleMinMs: 1500, idleMaxMs: 4500 },
    slowEffect: { speedMult: 0.5, durationMs: 2500 },
  }],
 
  ['stone-basilisk', {
    id: 'stone-basilisk', name: 'Stone Basilisk', color: 0xaa8833,
    // Root bruiser: a petrifying gaze briefly pins you in place (speedMult 0) — the
    // lockdown setup that lets the scorpions and djinn pile on. Slow, sturdier DR.
    stats: { hp: 260, attack: 26, plating: 0, damageReduction: 0.12, speed: 28, attackRange: 12, attackCooldown: 2600, pullRange: 175 },
    behavior: 'melee', attackStyle: 'impact', biome: 'desert',
    rewards: { essence: 17, essenceType: 'yellow', level: 1, biomeXp: 46 },
    ai: { wanderRadius: 180, leashRange: 560, idleMinMs: 2000, idleMaxMs: 5500 },
    slowEffect: { speedMult: 0, durationMs: 1200 },
  }],
 
  ['dust-djinn', {
    id: 'dust-djinn', name: 'Dust Djinn', color: 0xeecc66,
    // Desert's ranged debuffer (Sand-Scorpion's reach version): flings stinging
    // sand that slows from afar. Stationary ranged at T2 — becomes the standoff
    // kiter (Sandweaver) at T3. Light DR.
    stats: { hp: 150, attack: 22, plating: 0, damageReduction: 0.05, speed: 40, attackRange: 185, attackCooldown: 2100, pullRange: 230 },
    behavior: 'melee', attackStyle: 'magic', isRanged: true, biome: 'desert',
    rewards: { essence: 16, essenceType: 'yellow', level: 1, biomeXp: 42 },
    ai: { wanderRadius: 220, leashRange: 620, idleMinMs: 1200, idleMaxMs: 4000 },
    slowEffect: { speedMult: 0.6, durationMs: 2000 },
  }],


] satisfies [string, MonsterDefinition][];