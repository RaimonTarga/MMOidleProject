import {
  DEFAULT_RUNE_LOADOUT,
  GAME_CONFIG,
  emptyEquipment,
  runeIdsForArchetype,
  type EquippedRule,
} from '@mmo-idle/shared';
import { World } from '../src/world/World';
import { unlockSkill } from '../src/systems/player/progression/skills';

/**
 * The class pick sets the class's default standing orders over the untouched default
 * (`defaultRuneLoadoutFor`): the Slinger keeps its distance (designer's call 2026-10-16), every
 * other class keeps the chase, and a player's own rules are never replaced.
 */
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function freshPlayer(world: World, id: string, runes: EquippedRule[]) {
  const p = world.attachPlayerEntity({
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-clearing', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100, maxHp: 100, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 1, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {}, playerTier: 1,
      currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: runeIdsForArchetype(null), runesEquipped: runes.map((r) => ({ ...r })),
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null,
      selectedRange: null, combatArchetype: null,
    },
  }, id);
  return p;
}

const world = new World();
const has = (rules: EquippedRule[], actionId: string) => rules.some((r) => r.conditionId === 'in-combat' && r.actionId === actionId);

const slinger = freshPlayer(world, 'slinger', DEFAULT_RUNE_LOADOUT);
assert(unlockSkill(world, slinger, 'reload-root'), 'the Slinger is picked');
assert(has(slinger.tracksProgression.runesEquipped, 'orbit'), 'a fresh Slinger keeps its distance');
assert(!has(slinger.tracksProgression.runesEquipped, 'chase-enemy'), 'and does not chase');
assert(slinger.tracksProgression.runesEquipped.some((r) => r.actionId === 'step-back'), 'Avoid Hazards stays');

const striker = freshPlayer(world, 'striker', DEFAULT_RUNE_LOADOUT);
assert(unlockSkill(world, striker, 'cadence-root'), 'the Striker is picked');
assert(JSON.stringify(striker.tracksProgression.runesEquipped) === JSON.stringify(DEFAULT_RUNE_LOADOUT), 'a Striker keeps the default');

const own: EquippedRule[] = [{ conditionId: 'in-combat', actionId: 'chase-enemy' }];
const custom = freshPlayer(world, 'custom', own);
assert(unlockSkill(world, custom, 'reload-root'), 'a Slinger with its own rules is picked');
assert(JSON.stringify(custom.tracksProgression.runesEquipped) === JSON.stringify(own), "a player's own rules are never replaced");

console.log('classDefaultStandingOrders: ok');
