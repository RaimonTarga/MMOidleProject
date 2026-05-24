import { ESSENCE_TYPES, MONSTER_DATABASE, TEST_ROOM_NODE_ID } from '@mmo-idle/shared';
import type { PlayerState } from '@mmo-idle/shared';
import type { World } from '../world/World';
import { resetCombatState } from './combatState';
import { recalculatePlayerStats } from './stats';

const INTERACT_COOLDOWN_MS = 2_000;
const TEST_ROOM_ESSENCE_AMOUNT = 1_000_000_000;
const lastInteractionAt = new Map<string, number>();

export function updateTestRoomInteract(world: World, now = Date.now()): void {
  for (const player of world.players.values()) {
    if (player.nodeId !== TEST_ROOM_NODE_ID) continue;
    grantTestRoomEssences(player);

    for (const monster of world.monsters.values()) {
      if (monster.nodeId !== TEST_ROOM_NODE_ID) continue;

      const interactKind = MONSTER_DATABASE.get(monster.monsterTypeId)?.interactKind;
      if (!interactKind) continue;

      const dx = monster.x - player.x;
      const dy = monster.y - player.y;
      if (dx * dx + dy * dy > player.attackRange * player.attackRange) continue;

      const cooldownKey = `${player.id}:${monster.id}`;
      if (now - (lastInteractionAt.get(cooldownKey) ?? 0) < INTERACT_COOLDOWN_MS) continue;
      lastInteractionAt.set(cooldownKey, now);

      if (interactKind === 'reset') {
        resetPlayerProgression(world, player);
      } else {
        player.playerTier += 1;
        player.skillPoints += 1;
      }
    }
  }
}

function grantTestRoomEssences(player: PlayerState): void {
  for (const type of ESSENCE_TYPES) {
    player.essences[type] = TEST_ROOM_ESSENCE_AMOUNT;
  }
}

function resetPlayerProgression(world: World, player: PlayerState): void {
  player.unlockedSkills = [];
  player.skillPoints = 0;
  player.playerTier = 0;
  player.currentSkillTier = 0;
  player.selectedClass = null;
  player.selectedSubVariant = null;
  player.selectedRange = null;
  player.combatArchetype = null;
  player.questProgress = {};
  player.attackTargetId = null;
  player.auto = false;

  recalculatePlayerStats(player);
  player.hp = player.maxHp;

  const combatState = world.playerCombatState.get(player.id);
  if (combatState) resetCombatState(combatState);
}
