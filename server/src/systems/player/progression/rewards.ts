import { NODE_BIOMES, NODE_MODIFIERS, modifierRewardMult, MONSTER_DATABASE, RECIPE_DATABASE, biomeLevelCap, biomeXpForBiomeLevel, bossClearKey, BIOME_DATABASE, ULTIMATE_CLEAR_VOID_OVERLORD, GAME_CONFIG, catalystProgressPerUnit } from '@mmo-idle/shared';
import type { EssenceType } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';
import { checkSealTierAdvance, registerKillForQuests } from './questSystem';
import { recordWorldLogEvent } from '../../../world/worldLog';
import { actorFromPlayer } from '../../../world/worldLogActors';
import { notifyVoidOverlordDeath } from '../../combat/ai/ultimateEncounter';
import { onDungeonMonsterRewarded } from '../../world/dungeons/dungeon';

export interface KillRewards {
  essence: number;
  essenceType: EssenceType;
  level: number;
  biomeXp?: number;
}

const FALLBACK_REWARDS: KillRewards = { essence: 1, essenceType: 'green', level: 1 };
const DEFAULT_BOSS_RESPAWN_MS = 30_000;
const VOID_OVERLORD_RESPAWN_MS = 5 * 60_000;

export interface KillRewardInfo {
  essenceGained: number;
  essenceType: EssenceType;
  biomeXpGained: number;
  tierAdvanced: boolean;
}

export function rewardPlayer(entity: PlayerEntity, rewards: KillRewards): void {
  const type = rewards.essenceType as keyof typeof entity.tracksProgression.essences;
  if (type in entity.tracksProgression.essences) {
    entity.tracksProgression.essences[type] += rewards.essence;
  }
  entity.tracksProgression.level += rewards.level;
}

/**
 * Add per-kill catalyst progress under a combat-family key and mint catalysts
 * whenever progress crosses the threshold (carrying the remainder). No-op when
 * the node has no pace family (excluded node) or the monster grants no weight.
 * Caller marks the slice dirty.
 *
 * The threshold is per BIOME TIER, so a tier can set its own catalyst identity
 * without touching any other tier's.
 */
function grantCatalystProgress(
  entity: PlayerEntity,
  familyKey: string | undefined,
  weight: number,
  biomeTier: number,
  t1Threshold: number | undefined,
): void {
  if (!familyKey || weight <= 0) return;
  const prog = entity.tracksProgression;
  const per = biomeTier === 1 && t1Threshold !== undefined
    ? t1Threshold
    : catalystProgressPerUnit(biomeTier);
  const total = (prog.catalystProgress[familyKey] ?? 0) + weight;
  const minted = Math.floor(total / per);
  prog.catalystProgress[familyKey] = total - minted * per;
  if (minted > 0) {
    prog.catalysts[familyKey] = (prog.catalysts[familyKey] ?? 0) + minted;
  }
}


function scheduleBossRespawn(world: World, monster: MonsterEntity): void {
  const durationMs =
    monster.isMonster.monsterTypeId === 'void-overlord'
      ? VOID_OVERLORD_RESPAWN_MS
      : DEFAULT_BOSS_RESPAWN_MS;
  const respawnAt = Date.now() + durationMs;
  const nodeId = monster.hasPosition.nodeId;

  const marker = {
    monsterTypeId: monster.isMonster.monsterTypeId,
    pos: { ...monster.hasPosition.current },
    respawnAt,
    durationMs,
  };
  world.bossRespawnAt.set(nodeId, respawnAt);
  world.bossRespawnMarkers.set(nodeId, marker);

  if (monster.isMonster.monsterTypeId === 'void-overlord') {
    world.suppressedFeatureBlocks.add(`${nodeId}:abyssal_throne`);
    // The overlord cooldown is global and long (5 min); persist it so it is
    // remembered across node despawn (freeze/thaw) and server restarts.
    world.overlordRespawnPersist?.({ nodeId, ...marker });
  }

  world.broadcastBossFelledState();
}

interface BiomeXpResult {
  xpGain: number;
  prevLevel: number;
  newLevel: number;
  unlockedRecipeIds: string[];
}

