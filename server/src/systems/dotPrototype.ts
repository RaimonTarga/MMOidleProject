import { registerCombatListener } from './combatPipeline';
import { getStack, addStack, isCooldownActive, setCooldown, setString, getString } from './combatState';
import { grantMonsterRewards } from './rewards';
import type { World } from '../world/World';

// ── Constants ─────────────────────────────────────────────────────────────────

export const DOT_MAX_STACKS       = 5;
export const DOT_DAMAGE_PER_STACK = 3;    // damage dealt per stack per tick
export const DOT_TICK_INTERVAL_MS = 1000; // ms between damage ticks

// combatState keys — reserved by this module (stored on monster combat state)
const DOT_STACKS_KEY   = 'dotStacks';
const DOT_TICK_TIMER   = 'dotTickTimer';
const DOT_ATTACKER_KEY = 'dotAttackerId';

// ── Tick-driven DoT application ───────────────────────────────────────────────

/**
 * Run once per world tick, AFTER updateCombatState (so the tick timer is
 * already decremented before we check it).
 *
 * For every monster that has active DoT stacks:
 *   - When the tick timer expires: deal stacks × DOT_DAMAGE_PER_STACK damage.
 *   - If the monster dies: grant kill rewards to the player who last applied a stack.
 *   - Otherwise: reset the tick timer for the next interval.
 */
export function updateDotArchetype(world: World): void {
  // Collect kills separately to avoid mutating the map while iterating.
  const toKill: string[] = [];

  for (const [monsterId, state] of world.monsterCombatState) {
    const stacks = getStack(state, DOT_STACKS_KEY);
    if (stacks <= 0) continue;
    if (isCooldownActive(state, DOT_TICK_TIMER)) continue;

    const monster = world.monsters.get(monsterId);
    if (!monster) continue;

    const damage = stacks * DOT_DAMAGE_PER_STACK;
    monster.hp -= damage;

    console.log(
      `[DoT] ${monsterId}: ${stacks} stack${stacks !== 1 ? 's' : ''} → ${damage} dmg, hp=${Math.max(0, monster.hp)}`,
    );

    if (monster.hp <= 0) {
      toKill.push(monsterId);
    } else {
      setCooldown(state, DOT_TICK_TIMER, DOT_TICK_INTERVAL_MS);
    }
  }

  for (const monsterId of toKill) {
    const state   = world.monsterCombatState.get(monsterId);
    const monster = world.monsters.get(monsterId);
    if (state && monster) {
      const attackerId = getString(state, DOT_ATTACKER_KEY);
      if (attackerId) grantMonsterRewards(world, attackerId, monster);
    }
    world.monsters.delete(monsterId);
    world.monsterAI.delete(monsterId);
    world.monsterCombatState.delete(monsterId);
  }

  // Mirror target stacks to PlayerState so the client can show them in the HUD.
  for (const player of world.players.values()) {
    if (player.combatArchetype !== 'dot') continue;
    if (!player.attackTargetId) {
      player.targetDotStacks = 0;
      continue;
    }
    const targetState = world.monsterCombatState.get(player.attackTargetId);
    player.targetDotStacks = targetState ? getStack(targetState, DOT_STACKS_KEY) : 0;
  }
}

// ── Combat listener ───────────────────────────────────────────────────────────

/**
 * Register the onHit listener that applies DoT stacks to the defender.
 * Called once at server startup via registerClassMechanic / activateClassMechanics.
 *
 * Behavior on each confirmed hit by a DoT player:
 *   - Add one stack to the target (up to DOT_MAX_STACKS).
 *   - Start the tick timer if it is not already running.
 *   - Record the attacker ID for kill credit if DoT delivers the killing blow.
 */
export function initDotArchetype(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.attacker.combatArchetype !== 'dot') return;
    if (ctx.defenderType !== 'monster') return;

    const state = world.monsterCombatState.get(ctx.defender.id);
    if (!state) return;

    const current = getStack(state, DOT_STACKS_KEY);
    if (current < DOT_MAX_STACKS) {
      addStack(state, DOT_STACKS_KEY, 1);
      console.log(`[DoT] ${ctx.defender.id}: stack ${current + 1}/${DOT_MAX_STACKS}`);
    }

    // Start the tick timer on the first stack; subsequent hits don't reset it.
    if (!isCooldownActive(state, DOT_TICK_TIMER)) {
      setCooldown(state, DOT_TICK_TIMER, DOT_TICK_INTERVAL_MS);
    }

    // Update kill-credit attribution to the most recent attacker.
    setString(state, DOT_ATTACKER_KEY, ctx.attacker.id);
  });
}
