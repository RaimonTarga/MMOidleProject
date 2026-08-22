import {
  MONSTER_DATABASE,
  getCounter,
  setCounter,
  type MonsterRaisesDead,
} from '@mmo-idle/shared';
import type { MonsterEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { attachComponent } from '../../../ecs/markerHelpers';
import { mutateSlice } from '../../../ecs/dirtyHelpers';
import { takeNearestCorpse, type RuntimeCorpse } from '../../world/corpses';
import { setAggroTarget, setAttackTarget } from './targeting';

const SESSION_KEY = 'raiseDeadSession';
const NEXT_RAISE_KEY = 'raiseDeadNextAt';

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
      setCounter(state, SESSION_KEY, 0);
      continue;
    }

    if (getCounter(state, SESSION_KEY) !== aggro.sinceMs) {
      setCounter(state, SESSION_KEY, aggro.sinceMs);
      setCounter(state, NEXT_RAISE_KEY, now + (spec.initialDelayMs ?? spec.intervalMs));
      continue;
    }
    if (now < getCounter(state, NEXT_RAISE_KEY)) continue;
    setCounter(state, NEXT_RAISE_KEY, now + spec.intervalMs);

    if (countRaisedBy(world, raiser) >= spec.maxAlive) continue;
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
