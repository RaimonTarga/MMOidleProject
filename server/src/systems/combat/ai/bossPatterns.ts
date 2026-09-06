/**
 * ORDERED ENCOUNTER PATTERNS — the runtime for `MonsterDefinition.bossPattern`.
 *
 * One pattern owns a boss at a time. While it runs it holds the monster's movement
 * and suppresses ordinary attacks, so nothing lands underneath it — the failure the
 * redesign is undoing, where a scripted slam, a charged attack and an independent
 * cadence beat all fired over the top of each other.
 *
 * The tick order inside `updateBossPatterns` matters:
 *   1. recovery first, so a boss finishing its punish window is released before
 *      anything considers starting a new sequence on the same tick;
 *   2. then the active pattern advances;
 *   3. only a boss with neither may arm a fresh pattern.
 *
 * TEARDOWN IS ONE PATH. `endPattern` releases the lane, this pattern's barriers,
 * the movement lock and the attack suppression together, and every exit — success,
 * interrupt, target loss, leash, death, node teardown — goes through it. Splitting
 * that up is how a boss ends up permanently rooted or invisibly shielded.
 */

import {
  BOSS_RECOVERY_EFFECT,
  extendSegment,
  geometryContains,
  geometryCoveringCircles,
  initRunsBossPattern,
  MONSTER_DATABASE,
  moverOverlapsBlockShapes,
  type BossPattern,
  type BossPatternStep,
  type PatternAnchor,
  type Vec2,
} from '@mmo-idle/shared';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { attachComponent, detachComponent } from '../../../ecs/markerHelpers';
import { NODE_REGISTRY } from '../../../world/nodeRegistry';
import {
  clearGroundZonesByOwner,
  publishChargeCorridor,
  publishFaultLineBurst,
  publishGroundZone,
  reaimChargeCorridor,
  type RuntimeChargeCorridor,
} from '../../world/groundZones';
import { navigationPadForEntity, setEntityMotion, stopEntity } from '../../world/movement';
import { setAggroTarget, setAttackTarget } from './targeting';
import { distanceSq } from '@mmo-idle/shared';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';
import { setRooted } from '../../world/rooted';
import {
  applyStatusEffect,
  getCounter,
  getStatusEffect,
  removeStatusEffect,
  setCounter,
} from '@mmo-idle/shared';
import { canApplyPlayerDebuff } from '../status/debuffGuard';
import { syncPlayerControlLockout } from '../status/playerControlLockout';
import {
  clearSourceBarrier,
  raiseSourceBarrier,
  sourceBarrierRemaining,
} from '../engine/sourceBarriers';
import { isMonsterFrozen } from '../../classes/archetypes/dot/t3/core/selectors';
import { isMonsterStunned } from '../status/stun';

const PATTERN_SESSION_KEY = 'bossPatternSession';
const PATTERN_USED_KEY = 'bossPatternUsed';
const PATTERN_CD_NEXT_KEY = 'bossPatternCdNextAt';
/** Slack past a pattern's own lifetime before a stranded barrier self-expires. */
const BARRIER_SAFETY_MS = 30_000;
const LANE_NODE_MARGIN = 24;
/** Floor on a leash-clamped lane, as a fraction of its authored length. */
const LANE_MIN_LEASH_FRACTION = 0.35;
/**
 * How close to the lane tip counts as arrived. Slightly over one tick of travel
 * at the fastest authored charge, so the body never halts a visible step short of
 * the marker it promised to cross.
 */
const ARRIVAL_EPSILON_PX = 60;

/**
 * The boss's pattern, with any `empower-charged` escalation applied.
 *
 * Patterns share `chargedOverride` with `chargedAttack` deliberately. The rework's
 * preferred shape for a phase is "the thing this encounter is already about gets
 * harder", and a Mountain boss whose slam became a pattern must still escalate on
 * the same channel — otherwise converting a boss would silently turn its authored
 * 50% phase into a no-op, which is exactly the kind of quiet regression a structural
 * change like this invites.
 *
 * Mapping: `multiplierMult` scales the pattern's damage, `cooldownMult` its
 * cooldown, `castMsMult` its wind-ups, `radiusMult` its impact circles, and the
 * aftershock scalars its fault lines.
 */
export function bossPatternFor(monster: MonsterEntity): BossPattern | undefined {
  const pattern = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId)?.bossPattern;
  const scale = monster.scriptsBoss?.chargedOverride;
  if (!pattern || !scale) return pattern;
  return {
    ...pattern,
    damageMultiplier: pattern.damageMultiplier * scale.multiplierMult,
    cooldownMs: Math.max(1_000, Math.round(pattern.cooldownMs * scale.cooldownMult)),
    steps: pattern.steps.map((step): BossPatternStep => {
      switch (step.kind) {
        case 'cast':
          return { ...step, castMs: Math.max(200, Math.round(step.castMs * scale.castMsMult)) };
        case 'impact':
          return { ...step, radius: Math.round(step.radius * scale.radiusMult) };
        case 'fault-lines':
          return {
            ...step,
            rayCount: step.rayCount + scale.aftershockRayCountAdd,
            damageMult: step.damageMult * scale.aftershockDamageMult,
          };
        default:
          return step;
      }
    }),
  };
}

/** True while an ordered pattern or its recovery owns this monster. */
export function patternOwnsMonster(monster: MonsterEntity): boolean {
  return monster.runsBossPattern !== undefined || monster.recoversFromPattern !== undefined;
}

/** True while the boss must not move or swing of its own accord. */
export function patternSuppressesOrdinaryActions(monster: MonsterEntity): boolean {
  return patternOwnsMonster(monster);
}

// ── Session cooldown ─────────────────────────────────────────────────────────

/**
 * Whether the pattern is armed. Keyed to the aggro session like every other
 * per-combat cooldown, so re-engaging a boss restarts its opening delay rather
 * than letting a pattern fire the instant it re-aggros.
 */
function patternReady(monster: MonsterEntity, pattern: BossPattern, now: number): boolean {
  const aggro = monster.hasAggroTarget;
  if (!aggro) return false;
  const cs = monster.tracksCombat;
  if (getCounter(cs, PATTERN_SESSION_KEY) !== aggro.sinceMs) {
    setCounter(cs, PATTERN_SESSION_KEY, aggro.sinceMs);
    setCounter(
      cs,
      PATTERN_CD_NEXT_KEY,
      aggro.sinceMs + (pattern.initialCooldownMs ?? pattern.cooldownMs),
    );
  }
  return now >= getCounter(cs, PATTERN_CD_NEXT_KEY);
}

function armPatternCooldown(monster: MonsterEntity, pattern: BossPattern, now: number): void {
  setCounter(monster.tracksCombat, PATTERN_CD_NEXT_KEY, now + pattern.cooldownMs);
}

// ── Escape Instinct ──────────────────────────────────────────────────────────

const ESCAPE_INSTINCT_KEY = 'bossEscapeInstinct';

/**
 * Capped Escape Instinct. Stored on the monster's combat state rather than the
 * pattern cursor, because the cursor is destroyed every time a pattern ends and the
 * whole mechanic is that a FAILED retreat makes the NEXT one faster.
 */
export function escapeInstinct(monster: MonsterEntity): number {
  return Math.max(0, getCounter(monster.tracksCombat, ESCAPE_INSTINCT_KEY));
}

function gainEscapeInstinct(monster: MonsterEntity, cap: number): void {
  setCounter(
    monster.tracksCombat,
    ESCAPE_INSTINCT_KEY,
    Math.min(cap, escapeInstinct(monster) + 1),
  );
}

