import type { PlayerState } from '@mmo-idle/shared';
import { registerCombatListener } from './combatPipeline';
import { applyStatusEffect, getStatusEffects, getTotalStacks, pruneStatusEffects } from './statusEffects';
import { grantMonsterRewards } from './rewards';
import {
  initDotT3,
  computeEternalDoomDamage,
  getSmolderMult,
  getFrozenMult,
} from './dotT3';
import type { World } from '../world/World';

// ── Fallback constants (balanced-frame defaults, used when no frame is unlocked) ─

const DOT_MAX_STACKS       = 6;
const DOT_DAMAGE_PER_STACK = 3;
const DOT_TICK_INTERVAL_MS = 1000;

const DOT_EFFECT_ID = 'dot';

// ── Tick-driven DoT application ───────────────────────────────────────────────

/**
 * Run once per world tick (after updateCombatState so durations are already ticked).
 *
 * For every monster with active DoT stacks:
 *   - Advance the per-effect tick timer.
 *   - When the timer fires: deal stacks × damagePerStack damage.
 *   - If the monster dies: grant kill rewards to the last attacker.
 */
export function updateDotArchetype(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const [monsterId, state] of world.monsterCombatState) {
    const effect = getStatusEffects(state, DOT_EFFECT_ID)[0];
    if (!effect) continue;

    // Permafrost ticking is managed by updateDotT3 (ramp logic lives there).
    if (effect.data.t3Perm) continue;

    effect.data.nextTickIn -= dt;
    if (effect.data.nextTickIn > 0) continue;

    const monster = world.monsters.get(monsterId);
    if (!monster) continue;

    // Eternal Doom uses a diminishing-returns formula; all others use stacks × perStack.
    let damage = effect.data.isEternalDoom
      ? computeEternalDoomDamage(effect.stacks, effect.data.damagePerStack)
      : effect.stacks * effect.data.damagePerStack;

    // Apply Smoldering Ember vulnerability and Freeze bonus to DoT ticks.
    damage = Math.round(damage * getSmolderMult(state) * getFrozenMult(state));

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
 *   - Reads dot.max-stacks and dot.damage-per-stack from player.passives (frame values).
 *   - Adds one stack to the target (up to the frame's max).
 *   - Starts the tick timer on the first stack; subsequent hits do not reset it.
 *   - Updates kill-credit attribution to the most recent attacker.
 *
 * Note: damagePerStack is baked into the effect on first application and
 * preserved across subsequent stacks for consistency within a fight.
 */
export function initDotArchetype(): void {
  initDotT3(); // Register T3 listeners first so they can intercept before this handler

  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.attacker.combatArchetype !== 'dot') return;
    if (ctx.defenderType !== 'monster') return;
    if (ctx.metadata['dotHandled']) return; // T3 mechanic already handled this hit

    const state = world.monsterCombatState.get(ctx.defender.id);
    if (!state) return;

    const player         = world.players.get(ctx.attacker.id) as PlayerState | undefined;
    const maxStacks      = Math.round(player?.passives['dot.max-stacks']       ?? DOT_MAX_STACKS);
    const damagePerStack = player?.passives['dot.damage-per-stack'] ?? DOT_DAMAGE_PER_STACK;

    applyStatusEffect(state, {
      id:        DOT_EFFECT_ID,
      maxStacks: maxStacks,
      instanced: false,
      sourceId:  ctx.attacker.id,
      data: {
        damagePerStack:  damagePerStack,
        nextTickIn:      DOT_TICK_INTERVAL_MS,
        tickIntervalMs:  DOT_TICK_INTERVAL_MS,
      },
    });
  });
}
