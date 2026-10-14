/**
 * Class stat affinity wiring (T1–T3).
 *
 * The class roots grant PERCENTAGE affinities rather than flat stats (the
 * class-first tree's later nodes carry none yet; synthetic nodes stand in where a
 * case needs more than one source). This asserts the contract those tables depend
 * on — additive, applied
 * once, applied to base + equipment — plus the chassis invariants the design
 * exists to protect. Balance numbers are deliberately NOT asserted; they will
 * move with the next tuning pass.
 */

import {
  GAME_CONFIG,
  resolveFinalDamageMultipliers,
  RECIPE_DATABASE,
  SKILL_TREE,
  emptyEquipment,
  recalculatePlayerStats,
  type PlayerStatsTarget,
} from "@mmo-idle/shared";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function build(
  skills: string[],
  armor?: string,
  plus = 0,
  options?: { core?: string; activeStance?: string; combatArchetype?: string },
): PlayerStatsTarget {
  const equipment = emptyEquipment();
  if (armor) equipment.armor = armor;
  if (options?.core) equipment.core = options.core;
  const target = {
    dealsDamage: { attack: 0, onHitDamage: 0, attackStyle: "slash" },
    mitigatesDamage: { plating: 0, damageReduction: 0 },
    evadesHits: { dodgeRate: 0, evadeMitigation: 0, charge: 0 },
    performsAttack: { attackRange: 0, attackCooldown: 0, lastAttackAt: 0 },
    hasHealth: { hp: 1, maxHp: 1, recovery: 0 },
    hasPosition: { current: { x: 0, y: 0 }, nodeId: "node-5-5", speed: 0 },
    usesSkills: {
      unlockedSkills: skills,
      passives: {},
      selectedClass: skills[0] ?? null,
      selectedSubVariant: null,
      selectedRange: skills.find((s) => s.includes("-range-")) ?? null,
      combatArchetype: options?.combatArchetype ?? null,
    },
    holdsInventory: {
      inventory: [],
      equipment,
      itemUpgrades: armor && plus > 0 ? { [armor]: plus } : {},
    },
    activeStance: options?.activeStance ?? null,
  } as PlayerStatsTarget;
  recalculatePlayerStats(target);
  return target;
}

const SQUIRE = ["cooldown-root"];
const SPIRIT = ["energy-root"];

// ── 1. Affinities are ADDITIVE, never compounding tier by tier ──────────────
// Squire +30% plus two later sources of +22% and +10% max HP must resolve as
// ×1.62. The bug this guards against is ×1.30 × 1.22 × 1.10 = ×1.7446, which
// would make every later tier silently worth more than the table says. The two
// later sources are synthetic: the class-first tree's later nodes carry no stats.
{
  const later = [["test-affinity-later-a", 0.22], ["test-affinity-later-b", 0.1]] as const;
  for (const [id, maxHpPct] of later) {
    SKILL_TREE.set(id, { ...SKILL_TREE.get("cooldown-root")!, id, statEffects: { maxHpPct }, mechanicEffects: {} });
  }
  try {
    const naked = build([]);
    const squire = build([...SQUIRE, ...later.map(([id]) => id)]);
    const additive = Math.round(naked.hasHealth.maxHp * 1.62);
    const compounded = Math.round(naked.hasHealth.maxHp * 1.3 * 1.22 * 1.1);
    assert(
      squire.hasHealth.maxHp === additive,
      `Squire root + two later sources max HP should be additive (${additive}), got ${squire.hasHealth.maxHp}`,
    );
    assert(
      squire.hasHealth.maxHp !== compounded,
      "affinities must not compound multiplicatively across tiers",
    );
  } finally {
    for (const [id] of later) SKILL_TREE.delete(id);
  }
}

// ── 2. Every affinity stat is applied exactly once ──────────────────────────
{
  const naked = build([]);
  const squire = build(SQUIRE);
  assert(
    squire.dealsDamage.attack === Math.round(naked.dealsDamage.attack * 1.18),
    "attack affinity should be +18% and apply once",
  );
  assert(
    squire.mitigatesDamage.plating === Math.round(naked.mitigatesDamage.plating * 1.1),
    "plating affinity should be +10% and apply once",
  );
  assert(
    squire.hasPosition.speed === Math.round(naked.hasPosition.speed * 0.9),
    "move speed affinity should be −10% and apply once",
  );
  assert(
    squire.performsAttack.attackCooldown ===
      Math.round(naked.performsAttack.attackCooldown / 0.85),
    "attack speed affinity should be −15% and apply once as a cooldown divisor",
  );
}

// ── 3. Affinities scale with EQUIPMENT, not just base stats ─────────────────
// This is the whole point of the rework: a flat grant is diluted as gear grows,
// a percentage is not. The class's share of the total must stay constant as the
// same armor is upgraded from +0 to +5.
{
  const ratioAt = (plus: number): number => {
    const naked = build([], "cave-vest-t3", plus);
    const squire = build(SQUIRE, "cave-vest-t3", plus);
    return squire.hasHealth.maxHp / naked.hasHealth.maxHp;
  };
  const at0 = ratioAt(0);
  const at5 = ratioAt(5);
  assert(
    Math.abs(at0 - 1.3) < 0.01 && Math.abs(at5 - 1.3) < 0.01,
    `class HP share should hold at ~1.30× across upgrade levels, got +0:${at0.toFixed(3)} +5:${at5.toFixed(3)}`,
  );
  const geared = build(SQUIRE, "cave-vest-t3", 5);
  const bare = build(SQUIRE);
  assert(
    geared.hasHealth.maxHp > bare.hasHealth.maxHp,
    "equipment must still raise the affinity-multiplied total",
  );
}