/** A SUCCESSFUL escape resets Instinct — it is a record of failure, not progress. */
function resetEscapeInstinct(monster: MonsterEntity): void {
  setCounter(monster.tracksCombat, ESCAPE_INSTINCT_KEY, 0);
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

/**
 * Release everything the pattern owns, in one place.
 *
 * `reason` is recorded on the cast-end event so a client that was showing a cast
 * bar closes it with the right story (fired vs interrupted), and so telemetry can
 * tell an answered sequence from an abandoned one.
 */
export function endPattern(
  world: World,
  monster: MonsterEntity,
  reason: 'completed' | 'interrupted' | 'target-lost' | 'staggered' | 'reset',
  now: number,
): void {
  const state = monster.runsBossPattern;
  if (!state) return;

  for (const sourceId of state.barrierSourceIds) clearSourceBarrier(monster, sourceId);
  // Retire the lane and any telegraph this pattern published. Owner-keyed, so it
  // cannot strand a circle for the sweeper to find after the boss has moved on.
  clearGroundZonesByOwner(world, monster.hasPosition.nodeId, monster.isMonster.id);

  // A charge interrupted mid-travel must not leave the boss walking at charge speed
  // for the rest of the fight.
  restoreChargeSpeed(world, monster, state);
  // Concealment ALWAYS clears on teardown, no ownership question: nothing else in
  // the game conceals a monster, and a boss left burrowed after a reset is
  // permanently unkillable — the worst failure this system can produce.
  detachComponent(world, monster, 'isConcealed');
  // Release only what this pattern took — see `RunsBossPattern.ownsRoot`.
  if (state.ownsRoot) setRooted(world, monster, false);
  if (state.ownsCannotAttack) detachComponent(world, monster, 'cannotAttack');
  stopEntity(world, monster);
  detachComponent(world, monster, 'runsBossPattern');

  if (reason !== 'completed') {
    world.pushEvent(monster.hasPosition.nodeId, {
      kind: 'monster-cast-end',
      monsterId: monster.isMonster.id,
      fired: false,
    });
  }
}

/** Put the boss into a visible, punishable recovery window. */
function beginRecovery(
  world: World,
  monster: MonsterEntity,
  label: string,
  durationMs: number,
  fromStagger: boolean,
  now: number,
): void {
  const ownsRoot = !monster.isRooted;
  const ownsCannotAttack = !monster.cannotAttack;
  if (ownsRoot) setRooted(world, monster, true);
  if (ownsCannotAttack) attachComponent(world, monster, 'cannotAttack', {});
  stopEntity(world, monster);
  attachComponent(world, monster, 'recoversFromPattern', {
    label,
    endsAtMs: now + durationMs,
    totalMs: durationMs,
    fromStagger,
    ownsRoot,
    ownsCannotAttack,
  });
  // Published NOW, not on the next tick: the recovery is the punish window, and a
  // window the client learns about a tick late is a window the player starts late.
  publishRecoveryStatus(world, monster, monster.recoversFromPattern!, now);
  world.pushEvent(monster.hasPosition.nodeId, {
    kind: 'boss-fx',
    monsterId: monster.isMonster.id,
    pos: { ...monster.hasPosition.current },
    fx: 'stagger',
  });
}

function endRecovery(world: World, monster: MonsterEntity): void {
  const recovery = monster.recoversFromPattern;
  if (!recovery) return;
  detachComponent(world, monster, 'recoversFromPattern');
  if (recovery.ownsRoot) setRooted(world, monster, false);
  if (recovery.ownsCannotAttack) detachComponent(world, monster, 'cannotAttack');
  const effects = monster.hasStatus.bossEffects ?? [];
  if (effects.includes(BOSS_RECOVERY_EFFECT)) {
    monster.hasStatus.bossEffects = effects.filter(id => id !== BOSS_RECOVERY_EFFECT);
    delete monster.hasStatus.bossEffectStacks?.[BOSS_RECOVERY_EFFECT];
    delete monster.hasStatus.bossEffectDurations?.[BOSS_RECOVERY_EFFECT];
    markSliceDirty(world, monster, 'hasStatus');
  }
}

function publishRecoveryStatus(
  world: World,
  monster: MonsterEntity,
  recovery: NonNullable<MonsterEntity['recoversFromPattern']>,
  now: number,
): void {
  const effects = monster.hasStatus.bossEffects ?? [];
  monster.hasStatus.bossEffects = effects.includes(BOSS_RECOVERY_EFFECT)
    ? effects
    : [...effects, BOSS_RECOVERY_EFFECT];
  (monster.hasStatus.bossEffectStacks ??= {})[BOSS_RECOVERY_EFFECT] = 1;
  (monster.hasStatus.bossEffectDurations ??= {})[BOSS_RECOVERY_EFFECT] = {
    remainingMs: Math.max(0, recovery.endsAtMs - now),
    totalMs: recovery.totalMs,
  };
  markSliceDirty(world, monster, 'hasStatus');
}

/**
 * Tear a pattern down from OUTSIDE the pattern system — death, despawn, leash, node
 * teardown. Safe on a monster that has neither component.
 */
export function clearBossPatternState(world: World, monster: MonsterEntity): void {
  endPattern(world, monster, 'reset', Date.now());
  endRecovery(world, monster);
  // Belt and braces: `endPattern` no-ops when no pattern is attached, but a boss
  // can only be concealed BY a pattern, so a stray marker here would be a leak.
  detachComponent(world, monster, 'isConcealed');
}

// ── Step helpers ─────────────────────────────────────────────────────────────

function anchorPoint(
  monster: MonsterEntity,
  state: NonNullable<MonsterEntity['runsBossPattern']>,
  anchor: PatternAnchor,
): Vec2 {
  if (anchor === 'captured-endpoint' && state.capturedEndpoint) {
    return { ...state.capturedEndpoint };
  }
  return { ...monster.hasPosition.current };
}

function clampToNode(nodeId: string, point: Vec2): Vec2 {
  const node = NODE_REGISTRY.get(nodeId);
  if (!node) return point;
  return {
    x: Math.max(LANE_NODE_MARGIN, Math.min(node.width - LANE_NODE_MARGIN, point.x)),
    y: Math.max(LANE_NODE_MARGIN, Math.min(node.height - LANE_NODE_MARGIN, point.y)),
  };
}

/**
 * Shorten a lane so it never carries the boss past its own leash.
 *
 * THE TELEGRAPH IS A PROMISE. A lane painted 620px long that the boss abandons at
 * 380 because it hit its tether is worse than a short lane honestly drawn: the
 * player reads the far end as dangerous, moves to somewhere that was never going to
 * be touched, and learns that the marker cannot be trusted. So the leash is resolved
 * HERE, when the lane is drawn, rather than discovered mid-charge.
 *
 * Ray/circle: walk from `start` toward `end` and stop at the leash boundary centred
 * on the monster's spawn. A floor keeps the beat from collapsing into a no-op when
 * the boss is already near its tether — it lunges a little rather than nothing, and
 * the ordinary AI walks it home afterwards.
 */
function clampLaneToLeash(monster: MonsterEntity, start: Vec2, end: Vec2): Vec2 {
  const ai = monster.controlsMonster;
  const leash = ai.leashRange;
  if (!leash || leash <= 0) return end;

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length <= 1e-6) return end;
  const ux = dx / length;
  const uy = dy / length;

  const fx = start.x - ai.spawn.x;
  const fy = start.y - ai.spawn.y;
  const b = fx * ux + fy * uy;
  const c = fx * fx + fy * fy - leash * leash;

  // Already outside its own leash: it is being walked home anyway, so do not extend
  // the lane further out. The floor below still leaves a readable beat.
  let travel = length;
  const disc = b * b - c;
  if (disc >= 0) {
    const boundary = -b + Math.sqrt(disc);
    if (boundary < travel) travel = Math.max(0, boundary);
  } else {
    travel = 0;
  }

  // Never collapse to nothing: a zero-length lane has no direction to read.
  travel = Math.max(travel, length * LANE_MIN_LEASH_FRACTION);
  if (travel >= length) return end;
  return { x: start.x + ux * travel, y: start.y + uy * travel };
}

function laneZone(world: World, monster: MonsterEntity): RuntimeChargeCorridor | undefined {
  return (world.groundZones.get(monster.hasPosition.nodeId) ?? []).find(
    (zone): zone is RuntimeChargeCorridor =>
      zone.kind === 'charge-corridor' && zone.ownerId === monster.isMonster.id,
  );
}

function patternTarget(world: World, monster: MonsterEntity): PlayerEntity | null {
  const id = monster.runsBossPattern?.targetId;
  if (!id) return null;
  const player = world.getPlayerEntity(id);
  if (!player || player.hasPosition.nodeId !== monster.hasPosition.nodeId) return null;
  return player;
}

function standable(world: World, monster: MonsterEntity, at: Vec2): boolean {
  return !moverOverlapsBlockShapes(
    at,
    world.collision.blockShapes(monster.hasPosition.nodeId, 'monster'),
    navigationPadForEntity(monster),
  );
}

// ── Damage resolution ────────────────────────────────────────────────────────

/**
 * Callbacks into the combat engine. Injected rather than imported so this module
 * does not create a cycle with `combat.ts`, which already imports pattern state to
 * decide whether ordinary attacks may run.
 */
export interface PatternCombatHooks {
  hitPlayer: (
    world: World,
    monster: MonsterEntity,
    player: PlayerEntity,
    now: number,
    multiplier: number,
  ) => void;
  hitMinion: (
    world: World,
    monster: MonsterEntity,
    minion: MinionEntity,
    now: number,
  ) => void;
  /** Drag a player toward `anchor` through the shared forced-movement helper. */
  pullPlayer: (
    world: World,
    player: PlayerEntity,
    anchor: Vec2,
    distance: number,
  ) => void;
  /** Resolve a telegraphed circle at `at`, through the full player pipeline. */
  resolveCircle: (
    world: World,
    monster: MonsterEntity,
    at: Vec2,
    radius: number,
    multiplier: number,
    stunMs: number | undefined,
    now: number,
  ) => void;
}

let hooks: PatternCombatHooks | null = null;

