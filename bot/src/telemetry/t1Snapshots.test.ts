import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  SKILL_TREE,
  T1_CHARACTER_SNAPSHOT_SCHEMA_VERSION,
  runeIdsFromCraftedRecipes,
  tierEntryProfileFromT1Snapshot,
  type PlayerView,
} from "@mmo-idle/shared";
import { t2EntryProfileId, requireTierEntryProfile } from "../tierEntry/profiles";
import { expectedUnlockedRecipes, validateProfile } from "../tierEntry/validate";
import type { RunHeader } from "./events";
import {
  buildT1CharacterSnapshot,
  readT1CharacterSnapshot,
  T1SnapshotStore,
} from "./t1Snapshots";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`t1Snapshots: ${message}`);
}

const sourceProfile = requireTierEntryProfile(t2EntryProfileId("cadence-root", "clean"));
const sourceFrame = SKILL_TREE.get(sourceProfile.frameId);
const self = {
  id: "real-t1-player",
  name: "Real T1 Player",
  pos: { x: 500, y: 500 },
  target: { x: 500, y: 500 },
  hp: 123,
  maxHp: 123,
  attack: 17,
  onHitDamage: 2,
  plating: 3,
  damageReduction: 0.04,
  dodgeRate: 0.1,
  evadeMitigation: 1,
  evadeCharge: 0,
  barrier: 0,
  barrierMax: 0,
  barrierRecharging: false,
  wards: [],
  incomingDot: 0,
  pendingHeal: 0,
  attackRange: 80,
  attackCooldown: 1000,
  lastAttackAt: 0,
  attackTargetId: null,
  auto: false,
  autoTraverse: false,
  autoIntent: null,
  emote: null,
  partyLeaderId: null,
  partyMembers: [],
  nodeId: "node-t2-sanctuary",
  essences: { ...sourceProfile.wallet.essences },
  catalysts: { ...sourceProfile.wallet.catalysts },
  catalystProgress: { ...(sourceProfile.wallet.catalystProgress ?? {}) },
  level: sourceProfile.level,
  skillPoints: sourceProfile.skillPoints,
  unlockedSkills: [sourceProfile.classRoot, sourceProfile.frameId],
  passives: { "core.attack-mult": 0.1 },
  cadenceSpeedStacks: 0,
  selectedClass: sourceProfile.classRoot,
  selectedSubVariant: sourceFrame?.subVariantId ?? null,
  selectedRange: null,
  currentSkillTier: sourceProfile.currentSkillTier,
  recovery: 1,
  speed: 100,
  attackStyle: "melee",
  inventory: [...sourceProfile.inventory],
  equipment: { ...sourceProfile.equipment },
  itemUpgrades: { ...sourceProfile.itemUpgrades },
  biomeXP: { ...sourceProfile.biomeXP },
  biomeLevel: { ...sourceProfile.biomeLevels },
  globalMastery: 30,
  unlockedRecipes: [...expectedUnlockedRecipes(sourceProfile)],
  combatArchetype: "cadence",
  cadenceCount: 0,
  cadenceThreshold: 5,
  cadenceEmpoweredArmed: false,
  ammoCount: 0,
  ammoMax: 0,
  heatPct: 0,
  laserOverheated: false,
  executionReady: false,
  executionCooldownPct: 0,
  energyCount: 0,
  energyMax: 0,
  flashShiftPct: 0,
  flashDamageShiftPct: 0,
  flashSpeedBonusPct: 0,
  flashEvasionBonusPct: 0,
  empoweredReady: false,
  targetDotStacks: 0,
  targetDotTickPct: 0,
  targetChillStacks: 0,
  isChanneling: false,
  channelingPct: 0,
  cannonChargePct: 0,
  aura: null,
  activeEffects: {},
  activeEffectFrames: {},
  activeBuffs: [],
  questProgress: { ...sourceProfile.questProgress },
  playerTier: sourceProfile.targetTier,
  bossesCleared: [...sourceProfile.bossesCleared],
  clearedNodes: [...sourceProfile.clearedNodes],
  visitedNodes: [...sourceProfile.visitedNodes],
  runesOwned: runeIdsFromCraftedRecipes(sourceProfile.runeRecipesCrafted),
  runeRecipesCrafted: [...sourceProfile.runeRecipesCrafted],
  runesEquipped: sourceProfile.runesEquipped.map((rule) => ({ ...rule })),
  knownAbilities: [...sourceProfile.knownAbilities],
  equippedAbilities: {
    techniques: [...sourceProfile.equippedAbilities.techniques],
    guards: [...sourceProfile.equippedAbilities.guards],
  },
  abilitySlots: { technique: 1, guard: 1 },
  knownStances: [...sourceProfile.knownStances],
  equippedStances: { ...sourceProfile.equippedStances },
  activeStance: sourceProfile.equippedStances.default,
  knownRites: [...sourceProfile.knownRites],
  equippedRites: [...sourceProfile.equippedRites],
  riteSlots: 2,
  hitboxRects: [],
  summonsMinions: 0,
  summonActiveCount: 0,
  summonRespawnMaxMs: 0,
  summonSlots: [],
  isDead: false,
  graveFrame: null,
} as unknown as PlayerView;

