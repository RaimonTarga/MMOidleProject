import { registerCombatListener } from './combatPipeline';
import { applyStatusEffect, getStatusEffects, getTotalStacks, pruneStatusEffects } from './statusEffects';
import { grantMonsterRewards } from './rewards';
import type { World } from '../world/World';

// ── Constants ─────────────────────────────────────────────────────────────────

export const DOT_MAX_STACKS       = 5;
export const DOT_DAMAGE_PER_STACK = 3;    // damage per stack per tick
export const DOT_TICK_INTERVAL_MS = 1000; // ms between damage ticks

const DOT_EFFECT_ID = 'dot';

// ── Tick-driven DoT application ───────────────────────────────────────────────

/**
 * Run once per world tick (after updateCombatState so durations are already ticked).
 *
 * For every monster with active DoT stacks:
 *   - Advance the per-effect tick timer.
 *   - When the timer fires: deal stacks × DOT_DAMAGE_PER_STACK damage.
 *   - If the monster dies: grant kill rewards to the last attacker.
 */
export function updateDotArchetype(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const [monsterId, state] of world.monsterCombatState) {
    const effect = getStatusEffects(state, DOT_EFFECT_ID)[0];
    if (!effect) continue;

    // Advance tick timer
    effect.data.nextTickIn -= dt;
    if (effect.data.nextTickIn > 0) continue;

    const monster = world.monsters.get(monsterId);
    if (!monster) continue;

    const damage = effect.stacks * effect.data.damagePerStack;
    monster.hp -= damage;

    if (monster.hp <= 0) {
      toKill.push({ monsterId, sourceId: effect.sourceId });
    } else {
      effect.data.nextTickIn = effect.data.tickIntervalMs;
    }
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.monsters.get(monsterId);
    if (monster && sourceId) grantMonsterRewards(world, sourceId, monster);
    world.monsters.delete(monsterId);
    world.monsterAI.delete(monsterId);
    world.monsterCombatState.delete(monsterId);
  }

  // Mirror target stacks to PlayerState for the HUD.
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

// ── Combat listener ───────────────────────────────────────────────────────────

/**
 * Register the onHit listener that applies DoT stacks to the defender.
 * Called once at server startup via registerClassMechanic / activateClassMechanics.
 *
 * Each hit by a DoT player:
 *   - Adds one stack to the target (up to DOT_MAX_STACKS).
 *   - Starts the tick timer on the first stack; subsequent hits do not reset it.
 *   - Updates kill-credit attribution to the most recent attacker.
 */
export function initDotArchetype(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.attacker.combatArchetype !== 'dot') return;
    if (ctx.defenderType !== 'monster') return;

    const state = world.monsterCombatState.get(ctx.defender.id);
    if (!state) return;

    applyStatusEffect(state, {
      id:         DOT_EFFECT_ID,
      maxStacks:  DOT_MAX_STACKS,
      instanced:  false,
      sourceId:   ctx.attacker.id,
      // data is only used when creating the initial effect entry;
      // subsequent calls (adding stacks) preserve the existing nextTickIn.
      data: {
        damagePerStack:  DOT_DAMAGE_PER_STACK,
        nextTickIn:      DOT_TICK_INTERVAL_MS,
        tickIntervalMs:  DOT_TICK_INTERVAL_MS,
      },
    });
  });
}
