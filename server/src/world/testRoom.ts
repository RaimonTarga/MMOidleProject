import {
  BIOME_DATABASE,
  GAME_CONFIG,
  TEST_ROOM_NODE_ID,
} from "@mmo-idle/shared";
import type { World } from "./World";
import { removeMonsterEntity } from "./monsterLifecycle";

const TEST_ROOM_TARGET_RESET = "test-target-reset";
const TEST_ROOM_TARGET_GAIN_POINT = "test-target-gain-point";

/**
 * Stationary training dummies for the dev test room — one per enemy tier (T0–T4).
 * HP comes from each dummy's MonsterDefinition (median boss HP for the tier).
 * Laid out in a row along the north wall of the test room so the player can
 * walk up to any of them to test animations, range, or sustained damage.
 */
const TEST_ROOM_TRAINING_DUMMY_TYPES = [
  "training-dummy-t0",
  "training-dummy-t1",
  "training-dummy-t2",
  "training-dummy-t3",
  "training-dummy-t4",
] as const;
const TEST_ROOM_TRAINING_DUMMY_Y = 240;
const TEST_ROOM_TRAINING_DUMMY_SPACING = 500;

export function initTestRoom(world: World): void {
  const y = GAME_CONFIG.NODE_HEIGHT / 2 - 260;
  world.createMonster(TEST_ROOM_NODE_ID, TEST_ROOM_TARGET_RESET, {
    x: GAME_CONFIG.NODE_WIDTH / 2 - 180,
    y,
  });
  world.createMonster(TEST_ROOM_NODE_ID, TEST_ROOM_TARGET_GAIN_POINT, {
    x: GAME_CONFIG.NODE_WIDTH / 2 + 180,
    y,
  });
  ensureTestRoomBoss(world, 0);
  ensureTrainingDummies(world);
}

/**
 * One stationary training dummy per enemy tier (T0–T4), arranged along the
 * north wall of the test room. Idempotent — respawns any dummy that has
 * been killed since the last call.
 */
export function ensureTrainingDummies(world: World): void {
  const present = new Set<string>();
  for (const e of world.monsterEntities) {
    if (e.hasPosition.nodeId !== TEST_ROOM_NODE_ID) continue;
    present.add(e.isMonster.monsterTypeId);
  }

  const count = TEST_ROOM_TRAINING_DUMMY_TYPES.length;
  const startX =
    GAME_CONFIG.NODE_WIDTH / 2 -
    (TEST_ROOM_TRAINING_DUMMY_SPACING * (count - 1)) / 2;
  for (let i = 0; i < count; i++) {
    const typeId = TEST_ROOM_TRAINING_DUMMY_TYPES[i];
    if (present.has(typeId)) continue;
    world.createMonster(TEST_ROOM_NODE_ID, typeId, {
      x: startX + i * TEST_ROOM_TRAINING_DUMMY_SPACING,
      y: TEST_ROOM_TRAINING_DUMMY_Y,
    });
  }
}

export function ensureCurrentTestRoomBoss(world: World): void {
  // If a previously engaged boss has been killed/removed, clear the lock so a
  // fresh dummy can be rolled for the player's current tier.
  if (
    world.testRoomEngagedBossId &&
    !world.hasMonster(world.testRoomEngagedBossId)
  ) {
    world.testRoomEngagedBossId = null;
  }
  // While the engaged boss is alive, freeze the rotation — the player is
  // actively using it as a test dummy.
  if (world.testRoomEngagedBossId) return;

  let targetTier: number | null = null;
  for (const player of world.livePlayers) {
    if (player.hasPosition.nodeId !== TEST_ROOM_NODE_ID) continue;
    targetTier = Math.max(targetTier ?? 0, player.tracksProgression.playerTier);
  }
  if (targetTier !== null) ensureTestRoomBoss(world, targetTier);
}

export function ensureTestRoomBoss(world: World, targetTier: number): void {
  const typeId = pickTestRoomBossType(targetTier);
  if (!typeId) return;

  for (const e of world.monsterEntities) {
    if (e.hasPosition.nodeId !== TEST_ROOM_NODE_ID || !e.isMonster.isBoss)
      continue;
    if (e.isMonster.monsterTypeId === typeId) return;
    removeMonsterEntity(world, e.isMonster.id);
  }

  const boss = world.createMonster(TEST_ROOM_NODE_ID, typeId, {
    x: GAME_CONFIG.NODE_WIDTH / 2,
    y: GAME_CONFIG.NODE_HEIGHT / 2 + 120,
  });
  if (boss) {
    const entity = world.getMonsterEntity(boss.isMonster.id);
    if (entity) {
      entity.isMonster.name = `Test Dummy T${Math.max(0, targetTier)} (${entity.isMonster.name})`;
      entity.isMonster.isBoss = true;
    }
  }
}

function pickTestRoomBossType(targetTier: number): string | null {
  if (targetTier <= 0) return "tiny-slime";

  const exactTierBosses: string[] = [];
  for (const biome of BIOME_DATABASE.values()) {
    exactTierBosses.push(...(biome.bossPoolByTier?.[targetTier] ?? []));
  }
  if (exactTierBosses.length === 0) return null;

  return exactTierBosses[Math.floor(Math.random() * exactTierBosses.length)];
}
