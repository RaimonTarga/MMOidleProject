// Wiring smoke tests for the combat-time core mechanics (rework Phase B).
//
// These cover the cores whose effect is NOT a stat multiplier resolved in the stat
// rebuild — the ones that need a heal funnel, a combat event, or a debuff scaler.
// Balance numbers are deliberately not asserted; shape and wiring are.
//
// Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/coreMechanics.test.ts

import {
  SCALABLE_DEBUFFS,
  scaleDebuffConfig,
  type StatusEffectConfig,
} from "@mmo-idle/shared";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const cfg = (over: Partial<StatusEffectConfig>): StatusEffectConfig => ({
  id: "vulnerability",
  sourceId: "p1",
  remainingMs: 1000,
  ...over,
});

// ── Duration scaling ─────────────────────────────────────────────────────────

{
  const out = scaleDebuffConfig(cfg({ data: { damageMultiplier: 1.2 } }), 1.25, 1);
  assert(out.remainingMs === 1250, `duration should scale: got ${out.remainingMs}`);
}

// An unregistered effect passes straight through — this is what makes migrating a
// call site to applyPlayerDebuff safe before its effect is registered.
{
  const input = cfg({ id: "some-class-resource-clock", data: { foo: 5 } });
  const out = scaleDebuffConfig(input, 1.25, 1.5);
  assert(out === input, "an unregistered effect must be returned untouched");
}

// remainingMs -1 is the "permanent / no timer" sentinel. Scaling it would produce
// -1.25 and quietly corrupt the sentinel.
{
  const out = scaleDebuffConfig(
    cfg({ id: "plating-shred", remainingMs: -1, data: { platingReduction: 4 } }),
    2,
    1,
  );
  assert(out.remainingMs === -1, `no-timer sentinel must survive: got ${out.remainingMs}`);
}

// ── Potency scaling: fraction vs multiplier encoding ─────────────────────────

// A `fraction` field holds the magnitude directly.
{
  const out = scaleDebuffConfig(
    cfg({ id: "expose-weakness", data: { damageTakenPct: 0.2 } }),
    1,
    1.5,
  );
  assert(
    Math.abs((out.data!.damageTakenPct) - 0.3) < 1e-9,
    `fraction field should scale directly: got ${out.data!.damageTakenPct}`,
  );
}

// A `multiplier` field holds 1 + magnitude. Scaling the WHOLE number is the bug
// this encoding exists to prevent: 1.2 * 1.5 = 1.8 (+80%) instead of 1.3 (+30%).
{
  const out = scaleDebuffConfig(cfg({ data: { damageMultiplier: 1.2 } }), 1, 1.5);
  assert(
    Math.abs((out.data!.damageMultiplier) - 1.3) < 1e-9,
    `multiplier field must scale only its excess over 1: got ${out.data!.damageMultiplier}`,
  );
}

// ── totalMs tracks the scaled duration (buff-bar clocks) ────────────────────

{
  const out = scaleDebuffConfig(
    cfg({ id: "dot-chill", remainingMs: 2000, data: { moveSlowPerStack: 0.1, totalMs: 2000 } }),
    1.5,
    1,
  );
  assert(out.remainingMs === 3000, `chill duration should scale: got ${out.remainingMs}`);
  assert(
    out.data!.totalMs === 3000,
    `totalMs must follow the scaled duration or the buff clock runs against a stale denominator: got ${out.data!.totalMs}`,
  );
}

// ── The input config is never mutated ───────────────────────────────────────

// Several call sites reuse or read back their config after applying; mutating it
// in place would leak scaled values into the next application.
{
  const input = cfg({ data: { damageMultiplier: 1.2 } });
  scaleDebuffConfig(input, 2, 2);
  assert(input.remainingMs === 1000, "scaling must not mutate the input remainingMs");
  assert(input.data!.damageMultiplier === 1.2, "scaling must not mutate the input data");
}

// ── Registry hygiene ────────────────────────────────────────────────────────

// `slow` is applied BY monsters and by dungeon hazards, never by the player. If it
// is ever registered, a Controller core starts strengthening the thing hitting you.
assert(
  !("slow" in SCALABLE_DEBUFFS),
  "`slow` is monster-applied and must never be in SCALABLE_DEBUFFS",
);
assert(
  !("debuff-stunned" in SCALABLE_DEBUFFS),
  "stun duration is not a core-scalable debuff",
);

console.log("coreMechanics: ok");
