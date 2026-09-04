import type { World } from "../../../world/World";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import { suppressedFeatureIdsForNode } from "../../world/pathMotion";
import { navigationPadForEntity } from "../../world/movement";
import {
  areAllBiomeRecipesUnlocked,
  approachPoint,
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
  withinReach,
  type AutocombatPriorityMode,
  type UsesAutocombat,
  type Vec2,
} from "@mmo-idle/shared";
import {
  RUNE_FLEE_FLAG,
  RUNE_LET_DOTS_FINISH_FLAG,
  RUNE_SPREAD_DOTS_FLAG,
  RUNE_FOCUS_ELITES_FLAG,
} from "./runeConfig";
import { MONSTER_DATABASE } from "@mmo-idle/shared";
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
  letDotsFinish: boolean;
  spreadDots: boolean;
  focusElites: boolean;
  /**
   * Largest HP pool among this tick's candidates, used to normalize the
   * HP-preference scores. Filled in after the candidate sweep; 1 until then.
   */
  hpScale: number;
}

interface TargetCandidate {
  monster: MonsterEntity;
  score: number;
  distSq: number;
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

/**
 * Distance commitment hysteresis for strict-nearest targeting, as a squared
 * fraction. A rival must be at least ~20% closer in linear distance (0.8² =
 * 0.64 in squared distance) to steal the player's current approach target.
 * Prevents flip-flop between near-equidistant mobs and leash-edge jitter while
 * still honoring "nearest" once committed.
 */
const NEAREST_COMMIT_FRAC_SQ = 0.64;

/** A glancing 1-damage hit is technically legal, but almost never a good target. */
const GLANCE_PENALTY = 0.1;

/** Ranged classes can act at standoff distance, so distance matters less. */
const RANGED_DISTANCE_DAMPEN = 0.35;
const RANGED_ACQUIRE_MULT = 1.5;

/** Rooted players should not acquire anything they cannot already hit. */
const ROOTED_ACQUIRE_MULT = 0.35;

const DOT_OVERKILL_PENALTY = 2.0;
const DOT_SPREAD_MISSING_BONUS = 2.4;
const DOT_SPREAD_EXPIRING_BONUS = 1.4;
const DOT_SPREAD_STACK_BONUS = 1.2;
const DOT_SPREAD_REFRESH_MS = 1500;
const AOE_CLUSTER_WEIGHT = 0.12;
const QUEST_WEIGHT = 0.35;
const BIOME_VALUE_WEIGHT = 0.12;
const EMPOWERED_DUMP_WEIGHT = 0.18;
const LEADER_FOCUS_WEIGHT = 2.0;
/**
 * `focus-elites` rune bonus: large enough that an elite within the acquire radius
 * outranks ordinary mobs (so necromancers / apex predators are killed first), but
 * still finite so proximity breaks ties among multiple elites and the player never
 * sprints across the node ignoring everything.
 */
const ELITE_FOCUS_WEIGHT = 3.0;
const EPS = 0.001;

const WEIGHT_PRESETS: Record<AutocombatPriorityMode, ScoreWeights> = {
  nearest: { damage: 0, distance: 1.4, threat: 0.6 },
  "lowest-hp": { damage: 0, distance: 0.001, threat: 0 },
  "highest-max-hp": { damage: 0, distance: 0.001, threat: 0 },
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
    letDotsFinish: getFlag(player.tracksCombat, RUNE_LET_DOTS_FINISH_FLAG),
    spreadDots: getFlag(player.tracksCombat, RUNE_SPREAD_DOTS_FLAG),
    focusElites: getFlag(player.tracksCombat, RUNE_FOCUS_ELITES_FLAG),
    hpScale: 1,
  };

  const strictNearest = usesStrictNearest(ctx);
  const currentTargetId = getString(player.tracksCombat, AUTO_TARGET_ID);

  let eligible = [...world.monsterEntitiesInNode(player.hasPosition.nodeId)].filter(
    (monster) => passesGates(world, player, monster, ctx),
  );

