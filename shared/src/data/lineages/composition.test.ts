/**
 * The T1 lean and verb compose (design §24.2) — data and resolve-time halves.
 *
 * WHAT THIS PINS:
 *   1. every weapon packet has both halves, its numbers, and phrases that render;
 *   2. the rendered moment / payload / pure strings equal the approved review sheet
 *      (course-correction brief, 2026-10-03) at today's numbers — so a phrase or
 *      a number edit that changes what the player reads fails here, loudly;
 *   3. the composition rule: another lane's lean → the verb's moment with the
 *      lean's payload (and the payload's own fx); the same lane or no lean → the
 *      verb lane's pure pair; every weapon's nine pairs produce a sentence, and
 *      the three same-lane ones read the pure sentence;
 *   4. no composition recurses: the payload that "counts as the mechanic" never
 *      sits on the mechanic's own moment;
 *   5. `resolveLineageCards` re-composes an active verb against the active lean,
 *      and the sentence helpers the page reads (`cardSentence`,
 *      `composedSentence`) agree with it;
 *   6. the T1 band after design §26.1: three RANKED leans (Attack, Speed, Effect)
 *      and ONE verb, the weapon's own. Every weapon × lean × rank (5 × 3 × 3 = 45
 *      cells) composes with the fixed verb: an Attack or Speed lean names no
 *      payload (the verb reads its pure pair at its base size), an Effect lean
 *      names the verb's own lane and, where Effect is the payload's size, scales it
 *      by the rank; the two-colour halves join to the sentence;
 *   7. T2+ bands compose too (design §24.9): every weapon band above T1 that
 *      authors a payoff row is three verbs; all nine pairs produce a sentence with
 *      the tier's numbers, and resolve on the SAME moment as their T1 pair with a
 *      payload at least as large on every number (a gate never makes a card
 *      smaller); the tier moves the payload's size and never the cadence.
 *
 * Run: node --conditions=development --import tsx shared/src/data/lineages/composition.test.ts
 */
import {
  bandComposes, cardSentence, composedSentence, composedSentenceParts, leanLaneFor, lineagePayloadScales,
  resolveActiveLineages, resolveLineageCards,
} from '../../systems/lineages';
import { emptyEquipment } from '../../items';
import { LINEAGE_DATABASE, lineagesForSlot } from './index';
import { PACKET_DEFINITIONS, packetHalves } from './packets';
import {
  LEAN_CONDITION_NUMBERS, LEAN_RANK_ONE, LEAN_RANK_VALUE_SCALE, MAX_LEAN_RANK, PACKET_HALF_NUMBERS, STAT_UNIT,
  payloadSize, quickenMoment, scalePayloadSize, statRowValue, verbTierScalar,
} from './magnitudes';
import {
  cardStatKey, composeVerb, isVerbCard, leanPayloadLane, packetMoment, packetPayload, packetPurePair,
  resolveLineageCard,
} from './resolve';
import {
  compositionParts, momentText, payloadText, pureSentenceParts, pureSentenceText, statLine, verbSentence,
} from './sentences';
import { PACKET_IDS, PLAIN_ROW_LABELS, ROW_LABELS, WEAPON_PACKET_IDS, rowLabel } from './types';
import type { LineageCard, LineageDefinition, LineagePayoff, LineageProgress, PacketId } from './types';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

// ── 1. Every weapon packet has all halves ────────────────────────────────────

for (const id of WEAPON_PACKET_IDS) {
  const halves = packetHalves(id);
  assert(halves, `weapon packet '${id}' has no lean/verb halves`);
  assert(PACKET_HALF_NUMBERS[id], `weapon packet '${id}' has no numbers in PACKET_HALF_NUMBERS`);
  assert(packetMoment(id), `packet '${id}': moment did not resolve`);
  assert((packetPayload(id)?.magnitude ?? 0) > 0, `packet '${id}': payload magnitude is not positive`);
  assert((packetPurePair(id)?.payoff.magnitude ?? 0) > 0, `packet '${id}': pure magnitude is not positive`);
  assert(PACKET_DEFINITIONS.get(id)?.shardName, `packet '${id}' has no shard name`);
  for (const [label, text] of [
    ['moment', momentText(id)], ['payload', payloadText(id)], ['pure', pureSentenceText(id)],
  ] as const) {
    assert(typeof text === 'string' && text.length > 0, `packet '${id}': the ${label} phrase did not render`);
    assert(!/[{}]/.test(text ?? ''), `packet '${id}': the ${label} phrase left a slot unfilled: ${text}`);
  }
  assert(pureSentenceText(id)!.endsWith('.'), `packet '${id}': the pure sentence is a sentence`);
}
// §24.2 gives the two defensive packets no halves while non-weapon trees are
// parked. Named so the gap cannot close silently in either direction.
for (const id of PACKET_IDS) {
  if (WEAPON_PACKET_IDS.includes(id)) continue;
  assert(!packetHalves(id), `defensive packet '${id}' grew halves — §24.2 has none; update this test`);
}

// ── 2. The approved review sheet, at today's numbers ─────────────────────────

