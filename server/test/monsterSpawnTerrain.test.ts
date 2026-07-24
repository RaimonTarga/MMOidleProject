import {
  GAME_CONFIG,
  moverOverlapsBlockShapes,
  navigationBodyHalfExtents,
} from "@mmo-idle/shared";
import type { MonsterEntity } from "../src/ecs/entity";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertTerrainSafe(world: World, monster: MonsterEntity): void {
  const pad = navigationBodyHalfExtents(
    "monster",
    monster.isMonster.isBoss,
  );
  const pos = monster.hasPosition.current;
  const shapes = world.collision.blockShapes(monster.hasPosition.nodeId, "monster");
  assert(
    !moverOverlapsBlockShapes(pos, shapes, pad),
    `${monster.isMonster.monsterTypeId} spawned overlapping blocked terrain`,
  );
  assert(
    pos.x >= pad.x && pos.x <= GAME_CONFIG.NODE_WIDTH - pad.x &&
      pos.y >= pad.y && pos.y <= GAME_CONFIG.NODE_HEIGHT - pad.y,
    `${monster.isMonster.monsterTypeId} spawned partly outside the node`,
  );
  assert(
    monster.controlsMonster.spawn.x === pos.x && monster.controlsMonster.spawn.y === pos.y,
    `${monster.isMonster.monsterTypeId} retained an unsafe leash anchor`,
  );
}

const nodeId = "node-t1-forest-01";
const world = new World();
const trunks = world.collision
  .staticRegions(nodeId)
  .filter((region) => region.kind === "block" && region.data?.blockTarget === "monster");
const edgeTrunk = trunks.sort((a, b) => {
  const edgeDistance = (shape: typeof a.shape): number => {
    const x = "x" in shape ? shape.x : GAME_CONFIG.NODE_WIDTH / 2;
    const y = "y" in shape ? shape.y : GAME_CONFIG.NODE_HEIGHT / 2;
    return Math.min(x, GAME_CONFIG.NODE_WIDTH - x, y, GAME_CONFIG.NODE_HEIGHT - y);
  };
  return edgeDistance(a.shape) - edgeDistance(b.shape);
})[0];
if (!edgeTrunk || !("x" in edgeTrunk.shape) || !("y" in edgeTrunk.shape)) {
  throw new Error("forest tree trunk not found");
}

const requested = { x: edgeTrunk.shape.x, y: edgeTrunk.shape.y };
const single = world.createMonster(nodeId, "forest-slime", requested);
if (!single) throw new Error("failed to create forest monster");
assertTerrainSafe(world, single);
assert(
  single.hasPosition.current.x !== requested.x || single.hasPosition.current.y !== requested.y,
  "terrain-overlapping requested spawn should be relocated",
);

const pack = world.spawnPack(nodeId, "wolf", requested);
if (!pack) throw new Error("failed to create forest pack");
for (const member of pack) assertTerrainSafe(world, member);

console.log("monsterSpawnTerrain.test.ts: ok");
