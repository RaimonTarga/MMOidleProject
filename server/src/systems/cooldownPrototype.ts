import { registerCombatListener } from './combatPipeline';
import { getFlag, setFlag, isCooldownActive, setCooldown, getCooldown } from './combatState';
import type { World } from '../world/World';

// ── Constants ─────────────────────────────────────────────────────────────────

const EXECUTION_COOLDOWN_MS = 5_000; // ms between execution windows
const EXECUTION_MULTIPLIER  = 4;     // damage multiplier on execution strike

// combatState keys — reserved by this module
const KEY_INITIALIZED  = 'executionInitialized'; // flags
const KEY_READY        = 'executionReady';        // flags
const KEY_COOLDOWN     = 'executionCooldown';     // cooldowns

// ── Tick-driven readiness check ───────────────────────────────────────────────

/**
 * Run once per world tick, AFTER updateCombatState (so cooldown timers are
 * already decremented before this checks them).
 *
 * For every cooldown-archetype player:
 *   1. First call: start the 5 s cycle.
 *   2. When the cycle expires and the player is not yet armed: set executionReady.
 *
 * The cooldown is restarted inside the onHit handler (below) after each
 * execution strike, so this function never needs to reset it proactively.
 */
export function updateCooldownArchetype(world: World): void {
  for (const player of world.players.values()) {
    if (player.combatArchetype !== 'cooldown') continue;

    const state = world.playerCombatState.get(player.id);
    if (!state) continue;

    // First encounter (or after respawn, which calls resetCombatState):
    // start the preparation cycle and bail — don't arm immediately.
    if (!getFlag(state, KEY_INITIALIZED)) {
      setCooldown(state, KEY_COOLDOWN, EXECUTION_COOLDOWN_MS);
      setFlag(state, KEY_INITIALIZED, true);
      console.log(`[Cooldown] ${player.id}: execution cycle started (${EXECUTION_COOLDOWN_MS}ms)`);
      player.executionReady      = false;
      player.executionCooldownPct = 0;
      continue;
    }

    // Cycle expired and not yet armed → arm the execution.
    if (!isCooldownActive(state, KEY_COOLDOWN) && !getFlag(state, KEY_READY)) {
      setFlag(state, KEY_READY, true);
      console.log(`[Cooldown] ${player.id}: execution ready!`);
    }

    // Mirror to PlayerState so the client can display preparation progress.
    const remaining = getCooldown(state, KEY_COOLDOWN);
    player.executionReady       = getFlag(state, KEY_READY);
    player.executionCooldownPct = player.executionReady
      ? 100
      : Math.round((1 - remaining / EXECUTION_COOLDOWN_MS) * 100);
  }
}

// ── Combat listener ───────────────────────────────────────────────────────────

/**
 * Register the onHit listener that applies the execution multiplier.
 * Call once at server startup, before the World is created.
 *
 * Behavior when executionReady is set:
 *   - Multiply ctx.damage by EXECUTION_MULTIPLIER (before it is applied).
 *   - Consume the ready flag.
 *   - Restart the 5 s preparation cycle.
 *   - Write metadata flags for future VFX/UI hooks.
 */
export function initCooldownArchetype(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.attacker.combatArchetype !== 'cooldown') return;

    const state = world.playerCombatState.get(ctx.attacker.id);
    if (!state) return;

    if (!getFlag(state, KEY_READY)) return;

    // Consume readiness and restart the cycle before touching damage,
    // so any re-entrant hook sees the correct state.
    setFlag(state, KEY_READY, false);
    setCooldown(state, KEY_COOLDOWN, EXECUTION_COOLDOWN_MS);

    const base     = ctx.damage;
    ctx.damage     = Math.floor(base * EXECUTION_MULTIPLIER);

    ctx.metadata['executionStrike']     = true;
    ctx.metadata['executionMultiplier'] = EXECUTION_MULTIPLIER;
    ctx.metadata['executionBonus']      = ctx.damage - base;

    console.log(
      `[Cooldown] ${ctx.attacker.id}: execution strike on ${ctx.defender.id} — ` +
      `${base} → ${ctx.damage} dmg (×${EXECUTION_MULTIPLIER})`,
    );
  });
}
