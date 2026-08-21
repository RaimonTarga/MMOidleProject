/**
 * Class stat affinity wiring (T1–T3).
 *
 * Roots, frames and range nodes grant PERCENTAGE affinities rather than flat
 * stats. This asserts the contract those tables depend on — additive, applied
 * once, applied to base + equipment — plus the chassis invariants the design
 * exists to protect. Balance numbers are deliberately NOT asserted; they will
 * move with the next tuning pass.
 */

import {
  GAME_CONFIG,
  SKILL_TREE,
  emptyEquipment,
  recalculatePlayerStats,
  type PlayerStatsTarget,
} from "@mmo-idle/shared";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function build(skills: string[], armor?: string, plus = 0): PlayerStatsTarget {
  const equipment = emptyEquipment();
  if (armor) equipment.armor = armor;
  const target = {
    dealsDamage: { attack: 0, onHitDamage: 0, attackStyle: "slash" },
    mitigatesDamage: { plating: 0, damageReduction: 0 },
    evadesHits: { dodgeRate: 0, evadeMitigation: 0, charge: 0 },
    performsAttack: { attackRange: 0, attackCooldown: 0, lastAttackAt: 0 },
    hasHealth: { hp: 1, maxHp: 1, hpRegen: 0 },
    hasPosition: { current: { x: 0, y: 0 }, nodeId: "node-5-5", speed: 0 },
    usesSkills: {
      unlockedSkills: skills,
      passives: {},
      selectedClass: skills[0] ?? null,
      selectedSubVariant: null,
      selectedRange: skills.find((s) => s.includes("-range-")) ?? null,
      combatArchetype: null,
    },
    holdsInventory: {
      inventory: [],
      equipment,
      itemUpgrades: armor && plus > 0 ? { [armor]: plus } : {},
    },
  } as PlayerStatsTarget;
  recalculatePlayerStats(target);
  return target;
}

const SQUIRE = ["cooldown-root", "cooldown-heavy", "cooldown-range-close"];
const SQUIRE_FAR = ["cooldown-root", "cooldown-heavy", "cooldown-range-far"];
const SPIRIT = ["energy-root", "energy-light", "energy-range-close"];

// ── 1. Affinities are ADDITIVE, never compounding tier by tier ──────────────
// Squire +30% / Bulwark +22% / Vanguard +10% max HP must resolve as ×1.62.
// The bug this guards against is ×1.30 × 1.22 × 1.10 = ×1.7446, which would
// make every later tier silently worth more than the table says.
{
  const naked = build([]);
  const squire = build(SQUIRE);
  const additive = Math.round(naked.hasHealth.maxHp * 1.62);
  const compounded = Math.round(naked.hasHealth.maxHp * 1.3 * 1.22 * 1.1);
  assert(
    squire.hasHealth.maxHp === additive,
    `Squire→Bulwark→Vanguard max HP should be additive (${additive}), got ${squire.hasHealth.maxHp}`,
  );
  assert(
    squire.hasHealth.maxHp !== compounded,
    "affinities must not compound multiplicatively across tiers",
  );
}

// ── 2. Every affinity stat is applied exactly once ──────────────────────────
{
  const naked = build([]);
  const squire = build(SQUIRE);
  assert(
    squire.dealsDamage.attack === Math.round(naked.dealsDamage.attack * 1.32),
    "attack affinity should sum to +32% and apply once",
  );
  assert(
    squire.mitigatesDamage.plating === Math.round(naked.mitigatesDamage.plating * 1.67),
    "plating affinity should sum to +67% and apply once",
  );
  assert(
    squire.hasPosition.speed === Math.round(naked.hasPosition.speed * 0.78),
    "move speed affinity should sum to −22% and apply once",
  );
  assert(
    squire.performsAttack.attackCooldown ===
      Math.round(naked.performsAttack.attackCooldown / 0.78),
    "attack speed affinity should sum to −22% and apply once as a cooldown divisor",
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
    Math.abs(at0 - 1.62) < 0.01 && Math.abs(at5 - 1.62) < 0.01,
    `class HP share should hold at ~1.62× across upgrade levels, got +0:${at0.toFixed(3)} +5:${at5.toFixed(3)}`,
  );
  const geared = build(SQUIRE, "cave-vest-t3", 5);
  const bare = build(SQUIRE);
  assert(
    geared.hasHealth.maxHp > bare.hasHealth.maxHp,
    "equipment must still raise the affinity-multiplied total",
  );
}

// ── 4. Chassis ordering survives the positional choice ──────────────────────
// A Squire that gave up melee is still heavier than a Spirit that embraced it;
// compensation restores function, never identity.
{
  const squireFar = build(SQUIRE_FAR, "cave-vest-t3", 3);
  const spiritClose = build(SPIRIT, "cave-vest-t3", 3);
  assert(
    squireFar.hasHealth.maxHp > spiritClose.hasHealth.maxHp,
    "Squire on Far must remain bulkier than Spirit on Close",
  );
  assert(
    squireFar.mitigatesDamage.plating > spiritClose.mitigatesDamage.plating,
    "Squire must remain the more armored chassis regardless of range",
  );
  assert(
    spiritClose.hasPosition.speed > squireFar.hasPosition.speed &&
      spiritClose.performsAttack.attackCooldown < squireFar.performsAttack.attackCooldown,
    "Spirit must remain the faster chassis regardless of range",
  );
}

// ── 5. Close range carries its whole budget in the node tables ──────────────
// The old hardcoded CLOSE_RANGE_CLASS_BONUS added invisible per-class plating
// and regen for picking any close node. Nothing may grant stats off-table.
{
  const closeOnly = build(["cooldown-root", "cooldown-range-close"]);
  const rootOnly = build(["cooldown-root"]);
  // Squire root +30% plating, Vanguard +12% — and nothing else.
  const expected = Math.round(GAME_CONFIG.PLAYER_PLATING * (1 + 0.3 + 0.12));
  assert(
    closeOnly.mitigatesDamage.plating === expected,
    `close-range plating should come only from the node tables (${expected}), got ${closeOnly.mitigatesDamage.plating}`,
  );
  assert(
    closeOnly.hasHealth.hpRegen === rootOnly.hasHealth.hpRegen,
    "close range must not grant off-table hp regen",
  );
}

// ── 6. Tiers 0–2 grant no flat generic stats ────────────────────────────────
// Flat attack/HP/plating/speed/regen are what gear dilutes; the class tree must
// express those as affinities. attackRange (a positional rule), evasion and
// damageReduction (already fractions) are the authored exceptions.
{
  const flatKeys = ["attack", "maxHp", "plating", "speed", "hpRegen"] as const;
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

console.log("classAffinity: ok");
