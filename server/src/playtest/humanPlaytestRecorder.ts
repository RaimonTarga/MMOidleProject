import { createWriteStream, mkdirSync, writeFileSync, type WriteStream } from "node:fs";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  GAME_CONFIG,
  NODE_BIOMES,
  globalMastery,
  type WorldLogEvent,
} from "@mmo-idle/shared";
import type { PlayerEntity } from "../ecs/entity";
import type { World } from "../world/World";

/** Deliberately separate from bot schema version: human-only extensions are optional. */
export const HUMAN_PLAYTEST_SCHEMA_VERSION = 1;
const OUTSIDE_COMBAT_SAMPLE_MS = 1_000;
const COMBAT_SAMPLE_MS = 500;
const BOSS_COMBAT_SAMPLE_MS = 200;

export interface HumanPlaytestStatus {
  active: boolean;
  runId?: string;
  startedAt?: number;
  eventCount: number;
  artifactPath?: string;
  message?: string;
}

type HumanEvent =
  | { kind: "run-start"; atMs: number; header: Record<string, unknown> }
  | { kind: "run-end"; atMs: number; completion: "completed" | "interrupted" | "error"; durationMs: number; reason?: string }
  | { kind: "position-sample"; atMs: number; nodeId: string; combat: boolean; bossCombat: boolean; moving: boolean; movementState: string; player: { x: number; y: number }; target?: { id: string; x: number; y: number; isBoss: boolean; hpFraction: number }; distance?: number; nearBoundary: boolean }
  | { kind: "build-snapshot"; atMs: number; phase: "start" | "end"; build: Record<string, unknown> }
  | { kind: "build-change"; atMs: number; build: Record<string, unknown> }
  | { kind: "boss-attempt"; atMs: number; phase: "start" | "end"; bossId: string; bossName: string; outcome?: "victory" | "disengaged" | "ended" | "interrupted"; bossHpFraction: number; durationMs?: number }
  | { kind: "reward-multiplier-change"; atMs: number; multiplier: number }
  | { kind: "world"; atMs: number; event: WorldLogEvent };

type BossAttempt = {
  bossId: string;
  startedAt: number;
  endedAt?: number;
  bossName: string;
  bossHpFraction: number;
  damageTaken: number;
  damageDealt: number;
  outcome?: "victory" | "disengaged" | "ended" | "interrupted";
};

class HumanPlaytestRecording {
  readonly dir: string;
  readonly runId: string;
  readonly startedAt = Date.now();
  private readonly stream: WriteStream;
  private closed = false;
  private eventCount = 0;
  private lastSampleAt = 0;
  private readonly kills = new Map<string, number>();
  private damageDealt = 0;
  private damageTaken = 0;
  private healed = 0;
  private deaths = 0;
  private abilityActivations: Record<string, number> = {};
  private readonly bossAttempts: BossAttempt[] = [];
  private readonly activeBossAttempts = new Map<string, BossAttempt>();
  private readonly taints: string[];
  private readonly rewardMultiplierChanges: Array<{ atMs: number; multiplier: number }>;
  private lastBuildSignature = "";
  private lastBuildCheckAt = 0;
  private readonly startedRewardMultiplier: number;
  private positionSamples = 0;
  private movingSamples = 0;
  private stationaryCombatSamples = 0;
  private boundarySamples = 0;
  private bossSamples = 0;
  private bossMovingSamples = 0;
  private bossBoundarySamples = 0;
  private readonly bossDistances: number[] = [];