const header: RunHeader = {
  schemaVersion: 3,
  runId: "striker-t1-intended-test-run",
  botId: "F-striker-t1-intended",
  devAccountId: "bot-F-striker-t1-intended-01",
  characterName: self.name,
  characterId: self.id,
  routeId: "striker-t1",
  routeVersion: "test",
  policyId: "intended",
  classRoot: sourceProfile.classRoot,
  gitRevision: "test-revision",
  serverUrl: "http://localhost:4000",
  startedAt: 1_000_000,
  rewardMultiplier: 1,
  economyCandidate: {
    id: "t1-economy-candidate-f-2026-09-03",
    revision: "t1-economy-candidate-f-2026-09-03-r1",
    arm: "F",
    t1Plus5EssenceCostMultiplier: 0.6,
    catalystProgressPerUnitT1: 200,
    catalystsScaledByRewardMultiplier: false,
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
    frameId: sourceProfile.frameId,
    elapsedMs: 30_000,
    rewardMultiplier: 1,
    canonicalAtCapture: true,
  });
  const snapshotB = buildT1CharacterSnapshot({
    kind: "tier2-handoff",
    header,
    self,
    frameId: sourceProfile.frameId,
    elapsedMs: 90_000,
    rewardMultiplier: 1,
    canonicalAtCapture: true,
  });
  store.capture(snapshotA);
  store.capture(snapshotB);
  const manifest = store.manifest();
  assert(manifest.snapshotA?.file === "snapshot-a.json", "Snapshot A must have a stable filename");
  assert(manifest.snapshotB?.file === "snapshot-b.json", "Snapshot B must have a stable filename");
  assert(manifest.snapshotB?.elapsedMs === 90_000, "manifest must retain elapsed handoff time");

  const loaded = readT1CharacterSnapshot(join(temp, "snapshot-b.json"));
  assert(loaded.schemaVersion === T1_CHARACTER_SNAPSHOT_SCHEMA_VERSION, "saved JSON must reload at schema 1");
  assert(loaded.state.passives["core.attack-mult"] === 0.1, "derived passive state must remain auditable in Snapshot B");
  const profile = tierEntryProfileFromT1Snapshot(loaded);
  const validation = validateProfile(profile);
  assert(validation.pass, `reconstructed profile must validate: ${validation.findings.map((f) => f.message).join("; ")}`);

  assert(JSON.stringify(profile.equipment) === JSON.stringify(sourceProfile.equipment), "equipment must round-trip exactly");
  assert(JSON.stringify(profile.itemUpgrades) === JSON.stringify(sourceProfile.itemUpgrades), "item upgrades must round-trip exactly");
  assert(JSON.stringify(profile.inventory) === JSON.stringify(sourceProfile.inventory), "inventory must round-trip exactly");
  assert(JSON.stringify(profile.bossesCleared) === JSON.stringify(sourceProfile.bossesCleared), "boss progression must round-trip exactly");
  assert(JSON.stringify(profile.wallet) === JSON.stringify(sourceProfile.wallet), "wallet and catalyst progress must round-trip exactly");
  assert(JSON.stringify([...expectedUnlockedRecipes(profile)].sort()) === JSON.stringify([...loaded.state.unlockedRecipes].sort()), "recipe unlocks must be reproducible from the snapshot");
  assert(JSON.stringify(runeIdsFromCraftedRecipes(profile.runeRecipesCrafted).sort()) === JSON.stringify([...loaded.state.runesOwned].sort()), "rune ownership must remain derived-identical");

  profile.inventory.push("mutation-must-not-reach-snapshot");
  assert(!loaded.state.inventory.includes("mutation-must-not-reach-snapshot"), "profile conversion must deep-copy arrays");
  assert(JSON.parse(readFileSync(join(temp, "snapshot-index.json"), "utf8")).snapshotB.file === "snapshot-b.json", "index JSON must be written");
  console.log("t1Snapshots.test: ok");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