const REVIEW_SHEET: Record<string, { moment: string; payload: string; pure: string }> = {
  tempo: {
    moment: 'Every 6th hit',
    payload: 'lands twice',
    pure: 'Every 6th hit strikes twice.',
  },
  affliction: {
    moment: 'A hit on a target you have already afflicted (every 5 s at most)',
    payload: 'leaves a heavy poison or bleed, a whole swing over 4 s',
    pure: 'Hitting an afflicted target doubles its affliction.',
  },
  engagement: {
    moment: 'Your first hit on each new target',
    payload: 'is a lunge for double damage',
    pure: 'Your first hit on each target is a lunge for double damage.',
  },
  empowered: {
    moment: 'When your class mechanic fires (every 4 s at most)',
    payload: 'counts as your class mechanic firing',
    pure: 'Your mechanic hits half again as hard.',
  },
  control: {
    moment: 'A hit on a slowed or rooted target (every 5 s at most)',
    payload: 'roots the target for 2 s',
    pure: 'Hitting a held target knocks it down for 1.5 s.',
  },
  'kill-chain': {
    moment: 'Your next hit after a kill',
    payload: 'heals a tenth of your pool and lands loaded (+50%)',
    pure: 'Your next hit after a kill heals a tenth of your pool and lands loaded (+50%).',
  },
  technique: {
    moment: 'When a Technique lands',
    payload: 'refunds a third of your Technique cooldowns',
    pure: 'A landed Technique refunds half its cooldown.',
  },
};
for (const [id, sheet] of Object.entries(REVIEW_SHEET) as [PacketId, typeof REVIEW_SHEET[string]][]) {
  assert(momentText(id) === sheet.moment, `${id} moment: "${momentText(id)}" ≠ "${sheet.moment}"`);
  assert(payloadText(id) === sheet.payload, `${id} payload: "${payloadText(id)}" ≠ "${sheet.payload}"`);
  assert(pureSentenceText(id) === sheet.pure, `${id} pure: "${pureSentenceText(id)}" ≠ "${sheet.pure}"`);
}
// The two grammars, rendered: a subject moment reads straight into its payload,
// a clause moment hands the payload to "the hit".
assert(
  verbSentence('tempo', 'affliction') === 'Every 6th hit leaves a heavy poison or bleed, a whole swing over 4 s.',
  `subject grammar: ${verbSentence('tempo', 'affliction')}`,
);
assert(
  verbSentence('technique', 'tempo') === 'When a Technique lands, the hit lands twice.',
  `clause grammar: ${verbSentence('technique', 'tempo')}`,
);
assert(
  verbSentence('affliction', 'engagement')
    === 'A hit on a target you have already afflicted (every 5 s at most) is a lunge for double damage.',
  `subject grammar with a capped moment: ${verbSentence('affliction', 'engagement')}`,
);

// The Technique payload rides only another lane's moment, where no Technique
// landed: it never names "that" Technique (it refunds every one, as the runtime does).
assert(
  verbSentence('tempo', 'technique') === 'Every 6th hit refunds a third of your Technique cooldowns.',
  `technique payload at a hit moment: ${verbSentence('tempo', 'technique')}`,
);
for (const verb of WEAPON_PACKET_IDS) {
  for (const lean of WEAPON_PACKET_IDS) {
    const sentence = verbSentence(verb, lean) ?? '';
    if (verb !== 'technique') assert(!/that Technique/.test(sentence), `${verb}×${lean}: "${sentence}"`);
    assert(!/once every/.test(sentence), `${verb}×${lean}: a cap reads "(every N s at most)": "${sentence}"`);
  }
}

// ── 3. The composition rule ──────────────────────────────────────────────────

for (const verb of WEAPON_PACKET_IDS) {
  const pure = packetPurePair(verb)!;
  const alone = composeVerb(verb)!;
  assert(alone.pure && alone.leanLane === undefined, `${verb} with no lean is pure`);
  assert(alone.payoff.kind === pure.payoff.kind, `${verb} with no lean pays its pure payoff`);
  assert(alone.trigger.kind === pure.trigger.kind, `${verb} with no lean fires its own moment`);
  assert(verbSentence(verb) === pureSentenceText(verb), `${verb} with no lean reads its pure sentence`);
  assert(alone.fx === packetHalves(verb)!.pure.fx, `${verb} with no lean draws its pure fx`);

  for (const lean of WEAPON_PACKET_IDS) {
    const composed = composeVerb(verb, lean)!;
    assert(composed.trigger.kind === packetMoment(verb)!.kind, `${verb}×${lean}: the VERB names the moment`);
    if (lean === verb) {
      assert(composed.pure, `${verb}×${lean}: the same lane is the pure pair`);
      assert(verbSentence(verb, lean) === pureSentenceText(verb), `${verb}×${lean}: reads the pure sentence`);
      continue;
    }
    assert(!composed.pure, `${verb}×${lean}: another lane composes`);
    assert(composed.payoff.kind === packetHalves(lean)!.payload, `${verb}×${lean}: the LEAN names the payload`);
    assert(composed.fx === packetHalves(lean)!.payloadFx, `${verb}×${lean}: a payload owns its fx`);
    // ── 4. No composition recurses ──
    assert(
      !(composed.trigger.kind === 'mechanic-fired' && composed.payoff.kind === 'mechanic-proxy'),
      `${verb}×${lean}: the mechanic proxy must never ride the mechanic's own moment`,
    );
  }
}
// The Control moment needs a hold; the page says so — unless the lean is the
// Control lean, whose slow on every hit IS the hold (design §24.9).
for (const lean of [undefined, ...WEAPON_PACKET_IDS]) {
  const expected = lean === 'control' ? undefined : 'slow';
  assert(composeVerb('control', lean)?.needs === expected,
    `control verb × ${lean ?? 'no lean'}: ${expected ? 'needs a slow' : 'its own lean holds the target'}`);
  assert(composeVerb('tempo', lean)?.needs === undefined, `tempo verb × ${lean ?? 'no lean'}: needs nothing`);
}
assert(PACKET_DEFINITIONS.get('control')?.scalingStat === 'slowOnHit', 'the Control lean is its slow, not Attack');
// The moments carry the shapes §24.2 names.
assert(packetMoment('tempo')?.n === 6, 'tempo fires on every 6th hit');
assert(packetMoment('affliction')?.capMs === 5_000, 'the affliction moment caps at one per 5 s');
assert(packetMoment('control')?.capMs === 5_000, 'the control moment caps at one per 5 s');
assert(packetMoment('empowered')?.capMs === 4_000, 'the empowered moment caps at one per 4 s (design §24.9)');
assert(packetMoment('engagement')?.perTarget === true, 'the engagement moment latches per body');
assert(packetMoment('kill-chain')?.carry === true, 'the kill-chain moment is the next hit after a kill');

