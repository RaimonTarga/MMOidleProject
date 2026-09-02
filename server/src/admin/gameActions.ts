import {
  DEFAULT_RUNE_LOADOUT,
  ABILITY_DATABASE,
  clampEquippedAbilities,
  emptyEquipment,
  emptyEquippedAbilities,
  emptyEquippedStances,
  emptyEquippedRites,
  ESSENCE_TYPES,
  FAST_BOSS_RETRY_TAINT,
  GAME_CONFIG,
  ITEM_DATABASE,
  NODE_BIOMES,
  pointInNodeFeatureShape,
  resetTracksCombat,
  RESOLVED_NODE_FEATURES,
  RUNE_ALTAR_FEATURE_ID,
  SKILL_TREE,
  TEST_ROOM_NODE_ID,
  runeIdsFromCraftedRecipes,
  normalizeEquippedAbilities,
  normalizeEquipment,
  validStanceIds,
  validRiteIds,
  sanitizeRuneLoadout,
  runeBudgetForGlobalMastery,
  runicPointLoadoutCost,
  RUNE_RECIPE_DATABASE,
  globalMastery,
  type FastBossRetryResult,
  type TierEntryApplyResult,
  type TierEntryProfile,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../ecs/entity';
import { detachComponent } from '../ecs/markerHelpers';
import { markSliceDirty } from '../ecs/dirtyHelpers';
import { syncArchetypeSlices } from '../ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../ecs/playerEntityFormulas';
import { setAggroTarget, setAttackTarget } from '../systems/combat/ai/targeting';
import { clearEngagement } from '../systems/combat/ai/engagement';
import { refillBarrier } from '../systems/defense/barrier/barrier';
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
import { recordWorldLogEvent } from '../world/worldLog';
import { actorFromPlayer } from '../world/worldLogActors';
import { resetDungeonEncounterForFastRetry } from '../systems/world/dungeons/dungeon';
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
  return { ok: true, message: 'Passive points reset.' };
}