/** Wired once from `initCombatSystems`, like every other combat listener. */
export function setPatternCombatHooks(next: PatternCombatHooks): void {
  hooks = next;
}

// ── Main update ──────────────────────────────────────────────────────────────

export function updateBossPatterns(world: World, dt: number, now = Date.now()): void {
  for (const monster of [...world.recoveringMonsters]) {
    const recovery = monster.recoversFromPattern!;
    if (now >= recovery.endsAtMs) {
      endRecovery(world, monster);
      continue;
    }
    // Mirror the window onto the networked boss-effect slice so the client can
    // show WHY the boss is standing there. Written AFTER `updateBossScripts`,
    // which rebuilds these fields wholesale each tick and would otherwise erase it.
    publishRecoveryStatus(world, monster, recovery, now);
  }

  for (const monster of [...world.patternMonsters]) {
    advancePattern(world, monster, dt, now);
  }

  for (const monster of [...world.aggroedMonsters]) {
    if (patternOwnsMonster(monster)) continue;
    const pattern = bossPatternFor(monster);
    if (!pattern || pattern.steps.length === 0) continue;
    if (monster.hasAggroTarget.targetKind !== 'player') continue;
    if (isMonsterStunned(world, monster.isMonster.id) || isMonsterFrozen(world, monster.isMonster.id)) {
      continue;
    }
    // HEALTH GATE. Outside the authored band the pattern never arms — the boss is
    // not "failing to escape", it has stopped trying, and its ordinary behaviour
    // takes over. Checked before the cooldown so a gated-out pattern does not burn
    // its timer in the background and fire the instant the band reopens.
    // ONCE PER LIFE. Checked before everything else so a spent catastrophe costs
    // nothing to skip, and so re-pulling the boss cannot hand the player a fresh
    // copy of a beat they already answered.
    if (pattern.oncePerLife && getCounter(monster.tracksCombat, PATTERN_USED_KEY) === 1) {
      continue;
    }
    const hpPct = monster.hasHealth.hp / Math.max(1, monster.hasHealth.maxHp);
    if (pattern.armAboveHpPct !== undefined && hpPct <= pattern.armAboveHpPct) continue;
    if (pattern.armBelowHpPct !== undefined && hpPct > pattern.armBelowHpPct) continue;
    if (!patternReady(monster, pattern, now)) continue;
    const target = world.getPlayerEntity(monster.hasAggroTarget.targetId);
    if (!target || target.hasPosition.nodeId !== monster.hasPosition.nodeId) continue;

    // The pattern holds movement and swings for its whole run — but only claims
    // the locks that were not already held by something else.
    const ownsRoot = !monster.isRooted;
    const ownsCannotAttack = !monster.cannotAttack;
    attachComponent(
      world,
      monster,
      'runsBossPattern',
      initRunsBossPattern(pattern.id, now, target.isPlayer.id, ownsRoot, ownsCannotAttack),
    );
    if (ownsRoot) setRooted(world, monster, true);
    if (ownsCannotAttack) attachComponent(world, monster, 'cannotAttack', {});
    stopEntity(world, monster);
    armPatternCooldown(monster, pattern, now);
    if (pattern.oncePerLife) setCounter(monster.tracksCombat, PATTERN_USED_KEY, 1);
  }

  publishConcealment(world);
}

/**
 * Mirror concealment onto the networked status slice, for the renderer.
 *
 * Derived from COMPONENT PRESENCE rather than written wherever `isConcealed` is
 * attached and detached. Concealment is torn down from several paths (step end,
 * interrupt, leash reset, target loss, death, node teardown) and a broadcast bit
 * that had to be cleared alongside each of them would eventually miss one —
 * leaving a boss that is fightable but still drawn as buried. Reconciling from
 * presence cannot drift.
 *
 * Runs at the TAIL of this pass, not in the monster-control reconciler that owns
 * `hardControlled`: that pass runs earlier in the tick than patterns do, so the
 * bit would always describe the previous tick. A client that learns about the
 * burrow late plays its dirt cloud over a body that has already gone.
 */
function publishConcealment(world: World): void {
  for (const monster of world.monsterEntities) {
    const marker = monster.isConcealed?.marker;
    if (monster.hasStatus.concealed === marker) continue;
    monster.hasStatus.concealed = marker;
    markSliceDirty(world, monster, 'hasStatus');
  }
}

function advancePattern(world: World, monster: MonsterEntity, dt: number, now: number): void {
  const state = monster.runsBossPattern!;
  const pattern = bossPatternFor(monster);
  if (!pattern || pattern.id !== state.patternId) {
    endPattern(world, monster, 'reset', now);
    return;
  }

  // GLOBAL TEARDOWN GUARDS, checked before any step runs.
  //
  // The ordinary AI loop skips a patterning monster entirely — it has to, or chase
  // and leash logic would fight the pattern for the same body every tick — which
  // means the AI's own leash check never sees these bosses. A pattern that RELOCATES
  // (burrow, retreat) can therefore walk itself outside its leash and, with nothing
  // watching, never reset. So the pattern owns both checks for its own duration.
  //
  // EXCEPT during committed travel. A charge is on rails by definition, and tearing
  // it down mid-lane is exactly the failure this guard was meant to prevent
  // elsewhere: the boss stops dead partway along a lane it already promised to
  // cross. The lane is leash-clamped when painted, so a committed charge cannot
  // meaningfully breach the tether anyway; the ordinary AI walks it home once the
  // sequence releases.
  const activeStep = pattern.steps[state.stepIndex];
  const committed = state.stepStarted && activeStep?.kind === 'charge';
  if (
    !committed &&
    distanceSq(monster.hasPosition.current, monster.controlsMonster.spawn) >
      monster.controlsMonster.leashRange * monster.controlsMonster.leashRange
  ) {
    endPattern(world, monster, 'reset', now);
    setAggroTarget(world, monster, null, now);
    return;
  }
  // BARRIER BREAK, watched across every step rather than inside the one that raised
  // it. The absorb pool removes its own status effect when it empties, and the
  // pattern knows it raised one, so an empty reading here can only mean broken —
  // `drop-barrier` clears the watch when the plate comes down on the boss's terms.
  //
  // Polling rather than a pipeline hook keeps the damage path's return contract
  // untouched; at 10 Hz the stagger still lands within a tick of the killing blow.
  const watched = state.watchedBarrier;
  if (watched && sourceBarrierRemaining(monster, watched.sourceId) <= 0) {
    state.staggered = true;
    state.watchedBarrier = undefined;
    state.barrierSourceIds = state.barrierSourceIds.filter(id => id !== watched.sourceId);
    endPattern(world, monster, 'staggered', now);
    beginRecovery(world, monster, watched.label, watched.staggerMs, true, now);
    return;
  }

  // Target loss is checked on EVERY step, not just the ones that read the target:
  // a boss part-way through a burrow whose player disconnected must come back up and
  // release, rather than finishing a sequence aimed at nobody.
  if (state.targetId && !patternTarget(world, monster)) {
    endPattern(world, monster, 'target-lost', now);
    return;
  }

  // Guard against an unbounded loop if several zero-length steps chain.
  for (let guard = 0; guard < pattern.steps.length + 2; guard++) {
    if (state.stepIndex >= pattern.steps.length) {
      endPattern(world, monster, 'completed', now);
      return;
    }
    const step = pattern.steps[state.stepIndex];

    if (!state.stepStarted) {
      if (!beginStep(world, monster, state, pattern, step, now)) return; // pattern ended
      state.stepStarted = true;
      if (!monster.runsBossPattern) return;
    }

    const outcome = tickStep(world, monster, state, pattern, step, dt, now);
    if (outcome === 'ended') return;
    if (outcome === 'running') return;

    finishStep(world, monster, state, step);
    if (!monster.runsBossPattern) return;
    state.stepIndex++;
    state.stepStarted = false;
  }
}

type StepOutcome = 'running' | 'done' | 'ended';

