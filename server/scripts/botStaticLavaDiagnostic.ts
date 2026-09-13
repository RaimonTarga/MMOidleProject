/** Read-only World diagnostic. No live bot, gameplay patch, or balance evidence. */
import { emptyEquipment, RESOLVED_NODE_FEATURES, STARTER_RUNE_IDS } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { attachComponent } from '../src/ecs/markerHelpers';
import { updateAutoTargets } from '../src/systems/combat/ai/autoTarget';
import { updateRuneDerivedConfig } from '../src/systems/combat/ai/runeConfig';
import { findPersistentHazardEscapeDestination } from '../src/systems/combat/ai/dynamicHazardAvoidance';
import { startManualNavigation, updateAutoTraverse } from '../src/systems/world/autoTraverse';
import { isPlayerInHazardousNodeFeature } from '../src/systems/world/nodeFeatures';
import { World } from '../src/world/World';

const nodeId = 'node-t3-volcanic-05';
const feature = RESOLVED_NODE_FEATURES[nodeId].find(f => f.damage?.effectId === 'lava-burn');
if (!feature || feature.shape.kind !== 'circle') throw new Error('Expected actual static lava geometry');
const position = { x: feature.shape.x, y: feature.shape.y };
for (const recoverFirst of [true, false]) {
  const world = new World();
  const id = `static-lava-${recoverFirst}`;
  const slices: PersistedPlayerSlices = {
    isPlayer: { id, name: id },
    hasPosition: { current: position, nodeId, speed: 100 },
    hasHealth: { hp: 50, maxHp: 100, recovery: 10 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {},
      playerTier: 3, currentSkillTier: 3, bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS, 'avoid-hazards'], runeRecipesCrafted: ['rune-recipe-avoid-hazards'],
      runesEquipped: [
        { conditionId: 'always', actionId: 'avoid-hazards' },
        { conditionId: 'while-traveling', actionId: 'fight-back' },
        ...(recoverFirst ? [{ conditionId: 'always' as const, actionId: 'wait-for-regen' as const }] : []),
      ],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null, knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: { unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: null },
  };
  const player = world.attachPlayerEntity(slices, id);
  player.hasHealth.hp = player.hasHealth.maxHp / 2;
  player.usesAutocombat.auto = false;
  startManualNavigation(world, player, 'node-t3-sanctuary');
  if (!player.hasAutoTraversePath) throw new Error('Diagnostic requires a navigation path');
  // Model the state immediately after a travel attacker died, without spawning a live experiment.
  attachComponent(world, player, 'fightsWhileTraveling', { startedAtMs: 1000 });
  updateRuneDerivedConfig(world, 1000);
  const hazardousContact = isPlayerInHazardousNodeFeature(world, player);
  const escapeDestination = findPersistentHazardEscapeDestination(world, player, 1000);
  updateAutoTraverse(world, 1000);
  updateAutoTargets(world, 1000);
  console.log(JSON.stringify({ recoverFirst, hazardousContact, escapeDestination,
    travelPaused: !!player.fightsWhileTraveling, moving: !!player.isMoving,
    hasPath: !!player.hasAutoTraversePath, groundZoneCount: world.groundZones.get(nodeId)?.length ?? 0 }));
}
