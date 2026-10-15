/**
 * The moments registry (class-first build plan §3.7, F6): states read from the tick's fight
 * snapshot, events recorded when they happen and active that tick and the next, and the
 * condition lists the class configs carry. Wiring only.
 */
import assert from 'node:assert/strict';
import { emptyEquipment, MOMENTS, type MomentId } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { setAggroTarget, setAttackTarget } from '../src/systems/combat/ai/targeting';
import { runMonsterAttack } from '../src/systems/combat/engine/combat';
import {
  conditionsHold,
  momentActive,
  momentImplemented,
  updatePlayerMoments,
} from '../src/systems/combat/moments/moments';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { World } from '../src/world/World';

initCombatSystems();
const NODE = 'node-5-5';
const world = new World();
const player = world.attachPlayerEntity({
  isPlayer: { id: 'p', name: 'P' },
  hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
  hasHealth: { hp: 1000, maxHp: 1000, recovery: 0 },
  tracksProgression: {
    level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
    biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {},
    playerTier: 1, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
    runesOwned: [], runesEquipped: [],
  },
  holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
  usesSkills: {
    unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null,
    combatArchetype: null,
  },
} as PersistedPlayerSlices, 'p');
player.hasHealth.hp = player.hasHealth.maxHp = 1000;
player.mitigatesDamage.plating = 0;
player.mitigatesDamage.damageReduction = 0;

const active = (id: MomentId, param?: number) => momentActive(world, player, id, param, 1000);
const tick = () => {
  world.tickCounter += 1;
  updatePlayerMoments(world, player, 1000 + world.tickCounter * 100);
};

// Out of a fight: states read the snapshot.
tick();
assert(active('out-of-combat'), 'no enemy fights the player');
assert(!active('hp-low'), 'full HP is not low');
player.hasHealth.hp = 200;
tick();
assert(active('hp-low') && !active('hp-low', 0.1), 'hp-low reads its param (20% < 25%, not < 10%)');
player.hasHealth.hp = 1000;

// An enemy joins: an edge event, active that tick and the next, then gone.
const monster = world.createMonster(NODE, 'bone-crawler', { x: 410, y: 400 });
assert(monster, 'the monster spawns');
monster.hasHealth.hp = monster.hasHealth.maxHp = 1000;
setAggroTarget(world, monster, { id: player.isPlayer.id, kind: 'player' }, 1000);
setAttackTarget(world, player, monster.isMonster.id);
tick();
assert(active('enemy-joins'), 'the enemy joining fires');
assert(active('enemies-near', 1) && !active('enemies-near'), 'one enemy is on the player, not three');
assert(!active('out-of-combat'), 'and the player is in a fight');
assert(active('target-low', 1.01) && !active('target-low'), 'target-low reads the target\'s HP');
tick();
assert(active('enemy-joins'), 'still active the next tick');
tick();
assert(!active('enemy-joins'), 'gone after that');

// Pipeline events: a big hit, one enemy's hits in a row.
monster.dealsDamage.attack = 400;
runMonsterAttack(world, monster, player, 2000);
assert(active('big-hit'), 'a 40% hit is a big hit (default a quarter)');
assert(!active('big-hit', 0.5), 'not one over half');
monster.dealsDamage.attack = 10;
player.hasHealth.hp = 1000;
runMonsterAttack(world, monster, player, 2100);
runMonsterAttack(world, monster, player, 2200);
assert(active('repeat-hits'), 'three hits in a row from one enemy');
assert(!active('repeat-hits', 4), 'not four');

// The target dies: an edge between two snapshots.
tick();
monster.hasHealth.hp = 0;
tick();
assert(active('target-dies'), 'the player\'s target dying fires');

// Condition lists: moments, negation, and a class's own state.
assert(conditionsHold(world, player, [], 1000), 'an empty list holds');
assert(conditionsHold(world, player, [{ id: 'target-dies' }, { id: 'hp-low', not: true }], 1000), 'moments and not');
assert(!conditionsHold(world, player, [{ id: 'resolve-at-least', param: 2 }], 1000), 'a class state reads false without its runtime');
assert(conditionsHold(world, player, [{ id: 'resolve-at-least', param: 2 }], 1000, (c) => (c.param ?? 0) <= 3),
  'and the runtime answers it');

// Coverage: the T1 moments still to build are the S2 fight events.
const missingT1 = (Object.keys(MOMENTS) as MomentId[])
  .filter((id) => MOMENTS[id].firstTier === 1 && !momentImplemented(id));
assert.deepEqual(missingT1.sort(), ['enemy-casts', 'target-closing-fast', 'telegraph-at-me'],
  `T1 moments not yet implemented: ${missingT1.join(', ')}`);

console.log('moments.test.ts: ok');
