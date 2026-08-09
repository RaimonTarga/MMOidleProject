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

// ═════════════════════════════════════════════════════════════════════════
// DESERT — CONTROLLER / DEALER PAIRS (Biome Ecology Pass 2, Session 4).
//
// The old desert was three independent debuff-appliers plus a Sun Mark
// mark/finisher duel. It has been re-authored into ONE readable relationship:
//
//   CONTROLLER (pack alpha)  — the basilisk line. High HP, LOW offense, roots
//                              you in place, and from T3 SUNDERS you
//                              (`appliesVulnerability`: +damage TAKEN from every
//                              source). It barely scratches you itself. It is a
//                              force multiplier, not a threat.
//   DEALER (pack follower)   — the scarab line. Low HP, fast, `kiter`, HIGH
//                              damage. It never lets you close, and every shot it
//                              lands is scaled by whatever the controller stacked.
//   HARASSER (solo)          — the scorpion line. Unchanged: the fast roamer that
//                              catches you when you disengage from the pair.
//
// The exam is a TARGET-PRIORITY test, which is what the biome was missing:
//   • Burst the squishy dealer and the controller is a harmless rock.
//   • Kill the controller instead and the dealers SCATTER — `onPackAlphaDead`
//     removes surviving followers with NO rewards. Fast, but you leave essence
//     on the sand. That trade is deliberate, not a bug.
//   • Or answer the debuffs directly: cleanse strips `sundered`, debuff-resist
//     shortens the root.
//
// Sun Mark is GONE from every desert trash mob (locked decision 3). The engine
// survives on the T2 boss, which now paints its own mark instead of relying on
// Dust-Djinn adds it may never get to summon.
//
// ⚠ EVERY NUMBER BELOW IS A PLACEHOLDER — user balance pass. The stat SHAPES
// (controller HP↑/attack↓, dealer HP↓/attack↑/speed↑) are the authored intent;
// the magnitudes are not. Note desert `mobDensity` is 8, so one controller pull
// (alpha + 2 dealers) is already ~⅜ of a node's population.
// ═════════════════════════════════════════════════════════════════════════

