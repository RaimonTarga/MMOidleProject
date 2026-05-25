import { registerCombatListener } from '../../combatPipeline';
import { setEmpoweredAttack, isEmpoweredAttack, registerEmpoweredMultiplier } from '../../empoweredAttacks';
import { initCooldownT3 } from './cooldownT3';
import type { World } from '../../../world/World';

// ── Fallback constants (balanced-frame values, used when no frame is unlocked) ─

export const EXECUTION_COOLDOWN_MS = 7_000;  // ms between execution windows
const EXECUTION_MULTIPLIER         = 2.0;    // damage multiplier on execution strike

// ── Tick-driven readiness check ───────────────────────────────────────────────

/**
 * Run once per world tick, AFTER updateCombatState so any cooldown bookkeeping
 * elsewhere has already settled. The execution timer itself now lives on the
 * CooldownComponent and is decremented in-place here.
 *
 * For every cooldown-archetype player:
 *   1. First call: start the preparation cycle using the frame's cd duration.
 *   2. Decrement executionCooldownMs each tick.
 *   3. When the cycle expires and no empowered attack is pending: arm it.
 *
 * The cooldown is restarted inside the onHit handler (below) after each
 * execution strike, not by this function.
 */
export function updateCooldownArchetype(world: World, dt: number): void {
  for (const entity of world.cooldownPlayers) {
    const cd     = entity.usesCooldown;

    // First encounter (or after respawn):
    // start the preparation cycle. Read cd duration from passives.
    if (!cd.initialized) {
      const cdMs = entity.usesSkills.passives['cooldown.empowered-cd-ms'] ?? EXECUTION_COOLDOWN_MS;
      cd.executionCooldownMs = cdMs;
      cd.initialized         = true;
      cd.executionCooldownPct = 0;
      console.log(`[Cooldown] ${entity.isPlayer.id}: execution cycle started (${cdMs}ms)`);
      continue;
    }

    // Decrement the timer.
    if (cd.executionCooldownMs > 0) {
      cd.executionCooldownMs = Math.max(0, cd.executionCooldownMs - dt);
    }

    // Cycle expired and no empowered attack pending → arm execution.
    if (cd.executionCooldownMs <= 0 && !isEmpoweredAttack(entity)) {
      setEmpoweredAttack(world, entity);
      console.log(`[Cooldown] ${entity.isPlayer.id}: execution ready!`);
    }

    // Mirror to the entity slice so projection can expose preparation progress.
    const cdMs = entity.usesSkills.passives['cooldown.empowered-cd-ms'] ?? EXECUTION_COOLDOWN_MS;
    cd.executionCooldownPct = isEmpoweredAttack(entity)
      ? 100
      : Math.round((1 - cd.executionCooldownMs / cdMs) * 100);
  }
}

// ── Combat listener ───────────────────────────────────────────────────────────

/**
 * Register listeners for the cooldown execution mechanic.
 * Call once at server startup, before the World is created.
 *
 * Behavior:
 *   onHit (empoweredMultiplier) → applies cooldown.empowered-mult× damage and
 *                                  sets ctx.metadata['empoweredAttack'] = true.
 *   onHit (restart handler)    → when empoweredAttack fired, restarts the
 *                                  preparation cycle (reads cd from passives).
 *
 * Empowered attack rule: the execution strike itself does NOT reduce the cooldown
 * of the next execution. The timer restarts after the hit lands, never before.
 */
export function initCooldownArchetype(): void {
  // T3 listeners registered first so their beforeAttack suppression fires
  // before the empoweredMultiplier's onHit listener consumes the flag.
  initCooldownT3();

  // Register the multiplier listener FIRST so ctx.metadata['empoweredAttack']
  // is set before the restart handler below checks it.
  registerEmpoweredMultiplier(EXECUTION_MULTIPLIER, {
    attackerType:      'player',
    attackerArchetype: 'cooldown',
    passiveKey:        'cooldown.empowered-mult',
  });

  // After the execution fires, restart the preparation cycle.
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;
    if (!ctx.metadata['empoweredAttack']) return;

    // Query by component presence, not by combatArchetype string.
    const entity = ctx.attacker;
    if (!entity?.usesCooldown) return;

    const cd     = entity.usesCooldown;

    const cdMs = entity.usesSkills.passives['cooldown.empowered-cd-ms'] ?? EXECUTION_COOLDOWN_MS;
    cd.executionCooldownMs = cdMs;

    console.log(
      `[Cooldown] ${entity.isPlayer.id}: execution strike on ${ctx.defender.entityId} — ` +
      `cycle restarted (${cdMs}ms)`,
    );
  });
}
