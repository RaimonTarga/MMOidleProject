import { MONSTER_DATABASE, computeScaledDotDamage } from '@mmo-idle/shared';
import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import { applyStatusEffect, getStatusEffects, getTotalStacks } from '@mmo-idle/shared';
import { grantMonsterRewards } from '../../../player/progression/rewards';
import {
  initDotT3,
  computeEternalDoomDamage,
  getSmolderMult,
  getFrozenMult,
} from './t3';
import type { World } from '../../../../world/World';
import { attachMarker, detachMarkerIfNoEffect } from '../../../../ecs/markerHelpers';

// Re-export the pure tick formula from shared so existing importers don't change paths.
export { computeScaledDotDamage };

// ── Constants ─────────────────────────────────────────────────────────────────

const DOT_MAX_STACKS       = 6;
// Fraction of player.attack redirected into DoT ticks when no T1 path is chosen.
const DOT_CONVERSION_PCT   = 0.40;
const DOT_TICK_INTERVAL_MS = 1_000;
// Default duration for player-applied DoT stacks (refreshed on every hit, not stacked).
const DOT_DURATION_MS      = 4_500;

const DOT_EFFECT_ID = 'dot';

// ── Tick-driven DoT ───────────────────────────────────────────────────────────

/**
 * Run once per world tick (after updateCombatState so durations are already ticked).
 *
 * Processes DoT ticks for:
 *   - Monster-side: player-applied DoT stacks on monsters.
 *   - Player-side: monster-applied DoT stacks on players.
 */
export function updateDotArchetype(world: World, dt: number): void {

  // ── Monster-side: player-applied DoT ticking on monsters ─────────────────
  const monstersToKill: Array<{ monsterId: string; sourceId: string; damage: number }> = [];

  for (const entity of world.dottedMonsters) {
    const monsterId = entity.isMonster.id;
    const state     = entity.tracksCombat;
    const effect = getStatusEffects(state, DOT_EFFECT_ID)[0];
    if (!effect) {
      detachMarkerIfNoEffect(world, entity, 'hasDot', state, DOT_EFFECT_ID);
      continue;
    }
    if (effect.data.t3Perm) continue; // Permafrost ticking managed by updateDotT3

    effect.data.nextTickIn -= dt;
    if (effect.data.nextTickIn > 0) continue;

    let damage = effect.data.isEternalDoom
      ? computeEternalDoomDamage(effect.stacks, effect.data.damagePerStack)
      : computeScaledDotDamage(effect);

    // Apply Smoldering Ember vulnerability and Freeze bonus to DoT ticks.
    damage = Math.round(damage * getSmolderMult(state) * getFrozenMult(state));
    entity.hasHealth.hp -= damage;

    if (entity.hasHealth.hp <= 0) {
      monstersToKill.push({ monsterId, sourceId: effect.sourceId, damage });
    } else {
      effect.data.nextTickIn = effect.data.tickIntervalMs;
    }
  }

  for (const { monsterId, sourceId, damage } of monstersToKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) {
      const rewardInfo = grantMonsterRewards(world, sourceId, monster);
      const player = world.getPlayerEntity(sourceId);
      if (player) {
        world.pushEvent(player.hasPosition.nodeId, {
          kind:          'player-kill',
          playerId:      sourceId,
          targetId:      monster.isMonster.id,
          targetName:    monster.isMonster.name,
          damage,
          biomeXpGained: rewardInfo?.biomeXpGained ?? 0,
          essenceGained: rewardInfo?.essenceGained ?? 0,
          essenceType:   rewardInfo?.essenceType   ?? 'green',
        });
      }
    }
    world.removeMonsterEntity(monsterId);
  }

  // ── Player-side: monster-applied DoT ticking on players ──────────────────
  // DoT bypasses plating (flat armor) — that is its inherent identity.
  // damageReduction (%) applies so builds without dot-resistance retain baseline
  // protection; dot-resistance is the dedicated counter that stacks on top.
  const playersToRespawn: string[] = [];

  for (const entity of world.dottedPlayers) {
    const playerId  = entity.isPlayer.id;
    const state     = entity.tracksCombat;
    const effect = getStatusEffects(state, DOT_EFFECT_ID)[0];
    if (!effect) {
      detachMarkerIfNoEffect(world, entity, 'hasDot', state, DOT_EFFECT_ID);
      continue;
    }

    effect.data.nextTickIn -= dt;
    if (effect.data.nextTickIn > 0) continue;

    const base      = computeScaledDotDamage(effect);
    const dotResist = Math.min(0.9, entity.usesSkills.passives['defense.dot-resistance'] ?? 0);
    const damage    = Math.max(1, Math.round(base * (1 - entity.mitigatesDamage.damageReduction) * (1 - dotResist)));

    entity.hasHealth.hp -= damage;

    if (entity.hasHealth.hp <= 0) {
      playersToRespawn.push(playerId);
    } else {
      effect.data.nextTickIn = effect.data.tickIntervalMs;
    }
  }

  for (const playerId of playersToRespawn) {
    world.respawnPlayer(playerId); // also calls resetCombatState, clearing all DoT effects
  }

  // ── Mirror target stacks to the dot component and the HUD snapshot ──────────
  for (const entity of world.dotPlayers) {
    const dot    = entity.appliesDots;
    const targetId = entity.hasAttackTarget?.targetId;
    if (!targetId) {
      dot.targetDotStacks = 0;
    } else {
      const targetState   = world.getMonsterEntity(targetId)?.tracksCombat;
      dot.targetDotStacks = targetState ? getTotalStacks(targetState, DOT_EFFECT_ID) : 0;
    }
  }
}

