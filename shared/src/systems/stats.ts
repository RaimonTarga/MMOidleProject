import type { PlayerSnapshot } from '../index';
import type {
  DealsDamage,
  EvadesHits,
  HasHealth,
  HasPosition,
  HoldsInventory,
  MitigatesDamage,
  PerformsAttack,
  UsesSkills,
} from '../components/snapshotSlices';
import { SKILL_TREE } from '../skillTree';
import { ITEM_DATABASE } from '../itemDatabase';
import { EQUIPMENT_SLOTS } from '../items';
import { GAME_CONFIG } from '../index';
import { mergePassives } from '../passives';

/** Slice record consumed by `recalculatePlayerStats`. */
export interface PlayerStatsTarget {
  dealsDamage:     DealsDamage;
  mitigatesDamage: MitigatesDamage;
  evadesHits:      EvadesHits;
  performsAttack:  PerformsAttack;
  hasHealth:       HasHealth;
  hasPosition:     HasPosition;
  usesSkills:      UsesSkills;
  holdsInventory:  HoldsInventory;
  /** Optional callback when cadence threshold is recalculated (writes to usesCadence on server). */
  resetCadenceCounters?: (threshold: number) => void;
}

// Class-specific bonus applied when the player chose close range (range-close).
const CLOSE_RANGE_CLASS_BONUS: Record<string, { plating: number; hpRegen: number }> = {
  'cooldown-root': { plating: 5, hpRegen: 1 },
  'dot-root':      { plating: 4, hpRegen: 2 },
  'cadence-root':  { plating: 3, hpRegen: 3 },
  'reload-root':   { plating: 2, hpRegen: 4 },
  'energy-root':   { plating: 1, hpRegen: 5 },
};

function applyStatModToTarget(p: PlayerStatsTarget, stat: string, value: number): void {
  switch (stat) {
    case 'attack':          p.dealsDamage.attack          += value; break;
    case 'onHitDamage':     p.dealsDamage.onHitDamage     += value; break;
    case 'plating':         p.mitigatesDamage.plating     += value; break;
    case 'damageReduction': p.mitigatesDamage.damageReduction += value; break;
    case 'evasion':         p.evadesHits.threshold        += value; break;
    case 'attackRange':     p.performsAttack.attackRange  += value; break;
    case 'attackCooldown':  p.performsAttack.attackCooldown += value; break;
    case 'maxHp':           p.hasHealth.maxHp             += value; break;
    case 'hpRegen':         p.hasHealth.hpRegen           = (p.hasHealth.hpRegen ?? 0) + value; break;
    case 'speed':           p.hasPosition.speed           += value; break;
  }
}

/**
 * Deterministic full stat rebuild: base constants → weapon aps → skill effects → equipment modifiers.
 * Mutates slice fields in place.
 */
export function recalculatePlayerStats(p: PlayerStatsTarget): void {
  // 1. Reset to base
  p.dealsDamage.attack          = GAME_CONFIG.PLAYER_ATTACK;
  p.dealsDamage.onHitDamage     = 0;
  p.mitigatesDamage.plating     = GAME_CONFIG.PLAYER_PLATING;
  p.mitigatesDamage.damageReduction = 0;
  p.evadesHits.threshold        = 0;
  p.performsAttack.attackRange  = GAME_CONFIG.PLAYER_ATTACK_RANGE;
  p.performsAttack.attackCooldown = GAME_CONFIG.PLAYER_ATTACK_COOLDOWN;
  p.hasHealth.maxHp             = GAME_CONFIG.PLAYER_MAX_HP;
  p.hasHealth.hpRegen           = GAME_CONFIG.PLAYER_HP_REGEN;
  p.hasPosition.speed           = GAME_CONFIG.PLAYER_SPEED;

  // 1b. Weapon attack rate
  const weaponId = p.holdsInventory.equipment.weapon;
  const weapon   = weaponId ? ITEM_DATABASE.get(weaponId) : undefined;
  if (weapon?.attacksPerSecond) {
    p.performsAttack.attackCooldown = Math.round(1000 / weapon.attacksPerSecond);
  }

  // 2. Apply unlocked skill effects
  p.usesSkills.passives = {};
  for (const skillId of p.usesSkills.unlockedSkills) {
    const node = SKILL_TREE.get(skillId);
    if (!node) continue;
    const e = node.statEffects;
    p.dealsDamage.attack          += e.attack          ?? 0;
    p.mitigatesDamage.plating     += e.plating         ?? 0;
    p.mitigatesDamage.damageReduction += e.damageReduction ?? 0;
    p.evadesHits.threshold        += e.evasion         ?? 0;
    p.performsAttack.attackRange  += e.attackRange     ?? 0;
    p.performsAttack.attackCooldown += e.attackCooldown ?? 0;
    p.hasHealth.maxHp             += e.maxHp           ?? 0;
    p.hasHealth.hpRegen           = (p.hasHealth.hpRegen ?? 0) + (e.hpRegen ?? 0);
    p.hasPosition.speed           += e.speed           ?? 0;
    mergePassives(p.usesSkills.passives, node.mechanicEffects);
  }
  p.performsAttack.attackCooldown = Math.max(200, p.performsAttack.attackCooldown);
  p.mitigatesDamage.damageReduction = Math.min(0.9, Math.max(0, p.mitigatesDamage.damageReduction));

  // 2b. Class-specific close-range bonus
  if (p.usesSkills.selectedRange === 'range-close' && p.usesSkills.selectedClass) {
    const bonus = CLOSE_RANGE_CLASS_BONUS[p.usesSkills.selectedClass];
    if (bonus) {
      p.mitigatesDamage.plating += bonus.plating;
      p.hasHealth.hpRegen = (p.hasHealth.hpRegen ?? 0) + bonus.hpRegen;
    }
  }

  // 2c. Cadence threshold via callback (optional usesCadence slice on server)
  if (p.usesSkills.combatArchetype === 'cadence' && p.resetCadenceCounters) {
    const base = Math.round(p.usesSkills.passives['cadence.empowered-threshold'] ?? 5);
    const mod  = Math.round(p.usesSkills.passives['cadence.threshold-mod']        ?? 0);
    p.resetCadenceCounters(Math.max(2, base + mod));
  }

  // 3. Apply equipped item stat modifiers and mechanic effects
  for (const slot of EQUIPMENT_SLOTS) {
    const defId = p.holdsInventory.equipment[slot];
    if (!defId) continue;
    const def = ITEM_DATABASE.get(defId);
    if (!def) continue;
    for (const [stat, value] of Object.entries(def.statModifiers)) {
      applyStatModToTarget(p, stat, value);
    }
    mergePassives(p.usesSkills.passives, def.mechanicEffects);
  }

  // 3b. Reload archetype final multiplier
  if (p.usesSkills.combatArchetype === 'reload') {
    p.dealsDamage.attack = Math.max(1, Math.floor(p.dealsDamage.attack * 0.5));
    p.performsAttack.attackCooldown = Math.max(200, Math.round(p.performsAttack.attackCooldown * 0.5));
    if ((p.usesSkills.passives['reload.gatling'] ?? 0) > 0) {
      p.performsAttack.attackCooldown = Math.max(100, Math.round(p.performsAttack.attackCooldown * 0.5));
    }
  }

  // 4. Clamp current hp to the new max
  p.hasHealth.hp = Math.max(1, Math.min(p.hasHealth.hp, p.hasHealth.maxHp));
}

