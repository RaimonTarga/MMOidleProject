import type { PlayerState } from '@mmo-idle/shared';
import { registerCombatListener } from './combatPipeline';
import { getFlag, setFlag, isCooldownActive, setCooldown, getCooldown } from './combatState';
import { setEmpoweredAttack, isEmpoweredAttack, registerEmpoweredMultiplier } from './empoweredAttacks';
import { initCooldownT3 } from './cooldownT3';
import type { World } from '../world/World';

// ── Fallback constants (balanced-frame values, used when no frame is unlocked) ─

export const EXECUTION_COOLDOWN_MS = 7_000;  // ms between execution windows
const EXECUTION_MULTIPLIER         = 2.0;    // damage multiplier on execution strike

// combatState keys — exported so cooldownT3.ts can reference the same CD
export const EXEC_COOLDOWN_KEY = 'executionCooldown';
const KEY_INITIALIZED          = 'executionInitialized';
/** @deprecated internal alias kept for readability within this file */
const KEY_COOLDOWN             = EXEC_COOLDOWN_KEY;

// ── Tick-driven readiness check ───────────────────────────────────────────────

/**
 * Run once per world tick, AFTER updateCombatState (so cooldown timers are
 * already decremented before this checks them).
 *
 * For every cooldown-archetype player:
 *   1. First call: start the preparation cycle using the frame's cd duration.
 *   2. When the cycle expires and no empowered attack is pending: arm it.
 *
 * The cooldown is restarted inside the onHit handler (below) after each
 * execution strike, not by this function.
 *
 * Empowered attack rule: the execution strike does NOT restart the cycle
 * by itself — only a confirmed hit in the onHit handler does. Calling
 * setEmpoweredAttack here only arms the flag; the timer is separate.
 */
export function updateCooldownArchetype(world: World): void {
  for (const player of world.players.values()) {
    if (player.combatArchetype !== 'cooldown') continue;

    const state = world.playerCombatState.get(player.id);
    if (!state) continue;

    // First encounter (or after respawn, which resets the state):
    // start the preparation cycle. Read cd duration from passives.
    if (!getFlag(state, KEY_INITIALIZED)) {
      const cdMs = player.passives['cooldown.empowered-cd-ms'] ?? EXECUTION_COOLDOWN_MS;
      setCooldown(state, KEY_COOLDOWN, cdMs);
      setFlag(state, KEY_INITIALIZED, true);
      player.executionReady       = false;
      player.executionCooldownPct = 0;
      console.log(`[Cooldown] ${player.id}: execution cycle started (${cdMs}ms)`);
      continue;
    }

    // Cycle expired and no empowered attack pending → arm execution.
    if (!isCooldownActive(state, KEY_COOLDOWN) && !isEmpoweredAttack(state)) {
      setEmpoweredAttack(state);
      console.log(`[Cooldown] ${player.id}: execution ready!`);
    }

    // Mirror to PlayerState so the client can display preparation progress.
    const cdMs      = player.passives['cooldown.empowered-cd-ms'] ?? EXECUTION_COOLDOWN_MS;
    const remaining = getCooldown(state, KEY_COOLDOWN);
    player.executionReady       = isEmpoweredAttack(state);
    player.executionCooldownPct = player.executionReady
      ? 100
      : Math.round((1 - remaining / cdMs) * 100);
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
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.attacker.combatArchetype !== 'cooldown') return;
    if (!ctx.metadata['empoweredAttack']) return;

    const state = world.playerCombatState.get(ctx.attacker.id);
    if (!state) return;

    const player = world.players.get(ctx.attacker.id) as PlayerState | undefined;
    const cdMs   = player?.passives['cooldown.empowered-cd-ms'] ?? EXECUTION_COOLDOWN_MS;
    setCooldown(state, KEY_COOLDOWN, cdMs);

    console.log(
      `[Cooldown] ${ctx.attacker.id}: execution strike on ${ctx.defender.id} — ` +
      `cycle restarted (${cdMs}ms)`,
    );
  });
}
