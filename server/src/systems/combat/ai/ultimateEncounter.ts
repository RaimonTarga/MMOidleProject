import {
  applyStatusEffect,
  computeScaledDotDamage,
  getStatusEffect,
  initScriptsUltimate,
  MONSTER_DATABASE,
  pointNearNodeFeatureShapeEdge,
  randomPointOnShapeEdge,
  removeStatusEffect,
  RESOLVED_NODE_FEATURES,
  type EncounterStage,
  type MonsterDefinition,
  type StageAction,
  type StageCondition,
  type ScriptsUltimate,
  type UltimateEncounter,
  type UltimateStatus,
  type Vec2,
  type WaveDef,
} from "@mmo-idle/shared";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import { attachComponent, detachComponent } from "../../../ecs/markerHelpers";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import type { World } from "../../../world/World";
import { stopEntity } from "../../world/movement";
import { setRooted } from "../../world/rooted";
import { clampSpawnToNode } from "../../world/nodeFeatures";
import { setAggroTarget, setAttackTarget } from "./targeting";
import { buildKillerFromMonster } from "../../world/deathCause";
import { actorFromMonster } from "../../../world/worldLogActors";
import { buildSimpleBreakdown, recordPlayerDamaged } from "../../../world/worldLogCombat";
import { recordWorldLogEvent } from "../../../world/worldLog";
import { markUltimateContributor } from "./ultimateContributors";
import { isInvulnerablePlayer } from "../invulnerability";

const ENVIRONMENTAL_DOT_FLAG = 1;
/** Px band around spawn feature perimeter that starts the encounter (throne ring contact). */
const ENGAGE_RING_BAND_PX = 56;

/** Pre-fight: invulnerable, rooted, no pull aggro until the encounter starts. */
export function applyDormantUltimateBoss(
  world: World,
  boss: MonsterEntity,
  def: MonsterDefinition,
): void {
  const state = ultimateState(boss);
  state.savedBaseline.speed = def.stats.speed;
  state.savedBaseline.pullRange = def.stats.pullRange;
  state.savedBaseline.spawn = { ...boss.controlsMonster.spawn };

  attachComponent(world, boss, "isInvulnerable", {});
  attachComponent(world, boss, "cannotAttack", {});
  boss.hasPosition.speed = def.stats.speed;
  boss.controlsMonster.baseSpeed = def.stats.speed;
  boss.hasAwareness.pullRange = 0;
  boss.hasAwareness.state = "idle";
  setRooted(world, boss, true);
}

/** Start phase 1 when the player touches the environment ring or attacks the boss. */
export function tryEngageUltimateEncounter(
  world: World,
  boss: MonsterEntity,
): boolean {
  if (!boss.scriptsUltimate || boss.scriptsUltimate.engaged) return false;
  const encounter = MONSTER_DATABASE.get(boss.isMonster.monsterTypeId)?.ultimateEncounter;
  if (!encounter) return false;
  engageEncounter(world, boss, encounter);
  return true;
}

function tickUltimateEngagementProximity(world: World): void {
  for (const boss of world.ultimateMonsters) {
    if (boss.scriptsUltimate?.engaged) continue;
    const encounter = MONSTER_DATABASE.get(boss.isMonster.monsterTypeId)?.ultimateEncounter;
    const featureId = encounter?.spawnFromFeatureId;
    if (!featureId) continue;

    const feature = RESOLVED_NODE_FEATURES[boss.hasPosition.nodeId]?.find(
      f => f.id === featureId,
    );
    if (!feature) continue;

    for (const player of world.livePlayersInNode(boss.hasPosition.nodeId)) {
      if (
        !pointNearNodeFeatureShapeEdge(
          player.hasPosition.current,
          feature.shape,
          ENGAGE_RING_BAND_PX,
        )
      ) {
        continue;
      }
      if (tryEngageUltimateEncounter(world, boss)) {
        setAggroTarget(
          world,
          boss,
          { id: player.isPlayer.id, kind: "player" },
          Date.now(),
        );
      }
      break;
    }
  }
}