/** Build a slice-native target that reads/writes a wire `PlayerSnapshot` (hydrate / client paths). */
export function playerStatsTargetFromSnapshot(
  player: PlayerSnapshot,
  resetCadenceCounters?: (threshold: number) => void,
): PlayerStatsTarget {
  return {
    dealsDamage: {
      get attack() { return player.attack; },
      set attack(v: number) { player.attack = v; },
      get onHitDamage() { return player.onHitDamage; },
      set onHitDamage(v: number) { player.onHitDamage = v; },
      get attackStyle() { return player.attackStyle; },
      set attackStyle(v: string) { player.attackStyle = v; },
    },
    mitigatesDamage: {
      get plating() { return player.plating; },
      set plating(v: number) { player.plating = v; },
      get damageReduction() { return player.damageReduction; },
      set damageReduction(v: number) { player.damageReduction = v; },
    },
    evadesHits: {
      get threshold() { return player.evasion; },
      set threshold(v: number) { player.evasion = v; },
      get count() { return player.evasionCount; },
      set count(v: number) { player.evasionCount = v; },
    },
    performsAttack: {
      get attackRange() { return player.attackRange; },
      set attackRange(v: number) { player.attackRange = v; },
      get attackCooldown() { return player.attackCooldown; },
      set attackCooldown(v: number) { player.attackCooldown = v; },
      get lastAttackAt() { return player.lastAttackAt; },
      set lastAttackAt(v: number) { player.lastAttackAt = v; },
      get attackTargetId() { return player.attackTargetId; },
      set attackTargetId(v: string | null) { player.attackTargetId = v; },
    },
    hasHealth: {
      get hp() { return player.hp; },
      set hp(v: number) { player.hp = v; },
      get maxHp() { return player.maxHp; },
      set maxHp(v: number) { player.maxHp = v; },
      get hpRegen() { return player.hpRegen; },
      set hpRegen(v: number | undefined) { player.hpRegen = v ?? 0; },
      get shields() { return player.shields; },
      set shields(v) { player.shields = v; },
    },
    hasPosition: {
      get current() { return { x: player.x, y: player.y }; },
      set current(_v) { /* snapshot uses flat x/y; not mutated by stat recalc */ },
      get nodeId() { return player.nodeId; },
      set nodeId(_v: string) { /* not mutated by stat recalc */ },
      get speed() { return player.speed; },
      set speed(v: number) { player.speed = v; },
    },
    usesSkills: {
      get unlockedSkills() { return player.unlockedSkills; },
      set unlockedSkills(v: string[]) { player.unlockedSkills = v; },
      get passives() { return player.passives; },
      set passives(v) { player.passives = v; },
      get selectedClass() { return player.selectedClass; },
      set selectedClass(v: string | null) { player.selectedClass = v; },
      get selectedSubVariant() { return player.selectedSubVariant; },
      set selectedSubVariant(v) { player.selectedSubVariant = v; },
      get selectedRange() { return player.selectedRange; },
      set selectedRange(v: string | null) { player.selectedRange = v; },
      get combatArchetype() { return player.combatArchetype; },
      set combatArchetype(v) { player.combatArchetype = v; },
    },
    holdsInventory: {
      get inventory() { return player.inventory; },
      set inventory(v: string[]) { player.inventory = v; },
      get equipment() { return player.equipment; },
      set equipment(v) { player.equipment = v; },
    },
    resetCadenceCounters: resetCadenceCounters ?? ((threshold: number) => {
      player.cadenceSpeedStacks = 0;
      player.cadenceThreshold = threshold;
      player.cadenceCount = 0;
    }),
  };
}

/** Rebuild stats on a wire snapshot (DB hydrate, legacy callers). */
export function recalculatePlayerStatsFromSnapshot(player: PlayerSnapshot): void {
  recalculatePlayerStats(playerStatsTargetFromSnapshot(player));
}
