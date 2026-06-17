import {
  DEFAULT_AUTOCOMBAT_CONFIG,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  biomeLevelCap,
  getMaxUpgrade,
  ITEM_DATABASE,
  type Vec2,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../../src/db/playerRepo';
import type { World } from '../../src/world/World';
import type { PlayerEntity } from '../../src/ecs/entity';
import { unlockSkill } from '../../src/systems/player/progression/skills';
import { equipItem } from '../../src/systems/player/economy/inventory';
import { syncArchetypeSlices } from '../../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../../src/ecs/playerEntityFormulas';
import type { BuildSpec, ContentTarget } from './types';

export const BENCH_BOT_PREFIX = 'bench-bot-';
export const BENCH_BOT_ID = `${BENCH_BOT_PREFIX}0`;

/** Stable id for the Nth party member (member 0 is the solo bot / party leader). */
export function benchBotId(index: number): string {
  return `${BENCH_BOT_PREFIX}${index}`;
}

function buildBotSlices(
  id: string,
  build: BuildSpec,
  nodeId: string,
  pos: Vec2,
): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: build.id },
    hasPosition: { current: pos, nodeId, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      hpRegen: GAME_CONFIG.PLAYER_HP_REGEN,
    },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: build.playerTier,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runePointBonus: 0,
      runesEquipped: [],
    },
    holdsInventory: {
      inventory: [],
      equipment: emptyEquipment(),
      itemUpgrades: {},
    },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: null,
    },
  };
}

export function materializeBot(
  world: World,
  build: BuildSpec,
  target: ContentTarget,
  pos: Vec2,
  id: string = BENCH_BOT_ID,
): PlayerEntity {
  const entity = world.attachPlayerEntity(
    buildBotSlices(id, build, target.nodeId, pos),
    id,
  );

  entity.tracksProgression.playerTier = build.playerTier;
  entity.tracksProgression.skillPoints = 999;
  entity.tracksProgression.biomeLevel[target.biomeGroup] = biomeLevelCap(
    build.playerTier,
    target.biomeGroup,
  );

  for (const skillId of build.skillPath) {
    if (!unlockSkill(world, entity, skillId)) {
      throw new Error(`unlock failed: ${skillId} for build ${build.id}`);
    }
  }

  for (const itemId of Object.values(build.gearItemIds)) {
    if (!itemId) continue;
    entity.holdsInventory.inventory.push(itemId);
    equipItem(world, entity, itemId);
    // Bench bots always run fully upgraded gear. Upgrade bonuses are applied by
    // recalculatePlayerEntityStats from itemUpgrades (no biome-level gate there).
    const def = ITEM_DATABASE.get(itemId);
    if (def) {
      entity.holdsInventory.itemUpgrades[itemId] = getMaxUpgrade(def);
    }
  }

  syncArchetypeSlices(world, entity);
  recalculatePlayerEntityStats(world, entity);
  syncArchetypeSlices(world, entity);
  Object.assign(entity.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, {
    auto: true,
    autoTraverse: false,
    engageUltimateBosses: true,
  });
  entity.hasHealth.hp = entity.hasHealth.maxHp;
  return entity;
}
