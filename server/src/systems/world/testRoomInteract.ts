import { ESSENCE_TYPES, MONSTER_DATABASE, TEST_ROOM_NODE_ID, resetTracksCombat } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../ecs/entity';
import type { World } from '../../world/World';
import { syncArchetypeSlices } from '../../ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../../ecs/playerEntityFormulas';
import { setAttackTarget } from '../combat/ai/targeting';

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
  player.usesSkills.unlockedSkills     = [];
  player.tracksProgression.skillPoints = 0;
  player.tracksProgression.playerTier  = 0;
  player.tracksProgression.currentSkillTier = 0;
  player.usesSkills.selectedClass      = null;
  player.usesSkills.selectedSubVariant = null;
  player.usesSkills.selectedRange      = null;
  player.usesSkills.combatArchetype    = null;
  player.tracksProgression.questProgress = {};
  setAttackTarget(world, player, null);
  player.usesAutocombat.auto = false;

  recalculatePlayerEntityStats(world, player);
  syncArchetypeSlices(world, player);
  player.hasHealth.hp = player.hasHealth.maxHp;

  resetTracksCombat(player.tracksCombat);
}
