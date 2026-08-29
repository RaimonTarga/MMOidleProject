import {
  FAST_BOSS_RETRY_TAINT,
  GAME_CONFIG,
  NODE_BIOMES,
  emptyEquipment,
  getDungeonDef,
} from "@mmo-idle/shared";
import { prepareFastBossRetry } from "../src/admin/gameActions";
import { recalculatePlayerEntityStats } from "../src/ecs/playerEntityFormulas";
import { syncArchetypeSlices } from "../src/ecs/archetypeSliceSync";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { ensureDungeon } from "../src/systems/world/dungeons/dungeon";
import { publishGroundZone, publishToxicPool } from "../src/systems/world/groundZones";
import { takeWorldLogEvents } from "../src/world/worldLog";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = Object.entries(NODE_BIOMES).find(([, info]) => info.isDungeon)?.[0];
assert(NODE, "test requires a dungeon node");
const DEF = getDungeonDef(NODE);
assert(DEF, "test dungeon must have a definition");

function playerSlices(id: string): PersistedPlayerSlices {
  const equipment = emptyEquipment();
  equipment.weapon = "primordial-club";
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-clearing",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: { hp: 100, maxHp: 100, recovery: 0 },
    tracksProgression: {
      level: 7,
      skillPoints: 2,
      essences: { red: 11, blue: 12, green: 13, yellow: 14, purple: 15 },
      catalysts: { plains: 2 },
      catalystProgress: { plains: 3 },
      biomeXP: { plains: 99 },
      biomeLevel: { plains: 4 },
      unlockedRecipes: ["primordial-club"],
      questProgress: {},
      playerTier: 1,
      currentSkillTier: 1,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      equippedAbilities: { technique: null, guard: null },
      knownStances: [],
      equippedStances: { default: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: {
      inventory: ["primordial-club"],
      equipment,
      itemUpgrades: { "primordial-club": 2 },
    },
    usesSkills: {
      unlockedSkills: ["cadence-root"],
      passives: {},
      selectedClass: "cadence-root",
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: "cadence",
    },
  };
}

function authenticSnapshot(player: ReturnType<World["attachPlayerEntity"]>) {
  return JSON.stringify({
    progression: player.tracksProgression,
    inventory: player.holdsInventory,
    skills: player.usesSkills,
    attack: player.dealsDamage.attack,
    plating: player.mitigatesDamage.plating,
    reduction: player.mitigatesDamage.damageReduction,
    maxHp: player.hasHealth.maxHp,
    speed: player.hasPosition.speed,
  });
}

// A tainted retry preserves character power while rebuilding every encounter-local seam.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices("retry"), "retry");
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  ensureDungeon(world, NODE);
  const stateBefore = world.dungeons.get(NODE);
  assert(stateBefore, "dungeon should initialize");
  const oldGuardianIds = [...stateBefore.guardianIds];
  const oldBoss = world.createMonster(NODE, DEF.boss.bossId, { x: DEF.altar.x, y: DEF.altar.y });
  assert(oldBoss, "old boss fixture should spawn");
  oldBoss.scriptsBoss ??= { phaseTriggered: [0], repeatingTimers: [123], activeEffects: [] };
  oldBoss.scriptsBoss.spawnedAddIds = [];
  stateBefore.status = "boss";
  stateBefore.bossMonsterId = oldBoss.isMonster.id;
  stateBefore.startedAtMs = 1;
  stateBefore.participantPlayerIds.add(player.isPlayer.id);
  const oldAdd = world.createMonster(NODE, "plains-slime", { x: 500, y: 400 });
  assert(oldAdd, "old add fixture should spawn");
  oldBoss.scriptsBoss.spawnedAddIds.push(oldAdd.isMonster.id);
  publishGroundZone(world, NODE, {
    kind: "slam-telegraph", pos: { x: 400, y: 400 }, radius: 90,
    startedAtMs: 1, resolvesAtMs: 10_000, ownerId: oldBoss.isMonster.id,
  });
  publishToxicPool(world, NODE, {
    kind: "toxic-pool", pos: { x: 450, y: 400 }, radius: 100,
    startedAtMs: 1, expiresAtMs: 10_000, damagePerTick: 1, tickIntervalMs: 1_000,
    sourceId: "test-pool", sourceLabel: "Test Pool",
    killer: { monsterTypeId: DEF.boss.bossId, monsterName: "old boss", isBoss: true, nodeId: NODE },
  });
  world.corpses.set(NODE, [{
    monsterTypeId: "plains-slime", pos: { x: 400, y: 400 }, diedAtMs: 1,
  }]);
  world.ambientRampOverrides.set(NODE, { rampMsMult: 0.5, minStacks: 2, maxStacksAdd: 3 });
  player.hasHealth.hp = 1;
  player.tracksCombat.cooldowns["test"] = 5_000;
  player.tracksCombat.statusEffects.push({
    id: "test", stacks: 1, remainingMs: 5_000, refreshable: true,
    instanced: false, sourceId: "test", data: {},
  });

  const before = authenticSnapshot(player);
  const result = prepareFastBossRetry(world, player, NODE, false);
  assert(result.success, `fast retry should succeed: ${result.reason ?? "unknown"}`);
  assert(result.taint === FAST_BOSS_RETRY_TAINT, "every result must carry the noncanonical taint");
  assert(result.playerReset === "respawn-baseline", "player reset policy must be explicit");
  const after = authenticSnapshot(player);
  assert(after === before, `equipment, upgrades, progression, class, and combat stats must remain unchanged\nbefore=${before}\nafter=${after}`);
  assert(player.hasHealth.hp === player.hasHealth.maxHp, "retry should match legitimate full-HP respawn state");
  assert(Object.keys(player.tracksCombat.cooldowns).length === 0, "encounter cooldown state must reset");
  assert(player.tracksCombat.statusEffects.length === 0, "encounter statuses must reset");
  assert(player.hasPosition.nodeId === NODE, "retry should skip overworld travel by teleporting authoritatively");
  assert(!world.hasMonster(oldBoss.isMonster.id) && !world.hasMonster(oldAdd.isMonster.id), "old boss and script adds must disappear");
  assert(oldGuardianIds.every((id) => !world.hasMonster(id)), "old guardian entities must disappear");
  assert((world.groundZones.get(NODE) ?? []).length === 0, "old telegraphs and ground zones must disappear");
  assert(!world.corpses.has(NODE), "old encounter corpse state must disappear");
  assert(!world.ambientRampOverrides.has(NODE), "old boss-script node overrides must disappear");
  const fresh = world.dungeons.get(NODE);
  assert(fresh !== stateBefore && fresh?.status === "idle", "dungeon state must be a fresh idle object");
  assert(fresh.guardianIds.length === 0, "default fast retry should skip guardian reform and reclear");
  assert(fresh.bossMonsterId === undefined && fresh.participantPlayerIds.size === 0, "old boss/session bookkeeping must disappear");
  const artifact = takeWorldLogEvents(world, player.isPlayer.id).find((event) => event.kind === "fast-boss-retry");
  assert(
    artifact?.kind === "fast-boss-retry" && artifact.taint === FAST_BOSS_RETRY_TAINT,
    "server artifacts must make the noncanonical mutation unmistakable",
  );

  // A second retry removes state created after the first and reconstructs again.
  const firstFresh = fresh;
  const secondOldBoss = world.createMonster(NODE, DEF.boss.bossId, { x: 500, y: 500 });
  assert(secondOldBoss, "second-attempt boss fixture should spawn");
  firstFresh.status = "boss";
  firstFresh.bossMonsterId = secondOldBoss.isMonster.id;
  const second = prepareFastBossRetry(world, player, NODE, false);
  assert(second.success && !world.hasMonster(secondOldBoss.isMonster.id), "successive attempts must be independent");
  assert(world.dungeons.get(NODE) !== firstFresh, "each retry must allocate fresh dungeon script state");
}

// Guardian-inclusive retry is explicit, and occupied shared dungeons are protected.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices("guardian-retry"), "guardian-retry");
  const included = prepareFastBossRetry(world, player, NODE, true);
  assert(included.success && included.includeGuardians === true, "guardian-inclusive mode should be explicit");
  const state = world.dungeons.get(NODE);
  assert(state && state.guardianIds.length > 0, "guardian-inclusive mode must use real guardian spawning");

  const other = world.attachPlayerEntity(playerSlices("other"), "other");
  other.hasPosition.nodeId = NODE;
  world.movePlayerNode("node-clearing", NODE, other.isPlayer.id);
  const stateBefore = world.dungeons.get(NODE);
  const rejected = prepareFastBossRetry(world, player, NODE, false);
  assert(!rejected.success && rejected.taint === FAST_BOSS_RETRY_TAINT, "occupied reset must reject but remain visibly tainted");
  assert(world.dungeons.get(NODE) === stateBefore, "rejected retry must not mutate shared encounter state");
}

console.log("fastBossRetry.test.ts: ok");
