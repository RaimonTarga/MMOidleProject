/**
 * The lineage rules are the shared authority — the server applies them and the
 * client gates its buttons with them, exactly like `checkUpgrade`/`checkEvolve`.
 * This suite pins the contract Phase 1b builds its handlers on.
 *
 * It asserts BEHAVIOUR, not balance: which purchases are legal, what is free,
 * what hydration keeps and drops, and that an unworn tree contributes nothing.
 * Every number it touches comes from the magnitude table, so a tuning pass moves
 * the table and this suite still passes.
 */
import { LINEAGE_DATABASE } from '../data/lineages';
import {
  MAX_LEAN_RANK, gateCapstoneAmount, gateEssenceCost, gateShardCost, lineageMasteryLevelForRow, rowBiomeLevel,
  rowEssenceCost, rowShardCost,
} from '../data/lineages/magnitudes';
import { lineageCardCost } from '../data/lineages/resolve';
import type { LineageProgressMap } from '../data/lineages/types';
import { emptyEquipment } from '../items';
import type { EquipmentMap } from '../items';
import {
  baseFormRecipeId, cardRank, checkSetActive, checkUnlockCard, checkUnlockForm, checkWearForm,
  emptyLineageProgress, lineageBandBiome, lineageCardPrice, lineageProgressFor, lineageSwitchDiscount,
  maxCardRank, nextCardRank, normalizeLineageProgressMap, resolveActiveLineages, resolveLineageCardAtRank,
  resolveLineageCardFor, retiredLineageCardRefund, wornFormTier,
} from './lineages';
import type { LineageWallet } from './lineages';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

const rapier = LINEAGE_DATABASE.get('rapier')!;
const broadsword = LINEAGE_DATABASE.get('broadsword')!;
assert(!!rapier && !!broadsword, 'fixtures missing');

// The Speed lean: a ranked T1 card whose stat is attack speed (design §26.1).
const statCard = rapier.cards.find((c) => c.id === 'rapier-t1-speed')!;
const payoffCard = rapier.cards.find((c) => c.id === 'rapier-t1-tempo-payoff')!;
const galeNeedle = rapier.forms.find((f) => f.recipeId === 'gale-needle')!;

/** A wallet rich enough that only the rule under test can refuse. */
function richWallet(overrides: Partial<LineageWallet> = {}): LineageWallet {
  return {
    essences: { green: 999999, yellow: 999999, blue: 999999, red: 999999, purple: 999999 },
    shards: { tempo: 9999, affliction: 9999, engagement: 9999, 'kill-chain': 9999 },
    capstones: { forest: 99, jungle: 99, plains: 99 },
    biomeLevels: { forest: 99, jungle: 99, plains: 99 },
    globalMastery: 9999,
    playerTier: 4,
    ...overrides,
  };
}

// ─── Buying a card ───────────────────────────────────────────────────────────

{
  const progress = emptyLineageProgress(rapier);
  assert(progress.wornForm === 'flash-rapier', 'a fresh tree wears its crafted base form');
  assert(wornFormTier(rapier, progress) === 1, 'the base form opens the T1 band');

  const ok = checkUnlockCard({ lineage: rapier, card: statCard, progress, wallet: richWallet() });
  assert(ok.ok, `buying a T1 stat row should be legal: ${ok.reason}`);

  // Already owned (an unranked card; a ranked one buys its next rank — below).
  const owned = { ...progress, ownedCards: [payoffCard.id] };
  assert(!checkUnlockCard({ lineage: rapier, card: payoffCard, progress: owned, wallet: richWallet() }).ok,
    'a card cannot be bought twice');

  // Biome level gates WHEN.
  const required = rowBiomeLevel(statCard.tier, statCard.row);
  const tooEarly = checkUnlockCard({
    lineage: rapier, card: statCard, progress,
    wallet: richWallet({ biomeLevels: { forest: required - 1 } }),
  });
  assert(!tooEarly.ok && tooEarly.reason!.includes(`level ${required}`), 'the biome level gate did not bite');

  // Materials gate WHETHER.
  const broke = checkUnlockCard({
    lineage: rapier, card: statCard, progress, wallet: richWallet({ essences: {} }),
  });
  assert(!broke.ok && broke.reason!.includes('essence'), 'the essence gate did not bite');
  const noShards = checkUnlockCard({
    lineage: rapier, card: statCard, progress, wallet: richWallet({ shards: {} }),
  });
  assert(!noShards.ok && /shard/i.test(noShards.reason!), 'the shard gate did not bite');

  // Global Mastery gates WHEN, on the same band the +N ladder used.
  const lowGm = checkUnlockCard({
    lineage: rapier, card: statCard, progress, wallet: richWallet({ globalMastery: 0 }),
  });
  assert(!lowGm.ok && lowGm.reason!.includes('Global Mastery'), 'the mastery gate did not bite');

  // The test room skips ownership and cost gates, like checkEvolve.
  assert(
    checkUnlockCard({
      lineage: rapier, card: statCard, progress,
      wallet: richWallet({ essences: {}, biomeLevels: {}, globalMastery: 0, isTestRoom: true }),
    }).ok,
    'the test room should skip cost gates',
  );

  // A card of a band the player has no form for is refused: the gate is the key.
  const t2Card = { ...payoffCard, id: 'rapier-t2-fake', tier: 2 };
  const noBand = checkUnlockCard({ lineage: rapier, card: t2Card, progress, wallet: richWallet() });
  assert(!noBand.ok, 'a T2 card needs a T2 form first');

  // A card from another lineage is refused outright.
  const foreign = broadsword.cards[0]!;
  assert(!checkUnlockCard({ lineage: rapier, card: foreign, progress, wallet: richWallet() }).ok,
    'a card of another lineage is not buyable here');
}

