/**
 * Minion spawn / despawn helpers for the summoner archetype.
 *
 * Slimes are full miniplex entities with their own combat state. They are
 * attributed to a player owner via `IsMinion.ownerPlayerId`, and damage
 * routed through the player so all player modifiers (cadence, energy, dot,
 * weapon effects) apply naturally.
 */
import {
  FALLBACK_MONSTER_AABB,
  initIsMinion,
  makeTracksCombat,
  type MinionMonsterType,
  type PassiveKey,
  type Vec2,
} from '@mmo-idle/shared';
import type { World } from '../../../../world/World';
import type { MinionEntity, PlayerEntity, ServerEntity } from '../../../../ecs/entity';
import { initControlsMinion } from './controlsMinion';
import { resolveMonsterHitbox } from '../../../../hitbox/resolve';
import { detachComponent } from '../../../../ecs/markerHelpers';

const MINION_BASE_HP_MIN = 10;
const FOLLOW_RADIUS = 44;

/**
 * Per-slot follow offsets — slimes orbit the player in an even ring. Slot 0
 * stays directly south, preserving the original three-slime triangle.
 */
export function getFollowOffset(slot: number, totalCount: number): Vec2 {
  const count = Math.max(1, totalCount);
  const angle = Math.PI / 2 + (slot / count) * Math.PI * 2;
  return {
    x: Math.round(Math.cos(angle) * FOLLOW_RADIUS),
    y: Math.round(Math.sin(angle) * FOLLOW_RADIUS),
  };
}

/** Returns the desired idle position for `slot` around `owner`. */
export function getMinionIdlePos(owner: PlayerEntity, slot: number): Vec2 {
  const off = getFollowOffset(slot, owner.summonsMinions?.targetCount ?? 1);
  return {
    x: owner.hasPosition.current.x + off.x,
    y: owner.hasPosition.current.y + off.y,
  };
}

export function computeMinionSpeed(owner: PlayerEntity): number {
  const speedMult = owner.usesSkills.passives['summoner.minion-speed-mult'] ?? 1.0;
  return Math.max(180, Math.round((owner.hasPosition.speed + 40) * speedMult));
}

export function computeMinionSizeMult(owner: PlayerEntity): number {
  return Math.max(0.1, owner.usesSkills.passives['summoner.minion-size-mult'] ?? 1.0);
}

const MINION_TYPE_PASSIVE_MAP: Array<[PassiveKey, MinionMonsterType]> = [
  ['summoner.minion-as-cave-lurker',       'cave-lurker'],
  ['summoner.minion-as-plains-slime',      'plains-slime'],
  ['summoner.minion-as-boar',              'boar'],
  ['summoner.minion-as-mud-toad',          'mud-toad'],
  ['summoner.minion-as-cliff-hopper',      'cliff-hopper'],
  ['summoner.minion-as-ridge-archer',      'ridge-archer'],
  ['summoner.minion-as-mountain-sentinel', 'mountain-sentinel'],
];

/** Resolves which creature sprite/hitbox to use from unlocked T3 passives. */
export function resolveMinionType(owner: PlayerEntity): MinionMonsterType {
  const passives = owner.usesSkills.passives;
  for (const [key, type] of MINION_TYPE_PASSIVE_MAP) {
    if (passives[key]) return type;
  }
  return 'slime';
}

