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

export const swampMonsterEntries = [

  // ══ SWAMP — POISON ATTRITION, EXPRESSED FOUR DIFFERENT WAYS ══
  // Low direct damage, heavy DoT; dot-resist + the debt loop is the answer. What
  // changed in the T1-T4 rework is that every mob no longer expresses that the same
  // way. The biome now reads as: pure poison (Ooze), sticking power (Toad), SHELL
  // defense (Snappers), support CURSES (Witch/Hexer), and environmental AMBUSH
  // (Stalker/Lurker).
  //
  // WARNING: current Swamp damage values were called out in playtesting as likely
  // FAR TOO HIGH. Do not treat any number in this file as authoritative; a broad
  // damage retune is expected.
  ['bog-slime', {
    id: 'bog-slime', name: 'Mire Ooze', color: 0x558833,
    // BASELINE POISON ENEMY. Weak direct attack; the stacking poison is the whole
    // threat. No extra mechanic, deliberately.
    stats: { hp: 140, attack: 10, plating: 0, damageReduction: 0, speed: 28, attackRange: 12, attackCooldown: 2000, pullRange: 165 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 5, essenceType: 'purple', level: 1, biomeXp: 35 },
    ai: { wanderRadius: 160, leashRange: 530, idleMinMs: 2000, idleMaxMs: 5500 },
    // Fewer, heavier, faster-ticking stacks than before. The old 4-stack/1500ms poison
    // needed ~6.6s of uninterrupted hits to reach cap, which is longer than the mob
    // lives — the authored sustained DoT was a number players never actually met.
    // 3 stacks at 2000ms cadence caps in ~4s, so the ramp resolves inside a real fight.
    dotEffect: { debuffId: 'swamp-poison', label: 'Poison', damagePerStack: 5, maxStacks: 3, tickIntervalMs: 1000, durationMs: 4000 },
  }],

  ['mud-toad', {
    id: 'mud-toad', name: 'Mud Toad', color: 0x778844,
    // POISON + STICKING POWER. A LIGHTER poison than the Ooze plus a mire-clinging
    // slow on hit, so the answer to Swamp is "cleanse and disengage" and the failure
    // state is being unable to. No further mechanic required.
    stats: { hp: 120, attack: 13, plating: 2, damageReduction: 0, speed: 30, attackRange: 12, attackCooldown: 2200, pullRange: 180 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 6, essenceType: 'purple', level: 1, biomeXp: 42 },
    ai: { wanderRadius: 180, leashRange: 550, idleMinMs: 1800, idleMaxMs: 5000 },
    dotEffect: { debuffId: 'swamp-poison', label: 'Poison', damagePerStack: 4, maxStacks: 3, tickIntervalMs: 1000, durationMs: 4000 },
    // Clinging mire — refreshed on every landed hit, so staying in contact keeps you
    // slowed while the Ooze's poison stacks. Skipped on an evaded hit like every
    // other on-hit rider.
    slowEffect: { speedMult: 0.6, durationMs: 2000 },
  }],

  // ── SWAMP T2 — DoT engines; trivial direct hits, brutal stacking poison ──
  ['swamp-hydra', {
    id: 'swamp-hydra', name: 'Moss-Shell Snapper', color: 0x335533,
    // ARMORED SWAMP ANCHOR. Was "big HP + DR + more poison"; it is now a recognisable
    // SHELL identity: high HP, slow movement, plating as the main defense, generic DR
    // removed, poison de-emphasised.
    // Signature SHELL UP (behavior pass): at a single authored HP threshold (~50%) it
    // retracts — it cannot meaningfully attack or move, and becomes extremely
    // resistant to DIRECT damage. DoTs keep ticking while shelled, which is the out.
    stats: { hp: 340, attack: 24, plating: 6, damageReduction: 0, speed: 28, attackRange: 15, attackCooldown: 2200, pullRange: 185 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 12, essenceType: 'purple', level: 1, biomeXp: 68 },
    ai: { wanderRadius: 170, leashRange: 560, idleMinMs: 2500, idleMaxMs: 7000 },
    // SHELL UP - one authored HP threshold, once per life. It retracts, stops
    // moving and attacking, and direct damage barely scratches it. DoTs keep
    // ticking at full strength, which is the way through.
    // Placeholder numbers - balance pass owns them.
    shellUp: { atHpPct: 0.5, castMs: 500, durationMs: 3500, directDamageMult: 0.15 },
    dotEffect: { debuffId: 'hydra-venom', label: 'Snapper Venom', damagePerStack: 7, maxStacks: 5, tickIntervalMs: 1000, durationMs: 4500 },
  }],

  ['bog-witch', {
    id: 'bog-witch', name: 'Bog Witch', color: 0x884499,
    // RANGED ATTRITION SUPPORT. No longer "another ranged mob stacking poison"
    // (its dotEffect is REMOVED, locked). Its normal attacks are relatively weak;
    // the reason the Witch matters is WITHER — a periodic debuff suppressing the
    // player's Recovery effectiveness (~25-35%, exact value balance-owned).
    stats: { hp: 220, attack: 41, plating: 0, damageReduction: 0, speed: 38, attackRange: 180, attackCooldown: 2200, pullRange: 215 },
    behavior: 'ranged', attackStyle: 'hex', biome: 'swamp',
    rewards: { essence: 11, essenceType: 'purple', level: 1, biomeXp: 62 },
    // WITHER - the reason the Witch matters. A periodic telegraphed hex that
    // suppresses the player's Recovery effectiveness. Its normal attacks stay
    // weak on purpose; this is the whole kit.
    // Multiplier is deliberately ~1: Wither is a debuff, not a damage spike.
    chargedAttack: {
      name: 'Wither', castMs: 1400, cooldownMs: 8000, initialCooldownMs: 0,
      multiplier: 1.0, fx: 'power-shot',
      appliesAntiheal: { reduction: 0.30, durationMs: 9000 },
    },
    ai: { wanderRadius: 200, leashRange: 580, idleMinMs: 1500, idleMaxMs: 4500 },
  }],

  ['mire-stalker', {
    id: 'mire-stalker', name: 'Mire Stalker', color: 0x445533,
    // VENOMOUS AMBUSH PREDATOR. Fast, light, and EVASION is its defensive
    // specialisation — so the generic DR bulk that used to sit on top is removed.
    // Signature: the OPENING BITE after aggro lands MULTIPLE poison stacks at once
    // (normal bite 1, opener ~2); ordinary combat afterwards. It does NOT repeatedly
    // vanish and re-ambush.
    stats: { hp: 275, attack: 46, plating: 0, damageReduction: 0, speed: 75, attackRange: 12, attackCooldown: 2600, pullRange: 155 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 13, essenceType: 'purple', level: 1, biomeXp: 75 },
    ai: { wanderRadius: 500, leashRange: 540, idleMinMs: 450, idleMaxMs: 1200 },
    // Opening bite lands 2 stacks at once; every bite after it lands 1.
    dotEffect: { debuffId: 'stalker-venom', label: 'Stalker Venom', damagePerStack: 4, maxStacks: 4, tickIntervalMs: 1000, durationMs: 2800, openerStacks: 2 },
    evasion: 0.2,
  }],

  // ══════════════════ SWAMP — DoT engines + bulk/regen walls ══════════════════
  // Final tier. Trivial direct hits, brutal stacking DoT that ignores your spacing;
  // bulky/evasive walls. One ranged DoT-kiter. Answer: dot-resist + debt loop.
  ['plague-hydra', {
    id: 'plague-hydra', name: 'Plague-Shell Snapper', color: 0x335533,
    // EVOLVED SHELL ANCHOR. Inherits Shell Up; the evolution is that shelling also
    // CONTAMINATES the surrounding area with a poison cloud/pool.
    // Progression: earlier Snapper shell = defense; later Snapper shell = defense +
    // space denial. Generic DR removed so HP + plating + shell carry the defense.
    stats: { hp: 580, attack: 37, plating: 4, damageReduction: 0, speed: 26, attackRange: 15, attackCooldown: 2200, pullRange: 185 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 65, essenceType: 'purple', level: 3, biomeXp: 390 },
    ai: { wanderRadius: 150, leashRange: 520, idleMinMs: 2800, idleMaxMs: 8000 },
    // SHELL UP, evolved: retracting also CONTAMINATES the ground around it, so the
    // later Snapper's shell is defense AND space denial. Earlier Snapper: shell =
    // defense. Later Snapper: shell = defense + a circle you cannot stand in.
    shellUp: {
      atHpPct: 0.5, castMs: 500, durationMs: 4000, directDamageMult: 0.15,
      pool: { radius: 150, durationMs: 6000, damagePerTick: 12, tickIntervalMs: 1000, slowSpeedMult: 0.7 },
    },
    dotEffect: { debuffId: 'plague-venom', label: 'Plague', damagePerStack: 5, maxStacks: 6, tickIntervalMs: 1000, durationMs: 6000 },
  }],

  ['mire-hex-spitter', {
    // Renamed for lineage continuity (Bog Witch -> Mire Hexer): the locked design
    // makes this the evolved WITCH, and "Hex Spitter" read as a fourth poison mob.
    // The `mire-hex-spitter` ID is unchanged - art, saves and pools all key on it.
    id: 'mire-hex-spitter', name: 'Mire Hexer', color: 0x884499,
    // EVOLVED SWAMP SUPPORT (Witch/Hexer lineage). Inherits WITHER, and adds a
    // periodic hex that REFRESHES/EXTENDS the durations of poison already on the
    // player.
    // WARNING: it does NOT create extra poison stacks (its own dotEffect is removed,
    // locked). It SUPPORTS poison applied by the rest of the biome.
    stats: { hp: 510, attack: 42, plating: 0, damageReduction: 0, speed: 36, attackRange: 200, attackCooldown: 2200, pullRange: 230 },
    behavior: 'kiter', attackStyle: 'hex', biome: 'swamp',
    rewards: { essence: 35, essenceType: 'purple', level: 2, biomeXp: 210 },
    // PLAGUE HEX - inherits Wither and adds the lineage's evolution: it EXTENDS
    // the poison already on the player rather than adding its own.
    // WARNING: creates no stacks and no new DoT. Against a lone Hexer it does
    // nothing at all, which is correct - it is a SUPPORT creature.
    chargedAttack: {
      name: 'Plague Hex', castMs: 1500, cooldownMs: 8000, initialCooldownMs: 0,
      multiplier: 1.0, fx: 'power-shot',
      appliesAntiheal: { reduction: 0.30, durationMs: 9000 },
      refreshesPlayerDots: { extendMs: 3000, maxTotalMs: 12000 },
    },
    ai: { wanderRadius: 200, leashRange: 580, idleMinMs: 1500, idleMaxMs: 4500 },
  }],

  ['bog-lurker', {
    id: 'bog-lurker', name: 'Bog Lurker', color: 0x445533,
    // EVOLVED ENVIRONMENTAL AMBUSHER. Lives and idles INSIDE bog/poison pools,
    // semi-hidden while idle, and does not roam like a normal crocodile — it ERUPTS
    // when the player comes near.
    // Signature opener: the first bite lands a larger multi-stack poison alpha strike
    // (~3 stacks). Ordinary combat afterwards — no pool retreat, no stealth reset.
    // Evasion is its defensive specialisation, so the DR bulk is removed.
    stats: { hp: 490, attack: 43, plating: 0, damageReduction: 0, speed: 30, attackRange: 12, attackCooldown: 2600, pullRange: 155 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 57, essenceType: 'purple', level: 3, biomeXp: 345 },
    // It LIVES in the bog: `idleAnchor` keeps it idling inside the nearest pool
    // instead of roaming past it, so the player meets it by approaching the water.
    idleAnchor: 'swamp-pool',
    ai: { wanderRadius: 160, leashRange: 540, idleMinMs: 2200, idleMaxMs: 6500 },
    evasion: 0.25,
    // Erupting from the pool is a poison ALPHA STRIKE: 3 stacks on the first bite.
    dotEffect: { debuffId: 'lurker-venom', label: 'Lurker Venom', damagePerStack: 5, maxStacks: 5, tickIntervalMs: 1000, durationMs: 4500, openerStacks: 3 },
  }],


] satisfies [string, MonsterDefinition][];