// Every weapon's nine lean × verb pairs produce a sentence, three of them pure.
for (const lineage of lineagesForSlot('weapon')) {
  let pureCount = 0;
  for (const verb of lineage.lanes) {
    for (const lean of lineage.lanes) {
      const sentence = verbSentence(verb, lean);
      assert(typeof sentence === 'string' && sentence.endsWith('.'), `${lineage.id} ${verb}×${lean}: no sentence`);
      if (sentence === pureSentenceText(verb)) pureCount += 1;
    }
  }
  assert(pureCount === 3, `${lineage.id}: exactly the three same-lane pairs read pure, got ${pureCount}`);
}

// ── 5. resolveLineageCards composes; the sentence helpers agree ──────────────

const rapier = LINEAGE_DATABASE.get('rapier')!;
const leanCard = (lane: PacketId): LineageCard => ({
  id: `test-rapier-lean-${lane}`, lineageId: 'rapier', tier: 1, row: 'stat', lane,
  name: 'Test lean', description: '', fx: `${lane}.trail` as LineageCard['fx'],
});
const verbCard = (lane: PacketId): LineageCard => ({
  id: `test-rapier-verb-${lane}`, lineageId: 'rapier', tier: 1, row: 'payoff', lane,
  name: 'Test verb', description: '', fx: 'tempo.ghost-strike',
});
const synthetic: LineageDefinition = {
  ...rapier,
  cards: [...rapier.lanes.map(leanCard), ...rapier.lanes.map(verbCard)],
};
const progress = (lean: PacketId | undefined, verb: PacketId): LineageProgress => {
  const owned = [verbCard(verb).id, ...(lean ? [leanCard(lean).id] : [])];
  return {
    ownedCards: owned,
    active: { payoff: verbCard(verb).id, ...(lean ? { stat: leanCard(lean).id } : {}) },
    ownedForms: ['flash-rapier'],
    wornForm: 'flash-rapier',
  };
};

assert(isVerbCard(verbCard('tempo')) && !isVerbCard(leanCard('tempo')), 'a verb is a payoff row with no trigger/payoff');
for (const verb of rapier.lanes) {
  for (const lean of [undefined, ...rapier.lanes]) {
    const cards = resolveLineageCards(synthetic, progress(lean, verb));
    const resolvedVerb = cards.find((c) => c.card.row === 'payoff');
    const expected = composeVerb(verb, lean)!;
    assert(resolvedVerb?.trigger?.kind === expected.trigger.kind, `rapier ${verb}×${lean}: resolved moment`);
    assert(resolvedVerb?.payoff?.kind === expected.payoff.kind, `rapier ${verb}×${lean}: resolved payload`);
    assert(resolvedVerb?.payoffFx === expected.fx, `rapier ${verb}×${lean}: resolved payload fx`);
    assert(resolvedVerb?.composition?.pure === expected.pure, `rapier ${verb}×${lean}: purity recorded`);
    assert(
      (resolvedVerb?.perTargetTrigger ?? false) === (expected.trigger.perTarget ?? false),
      `rapier ${verb}×${lean}: the per-body latch rides through`,
    );
  }
}

// A verb resolved on its own (no progress) reads its pure pair.
{
  const alone = resolveLineageCard(verbCard('engagement'), rapier);
  assert(alone.payoff?.kind === 'big-hit' && alone.payoff.magnitude === 2, 'a lone engagement verb is a ×2 lunge');
  assert(alone.trigger?.kind === 'first-hit' && alone.perTargetTrigger === true, 'latched per body');
}

// The lean's sentence is its stat line; the numbers come from STAT_UNIT.
assert(STAT_UNIT.attackSpeedPct === 0.09, 'the Tempo lean is +9% attack speed (PROVISIONAL)');
assert(statLine({ attackSpeedPct: 0.09 }) === '+9% attack speed.', `stat line: ${statLine({ attackSpeedPct: 0.09 })}`);
assert(statLine({ attack: 3 }) === '+3 Attack.', `stat line: ${statLine({ attack: 3 })}`);
// The Affliction lean seeds its condition for every class (design §24.9): its line
// says the bleed, from the stat and the lean-condition table.
assert(
  statLine({ dotPotencyPct: 0.1 }) === '+10% DoT potency, and every hit bleeds for a tenth of its damage over 4 s.',
  `stat line: ${statLine({ dotPotencyPct: 0.1 })}`,
);
assert(statLine({ speed: 11 }) === '+11 move speed.', `stat line: ${statLine({ speed: 11 })}`);
assert(statLine({ dotPotencyPct: 0.1 }, 'short') === '+10% DoT potency.', 'the short form quotes the bare stat');
assert(STAT_UNIT.slowOnHit === 0.15, 'the Control lean is a 15% slow (PROVISIONAL)');
assert(
  statLine({ slowOnHit: 0.15 }) === 'Every hit slows its target by 15% until your next swing.',
  `stat line: ${statLine({ slowOnHit: 0.15 })}`,
);
// Each of the Hammer's three leans names its own stat (they read "+9% Attack.",
// "+3 Attack." and "+3 Attack." while Control borrowed Attack).
{
  const hammer = LINEAGE_DATABASE.get('hammer')!;
  const lines = hammer.cards.filter((c) => c.tier === 1 && c.row === 'stat').map((c) => cardSentence(c, {
    ownedCards: [], active: {}, ownedForms: ['heavy-hammer'], wornForm: 'heavy-hammer',
  }));
  assert(new Set(lines).size === 3, `the Hammer's leans read three different lines: ${lines.join(' | ')}`);
}

