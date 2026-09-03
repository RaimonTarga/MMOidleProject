import {
  applyStatusEffect,
  type DamageMitigationBreakdown,
  DAMAGE_TAKEN_PCT_KEY,
  distanceSq,
  SUNDERED_EFFECT_ID,
  type DeathKiller,
  type GroundZoneView,
  type Vec2,
} from '@mmo-idle/shared';
import type { World } from '../../world/World';
import { markSliceDirty } from '../../ecs/dirtyHelpers';
import { isInvulnerablePlayer } from '../combat/invulnerability';
import { recordWorldLogEvent } from '../../world/worldLog';
import { actorFromPlayer } from '../../world/worldLogActors';
import { buildSimpleBreakdown, recordPlayerDamaged } from '../../world/worldLogCombat';

export interface GroundZoneSemantics {
  disposition: 'hostile-to-player' | 'friendly-to-player' | 'neutral';
  persistence: 'telegraph' | 'persistent';
  movementResponse: 'step-back' | 'avoid-hazards' | 'none';
}

interface RuntimeGroundZoneBase {
  id: string;
  pos: Vec2;
  radius: number;
  startedAtMs: number;
  semantics: GroundZoneSemantics;
}

export interface RuntimeSlamTelegraph extends RuntimeGroundZoneBase {
  kind: 'slam-telegraph';
  resolvesAtMs: number;
  /** Owning monster; every cast-abort path clears its telegraph by this id. */
  ownerId: string;
  /** Optional ability cue used by the client to distinguish elite telegraphs. */
  fx?: string;
}

export interface RuntimeToxicPool extends RuntimeGroundZoneBase {
  kind: 'toxic-pool';
  expiresAtMs: number;
  damagePerTick: number;
  tickIntervalMs: number;
  slowSpeedMult?: number;
  vulnerability?: { damageTakenPct: number; durationMs: number };
  ownerId?: string;
  detonationMultiplier?: number;
  /** Stable mechanic attribution (for example `bile-pool`), not the runtime id. */
  sourceId: string;
  sourceLabel: string;
  tickTimersByPlayerId: Map<string, number>;
  contactsByPlayerId: Map<string, RuntimeHazardContact>;
  killer: DeathKiller;
}

interface RuntimeHazardContact {
  enteredAtMs: number;
  damageReceived: number;
  harmfulEffects: Set<string>;
}

export interface RuntimeFaultLineBurst extends RuntimeGroundZoneBase {
  kind: 'fault-line-telegraph';
  ownerId: string;
  resolvesAtMs: number;
  points: Vec2[];
  damageMultiplier: number;
}

/** Node-scoped, runtime-only circles. Never persisted or rebuilt on thaw. */
export type RuntimeGroundZone =
  | RuntimeSlamTelegraph
  | RuntimeToxicPool
  | RuntimeFaultLineBurst;

export type DelayedGroundZoneImpact =
  | RuntimeToxicPool
  | RuntimeFaultLineBurst;

function zonesFor(world: World, nodeId: string): RuntimeGroundZone[] {
  let list = world.groundZones.get(nodeId);
  if (!list) {
    list = [];
    world.groundZones.set(nodeId, list);
  }
  return list;
}

/** Publish a cosmetic cast telegraph. The owning combat state resolves damage. */
export function publishGroundZone(
  world: World,
  nodeId: string,
  zone: Omit<RuntimeSlamTelegraph, 'id' | 'semantics'>,
): RuntimeSlamTelegraph {
  clearGroundZonesByOwner(world, nodeId, zone.ownerId);
  const published: RuntimeSlamTelegraph = {
    ...zone,
    id: `gz-${nodeId}-${world.groundZoneSeq++}`,
    semantics: {
      disposition: 'hostile-to-player',
      persistence: 'telegraph',
      movementResponse: 'step-back',
    },
  };
  zonesFor(world, nodeId).push(published);
  return published;
}

