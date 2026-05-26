import { getStatusEffect, getTotalStacks, type TracksCombat } from '@mmo-idle/shared';
import type { World } from '../../../../../../world/World';
import { hasPassive } from './helpers';
import {
  DOT_EFFECT_ID, CHILL_EFFECT, STATUS_EFFECT_TO_CLIENT_ID,
  GLACIAL_FRACTURE_EFFECT_ID, GLACIAL_FRACTURE_BUILDUP_FRAMES,
  PERMAFROST_EFFECT_ID, PERMAFROST_TIERS, PERMAFROST_FRAMES_PER_TIER,
} from './constants';
import { PERM_MAX_HITS, IT_SPEED_PER_STACK, IT_SPEED_CAP } from '../paths/_constants';

/**
 * Per-tick T3 player slice mirroring.
 *   - chillsTarget.targetChillStacks ← target's chill stacks
 *   - performsAttack.attackCooldown ← reduced by Invigorating Toxins ramp
 *
 * Base attack cooldown is captured the first time we observe a player with
 * IT unlocked and persists on the `appliesDots` slice so it survives across
 * ticks even when the target is missing.
 */
export function mirrorDotT3PlayerSlices(world: World): void {
  for (const entity of world.chillingPlayers) {
    const targetId = entity.hasAttackTarget?.targetId;
    const targetState = targetId
      ? world.getMonsterEntity(targetId)?.tracksCombat
      : undefined;
    entity.chillsTarget.targetChillStacks = targetState
      ? getTotalStacks(targetState, CHILL_EFFECT)
      : 0;
  }

  for (const entity of world.dotPlayers) {
    const dot = entity.appliesDots;

    const targetId = entity.hasAttackTarget?.targetId;
    const targetState = targetId
      ? world.getMonsterEntity(targetId)?.tracksCombat
      : undefined;

    if (hasPassive(entity, 'dot.invigorating-toxins')) {
      if (!dot.itInitialized) {
        dot.itBaseCd      = entity.performsAttack.attackCooldown;
        dot.itInitialized = true;
      }
      const baseCD = dot.itBaseCd;
      const stacks = targetState ? getTotalStacks(targetState, DOT_EFFECT_ID) : 0;
      if (stacks > 0) {
        const reduction = Math.min(stacks * IT_SPEED_PER_STACK, IT_SPEED_CAP);
        entity.performsAttack.attackCooldown = Math.max(200, Math.round(baseCD * (1 - reduction)));
      } else {
        entity.performsAttack.attackCooldown = Math.round(baseCD);
      }
    }
  }
}

function collectClientEffects(tracksCombat: TracksCombat | undefined): Record<string, number> {
  const activeEffects: Record<string, number> = {};
  if (!tracksCombat) return activeEffects;

  for (const [serverId, clientId] of STATUS_EFFECT_TO_CLIENT_ID) {
    const effect = getStatusEffect(tracksCombat, serverId);
    if (effect && effect.remainingMs > 0) activeEffects[clientId] = effect.remainingMs;
  }

  return activeEffects;
}

function collectClientEffectFrames(world: World, tracksCombat: TracksCombat | undefined): Record<string, number> {
  const activeEffectFrames: Record<string, number> = {};
  if (!tracksCombat) return activeEffectFrames;

  const dot = getStatusEffect(tracksCombat, DOT_EFFECT_ID);
  if (!dot || dot.stacks <= 0 || !dot.sourceId) return activeEffectFrames;

  const source = world.getPlayerEntity(dot.sourceId);
  if (!source) return activeEffectFrames;

  // Glacial Fracture: stack-buildup overlay (static frame per stack count).
  if (hasPassive(source, 'dot.glacial-fracture')) {
    const maxStacks = Math.max(1, dot.maxStacks);
    const frame = Math.min(
      GLACIAL_FRACTURE_BUILDUP_FRAMES - 1,
      Math.max(0, Math.floor((dot.stacks / maxStacks) * GLACIAL_FRACTURE_BUILDUP_FRAMES) - 1),
    );
    activeEffectFrames[GLACIAL_FRACTURE_EFFECT_ID] = frame;
  }

  // Permafrost: hit-ramp tier picks which 5-frame band the client loops.
  // Tier = floor(hits / maxHits * 5), clamped to [0, 4]. Base frame = tier * 5.
  if (hasPassive(source, 'dot.permafrost') && dot.data.t3Perm) {
    const hits = Math.max(0, Math.min(PERM_MAX_HITS, dot.data.hits ?? 0));
    const tier = Math.max(
      0,
      Math.min(PERMAFROST_TIERS - 1, Math.floor((hits / PERM_MAX_HITS) * PERMAFROST_TIERS)),
    );
    activeEffectFrames[PERMAFROST_EFFECT_ID] = tier * PERMAFROST_FRAMES_PER_TIER;
  }

  return activeEffectFrames;
}

/**
 * Copy server-side status effects into network-visible buckets on every
 * monster (and player) that currently has a T3-managed effect attached.
 * Iterates each marker query once and dedupes against an id set.
 */
export function mirrorStatusEffectsToClient(world: World): void {
  const mirroredMonsters = new Set<string>();

  for (const query of [
    world.dottedMonsters,
    world.conflagrationMonsters,
    world.chilledMonsters,
    world.frozenMonsters,
    world.detonatedMonsters,
    world.hemorrhagedMonsters,
    world.entropyMonsters,
    world.ashbrandMonsters,
  ]) {
    for (const entity of query) {
      if (mirroredMonsters.has(entity.isMonster.id)) continue;
      mirroredMonsters.add(entity.isMonster.id);
      entity.hasStatus.activeEffects = collectClientEffects(entity.tracksCombat);
      entity.hasStatus.activeEffectFrames = collectClientEffectFrames(world, entity.tracksCombat);
    }
  }

  for (const player of world.dottedPlayers) {
    player.hasStatus.activeEffects = collectClientEffects(player.tracksCombat);
    player.hasStatus.activeEffectFrames = collectClientEffectFrames(world, player.tracksCombat);
  }
}
