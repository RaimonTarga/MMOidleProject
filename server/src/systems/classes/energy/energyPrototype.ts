import { registerCombatListener } from '../../combatPipeline';
import { setEmpoweredAttack, registerEmpoweredMultiplier } from '../../empoweredAttacks';
import { initEnergyT3 } from './energyT3';
import type { World } from '../../../world/World';

// ── Energy mechanic constants ─────────────────────────────────────────────────

const ENERGY_MAX_DEFAULT = 100;

// Fallback values (balanced-frame defaults, used when no frame is unlocked).
const ENERGY_PER_HIT_DEFAULT = 14;   // energy gained per normal hit
const EMPOWERED_MULT_DEFAULT = 2.0;  // damage multiplier when empowerment fires

// ── Init ──────────────────────────────────────────────────────────────────────

/**
 * Register the energy accumulation and empowered-attack listeners for the
 * energy class. Called by activateClassMechanics('energy') at startup.
 *
 * Per-archetype runtime state (energy/energyMax/AC/CS/SM/SE bookkeeping)
 * lives on the energy component (see ecs/components/energy.ts), not on
 * CombatState resources/flags. The CombatState empowered-attack flag is
 * shared across archetypes and is still set via setEmpoweredAttack.
 *
 * Passive modifiers (read from player.passives):
 *   'energy.per-hit'        — energy gained per normal hit (set by frame node).
 *   'energy.empowered-mult' — empowered attack damage multiplier (set by frame node).
 *
 * Behavior:
 *   onHit    → if empoweredAttack armed: apply energy.empowered-mult× damage, consume flag.
 *   afterHit → if NOT an empowered hit: gain energy.per-hit energy.
 *            → if energy reaches energyMax: reset to 0, arm empoweredAttack.
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
    attackerSlice:     'usesEnergy',
    passiveKey:        'energy.empowered-mult',
  });

  registerCombatListener('afterHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;

    // Query by component presence, not by combatArchetype string.
    const entity = ctx.attacker;
    if (!entity?.usesEnergy) return;

    if (ctx.metadata['empoweredAttack']) return; // empowered hits never generate energy
    if (ctx.metadata['energyHandled']) return;   // T3 mechanic already handled this hit

    const energy  = entity.usesEnergy;

    if (energy.energyMax === 0) energy.energyMax = ENERGY_MAX_DEFAULT;

    const energyPerHit = Math.round(entity.usesSkills.passives['energy.per-hit'] ?? ENERGY_PER_HIT_DEFAULT);
    energy.energy = Math.min(energy.energy + energyPerHit, energy.energyMax);

    if (energy.energy >= energy.energyMax) {
      energy.energy = 0;
      setEmpoweredAttack(_world, entity);
    }

  });
}

// ── Per-tick update ───────────────────────────────────────────────────────────

/**
 * Run once per world tick to mirror energy state to the entity slice so the
 * client can display the energy bar and empowered flag without extra events.
 */
export function updateEnergyArchetype(world: World): void {
  void world;
}