// ── 4. Chassis ordering ─────────────────────────────────────────────────────
// The Squire is the heavy end of the chassis line and the Spirit the light end.
{
  const squire = build(SQUIRE, "cave-vest-t3", 3);
  const spirit = build(SPIRIT, "cave-vest-t3", 3);
  assert(
    squire.hasHealth.maxHp > spirit.hasHealth.maxHp,
    "Squire must remain bulkier than Spirit",
  );
  assert(
    squire.mitigatesDamage.plating >= spirit.mitigatesDamage.plating &&
      squire.mitigatesDamage.damageReduction > spirit.mitigatesDamage.damageReduction,
    "Squire must remain the more armored chassis (class DR is its armor layer)",
  );
  assert(
    spirit.hasPosition.speed > squire.hasPosition.speed &&
      spirit.performsAttack.attackCooldown < squire.performsAttack.attackCooldown,
    "Spirit must remain the faster chassis",
  );
}

// ── 6. Tiers 0–2 grant no flat generic stats ────────────────────────────────
// Flat attack/HP/plating/speed/regen are what gear dilutes; the class tree must
// express those as affinities. attackRange (a positional rule), evasion and
// damageReduction (already fractions) are the authored exceptions.
{
  const flatKeys = ["attack", "maxHp", "plating", "speed", "recovery"] as const;
  for (const node of SKILL_TREE.values()) {
    if (node.tier > 2) continue;
    for (const key of flatKeys) {
      assert(
        (node.statEffects[key] ?? 0) === 0,
        `${node.id} (tier ${node.tier}) grants flat ${key}; tiers 0–2 must use affinities`,
      );
    }
  }
}

// â”€â”€ 7. Core is the final multiplicative capstone layer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
{
  const skills = ["reload-root"];
  const core = RECIPE_DATABASE.get("core-tempered")!;
  const coreAttack = core.mechanicEffects?.["core.attack-mult"] ?? 0;
  const affinity = skills.reduce(
    (total, id) => total + (SKILL_TREE.get(id)?.statEffects.attackPct ?? 0),
    0,
  );
  const result = build(skills, undefined, 0, {
    core: core.id,
    activeStance: "offensive-stance",
    combatArchetype: "reload",
  });

  let expected = Math.round(GAME_CONFIG.PLAYER_ATTACK * (1 + affinity));
  expected = Math.max(1, Math.floor(expected * 0.65)); // reload archetype
  expected = Math.max(1, Math.round(expected * (1 + coreAttack))); // Core
  const finalDamage = resolveFinalDamageMultipliers(result.usesSkills.passives, 'offensive-stance');
  assert(Math.abs(finalDamage.dealt - 1.12 * 1.15) < 1e-9, 'Core and stance compose as independent final damage factors');
  assert(
    result.dealsDamage.attack === expected,
    `attack retains class/archetype stat layers (${expected}), got ${result.dealsDamage.attack}`,
  );
}

// Synthetic future haste exercises thresholds current gear need not reach yet.
// Stat scaling must remain continuous through 5 and 10 APS, independently of
// the server's one-attack-per-tick execution limit.
{
  const id = 'test-uncapped-attack-speed';
  const fixture = {
    ...SKILL_TREE.get('reload-root')!,
    id,
    statEffects: { attackSpeedPct: 19 },
    mechanicEffects: {} as Record<string, number>,
  };
  SKILL_TREE.set(id, fixture);
  try {
    const ordinary = build([id]);
    const slinger = build([id], undefined, 0, { combatArchetype: 'reload' });
    assert(ordinary.performsAttack.attackCooldown < 200, 'generic haste must exceed 5 APS');
    assert(slinger.performsAttack.attackCooldown < 100, 'Slinger haste must exceed 10 nominal APS');
    assert(
      slinger.performsAttack.attackCooldown === Math.round(ordinary.performsAttack.attackCooldown / 2),
      'Slinger must retain its double-speed multiplier above the former cap',
    );
    const core = build([id], undefined, 0, { combatArchetype: 'reload', core: 'core-accelerant' });
    assert(core.performsAttack.attackCooldown < slinger.performsAttack.attackCooldown,
      'Core haste must not clamp or slow an already fast Slinger');
    fixture.mechanicEffects['reload.gatling'] = 1;
    const gatling = build([id], undefined, 0, { combatArchetype: 'reload' });
    assert(gatling.performsAttack.attackCooldown < slinger.performsAttack.attackCooldown,
      'Gatling must retain its additional speed multiplier above 10 nominal APS');
    fixture.statEffects.attackSpeedPct = 1e9;
    const extreme = build([id], undefined, 0, { combatArchetype: 'reload', core: 'core-accelerant' });
    assert(extreme.performsAttack.attackCooldown === 1, 'rounding must never produce a zero cooldown');
  } finally {
    SKILL_TREE.delete(id);
  }
}

console.log("classAffinity: ok");
