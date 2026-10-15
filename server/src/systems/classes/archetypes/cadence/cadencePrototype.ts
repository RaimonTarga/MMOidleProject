import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import { registerEmpoweredMultiplier, setEmpoweredAttack, isEmpoweredAttack, isMechanicProxy } from '../../../combat/engine/empoweredAttacks';
import { emitMechanicFired } from '../../../combat/engine/mechanicFired';
import type { World } from '../../../../world/World';
import { initCadenceFrameLoop } from './frameLoop';
import { initCadenceT3 } from './t3';
import { relicRatingsFromPassives, resolveCadenceRelicProfile } from '@mmo-idle/shared';
import { advanceStrikerBeat, initStrikerOrder, runStrikerBeat } from './order';
import { initStrikerGear } from './strikerGear';

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
    if (isMechanicProxy(ctx)) return; // a proxy counts as the finisher, never announces it (rule 3)
    if (!ctx.attacker.usesCadence) return;
    emitMechanicFired(world, ctx.attacker, ctx);
  });

  // The Order (class-first build plan CS.1): its casts, swing gate and finisher. After the
  // empowered multiplier, so the finisher's trophy reads the multiplied hit.
  initStrikerOrder();
  initStrikerGear();

  initCadenceT3();

  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    // A `mechanic-proxy` hit did not spend the finisher, so it counts like any hit.
    if (ctx.metadata['empoweredAttack'] && !isMechanicProxy(ctx)) return;

    const entity = ctx.attacker;
    if (!entity.usesCadence) return;

    // A swing that left an armed finisher unspent (a chaotic miss, a finisher the Order
    // holds) is not a beat: the finisher stays queued for the next real hit. A miss on a
    // normal (non-armed) hit still advances the count below.
    if (isEmpoweredAttack(entity)) return;

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

    // The beat's technique, price and spark (the Order), then count it. Threshold is the
    // full cycle length N: after (N-1) beats the counter arms the finisher.
    runStrikerBeat(world, ctx);
    advanceStrikerBeat(world, entity);
  });

  // The frame loop (progression rework Phase 3) registers LAST: its finisher
  // branch folds the Breaker bank into the multiplier the handler above resolved,
  // and its window clamp reads the threshold the counting handler just settled.
  initCadenceFrameLoop();
}

export function updateCadenceArchetype(_world: World, _dt: number): void {
  // Cadence's current tick-driven effects live under t3/ and are called by the module.
}
