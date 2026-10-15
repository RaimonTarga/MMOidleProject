import {
  SCALABLE_MECHANIC_BUFFS,
  SCALABLE_MECHANIC_DEBUFFS,
  scaleMechanicEffectConfig,
  scaleMechanicMagnitude,
} from './mechanicEffectScaling';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

{
  const scaled = scaleMechanicMagnitude(
    'energy-overdrive',
    'attackDamagePct',
    0.5,
    1.25,
    SCALABLE_MECHANIC_BUFFS,
  );
  assert(scaled === 0.625, 'registered state-backed buff magnitude scales');
  const timing = scaleMechanicMagnitude(
    'energy-overdrive',
    'durationMs',
    5000,
    1.25,
    SCALABLE_MECHANIC_BUFFS,
  );
  assert(timing === 5000, 'unregistered state-backed fields remain unchanged');
}

{
  const scaled = scaleMechanicEffectConfig(
    { id: 'vulnerability', sourceId: 'player', data: { damageMultiplier: 1.2 } },
    1.5,
    SCALABLE_MECHANIC_DEBUFFS,
  );
  assert(
    Math.abs((scaled.data?.damageMultiplier ?? 0) - 1.3) < 1e-9,
    'multiplier field scales excess above one',
  );
}

{
  const scaled = scaleMechanicEffectConfig(
    { id: 'energy-overdrive', sourceId: 'player', data: { attackDamagePct: 0.05, baseCd: 1000 } },
    1.25,
    SCALABLE_MECHANIC_BUFFS,
  );
  assert(scaled.data?.attackDamagePct === 0.0625, 'registered mechanic buff scales');
  assert(scaled.data?.baseCd === 1000, 'unregistered buff field stays unchanged');
}

{
  const original = { id: 'ability-burn', sourceId: 'player', remainingMs: 3000, data: { damagePerStack: 10 } };
  const scaled = scaleMechanicEffectConfig(original, 2, SCALABLE_MECHANIC_DEBUFFS);
  assert(scaled === original, 'unregistered/ability effect is not scaled');
}

{
  const scaled = scaleMechanicEffectConfig(
    { id: 'dot', sourceId: 'player', data: { damagePerStack: 10, tickIntervalMs: 1000 } },
    0.5,
    SCALABLE_MECHANIC_DEBUFFS,
  );
  assert(scaled.data?.damagePerStack === 5, 'negative secondary rating remains safe');
  assert(scaled.data?.tickIntervalMs === 1000, 'tick timing is not scaled');
}

console.log('mechanicEffectScaling: ok');
