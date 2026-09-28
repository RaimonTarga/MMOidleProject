import { distanceSq, pointFromMotion } from '@mmo-idle/shared';
import { World } from '../src/world/World';
import { NODE_REGISTRY } from '../src/world/nodeRegistry';
import { updateMonsters } from '../src/systems/combat/ai/ai';
import { updateMovement } from '../src/systems/world/movement';
import { spawnMonster, spawnPack } from '../src/systems/world/spawning';
import { clampMonsterRoamTarget } from '../src/systems/world/monsterRoaming';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { packTestPlayerSlices } from './fixtures/packTestPlayer';

function assert(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
const nodeId = 'node-5-4';
const node = NODE_REGISTRY.get(nodeId)!;
const inside = (p: { x: number; y: number }) => distanceSq(p, clampMonsterRoamTarget(p, node)) < 0.001;
assert(clampMonsterRoamTarget({ x: 0, y: 900 }, { width: 300, height: 200 }).x === 150,
  'Small nodes must have valid bounds');

// Exercise the real idle AI and movement, including absolute authored patrols.
for (const patrol of [false, true]) {
  const world = new World();
  const mob = world.createMonster(nodeId, 'plains-slime', { x: 400, y: 2400 })!;
  mob.controlsMonster.idleUntil = 0;
  mob.controlsMonster.wanderRadius = 10000;
  if (patrol) mob.controlsMonster.patrolOverride = {
    absolute: true, mode: 'loop', waypoints: [{ x: 40, y: 2400 }],
  };
  const originalRandom = Math.random;
  try {
    Math.random = () => 0.5;
    updateMonsters(world, 100, Date.now());
  } finally { Math.random = originalRandom; }
  const goal = mob.hasMovePath?.goal ?? (mob.isMoving && pointFromMotion(mob.hasPosition.current, mob.isMoving.motion));
  assert(goal && inside(goal), 'Idle AI must choose an interior destination');
  for (let i = 0; i < 100; i++) updateMovement(world, 100, Date.now() + i * 100);
  assert(inside(mob.hasPosition.current), 'Idle movement must stop before the border');

  world.attachPlayerEntity(packTestPlayerSlices('border-player', nodeId, 45, 2400), 'border-player');
  setAggroTarget(world, mob, { id: 'border-player', kind: 'player' }, Date.now());
  updateMonsters(world, 100, Date.now());
  const chaseGoal = mob.hasMovePath?.goal ?? (mob.isMoving && pointFromMotion(mob.hasPosition.current, mob.isMoving.motion));
  assert((chaseGoal && chaseGoal.x < 240) || mob.hasAwareness.state === 'attacking', 'Combat pursuit must still reach border players');
}

const world = new World();
for (let i = 0; i < 30; i++) spawnMonster(world, nodeId);
assert([...world.monsterEntities].length > 0, 'Ambient population must still spawn');
for (const mob of world.monsterEntities) assert(inside(mob.controlsMonster.spawn), 'Ambient homes must be interior');
const pack = spawnPack(world, nodeId, 'wolf', { x: 240, y: 2400 }, true);
assert(pack && pack.length === 3, 'Border-adjacent ambient pack must retain its followers');
for (const mob of pack) assert(inside(mob.controlsMonster.spawn), 'Pack followers must also spawn inside');
console.log('monsterRoamingBorder: ok');