/**
 * Publish a persistent hazard. It outlives its own cast, and with no `ownerId`
 * it outlives its maker too (corpse pools). Pass `ownerId` to bind the pool to
 * the monster: `clearToxicPoolsByOwner` then retires it on that monster's death
 * or despawn, which is what keeps minutes-long boss pools from surviving the boss.
 */
export function publishToxicPool(
  world: World,
  nodeId: string,
  zone: Omit<RuntimeToxicPool, 'id' | 'tickTimersByPlayerId' | 'contactsByPlayerId' | 'semantics' | 'sourceId' | 'sourceLabel'> & {
    semantics?: GroundZoneSemantics;
    sourceId?: string;
    sourceLabel?: string;
  },
): RuntimeToxicPool {
  const { semantics, sourceId, sourceLabel, ...rest } = zone;
  const published: RuntimeToxicPool = {
    ...rest,
    id: `gz-${nodeId}-${world.groundZoneSeq++}`,
    tickTimersByPlayerId: new Map(),
    contactsByPlayerId: new Map(),
    sourceId: sourceId ?? 'toxic-pool',
    sourceLabel: sourceLabel ?? 'Toxic Pool',
    semantics: semantics ?? {
      disposition: 'hostile-to-player',
      persistence: 'persistent',
      movementResponse: 'avoid-hazards',
    },
  };
  zonesFor(world, nodeId).push(published);
  return published;
}

/** Publish a linked-circle radial pattern that resolves as one delayed hit. */
export function publishFaultLineBurst(
  world: World,
  nodeId: string,
  zone: Omit<RuntimeFaultLineBurst, 'id' | 'semantics'>,
): RuntimeFaultLineBurst {
  const published: RuntimeFaultLineBurst = {
    ...zone,
    id: `gz-${nodeId}-${world.groundZoneSeq++}`,
    semantics: {
      disposition: 'hostile-to-player',
      persistence: 'telegraph',
      movementResponse: 'step-back',
    },
  };
  zonesFor(world, nodeId).push(published);
  return published;
}

/** Drop telegraphs owned by a monster; persistent pools are unaffected (see
 * `clearToxicPoolsByOwner` for the death/despawn path that does retire them). */
export function clearGroundZonesByOwner(
  world: World,
  nodeId: string,
  ownerId: string,
): void {
  const list = world.groundZones.get(nodeId);
  if (!list) return;
  const kept = list.filter(zone =>
    zone.kind === 'toxic-pool' || zone.ownerId !== ownerId,
  );
  if (kept.length === list.length) return;
  if (kept.length === 0) world.groundZones.delete(nodeId);
  else world.groundZones.set(nodeId, kept);
}

/**
 * Drop the persistent hazards a monster made when that monster leaves the world.
 *
 * Long-lived pools (the swamp lineage runs 10 minutes) must not outlive the boss
 * that spawned them, or a cleared arena stays lethal for the next fight. Pools
 * published WITHOUT an `ownerId` — corpse hazards from `onDeath.spawnHazard`, for
 * instance — are deliberately untouched: those are the maker's parting gift and
 * are authored to be expiry-owned.
 */
export function clearToxicPoolsByOwner(
  world: World,
  nodeId: string,
  ownerId: string,
): void {
  const list = world.groundZones.get(nodeId);
  if (!list) return;
  const now = Date.now();
  const kept = list.filter(zone => {
    if (zone.kind !== 'toxic-pool' || zone.ownerId !== ownerId) return true;
    closeAllHazardContacts(world, nodeId, zone, now, 'node-cleared');
    return false;
  });
  if (kept.length === list.length) return;
  if (kept.length === 0) world.groundZones.delete(nodeId);
  else world.groundZones.set(nodeId, kept);
}

/** Drop every runtime circle in a node on freeze. */
export function clearGroundZonesForNode(world: World, nodeId: string): void {
  const now = Date.now();
  for (const zone of world.groundZones.get(nodeId) ?? []) {
    if (zone.kind === 'toxic-pool') closeAllHazardContacts(world, nodeId, zone, now, 'node-cleared');
  }
  world.groundZones.delete(nodeId);
}

