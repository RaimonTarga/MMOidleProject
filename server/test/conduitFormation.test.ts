/**
 * The Conduit's Formation at runtime (class-first build plan CD.1; bible §7.3): the roster in
 * the class config becomes the formation: one slot per body, each wearing its piece's body and
 * attacking from its mode's range. Wiring only: placeholders, no balance.
 */
import assert from 'node:assert/strict';
import {
  CONDUIT_KIT,
  classConfigContextFromState,
  defaultClassConfig,
  emptyEquipment,
  SUMMONER_BASELINE_ATTACK_RANGE,
  SUMMONER_RANGE_TUNING,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { attachComponent } from '../src/ecs/markerHelpers';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { summonerProfileFor } from '../src/systems/classes/archetypes/summoner/profile';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const BIOMES = { plains: 6, forest: 6, swamp: 6, mountain: 6, cave: 6 };

function setup(roster?: string[]) {
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'conduit', name: 'Conduit' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-5-5', speed: 120 },
    hasHealth: { hp: 1000, maxHp: 1000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {}, biomeLevel: BIOMES,
      playerTier: 1, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['summoner-root'], passives: {}, selectedClass: 'summoner-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'summoner',
    },
  } as PersistedPlayerSlices, 'conduit');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  const ctx = classConfigContextFromState({
    combatArchetype: 'summoner', biomeLevel: BIOMES, bossesCleared: [], disciplineId: null,
  })!;
  const config = defaultClassConfig(ctx);
  assert.equal(config.system.kind, 'formation');
  if (roster && config.system.kind === 'formation') config.system.roster = roster;
  attachComponent(world, player, 'configuresClass', { config: { ...config, mode: 'custom' } });
  return { world, player };
}

const piece = (id: string) => CONDUIT_KIT.pieces.find((p) => p.id === id)!;

// The default roster is the Formation's: its slots follow the config, not the old frame.
{
  const { world, player } = setup();
  const system = player.configuresClass!.config.system;
  assert.equal(system.kind, 'formation');
  const roster = system.kind === 'formation' ? system.roster : [];
  assert.ok(roster.length > 0, 'a default roster exists');
  updateSummonerArchetype(world, 100, Date.now());
  const summons = player.summonsMinions!;
  assert.equal(summons.targetCount, roster.length, 'one slot per roster entry');
  assert.deepEqual(summons.slotIds.map((id) => id.split('#')[0]), roster, 'slots are the roster pieces, in order');
}

// A mixed roster: each body wears its piece's body and attacks from its mode's range.
{
  const roster = ['conduit-plains-tank', 'conduit-mountain-marksman', 'conduit-cave-heavy'];
  const { world, player } = setup(roster);
  const profile = summonerProfileFor(player);
  assert.equal(profile.slots.length, 3);
  assert.deepEqual(profile.slots.map((slot) => slot.slotId), roster.map((id) => `${id}#0`));
  // Weights follow Command spent (1, 1, 2), and a complete formation still totals 1.
  const total = profile.slots.reduce((sum, slot) => sum + slot.offenseWeight, 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `weights total 1, got ${total}`);
  assert.ok(profile.slots[2]!.offenseWeight > profile.slots[0]!.offenseWeight, 'the 2-Command heavy carries more');

  updateSummonerArchetype(world, 100, Date.now());
  updateSummonerArchetype(world, 100, Date.now());
  const minions = player.summonsMinions!.minionIds.map((id) => world.getMinionEntity(id)!);
  assert.ok(minions.every(Boolean), 'every slot is fielded');
  roster.forEach((id, i) => {
    assert.equal(minions[i]!.isMinion.monsterTypeId, piece(id).body, `${id} wears its body`);
  });
  assert.equal(minions[0]!.performsAttack.attackRange, SUMMONER_BASELINE_ATTACK_RANGE, 'melee fights close in');
  assert.equal(minions[1]!.performsAttack.attackRange, SUMMONER_RANGE_TUNING.far.attackRange, 'ranged reaches far');
}

// Repeats get their own slots.
{
  const { player } = setup(['conduit-thrall', 'conduit-thrall', 'conduit-thrall']);
  assert.deepEqual(summonerProfileFor(player).slots.map((slot) => slot.slotId), ['conduit-thrall#0', 'conduit-thrall#1', 'conduit-thrall#2']);
}

console.log('conduitFormation: ok');
