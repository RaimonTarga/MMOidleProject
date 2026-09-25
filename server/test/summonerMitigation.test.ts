/** Summons carry their Conduit's live plating and DR, at spawn and after changes. */
import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const persisted: PersistedPlayerSlices = {
  isPlayer: { id: 'armored', name: 'armored' },
  hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-clearing', speed: GAME_CONFIG.PLAYER_SPEED },
  hasHealth: { hp: 1_000, maxHp: 1_000, recovery: 5 },
  tracksProgression: {
    level: 0, skillPoints: 0,
    essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
    catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
    unlockedRecipes: [], questProgress: {}, playerTier: 1, currentSkillTier: 1,
    bossesCleared: [], clearedNodes: [],
    runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
    knownAbilities: [], attunedAbilities: { technique: null, guard: null },
    knownStances: [], equippedStances: { default: null }, activeStance: null,
    knownRites: [], equippedRites: [],
  },
  holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
  usesSkills: {
    unlockedSkills: ['summoner-root'],
    passives: {},
    selectedClass: 'summoner-root',
    selectedSubVariant: null,
    selectedRange: null,
    combatArchetype: 'summoner',
  },
};

const world = new World();
const owner = world.attachPlayerEntity(persisted, persisted.isPlayer.id);
syncArchetypeSlices(world, owner);
owner.mitigatesDamage.plating = 14;
owner.mitigatesDamage.damageReduction = 0.1;
updateSummonerArchetype(world, 0, 1_000);

const minions = () => owner.summonsMinions!.minionIds.map((id) => world.getMinionEntity(id)!);
assert(minions().length === 4 && minions().every(Boolean), 'root formation should spawn four summons');
for (const minion of minions()) {
  assert(minion.mitigatesDamage.plating === 14, 'fresh summons inherit owner plating');
  assert(minion.mitigatesDamage.damageReduction === 0.1, 'fresh summons inherit owner DR');
}

// Gear swaps and temporary buffs move the owner's armor; summons follow next tick.
owner.mitigatesDamage.plating = 20;
owner.mitigatesDamage.damageReduction = 0.2;
updateSummonerArchetype(world, 100, 1_100);
for (const minion of minions()) {
  assert(minion.mitigatesDamage.plating === 20, 'live summons resync owner plating');
  assert(minion.mitigatesDamage.damageReduction === 0.2, 'live summons resync owner DR');
}

console.log('summonerMitigation: ok');
