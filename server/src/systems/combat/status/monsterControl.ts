/**
 * Monster movement control — the one place that owns a monster's slowed speed
 * and its root.
 *
 * THE CONTROL LADDER (design_docs/ABILITY_CAST_AND_TIER_PROGRESSION_T1_T4.md §8)
 * keeps three deliberately different levels, and they are structurally distinct
 * rather than three numbers of the same status:
 *
 *   Hamstring       movement slowed   actions allowed   (this file, slow)
 *   Binding Strike  movement stopped  actions allowed   (this file, root)
 *   Stunning Strike movement stopped  actions stopped   (`stun.ts`)
 *
 * Slows are a final multiplier, never a rewrite of authored speed or cadence.
 * This preserves AI charges, spawn scaling and scripted stat changes, and keeps
 * the movement executor and network view in agreement. Strongest source wins.
 */
import {
  ABILITY_ROOT_EFFECT_ID,
  ABILITY_SLOW_EFFECT_ID,
  MONSTER_ROOT_STATUS_IDS,
  MONSTER_SLOW_STATUS_IDS,
  applyStatusEffect,
  getFlag,
  getStatusEffect,
  isHoldStatusId,
  setFlag,
} from "@mmo-idle/shared";
import type { MonsterEntity } from "../../../ecs/entity";
import { attachMarker, detachMarker } from "../../../ecs/markerHelpers";
import type { World } from "../../../world/World";
import { setRooted } from "../../world/rooted";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import { isMonsterStunned } from "./stun";
import { monsterIgnoresControl } from "./controlImmunity";
import { CHILL_EFFECT, FROZEN_EFFECT, CHILL_ATK_MULT, CHILL_SPEED_MULT, FREEZE_ATK_MULT, FREEZE_SPEED_MULT } from "./frost";

const OWNS_ROOT_FLAG = "abilityOwnsRoot";

/**
 * Apply a SLOW to a monster: a fraction of its movement speed for
 * `durationMs`. Ability slows do not alter the target's attack cadence.
 *
 * Slow is deliberately NOT a soft root: the target still attacks, still casts,
 * and still closes — just more slowly. It exists for kiting, for maintaining
 * range, and for catching something that is running away.
 *
 * `effectId` names the slow on the target frame (Hamstring's `ability-slowed` by
 * default). Every id in `MONSTER_SLOW_STATUS_IDS` is the same rung — the reconciler below takes the
 * strongest across them, as it takes the strongest across every other source.
 */
export function applyMonsterSlow(
  world: World,
  monster: MonsterEntity,
  slowPct: number,
  durationMs: number,
  sourceId: string,
  effectId: string = ABILITY_SLOW_EFFECT_ID,
): void {
  if (slowPct <= 0 || durationMs <= 0) return;
  // Max wins on both axes (review finding P7, 2026-10-02): a plain refresh kept
  // the OLD record's data and overwrote its clock, so a 20%/1.2 s at-bay tap
  // landing on a 40%/3 s Hamstring left the slow at 20% with a clock reading
  // 250%, then cut it back to 1.2 s on the next tap.
  const prior = getStatusEffect(monster.tracksCombat, effectId);
  const pct = Math.max(slowPct, prior?.data['moveSlowPct'] ?? 0);
  const remainingMs = Math.max(durationMs, prior?.remainingMs ?? 0);
  const totalMs = Math.max(durationMs, prior?.data['totalMs'] ?? 0, remainingMs);
  const effect = applyStatusEffect(monster.tracksCombat, {
    id: effectId,
    maxStacks: 1,
    remainingMs,
    refreshable: true,
    sourceId,
    // `totalMs` is required for the buff-bar clock on every timed effect.
    data: { totalMs, moveSlowPct: pct },
  });
  effect.remainingMs = remainingMs;
  effect.data['moveSlowPct'] = pct;
  effect.data['totalMs'] = totalMs;
  attachMarker(world, monster, "hasAbilitySlow");
}

