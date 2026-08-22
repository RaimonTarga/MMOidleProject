import {
  ABILITY_DATABASE,
  DEFAULT_AUTOCOMBAT_CONFIG,
  GAME_CONFIG,
  RITE_DATABASE,
  RITE_RECIPE_DATABASE,
  STANCE_DATABASE,
  STANCE_RECIPE_DATABASE,
  STARTER_RUNE_IDS,
  abilitySlotCount,
  emptyEquipment,
  biomeLevelCap,
  getMaxUpgrade,
  globalMastery,
  listBiomeGroupsAtTier,
  runeBudgetForGlobalMastery,
  runicPointLoadoutCost,
  isRiteRecipeUnlocked,
  isStanceRecipeUnlocked,
  ITEM_DATABASE,
  type EquippedAbilities,
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

/**
 * Deliberate baseline choices. Never derive these from database iteration order:
 * adding a new alphabetically-earlier option must not silently retune the bench.
 *
 * Perfection is the least polarising authored stance: modest offence/tempo with
 * no self-damage, defensive penalty, recovery loop, or conditional target rule.
 * The Rite set covers kill recovery, between-fight class reset, and OOC cadence
 * without pairing contradictory options such as Swift Repose/Lingering Battle.
 */
const CANONICAL_STANCE_ID = 'perfection-stance';
const CANONICAL_RITE_PRIORITY = [
  'blood-offering',
  'purification',
  'ability-reprieve',
  'mechanic-renewal',
  'swift-repose',
] as const;

/** Stable id for the Nth party member (member 0 is the solo bot / party leader). */
export function benchBotId(index: number): string {
  return `${BENCH_BOT_PREFIX}${index}`;
}

/**
 * Every biome group the player could plausibly have levelled by `playerTier`,
 * each at its cap for that tier.
 *
 * Global Mastery is the sum of all biome levels, and it drives the rune-point
 * budget and the item-upgrade ceiling. Seeding only the target biome (the old
 * behaviour) left GM at roughly one biome's worth, which is not a state any real
 * player at that tier would be in. Capping every reachable biome mirrors the
 * "fully upgraded gear" assumption the bench already makes elsewhere.
 */
function canonicalBiomeLevels(playerTier: number): Record<string, number> {
  const levels: Record<string, number> = {};
  for (let tier = 1; tier <= playerTier; tier++) {
    for (const group of listBiomeGroupsAtTier(tier)) {
      levels[group] = biomeLevelCap(playerTier, group);
    }
  }
  return levels;
}

/**
 * The canonical abilities / stances / rites a bench bot runs at a given tier.
 *
 * These systems are CONTEXT for the bench, not the swept axis — the skill path is
 * what varies between builds. So every bot wears the same deterministic loadout
 * for its tier: build-to-build comparison stays valid, but the bot is no longer a
 * character with three shipped systems switched off entirely (which is what the
 * bench measured before this).
 *
 * Selection is "the most tier-appropriate options, deterministically ordered".
 * That is a CANONICAL-BASELINE CHOICE and it is balance-relevant — revisit it
 * when the layered-sweep mode lands and these become swept axes of their own.
 */
export function canonicalLoadout(playerTier: number): {
  knownAbilities: string[];
  equippedAbilities: EquippedAbilities;
  knownStances: string[];
  equippedStances: { default: string | null };
  activeStance: string | null;
  knownRites: string[];
  equippedRites: string[];
} {
  const slots = abilitySlotCount(playerTier);
  // Deepest-authored first, so a T4 bot fills its slots with T4 content, not T1.
  const forSlot = (kind: 'technique' | 'guard'): string[] =>
    [...ABILITY_DATABASE.values()]
      .filter((a) => a.slot === kind && a.tier <= playerTier)
      .sort((a, b) => b.tier - a.tier || a.id.localeCompare(b.id))
      .map((a) => a.id);

  const techniques = forSlot('technique');
  const guards = forSlot('guard');

  const biomeLevel = canonicalBiomeLevels(playerTier);
  const progressionGate = { biomeLevel, bossesCleared: [] as string[] };
  const stances = [...STANCE_RECIPE_DATABASE.values()]
    .filter((recipe) => recipe.tier <= playerTier && isStanceRecipeUnlocked(recipe, progressionGate))
    .map((recipe) => recipe.stanceId)
    .filter((id) => STANCE_DATABASE.has(id))
    .sort();
  const activeStance = stances.includes(CANONICAL_STANCE_ID)
    ? CANONICAL_STANCE_ID
    : null;

  const rites = [...RITE_RECIPE_DATABASE.values()]
    .filter((recipe) => recipe.tier <= playerTier && isRiteRecipeUnlocked(recipe, progressionGate))
    .map((recipe) => recipe.riteId)
    .filter((id) => RITE_DATABASE.has(id))
    .sort();
  const knownRites = new Set(rites);
  const runeBudget = runeBudgetForGlobalMastery(globalMastery(biomeLevel));
  const equippedRites: string[] = [];
  for (const riteId of CANONICAL_RITE_PRIORITY) {
    if (!knownRites.has(riteId)) continue;
    if (runicPointLoadoutCost({ rules: [], rites: [...equippedRites, riteId] }) <= runeBudget) equippedRites.push(riteId);
  }

  return {
    knownAbilities: [...techniques, ...guards],
    equippedAbilities: {
      techniques: techniques.slice(0, slots.technique),
      guards: guards.slice(0, slots.guard),
    },
    knownStances: stances,
    equippedStances: {
      default: activeStance,
    },
    activeStance,
    knownRites: rites,
    equippedRites,
  };
}

function buildBotSlices(
  id: string,
  build: BuildSpec,
  nodeId: string,
  pos: Vec2,
): PersistedPlayerSlices {
  const loadout = canonicalLoadout(build.playerTier);
  return {
    isPlayer: { id, name: build.id },
    hasPosition: { current: pos, nodeId, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: GAME_CONFIG.PLAYER_RECOVERY,
    },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {},
      catalystProgress: {},
      biomeXP: {},
      biomeLevel: canonicalBiomeLevels(build.playerTier),
      unlockedRecipes: [],
      questProgress: {},
      playerTier: build.playerTier,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      // Runes stay UNEQUIPPED on purpose. They are the behaviour layer — which
      // rules a bot runs is a design decision about what "default play" means,
      // not a value that can be picked neutrally, and every ability still fires
      // via its built-in auto-fire heuristic without them. Left as a documented
      // gap for the layered-sweep work rather than guessed at here.
      runesEquipped: [],
      knownAbilities: loadout.knownAbilities,
      equippedAbilities: loadout.equippedAbilities,
      knownStances: loadout.knownStances,
      equippedStances: loadout.equippedStances,
      activeStance: loadout.activeStance,
      knownRites: loadout.knownRites,
      equippedRites: loadout.equippedRites,
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
  /**
   * Item upgrade level to equip at, clamped per item to its own legal maximum.
   * Omitted = fully upgraded, the long-standing bench default.
   *
   * Parameterised for the concurrency sweep: how many monsters end up on the
   * player is not player-independent — a bot that kills fast lingers less and is
   * swarmed less — so measuring concurrency at a single (maximum) power level
   * would systematically understate it.
   */
  upgradeLevel?: number,
): PlayerEntity {
  const entity = world.attachPlayerEntity(
    buildBotSlices(id, build, target.nodeId, pos),
    id,
  );

  entity.tracksProgression.playerTier = build.playerTier;
  entity.tracksProgression.skillPoints = 999;
  // The canonical biome levels already cap every reachable group; make sure the
  // target biome is capped too even if it is not listed at this tier.
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
    // Upgrade bonuses are applied by recalculatePlayerEntityStats from
    // itemUpgrades (no biome-level gate there). Default is fully upgraded.
    const def = ITEM_DATABASE.get(itemId);
    if (def) {
      const max = getMaxUpgrade(def);
      entity.holdsInventory.itemUpgrades[itemId] =
        upgradeLevel === undefined ? max : Math.max(0, Math.min(upgradeLevel, max));
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
