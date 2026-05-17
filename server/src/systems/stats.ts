import type { PlayerState } from '@mmo-idle/shared';
import { SKILL_TREE, GAME_CONFIG, EQUIPMENT_SLOTS, ITEM_DATABASE } from '@mmo-idle/shared';

function applyStatMod(player: PlayerState, stat: string, value: number): void {
  switch (stat) {
    case 'attack':         player.attack         += value; break;
    case 'defense':        player.defense        += value; break;
    case 'attackRange':    player.attackRange    += value; break;
    case 'attackCooldown': player.attackCooldown += value; break;
    case 'maxHp':          player.maxHp          += value; break;
    case 'hpRegen':        player.hpRegen        += value; break;
    case 'speed':          player.speed          += value; break;
  }
}

/**
 * Deterministic full stat rebuild: base constants → skill effects → equipment modifiers.
 * Call this whenever unlockedSkills or equipment changes instead of applying deltas.
 */
export function recalculatePlayerStats(player: PlayerState): void {
  // 1. Reset to base
  player.attack         = GAME_CONFIG.PLAYER_ATTACK;
  player.defense        = GAME_CONFIG.PLAYER_DEFENSE;
  player.attackRange    = GAME_CONFIG.PLAYER_ATTACK_RANGE;
  player.attackCooldown = GAME_CONFIG.PLAYER_ATTACK_COOLDOWN;
  player.maxHp          = GAME_CONFIG.PLAYER_MAX_HP;
  player.hpRegen        = GAME_CONFIG.PLAYER_HP_REGEN;
  player.speed          = GAME_CONFIG.PLAYER_SPEED;

  // 2. Apply unlocked skill effects
  for (const skillId of player.unlockedSkills) {
    const node = SKILL_TREE.get(skillId);
    if (!node) continue;
    const e = node.statEffects;
    player.attack         += e.attack         ?? 0;
    player.defense        += e.defense        ?? 0;
    player.attackRange    += e.attackRange    ?? 0;
    player.attackCooldown += e.attackCooldown ?? 0;
    player.maxHp          += e.maxHp          ?? 0;
  }
  player.attackCooldown = Math.max(200, player.attackCooldown);

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