export function resetPlayerProgress(world: World, player: PlayerEntity): GameActionResult {
  player.tracksProgression.level = 0;
  player.tracksProgression.skillPoints = 0;
  player.tracksProgression.essences = Object.fromEntries(
    ESSENCE_TYPES.map((type) => [type, 0]),
  ) as typeof player.tracksProgression.essences;
  player.tracksProgression.catalysts = {};
  player.tracksProgression.catalystProgress = {};
  player.tracksProgression.biomeXP = {};
  player.tracksProgression.biomeLevel = {};
  player.tracksProgression.unlockedRecipes = [];
  player.tracksProgression.questProgress = {};
  player.tracksProgression.playerTier = 0;
  player.tracksProgression.currentSkillTier = 0;
  player.tracksProgression.bossesCleared = [];
  player.tracksProgression.clearedNodes = [];
  player.tracksProgression.visitedNodes = [];
  player.tracksProgression.runeRecipesCrafted = [];
  player.tracksProgression.runesOwned = runeIdsFromCraftedRecipes([]);
  player.tracksProgression.runesEquipped = DEFAULT_RUNE_LOADOUT.map((rule) => ({ ...rule }));
  player.tracksProgression.knownAbilities = [];
  player.tracksProgression.equippedAbilities = emptyEquippedAbilities();
  player.tracksProgression.knownStances = [];
  player.tracksProgression.equippedStances = emptyEquippedStances();
  player.tracksProgression.activeStance = null;
  player.tracksProgression.knownRites = [];
  player.tracksProgression.equippedRites = emptyEquippedRites();
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

export function renamePlayer(
  world: World,
  player: PlayerEntity,
  name: string,
): GameActionResult {
  const trimmed = name.trim().slice(0, 24);
  if (!trimmed) return { ok: false, message: 'Name cannot be empty.' };

  player.isPlayer.name = trimmed;
  markSliceDirty(world, player, 'isPlayer');
  return { ok: true, message: `Player renamed to ${trimmed}.` };
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

/**
 * Explicit harness-only boss retry. The socket registration is development
 * gated; this function keeps the authoritative reset/teleport transaction in
 * one place and refuses to mutate a dungeon occupied by another character.
 */
export function prepareFastBossRetry(
  world: World,
  player: PlayerEntity,
  nodeId: string,
  includeGuardians: boolean,
): FastBossRetryResult {
  const tainted = { taint: FAST_BOSS_RETRY_TAINT } as const;
  if (!NODE_BIOMES[nodeId]?.isDungeon) {
    return { ...tainted, success: false, reason: `Not a dungeon node: ${nodeId}` };
  }
  const occupiedByOther = [...world.playerEntitiesInNode(nodeId)].some(
    (other) => other.isPlayer.id !== player.isPlayer.id,
  );
  if (occupiedByOther) {
    return {
      ...tainted,
      success: false,
      reason: `Dungeon ${nodeId} is occupied by another player.`,
      nodeId,
      includeGuardians,
    };
  }

  // A legitimate post-death retry reaches the next attempt with full HP,
  // barrier, cleared statuses/cooldowns/resources, no minions, and no aggro.
  // Reuse that exact authoritative lifecycle, then skip only its travel time.
  world.respawnPlayer(player.isPlayer.id);
  const teleported = teleportPlayerToNode(world, player, nodeId);
  if (!teleported.ok) {
    return { ...tainted, success: false, reason: teleported.message, nodeId, includeGuardians };
  }
  resetDungeonEncounterForFastRetry(world, nodeId, { includeGuardians });

  recordWorldLogEvent(world, {
    kind: 'fast-boss-retry',
    nodeId,
    player: actorFromPlayer(player),
    taint: FAST_BOSS_RETRY_TAINT,
    includeGuardians,
    playerReset: 'respawn-baseline',
    message: `${FAST_BOSS_RETRY_TAINT}: encounter rebuilt for harness retry`,
  }, {
    visibility: 'combat',
    relatedPlayerIds: [player.isPlayer.id],
    nodeId,
  });

  return {
    ...tainted,
    success: true,
    nodeId,
    includeGuardians,
    playerReset: 'respawn-baseline',
  };
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

const TIER_ENTRY_ARCHETYPES = {
  'cadence-root': 'cadence',
  'cooldown-root': 'cooldown',
  'reload-root': 'reload',
  'energy-root': 'energy',
  'dot-root': 'dot',
  'summoner-root': 'summoner',
} as const;

/**
 * Apply one explicit harness profile to a live player. This is a development
 * operation, not a save import: only persistent progression/build slices are
 * accepted, while combat state is rebuilt from scratch below.
 */
export function applyTierEntryProfile(
  world: World,
  player: PlayerEntity,
  profile: TierEntryProfile,
): TierEntryApplyResult {
  const fail = (reason: string): TierEntryApplyResult => ({
    success: false,
    profileId: profile?.id ?? 'unknown',
    reason,
  });
  if (!profile || typeof profile !== 'object') return fail('Profile payload is invalid.');
  if (!Number.isInteger(profile.targetTier) || profile.targetTier < 1) {
    return fail('Profile target tier is invalid.');
  }
  if (profile.economyPolicy !== 'synthetic-combat-progression' &&
      profile.economyPolicy !== 'authoritative-economy-continuation') {
    return fail('Profile economy policy is invalid.');
  }
  const root = SKILL_TREE.get(profile.classRoot);
  const frame = SKILL_TREE.get(profile.frameId);
  if (!root || root.tier !== 0 || root.classId !== profile.classRoot) {
    return fail('Profile class root is invalid.');
  }
  if (!frame || frame.tier !== 1 || frame.classId !== profile.classRoot || frame.parent !== root.id) {
    return fail('Profile frame is not a child of its class root.');
  }
  if (profile.targetTier < 2) return fail('Tier-entry profiles must target tier 2 or later.');
  const spawn = NODE_BIOMES[profile.spawnNodeId];
  if (!spawn || spawn.kind !== 'sanctuary' || spawn.biomeTier !== profile.targetTier) {
    return fail(`Profile spawn ${profile.spawnNodeId} is not the target-tier Sanctuary.`);
  }
  const archetype = TIER_ENTRY_ARCHETYPES[profile.classRoot as keyof typeof TIER_ENTRY_ARCHETYPES];
  if (!archetype) return fail('Profile class root has no combat archetype.');

  const walletEssences = profile.wallet?.essences;
  for (const type of ESSENCE_TYPES) {
    if (!Number.isFinite(walletEssences?.[type]) || (walletEssences?.[type] ?? -1) < 0) {
      return fail(`Profile wallet has an invalid ${type} essence amount.`);
    }
  }
  for (const [family, amount] of Object.entries(profile.wallet?.catalysts ?? {})) {
    if (!Number.isFinite(amount) || amount < 0) return fail(`Profile wallet has invalid ${family} catalysts.`);
  }

  const itemIds = [...new Set([
    ...profile.inventory,
    ...Object.values(profile.equipment),
  ].filter((id): id is string => typeof id === 'string'))];
  if (itemIds.some((id) => !ITEM_DATABASE.has(id))) return fail('Profile contains an unknown item.');
  const equipment = normalizeEquipment(profile.equipment);
  const itemUpgrades: Record<string, number> = {};
  for (const [id, raw] of Object.entries(profile.itemUpgrades ?? {})) {
    if (!itemIds.includes(id) || !Number.isFinite(raw) || raw < 0) {
      return fail(`Profile has an invalid upgrade entry for ${id}.`);
    }
    itemUpgrades[id] = Math.min(ITEM_DATABASE.get(id)?.upgrades?.length ?? 0, Math.floor(raw));
  }

  const knownAbilities = [...new Set(profile.knownAbilities ?? [])];
  if (knownAbilities.some((id) => !ABILITY_DATABASE.has(id))) return fail('Profile contains an unknown ability.');
  const equippedAbilities = clampEquippedAbilities(
    normalizeEquippedAbilities(profile.equippedAbilities),
    profile.targetTier,
  );
  if ([...equippedAbilities.techniques, ...equippedAbilities.guards].some((id) => !knownAbilities.includes(id))) {
    return fail('Profile equips an ability that is not learned.');
  }

  const runeRecipesCrafted = [...new Set(profile.runeRecipesCrafted ?? [])];
  if (runeRecipesCrafted.some((id) => !RUNE_RECIPE_DATABASE.has(id))) {
    return fail('Profile contains an unknown Rune recipe.');
  }
  const runesOwned = runeIdsFromCraftedRecipes(runeRecipesCrafted);
  const knownStances = validStanceIds(profile.knownStances ?? []);
  if (knownStances.length !== new Set(profile.knownStances ?? []).size) return fail('Profile contains an unknown stance.');
  const equippedStances = profile.equippedStances?.default === null || profile.equippedStances?.default === undefined
    ? emptyEquippedStances()
    : { default: profile.equippedStances.default };
  if (equippedStances.default && !knownStances.includes(equippedStances.default)) {
    return fail('Profile default stance is not learned.');
  }
  const knownRites = validRiteIds(profile.knownRites ?? []);
  if (knownRites.length !== new Set(profile.knownRites ?? []).size) return fail('Profile contains an unknown rite.');
  const equippedRites = validRiteIds(profile.equippedRites ?? []);
  if (equippedRites.length !== (profile.equippedRites ?? []).length || equippedRites.some((id) => !knownRites.includes(id))) {
    return fail('Profile equips an unlearned or unknown rite.');
  }
  const budget = runeBudgetForGlobalMastery(globalMastery(profile.biomeLevels ?? {}));
  const runesEquipped = sanitizeRuneLoadout(
    Array.isArray(profile.runesEquipped) ? profile.runesEquipped : [],
    new Set(runesOwned),
    budget,
    archetype,
    new Set(knownStances),
  );
  if (runesEquipped.length !== (profile.runesEquipped ?? []).length) {
    return fail(`Profile Rune loadout is invalid or exceeds the ${budget} RP budget.`);
  }
  if (runicPointLoadoutCost({ rules: runesEquipped, rites: equippedRites }) > budget) {
    return fail(`Profile Rune/Rite loadout exceeds the ${budget} RP budget.`);
  }

  // Relocate first, then clear every transient combat slice. No monsters or
  // encounter state is imported from the source route.
  const fromNodeId = player.hasPosition.nodeId;
  player.hasPosition.nodeId = profile.spawnNodeId;
  if (fromNodeId !== profile.spawnNodeId) {
    world.movePlayerNode(fromNodeId, profile.spawnNodeId, player.isPlayer.id);
  }
  if (world.isNodeFrozen(profile.spawnNodeId)) thawNode(world, profile.spawnNodeId);
  player.hasPosition.current = rightmostEntranceTarget(profile.spawnNodeId);
  world.resetNodeDeltaState(profile.spawnNodeId);
  clearPlayerSkillState(world, player);
  clearAggroForPlayer(world, player.isPlayer.id);
  player.hasStatus.activeBuffs = [];
  for (const marker of [
    'isFleeing', 'isCastingAbility', 'hasArmedAbility', 'hasSweepClip',
    'hasFormationTechnique', 'hasEnvironmentalDot', 'hasNodeFeatureEffect',
    'evadesTelegraphs',
  ] as const) detachComponent(world, player, marker);

  player.tracksProgression.level = Math.max(0, Math.floor(profile.level));
  player.tracksProgression.skillPoints = Math.max(0, Math.floor(profile.skillPoints));
  player.tracksProgression.essences = { ...profile.wallet.essences };
  player.tracksProgression.catalysts = { ...profile.wallet.catalysts };
  player.tracksProgression.catalystProgress = { ...(profile.wallet.catalystProgress ?? {}) };
  player.tracksProgression.biomeLevel = { ...(profile.biomeLevels ?? {}) };
  player.tracksProgression.biomeXP = { ...(profile.biomeXP ?? {}) };
  player.tracksProgression.playerTier = profile.targetTier;
  player.tracksProgression.currentSkillTier = Math.max(2, Math.floor(profile.currentSkillTier));
  player.tracksProgression.bossesCleared = [...new Set(profile.bossesCleared ?? [])];
  player.tracksProgression.clearedNodes = [...new Set(profile.clearedNodes ?? [])];
  player.tracksProgression.visitedNodes = [...new Set(profile.visitedNodes ?? [])];
  player.tracksProgression.questProgress = { ...(profile.questProgress ?? {}) };
  player.tracksProgression.unlockedRecipes = [];
  player.tracksProgression.runeRecipesCrafted = runeRecipesCrafted;
  player.tracksProgression.runesOwned = runesOwned;
  player.tracksProgression.runesEquipped = runesEquipped;
  player.tracksProgression.knownAbilities = knownAbilities;
  player.tracksProgression.equippedAbilities = equippedAbilities;
  player.tracksProgression.knownStances = knownStances;
  player.tracksProgression.equippedStances = equippedStances;
  player.tracksProgression.activeStance = equippedStances.default;
  player.tracksProgression.knownRites = knownRites;
  player.tracksProgression.equippedRites = equippedRites;
  player.holdsInventory.inventory = [...new Set(profile.inventory)];
  player.holdsInventory.equipment = equipment;
  player.holdsInventory.itemUpgrades = itemUpgrades;
  player.usesSkills.unlockedSkills = [root.id, frame.id];
  player.usesSkills.passives = {};
  player.usesSkills.selectedClass = root.id;
  player.usesSkills.selectedSubVariant = frame.subVariantId ?? null;
  player.usesSkills.selectedRange = null;
  player.usesSkills.combatArchetype = archetype;
  player.usesAutocombat.auto = false;
  player.usesAutocombat.autoTraverse = false;

  // Unlock content from the same authoritative recipe gates the live game uses;
  // the profile does not carry an invented unlocked-recipe list.
  checkRecipeUnlocks(player);
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  syncArchetypeSlices(world, player);
  player.hasHealth.hp = player.hasHealth.maxHp;
  refillBarrier(world, player);

  markSliceDirty(world, player, 'hasPosition');
  markSliceDirty(world, player, 'tracksProgression');
  markSliceDirty(world, player, 'holdsInventory');
  markSliceDirty(world, player, 'usesSkills');
  markSliceDirty(world, player, 'usesAutocombat');
  markSliceDirty(world, player, 'hasHealth');
  markSliceDirty(world, player, 'hasStatus');
  return { success: true, profileId: profile.id, targetTier: profile.targetTier };
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
  detachComponent(world, player, 'holdsWards');
  despawnMinionsForOwner(world, player);
  resetTracksCombat(player.tracksCombat);
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  refillBarrier(world, player);
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