export function spawnMinionForOwner(
  world: World,
  owner: PlayerEntity,
  slot: number,
): MinionEntity | null {
  if (!owner.summonsMinions) return null;
  if (slot < 0 || slot >= owner.summonsMinions.targetCount) return null;

  const passives = owner.usesSkills.passives;
  const damagePct  = passives['summoner.minion-damage-pct']      ?? 1.0;
  const hpPct      = passives['summoner.minion-hp-pct']          ?? 0.40;
  const attackRange = Math.max(8, Math.round(passives['summoner.minion-range'] ?? 12));
  const attackCooldown = Math.max(200, Math.round(passives['summoner.minion-attack-cooldown'] ?? 1000));
  const sizeMult = computeMinionSizeMult(owner);
  const monsterTypeId = resolveMinionType(owner);

  const maxHp = Math.max(MINION_BASE_HP_MIN, Math.round(owner.hasHealth.maxHp * hpPct));
  const attack = Math.max(1, Math.round(owner.dealsDamage.attack * damagePct));

  const id = world.allocMinionId(owner.isPlayer.id);
  const spawnPos = getMinionIdlePos(owner, slot);
  const followOffset = getFollowOffset(slot, owner.summonsMinions.targetCount);

  const entity: MinionEntity = {
    entityId: id,
    isMinion: initIsMinion({
      id,
      ownerPlayerId: owner.isPlayer.id,
      slot,
      sizeMult,
      monsterTypeId,
    }),
    controlsMinion: (() => {
      const cm = initControlsMinion({
        ownerPlayerId: owner.isPlayer.id,
        followOffset,
      });
      if (monsterTypeId === 'cave-lurker' && passives['summoner.acid-brood']) {
        cm.lifetimeRemainingMs = Math.round(
          passives['summoner.acid-lurker-lifetime-ms'] ?? 12_000,
        );
      }
      return cm;
    })(),
    hasPosition: {
      current: spawnPos,
      nodeId:  owner.hasPosition.nodeId,
      speed:   computeMinionSpeed(owner),
    },
    hasHitbox: resolveMonsterHitbox(monsterTypeId, false) ?? { rects: [FALLBACK_MONSTER_AABB] },
    hasHealth: {
      hp: maxHp,
      maxHp,
    },
    dealsDamage: {
      attack,
      onHitDamage: 0,
      attackStyle: 'impact',
    },
    performsAttack: {
      attackRange,
      attackCooldown,
      lastAttackAt: 0,
    },
    mitigatesDamage: {
      plating: 0,
      damageReduction: 0,
    },
    tracksCombat: makeTracksCombat(),
    hasStatus: {},
  };
  world.ecs.add(entity);

  owner.summonsMinions.minionIds[slot] = id;
  owner.summonsMinions.respawnTimers[slot] = 0;
  return entity;
}

/**
 * Drop a single minion. Clears the slot mapping on the owner so the summoner
 * tick can begin a respawn timer if appropriate, and drops aggro from any
 * monster currently fixated on this minion.
 */
export function despawnMinion(world: World, minion: MinionEntity): void {
  const ownerId = minion.isMinion.ownerPlayerId;
  const slot    = minion.isMinion.slot;
  const owner   = world.getPlayerEntity(ownerId);
  if (owner?.summonsMinions) {
    if (owner.summonsMinions.minionIds[slot] === minion.isMinion.id) {
      owner.summonsMinions.minionIds[slot] = '';
    }
  }
  dropMonsterAggroOnMinion(world, minion.isMinion.id);
  world.removeMinionEntity(minion.isMinion.id);
}

function dropMonsterAggroOnMinion(world: World, minionId: string): void {
  for (const m of world.aggroedMonsters) {
    if (m.hasAggroTarget.targetKind === 'minion' && m.hasAggroTarget.targetId === minionId) {
      detachComponent(world, m, 'hasAggroTarget');
      m.controlsMonster.chargeRemainingMs = 0;
    }
  }
}

/**
 * Despawn every minion currently bound to `owner`. Safe to call when the player
 * is being detached, transitioning nodes, respawning, or changing archetype.
 */
export function despawnMinionsForOwner(world: World, owner: PlayerEntity | ServerEntity): void {
  if (!owner.isPlayer) return;
  const ownerId = owner.isPlayer.id;
  const toRemove: string[] = [];
  for (const m of world.minionEntities) {
    if (m.isMinion.ownerPlayerId === ownerId) toRemove.push(m.isMinion.id);
  }
  for (const id of toRemove) {
    dropMonsterAggroOnMinion(world, id);
    world.removeMinionEntity(id);
  }
  if (owner.summonsMinions) {
    owner.summonsMinions.minionIds.fill('');
    owner.summonsMinions.respawnTimers.fill(0);
  }
}