// `composedSentence` and `cardSentence` read the active lean. Registered rapier
// cards are needed for `cardSentence` (it looks the lineage up by id), so the
// synthetic halves are checked through the lower-level helper here and through
// the real T1 band once it is authored as leans and verbs.
assert(
  composedSentence(synthetic, progress('affliction', 'engagement')) === verbSentence('engagement', 'affliction'),
  'composedSentence reads the active verb with the active lean',
);
assert(composedSentence(synthetic, progress(undefined, 'tempo')) === pureSentenceText('tempo'), 'no lean → pure');
for (const card of rapier.cards.filter((c) => c.tier === 1 && c.row === 'stat')) {
  const line = cardSentence(card, { ownedCards: [], active: {}, ownedForms: ['flash-rapier'], wornForm: 'flash-rapier' });
  assert(typeof line === 'string' && line.startsWith('+') && line.endsWith('.'), `${card.id}: lean sentence "${line}"`);
}

// The labels the page reads for the two T1 rows.
assert(ROW_LABELS.stat === 'Lean' && ROW_LABELS.payoff === 'Verb', 'the T1 rows read Lean and Verb');

// ── 6. The five T1 weapon bands: the ranked trio and the weapon's own verb ───

let t1Cells = 0;
for (const lineage of lineagesForSlot('weapon')) {
  const band = lineage.cards.filter((c) => c.tier === 1);
  const verbs = band.filter((c) => c.row === 'payoff');
  const leans = band.filter((c) => c.row === 'stat');
  assert(verbs.length === 1 && isVerbCard(verbs[0]!), `${lineage.id}: ONE T1 verb, authored with no trigger/payoff`);
  assert(leans.length === 3 && leans.every((c) => c.leanKind), `${lineage.id}: three ranked T1 leans`);
  const verb = verbs[0]!;
  // Above T1, a payoff row is verbs too (design §24.9); no other row is.
  for (const card of lineage.cards.filter((c) => c.tier > 1)) {
    assert(isVerbCard(card) === (card.row === 'payoff'), `${card.id}: a weapon band's payoff row, and only it, is verbs`);
  }

  const base = lineage.forms.find((f) => f.tier === 1)!.recipeId;
  const pure = packetPurePair(verb.lane, 1)!;
  for (const lean of leans) {
    // The lean's PAYLOAD lane: none for Attack and Speed, the verb's own for Effect.
    const payloadLane = leanPayloadLane(lean);
    assert(lean.leanKind === 'effect' ? payloadLane === verb.lane : payloadLane === undefined,
      `${lean.id}: ${lean.leanKind} names ${payloadLane ?? 'no'} payload lane`);
    for (let rank = 1; rank <= MAX_LEAN_RANK; rank++) {
      t1Cells += 1;
      const label = `${lineage.id} ${lean.leanKind} rank ${rank} × ${verb.id}`;
      const tree: LineageProgress = {
        ownedCards: [lean.id, verb.id],
        active: { stat: lean.id, payoff: verb.id },
        ownedForms: [base], wornForm: base,
        ranks: { [lean.id]: rank },
      };
      assert(leanLaneFor(lineage, tree) === payloadLane, `${label}: leanLaneFor`);
      const resolved = resolveLineageCards(lineage, tree);
      const resolvedVerb = resolved.find((c) => c.card.id === verb.id)!;
      const resolvedLean = resolved.find((c) => c.card.id === lean.id)!;
      // The verb fires its own moment and reads its PURE pair under every T1 lean.
      assert(resolvedVerb.composition?.pure === true && resolvedVerb.composition.verbLane === verb.lane,
        `${label}: the fixed verb reads its pure pair`);
      assert(resolvedVerb.trigger?.kind === pure.trigger.kind && resolvedVerb.trigger.n === pure.trigger.n
        && resolvedVerb.trigger.capMs === pure.trigger.capMs, `${label}: the verb's own moment`);
      assert(resolvedVerb.payoff?.kind === pure.payoff.kind, `${label}: the verb's own pure payload`);
      // The lean resolves at its rank: rank I's number times the rank's scale.
      const value = Object.values(resolvedLean.statEffects ?? {})[0]!;
      const expected = Math.round(LEAN_RANK_ONE[lean.leanKind!] * LEAN_RANK_VALUE_SCALE[rank - 1]! * 1000) / 1000;
      assert(Math.abs(value - expected) < 1e-9 && resolvedLean.rank === rank, `${label}: lean value ${value} ≠ ${expected}`);
      // An Effect that IS the payload's size scales the verb's payload by the rank;
      // every other lean leaves the payload at its base size.
      const scaled = { ...pure.payoff };
      if (cardStatKey(lean) === 'payloadScale') scalePayloadSize(scaled, 1 + expected);
      assert(JSON.stringify(resolvedVerb.payoff) === JSON.stringify(scaled),
        `${label}: payload ${JSON.stringify(resolvedVerb.payoff)} ≠ ${JSON.stringify(scaled)}`);
      // The sentence follows the numbers, and the halves join to it.
      const sentence = cardSentence(verb, tree);
      const parts = composedSentenceParts(lineage, tree);
      assert(parts !== undefined && parts.pure && parts.momentLane === verb.lane && parts.payloadLane === verb.lane,
        `${label}: the halves are the verb's lane, pure`);
      assert(composedSentence(lineage, tree) === sentence && `${parts!.moment} ${parts!.payload}` === sentence,
        `${label}: the halves join to "${sentence}"`);
      assert(sentence === pureSentenceText(verb.lane, 1, { trigger: pure.trigger, payoff: scaled }),
        `${label}: "${sentence}"`);
      // A lean's own line, at its rank.
      const line = cardSentence(lean, tree);
      // A stat line ("+8% Attack."), the slow's line, or a reservoir's ("Your poison …").
      assert(typeof line === 'string' && /^(\+|Every hit |Your )/.test(line) && line.endsWith('.'),
        `${label}: lean line "${line}"`);
      assert(cardSentence(lean, tree, { rank: 1 }) === cardSentence(lean, { ...tree, ranks: { [lean.id]: 1 } }),
        `${label}: a rank preview reads as that rank`);
      // The payload scale is never a character stat.
      const active = resolveActiveLineages({ equipment: { ...emptyEquipment(), weapon: base }, lineages: { [lineage.id]: tree } });
      assert(active.statEffects.payloadScale === undefined, `${label}: payloadScale never reaches the stat rebuild`);
    }
  }
}
assert(t1Cells === 45, `five weapons × three leans × three ranks, got ${t1Cells}`);