/**
 * Apply a ROOT to a monster for `durationMs`.
 *
 * Root stops MOVEMENT ONLY. A rooted monster still swings at anything already
 * inside its reach and still resolves non-movement actions. That distinction is
 * the whole reason root sits between slow and stun on the ladder, so nothing
 * here may reach for `cannotAttack`.
 *
 * `effectId` names the root on the target frame (Binding Strike's
 * `ability-rooted` by default). Every id in `MONSTER_ROOT_STATUS_IDS` is the same rung: the
 * root holds while any of them is live, under the same ownership rules.
 */
export function applyMonsterRoot(
  world: World,
  monster: MonsterEntity,
  durationMs: number,
  sourceId: string,
  effectId: string = ABILITY_ROOT_EFFECT_ID,
): void {
  if (durationMs <= 0) return;
  // Plated / control-immune bosses refuse the root (see controlImmunity.ts).
  if (monsterIgnoresControl(monster)) return;
  applyStatusEffect(monster.tracksCombat, {
    id: effectId,
    maxStacks: 1,
    remainingMs: durationMs,
    refreshable: true,
    sourceId,
    data: { totalMs: durationMs },
  });
  attachMarker(world, monster, "hasAbilityRoot");
  if (!monster.isRooted) {
    setRooted(world, monster, true);
    setFlag(monster.tracksCombat, OWNS_ROOT_FLAG, true);
  }
}

/**
 * Is this monster HELD — slowed, rooted, stunned or knocked down, by anyone, right
 * now? The Control moment's condition (design §24.2, §24.9: "a knockdown counts
 * as held").
 *
 * Read off the live status records rather than the reconciled
 * `monsterMoveSpeedMult`, which only catches up on the next control pass: a slow
 * that landed earlier in this tick already holds the body. Every rung of the
 * ladder counts — an ability, at-bay or lean slow (Slowed, Hobbled), a chill,
 * a freeze, the root (Bound, Pinned), and the stun, which is also what the
 * Control payload's knockdown is. The list is shared (`isHoldStatusId`), so the
 * HUD's "held" and this one can never disagree. A boss that roots ITSELF for a
 * scripted phase is not held by anyone, so the script's `isRooted` alone does not
 * count, and neither does a pattern's own recovery.
 */
export function monsterIsHeld(monster: MonsterEntity): boolean {
  return monster.tracksCombat.statusEffects.some(
    (effect) => effect.remainingMs !== 0 && isHoldStatusId(effect.id),
  );
}

/** A live root of any id on this monster: Binding Strike's or the Control payload's. */
export function monsterHasLiveRoot(monster: MonsterEntity): boolean {
  return MONSTER_ROOT_STATUS_IDS.some(
    (id) => (getStatusEffect(monster.tracksCombat, id)?.remainingMs ?? 0) > 0,
  );
}

interface SlowTotals {
  entity: MonsterEntity;
  move: number;
  attack: number;
}

/**
 * Reconcile monster slow multipliers and root ownership for the tick.
 *
 * Runs after mechanic ticks (which decrement status durations and clean up their
 * own markers) and before movement/AI. Consumers apply these multipliers to
 * the current authored stats instead of allowing AI and control to overwrite them.
 */
