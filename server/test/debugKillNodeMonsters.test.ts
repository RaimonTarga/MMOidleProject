import { NODE_BIOMES, getDungeonDef } from "@mmo-idle/shared";
import { killNodeMonsters } from "../src/admin/gameActions";
import { ensureDungeon } from "../src/systems/world/dungeons/dungeon";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const DUNGEON_NODE = Object.entries(NODE_BIOMES).find(([, info]) => info.isDungeon)?.[0];
assert(DUNGEON_NODE, "test requires a dungeon node");
const DEF = getDungeonDef(DUNGEON_NODE);
assert(DEF, "test dungeon must have a definition");

// The dungeon guard is stripped, the boss keeps standing, and the boss stops
// pointing at adds that no longer exist.
{
  const world = new World();
  ensureDungeon(world, DUNGEON_NODE);
  const state = world.dungeons.get(DUNGEON_NODE);
  assert(state, "dungeon should initialize");
  assert(state.guardianIds.length > 0, "fixture needs a live guard");
  const guardianIds = [...state.guardianIds];

  const boss = world.createMonster(DUNGEON_NODE, DEF.boss.bossId, {
    x: DEF.altar.x,
    y: DEF.altar.y,
  });
  assert(boss, "boss fixture should spawn");
  const add = world.createMonster(DUNGEON_NODE, DEF.boss.bossId, { x: 500, y: 500 });
  assert(add, "add fixture should spawn");
  add.isMonster.isBoss = false;
  boss.scriptsBoss ??= { phaseTriggered: [], repeatingTimers: [], activeEffects: [] };
  boss.scriptsBoss.spawnedAddIds = [add.isMonster.id];

  const result = killNodeMonsters(world, DUNGEON_NODE);
  assert(result.ok, `clear should succeed: ${result.message}`);
  assert(
    guardianIds.every((id) => !world.hasMonster(id)),
    "every guardian must be gone",
  );
  assert(!world.hasMonster(add.isMonster.id), "non-boss adds must be gone");
  assert(world.hasMonster(boss.isMonster.id), "the boss must survive the clear");
  assert(
    boss.scriptsBoss.spawnedAddIds.length === 0,
    "the surviving boss must drop dead add references",
  );
  assert(state.guardianIds.length === 0, "dungeon guardian bookkeeping must be pruned");
  assert(
    state.lastGuardianKillAtMs !== undefined,
    "a dev clear must arm the idle preclear reset like a real guardian death",
  );
  assert(world.getBossCountInNode(DUNGEON_NODE) === 1, "boss count must stay reconciled");
  assert(
    world.getMonsterCountInNode(DUNGEON_NODE) === 0,
    "no non-boss monster should remain counted in the node",
  );
}

// Overworld nodes clear too, and the action grants the player nothing.
{
  const world = new World();
  const NODE = "node-clearing";
  world.ensurePopulation(NODE);
  const before = world.getMonsterCountInNode(NODE);
  assert(before > 0, "fixture needs overworld monsters");

  const result = killNodeMonsters(world, NODE);
  assert(result.ok, `clear should succeed: ${result.message}`);
  assert(
    [...world.monsterEntitiesInNode(NODE)].every((m) => m.isMonster.isBoss),
    "no ordinary monster should remain",
  );

  const unknown = killNodeMonsters(world, "node-does-not-exist");
  assert(!unknown.ok, "an unknown node must be rejected, not silently cleared");
}

console.log("debugKillNodeMonsters.test.ts: ok");