  // ── Target PREFERENCE is not target ACQUISITION ─────────────────────────
  //
  // `Focus Highest HP` / `Focus Lowest HP` answer "which enemy do I hit in this
  // fight", not "which fight do I start". Scored across every monster in the
  // node they answered the second question instead: with `Find Enemies` raising
  // the acquire radius past the node's own width, "In Combat -> Focus Highest
  // HP" walked the player away from the enemy chewing on them and into an
  // unrelated 4,000 HP pull. From the Rune panel that is invisible -- the rule
  // did exactly what it says, against a candidate set the player never meant.
  //
  // So while anything is actually engaged, these two preferences choose from the
  // ENGAGED set. When nothing is engaged, there is no encounter to have a
  // preference within, and acquisition falls through to the ordinary path.
  //
  // `focus-elites` was ORIGINALLY excluded here and kept its cross-node reach, on
  // the argument that reaching the necromancer before it raises the dead is the
  // whole purpose of the rune. Designer decision 2026-09-04 reverses that: it is
  // a target PREFERENCE like the other two, and the same reasoning applies to it
  // unchanged -- a preference must not be able to start a fight the player never
  // chose. An elite across the node is not "the enemy I should be hitting in this
  // fight"; it is a different fight. With nothing engaged the rule still reaches
  // normally, so the necromancer is still picked first out of a fresh pull -- what
  // it can no longer do is pull the player OFF an active encounter.
  // See docs/briefs/t2-bossless-progression-campaign-2026-09-03.md section 12.
  const isHpPreference =
    ctx.cfg.priorityMode === "lowest-hp" || ctx.cfg.priorityMode === "highest-max-hp";
  const isEngagedScopedPreference = isHpPreference || ctx.focusElites;
  if (isEngagedScopedPreference) {
    const engagedSet = eligible.filter((monster) => isAggroedOnPlayer(monster, player));
    if (engagedSet.length > 0) eligible = engagedSet;
  }

  // Normalization base for the HP-preference scores, computed over the set that
  // will actually be scored so the ordering cannot depend on absolute HP values.
  ctx.hpScale = eligible.reduce(
    (max, monster) =>
      Math.max(
        max,
        ctx.cfg.priorityMode === "lowest-hp" ? monster.hasHealth.hp : monster.hasHealth.maxHp,
      ),
    1,
  );

  const candidates: TargetCandidate[] = eligible.map((monster) => ({
    monster,
    score: strictNearest ? 0 : scoreCandidate(world, player, monster, ctx),
    distSq: distanceSq(player.hasPosition.current, monster.hasPosition.current),
  }));

  if (candidates.length === 0) {
    setString(player.tracksCombat, AUTO_TARGET_ID, "");
    return { kind: "idle" };
  }

  let chosen: TargetCandidate | null;
  if (strictNearest) {
    // "Nearest" is a hard ordering, not one signal in the general-purpose
    // target score. Search radius only controls eligibility; it must not dilute
    // distance or let threat/quest/cluster bonuses select a farther monster.
    // Stable id ordering makes exact-distance ties deterministic without keeping
    // a previous target that is now farther away.
    candidates.sort(
      (a, b) =>
        a.distSq - b.distSq ||
        a.monster.isMonster.id.localeCompare(b.monster.isMonster.id),
    );
    const nearest = candidates[0];
    const current = currentTargetId
      ? candidates.find((c) => c.monster.isMonster.id === currentTargetId) ?? null
      : null;

    let preferred: TargetCandidate;
    if (!current) {
      preferred = nearest;
    } else {
      // Retaliation override: snap to the closest monster that is attacking us,
      // but only if it is closer than the committed target (per design — a far
      // ranged poke should not yank the player across the node).
      const closerAttacker = candidates.find(
        (c) => c.distSq < current.distSq && isAggroedOnPlayer(c.monster, player),
      );
      if (closerAttacker) {
        preferred = closerAttacker;
      } else if (nearest.distSq < current.distSq * NEAREST_COMMIT_FRAC_SQ) {
        // Commitment hysteresis: only abandon the current approach target for
        // one that is meaningfully closer, so two near-equidistant mobs (or a
        // mob jittering around its leash edge) do not cause target flip-flop.
        preferred = nearest;
      } else {
        preferred = current;
      }
    }
    chosen = pickPathReachableTarget(world, player, preferred, candidates);
  } else {
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    const current = currentTargetId
      ? candidates.find((c) => c.monster.isMonster.id === currentTargetId) ?? null
      : null;

    const preferred =
      current && best.score <= current.score * (1 + SWITCH_MARGIN)
        ? current
        : best;

    chosen = pickPathReachableTarget(world, player, preferred, candidates);
  }
  if (!chosen) {
    setString(player.tracksCombat, AUTO_TARGET_ID, "");
    return { kind: "idle" };
  }