interface StageObjectiveEval {
  complete: boolean;
  current: number;
  total: number;
  detail?: string;
}

function ultimateState(boss: MonsterEntity): ScriptsUltimate {
  if (!boss.scriptsUltimate) {
    throw new Error(`Ultimate boss ${boss.isMonster.id} is missing scriptsUltimate`);
  }
  return boss.scriptsUltimate;
}

function restoreSavedBaseline(boss: MonsterEntity): void {
  const { savedBaseline } = ultimateState(boss);
  if (savedBaseline.speed !== undefined) {
    boss.controlsMonster.baseSpeed = savedBaseline.speed;
    boss.hasPosition.speed = savedBaseline.speed;
  }
  if (savedBaseline.pullRange !== undefined) {
    boss.hasAwareness.pullRange = savedBaseline.pullRange;
  }
  if (savedBaseline.spawn) {
    boss.controlsMonster.spawn = { ...savedBaseline.spawn };
  }
}

/**
 * Ultimate encounters are allowed to spawn tracked adds beyond normal biome
 * density. `scriptsUltimate` tracked ids are authoritative for wipe cleanup;
 * empty-node cleanup is handled by freezeNode despawning all monsters.
 */
export function updateUltimateEncounters(world: World, dt: number): void {
  tickUltimateEngagementProximity(world);

  for (const boss of world.ultimateMonsters) {
    const def = MONSTER_DATABASE.get(boss.isMonster.monsterTypeId);
    const encounter = def?.ultimateEncounter;
    if (!encounter) continue;

    const state = ultimateState(boss);
    const nodeId = boss.hasPosition.nodeId;

    if (encounter.reset.onWipe && state.engaged && nodeWiped(world, nodeId)) {
      resetEncounter(world, boss, encounter);
      continue;
    }

    if (!state.engaged) {
      if (!boss.hasAggroTarget) continue;
      engageEncounter(world, boss, encounter);
    }

    tickEnvironmentalDot(world, boss, dt);

    let stage = encounter.stages[ultimateState(boss).stageIndex];
    if (!stage) continue;

    if (stage.completeWhen && isStageComplete(world, boss, stage)) {
      exitStage(world, boss);
      const nextStageIndex = ultimateState(boss).stageIndex + 1;
      if (nextStageIndex < encounter.stages.length) {
        enterStage(world, boss, encounter, nextStageIndex);
        stage = encounter.stages[nextStageIndex];
      }
    }

    if (!stage) continue;
    syncBossEffects(boss, stage);
    syncUltimateStatus(world, boss, encounter, stage);
  }
}

function engageEncounter(
  world: World,
  boss: MonsterEntity,
  encounter: UltimateEncounter,
): void {
  const state = ultimateState(boss);
  state.engaged = true;
  restoreSavedBaseline(boss);
  attachComponent(world, boss, "isUltimateEngaged", {});
  enterStage(world, boss, encounter, 0);
}

function enterStage(
  world: World,
  boss: MonsterEntity,
  encounter: UltimateEncounter,
  stageIndex: number,
): void {
  const state = ultimateState(boss);
  state.stageIndex = stageIndex;
  state.waveIndex = 0;
  state.trackedAddIds = [];
  state.trackedEliteIds = [];

  const stage = encounter.stages[stageIndex];
  if (!stage) return;

  if (stage.vulnerable) detachComponent(world, boss, "isInvulnerable");

  for (const action of stage.onEnter) {
    applyStageAction(world, boss, action);
  }
}

function exitStage(world: World, boss: MonsterEntity): void {
  clearEnvironmentalDot(world, boss);
  const state = ultimateState(boss);
  state.trackedAddIds = [];
  state.trackedEliteIds = [];
}