// ─── Switching lineages is half price, per row, never on gates ───────────────

{
  const lineages: LineageProgressMap = {
    broadsword: {
      ownedCards: ['broadsword-t1-effect'], active: {},
      ownedForms: ['iron-broadsword'], wornForm: 'iron-broadsword',
    },
  };
  assert(
    lineageSwitchDiscount({ card: statCard, slot: 'weapon', lineages }),
    'owning the same row at the same tier on another weapon lineage should discount it',
  );
  assert(
    !lineageSwitchDiscount({ card: payoffCard, slot: 'weapon', lineages }),
    'a row the player has never bought elsewhere is full price',
  );
  assert(!lineageSwitchDiscount({ card: statCard, slot: 'weapon', lineages: undefined }),
    'no trees means no discount');

  const full = lineageCardCost(statCard, rapier).essence.green!;
  const cut = lineageCardCost(statCard, rapier, { discounted: true }).essence.green!;
  assert(cut < full && cut > 0, `discount produced ${cut} from ${full}`);
}

// ─── Activating a card is free, and bound to its row ─────────────────────────

{
  const progress = { ...emptyLineageProgress(rapier), ownedCards: [statCard.id] };
  assert(checkSetActive({ lineage: rapier, progress, row: 'stat', cardId: statCard.id }).ok,
    'activating an owned card is free');
  assert(checkSetActive({ lineage: rapier, progress, row: 'stat', cardId: null }).ok,
    'clearing a row is always legal');
  assert(!checkSetActive({ lineage: rapier, progress, row: 'payoff', cardId: statCard.id }).ok,
    'a stat card cannot fill the payoff row');
  assert(!checkSetActive({ lineage: rapier, progress, row: 'payoff', cardId: payoffCard.id }).ok,
    'an unowned card cannot be activated');
}

// ─── Gates: the boss is the only way up ──────────────────────────────────────

