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
 *      `composedSentence`) agree with it.
 *
 * Run: node --conditions=development --import tsx shared/src/data/lineages/composition.test.ts
 */
import { cardSentence, composedSentence, resolveLineageCards } from '../../systems/lineages';
import { LINEAGE_DATABASE, lineagesForSlot } from './index';
import { PACKET_DEFINITIONS, packetHalves } from './packets';
import { PACKET_HALF_NUMBERS, STAT_UNIT } from './magnitudes';
import {
  composeVerb, isVerbCard, packetMoment, packetPayload, packetPurePair, resolveLineageCard,
} from './resolve';
import { momentText, payloadText, pureSentenceText, statLine, verbSentence } from './sentences';
import { PACKET_IDS, ROW_LABELS, WEAPON_PACKET_IDS } from './types';
import type { LineageCard, LineageDefinition, LineageProgress, PacketId } from './types';

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
    moment: 'A hit on a target you have already afflicted (once every 5 s)',
    payload: 'leaves a heavy poison or bleed, a whole swing over 4 s',
    pure: 'Hitting an afflicted target doubles its affliction.',
  },
  engagement: {
    moment: 'Your first hit on each new target',
    payload: 'is a lunge for double damage',
    pure: 'Your first hit on each target is a lunge for double damage.',
  },
  empowered: {
    moment: 'When your class mechanic fires',
    payload: 'counts as your class mechanic firing',
    pure: 'Your mechanic hits half again as hard.',
  },
  control: {
    moment: 'A hit on a slowed or rooted target (once every 5 s)',
    payload: 'roots the target for 2 s',
    pure: 'Hitting a held target knocks it down for 1.5 s.',
  },
  'kill-chain': {
    moment: 'Your next hit after a kill',
    payload: 'heals a tenth of your pool and lands loaded (+50%)',
    pure: 'A kill heals a tenth of your pool and loads your next hit.',
  },
  technique: {
    moment: 'When a Technique lands',
    payload: "refunds a third of that Technique's cooldown",
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
    === 'A hit on a target you have already afflicted (once every 5 s) is a lunge for double damage.',
  `subject grammar with a capped moment: ${verbSentence('affliction', 'engagement')}`,
);

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
// The Control moment needs a hold the tree does not supply; the page says so.
for (const lean of [undefined, ...WEAPON_PACKET_IDS]) {
  assert(composeVerb('control', lean)?.needs === 'slow', `control verb × ${lean ?? 'no lean'}: needs a slow`);
  assert(composeVerb('tempo', lean)?.needs === undefined, `tempo verb × ${lean ?? 'no lean'}: needs nothing`);
}
// The moments carry the shapes §24.2 names.
assert(packetMoment('tempo')?.n === 6, 'tempo fires on every 6th hit');
assert(packetMoment('affliction')?.capMs === 5_000, 'the affliction moment caps at one per 5 s');
assert(packetMoment('control')?.capMs === 5_000, 'the control moment caps at one per 5 s');
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
assert(statLine({ dotPotencyPct: 0.1 }) === '+10% DoT potency.', `stat line: ${statLine({ dotPotencyPct: 0.1 })}`);
assert(statLine({ speed: 11 }) === '+11 move speed.', `stat line: ${statLine({ speed: 11 })}`);

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

console.log('composition: ok');