function resetEncounter(
  world: World,
  boss: MonsterEntity,
  encounter: UltimateEncounter,
): void {
  const state = ultimateState(boss);
  for (const id of [...state.trackedAddIds, ...state.trackedEliteIds]) {
    world.removeMonsterEntity(id);
  }

  clearEnvironmentalDot(world, boss);
  setRooted(world, boss, false);
  detachComponent(world, boss, "cannotAttack");
  boss.hasHealth.hp = boss.hasHealth.maxHp;
  setAggroTarget(world, boss, null, Date.now());
  setAttackTarget(world, boss, null);
  stopEntity(world, boss);
  detachComponent(world, boss, "isUltimateEngaged");
  detachComponent(world, boss, "isInvulnerable");
  boss.hasStatus.bossEffects = [];
  delete boss.hasStatus.ultimateStatus;
  markSliceDirty(world, boss, "hasStatus");
  boss.scriptsUltimate = initScriptsUltimate();

  if (encounter.anchor === "center") {
    boss.controlsMonster.spawn = { ...boss.hasPosition.current };
  }

  const def = MONSTER_DATABASE.get(boss.isMonster.monsterTypeId);
  if (def?.ultimateEncounter) {
    applyDormantUltimateBoss(world, boss, def);
  }

  for (const key of [...world.suppressedFeatureBlocks]) {
    if (key.startsWith(`${boss.hasPosition.nodeId}:`)) {
      world.suppressedFeatureBlocks.delete(key);
    }
  }
}

function applyStageAction(
  world: World,
  boss: MonsterEntity,
  action: StageAction,
): void {
  switch (action.type) {
    case "spawn-waves":
      spawnNextWave(world, boss, action.waves);
      break;
    case "spawn-elites":
      spawnTracked(world, boss, action.monsterTypeId, action.count, action.offsetRange ?? 280, "elite");
      break;
    case "environmental-dot":
      ultimateState(boss).activeDot = {
        ...action,
        refreshTimerMs: 0,
        stackCap: action.stackCap ?? 40,
        currentStacks: 1,
        refreshCount: 0,
      };
      break;
    case "set-invulnerable":
      if (action.value) attachComponent(world, boss, "isInvulnerable", {});
      else detachComponent(world, boss, "isInvulnerable");
      break;
    case "set-rooted":
      setRooted(world, boss, action.value);
      break;
    case "set-cannot-attack":
      if (action.value) {
        attachComponent(world, boss, "cannotAttack", {});
        setAttackTarget(world, boss, null);
      } else {
        detachComponent(world, boss, "cannotAttack");
      }
      break;
    case "set-feature-block": {
      const key = `${boss.hasPosition.nodeId}:${action.featureId}`;
      if (action.value) world.suppressedFeatureBlocks.delete(key);
      else world.suppressedFeatureBlocks.add(key);
      break;
    }
  }
}

function pruneTrackedIds(world: World, boss: MonsterEntity): void {
  const state = ultimateState(boss);
  state.trackedAddIds = state.trackedAddIds.filter(id => world.hasMonster(id));
  state.trackedEliteIds = state.trackedEliteIds.filter(id => world.hasMonster(id));
}

function countInitialAdds(stage: EncounterStage): number {
  let total = 0;
  for (const action of stage.onEnter) {
    if (action.type === "spawn-waves") {
      for (const wave of action.waves) {
        for (const add of wave.adds) total += add.count;
      }
    }
    if (action.type === "spawn-elites") total += action.count;
  }
  return total;
}

