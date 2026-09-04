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
 * ONE WRITER FOR SPEED. Chill, Freeze and an ability slow all want to reduce
 * `hasPosition.speed` and lengthen `performsAttack.attackCooldown`, and each
 * writes an ABSOLUTE value derived from `MONSTER_DATABASE` so repeated
 * application can't compound. Two independent writers doing that would ratchet
 * against each other every tick — each one reading the other's output as the
 * "clean base". So every source registers here and {@link updateMonsterSlows}
 * applies the STRONGEST of each axis once per tick, restoring the database
 * values when no source remains.
 */
import {
  ABILITY_ROOT_EFFECT_ID,
  ABILITY_SLOW_EFFECT_ID,
  MONSTER_DATABASE,
  applyStatusEffect,
  getFlag,
  getStatusEffect,
  setFlag,
} from "@mmo-idle/shared";
import type { MonsterEntity } from "../../../ecs/entity";
import { attachMarker, detachMarker } from "../../../ecs/markerHelpers";
import type { World } from "../../../world/World";
import { setRooted } from "../../world/rooted";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import { isMonsterStunned } from "./stun";
import { CHILL_EFFECT, FROZEN_EFFECT } from "../../classes/archetypes/dot/t3/core/constants";
import {
  CHILL_ATK_MULT,
  CHILL_FLAG,
  CHILL_SPEED_MULT,
  FREEZE_ATK_MULT,
  FREEZE_SPEED_MULT,
} from "../../classes/archetypes/dot/t3/paths/_constants";

/**
 * Flag marking "this monster's speed/attack cooldown are currently overwritten".
 * Kept under the original chill key so a monster mid-chill across a deploy is
 * still restored by the reconciler that now owns it.
 */
const SLOWED_FLAG = CHILL_FLAG;

/** Root ownership: only clear `isRooted` if WE set it (a boss script may own it). */
const OWNS_ROOT_FLAG = "abilityOwnsRoot";

/** Floor on a slowed monster's speed, so a slow can never become a silent root. */
const MIN_SLOWED_SPEED = 10;

/**
 * Apply a SLOW to a monster: a fraction of its movement speed and a matching
 * lengthening of its attack cadence, for `durationMs`.
 *
 * Slow is deliberately NOT a soft root: the target still attacks, still casts,
 * and still closes — just more slowly. It exists for kiting, for maintaining
 * range, and for catching something that is running away.
 */
export function applyMonsterSlow(
  world: World,
  monster: MonsterEntity,
  slowPct: number,
  durationMs: number,
  sourceId: string,
): void {
  if (slowPct <= 0 || durationMs <= 0) return;
  applyStatusEffect(monster.tracksCombat, {
    id: ABILITY_SLOW_EFFECT_ID,
    maxStacks: 1,
    remainingMs: durationMs,
    refreshable: true,
    sourceId,
    // `totalMs` is required for the buff-bar clock on every timed effect.
    data: { totalMs: durationMs, moveSlowPct: slowPct, attackSlowPct: slowPct },
  });
  attachMarker(world, monster, "hasAbilitySlow");
}

/**
 * Apply a ROOT to a monster for `durationMs`.
 *
 * Root stops MOVEMENT ONLY. A rooted monster still swings at anything already
 * inside its reach and still resolves non-movement actions. That distinction is
 * the whole reason root sits between slow and stun on the ladder, so nothing
 * here may reach for `cannotAttack`.
 */
export function applyMonsterRoot(
  world: World,
  monster: MonsterEntity,
  durationMs: number,
  sourceId: string,
): void {
  if (durationMs <= 0) return;
  applyStatusEffect(monster.tracksCombat, {
    id: ABILITY_ROOT_EFFECT_ID,
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

interface SlowTotals {
  entity: MonsterEntity;
  move: number;
  attack: number;
}

/**
 * Reconcile every monster speed/root modifier for the tick.
 *
 * Runs after mechanic ticks (which decrement status durations and clean up their
 * own markers) and before movement/AI, so the value written here is the one the
 * monster actually moves at this tick.
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
    const effect = getStatusEffect(entity.tracksCombat, ABILITY_SLOW_EFFECT_ID);
    if (!effect) {
      detachMarker(world, entity, "hasAbilitySlow");
      continue;
    }
    record(
      entity,
      Math.max(0, effect.data.moveSlowPct ?? 0),
      Math.max(0, effect.data.attackSlowPct ?? 0),
    );
  }

  for (const { entity, move, attack } of totals.values()) {
    writeSlowedStats(entity, move, attack);
  }

  // Anything the flag says we modified, that no live source still claims, goes
  // back to its database values. Iterating the flag rather than the markers is
  // what makes an expiring effect restore even on the tick its marker is dropped.
  for (const entity of world.monsterEntities) {
    if (totals.has(entity.isMonster.id)) continue;
    restoreMonsterStats(entity);
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
      entity.recoversFromPattern !== undefined;
    if ((entity.hasStatus.hardControlled ?? false) === held) continue;
    entity.hasStatus.hardControlled = held;
    markSliceDirty(world, entity, 'hasStatus');
  }
}

function writeSlowedStats(
  entity: MonsterEntity,
  moveSlow: number,
  attackSlow: number,
): void {
  const def = MONSTER_DATABASE.get(entity.isMonster.monsterTypeId);
  if (!def) return;
  entity.hasPosition.speed = Math.max(
    MIN_SLOWED_SPEED,
    Math.round(def.stats.speed * (1 - Math.min(0.95, moveSlow))),
  );
  entity.performsAttack.attackCooldown = Math.round(
    def.stats.attackCooldown * (1 + attackSlow),
  );
  if (!getFlag(entity.tracksCombat, SLOWED_FLAG)) {
    setFlag(entity.tracksCombat, SLOWED_FLAG, true);
  }
}

/** Restore base speed + attack cooldown once no slow source remains. */
export function restoreMonsterStats(entity: MonsterEntity): void {
  if (!getFlag(entity.tracksCombat, SLOWED_FLAG)) return;
  const def = MONSTER_DATABASE.get(entity.isMonster.monsterTypeId);
  if (def) {
    entity.hasPosition.speed = def.stats.speed;
    entity.performsAttack.attackCooldown = def.stats.attackCooldown;
  }
  setFlag(entity.tracksCombat, SLOWED_FLAG, false);
}

/**
 * Drop the root the moment its effect lapses — but only the root WE installed.
 * A boss script that roots itself owns its own `isRooted`, and stealing that
 * would let a 1.5 s Binding Strike end a scripted phase early.
 */
function updateMonsterRoots(world: World): void {
  for (const entity of world.abilityRootedMonsters) {
    const effect = getStatusEffect(entity.tracksCombat, ABILITY_ROOT_EFFECT_ID);
    if (effect && effect.remainingMs > 0) continue;
    detachMarker(world, entity, "hasAbilityRoot");
    if (getFlag(entity.tracksCombat, OWNS_ROOT_FLAG)) {
      setRooted(world, entity, false);
      setFlag(entity.tracksCombat, OWNS_ROOT_FLAG, false);
    }
  }
}