  setString(player.tracksCombat, AUTO_TARGET_ID, chosen.monster.isMonster.id);
  return { kind: "attack", target: chosen.monster };
}

/**
 * Dedicated targeting strategies deliberately modify the generic score. Plain
 * nearest/focus-closest does not: geometric distance is its primary contract.
 */
function usesStrictNearest(ctx: CandidateContext): boolean {
  return (
    ctx.cfg.priorityMode === "nearest" &&
    !ctx.letDotsFinish &&
    !ctx.spreadDots &&
    !ctx.focusElites &&
    !ctx.cfg.focusLeaderTarget
  );
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
    // A monster sprinting home after a leash break (RETURN_SPEED_MULT) outruns
    // the player and can never be caught. Committing to one causes the
    // chase -> it flees -> pick another -> repeat oscillation. Skip it; if it
    // were aggroed on us it would turn and fight (handled by the branch above).
    if (monster.hasAwareness?.state === "returning") return false;
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
  if (world.collision.canReach(player, monster, player.performsAttack.attackRange)) {
    return true;
  }
  const pad = navigationPadForEntity(player);
  const goal = attackPathGoal(player, monster);
  const path = findPathForMover(
    player.hasPosition.nodeId,
    "player",
    pad,
    player.hasPosition.current,
    goal,
    suppressedFeatureIdsForNode(world, player.hasPosition.nodeId),
  );
  return pathEndsInAttackRange(player, monster, path);
}

/**
 * True only when following `path` lands the player within attack range of the
 * monster. A non-empty path is not enough: the nav layer truncates an unreachable
 * goal to the nearest walkable cell, so a mob tucked inside a tree trunk or ledge
 * pocket still yields a path — one that stops at the obstacle's edge, out of reach.
 * Accepting that path is the softlock where a melee player walks up to a tree and
 * sits there forever; verifying the endpoint actually reaches lets the selector
 * skip the unreachable mob and retarget. (Ranged attacks are not LOS-blocked, so
 * their longer reach passes this test and they still fire over the obstacle.)
 */
function pathEndsInAttackRange(
  player: PlayerEntity,
  monster: MonsterEntity,
  path: Vec2[] | null,
): boolean {
  if (!path || path.length === 0) return false;
  const endpoint = path[path.length - 1];
  return withinReach(
    { pos: endpoint, rects: posHitboxFromEntity(player).rects },
    posHitboxFromEntity(monster),
    player.performsAttack.attackRange,
  );
}

function attackPathGoal(player: PlayerEntity, monster: MonsterEntity): Vec2 {
  const approach = approachPoint(
    player.hasPosition.current,
    posHitboxFromEntity(player),
    monster.hasPosition.current,
    posHitboxFromEntity(monster),
    player.performsAttack.attackRange,
  );
  return approach.dest;
}

