/**
 * The amplifier row modifies the payoff it names — it does not add a second one.
 *
 * Wave 1 authored sixty amplifier cards against a runtime that read `card.modifies`
 * in exactly one place: the purchase gate. An active amplifier was therefore
 * emitted as an ordinary card and its payoff fired as a SEPARATE effect, which was
 * wrong three different ways depending on the kind — the §18.1 max-wins rule
 * swallowed a duplicate `vulnerability` whole (a dead card), `echo-hit` echoed
 * twice, and the DoTs stacked. None of those is "the owned payoff, amplified".
 *
 * Two halves are tested here, because both have to hold for a card to mean
 * anything: `composeAmplifiers` folding the amplifier into its target at resolve
 * time (pure, no World), and the combat runtime honouring what the fold produced.
 */
import assert from 'node:assert/strict';
import {
  LINEAGE_DATABASE, ROW_SCALAR, emptyEquipment, liveLineages, resolveActiveLineages,
  resolveLineageCard,
} from '@mmo-idle/shared';
import type { LineageCard, LineageProgress } from '@mmo-idle/shared';

function lineage(id: string) {
  const def = LINEAGE_DATABASE.get(id);
  assert(def, `${id} should be a registered lineage`);
  return def!;
}

function cardOf(lineageId: string, cardId: string): LineageCard {
  const found = lineage(lineageId).cards.find((c) => c.id === cardId);
  assert(found, `${cardId} should exist on ${lineageId}`);
  return found!;
}

/** A worn T2 form with `cards` owned, and each slotted into its own row. */
function progressWith(lineageId: string, cards: LineageCard[]): LineageProgress {
  const def = lineage(lineageId);
  const t2 = def.forms.find((f) => f.tier === 2);
  assert(t2, `${lineageId} should have a T2 form to open its T2 band`);
  const active: LineageProgress['active'] = {};
  for (const c of cards) active[c.row] = c.id;
  return {
    ownedCards: cards.map((c) => c.id),
    active,
    ownedForms: [def.forms[0]!.recipeId, t2!.recipeId],
    wornForm: t2!.recipeId,
  };
}

function activeCards(lineageId: string, cards: LineageCard[]) {
  const def = lineage(lineageId);
  const progress = progressWith(lineageId, cards);
  return resolveActiveLineages({
    equipment: { ...emptyEquipment(), [def.slot]: progress.wornForm },
    lineages: { [lineageId]: progress },
  }).cards;
}

/**
 * The sweeps walk the LIVE trees only: a parked lineage (design §24.5 — every
 * armour, charm and boots tree) resolves no runtime cards at all, so its
 * amplifiers have nothing to fold into. Its data stays authored.
 */
const LIVE = new Map(liveLineages().map((l) => [l.id, l]));

const BOOST = ROW_SCALAR.amplifier;
assert(BOOST > 0, 'the amplifier row scalar is what an amplifier is worth; it must be non-zero');

// ── 1. An amplifier is never emitted as a card of its own ────────────────────
{
  // Every lineage, every amplifier: with the amplifier slotted, the runtime must
  // see the payoff and NOT the amplifier. This is the whole defect, swept.
  let checked = 0;
  for (const [id, def] of LIVE) {
    for (const amp of def.cards.filter((c) => c.row === 'amplifier')) {
      const target = def.cards.find((c) => c.id === amp.modifies);
      assert(target, `${amp.id} should modify a real card`);
      const cards = activeCards(id, [target!, amp]);
      assert(
        !cards.some((c) => c.card.row === 'amplifier'),
        `${amp.id}: an amplifier must be folded into its target, never emitted as a card`,
      );
      assert(
        cards.some((c) => c.card.id === target!.id),
        `${amp.id}: folding it must not drop the payoff it modifies (${target!.id})`,
      );
      checked++;
    }
  }
  // 15 = three per weapon lineage; the 45 on the parked trees are not swept.
  assert.equal(checked, 15, `expected 15 live amplifiers, swept ${checked}`);
}