export const desertMonsterEntries = [

  // ══ DESERT T2 — the pair, taught plain: root + kite, no sundering yet ══
  ['sand-scorpion', {
    id: 'sand-scorpion', name: 'Sand Scorpion', color: 0xddbb44,
    // HARASSER (solo, no pack). Fast slow-applier: a sting that saps your speed so
    // you cannot simply walk out of the pair's engagement. Light DR.
    stats: { hp: 220, attack: 32, plating: 0, damageReduction: 0.08, speed: 52, attackRange: 12, attackCooldown: 2000, pullRange: 210 },
    behavior: 'melee', attackStyle: 'poison', biome: 'desert',
    rewards: { essence: 7, essenceType: 'yellow', level: 1, biomeXp: 40 },
    ai: { wanderRadius: 240, leashRange: 640, idleMinMs: 1500, idleMaxMs: 4500 },
    slowEffect: { speedMult: 0.5, durationMs: 2500 },
  }],

  ['stone-basilisk', {
    id: 'stone-basilisk', name: 'Stone Basilisk', color: 0xaa8833,
    // CONTROLLER (T2 pack alpha). A petrifying gaze pins you (speedMult 0) while
    // its scarabs plink you from the standoff. Sturdy, slow, and deliberately
    // feeble on offense — the root is the entire weapon. T2 is the teaching tier:
    // the pair only, no sundering (that arrives at T3).
    stats: { hp: 420, attack: 20, plating: 0, damageReduction: 0.15, speed: 26, attackRange: 12, attackCooldown: 2800, pullRange: 190 },
    behavior: 'melee', attackStyle: 'impact', biome: 'desert',
    rewards: { essence: 8, essenceType: 'yellow', level: 1, biomeXp: 46 },
    ai: { wanderRadius: 180, leashRange: 560, idleMinMs: 2000, idleMaxMs: 5500 },
    slowEffect: { speedMult: 0, durationMs: 1200 },
    pack: { role: 'alpha', callRange: 340, followers: [{ typeId: 'dust-djinn', count: 2 }] },
  }],

  ['dust-djinn', {
    id: 'dust-djinn', name: 'Sun Scarab', color: 0xeecc66,
    // DEALER (T2 pack follower). Scarab line T2: a sacred sun-beetle whose amber
    // bolts sting and slow from the standoff. Now a KITER from its debut (it was a
    // stationary ranged mob) so the pair reads the same at every tier: the thing
    // you cannot catch is the thing hurting you. Squishy — burst it and the
    // engagement collapses. Roams solo when not spawned in a controller's pack.
    stats: { hp: 150, attack: 46, plating: 0, damageReduction: 0, speed: 52, attackRange: 190, attackCooldown: 1900, pullRange: 230 },
    behavior: 'kiter', attackStyle: 'magic', biome: 'desert',
    rewards: { essence: 8, essenceType: 'yellow', level: 1, biomeXp: 42 },
    ai: { wanderRadius: 220, leashRange: 620, idleMinMs: 1200, idleMaxMs: 4000 },
    slowEffect: { speedMult: 0.6, durationMs: 2000 },
    pack: { role: 'follower', callRange: 320 },
  }],

  // ══ DESERT T3 — the same pair, now with SUNDERING on the controller ══
  // 2nd tier. The anti-Close biome: kiters you can't catch + a controller that
  // roots you and makes their shots land harder. Answer: target priority first,
  // then debuff-resist + cleanse + last-stand armor.
  ['dune-stalker', {
    id: 'dune-stalker', name: 'Dune Stalker', color: 0xddbb44,
    // HARASSER (solo). Scorpion line T3 (bigger sand scorpion; role-name kept).
    // Fast slow-applier: lands a debuff that catches Far, then keeps pace.
    stats: { hp: 520, attack: 38, plating: 0, damageReduction: 0.08, speed: 56, attackRange: 12, attackCooldown: 2000, pullRange: 210 },
    behavior: 'melee', attackStyle: 'poison', biome: 'desert',
    rewards: { essence: 30, essenceType: 'yellow', level: 2, biomeXp: 180 },
    ai: { wanderRadius: 240, leashRange: 640, idleMinMs: 1500, idleMaxMs: 4500 },
    slowEffect: { speedMult: 0.5, durationMs: 2500 },
  }],

  ['desert-basilisk', {
    id: 'desert-basilisk', name: 'Desert Basilisk', color: 0xaa8833,
    // CONTROLLER (T3 pack alpha). Root plus the tier's new lesson: every gaze
    // SUNDERS you (+8% damage taken per stack, 4 stacks) so the Gilded Scarabs
    // behind it hit for up to +32%. Still almost harmless on its own — the danger
    // is entirely what it does to someone else's damage.
    stats: { hp: 900, attack: 26, plating: 0, damageReduction: 0.15, speed: 26, attackRange: 12, attackCooldown: 2800, pullRange: 190 },
    behavior: 'melee', attackStyle: 'impact', biome: 'desert',
    rewards: { essence: 45, essenceType: 'yellow', level: 2, biomeXp: 270 },
    ai: { wanderRadius: 180, leashRange: 560, idleMinMs: 2000, idleMaxMs: 5500 },
    slowEffect: { speedMult: 0, durationMs: 1200 },
    appliesVulnerability: { damageTakenPct: 0.08, maxStacks: 4, durationMs: 4000 },
    pack: { role: 'alpha', callRange: 340, followers: [{ typeId: 'sandweaver', count: 2 }] },
  }],

  ['sandweaver', {
    id: 'sandweaver', name: 'Gilded Scarab', color: 0xcc9933,
    // DEALER (T3 pack follower). THE kiter: maintains standoff, plinks hard, and
    // slows you so you can't close. Pure anti-Close — Close/melee suffers most
    // here; Mid/Far shine. Very squishy: it dies fast IF you can reach it.
    stats: { hp: 340, attack: 62, plating: 0, damageReduction: 0, speed: 52, attackRange: 220, attackCooldown: 1900, pullRange: 250 },
    behavior: 'kiter', attackStyle: 'magic', biome: 'desert',
    rewards: { essence: 47, essenceType: 'yellow', level: 2, biomeXp: 285 },
    ai: { wanderRadius: 220, leashRange: 640, idleMinMs: 1200, idleMaxMs: 4000 },
    slowEffect: { speedMult: 0.6, durationMs: 2000 },
    pack: { role: 'follower', callRange: 320 },
  }],

  // ══ DESERT T4 — two controllers: the sundering specialist and the apex ══

  ['sand-viper', {
    id: 'sand-viper', name: 'Sand Viper', color: 0xddaa33,
    // HARASSER (solo). Fast debuffer: a heavy movement slow so the pair can pile
    // on. Catches Far builds that try to kite out. DPS 78 × (1000/1600) = 49 + slow.
    stats: { hp: 980, attack: 78, plating: 0, damageReduction: 0.08, speed: 60, attackRange: 12, attackCooldown: 1600, pullRange: 230 },
    behavior: 'melee', attackStyle: 'poison', biome: 'desert',
    rewards: { essence: 55, essenceType: 'yellow', level: 3, biomeXp: 330 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 1500, idleMaxMs: 4500 },
    slowEffect: { speedMult: 0.45, durationMs: 3000 },
  }],

  ['dune-basilisk', {
    id: 'dune-basilisk', name: 'Dune Basilisk', color: 0xaa8833,
    // CONTROLLER (T4 pack alpha) — the SUNDERING SPECIALIST. The deepest sunder in
    // the game (+10%/stack, 4 stacks = +40% damage taken) on top of a full root,
    // paired with Sunshield Scarabs whose shields make them slow to burst down.
    // Its own damage stays negligible: the entire threat is the multiplier.
    stats: { hp: 1900, attack: 40, plating: 10, damageReduction: 0.14, speed: 26, attackRange: 15, attackCooldown: 3000, pullRange: 190 },
    behavior: 'melee', attackStyle: 'impact', biome: 'desert',
    rewards: { essence: 100, essenceType: 'yellow', level: 4, biomeXp: 600 },
    ai: { wanderRadius: 170, leashRange: 560, idleMinMs: 2500, idleMaxMs: 7000 },
    slowEffect: { speedMult: 0, durationMs: 1400 },
    appliesVulnerability: { damageTakenPct: 0.10, maxStacks: 4, durationMs: 4500 },
    pack: { role: 'alpha', callRange: 340, followers: [{ typeId: 'sandspitter-cobra', count: 2 }] },
  }],

  ['sandspitter-cobra', {
    id: 'sandspitter-cobra', name: 'Sunshield Scarab', color: 0xeecc66,
    // DEALER (T4 pack follower). Scarab line T4 apex: ranged KITER + ENEMY SHIELD
    // (its carapace flares). Anti-Close — chasing it eats slowed hits. The shield
    // rewards the alpha-strike weapon: a first-strike burst tears the barrier
    // before the sunder stacks bite. The one dealer you cannot trivially delete.
    stats: { hp: 720, attack: 112, plating: 0, damageReduction: 0, speed: 54, attackRange: 230, attackCooldown: 1900, pullRange: 280 },
    behavior: 'kiter', attackStyle: 'magic', biome: 'desert',
    rewards: { essence: 58, essenceType: 'yellow', level: 3, biomeXp: 350 },
    ai: { wanderRadius: 240, leashRange: 660, idleMinMs: 1200, idleMaxMs: 4000 },
    slowEffect: { speedMult: 0.6, durationMs: 2500 },
    enemyShield: { shieldPct: 0.22, intervalMs: 12000, durationMs: 6000 },
    pack: { role: 'follower', callRange: 320 },
  }],

  ['dune-tyrant', {
    id: 'dune-tyrant', name: 'Dune Tyrant', color: 0xcc9922,
    // APEX CONTROLLER (T4 elite pack alpha). Colossal emperor scorpion — mob echo
    // of the royal boss ladder. Inverts the controller trade: a LIGHT sunder
    // (+6%/stack, 3 stacks) but a real weapon behind it — a pincer smash every 10s
    // that lands INTO its own sundering, straight at the damage cap. The Desert
    // exam: cleanse the sunder, or last-stand the slam, or delete its scarabs and
    // fight a lone slow rock.
    stats: { hp: 2200, attack: 88, plating: 8, damageReduction: 0.08, speed: 20, attackRange: 15, attackCooldown: 3500, pullRange: 160 },
    behavior: 'melee', attackStyle: 'impact', biome: 'desert', elite: true,
    rewards: { essence: 170, essenceType: 'yellow', level: 4, biomeXp: 1020 },
    ai: { wanderRadius: 100, leashRange: 450, idleMinMs: 4500, idleMaxMs: 12000 },
    empoweredCooldown: { cooldownMs: 10000, multiplier: 2.8 },  // 246
    slowEffect: { speedMult: 0.4, durationMs: 4000 },
    appliesVulnerability: { damageTakenPct: 0.06, maxStacks: 3, durationMs: 5000 },
    pack: { role: 'alpha', callRange: 340, followers: [{ typeId: 'sandspitter-cobra', count: 2 }] },
  }],


] satisfies [string, MonsterDefinition][];
