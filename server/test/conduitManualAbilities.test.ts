/**
 * Manual hotbar presses for Conduit Techniques. The Conduit owner never holds a
 * direct attack target — its summons fight — so a manual press must resolve the
 * formation's current target, exactly as the Rune-driven path does.
 */
import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { requestManualAbilityUse } from '../src/systems/player/abilities/abilityFiring';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function slices(id: string, abilityId: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-5-5', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1_000, maxHp: 1_000, recovery: 5 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {},
      playerTier: 3, currentSkillTier: 3,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [abilityId],
      attunedAbilities: { techniques: [abilityId], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['summoner-root'], passives: {},
      selectedClass: 'summoner-root', selectedSubVariant: null, selectedRange: null,
      combatArchetype: 'summoner',
    },
  };
}

initCombatSystems();

// One per offensive execution shape a Conduit can press from the hotbar.
for (const abilityId of ['sweep', 'quick-strike', 'hamstring', 'power-strike', 'charge']) {
  const world = new World();
  const id = `manual-${abilityId}`;
  const player = world.attachPlayerEntity(slices(id, abilityId), id);
  player.usesAutocombat.auto = false;
  syncArchetypeSlices(world, player);
  player.dealsDamage.attack = 100;
  updateSummonerArchetype(world, 0, 1_000);
  const minions = player.summonsMinions!.minionIds.map((mid) => world.getMinionEntity(mid)!);

  const target = world.createMonster('node-5-5', 'plains-slime', { x: 520, y: 400 })!;
  target.hasHealth.hp = target.hasHealth.maxHp = 10_000;
  for (const minion of minions) {
    // Summons engaged on the target; the owner stays back at x=400.
    minion.hasPosition.current = { x: 480, y: 400 };
    setAttackTarget(world, minion, target.isMonster.id);
  }
  updateSummonerArchetype(world, 100, 1_100);
  assert(player.hasAttackTarget === undefined, `${abilityId}: Conduit owner must not hold a direct target`);

  const result = requestManualAbilityUse(world, player, abilityId, 1_200);
  assert(
    result.success && result.state === 'activated',
    `${abilityId}: manual press should activate, got ${JSON.stringify(result)}`,
  );
  assert(
    !!(player.hasFormationTechnique || player.hasFormationCharge || player.isCastingAbility),
    `${abilityId}: manual press should occupy the formation's offensive channel`,
  );
}

console.log('conduitManualAbilities: ok');