/** One-time work at the head of a step. Returns false when the pattern ended. */
function beginStep(
  world: World,
  monster: MonsterEntity,
  state: NonNullable<MonsterEntity['runsBossPattern']>,
  pattern: BossPattern,
  step: BossPatternStep,
  now: number,
): boolean {
  switch (step.kind) {
    case 'cast': {
      state.stepEndsAtMs = now + step.castMs;
      world.pushEvent(monster.hasPosition.nodeId, {
        kind: 'monster-cast-start',
        monsterId: monster.isMonster.id,
        castMs: step.castMs,
        label: step.name,
        fx: step.fx,
      });
      if (step.lane) {
        const target = patternTarget(world, monster);
        if (!target) {
          endPattern(world, monster, 'target-lost', now);
          return false;
        }
        paintLane(world, monster, state, step.lane, target, now, now + step.castMs);
      }
      return true;
    }
    case 'charge': {
      // The lane is the commitment. Without one there is nothing to travel, which
      // means the wind-up was torn down; ending is correct, guessing a direction
      // is not.
      const lane = laneZone(world, monster);
      if (!lane) {
        endPattern(world, monster, 'reset', now);
        return false;
      }
      state.capturedEndpoint = { ...lane.end };
      state.chargeHalfWidth = lane.halfWidth;
      state.chargeHitIds = [];
      state.stepEndsAtMs = now + step.maxTravelMs;
      // KEEP THE LANE ON THE GROUND FOR THE RUN. Its countdown was the wind-up, and
      // the sweeper retires a telegraph shortly after that elapses — so without this
      // the marker vanishes a quarter-second into the charge, while the body is still
      // crossing it. The player must see the lane for as long as it is being run.
      lane.resolvesAtMs = now + step.maxTravelMs;
      // THE CHARGE MOVES THROUGH THE MOVEMENT SYSTEM, like everything else that
      // moves. Writing coordinates directly worked on the server and looked broken
      // in play: with no `isMoving` motion the client had nothing to interpolate
      // TOWARD, so it saw a body teleport ~94px per 5 Hz packet and lurched after it
      // in stop-start bursts, permanently behind. A real motion vector gives the
      // client a destination far ahead of the body, which is exactly what its
      // interpolator is built to render smoothly.
      //
      // The root is RELEASED for the travel — `setEntityMotion` refuses to move a
      // rooted entity. Nothing competes for the movement channel meanwhile: the AI
      // loop skips a patterning monster outright.
      state.savedSpeed = monster.hasPosition.speed;
      monster.hasPosition.speed = step.speed;
      markSliceDirty(world, monster, 'hasPosition');
      if (state.ownsRoot) setRooted(world, monster, false);
      // `direct` and hazard-blind on purpose: a committed charge travels the exact
      // segment the player was shown, and must not route around anything.
      setEntityMotion(world, monster, lane.end, { mode: 'direct', avoidHazards: false });
      return true;
    }
    case 'impact': {
      // NO CONNECTION, NO PAYOFF. Skipped BEFORE the telegraph is published, so a
      // dodged charge draws no circle at all — a marker the player is told to fear
      // and then watch land on empty ground is worse than no marker.
      if (step.requiresChargeHit && !state.chargeConnected) {
        state.skippedStepIndexes.push(state.stepIndex);
        state.stepEndsAtMs = now;
        return true;
      }
      const at = anchorPoint(monster, state, step.anchor);
      state.stepEndsAtMs = now + step.telegraphMs;
      publishGroundZone(world, monster.hasPosition.nodeId, {
        kind: 'slam-telegraph',
        pos: at,
        radius: step.radius,
        startedAtMs: now,
        resolvesAtMs: now + step.telegraphMs,
        ownerId: monster.isMonster.id,
        ...(step.fx ? { fx: step.fx } : {}),
      });
      world.pushEvent(monster.hasPosition.nodeId, {
        kind: 'monster-cast-start',
        monsterId: monster.isMonster.id,
        castMs: step.telegraphMs,
        label: step.name,
        fx: step.fx,
      });
      return true;
    }
    case 'fault-lines': {
      if (step.requiresChargeHit && !state.chargeConnected) {
        state.skippedStepIndexes.push(state.stepIndex);
        state.stepEndsAtMs = now;
        return true;
      }
      const at = anchorPoint(monster, state, step.anchor);
      publishFaultLines(world, monster, step, at, pattern, now);
      // The cracks resolve on the shared delayed-impact path, so the pattern does
      // not wait for them — they are the finite tail of the payoff, and holding the
      // boss still until they land would double the recovery the design authored.
      state.stepEndsAtMs = now;
      return true;
    }
    case 'barrier': {
      const raised = raiseSourceBarrier(
        monster,
        step.sourceId,
        monster.hasHealth.maxHp * step.shieldPct,
        BARRIER_SAFETY_MS,
      );
      if (raised > 0 && !state.barrierSourceIds.includes(step.sourceId)) {
        state.barrierSourceIds.push(step.sourceId);
      }
      // Watch for the break from here on, and MOVE ON. The barrier is not a step the
      // sequence waits inside — the boss raises it and then prepares its charge from
      // behind it, and breaking the plate is meant to interrupt that preparation.
      if (raised > 0 && step.onBreak) {
        state.watchedBarrier = {
          sourceId: step.sourceId,
          staggerMs: step.onBreak.staggerMs,
          label: step.onBreak.label,
        };
      }
      state.stepEndsAtMs = now;
      return true;
    }
    case 'drop-barrier': {
      clearSourceBarrier(monster, step.sourceId);
      state.barrierSourceIds = state.barrierSourceIds.filter(id => id !== step.sourceId);
      // The plate came down on the pattern's own terms, so a later empty reading is
      // not a break and must not stagger anything.
      //
      // DEFENSIVE: in every shipped pattern `drop-barrier` is followed immediately by
      // `recovery`, which detaches the cursor in the same pass, so the watch is never
      // consulted again and this line cannot currently be observed. It exists for the
      // pattern that puts a step between the two — without it, that pattern would
      // stagger itself the tick after dropping its own plate.
      if (state.watchedBarrier?.sourceId === step.sourceId) state.watchedBarrier = undefined;
      state.stepEndsAtMs = now;
      return true;
    }
    case 'apply-status': {
      const target = patternTarget(world, monster);
      if (!target) {
        endPattern(world, monster, 'target-lost', now);
        return false;
      }
      // THE GATE IS CHECKED AT CAST START, not at resolution. The player is being
      // asked "do not be this chilled when the freeze comes"; testing at the end
      // would instead ask them to react inside the cast, which the cast bar does
      // not give them time for and Cleanse cannot reliably answer.
      if (step.requires) {
        const carried = getStatusEffect(target.tracksCombat, step.requires.effectId);
        if ((carried?.stacks ?? 0) < step.requires.minStacks) {
          state.skippedStepIndexes.push(state.stepIndex);
          state.stepEndsAtMs = now;
          return true;
        }
      }
      state.stepEndsAtMs = now + step.castMs;
      world.pushEvent(monster.hasPosition.nodeId, {
        kind: 'monster-cast-start',
        monsterId: monster.isMonster.id,
        castMs: step.castMs,
        label: step.name,
        fx: step.fx,
      });
      return true;
    }
    case 'payoff': {
      state.stepEndsAtMs = now + step.castMs;
      if (step.radius !== undefined) {
        // An area payoff plants where the target stands NOW and is answerable by
        // moving; a single-target one follows and is answered by Guard or armour.
        const target = patternTarget(world, monster);
        const at = target ? { ...target.hasPosition.current } : { ...monster.hasPosition.current };
        state.capturedEndpoint = at;
        publishGroundZone(world, monster.hasPosition.nodeId, {
          kind: 'slam-telegraph',
          pos: at,
          radius: step.radius,
          startedAtMs: now,
          resolvesAtMs: now + step.castMs,
          ownerId: monster.isMonster.id,
          ...(step.fx ? { fx: step.fx } : {}),
        });
      }
      world.pushEvent(monster.hasPosition.nodeId, {
        kind: 'monster-cast-start',
        monsterId: monster.isMonster.id,
        castMs: step.castMs,
        label: step.name,
        fx: step.fx,
      });
      return true;
    }
    case 'conceal': {
      state.stepEndsAtMs = now + step.durationMs;
      attachComponent(world, monster, 'isConcealed', {
        marker: step.marker,
        endsAtMs: now + step.durationMs,
      });
      // Drop every lock on it the instant it goes: a player left holding an attack
      // target they cannot reach keeps swinging at empty ground.
      for (const player of world.livePlayersInNode(monster.hasPosition.nodeId)) {
        if (player.hasAttackTarget?.targetId === monster.isMonster.id) {
          setAttackTarget(world, player, null);
        }
      }
      world.pushEvent(monster.hasPosition.nodeId, {
        kind: 'monster-cast-start',
        monsterId: monster.isMonster.id,
        castMs: step.durationMs,
        label: step.name,
        fx: step.fx,
      });
      if (step.relocate !== 'none') {
        const concealTarget = patternTarget(world, monster);
        // Plan the detour ONCE, from where the boss actually went under. Fixed
        // points are what make the movement smooth — see `planFeintWaypoints`.
        state.feintWaypoints = undefined;
        state.feintLegEndsAtMs = undefined;
        if (step.feint && concealTarget && step.travelSpeed !== undefined) {
          state.feintWaypoints = planFeintWaypoints(world, monster, step, concealTarget);
          state.feintLegEndsAtMs = now + feintLegMs(step);
        }
        const destination =
          state.feintWaypoints?.[0] ??
          relocationPoint(
            world,
            monster,
            step.relocate,
            concealTarget,
            step.emergeGap ?? 140,
          );
        // A null destination means "stay put" — emerging inside terrain would be
        // far worse than emerging where it went down.
        if (destination) {
          state.capturedEndpoint = { ...destination };
          if (step.travelSpeed !== undefined) {
            // TRAVELLING. The root is released for the same reason the charge
            // releases it — `setEntityMotion` refuses to move a rooted body — and
            // `hasPosition.speed` is written because that is what the CLIENT
            // interpolates with. Leaving it at the walking speed is what made the
            // charge appear to stop halfway.
            if (state.ownsRoot) setRooted(world, monster, false);
            state.savedSpeed = monster.hasPosition.speed;
            monster.hasPosition.speed = step.travelSpeed;
            markSliceDirty(world, monster, 'hasPosition');
            setEntityMotion(world, monster, destination);
          } else {
            monster.hasPosition.current = destination;
            markSliceDirty(world, monster, 'hasPosition');
          }
        }
      }
      return true;
    }
    case 'escape-guard': {
      // Instinct earned from PREVIOUS failed attempts shortens this wind-up, up to
      // the authored cap. Applied here, at the head of the step, so the shortened
      // cast is what the player actually sees on the bar.
      const reduction = Math.min(
        0.9,
        escapeInstinct(monster) * Math.max(0, step.instinctCastReductionPct),
      );
      const castMs = Math.max(200, Math.round(step.castMs * (1 - reduction)));
      state.stepEndsAtMs = now + castMs;
      const raised = raiseSourceBarrier(
        monster,
        step.sourceId,
        monster.hasHealth.maxHp * step.shieldPct,
        BARRIER_SAFETY_MS,
      );
      if (raised > 0 && !state.barrierSourceIds.includes(step.sourceId)) {
        state.barrierSourceIds.push(step.sourceId);
      }
      // BOLT. The escape is something the player watches the boss DO, behind a plate
      // they can break — not a stationary cast that ends in a relocation. Same
      // mechanism the charge uses: release the root, raise the speed, and hand the
      // destination to the movement system so the client has something to
      // interpolate toward. `stopFleeing` puts all three back on either exit.
      if (step.flee) {
        const away = relocationPoint(
          world,
          monster,
          'leash-edge',
          patternTarget(world, monster),
          0,
        );
        if (away) {
          state.capturedEndpoint = { ...away };
          if (state.ownsRoot) setRooted(world, monster, false);
          state.savedSpeed = monster.hasPosition.speed;
          monster.hasPosition.speed = step.flee.speed;
          markSliceDirty(world, monster, 'hasPosition');
          setEntityMotion(world, monster, away);
        }
      }
      world.pushEvent(monster.hasPosition.nodeId, {
        kind: 'monster-cast-start',
        monsterId: monster.isMonster.id,
        castMs,
        label: step.name,
        fx: step.fx,
      });
      return true;
    }
    case 'pull': {
      state.stepEndsAtMs = now + step.castMs;
      world.pushEvent(monster.hasPosition.nodeId, {
        kind: 'monster-cast-start',
        monsterId: monster.isMonster.id,
        castMs: step.castMs,
        label: step.name,
        fx: step.fx,
      });
      return true;
    }
    case 'wait': {
      state.stepEndsAtMs = now + step.durationMs;
      return true;
    }
    case 'recovery': {
      // Recovery leaves the pattern: the sequence is over and what remains is the
      // punish window, which outlives the cursor. Anything still owned is released
      // by `endPattern` first, then the window is opened.
      endPattern(world, monster, 'completed', now);
      beginRecovery(world, monster, step.label, step.durationMs, false, now);
      return false;
    }
  }
}

