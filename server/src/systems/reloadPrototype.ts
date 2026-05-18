import type { PlayerState } from '@mmo-idle/shared';
import { registerCombatListener } from './combatPipeline';
import { getResource, setResource, isCooldownActive, setCooldown } from './combatState';
import { setMaxResource } from './resourceMechanics';
import type { World } from '../world/World';

// ── Constants ─────────────────────────────────────────────────────────────────

export const RELOAD_MAX_AMMO = 8;
export const RELOAD_TIME_MS  = 2500; // ms to fully reload an empty clip

// combatState keys — reserved by this module
const AMMO_KEY   = 'ammo';
const RELOAD_KEY = 'reloadCooldown';

// ── Tick-driven reload completion ─────────────────────────────────────────────

/**
 * Run once per world tick, AFTER updateCombatState (so the reload cooldown
 * is already decremented before this checks it).
 *
 * For every reload-archetype player:
 *   1. First call: initialise the ammo resource and mirror to PlayerState.
 *   2. When reload cooldown expires and ammo is 0: refill to max.
 */
export function updateReloadArchetype(world: World): void {
  for (const player of world.players.values()) {
    if (player.combatArchetype !== 'reload') continue;

    const state = world.playerCombatState.get(player.id);
    if (!state) continue;

    // Lazy-init on first tick (also fires after respawn, which resets resourceMaxes).
    if (state.resourceMaxes[AMMO_KEY] === undefined) {
      setMaxResource(state, AMMO_KEY, RELOAD_MAX_AMMO);
      setResource(state, AMMO_KEY, RELOAD_MAX_AMMO);
      player.ammoCount = RELOAD_MAX_AMMO;
      player.ammoMax   = RELOAD_MAX_AMMO;
    }

    // Reload complete: refill when timer expired and clip is empty.
    if (!isCooldownActive(state, RELOAD_KEY) && getResource(state, AMMO_KEY) === 0) {
      setResource(state, AMMO_KEY, RELOAD_MAX_AMMO);
      player.ammoCount = RELOAD_MAX_AMMO;
      console.log(`[Reload] ${player.id}: reload complete — ${RELOAD_MAX_AMMO} rounds`);
    }
  }
}

// ── Combat listener ───────────────────────────────────────────────────────────

/**
 * Register the beforeAttack listener that enforces the ammo/reload gate.
 * Called once at server startup via registerClassMechanic / activateClassMechanics.
 *
 * Behavior:
 *   - If the reload cooldown is active or ammo is 0: cancel the attack.
 *   - Otherwise: consume one round; if that empties the clip, start the reload timer.
 */
export function initReloadArchetype(): void {
  registerCombatListener('beforeAttack', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.attacker.combatArchetype !== 'reload') return;

    const state = world.playerCombatState.get(ctx.attacker.id);
    if (!state) return;

    if (isCooldownActive(state, RELOAD_KEY) || getResource(state, AMMO_KEY) === 0) {
      ctx.cancelled = true;
      return;
    }

    const remaining = getResource(state, AMMO_KEY) - 1;
    setResource(state, AMMO_KEY, remaining);

    const player = world.players.get(ctx.attacker.id) as PlayerState | undefined;
    if (player) player.ammoCount = remaining;

    if (remaining === 0) {
      setCooldown(state, RELOAD_KEY, RELOAD_TIME_MS);
      console.log(`[Reload] ${ctx.attacker.id}: clip empty — reloading (${RELOAD_TIME_MS}ms)`);
    }
  });
}