// The numbers the page reads, at today's provisional values (design §26.1).
{
  const rapier1 = LINEAGE_DATABASE.get('rapier')!;
  const tree = (leanId: string, rank: number): LineageProgress => ({
    ownedCards: [leanId, 'rapier-t1-tempo-payoff'], active: { stat: leanId, payoff: 'rapier-t1-tempo-payoff' },
    ownedForms: ['flash-rapier'], wornForm: 'flash-rapier', ranks: { [leanId]: rank },
  });
  const effect = rapier1.cards.find((c) => c.id === 'rapier-t1-effect')!;
  const attack = rapier1.cards.find((c) => c.id === 'rapier-t1-attack')!;
  const speed = rapier1.cards.find((c) => c.id === 'rapier-t1-speed')!;
  assert(cardSentence(effect, tree(effect.id, 1)) === "+10% to Flurry's second strike.", `${cardSentence(effect, tree(effect.id, 1))}`);
  assert(cardSentence(effect, tree(effect.id, 3)) === "+20% to Flurry's second strike.", 'Effect rank III');
  assert(cardSentence(attack, tree(attack.id, 2)) === '+12% Attack.', `${cardSentence(attack, tree(attack.id, 2))}`);
  assert(cardSentence(speed, tree(speed.id, 3)) === '+16% attack speed.', `${cardSentence(speed, tree(speed.id, 3))}`);
  assert(composedSentence(rapier1, tree(effect.id, 2)) === 'Every 6th hit strikes again at 115% strength.',
    `Flurry under Effect II: ${composedSentence(rapier1, tree(effect.id, 2))}`);
  assert(composedSentence(rapier1, tree(attack.id, 3)) === 'Every 6th hit strikes twice.', 'Flurry under Attack III');
  // The plate's preview: the same tree read at another rank, or under another lean.
  assert(composedSentence(rapier1, tree(effect.id, 1), { rank: 3 }) === 'Every 6th hit strikes again at 120% strength.',
    'a rank preview re-reads the plate');
  assert(composedSentence(rapier1, tree(attack.id, 1), { leanId: effect.id, rank: 2 })
    === 'Every 6th hit strikes again at 115% strength.', 'a lean preview re-reads the plate');
  assert(composedSentence(rapier1, tree(effect.id, 3), { leanId: null }) === 'Every 6th hit strikes twice.',
    'previewing no lean reads the base pair');
  const scales = lineagePayloadScales(rapier1, tree(effect.id, 2));
  assert(scales.tempo === 0.15 && Object.keys(scales).length === 1, `scales ${JSON.stringify(scales)}`);

  const broadsword = LINEAGE_DATABASE.get('broadsword')!;
  const bEffect = broadsword.cards.find((c) => c.id === 'broadsword-t1-effect')!;
  const bTree: LineageProgress = {
    ownedCards: [bEffect.id, 'broadsword-t1-technique-payoff'],
    active: { stat: bEffect.id, payoff: 'broadsword-t1-technique-payoff' },
    ownedForms: ['iron-broadsword'], wornForm: 'iron-broadsword', ranks: { [bEffect.id]: 1 },
  };
  assert(cardSentence(bEffect, bTree) === "+10% to Set Piece's refund.", `${cardSentence(bEffect, bTree)}`);
  assert(composedSentence(broadsword, bTree) === 'A landed Technique refunds 55% of its cooldown.',
    `Set Piece under Effect I: ${composedSentence(broadsword, bTree)}`);

  const dagger = LINEAGE_DATABASE.get('dagger')!;
  const dEffect = dagger.cards.find((c) => c.id === 'dagger-t1-effect')!;
  const dAttack = dagger.cards.find((c) => c.id === 'dagger-t1-attack')!;
  const dTree = (leanId: string): LineageProgress => ({
    ownedCards: [leanId, 'dagger-t1-affliction-payoff'], active: { stat: leanId, payoff: 'dagger-t1-affliction-payoff' },
    ownedForms: ['ashbrand-blade'], wornForm: 'ashbrand-blade',
  });
  // The Dagger owns a reservoir (its poison): its DoT-potency leans amplify it and
  // never promise a bleed (design §26.2); a weapon with none keeps the bleed line.
  assert(cardSentence(dEffect, dTree(dEffect.id)) === 'Your poison is +10% stronger.', `${cardSentence(dEffect, dTree(dEffect.id))}`);
  const twiceCoated = dagger.cards.find((c) => c.id === 'dagger-t2-affliction-stat')!;
  const mire: LineageProgress = { ownedCards: [], active: {}, ownedForms: ['ashbrand-blade', 'swamp-mirebrand'], wornForm: 'swamp-mirebrand' };
  assert(cardSentence(twiceCoated, mire) === 'Your poison is +11.5% stronger.', `Twice-Coated: ${cardSentence(twiceCoated, mire)}`);
  const deeperBrew = LINEAGE_DATABASE.get('rapier')!.cards.find((c) => c.id === 'rapier-t2-affliction-stat')!;
  const needle: LineageProgress = { ownedCards: [], active: {}, ownedForms: ['flash-rapier', 'gale-needle'], wornForm: 'gale-needle' };
  assert(/bleeds/.test(cardSentence(deeperBrew, needle) ?? ''), `Deeper Brew (no reservoir) keeps the bleed: ${cardSentence(deeperBrew, needle)}`);
  // An Attack lean never turns the Dagger's verb into another lane's payload.
  assert(dAttack.lane === 'control' && leanLaneFor(dagger, dTree(dAttack.id)) === undefined, 'the Dagger Attack names no payload');
  assert(composedSentence(dagger, dTree(dAttack.id)) === 'Hitting an afflicted target doubles its affliction.',
    `Into the Wound under Attack: ${composedSentence(dagger, dTree(dAttack.id))}`);

  const hammer = LINEAGE_DATABASE.get('hammer')!;
  const hEffect = hammer.cards.find((c) => c.id === 'hammer-t1-effect')!;
  const hSpeed = hammer.cards.find((c) => c.id === 'hammer-t1-speed')!;
  const easyPrey = hammer.cards.find((c) => c.id === 'hammer-t1-control-payoff')!;
  assert(easyPrey.name === 'Easy Prey', 'the Hammer verb is Easy Prey');
  assert(cardSentence(hEffect, { ownedCards: [], active: {}, ownedForms: ['heavy-hammer'], wornForm: 'heavy-hammer' })
    === 'Every hit slows its target by 10% until your next swing.', 'the Hammer Effect is its slow');
  // The Hammer's Effect is the verb's hold source; under Speed the page says it needs one.
  const hTree = (leanId: string): LineageProgress => ({
    ownedCards: [leanId, easyPrey.id], active: { stat: leanId, payoff: easyPrey.id },
    ownedForms: ['heavy-hammer'], wornForm: 'heavy-hammer',
  });
  const underEffect = resolveLineageCards(hammer, hTree(hEffect.id)).find((c) => c.card.id === easyPrey.id)!;
  const underSpeed = resolveLineageCards(hammer, hTree(hSpeed.id)).find((c) => c.card.id === easyPrey.id)!;
  assert(underEffect.composition?.needs === undefined, 'Easy Prey under Effect needs nothing (the lean slows)');
  assert(underSpeed.composition?.needs === 'slow', 'Easy Prey under Speed needs a slow');
}