{
  const progress = emptyLineageProgress(rapier);
  assert(checkUnlockForm({ lineage: rapier, form: galeNeedle, progress, wallet: richWallet() }).ok,
    'a fully-stocked T1 player should be able to pay the gate');

  const stinger = rapier.forms.find((f) => f.biome === 'jungle')!;

  const noCapstone = checkUnlockForm({
    lineage: rapier, form: galeNeedle, progress, wallet: richWallet({ capstones: {} }),
  });
  assert(!noCapstone.ok && /Heart|capstone/i.test(noCapstone.reason!),
    `the gate must demand the boss capstone, got: ${noCapstone.reason}`);

  // The JUNGLE door is gated on JUNGLE levels, not the lineage's home biome.
  const noJungle = checkUnlockForm({
    lineage: rapier, form: stinger, progress,
    wallet: richWallet({ biomeLevels: { forest: 99, jungle: 0 } }),
  });
  assert(!noJungle.ok && /jungle/i.test(noJungle.reason!), 'a form door gates on its own biome');

  // The home-biome gate sits at full mastery of the tier, so a T1 player who has
  // maxed Forest can pay it — that is the point of the reward moment.
  assert(
    checkUnlockForm({ lineage: rapier, form: galeNeedle, progress, wallet: richWallet({ playerTier: 1 }) }).ok,
    'the T1 gate sits at the T1 cap and must be payable at player tier 1',
  );
  // The Jungle door is not, because Jungle has no levels at all at tier 1.
  const cappedOut = checkUnlockForm({
    lineage: rapier, form: stinger, progress, wallet: richWallet({ playerTier: 1 }),
  });
  assert(!cappedOut.ok && cappedOut.reason!.includes('tier'),
    `a biome that has no content at the player's tier cannot gate a form: ${cappedOut.reason}`);

  const gateTier = galeNeedle.tier - 1;
  assert(gateEssenceCost(gateTier) > 0 && gateShardCost(gateTier) > 0 && gateCapstoneAmount(gateTier) > 0,
    'the gate cost table is empty');

  // Wearing an owned form is free; wearing one you do not own is not.
  const owner = { ...progress, ownedForms: [...progress.ownedForms, 'gale-needle'] };
  assert(checkWearForm({ lineage: rapier, progress: owner, recipeId: 'gale-needle' }).ok,
    'swapping to an owned form is free');
  assert(!checkWearForm({ lineage: rapier, progress, recipeId: 'gale-needle' }).ok,
    'you cannot wear a form you have not bought');
  assert(!checkWearForm({ lineage: rapier, progress: owner, recipeId: 'iron-broadsword' }).ok,
    'a form of another lineage is not wearable here');
}

// ─── Hydration ───────────────────────────────────────────────────────────────

{
  const hydrated = normalizeLineageProgressMap({
    rapier: {
      ownedCards: [statCard.id, 'rapier-card-that-was-retired'],
      active: { stat: statCard.id, payoff: payoffCard.id },
      ownedForms: ['gale-needle', 'an-item-that-no-longer-exists'],
      wornForm: 'an-item-that-no-longer-exists',
    },
    'lineage-that-no-longer-exists': { ownedCards: [], active: {}, ownedForms: [], wornForm: '' },
  });

  assert(Object.keys(hydrated).length === 1, 'unknown lineages are dropped');
  const r = hydrated.rapier!;
  assert(r.ownedCards.length === 1 && r.ownedCards[0] === statCard.id, 'unknown cards are dropped');
  assert(r.active.stat === statCard.id, 'an owned active card survives');
  assert(r.active.payoff === undefined, 'an active card the player does not own is cleared');
  assert(!r.ownedForms.includes('an-item-that-no-longer-exists'), 'unknown forms are dropped');
  assert(!r.ownedForms.includes(baseFormRecipeId(rapier)!), 'a base form the save never recorded is not invented');
  assert(r.wornForm === 'gale-needle', 'a worn form that vanished falls back to an owned form');

  // Hydration grants nothing: a saved tree with NO owned form loads with no owned
  // form, rather than being handed its base form (review finding B1, 2026-10-02 —
  // that was a free T1 item per lineage per relog).
  const bare = normalizeLineageProgressMap({ rapier: { ownedCards: [], active: {}, ownedForms: [], wornForm: '' } });
  assert(bare.rapier!.ownedForms.length === 0, 'an empty tree hydrates with no forms');
  assert(bare.rapier!.wornForm === '', 'and wears nothing');

  assert(Object.keys(normalizeLineageProgressMap(undefined)).length === 0, 'no lineages hydrates to none');
  const untouched = lineageProgressFor(undefined, 'rapier');
  assert(untouched.ownedCards.length === 0 && untouched.wornForm === '',
    'an untouched tree reads as empty rather than undefined');
}

// ─── Ranks: the T1 lean trio is bought a rank at a time (design §26.1) ──────

