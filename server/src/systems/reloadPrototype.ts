import type { PlayerState } from '@mmo-idle/shared';
import { registerCombatListener } from './combatPipeline';
import { getResource, setResource, isCooldownActive, setCooldown } from './combatState';
import { setMaxResource } from './resourceMechanics';
import type { World } from '../world/World';

// ── Fallback constants (balanced-frame defaults, used when no frame is unlocked) ─

const RELOAD_MAX_AMMO = 8;
const RELOAD_TIME_MS  = 2500;

// combatState keys — reserved by this module
const AMMO_KEY   = 'ammo';
const RELOAD_KEY = 'reloadCooldown';

// ── Tick-driven reload completion ─────────────────────────────────────────────

/**
 * Run once per world tick, AFTER updateCombatState (so the reload cooldown
 * is already decremented before this checks it).
 *
 * For every reload-archetype player:
 *   1. First call: initialise the ammo resource from reload.max-ammo passive and
 *      mirror to PlayerState.
 *   2. When reload cooldown expires and ammo is 0: refill to the stored max.
 */
export function updateReloadArchetype(world: World): void {
  for (const player of world.players.values()) {
    if (player.combatArchetype !== 'reload') continue;

    const state = world.playerCombatState.get(player.id);
    if (!state) continue;

    const maxAmmo = Math.round(player.passives['reload.max-ammo'] ?? RELOAD_MAX_AMMO);
    
    // Lazy-init on first tick, or update when max-ammo passive changes
    if (state.resourceMaxes[AMMO_KEY] !== maxAmmo) {
      const isFirstInit = state.resourceMaxes[AMMO_KEY] === undefined;
      setMaxResource(state, AMMO_KEY, maxAmmo);
      
      // If setting max ammo for the first time, or if current ammo exceeds new max, adjust it
      const current = getResource(state, AMMO_KEY);
      if (isFirstInit || current > maxAmmo) {
        setResource(state, AMMO_KEY, maxAmmo);
        player.ammoCount = maxAmmo;
      }
      player.ammoMax = maxAmmo;
    }

    // Reload complete: refill when timer expired and clip is empty.
    if (!isCooldownActive(state, RELOAD_KEY) && getResource(state, AMMO_KEY) === 0) {
      const maxAmmo = state.resourceMaxes[AMMO_KEY] ?? RELOAD_MAX_AMMO;
      setResource(state, AMMO_KEY, maxAmmo);
      player.ammoCount = maxAmmo;
      player.ammoMax   = maxAmmo;
      console.log(`[Reload] ${player.id}: reload complete — ${maxAmmo} rounds`);
    }

    // Always mirror the authoritative CombatState values to PlayerState so the
    // client sees the correct ammo on every tick, regardless of which code path
    // updated the underlying resource.
    const syncedMax = state.resourceMaxes[AMMO_KEY];
    if (syncedMax !== undefined) {
      player.ammoMax   = syncedMax;
      player.ammoCount = getResource(state, AMMO_KEY);
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
 *   - Otherwise: consume one round; if that empties the clip, start the reload
 *     timer (duration from reload.reload-time-ms passive, or fallback constant).
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
      const reloadTimeMs = Math.round(player?.passives['reload.reload-time-ms'] ?? RELOAD_TIME_MS);
      setCooldown(state, RELOAD_KEY, reloadTimeMs);
      console.log(`[Reload] ${ctx.attacker.id}: clip empty — reloading (${reloadTimeMs}ms)`);
    }
  });
}