/** Prefer `preferred`, else the next candidate in the caller's priority order. */
function pickPathReachableTarget(
  world: World,
  player: PlayerEntity,
  preferred: TargetCandidate,
  candidates: TargetCandidate[],
): TargetCandidate | null {
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
  const distancePenalty =
    (dist / Math.max(1, ctx.acquireRadius)) *
    (ctx.ranged ? RANGED_DISTANCE_DAMPEN : 1);

  // The two HP-preference modes score on a NORMALIZED 0..1 term rather than on
  // raw hit points, so the distance weight is a real tie-break instead of a
  // rounding error, and so the rule behaves the same way at every HP scale.
  //
  // The previous forms were both scale-dependent, in opposite directions:
  //   `maxHp - w*penalty`   -- maxHp is in the hundreds-to-thousands and the
  //                            penalty is at most `w` (0.001), so distance was
  //                            never able to change the ordering.
  //   `1/hp - w*penalty`    -- the SPACING of 1/hp collapses as HP grows. At
  //                            1,700 vs 4,000 HP the candidates differ by 3e-4
  //                            while the distance term contributes 1e-3, so
  //                            "Focus Lowest HP" silently inverted into "focus
  //                            nearest" exactly where it mattered most.
  // `ctx.hpScale` is the largest relevant pool among this tick's candidates,
  // which makes both terms dimensionless and monotonic.
  if (ctx.cfg.priorityMode === "lowest-hp") {
    const normalized = 1 - monster.hasHealth.hp / Math.max(1, ctx.hpScale);
    return normalized - ctx.weights.distance * distancePenalty;
  }

  if (ctx.cfg.priorityMode === "highest-max-hp") {
    const normalized = monster.hasHealth.maxHp / Math.max(1, ctx.hpScale);
    return normalized - ctx.weights.distance * distancePenalty;
  }

  const damage = estimatedPlayerDamage(player, monster);
  const dps = damage / Math.max(EPS, player.performsAttack.attackCooldown / 1000);
  const ttk = monster.hasHealth.hp / Math.max(EPS, dps);
  let damageTerm = 1 / (1 + ttk);
  if (isGlancingPlayerHit(player, monster)) damageTerm *= GLANCE_PENALTY;

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

  if (ctx.focusElites && MONSTER_DATABASE.get(monster.isMonster.monsterTypeId)?.elite) {
    score += ELITE_FOCUS_WEIGHT;
  }

  if (player.hasEmpoweredAttack) {
    score +=
      EMPOWERED_DUMP_WEIGHT *
      (monster.hasHealth.hp / Math.max(1, monster.hasHealth.maxHp));
  }

  if (
    ctx.letDotsFinish &&
    player.appliesDots &&
    projectedDotDamage(monster) >= monster.hasHealth.hp
  ) {
    score -= DOT_OVERKILL_PENALTY;
  }

  if (ctx.spreadDots && player.appliesDots) {
    score += dotSpreadValue(player, monster);
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
  const pad = navigationPadForEntity(player);
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
    // A monster racing back to its spawn cannot be caught — heading toward it
    // just produces the same chase/abandon oscillation. Skip it while idle.
    if (monster.hasAwareness?.state === "returning") continue;
    if (isPastLeashAnchor(monster)) continue;

    candidates.push({
      monster,
      distSq: distanceSq(from, monster.hasPosition.current),
    });
  }

  candidates.sort((a, b) => a.distSq - b.distSq);

  for (const { monster } of candidates) {
    if (world.collision.canReach(player, monster, player.performsAttack.attackRange)) {
      return monster;
    }
    const path = findPathForMover(
      nodeId,
      "player",
      pad,
      from,
      attackPathGoal(player, monster),
      suppressed,
    );
    if (pathEndsInAttackRange(player, monster, path)) return monster;
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
      ? computeEternalDoomDamage(
          effect.stacks,
          effect.data.damagePerStack ?? 0,
          effect.data.edFullStacks,
          effect.data.edDiminishRate,
        )
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

function dotSpreadValue(player: PlayerEntity, monster: MonsterEntity): number {
  const effect = getStatusEffect(monster.tracksCombat, "dot");
  if (!effect || effect.sourceId !== player.isPlayer.id) {
    return DOT_SPREAD_MISSING_BONUS;
  }

  let score = 0;
  if (effect.remainingMs >= 0 && effect.remainingMs <= DOT_SPREAD_REFRESH_MS) {
    score += DOT_SPREAD_EXPIRING_BONUS;
  }

  const maxStacks = Math.max(1, effect.maxStacks);
  const missingStacks = Math.max(0, maxStacks - effect.stacks);
  score += DOT_SPREAD_STACK_BONUS * (missingStacks / maxStacks);
  return score;
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