// ── Combat listeners ──────────────────────────────────────────────────────────

/**
 * Register onHit listeners for the DoT archetype.
 * Called once at server startup.
 *
 * initDotT3() is called first so T3 handlers register before this base handler.
 * The T3 handler applies the conversion damage reduction (dotConvApplied flag);
 * the base handler applies it only when the T3 handler didn't run.
 */
export function initDotArchetype(): void {
  initDotT3();

  // ── Player → Monster: base stack application ─────────────────────────────
  // Fires only when no T3 mechanic has claimed the hit (dotHandled not set).
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;
    if (ctx.metadata['dotHandled']) return;

    // Query by component presence, not by combatArchetype string.
    const attacker = ctx.attacker;
    if (!attacker?.appliesDots) return;

    const state = ctx.defender.tracksCombat;
    const passives = attacker.usesSkills.passives;

    const maxStacks      = Math.round(passives['dot.max-stacks']                       ?? DOT_MAX_STACKS);
    const convPct        = passives['dot.conversion-pct']                              ?? DOT_CONVERSION_PCT;
    const tickIntervalMs = Math.max(100, Math.round(passives['dot.tick-interval-ms']   ?? DOT_TICK_INTERVAL_MS));
    const durationMs     = Math.round(passives['dot.duration-ms']                      ?? DOT_DURATION_MS);
    const damagePerStack = Math.max(1, Math.round(attacker.dealsDamage.attack * convPct / maxStacks));

    // Apply conversion reduction only if the T3 handler hasn't already done so.
    if (!ctx.metadata['dotConvApplied']) {
      ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - convPct)));
    }

    const effect = applyStatusEffect(state, {
      id:          DOT_EFFECT_ID,
      maxStacks,
      instanced:   false,
      sourceId:    ctx.attacker.isPlayer.id,
      remainingMs: durationMs,
      refreshable: true,
      data: {
        damagePerStack,
        nextTickIn:    tickIntervalMs,
        tickIntervalMs,
      },
    });

    // Refresh dynamic stat values on every hit so buffs take effect immediately.
    effect.data.damagePerStack = damagePerStack;
    effect.data.tickIntervalMs = tickIntervalMs;
    attachMarker(world, ctx.defender, 'hasDot');
  });

  // ── Monster → Player: DoT stack application ───────────────────────────────
  // Monsters with a dotEffect in MonsterDefinition apply stacks on every hit.
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'monster') return;
    if (ctx.defenderType !== 'player') return;

    const monsterDef = MONSTER_DATABASE.get(ctx.attacker.isMonster.monsterTypeId);
    if (!monsterDef?.dotEffect) return;

    const playerCombatState = ctx.defender.tracksCombat;

    const { damagePerStack, maxStacks, tickIntervalMs } = monsterDef.dotEffect;
    const durationMs = monsterDef.dotEffect.durationMs ?? DOT_DURATION_MS;

    applyStatusEffect(playerCombatState, {
      id:          DOT_EFFECT_ID,
      maxStacks,
      instanced:   false,
      sourceId:    ctx.attacker.isMonster.id,
      remainingMs: durationMs,
      refreshable: true,
      data: {
        damagePerStack,
        nextTickIn:    tickIntervalMs,
        tickIntervalMs,
      },
    });

    attachMarker(world, ctx.defender, 'hasDot');
  });
}
