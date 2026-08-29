import type { MonsterDefinition } from './types';

// ══════════════════════════════════════════════════════════════════════════
// DEEP-SEA TRENCH: EXTREME low density, THREE DISTINCT MINI-BOSS PROBLEMS
//
// The ecology is already right: 2-3 enemies max per encounter, wide roaming
// territories, very high detection, and the REAL failure state is drawing a
// second elite while solving the first. Stealth/routing is the answer.
//
// What was wrong (T1-T4 monster rework, locked): all three were the SAME monster,
// huge HP + plating + DR + charge + giant finisher + anti-heal. They are now
// three separate single-target problems:
//
//   Abyssal Serpent  THE HUNTER. Relentless melee pursuit, huge HP, meaningful DR,
//                    LESS plating. Signature Abyssal Bite applying Abyssal Wound
//                    (one moderate, nonstacking Recovery suppression).
//   Hadal Stalker    THE KITER. Armored ranged skirmisher: heavy plating, LOWER HP,
//                    no charge, no anti-heal. Always catchable.
//   Elder Leviathan  THE ANCHOR. Stand-and-fight: enormous HP, broad defenses, very
//                    slow, periodic Carapace shell, one gigantic Devour.
//
// WARNING: UNIVERSAL ANTI-HEAL IS REMOVED. It reached ~75% on Serpent/Stalker and
// ~90% on the Leviathan, far too aggressive for intentionally long elite fights.
// Anti-Recovery now belongs to the SERPENT LINEAGE only, as ONE nonstacking debuff.
// ==========================================================================
export const trenchMonsterEntries = [


  ['abyssal-serpent', {
    id: 'abyssal-serpent', name: 'Abyssal Serpent', color: 0x224488,
    // THE HUNTER: relentless sustain-pressure predator. Huge roam/detection radius,
    // the highest movement of the three, an engagement charge, and persistent melee
    // pursuit. This is the one that COMES FOR YOU.
    // Defense shape: huge HP + meaningful DR, LESS plating than the other two elites
    // (plating is the Stalker's identity). DR 0.20 extends the fight.
    // Signature: a periodic telegraphed heavy bite carrying ABYSSAL WOUND, the only
    // anti-Recovery left in the biome. Answers: enough sustain to survive the Wound,
    // Brace for the bite, burst/execute, or stealth-route to avoid a second pull.
    // Ordinary attack cut 420 -> 230 (item/monster diagnostic, 2026-08-24): a
    // death-trace found the PLAIN ordinary hit alone landing 321-370 (up to 81% of
    // a T4 arrival player's maxHP), on top of which Abyssal Bite still lands its
    // full telegraphed multiplier untouched. Only the ordinary-attack base moved;
    // the signature ability is left for manual playtest per the standing rule on
    // CC/telegraph-gated spikes.
    stats: { hp: 4200, attack: 230, plating: 18, damageReduction: 0.20, speed: 28, attackRange: 15, attackCooldown: 2800, pullRange: 420 },
    behavior: 'melee', attackStyle: 'impact', biome: 'trench',
    elite: true,
    rewards: { essence: 260, essenceType: 'blue', level: 4, biomeXp: 1560 },
    ai: { wanderRadius: 320, leashRange: 760, idleMinMs: 5000, idleMaxMs: 14000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    // ABYSSAL BITE - a periodic TELEGRAPHED heavy bite that carries the Wound.
    // Normal attacks no longer stack anti-heal; this one ability owns it.
    chargedAttack: {
      name: 'Abyssal Bite', castMs: 1700, cooldownMs: 10000, initialCooldownMs: 5000,
      multiplier: 2.5, fx: 'savage-maul',
      appliesAntiheal: { reduction: 0.28, durationMs: 6000 },
    },
  }],

  ['hadal-stalker', {
    id: 'hadal-stalker', name: 'Hadal Stalker', color: 0x335577,
    // THE KITER: giant deep-sea spider crab, re-cast as an ARMORED RANGED
    // SKIRMISHER (was a melee charger with a cadence finisher). Heavy plating, lower
    // HP than Serpent/Leviathan, NO anti-heal, NO engagement charge.
    // WARNING: always catchable by a properly configured player, never literally
    // uncatchable. The ECOLOGY is what makes it dangerous: a Close build chasing it
    // across the trench floor may cross into ANOTHER elite's detection radius.
    // Answers: Charge/mobility, Mid/Far, Brace, stealth-routing, target selection.
    // Its ranged presentation + Pressure Lance land in the behavior pass.
    // HP down vs the other two elites, plating stays heavy: armor is this one's
    // defensive identity. attackRange lifted to a real standoff.
    // Ordinary attack cut 401 -> 210 (item/monster diagnostic, 2026-08-24): a
    // death-trace found the PLAIN ordinary hit alone landing 304-342 (up to 75% of
    // a T4 arrival player's maxHP), before Pressure Lance's own telegraphed
    // multiplier. Only the ordinary-attack base moved; Pressure Lance is left for
    // manual playtest per the standing rule on CC/telegraph-gated spikes.
    stats: { hp: 2800, attack: 210, plating: 20, damageReduction: 0.10, speed: 22, attackRange: 240, attackCooldown: 3400, pullRange: 400 },
    // `kiter`: it maintains standoff. Speed 22 is far below player base, so a
    // charging or mobile build always catches it - that contract is load-bearing.
    behavior: 'kiter', attackStyle: 'gunshot', biome: 'trench',
    elite: true,
    rewards: { essence: 210, essenceType: 'blue', level: 4, biomeXp: 1260 },
    ai: { wanderRadius: 300, leashRange: 720, idleMinMs: 5500, idleMaxMs: 14000 },
    // PRESSURE LANCE - a periodic telegraphed heavy projectile, replacing the melee
    // cadence finisher it carried as a charger.
    chargedAttack: {
      name: 'Pressure Lance', castMs: 1900, cooldownMs: 9000, initialCooldownMs: 4500,
      multiplier: 2.4, fx: 'power-shot',
    },
  }],

  ['elder-leviathan', {
    id: 'elder-leviathan', name: 'Elder Leviathan', color: 0x112244,
    // THE ANCHOR: colossal abyssal anglerfish, its lure the trench's brightest light.
    // The ultimate STAND-AND-FIGHT monster, deliberately simplified from a kitchen
    // sink (anti-heal and enemy soft-cap both REMOVED, locked).
    // What it keeps: enormous HP, strong broad defenses (plating 22 + DR 0.24, which
    // rewards pierce), very slow movement, a periodic ABYSSAL CARAPACE shell, and one
    // gigantic predictable DEVOUR.
    // The fight should read: huge target, shell windows, survive Devour, finish it
    // before another elite wanders in.
    // WARNING: no low-HP enrage. That is saved for a later Leviathan evolution.
    // Ordinary attack cut 483 -> 260 (item/monster diagnostic, 2026-08-24): a
    // death-trace found the PLAIN ordinary hit alone landing 370-376 (up to 82% of
    // a T4 arrival player's maxHP), before Devour's own telegraphed multiplier.
    // Only the ordinary-attack base moved; Devour is left for manual playtest per
    // the standing rule on CC/telegraph-gated spikes.
    stats: { hp: 5880, attack: 260, plating: 22, damageReduction: 0.24, speed: 20, attackRange: 15, attackCooldown: 3600, pullRange: 440 },
    behavior: 'melee', attackStyle: 'impact', biome: 'trench',
    elite: true,
    rewards: { essence: 400, essenceType: 'blue', level: 4, biomeXp: 2400 },
    ai: { wanderRadius: 280, leashRange: 700, idleMinMs: 8000, idleMaxMs: 20000 },
    // No aggressive anti-kite charge (locked, unless testing proves it necessary):
    // this is the stand-and-fight monster, and chasing is the Serpent's job.
    // DEVOUR - a long, clear wind-up and an enormous impact roughly every 10-12s.
    // The central offensive threat; the Carapace below is only secondary.
    chargedAttack: {
      name: 'Devour', castMs: 2600, cooldownMs: 11000, initialCooldownMs: 7000,
      multiplier: 2.4, fx: 'savage-maul',
      aoe: { radius: 170 },
    },
    // ABYSSAL CARAPACE: the periodic defensive shell, a SECONDARY mechanic.
    // The Devour wind-up is the central offensive threat (behavior pass).
    enemyShield: { shieldPct: 0.30, intervalMs: 16000, durationMs: 6000 },
  }],

] satisfies [string, MonsterDefinition][];