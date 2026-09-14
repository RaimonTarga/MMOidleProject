import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  T1_CHARACTER_SNAPSHOT_SCHEMA_VERSION,
  type PlayerView,
  type T1CharacterSnapshot,
  type T1CharacterSnapshotKind,
  type T1SnapshotState,
  type TierCheckpointKind,
  tierEntryProfileFromT1Snapshot,
} from "@mmo-idle/shared";
import type { RunHeader } from "./events";

export interface T1SnapshotArtifactRef {
  snapshotKind: T1CharacterSnapshotKind;
  snapshotId: string;
  file: string;
  capturedAtMs: number;
  elapsedMs: number;
  playerTier: number;
  globalMastery: number;
  nodeId: string;
  canonicalAtCapture: boolean;
}

export interface T1SnapshotManifest {
  schemaVersion: typeof T1_CHARACTER_SNAPSHOT_SCHEMA_VERSION;
  snapshotA: T1SnapshotArtifactRef | null;
  snapshotB: T1SnapshotArtifactRef | null;
  checkpoint?: T1SnapshotArtifactRef | null;
  namedCheckpoints?: Record<string, T1SnapshotArtifactRef>;
}

export interface BuildT1SnapshotParams {
  kind: T1CharacterSnapshotKind;
  header: RunHeader;
  self: PlayerView;
  frameId: string | null;
  elapsedMs: number;
  capturedAtMs?: number;
  rewardMultiplier: number;
  canonicalAtCapture: boolean;
  checkpointKind?: TierCheckpointKind;
  checkpointSourceNodeId?: string;
}

function cloneRecord<T extends object>(value: T): T {
  return { ...value } as T;
}

function cloneAbilities(self: PlayerView): PlayerView["attunedAbilities"] {
  return {
    techniques: [...self.attunedAbilities.techniques],
    guards: [...self.attunedAbilities.guards],
  };
}

