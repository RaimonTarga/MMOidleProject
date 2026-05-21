import type { PlayerState } from '@mmo-idle/shared';
import { registerCombatListener } from './combatPipeline';
import { gainResource, setMaxResource, isResourceFull, resetResource } from './resourceMechanics';
import { setEmpoweredAttack, registerEmpoweredMultiplier, isEmpoweredAttack } from './empoweredAttacks';
import { getResource } from './combatState';
import { initEnergyT3 } from './energyT3';
import type { World } from '../world/World';

// ── Energy mechanic constants ─────────────────────────────────────────────────

const ENERGY_KEY = 'energy';
const ENERGY_MAX = 100;

// Fallback values (balanced-frame defaults, used when no frame is unlocked).
const ENERGY_PER_HIT_DEFAULT = 14;   // energy gained per normal hit
const EMPOWERED_MULT_DEFAULT = 2.0;  // damage multiplier when empowerment fires

// ── Init ──────────────────────────────────────────────────────────────────────

/**
 * Register the energy accumulation and empowered-attack listeners for the
 * energy class. Called by activateClassMechanics('energy') at startup.
 *
 * Passive modifiers (read from player.passives):
 *   'energy.per-hit'        — energy gained per normal hit (set by frame node).
 *   'energy.empowered-mult' — empowered attack damage multiplier (set by frame node).
 *
 * Behavior:
 *   onHit    → if empoweredAttack armed: apply energy.empowered-mult× damage, consume flag.
 *   afterHit → if NOT an empowered hit: gain energy.per-hit energy.
 *            → if energy reaches ENERGY_MAX: reset to 0, arm empoweredAttack.
 *
 * Empowered attack rule: empowered hits do NOT generate energy (afterHit guard).
 * Cancelled attacks never reach afterHit, so they also generate no energy.
 */
export function initEnergyArchetype(): void {
  // T3 listeners registered first so their onHit (empowered) handlers fire before
  // registerEmpoweredMultiplier consumes the flag, and their afterHit handlers
  // set ctx.metadata['energyHandled'] before the base handler runs.
  initEnergyT3();

  // Register the empowered multiplier — reads energy.empowered-mult from passives at runtime.
  registerEmpoweredMultiplier(EMPOWERED_MULT_DEFAULT, {
    attackerType:      'player',
    attackerArchetype: 'energy',
    passiveKey:        'energy.empowered-mult',
  });

  registerCombatListener('afterHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.attacker.combatArchetype !== 'energy') return;
    if (ctx.metadata['empoweredAttack']) return; // empowered hits never generate energy
    if (ctx.metadata['energyHandled']) return;   // T3 mechanic already handled this hit

    const state = world.playerCombatState.get(ctx.attacker.id);
    if (!state) return;

    // Lazy-init resource max (resets on respawn via resetCombatState).
    if (state.resourceMaxes[ENERGY_KEY] === undefined) {
      setMaxResource(state, ENERGY_KEY, ENERGY_MAX);
    }

    const player       = world.players.get(ctx.attacker.id) as PlayerState | undefined;
    const energyPerHit = Math.round(player?.passives['energy.per-hit'] ?? ENERGY_PER_HIT_DEFAULT);
    const newEnergy    = gainResource(state, ENERGY_KEY, energyPerHit);
    console.log(`[Energy] ${ctx.attacker.id}: +${energyPerHit} → ${newEnergy}/${ENERGY_MAX}`);

    if (isResourceFull(state, ENERGY_KEY)) {
      resetResource(state, ENERGY_KEY);
      setEmpoweredAttack(state);
      console.log(`[Energy] ${ctx.attacker.id}: full energy — empowered attack armed!`);
    }
  });
}

// ── Per-tick update ───────────────────────────────────────────────────────────

/**
 * Run once per world tick to mirror energy state to PlayerState so the
 * client can display the energy bar and empowered flag without extra events.
 */
export function updateEnergyArchetype(world: World): void {
  for (const player of world.players.values()) {
    if (player.combatArchetype !== 'energy') continue;

    const state = world.playerCombatState.get(player.id);
    if (!state) continue;

    player.energyCount    = getResource(state, ENERGY_KEY);
    player.empoweredReady = isEmpoweredAttack(state);
  }
}