// The Effect's payload scale survives the gate (a gate never makes a card read
// smaller): absorbed into the T2 form, the rank the player owns still scales its
// lane's payload — the T2 verb's pure echo, and that payload on another T2 verb.
{
  const rapierT2 = LINEAGE_DATABASE.get('rapier')!;
  const tree: LineageProgress = {
    ownedCards: ['rapier-t1-effect', 'rapier-t2-tempo-payoff'],
    active: { stat: 'rapier-t1-effect', payoff: 'rapier-t2-tempo-payoff' },
    ownedForms: ['flash-rapier', 'gale-needle'], wornForm: 'gale-needle',
    ranks: { 'rapier-t1-effect': 2 },
  };
  const verb = resolveLineageCards(rapierT2, tree).find((c) => c.card.id === 'rapier-t2-tempo-payoff')!;
  const expected = { ...packetPurePair('tempo', 2)!.payoff };
  scalePayloadSize(expected, 1.15);
  assert(JSON.stringify(verb.payoff) === JSON.stringify(expected),
    `the absorbed Effect II scales the T2 echo: ${JSON.stringify(verb.payoff)} ≠ ${JSON.stringify(expected)}`);
  assert(verb.payoff!.magnitude > packetPurePair('tempo', 2)!.payoff.magnitude, 'bigger than the bare T2 echo');
  const active = resolveActiveLineages({ equipment: { ...emptyEquipment(), weapon: 'gale-needle' }, lineages: { rapier: tree } });
  assert(active.absorbed.length === 1 && active.absorbed[0]!.rank === 2, 'absorbed at the owned rank');
  assert(active.statEffects.payloadScale === undefined, 'and still never a character stat');
}

// The two-colour halves of every composed sentence join to it, at every tier.
for (const verb of WEAPON_PACKET_IDS) {
  for (const lean of [undefined, ...WEAPON_PACKET_IDS]) {
    const composed = composeVerb(verb, lean)!;
    const parts = compositionParts(composed)!;
    const sentence = verbSentence(verb, lean)!;
    assert(`${parts.moment} ${parts.payload}` === sentence, `${verb}×${lean ?? 'none'}: halves "${parts.moment}" + "${parts.payload}"`);
    assert(parts.momentLane === verb, `${verb}×${lean ?? 'none'}: the moment is the verb's colour`);
    assert(parts.payloadLane === (composed.pure ? verb : lean), `${verb}×${lean ?? 'none'}: the payload is the lean's colour`);
    assert(!/[|]/.test(sentence) && parts.moment.length > 0 && parts.payload.endsWith('.'),
      `${verb}×${lean ?? 'none'}: the split marker never renders`);
  }
  const pureParts = pureSentenceParts(verb)!;
  assert(pureParts.moment.length > 0, `${verb}: the pure sentence authors its split`);
}
assert(compositionParts(composeVerb('technique', 'tempo')!)!.moment === 'When a Technique lands,',
  'a clause moment keeps its comma in the moment half');

