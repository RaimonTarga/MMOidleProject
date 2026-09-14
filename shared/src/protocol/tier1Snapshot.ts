import type { PlayerView } from "./views";
import type { TierCheckpointKind, TierEntryProfile } from "./tierEntry";
import type { T1EconomyArm } from "../systems/t1EconomyExperiment";
import { STARTER_RUNE_IDS } from "../runeDatabase";
import { runeIdsFromCraftedRecipes } from "../runeRecipes";
import { globalMastery, maxGlobalMasteryAtTier } from "../config/gameConfig";
import { sealsHeldAtTier, sealsRequiredForTier } from "../systems/tierAdvancement";
import { SKILL_TREE } from "../skillTree";

/** Versioned JSON contract written by a canonical T1 route at A/B boundaries. */
export const T1_CHARACTER_SNAPSHOT_SCHEMA_VERSION = 1 as const;

export type T1CharacterSnapshotKind = "mastery-completion" | "tier2-handoff" | "experiment-checkpoint";

/** Economy identity needed to reproduce the rates that produced a snapshot. */
export interface T1SnapshotEconomyCandidate {
  id: string;
  revision: string;
  arm: T1EconomyArm;
  t1Plus5EssenceCostMultiplier: number;
  catalystProgressPerUnitT1: number;
  /** T1's scalar on each monster's catalyst kill-weight. Absent in older snapshots. */
  t1CatalystProgressRewardMultiplier?: number;
  catalystsScaledByRewardMultiplier: boolean;
  t1BiomeXpRewardMultiplier: number;
  t1BiomeEssenceRewardMultiplier: number;
  t1Plus5EssenceCosts: Record<string, number>;
}

export interface T1SnapshotEconomy {
  candidate: T1SnapshotEconomyCandidate;
  rewardMultiplier: number;
}

export interface T1SnapshotDerivedStats {
  attack: number;
  onHitDamage: number;
  maxHp: number;
  recovery: number;
  plating: number;
  damageReduction: number;
  dodgeRate: number;
  evadeMitigation: number;
  attackRange: number;
  speed: number;
  attackStyle: string;
  combatArchetype: PlayerView["combatArchetype"];
  riteSlots: number;
  summonsMinions: number;
}

/** Current class-specific meters, retained for deterministic inspection/replay. */
export interface T1SnapshotClassResources {
  cadenceSpeedStacks: number;
  cadenceCount: number;
  cadenceThreshold: number;
  cadenceEmpoweredArmed: boolean;
  ammoCount: number;
  ammoMax: number;
  heatPct: number;
  laserOverheated: boolean;
  executionReady: boolean;
  executionCooldownPct: number;
  energyCount: number;
  energyMax: number;
  flashShiftPct: number;
  flashDamageShiftPct: number;
  flashSpeedBonusPct: number;
  flashEvasionBonusPct: number;
  empoweredReady: boolean;
  targetDotStacks: number;
  targetDotTickPct: number;
  targetChillStacks: number;
  isChanneling: boolean;
  channelingPct: number;
  cannonChargePct: number;
  aura: string | null;
  summonActiveCount: number;
  summonRespawnMaxMs: number;
}

/** Runtime context is recorded for forensics, but is intentionally not imported into T2. */
export interface T1SnapshotRuntime {
  nodeId: string;
  pos: PlayerView["pos"];
  target: PlayerView["target"];
  hp: number;
  maxHp: number;
  barrier: number;
  barrierMax: number;
  barrierRecharging: boolean;
  wards: PlayerView["wards"];
  incomingDot: number;
  pendingHeal: number;
  attackTargetId: string | null;
  auto: boolean;
  autoTraverse: boolean;
  autoIntent: PlayerView["autoIntent"];
  partyLeaderId: string | null;
  partyMembers: PlayerView["partyMembers"];
  activeEffects?: Record<string, number>;
  activeEffectFrames?: Record<string, number>;
  activeBuffs: PlayerView["activeBuffs"];
  isDead: boolean;
  graveFrame: number | null;
  summonSlots: PlayerView["summonSlots"];
}

/** Persistent state plus the derived/runtime readings visible at the boundary. */
export interface T1SnapshotState {
  classRoot: string | null;
  frameId: string | null;
  selectedSubVariant: PlayerView["selectedSubVariant"];
  selectedRange: string | null;
  unlockedSkills: string[];
  passives: PlayerView["passives"];
  playerTier: number;
  currentSkillTier: number;
  level: number;
  skillPoints: number;
  biomeXP: Record<string, number>;
  biomeLevel: Record<string, number>;
  globalMastery: number;
  unlockedRecipes: string[];
  bossesCleared: string[];
  clearedNodes: string[];
  visitedNodes: string[];
  questProgress: Record<string, number>;
  essences: PlayerView["essences"];
  catalysts: Record<string, number>;
  catalystProgress: Record<string, number>;
  inventory: string[];
  equipment: PlayerView["equipment"];
  itemUpgrades: Record<string, number>;
  knownAbilities: string[];
  attunedAbilities: PlayerView["attunedAbilities"];
  runesOwned: string[];
  runeRecipesCrafted: string[];
  runesEquipped: PlayerView["runesEquipped"];
  knownStances: string[];
  attunedStances?: string[];
  equippedStances: PlayerView["equippedStances"];
  activeStance: string | null;
  knownRites: string[];
  equippedRites: PlayerView["equippedRites"];
  derivedStats: T1SnapshotDerivedStats;
  classResources: T1SnapshotClassResources;
  runtime: T1SnapshotRuntime;
}

