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
  MINION_BASE_DISPLAY_SIZE,
  resolveMonsterFrame,
  SUMMON_ATTACK_STYLE,
  type MinionMonsterType,
  type PassiveKey,
  type Vec2,
} from '@mmo-idle/shared';
import type { World } from '../../../../world/World';
import type { MinionEntity, PlayerEntity, ServerEntity } from '../../../../ecs/entity';
import { initControlsMinion } from './controlsMinion';
import { resolveMinionHitbox, syncEntityHitbox } from '../../../../hitbox/resolve';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import { attachComponent, detachComponent } from '../../../../ecs/markerHelpers';
import { setAttackTarget } from '../../../combat/ai/targeting';
import { stopEntity } from '../../../world/movement';
import { summonerProfileFor } from './profile';

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
  const profile = summonerProfileFor(owner);
  const speedMult = owner.usesSkills.passives['summoner.minion-speed-mult'] ?? 1.0;
  return Math.max(160, Math.round((owner.hasPosition.speed + 40) * speedMult * profile.summonMoveSpeedMult));
}

export function computeMinionSizeMult(owner: PlayerEntity, slot = 0): number {
  const profile = summonerProfileFor(owner);
  const slotProfile = profile.slots[slot] ?? profile.slots[0];
  return Math.max(0.1, slotProfile.sizeMult * (owner.usesSkills.passives['summoner.minion-size-mult'] ?? 1.0));
}

/** Owner HP pool (× hpPct passive) split evenly across all minion slots. */
export function computeMinionMaxHp(owner: PlayerEntity, slot = 0): number {
  const profile = summonerProfileFor(owner);
  const slotProfile = profile.slots[slot] ?? profile.slots[0];
  const legacyHpMult = owner.usesSkills.passives['summoner.minion-hp-pct'] ?? 1.0;
  return Math.max(
    MINION_BASE_HP_MIN,
    Math.round(owner.hasHealth.maxHp * profile.totalSummonHpPct * slotProfile.defenseWeight * legacyHpMult),
  );
}

export function syncMinionMaxHp(
  world: World,
  minion: MinionEntity,
  desiredMaxHp: number,
): void {
  if (minion.hasHealth.maxHp === desiredMaxHp) return;
  const prevMax = minion.hasHealth.maxHp;
  const ratio = prevMax > 0 ? minion.hasHealth.hp / prevMax : 1;
  minion.hasHealth.maxHp = desiredMaxHp;
  minion.hasHealth.hp = Math.min(
    desiredMaxHp,
    Math.max(minion.hasHealth.hp > 0 ? 1 : 0, Math.round(desiredMaxHp * ratio)),
  );
  markSliceDirty(world, minion, 'hasHealth');
}

export function syncMinionHitbox(world: World, minion: MinionEntity, sizeMult: number): void {
  const typeId = minion.isMinion.monsterTypeId;
  const frame = resolveMonsterFrame(typeId);
  const mult = Math.max(0.1, sizeMult);
  const displaySize = MINION_BASE_DISPLAY_SIZE * mult;
  syncEntityHitbox(world, minion, {
    frameName: frame,
    displayW: displaySize,
    displayH: displaySize,
    fallback: FALLBACK_MONSTER_AABB,
  });
}

/**
 * Resolves which sprite/hitbox a summon uses. Every slot shares the Conduit's
 * conjured body; frame and specialization currently read through `sizeMult`
 * alone. Per-frame and per-spec bodies are phase 7 of
 * `docs/summoner-flavor-pass-plan.md`.
 */
export function resolveMinionType(_owner: PlayerEntity, _slot = 0): MinionMonsterType {
  return 'conduit-summon';
}

export function spawnMinionForOwner(
  world: World,
  owner: PlayerEntity,
  slot: number,
): MinionEntity | null {
  if (!owner.summonsMinions) return null;
  if (slot < 0 || slot >= owner.summonsMinions.targetCount) return null;

  const passives = owner.usesSkills.passives;
  const profile = summonerProfileFor(owner);
  const slotProfile = profile.slots[slot] ?? profile.slots[0];
  const damagePct = passives['summoner.minion-damage-pct'] ?? 1.0;
  const attackRange = profile.attackRange;
  const attackCooldown = Math.max(
    100,
    Math.round(owner.performsAttack.attackCooldown * profile.summonAttackCooldownMult),
  );
  const sizeMult = computeMinionSizeMult(owner, slot);
  const monsterTypeId = resolveMinionType(owner, slot);
  // Range is legible from what the summons throw: Harrier snaps a short beam,
  // Procession lobs a fast red bolt, Vigil lands a melee thump.
  const attackStyle = SUMMON_ATTACK_STYLE[profile.attackMode];

  const maxHp = computeMinionMaxHp(owner, slot);
  const attack = Math.max(1, Math.round(
    owner.dealsDamage.attack * damagePct * profile.formationOffenseMult * slotProfile.offenseWeight,
  ));

  const id = world.allocMinionId(owner.isPlayer.id);
  const minionHitbox = resolveMinionHitbox(monsterTypeId, sizeMult);
  const spawnPos = getMinionIdlePos(owner, slot);
  const followOffset = getFollowOffset(slot, owner.summonsMinions.targetCount);

  const entity: MinionEntity = {
    entityId: id,
    isMinion: initIsMinion({
      id,
      ownerPlayerId: owner.isPlayer.id,
      slot,
      slotId: slotProfile.slotId,
      role: slotProfile.role,
      sizeMult,
      monsterTypeId,
    }),
    controlsMinion: initControlsMinion({
      ownerPlayerId: owner.isPlayer.id,
      followOffset,
    }),
    hasPosition: {
      current: spawnPos,
      nodeId:  owner.hasPosition.nodeId,
      speed:   computeMinionSpeed(owner),
    },
    hasHitbox: minionHitbox,
    hasHealth: {
      hp: maxHp,
      maxHp,
      hpRegen: owner.hasHealth.hpRegen,
    },
    dealsDamage: {
      attack,
      onHitDamage: 0,
      attackStyle,
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
 * Move live minions into the owner's current node and restage them nearby.
 * Preserves HP and slot bindings — used on gate transitions so summons survive
 * map changes without triggering respawn timers.
 */
export function relocateMinionsForOwner(world: World, owner: PlayerEntity): void {
  if (!owner.summonsMinions) return;
  const nodeId = owner.hasPosition.nodeId;

  for (const id of owner.summonsMinions.minionIds) {
    if (!id) continue;
    const minion = world.getMinionEntity(id);
    if (!minion || minion.hasHealth.hp <= 0) continue;

    minion.hasPosition.nodeId = nodeId;
    minion.hasPosition.current = getMinionIdlePos(owner, minion.isMinion.slot);

    stopEntity(world, minion);
    setAttackTarget(world, minion, null);
    minion.controlsMinion.currentTargetId = null;
    markSliceDirty(world, minion, 'hasPosition');
  }
}

/**
 * Despawn every minion currently bound to `owner`. Safe to call when the player
 * is being detached, respawning, or changing archetype.
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