// A verb the player owns with NO lean slotted reads, and fires, its pure pair.
{
  const flurry = rapier.cards.find((c) => c.id === 'rapier-t1-tempo-payoff')!;
  const alone: LineageProgress = {
    ownedCards: [flurry.id], active: { payoff: flurry.id }, ownedForms: ['flash-rapier'], wornForm: 'flash-rapier',
  };
  assert(cardSentence(flurry, alone) === 'Every 6th hit strikes twice.', `Flurry alone: ${cardSentence(flurry, alone)}`);
  const [resolved] = resolveLineageCards(rapier, alone);
  assert(resolved?.payoff?.kind === 'echo-hit' && resolved.payoff.magnitude === 1, 'Flurry alone echoes a whole hit');
  assert(resolved?.trigger?.kind === 'hit-nth' && resolved.trigger.n === 6, 'on every 6th hit');
}

// ── 7. T2+ bands compose too (design §24.9) ──────────────────────────────────

/** Every number on a payload, as "bigger is bigger" (a cap is not one). */
const payloadNumbers = (p: LineagePayoff): Record<string, number> => ({
  magnitude: p.magnitude,
  durationMs: p.durationMs ?? 0,
  loadMultiplier: p.loadMultiplier ?? 1,
  bonusScale: p.bonusScale ?? 1,
  extraTargets: p.extraTargets ?? 0,
});

// The tier scalar a verb's payload size takes is ≥ 1 and climbs.
assert(verbTierScalar(1) === 1, 'a T1 verb is the table verbatim');
for (let tier = 2; tier <= 4; tier++) {
  assert(verbTierScalar(tier) >= verbTierScalar(tier - 1), `the verb tier scalar never falls (T${tier})`);
}

let t2Pairs = 0;
for (const lineage of lineagesForSlot('weapon')) {
  const tiers = [...new Set(lineage.cards.filter((c) => c.tier > 1 && c.row === 'payoff').map((c) => c.tier))];
  for (const tier of tiers) {
    const band = lineage.cards.filter((c) => c.tier === tier);
    assert(bandComposes(lineage, tier), `${lineage.id} T${tier}: the band composes`);
    const form = lineage.forms.find((f) => f.tier === tier);
    assert(form, `${lineage.id} T${tier}: a form opens the band`);
    let pure = 0;
    for (const verbLane of lineage.lanes) {
      const verbCard = band.find((c) => c.lane === verbLane && c.row === 'payoff');
      assert(verbCard && isVerbCard(verbCard), `${lineage.id} T${tier}: one ${verbLane} VERB`);
      // Compared against the T1 PAIR (the packet's T1 numbers), not a T1 card: only
      // one verb per weapon is a T1 card since design §26.1.
      for (const leanLane of [undefined, ...lineage.lanes]) {
        const t1 = composeVerb(verbLane, leanLane, 1)!;
        const tn = composeVerb(verbLane, leanLane, tier)!;
        const label = `${lineage.id} T${tier} ${leanLane ?? 'no lean'}×${verbLane}`;
        // The same pair, the same moment: the tier never moves the cadence.
        assert(tn.trigger.kind === t1.trigger.kind && tn.trigger.n === t1.trigger.n && tn.trigger.capMs === t1.trigger.capMs,
          `${label}: the moment is the T1 moment (cadence stays 4–6 s)`);
        assert(tn.payoff.kind === t1.payoff.kind && tn.pure === t1.pure && tn.fx === t1.fx, `${label}: the same payload`);
        // A gate never makes a card read smaller — every number at least the T1 one…
        const a = payloadNumbers(t1.payoff);
        const b = payloadNumbers(tn.payoff);
        for (const key of Object.keys(a)) {
          assert(b[key]! >= a[key]! - 1e-9, `${label}: ${key} ${b[key]} < T1 ${a[key]}`);
        }
        // …and its SIZE strictly larger above T1, where the tier scalar is.
        if (verbTierScalar(tier) > 1) {
          const axis = payloadSize(tn.payoff.kind).axis;
          const grew = axis === 'duration' ? b.durationMs! > a.durationMs!
            : axis === 'proxy' ? b.bonusScale! > a.bonusScale!
              : b.magnitude! > a.magnitude! || (tn.payoff.kind === 'technique-refund' && b.magnitude === 1);
          assert(grew, `${label}: the ${axis} did not grow with the tier`);
        }
        // The sentence is generated from the halves with the tier's numbers.
        const sentence = verbSentence(verbLane, leanLane, tier);
        assert(typeof sentence === 'string' && sentence.endsWith('.') && !/[{}]|NaN|undefined/.test(sentence),
          `${label}: no sentence (${sentence})`);
        if (leanLane === undefined) continue;
        t2Pairs++;
        if (leanLane === verbLane) {
          pure++;
          assert(sentence === pureSentenceText(verbLane, tier), `${label}: the same lane reads the pure sentence`);
        }
        if (verbTierScalar(tier) > 1) {
          assert(sentence !== verbSentence(verbLane, leanLane, 1), `${label}: the T${tier} sentence quotes the T${tier} numbers`);
        }

        // Through the real cards and a real tree: the T2 lean slotted, the T2 verb
        // slotted, the T2 form worn — what the runtime and the page both read.
        const leanCard = band.find((c) => c.lane === leanLane && c.row === 'stat');
        assert(leanCard, `${label}: a T${tier} lean`);
        const tree: LineageProgress = {
          ownedCards: [leanCard!.id, verbCard!.id],
          active: { stat: leanCard!.id, payoff: verbCard!.id },
          ownedForms: [lineage.forms.find((f) => f.tier === 1)!.recipeId, form!.recipeId],
          wornForm: form!.recipeId,
        };
        const resolved = resolveLineageCards(lineage, tree).find((c) => c.card.id === verbCard!.id);
        assert(resolved?.composition?.leanLane === leanLane, `${label}: resolveLineageCards composed it`);
        assert(JSON.stringify(resolved?.payoff) === JSON.stringify(tn.payoff), `${label}: resolved at the verb's tier`);
        assert(cardSentence(verbCard!, tree) === sentence, `${label}: the page's sentence is the composed one`);
        assert(composedSentence(lineage, tree) === sentence, `${label}: composedSentence agrees`);
      }
    }
    assert(pure === 3, `${lineage.id} T${tier}: three of nine pairs read pure, got ${pure}`);
    // The rows read Lean and Verb because they compose; a band that did not would not.
    assert(rowLabel('stat', bandComposes(lineage, tier)) === 'Lean' && rowLabel('payoff', true) === 'Verb', 'composed labels');
  }
}
assert(t2Pairs === 45, `five weapons × nine T2 pairs, got ${t2Pairs}`);
assert(rowLabel('stat', false) === PLAIN_ROW_LABELS.stat && PLAIN_ROW_LABELS.stat !== ROW_LABELS.stat,
  'a band that does not compose never reads "Lean"');

