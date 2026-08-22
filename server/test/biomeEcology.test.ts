import { updatePacks } from "../src/systems/combat/ai/packs";
import { updateSwarm } from "../src/systems/combat/ai/swarm";
import { setAggroTarget } from "../src/systems/combat/ai/targeting";
import { updateMonsters } from "../src/systems/combat/ai/ai";
import { setEntityMotion, updateMovement } from "../src/systems/world/movement";
import { spawnPack } from "../src/systems/world/spawning";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const world = new World();

// ── Packs + call-allies (forest identity, e.g. `wolf`) ─────────────────────────
// A real T1 forest node: `docs/biome-ecology-current-state.md` primitive #1.
const FOREST_NODE = "node-5-6";
const pack = spawnPack(world, FOREST_NODE, "wolf", { x: 600, y: 600 });
assert(!!pack && pack.length === 3, "spawnPack should create the alpha + its 2 young-wolf followers");
const [alpha, follower1, follower2] = pack!;
assert(alpha.inPack?.role === "alpha", "the pack alpha should carry an alpha inPack link");
assert(
  follower1.inPack?.role === "follower" && follower1.inPack.packId === alpha.inPack?.packId,
  "followers should share the alpha's packId",
);

setAggroTarget(world, alpha, { id: "fake-player", kind: "player" }, 1_000);
updatePacks(world, 1_000);
assert(
  follower1.hasAggroTarget?.targetId === "fake-player" &&
    follower2.hasAggroTarget?.targetId === "fake-player",
  "call-allies should propagate the alpha's aggro target onto nearby un-aggroed followers",
);
const pulses = world.takeNodeEvents(FOREST_NODE).filter((e) => e.kind === "ecology-pulse");
assert(
  pulses.some((e) => e.kind === "ecology-pulse" && e.pulse === "pack-call"),
  "call-allies should telegraph a pack-call ecology-pulse event",
);

// The alpha-death SCATTER is gone (T1-T4 monster rework, locked): killing an alpha
// must leave its followers alive and killable for full rewards. Desert's duo is a
// target-priority exam, so the Dealer surviving its Controller is the whole point.
world.removeMonsterEntity(alpha.isMonster.id);
assert(
  world.hasMonster(follower1.isMonster.id) && world.hasMonster(follower2.isMonster.id),
  "surviving followers must NOT be removed when the pack alpha dies",
);

// ── Fixed patrol routes (mountain identity, e.g. `cliff-hopper`) ───────────────
const MOUNTAIN_NODE = "node-4-4";
const sentinel = world.createMonster(MOUNTAIN_NODE, "cliff-hopper", { x: 800, y: 800 });
if (!sentinel) throw new Error("failed to create patrol sentinel");
const spawnPos = { ...sentinel.controlsMonster.spawn };
assert(sentinel.hasAwareness.state === "idle", "a freshly spawned sentinel should start idle");
assert(sentinel.isMoving === undefined, "a freshly spawned sentinel should not be moving yet");

let now = Date.now() + 60_000;
for (let i = 0; i < 80; i++) {
  now += 100;
  updateMonsters(world, 100, now);
  updateMovement(world, 100, now);
}
assert(
  sentinel.hasAwareness.state === "wandering" || sentinel.hasAwareness.state === "idle",
  `patrol sentinel should cycle through wander/idle states while un-aggroed (got ${sentinel.hasAwareness.state})`,
);
const dx = sentinel.hasPosition.current.x - spawnPos.x;
const dy = sentinel.hasPosition.current.y - spawnPos.y;
assert(
  Math.hypot(dx, dy) > 10,
  "a patrol sentinel should have moved away from its spawn point while un-aggroed",
);

// ── Swarm convergence (plains identity, e.g. `plains-slime`) ───────────────────
const PLAINS_NODE = "node-5-4";
const swarmA = world.createMonster(PLAINS_NODE, "plains-slime", { x: 1_000, y: 1_000 });
const swarmB = world.createMonster(PLAINS_NODE, "plains-slime", { x: 1_020, y: 1_000 });
if (!swarmA || !swarmB) throw new Error("failed to create swarm mobs");

// Both mobs chase the same far-away diagonal point while sitting well inside
// each other's `separation` radius, so the separation force has real work to do.
const farTarget = { x: 2_000, y: 1_800 };
swarmA.hasAwareness.state = "chasing";
swarmB.hasAwareness.state = "chasing";
setEntityMotion(world, swarmA, farTarget);
setEntityMotion(world, swarmB, farTarget);

updateSwarm(world);
const steeredDirA = swarmA.isMoving!.motion.direction;
const steeredDirB = swarmB.isMoving!.motion.direction;
assert(
  Math.abs(steeredDirA.x - steeredDirB.x) > 1e-3 || Math.abs(steeredDirA.y - steeredDirB.y) > 1e-3,
  "swarm separation should bend two crowded mates' headings apart from their shared chase line",
);
const magA = Math.hypot(steeredDirA.x, steeredDirA.y);
assert(Math.abs(magA - 1) < 1e-3, "the swarm steer should keep the motion direction normalized");

console.log("biomeEcology.test.ts: ok");
