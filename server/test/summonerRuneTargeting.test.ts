import assert from 'node:assert/strict';
import { GAME_CONFIG, STARTER_RUNE_IDS, emptyEquipment, type EquippedRule } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { driveMinion } from '../src/systems/classes/archetypes/summoner/ai';
import { applySummonerCommand, clearSummonerCommand } from '../src/systems/classes/archetypes/summoner/command';
import { syncSummonerFormationTarget } from '../src/systems/classes/archetypes/summoner/formationTarget';
import { updateRuneDerivedConfig } from '../src/systems/combat/ai/runeConfig';
import { clearAutoTarget, getAutoTargetId, selectAutoCombatAction } from '../src/systems/combat/ai/targetPriority';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { initCombatSystems } from '../src/systems/combatBootstrap';

function slices(
  id: string,
  unlockedSkills: string[] = ['summoner-root'],
  frame: 'light' | 'balanced' | 'heavy' | null = null,
  range: string | null = null,
): PersistedPlayerSlices {
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
      unlockedSkills,
      passives: {},
      selectedClass: 'summoner-root',
      selectedSubVariant: frame,
      selectedRange: range,
      combatArchetype: 'summoner',
    },
  };
}

function attachSummoner(world: World, persisted: PersistedPlayerSlices) {
  const player = world.attachPlayerEntity(persisted, persisted.isPlayer.id);
  syncArchetypeSlices(world, player);
  return player;
}


function scenario(spec = 'summoner-heavy-t3-b') {
  const world = new World();
  world.suppressRepopulation = true;
  const player = attachSummoner(world, slices('rune-owner', ['summoner-root', 'summoner-heavy', 'summoner-range-close', spec], 'heavy', 'summoner-range-close'));
  player.usesAutocombat.auto = true;
  updateSummonerArchetype(world, 0, 1000);
  const near = world.createMonster('node-clearing', 'plains-slime', { x: 440, y: 400 })!;
  const far = world.createMonster('node-clearing', 'plains-slime', { x: 560, y: 400 })!;
  near.hasHealth.hp = near.hasHealth.maxHp = 9000;
  far.hasHealth.hp = far.hasHealth.maxHp = 1000;
  for (const m of [near, far]) setAggroTarget(world, m, { id: player.isPlayer.id, kind: 'player' }, 1000);
  const minions = player.summonsMinions!.minionIds.map(id => world.getMinionEntity(id)!);
  for (const m of minions) m.performsAttack.lastAttackAt = 1000000; // Selection/chase regression, no damage pilot.
  const choose = (rules: EquippedRule[]) => {
    player.tracksProgression.runesEquipped = rules;
    updateRuneDerivedConfig(world, 1000);
    clearAutoTarget(player);
    selectAutoCombatAction(world, player, player.usesAutocombat, 1000);
    for (const m of minions) driveMinion(world, m, player, 1000);
    syncSummonerFormationTarget(world, player as Parameters<typeof syncSummonerFormationTarget>[1]);
  };
  return { world, player, near, far, minions, choose };
}
const low: EquippedRule = { conditionId: 'in-combat', actionId: 'focus-lowest-hp' };
const high: EquippedRule = { conditionId: 'in-combat', actionId: 'focus-highest-max-hp' };
{
  const s = scenario();
  s.choose([low]);
  assert.equal(getAutoTargetId(s.player), s.far.entityId);
  assert(s.minions.every(m => m.controlsMinion.currentTargetId === s.far.entityId), 'formation must follow lower-HP target, not nearer body');
  assert.equal(s.player.summonsMinions!.formationTargetId, s.far.entityId);
  s.choose([high, low]);
  assert(s.minions.every(m => m.controlsMinion.currentTargetId === s.near.entityId), 'first active targeting channel wins');
  s.choose([low, high]);
  assert(s.minions.every(m => m.controlsMinion.currentTargetId === s.far.entityId));
  applySummonerCommand(s.world, s.player, s.near.hasPosition.current);
  s.choose([low]);
  assert(s.minions.every(m => m.controlsMinion.currentTargetId === s.near.entityId), 'manual focus wins over Rune');
  clearSummonerCommand(s.world, s.player);
  applySummonerCommand(s.world, s.player, { x: 400, y: 700 });
  s.choose([low]);
  assert(s.minions.every(m => m.controlsMinion.currentTargetId === null), 'manual move suppresses inherited attacks');
  clearSummonerCommand(s.world, s.player);
  s.far.hasPosition.current.x = 1200;
  s.choose([low]);
  assert.equal(getAutoTargetId(s.player), s.far.entityId);
  assert(s.minions.every(m => m.controlsMinion.currentTargetId === null), 'out-of-leash preference must not bypass leash or fall back to nearest');
  s.far.hasPosition.current.x = 560;
  s.choose([low]);
  s.far.hasHealth.hp = 0;
  for (const m of s.minions) driveMinion(s.world, m, s.player, 1000);
  assert(s.minions.every(m => m.controlsMinion.currentTargetId === null), 'stale dead owner selection must release');
}
{
  const s = scenario();
  s.minions.forEach(m => { m.hasPosition.current = { ...s.near.hasPosition.current }; });
  s.choose([{ conditionId: 'hp-below-25', actionId: 'focus-lowest-hp' }]);
  assert(s.minions.every(m => m.controlsMinion.currentTargetId === s.near.entityId), 'inactive targeting rule retains native fallback');
  s.choose([]);
  assert(s.minions.every(m => m.controlsMinion.currentTargetId === s.near.entityId), 'baseline remains nearest');
}
{
  const s = scenario('summoner-heavy-t3-c');
  s.choose([low]);
  assert(s.minions.every(m => m.controlsMinion.currentTargetId === s.far.entityId), 'active owner rule overrides swarm spread');
}
// Real tick wiring: Rune fold precedes mechanics; summons consume the most recent
// auto selection, which refreshes later in World.tick. Assert convergence next tick.
{
  initCombatSystems();
  const s = scenario();
  s.player.tracksProgression.runesEquipped = [low];
  clearAutoTarget(s.player);
  s.world.tick(100, 2000);
  s.world.tick(100, 2100);
  assert.equal(getAutoTargetId(s.player), s.far.entityId);
  assert(s.minions.every(m => m.controlsMinion.currentTargetId === s.far.entityId), 'real World tick must wire owner choice into formation');
}
console.log('summonerRuneTargeting: native arbitration, targets, commands, leash, fallback and World tick wiring ok');