export function updateMonsterSlows(world: World): void {
  const totals = new Map<string, SlowTotals>();

  const record = (entity: MonsterEntity, move: number, attack: number): void => {
    const id = entity.isMonster.id;
    const existing = totals.get(id);
    if (!existing) {
      totals.set(id, { entity, move, attack });
      return;
    }
    // STRONGEST source wins per axis — never the sum. Adding a 45% chill to an
    // 80% freeze to a 50% Hamstring would pin the monster in place, which is a
    // root, and root is a different rung of the ladder with its own cost.
    existing.move = Math.max(existing.move, move);
    existing.attack = Math.max(existing.attack, attack);
  };

  for (const entity of world.frozenMonsters) {
    const effect = getStatusEffect(entity.tracksCombat, FROZEN_EFFECT);
    if (!effect) continue;
    record(
      entity,
      Math.max(0, effect.data.moveSlowPct ?? FREEZE_SPEED_MULT),
      Math.max(0, effect.data.attackSlowPct ?? FREEZE_ATK_MULT),
    );
  }

  for (const entity of world.chilledMonsters) {
    const effect = getStatusEffect(entity.tracksCombat, CHILL_EFFECT);
    if (!effect) continue;
    record(
      entity,
      effect.stacks * Math.max(0, effect.data.moveSlowPerStack ?? CHILL_SPEED_MULT),
      effect.stacks * Math.max(0, effect.data.attackSlowPerStack ?? CHILL_ATK_MULT),
    );
  }

  for (const entity of world.abilitySlowedMonsters) {
    // Every slow id is the same rung (Hamstring's, the lean's Hobbled): the
    // strongest of them wins, like every other source here.
    let slowed = false;
    for (const id of MONSTER_SLOW_STATUS_IDS) {
      const effect = getStatusEffect(entity.tracksCombat, id);
      if (!effect) continue;
      slowed = true;
      record(
        entity,
        Math.max(0, effect.data.moveSlowPct ?? 0),
        Math.max(0, effect.data.attackSlowPct ?? 0),
      );
    }
    if (!slowed) detachMarker(world, entity, "hasAbilitySlow");
  }

  for (const { entity, move, attack } of totals.values()) {
    writeSlowMultipliers(world, entity, move, attack);
  }

  for (const entity of world.monsterEntities) {
    if (!totals.has(entity.isMonster.id)) writeSlowMultipliers(world, entity, 0, 0);
  }

  updateMonsterRoots(world);
  publishHardControl(world);
}

/**
 * Mirror "cannot act" onto the networked status slice, for the renderer.
 *
 * Written HERE because this pass is already the single reconciler for monster
 * control — deriving it anywhere else would mean a second opinion about the same
 * question. A boss in an authored pattern recovery counts: it is rooted and cannot
 * attack, which is the same thing to the player as a stun, and it is the case they
 * most need to see because it is their window.
 */
function publishHardControl(world: World): void {
  for (const entity of world.monsterEntities) {
    const held =
      isMonsterStunned(world, entity.isMonster.id) ||
      getStatusEffect(entity.tracksCombat, FROZEN_EFFECT) !== undefined ||
      // A STAGGER only (principle 5): a completed pattern's brief recovery is not
      // a punish window and must not borrow the stun tell.
      entity.recoversFromPattern?.fromStagger === true;
    if ((entity.hasStatus.hardControlled ?? false) === held) continue;
    entity.hasStatus.hardControlled = held;
    markSliceDirty(world, entity, 'hasStatus');
  }
}

function writeSlowMultipliers(
  world: World,
  entity: MonsterEntity,
  moveSlow: number,
  attackSlow: number,
): void {
  const move = 1 - Math.min(0.95, moveSlow);
  const attack = 1 + attackSlow;
  if ((entity.hasStatus.monsterMoveSpeedMult ?? 1) === move &&
      (entity.hasStatus.monsterAttackCooldownMult ?? 1) === attack) return;
  if (move === 1) delete entity.hasStatus.monsterMoveSpeedMult;
  else entity.hasStatus.monsterMoveSpeedMult = move;
  if (attack === 1) delete entity.hasStatus.monsterAttackCooldownMult;
  else entity.hasStatus.monsterAttackCooldownMult = attack;
  markSliceDirty(world, entity, 'hasStatus');
}

/**
 * Drop the root the moment its effect lapses — but only the root WE installed.
 * A boss script that roots itself owns its own `isRooted`, and stealing that
 * would let a 1.5 s Binding Strike end a scripted phase early.
 */
function updateMonsterRoots(world: World): void {
  for (const entity of world.abilityRootedMonsters) {
    if (monsterHasLiveRoot(entity)) continue;
    detachMarker(world, entity, "hasAbilityRoot");
    if (getFlag(entity.tracksCombat, OWNS_ROOT_FLAG)) {
      setRooted(world, entity, false);
      setFlag(entity.tracksCombat, OWNS_ROOT_FLAG, false);
    }
  }
}
