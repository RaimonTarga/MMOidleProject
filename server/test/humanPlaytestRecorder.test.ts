import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { GAME_CONFIG, emptyEquipment } from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { HumanPlaytestRecorderManager } from "../src/playtest/humanPlaytestRecorder";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { recordWorldLogEvent } from "../src/world/worldLog";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function slices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: "Human Tester" },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: "node-5-5", speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100, maxHp: 100, recovery: 0 },
    tracksProgression: {
      level: 1, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 }, catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: { plains: 1 }, unlockedRecipes: [], questProgress: {}, playerTier: 1, currentSkillTier: 1, bossesCleared: [], clearedNodes: [], runesOwned: [], runeRecipesCrafted: [], runesEquipped: [], knownAbilities: ["sweep"], equippedAbilities: { techniques: ["sweep"], guards: [] }, knownStances: [], equippedStances: { default: null }, activeStance: null, knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: { unlockedSkills: [], passives: {}, selectedClass: "slinger", selectedSubVariant: null, selectedRange: "ranged", combatArchetype: "reload" },
  };
}

async function main(): Promise<void> {
const root = mkdtempSync(join(tmpdir(), "mmo-idle-human-playtest-"));
try {
  const world = new World();
  const player = world.attachPlayerEntity(slices("human-test"), "human-test");
  const recorder = new HumanPlaytestRecorderManager(root);
  world.humanPlaytests = recorder;
  assert(!recorder.status(player.isPlayer.id).active, "logging must be disabled by default");

  // This pre-start event must not create an artifact or leak into a later trace.
  recordWorldLogEvent(world, {
    kind: "ability-activation", nodeId: player.hasPosition.nodeId,
    player: { id: player.isPlayer.id, name: player.isPlayer.name, actorType: "player" }, abilityId: "before-start", slot: "technique",
  }, { visibility: "combat", relatedPlayerIds: [player.isPlayer.id], nodeId: player.hasPosition.nodeId });
  assert(!existsSync(root) || readdirSync(root).length === 0, "pre-start events must not be captured");

  const started = recorder.start(world, player);
  assert(started.active && started.runId, "start must create exactly one active recording");
  assert(recorder.start(world, player).runId === started.runId, "only one active recording may exist per player");
  recordWorldLogEvent(world, {
    kind: "ability-activation", nodeId: player.hasPosition.nodeId,
    player: { id: player.isPlayer.id, name: player.isPlayer.name, actorType: "player" }, abilityId: "sweep", slot: "technique",
  }, { visibility: "combat", relatedPlayerIds: [player.isPlayer.id], nodeId: player.hasPosition.nodeId });
  recordWorldLogEvent(world, {
    kind: "damage", nodeId: player.hasPosition.nodeId,
    source: { id: player.isPlayer.id, name: player.isPlayer.name, actorType: "player" }, target: { id: "slime", name: "Slime", actorType: "monster" }, hpDamage: 12, absorbed: 0, damageType: "direct",
  }, { visibility: "combat", relatedPlayerIds: [player.isPlayer.id], nodeId: player.hasPosition.nodeId });
  const now = Date.now();
  for (let i = 0; i < 30; i++) recorder.sample(world, now + i * 10);
  const boss = world.createMonster(player.hasPosition.nodeId, "crag-behemoth", { x: 450, y: 400 });
  assert(boss, "boss fixture should spawn");
  setAttackTarget(world, player, boss.isMonster.id);
  recorder.sample(world, now + 1_000);
  setAttackTarget(world, player, null);
  recorder.sample(world, now + 2_000);
  recorder.noteRewardMultiplier(25, now + 2_100);

  const stopped = await recorder.stop(world, player.isPlayer.id);
  assert(!stopped.active && stopped.artifactPath, "stop must finalize the active recording");
  const events = readFileSync(join(stopped.artifactPath!, "events.jsonl"), "utf8").trim().split("\n").map(line => JSON.parse(line));
  const summary = JSON.parse(readFileSync(join(stopped.artifactPath!, "summary.json"), "utf8"));
  assert(events.some(event => event.kind === "world" && event.event.kind === "ability-activation"), "ability events must be captured from the authoritative vocabulary");
  assert(events.some(event => event.kind === "world" && event.event.kind === "damage"), "damage events must be captured from the authoritative vocabulary");
  assert(events.filter(event => event.kind === "position-sample").length <= 3, "position sampling must be bounded rather than per-frame");
  assert(events.some(event => event.kind === "build-snapshot" && event.phase === "start"), "starting build metadata must be present");
  assert(summary.run.type === "HUMAN_PLAYTEST" && summary.combat.playerDamageDealt === 12, "summary must identify the human trace and aggregate combat evidence");
  assert(summary.run.canonical === false && summary.run.taints.includes("NON_CANONICAL_REWARD_MULTIPLIER"), "a mid-run multiplier change must make the run visibly noncanonical");
  assert(summary.run.rewardMultiplier.changes.at(-1).multiplier === 25, "multiplier change history must be retained");
  assert(summary.bosses.length === 1 && summary.bosses[0].combatDurationMs === 1_000, "boss duration must stop at disengagement rather than recording end");
  recordWorldLogEvent(world, {
    kind: "ability-activation", nodeId: player.hasPosition.nodeId,
    player: { id: player.isPlayer.id, name: player.isPlayer.name, actorType: "player" }, abilityId: "after-stop", slot: "technique",
  }, { visibility: "combat", relatedPlayerIds: [player.isPlayer.id], nodeId: player.hasPosition.nodeId });
  const eventsAfterStop = readFileSync(join(stopped.artifactPath!, "events.jsonl"), "utf8").trim().split("\n");
  assert(eventsAfterStop.length === events.length, "events after stop must not be captured");
  assert(!recorder.status(player.isPlayer.id).active, "events after stop cannot be captured");
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log("humanPlaytestRecorder.test.ts: ok");
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
