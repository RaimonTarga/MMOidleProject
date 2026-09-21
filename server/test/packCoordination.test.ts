import { distanceSq, makeTracksCombat } from '@mmo-idle/shared';
import { World } from '../src/world/World';
import { spawnPack } from '../src/systems/world/spawning';
import { updatePacks } from '../src/systems/combat/ai/packs';
import { updateMonsters } from '../src/systems/combat/ai/ai';
import { updateSwarm } from '../src/systems/combat/ai/swarm';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { applyPlayerAoe } from '../src/systems/combat/damage/aoeDamage';
import { applyPlayerProcDamage } from '../src/systems/combat/damage/procDamage';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { beginCharge, chargedCastEndsAt } from '../src/systems/combat/engine/monsterMechanics';
import { setEntityMotion } from '../src/systems/world/movement';
import { packTestPlayerSlices } from './fixtures/packTestPlayer';

function assert(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
const NODE = 'node-5-6';
initCombatSystems();

// Repeated hits on one member must neither abandon its allies nor split a reset.
{
  const world = new World();
  const pack = spawnPack(world, NODE, 'wolf', { x: 600, y: 600 })!;
  const player = world.attachPlayerEntity(packTestPlayerSlices('kiter', NODE, 700, 600), 'kiter');
  setAggroTarget(world, pack[1]!, { id: 'kiter', kind: 'player' }, 1000);
  updatePacks(world, 1000);
  const state = pack[0]!.inPack!.coordination!;
  const home = { ...state.home };
  pack[1]!.hasPosition.current = { x: 1850, y: 600 };
  player.hasPosition.current = { x: 1900, y: 600 };
  pack[1]!.controlsMonster.leashRange = 100;
  updatePacks(world, 1100);
  updateMonsters(world, 100, 1100);
  assert(pack.every(m => m.hasAggroTarget?.targetId === 'kiter'), 'individual leash cannot split an engaged pack');
  assert(pack.every(m => m.hasAwareness.state !== 'returning'), 'separated allies keep fighting');

  // The leader dies: territory and shared target survive unchanged.
  world.removeMonsterEntity(pack[0]!.isMonster.id);
  const survivors = pack.slice(1);
  for (const m of survivors) m.hasHealth.hp = m.hasHealth.maxHp = 100_000;
  updatePacks(world, 1200);
  assert(survivors.every(m => m.inPack!.coordination === state && m.hasAggroTarget?.targetId === 'kiter'), 'leader death preserves encounter');
  assert(distanceSq(state.home, home) === 0, 'leader death cannot move the territory');

  player.hasPosition.current = { x: home.x + state.leashRange + 50, y: home.y };
  updatePacks(world, 1300);
  updateMonsters(world, 100, 1300);
  assert(survivors.every(m => !m.hasAggroTarget && m.hasAwareness.state === 'returning'), 'territory exit returns everyone together');
  const returnSlot = { ...survivors[0]!.controlsMonster.spawn };
  for (let i = 0; i < 5; i++) {
    const now = 1400 + i * 1000;
    survivors[0]!.hasPosition.current = { x: 1900 + i * 100, y: 600 };
    player.hasPosition.current = { x: 1980 + i * 100, y: 600 };
    runPlayerAttack(world, player, survivors[0]!, now, {
      attackOrigin: player.hasPosition.current, aggroSource: { id: 'kiter', kind: 'player' },
    });
    assert(survivors.every(m => m.hasAggroTarget?.targetId === 'kiter'), 'a hit immediately renews the entire group, even during return');
    assert(player.tracksEngagement === now, 'shared retaliation preserves player combat engagement');
    updatePacks(world, now);
    updateMonsters(world, 100, now);
    assert(!state.returning && survivors.every(m => m.hasAwareness.state !== 'returning'), 'active kiting keeps all companions engaged beyond their original territory');
    assert(distanceSq(state.pursuitAnchor, survivors[0]!.hasPosition.current) === 0, 'any member hit moves the shared pursuit anchor');
    assert(distanceSq(returnSlot, survivors[0]!.controlsMonster.spawn) === 0, 'pursuit movement preserves the eventual return slot');
  }
  player.hasPosition.current = { x: state.pursuitAnchor.x + state.leashRange + 50, y: 600 };
  beginCharge(survivors[0]!, 5500, 10000);
  updatePacks(world, 5500);
  assert(!state.returning, 'a short gap between hits cannot reset the group');
  updatePacks(world, 10400);
  updateMonsters(world, 100, 10400);
  assert(chargedCastEndsAt(survivors[0]!) === 0, 'coordinated return cancels pending casts');
  assert(survivors.every(m => !m.hasAggroTarget && m.hasAwareness.state === 'returning'), 'escaping the current pursuit leash after five seconds without attacks returns the group');
  assert(survivors.every(m => m.hasPosition.speed === m.controlsMonster.baseSpeed), 'return never boosts speed');
  survivors[1]!.hasPosition.current = { ...survivors[1]!.controlsMonster.spawn };
  updatePacks(world, 10500);
  assert(state.returning, 'an early arrival waits for its companions');
  survivors[0]!.hasPosition.current = { ...survivors[0]!.controlsMonster.spawn };
  updatePacks(world, 10600);
  assert(!state.returning, 'whole group arriving ends the reset');
  assert(distanceSq(state.pursuitAnchor, home) === 0, 'completed return restores the initial pursuit anchor');
  player.hasPosition.current = { x: 700, y: 600 };
  updatePacks(world, 10700);
  assert(survivors.every(m => m.hasAggroTarget?.targetId === 'kiter'), 'group can engage again after reset');
  player.hasPosition.nodeId = 'node-5-4';
  updatePacks(world, 10800);
  assert(survivors.every(m => !m.hasAggroTarget), 'target leaving the node resets the group');
}

// Idle Forest followers stay with their leader; ordinary solos also return at base speed.
{
  const world = new World();
  const pack = spawnPack(world, NODE, 'wolf', { x: 600, y: 600 })!;
  updatePacks(world, 1000);
  pack[0]!.hasPosition.current = { x: 900, y: 600 };
  updateMonsters(world, 100, 1100);
  assert(pack.slice(1).every(m => m.isMoving && m.hasAwareness.state === 'wandering'), 'idle followers move toward their roaming leader');
  const solo = world.createMonster(NODE, 'young-wolf', { x: 1200, y: 1200 })!;
  solo.hasPosition.current.x += 100;
  solo.hasAwareness.state = 'returning';
  updateMonsters(world, 100, 1200);
  assert(solo.hasPosition.speed === solo.controlsMonster.baseSpeed, 'solo return has no flee boost');
}

// Local Plains recruits are bounded, stable, and cannot recruit another wave.
{
  const world = new World();
  const node = 'node-5-4';
  const mobs = Array.from({ length: 7 }, (_, i) => world.createMonster(node, 'plains-slime', { x: 600 + i * 25, y: 600 })!);
  const player = world.attachPlayerEntity(packTestPlayerSlices('swarm-target', node, 1000, 600), 'swarm-target');
  for (const m of mobs) m.hasAwareness.pullRange = 0;
  setAggroTarget(world, mobs[0]!, { id: player.isPlayer.id, kind: 'player' }, 1000);
  updatePacks(world, 1000);
  const group = mobs.filter(m => m.inPack);
  assert(group.length === 4, 'local swarm recruits at most four total bodies');
  const ids = group.map(m => m.isMonster.id).sort().join(',');
  updatePacks(world, 1100);
  assert(mobs.filter(m => m.inPack).map(m => m.isMonster.id).sort().join(',') === ids, 'recruits do not chain or reshuffle');
  assert(mobs.filter(m => !m.inPack).every(m => !m.hasAggroTarget), 'nearby nonmembers remain unalerted');
  player.hasPosition.nodeId = NODE;
  updatePacks(world, 1200);
  updatePacks(world, 1300);
  assert(mobs.every(m => !m.inPack), 'recruited swarm dissolves after returning home');
}

// Movement flocking must never pull mobs toward another player's fight.
{
  const world = new World();
  const node = 'node-5-4';
  const a = world.createMonster(node, 'plains-slime', { x: 600, y: 600 })!;
  const b = world.createMonster(node, 'plains-slime', { x: 620, y: 600 })!;
  for (const [m, id] of [[a, 'a'], [b, 'b']] as const) {
    m.hasAwareness.state = 'chasing';
    setAggroTarget(world, m, { id, kind: 'player' }, 1000);
    setEntityMotion(world, m, { x: 1000, y: 1000 });
  }
  const before = { ...a.isMoving!.motion.direction };
  updateSwarm(world);
  assert(distanceSq(before, a.isMoving!.motion.direction) === 0, 'different combat targets cannot flock together');
}


// Non-basic attacks also renew pursuit, using the AI tick clock for their grace.
{
  const world = new World();
  const pack = spawnPack(world, NODE, 'wolf', { x: 600, y: 600 })!;
  const player = world.attachPlayerEntity(packTestPlayerSlices('proc-target', NODE, 700, 600), 'proc-target');
  for (const m of pack) m.hasHealth.hp = m.hasHealth.maxHp = 100_000;
  const state = pack[0]!.inPack!.coordination!;
  applyPlayerProcDamage(world, player, pack[1]!, 1);
  updatePacks(world, 1000);
  assert(pack.every(m => m.hasAggroTarget?.targetId === 'proc-target'), 'proc damage alerts the entire pack');
  assert(state.lastAttackedAt === 1000, 'proc grace uses simulation time');
  pack[1]!.hasPosition.current = { x: 2100, y: 600 };
  player.hasPosition.current = { x: 2180, y: 600 };
  applyPlayerAoe(world, player, pack[1]!.hasPosition.current, 50, 1);
  updatePacks(world, 2000);
  assert(Number(state.lastAttackedAt) === 2000 && state.pursuitAnchor.x === 2100, 'AoE renews shared pursuit away from the original home');
}

// Summon damage keeps the summon as the shared target; death ends that encounter.
{
  const world = new World();
  const owner = world.attachPlayerEntity(packTestPlayerSlices('owner', NODE, 700, 600), 'owner');
  world.ecs.add({
    entityId: 'pack-test-minion',
    isMinion: { id: 'pack-test-minion', ownerPlayerId: 'owner', slot: 0, slotId: 'a', role: 'melee', sizeMult: 1, monsterTypeId: 'plains-slime' },
    controlsMinion: { ownerPlayerId: 'owner', followOffset: { x: 0, y: 0 } },
    hasPosition: { current: { x: 700, y: 600 }, nodeId: NODE, speed: 100 },
    hasHitbox: { radius: 16 }, hasHealth: { hp: 100, maxHp: 100, recovery: 0 },
    dealsDamage: { attack: 1, onHitDamage: 0, attackStyle: 'impact' },
    performsAttack: { attackRange: 20, attackCooldown: 1000, lastAttackAt: 0 },
    mitigatesDamage: { plating: 0, damageReduction: 0 }, tracksCombat: makeTracksCombat(), hasStatus: {},
  } as never);
  const minion = world.getMinionEntity('pack-test-minion')!;
  const pack = spawnPack(world, NODE, 'wolf', { x: 600, y: 600 })!;
  runPlayerAttack(world, owner, pack[0]!, 1000, {
    attackOrigin: minion.hasPosition.current, aggroSource: { id: 'pack-test-minion', kind: 'minion' },
  });
  updatePacks(world, 1000);
  assert(pack.every(m => m.hasAggroTarget?.targetKind === 'minion'), 'summon attacks preserve target kind across the group');
  minion.hasHealth.hp = 0;
  updatePacks(world, 1100);
  assert(pack.every(m => !m.hasAggroTarget), 'dead summons cannot leave stale group targets');
}

// Real tick wiring acquires a pack together and keeps its live survivors linked.
{
  const world = new World();
  world.suppressRepopulation = true;
  const pack = spawnPack(world, NODE, 'wolf', { x: 1000, y: 1000 })!;
  world.attachPlayerEntity(packTestPlayerSlices('tick-target', NODE, 1100, 1000), 'tick-target');
  world.tick(100, Date.now());
  assert(pack.every(m => m.hasAggroTarget?.targetId === 'tick-target'), 'World.tick wires shared pack acquisition');
  assert(pack.every(m => m.hasAwareness.leashRange === pack[0]!.inPack!.coordination!.leashRange), 'networked leash range reflects the group policy');
}
console.log('packCoordination.test.ts: ok');
