// Relic Buff/Debuff Effect coverage. Every mechanic block that lived here (Grand Ritual, Harrier
// Brood, Withering Chorus, the Winter Warden's Frozen payoff, Tempest's Endless Storm, Berserker
// Rampage) went with the legacy class frames and specializations (CS7, CD8, SP7, AP7); what stays
// is the guard that a non-mechanic debuff is never reached by the registry.
import { SCALABLE_MECHANIC_DEBUFFS, scaleMechanicEffectConfig } from '@mmo-idle/shared';

function close(actual: number, expected: number, message: string, epsilon = 1e-6): void {
  if (Math.abs(actual - expected) > epsilon) {
    throw new Error(`${message}: got ${actual}, expected ${expected}`);
  }
}

// ── 11. A non-mechanic debuff must stay outside the registry's reach ────────────
{
  // dr-shatter was never opted into the Relic mechanic registry: scaling it
  // through SCALABLE_MECHANIC_DEBUFFS must be a no-op even at an extreme rating.
  const untouched = scaleMechanicEffectConfig(
    { id: 'dr-shatter', sourceId: 'p', data: { anything: 5 } },
    2.0,
    SCALABLE_MECHANIC_DEBUFFS,
  );
  close(untouched.data!.anything, 5, 'an id absent from the mechanic-debuff registry must never be scaled');

  // A monster-applied debuff on the player must not read the player's own Relic
  // at all — it isn't routed through applyPlayerDebuff, so this is definitional,
  // but assert the registry would refuse it anyway if someone tried.
  const monsterSlow = scaleMechanicEffectConfig(
    { id: 'debuff-slow', sourceId: 'monster', data: { moveSlowPct: 0.5 } },
    2.0,
    SCALABLE_MECHANIC_DEBUFFS,
  );
  close(monsterSlow.data!.moveSlowPct, 0.5, 'a monster-applied slow must never be scaled by a player Relic rating');
}

console.log('relicMechanicEffectCoverage.test.ts: ok');
