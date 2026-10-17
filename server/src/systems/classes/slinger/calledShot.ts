/**
 * Trickshot's called shot (bible §10.5): the last round flies to a target a free rule picks,
 * anywhere in range. The rule is the Loadout's `calledShot` condition list read in order
 * ("the enemy winding up", "the elite", "the lowest HP"); with no rule set, that is the default
 * order (§10.13). Each condition names a kind of target rather than a state of the one already
 * targeted, so this reads them per candidate.
 */
import { MONSTER_DATABASE, type ConditionRef } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { isMonsterThreatening } from '../../combat/ai/guardableThreats';
import { isConcealedEntity, isInvulnerableMonster } from '../../combat/invulnerability';

/** The default pick order when the player set no rule (§10.13). */
const DEFAULT_ORDER: readonly string[] = ['enemy-winds-up', 'target-elite', 'target-low'];

const isElite = (monster: MonsterEntity): boolean =>
  monster.isMonster.isBoss === true || MONSTER_DATABASE.get(monster.isMonster.monsterTypeId)?.elite === true;

const hpShare = (monster: MonsterEntity): number => monster.hasHealth.hp / Math.max(1, monster.hasHealth.maxHp);

/** Everything the called shot could fly to: alive, in reach, targetable. */
function candidatesFor(world: World, player: PlayerEntity, exclude?: ReadonlySet<string>): MonsterEntity[] {
  const reach = player.performsAttack.attackRange;
  const candidates: MonsterEntity[] = [];
  for (const monster of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    if (monster.hasHealth.hp <= 0 || isConcealedEntity(monster) || isInvulnerableMonster(monster)) continue;
    if (exclude?.has(monster.isMonster.id)) continue;
    if (!world.collision.canReach(player, monster, reach)) continue;
    candidates.push(monster);
  }
  return candidates;
}

const orderOf = (rule: readonly ConditionRef[] | undefined): readonly string[] =>
  rule && rule.length > 0 ? rule.filter((ref) => !ref.not).map((ref) => ref.id as string) : DEFAULT_ORDER;

/** The monster the called shot should fly to, or null when no rule finds one in reach. `exclude`: bodies already hit (Ricochet). */
export function pickCalledTarget(
  world: World,
  player: PlayerEntity,
  rule: readonly ConditionRef[] | undefined,
  now: number,
  exclude?: ReadonlySet<string>,
): MonsterEntity | null {
  const candidates = candidatesFor(world, player, exclude);
  if (candidates.length === 0) return null;

  for (const id of orderOf(rule)) {
    if (id === 'enemy-winds-up') {
      const winding = candidates.find((monster) => isMonsterThreatening(world, monster, now));
      if (winding) return winding;
    } else if (id === 'target-elite') {
      const elite = candidates.find(isElite);
      if (elite) return elite;
    } else if (id === 'target-low') {
      return candidates.reduce((lowest, monster) => (hpShare(monster) < hpShare(lowest) ? monster : lowest));
    }
  }
  return null;
}

/**
 * Deadeye's moment (bible §10.6): the rule's moment has come for the last round. An enemy winds up, an
 * elite is in reach, or the attack target has dropped below a third of its health (`lowHp`).
 */
export function calledMomentHolds(
  world: World,
  player: PlayerEntity,
  rule: readonly ConditionRef[] | undefined,
  lowHp: number,
  now: number,
): boolean {
  const candidates = candidatesFor(world, player);
  const current = player.hasAttackTarget ? world.getMonsterEntity(player.hasAttackTarget.targetId) : undefined;
  for (const id of orderOf(rule)) {
    if (id === 'enemy-winds-up' && candidates.some((monster) => isMonsterThreatening(world, monster, now))) return true;
    if (id === 'target-elite' && candidates.some(isElite)) return true;
    if (id === 'target-low' && current && hpShare(current) < lowHp) return true;
  }
  return false;
}