  constructor(private readonly playerId: string, player: PlayerEntity, world: World, outRoot: string) {
    this.runId = `human-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
    this.dir = resolve(outRoot, this.runId);
    mkdirSync(this.dir, { recursive: true });
    this.stream = createWriteStream(join(this.dir, "events.jsonl"), { flags: "a" });
    this.startedRewardMultiplier = world.rewardMultiplier;
    this.taints = world.rewardMultiplier === 1 ? [] : ["NON_CANONICAL_REWARD_MULTIPLIER"];
    this.rewardMultiplierChanges = [{ atMs: 0, multiplier: world.rewardMultiplier }];
    const header = this.header(player, world);
    this.write({ kind: "run-start", atMs: 0, header });
    this.write({ kind: "build-snapshot", atMs: 0, phase: "start", build: buildSnapshot(player) });
  }

  status(message?: string): HumanPlaytestStatus {
    return { active: !this.closed, runId: this.runId, startedAt: this.startedAt, eventCount: this.eventCount, artifactPath: this.dir, message };
  }

  recordWorldEvent(event: WorldLogEvent): void {
    if (this.closed) return;
    const atMs = event.serverTime - this.startedAt;
    this.write({ kind: "world", atMs, event });
    switch (event.kind) {
      case "damage":
        if (event.source.id === this.playerId || event.source.ownerPlayerId === this.playerId) this.damageDealt += event.hpDamage;
        if (event.target.id === this.playerId || event.target.ownerPlayerId === this.playerId) this.damageTaken += event.hpDamage;
        for (const attempt of this.activeBossAttempts.values()) {
          if (event.source.id === this.playerId || event.source.ownerPlayerId === this.playerId) attempt.damageDealt += event.hpDamage;
          if (event.target.id === this.playerId || event.target.ownerPlayerId === this.playerId) attempt.damageTaken += event.hpDamage;
        }
        break;
      case "heal": if (event.target.id === this.playerId) this.healed += event.amount; break;
      case "kill": if (event.killer.id === this.playerId || event.killer.ownerPlayerId === this.playerId) this.kills.set(event.victim.name, (this.kills.get(event.victim.name) ?? 0) + 1); break;
      case "player-death": if (event.player.id === this.playerId) this.deaths++; break;
      case "ability-activation": if (event.player.id === this.playerId) this.abilityActivations[event.abilityId] = (this.abilityActivations[event.abilityId] ?? 0) + 1; break;
    }
    if (event.kind === "kill" && (event.killer.id === this.playerId || event.killer.ownerPlayerId === this.playerId)) {
      const attempt = this.activeBossAttempts.get(event.victim.id);
      if (attempt) {
        attempt.bossHpFraction = 0;
        this.finishBossAttempt(attempt, atMs, "victory");
      }
    }
  }

  noteRewardMultiplier(multiplier: number, now = Date.now()): void {
    if (this.closed) return;
    const previous = this.rewardMultiplierChanges.at(-1)?.multiplier;
    if (previous === multiplier) return;
    const atMs = Math.max(0, now - this.startedAt);
    this.rewardMultiplierChanges.push({ atMs, multiplier });
    if (multiplier !== 1 && !this.taints.includes("NON_CANONICAL_REWARD_MULTIPLIER")) {
      this.taints.push("NON_CANONICAL_REWARD_MULTIPLIER");
    }
    this.write({ kind: "reward-multiplier-change", atMs, multiplier });
  }

  sample(world: World, now: number): void {
    if (this.closed) return;
    const player = world.getPlayerEntity(this.playerId);
    if (!player) return;
    const target = player.hasAttackTarget ? world.getMonsterEntity(player.hasAttackTarget.targetId) : null;
    const boss = target?.isMonster.isBoss === true;
    const combat = Boolean(player.tracksEngagement || target);
    const interval = boss ? BOSS_COMBAT_SAMPLE_MS : combat ? COMBAT_SAMPLE_MS : OUTSIDE_COMBAT_SAMPLE_MS;
    if (now - this.lastSampleAt < interval) return;
    this.lastSampleAt = now;
    if (now - this.lastBuildCheckAt >= 1_000) {
      this.lastBuildCheckAt = now;
      const build = buildSnapshot(player);
      const signature = JSON.stringify(build);
      if (this.lastBuildSignature && signature !== this.lastBuildSignature) this.write({ kind: "build-change", atMs: now - this.startedAt, build });
      this.lastBuildSignature = signature;
    }
    const p = player.hasPosition.current;
    const targetPos = target?.hasPosition.current;
    const distance = targetPos ? Math.hypot(p.x - targetPos.x, p.y - targetPos.y) : undefined;
    const boundaryInset = 160;
    const nearBoundary = p.x < boundaryInset || p.y < boundaryInset || p.x > GAME_CONFIG.NODE_WIDTH - boundaryInset || p.y > GAME_CONFIG.NODE_HEIGHT - boundaryInset;
    const movementState = player.isFleeing ? "flee" : player.hasManualMoveIntent ? "manual" : player.hasAutoIntent?.kind ?? (player.isMoving ? "moving" : "stationary");
    this.write({ kind: "position-sample", atMs: now - this.startedAt, nodeId: player.hasPosition.nodeId, combat, bossCombat: boss, moving: Boolean(player.isMoving), movementState, player: { ...p }, target: target && targetPos ? { id: target.isMonster.id, x: targetPos.x, y: targetPos.y, isBoss: boss, hpFraction: target.hasHealth.maxHp > 0 ? target.hasHealth.hp / target.hasHealth.maxHp : 0 } : undefined, distance, nearBoundary });
    this.positionSamples++;
    if (player.isMoving) this.movingSamples++;
    if (combat && !player.isMoving) this.stationaryCombatSamples++;
    if (nearBoundary) this.boundarySamples++;
    if (boss) {
      this.bossSamples++;
      if (player.isMoving) this.bossMovingSamples++;
      if (nearBoundary) this.bossBoundarySamples++;
      if (distance !== undefined) this.bossDistances.push(distance);
    }
    if (boss && target) {
      const previous = this.activeBossAttempts.get(target.isMonster.id);
      if (!previous) {
        const hpFraction = target.hasHealth.maxHp > 0 ? target.hasHealth.hp / target.hasHealth.maxHp : 0;
        const attempt: BossAttempt = { bossId: target.isMonster.id, startedAt: now - this.startedAt, bossName: target.isMonster.name, bossHpFraction: hpFraction, damageDealt: 0, damageTaken: 0 };
        this.bossAttempts.push(attempt);
        this.activeBossAttempts.set(target.isMonster.id, attempt);
        this.write({ kind: "boss-attempt", atMs: now - this.startedAt, phase: "start", bossId: target.isMonster.id, bossName: target.isMonster.name, bossHpFraction: hpFraction });
      }
      else previous.bossHpFraction = target.hasHealth.maxHp > 0 ? target.hasHealth.hp / target.hasHealth.maxHp : 0;
    }
    if (!boss) this.finishActiveBossAttempts(now - this.startedAt, "disengaged");
  }

  async finish(world: World, completion: "completed" | "interrupted" | "error", reason?: string): Promise<HumanPlaytestStatus> {
    if (this.closed) return this.status(reason);
    const player = world.getPlayerEntity(this.playerId);
    const endedAt = Date.now();
    const durationMs = endedAt - this.startedAt;
    this.finishActiveBossAttempts(durationMs, completion === "interrupted" ? "interrupted" : "ended");
    if (player) this.write({ kind: "build-snapshot", atMs: durationMs, phase: "end", build: buildSnapshot(player) });
    this.write({ kind: "run-end", atMs: durationMs, completion, durationMs, reason });
    await new Promise<void>((resolveStream, reject) => {
      const onError = (err: Error) => { this.stream.off("error", onError); reject(err); };
      this.stream.once("error", onError);
      this.stream.end(() => { this.stream.off("error", onError); resolveStream(); });
    });
    this.closed = true;
    const progression = player?.tracksProgression;
    const summary = {
      schemaVersion: HUMAN_PLAYTEST_SCHEMA_VERSION,
      run: { type: "HUMAN_PLAYTEST", runId: this.runId, startedAt: this.startedAt, endedAt, durationMs, completion, interrupted: completion === "interrupted", reason, artifactPath: this.dir, canonical: this.taints.length === 0, taints: this.taints, rewardMultiplier: { start: this.startedRewardMultiplier, end: world.rewardMultiplier, changes: this.rewardMultiplierChanges } },
      progression: { finalPlayerTier: progression?.playerTier ?? null, finalGlobalMastery: progression ? globalMastery(progression.biomeLevel) : null, biomeLevels: progression?.biomeLevel ?? {} },
      combat: { totalKills: [...this.kills.values()].reduce((a, b) => a + b, 0), killsByMonster: Object.fromEntries(this.kills), totalDamageTaken: this.damageTaken, playerDamageDealt: this.damageDealt, totalHealed: this.healed, deaths: this.deaths, abilityActivations: this.abilityActivations },
      positioning: {
        samples: this.positionSamples,
        movementFraction: fraction(this.movingSamples, this.positionSamples),
        stationaryCombatFraction: fraction(this.stationaryCombatSamples, this.positionSamples),
        nearBoundaryFraction: fraction(this.boundarySamples, this.positionSamples),
        boss: { movementFraction: fraction(this.bossMovingSamples, this.bossSamples), nearBoundaryFraction: fraction(this.bossBoundarySamples, this.bossSamples), range: rangeMetrics(this.bossDistances) },
      },
      bosses: this.bossAttempts.map(b => ({ bossName: b.bossName, outcome: b.outcome ?? (completion === "interrupted" ? "interrupted" : "ended"), bossHpFraction: b.bossHpFraction, combatDurationMs: Math.max(0, (b.endedAt ?? durationMs) - b.startedAt), playerDamage: b.damageDealt, incomingDamage: b.damageTaken })),
      build: player ? buildSnapshot(player) : null,
      comparisonNotes: { sharedVocabulary: "WorldLogEvent (damage, ability-activation, hazards, telegraph-dodge, technique-adapter)", positionSamplingMs: { outsideCombat: OUTSIDE_COMBAT_SAMPLE_MS, combat: COMBAT_SAMPLE_MS, bossCombat: BOSS_COMBAT_SAMPLE_MS }, unavailable: ["psychological intent", "authoritative boundary collision", "per-frame input replay"] },
    };
    writeFileSync(join(this.dir, "summary.json"), JSON.stringify(summary, null, 2));
    return this.status(`Saved ${this.dir}`);
  }

  private write(event: HumanEvent): void { this.eventCount++; this.stream.write(`${JSON.stringify(event)}\n`); }

  private finishActiveBossAttempts(atMs: number, outcome: NonNullable<BossAttempt["outcome"]>): void {
    for (const attempt of [...this.activeBossAttempts.values()]) this.finishBossAttempt(attempt, atMs, outcome);
  }

  private finishBossAttempt(attempt: BossAttempt, atMs: number, outcome: NonNullable<BossAttempt["outcome"]>): void {
    if (attempt.endedAt !== undefined) return;
    attempt.endedAt = atMs;
    attempt.outcome = outcome;
    this.activeBossAttempts.delete(attempt.bossId);
    this.write({ kind: "boss-attempt", atMs, phase: "end", bossId: attempt.bossId, bossName: attempt.bossName, outcome, bossHpFraction: attempt.bossHpFraction, durationMs: Math.max(0, atMs - attempt.startedAt) });
  }

  private header(player: PlayerEntity, world: World): Record<string, unknown> {
    const p = player.tracksProgression;
    return { schemaVersion: HUMAN_PLAYTEST_SCHEMA_VERSION, type: "HUMAN_PLAYTEST", runId: this.runId, characterId: this.playerId, characterName: player.isPlayer.name, classRoot: player.usesSkills.selectedClass, frame: player.usesSkills.selectedSubVariant, startedAt: this.startedAt, serverEnvironment: process.env.NODE_ENV ?? "development", gitRevision: gitRevision(), rewardMultiplier: world.rewardMultiplier, playerTier: p.playerTier, globalMastery: globalMastery(p.biomeLevel), debug: true, taints: this.taints };
  }
}

function gitRevision(): string {
  try { return execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim(); }
  catch { return "unknown"; }
}

function fraction(part: number, total: number): number | null { return total > 0 ? part / total : null; }
function rangeMetrics(values: number[]) {
  if (values.length === 0) return { samples: 0, mean: null, min: null, max: null, p50: null, p90: null };
  const sorted = [...values].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * q))];
  return { samples: values.length, mean: values.reduce((sum, value) => sum + value, 0) / values.length, min: sorted[0], max: sorted.at(-1)!, p50: at(0.5), p90: at(0.9) };
}

export class HumanPlaytestRecorderManager {
  private readonly recordings = new Map<string, HumanPlaytestRecording>();
  constructor(private readonly outRoot = resolve(process.cwd(), "runs", "human-playtests")) {}

  start(world: World, player: PlayerEntity): HumanPlaytestStatus {
    const existing = this.recordings.get(player.isPlayer.id);
    if (existing) return existing.status("Already recording this session.");
    const recording = new HumanPlaytestRecording(player.isPlayer.id, player, world, this.outRoot);
    this.recordings.set(player.isPlayer.id, recording);
    return recording.status("Playtest logging started.");
  }
  status(playerId: string): HumanPlaytestStatus { return this.recordings.get(playerId)?.status() ?? { active: false, eventCount: 0 }; }
  recordWorldEvent(playerId: string, event: WorldLogEvent): void { this.recordings.get(playerId)?.recordWorldEvent(event); }
  noteRewardMultiplier(multiplier: number, now = Date.now()): void { for (const recording of this.recordings.values()) recording.noteRewardMultiplier(multiplier, now); }
  sample(world: World, now: number): void { for (const recording of this.recordings.values()) recording.sample(world, now); }
  async stop(world: World, playerId: string, completion: "completed" | "interrupted" | "error" = "completed", reason?: string): Promise<HumanPlaytestStatus> {
    const recording = this.recordings.get(playerId);
    if (!recording) return { active: false, eventCount: 0, message: "No active playtest recording." };
    this.recordings.delete(playerId);
    try { return await recording.finish(world, completion, reason); }
    catch (err) { return { active: false, runId: recording.runId, eventCount: 0, artifactPath: recording.dir, message: `Failed to finalize: ${err instanceof Error ? err.message : String(err)}` }; }
  }
  async interruptAll(world: World, reason: string): Promise<void> {
    await Promise.all([...this.recordings.keys()].map(playerId => this.stop(world, playerId, "interrupted", reason)));
  }
}

function buildSnapshot(player: PlayerEntity): Record<string, unknown> {
  return {
    equipment: { ...player.holdsInventory.equipment }, itemUpgrades: { ...player.holdsInventory.itemUpgrades },
    classRoot: player.usesSkills.selectedClass, frame: player.usesSkills.selectedSubVariant, range: player.usesSkills.selectedRange,
    techniques: [...player.tracksProgression.equippedAbilities.techniques], guards: [...player.tracksProgression.equippedAbilities.guards],
    runes: player.tracksProgression.runesEquipped.map(rule => ({ conditionId: rule.conditionId, actionId: rule.actionId })),
    stats: { attack: player.dealsDamage.attack, attackRange: player.performsAttack.attackRange, attackCooldown: player.performsAttack.attackCooldown, maxHp: player.hasHealth.maxHp, plating: player.mitigatesDamage.plating, damageReduction: player.mitigatesDamage.damageReduction },
  };
}
