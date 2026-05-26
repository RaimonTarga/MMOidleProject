import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import { registerEmpoweredMultiplier, setEmpoweredAttack } from '../../../combat/engine/empoweredAttacks';
import type { World } from '../../../../world/World';
import { initCadenceT3 } from './t3';

const CADENCE_THRESHOLD_DEFAULT   = 5;   // cycle length: (N-1) normal hits + 1 empowered
const CADENCE_DAMAGE_MULT_DEFAULT = 2.0;

export function initCadenceArchetype(): void {
  // Register the empowered multiplier before T3 onHit hooks so finisher hooks
  // observe ctx.metadata['empoweredAttack'] on the same attack.
  registerEmpoweredMultiplier(CADENCE_DAMAGE_MULT_DEFAULT, {
    attackerType:  'player',
    attackerSlice: 'usesCadence',
    passiveKey:    'cadence.empowered-mult',
    passiveAddKey: 'cadence.damage-mult-add',
  });

  initCadenceT3();

  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.metadata['empoweredAttack']) return;

    const entity = ctx.attacker;
    if (!entity.usesCadence) return;

    const cadence = entity.usesCadence;
    const passives = entity.usesSkills.passives;

    // Lazily initialize threshold on first hit if still 0 (fallback path).
    if (cadence.threshold === 0) {
      const base = Math.round(passives['cadence.empowered-threshold'] ?? CADENCE_THRESHOLD_DEFAULT);
      const mod  = Math.round(passives['cadence.threshold-mod'] ?? 0);
      cadence.threshold = Math.max(2, base + mod);
    }

    cadence.count++;

    // Threshold is the full cycle length N. After (N-1) normal hits the counter
    // arms empowered for the next attack.
    if (cadence.count >= cadence.threshold - 1) {
      setEmpoweredAttack(world, entity);
      cadence.count = 0;
    }
  });
}

export function updateCadenceArchetype(_world: World, _dt: number): void {
  // Cadence's current tick-driven effects live under t3/ and are called by the module.
}
