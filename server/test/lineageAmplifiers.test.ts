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
 *
 * ON A COMPOSED PAIR (design §24.9). Every weapon band's payoff row is verbs now,
 * so a live amplifier modifies a verb whose payload is the active LEAN's: it moves
 * one axis of the composed pair — frequency, targets, duration, size — and an
 * axis the pair does not have moves its size instead. Blocks 2 and 2b sweep every
 * live amplifier against every lean; block 2c pins the legacy (non-composed) axes
 * on a parked tree's data, which still resolves that way.
 */
import assert from 'node:assert/strict';
import {
  LINEAGE_DATABASE, ROW_SCALAR, composedAmplifierMove, emptyEquipment, liveLineages, payloadSize,
  payoffLandsOnTarget, resolveActiveLineages, resolveLineageCard, resolveLineageCards,
} from '@mmo-idle/shared';
import type { LineageCard, LineageProgress, PacketId, ResolvedLineageCard } from '@mmo-idle/shared';

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

// ── 2. On a composed pair: every axis moves the thing it names, or the size ──
{
  // Every live amplifier, against every lean its lineage can slot (and none): the
  // pair with the amplifier against the same pair without it. What moved must be
  // exactly `composedAmplifierMove`'s answer, by exactly the row scalar, and
  // nothing else may move.
  const tick = (ms: number) => Math.max(100, Math.round(ms / 100) * 100);
  const seenAxes = new Set<string>();
  const seenMoves = new Set<string>();
  let pairs = 0;
  for (const [id, def] of LIVE) {
    for (const amp of def.cards.filter((c) => c.row === 'amplifier')) {
      seenAxes.add(amp.amplifies!);
      const target = cardOf(id, amp.modifies!);
      for (const leanLane of [undefined, ...def.lanes] as (PacketId | undefined)[]) {
        const lean = leanLane
          ? def.cards.find((c) => c.tier === target.tier && c.row === 'stat' && c.lane === leanLane)
          : undefined;
        const withLean = lean ? [lean] : [];
        const bare = activeCards(id, [...withLean, target]).find((c) => c.card.id === target.id)!;
        const amped = activeCards(id, [...withLean, target, amp]).find((c) => c.card.id === target.id)!;
        const label = `${amp.id} on ${leanLane ?? 'no lean'}×${target.lane}`;
        assert(bare.composition && amped.composition, `${label}: the target is a composed verb`);
        const move = composedAmplifierMove(bare.trigger!, bare.payoff!, amp.amplifies);
        seenMoves.add(move);
        pairs++;
        const b = bare.payoff!;
        const a = amped.payoff!;
        assert.equal(a.kind, b.kind, `${label}: the payload is the lean's either way`);
        assert.equal(amped.extraTriggers, undefined, `${label}: a composed pair never gains a second moment`);
        assert.equal(amped.perTargetTrigger, bare.perTargetTrigger, `${label}: the latch is the verb's`);
        switch (move) {
          case 'frequency': {
            assert(
              (amped.trigger!.n !== undefined && amped.trigger!.n < bare.trigger!.n!)
                || (amped.trigger!.capMs !== undefined && amped.trigger!.capMs < bare.trigger!.capMs!),
              `${label}: 'frequency' must make the moment come round sooner`,
            );
            assert.deepEqual(a, b, `${label}: 'frequency' must not touch the payload`);
            break;
          }
          case 'targets':
            assert(payoffLandsOnTarget(b.kind), `${label}: a second body only for a payload that lands on one`);
            assert.equal(a.extraTargets, 1, `${label}: 'targets' must add one body`);
            assert.equal(a.magnitude, b.magnitude, `${label}: 'targets' must not touch the size`);
            assert.deepEqual(amped.trigger, bare.trigger, `${label}: nor the moment`);
            break;
          case 'duration':
            assert(b.durationMs, `${label}: 'duration' only on a payload that holds`);
            assert.equal(a.durationMs, tick(b.durationMs! * (1 + BOOST)), `${label}: 'duration' lengthens by the row scalar`);
            if (payloadSize(b.kind).spread) {
              assert(a.magnitude > b.magnitude, `${label}: a bleed held longer keeps its tick rate, so its total grows`);
            } else {
              assert.equal(a.magnitude, b.magnitude, `${label}: 'duration' must not touch the size of a hold`);
            }
            assert.deepEqual(amped.trigger, bare.trigger, `${label}: nor the moment`);
            break;
          case 'size': {
            const size = payloadSize(b.kind);
            if (size.axis === 'share') {
              const expected = Math.round(b.magnitude * (1 + BOOST) * 1000) / 1000;
              assert.equal(a.magnitude, size.max !== undefined ? Math.min(size.max, expected) : expected, `${label}: a share grows by the row scalar`);
            } else if (size.axis === 'bonus') {
              assert.equal(a.magnitude, Math.round((1 + (b.magnitude - 1) * (1 + BOOST)) * 1000) / 1000, `${label}: a multiplier's bonus grows by the row scalar`);
            } else if (size.axis === 'duration') {
              assert.equal(a.durationMs, tick(b.durationMs! * (1 + BOOST)), `${label}: a hold grows by the row scalar`);
            } else {
              assert(Math.abs((a.bonusScale ?? 1) - (b.bonusScale ?? 1) * (1 + BOOST)) < 1e-3, `${label}: the proxy's bonus grows by the row scalar`);
            }
            assert.equal(a.extraTargets, b.extraTargets, `${label}: 'size' adds no body`);
            assert.deepEqual(amped.trigger, bare.trigger, `${label}: nor moves the moment`);
            break;
          }
        }
        // Whatever the move, the pair is never left as it was.
        assert.notEqual(
          JSON.stringify({ t: amped.trigger, p: a }), JSON.stringify({ t: bare.trigger, p: b }),
          `${label}: an amplifier never charges a price and changes nothing`,
        );
      }
    }
  }
  assert.equal(pairs, 15 * 4, `fifteen live amplifiers × (three leans + none), swept ${pairs}`);
  assert.deepEqual([...seenAxes].sort(), ['duration', 'magnitude', 'targets', 'trigger'], 'all four authored axes are live');
  assert.deepEqual([...seenMoves].sort(), ['duration', 'frequency', 'size', 'targets'], 'all four pair axes are reached');
}

