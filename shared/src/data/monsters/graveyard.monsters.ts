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
//
// ══ GRAVEWRIGHT PACKS (ecology polish, 2026-09-11) ══
//
// The resurrection mechanic was already built; what was missing was an encounter
// that STARTS in a state where it can fire. A necromancer standing on its own has
// to wait for the player to kill something else nearby before it has a body to
// raise, so its signature beat routinely never happened at all.
//
// The Gravewright is now a pack ALPHA, and its entourage is ordinary Wasteland
// creatures — i.e. VALID CORPSE MATERIAL. The intended loop, in one pull:
//
//     Gravewright + escort → you kill the escort → corpses → the surviving
//     Gravewright stands those same corpses back up.
//
// That is the tactical question the biome wants asked: kill the necromancer
// first, or clear the things pressuring you and hand it the ammunition?
//
// ⚠ NOT A SWARM BIOME. Density stays 28 and the entourage stays 3-4: Volcano gets
// its pressure from initial pack VOLUME, Wasteland gets it from a structured pack
// that REFUSES TO STAY DEAD. Raising into a wall of bodies is unreadable.
//
// ⚠ NON-RECURSIVE at both layers: `spawnPack` creates followers with
// `createMonster` (never another pack), and risen mobs never record a corpse. An
// entourage therefore feeds the raiser exactly once.
// ══════════════════════════════════════════════════════════════════════════
export const graveyardMonsterEntries = [


  ['bone-crawler', {
    id: 'bone-crawler', name: 'Bone Crawler', color: 0x886688,
    // Basic undead body / CORPSE FODDER. Simple melee, no plague (removed, locked).
    // Its contribution to the biome is that it dies and leaves a valid corpse.
    stats: { hp: 1235, attack: 85, plating: 0, damageReduction: 0, speed: 78, attackRange: 12, attackCooldown: 1200, pullRange: 290 },
    behavior: 'melee', attackStyle: 'bone', biome: 'graveyard',
    rewards: { essence: 30, essenceType: 'purple', level: 3, biomeXp: 180 },
    // THE GRAVEWRIGHT'S CORE ESCORT — and, once you kill it, the corpse the
    // Gravewright reaches for. Still rolls loose from the pool on its own.
    pack: { role: 'follower', callRange: 300 },
    ai: { wanderRadius: 330, leashRange: 820, idleMinMs: 600, idleMaxMs: 2500 },
  }],

  ['plague-hound', {
    id: 'plague-hound', name: 'Plague Hound', color: 0x664466,
    // THE dedicated plague creature — the one mob that keeps the DoT identity.
    // Aggressive charge, modest plague, and a contaminated pool on death that
    // matters for POSITIONING (short-lived; it must not dominate encounter damage).
    stats: { hp: 1901, attack: 105, plating: 0, damageReduction: 0, speed: 70, attackRange: 12, attackCooldown: 1500, pullRange: 270 },
    behavior: 'melee', attackStyle: 'poison', biome: 'graveyard',
    rewards: { essence: 50, essenceType: 'purple', level: 3, biomeXp: 300 },
    ai: { wanderRadius: 290, leashRange: 750, idleMinMs: 700, idleMaxMs: 3000 },
    // Occasionally runs with a Gravewright. It is the entourage member you most
    // want dead early (plague + a death pool) and therefore the corpse you are
    // most likely to hand over — the target-priority tension in one creature.
    pack: { role: 'follower', callRange: 300 },
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
    stats: { hp: 1616, attack: 95, plating: 0, damageReduction: 0, speed: 46, attackRange: 200, attackCooldown: 1700, pullRange: 260 },
    behavior: 'ranged', attackStyle: 'peck', biome: 'graveyard',
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
    // The support half of a Gravewright escort: one screeches the escort faster
    // while the other stands it back up. Both are "leave the elite alone at your
    // peril" creatures, which is why they read well in the same pack.
    pack: { role: 'follower', callRange: 300 },
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
    stats: { hp: 5702, attack: 90, plating: 0, damageReduction: 0, speed: 40, attackRange: 200, attackCooldown: 1900, pullRange: 300 },
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
    // PACK ALPHA — the necromancer arrives EMBEDDED in the creatures it will later
    // reanimate, so the mechanic has ammunition from the first second of the pull
    // instead of waiting on an unrelated kill to wander into `corpseRange` (280).
    // Followers spawn on a ring well inside that reach, and they die roughly where
    // the fight is happening, so the escort reliably becomes the tide.
    //
    // Entourage 3-4 bodies (pack of 4-5), every one of them a valid corpse. The
    // variants change WHAT you are being handed, not how much:
    //   • rats      — cheap, fast corpses; the loop taught at speed
    //   • crawlers  — more of the durable baseline
    //   • hound     — the one you want dead first, which is the trap
    //   • vulture   — a second "kill the support" claim on your attention
    //
    // ⚠ maxAlive stays 4 and risen mobs are reward-free and leave no corpse, so a
    // full escort cannot spiral: the pack is a one-time meal, not a generator.
    pack: {
      role: 'alpha', callRange: 320,
      followers: [{ typeId: 'bone-crawler', count: 2 }],
      followerVariants: [
        [{ typeId: 'plague-rat', count: 2 }],
        [{ typeId: 'bone-crawler', count: 1 }],
        [{ typeId: 'plague-hound', count: 1 }],
        [{ typeId: 'carrion-vulture', count: 1 }, { typeId: 'plague-rat', count: 1 }],
      ],
    },
  }],

  ['plague-rat', {
    id: 'plague-rat', name: 'Bone Rat', color: 0xaa88aa,
    // Fast nuisance filler / corpse fodder. Individually nothing. No plague
    // (removed, locked) — it is simple on purpose, and it leaves a valid corpse.
    stats: { hp: 950, attack: 65, plating: 0, damageReduction: 0, speed: 92, attackRange: 12, attackCooldown: 950, pullRange: 310 },
    behavior: 'melee', attackStyle: 'bone', biome: 'graveyard',
    rewards: { essence: 22, essenceType: 'purple', level: 3, biomeXp: 130 },
    // The cheapest corpse in the biome. A rat-heavy escort dies fast and feeds the
    // raiser fast, which is the entourage variant that teaches the loop quickest.
    pack: { role: 'follower', callRange: 300 },
    ai: { wanderRadius: 360, leashRange: 860, idleMinMs: 400, idleMaxMs: 2000 },
  }],

] satisfies [string, MonsterDefinition][];
