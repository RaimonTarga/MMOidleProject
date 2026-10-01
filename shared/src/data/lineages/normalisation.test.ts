/**
 * Design §18.3: a payoff's magnitude is divided by how often its trigger fires, so
 * `PAYOFF_UNIT` is a PER-PULL total and `PACKET_BUDGET` compares like with like.
 *
 * Before this, one lane scalar paid a payoff that fires on every hit and one that
 * fires once per pull exactly the same, and the Phase 1.5 bench measured the
 * consequence: Affliction fired 4563 times against Engagement's 452, and no packet
 * landed inside §9's band.
 *
 * Run: node --conditions=development --import tsx shared/src/data/lineages/normalisation.test.ts
 */
import { LINEAGE_DATABASE } from './index';
import { PAYOFF_UNIT, REFERENCE_PULL, payoffValue, triggerFiresPerPull } from './magnitudes';
import { resolveLineageCard } from './resolve';
import type { PacketId, TriggerKind } from './types';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

// ── the rate table itself ────────────────────────────────────────────────────
{
  assert(
    triggerFiresPerPull({ kind: 'hit-nth', n: 1 }) === REFERENCE_PULL.hits,
    'an every-hit trigger fires once per landed hit',
  );
  assert(
    triggerFiresPerPull({ kind: 'hit-nth', n: 3 }) === REFERENCE_PULL.hits / 3,
    'a third-hit trigger fires a third as often',
  );
  assert(triggerFiresPerPull({ kind: 'first-hit' }) === 1, 'first-hit is once per pull');
  assert(
    triggerFiresPerPull({ kind: 'kill' }) === REFERENCE_PULL.bodies,
    'kill fires once per body',
  );
  assert(triggerFiresPerPull(undefined) === 1, 'no trigger is a single fire, never zero');
  for (const kind of ['mechanic-fired', 'evade', 'hit-taken', 'standing', 'pulse'] as TriggerKind[]) {
    assert(triggerFiresPerPull({ kind }) >= 1, `${kind} must never normalise by less than 1`);
  }
}

// ── the invariant: per-pull value does not depend on the trigger's rate ──────
{
  const base = { payoff: 'echo-hit' as const, tier: 1, row: 'payoff' as const, lane: 'tempo' as PacketId };
  const perPull = (trigger: { kind: TriggerKind; n?: number }): number =>
    payoffValue({ ...base, trigger }).magnitude * triggerFiresPerPull(trigger);

  const everyHit = perPull({ kind: 'hit-nth', n: 1 });
  const thirdHit = perPull({ kind: 'hit-nth', n: 3 });
  const oncePerPull = perPull({ kind: 'first-hit' });

  // Rounding keeps these from being exactly equal, so compare within a few percent.
  for (const [label, value] of [['third hit', thirdHit], ['once per pull', oncePerPull]] as const) {
    const drift = Math.abs(value - everyHit) / everyHit;
    assert(
      drift < 0.05,
      `per-pull value should not depend on the trigger rate: every-hit ${everyHit} vs ${label} ${value}`,
    );
  }

  // And the un-normalised reading is the authored unit, which is what makes
  // PAYOFF_UNIT readable as a per-pull budget.
  const unit = PAYOFF_UNIT.get('echo-hit');
  assert(unit !== undefined, 'echo-hit should have a unit');
  const drift = Math.abs(oncePerPull - (unit?.magnitude ?? 0)) / (unit?.magnitude ?? 1);
  assert(drift < 0.05, `a once-per-pull payoff should be worth its unit, got ${oncePerPull}`);
}

// ── binary payoffs are never normalised ──────────────────────────────────────
{
  for (const [kind, unit] of PAYOFF_UNIT) {
    if (!unit.binary) continue;
    const fast = payoffValue({
      payoff: kind, tier: 1, row: 'payoff', lane: 'control',
      trigger: { kind: 'hit-nth', n: 1 },
    });
    const slow = payoffValue({
      payoff: kind, tier: 1, row: 'payoff', lane: 'control',
      trigger: { kind: 'first-hit' },
    });
    assert(
      fast.magnitude === slow.magnitude && fast.magnitude === unit.magnitude,
      `binary payoff '${kind}' must ignore the trigger rate: ${fast.magnitude} vs ${slow.magnitude}`,
    );
  }
}

// ── every authored payoff card still resolves to something that does work ────
{
  for (const [lineageId, lineage] of LINEAGE_DATABASE) {
    for (const card of lineage.cards) {
      if (card.row === 'stat' || !card.payoff) continue;
      const resolved = resolveLineageCard(card, { tier: card.tier });
      const magnitude = resolved.payoff?.magnitude ?? 0;
      assert(
        magnitude > 0,
        `${lineageId}/${card.id} normalised to ${magnitude}; a card that does nothing is not a card`,
      );
    }
  }
}

console.log('normalisation: ok');
