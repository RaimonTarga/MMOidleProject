import {
  computeDotClassDamagePerStack,
  FIRE_DOT_PROFILE,
  FROST_DOT_PROFILE,
  POISON_DOT_PROFILE,
  resolveDotClassProfile,
} from './dotClassProfile';
import type { PassiveMap } from '../passives';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

function assertEq<T>(actual: T, expected: T, msg: string): void {
  if (actual !== expected) {
    throw new Error(`${msg}: expected ${expected}, got ${actual}`);
  }
}

{
  const poison = resolveDotClassProfile({}, 'light');
  assertEq(poison.element, 'poison', 'light resolves poison');
  assertEq(poison.conversionPct, POISON_DOT_PROFILE.conversionPct, 'poison conversion');
  assertEq(poison.maxStacks, POISON_DOT_PROFILE.maxStacks, 'poison stacks');
  assertEq(poison.tickIntervalMs, POISON_DOT_PROFILE.tickIntervalMs, 'poison tick');
  assertEq(poison.durationMs, POISON_DOT_PROFILE.durationMs, 'poison duration');
  assertEq(poison.dotMechanicMultiplier, POISON_DOT_PROFILE.dotMechanicMultiplier, 'poison multiplier');
}

{
  const fire = resolveDotClassProfile({}, 'balanced');
  assertEq(fire.element, 'fire', 'balanced resolves fire');
  assertEq(fire.tickIntervalMs, FIRE_DOT_PROFILE.tickIntervalMs, 'fire tick');
  assertEq(fire.durationMs, FIRE_DOT_PROFILE.durationMs, 'fire duration');
}

{
  const frost = resolveDotClassProfile({}, 'heavy');
  assertEq(frost.element, 'frost', 'heavy resolves frost');
  assertEq(frost.tickIntervalMs, FROST_DOT_PROFILE.tickIntervalMs, 'frost tick');
  assertEq(frost.durationMs, FROST_DOT_PROFILE.durationMs, 'frost duration');
}

{
  const passives: PassiveMap = {
    'dot.conversion-pct': 0.9,
    'dot.max-stacks': 12,
    'dot.tick-interval-ms': 500,
    'dot.duration-ms': 7_000,
  };
  const profile = resolveDotClassProfile(passives, 'balanced');
  assertEq(profile.element, 'fire', 'overrides preserve element');
  assertEq(profile.conversionPct, 0.9, 'conversion override');
  assertEq(profile.maxStacks, 12, 'stack override');
  assertEq(profile.tickIntervalMs, 500, 'tick override');
  assertEq(profile.durationMs, 7_000, 'duration override');
  assertEq(profile.dotMechanicMultiplier, FIRE_DOT_PROFILE.dotMechanicMultiplier, 'multiplier stays profile-owned');
}

{
  const fire = resolveDotClassProfile({}, 'balanced');
  const stack = computeDotClassDamagePerStack(100, fire);
  assertEq(stack, 15, 'fire stack damage uses attack profile');
  assert(
    stack !== computeDotClassDamagePerStack(200, fire),
    'stack damage is sensitive to attack base only',
  );
}

{
  const frost = resolveDotClassProfile({}, 'heavy');
  const fullStackTick = computeDotClassDamagePerStack(100, frost) * frost.maxStacks;
  assertEq(fullStackTick, 162, 'frost full-stack tick includes mechanic multiplier');
}

console.log('dotClassProfile.test.ts: ok');
