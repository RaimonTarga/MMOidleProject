import {
  MONSTER_DATABASE,
  distanceSq,
  getCounter,
  setCounter,
  type MonsterRaisesDead,
} from '@mmo-idle/shared';
import type { MonsterEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { attachComponent, detachComponent } from '../../../ecs/markerHelpers';
import { mutateSlice } from '../../../ecs/dirtyHelpers';
import { takeNearestCorpse, type RuntimeCorpse } from '../../world/corpses';
import { setAggroTarget, setAttackTarget } from './targeting';
import { setRooted } from '../../world/rooted';
import { isMonsterStunned } from '../status/stun';
import { isMonsterFrozen } from '../../classes/archetypes/dot/t3/core/selectors';
import { chargedCastEndsAt } from '../engine/monsterMechanics';

const SESSION_KEY = 'raiseDeadSession';
const NEXT_RAISE_KEY = 'raiseDeadNextAt';
const CAST_ENDS_KEY = 'raiseDeadCastEndsAt';
const CAST_OWNS_ROOT_KEY = 'raiseDeadCastOwnsRoot';
const CAST_OWNS_ATTACK_LOCK_KEY = 'raiseDeadCastOwnsAttackLock';

function hasCorpseInRange(world: World, raiser: MonsterEntity, range: number): boolean {
  const rangeSq = range * range;
  return (world.corpses.get(raiser.hasPosition.nodeId) ?? []).some(
    corpse => distanceSq(corpse.pos, raiser.hasPosition.current) <= rangeSq,
  );
}

function releaseRaiseCast(world: World, raiser: MonsterEntity): void {
  if (getCounter(raiser.tracksCombat, CAST_OWNS_ROOT_KEY) !== 0) {
    setRooted(world, raiser, false);
  }
  if (getCounter(raiser.tracksCombat, CAST_OWNS_ATTACK_LOCK_KEY) !== 0) {
    detachComponent(world, raiser, 'cannotAttack');
  }
  setCounter(raiser.tracksCombat, CAST_ENDS_KEY, 0);
  setCounter(raiser.tracksCombat, CAST_OWNS_ROOT_KEY, 0);
  setCounter(raiser.tracksCombat, CAST_OWNS_ATTACK_LOCK_KEY, 0);
}

function cancelRaiseCast(world: World, raiser: MonsterEntity): void {
  if (getCounter(raiser.tracksCombat, CAST_ENDS_KEY) <= 0) return;
  releaseRaiseCast(world, raiser);
  world.pushEvent(raiser.hasPosition.nodeId, {
    kind: 'monster-cast-end',
    monsterId: raiser.isMonster.id,
    fired: false,
  });
}

function beginRaiseCast(
  world: World,
  raiser: MonsterEntity,
  spec: MonsterRaisesDead,
  now: number,
): void {
  const ownsRoot = !raiser.isRooted;
  const ownsAttackLock = !raiser.cannotAttack;
  if (ownsRoot) setRooted(world, raiser, true);
  if (ownsAttackLock) attachComponent(world, raiser, 'cannotAttack', {});
  setCounter(raiser.tracksCombat, CAST_ENDS_KEY, now + (spec.castMs ?? 0));
  setCounter(raiser.tracksCombat, CAST_OWNS_ROOT_KEY, ownsRoot ? 1 : 0);
  setCounter(raiser.tracksCombat, CAST_OWNS_ATTACK_LOCK_KEY, ownsAttackLock ? 1 : 0);
  world.pushEvent(raiser.hasPosition.nodeId, {
    kind: 'monster-cast-start',
    monsterId: raiser.isMonster.id,
    castMs: spec.castMs ?? 0,
    label: spec.castName ?? 'Raise Dead',
    fx: spec.castFx,
  });
}

/** Living risen mobs currently owned by this raiser. */
export function countRaisedBy(world: World, raiser: MonsterEntity): number {
  let count = 0;
  for (const monster of world.monsterEntitiesInNode(raiser.hasPosition.nodeId)) {
    if (monster.isRaised?.raiserId === raiser.isMonster.id) count++;
  }
  return count;
}

function raiseCorpse(
  world: World,
  raiser: MonsterEntity,
  corpse: RuntimeCorpse,
  spec: MonsterRaisesDead,
  now: number,
): boolean {
  const nodeId = raiser.hasPosition.nodeId;
  const risen = world.createMonster(nodeId, corpse.monsterTypeId, corpse.pos);
  if (!risen) return false;

  attachComponent(world, risen, 'isRaised', { raiserId: raiser.isMonster.id });

  // The dead come back diminished, and READ as raised: the name is the only tell
  // the client needs — it already rides the networked `isMonster` slice, so no
  // new protocol surface for a purely cosmetic distinction.
  mutateSlice(world, risen, 'isMonster', (slice) => {
    slice.name = `Risen ${slice.name}`;
  });
  if (spec.hpMult !== undefined) {
    mutateSlice(world, risen, 'hasHealth', (slice) => {
      slice.maxHp = Math.max(1, Math.round(slice.maxHp * spec.hpMult!));
      slice.hp = slice.maxHp;
    });
  }
  if (spec.damageMult !== undefined) {
    mutateSlice(world, risen, 'dealsDamage', (slice) => {
      slice.attack = Math.max(1, Math.round(slice.attack * spec.damageMult!));
    });
  }

  // It claws up already fighting whoever the necromancer is fighting.
  const aggro = raiser.hasAggroTarget;
  if (aggro) {
    setAggroTarget(world, risen, { id: aggro.targetId, kind: aggro.targetKind }, now);
    setAttackTarget(world, risen, aggro.targetId);
  }

  world.pushEvent(nodeId, {
    kind: 'ecology-pulse',
    monsterId: risen.isMonster.id,
    pos: { ...corpse.pos },
    pulse: 'raise-dead',
  });
  return true;
}

/**
 * BURST RESURRECTION — raise up to `count` corpses in one beat, honouring the
 * raiser's living-risen cap. Returns how many actually clawed up: fewer than asked
 * whenever the node has not fed it enough corpses, and zero when it has none. The
 * boss-script `raise-dead` action is the only caller; the ordinary cadence in
 * `updateRaisers` still raises one at a time.
 */
export function raiseCorpsesBurst(
  world: World,
  raiser: MonsterEntity,
  spec: MonsterRaisesDead,
  count: number,
  maxAlive: number,
  now: number,
): number {
  let raised = 0;
  for (let i = 0; i < count; i++) {
    if (countRaisedBy(world, raiser) >= maxAlive) break;
    const corpse = takeNearestCorpse(
      world,
      raiser.hasPosition.nodeId,
      raiser.hasPosition.current,
      spec.corpseRange,
    );
    if (!corpse) break;
    if (raiseCorpse(world, raiser, corpse, spec, now)) raised++;
  }
  return raised;
}

/**
 * Necromancy tick. Runs BEFORE `updateMonsters` alongside the other ecology
 * coordinators — it only creates entities and sets intent; `updateMonsters` stays
 * the single executor for movement and attacks.
 *
 * A raiser only works while it holds an aggro target, and the raise cadence is
 * keyed to that aggro SESSION: leashing out and re-pulling restarts the initial
 * delay instead of letting a banked timer fire the instant it re-engages.
 */
export function updateRaisers(world: World, now: number): void {
  for (const raiser of world.monsterEntities) {
    const spec = MONSTER_DATABASE.get(raiser.isMonster.monsterTypeId)?.raisesDead;
    if (!spec) continue;
    // A risen necromancer never raises: the tide has to terminate.
    if (raiser.isRaised) continue;
    if (raiser.hasHealth.hp <= 0) continue;

    const aggro = raiser.hasAggroTarget;
    const state = raiser.tracksCombat;
    if (!aggro) {
      cancelRaiseCast(world, raiser);
      setCounter(state, SESSION_KEY, 0);
      continue;
    }

    if (getCounter(state, SESSION_KEY) !== aggro.sinceMs) {
      setCounter(state, SESSION_KEY, aggro.sinceMs);
      setCounter(state, NEXT_RAISE_KEY, now + (spec.initialDelayMs ?? spec.intervalMs));
      cancelRaiseCast(world, raiser);
      continue;
    }

    const castEndsAt = getCounter(state, CAST_ENDS_KEY);
    if (castEndsAt > 0) {
      if (
        isMonsterStunned(world, raiser.isMonster.id) ||
        isMonsterFrozen(world, raiser.isMonster.id)
      ) {
        cancelRaiseCast(world, raiser);
        continue;
      }
      if (now < castEndsAt) continue;

      releaseRaiseCast(world, raiser);
      const maxAlive = spec.maxAlive + (raiser.scriptsBoss?.raiseMaxAliveAdd ?? 0);
      const corpse = countRaisedBy(world, raiser) < maxAlive
        ? takeNearestCorpse(
            world,
            raiser.hasPosition.nodeId,
            raiser.hasPosition.current,
            spec.corpseRange,
          )
        : null;
      const fired = corpse ? raiseCorpse(world, raiser, corpse, spec, now) : false;
      world.pushEvent(raiser.hasPosition.nodeId, {
        kind: 'monster-cast-end',
        monsterId: raiser.isMonster.id,
        fired,
        fx: spec.castFx,
      });
      continue;
    }

    if (now < getCounter(state, NEXT_RAISE_KEY)) continue;

    const maxAlive = spec.maxAlive + (raiser.scriptsBoss?.raiseMaxAliveAdd ?? 0);
    if (
      countRaisedBy(world, raiser) >= maxAlive ||
      !hasCorpseInRange(world, raiser, spec.corpseRange)
    ) {
      setCounter(state, NEXT_RAISE_KEY, now + spec.intervalMs);
      continue;
    }

    if ((spec.castMs ?? 0) > 0) {
      if (
        !raiser.cannotAttack &&
        !raiser.scriptsBoss?.scriptedCast &&
        chargedCastEndsAt(raiser) <= 0 &&
        !isMonsterStunned(world, raiser.isMonster.id) &&
        !isMonsterFrozen(world, raiser.isMonster.id)
      ) {
        beginRaiseCast(world, raiser, spec, now);
        setCounter(state, NEXT_RAISE_KEY, now + spec.intervalMs);
      }
      continue;
    }
    setCounter(state, NEXT_RAISE_KEY, now + spec.intervalMs);
    const corpse = takeNearestCorpse(
      world,
      raiser.hasPosition.nodeId,
      raiser.hasPosition.current,
      spec.corpseRange,
    );
    if (!corpse) continue;
    raiseCorpse(world, raiser, corpse, spec, now);
  }
}

/**
 * The raiser died: everything it pulled up crumbles. Removed, never killed, so
 * the sweep cannot become a reward path. This is the ONLY remaining mass-removal
 * on death: the pack-alpha scatter was deleted in the T1-T4 monster rework, and
 * risen mobs are the one case where it is still correct (they were never the
 * player's kills to begin with).
 */
export function onRaiserDead(world: World, raiser: MonsterEntity): void {
  if (!MONSTER_DATABASE.get(raiser.isMonster.monsterTypeId)?.raisesDead) return;
  const raiserId = raiser.isMonster.id;
  const toRemove: string[] = [];
  for (const monster of world.monsterEntitiesInNode(raiser.hasPosition.nodeId)) {
    if (monster.isRaised?.raiserId === raiserId) toRemove.push(monster.isMonster.id);
  }
  for (const id of toRemove) {
    if (world.hasMonster(id)) world.removeMonsterEntity(id);
  }
}
