import type { PlayerSnapshot } from '../index';
import { SKILL_TREE } from '../skillTree';
import { ITEM_DATABASE } from '../itemDatabase';
import { EQUIPMENT_SLOTS } from '../items';
import { GAME_CONFIG } from '../index';
import { mergePassives } from '../passives';

// Class-specific bonus applied when the player chose close range (range-close).
// Heavier classes get more plating; lighter classes get more hpRegen.
// Total bonus is equal across all classes — only the composition differs.
const CLOSE_RANGE_CLASS_BONUS: Record<string, { plating: number; hpRegen: number }> = {
  'cooldown-root': { plating: 5, hpRegen: 1 },
  'dot-root':      { plating: 4, hpRegen: 2 },
  'cadence-root':  { plating: 3, hpRegen: 3 },
  'reload-root':   { plating: 2, hpRegen: 4 },
  'energy-root':   { plating: 1, hpRegen: 5 },
};

function applyStatMod(player: PlayerSnapshot, stat: string, value: number): void {
  switch (stat) {
    case 'attack':          player.attack          += value; break;
    case 'onHitDamage':     player.onHitDamage     += value; break;
    case 'plating':         player.plating         += value; break;
    case 'damageReduction': player.damageReduction += value; break;
    case 'evasion':         player.evasion         += value; break;
    case 'attackRange':     player.attackRange     += value; break;
    case 'attackCooldown':  player.attackCooldown  += value; break;
    case 'maxHp':           player.maxHp           += value; break;
    case 'hpRegen':         player.hpRegen         += value; break;
    case 'speed':           player.speed           += value; break;
  }
}

/**
 * Deterministic full stat rebuild: base constants → weapon aps → skill effects → equipment modifiers.
 * Call this whenever unlockedSkills or equipment changes instead of applying deltas.
 *
 * Mutates the passed-in `player` draft in place. Pure with respect to external state:
 * reads only static SKILL_TREE / ITEM_DATABASE / GAME_CONFIG constants; no clocks, no random, no I/O.
 */
export function recalculatePlayerStats(player: PlayerSnapshot): void {
  // 1. Reset to base
  player.attack          = GAME_CONFIG.PLAYER_ATTACK;
  player.onHitDamage     = 0;
  player.plating         = GAME_CONFIG.PLAYER_PLATING;
  player.damageReduction = 0;
  player.evasion         = 0;
  player.attackRange     = GAME_CONFIG.PLAYER_ATTACK_RANGE;
  player.attackCooldown  = GAME_CONFIG.PLAYER_ATTACK_COOLDOWN;
  player.maxHp           = GAME_CONFIG.PLAYER_MAX_HP;
  player.hpRegen         = GAME_CONFIG.PLAYER_HP_REGEN;
  player.speed           = GAME_CONFIG.PLAYER_SPEED;

  // 1b. Weapon attack rate: if a weapon with attacksPerSecond is equipped, its value
  //     replaces the unarmed base cooldown before any skill deltas are applied.
  const weaponId = player.equipment.weapon;
  const weapon   = weaponId ? ITEM_DATABASE.get(weaponId) : undefined;
  if (weapon?.attacksPerSecond) {
    player.attackCooldown = Math.round(1000 / weapon.attacksPerSecond);
  }

  // 2. Apply unlocked skill effects (stat deltas + mechanic passives)
  player.passives = {};
  for (const skillId of player.unlockedSkills) {
    const node = SKILL_TREE.get(skillId);
    if (!node) continue;
    const e = node.statEffects;
    player.attack          += e.attack          ?? 0;
    player.plating         += e.plating         ?? 0;
    player.damageReduction += e.damageReduction ?? 0;
    player.evasion         += e.evasion         ?? 0;
    player.attackRange     += e.attackRange     ?? 0;
    player.attackCooldown  += e.attackCooldown  ?? 0;
    player.maxHp           += e.maxHp           ?? 0;
    player.hpRegen         += e.hpRegen         ?? 0;
    player.speed           += e.speed           ?? 0;
    mergePassives(player.passives, node.mechanicEffects);
  }
  player.attackCooldown  = Math.max(200, player.attackCooldown);
  player.damageReduction = Math.min(0.9, Math.max(0, player.damageReduction));

  // 2b. Class-specific close-range bonus (applied after all skill deltas so it
  //     stacks cleanly on top of the universal range-close node's stat effects).
  if (player.selectedRange === 'range-close' && player.selectedClass) {
    const bonus = CLOSE_RANGE_CLASS_BONUS[player.selectedClass];
    if (bonus) {
      player.plating  += bonus.plating;
      player.hpRegen  += bonus.hpRegen;
    }
  }

  // 2c. Reset dynamic combat counters and update archetype values
  player.cadenceSpeedStacks = 0;
  if (player.combatArchetype === 'cadence') {
    const base = Math.round(player.passives['cadence.empowered-threshold'] ?? 5);
    const mod  = Math.round(player.passives['cadence.threshold-mod']        ?? 0);
    player.cadenceThreshold = Math.max(2, base + mod);
    // Reset the display counter so the client immediately reflects the new threshold.
    // The CombatState counter is reset separately in the skill-unlock handler when
    // the threshold actually changes, so both display and combat logic stay in sync.
    player.cadenceCount = 0;
  } else {
    player.cadenceThreshold = 0;
    player.cadenceCount = 0;
  }

  // 3. Apply equipped item stat modifiers and mechanic effects
  for (const slot of EQUIPMENT_SLOTS) {
    const defId = player.equipment[slot];
    if (!defId) continue;
    const def = ITEM_DATABASE.get(defId);
    if (!def) continue;
    for (const [stat, value] of Object.entries(def.statModifiers)) {
      applyStatMod(player, stat, value);
    }
    mergePassives(player.passives, def.mechanicEffects);
  }

  // 3b. Reload archetype: double attack speed and half damage as a final multiplier layer.
  //     Applied after all additive bonuses (skills + items) so it scales with gear correctly.
  if (player.combatArchetype === 'reload') {
    player.attack         = Math.max(1, Math.floor(player.attack * 0.5));
    player.attackCooldown = Math.max(200, Math.round(player.attackCooldown * 0.5));
    if ((player.passives['reload.gatling'] ?? 0) > 0) {
      player.attackCooldown = Math.max(100, Math.round(player.attackCooldown * 0.5));
    }
  }

  // 4. Clamp current hp to the new max (don't auto-heal, but don't exceed cap)
  player.hp = Math.max(1, Math.min(player.hp, player.maxHp));
}