// ── 2. Every axis moves the thing it names, and nothing else ─────────────────
{
  // One real card per axis, so the assertions are about shipped data rather than
  // a fixture that agrees with the implementation.
  const cases: Array<{ lineageId: string; ampId: string; axis: string }> = [];
  for (const [id, def] of LIVE) {
    for (const amp of def.cards.filter((c) => c.row === 'amplifier')) {
      if (!cases.some((c) => c.axis === amp.amplifies)) {
        cases.push({ lineageId: id, ampId: amp.id, axis: amp.amplifies! });
      }
    }
  }
  assert.equal(cases.length, 4, `all four axes should be in use, found ${cases.map(c => c.axis).join()}`);

  for (const { lineageId, ampId, axis } of cases) {
    const amp = cardOf(lineageId, ampId);
    const target = cardOf(lineageId, amp.modifies!);
    const def = lineage(lineageId);

    const bare = resolveLineageCard(target, def);
    const amped = activeCards(lineageId, [target, amp])
      .find((c) => c.card.id === target.id);
    assert(amped?.payoff, `${ampId}: the modified payoff should still resolve`);

    if (axis === 'duration') {
      assert(bare.payoff?.durationMs, `${target.id} needs a window for a duration amplifier`);
      assert.equal(
        amped!.payoff!.durationMs,
        Math.round(bare.payoff!.durationMs! * (1 + BOOST)),
        `${ampId}: 'duration' must lengthen the window by the amplifier row scalar`,
      );
      assert.equal(amped!.payoff!.magnitude, bare.payoff!.magnitude, `${ampId}: 'duration' must not touch magnitude`);
    }
    if (axis === 'magnitude') {
      assert(
        Math.abs(amped!.payoff!.magnitude - bare.payoff!.magnitude * (1 + BOOST)) < 1e-9,
        `${ampId}: 'magnitude' must raise the payoff by the amplifier row scalar`,
      );
      assert.equal(amped!.payoff!.durationMs, bare.payoff!.durationMs, `${ampId}: 'magnitude' must not touch the window`);
    }
    if (axis === 'targets') {
      assert.equal(amped!.payoff!.extraTargets, 1, `${ampId}: 'targets' must add one body`);
      assert.equal(amped!.payoff!.magnitude, bare.payoff!.magnitude, `${ampId}: 'targets' must not touch magnitude`);
    }
    if (axis === 'trigger') {
      assert.equal(
        amped!.extraTriggers?.length, 1,
        `${ampId}: 'trigger' must add exactly one further moment`,
      );
      assert.equal(
        amped!.extraTriggers![0]!.kind, amp.trigger,
        `${ampId}: the added moment is the amplifier's own trigger`,
      );
      assert.equal(amped!.payoff!.magnitude, bare.payoff!.magnitude, `${ampId}: 'trigger' must not touch magnitude`);
      assert.equal(amped!.payoff!.durationMs, bare.payoff!.durationMs, `${ampId}: 'trigger' must not touch the window`);
    }
  }
}

// ── 2b. `trigger` naming the trigger the payoff already fires on re-scopes it ─
{
  // Rapier's Fresh Opening: "every new body the duel turns to counts as a fresh
  // opening hit". Same trigger kind as its target, so it adds no moment — it
  // re-scopes `first-hit`'s latch from per-engagement to per-body. Adding an extra
  // trigger of a kind the card already fires on would instead be a no-op.
  const sameKind: Array<{ lineageId: string; amp: LineageCard }> = [];
  for (const [id, def] of LIVE) {
    for (const amp of def.cards) {
      if (amp.row !== 'amplifier' || amp.amplifies !== 'trigger') continue;
      const target = def.cards.find((c) => c.id === amp.modifies);
      if (target && target.trigger === amp.trigger) sameKind.push({ lineageId: id, amp });
    }
  }
  assert(sameKind.length > 0, 'at least one amplifier should re-scope its own trigger');

  for (const { lineageId, amp } of sameKind) {
    assert.equal(
      amp.trigger, 'first-hit',
      `${amp.id}: only 'first-hit' has a per-engagement latch worth re-scoping`,
    );
    const target = cardOf(lineageId, amp.modifies!);
    const amped = activeCards(lineageId, [target, amp]).find((c) => c.card.id === target.id);
    assert.equal(
      amped!.perTargetTrigger, true,
      `${amp.id}: naming its own trigger must re-scope the latch to per-body`,
    );
    assert.equal(
      amped!.extraTriggers, undefined,
      `${amp.id}: it must NOT add a duplicate moment, which the runtime would ignore`,
    );
  }
}

