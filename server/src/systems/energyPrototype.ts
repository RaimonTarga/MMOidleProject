import { registerCombatListener } from './combatPipeline';
import { gainResource, setMaxResource, isResourceFull, resetResource } from './resourceMechanics';
import { setEmpoweredAttack, registerEmpoweredMultiplier, isEmpoweredAttack } from './empoweredAttacks';
import { getResource } from './combatState';
import type { World } from '../world/World';

// ── Energy mechanic constants ─────────────────────────────────────────────────
//
// This mechanic belongs to the 'energy' class. It is activated via
// registerClassMechanic('energy', initEnergyArchetype) in index.ts.

const ENERGY_KEY     = 'energy';
const ENERGY_MAX     = 100;
const ENERGY_PER_HIT = 20;   // flat gain per successful hit
const EMPOWERED_MULT = 3;    // damage multiplier when empowerment fires

// ── Init ──────────────────────────────────────────────────────────────────────

/**
 * Register the energy accumulation and empowered-attack listeners for the
 * cooldown class. Called by activateClassMechanics('cooldown') at startup.
 *
 * Guards: both listeners early-return immediately for any player whose
 * selectedClass is not 'cooldown', so no energy state is touched for
 * other classes.
 *
 * Behavior:
 *   afterHit  → grant +ENERGY_PER_HIT to the attacker (cooldown class only)
 *             → if energy reaches ENERGY_MAX: reset to 0, arm empoweredAttack
 *   onHit     → if empoweredAttack armed: apply EMPOWERED_MULT× damage, consume flag
 *
 * Cancelled attacks never reach afterHit, so they generate no energy.
 * Resource max is initialized lazily on first hit so makeCombatState stays generic.
 */
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

export function initEnergyArchetype(): void {
  // 3× empowered multiplier — energy archetype only.
  registerEmpoweredMultiplier(EMPOWERED_MULT, {
    attackerType:      'player',
    attackerArchetype: 'energy',
  });

  // Energy gain after every confirmed hit by a cooldown-class player.
  registerCombatListener('afterHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.attacker.combatArchetype !== 'energy') return;

    const state = world.playerCombatState.get(ctx.attacker.id);
    if (!state) return;

    // Lazy-init: resetCombatState (on respawn) clears resourceMaxes,
    // so this re-runs on the first attack after each respawn.
    if (state.resourceMaxes[ENERGY_KEY] === undefined) {
      setMaxResource(state, ENERGY_KEY, ENERGY_MAX);
    }

    const newEnergy = gainResource(state, ENERGY_KEY, ENERGY_PER_HIT);
    console.log(`[Energy] ${ctx.attacker.id}: +${ENERGY_PER_HIT} → ${newEnergy}/${ENERGY_MAX}`);

    if (isResourceFull(state, ENERGY_KEY)) {
      resetResource(state, ENERGY_KEY);
      setEmpoweredAttack(state);
      console.log(`[Energy] ${ctx.attacker.id}: full energy — empowered attack armed!`);
    }
  });
}