function evaluateStageObjective(
  world: World,
  boss: MonsterEntity,
  stage: EncounterStage,
): StageObjectiveEval {
  pruneTrackedIds(world, boss);
  const state = ultimateState(boss);

  switch (stage.completeWhen?.kind) {
    case "adds-cleared": {
      const total = countInitialAdds(stage);
      return {
        complete: state.trackedAddIds.length === 0,
        current: state.trackedAddIds.length,
        total,
        detail: `Enemies remaining: ${state.trackedAddIds.length}`,
      };
    }
    case "elites-cleared": {
      const eliteAction = stage.onEnter.find(
        (a): a is Extract<StageAction, { type: "spawn-elites" }> =>
          a.type === "spawn-elites",
      );
      const total = eliteAction?.count ?? state.trackedEliteIds.length;
      return {
        complete: state.trackedEliteIds.length === 0,
        current: state.trackedEliteIds.length,
        total,
        detail: `Elites remaining: ${state.trackedEliteIds.length} / ${total}`,
      };
    }
    case "waves-cleared": {
      const waveAction = stage.onEnter.find(
        (a): a is { type: "spawn-waves"; waves: WaveDef[] } =>
          a.type === "spawn-waves",
      );
      const waveCount = waveAction?.waves.length ?? 0;
      if (state.trackedAddIds.length > 0) {
        return {
          complete: false,
          current: state.trackedAddIds.length,
          total: waveCount,
          detail: `Wave ${state.waveIndex} / ${waveCount} · Enemies remaining: ${state.trackedAddIds.length}`,
        };
      }
      if (waveAction && state.waveIndex < waveAction.waves.length) {
        return {
          complete: false,
          current: 0,
          total: waveCount,
          detail: `Wave ${state.waveIndex} / ${waveCount} · Enemies remaining: 0`,
        };
      }
      return { complete: true, current: 0, total: waveCount };
    }
    default:
      return { complete: false, current: 0, total: 0 };
  }
}

function isStageComplete(
  world: World,
  boss: MonsterEntity,
  stage: EncounterStage,
): boolean {
  const state = ultimateState(boss);
  pruneTrackedIds(world, boss);

  if (stage.completeWhen?.kind === "waves-cleared") {
    if (state.trackedAddIds.length > 0) return false;
    const waveAction = stage.onEnter.find(
      (a): a is { type: "spawn-waves"; waves: WaveDef[] } => a.type === "spawn-waves",
    );
    if (!waveAction) return true;
    if (state.waveIndex < waveAction.waves.length) {
      spawnNextWave(world, boss, waveAction.waves);
      return false;
    }
    return true;
  }

  return evaluateStageObjective(world, boss, stage).complete;
}

function defaultObjectiveHeadline(kind: StageCondition["kind"]): string {
  switch (kind) {
    case "waves-cleared":
      return "NEXT PHASE: Clear all summoned adds";
    case "elites-cleared":
      return "NEXT PHASE: Slay the elites";
    case "adds-cleared":
      return "NEXT PHASE: Clear all adds";
  }
}

function buildUltimateStatus(
  world: World,
  boss: MonsterEntity,
  encounter: UltimateEncounter,
  stage: EncounterStage,
): UltimateStatus {
  const state = ultimateState(boss);
  const displayName = stage.displayName ?? stage.id.toUpperCase();
  const stageLabel = `PHASE ${state.stageIndex + 1} / ${encounter.stages.length} · ${displayName.toUpperCase()}`;

  let objective: UltimateStatus["objective"];
  if (stage.completeWhen) {
    const evalResult = evaluateStageObjective(world, boss, stage);
    const kind = stage.completeWhen.kind;
    objective = {
      headline: stage.objectiveLabel
        ? `NEXT PHASE: ${stage.objectiveLabel}`
        : defaultObjectiveHeadline(kind),
      detail: evalResult.detail,
      current: evalResult.current,
      total: evalResult.total,
    };
  } else {
    objective = { headline: "FINAL PHASE: Destroy the boss" };
  }

  const dotAction = stage.onEnter.find(
    (a): a is Extract<StageAction, { type: "environmental-dot" }> =>
      a.type === "environmental-dot",
  );
  const dot = state.activeDot;

  return {
    stageLabel,
    stageIndex: state.stageIndex,
    stageCount: encounter.stages.length,
    invulnerable: !!boss.isInvulnerable,
    objective,
    hazard: dot
      ? {
          effectId: dot.effectId,
          dmgPerTick: dot.currentStacks * dot.damagePerStack,
          tickMs: dot.tickIntervalMs,
          hint: dotAction?.hazardHint,
        }
      : undefined,
  };
}

