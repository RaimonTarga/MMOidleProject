/**
 * Offline netcode payload baseline — run with:
 *   pnpm --filter @mmo-idle/server exec tsx scripts/netcode-baseline.ts
 */
import {
  emptyEquipment,
  GAME_CONFIG,
  type DeltaSnapshot,
} from '@mmo-idle/shared';
import { World } from '../src/world/World';
import { initAllMechanics } from '../src/systems/classes/registry';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';

interface Measurement {
  bytes: number;
  deltas: number;
  events: number;
  topSlices: string;
}

function measureSnapshot(snap: DeltaSnapshot): Measurement {
  const sliceTotals: Record<string, number> = {};
  for (const d of snap.deltas) {
    if (d.kind === 'remove') continue;
    for (const [k, v] of Object.entries(d.components)) {
      sliceTotals[k] = (sliceTotals[k] ?? 0) + JSON.stringify(v).length;
    }
  }
  const topSlices = Object.entries(sliceTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => `${k}:${v}`)
    .join(', ');

  return {
    bytes: JSON.stringify(snap).length,
    deltas: snap.deltas.length,
    events: snap.events.length,
    topSlices,
  };
}

function makePlayer(id: string, nodeId: string, name: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name },
    hasPosition: {
      current: { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 },
      nodeId,
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      hpRegen: GAME_CONFIG.PLAYER_HP_REGEN,
    },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 0,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
    },
    holdsInventory: {
      inventory: [],
      equipment: { ...emptyEquipment(), weapon: 'basic-sword' },
    },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: null,
    },
  };
}

function runScenario(
  label: string,
  setup: (world: World) => string,
): void {
  const world = new World('node-5-5');
  initAllMechanics();
  const nodeId = setup(world);
  const dirty = world.beginBroadcast();
  const fullSnap = world.buildNodeDelta(nodeId, dirty, { resync: true });
  const full = measureSnapshot(fullSnap);

  world.tick(100, Date.now());
  const dirty2 = world.beginBroadcast();
  const deltaSnap = world.buildNodeDelta(nodeId, dirty2);
  const delta = measureSnapshot(deltaSnap);

  console.log(`\n=== ${label} ===`);
  console.log(`  full resync: ${full.bytes} B, ${full.deltas} deltas, ${full.events} events`);
  console.log(`    top slices: ${full.topSlices || '(none)'}`);
  console.log(`  steady delta: ${delta.bytes} B, ${delta.deltas} deltas, ${delta.events} events`);
  console.log(`    top slices: ${delta.topSlices || '(none)'}`);
  console.log(`  est bytes/sec @ 5 Hz delta: ${delta.bytes * 5}`);
}

runScenario('idle_solo (monsters only, node-5-5)', (world) => {
  world.ensurePopulation('node-5-5');
  return 'node-5-5';
});

runScenario('solo_combat (1 player + T0 monsters)', (world) => {
  world.ensurePopulation('node-5-5');
  world.attachPlayerEntity(makePlayer('p1', 'node-5-5', 'Hero'), 'p1');
  return 'node-5-5';
});

runScenario('contested_dungeon (2 players + boss, node-5-7)', (world) => {
  const nodeId = 'node-5-7';
  world.ensurePopulation(nodeId);
  world.ensureBoss(nodeId);
  world.attachPlayerEntity(makePlayer('p1', nodeId, 'Hero1'), 'p1');
  world.attachPlayerEntity(makePlayer('p2', nodeId, 'Hero2'), 'p2');
  return nodeId;
});

runScenario('reconnect_storm (full resync on busy node)', (world) => {
  const nodeId = 'node-5-5';
  world.ensurePopulation(nodeId);
  world.attachPlayerEntity(makePlayer('p1', nodeId, 'Hero'), 'p1');
  for (let i = 0; i < 20; i++) {
    world.tick(100, Date.now() + i * 100);
    world.beginBroadcast();
    world.buildNodeDelta(nodeId, { patched: new Map(), detached: new Map() });
  }
  return nodeId;
});