export interface T1CharacterSnapshot {
  schemaVersion: typeof T1_CHARACTER_SNAPSHOT_SCHEMA_VERSION;
  snapshotKind: T1CharacterSnapshotKind;
  snapshotId: string;
  capturedAtMs: number;
  capturedAtIso: string;
  elapsedMs: number;
  runId: string;
  characterId: string;
  characterName: string;
  routeId: string;
  routeVersion: string;
  policyId: string;
  classRoot: string;
  frameId: string | null;
  checkpointKind?: TierCheckpointKind;
  checkpointSourceNodeId?: string;
  gitRevision: string;
  serverUrl: string;
  canonicalAtCapture: boolean;
  economy: T1SnapshotEconomy;
  state: T1SnapshotState;
}

function cloneRecord<T extends Record<string, unknown>>(value: T): T {
  return { ...value };
}

function assertUnique(label: string, values: readonly string[]): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`T1 snapshot ${label} contains duplicate entries`);
  }
}

/**
 * Convert an actual final snapshot into an authoritative entry payload.
 * T1 encounter callers must explicitly request entryTier=1; this preserves
 * root-only progression and never promotes a pre-boss character to T2.
 * The default remains the existing T2 handoff path.
 * The conversion is deliberately strict: any state the current entry
 * API would normalize or discard is rejected instead of silently changing the
 * character between the saved snapshot and the spawned bot.
 */
