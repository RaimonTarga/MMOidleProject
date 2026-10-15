/**
 * The Conduit's free formation-wide orders (class-first build plan CD.3; bible §7.3): what to
 * attack first, who the tanks guard, when to Recall, which role rebuilds first. They live in the
 * Formation config (`FormationOrders`); this module turns them into target choices, a Recall
 * flag and a rebuild order.
 */
import {
  CONDUIT_KIT,
  MONSTER_DATABASE,
  distanceSq,
  getFlag,
  setFlag,
  type FormationOrders,
} from '@mmo-idle/shared';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { heatAllowsTarget } from '../../../combat/ai/heatManagement';
import { conditionsHold } from '../../../combat/moments/moments';

export function ordersOf(owner: PlayerEntity): FormationOrders | null {
  const system = owner.configuresClass?.config.system;
  return system?.kind === 'formation' ? system.orders : null;
}

// ── Recall ───────────────────────────────────────────────────────────────────

/** Set while the owner's Recall rule holds; `isSummonerRecalling` reads it like the rune flag. */
export const FORMATION_RECALL_FLAG = 'formation.recall';

/** Refresh the Recall flag from the rule (every condition must hold; an empty rule never recalls). */
export function syncFormationRecall(world: World, owner: PlayerEntity, now: number): void {
  const orders = ordersOf(owner);
  const fires = !!orders && orders.recallWhen.length > 0 && conditionsHold(world, owner, orders.recallWhen, now);
  if (getFlag(owner.tracksCombat, FORMATION_RECALL_FLAG) !== fires) setFlag(owner.tracksCombat, FORMATION_RECALL_FLAG, fires);
}

// ── What to attack first ─────────────────────────────────────────────────────

const aggroedOnOwner = (monster: MonsterEntity, owner: PlayerEntity): boolean =>
  monster.hasAggroTarget?.targetKind === 'player' && monster.hasAggroTarget.targetId === owner.isPlayer.id;

function aggroedOnABackRow(world: World, monster: MonsterEntity, owner: PlayerEntity): boolean {
  if (monster.hasAggroTarget?.targetKind !== 'minion') return false;
  const minion = world.getMinionEntity(monster.hasAggroTarget.targetId);
  return !!minion && minion.isMinion.ownerPlayerId === owner.isPlayer.id && pieceOf(minion)?.row !== 'front';
}

function pieceOf(minion: MinionEntity) {
  const id = minion.isMinion.slotId.split('#')[0];
  return CONDUIT_KIT.pieces.find((piece) => piece.id === id);
}

/**
 * The monster this summon should fight under the orders, or undefined when the Conduit has none
 * (the old targeting then applies). Null means nothing in leash. Sticky: a valid current target
 * is kept, so a falling HP total or a changing aggro never flips a body between enemies.
 */
export function orderedTarget(
  world: World,
  owner: PlayerEntity,
  minion: MinionEntity,
  leashRadius: number,
): MonsterEntity | null | undefined {
  const orders = ordersOf(owner);
  if (!orders) return undefined;
  const leashSq = leashRadius * leashRadius;
  const candidates: MonsterEntity[] = [];
  for (const monster of world.monsterEntitiesInNode(owner.hasPosition.nodeId)) {
    if (monster.hasHealth.hp <= 0 || monster.isInvulnerable) continue;
    if (!heatAllowsTarget(world, owner, monster)) continue;
    if (distanceSq(monster.hasPosition.current, owner.hasPosition.current) > leashSq) continue;
    candidates.push(monster);
  }
  if (candidates.length === 0) return null;

  const currentId = minion.controlsMinion.currentTargetId;
  const current = currentId ? candidates.find((monster) => monster.isMonster.id === currentId) : undefined;
  if (current) return current;

  const nearest = (pool: MonsterEntity[]): MonsterEntity =>
    pool.reduce((best, monster) =>
      distanceSq(monster.hasPosition.current, minion.hasPosition.current) < distanceSq(best.hasPosition.current, minion.hasPosition.current)
        ? monster : best);

  // Tanks guard first: whoever is hitting the Conduit (or the back rows) is theirs.
  if (pieceOf(minion)?.family === 'tank') {
    const guarded = candidates.filter((monster) => orders.tanksGuard === 'conduit'
      ? aggroedOnOwner(monster, owner)
      : aggroedOnABackRow(world, monster, owner));
    if (guarded.length > 0) return nearest(guarded);
  }

  switch (orders.attackFirst) {
    case 'attacking-me': {
      const attacking = candidates.filter((monster) => aggroedOnOwner(monster, owner));
      return nearest(attacking.length > 0 ? attacking : candidates);
    }
    case 'weakest':
      return candidates.reduce((best, monster) => (monster.hasHealth.hp < best.hasHealth.hp ? monster : best));
    case 'elites': {
      const elites = candidates.filter((monster) =>
        MONSTER_DATABASE.get(monster.isMonster.monsterTypeId)?.elite === true || monster.isMonster.isBoss === true);
      return nearest(elites.length > 0 ? elites : candidates);
    }
    case 'closest':
    default:
      return nearest(candidates);
  }
}

// ── Rebuild order ────────────────────────────────────────────────────────────

const RANK: Record<FormationOrders['rebuildFirst'], readonly string[]> = {
  tanks: ['tank', 'generic', 'damage', 'support'],
  damage: ['damage', 'generic', 'tank', 'support'],
  supports: ['support', 'generic', 'tank', 'damage'],
  'as-fallen': [],
};

/** Where a fallen slot sits in the rebuild queue: lower rebuilds sooner. As-fallen is one rank for all. */
export function rebuildRank(owner: PlayerEntity, slotId: string): number {
  const orders = ordersOf(owner);
  if (!orders || orders.rebuildFirst === 'as-fallen') return 0;
  const family = CONDUIT_KIT.pieces.find((piece) => piece.id === slotId.split('#')[0])?.family ?? 'generic';
  const index = RANK[orders.rebuildFirst].indexOf(family);
  return index < 0 ? RANK[orders.rebuildFirst].length : index;
}