function applyBiomeXP(
  world: World,
  entity: PlayerEntity,
  nodeId: string,
  xpGain: number,
): BiomeXpResult {
  const biomeInfo = NODE_BIOMES[nodeId];
  if (!biomeInfo) {
    return { xpGain: 0, prevLevel: 0, newLevel: 0, unlockedRecipeIds: [] };
  }

  const { biomeGroup, biomeTier } = biomeInfo;
  const levelCap = biomeLevelCap(entity.tracksProgression.playerTier, biomeGroup);
  const prevLevel = entity.tracksProgression.biomeLevel[biomeGroup] ?? 0;
  // GAIN STOP, never a clamp. Since the T3 economy pass a retired biome's cap stops
  // growing, so a legacy save can sit ABOVE its cap — it keeps that level and the Global
  // Mastery it confers (globalMastery() sums raw biomeLevel and has no ceiling), it just
  // banks no further XP here. Nothing below writes a lower level.
  if (prevLevel >= levelCap) {
    return { xpGain: 0, prevLevel, newLevel: prevLevel, unlockedRecipeIds: [] };
  }

  const xpMult = GAME_CONFIG.BIOME_XP_REWARD_MULT_BY_TIER[biomeTier] ?? 1;
  const scaledXpGain = Math.round(xpGain * xpMult);

  const prevUnlocked = [...entity.tracksProgression.unlockedRecipes];
  const newXP = (entity.tracksProgression.biomeXP[biomeGroup] ?? 0) + scaledXpGain;
  entity.tracksProgression.biomeXP[biomeGroup] = newXP;

  let rawLevel = prevLevel;
  while (rawLevel < levelCap && newXP >= biomeXpForBiomeLevel(biomeGroup, rawLevel + 1)) rawLevel++;
  const newLevel = rawLevel;
  const unlockedRecipeIds: string[] = [];
  if (newLevel > prevLevel) {
    entity.tracksProgression.biomeLevel[biomeGroup] = newLevel;
    checkRecipeUnlocks(entity, biomeGroup, newLevel);
    for (const recipeId of entity.tracksProgression.unlockedRecipes) {
      if (!prevUnlocked.includes(recipeId)) unlockedRecipeIds.push(recipeId);
    }
    const biomeDef = BIOME_DATABASE.get(biomeGroup);
    recordWorldLogEvent(
      world,
      {
        kind: 'biome-level-up',
        nodeId,
        player: actorFromPlayer(entity),
        biomeGroup,
        biomeName: biomeDef?.name ?? biomeGroup,
        prevLevel,
        newLevel,
        unlockedRecipeIds,
      },
      {
        visibility: 'node',
        relatedPlayerIds: [entity.isPlayer.id],
        nodeId,
      },
    );
    world.analyticsProgression?.(
      entity.isPlayer.id,
      nodeId,
      'biome-level-up',
      newLevel,
    );
  }
  return { xpGain: scaledXpGain, prevLevel, newLevel, unlockedRecipeIds };
}

export function checkRecipeUnlocks(entity: PlayerEntity, biomeGroup?: string, newLevel?: number): void {
  for (const recipe of RECIPE_DATABASE.values()) {
    if (recipe.requiredBossClear &&
        !entity.tracksProgression.bossesCleared.includes(recipe.requiredBossClear)) {
      continue;
    }
    const level = newLevel ?? entity.tracksProgression.biomeLevel[recipe.recipeGroup] ?? 0;
    if (biomeGroup !== undefined && recipe.recipeGroup !== biomeGroup) continue;
    if (recipe.requiredBiomeLevel > level) continue;
    if (!entity.tracksProgression.unlockedRecipes.includes(recipe.id)) {
      entity.tracksProgression.unlockedRecipes.push(recipe.id);
    }
  }
}

