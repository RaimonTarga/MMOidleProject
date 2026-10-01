import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import { registerEmpoweredMultiplier, setEmpoweredAttack, isEmpoweredAttack } from '../../../combat/engine/empoweredAttacks';
import { emitMechanicFired } from '../../../combat/engine/mechanicFired';
import type { World } from '../../../../world/World';
import { initCadenceFrameLoop } from './frameLoop';
import { initCadenceT3 } from './t3';
import { relicRatingsFromPassives, resolveCadenceRelicProfile } from '@mmo-idle/shared';

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

  // `mechanic-fired` (progression rework 1c): the finisher IS cadence's moment,
  // and `empoweredAttack` metadata is set by exactly the handler above that
  // consumed the flag — so this reads "the flag was just spent", not "a flag
  // exists". Registered immediately after it, before the T3 hooks, so a card's
  // payoff and a T3 rider see the same hit.
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (!ctx.metadata['empoweredAttack']) return;
    if (!ctx.attacker.usesCadence) return;
    emitMechanicFired(world, ctx.attacker, ctx);
  });

  initCadenceT3();

  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.metadata['empoweredAttack']) return;

    const entity = ctx.attacker;
    if (!entity.usesCadence) return;

    // Chaotic miss while the finisher is armed: don't advance or consume the
    // sequence — the empowered attack stays queued for the next real hit. A miss
    // on a normal (non-armed) hit still advances the count below.
    if (ctx.metadata['chaoticMiss'] && isEmpoweredAttack(entity)) return;

    const cadence = entity.usesCadence;
    const passives = entity.usesSkills.passives;

    // Lazily initialize threshold on first hit if still 0 (fallback path).
    if (cadence.threshold === 0) {
      const base = Math.round(passives['cadence.empowered-threshold'] ?? CADENCE_THRESHOLD_DEFAULT);
      const mod  = Math.round(passives['cadence.threshold-mod'] ?? 0);
      cadence.threshold = resolveCadenceRelicProfile(
        Math.max(2, base + mod),
        passives['cadence.empowered-mult'] ?? CADENCE_DAMAGE_MULT_DEFAULT,
        relicRatingsFromPassives(passives),
      ).threshold.after;
    }

    cadence.count++;

    // Threshold is the full cycle length N. After (N-1) normal hits the counter
    // arms empowered for the next attack.
    if (cadence.count >= cadence.threshold - 1) {
      setEmpoweredAttack(world, entity);
      cadence.count = 0;
    }
  });

  // The frame loop (progression rework Phase 3) registers LAST: its finisher
  // branch folds the Breaker bank into the multiplier the handler above resolved,
  // and its window clamp reads the threshold the counting handler just settled.
  initCadenceFrameLoop();
}

export function updateCadenceArchetype(_world: World, _dt: number): void {
  // Cadence's current tick-driven effects live under t3/ and are called by the module.
}
