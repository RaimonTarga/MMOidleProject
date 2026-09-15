/** Setup-only qualification for the Stage 1 diagnostic and Stage 2 boss packet. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import {
  DUNGEON_DEFS,
  ITEM_DATABASE,
  MONSTER_DATABASE,
  NODE_BIOMES,
  RESOLVED_NODE_FEATURES,
  SKILL_TREE,
  WORLD_NODES,
  emptyAttunedAbilities,
  emptyEquipment,
  emptyEquippedStances,
  registerDevItems,
  shortestWorldPath,
  worldNodeExits,
  type T1CharacterSnapshot,
  type PlayerView,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { World } from "../src/world/World";
import {
  checkpointGameplayState,
  checkpointDefinitionsHash,
  checkpointRevision,
  restoreProgressionCheckpoint,
} from "../src/admin/progressionCheckpoint";
import { validateBuild, buildRP } from "../../bot/src/loadout/loadout";
import {
  CAMPAIGN_T4_BOSS_COVERAGE_ROUTES,
  CAMPAIGN_T4_VOLCANO_DIAGNOSTIC,
  T4_VALIDATION_BOSS_CASES,
  T4_VOLCANO_DIAGNOSTIC_PATH,
} from "../../bot/src/routes/campaignT4ValidationExit";

const [volcanoInput, bossInput, output] = process.argv.slice(2);
const VOLCANO_INPUT_SHA256 = "e6b357f51cadb344307e56aa7d43eb247b8755bf5284ba91e9342711942ae844";
const BOSS_INPUT_SHA256 = "866db03766d0e7cd4ceeeea48506bd9c11c2a9eaf0f72037e49a0cc20c052f98";

assert(volcanoInput && bossInput && output && !existsSync(output), "Two exact checkpoints and a NEW output file are required");

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function readInput(path: string, expectedHash: string): T1CharacterSnapshot {
  assert.equal(sha256(path), expectedHash, `Unexpected input hash for ${path}`);
  const snapshot = JSON.parse(readFileSync(path, "utf8")) as T1CharacterSnapshot;
  assert(snapshot.progressionCheckpoint, `Missing progression checkpoint in ${path}`);
  return snapshot;
}

function blankSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "t4-validation-preflight", name: "t4-validation-preflight" },
    hasPosition: {
      current: { x: 300, y: 300 },
      nodeId: "node-t4-sanctuary",
      speed: 120,
    },
    hasHealth: { hp: 100, maxHp: 100, recovery: 10 },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      playerTier: 0,
      currentSkillTier: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {},
      catalystProgress: {},
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      bossesCleared: [],
      clearedNodes: [],
      visitedNodes: [],
      runesOwned: [],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      attunedAbilities: emptyAttunedAbilities(),
      knownStances: [],
      attunedStances: [],
      equippedStances: emptyEquippedStances(),
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
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

function restore(path: string, boundaryId: string, expectedTier: number): {
  snapshot: T1CharacterSnapshot;
  view: PlayerView;
  stateHash: string;
  definitionsHash: string;
} {
  const snapshot = readInput(path, path === volcanoInput ? VOLCANO_INPUT_SHA256 : BOSS_INPUT_SHA256);
  const capture = snapshot.progressionCheckpoint!;
  assert.equal(capture.boundaryId, boundaryId);
  const world = new World();
  const player = world.attachPlayerEntity(blankSlices(), "t4-validation-preflight");
  const restored = restoreProgressionCheckpoint(world, player, {
    capture,
    boundaryId,
    revisionPolicy: "explicit-current-revision",
  });
  assert.deepEqual(checkpointGameplayState(restored.persistent), checkpointGameplayState(capture.persistent));
  assert.equal(restored.definitionsHash, capture.definitionsHash);
  assert.equal(restored.view.playerTier, expectedTier);
  assert.equal(restored.view.nodeId, "node-t4-sanctuary");
  assert.equal(restored.view.globalMastery, expectedTier === 4 ? 132 : restored.view.globalMastery);
  return {
    snapshot,
    view: restored.view,
    stateHash: restored.stateHash,
    definitionsHash: restored.definitionsHash,
  };
}

function travelTargets(route: { steps: readonly { type: string; to?: { kind: string; nodeId?: string } }[] }): string[] {
  return route.steps
    .filter((step): step is typeof step & { type: "travel"; to: { kind: "node"; nodeId: string } } =>
      step.type === "travel" && step.to?.kind === "node" && typeof step.to.nodeId === "string")
    .map((step) => step.to.nodeId);
}

function validatePath(path: readonly string[], label: string): void {
  for (const nodeId of path) assert(NODE_BIOMES[nodeId] || WORLD_NODES.has(nodeId), `${label}: unknown node ${nodeId}`);
  for (let index = 1; index < path.length; index += 1) {
    const from = path[index - 1]!;
    const to = path[index]!;
    assert(Object.values(worldNodeExits(from)).includes(to), `${label}: ${from} -> ${to} is not adjacent`);
    assert(Object.values(worldNodeExits(to)).includes(from), `${label}: ${to} -> ${from} is not bidirectional`);
    assert.deepEqual(shortestWorldPath(from, to), [from, to], `${label}: ${from} -> ${to} is not the fixed direct hop`);
  }
}

function validateBuilds(route: { steps: readonly { type: string; build?: Parameters<typeof validateBuild>[0] }[] }, view: PlayerView): number[] {
  const builds = route.steps
    .filter((step): step is typeof step & { type: "configureBuild"; build: Parameters<typeof validateBuild>[0] } =>
      step.type === "configureBuild" && !!step.build)
    .map((step) => step.build);
  for (const build of builds) assert.deepEqual(validateBuild(build, view), [], "validation-exit route contains an invalid build");
  return builds.map(buildRP);
}

registerDevItems(ITEM_DATABASE);
const volcano = restore(volcanoInput, "v1z-plus2-prepared-returned", 4);
const boss = restore(bossInput, "night3-mountain-control-r1-returned", 4);
assert(!volcano.view.bossesCleared.includes("mountain:4"), "Volcano diagnostic input must retain the original empty-relic control state");
assert(boss.view.bossesCleared.includes("mountain:4"), "Boss breadth input must retain the earned Mountain4 seal");
assert.equal(volcano.definitionsHash, boss.definitionsHash);

for (const entry of T4_VALIDATION_BOSS_CASES) {
  validatePath(entry.path, `${entry.group} boss`);
  const dungeon = DUNGEON_DEFS.get(entry.path.at(-1)!);
  assert(dungeon, `${entry.group}: missing dungeon definition`);
  assert.equal(dungeon.boss.bossId, entry.bossId);
  assert.equal(MONSTER_DATABASE.get(entry.bossId)?.name, entry.bossName);
}
validatePath(T4_VOLCANO_DIAGNOSTIC_PATH, "Volcano diagnostic");

for (const route of CAMPAIGN_T4_BOSS_COVERAGE_ROUTES) {
  validateBuilds(route, boss.view);
  const entry = T4_VALIDATION_BOSS_CASES.find((candidate) => route.id === `t4-exit-${candidate.group}-boss`)!;
  assert.deepEqual(
    travelTargets(route),
    [...entry.path.slice(1), ...[...entry.path].reverse().slice(1)],
    `${route.id}: travel route drift`,
  );
  assert.equal(route.progressionEntry?.boundaryId, "night3-mountain-control-r1-returned");
  assert.equal(route.steps.filter((step) => step.type === "attemptBoss").length, 1);
}
validateBuilds(CAMPAIGN_T4_VOLCANO_DIAGNOSTIC, volcano.view);
assert.deepEqual(
  travelTargets(CAMPAIGN_T4_VOLCANO_DIAGNOSTIC),
  [...T4_VOLCANO_DIAGNOSTIC_PATH.slice(1), ...[...T4_VOLCANO_DIAGNOSTIC_PATH].reverse().slice(1)],
);
assert.equal(CAMPAIGN_T4_VOLCANO_DIAGNOSTIC.progressionEntry?.boundaryId, "v1z-plus2-prepared-returned");

const result = {
  mode: "setup-only",
  ticks: 0,
  currentRevision: checkpointRevision(),
  definitionsHash: checkpointDefinitionsHash(),
  inputs: {
    volcanoDiagnostic: {
      sha256: VOLCANO_INPUT_SHA256,
      boundaryId: volcano.snapshot.progressionCheckpoint!.boundaryId,
      stateHash: volcano.stateHash,
      definitionsHash: volcano.definitionsHash,
      playerTier: volcano.view.playerTier,
      globalMastery: volcano.view.globalMastery,
      bossesCleared: volcano.view.bossesCleared,
    },
    bossCoverage: {
      sha256: BOSS_INPUT_SHA256,
      boundaryId: boss.snapshot.progressionCheckpoint!.boundaryId,
      stateHash: boss.stateHash,
      definitionsHash: boss.definitionsHash,
      playerTier: boss.view.playerTier,
      globalMastery: boss.view.globalMastery,
      mountain4: boss.view.bossesCleared.includes("mountain:4"),
    },
  },
  routes: {
    volcanoDiagnostic: {
      id: CAMPAIGN_T4_VOLCANO_DIAGNOSTIC.id,
      observeForMs: 600_000,
      buildRP: validateBuilds(CAMPAIGN_T4_VOLCANO_DIAGNOSTIC, volcano.view),
      path: T4_VOLCANO_DIAGNOSTIC_PATH,
    },
    bossCoverage: CAMPAIGN_T4_BOSS_COVERAGE_ROUTES.map((route, index) => ({
      id: route.id,
      group: T4_VALIDATION_BOSS_CASES[index]!.group,
      bossId: T4_VALIDATION_BOSS_CASES[index]!.bossId,
      guardianTotal: T4_VALIDATION_BOSS_CASES[index]!.guardianTotal,
      buildRP: validateBuilds(route, boss.view),
      path: T4_VALIDATION_BOSS_CASES[index]!.path,
    })),
  },
  warning: "Setup-only, zero ticks; restored captures are non-canonical evidence and no output is a playable checkpoint.",
};
writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log("T4 validation exit: both actual checkpoints, routes, builds and bidirectional paths qualified; zero ticks");