// ── 3. An amplifier whose target is not ACTIVE contributes nothing ───────────
{
  // `modifies` gates on OWNING the target, not slotting it, and one active card
  // per row means this loadout is legal: own both payoffs, slot the other one.
  const def = lineage('rapier');
  const amp = def.cards.find((c) => c.row === 'amplifier' && c.tier === 2)!;
  const target = cardOf('rapier', amp.modifies!);
  const otherPayoff = def.cards.find(
    (c) => c.row === 'payoff' && c.tier === 2 && c.id !== target.id,
  )!;

  const progress = progressWith('rapier', [otherPayoff, amp]);
  progress.ownedCards.push(target.id); // owned, so the purchase gate is satisfied
  const cards = resolveActiveLineages({
    equipment: { ...emptyEquipment(), weapon: progress.wornForm },
    lineages: { rapier: progress },
  }).cards;

  assert(
    !cards.some((c) => c.card.row === 'amplifier'),
    'an amplifier whose target is not slotted is still never emitted as a card',
  );
  const other = cards.find((c) => c.card.id === otherPayoff.id);
  assert(other, 'the payoff that IS slotted should resolve');
  const bareOther = resolveLineageCard(otherPayoff, def);
  assert.equal(
    other!.payoff!.magnitude, bareOther.payoff!.magnitude,
    'an amplifier must not amplify a payoff it does not name',
  );
  assert.equal(other!.payoff!.durationMs, bareOther.payoff!.durationMs, 'nor its window');
  assert.equal(other!.payoff!.extraTargets, undefined, 'nor its target count');
  assert.equal(other!.extraTriggers, undefined, 'nor its trigger set');
}

// ── 4. Folding is idempotent across repeated resolves ───────────────────────
{
  // Recalc runs often. If composition mutated the authored card rather than the
  // resolved copy, a second resolve would compound the boost — the same class of
  // defect the `plating-stack` fix fixed last night.
  const def = lineage('hammer');
  const amp = def.cards.find((c) => c.row === 'amplifier' && c.amplifies === 'duration')
    ?? def.cards.find((c) => c.row === 'amplifier')!;
  const target = cardOf('hammer', amp.modifies!);

  const first = activeCards('hammer', [target, amp]).find((c) => c.card.id === target.id);
  const second = activeCards('hammer', [target, amp]).find((c) => c.card.id === target.id);
  const third = activeCards('hammer', [target, amp]).find((c) => c.card.id === target.id);
  assert.equal(
    first!.payoff!.durationMs, second!.payoff!.durationMs,
    'resolving twice must not compound the amplification',
  );
  assert.equal(second!.payoff!.durationMs, third!.payoff!.durationMs, 'nor three times');
  assert.equal(
    first!.payoff!.magnitude, third!.payoff!.magnitude,
    'and the magnitude must be stable too',
  );
  // And the authored card itself is untouched, which is what makes that true.
  assert.equal(
    resolveLineageCard(target, def).payoff!.durationMs,
    resolveLineageCard(target, def).payoff!.durationMs,
    'the authored card must resolve the same way every time',
  );
}

console.log('lineageAmplifiers.test.ts: ok');
