/**
 * Taunts lock and players come first (class-first build plan S3, bible §8.12): a taunt holds
 * its monster for its whole duration and nobody can take it meanwhile, except that a
 * player's taunt takes a monster from a summon's, never the reverse.
 */
import assert from 'node:assert/strict';
import { emptyEquipment, MONSTER_DATABASE } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { activeTaunt, applyTaunt, setAggroTarget } from '../src/systems/combat/ai/targeting';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';

function slices(id: string, conduit: boolean): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 10000, maxHp: 10000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {},
      playerTier: 1, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: conduit ? ['summoner-root'] : [], passives: {},
      selectedClass: conduit ? 'summoner-root' : null, selectedSubVariant: null, selectedRange: null,
      combatArchetype: conduit ? 'summoner' : null,
    },
  } as PersistedPlayerSlices;
}

const world = new World();
const conduit = world.attachPlayerEntity(slices('conduit', true), 'conduit');
syncArchetypeSlices(world, conduit);
recalculatePlayerEntityStats(world, conduit);
updateSummonerArchetype(world, 0, 1000);
const squire = world.attachPlayerEntity(slices('squire', false), 'squire');
const striker = world.attachPlayerEntity(slices('striker', false), 'striker');
const summonId = conduit.summonsMinions!.minionIds.find((id): id is string => !!id);
assert(summonId, 'the Conduit fields a summon');
const monster = world.createMonster(NODE, 'bone-crawler', { x: 420, y: 400 });
assert(monster, 'the monster spawns');

const summon = { id: summonId, kind: 'minion' as const };
const squireRef = { id: squire.isPlayer.id, kind: 'player' as const };
const strikerRef = { id: striker.isPlayer.id, kind: 'player' as const };

// A summon's taunt holds: another player's hit doesn't take the monster.
assert(applyTaunt(world, monster, summon, 4000, 1000), 'the tank summon taunts');
assert.equal(monster.hasAggroTarget?.targetId, summonId, 'the monster turns on the summon');
setAggroTarget(world, monster, strikerRef, 1500);
assert.equal(monster.hasAggroTarget?.targetId, summonId, 'a hit from someone else does not take it');

// A player's taunt takes it from a summon; a summon's never takes it back.
assert(applyTaunt(world, monster, squireRef, 4000, 2000), 'the Squire takes the monster from the summon');
assert.equal(monster.hasAggroTarget?.targetId, squire.isPlayer.id, 'the monster turns on the Squire');
assert(!applyTaunt(world, monster, summon, 4000, 2500), 'the summon cannot take it back');
assert(!applyTaunt(world, monster, strikerRef, 4000, 2500), 'nor can another player while the hold lasts');
assert.equal(monster.hasAggroTarget?.targetId, squire.isPlayer.id, 'the Squire holds it');

// The same taunter refreshes its own hold.
assert(applyTaunt(world, monster, squireRef, 4000, 3000), 'the Squire refreshes its hold');
assert.equal(activeTaunt(world, monster, 6500)?.taunterId, squire.isPlayer.id, 'the refreshed hold runs from the refresh');

// When the hold runs out, aggro moves freely again.
assert.equal(activeTaunt(world, monster, 7001), undefined, 'the hold ends');
setAggroTarget(world, monster, strikerRef, 7001);
assert.equal(monster.hasAggroTarget?.targetId, striker.isPlayer.id, 'and someone else can take the monster');

// A taunter that leaves releases the hold at once.
assert(applyTaunt(world, monster, squireRef, 4000, 8000), 'the Squire taunts again');
squire.hasPosition.nodeId = 'elsewhere';
assert.equal(activeTaunt(world, monster, 8100), undefined, 'a taunter in another node holds nothing');
squire.hasPosition.nodeId = NODE;

// Clearing aggro clears the hold; a monster that ignores taunts refuses them.
assert(applyTaunt(world, monster, squireRef, 4000, 9000), 'held again');
setAggroTarget(world, monster, null, 9100);
assert(!monster.heldByTaunt, 'dropping aggro drops the hold');
const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId)!;
const targeting = def.targeting;
def.targeting = { ...targeting, ignoresTaunts: true } as typeof def.targeting;
assert(!applyTaunt(world, monster, squireRef, 4000, 9200), 'a monster that ignores taunts refuses them');
def.targeting = targeting;

console.log('tauntLock.test.ts: ok');
