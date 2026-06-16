import type { World } from "../../../world/World";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import { suppressedFeatureIdsForNode } from "../../world/pathMotion";
import {
  aabbHalfExtents,
  areAllBiomeRecipesUnlocked,
  computeEternalDoomDamage,
  computeScaledDotDamage,
  distanceSq,
  estimateMonsterHitDamage,
  estimatePlayerHitDamage,
  findPathForMover,
  GAME_CONFIG,
  getFlag,
  getStatusEffect,
  getString,
  isGlancingHit,
  isRangedCombatant,
  isWithinRange,
  NODE_BIOMES,
  posHitboxFromEntity,
  QUEST_DATABASE,
  setString,
  type AutocombatPriorityMode,
  type UsesAutocombat,
} from "@mmo-idle/shared";
import { RUNE_FLEE_FLAG } from "./runeConfig";
import { effectivePartyLeaderId } from "../../player/party/partySystem";

export type AutoCombatAction =
  | { kind: "attack"; target: MonsterEntity }
  | { kind: "flee" }
  | { kind: "idle" };

interface ScoreWeights {
  damage: number;
  distance: number;
  threat: number;
}

interface CandidateContext {
  cfg: UsesAutocombat;
  weights: ScoreWeights;
  ranged: boolean;
  skipBosses: boolean;
  now: number;
  acquireRadius: number;
}

const AUTO_TARGET_ID = "autoCombat.targetId";

/**
 * The monster id the auto-combat selector is currently committed to (during
 * both approach and attack), or null. Kept reliable by clearing it whenever the
 * selector decides to flee or idle. Read by the auto-intent telegraph system.
 */
export function getAutoTargetId(player: PlayerEntity): string | null {
  const id = getString(player.tracksCombat, AUTO_TARGET_ID);
  return id ? id : null;
}

/**
 * The selector keeps the current target unless a replacement is meaningfully
 * better. This is the guardrail that prevents score noise from causing
 * target-flip churn and prevents "slightly better" far targets from pulling the
 * player across the node.
 */
const SWITCH_MARGIN = 0.25;

/** A glancing 1-damage hit is technically legal, but almost never a good target. */
const GLANCE_PENALTY = 0.1;

/** Ranged classes can act at standoff distance, so distance matters less. */
const RANGED_DISTANCE_DAMPEN = 0.35;
const RANGED_ACQUIRE_MULT = 1.5;

/** Rooted players should not acquire anything they cannot already hit. */
const ROOTED_ACQUIRE_MULT = 0.35;

const DOT_OVERKILL_PENALTY = 2.0;
const AOE_CLUSTER_WEIGHT = 0.12;
const QUEST_WEIGHT = 0.35;
const BIOME_VALUE_WEIGHT = 0.12;
const EMPOWERED_DUMP_WEIGHT = 0.18;
const LEADER_FOCUS_WEIGHT = 2.0;
const EPS = 0.001;

const WEIGHT_PRESETS: Record<AutocombatPriorityMode, ScoreWeights> = {
  nearest: { damage: 0, distance: 1.4, threat: 0.6 },
  damage: { damage: 1.8, distance: 0.55, threat: 0.6 },
  threat: { damage: 0.8, distance: 0.55, threat: 1.7 },
  balanced: { damage: 1.15, distance: 0.8, threat: 1.0 },
};