/** Build the versioned persisted state from the bot's authoritative PlayerView. */
export function buildT1CharacterSnapshot(
  params: BuildT1SnapshotParams,
): T1CharacterSnapshot {
  const { header, self } = params;
  const capturedAtMs = params.capturedAtMs ?? Date.now();
  const classRoot = self.selectedClass ?? header.classRoot;
  const state: T1SnapshotState = {
    classRoot: self.selectedClass,
    frameId: params.frameId,
    selectedSubVariant: self.selectedSubVariant,
    selectedRange: self.selectedRange,
    unlockedSkills: [...self.unlockedSkills],
    passives: cloneRecord(self.passives),
    playerTier: self.playerTier,
    currentSkillTier: self.currentSkillTier,
    level: self.level,
    skillPoints: self.skillPoints,
    biomeXP: cloneRecord(self.biomeXP),
    biomeLevel: cloneRecord(self.biomeLevel),
    globalMastery: self.globalMastery,
    unlockedRecipes: [...self.unlockedRecipes],
    bossesCleared: [...self.bossesCleared],
    clearedNodes: [...self.clearedNodes],
    visitedNodes: [...self.visitedNodes],
    questProgress: cloneRecord(self.questProgress),
    essences: cloneRecord(self.essences),
    catalysts: cloneRecord(self.catalysts),
    catalystProgress: cloneRecord(self.catalystProgress),
    inventory: [...self.inventory],
    equipment: { ...self.equipment },
    itemUpgrades: cloneRecord(self.itemUpgrades),
    knownAbilities: [...self.knownAbilities],
    attunedAbilities: cloneAbilities(self),
    runesOwned: [...self.runesOwned],
    runeRecipesCrafted: [...self.runeRecipesCrafted],
    runesEquipped: self.runesEquipped.map((rule) => ({ ...rule })),
    knownStances: [...self.knownStances],
    attunedStances: [...(self.attunedStances ?? [])],
    equippedStances: { ...self.equippedStances },
    activeStance: self.activeStance,
    knownRites: [...self.knownRites],
    equippedRites: [...self.equippedRites],
    derivedStats: {
      attack: self.attack,
      onHitDamage: self.onHitDamage,
      maxHp: self.maxHp,
      recovery: self.recovery,
      plating: self.plating,
      damageReduction: self.damageReduction,
      dodgeRate: self.dodgeRate,
      evadeMitigation: self.evadeMitigation,
      attackRange: self.attackRange,
      speed: self.speed,
      attackStyle: self.attackStyle,
      combatArchetype: self.combatArchetype,
      riteSlots: self.riteSlots,
      summonsMinions: self.summonsMinions,
    },
    classResources: {
      cadenceSpeedStacks: self.cadenceSpeedStacks,
      cadenceCount: self.cadenceCount,
      cadenceThreshold: self.cadenceThreshold,
      cadenceEmpoweredArmed: self.cadenceEmpoweredArmed,
      ammoCount: self.ammoCount,
      ammoMax: self.ammoMax,
      heatPct: self.heatPct,
      laserOverheated: self.laserOverheated,
      executionReady: self.executionReady,
      executionCooldownPct: self.executionCooldownPct,
      energyCount: self.energyCount,
      energyMax: self.energyMax,
      flashShiftPct: self.flashShiftPct,
      flashDamageShiftPct: self.flashDamageShiftPct,
      flashSpeedBonusPct: self.flashSpeedBonusPct,
      flashEvasionBonusPct: self.flashEvasionBonusPct,
      empoweredReady: self.empoweredReady,
      targetDotStacks: self.targetDotStacks,
      targetDotTickPct: self.targetDotTickPct,
      targetChillStacks: self.targetChillStacks,
      isChanneling: self.isChanneling,
      channelingPct: self.channelingPct,
      cannonChargePct: self.cannonChargePct,
      aura: self.aura,
      summonActiveCount: self.summonActiveCount,
      summonRespawnMaxMs: self.summonRespawnMaxMs,
    },
    runtime: {
      nodeId: self.nodeId,
      pos: { ...self.pos },
      target: { ...self.target },
      hp: self.hp,
      maxHp: self.maxHp,
      barrier: self.barrier,
      barrierMax: self.barrierMax,
      barrierRecharging: self.barrierRecharging,
      wards: self.wards.map((ward) => ({ ...ward })),
      incomingDot: self.incomingDot,
      pendingHeal: self.pendingHeal,
      attackTargetId: self.attackTargetId,
      auto: self.auto,
      autoTraverse: self.autoTraverse,
      autoIntent: self.autoIntent ? { ...self.autoIntent } : null,
      partyLeaderId: self.partyLeaderId,
      partyMembers: self.partyMembers.map((member) => ({ ...member })),
      activeEffects: self.activeEffects ? { ...self.activeEffects } : undefined,
      activeEffectFrames: self.activeEffectFrames ? { ...self.activeEffectFrames } : undefined,
      activeBuffs: self.activeBuffs.map((buff) => ({ ...buff })),
      isDead: self.isDead,
      graveFrame: self.graveFrame,
      summonSlots: self.summonSlots.map((slot) => ({ ...slot })),
    },
  };

  return {
    schemaVersion: T1_CHARACTER_SNAPSHOT_SCHEMA_VERSION,
    snapshotKind: params.kind,
    snapshotId: `${header.runId}-${params.kind === "mastery-completion"
      ? "a"
      : params.kind === "tier2-handoff"
        ? "b"
        : `checkpoint-${params.checkpointKind ?? "unknown"}`}`,
    capturedAtMs,
    capturedAtIso: new Date(capturedAtMs).toISOString(),
    elapsedMs: params.elapsedMs,
    runId: header.runId,
    characterId: header.characterId,
    characterName: header.characterName,
    routeId: header.routeId,
    routeVersion: header.routeVersion,
    policyId: header.policyId,
    classRoot,
    frameId: params.frameId,
    ...(params.kind === "experiment-checkpoint"
      ? {
          checkpointKind: params.checkpointKind,
          checkpointSourceNodeId: params.checkpointSourceNodeId ?? self.nodeId,
        }
      : {}),
    gitRevision: header.gitRevision,
    serverUrl: header.serverUrl,
    canonicalAtCapture: params.canonicalAtCapture,
    economy: {
      candidate: { ...header.economyCandidate },
      rewardMultiplier: params.rewardMultiplier,
    },
    state,
  };
}