function tickStep(
  world: World,
  monster: MonsterEntity,
  state: NonNullable<MonsterEntity['runsBossPattern']>,
  pattern: BossPattern,
  step: BossPatternStep,
  dt: number,
  now: number,
): StepOutcome {
  switch (step.kind) {
    case 'cast': {
      if (
        (step.interruptible ?? true) &&
        (isMonsterStunned(world, monster.isMonster.id) ||
          isMonsterFrozen(world, monster.isMonster.id))
      ) {
        endPattern(world, monster, 'interrupted', now);
        return 'ended';
      }
      // A lane keeps tracking until its lock; everything else is already committed.
      if (step.lane) {
        const target = patternTarget(world, monster);
        if (target) {
          paintLane(world, monster, state, step.lane, target, now, state.stepEndsAtMs);
        }
      }
      return now >= state.stepEndsAtMs ? 'done' : 'running';
    }
    case 'charge':
      return tickCommittedTravel(world, monster, state, pattern, step, dt, now);
    case 'impact': {
      if (now < state.stepEndsAtMs) return 'running';
      // A gated-out impact published no telegraph and must resolve no damage.
      if (state.skippedStepIndexes.includes(state.stepIndex)) return 'done';
      const at = anchorPoint(monster, state, step.anchor);
      hooks?.resolveCircle(
        world,
        monster,
        at,
        step.radius,
        pattern.damageMultiplier * step.damageMult,
        step.stunMs,
        now,
      );
      if (!world.hasMonster(monster.isMonster.id)) return 'ended';
      return 'done';
    }
    // Raising a barrier takes no time of its own; the watch registered above is what
    // does the work, and it runs across every step that follows.
    case 'barrier':
      return 'done';
    case 'apply-status': {
      if (
        (step.interruptible ?? true) &&
        (isMonsterStunned(world, monster.isMonster.id) ||
          isMonsterFrozen(world, monster.isMonster.id))
      ) {
        endPattern(world, monster, 'interrupted', now);
        return 'ended';
      }
      if (now < state.stepEndsAtMs) return 'running';
      // A skipped gate wrote `stepEndsAtMs = now` and pushed no cast, so it falls
      // straight through here without applying anything. That is the intent.
      if (state.skippedStepIndexes.includes(state.stepIndex)) return 'done';
      const target = patternTarget(world, monster);
      if (target && canApplyPlayerDebuff(target)) {
        applyStatusEffect(target.tracksCombat, {
          id: step.effectId,
          maxStacks: Math.max(1, step.stacks),
          remainingMs: step.durationMs,
          refreshable: true,
          sourceId: monster.isMonster.id,
          data: { totalMs: step.durationMs, ...(step.data ?? {}) },
        });
        syncPlayerControlLockout(world, target);
      }
      world.pushEvent(monster.hasPosition.nodeId, {
        kind: 'monster-cast-end',
        monsterId: monster.isMonster.id,
        fired: true,
        targetId: target?.isPlayer.id,
        fx: step.fx,
      });
      return 'done';
    }
    case 'payoff': {
      if (
        (step.interruptible ?? true) &&
        (isMonsterStunned(world, monster.isMonster.id) ||
          isMonsterFrozen(world, monster.isMonster.id))
      ) {
        endPattern(world, monster, 'interrupted', now);
        return 'ended';
      }
      if (now < state.stepEndsAtMs) return 'running';
      resolvePayoff(world, monster, state, pattern, step, now);
      if (!world.hasMonster(monster.isMonster.id)) return 'ended';
      return 'done';
    }
    case 'conceal': {
      // Same rule as every other wind-up: a hard-controlled boss does not get to
      // keep travelling while untargetable and then cash in its payoff. `endPattern`
      // detaches the concealment, stops the body and puts its speed back.
      if (
        (step.interruptible ?? true) &&
        (isMonsterStunned(world, monster.isMonster.id) ||
          isMonsterFrozen(world, monster.isMonster.id))
      ) {
        endPattern(world, monster, 'interrupted', now);
        return 'ended';
      }
      if (now < state.stepEndsAtMs) {
        if (step.travelSpeed !== undefined && step.relocate === 'near-target') {
          steerConcealedTravel(world, monster, state, step, now);
        }
        return 'running';
      }
      if (step.travelSpeed !== undefined) {
        stopEntity(world, monster);
        restoreChargeSpeed(world, monster, state);
        // Take the root back for whatever the sequence does next — the eruption
        // resolves at `anchor: 'self'`, so a boss still drifting when it surfaces
        // would resolve its own circle somewhere it never showed.
        if (state.ownsRoot) setRooted(world, monster, true);
      }
      detachComponent(world, monster, 'isConcealed');
      world.pushEvent(monster.hasPosition.nodeId, {
        kind: 'monster-cast-end',
        monsterId: monster.isMonster.id,
        fired: true,
      });
      return 'done';
    }
    case 'escape-guard': {
      // HARD CONTROL CANCELS THE ESCAPE. Without this the guard's timer ran
      // straight through a stun: the boss "got away" while it was standing there
      // stunned, then vanished and ambushed on the far side of the control the
      // player had just spent. Distinct from breaking the plate — a stun banks no
      // Instinct and causes no stumble, it simply stops the attempt.
      if (
        (step.interruptible ?? true) &&
        (isMonsterStunned(world, monster.isMonster.id) ||
          isMonsterFrozen(world, monster.isMonster.id))
      ) {
        endPattern(world, monster, 'interrupted', now);
        return 'ended';
      }
      // BROKEN IN TIME: the retreat fails. The boss stumbles, and banks one capped
      // stack of Instinct so its next attempt is quicker.
      if (sourceBarrierRemaining(monster, step.sourceId) <= 0) {
        gainEscapeInstinct(monster, step.maxInstinctStacks);
        state.staggered = true;
        state.barrierSourceIds = state.barrierSourceIds.filter(id => id !== step.sourceId);
        endPattern(world, monster, 'staggered', now);
        beginRecovery(world, monster, step.onBreak.label, step.onBreak.staggerMs, true, now);
        return 'ended';
      }
      if (now < state.stepEndsAtMs) return 'running';
      // SURVIVED: the escape succeeds. Instinct is a record of failure, so a
      // successful getaway wipes it.
      // Whatever ground the bolt covered is the ground it got. Hand the body back
      // rooted and at its own speed before the next step takes it. (The BROKEN path
      // above needs none of this — `endPattern` already unwinds all three.)
      if (step.flee) stopFleeing(world, monster, state);
      resetEscapeInstinct(monster);
      clearSourceBarrier(monster, step.sourceId);
      state.barrierSourceIds = state.barrierSourceIds.filter(id => id !== step.sourceId);
      world.pushEvent(monster.hasPosition.nodeId, {
        kind: 'monster-cast-end',
        monsterId: monster.isMonster.id,
        fired: true,
      });
      return 'done';
    }
    case 'pull': {
      if (
        (step.interruptible ?? true) &&
        (isMonsterStunned(world, monster.isMonster.id) ||
          isMonsterFrozen(world, monster.isMonster.id))
      ) {
        endPattern(world, monster, 'interrupted', now);
        return 'ended';
      }
      if (now < state.stepEndsAtMs) return 'running';
      const target = patternTarget(world, monster);
      if (target) {
        // Toward the BOSS, through the shared forced-movement helper so the same
        // resistance, clamping and obstacle resolution apply as to any shove.
        hooks?.pullPlayer(world, target, monster.hasPosition.current, step.distance);
      }
      world.pushEvent(monster.hasPosition.nodeId, {
        kind: 'monster-cast-end',
        monsterId: monster.isMonster.id,
        fired: true,
        targetId: target?.isPlayer.id,
        fx: step.fx,
      });
      return 'done';
    }
    case 'fault-lines':
    case 'drop-barrier':
      return 'done';
    case 'wait':
      return now >= state.stepEndsAtMs ? 'done' : 'running';
    case 'recovery':
      return 'ended';
  }
}