const RESOLVE_GRACE_MS = 250;
const HAZARD_SLOW_REFRESH_MS = 1_200;

/**
 * Generic semantic classifier for persistent runtime terrain. A zone must opt in
 * to Avoid Hazards and actually carry a harmful payload. Telegraphs therefore
 * remain Step Back's responsibility, while future friendly/cosmetic/unavoidable
 * zones can share the runtime schema without being treated as blockers.
 */
export function isAvoidableHostilePersistentGroundZone(
  zone: RuntimeGroundZone,
  now: number,
): zone is RuntimeToxicPool {
  if (zone.kind !== 'toxic-pool' || now >= zone.expiresAtMs) return false;
  if (zone.semantics.disposition !== 'hostile-to-player') return false;
  if (zone.semantics.persistence !== 'persistent') return false;
  if (zone.semantics.movementResponse !== 'avoid-hazards') return false;
  return (
    zone.damagePerTick > 0 ||
    (zone.slowSpeedMult !== undefined && zone.slowSpeedMult < 1) ||
    (zone.vulnerability?.damageTakenPct ?? 0) > 0
  );
}

export function activeAvoidablePersistentGroundZones(
  world: World,
  nodeId: string,
  now: number,
): RuntimeToxicPool[] {
  return (world.groundZones.get(nodeId) ?? []).filter((zone): zone is RuntimeToxicPool =>
    isAvoidableHostilePersistentGroundZone(zone, now),
  );
}

export function pointInsideGroundZone(zone: RuntimeToxicPool, point: Vec2): boolean {
  return distanceSq(point, zone.pos) <= zone.radius * zone.radius;
}

function recordHazardContact(
  world: World,
  nodeId: string,
  pool: RuntimeToxicPool,
  playerId: string,
  phase: 'enter' | 'leave',
  contact?: RuntimeHazardContact,
  now = Date.now(),
  endReason?: 'exited' | 'expired' | 'death' | 'node-cleared',
): void {
  const player = world.getPlayerEntity(playerId);
  if (!player) return;
  recordWorldLogEvent(world, {
    kind: 'hazard-contact',
    nodeId,
    player: actorFromPlayer(player),
    hazardId: pool.id,
    hazardKind: pool.kind,
    sourceId: pool.sourceId,
    sourceName: pool.sourceLabel,
    phase,
    ...(contact
      ? {
          durationMs: Math.max(0, now - contact.enteredAtMs),
          damageReceived: contact.damageReceived,
          harmfulEffects: [...contact.harmfulEffects].sort(),
          endReason,
        }
      : {}),
  }, {
    visibility: 'combat',
    relatedPlayerIds: [playerId],
    nodeId,
  });
}

function closeHazardContact(
  world: World,
  nodeId: string,
  pool: RuntimeToxicPool,
  playerId: string,
  now: number,
  reason: 'exited' | 'expired' | 'death' | 'node-cleared',
): void {
  const contact = pool.contactsByPlayerId.get(playerId);
  if (!contact) return;
  pool.contactsByPlayerId.delete(playerId);
  pool.tickTimersByPlayerId.delete(playerId);
  recordHazardContact(world, nodeId, pool, playerId, 'leave', contact, now, reason);
}

function closeAllHazardContacts(
  world: World,
  nodeId: string,
  pool: RuntimeToxicPool,
  now: number,
  reason: 'expired' | 'node-cleared',
): void {
  for (const playerId of [...pool.contactsByPlayerId.keys()]) {
    closeHazardContact(world, nodeId, pool, playerId, now, reason);
  }
}

function hazardDamageSource(pool: RuntimeToxicPool) {
  return {
    id: `ground-zone:${pool.id}`,
    name: `${pool.killer.monsterName} — ${pool.sourceLabel}`,
    actorType: 'monster' as const,
  };
}