function refFor(snapshot: T1CharacterSnapshot, file: string): T1SnapshotArtifactRef {
  return {
    snapshotKind: snapshot.snapshotKind,
    snapshotId: snapshot.snapshotId,
    file,
    capturedAtMs: snapshot.capturedAtMs,
    elapsedMs: snapshot.elapsedMs,
    playerTier: snapshot.state.playerTier,
    globalMastery: snapshot.state.globalMastery,
    nodeId: snapshot.state.runtime.nodeId,
    canonicalAtCapture: snapshot.canonicalAtCapture,
  };
}

/** Synchronously writes A/B files so the boundary state cannot be lost on exit. */
export class T1SnapshotStore {
  private readonly namedCheckpoints: Record<string, T1SnapshotArtifactRef> = {};
  private readonly refs: {
    a: T1SnapshotArtifactRef | null;
    b: T1SnapshotArtifactRef | null;
    checkpoint: T1SnapshotArtifactRef | null;
  } = {
    a: null,
    b: null,
    checkpoint: null,
  };

  constructor(private readonly dir: string) {
    if (existsSync(join(dir, "snapshot-index.json"))) throw new Error("Snapshot artifact directory already has an index; use a fresh run directory");
    this.writeManifest();
  }

  capture(snapshot: T1CharacterSnapshot): T1SnapshotArtifactRef {
    if (snapshot.progressionCheckpoint) {
      const name = snapshot.progressionCheckpoint.boundaryId;
      if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(name)) throw new Error('Invalid named checkpoint');
      if (this.namedCheckpoints[name]) throw new Error(`Checkpoint ${name} already captured`);
      const file = `checkpoint-${name}.json`;
      writeFileSync(join(this.dir, file), `${JSON.stringify(snapshot, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
      const ref = refFor(snapshot, file); this.namedCheckpoints[name] = ref; this.writeManifest(); return ref;
    }
    const isA = snapshot.snapshotKind === "mastery-completion";
    const isB = snapshot.snapshotKind === "tier2-handoff";
    const isCheckpoint = snapshot.snapshotKind === "experiment-checkpoint";
    if (isCheckpoint && !snapshot.checkpointKind) {
      throw new Error("experiment checkpoint capture requires checkpointKind");
    }
    const existing = isA ? this.refs.a : isB ? this.refs.b : this.refs.checkpoint;
    if (existing) return existing;
    const file = isA
      ? "snapshot-a.json"
      : isB
        ? "snapshot-b.json"
        : `checkpoint-${snapshot.checkpointKind}.json`;
    writeFileSync(join(this.dir, file), `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    const ref = refFor(snapshot, file);
    if (isA) this.refs.a = ref;
    else if (isB) this.refs.b = ref;
    else this.refs.checkpoint = ref;
    this.writeManifest();
    return ref;
  }

  manifest(): T1SnapshotManifest {
    return {
      schemaVersion: T1_CHARACTER_SNAPSHOT_SCHEMA_VERSION,
      snapshotA: this.refs.a,
      snapshotB: this.refs.b,
      checkpoint: this.refs.checkpoint,
      namedCheckpoints: this.namedCheckpoints,
    };
  }

  writeManifest(): void {
    writeFileSync(
      join(this.dir, "snapshot-index.json"),
      `${JSON.stringify(this.manifest(), null, 2)}\n`,
      "utf8",
    );
  }
}

/** Read the stable JSON artifact used by the future T2 continuation command. */
export function readT1CharacterSnapshot(path: string): T1CharacterSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`could not read T1 character snapshot ${path}: ${String(error)}`);
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`T1 character snapshot ${path} is not an object`);
  }
  const snapshot = parsed as Partial<T1CharacterSnapshot>;
  if (
    snapshot.schemaVersion !== T1_CHARACTER_SNAPSHOT_SCHEMA_VERSION ||
    (snapshot.snapshotKind !== "mastery-completion" &&
      snapshot.snapshotKind !== "tier2-handoff" &&
      snapshot.snapshotKind !== "experiment-checkpoint") ||
    !snapshot.state ||
    !snapshot.economy
  ) {
    throw new Error(`T1 character snapshot ${path} has an unsupported or incomplete schema`);
  }
  return snapshot as T1CharacterSnapshot;
}

export { tierEntryProfileFromT1Snapshot };
