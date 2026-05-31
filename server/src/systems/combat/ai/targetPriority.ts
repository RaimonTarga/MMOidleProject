import type { World } from "../../../world/World";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import { resolveObstaclesForNode } from "../../world/nodeFeatures";
import {
  areAllBiomeRecipesUnlocked,
  computeEternalDoomDamage,
  computeScaledDotDamage,
  distanceSq,
  estimateMonsterHitDamage,
  estimatePlayerHitDamage,
  GAME_CONFIG,
  getStatusEffect,
  getString,
  inAttackRange,
  isBiomeLevelCapped,
  isGlancingHit,
  isRangedCombatant,
  NODE_BIOMES,
  posHitboxFromEntity,
  QUEST_DATABASE,
  setString,
  type AutocombatPriorityMode,
  type UsesAutocombat,
} from "@mmo-idle/shared";

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

/** If this target kills us this much faster than we kill it, skip/flee. */
const SUICIDE_RATIO = 0.85;

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
  if (cfg.fleeWhenLow && shouldFlee(world, player, cfg)) {
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
  let best: { monster: MonsterEntity; score: number } | null = null;
  let current: { monster: MonsterEntity; score: number } | null = null;

  for (const monster of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    if (!passesGates(world, player, monster, ctx)) continue;
    const score = scoreCandidate(world, player, monster, ctx);
    if (!best || score > best.score) best = { monster, score };
    if (currentTargetId && monster.isMonster.id === currentTargetId) {
      current = { monster, score };
    }
  }

  if (!best) {
    setString(player.tracksCombat, AUTO_TARGET_ID, "");
    return { kind: "idle" };
  }

  const chosen =
    current && best.score <= current.score * (1 + SWITCH_MARGIN)
      ? current
      : best;
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

  const aggroed = isAggroedOnPlayer(monster, player);
  const dist = Math.sqrt(
    distanceSq(player.hasPosition.current, monster.hasPosition.current),
  );

  if (!aggroed) {
    if (dist > ctx.acquireRadius) return false;
    if (isPastLeashAnchor(monster)) return false;
  }

  // Rooted players can only select targets they can already attack.
  if (
    player.isRooted &&
    !inAttackRange(
      posHitboxFromEntity(player),
      posHitboxFromEntity(monster),
      player.performsAttack.attackRange,
    )
  ) {
    return false;
  }

  // Match the movement system's semantics exactly: resolveObstaclesForNode
  // returns the `to` reference unchanged when the straight-line path is clear.
  if (
    resolveObstaclesForNode(
      world,
      player.hasPosition.nodeId,
      player.hasPosition.current,
      monster.hasPosition.current,
      "player",
    ) !== monster.hasPosition.current
  ) {
    return false;
  }

  // Survival ("would this trade kill me?") is intentionally NOT an acquisition
  // gate: the first-order estimate here ignores regen/shields/absorbs/DoT/on-kill,
  // so using it to hard-block engagement permanently locks out under-geared or
  // defensively-built players. The flee decision (`shouldFlee` + `fleeWhenLow`)
  // owns disengagement using the same SUICIDE_RATIO once HP actually drops.
  return true;
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

function shouldFlee(world: World, player: PlayerEntity, cfg: UsesAutocombat): boolean {
  if (player.hasHealth.hp / Math.max(1, player.hasHealth.maxHp) > cfg.fleeHpPct) {
    return false;
  }

  let incomingDps = 0;
  let bestKillTtk = Infinity;
  for (const monster of world.aggroedMonsters) {
    if (!monster || monster.hasPosition.nodeId !== player.hasPosition.nodeId) continue;
    if (!isAggroedOnPlayer(monster, player)) continue;
    incomingDps += incomingDpsFromMonster(player, monster);
    bestKillTtk = Math.min(bestKillTtk, killTtkSeconds(player, monster));
  }

  if (incomingDps <= 0 || !Number.isFinite(bestKillTtk)) return false;
  const selfTtk = player.hasHealth.hp / incomingDps;
  return selfTtk * SUICIDE_RATIO < bestKillTtk;
}

function effectiveAcquireRadius(
  player: PlayerEntity,
  cfg: UsesAutocombat,
  ranged: boolean,
): number {
  const rootedMult = player.isRooted ? ROOTED_ACQUIRE_MULT : 1;
  const rangedMult = ranged ? RANGED_ACQUIRE_MULT : 1;
  return Math.max(80, cfg.acquireRadius * rootedMult * rangedMult);
}

function shouldSkipBosses(player: PlayerEntity): boolean {
  const nodeInfo = NODE_BIOMES[player.hasPosition.nodeId];
  return (
    player.usesAutocombat.autoTraverse &&
    nodeInfo !== undefined &&
    (!isBiomeLevelCapped(player.tracksProgression, nodeInfo.biomeGroup) ||
      !areAllBiomeRecipesUnlocked(player.tracksProgression, nodeInfo.biomeGroup))
  );
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

function killTtkSeconds(player: PlayerEntity, monster: MonsterEntity): number {
  const dps =
    estimatedPlayerDamage(player, monster) /
    Math.max(EPS, player.performsAttack.attackCooldown / 1000);
  return monster.hasHealth.hp / Math.max(EPS, dps);
}

function isAggroedOnPlayer(monster: MonsterEntity, player: PlayerEntity): boolean {
  return (
    monster.hasAggroTarget?.targetKind === "player" &&
    monster.hasAggroTarget.targetId === player.isPlayer.id
  );
}

function isPastLeashAnchor(monster: MonsterEntity): boolean {
  return (
    distanceSq(monster.hasPosition.current, monster.controlsMonster.spawn) >
    monster.controlsMonster.leashRange * monster.controlsMonster.leashRange
  );
}

function aoeClusterCount(world: World, monster: MonsterEntity): number {
  let count = 0;
  const radiusSq = GAME_CONFIG.EMPOWERED_AOE_RADIUS ** 2;
  for (const other of world.monsterEntitiesInNode(monster.hasPosition.nodeId)) {
    if (other.isMonster.id === monster.isMonster.id) continue;
    if (
      distanceSq(other.hasPosition.current, monster.hasPosition.current) <=
      radiusSq
    ) {
      count++;
    }
  }
  return count;
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
  if (!isBiomeLevelCapped(player.tracksProgression, nodeInfo.biomeGroup)) {
    return BIOME_VALUE_WEIGHT;
  }
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
  const leaderId = player.inParty?.leaderId;
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