export function selectAutoCombatAction(
  world: World,
  player: PlayerEntity,
  cfg: UsesAutocombat,
  now: number,
): AutoCombatAction {
  if (getFlag(player.tracksCombat, RUNE_FLEE_FLAG)) {
    setString(player.tracksCombat, AUTO_TARGET_ID, "");
    return { kind: "flee" };
  }

  const ranged = isRangedAutoPlayer(player);
  const ctx: CandidateContext = {
    cfg,
    weights: WEIGHT_PRESETS[cfg.priorityMode],
    ranged,
    skipBosses: shouldSkipBosses(player),
    now,
    acquireRadius: effectiveAcquireRadius(player, cfg, ranged),
  };

  const currentTargetId = getString(player.tracksCombat, AUTO_TARGET_ID);
  const candidates: Array<{ monster: MonsterEntity; score: number }> = [];

  for (const monster of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    if (!passesGates(world, player, monster, ctx)) continue;
    candidates.push({
      monster,
      score: scoreCandidate(world, player, monster, ctx),
    });
  }

  if (candidates.length === 0) {
    setString(player.tracksCombat, AUTO_TARGET_ID, "");
    return { kind: "idle" };
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const current = currentTargetId
    ? candidates.find((c) => c.monster.isMonster.id === currentTargetId) ?? null
    : null;

  const preferred =
    current && best.score <= current.score * (1 + SWITCH_MARGIN)
      ? current
      : best;

  const chosen = pickPathReachableTarget(world, player, preferred, candidates);
  if (!chosen) {
    setString(player.tracksCombat, AUTO_TARGET_ID, "");
    return { kind: "idle" };
  }

  setString(player.tracksCombat, AUTO_TARGET_ID, chosen.monster.isMonster.id);
  return { kind: "attack", target: chosen.monster };
}

function passesGates(
  world: World,
  player: PlayerEntity,
  monster: MonsterEntity,
  ctx: CandidateContext,
): boolean {
  if (ctx.skipBosses && monster.isMonster.isBoss) return false;

  // Mid-encounter invulnerability and dormant encounter shields are hard skips:
  // a cancelled swing is not "low damage"; it is no target at all.
  if (monster.isInvulnerable) return false;

  // Do not wake ultimate encounters unless the player/bench explicitly asks to.
  if (
    monster.scriptsUltimate &&
    !monster.scriptsUltimate.engaged &&
    !ctx.cfg.engageUltimateBosses
  ) {
    return false;
  }

  // Acquisition radius: an un-aggroed mob is only engaged if it sits within the
  // (rune-derived) acquire radius and inside its leash anchor. Monsters already
  // aggroed on the player are always engaged (retaliation). When nothing
  // qualifies, `selectAutoCombatAction` returns idle and the player holds.
  if (!isAggroedOnPlayer(monster, player)) {
    if (isPastLeashAnchor(monster)) return false;
    if (
      !world.collision.isWithinCenterRadius(
        player.hasPosition.current,
        monster.hasPosition.current,
        ctx.acquireRadius,
      )
    ) {
      return false;
    }
  }

  // Rooted players can only select targets they can already attack.
  if (
    player.isRooted &&
    !world.collision.canReach(player, monster, player.performsAttack.attackRange)
  ) {
    return false;
  }

  // Path reachability is owned by nav movement (`setEntityMotion` / pathfind).
  // A straight-line LOS gate here blocked every nearby target once trees shipped,
  // leaving auto-combat permanently idle while the player pathed toward blocked mobs.
  return true;
}

function monsterHasPath(
  world: World,
  player: PlayerEntity,
  monster: MonsterEntity,
): boolean {
  const pad = aabbHalfExtents(posHitboxFromEntity(player).rects);
  const path = findPathForMover(
    player.hasPosition.nodeId,
    "player",
    pad,
    player.hasPosition.current,
    monster.hasPosition.current,
    suppressedFeatureIdsForNode(world, player.hasPosition.nodeId),
  );
  return !!path && path.length > 0;
}

/** Prefer `preferred`, else the highest-scored candidate with a valid nav path. */
function pickPathReachableTarget(
  world: World,
  player: PlayerEntity,
  preferred: { monster: MonsterEntity; score: number },
  candidates: Array<{ monster: MonsterEntity; score: number }>,
): { monster: MonsterEntity; score: number } | null {
  if (monsterHasPath(world, player, preferred.monster)) return preferred;
  for (const entry of candidates) {
    if (entry.monster.isMonster.id === preferred.monster.isMonster.id) continue;
    if (monsterHasPath(world, player, entry.monster)) return entry;
  }
  return null;
}

function scoreCandidate(
  world: World,
  player: PlayerEntity,
  monster: MonsterEntity,
  ctx: CandidateContext,
): number {
  const dist = Math.sqrt(
    distanceSq(player.hasPosition.current, monster.hasPosition.current),
  );
  const damage = estimatedPlayerDamage(player, monster);
  const dps = damage / Math.max(EPS, player.performsAttack.attackCooldown / 1000);
  const ttk = monster.hasHealth.hp / Math.max(EPS, dps);
  let damageTerm = 1 / (1 + ttk);
  if (isGlancingPlayerHit(player, monster)) damageTerm *= GLANCE_PENALTY;

  const distancePenalty =
    (dist / Math.max(1, ctx.acquireRadius)) *
    (ctx.ranged ? RANGED_DISTANCE_DAMPEN : 1);

  const threatTerm = isAggroedOnPlayer(monster, player)
    ? 1 + incomingDpsFromMonster(player, monster) / Math.max(1, player.hasHealth.maxHp)
    : 0;

  let score =
    ctx.weights.damage * damageTerm -
    ctx.weights.distance * distancePenalty +
    ctx.weights.threat * threatTerm;

  score += AOE_CLUSTER_WEIGHT * aoeClusterCount(world, monster);
  score += questValue(player, monster);
  score += biomeValue(player);

  if (player.hasEmpoweredAttack) {
    score +=
      EMPOWERED_DUMP_WEIGHT *
      (monster.hasHealth.hp / Math.max(1, monster.hasHealth.maxHp));
  }

  if (player.appliesDots && projectedDotDamage(monster) >= monster.hasHealth.hp) {
    score -= DOT_OVERKILL_PENALTY;
  }

  const leaderTargetId = partyLeaderTargetId(world, player);
  if (
    ctx.cfg.focusLeaderTarget &&
    leaderTargetId &&
    leaderTargetId === monster.isMonster.id
  ) {
    score += LEADER_FOCUS_WEIGHT;
  }

  return score;
}

function effectiveAcquireRadius(
  player: PlayerEntity,
  cfg: UsesAutocombat,
  ranged: boolean,
): number {
  const rootedMult = player.isRooted ? ROOTED_ACQUIRE_MULT : 1;
  const rangedMult = ranged ? RANGED_ACQUIRE_MULT : 1;
  let radius = Math.max(80, cfg.acquireRadius * rootedMult * rangedMult);
  if (player.usesReload) {
    radius *= player.usesSkills.passives['reload.acquire-radius-mult'] ?? 1;
  }
  return radius;
}

function shouldSkipBosses(player: PlayerEntity): boolean {
  const nodeInfo = NODE_BIOMES[player.hasPosition.nodeId];
  return (
    player.usesAutocombat.autoTraverse &&
    nodeInfo !== undefined &&
    !areAllBiomeRecipesUnlocked(player.tracksProgression, nodeInfo.biomeGroup)
  );
}

/**
 * The nearest monster in the player's node the auto-combat selector *would*
 * engage if the player walked up to it — same boss / leash / invulnerability /
 * dormant-ultimate gates as {@link selectAutoCombatAction}, but with the acquire
 * radius removed so distant mobs still count.
 *
 * Used when auto-combat is idle: instead of roaming at random, the player
 * heads straight for the closest mob it can clear. Returns null only when the
 * node has nothing engageable left.
 */
export function nearestEngageableMonster(
  world: World,
  player: PlayerEntity,
): MonsterEntity | null {
  const skipBosses = shouldSkipBosses(player);
  const nodeId = player.hasPosition.nodeId;
  const pad = aabbHalfExtents(posHitboxFromEntity(player).rects);
  const suppressed = suppressedFeatureIdsForNode(world, nodeId);
  const from = player.hasPosition.current;

  const candidates: Array<{ monster: MonsterEntity; distSq: number }> = [];
  for (const monster of world.monsterEntitiesInNode(nodeId)) {
    if (skipBosses && monster.isMonster.isBoss) continue;
    if (monster.isInvulnerable) continue;
    if (
      monster.scriptsUltimate &&
      !monster.scriptsUltimate.engaged &&
      !player.usesAutocombat.engageUltimateBosses
    ) {
      continue;
    }
    if (isPastLeashAnchor(monster)) continue;

    candidates.push({
      monster,
      distSq: distanceSq(from, monster.hasPosition.current),
    });
  }

  candidates.sort((a, b) => a.distSq - b.distSq);

  for (const { monster } of candidates) {
    const path = findPathForMover(
      nodeId,
      "player",
      pad,
      from,
      monster.hasPosition.current,
      suppressed,
    );
    if (path && path.length > 0) return monster;
  }

  return null;
}

function estimatedPlayerDamage(player: PlayerEntity, monster: MonsterEntity): number {
  const shred = platingShred(monster);
  return estimatePlayerHitDamage({
    attack: player.dealsDamage.attack,
    onHitDamage: player.dealsDamage.onHitDamage,
    targetPlating: monster.mitigatesDamage.plating,
    targetDamageReduction: monster.mitigatesDamage.damageReduction,
    platingMult: player.usesReload ? 0.5 : 1,
    platingShredStacks: shred.stacks,
    platingShredPerStack: shred.perStack,
  });
}

function isGlancingPlayerHit(player: PlayerEntity, monster: MonsterEntity): boolean {
  const shred = platingShred(monster);
  return isGlancingHit({
    attack: player.dealsDamage.attack,
    targetPlating: monster.mitigatesDamage.plating,
    targetDamageReduction: monster.mitigatesDamage.damageReduction,
    platingMult: player.usesReload ? 0.5 : 1,
    platingShredStacks: shred.stacks,
    platingShredPerStack: shred.perStack,
  });
}

function platingShred(monster: MonsterEntity): { stacks: number; perStack: number } {
  const effect = getStatusEffect(monster.tracksCombat, "plating-shred");
  return {
    stacks: effect?.stacks ?? 0,
    perStack: effect?.data.platingReduction ?? 0,
  };
}

function incomingDpsFromMonster(player: PlayerEntity, monster: MonsterEntity): number {
  const damage = estimateMonsterHitDamage({
    attack: monster.dealsDamage.attack,
    targetPlating: player.mitigatesDamage.plating,
    targetDamageReduction: player.mitigatesDamage.damageReduction,
  });
  return damage / Math.max(EPS, monster.performsAttack.attackCooldown / 1000);
}

function isAggroedOnPlayer(monster: MonsterEntity, player: PlayerEntity): boolean {
  return (
    monster.hasAggroTarget?.targetKind === "player" &&
    monster.hasAggroTarget.targetId === player.isPlayer.id
  );
}

function isPastLeashAnchor(monster: MonsterEntity): boolean {
  return !isWithinRange(
    monster.hasPosition.current,
    monster.controlsMonster.spawn,
    monster.controlsMonster.leashRange,
  );
}

function aoeClusterCount(world: World, monster: MonsterEntity): number {
  const radius = GAME_CONFIG.EMPOWERED_AOE_RADIUS;
  const nearby = world.collision.bodiesInCircle(
    world.monsterEntitiesInNode(monster.hasPosition.nodeId),
    monster.hasPosition.current,
    radius,
  );
  return nearby.filter(other => other.isMonster.id !== monster.isMonster.id).length;
}

function questValue(player: PlayerEntity, monster: MonsterEntity): number {
  for (const quest of QUEST_DATABASE.values()) {
    if (quest.tierRequired !== player.tracksProgression.playerTier) continue;
    if ((player.tracksProgression.questProgress[quest.id] ?? 0) >= quest.killsRequired) {
      continue;
    }
    if (quest.targetMonsterTypes.includes(monster.isMonster.monsterTypeId)) {
      return QUEST_WEIGHT;
    }
  }
  return 0;
}

function biomeValue(player: PlayerEntity): number {
  const nodeInfo = NODE_BIOMES[player.hasPosition.nodeId];
  if (!nodeInfo) return 0;
  // Keep farming valuable only while the biome still has unlocks to earn;
  // once everything is unlocked we stop weighting kills here (auto-traverse
  // takes over to clear nodes / boss and move on).
  if (!areAllBiomeRecipesUnlocked(player.tracksProgression, nodeInfo.biomeGroup)) {
    return BIOME_VALUE_WEIGHT;
  }
  return 0;
}

function projectedDotDamage(monster: MonsterEntity): number {
  const effect = getStatusEffect(monster.tracksCombat, "dot");
  if (!effect || effect.data.t3Perm === 1) return 0;

  const tickDamage =
    effect.data.isEternalDoom === 1
      ? computeEternalDoomDamage(effect.stacks, effect.data.damagePerStack ?? 0)
      : computeScaledDotDamage(effect);

  if (effect.remainingMs < 0) return tickDamage;

  const interval = Math.max(1, effect.data.tickIntervalMs ?? 1000);
  let nextTickIn = Math.max(0, effect.data.nextTickIn ?? interval);
  let remaining = effect.remainingMs;
  let projected = 0;

  while (remaining > 0) {
    if (nextTickIn > remaining) break;
    projected += tickDamage;
    remaining -= nextTickIn;
    nextTickIn = interval;
  }

  return projected;
}

function partyLeaderTargetId(world: World, player: PlayerEntity): string | null {
  const leaderId = effectivePartyLeaderId(world, player);
  if (!leaderId || leaderId === player.isPlayer.id) return null;
  return world.getPlayerEntity(leaderId)?.hasAttackTarget?.targetId ?? null;
}

function isRangedAutoPlayer(player: PlayerEntity): boolean {
  return isRangedCombatant({
    attackRange: player.performsAttack.attackRange,
    combatArchetype: player.usesSkills.combatArchetype,
    selectedRange: player.usesSkills.selectedRange,
    flashActive: (player.usesSkills.passives["energy.flash"] ?? 0) > 0,
  });
}
