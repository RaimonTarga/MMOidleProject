import {
  applyStatusEffect,
  computeScaledDotDamage,
  GAME_CONFIG,
  getStatusEffect,
  MONSTER_DATABASE,
  NODE_BIOMES,
  pointInNodeFeatureShape,
  pointNearNodeFeatureShapeEdge,
  randomPointInShape,
  removeStatusEffect,
  resolveMoveAgainstBlocks,
  RESOLVED_NODE_FEATURES,
  VOLCANIC_HEAT_EFFECT_ID,
  type DeathKiller,
  type FeatureTarget,
  type NodeFeatureShape,
  type ResolvedNodeFeature,
  type Vec2,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../ecs/entity';
import { attachComponent, detachComponent } from '../../ecs/markerHelpers';
import { markSliceDirty } from '../../ecs/dirtyHelpers';
import type { World } from '../../world/World';
import { buildSimpleBreakdown, recordPlayerDamaged } from '../../world/worldLogCombat';
import { isInvulnerableMonster, isInvulnerablePlayer } from '../combat/invulnerability';
import { isPlayerInCombat } from '../combat/ai/engagement';
import { pushPlayerDotTickEvent } from '../combat/damage/dotTickEvent';

/** Distinct from boss environmental-dot (`isEnvironmental === 1`). */
const NODE_FEATURE_FLAG = 2;
const DEFAULT_NODE_FEATURE_STACK_INTERVAL_MS = 1000;

const SPAWN_MARGIN = 96;

const ENV_FEATURE_ACTOR = {
  id: 'node-feature',
  name: 'Environment',
  actorType: 'monster' as const,
};

/**
 * Clamp a `from`→`to` move so it stops just before any feature that blocks `target`
 * (respecting runtime block suppression). Returns the `to` reference unchanged when
 * the path is unobstructed, so callers can detect truncation via identity.
 */
export function resolveObstaclesForNode(
  world: World,
  nodeId: string,
  from: Vec2,
  to: Vec2,
  target: FeatureTarget,
  pad?: Vec2,
  suppressedFeatureIds?: ReadonlySet<string>,
): Vec2 {
  const baseShapes = world.collision.blockShapes(nodeId, target);
  const shapes =
    suppressedFeatureIds && suppressedFeatureIds.size > 0
      ? world.collision
          .staticRegions(nodeId)
          .filter(region => {
            if (region.kind !== 'block') return false;
            if (region.data?.blockTarget !== target) return false;
            const featureId = region.data?.featureId;
            return typeof featureId !== 'string' || !suppressedFeatureIds.has(featureId);
          })
          .map(region => region.shape)
      : baseShapes;
  if (shapes.length === 0) return to;
  return resolveMoveAgainstBlocks(from, to, shapes, pad);
}

function collectOccupiedNodeIds(world: World): Set<string> {
  const ids = new Set<string>();
  for (const player of world.livePlayers) ids.add(player.hasPosition.nodeId);
  return ids;
}

function spawnStateKey(nodeId: string, featureId: string): string {
  return `${nodeId}:${featureId}`;
}

export function resetNodeFeatureRuntimeState(world: World, nodeId: string): void {
  for (const monster of [...world.monsterEntitiesInNode(nodeId)]) {
    if (monster.isNodeFeatureSpawn) world.removeMonsterEntity(monster.isMonster.id);
  }
  for (const key of [...world.nodeFeatureSpawnState.keys()]) {
    if (key.startsWith(`${nodeId}:`)) world.nodeFeatureSpawnState.delete(key);
  }
  for (const key of [...world.suppressedFeatureBlocks]) {
    if (key.startsWith(`${nodeId}:`)) world.suppressedFeatureBlocks.delete(key);
  }
}

export function clampSpawnToNode(pos: Vec2): Vec2 {
  return {
    x: Math.max(
      SPAWN_MARGIN,
      Math.min(GAME_CONFIG.NODE_WIDTH - SPAWN_MARGIN, pos.x),
    ),
    y: Math.max(
      SPAWN_MARGIN,
      Math.min(GAME_CONFIG.NODE_HEIGHT - SPAWN_MARGIN, pos.y),
    ),
  };
}

function tickNodeFeatureSpawns(world: World, nodeId: string, now: number): void {
  const features = RESOLVED_NODE_FEATURES[nodeId];
  if (!features) return;
  if (features.every(f => !f.spawns)) return;

  const hasLivePlayer = [...world.livePlayersInNode(nodeId)].length > 0;

  for (const feature of features) {
    const spawns = feature.spawns;
    if (!spawns) continue;
    if (spawns.requiresPlayerInNode !== false && !hasLivePlayer) continue;

    const key = spawnStateKey(nodeId, feature.id);
    let state = world.nodeFeatureSpawnState.get(key) ?? {
      spawnedIds: [],
      nextSpawnAt: now,
    };

    state.spawnedIds = state.spawnedIds.filter(id => world.hasMonster(id));
    const alive = state.spawnedIds.length;
    if (alive >= spawns.maxAlive) {
      world.nodeFeatureSpawnState.set(key, state);
      continue;
    }
    if (now < state.nextSpawnAt) {
      world.nodeFeatureSpawnState.set(key, state);
      continue;
    }

    const batch = spawns.count ?? 1;
    const spawnsPack =
      MONSTER_DATABASE.get(spawns.monsterTypeId)?.pack?.role === 'alpha';
    for (let i = 0; i < batch && state.spawnedIds.length < spawns.maxAlive; i++) {
      const pos = clampSpawnToNode(randomPointInShape(feature.shape));
      // A pack-alpha type seeds the whole pack clustered in the thicket (one
      // synchronized pounce via call-allies); otherwise a single mob. Bush mobs
      // spawn DORMANT (small pullRange) so they only wake when the player steps in.
      const members = spawnsPack
        ? (world.spawnPack(nodeId, spawns.monsterTypeId, pos) ?? [])
        : (() => {
            const m = world.createMonster(nodeId, spawns.monsterTypeId, pos);
            return m ? [m] : [];
          })();
      if (members.length === 0) continue;
      for (const m of members) {
        attachComponent(world, m, 'isNodeFeatureSpawn', {});
        if (spawns.pullRange !== undefined) {
          m.hasAwareness.pullRange = spawns.pullRange;
          markSliceDirty(world, m, 'hasAwareness');
        }
        state.spawnedIds.push(m.isMonster.id);
      }
    }
    state.nextSpawnAt = now + spawns.intervalMs;
    world.nodeFeatureSpawnState.set(key, state);
  }
}

export function updateNodeFeatures(world: World, dt: number): void {
  const occupiedNodes = collectOccupiedNodeIds(world);
  const now = Date.now();

  for (const nodeId of occupiedNodes) {
    tickNodeFeatureSpawns(world, nodeId, now);
  }

  for (const player of world.livePlayers) {
    applyAndTickPlayerNodeFeatures(world, player, dt);
  }

  for (const nodeId of occupiedNodes) {
    for (const monster of world.monsterEntitiesInNode(nodeId)) {
      applyAndTickMonsterNodeFeatures(world, monster, dt);
    }
  }

  updateAmbientHeat(world, dt, now);

  cleanupExpiredNodeFeatureMarkers(world);
}

/**
 * Volcanic ambient heat — the node-wide soft timer. For every live player: if their
 * node has an `ambientHeat` feature AND they are in combat, heat stacks ramp every
 * `rampMs` up to `maxStacks` and a stack-scaled burn ticks (mitigated by dot-resistance
 * + DR). Out of combat — or once they leave the heat node — the heat decays at the same
 * cadence and clears. Self-managed (not a positional node-feature damage status), so the
 * burn keeps building wherever the player stands in the caldera. Deterministic per dt.
 */
function updateAmbientHeat(world: World, dt: number, now: number): void {
  for (const player of world.livePlayers) {
    const features = RESOLVED_NODE_FEATURES[player.hasPosition.nodeId];
    const heat = features?.find((f) => f.ambientHeat)?.ambientHeat;
    const cs = player.tracksCombat;
    const effect = getStatusEffect(cs, VOLCANIC_HEAT_EFFECT_ID);

    if (!heat) {
      if (effect) decayAmbientHeat(cs, effect, dt);
      continue;
    }

    if (!isPlayerInCombat(player, now)) {
      if (effect) decayAmbientHeat(cs, effect, dt);
      continue;
    }

    // In a heat node and in combat → ramp + burn.
    let active = effect;
    if (!active) {
      active = applyStatusEffect(cs, {
        id: VOLCANIC_HEAT_EFFECT_ID,
        maxStacks: 0, // 0 = linear burn (stacks × perStackDamage), capped manually
        instanced: false,
        sourceId: 'node-feature:volcanic-heat',
        remainingMs: -1,
        refreshable: false,
        data: {
          damagePerStack: heat.perStackDamage,
          nextTickIn: heat.tickIntervalMs,
          tickIntervalMs: heat.tickIntervalMs,
          rampMs: heat.rampMs,
          rampAccum: 0,
          maxStacks: heat.maxStacks,
          totalMs: heat.rampMs * heat.maxStacks,
        },
      });
    } else {
      active.data.rampAccum = (active.data.rampAccum ?? 0) + dt;
      while (active.data.rampAccum >= heat.rampMs && active.stacks < heat.maxStacks) {
        active.stacks++;
        active.data.rampAccum -= heat.rampMs;
      }
    }
    tickHeatBurn(world, player, active, dt);
  }
}

/** Cool down: shed one heat stack per `rampMs` of elapsed time; clear at zero. */
function decayAmbientHeat(
  cs: PlayerEntity['tracksCombat'],
  effect: PlayerEntity['tracksCombat']['statusEffects'][number],
  dt: number,
): void {
  const rampMs = effect.data.rampMs ?? 3000;
  effect.data.rampAccum = (effect.data.rampAccum ?? 0) + dt;
  while (effect.data.rampAccum >= rampMs && effect.stacks > 0) {
    effect.stacks--;
    effect.data.rampAccum -= rampMs;
  }
  if (effect.stacks <= 0) removeStatusEffect(cs, VOLCANIC_HEAT_EFFECT_ID);
}

/** Stack-scaled burn tick (linear), mitigated by dot-resistance + DR; can kill. */
function tickHeatBurn(
  world: World,
  player: PlayerEntity,
  effect: PlayerEntity['tracksCombat']['statusEffects'][number],
  dt: number,
): void {
  effect.data.nextTickIn = (effect.data.nextTickIn ?? effect.data.tickIntervalMs) - dt;
  if (effect.data.nextTickIn > 0) return;
  effect.data.nextTickIn = effect.data.tickIntervalMs;
  if (isInvulnerablePlayer(player)) return;

  const base = effect.stacks * (effect.data.damagePerStack ?? 0);
  if (base <= 0) return;
  const dotResist = Math.min(
    0.9,
    player.usesSkills.passives['defense.dot-resistance'] ?? 0,
  );
  const damage = Math.max(
    1,
    Math.round(
      base * (1 - player.mitigatesDamage.damageReduction) * (1 - dotResist),
    ),
  );

  recordPlayerDamaged(
    world,
    player,
    ENV_FEATURE_ACTOR,
    damage,
    0,
    'dot',
    buildSimpleBreakdown(base, damage),
  );

  player.hasHealth.hp -= damage;
  markSliceDirty(world, player, 'hasHealth');
  if (player.hasHealth.hp <= 0) {
    world.killPlayer(player.isPlayer.id, {
      kind: 'dot',
      killer: deathKillerForNode(player.hasPosition.nodeId),
      damage,
      stacks: effect.stacks,
    });
  }
}

function isPreFinalUltimateStage(world: World, nodeId: string): boolean {
  for (const boss of world.ultimateMonsters) {
    if (boss.hasPosition.nodeId !== nodeId) continue;
    if (!boss.scriptsUltimate?.engaged) continue;
    const encounter = MONSTER_DATABASE.get(boss.isMonster.monsterTypeId)?.ultimateEncounter;
    if (!encounter) continue;
    return boss.scriptsUltimate.stageIndex < encounter.stages.length - 1;
  }
  return false;
}

function isFeatureDamageActive(
  world: World,
  nodeId: string,
  feature: ResolvedNodeFeature,
): boolean {
  const damage = feature.damage;
  if (!damage) return true;
  if (
    damage.requiresActiveBlock &&
    world.suppressedFeatureBlocks.has(`${nodeId}:${feature.id}`)
  ) {
    return false;
  }
  if (damage.preFinalStageOnly && !isPreFinalUltimateStage(world, nodeId)) {
    return false;
  }
  return true;
}

function playerInFeatureContact(
  pos: Vec2,
  feature: ResolvedNodeFeature,
): boolean {
  const inside = pointInNodeFeatureShape(pos, feature.shape);
  const band = feature.damage?.contactBandPx;
  if (band == null) return inside;
  return inside || pointNearNodeFeatureShapeEdge(pos, feature.shape, band);
}

function applyAndTickPlayerNodeFeatures(
  world: World,
  player: PlayerEntity,
  dt: number,
): void {
  const nodeId = player.hasPosition.nodeId;
  const features = RESOLVED_NODE_FEATURES[nodeId];
  if (!features || features.length === 0) {
    if (player.hasNodeFeatureEffect) {
      detachComponent(world, player, 'hasNodeFeatureEffect');
    }
    return;
  }

  let activeNodeFeature = false;
  const pos = player.hasPosition.current;

  for (const feature of features) {
    const inside = pointInNodeFeatureShape(pos, feature.shape);
    const inDamageContact = !!(
      feature.damage?.targets.includes('player') &&
      isFeatureDamageActive(world, nodeId, feature) &&
      playerInFeatureContact(pos, feature)
    );
    activeNodeFeature =
      applyFeatureEffectsToEntity(
        player.tracksCombat,
        feature,
        inside,
        'player',
        inDamageContact,
      ) || activeNodeFeature;
  }

  if (activeNodeFeature) {
    attachComponent(world, player, 'hasNodeFeatureEffect', {});
    tickEntityNodeFeatureDamage(world, player, dt, true);
  } else if (player.hasNodeFeatureEffect) {
    detachComponent(world, player, 'hasNodeFeatureEffect');
  }
}

function applyAndTickMonsterNodeFeatures(
  world: World,
  monster: MonsterEntity,
  dt: number,
): void {
  if (isInvulnerableMonster(monster)) return;

  const nodeId = monster.hasPosition.nodeId;
  const features = RESOLVED_NODE_FEATURES[nodeId];
  if (!features || features.length === 0) return;

  let hasDamageEffect = false;
  let throneHealing = false;

  for (const feature of features) {
    const inside = pointInNodeFeatureShape(monster.hasPosition.current, feature.shape);
    const applied = applyFeatureEffectsToEntity(
      monster.tracksCombat,
      feature,
      inside,
      'monster',
      inside && isFeatureDamageActive(world, nodeId, feature),
    );
    if (applied && feature.damage?.targets.includes('monster')) {
      hasDamageEffect = true;
    }

    const heal = feature.healWhileInside;
    if (
      heal?.targets.includes('monster') &&
      inside &&
      (!heal.encounterAddsOnly || monster.isEncounterAdd)
    ) {
      if (monster.hasHealth.hp < monster.hasHealth.maxHp) {
        const healAmount = Math.max(
          1,
          Math.round(monster.hasHealth.maxHp * heal.hpPctPerSec * dt / 1000),
        );
        monster.hasHealth.hp = Math.min(
          monster.hasHealth.maxHp,
          monster.hasHealth.hp + healAmount,
        );
        markSliceDirty(world, monster, 'hasHealth');
      }
      throneHealing = true;
    }
  }

  if (monster.hasStatus.throneHealing !== throneHealing) {
    monster.hasStatus.throneHealing = throneHealing;
    markSliceDirty(world, monster, 'hasStatus');
  }

  if (hasDamageEffect) {
    tickEntityNodeFeatureDamage(world, monster, dt, false);
  }
}

function applyFeatureEffectsToEntity(
  tracksCombat: PlayerEntity['tracksCombat'],
  feature: ResolvedNodeFeature,
  inside: boolean,
  target: FeatureTarget,
  inDamageContact: boolean,
): boolean {
  let active = false;

  // A node-feature status is removed on exit only by the SAME feature that applied
  // it (matched via sourceId). Without this, multiple discrete features sharing an
  // effectId (e.g. several rot pools, or several pools using the shared 'slow' id)
  // would strip each other's status when the player stands in one but not the others.
  const sourceId = `node-feature:${feature.id}`;
  const ownsFeatureStatus = (effectId: string): boolean => {
    const effect = getStatusEffect(tracksCombat, effectId);
    return (
      effect?.data.isNodeFeature === NODE_FEATURE_FLAG &&
      effect.sourceId === sourceId
    );
  };

  if (feature.statusWhileInside?.targets.includes(target)) {
    const se = feature.statusWhileInside;
    if (inside) {
      applyStatusEffect(tracksCombat, {
        id: se.effectId,
        maxStacks: 1,
        instanced: false,
        sourceId,
        remainingMs: se.refreshMs,
        refreshable: true,
        data: { ...se.data, isNodeFeature: NODE_FEATURE_FLAG },
      });
      active = true;
    } else if (ownsFeatureStatus(se.effectId)) {
      removeStatusEffect(tracksCombat, se.effectId);
    }
  }

  if (feature.damage?.targets.includes(target)) {
    const d = feature.damage;
    if (inDamageContact) {
      refreshNodeFeatureDamageEffect(tracksCombat, sourceId, d);
      active = true;
    } else if (ownsFeatureStatus(d.effectId)) {
      removeStatusEffect(tracksCombat, d.effectId);
    }
  }

  return active;
}

function refreshNodeFeatureDamageEffect(
  tracksCombat: PlayerEntity['tracksCombat'],
  sourceId: string,
  damage: NonNullable<ResolvedNodeFeature['damage']>,
): void {
  const remainingMs = damage.refreshMs * 3;
  const existing = getStatusEffect(tracksCombat, damage.effectId);
  if (
    existing &&
    existing.data.isNodeFeature === NODE_FEATURE_FLAG
  ) {
    existing.remainingMs = remainingMs;
    existing.maxStacks = damage.maxStacks;
    existing.sourceId = sourceId;
    existing.data.damagePerStack = damage.damagePerStack;
    existing.data.tickIntervalMs = damage.tickIntervalMs;
    existing.data.stackIntervalMs =
      existing.data.stackIntervalMs ?? damage.tickIntervalMs;
    existing.data.totalMs = remainingMs;
    existing.data.isNodeFeature = NODE_FEATURE_FLAG;
    return;
  }

  applyStatusEffect(tracksCombat, {
    id: damage.effectId,
    maxStacks: damage.maxStacks,
    instanced: false,
    sourceId,
    remainingMs,
    refreshable: true,
    data: {
      damagePerStack: damage.damagePerStack,
      nextTickIn: damage.tickIntervalMs,
      tickIntervalMs: damage.tickIntervalMs,
      nextStackIn: damage.tickIntervalMs,
      stackIntervalMs: damage.tickIntervalMs,
      totalMs: remainingMs,
      isNodeFeature: NODE_FEATURE_FLAG,
    },
  });
}

function tickEntityNodeFeatureDamage(
  world: World,
  entity: PlayerEntity | MonsterEntity,
  dt: number,
  isPlayer: boolean,
): void {
  for (const effect of entity.tracksCombat.statusEffects) {
    if (effect.data.isNodeFeature !== NODE_FEATURE_FLAG) continue;
    if (effect.data.damagePerStack == null) continue;

    effect.data.nextTickIn =
      (effect.data.nextTickIn ?? effect.data.tickIntervalMs ?? 1000) - dt;
    if (isPlayer) {
      const player = entity as PlayerEntity;
      if (isInvulnerablePlayer(player)) continue;
      if (effect.data.nextTickIn <= 0) {
        const base = computeScaledDotDamage(effect);
        const dotResist = Math.min(
          0.9,
          player.usesSkills.passives['defense.dot-resistance'] ?? 0,
        );
        const damage = Math.max(
          1,
          Math.round(
            base *
              (1 - player.mitigatesDamage.damageReduction) *
              (1 - dotResist),
          ),
        );

        recordPlayerDamaged(
          world,
          player,
          ENV_FEATURE_ACTOR,
          damage,
          0,
          'dot',
          buildSimpleBreakdown(base, damage),
        );

        if (effect.id === 'swamp-rot') {
          pushPlayerDotTickEvent(world, player, 'poison', damage, {
            sourceType: 'special',
          });
        }

        player.hasHealth.hp -= damage;
        markSliceDirty(world, player, 'hasHealth');
        if (player.hasHealth.hp <= 0) {
          detachComponent(world, player, 'hasNodeFeatureEffect');
          world.killPlayer(player.isPlayer.id, {
            kind: 'dot',
            killer: deathKillerForNode(player.hasPosition.nodeId),
            damage,
            stacks: effect.stacks,
          });
          continue;
        }
        effect.data.nextTickIn += effect.data.tickIntervalMs ?? 1000;
      }
      rampNodeFeatureDamageStacks(effect, dt);
    } else {
      const monster = entity as MonsterEntity;
      if (effect.data.nextTickIn <= 0) {
        const base = computeScaledDotDamage(effect);
        const damage = Math.max(
          1,
          Math.round(base * (1 - monster.mitigatesDamage.damageReduction)),
        );
        monster.hasHealth.hp -= damage;
        markSliceDirty(world, monster, 'hasHealth');
        if (monster.hasHealth.hp <= 0) {
          world.removeMonsterEntity(monster.isMonster.id);
          continue;
        }
        effect.data.nextTickIn += effect.data.tickIntervalMs ?? 1000;
      }
      rampNodeFeatureDamageStacks(effect, dt);
    }
  }
}

function rampNodeFeatureDamageStacks(
  effect: PlayerEntity['tracksCombat']['statusEffects'][number],
  dt: number,
): void {
  const maxStacks = Math.max(1, effect.maxStacks);
  if (effect.stacks >= maxStacks) return;
  const interval =
    effect.data.stackIntervalMs ??
    effect.data.tickIntervalMs ??
    DEFAULT_NODE_FEATURE_STACK_INTERVAL_MS;
  effect.data.nextStackIn = (effect.data.nextStackIn ?? interval) - dt;
  while (effect.data.nextStackIn <= 0 && effect.stacks < maxStacks) {
    effect.stacks++;
    effect.data.nextStackIn += interval;
  }
}

function deathKillerForNode(nodeId: string): DeathKiller {
  const info = NODE_BIOMES[nodeId];
  const typeId = info?.bossTypeId ?? 'tiny-slime';
  const def = MONSTER_DATABASE.get(typeId);
  return {
    monsterTypeId: typeId,
    monsterName: def?.name ?? 'Environment',
    isBoss: def?.isBoss === true,
    nodeId,
  };
}

function cleanupExpiredNodeFeatureMarkers(world: World): void {
  for (const player of world.nodeFeatureEffectPlayers) {
    const hasNodeFeatureStatus = player.tracksCombat.statusEffects.some(
      effect => effect.data.isNodeFeature === NODE_FEATURE_FLAG,
    );
    if (!hasNodeFeatureStatus) {
      detachComponent(world, player, 'hasNodeFeatureEffect');
    }
  }
}
