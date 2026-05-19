import type { PlayerState } from '@mmo-idle/shared';
import { SKILL_TREE, GAME_CONFIG, EQUIPMENT_SLOTS, ITEM_DATABASE } from '@mmo-idle/shared';

function applyStatMod(player: PlayerState, stat: string, value: number): void {
  switch (stat) {
    case 'attack':          player.attack          += value; break;
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
 */
export function recalculatePlayerStats(player: PlayerState): void {
  // 1. Reset to base
  player.attack          = GAME_CONFIG.PLAYER_ATTACK;
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
    // Accumulate named mechanic modifiers
    if (node.mechanicEffects) {
      for (const [key, val] of Object.entries(node.mechanicEffects)) {
        player.passives[key] = (player.passives[key] ?? 0) + val;
      }
    }
  }
  player.attackCooldown  = Math.max(200, player.attackCooldown);
  player.damageReduction = Math.min(0.9, Math.max(0, player.damageReduction));

  // 2b. Reset dynamic combat counters so they sync with new passives
  player.cadenceSpeedStacks = 0;
  player.cadenceThreshold   = 0; // re-initialized lazily on first cadence trigger

  // 3. Apply equipped item stat modifiers
  for (const slot of EQUIPMENT_SLOTS) {
    const defId = player.equipment[slot];
    if (!defId) continue;
    const def = ITEM_DATABASE.get(defId);
    if (!def) continue;
    for (const [stat, value] of Object.entries(def.statModifiers)) {
      applyStatMod(player, stat, value);
    }
  }

  // 4. Clamp current hp to the new max (don't auto-heal, but don't exceed cap)
  player.hp = Math.max(1, Math.min(player.hp, player.maxHp));
}