// ── 2b. The `trigger` axis on a composed pair is the moment's FREQUENCY ──────
{
  const rapier = lineage('rapier');
  const ofLane = (row: string, lane: PacketId) =>
    rapier.cards.find((c) => c.tier === 2 && c.row === row && c.lane === lane)!;
  // Spreading Rot on the Affliction verb: the 5 s cap comes round faster. Its own
  // authored trigger ('kill') is not a second moment on a pair.
  {
    const verb = ofLane('payoff', 'affliction');
    const amp = ofLane('amplifier', 'affliction');
    assert.equal(amp.amplifies, 'trigger');
    const bare = activeCards('rapier', [verb]).find((c) => c.card.id === verb.id)!;
    const amped = activeCards('rapier', [verb, amp]).find((c) => c.card.id === verb.id)!;
    assert.equal(bare.trigger!.capMs, 5_000, 'fixture: the Affliction moment is capped at 5 s');
    assert.equal(amped.trigger!.capMs, 3_100, 'frequency: a 5 s cap at +60% rate is 3.1 s (tick-rounded)');
    assert.equal(amped.extraTriggers, undefined, 'and no kill moment is added');
  }
  // On the Tempo verb (a counted moment), the same axis shortens the count: the
  // Rapier's Tempo amplifier is a 'targets' one, so this is checked on the rule.
  {
    const verb = ofLane('payoff', 'tempo');
    const bare = activeCards('rapier', [verb]).find((c) => c.card.id === verb.id)!;
    assert.equal(composedAmplifierMove(bare.trigger!, bare.payoff!, 'trigger'), 'frequency');
  }
  // Fresh Opening on the Engagement verb: the composed moment ALREADY latches per
  // body, and a first hit has no count or cap — so it grows the lunge instead.
  {
    const verb = ofLane('payoff', 'engagement');
    const amp = ofLane('amplifier', 'engagement');
    const bare = activeCards('rapier', [verb]).find((c) => c.card.id === verb.id)!;
    const amped = activeCards('rapier', [verb, amp]).find((c) => c.card.id === verb.id)!;
    assert.equal(bare.perTargetTrigger, true, 'the Engagement moment is per body already');
    assert.equal(composedAmplifierMove(bare.trigger!, bare.payoff!, 'trigger'), 'size');
    assert(amped.payoff!.magnitude > bare.payoff!.magnitude, 'so the lunge lands bigger');
  }
}

