import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  CLEARING_NODE_ID,
  T1_CHARACTER_SNAPSHOT_SCHEMA_VERSION,
  composePlayerView,
  type PlayerView,
} from "@mmo-idle/shared";
import type { RunHeader } from "./events";
import {
  buildT1CharacterSnapshot,
  readT1CharacterSnapshot,
  T1SnapshotStore,
} from "./t1Snapshots";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`t1Snapshots: ${message}`);
}

// The view the bot really holds: composed from networked slices, so every
// field the snapshot copies is present exactly as it is live.
const self = composePlayerView({
  isPlayer: { id: "real-t1-player", name: "Real T1 Player" },
  hasPosition: { current: { x: 500, y: 500 }, nodeId: CLEARING_NODE_ID, speed: 100 },
  hasHealth: { hp: 123, maxHp: 123, recovery: 1 },
  tracksProgression: {
    level: 1,
    skillPoints: 0,
    essences: { red: 0, blue: 0, green: 7, yellow: 40, purple: 0 },
    biomeXP: { plains: 900 },
    biomeLevel: { clearing: 4, plains: 2 },
    unlockedRecipes: ["primordial-club", "plains-vest-t1"],
    questProgress: {},
    playerTier: 1,
    currentSkillTier: 1,
    bossesCleared: [],
    clearedNodes: [],
    visitedNodes: [CLEARING_NODE_ID],
    runesOwned: [],
    runesEquipped: [],
  },
  holdsInventory: {
    inventory: ["primordial-club"],
    equipment: { weapon: null, armor: "plains-vest-t1", recovery: null, mobility: null, core: null, relic: null },
    itemUpgrades: {},
  },
  usesSkills: {
    unlockedSkills: ["cadence-root"],
    passives: { "core.attack-mult": 0.1 },
    selectedClass: "cadence-root",
    selectedSubVariant: null,
    selectedRange: null,
    combatArchetype: "cadence",
  },
  dealsDamage: { attack: 17, onHitDamage: 2 },
  performsAttack: { range: 80, cooldownMs: 1000, lastAttackAt: 0, attackStyle: "melee" },
  mitigatesDamage: { plating: 3, damageReduction: 0.04 },
} as never) as PlayerView;
assert(self, "the fixture composes a player view");

const header: RunHeader = {
  schemaVersion: 3,
  runId: "smoke-t1-intended-test-run",
  botId: "smoke-t1-intended",
  devAccountId: "bot-smoke-t1-intended-01",
  characterName: self.name,
  characterId: self.id,
  routeId: "smoke-t1",
  routeVersion: "test",
  policyId: "intended",
  classRoot: "cadence-root",
  gitRevision: "test-revision",
  serverUrl: "http://localhost:4000",
  startedAt: 1_000_000,
  rewardMultiplier: 1,
  economyCandidate: {
    id: "t1-economy-candidate-f-2026-09-03",
    revision: "t1-economy-candidate-f-2026-09-03-r1",
    arm: "F",
    t1Plus5EssenceCostMultiplier: 0.6,
    t1BiomeXpRewardMultiplier: 2,
    t1BiomeEssenceRewardMultiplier: 2,
    t1Plus5EssenceCosts: { "iron-broadsword": 60 },
  },
  taints: [],
  executionMode: "single",
  maxConcurrency: 1,
};

const temp = mkdtempSync(join(tmpdir(), "mmo-idle-t1-snapshot-"));
try {
  const store = new T1SnapshotStore(temp);
  const snapshotA = buildT1CharacterSnapshot({
    kind: "mastery-completion",
    header,
    self,
    frameId: null,
    elapsedMs: 30_000,
    rewardMultiplier: 1,
    canonicalAtCapture: true,
  });
  const snapshotB = buildT1CharacterSnapshot({
    kind: "tier2-handoff",
    header,
    self,
    frameId: null,
    elapsedMs: 90_000,
    rewardMultiplier: 1,
    canonicalAtCapture: true,
  });
  store.capture(snapshotA);
  store.capture(snapshotB);
  assert(store.capture(snapshotB).file === "snapshot-b.json", "a second Snapshot B keeps the first");
  const manifest = store.manifest();
  assert(manifest.snapshotA?.file === "snapshot-a.json", "Snapshot A must have a stable filename");
  assert(manifest.snapshotB?.file === "snapshot-b.json", "Snapshot B must have a stable filename");
  assert(manifest.snapshotB?.elapsedMs === 90_000, "manifest must retain elapsed handoff time");

  const loaded = readT1CharacterSnapshot(join(temp, "snapshot-b.json"));
  assert(loaded.schemaVersion === T1_CHARACTER_SNAPSHOT_SCHEMA_VERSION, "saved JSON must reload at its schema version");
  assert(loaded.snapshotId === "smoke-t1-intended-test-run-b", "Snapshot B is named after its run");
  assert(loaded.classRoot === "cadence-root", "the snapshot records the class");
  assert(loaded.state.passives["core.attack-mult"] === 0.1, "derived passive state must remain auditable in Snapshot B");
  assert(JSON.stringify(loaded.state.equipment) === JSON.stringify(self.equipment), "equipment must round-trip exactly");
  assert(JSON.stringify(loaded.state.inventory) === JSON.stringify(self.inventory), "inventory must round-trip exactly");
  assert(JSON.stringify(loaded.state.essences) === JSON.stringify(self.essences), "the wallet must round-trip exactly");
  assert(JSON.stringify(loaded.state.biomeLevel) === JSON.stringify(self.biomeLevel), "mastery must round-trip exactly");
  assert(loaded.state.runtime.nodeId === CLEARING_NODE_ID, "the runtime position is recorded");

  // A named checkpoint is written once under its boundary id.
  const named = { ...snapshotA, progressionCheckpoint: { boundaryId: "after-plains" } as never };
  assert(store.capture(named).file === "checkpoint-after-plains.json", "a named checkpoint is filed by boundary");
  let duplicateRejected = false;
  try { store.capture(named); } catch { duplicateRejected = true; }
  assert(duplicateRejected, "a boundary is captured once");
  let invalidRejected = false;
  try { store.capture({ ...snapshotA, progressionCheckpoint: { boundaryId: "Not Valid!" } as never }); } catch { invalidRejected = true; }
  assert(invalidRejected, "a boundary id is kebab-case");
  assert(store.manifest().namedCheckpoints?.["after-plains"]?.file === "checkpoint-after-plains.json", "the manifest lists named checkpoints");

  self.inventory.push("mutation-must-not-reach-snapshot");
  assert(!loaded.state.inventory.includes("mutation-must-not-reach-snapshot"), "the snapshot deep-copies arrays");
  assert(JSON.parse(readFileSync(join(temp, "snapshot-index.json"), "utf8")).snapshotB.file === "snapshot-b.json", "index JSON must be written");
  let reused = false;
  try { new T1SnapshotStore(temp); } catch { reused = true; }
  assert(reused, "a run directory with an index is never reused");
  console.log("t1Snapshots.test: ok");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