export function tierEntryProfileFromT1Snapshot(
  snapshot: T1CharacterSnapshot,
  spawnNodeId = "node-t2-sanctuary",
  entryTier: 1 | 2 | 3 = 2,
  resumePreparedT2 = false,
): TierEntryProfile {
  if (snapshot.schemaVersion !== T1_CHARACTER_SNAPSHOT_SCHEMA_VERSION) {
    throw new Error(`unsupported T1 snapshot schema ${String(snapshot.schemaVersion)}`);
  }
  if (snapshot.snapshotKind !== "tier2-handoff" && snapshot.snapshotKind !== "experiment-checkpoint") {
    throw new Error("only Snapshot B or an experiment checkpoint can be used as a T2 entry");
  }
  if (snapshot.snapshotKind === "experiment-checkpoint" && !snapshot.checkpointKind) {
    throw new Error("experiment checkpoint has no checkpoint kind");
  }

  const state = snapshot.state;
  if (state.playerTier !== entryTier) throw new Error("Snapshot player tier does not match the requested entry tier");
  if (entryTier === 3 && (snapshot.snapshotKind !== "tier2-handoff" ||
      sealsHeldAtTier(state.bossesCleared, 2) < sealsRequiredForTier(2))) {
    throw new Error("T3 entry requires an earned T2 seal handoff");
  }
  if (resumePreparedT2 && (entryTier !== 2 || snapshot.snapshotKind !== "tier2-handoff" ||
      state.playerTier !== 2 || globalMastery(state.biomeLevel) !== maxGlobalMasteryAtTier(2) ||
      state.bossesCleared.some(key => Number(key.split(":")[1]) >= 2))) {
    throw new Error("Prepared T2 resume requires a full-mastery T2 Snapshot B with no T2 boss clears");
  }
  const classRoot = state.classRoot ?? snapshot.classRoot;
  const frameId = state.frameId ?? snapshot.frameId;
  const rootOnly = entryTier === 1;
  if (!classRoot || (!rootOnly && !frameId)) throw new Error("T1 handoff snapshot has no root/frame selection");
  if (rootOnly && (frameId !== null || state.playerTier !== 1 || snapshot.snapshotKind !== "tier2-handoff" || state.bossesCleared.length !== 0 || state.selectedSubVariant !== null || state.selectedRange !== null)) {
    throw new Error("T1 encounter entry requires a root-only pre-boss final snapshot");
  }
  if ((!rootOnly && state.playerTier < 2) || state.currentSkillTier !== state.playerTier) {
    throw new Error("T1 handoff snapshot is not at a valid T2 skill tier");
  }
  const range = state.selectedRange ? SKILL_TREE.get(state.selectedRange) : undefined;
  if (state.selectedRange !== null && (entryTier !== 3 || !range || range.tier !== 2 ||
      range.classId !== classRoot || !range.id.includes("-range-") ||
      state.selectedSubVariant !== SKILL_TREE.get(frameId ?? "")?.subVariantId)) {
    throw new Error("Snapshot has an unsupported range branch");
  }
  if (state.skillPoints !== (entryTier === 3 && !range ? 1 : 0)) {
    throw new Error("Snapshot skill points do not match its tier and preserved branch");
  }
  // Passive nodes are derived from persistent skill, stance, equipment, and
  // item-upgrade state. Keep them in the snapshot for auditability, but let the
  // authoritative tier-entry path rebuild them from that persistent state.
  const expectedSkills = rootOnly ? [classRoot] : [classRoot, frameId];
  if (range) expectedSkills.push(range.id);
  if (JSON.stringify(state.unlockedSkills) !== JSON.stringify(expectedSkills)) {
    throw new Error("T1 handoff snapshot has an unsupported skill-tree unlock set");
  }
  if (state.activeStance !== state.equippedStances.default) {
    throw new Error("T1 handoff snapshot active stance differs from its preserved default stance");
  }
  const derivedRunes = new Set(runeIdsFromCraftedRecipes(state.runeRecipesCrafted));
  const capturedRunes = new Set(state.runesOwned);
  const unexpectedCapturedRunes = [...capturedRunes].filter((id) => !derivedRunes.has(id));
  const missingCapturedRunes = [...derivedRunes].filter((id) => !capturedRunes.has(id));
  // Starter vocabulary can grow after a real Snapshot B was captured.  The
  // authoritative T2 entry path derives ownership from current starter runes
  // plus the preserved crafted recipes, so accepting only those newly-added
  // starter IDs is lossless.  Any crafted/non-starter mismatch still rejects
  // the handoff instead of silently changing its loadout.
  if (
    unexpectedCapturedRunes.length > 0 ||
    missingCapturedRunes.some((id) => !STARTER_RUNE_IDS.includes(id))
  ) {
    throw new Error("T1 handoff snapshot rune ownership does not match crafted Rune recipes");
  }

  assertUnique("inventory", state.inventory);
  assertUnique("knownAbilities", state.knownAbilities);
  assertUnique("runesOwned", state.runesOwned);
  assertUnique("runeRecipesCrafted", state.runeRecipesCrafted);
  assertUnique("knownStances", state.knownStances);
  assertUnique("knownRites", state.knownRites);
  assertUnique("bossesCleared", state.bossesCleared);
  assertUnique("clearedNodes", state.clearedNodes);
  assertUnique("visitedNodes", state.visitedNodes);

  // A live save can retain upgrade levels for gear that was previously owned
  // but has since been replaced. The snapshot keeps that raw map for forensic
  // fidelity, while the tier-entry API accepts upgrade entries only for items
  // currently in the bag or equipment. Project just that importable subset so
  // a valid checkpoint is not rejected before the downstream route starts.
  const ownedItemIds = new Set(
    [...state.inventory, ...Object.values(state.equipment)].filter(
      (id): id is string => typeof id === "string",
    ),
  );
  const importableItemUpgrades = Object.fromEntries(
    Object.entries(state.itemUpgrades).filter(([id]) => ownedItemIds.has(id)),
  );

  return {
    id: `snapshot-${snapshot.snapshotId}`,
    targetTier: state.playerTier,
    classRoot,
    frameId,
    selectedRange: state.selectedRange,
    spawnNodeId,
    economyPolicy:
      resumePreparedT2 || snapshot.snapshotKind === "experiment-checkpoint" || (entryTier === 3 && !snapshot.canonicalAtCapture)
        ? "synthetic-combat-progression"
        : "authoritative-economy-continuation",
    ...(resumePreparedT2 || snapshot.snapshotKind === "experiment-checkpoint" || entryTier === 3
      ? {
          checkpointKind: entryTier === 3 ? "earned-t3" as const : resumePreparedT2 ? "prepared-t2" as const : snapshot.checkpointKind,
          checkpointSourceNodeId: snapshot.checkpointSourceNodeId ?? state.runtime.nodeId,
        }
      : {}),
    wallet: {
      essences: cloneRecord(state.essences),
      catalysts: cloneRecord(state.catalysts),
      catalystProgress: cloneRecord(state.catalystProgress),
    },
    level: state.level,
    skillPoints: state.skillPoints,
    currentSkillTier: state.currentSkillTier,
    biomeLevels: cloneRecord(state.biomeLevel),
    biomeXP: cloneRecord(state.biomeXP),
    bossesCleared: [...state.bossesCleared],
    clearedNodes: [...state.clearedNodes],
    visitedNodes: [...state.visitedNodes],
    questProgress: cloneRecord(state.questProgress),
    inventory: [...state.inventory],
    equipment: { ...state.equipment },
    itemUpgrades: importableItemUpgrades,
    knownAbilities: [...state.knownAbilities],
    attunedAbilities: {
      techniques: [...state.attunedAbilities.techniques],
      guards: [...state.attunedAbilities.guards],
    },
    runeRecipesCrafted: [...state.runeRecipesCrafted],
    runesEquipped: state.runesEquipped.map((rule) => ({ ...rule })),
    knownStances: [...state.knownStances],
    attunedStances: [...(state.attunedStances ?? [])],
    equippedStances: { ...state.equippedStances },
    knownRites: [...state.knownRites],
    equippedRites: [...state.equippedRites],
  };
}