function finishStep(
  world: World,
  monster: MonsterEntity,
  state: NonNullable<MonsterEntity['runsBossPattern']>,
  step: BossPatternStep,
): void {
  if (step.kind === 'impact' || (step.kind === 'payoff' && step.radius !== undefined)) {
    clearGroundZonesByOwner(world, monster.hasPosition.nodeId, monster.isMonster.id);
  }
  if (step.kind === 'cast' && step.lane) {
    // Hand the lane to the charge step; do NOT clear it here.
    state.laneZoneId = laneZone(world, monster)?.id;
  }
}

/** Put the boss's authored speed back. Idempotent, so every exit path may call it. */
function restoreChargeSpeed(
  world: World,
  monster: MonsterEntity,
  state: NonNullable<MonsterEntity['runsBossPattern']>,
): void {
  if (state.savedSpeed === undefined) return;
  monster.hasPosition.speed = state.savedSpeed;
  state.savedSpeed = undefined;
  markSliceDirty(world, monster, 'hasPosition');
}

/**
 * End a fleeing escape-guard: stop the body where it got to, restore the authored
 * speed, and take the root back for whatever the sequence does next. Mirrors the
 * travelling burrow's hand-back, and is safe to call when the flee never started.
 */
function stopFleeing(
  world: World,
  monster: MonsterEntity,
  state: NonNullable<MonsterEntity['runsBossPattern']>,
): void {
  stopEntity(world, monster);
  restoreChargeSpeed(world, monster, state);
  if (state.ownsRoot) setRooted(world, monster, true);
}

// ── Committed travel ─────────────────────────────────────────────────────────

/**
 * Advance the boss along its locked lane, damaging each body AT MOST ONCE.
 *
 * Position is integrated directly rather than requested through `setEntityMotion`:
 * the charge is committed, so it must not path around obstacles or re-target. It
 * stops early on a wall (a boss that grinds through terrain reads as broken) and
 * on `maxTravelMs`, so no configuration can leave it travelling forever.
 */
function tickCommittedTravel(
  world: World,
  monster: MonsterEntity,
  state: NonNullable<MonsterEntity['runsBossPattern']>,
  pattern: BossPattern,
  step: Extract<BossPatternStep, { kind: 'charge' }>,
  dt: number,
  now: number,
): StepOutcome {
  // Geometry comes from the CAPTURE, not the published zone. The zone is a rendering
  // object with its own lifetime; the commitment is not.
  const destination = state.capturedEndpoint;
  const halfWidth = state.chargeHalfWidth;
  if (!destination || halfWidth === undefined) return 'done';

  // The movement system owns the position; this tick only observes it and resolves
  // what the body has run over. `updateMovement` runs later in the same tick, so the
  // sweep below trails the render by one step — harmless, because consecutive sweeps
  // overlap by more than a tick's travel and nothing can slip between them.
  const from = monster.hasPosition.current;
  const remaining = Math.hypot(destination.x - from.x, destination.y - from.y);

  resolveTravelContacts(world, monster, state, pattern, step, halfWidth, now);
  if (!world.hasMonster(monster.isMonster.id)) return 'ended';

  // TACKLE. Hitting a player ENDS the charge where the bodies met. A charge that
  // ploughs on through reads as the boss not noticing what it just ran over, and it
  // leaves the follow-up circle anchored at a lane tip the fight never reached.
  const tackled = (step.stopsOnContact ?? true) && state.chargeConnected === true;

  // ARRIVAL. Either the body reached the tip, or the movement system gave up on it
  // (blocked by terrain, so `isMoving` is gone) — in both cases the charge is over.
  // `maxTravelMs` remains the outer guard against a motion that never resolves.
  const stalled = monster.isMoving === undefined;
  if (tackled || remaining < ARRIVAL_EPSILON_PX || stalled || now >= state.stepEndsAtMs) {
    // Land exactly on the tip when the body is close enough that the last partial
    // step would otherwise leave it short of its own marker. A body stopped early by
    // TERRAIN keeps its real position — it genuinely could not get there.
    if (!tackled && remaining < ARRIVAL_EPSILON_PX) {
      monster.hasPosition.current = { ...destination };
      markSliceDirty(world, monster, 'hasPosition');
    }
    // `capturedEndpoint` means "where the charge finished", and after a tackle that
    // is the collision, not the tip it was aiming at. Rewriting it here is what
    // keeps every `anchor: 'captured-endpoint'` step downstream honest.
    if (tackled) state.capturedEndpoint = { ...monster.hasPosition.current };
    stopEntity(world, monster);
    // The lane has done its job; retire it before the payoff steps publish theirs.
    clearGroundZonesByOwner(world, monster.hasPosition.nodeId, monster.isMonster.id);
    state.laneZoneId = undefined;
    state.chargeHalfWidth = undefined;
    restoreChargeSpeed(world, monster, state);
    // Take the root back for whatever the sequence does next.
    if (state.ownsRoot) setRooted(world, monster, true);
    return 'done';
  }
  return 'running';
}

/** Damage everything standing on the lane that this travel has not hit yet. */
function resolveTravelContacts(
  world: World,
  monster: MonsterEntity,
  state: NonNullable<MonsterEntity['runsBossPattern']>,
  pattern: BossPattern,
  step: Extract<BossPatternStep, { kind: 'charge' }>,
  halfWidth: number,
  now: number,
): void {
  if (!hooks) return;
  const nodeId = monster.hasPosition.nodeId;
  const multiplier = pattern.damageMultiplier * (step.damageMult ?? 1);
  // Only the swept span around the boss is tested, not the whole lane: a player
  // standing at the far end has not been run over YET, and hitting them early
  // would make the charge a lane-wide instant hit rather than a moving body.
  const sweep = {
    kind: 'circle' as const,
    center: { ...monster.hasPosition.current },
    radius: halfWidth,
  };

  for (const circle of geometryCoveringCircles(sweep)) {
    for (const player of world.collision.bodiesInCircle(
      world.livePlayersInNode(nodeId),
      circle.pos,
      circle.radius,
    )) {
      if (state.chargeHitIds.includes(player.isPlayer.id)) continue;
      if (!geometryContains(sweep, player.hasPosition.current)) continue;
      state.chargeHitIds.push(player.isPlayer.id);
      // The connection is what the rest of the sequence hangs off: it stops the
      // travel, and it gates every `requiresChargeHit` step after it.
      state.chargeConnected = true;
      hooks.hitPlayer(world, monster, player, now, multiplier);
      if (!world.hasMonster(monster.isMonster.id)) return;
    }
    for (const minion of world.collision.bodiesInCircle(
      world.minionEntitiesInNode(nodeId),
      circle.pos,
      circle.radius,
    )) {
      if (state.chargeHitIds.includes(minion.isMinion.id)) continue;
      if (!geometryContains(sweep, minion.hasPosition.current)) continue;
      state.chargeHitIds.push(minion.isMinion.id);
      hooks.hitMinion(world, monster, minion, now);
    }
  }
}

