// Wiring coverage for persistent tombstones (2026-09-11).
//
// The grave a dying player turned into was their OWN entity re-skinned, so it
// walked away with them on respawn. A tombstone is the durable half: a record
// planted at the death spot that has to outlive BOTH the respawn and the node
// freeze that follows it. The freeze is the load-bearing case — a player who dies
// alone empties the node the instant they respawn, so a tomb swept by `freezeNode`
// (as monsters, ground zones and corpses all are) would stand for one tick.

import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  TOMBSTONE_TTL_MS,
  emptyEquipment,
  tombstoneEpitaph,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { freezeNode, thawNode } from '../src/world/nodeLifecycle';
import {
  MAX_TOMBSTONES_PER_NODE,
  buildTombstoneViews,
  updateTombstones,
} from '../src/systems/world/tombstones';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-t1-plains-01';

function playerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 405, y: 400 },
      nodeId: NODE,
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: { hp: 100, maxHp: 100, recovery: 0 },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [],
      attunedAbilities: { technique: null, guard: null }, knownStances: [],
      equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

const KILLED_BY_BEAR = {
  kind: 'melee' as const,
  damage: 100,
  killer: {
    monsterTypeId: 'gnarled-greatbear',
    monsterName: 'Gnarled Greatbear',
    isBoss: false,
    nodeId: NODE,
  },
};

// Death plants a tomb, but it stays WITHHELD from the node view while its owner is
// still lying dead on that node — their own entity is already drawing that grave,
// and shipping both would stack two markers on one spot.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('falls-here'), 'falls-here');

  world.killPlayer('falls-here', KILLED_BY_BEAR);

  const planted = world.tombstones.get(NODE) ?? [];
  assert(planted.length === 1, 'death should plant exactly one tombstone');
  assert(planted[0]!.playerName === 'falls-here', 'the tomb should remember who fell');
  assert(planted[0]!.killerName === 'Gnarled Greatbear', 'the tomb should remember the killer');
  assert(
    planted[0]!.graveFrame === player.isDead!.graveFrame,
    'the tomb must reuse the grave frame, or respawn swaps the art under the player',
  );
  assert(
    planted[0]!.pos.x === 405 && planted[0]!.pos.y === 400,
    'the tomb should sit where the player fell',
  );

  assert(
    buildTombstoneViews(world, NODE, Date.now()) === undefined,
    'a tomb whose owner is still dead on the node must be withheld',
  );

  // Respawn hands the spot over: the player leaves, the tomb becomes visible.
  world.respawnPlayer('falls-here');
  const views = buildTombstoneViews(world, NODE, Date.now());
  assert(!!views && views.length === 1, 'the tomb should appear once its owner leaves');
  assert(
    tombstoneEpitaph(views[0]!) === 'falls-here died to Gnarled Greatbear',
    `unexpected epitaph: ${tombstoneEpitaph(views[0]!)}`,
  );
  assert(views[0]!.remainingMs > 0, 'a fresh tomb should have lifetime left');
}

// THE LOAD-BEARING CASE: freezing the node must not take the tomb with it. This is
// the ordinary path, not an edge case — respawning alone empties the node.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('dies-alone'), 'dies-alone');
  // Every node starts frozen in a bare World, and `freezeNode` early-returns on an
  // already-frozen node — so the thaw is what makes the freeze below real work
  // rather than a no-op that would pass no matter what freezeNode did.
  thawNode(world, NODE);
  assert(!world.isNodeFrozen(NODE), 'precondition: the node should be live');

  world.killPlayer('dies-alone', KILLED_BY_BEAR);
  world.respawnPlayer('dies-alone');

  freezeNode(world, NODE);
  assert(world.isNodeFrozen(NODE), 'precondition: the node should be frozen');
  assert(
    (world.tombstones.get(NODE) ?? []).length === 1,
    'freezing a node must NOT sweep its tombstones',
  );

  // And a thawed node hydrates from that surviving record on its next full delta.
  world.dirty.drain();
  const snapshot = world.buildNodeDelta(NODE, world.dirty.drain(), { resync: true });
  assert(
    !!snapshot.tombstones && snapshot.tombstones.length === 1,
    'the node delta must carry the surviving tomb',
  );
}

// The TTL sweep walks the registry, not the occupied nodes, so a tomb on a frozen
// node still expires on schedule instead of standing until someone walks back in.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('expires'), 'expires');
  world.killPlayer('expires', KILLED_BY_BEAR);
  world.respawnPlayer('expires');
  thawNode(world, NODE);
  freezeNode(world, NODE);

  const tomb = world.tombstones.get(NODE)![0]!;
  tomb.diedAtMs = Date.now() - TOMBSTONE_TTL_MS - 1;

  updateTombstones(world, Date.now());
  assert(!world.tombstones.has(NODE), 'an expired tomb must be swept from a frozen node too');
}

// Ring-buffer bound: a node being wiped repeatedly cannot grow without limit.
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('wipes'), 'wipes');
  for (let i = 0; i < MAX_TOMBSTONES_PER_NODE + 5; i++) {
    world.killPlayer('wipes', KILLED_BY_BEAR);
    world.respawnPlayer('wipes');
    // Respawn moves the player to the clearing; put them back to die again here.
    world.movePlayerNode(world.getPlayerEntity('wipes')!.hasPosition.nodeId, NODE, 'wipes');
    world.getPlayerEntity('wipes')!.hasPosition.nodeId = NODE;
  }
  assert(
    (world.tombstones.get(NODE) ?? []).length === MAX_TOMBSTONES_PER_NODE,
    'tombstones must be capped per node',
  );
}

// A death with no nameable killer degrades to a plain epitaph rather than "died to
// undefined".
{
  const world = new World();
  world.attachPlayerEntity(playerSlices('bleeds-out'), 'bleeds-out');
  world.killPlayer('bleeds-out', { kind: 'debt', damage: 100, nodeId: NODE });
  world.respawnPlayer('bleeds-out');

  const views = buildTombstoneViews(world, NODE, Date.now())!;
  assert(
    tombstoneEpitaph(views[0]!) === 'bleeds-out died here',
    `unexpected epitaph: ${tombstoneEpitaph(views[0]!)}`,
  );
}

console.log('tombstones: ok');
