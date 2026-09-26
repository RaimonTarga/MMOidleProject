import assert from 'node:assert/strict';
import { GAME_CONFIG, STARTER_RUNE_IDS, emptyEquipment, deriveAutoConfigFromRunes, type EquippedRule } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { updateRuneDerivedConfig } from '../src/systems/combat/ai/runeConfig';
import { selectAutoCombatAction } from '../src/systems/combat/ai/targetPriority';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { initCombatSystems } from '../src/systems/combatBootstrap';

// Formation Broken -> Flee: a Conduit backs off once half or fewer of its
// summons are standing, and the condition is inert for other archetypes.
initCombatSystems();

function slices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-clearing', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1_000, maxHp: 1_000, recovery: 5 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 4, currentSkillTier: 4,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { technique: null, guard: null },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['summoner-root'], passives: {}, selectedClass: 'summoner-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'summoner',
    },
  };
}

assert.ok(STARTER_RUNE_IDS.includes('formation-broken'), 'Formation Broken is starter vocabulary');
const fleeRule: EquippedRule = { conditionId: 'formation-broken', actionId: 'flee' };
assert.equal(deriveAutoConfigFromRunes([fleeRule], { hpPct: 1, inCombat: true, inParty: false, aggroCount: 1, formationBroken: true }).fleeRequested, true,
  'derivation honours a broken formation');
assert.equal(deriveAutoConfigFromRunes([fleeRule], { hpPct: 1, inCombat: true, inParty: false, aggroCount: 1 }).fleeRequested, false,
  'inert when the context carries no formation state (non-summoners)');

const world = new World();
world.suppressRepopulation = true;
const player = world.attachPlayerEntity(slices('formation-owner'), 'formation-owner');
syncArchetypeSlices(world, player);
player.usesAutocombat.auto = true;
updateSummonerArchetype(world, 0, 1000);
const monster = world.createMonster('node-clearing', 'plains-slime', { x: 480, y: 400 })!;
monster.hasHealth.hp = monster.hasHealth.maxHp = 9000;
setAggroTarget(world, monster, { id: player.isPlayer.id, kind: 'player' }, 1000);

const summons = player.summonsMinions!;
assert.ok(summons.targetCount >= 2, 'summoner starts with a formation');
const minions = summons.minionIds.map(id => world.getMinionEntity(id)!);
assert.equal(minions.length, summons.targetCount);

player.tracksProgression.runesEquipped = [fleeRule];
const decide = () => { updateRuneDerivedConfig(world, 1000); return selectAutoCombatAction(world, player, player.usesAutocombat, 1000).kind; };

assert.notEqual(decide(), 'flee', 'full formation does not flee');
const kill = Math.ceil(summons.targetCount / 2);
for (const m of minions.slice(0, kill)) m.hasHealth.hp = 0;
assert.equal(decide(), 'flee', 'half or fewer standing flees');
for (const m of minions) m.hasHealth.hp = m.hasHealth.maxHp;
assert.notEqual(decide(), 'flee', 'rebuilt formation stops fleeing');

world.tick(100, 1100);
console.log('runeFormationBroken: ok');
