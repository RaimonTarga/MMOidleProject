/**
 * The Upgrade panel and the weapon page's rank parts (design §26.1, §26.4;
 * legibility run D), off the client models:
 *
 *   - a ranked lean's pips, "II of III", the next rank's control ("Rank up"),
 *     nothing past the cap, and "Buy" for an unowned lean;
 *   - the rank preview clone (`previewRankProgress`);
 *   - the band's step pips: form · lean I · II · III · verb · gate at T1, the
 *     next step marked;
 *   - the worn-items list: weapon first with its page, every other item plain;
 *   - the "In the fight" plate: the lean and the verb, the verb in two halves;
 *   - a verb's beat line from its composed moment; the locked T2 choice row.
 *
 * Ranks are read through `legibilityContracts.ts` (Contract 1, the shared rank
 * API); the T1 lean trio (`<weapon>-t1-attack|speed|effect`) carries `leanKind`.
 */
import assert from 'node:assert/strict';
import {
  LINEAGE_DATABASE, composedSentence, emptyEquipment, type LineageProgress, type LineageWallet,
} from '@mmo-idle/shared';
import {
  FIGHT_PLATE_EMPTY, beatText, fightPlate, leanRankModel, lockedChoiceRow, pageBands, previewRankProgress, verbBeat,
} from '../../client/src/ui/lineage/weaponPageModel';
import {
  bandSteps, buyableBadge, buyableTotal, wornEntries,
} from '../../client/src/ui/lineage/upgradeListModel';
import { cardRank, maxCardRank } from '../../client/src/ui/lineage/legibilityContracts';

const dagger = LINEAGE_DATABASE.get('dagger')!;
const lean = dagger.cards.find((c) => c.id === 'dagger-t1-effect')!;
const verb = dagger.cards.find((c) => c.tier === 1 && c.row === 'payoff')!;
const BASE_FORM = dagger.forms.find((f) => f.tier === 1)!.recipeId;
assert.equal(lean.leanKind, 'effect', 'fixture: the Dagger\'s Effect lean');
assert.equal(dagger.cards.filter((c) => c.tier === 1 && c.row === 'payoff').length, 1, 'fixture: one fixed T1 verb');

const tree = (over: Partial<LineageProgress> = {}): LineageProgress => ({
  ownedCards: [], active: {}, ownedForms: [BASE_FORM], wornForm: BASE_FORM, ...over,
});

const wallet: LineageWallet = {
  essences: { purple: 5_000 },
  shards: { affliction: 99, control: 99, 'kill-chain': 99 },
  capstones: {},
  biomeLevels: { swamp: 9, forest: 9, plains: 9 },
  globalMastery: 40,
  playerTier: 1,
};

// ── A ranked lean: pips, the next rank, the cap ──────────────────────────────
{
  assert.equal(maxCardRank(lean), 3, 'a T1 lean has three ranks');
  const unowned = leanRankModel({ lineage: dagger, card: lean, progress: tree(), wallet });
  assert.equal(unowned.rank, 0);
  assert.deepEqual(unowned.pips, [false, false, false]);
  assert.equal(unowned.rankText, 'not taken');
  assert.equal(unowned.next?.rank, 1);
  assert.equal(unowned.next?.label, 'Buy', 'an unowned lean is bought, not ranked up');
  assert.ok(unowned.next!.chips.length > 0, 'and shows its price');
  const price = (m: typeof unowned) => m.next!.chips.map((c) => [c.kind, c.amount]);
  // PROVISIONAL rank prices (A's table): 30 / 45 / 60 essence, 3 / 5 / 6 shards of the card's lane.
  assert.deepEqual(price(unowned), [['essence', 30], ['shard', 3]], 'rank I: 30 essence, 3 shards');

  const owned = tree({ ownedCards: [lean.id], active: { stat: lean.id }, ranks: { [lean.id]: 2 } });
  assert.equal(cardRank(owned, lean.id), 2, 'the owned rank is read from progress.ranks');
  const mid = leanRankModel({ lineage: dagger, card: lean, progress: owned, wallet });
  assert.deepEqual(mid.pips, [true, true, false]);
  assert.equal(mid.rankText, 'II of III');
  assert.equal(mid.next?.rank, 3);
  assert.equal(mid.next?.label, 'Rank up');
  assert.deepEqual(price(mid), [['essence', 60], ['shard', 6]], 'rank III: 60 essence, 6 shards');
  const one = leanRankModel({ lineage: dagger, card: lean, progress: tree({ ownedCards: [lean.id], active: { stat: lean.id } }), wallet });
  assert.deepEqual(price(one), [['essence', 45], ['shard', 5]], 'rank II: 45 essence, 5 shards');
  assert.ok(mid.next?.sentence?.includes('20%'), 'the Rank-up control previews rank III\'s number (+20%)');
  assert.ok(mid.next?.action === 'buy' || mid.next?.action === 'toast', 'the control follows the shared check');
  if (mid.next?.action === 'toast') assert.ok(mid.next.reason, 'and a refusal says why');

  const implicit = tree({ ownedCards: [lean.id], active: { stat: lean.id } });
  assert.equal(cardRank(implicit, lean.id), 1, 'an owned ranked card with no rank key is rank I');

  const capped = leanRankModel({
    lineage: dagger, card: lean, wallet,
    progress: tree({ ownedCards: [lean.id], active: { stat: lean.id }, ranks: { [lean.id]: 3 } }),
  });
  assert.deepEqual(capped.pips, [true, true, true]);
  assert.equal(capped.rankText, 'III of III');
  assert.equal(capped.next, undefined, 'nothing to buy past rank III');

  const preview = previewRankProgress(owned, lean, 3);
  assert.equal(preview.ranks?.[lean.id], 3, 'the rank preview is a clone at the next rank');
  assert.equal(owned.ranks?.[lean.id], 2, 'the real tree is untouched');
  assert.equal(preview.active.stat, lean.id);
}

