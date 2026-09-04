import {
  applyStatusEffect,
  circleGeometry,
  corridorGeometry,
  type DamageMitigationBreakdown,
  DAMAGE_TAKEN_PCT_KEY,
  geometryContains,
  type GroundZoneGeometry,
  type HazardFlavor,
  linkedCirclesGeometry,
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
  /**
   * The authoritative shape. Damage resolution, Step Back, hazard avoidance,
   * telemetry and the client all read THIS — never `pos`/`radius` — so the region
   * that kills you is by construction the region you were shown.
   */
  geometry: GroundZoneGeometry;
  /**
   * Circle-equivalent anchor kept for the many callers that still reason in
   * centre+radius (owner bookkeeping, pool ticking, `bodiesInCircle` broad phase).
   * For a corridor this is the midpoint and the half-length, i.e. a bounding
   * circle: correct as a coarse filter, never as containment.
   */
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

/**
 * PERSISTENT HAZARD. Named `toxic-pool` for its original consumer, but generalized
 * (redesign §4.5) into the one family every lingering ground effect uses: Swamp rot,
 * the Plague Hound's death pool, and the Volcano's magma vents.
 *
 * Generalizing rather than adding a parallel hazard system is what keeps ONE answer
 * to "am I standing in something", one cleanup path, and one avoidance rule.
 */
export interface RuntimeToxicPool extends RuntimeGroundZoneBase {
  kind: 'toxic-pool';
  expiresAtMs: number;
  damagePerTick: number;
  tickIntervalMs: number;
  slowSpeedMult?: number;
  /** Texture selector only; never consulted for behaviour. Defaults to `toxic`. */
  flavor?: HazardFlavor;
  /**
   * AMBIENT-RAMP MODIFIER. While a player stands inside, the node's ambient ramp
   * (Volcano Heat, Tundra Chill) advances `rampAccelMult` times faster.
   *
   * Deliberately an ACCELERATOR on the existing room ramp rather than a second Heat
   * source: the biome's ecology already owns what Heat is and what it does, and a
   * hazard that minted its own parallel stack counter would give the player two
   * numbers to read where the design has one. Leaving simply returns them to the
   * room's baseline rate, so the vent speeds the clock up — it does not hold it.
   */
  rampAccelMult?: number;
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

/**
 * A committed charge lane. Published during the wind-up and resolved as a single
 * corridor-shaped hit; the segment never moves once published, which is what makes
 * stepping sideways a real answer rather than a guess about where the boss will go.
 */
export interface RuntimeChargeCorridor extends RuntimeGroundZoneBase {
  kind: 'charge-corridor';
  ownerId: string;
  resolvesAtMs: number;
  /** Endpoints of the lane, already clamped to valid/leashed space by the caller. */
  start: Vec2;
  end: Vec2;
  halfWidth: number;
  /**
   * Wind-up milestone at which the direction stops tracking the target. Before it
   * the lane is "aiming"; after it the lane is committed. The client reads this to
   * paint two visibly different states, which the encounter design requires.
   */
  lockedAtMs: number;
  damageMultiplier: number;
  fx?: string;
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
  | RuntimeFaultLineBurst
  | RuntimeChargeCorridor;

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
  zone: Omit<RuntimeSlamTelegraph, 'id' | 'semantics' | 'geometry'>,
): RuntimeSlamTelegraph {
  clearGroundZonesByOwner(world, nodeId, zone.ownerId);
  const published: RuntimeSlamTelegraph = {
    ...zone,
    geometry: circleGeometry(zone.pos, zone.radius),
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
  zone: Omit<RuntimeToxicPool, 'id' | 'tickTimersByPlayerId' | 'contactsByPlayerId' | 'semantics' | 'sourceId' | 'sourceLabel' | 'geometry'> & {
    semantics?: GroundZoneSemantics;
    sourceId?: string;
    sourceLabel?: string;
  },
): RuntimeToxicPool {
  const { semantics, sourceId, sourceLabel, ...rest } = zone;
  const published: RuntimeToxicPool = {
    ...rest,
    geometry: circleGeometry(rest.pos, rest.radius),
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
  zone: Omit<RuntimeFaultLineBurst, 'id' | 'semantics' | 'geometry'>,
): RuntimeFaultLineBurst {
  const published: RuntimeFaultLineBurst = {
    ...zone,
    geometry: linkedCirclesGeometry(zone.points, zone.radius),
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
 * Publish a committed charge lane for the wind-up.
 *
 * Like `publishGroundZone` this clears the owner's previous telegraph, so a boss
 * can never have two live lanes. The bounding-circle `pos`/`radius` are derived
 * here rather than authored, so no caller can hand out a lane whose coarse filter
 * disagrees with its real corridor.
 */
export function publishChargeCorridor(
  world: World,
  nodeId: string,
  zone: Omit<RuntimeChargeCorridor, 'id' | 'semantics' | 'geometry' | 'pos' | 'radius'>,
): RuntimeChargeCorridor {
  clearGroundZonesByOwner(world, nodeId, zone.ownerId);
  const midpoint = {
    x: (zone.start.x + zone.end.x) / 2,
    y: (zone.start.y + zone.end.y) / 2,
  };
  const published: RuntimeChargeCorridor = {
    ...zone,
    geometry: corridorGeometry(zone.start, zone.end, zone.halfWidth),
    pos: midpoint,
    radius: Math.hypot(zone.end.x - zone.start.x, zone.end.y - zone.start.y) / 2 + zone.halfWidth,
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
 * Re-aim a lane IN PLACE while it is still tracking, keeping its id.
 *
 * Republishing instead would mint a fresh zone id every tick, and Step Back keys
 * its tracked threats by zone id: the response would drop and re-acquire the same
 * lane 10 times a second, spamming the dodge telemetry and resetting the escape
 * point each time. The id is the identity of the threat, so it has to survive
 * aiming — only the geometry moves.
 *
 * Callers must respect `lockedAtMs` themselves; this function does not enforce the
 * commitment, it only performs the move.
 */
export function reaimChargeCorridor(
  lane: RuntimeChargeCorridor,
  start: Vec2,
  end: Vec2,
): void {
  lane.start = { ...start };
  lane.end = { ...end };
  lane.geometry = corridorGeometry(start, end, lane.halfWidth);
  lane.pos = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  lane.radius = Math.hypot(end.x - start.x, end.y - start.y) / 2 + lane.halfWidth;
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

/**
 * Combined ambient-ramp acceleration from every hazard this position is inside.
 *
 * Multiplied rather than summed so overlapping vents compound the way standing
 * deeper in the fire should, and returns 1 when the player is standing in nothing —
 * which is the ordinary case and must cost nothing to compute.
 */
export function hazardRampAcceleration(
  world: World,
  nodeId: string,
  point: Vec2,
  now: number,
): number {
  const list = world.groundZones.get(nodeId);
  if (!list || list.length === 0) return 1;
  let accel = 1;
  for (const zone of list) {
    if (zone.kind !== 'toxic-pool') continue;
    if (now >= zone.expiresAtMs) continue;
    const mult = zone.rampAccelMult;
    if (mult === undefined || mult === 1) continue;
    if (!geometryContains(zone.geometry, point)) continue;
    accel *= mult;
  }
  return accel;
}

export function pointInsideGroundZone(zone: RuntimeGroundZone, point: Vec2, clearance = 0): boolean {
  return geometryContains(zone.geometry, point, clearance);
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
  const inside = new Set<string>();
  for (const player of world.livePlayersInNode(nodeId)) {
    if (!geometryContains(pool.geometry, player.hasPosition.current)) continue;
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
      if (zone.kind === 'fault-line-telegraph' || zone.kind === 'charge-corridor') {
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
    const durationMs = Math.max(1, endsAtMs - zone.startedAtMs);
    const remainingMs = Math.max(0, endsAtMs - now);
    // Fault lines stay one view PER SEGMENT: the client draws a chain of filling
    // rings, and collapsing them into a single linked-circles view would change
    // shipped presentation for no gain. Each segment still carries the circle it
    // is, so nothing downstream has to special-case the chain.
    if (zone.kind === 'fault-line-telegraph') {
      return zone.points.map((point, index) => ({
        id: `${zone.id}-${index}`,
        kind: zone.kind,
        geometry: circleGeometry(point, zone.radius),
        x: point.x,
        y: point.y,
        radius: zone.radius,
        durationMs,
        remainingMs,
      }));
    }
    return {
      id: zone.id,
      kind: zone.kind,
      geometry: zone.geometry,
      x: zone.pos.x,
      y: zone.pos.y,
      radius: zone.radius,
      durationMs,
      remainingMs,
      ...(zone.kind === 'charge-corridor'
        ? {
            lockedInMs: Math.max(0, zone.lockedAtMs - now),
            ownerId: zone.ownerId,
            ...(zone.fx ? { fx: zone.fx } : {}),
          }
        : {}),
      ...(zone.kind === 'toxic-pool' && zone.flavor ? { flavor: zone.flavor } : {}),
      ...(zone.kind === 'slam-telegraph' && zone.fx ? { fx: zone.fx } : {}),
    };
  });
}