// ── Relocation ───────────────────────────────────────────────────────────────

const RELOCATE_SAMPLE_ANGLES = 24;
const RELOCATE_SAMPLE_STEP = 48;
/** Rings tried outward from the authored gap before `near-target` gives up. */
const RELOCATE_RING_RETRIES = 4;

/**
 * Pick a DETERMINISTIC, standable point for the boss to reappear at.
 *
 * Deterministic because "where does it come back up" must be answerable by the
 * player from what they can see — a random re-entry is indistinguishable from the
 * boss teleporting, which is the thing §5.5 forbids. Angles are swept in a fixed
 * order and the first valid candidate wins.
 *
 * Returns null when nothing valid was found, and callers must treat that as "do not
 * move" rather than forcing it: a boss emerging inside terrain is worse than one
 * that came back where it started.
 */
/** Don't re-path for jitter; only when the target has genuinely walked off. */
const CONCEAL_RETARGET_EPSILON_PX = 16;

/**
 * While the feint is running, the distance from the TARGET the boss should be
 * heading for: where it is now, plus the authored back-off. Returns null once the
 * feint window has elapsed (or when the step declares none), which puts the steering
 * back on the ordinary emergence gap.
 */
/** How long one detour leg may take before the burrow gives up on it and turns in. */
function feintLegMs(step: Extract<BossPatternStep, { kind: 'conceal' }>): number {
  const feint = step.feint;
  if (!feint) return 0;
  return Math.max(100, Math.round((step.durationMs * feint.untilPct) / 2));
}

/** Fixed sweep direction: a burrow that detoured at random would be unreadable. */
const FEINT_SWEEP_SIGN = 1;
/** Close enough to a waypoint to call it reached and move to the next leg. */
const FEINT_ARRIVE_PX = 56;

/**
 * Plan the detour ONCE, when the boss goes under.
 *
 * Two points spaced across the authored bearing sweep, at the feint radius and then
 * partway back in — so the body runs out, around, and is already turning inward when
 * the tracking approach takes over. Each is pulled inward until it is somewhere the
 * boss can actually stand, and dropped entirely if nowhere on that bearing works;
 * a detour is a flourish, and it must never be able to strand the burrow.
 */
function planFeintWaypoints(
  world: World,
  monster: MonsterEntity,
  step: Extract<BossPatternStep, { kind: 'conceal' }>,
  target: PlayerEntity,
): Vec2[] {
  const feint = step.feint;
  if (!feint) return [];
  const anchor = target.hasPosition.current;
  const dx = monster.hasPosition.current.x - anchor.x;
  const dy = monster.hasPosition.current.y - anchor.y;
  const startAngle = Math.atan2(dy, dx);
  const startRadius = Math.hypot(dx, dy);
  const outer = startRadius + feint.awayPx;
  const arc = ((feint.arcDeg ?? 0) * Math.PI) / 180 * FEINT_SWEEP_SIGN;

  const nodeId = monster.hasPosition.nodeId;
  const points: Vec2[] = [];
  for (const [turn, radius] of [[0.45, outer], [0.9, outer * 0.7]] as const) {
    const angle = startAngle + arc * turn;
    // Walk inward until the point is standable rather than abandoning the bearing.
    for (let r = radius; r >= startRadius * 0.5; r -= RELOCATE_SAMPLE_STEP) {
      const candidate = clampToNode(nodeId, {
        x: anchor.x + Math.cos(angle) * r,
        y: anchor.y + Math.sin(angle) * r,
      });
      if (standable(world, monster, candidate)) {
        points.push(candidate);
        break;
      }
    }
  }
  return points;
}

/**
 * Steer a TRAVELLING concealment: keep its emergence point on the target.
 *
 * It tracks for the WHOLE burrow. An earlier draft locked the point partway
 * through, on the theory that a tracking emergence would be unanswerable — but the
 * eruption telegraphs for a full second AFTER the boss surfaces, and that
 * telegraph is the answer. Locking early bought the player nothing and cost the
 * boss its only means of closing on a ranged character, so it was measured, found
 * to change no outcome at the values actually shipped, and removed.
 *
 * Re-pathing is epsilon-gated. A nav request every tick against a target who has
 * shifted three pixels is pure churn, and it makes the underground body stutter
 * rather than track.
 */
function steerConcealedTravel(
  world: World,
  monster: MonsterEntity,
  state: NonNullable<MonsterEntity['runsBossPattern']>,
  step: Extract<BossPatternStep, { kind: 'conceal' }>,
  now: number,
): void {
  const target = patternTarget(world, monster);

  // LEG 1-2: the planned detour. A waypoint is retired when the body reaches it or
  // when its slice of the feint window runs out — the timeout is what stops a
  // waypoint the navigation cannot actually reach from eating the whole burrow.
  const waypoint = state.feintWaypoints?.[0];
  if (waypoint) {
    const reached =
      Math.hypot(
        monster.hasPosition.current.x - waypoint.x,
        monster.hasPosition.current.y - waypoint.y,
      ) <= FEINT_ARRIVE_PX;
    if (reached || now >= (state.feintLegEndsAtMs ?? 0)) {
      state.feintWaypoints = state.feintWaypoints!.slice(1);
      state.feintLegEndsAtMs = now + feintLegMs(step);
      // Fall through: the next destination is issued below, this tick.
    } else {
      // Already travelling to a FIXED point — leave the motion alone. Re-issuing it
      // every tick is what made the spiral stutter.
      if (monster.isMoving !== undefined) return;
      state.capturedEndpoint = { ...waypoint };
      setEntityMotion(world, monster, waypoint);
      return;
    }
  }

  const next = state.feintWaypoints?.[0];
  if (next) {
    state.capturedEndpoint = { ...next };
    setEntityMotion(world, monster, next);
    return;
  }

  // FINAL LEG: track the target, so the emergence lands on them and not on where
  // they were when the boss went under.
  const destination = relocationPoint(
    world,
    monster,
    'near-target',
    target,
    step.emergeGap ?? 140,
  );
  // Nothing valid this tick (the target left, or every candidate is inside
  // terrain): keep walking to the point already captured rather than stalling.
  if (!destination) return;

  // A STALLED BODY ALWAYS RE-ISSUES. The epsilon gate exists to stop per-tick nav
  // churn against a target who has shifted three pixels, but it also meant that a
  // burrow whose motion had ended — blocked by terrain, or arrived at a point that
  // then moved — could never restart: the destination was unchanged, so the gate
  // returned, so no motion was ever set again, so the boss sat underground until it
  // surfaced. Reachable as soon as a spiral steers into a wall.
  const stalled = monster.isMoving === undefined;
  const current = state.capturedEndpoint;
  if (
    !stalled &&
    current &&
    distanceSq(destination, current) < CONCEAL_RETARGET_EPSILON_PX * CONCEAL_RETARGET_EPSILON_PX
  ) {
    return;
  }
  state.capturedEndpoint = { ...destination };
  setEntityMotion(world, monster, destination);
}

