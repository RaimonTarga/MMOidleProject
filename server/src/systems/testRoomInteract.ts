import { ESSENCE_TYPES, MONSTER_DATABASE, TEST_ROOM_NODE_ID } from '@mmo-idle/shared';
import type { PlayerEntity } from '../ecs/components/player';
import { withPlayerSnapshotDraft } from '../ecs/playerSnapshotAdapter';
import type { World } from '../world/World';
import { resetCombatState } from './combatState';
import { recalculatePlayerStats } from './stats';

const INTERACT_COOLDOWN_MS = 2_000;
const TEST_ROOM_ESSENCE_AMOUNT = 1_000_000_000;
const lastInteractionAt = new Map<string, number>();

export function updateTestRoomInteract(world: World, now = Date.now()): void {
  for (const player of world.playerEntities) {
    if (player.hasPosition.nodeId !== TEST_ROOM_NODE_ID) continue;
    grantTestRoomEssences(player);

    for (const e of world.monsterEntities) {
      if (e.hasPosition.nodeId !== TEST_ROOM_NODE_ID) continue;

      const interactKind = MONSTER_DATABASE.get(e.isMonster.monsterTypeId)?.interactKind;
      if (!interactKind) continue;

      const dx = e.hasPosition.current.x - player.hasPosition.current.x;
      const dy = e.hasPosition.current.y - player.hasPosition.current.y;
      if (dx * dx + dy * dy > player.performsAttack.attackRange * player.performsAttack.attackRange) continue;

      const cooldownKey = `${player.isPlayer.id}:${e.isMonster.id}`;
      if (now - (lastInteractionAt.get(cooldownKey) ?? 0) < INTERACT_COOLDOWN_MS) continue;
      lastInteractionAt.set(cooldownKey, now);

      if (interactKind === 'reset') {
        resetPlayerProgression(world, player);
      } else {
        player.tracksProgression.playerTier += 1;
        player.tracksProgression.skillPoints += 1;
      }
    }
  }
}

function grantTestRoomEssences(player: PlayerEntity): void {
  for (const type of ESSENCE_TYPES) {
    player.tracksProgression.essences[type] = TEST_ROOM_ESSENCE_AMOUNT;
  }
}

function resetPlayerProgression(world: World, player: PlayerEntity): void {
  withPlayerSnapshotDraft(player, draft => {
    draft.unlockedSkills = [];
    draft.skillPoints = 0;
    draft.playerTier = 0;
    draft.currentSkillTier = 0;
    draft.selectedClass = null;
    draft.selectedSubVariant = null;
    draft.selectedRange = null;
    draft.combatArchetype = null;
    draft.questProgress = {};
    draft.attackTargetId = null;
    draft.auto = false;

    recalculatePlayerStats(draft);
    draft.hp = draft.maxHp;
  });

  resetCombatState(player.combatState);

  // Snapshot mirror fields were just reset — re-sync typed archetype components.
  world.refreshArchetypeComponents(player.isPlayer.id);
}
