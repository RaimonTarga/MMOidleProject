import {
  emptyEquipment,
  ESSENCE_TYPES,
  GAME_CONFIG,
  NODE_BIOMES,
  pointInNodeFeatureShape,
  resetTracksCombat,
  RESOLVED_NODE_FEATURES,
  RUNE_ALTAR_FEATURE_ID,
  SKILL_TREE,
  TEST_ROOM_NODE_ID,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../ecs/entity';
import { detachComponent } from '../ecs/markerHelpers';
import { markSliceDirty } from '../ecs/dirtyHelpers';
import { syncArchetypeSlices } from '../ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../ecs/playerEntityFormulas';
import { setAggroTarget, setAttackTarget } from '../systems/combat/ai/targeting';
import { clearEngagement } from '../systems/combat/ai/engagement';
import { grantDevLoadout } from '../systems/player/economy/grantDevWeapon';
import { checkRecipeUnlocks } from '../systems/player/progression/rewards';
import {
  clearAutoTraversePath,
} from '../systems/world/autoTraverse';
import { stopEntity } from '../systems/world/movement';
import { ensureBoss, ensurePopulation } from '../systems/world/spawning';
import { thawNode } from '../world/nodeLifecycle';
import { rightmostEntranceTarget } from '../world/nodePath';
import type { World } from '../world/World';
import {
  clearSummonerCommand,
} from '../systems/classes/archetypes/summoner/command';
import {
  despawnMinionsForOwner,
  relocateMinionsForOwner,
} from '../systems/classes/archetypes/summoner';

export interface GameActionResult {
  ok: boolean;
  message: string;
}

export function resetPlayerClass(
  world: World,
  player: PlayerEntity,
  options: { requireAltar: boolean },
): GameActionResult {
  if (options.requireAltar) {
    const altar = RESOLVED_NODE_FEATURES[player.hasPosition.nodeId]?.find(
      (f) => f.id === RUNE_ALTAR_FEATURE_ID,
    );
    if (!altar || !pointInNodeFeatureShape(player.hasPosition.current, altar.shape)) {
      return { ok: false, message: 'Player is not standing on a rune altar.' };
    }
  }

  let refund = 0;
  for (const id of player.usesSkills.unlockedSkills) {
    refund += SKILL_TREE.get(id)?.cost ?? 0;
  }
  player.tracksProgression.skillPoints += refund;
  player.tracksProgression.currentSkillTier = 0;

  clearPlayerSkillState(world, player);
  player.hasHealth.hp = player.hasHealth.maxHp;

  markSliceDirty(world, player, 'tracksProgression');
  markSliceDirty(world, player, 'usesSkills');
  markSliceDirty(world, player, 'hasHealth');
  return { ok: true, message: 'Player class/perks reset.' };
}

export function resetPlayerProgress(world: World, player: PlayerEntity): GameActionResult {
  player.tracksProgression.level = 1;
  player.tracksProgression.skillPoints = 0;
  player.tracksProgression.biomeXP = {};
  player.tracksProgression.biomeLevel = {};
  player.tracksProgression.unlockedRecipes = [];
  player.tracksProgression.questProgress = {};
  player.tracksProgression.playerTier = 0;
  player.tracksProgression.currentSkillTier = 0;
  player.tracksProgression.bossesCleared = [];
  player.tracksProgression.clearedNodes = [];
  for (const type of ESSENCE_TYPES) {
    player.tracksProgression.essences[type] = 0;
  }

  player.holdsInventory.inventory = [];
  player.holdsInventory.equipment = emptyEquipment();
  player.holdsInventory.itemUpgrades = {};
  player.usesAutocombat.auto = false;
  clearAutoTraversePath(world, player);

  clearPlayerSkillState(world, player);
  player.hasHealth.hp = player.hasHealth.maxHp;

  markSliceDirty(world, player, 'tracksProgression');
  markSliceDirty(world, player, 'holdsInventory');
  markSliceDirty(world, player, 'usesSkills');
  markSliceDirty(world, player, 'usesAutocombat');
  markSliceDirty(world, player, 'hasHealth');
  return { ok: true, message: 'Player progress reset.' };
}

export function teleportPlayerToNode(
  world: World,
  player: PlayerEntity,
  nodeId: string,
): GameActionResult {
  if (!NODE_BIOMES[nodeId]) return { ok: false, message: `Unknown node: ${nodeId}` };

  const fromNodeId = player.hasPosition.nodeId;
  if (fromNodeId === TEST_ROOM_NODE_ID) {
    for (const type of ESSENCE_TYPES) {
      player.tracksProgression.essences[type] = 0;
    }
    markSliceDirty(world, player, 'tracksProgression');
  }

  player.hasPosition.nodeId = nodeId;
  if (fromNodeId !== nodeId) world.movePlayerNode(fromNodeId, nodeId, player.isPlayer.id);

  if (world.isNodeFrozen(nodeId)) {
    world.nodePreparingEmitter?.(player.isPlayer.id, nodeId);
    thawNode(world, nodeId);
  }

  player.hasPosition.current = rightmostEntranceTarget(nodeId);
  world.resetNodeDeltaState(nodeId);
  clearPlayerMotionAndTargets(world, player);
  relocateMinionsForOwner(world, player);
  clearAggroForPlayer(world, player.isPlayer.id);
  markSliceDirty(world, player, 'hasPosition');
  markSliceDirty(world, player, 'usesAutocombat');
  return { ok: true, message: `Player teleported to ${nodeId}.` };
}

export function goToTestRoom(world: World, player: PlayerEntity): GameActionResult {
  const spawn = {
    x: GAME_CONFIG.NODE_WIDTH / 2,
    y: GAME_CONFIG.NODE_HEIGHT / 2 - 200,
  };
  const fromNodeId = player.hasPosition.nodeId;
  player.hasPosition.nodeId = TEST_ROOM_NODE_ID;
  if (fromNodeId !== TEST_ROOM_NODE_ID) {
    world.movePlayerNode(fromNodeId, TEST_ROOM_NODE_ID, player.isPlayer.id);
  }
  player.hasPosition.current = spawn;
  world.resetNodeDeltaState(TEST_ROOM_NODE_ID);
  clearPlayerMotionAndTargets(world, player);
  clearAggroForPlayer(world, player.isPlayer.id);
  markSliceDirty(world, player, 'hasPosition');
  markSliceDirty(world, player, 'usesAutocombat');
  return { ok: true, message: 'Player moved to the test room.' };
}

export function leaveTestRoom(world: World, player: PlayerEntity): GameActionResult {
  for (const type of ESSENCE_TYPES) {
    player.tracksProgression.essences[type] = 0;
  }
  markSliceDirty(world, player, 'tracksProgression');
  world.respawnPlayer(player.isPlayer.id);
  return { ok: true, message: 'Player returned to the clearing.' };
}

export function refreshPlayerRecipes(world: World, player: PlayerEntity): GameActionResult {
  checkRecipeUnlocks(player);
  markSliceDirty(world, player, 'tracksProgression');
  return { ok: true, message: 'Recipe unlocks refreshed.' };
}

export function equipPhaseTester(world: World, player: PlayerEntity): GameActionResult {
  grantDevLoadout(world, player);
  return { ok: true, message: 'Phase tester loadout equipped.' };
}

export function respawnNode(world: World, nodeId: string): GameActionResult {
  if (!NODE_BIOMES[nodeId]) return { ok: false, message: `Unknown node: ${nodeId}` };
  if (world.isNodeFrozen(nodeId)) thawNode(world, nodeId);
  for (const monster of [...world.monsterEntitiesInNode(nodeId)]) {
    world.removeMonsterEntity(monster.isMonster.id);
  }
  world.nextMonsterIdByNode.delete(nodeId);
  ensurePopulation(world, nodeId);
  ensureBoss(world, nodeId);
  world.reconcileMonsterCounts();
  world.resetNodeDeltaState(nodeId);
  return { ok: true, message: `Node ${nodeId} respawned.` };
}

function clearPlayerSkillState(world: World, player: PlayerEntity): void {
  player.usesSkills.unlockedSkills = [];
  player.usesSkills.passives = {};
  player.usesSkills.selectedClass = null;
  player.usesSkills.selectedSubVariant = null;
  player.usesSkills.selectedRange = null;
  player.usesSkills.combatArchetype = null;

  clearPlayerMotionAndTargets(world, player);
  detachComponent(world, player, 'hasEmpoweredAttack');
  detachComponent(world, player, 'hasOverdrive');
  detachComponent(world, player, 'hasAlignment');
  detachComponent(world, player, 'inAcChargePhase');
  detachComponent(world, player, 'inAcDischarge');
  detachComponent(world, player, 'holdsShields');
  despawnMinionsForOwner(world, player);
  resetTracksCombat(player.tracksCombat);
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  syncArchetypeSlices(world, player);
}

function clearPlayerMotionAndTargets(world: World, player: PlayerEntity): void {
  stopEntity(world, player);
  player.usesAutocombat.auto = false;
  clearAutoTraversePath(world, player);
  clearSummonerCommand(world, player);
  setAttackTarget(world, player, null);
  detachComponent(world, player, 'isChanneling');
  clearEngagement(world, player);
}

function clearAggroForPlayer(world: World, playerId: string): void {
  for (const monster of world.aggroedMonsters) {
    if (
      monster.hasAggroTarget.targetKind === 'player' &&
      monster.hasAggroTarget.targetId === playerId
    ) {
      setAggroTarget(world, monster, null, Date.now());
    }
  }
}