// ── The band's steps: form · lean I · II · III · verb · gate ─────────────────
{
  const none = bandSteps(dagger, tree());
  assert.deepEqual(none.map((s) => s.label), ['Form', 'Lean I', 'Lean II', 'Lean III', 'Verb', 'Gate']);
  assert.deepEqual(none.map((s) => s.done), [true, false, false, false, false, false]);
  assert.equal(none.find((s) => s.next)?.label, 'Lean I', 'the next step is marked');

  const two = bandSteps(dagger, tree({
    ownedCards: [lean.id, verb.id], active: { stat: lean.id, payoff: verb.id }, ranks: { [lean.id]: 2 },
  }));
  assert.deepEqual(two.map((s) => s.done), [true, true, true, false, true, false]);
  assert.equal(two.find((s) => s.next)?.label, 'Lean III');
}

// ── The worn items: weapon first with its page, the rest plain ───────────────
{
  const equipment = { ...emptyEquipment(), weapon: BASE_FORM, armor: 'forest-vest-t1', recovery: 'swamp-charm-t1' };
  const entries = wornEntries({ equipment, lineages: { dagger: tree() }, wallet });
  assert.equal(entries[0].slot, 'weapon', 'the weapon is first');
  assert.equal(entries[0].kind, 'page');
  assert.ok(entries[0].steps.length >= 4, 'with its band steps');
  assert.ok(entries[0].sub.includes('Tier 1'));
  assert.equal(entries.find((e) => e.slot === 'armor')?.kind, 'plain', 'armour is a plain item');
  assert.equal(entries.find((e) => e.slot === 'recovery')?.kind, 'plain');
  assert.equal(entries.find((e) => e.slot === 'mobility')?.kind, 'empty', 'an empty slot still holds its row');
  assert.ok(!entries.some((e) => e.slot === 'relic'), 'an empty relic slot is left out');
  assert.ok(entries.every((e) => e.kind === 'page' || buyableTotal(e.buyable) === 0), 'only the page sells');

  assert.equal(buyableBadge({ ranks: 1, cards: 2, gate: false }), '1 rank to buy');
  assert.equal(buyableBadge({ ranks: 0, cards: 2, gate: true }), '2 cards to buy');
  assert.equal(buyableBadge({ ranks: 0, cards: 0, gate: true }), 'gate ready');
  assert.equal(buyableBadge({ ranks: 0, cards: 0, gate: false }), undefined);
}

// ── "In the fight": the lean and the verb, the verb in two halves ────────────
{
  const empty = fightPlate({ lineage: dagger, progress: tree() });
  assert.equal(empty.empty, FIGHT_PLATE_EMPTY, 'nothing bought: the plate says so');

  const owned = tree({ ownedCards: [lean.id, verb.id], active: { stat: lean.id, payoff: verb.id } });
  const plate = fightPlate({ lineage: dagger, progress: owned });
  assert.equal(plate.lean?.name, lean.name);
  assert.ok(plate.lean!.sentence.length > 0);
  assert.equal(plate.lean?.rank, 'rank I', 'a ranked lean names its rank');
  assert.equal(plate.verb?.name, verb.name);
  assert.ok(plate.verb!.parts.moment.length > 0, 'the moment half');
  assert.ok(plate.verb!.momentColor.startsWith('#') && plate.verb!.payloadColor.startsWith('#'), 'two colours');
  assert.ok(!plate.verb!.parts.moment.includes('undefined') && !plate.verb!.parts.payload.includes('undefined'));
  const { moment, payload } = plate.verb!.parts;
  const joined = moment ? `${moment} ${payload}` : payload;
  assert.equal(joined, composedSentence(dagger, owned), 'the two halves are the sentence');
  assert.ok(plate.lean!.sentence.includes('10%'), 'rank I reads +10%');
  const ranked = fightPlate({ lineage: dagger, progress: previewRankProgress(owned, lean, 3), rank: 3 });
  assert.ok(ranked.lean!.sentence.includes('20%') && ranked.lean!.rank === 'rank III', 'the plate re-reads under a rank preview');
}

// ── The verb's beat line; the locked T2 choice ───────────────────────────────
{
  const owned = tree({ ownedCards: [verb.id], active: { payoff: verb.id } });
  const beat = verbBeat(dagger, owned, verb);
  assert.ok(beat, 'a verb has a beat');
  if (beat!.kind === 'cap') {
    assert.ok(beat!.seconds > 0, 'a capped moment rests a few seconds');
  }
  assert.ok(beatText(beat!).endsWith('.'), 'and says it in one sentence');
  assert.equal(verbBeat(dagger, owned, lean), undefined, 'a lean has no beat');

  const bands = pageBands({ lineage: dagger, progress: tree(), wallet });
  const locked = bands.find((b) => b.mode === 'locked');
  assert.ok(locked, 'the next band shows, locked');
  const choice = lockedChoiceRow(locked!);
  assert.equal(choice?.row, 'payoff', 'the locked band shows its verbs');
  assert.equal(choice?.cards.length, 3, 'three T2 verbs');
  assert.ok(choice!.cards.every((c) => c.state === 'locked'), 'all dimmed and unpressable');
}

console.log('weaponPageRanks: ok');
