import type { PlayerView } from "./views";
import type { TierEntryProfile } from "./tierEntry";
import type { T1EconomyArm } from "../systems/t1EconomyExperiment";
import { runeIdsFromCraftedRecipes } from "../runeRecipes";

/** Versioned JSON contract written by a canonical T1 route at A/B boundaries. */
export const T1_CHARACTER_SNAPSHOT_SCHEMA_VERSION = 1 as const;

export type T1CharacterSnapshotKind = "mastery-completion" | "tier2-handoff";

/** Economy identity needed to reproduce the rates that produced a snapshot. */
export interface T1SnapshotEconomyCandidate {
  id: string;
  revision: string;
  arm: T1EconomyArm;
  t1Plus5EssenceCostMultiplier: number;
  catalystProgressPerUnitT1: number;
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
  equippedAbilities: PlayerView["equippedAbilities"];
  abilitySlots: PlayerView["abilitySlots"];
  runesOwned: string[];
  runeRecipesCrafted: string[];
  runesEquipped: PlayerView["runesEquipped"];
  knownStances: string[];
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
 * Convert an actual post-T1 handoff into the existing authoritative T2 entry
 * payload. The conversion is deliberately strict: any state the current entry
 * API would normalize or discard is rejected instead of silently changing the
 * character between the saved snapshot and the spawned bot.
 */
export function tierEntryProfileFromT1Snapshot(
  snapshot: T1CharacterSnapshot,
  spawnNodeId = "node-t2-sanctuary",
): TierEntryProfile {
  if (snapshot.schemaVersion !== T1_CHARACTER_SNAPSHOT_SCHEMA_VERSION) {
    throw new Error(`unsupported T1 snapshot schema ${String(snapshot.schemaVersion)}`);
  }
  if (snapshot.snapshotKind !== "tier2-handoff") {
    throw new Error("only Snapshot B (tier2-handoff) can be used as a T2 entry");
  }

  const state = snapshot.state;
  const classRoot = state.classRoot ?? snapshot.classRoot;
  const frameId = state.frameId ?? snapshot.frameId;
  if (!classRoot || !frameId) throw new Error("T1 handoff snapshot has no root/frame selection");
  if (state.playerTier < 2 || state.currentSkillTier !== state.playerTier) {
    throw new Error("T1 handoff snapshot is not at a valid T2 skill tier");
  }
  if (state.skillPoints !== 0) {
    throw new Error("T1 handoff snapshot has an unspent skill point the T2 entry API cannot preserve");
  }
  // Passive nodes are derived from persistent skill, stance, equipment, and
  // item-upgrade state. Keep them in the snapshot for auditability, but let the
  // authoritative tier-entry path rebuild them from that persistent state.
  const expectedSkills = [classRoot, frameId];
  if (JSON.stringify(state.unlockedSkills) !== JSON.stringify(expectedSkills)) {
    throw new Error("T1 handoff snapshot has an unsupported skill-tree unlock set");
  }
  if (state.activeStance !== state.equippedStances.default) {
    throw new Error("T1 handoff snapshot active stance differs from its preserved default stance");
  }
  const derivedRunes = runeIdsFromCraftedRecipes(state.runeRecipesCrafted);
  if (JSON.stringify([...state.runesOwned].sort()) !== JSON.stringify([...derivedRunes].sort())) {
    throw new Error("T1 handoff snapshot rune ownership does not match crafted Rune recipes");
  }

  assertUnique("inventory", state.inventory);
  assertUnique("knownAbilities", state.knownAbilities);
  assertUnique("runeRecipesCrafted", state.runeRecipesCrafted);
  assertUnique("knownStances", state.knownStances);
  assertUnique("knownRites", state.knownRites);
  assertUnique("bossesCleared", state.bossesCleared);
  assertUnique("clearedNodes", state.clearedNodes);
  assertUnique("visitedNodes", state.visitedNodes);

  return {
    id: `snapshot-${snapshot.snapshotId}`,
    targetTier: state.playerTier,
    classRoot,
    frameId,
    spawnNodeId,
    economyPolicy: "authoritative-economy-continuation",
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
    itemUpgrades: cloneRecord(state.itemUpgrades),
    knownAbilities: [...state.knownAbilities],
    equippedAbilities: {
      techniques: [...state.equippedAbilities.techniques],
      guards: [...state.equippedAbilities.guards],
    },
    runeRecipesCrafted: [...state.runeRecipesCrafted],
    runesEquipped: state.runesEquipped.map((rule) => ({ ...rule })),
    knownStances: [...state.knownStances],
    equippedStances: { ...state.equippedStances },
    knownRites: [...state.knownRites],
    equippedRites: [...state.equippedRites],
  };
}
