// Smoke test for the T1 dungeon pre-encounter rule:
//   T1 dungeon = pre-encounter (optional guardians) + boss fight, no waves.
//   Guardians left alive when the altar is activated aggro as optional threats;
//   counted survivors also feed the biome-authored uncleared-threat hook.
//
// Run: pnpm --filter @mmo-idle/server exec tsx ../server/test/dungeonPreEncounter.test.ts

import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getDungeonGauntletDef,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import {
  activateDungeonAltar,
  ensureDungeonGauntlet,
  onDungeonMonsterRewarded,
  tickDungeonGauntlets,
} from "../src/systems/world/dungeons/gauntlet";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const ALTAR = { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 };

function makePlayerSlices(id: string, nodeId: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { ...ALTAR },
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
      catalysts: {},
      catalystProgress: {},
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 0,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      equippedAbilities: { technique: null, guard: null },
      knownStances: [],
      equippedStances: { default: null, reactive: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: {
      inventory: [],
      equipment: emptyEquipment(),
      itemUpgrades: {},
    },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: "cadence",
    },
  };
}

function setupDungeon(nodeId: string): { world: World; playerId: string } {
  const world = new World();
  const playerId = `player-${nodeId}`;
  world.attachPlayerEntity(makePlayerSlices(playerId, nodeId), playerId);
  // Nodes start frozen; a live player thaws them. The gauntlet tick skips frozen
  // nodes, so mirror the thawed state for the test.
  world.frozenNodes.delete(nodeId);
  ensureDungeonGauntlet(world, nodeId);
  return { world, playerId };
}

function spawnBossAfterActivation(world: World, nodeId: string): void {
  // Push the clock well past the awakening delay so the boss spawns.
  tickDungeonGauntlets(world, Date.now() + 1_000_000);
}

// Pick the canonical T1 dungeons used as worked examples.
const EMPOWER_NODE = "node-3-3"; // mountain T1 (empower hook placeholder)
const JOIN_NODE = "node-3-6"; // cave T1 (default "join" hook)

const empowerDef = getDungeonGauntletDef(EMPOWER_NODE);
assert(!!empowerDef, `expected a T1 gauntlet def for ${EMPOWER_NODE}`);
assert(empowerDef!.biomeTier === 1, "empower node must be tier 1");
assert(empowerDef!.unclearedThreat?.mode === "empower", "mountain T1 should use the empower hook");
assert(empowerDef!.phases.length === 0, "T1 dungeons must not author wave phases");

const joinDef = getDungeonGauntletDef(JOIN_NODE);
assert(!!joinDef, `expected a T1 gauntlet def for ${JOIN_NODE}`);
assert((joinDef!.unclearedThreat?.mode ?? "join") === "join", "cave T1 should default to the join hook");

// ── 1. Cleared baseline: no surviving guardians → clean boss fight ──────────
{
  const { world, playerId } = setupDungeon(EMPOWER_NODE);
  const state = world.gauntlets.get(EMPOWER_NODE)!;
  assert(state.idleGuardianIds.length > 0, "idle guardians should spawn for a T1 dungeon");

  // Simulate the player clearing every guardian before activating.
  for (const id of [...state.idleGuardianIds]) {
    const guardian = world.getMonsterEntity(id)!;
    onDungeonMonsterRewarded(world, playerId, guardian);
    world.removeMonsterEntity(id);
  }
  assert(state.idleGuardianIds.length === 0, "clearing should empty the idle guardian list");

  const player = world.getPlayerEntity(playerId)!;
  assert(activateDungeonAltar(world, player), "activation should succeed at the altar");
  assert(state.status === "bossAwakening", "a cleared T1 dungeon goes straight to boss awakening");
  assert(state.unclearedThreatCount === 0, "no guardians left alive → zero uncleared threat");

  spawnBossAfterActivation(world, EMPOWER_NODE);
  assert(state.status === "boss", "boss should spawn after the awakening delay");
  const boss = world.getMonsterEntity(state.bossMonsterId!)!;
  assert(state.requiredKillsForCurrentPhase === 1, "only the boss gates completion");

  // Stash the clean baseline for comparison with the empowered run.
  (globalThis as Record<string, unknown>).__cleanBoss = {
    maxHp: boss.hasHealth.maxHp,
    attack: boss.dealsDamage.attack,
  };
}

