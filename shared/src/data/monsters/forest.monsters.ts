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
// PLATING RULE SUPERSEDED (progression rework, 2026-10-01, PROVISIONAL): plains and
// forest used to carry NO plating/DR at all ("fast weapons shred them — intended").
// A family's `punishes` field is now a contract, and flat `plating` is the only stat
// that punishes Tempo (`packets.ts`: "weak against fortified plating"), so Plains Herd
// and Forest Grove — both Tempo-punishing — must carry some. They still carry NO %DR,
// so fast weapons still shred them; see monster-proposals-run3.md §1/§4.
// CAVE elites carry DR/plating (where slow/piercing weapons earn keep).
//
// Rewards / ai wander+leash / colors / ids kept as-is. A few NAMES no longer
// match their refactored shape (flagged inline) — rename in the cosmetic pass.
// Advanced biomes (jungle/tundra/desert/volcanic) are DEFERRED below, untouched.
// ─────────────────────────────────────────────────────────────────────────

export const forestMonsterEntries = [
  // ══ FOREST — fast movement + FREQUENT attacks; low per-hit; evasion's home ══
  ['forest-slime', {
    id: 'forest-slime', name: 'Moss Rat', color: 0x55ff55,
    // Attacks faster than its plains cousin — frequency over force.
    // Deliberately a plain stat block: T1 is the introductory tier and Forest's
    // texture comes from the wolf pack, so the filler stays readable and simple.
    // GROVE FAMILY (progression rework, 2026-10-01, PROVISIONAL): plating 0 -> 4.
    // Grove declares `punishes: 'tempo'` and flat plating is the only stat that
    // punishes Tempo; the Grove is the only Forest family whose shape is "stand and
    // absorb". The superseded squishy-biome no-plating rule is in the file banner.
    // T1 ENTRY PRESSURE (2026-10-02, PROVISIONAL): pullRange 600 -> 300. 600 was the
    // widest notice radius of any T1 body — an eighth of a 4800px node — so a Moss Rat
    // reliably walked into a wolf-pack fight that was already three-on-one. 300 still
    // leaves it the most alert thing in the Grove. attack/hp/plating unchanged.
    stats: { hp: 160, attack: 17, plating: 4, damageReduction: 0, speed: 54, attackRange: 12, attackCooldown: 1400, pullRange: 300 },
    behavior: 'melee', attackStyle: 'gnaw', biome: 'forest',
    rewards: { essence: 3, essenceType: 'green', level: 1, biomeXp: 18 },
    ai: { wanderRadius: 230, leashRange: 1200, idleMinMs: 1200, idleMaxMs: 4000 },
  }],

  ['wolf', {
    id: 'wolf', name: 'Wolf', color: 0xaaaacc,
    // Fast baseline speed IS the anti-kite — no charge needed. Frequent light bites.
    // T1 ENTRY PRESSURE (2026-10-02, PROVISIONAL): pullRange 476 -> 320. The pack's
    // MEMBERSHIP is already inside the 2-3 band (one alpha + two young = three bodies,
    // below), so the fix here is chaining, not size: at 476 a second alpha noticed the
    // player mid-fight and the engagement became six wolves. attack/hp/evasion stand.
    stats: { hp: 130, attack: 20, plating: 0, damageReduction: 0, speed: 82, attackRange: 12, attackCooldown: 1100, pullRange: 320 },
    behavior: 'melee', attackStyle: 'bite', biome: 'forest',
    rewards: { essence: 4, essenceType: 'green', level: 1, biomeXp: 25 },
    // PACK FAMILY (progression rework, 2026-10-01, PROVISIONAL): evasion unset -> 0.12.
    // Pack declares `punishes: 'empowered'` and evasion is the one stat that punishes
    // it — a multiplied hit that misses is the entire punishment. A wolf dodging one
    // swing in eight is the Pack's own fiction, and 0.12 is the gentlest evasion in
    // the game (mire-stalker 0.20, bog-lurker 0.25), well under the 0.25 ceiling.
    evasion: 0.12,
    ai: { wanderRadius: 290, leashRange: 1360, idleMinMs: 700, idleMaxMs: 2800 },
    // Forest predator-pack ALPHA: a roaming adult wolf spawns with two young wolves
    // and calls them onto anything it engages.
    pack: { role: 'alpha', followRadius: 90, followers: [{ typeId: 'young-wolf', count: 2 }] },
  }],

  ['young-wolf', {
    id: 'young-wolf', name: 'Young Wolf', color: 0xaaaacc,
    // Uses the wolf sprite for now. Slightly smaller/softer than the adult alpha,
    // but still fast enough that the pack reads as one moving threat.
    // T1 ENTRY PRESSURE (2026-10-02, PROVISIONAL): pullRange 434 -> 300, kept a step
    // under its alpha's 320 so a follower never drags a pack into a fight its alpha
    // has not noticed.
    stats: { hp: 70, attack: 14, plating: 0, damageReduction: 0, speed: 86, attackRange: 12, attackCooldown: 1150, pullRange: 300 },
    behavior: 'melee', attackStyle: 'bite', biome: 'forest',
    rewards: { essence: 2, essenceType: 'green', level: 1, biomeXp: 12 },
    ai: { wanderRadius: 260, leashRange: 1240, idleMinMs: 700, idleMaxMs: 2800 },
    pack: { role: 'follower' },
  }],


  ['bramble-pod', {
    id: 'bramble-pod', name: 'Bramble Pod', color: 0x6b4a2e,
    // CANOPY FAMILY, T1 (progression rework, 2026-10-01). The Thorn Spitter's
    // younger kin: a rooted bramble that lobs sap-thorns from range. Weak direct
    // hits, a light Bramble Sap poison that stacks — the family's shard is
    // Affliction because stacks are both what it does and what kills it.
    // PLACEHOLDER numbers seeded from the T1 Forest band (wolf 130/20); designer
    // hand-edits before the lane bench.
    stats: { hp: 140, attack: 14, plating: 0, damageReduction: 0, speed: 30, attackRange: 160, attackCooldown: 2600, pullRange: 230 },
    behavior: 'ranged', attackStyle: 'arrow', biome: 'forest',
    rewards: { essence: 4, essenceType: 'green', level: 1, biomeXp: 24 },
    ai: { wanderRadius: 140, leashRange: 520, idleMinMs: 1500, idleMaxMs: 4000 },
    dotEffect: { debuffId: 'bramble-sap', label: 'Bramble Sap', damagePerStack: 2, maxStacks: 3, tickIntervalMs: 1000, durationMs: 4000 },
  }],

  // ── FOREST T2 — fast charger, a frantic frequent-attacker, a ranged thorn ──
  ['ancient-wolf', {
    id: 'ancient-wolf', name: 'Dire Wolf', color: 0x8888ff,
    // Explosive fast charger; closes instantly then bites in a blur.
    stats: { hp: 1575, attack: 22, plating: 0, damageReduction: 0, speed: 96, attackRange: 12, attackCooldown: 1100, pullRange: 196 },
    behavior: 'melee', attackStyle: 'bite', biome: 'forest',
    rewards: { essence: 8, essenceType: 'green', level: 1, biomeXp: 45 },
    ai: { wanderRadius: 300, leashRange: 750, idleMinMs: 600, idleMaxMs: 2500 },
    chargeOnAggro: { speedMult: 3.0, durationMs: 900 },
    castedAttackSpeedBuff: {
      name: 'Howl', castMs: 1500, cooldownMs: 12000, initialCooldownMs: 0,
      effectId: 'monster-howl-haste', attackSpeedPct: 0.5, durationMs: 5000,
      target: 'nearby-monsters', radius: 320, castWhileOutOfRange: true, fx: 'howl',
    },
    // Forest predator-pack ALPHA (the biome's T2 identity): a PURE wolf pack —
    // the evolved Wolf leading a larger litter. The mixed wolf+Thorn-Spitter pack
    // was rejected in the T1–T4 monster rework: a ranged support creature in a
    // predator pack read as neither. Baseline 3; 4 is acceptable later if the
    // balance pass supports it.
    pack: {
      role: 'alpha', followRadius: 90,
      followers: [
        { typeId: 'dire-whelp', count: 3 },
      ],
    },
  }],

  ['dire-whelp', {
    id: 'dire-whelp', name: 'Dire Whelp', color: 0x8899bb,
    // T2 PACK FOLLOWER. Never in a spawn pool — it exists only as the litter behind a
    // Dire Wolf, exactly as `young-wolf` sits behind the T1 Wolf.
    //
    // WHY IT EXISTS: `ancient-wolf` (T2) used to call 3x `young-wolf`, which is the T1
    // Wolf's follower. The two tiers shared one monster, so nothing in T2 Forest could
    // be retuned without silently moving T1 Forest with it.
    stats: { hp: 155, attack: 14, plating: 0, damageReduction: 0, speed: 90, attackRange: 12, attackCooldown: 1150, pullRange: 179 },
    behavior: 'melee', attackStyle: 'bite', biome: 'forest',
    rewards: { essence: 3, essenceType: 'green', level: 1, biomeXp: 20 },
    ai: { wanderRadius: 260, leashRange: 720, idleMinMs: 700, idleMaxMs: 2800 },
    pack: { role: 'follower' },
  }],

  ['ironwood-golem', {
    id: 'ironwood-golem', name: 'Ironclaw Badger', color: 0x556633,
    // SHAPE CHANGED: no longer a DR tank (off-identity for forest). Now a slow-
    // moving but VERY fast-ATTACKING territorial beast — frequency is the threat
    // evasion answers; squishy (no DR) so it still dies to burst.
    stats: { hp: 945, attack: 25, plating: 0, damageReduction: 0, speed: 22, attackRange: 15, attackCooldown: 900, pullRange: 150 },
    behavior: 'melee', attackStyle: 'claws-light', biome: 'forest',
    rewards: { essence: 10, essenceType: 'green', level: 1, biomeXp: 58 },
    ai: { wanderRadius: 120, leashRange: 480, idleMinMs: 2500, idleMaxMs: 7000 },
  }],

  ['canopy-sprite', {
    id: 'canopy-sprite', name: 'Thorn Spitter', color: 0x88ff44,
    // RANGED FOREST PRESSURE. Signature: a PERIODIC BURST VOLLEY — every 3rd attack
    // fires a second thorn in quick succession, so the Spitter reads as bursts from
    // the treetops rather than a metronome.
    // Deliberately NOT a generic root/slow support creature (locked).
    stats: { hp: 300, attack: 31, plating: 0, damageReduction: 0, speed: 48, attackRange: 190, attackCooldown: 2400, pullRange: 250 },
    behavior: 'ranged', attackStyle: 'arrow', biome: 'forest',
    rewards: { essence: 9, essenceType: 'green', level: 1, biomeXp: 50 },
    // Three hasted attacks are tracked as visible Barrage charges.
    castedAttackSpeedBuff: {
      name: 'Barrage', castMs: 1000, cooldownMs: 8000, initialCooldownMs: 3000,
      effectId: 'thorn-spitter-barrage', attackSpeedPct: 2, attacks: 3,
      target: 'self', fx: 'barrage',
    },
    ai: { wanderRadius: 240, leashRange: 650, idleMinMs: 1200, idleMaxMs: 3500 },
    // NO pack role: the Dire Wolf pack is pure wolves now, so nothing ever spawns
    // a Spitter as a follower and the role was inert. Thorn Spitter is Forest's
    // solo ranged pressure — its identity is the burst volley, not pack support.
  }],

] satisfies [string, MonsterDefinition][];
