import type { PlayerState, MonsterState } from '@mmo-idle/shared';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { registerCombatListener } from './combatPipeline';
import { applyStatusEffect, getStatusEffects, getTotalStacks } from './statusEffects';
import type { StatusEffect } from './combatState';
import { grantMonsterRewards } from './rewards';
import {
  initDotT3,
  computeEternalDoomDamage,
  getSmolderMult,
  getFrozenMult,
} from './dotT3';
import type { World } from '../world/World';

// ── Constants ─────────────────────────────────────────────────────────────────

const DOT_MAX_STACKS       = 6;
// Fraction of player.attack redirected into DoT ticks when no T1 path is chosen.
const DOT_CONVERSION_PCT   = 0.40;
const DOT_TICK_INTERVAL_MS = 1_000;
// Default duration for player-applied DoT stacks (refreshed on every hit, not stacked).
const DOT_DURATION_MS      = 4_500;

const DOT_EFFECT_ID = 'dot';

// ── Diminishing-returns tick formula ──────────────────────────────────────────
// At full stacks: dmgPerStack × sqrt(max × max) = dmgPerStack × max (same as linear).
// Below full stacks: damage is boosted above the linear amount so DoT classes stay
// competitive in short fights where full ramp-up isn't reached.
// Uncapped effects (maxStacks === 0) fall back to linear.
export function computeScaledDotDamage(effect: StatusEffect): number {
  const { stacks, maxStacks, data } = effect;
  if (maxStacks > 0) {
    return Math.round(data.damagePerStack * Math.sqrt(stacks * maxStacks));
  }
  return Math.round(stacks * data.damagePerStack);
}

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
  const monstersToKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const [monsterId, state] of world.monsterCombatState) {
    const effect = getStatusEffects(state, DOT_EFFECT_ID)[0];
    if (!effect) continue;
    if (effect.data.t3Perm) continue; // Permafrost ticking managed by updateDotT3

    effect.data.nextTickIn -= dt;
    if (effect.data.nextTickIn > 0) continue;

    const monster = world.monsters.get(monsterId);
    if (!monster) continue;

    let damage = effect.data.isEternalDoom
      ? computeEternalDoomDamage(effect.stacks, effect.data.damagePerStack)
      : computeScaledDotDamage(effect);

    // Apply Smoldering Ember vulnerability and Freeze bonus to DoT ticks.
    damage = Math.round(damage * getSmolderMult(state) * getFrozenMult(state));
    monster.hp -= damage;

    if (monster.hp <= 0) {
      monstersToKill.push({ monsterId, sourceId: effect.sourceId });
    } else {
      effect.data.nextTickIn = effect.data.tickIntervalMs;
    }
  }

  for (const { monsterId, sourceId } of monstersToKill) {
    const monster = world.monsters.get(monsterId);
    if (monster && sourceId) grantMonsterRewards(world, sourceId, monster);
    world.monsters.delete(monsterId);
    world.monsterAI.delete(monsterId);
    world.monsterCombatState.delete(monsterId);
  }

  // ── Player-side: monster-applied DoT ticking on players ──────────────────
  // DoT bypasses plating (flat armor) — that is its inherent identity.
  // damageReduction (%) applies so builds without dot-resistance retain baseline
  // protection; dot-resistance is the dedicated counter that stacks on top.
  const playersToRespawn: string[] = [];

  for (const [playerId, state] of world.playerCombatState) {
    const effect = getStatusEffects(state, DOT_EFFECT_ID)[0];
    if (!effect) continue;

    effect.data.nextTickIn -= dt;
    if (effect.data.nextTickIn > 0) continue;

    const player = world.players.get(playerId);
    if (!player) continue;

    const base      = computeScaledDotDamage(effect);
    const dotResist = Math.min(0.9, player.passives['defense.dot-resistance'] ?? 0);
    const damage    = Math.max(1, Math.round(base * (1 - player.damageReduction) * (1 - dotResist)));

    player.hp -= damage;

    if (player.hp <= 0) {
      playersToRespawn.push(playerId);
    } else {
      effect.data.nextTickIn = effect.data.tickIntervalMs;
    }
  }

  for (const playerId of playersToRespawn) {
    world.respawnPlayer(playerId); // also calls resetCombatState, clearing all DoT effects
  }

  // ── Mirror target stacks to PlayerState for the HUD ───────────────────────
  for (const player of world.players.values()) {
    if (player.combatArchetype !== 'dot') continue;
    if (!player.attackTargetId) {
      player.targetDotStacks = 0;
      continue;
    }
    const targetState = world.monsterCombatState.get(player.attackTargetId);
    player.targetDotStacks = targetState ? getTotalStacks(targetState, DOT_EFFECT_ID) : 0;
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
    if (ctx.attacker.combatArchetype !== 'dot') return;
    if (ctx.defenderType !== 'monster') return;
    if (ctx.metadata['dotHandled']) return;

    const state = world.monsterCombatState.get(ctx.defender.id);
    if (!state) return;

    const player = world.players.get(ctx.attacker.id) as PlayerState | undefined;
    if (!player) return;

    const maxStacks      = Math.round(player.passives['dot.max-stacks']                       ?? DOT_MAX_STACKS);
    const convPct        = player.passives['dot.conversion-pct']                              ?? DOT_CONVERSION_PCT;
    const tickIntervalMs = Math.max(100, Math.round(player.passives['dot.tick-interval-ms']   ?? DOT_TICK_INTERVAL_MS));
    const durationMs     = Math.round(player.passives['dot.duration-ms']                      ?? DOT_DURATION_MS);
    const damagePerStack = Math.max(1, Math.round(player.attack * convPct / maxStacks));

    // Apply conversion reduction only if the T3 handler hasn't already done so.
    if (!ctx.metadata['dotConvApplied']) {
      ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - convPct)));
    }

    const effect = applyStatusEffect(state, {
      id:          DOT_EFFECT_ID,
      maxStacks,
      instanced:   false,
      sourceId:    ctx.attacker.id,
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
  });

  // ── Monster → Player: DoT stack application ───────────────────────────────
  // Monsters with a dotEffect in MonsterDefinition apply stacks on every hit.
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'monster') return;
    if (ctx.defenderType !== 'player') return;

    const monsterDef = MONSTER_DATABASE.get((ctx.attacker as MonsterState).monsterTypeId);
    if (!monsterDef?.dotEffect) return;

    const playerCombatState = world.playerCombatState.get(ctx.defender.id);
    if (!playerCombatState) return;

    const { damagePerStack, maxStacks, tickIntervalMs } = monsterDef.dotEffect;
    const durationMs = monsterDef.dotEffect.durationMs ?? DOT_DURATION_MS;

    const effect = applyStatusEffect(playerCombatState, {
      id:          DOT_EFFECT_ID,
      maxStacks,
      instanced:   false,
      sourceId:    ctx.attacker.id,
      remainingMs: durationMs,
      refreshable: true,
      data: {
        damagePerStack,
        nextTickIn:    tickIntervalMs,
        tickIntervalMs,
      },
    });

  });
}