// ── 2c. Legacy pairs keep the legacy axes (a parked tree's data) ─────────────
{
  // The non-weapon trees are parked, but their cards still resolve through the
  // legacy path when resolved directly; the composed rule must not leak into a
  // card that authors its own trigger and payoff.
  const robe = lineage('robe');
  const amp = robe.cards.find((c) => c.row === 'amplifier' && c.amplifies === 'trigger')!;
  const target = cardOf('robe', amp.modifies!);
  const t2 = robe.forms.find((f) => f.tier === 2)!;
  const tree: LineageProgress = {
    ownedCards: [target.id, amp.id], active: { payoff: target.id, amplifier: amp.id },
    ownedForms: [robe.forms[0]!.recipeId, t2.recipeId], wornForm: t2.recipeId,
  };
  const amped = resolveLineageCards(robe, tree).find((c: ResolvedLineageCard) => c.card.id === target.id)!;
  assert.equal(amped.composition, undefined, 'a legacy payoff does not compose');
  assert.equal(amped.extraTriggers?.[0]?.kind, amp.trigger, "a legacy 'trigger' amplifier still adds its own moment");
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

// ── 3b. The T1 verb stays reslottable under the collapsed band ──────────────
{
  // A collapsed band is a wardrobe (design §4): the T1 verb can sit in the payoff
  // row under a T2 form. It composes with the active (T2) lean at its OWN tier's
  // numbers, and the T2 amplifier — which modifies the T2 verb — is inert while
  // it does, exactly like any amplifier whose target is not slotted.
  const def = lineage('rapier');
  const t1Verb = cardOf('rapier', 'rapier-t1-tempo-payoff');
  const t2Verb = cardOf('rapier', 'rapier-t2-tempo-payoff');
  const t2Lean = cardOf('rapier', 'rapier-t2-affliction-stat');
  const amp = cardOf('rapier', 'rapier-t2-tempo-amplifier');
  const progress = progressWith('rapier', [t2Lean, t1Verb, amp]);
  progress.ownedCards.push(t2Verb.id);
  const cards = resolveActiveLineages({
    equipment: { ...emptyEquipment(), weapon: progress.wornForm },
    lineages: { rapier: progress },
  }).cards;
  const verb = cards.find((c) => c.card.id === t1Verb.id);
  assert(verb?.composition, 'the T1 verb resolves, composed');
  assert.equal(verb!.composition!.leanLane, 'affliction', 'with the T2 lean');
  assert.equal(verb!.payoff!.kind, 'hemorrhage', "paying the lean's payload");
  assert.equal(verb!.payoff!.magnitude, 1, 'at the T1 size: the verb is the T1 card');
  assert.equal(verb!.payoff!.extraTargets, undefined, 'and the T2 amplifier does not reach it');
  assert.equal(def.cards.find((c) => c.id === amp.modifies)?.tier, 2, 'fixture: the amplifier names the T2 verb');
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