{
  const fresh = emptyLineageProgress(rapier);
  assert(cardRank(fresh, statCard.id) === 0 && nextCardRank(fresh, statCard) === 1, 'an unowned card is rank 0, buys rank I');
  assert(maxCardRank(statCard) === MAX_LEAN_RANK && maxCardRank(payoffCard) === 1, 'the trio has three ranks; a verb one');

  const leanGate = lineageMasteryLevelForRow(1, 'stat');
  const atRank = (rank: number) => resolveLineageCardAtRank(rapier, fresh, statCard, rank);
  assert(atRank(1).requiredGlobalMastery === leanGate, 'rank I is at the lean gate');
  assert(atRank(2).requiredGlobalMastery === leanGate + 4, 'rank II is at the lean gate + 4');
  assert(atRank(3).requiredGlobalMastery === leanGate + 8, 'rank III is at the lean gate + 8');
  assert(atRank(1).statEffects?.attackSpeedPct === 0.08 && atRank(2).statEffects?.attackSpeedPct === 0.12
    && atRank(3).statEffects?.attackSpeedPct === 0.16, 'Speed is +8% / +12% / +16%');
  assert(atRank(2).cost.essence.green === Math.round(rowEssenceCost(1, 'stat') * 1.5)
    && atRank(3).cost.shards.engagement === rowShardCost(1, 'stat') * 2, 'rank prices ×1.5 and ×2, same essence and shard');

  // Owned at rank I: the purchase check is for rank II — its gate and its cost.
  const one = { ...fresh, ownedCards: [statCard.id], ranks: { [statCard.id]: 1 } };
  assert(cardRank(one, statCard.id) === 1 && nextCardRank(one, statCard) === 2, 'owned at I buys II');
  assert(checkUnlockCard({ lineage: rapier, card: statCard, progress: one, wallet: richWallet() }).ok,
    'an owned ranked card below its max is buyable again');
  const gmTooLow = checkUnlockCard({
    lineage: rapier, card: statCard, progress: one, wallet: richWallet({ globalMastery: leanGate + 3 }),
  });
  assert(!gmTooLow.ok && gmTooLow.reason!.includes(`Global Mastery ${leanGate + 4}`), `rank II gates on +4: ${gmTooLow.reason}`);
  const priceTwo = lineageCardPrice({ lineage: rapier, card: statCard, progress: one });
  assert(priceTwo.rank === 2 && priceTwo.cost.essence.green === atRank(2).cost.essence.green, 'the price tag is rank II');
  const shortForTwo = checkUnlockCard({
    lineage: rapier, card: statCard, progress: one,
    wallet: richWallet({ shards: { engagement: rowShardCost(1, 'stat') } }),
  });
  assert(!shortForTwo.ok && /Spark Shard/.test(shortForTwo.reason!), `rank II costs more shards than rank I: ${shortForTwo.reason}`);

  // A missing rank on an owned ranked card reads as rank I.
  assert(cardRank({ ownedCards: [statCard.id] }, statCard.id) === 1, 'no stored rank = rank I');

  // At the max the card refuses.
  const three = { ...one, ranks: { [statCard.id]: 3 } };
  const maxed = checkUnlockCard({ lineage: rapier, card: statCard, progress: three, wallet: richWallet() });
  assert(!maxed.ok && maxed.reason === 'Already at rank III.', `at rank III: ${maxed.reason}`);
  assert(nextCardRank(three, statCard) === undefined, 'nothing left to buy at rank III');
  // An unranked card is still bought once.
  const verbOwned = { ...fresh, ownedCards: [payoffCard.id] };
  const again = checkUnlockCard({ lineage: rapier, card: payoffCard, progress: verbOwned, wallet: richWallet() });
  assert(!again.ok && again.reason === 'Already owned.', 'a verb is bought once');

  // The runtime reads the owned rank.
  const worn = resolveActiveLineages({
    equipment: { ...emptyEquipment(), weapon: 'flash-rapier' },
    lineages: { rapier: { ...three, active: { stat: statCard.id } } },
  });
  assert(worn.statEffects.attackSpeedPct === 0.16, `the owned rank III pays out: ${worn.statEffects.attackSpeedPct}`);
  // …and so does the band-collapse absorption under a T2 form (design §4).
  const t2Lean = rapier.cards.find((c) => c.tier === 2 && c.row === 'stat' && c.lane === statCard.lane)!;
  const absorbed = resolveActiveLineages({
    equipment: { ...emptyEquipment(), weapon: 'gale-needle' },
    lineages: {
      rapier: {
        ownedCards: [statCard.id, t2Lean.id], active: { stat: t2Lean.id },
        ownedForms: ['flash-rapier', 'gale-needle'], wornForm: 'gale-needle', ranks: { [statCard.id]: 2 },
      },
    },
  });
  assert(absorbed.absorbed.length === 1 && absorbed.absorbed[0]!.card.id === statCard.id
    && absorbed.absorbed[0]!.rank === 2 && absorbed.absorbed[0]!.statEffects?.attackSpeedPct === 0.12,
  'the T2 gate absorbs the T1 lean at the rank the player owns');
}

// ─── Hydration: ranks normalise in, retired cards refund (design §26.1) ──────