function objectiveStatusEqual(
  a: UltimateStatus["objective"],
  b: UltimateStatus["objective"],
): boolean {
  if (a === b) return true;
  if (!a || !b) return a === b;
  return (
    a.headline === b.headline &&
    a.detail === b.detail &&
    a.current === b.current &&
    a.total === b.total
  );
}

function hazardStatusEqual(
  a: UltimateStatus["hazard"],
  b: UltimateStatus["hazard"],
): boolean {
  if (a === b) return true;
  if (!a || !b) return a === b;
  return (
    a.effectId === b.effectId &&
    a.dmgPerTick === b.dmgPerTick &&
    a.tickMs === b.tickMs &&
    a.hint === b.hint
  );
}

function ultimateStatusEqual(
  prev: UltimateStatus | undefined,
  next: UltimateStatus,
): boolean {
  if (!prev) return false;
  return (
    prev.stageLabel === next.stageLabel &&
    prev.stageIndex === next.stageIndex &&
    prev.stageCount === next.stageCount &&
    prev.invulnerable === next.invulnerable &&
    objectiveStatusEqual(prev.objective, next.objective) &&
    hazardStatusEqual(prev.hazard, next.hazard)
  );
}

function syncUltimateStatus(
  world: World,
  boss: MonsterEntity,
  encounter: UltimateEncounter,
  stage: EncounterStage,
): void {
  const next = buildUltimateStatus(world, boss, encounter, stage);
  const prev = boss.hasStatus.ultimateStatus;
  boss.hasStatus.ultimateStatus = next;
  if (!ultimateStatusEqual(prev, next)) {
    markSliceDirty(world, boss, "hasStatus");
  }
}

function spawnNextWave(
  world: World,
  boss: MonsterEntity,
  waves: WaveDef[],
): void {
  const state = ultimateState(boss);
  const index = state.waveIndex;
  const wave = waves[index];
  if (!wave) return;
  for (const add of wave.adds) {
    spawnTracked(world, boss, add.monsterTypeId, add.count, 320, "add");
  }
  state.waveIndex++;
}

function spawnTracked(
  world: World,
  boss: MonsterEntity,
  monsterTypeId: string,
  count: number,
  offsetRange: number,
  kind: "add" | "elite",
): void {
  if (!MONSTER_DATABASE.has(monsterTypeId)) {
    return;
  }

  for (let i = 0; i < count; i++) {
    const encounter = MONSTER_DATABASE.get(boss.isMonster.monsterTypeId)?.ultimateEncounter;
    const pos = encounter
      ? resolveEncounterSpawnPoint(boss, encounter, offsetRange)
      : spawnPositionNear(boss.hasPosition.current, offsetRange);
    const monster = world.createMonster(
      boss.hasPosition.nodeId,
      monsterTypeId,
      pos,
    );
    if (!monster) continue;
    attachComponent(world, monster, "isEncounterAdd", {});
    const state = ultimateState(boss);
    if (kind === "elite") state.trackedEliteIds.push(monster.isMonster.id);
    else state.trackedAddIds.push(monster.isMonster.id);
  }
}

function spawnPositionNear(center: Vec2, offsetRange: number): Vec2 {
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * offsetRange;
  return clampSpawnToNode({
    x: center.x + Math.cos(angle) * dist,
    y: center.y + Math.sin(angle) * dist,
  });
}

function resolveEncounterSpawnPoint(
  boss: MonsterEntity,
  encounter: UltimateEncounter,
  offsetRange: number,
): Vec2 {
  const featureId = encounter.spawnFromFeatureId;
  if (featureId) {
    const feature = RESOLVED_NODE_FEATURES[boss.hasPosition.nodeId]?.find(
      f => f.id === featureId,
    );
    if (feature) {
      return clampSpawnToNode(randomPointOnShapeEdge(feature.shape));
    }
  }
  return spawnPositionNear(boss.hasPosition.current, offsetRange);
}