function tickToxicPool(
  world: World,
  nodeId: string,
  pool: RuntimeToxicPool,
  now: number,
): void {
  const radiusSq = pool.radius * pool.radius;
  const inside = new Set<string>();
  for (const player of world.livePlayersInNode(nodeId)) {
    if (distanceSq(player.hasPosition.current, pool.pos) > radiusSq) continue;
    inside.add(player.isPlayer.id);

    let contact = pool.contactsByPlayerId.get(player.isPlayer.id);
    if (!contact) {
      const harmfulEffects = new Set<string>();
      if (pool.slowSpeedMult !== undefined && pool.slowSpeedMult < 1) harmfulEffects.add('slow');
      if ((pool.vulnerability?.damageTakenPct ?? 0) > 0) harmfulEffects.add(SUNDERED_EFFECT_ID);
      contact = { enteredAtMs: now, damageReceived: 0, harmfulEffects };
      pool.contactsByPlayerId.set(player.isPlayer.id, contact);
      recordHazardContact(world, nodeId, pool, player.isPlayer.id, 'enter', contact, now);
    }

    if (pool.slowSpeedMult !== undefined && pool.slowSpeedMult < 1) {
      contact.harmfulEffects.add('slow');
      applyStatusEffect(player.tracksCombat, {
        id: 'slow',
        maxStacks: 1,
        remainingMs: HAZARD_SLOW_REFRESH_MS,
        refreshable: true,
        sourceId: `ground-zone:${pool.id}`,
        data: {
          speedMult: pool.slowSpeedMult,
          totalMs: HAZARD_SLOW_REFRESH_MS,
        },
      });
    }

    if (pool.vulnerability && pool.vulnerability.damageTakenPct > 0) {
      contact.harmfulEffects.add(SUNDERED_EFFECT_ID);
      applyStatusEffect(player.tracksCombat, {
        id: SUNDERED_EFFECT_ID,
        maxStacks: 1,
        remainingMs: pool.vulnerability.durationMs,
        refreshable: true,
        sourceId: `ground-zone:${pool.id}`,
        data: {
          [DAMAGE_TAKEN_PCT_KEY]: pool.vulnerability.damageTakenPct,
          totalMs: pool.vulnerability.durationMs,
        },
      });
    }

    if (pool.damagePerTick <= 0) continue;

    const nextAt = pool.tickTimersByPlayerId.get(player.isPlayer.id) ?? now;
    if (now < nextAt || isInvulnerablePlayer(player)) continue;
    pool.tickTimersByPlayerId.set(player.isPlayer.id, now + pool.tickIntervalMs);

    const dotResist = Math.min(
      0.9,
      Math.max(0, player.usesSkills.passives['defense.dot-resistance'] ?? 0),
    );
    const damage = Math.max(
      1,
      Math.round(
        pool.damagePerTick *
          (1 - player.mitigatesDamage.damageReduction) *
          (1 - dotResist),
      ),
    );
    const mitigation: DamageMitigationBreakdown = buildSimpleBreakdown(pool.damagePerTick, damage);
    recordPlayerDamaged(
      world,
      player,
      hazardDamageSource(pool),
      damage,
      0,
      'dot',
      mitigation,
      ['ground-zone', pool.kind, pool.sourceId],
    );
    contact.damageReceived += damage;
    player.hasHealth.hp -= damage;
    markSliceDirty(world, player, 'hasHealth');
    world.pushEvent(nodeId, {
      kind: 'dot-tick',
      targetId: player.isPlayer.id,
      targetPos: { ...player.hasPosition.current },
      amount: damage,
      element: 'poison',
      sourceType: 'special',
    });

    if (player.hasHealth.hp <= 0) {
      closeHazardContact(world, nodeId, pool, player.isPlayer.id, now, 'death');
      world.killPlayer(player.isPlayer.id, {
        kind: 'dot',
        killer: { ...pool.killer, monsterName: `${pool.killer.monsterName} — ${pool.sourceLabel}` },
        damage,
        stacks: 1,
      });
    }
  }

  for (const playerId of [...pool.contactsByPlayerId.keys()]) {
    if (inside.has(playerId)) continue;
    const player = world.getPlayerEntity(playerId);
    const reason = player?.isDead ? 'death' : 'exited';
    closeHazardContact(world, nodeId, pool, playerId, now, reason);
  }
}

