import { GAME_CONFIG, emptyEquipment } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../../src/db/playerRepo';

export function gameplayPlayerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: "Human Tester" },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: "node-5-5", speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100, maxHp: 100, recovery: 0 },
    tracksProgression: {
      level: 1, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 }, catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: { plains: 1 }, unlockedRecipes: [], questProgress: {}, playerTier: 1, currentSkillTier: 1, bossesCleared: [], clearedNodes: [], runesOwned: [], runeRecipesCrafted: [], runesEquipped: [], knownAbilities: ["sweep"], attunedAbilities: { techniques: ["sweep"], guards: [] }, knownStances: [], equippedStances: { default: null }, activeStance: null, knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: { unlockedSkills: [], passives: {}, selectedClass: "slinger", selectedSubVariant: null, selectedRange: "ranged", combatArchetype: "reload" },
  };
}