function relocationPoint(
  world: World,
  monster: MonsterEntity,
  mode: 'near-target' | 'leash-edge',
  target: PlayerEntity | null,
  gap: number,
): Vec2 | null {
  const nodeId = monster.hasPosition.nodeId;
  const anchorPos = target?.hasPosition.current ?? monster.hasPosition.current;

  if (mode === 'near-target') {
    // Sweep OUTWARD FROM THE SIDE THE BOSS IS ALREADY ON, alternating left/right,
    // rather than from world-east. A fixed start angle is deterministic but it is
    // not readable: in open ground the first candidate always wins, so the boss
    // surfaced to the player's right every single time regardless of where it had
    // burrowed from. Fanning from its own bearing keeps the choice deterministic
    // AND makes it follow from what the player watched go under.
    const bearing = Math.atan2(
      monster.hasPosition.current.y - anchorPos.y,
      monster.hasPosition.current.x - anchorPos.x,
    );
    // Rings, innermost first: the authored gap, then outward in fixed steps.
    //
    // The old search swept angles at ONE radius and then gave up, which failed in
    // both directions. A boss whose authored ring happened to be blocked the whole
    // way round did not relocate at all — so the sequence telegraphed its circle
    // back where the boss had burrowed from, which is the worst available answer
    // rather than the nearest one. And `emergeGap: 0` was unusable, because every
    // angle at radius 0 names the same point, so one blocked sample was the whole
    // search. Expanding outward keeps the emergence as close to the authored intent
    // as the ground allows.
    for (let ring = 0; ring <= RELOCATE_RING_RETRIES; ring++) {
      const radius = gap + ring * RELOCATE_SAMPLE_STEP;
      // At radius 0 the fan is 24 copies of one point; take it once.
      const samples = radius <= 0 ? 1 : RELOCATE_SAMPLE_ANGLES;
      for (let i = 0; i < samples; i++) {
        const spread = Math.ceil(i / 2) / RELOCATE_SAMPLE_ANGLES;
        const angle = bearing + (i % 2 === 0 ? 1 : -1) * spread * Math.PI * 2;
        const candidate = clampToNode(nodeId, {
          x: anchorPos.x + Math.cos(angle) * radius,
          y: anchorPos.y + Math.sin(angle) * radius,
        });
        if (standable(world, monster, candidate)) return candidate;
      }
    }
    return null;
  }

  // leash-edge: the farthest reachable point of the leash circle AWAY from the
  // target. Running away is only meaningful if it actually opens distance, and
  // clamping to the leash is what stops a retreat becoming a despawn.
  const ai = monster.controlsMonster;
  const away = Math.atan2(
    monster.hasPosition.current.y - anchorPos.y,
    monster.hasPosition.current.x - anchorPos.x,
  );
  for (let spread = 0; spread <= Math.PI; spread += Math.PI / 8) {
    for (const sign of spread === 0 ? [1] : [1, -1]) {
      const angle = away + spread * sign;
      for (let radius = ai.leashRange; radius >= RELOCATE_SAMPLE_STEP; radius -= RELOCATE_SAMPLE_STEP) {
        const candidate = clampToNode(nodeId, {
          x: ai.spawn.x + Math.cos(angle) * radius,
          y: ai.spawn.y + Math.sin(angle) * radius,
        });
        if (!standable(world, monster, candidate)) continue;
        // Must actually be further from the target than where it stands now, or
        // the "retreat" is theatre.
        if (
          distanceSq(candidate, anchorPos) >
          distanceSq(monster.hasPosition.current, anchorPos)
        ) {
          return candidate;
        }
      }
    }
  }
  return null;
}

// ── Conditional payoff ───────────────────────────────────────────────────────

/**
 * Resolve a payoff, amplified by (and consuming) its setup status.
 *
 * The whole point of the shape: the mark decides HOW HARD this lands, never WHETHER
 * it lands. A cleansed player still eats the Execution and still has to answer it
 * with position, Guard, or armour — they just took the amplification off the table.
 * Cancelling the attack outright would make Cleanse a hard counter to the encounter;
 * doing nothing would make it pointless.
 */
function resolvePayoff(
  world: World,
  monster: MonsterEntity,
  state: NonNullable<MonsterEntity['runsBossPattern']>,
  pattern: BossPattern,
  step: Extract<BossPatternStep, { kind: 'payoff' }>,
  now: number,
): void {
  if (!hooks) return;
  const target = patternTarget(world, monster);

  if (step.radius !== undefined) {
    const at = state.capturedEndpoint ?? { ...monster.hasPosition.current };
    // Amplification is decided PER VICTIM inside the circle: two players standing in
    // the same blast should not share one answer, and the marked one is the one who
    // set this up. `resolveCircle` cannot express that, so the area payoff resolves
    // its own victims here.
    for (const victim of victimsInCircle(world, monster, at, step.radius)) {
      hooks.hitPlayer(world, monster, victim, now, payoffMultiplier(pattern, step, victim));
      if (!world.hasMonster(monster.isMonster.id)) return;
    }
  } else if (target) {
    const before = target.hasHealth.hp;
    hooks.hitPlayer(world, monster, target, now, payoffMultiplier(pattern, step, target));
    // DEVOUR feeds the caster — but only on a LANDED hit. Dodging it, guarding it
    // into nothing, or killing the wind-up all deny the heal, which is precisely
    // what makes the long tell worth reading.
    const healPct = step.healsSelfPct ?? 0;
    if (
      healPct > 0 &&
      target.hasHealth.hp < before &&
      world.hasMonster(monster.isMonster.id)
    ) {
      monster.hasHealth.hp = Math.min(
        monster.hasHealth.maxHp,
        monster.hasHealth.hp + Math.round(monster.hasHealth.maxHp * healPct),
      );
      markSliceDirty(world, monster, 'hasHealth');
    }
  }

  world.pushEvent(monster.hasPosition.nodeId, {
    kind: 'monster-cast-end',
    monsterId: monster.isMonster.id,
    fired: true,
    targetId: target?.isPlayer.id,
    fx: step.fx,
  });
}

/**
 * The multiplier this victim eats, consuming their setup status if they had one.
 * A payoff with no `consumes` is a plain telegraphed hit and never amplifies.
 */
function payoffMultiplier(
  pattern: BossPattern,
  step: Extract<BossPatternStep, { kind: 'payoff' }>,
  victim: PlayerEntity,
): number {
  const base = pattern.damageMultiplier * step.damageMult;
  if (!step.consumes) return base;
  const amplified = consumeAmplifier(victim, step.consumes.effectId);
  return amplified ? base * (step.amplifiedMult ?? 1) : base;
}

/** Whether the target carried the setup status, removing it either way. */
function consumeAmplifier(target: PlayerEntity, effectId: string): boolean {
  const carried = (getStatusEffect(target.tracksCombat, effectId)?.stacks ?? 0) > 0;
  if (carried) removeStatusEffect(target.tracksCombat, effectId);
  return carried;
}

function victimsInCircle(
  world: World,
  monster: MonsterEntity,
  at: Vec2,
  radius: number,
): PlayerEntity[] {
  const geometry = { kind: 'circle' as const, center: at, radius };
  const victims: PlayerEntity[] = [];
  for (const player of world.collision.bodiesInCircle(
    world.livePlayersInNode(monster.hasPosition.nodeId),
    at,
    radius,
  )) {
    if (!geometryContains(geometry, player.hasPosition.current)) continue;
    victims.push(player);
  }
  return victims;
}

// ── Lane painting ────────────────────────────────────────────────────────────

function paintLane(
  world: World,
  monster: MonsterEntity,
  state: NonNullable<MonsterEntity['runsBossPattern']>,
  lane: NonNullable<Extract<BossPatternStep, { kind: 'cast' }>['lane']>,
  target: PlayerEntity,
  now: number,
  castEndsAtMs: number,
): void {
  const existing = laneZone(world, monster);
  if (existing && now >= existing.lockedAtMs) return; // committed — never re-aim

  const start = { ...monster.hasPosition.current };
  // Both clamps, in order: the leash decides how far it may go, the node decides
  // where the map ends. Whatever survives is BOTH the lane drawn and the distance
  // travelled -- the telegraph and the charge are the same segment by construction.
  const end = clampToNode(
    monster.hasPosition.nodeId,
    clampLaneToLeash(
      monster,
      start,
      extendSegment(start, target.hasPosition.current, lane.length),
    ),
  );

  if (existing) {
    reaimChargeCorridor(existing, start, end);
    return;
  }

  const lockPct = Math.min(1, Math.max(0, lane.lockAtCastPct ?? 0.5));
  const castMs = Math.max(1, castEndsAtMs - now);
  const published = publishChargeCorridor(world, monster.hasPosition.nodeId, {
    kind: 'charge-corridor',
    start,
    end,
    halfWidth: lane.halfWidth,
    startedAtMs: now,
    resolvesAtMs: castEndsAtMs,
    lockedAtMs: castEndsAtMs - castMs * (1 - lockPct),
    ownerId: monster.isMonster.id,
    damageMultiplier: 1,
  });
  state.laneZoneId = published.id;
}

function publishFaultLines(
  world: World,
  monster: MonsterEntity,
  step: Extract<BossPatternStep, { kind: 'fault-lines' }>,
  at: Vec2,
  pattern: BossPattern,
  now: number,
): void {
  const points: Vec2[] = [];
  const innerRadius = step.innerRadius ?? 96;
  const spacing = Math.max(1, step.lineRadius * 1.7);
  // Rotate each burst so the safe wedges stay readable without becoming fixed
  // cardinal lanes the player can memorise once and never look at again.
  const rotation = ((now % 4_000) / 4_000) * Math.PI * 2;
  for (let ray = 0; ray < step.rayCount; ray++) {
    const angle = rotation + (ray / step.rayCount) * Math.PI * 2;
    for (let distance = innerRadius; distance <= step.length; distance += spacing) {
      points.push({
        x: at.x + Math.cos(angle) * distance,
        y: at.y + Math.sin(angle) * distance,
      });
    }
  }
  publishFaultLineBurst(world, monster.hasPosition.nodeId, {
    kind: 'fault-line-telegraph',
    pos: { ...at },
    radius: step.lineRadius,
    startedAtMs: now,
    resolvesAtMs: now + step.delayMs,
    ownerId: monster.isMonster.id,
    points,
    damageMultiplier: pattern.damageMultiplier * step.damageMult,
  });
}