{
  const effect = rapier.cards.find((c) => c.id === 'rapier-t1-effect')!;
  const hydrated = normalizeLineageProgressMap({
    rapier: {
      ownedCards: [statCard.id, effect.id, payoffCard.id, statCard.id],
      active: { stat: statCard.id },
      ownedForms: ['flash-rapier'], wornForm: 'flash-rapier',
      // Effect has no stored rank; a rank for an unowned card and one for an
      // unranked card are dropped; an out-of-table rank is clamped.
      ranks: { [statCard.id]: 9, 'rapier-t1-attack': 2, [payoffCard.id]: 2 },
    },
  });
  const r = hydrated.rapier!;
  assert(r.ownedCards.length === 3, 'a card owned twice is owned once');
  assert(r.ranks?.[statCard.id] === MAX_LEAN_RANK, 'an out-of-table rank is clamped');
  assert(r.ranks?.[effect.id] === 1, 'an owned ranked card with no rank hydrates at rank I');
  assert(r.ranks?.['rapier-t1-attack'] === undefined, 'a rank for an unowned card is dropped');
  assert(r.ranks?.[payoffCard.id] === undefined, 'an unranked card carries no rank');
  const plain = normalizeLineageProgressMap({ rapier: { ownedCards: [payoffCard.id], active: {}, ownedForms: [], wornForm: '' } });
  assert(plain.rapier!.ranks === undefined, 'a tree with no ranked card carries no ranks');

  // A save from before design §26.1: its retired T1 cards drop out and are refunded
  // at today's T1 row price, in the lineage's essence and each card's own shard.
  const old = {
    rapier: {
      ownedCards: ['rapier-t1-tempo-stat', 'rapier-t1-affliction-payoff', 'rapier-t1-tempo-payoff', 'rapier-t1-tempo-stat'],
      active: { stat: 'rapier-t1-tempo-stat', payoff: 'rapier-t1-affliction-payoff' },
      ownedForms: ['flash-rapier'], wornForm: 'flash-rapier',
    },
    axe: { ownedCards: ['axe-t1-empowered-payoff', 'rapier-t1-engagement-stat'], active: {}, ownedForms: [], wornForm: '' },
    broken: { ownedCards: 'not-an-array' } as unknown as Record<string, never>,
  };
  const refund = retiredLineageCardRefund(old);
  assert(refund.cardIds.sort().join(',') === ['axe-t1-empowered-payoff', 'rapier-t1-affliction-payoff', 'rapier-t1-tempo-stat'].sort().join(','),
    `refunds each retired card once, of its own lineage only: ${refund.cardIds.join(',')}`);
  assert(refund.essence.green === rowEssenceCost(1, 'stat') + rowEssenceCost(1, 'payoff'), `rapier essence ${refund.essence.green}`);
  assert((refund.essence.purple ?? refund.essence.red ?? refund.essence.blue ?? refund.essence.yellow ?? 0) > 0,
    `the Axe's essence ${JSON.stringify(refund.essence)}`);
  assert(refund.shards.tempo === rowShardCost(1, 'stat') && refund.shards.affliction === rowShardCost(1, 'payoff')
    && refund.shards.empowered === rowShardCost(1, 'payoff'), `shards ${JSON.stringify(refund.shards)}`);
  const migrated = normalizeLineageProgressMap(old);
  assert(migrated.rapier!.ownedCards.join(',') === 'rapier-t1-tempo-payoff', 'the kept fixed verb survives, the rest drop');
  assert(migrated.rapier!.active.stat === undefined && migrated.rapier!.active.payoff === undefined,
    'no active row points at a retired card');
  // Idempotent: the normalised save owes nothing more.
  assert(retiredLineageCardRefund(migrated).cardIds.length === 0, 'a migrated save is refunded once');
  assert(retiredLineageCardRefund(undefined).cardIds.length === 0, 'no save, no refund');
}

// ─── Resolution: only a WORN lineage contributes ─────────────────────────────