function tickEnvironmentalDot(
  world: World,
  boss: MonsterEntity,
  dt: number,
): void {
  const dot = ultimateState(boss).activeDot;
  if (!dot) {
    cleanupExpiredEnvironmentalDots(world, boss.hasPosition.nodeId);
    return;
  }

  dot.refreshTimerMs -= dt;
  if (dot.refreshTimerMs <= 0) {
    dot.refreshTimerMs = dot.refreshMs;
    refreshEnvironmentalDot(world, boss);
  }

  for (const player of world.environmentallyDottedPlayers) {
    if (player.hasPosition.nodeId !== boss.hasPosition.nodeId) continue;
    tickPlayerEnvironmentalDot(world, boss, player, dt);
  }
}

function refreshEnvironmentalDot(world: World, boss: MonsterEntity): void {
  const dot = ultimateState(boss).activeDot;
  if (!dot) return;

  dot.refreshCount++;

  for (const player of world.livePlayersInNode(boss.hasPosition.nodeId)) {
    const existing = getStatusEffect(player.tracksCombat, dot.effectId);
    if (!existing) {
      applyStatusEffect(player.tracksCombat, {
        id: dot.effectId,
        maxStacks: dot.maxStacks,
        instanced: false,
        sourceId: boss.isMonster.id,
        remainingMs: dot.refreshMs * 3,
        refreshable: true,
        data: {
          damagePerStack: dot.damagePerStack,
          nextTickIn: dot.tickIntervalMs,
          tickIntervalMs: dot.tickIntervalMs,
          isEnvironmental: ENVIRONMENTAL_DOT_FLAG,
        },
      });
    } else {
      existing.remainingMs = dot.refreshMs * 3;
    }
    attachComponent(world, player, "hasEnvironmentalDot", {});
  }

  // After the first refresh cycle, add one stack every refreshMs up to stackCap.
  if (dot.refreshCount > 1 && dot.currentStacks < dot.stackCap) {
    dot.currentStacks++;
    for (const player of world.livePlayersInNode(boss.hasPosition.nodeId)) {
      const existing = getStatusEffect(player.tracksCombat, dot.effectId);
      if (!existing || existing.stacks >= dot.currentStacks) continue;
      applyStatusEffect(player.tracksCombat, {
        id: dot.effectId,
        maxStacks: dot.maxStacks,
        instanced: false,
        sourceId: boss.isMonster.id,
        remainingMs: dot.refreshMs * 3,
        refreshable: true,
        data: {
          damagePerStack: dot.damagePerStack,
          nextTickIn: existing.data.nextTickIn ?? dot.tickIntervalMs,
          tickIntervalMs: dot.tickIntervalMs,
          isEnvironmental: ENVIRONMENTAL_DOT_FLAG,
        },
      });
    }
  }
}

function tickPlayerEnvironmentalDot(
  world: World,
  boss: MonsterEntity,
  player: PlayerEntity,
  dt: number,
): void {
  if (isInvulnerablePlayer(player)) return;
  const dot = ultimateState(boss).activeDot;
  if (!dot) return;
  const effect = getStatusEffect(player.tracksCombat, dot.effectId);
  if (!effect) {
    detachComponent(world, player, "hasEnvironmentalDot");
    return;
  }

  effect.data.nextTickIn -= dt;
  if (effect.data.nextTickIn > 0) return;

  const base = computeScaledDotDamage(effect);
  const dotResist = Math.min(0.9, player.usesSkills.passives["defense.dot-resistance"] ?? 0);
  const damage = Math.max(
    1,
    Math.round(base * (1 - player.mitigatesDamage.damageReduction) * (1 - dotResist)),
  );

  recordPlayerDamaged(
    world,
    player,
    actorFromMonster(boss),
    damage,
    0,
    "dot",
    buildSimpleBreakdown(base, damage),
  );

  player.hasHealth.hp -= damage;
  if (player.hasHealth.hp <= 0) {
    detachComponent(world, player, "hasEnvironmentalDot");
    world.killPlayer(player.isPlayer.id, {
      kind: "dot",
      killer: buildKillerFromMonster(boss),
      damage,
      stacks: effect.stacks,
    });
  } else {
    effect.data.nextTickIn = effect.data.tickIntervalMs;
  }
}