// ── 2. Uncleared empower: guardians left alive empower the boss ─────────────
{
  const { world, playerId } = setupDungeon(EMPOWER_NODE);
  const state = world.gauntlets.get(EMPOWER_NODE)!;
  const survivors = state.idleGuardianIds.length;
  assert(survivors > 0, "guardians should be alive before activation");

  const player = world.getPlayerEntity(playerId)!;
  assert(activateDungeonAltar(world, player), "activation should succeed with guardians alive");
  assert(state.status === "bossAwakening", "uncleared T1 dungeon still goes to boss awakening (no waves)");
  assert(
    state.unclearedThreatCount === survivors,
    "uncleared threat count should equal surviving guardians",
  );
  assert(state.activeMonsterIds.length === 0, "uncleared guardians do not gate the boss phase");
  assert(
    state.preEncounterThreatIds.length === survivors,
    "empower mode keeps surviving guardians on the field as optional threats",
  );
  for (const id of state.preEncounterThreatIds) {
    const guardian = world.getMonsterEntity(id)!;
    assert(guardian.hasAggroTarget?.targetId === playerId, "uncleared guardian should aggro the activator");
    assert(guardian.hasAttackTarget?.targetId === playerId, "uncleared guardian should attack the activator");
  }

  spawnBossAfterActivation(world, EMPOWER_NODE);
  assert(state.status === "boss", "boss should spawn");
  assert(
    state.preEncounterThreatIds.length === survivors,
    "empower-mode guardians persist through boss spawn",
  );
  const boss = world.getMonsterEntity(state.bossMonsterId!)!;

  const clean = (globalThis as Record<string, unknown>).__cleanBoss as {
    maxHp: number;
    attack: number;
  };
  assert(
    boss.hasHealth.maxHp > clean.maxHp,
    `empowered boss HP (${boss.hasHealth.maxHp}) should exceed clean HP (${clean.maxHp})`,
  );
  assert(
    boss.dealsDamage.attack > clean.attack,
    `empowered boss attack (${boss.dealsDamage.attack}) should exceed clean attack (${clean.attack})`,
  );
}

// ── 3. Join hook: uncleared guardians keep fighting but never gate the boss ──
{
  const { world, playerId } = setupDungeon(JOIN_NODE);
  const state = world.gauntlets.get(JOIN_NODE)!;
  const survivors = state.idleGuardianIds.length;
  assert(survivors > 0, "guardians should be alive before activation");

  const player = world.getPlayerEntity(playerId)!;
  assert(activateDungeonAltar(world, player), "activation should succeed");
  assert(state.status === "bossAwakening", "join dungeon goes to boss awakening");
  assert(state.unclearedThreatCount === survivors, "join records the surviving count");
  assert(
    state.preEncounterThreatIds.length === survivors,
    "join keeps the surviving guardians on the field",
  );
  for (const id of state.preEncounterThreatIds) {
    const m = world.getMonsterEntity(id)!;
    assert(
      m.tracksDungeon?.source === "preEncounterThreat",
      "joined guardians should be tagged preEncounterThreat",
    );
  }

  spawnBossAfterActivation(world, JOIN_NODE);
  assert(state.status === "boss", "boss should spawn alongside the joined guardians");
  assert(state.requiredKillsForCurrentPhase === 1, "only the boss gates completion, not the guardians");
  assert(
    state.preEncounterThreatIds.length === survivors,
    "joined guardians persist through boss spawn (not wiped by awakening/boss resets)",
  );

  // Killing a joined guardian must NOT advance/complete the gauntlet.
  const guardianId = state.preEncounterThreatIds[0];
  const guardian = world.getMonsterEntity(guardianId)!;
  const res = onDungeonMonsterRewarded(world, playerId, guardian);
  assert(!res.suppressBossRespawn, "joined guardian death should not suppress boss respawn");
  assert(state.status === "boss", "killing a joined guardian leaves the boss fight active");
  assert(!state.preEncounterThreatIds.includes(guardianId), "dead guardian removed from threat list");

  // Killing the boss completes the gauntlet (cooldown) and suppresses the old
  // standing-boss respawn marker.
  const boss = world.getMonsterEntity(state.bossMonsterId!)!;
  const bossRes = onDungeonMonsterRewarded(world, playerId, boss);
  assert(bossRes.suppressBossRespawn, "gauntlet boss death suppresses the old respawn marker");
  assert(state.status === "cooldown", "boss death starts the altar cooldown");
}

console.log("dungeonPreEncounter.test.ts: ok");