{
  const progress = {
    ownedCards: [statCard.id, payoffCard.id],
    active: { stat: statCard.id, payoff: payoffCard.id },
    ownedForms: ['flash-rapier'],
    wornForm: 'flash-rapier',
  };
  const equipment: EquipmentMap = { ...emptyEquipment(), weapon: 'flash-rapier' };

  const worn = resolveActiveLineages({ equipment, lineages: { rapier: progress } });
  assert(worn.cards.length === 2, `both active cards should resolve, got ${worn.cards.length}`);
  assert((worn.statEffects.attackSpeedPct ?? 0) > 0, 'the stat row should contribute its stat');
  assert(worn.capstones.length === 0, 'a T1 base form crowns nothing');

  const unworn = resolveActiveLineages({ equipment: emptyEquipment(), lineages: { rapier: progress } });
  assert(unworn.cards.length === 0 && Object.keys(unworn.statEffects).length === 0,
    'an owned but unworn tree contributes nothing');

  // Owned but inactive is inert.
  const inactive = resolveActiveLineages({
    equipment, lineages: { rapier: { ...progress, active: {} } },
  });
  assert(inactive.cards.length === 0, 'owned cards that are not active do nothing');

  // A worn gated form grants its capstone without being bought.
  const crowned = resolveActiveLineages({
    equipment: { ...emptyEquipment(), weapon: 'gale-needle' },
    lineages: {
      rapier: { ...progress, ownedForms: ['flash-rapier', 'gale-needle'], wornForm: 'gale-needle' },
    },
  });
  assert(crowned.capstones.length === 1, 'a worn gated form grants its capstone');
  assert(crowned.capstones[0]!.payoff.magnitude > 0, 'the capstone resolved no magnitude');

  assert(resolveActiveLineages(undefined).cards.length === 0, 'no inventory resolves to nothing');
}

// ─── Which door a band gates on (design §21) ───────────────────────────

{
  const base = { ownedCards: [], active: {} };
  const t1 = { ...base, ownedForms: ['flash-rapier'], wornForm: 'flash-rapier' };

  // The worn form's own tier: its biome, which at T1 is the home biome.
  assert(lineageBandBiome(rapier, t1, 1) === 'forest', 'the T1 band gates on the crafted form’s biome');

  // A band the player has not reached shows the first authored door of that tier,
  // and nothing there is buyable anyway — the worn tier refuses first.
  assert(lineageBandBiome(rapier, t1, 3) === 'jungle', 'an unreached band names the authored door');
  const refused = checkUnlockCard({
    lineage: rapier,
    card: rapier.cards.find((c) => c.tier === 3)!,
    progress: t1,
    wallet: richWallet(),
  });
  assert(!refused.ok && /tier-3 form/.test(refused.reason ?? ''), 'an unreached band refuses on the form, not the biome');

  // Wearing one of two same-tier doors picks that one; the other stays owned.
  const bothT2 = {
    ...base,
    ownedForms: ['flash-rapier', 'gale-needle', 'jungle-stinger-rapier'],
    wornForm: 'jungle-stinger-rapier',
  };
  assert(lineageBandBiome(rapier, bothT2, 2) === 'jungle', 'the WORN door of the tier wins');
  assert(
    lineageBandBiome(rapier, { ...bothT2, wornForm: 'gale-needle' }, 2) === 'forest',
    'and swapping the worn form moves the band with it',
  );

  // A collapsed band keeps a door the player actually walked through.
  const t3Worn = {
    ...base,
    ownedForms: ['flash-rapier', 'jungle-stinger-rapier', 'jungle-venomthorn-rapier'],
    wornForm: 'jungle-venomthorn-rapier',
  };
  assert(lineageBandBiome(rapier, t3Worn, 2) === 'jungle', 'the collapsed T2 band keeps the owned Jungle door');
  assert(lineageBandBiome(rapier, t3Worn, 1) === 'forest', 'and the T1 band keeps the crafted one');

  // The level a card asks for follows the door, in that biome's own numbering.
  const t2Stat = rapier.cards.find((c) => c.tier === 2 && c.row === 'stat')!;
  const behindForest = resolveLineageCardFor(rapier, { ...bothT2, wornForm: 'gale-needle' }, t2Stat);
  const behindJungle = resolveLineageCardFor(rapier, bothT2, t2Stat);
  assert(behindForest.requiredBiomeGroup === 'forest', 'the resolved card names its door');
  assert(behindJungle.requiredBiomeGroup === 'jungle', 'and the other door when that form is worn');
  assert(
    behindJungle.requiredBiomeLevel < behindForest.requiredBiomeLevel,
    'the Jungle debuts in T2, so its T2 band sits lower in its own numbering',
  );
  assert(
    behindForest.requiredGlobalMastery === behindJungle.requiredGlobalMastery,
    'the Global Mastery band is tier-wide, so the door never moves it (design §4)',
  );
}

console.log('lineages.test.ts: ok');