function clearEnvironmentalDot(world: World, boss: MonsterEntity): void {
  const state = ultimateState(boss);
  const dot = state.activeDot;
  if (!dot) return;
  for (const player of world.playerEntitiesInNode(boss.hasPosition.nodeId)) {
    removeStatusEffect(player.tracksCombat, dot.effectId);
    detachComponent(world, player, "hasEnvironmentalDot");
  }
  state.activeDot = undefined;
}

function cleanupExpiredEnvironmentalDots(world: World, nodeId: string): void {
  for (const player of world.playerEntitiesInNode(nodeId)) {
    if (!player.hasEnvironmentalDot) continue;
    const hasEnvironmentalEffect = player.tracksCombat.statusEffects.some(
      effect => effect.data.isEnvironmental === ENVIRONMENTAL_DOT_FLAG,
    );
    if (!hasEnvironmentalEffect) detachComponent(world, player, "hasEnvironmentalDot");
  }
}

function nodeWiped(world: World, nodeId: string): boolean {
  let hasPlayerInNode = false;
  for (const player of world.playerEntitiesInNode(nodeId)) {
    hasPlayerInNode = true;
    if (!player.isDead) return false;
  }
  return hasPlayerInNode;
}

function syncBossEffects(boss: MonsterEntity, stage: EncounterStage): void {
  boss.hasStatus.bossEffects = [
    stage.id,
    ...(boss.isInvulnerable ? ["invulnerable"] : []),
    ...(boss.isRooted ? ["rooted"] : []),
    ...(ultimateState(boss).activeDot ? ["environmental-dot"] : []),
  ];
}

const VOID_THRONE_FEATURE_ID = "abyssal_throne";
const VOID_THRONE_DOT_ID = "void-throne";
const VOID_FLOOD_DOT_ID = "void-flood";

/** Stop throne block, environmental flood, and lingering DoTs when the boss dies. */
export function cleanupVoidOverlordHazards(
  world: World,
  boss: MonsterEntity,
): void {
  const nodeId = boss.hasPosition.nodeId;
  clearEnvironmentalDot(world, boss);
  world.suppressedFeatureBlocks.add(`${nodeId}:${VOID_THRONE_FEATURE_ID}`);

  for (const player of world.playerEntitiesInNode(nodeId)) {
    removeStatusEffect(player.tracksCombat, VOID_FLOOD_DOT_ID);
    removeStatusEffect(player.tracksCombat, VOID_THRONE_DOT_ID);
    detachComponent(world, player, "hasEnvironmentalDot");
    detachComponent(world, player, "hasNodeFeatureEffect");
  }
}

/** Notify contributors on the node and broadcast a global log line. */
export function notifyVoidOverlordDeath(
  world: World,
  boss: MonsterEntity,
  killerPlayerId: string,
): void {
  if (boss.isMonster.monsterTypeId !== "void-overlord") return;

  cleanupVoidOverlordHazards(world, boss);
  markUltimateContributor(world, boss, killerPlayerId);

  const nodeId = boss.hasPosition.nodeId;
  const contributorIds = new Set(
    boss.scriptsUltimate?.contributorIds ?? [],
  );

  for (const player of world.livePlayersInNode(nodeId)) {
    if (contributorIds.has(player.isPlayer.id)) {
      world.pendingOverlordFelled.push(player.isPlayer.id);
    }
  }

  recordWorldLogEvent(
    world,
    { kind: "overlord-slain", nodeId },
    { visibility: "global", relatedPlayerIds: [], nodeId },
  );
}