function applyKillRewardsToPlayer(
  world: World,
  recipient: PlayerEntity,
  monster: MonsterEntity,
  options: { suppressBossRespawn?: boolean } = {},
): KillRewardInfo {
  const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
  const rewards = def?.rewards ?? FALLBACK_REWARDS;
  const nodeId = monster.hasPosition.nodeId;
  const biomeInfo = NODE_BIOMES[nodeId];
  const biomeTier = biomeInfo?.biomeTier ?? 1;
  const essenceMult = GAME_CONFIG.BIOME_ESSENCE_TIER_MULT[biomeTier] ?? 1;
  // Node modifiers are net difficulty increases, so they pay a matching premium on
  // everything the kill is worth: essence, biome XP and catalyst progress alike.
  // Bosses are modifier-immune for STATS, but the node's reward identity still
  // applies to them (as it always has for the catalyst bundle below).
  const nodeModifier = NODE_MODIFIERS[nodeId]?.modifier;
  const rewardMult = modifierRewardMult(nodeModifier, biomeTier);
  // Dev-only flat scalar on top of the real reward maths, so a playtest can reach
  // late content without farming it. 1x in production and by default, which makes
  // every line below identical to the shipped formula.
  const debugMult = world.rewardMultiplier;
  const scaledEssence = Math.max(
    1,
    Math.round(rewards.essence * essenceMult * rewardMult * debugMult),
  );
  rewardPlayer(recipient, { ...rewards, essence: scaledEssence });
  // Catalyst progress is keyed by the NODE'S modifier (not its biome): every kill in
  // an Alacrity node grants Alacrity Catalyst regardless of biome. The weight
  // defaults to the monster's base essence reward (a tuned per-mob toughness
  // number) unless it sets an explicit `catalystWeight`. No modifier
  // (clearing / test room / throne) → no grant.
  // DELIBERATELY NOT scaled by `debugMult`. The dev multiplier exists to skip
  // essence/mastery FARMING, but catalysts are a discovery, not a currency pile:
  // doubling their rate turns "I found a catalyst" into "I have another stack"
  // and destroys the very thing a playtest is trying to observe. Scaling here
  // was what produced the 15-fortified-per-run stockpiles in the 2026-08-31 2x
  // cohort. Node-modifier premium (`rewardMult`) still applies -- that is the
  // real economy, not a debug knob.
  const catalystWeight = Math.round(
    (def?.rewards.catalystWeight ?? rewards.essence) * rewardMult,
  );
  if (catalystWeight > 0 && nodeModifier) {
    grantCatalystProgress(
      recipient,
      nodeModifier,
      catalystWeight,
      biomeTier,
      world.t1EconomyConfigForPlayer(recipient.isPlayer.id).catalystProgressPerUnitT1,
    );
    markSliceDirty(world, recipient, 'tracksProgression');
  }
  const biomeResult = applyBiomeXP(
    world,
    recipient,
    nodeId,
    Math.max(1, Math.round((rewards.biomeXp ?? 1) * rewardMult * debugMult)),
  );
  const questResult = registerKillForQuests(recipient, monster.isMonster.monsterTypeId);
  if (monster.isMonster.isBoss && !monster.isEncounterAdd) {
    if (!options.suppressBossRespawn) {
      scheduleBossRespawn(world, monster);
    }
    const info = NODE_BIOMES[monster.hasPosition.nodeId];
    if (info) {
      const key = bossClearKey(info.biomeGroup, info.biomeTier);
      if (!recipient.tracksProgression.bossesCleared.includes(key)) {
        recipient.tracksProgression.bossesCleared.push(key);
        markSliceDirty(world, recipient, 'tracksProgression');
      }
    }
    if (monster.isMonster.monsterTypeId === 'void-overlord') {
      const token = ULTIMATE_CLEAR_VOID_OVERLORD;
      if (!recipient.tracksProgression.bossesCleared.includes(token)) {
        recipient.tracksProgression.bossesCleared.push(token);
        markSliceDirty(world, recipient, 'tracksProgression');
      }
    }
  }
  // Seals ARE boss first-clears, so this must run AFTER the block above records
  // one: the boss whose clear completes the requirement has to advance the player
  // on that same kill, not the next one. Tier 0 still advances by quest (no
  // bosses exist at tier 0), which is why the quest result short-circuits.
  const tierResult = questResult.advanced
    ? questResult
    : checkSealTierAdvance(recipient);
  if (tierResult.advanced && tierResult.prevTier !== undefined && tierResult.newTier !== undefined) {
    markSliceDirty(world, recipient, 'tracksProgression');
    recordWorldLogEvent(
      world,
      {
        kind: 'player-tier-up',
        nodeId: monster.hasPosition.nodeId,
        player: actorFromPlayer(recipient),
        prevTier: tierResult.prevTier,
        newTier: tierResult.newTier,
        questId: tierResult.questId,
        questName: tierResult.questName,
      },
      {
        visibility: 'node',
        relatedPlayerIds: [recipient.isPlayer.id],
        nodeId: monster.hasPosition.nodeId,
      },
    );
    world.analyticsProgression?.(
      recipient.isPlayer.id,
      monster.hasPosition.nodeId,
      'player-tier-up',
      tierResult.newTier,
    );
    world.pendingAscensions.push(recipient.isPlayer.id);
  }
  checkRecipeUnlocks(recipient);
  return {
    essenceGained: scaledEssence,
    essenceType: rewards.essenceType,
    biomeXpGained: biomeResult.xpGain,
    tierAdvanced: tierResult.advanced,
  };
}

export function grantMonsterRewards(
  world: World,
  killerPlayerId: string,
  monster: MonsterEntity,
): KillRewardInfo | null {
  const killer = world.getPlayerEntity(killerPlayerId);
  if (!killer) return null;
  // A necromancer's risen dead are worth NOTHING: no essence, biome XP, catalyst
  // progress, quest credit or party share. This single gate covers every kill
  // path because they all funnel through here, and it is why the raise loop can
  // never be farmed — killing the raiser is the only way to stop the tide.
  if (monster.isRaised) return null;

  const suppressBossRespawn = monster.tracksDungeon?.source === 'dungeonBoss';
  const killerInfo = applyKillRewardsToPlayer(world, killer, monster, {
    suppressBossRespawn,
  });
  const dungeonResult = onDungeonMonsterRewarded(world, killerPlayerId, monster);

  if (monster.isMonster.monsterTypeId === 'void-overlord') {
    notifyVoidOverlordDeath(world, monster, killerPlayerId);
  }

  // Despawn any adds the boss spawned via a 'spawn-adds' script action.
  const spawnedAddIds = monster.scriptsBoss?.spawnedAddIds;
  if (spawnedAddIds?.length) {
    for (const id of spawnedAddIds) world.removeMonsterEntity(id);
    monster.scriptsBoss!.spawnedAddIds = [];
  }

  const party = killer.inParty;
  if (party) {
    const killNodeId = monster.hasPosition.nodeId;
    for (const member of world.playerEntities) {
      if (member === killer) continue;
      if (member.inParty?.leaderId !== party.leaderId) continue;
      if (member.hasPosition.nodeId !== killNodeId) continue;
      applyKillRewardsToPlayer(world, member, monster, {
        suppressBossRespawn: suppressBossRespawn || dungeonResult.suppressBossRespawn,
      });
    }
  }

  return killerInfo;
}