/** Tick hazards, then sweep expired/abandoned circles. */
export function updateGroundZones(world: World, now: number): void {
  for (const [nodeId, list] of [...world.groundZones]) {
    for (const zone of list) {
      if (
        zone.kind === 'toxic-pool' &&
        now < zone.expiresAtMs &&
        zone.semantics.disposition === 'hostile-to-player'
      ) {
        tickToxicPool(world, nodeId, zone, now);
      } else if (zone.kind === 'toxic-pool') {
        closeAllHazardContacts(world, nodeId, zone, now, 'expired');
      }
    }

    const kept = list.filter(zone => {
      if (zone.kind === 'slam-telegraph') {
        return world.hasMonster(zone.ownerId) && now < zone.resolvesAtMs + RESOLVE_GRACE_MS;
      }
      if (zone.kind === 'fault-line-telegraph') {
        return world.hasMonster(zone.ownerId) && now < zone.resolvesAtMs + RESOLVE_GRACE_MS;
      }
      return zone.detonationMultiplier !== undefined
        ? now < zone.expiresAtMs + RESOLVE_GRACE_MS
        : now < zone.expiresAtMs;
    });
    if (kept.length === 0) world.groundZones.delete(nodeId);
    else if (kept.length !== list.length) world.groundZones.set(nodeId, kept);
  }
}

/**
 * Consume delayed impacts whose telegraphs have filled. Combat owns damage, so
 * this function only transfers due zones out of the rendering lifecycle.
 */
export function takeDueGroundZoneImpacts(
  world: World,
  now: number,
): DelayedGroundZoneImpact[] {
  const due: DelayedGroundZoneImpact[] = [];
  for (const [nodeId, list] of [...world.groundZones]) {
    const kept: RuntimeGroundZone[] = [];
    for (const zone of list) {
      const isDue =
        (zone.kind === 'fault-line-telegraph' && now >= zone.resolvesAtMs) ||
        (zone.kind === 'toxic-pool' &&
          zone.detonationMultiplier !== undefined &&
          now >= zone.expiresAtMs);
      if (isDue) due.push(zone as DelayedGroundZoneImpact);
      else kept.push(zone);
    }
    if (kept.length === 0) world.groundZones.delete(nodeId);
    else if (kept.length !== list.length) world.groundZones.set(nodeId, kept);
  }
  return due;
}

/** Build the client view for a node, or undefined when it has no zones. */
export function buildGroundZoneViews(
  world: World,
  nodeId: string,
  now: number,
): GroundZoneView[] | undefined {
  const list = world.groundZones.get(nodeId);
  if (!list || list.length === 0) return undefined;
  return list.flatMap<GroundZoneView>((zone) => {
    const endsAtMs =
      zone.kind === 'toxic-pool' ? zone.expiresAtMs : zone.resolvesAtMs;
    if (zone.kind === 'fault-line-telegraph') {
      return zone.points.map((point, index) => ({
        id: `${zone.id}-${index}`,
        kind: zone.kind,
        x: point.x,
        y: point.y,
        radius: zone.radius,
        durationMs: Math.max(1, endsAtMs - zone.startedAtMs),
        remainingMs: Math.max(0, endsAtMs - now),
      }));
    }
    return {
      id: zone.id,
      kind: zone.kind,
      x: zone.pos.x,
      y: zone.pos.y,
      radius: zone.radius,
      durationMs: Math.max(1, endsAtMs - zone.startedAtMs),
      remainingMs: Math.max(0, endsAtMs - now),
      ...(zone.kind === 'slam-telegraph' && zone.fx ? { fx: zone.fx } : {}),
    };
  });
}
