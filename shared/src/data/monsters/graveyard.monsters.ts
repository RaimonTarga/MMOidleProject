import type { MonsterDefinition } from './types';

// ══════════════════════════════════════════════════════════════════════════
// WASTELAND (legacy id `graveyard`) — CORPSES AND NECROMANCY
//
// The identity is NOT universal plague (T1–T4 rework, locked — nearly every mob
// used to carry a `dotEffect`, which made the whole roster one monster). It is:
//
//     DEATH DOES NOT CLEANLY REMOVE ENEMIES FROM THE ENCOUNTER.
//
// Combat persists through corpses, resurrection, and SELECTIVE death effects:
//   • basic bodies (Bone Crawler, Bone Rat) have NO death effect — they are
//     corpse fodder, and the corpse is the point;
//   • the Plague Hound is the ONE dedicated plague creature (DoT + death pool);
//   • the Gravewright raises the player's own kills;
//   • the Carrion Vulture EMPOWERS nearby undead instead of applying DoT.
//
// ⚠ RECURSION RULE (enforced in server/src/systems/world/corpses.ts): risen mobs
// never record a reusable corpse, so corpse→raise→kill→corpse can never loop.
// Density: moderate/moderately-high, NOT another extreme swarm.
// ══════════════════════════════════════════════════════════════════════════
export const graveyardMonsterEntries = [


  ['bone-crawler', {
    id: 'bone-crawler', name: 'Bone Crawler', color: 0x886688,
    // Basic undead body / CORPSE FODDER. Simple melee, no plague (removed, locked).
    // Its contribution to the biome is that it dies and leaves a valid corpse.
    stats: { hp: 2059, attack: 85, plating: 0, damageReduction: 0, speed: 78, attackRange: 12, attackCooldown: 1200, pullRange: 290 },
    behavior: 'melee', attackStyle: 'poison', biome: 'graveyard',
    rewards: { essence: 30, essenceType: 'purple', level: 3, biomeXp: 180 },
    ai: { wanderRadius: 330, leashRange: 820, idleMinMs: 600, idleMaxMs: 2500 },
  }],

  ['plague-hound', {
    id: 'plague-hound', name: 'Plague Hound', color: 0x664466,
    // THE dedicated plague creature — the one mob that keeps the DoT identity.
    // Aggressive charge, modest plague, and a contaminated pool on death that
    // matters for POSITIONING (short-lived; it must not dominate encounter damage).
    stats: { hp: 3168, attack: 105, plating: 0, damageReduction: 0, speed: 70, attackRange: 12, attackCooldown: 1500, pullRange: 270 },
    behavior: 'melee', attackStyle: 'poison', biome: 'graveyard',
    rewards: { essence: 50, essenceType: 'purple', level: 3, biomeXp: 300 },
    ai: { wanderRadius: 290, leashRange: 750, idleMinMs: 700, idleMaxMs: 3000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 900 },
    dotEffect: { debuffId: 'hound-plague', label: 'Hound Plague', damagePerStack: 24, maxStacks: 5, tickIntervalMs: 1100, durationMs: 2500 },
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
    // RANGED UNDEAD SUPPORT. Generic plague DoT removed (locked); its job is now
    // NECROTIC SCREECH — periodically empowering nearby undead (attack speed).
    // See the behavior pass for the screech itself.
    stats: { hp: 2693, attack: 95, plating: 0, damageReduction: 0, speed: 46, attackRange: 200, attackCooldown: 1700, pullRange: 260 },
    behavior: 'ranged', attackStyle: 'poison', biome: 'graveyard',
    rewards: { essence: 40, essenceType: 'purple', level: 3, biomeXp: 240 },
    // NECROTIC SCREECH - periodically hastens nearby undead. It does not hurt you
    // directly; it makes everything ELSE hurt you faster, which is a different job
    // from the plague DoT it used to carry.
    // WARNING: attack speed only. Do not also stack a big damage boost here.
    castedAttackSpeedBuff: {
      name: 'Necrotic Screech', castMs: 1200, cooldownMs: 8000,
      initialCooldownMs: 8000, effectId: 'carrion-screech-haste',
      attackSpeedPct: 0.25, durationMs: 5000,
      target: 'nearby-monsters', includeSelf: false, radius: 260,
      castWhileOutOfRange: true, fx: 'howl',
    },
    ai: { wanderRadius: 240, leashRange: 650, idleMinMs: 1200, idleMaxMs: 4000 },
  }],

  ['charnel-brute', {
    id: 'charnel-brute', name: 'Charnel Brute', color: 0x553355,
    // ⚠ DEFERRED TO T5 — NOT IN ANY SPAWN POOL (T1–T4 rework, locked decision).
    // Removed from graveyard's T4 `monsterPoolByTier` for a cleaner T4 debut: five
    // mobs expressing corpses/necromancy read better than six, and this one's
    // armored-anchor role duplicates work the Gravewright already carries.
    // The definition is kept intact so a future T5 Wasteland pass can pick it up.
    //
    // Bone amalgam hulk — a shambling mass of many beasts' fused bones. Slow
    // bone-armored anchor. CADENCE every 4 = a 216 necrotic slam. Heavy plating (16)
    // rewards Rupture/pierce. Its stacking DoT is already stripped per the locked
    // Wasteland identity; on-death ally empowerment (capped) is the mechanic it keeps.
    stats: { hp: 1800, attack: 90, plating: 16, damageReduction: 0.08, speed: 18, attackRange: 15, attackCooldown: 3200, pullRange: 155 },
    behavior: 'melee', attackStyle: 'poison', biome: 'graveyard',
    rewards: { essence: 160, essenceType: 'purple', level: 4, biomeXp: 960 },
    ai: { wanderRadius: 110, leashRange: 460, idleMinMs: 4000, idleMaxMs: 11000 },
    cadenceFinisher: { everyNAttacks: 4, multiplier: 2.4 },   // 216
    // Killing the swarm's anchor sends a short necrotic surge through nearby undead.
    // Placeholder values â€” the balance pass owns radius, duration, and cap.
    onDeath: { empowerAllies: { radius: 220, damagePct: 0.12, durationMs: 6000, maxStacks: 3 } },
  }],

  ['gravewright', {
    id: 'gravewright', name: 'Gravewright', color: 0xbb88cc,
    // Skeletal shaman-elk (undead stag whose antlers drip plague-light — no zombies,
    // no humanoids: the wasteland is all undead BEASTS).
    // ELITE backline NECROMANCER — the graveyard rework's centerpiece. Hangs back and
    // RAISES THE PLAYER'S OWN KILLS: each raise claims a real corpse from the node's
    // corpse registry, so the tide is whatever you just killed, capped at 4 alive and
    // worth ZERO rewards. Its risen dead crumble the instant it dies.
    // Squishy + ranged → reachable and dies fast once you commit. Yellow elite outline;
    // the `focus-elites` rune (taught by the graveyard recipe) is the intended counter.
    // Its personal Grave Curse DoT is REMOVED (locked): the power budget is
    // RESURRECTION ALONE — a weak ranged attacker whose only real weapon is the tide.
    stats: { hp: 2851, attack: 90, plating: 0, damageReduction: 0, speed: 40, attackRange: 200, attackCooldown: 1900, pullRange: 300 },
    behavior: 'ranged', attackStyle: 'magic', biome: 'graveyard',
    elite: true,
    rewards: { essence: 70, essenceType: 'purple', level: 3, biomeXp: 420 },
    ai: { wanderRadius: 200, leashRange: 640, idleMinMs: 1500, idleMaxMs: 4500 },
    // Raise on a 5s cadence while engaged, capped at 4 living (the cap = no flood).
    // No corpse in reach = no raise. Placeholder numbers — the balance pass owns
    // rate/reach/cap and the risen scalars vs base node density.
    raisesDead: {
      intervalMs: 5000, initialDelayMs: 2500, corpseRange: 280, maxAlive: 4,
      hpMult: 0.7, damageMult: 0.8,
      castMs: 1100, castName: 'Raise Dead', castFx: 'raise-dead',
    },
  }],

  ['plague-rat', {
    id: 'plague-rat', name: 'Bone Rat', color: 0xaa88aa,
    // Fast nuisance filler / corpse fodder. Individually nothing. No plague
    // (removed, locked) — it is simple on purpose, and it leaves a valid corpse.
    stats: { hp: 1584, attack: 65, plating: 0, damageReduction: 0, speed: 92, attackRange: 12, attackCooldown: 950, pullRange: 310 },
    behavior: 'melee', attackStyle: 'poison', biome: 'graveyard',
    rewards: { essence: 22, essenceType: 'purple', level: 3, biomeXp: 130 },
    ai: { wanderRadius: 360, leashRange: 860, idleMinMs: 400, idleMaxMs: 2000 },
  }],

] satisfies [string, MonsterDefinition][];
