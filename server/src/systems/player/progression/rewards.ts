import { NODE_BIOMES, MONSTER_DATABASE, RECIPE_DATABASE, biomeLevelCap, biomeXpForBiomeLevel, biomeXpRewardMult, bossClearKey, BIOME_DATABASE, GAME_CONFIG, familyForMonster, CAPSTONE_MATERIALS, SHARD_BASE_PER_KILL, SHARD_TIER_MULT, biomeDefensiveLaneAPackets } from '@mmo-idle/shared';
import type { EssenceType } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';
import { checkSealTierAdvance, registerKillForQuests } from './questSystem';
import { recordWorldLogEvent } from '../../../world/worldLog';
import { actorFromPlayer } from '../../../world/worldLogActors';
import { onDungeonMonsterRewarded } from '../../world/dungeons/dungeon';

export interface KillRewards {
  essence: number;
  essenceType: EssenceType;
  level: number;
  biomeXp?: number;
}

const FALLBACK_REWARDS: KillRewards = { essence: 1, essenceType: 'green', level: 1 };
const DEFAULT_BOSS_RESPAWN_MS = 30_000;

/**
 * Design §17's shard-sourcing stopgap: at T1 every node fields only
 * `monsterPoolByTier[1]` (two mobs per biome), so three packets — Engagement,
 * Bulwark, Barrier tempo — have NO T1 family at all and are otherwise
 * unreachable before a biome's third family debuts at tier 2. Until Phase 4
 * reviews the families, a biome boss kill also drops this many shards of EACH
 * distinct Lane-A packet across its three non-weapon lineages (armor, recovery,
 * mobility) — deduplicated per packet, so a biome whose armor and mobility
 * lineages share a Lane A (e.g. Plains' Kill chain) pays that packet once per
 * kill, not once per lineage that names it.
 *
 * FOUR, so a boss-only lane buys a payoff card in two kills (design §18.6): a
 * payoff row costs eight shards at T1, and at two per kill those lanes were four
 * boss kills behind a lane whose family drops its shard on ordinary trash.
 * Provisional; remove when a family covers it.
 */
const BOSS_LANE_A_SHARD_AMOUNT = 4;

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
 * Lineage shards and boss capstones (progression rework Phase 1b).
 *
 * Deterministic, like every other lineage material: every kill drops a little of
 * the shard its mob family favours, and the biome boss drops its capstone every
 * kill (design §1, §12). No rolls and no pity timer — costs gate the pace.
 *
 * A monster outside the five T1-biome families drops no shard. That is the
 * Phase 1 footprint, not a rule: Phase 2 authors the remaining families along
 * with per-node blends, and until then cards only exist at T1 anyway.
 *
 * Was the sibling of a per-kill catalyst accumulator (keyed by the node's
 * modifier); Phase 2b deleted that wallet outright, so shards are now the
 * only kill-driven material wallet.
 */
function grantLineageMaterials(
  world: World,
  recipient: PlayerEntity,
  monster: MonsterEntity,
  params: { biomeTier: number; biomeGroup: string | undefined; debugMult: number },
): void {
  const prog = recipient.tracksProgression;
  let touched = false;

  const family = familyForMonster(monster.isMonster.monsterTypeId);
  if (family && !monster.isMonster.isBoss) {
    // Shards scale by tier the way essence does, so lower-tier farming stays a
    // slow but legal route rather than a dead one.
    const amount = Math.max(
      1,
      Math.round(
        SHARD_BASE_PER_KILL * (SHARD_TIER_MULT[params.biomeTier] ?? 1) * params.debugMult,
      ),
    );
    prog.shards[family.drops] = (prog.shards[family.drops] ?? 0) + amount;
    touched = true;
  }

  // The boss is the only way up a tree, so its capstone is not multiplier-scaled
  // by node identity: one kill, one capstone, every time. The dev reward
  // multiplier still applies, so a playtest can reach a gate without farming it.
  if (monster.isMonster.isBoss && params.biomeGroup && CAPSTONE_MATERIALS.has(params.biomeGroup)) {
    prog.capstones[params.biomeGroup] =
      (prog.capstones[params.biomeGroup] ?? 0) + Math.max(1, Math.round(params.debugMult));
    touched = true;
  }

  // Shard-sourcing stopgap (design §17) — see BOSS_LANE_A_SHARD_AMOUNT's comment.
  // Same "not multiplier-scaled by node identity" treatment as the capstone above.
  if (monster.isMonster.isBoss && params.biomeGroup) {
    for (const packet of biomeDefensiveLaneAPackets(params.biomeGroup)) {
      prog.shards[packet] =
        (prog.shards[packet] ?? 0) + Math.max(1, Math.round(BOSS_LANE_A_SHARD_AMOUNT * params.debugMult));
      touched = true;
    }
  }

  if (touched) markSliceDirty(world, recipient, 'tracksProgression');
}


function scheduleBossRespawn(world: World, monster: MonsterEntity): void {
  const durationMs = DEFAULT_BOSS_RESPAWN_MS;
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
  if (world.fixedBiomeMasteryPlayers.has(entity.isPlayer.id) || prevLevel >= levelCap) {
    return { xpGain: 0, prevLevel, newLevel: prevLevel, unlockedRecipeIds: [] };
  }

  const scaledXpGain = Math.round(xpGain * biomeXpRewardMult(biomeTier, biomeGroup));

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
  // Dev-only flat scalar on top of the real reward maths, so a playtest can reach
  // late content without farming it. 1x in production and by default, which makes
  // every line below identical to the shipped formula.
  const debugMult = world.rewardMultiplier;
  const scaledEssence = Math.max(
    1,
    Math.round(rewards.essence * essenceMult * debugMult),
  );
  rewardPlayer(recipient, { ...rewards, essence: scaledEssence });
  world.pushEvent(nodeId, {
    kind: 'essence-drop', playerId: recipient.isPlayer.id,
    targetId: monster.isMonster.id, pos: { ...monster.hasPosition.current },
    amount: scaledEssence, essenceType: rewards.essenceType,
  });
  grantLineageMaterials(world, recipient, monster, {
    biomeTier,
    biomeGroup: biomeInfo?.biomeGroup,
    debugMult,
  });
  const biomeResult = applyBiomeXP(
    world,
    recipient,
    nodeId,
    Math.max(1, Math.round((rewards.biomeXp ?? 1) * debugMult)),
  );
  const questResult = registerKillForQuests(recipient, monster.isMonster.monsterTypeId);
  if (monster.isMonster.isBoss) {
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
  // A necromancer's risen dead are worth NOTHING: no essence, biome XP, lineage
  // materials, quest credit or party share. This single gate covers every kill
  // path because they all funnel through here, and it is why the raise loop can
  // never be farmed — killing the raiser is the only way to stop the tide.
  if (monster.isRaised) return null;

  const suppressBossRespawn = monster.tracksDungeon?.source === 'dungeonBoss';
  const killerInfo = applyKillRewardsToPlayer(world, killer, monster, {
    suppressBossRespawn,
  });
  const dungeonResult = onDungeonMonsterRewarded(world, killerPlayerId, monster);

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