// The T2 sentences the designer reads, at today's numbers (TIER_SCALAR.fraction
// 1.15 at T2). A number or phrase change that moves what the player reads fails here.
const T2_SHEET: Array<[PacketId, PacketId | undefined, string]> = [
  ['tempo', 'tempo', 'Every 6th hit strikes again at 115% strength.'],
  ['tempo', 'affliction', 'Every 6th hit leaves a heavy poison or bleed, 115% of a swing over 4 s.'],
  ['engagement', 'engagement', 'Your first hit on each target is a lunge for 2.15× damage.'],
  ['affliction', 'tempo', 'A hit on a target you have already afflicted (every 5 s at most) lands again at 115% strength.'],
  ['technique', 'empowered', 'When a Technique lands, the hit counts as your class mechanic firing with a 15% bigger bonus.'],
  ['kill-chain', 'kill-chain', 'Your next hit after a kill heals 11.5% of your pool and lands loaded (+57.5%).'],
  ['empowered', 'kill-chain', 'When your class mechanic fires (every 4 s at most), the hit heals 11.5% of your pool and lands loaded (+57.5%).'],
];
for (const [verb, lean, expected] of T2_SHEET) {
  const got = verbSentence(verb, lean, 2);
  assert(got === expected, `T2 ${lean}×${verb}: "${got}" ≠ "${expected}"`);
}
{
  // A binary payload grows by its hold, rounded to the logic tick.
  const root = composeVerb('tempo', 'control', 2)!.payoff;
  assert(root.kind === 'root' && root.durationMs === 2300, `T2 root holds 2.3 s, got ${root.durationMs}`);
  const stun = composeVerb('control', 'control', 2)!.payoff;
  assert(stun.kind === 'stun' && stun.durationMs === 1700, `T2 knockdown holds 1.7 s, got ${stun.durationMs}`);
  // A refund is a share of a whole cooldown and never passes it.
  for (let tier = 1; tier <= 4; tier++) {
    assert(composeVerb('technique', 'technique', tier)!.payoff.magnitude <= 1, `T${tier}: a refund never passes the whole cooldown`);
  }
}

{
  // The T2 leans, including the two that SEED a condition (wave-1 A): every T2
  // lean is its lane's LANE lean (design §26.1: "the lane-named leans … are the T2
  // lean row"), and its stat is at least that lane's T1 unit (the depth climbs with
  // the tier), while the condition's own duration is a shape and never does.
  for (const lineage of lineagesForSlot('weapon')) {
    for (const lane of lineage.lanes) {
      const t2 = lineage.cards.find((c) => c.tier === 2 && c.row === 'stat' && c.lane === lane)!;
      assert(!t2.leanKind, `${t2.id}: a T2 lean is lane-named, not one of the ranked trio`);
      const b = Object.entries(resolveLineageCard(t2, lineage).statEffects ?? {});
      const key = cardStatKey(t2);
      const t1Unit = statRowValue({ statKey: key, tier: 1, lane });
      assert(b.length === 1 && b[0]![0] === key, `${lineage.id} ${lane}: the T2 lean scales its lane's stat`);
      assert(b[0]![1] >= t1Unit, `${lineage.id} ${lane}: T2 lean ${b[0]![1]} < its lane's T1 unit ${t1Unit}`);
    }
  }
  assert(LEAN_CONDITION_NUMBERS.control?.durationMs === 1_500 && LEAN_CONDITION_NUMBERS.affliction?.durationMs === 4_000,
    'fixture: the lean conditions hold for their authored windows at every tier');
  // The capped Empowered moment keeps its cap at T2; a frequency amplifier shortens it.
  const empowered = composeVerb('empowered', 'kill-chain', 2)!.trigger;
  assert(empowered.capMs !== undefined && empowered.capMs === packetMoment('empowered')!.capMs, 'the Empowered cap is the T1 cap');
  assert((quickenMoment(empowered, 1.6)?.capMs ?? Infinity) < empowered.capMs!, 'a frequency amplifier shortens the Empowered cap');
}

console.log('composition: ok');
