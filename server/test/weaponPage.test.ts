/**
 * The weapon page's model (design §24.6, course-correction W2-A): bands and rows
 * in order, one generated sentence per card and never the authored description,
 * card states from the shared checks, cost-chip shortness, the requirement a card
 * names, the lean preview on the real stat formula, the gate's one sentence, and
 * the mockup's toast copy.
 */
import assert from 'node:assert/strict';
import {
  LINEAGE_DATABASE, ROW_LABELS, emptyEquipment, isLineageParked, keystoneDefinition, pureSentenceText,
  shardName, verbSentence, type CombatArchetype, type LineageDefinition, type LineageProgress,
  type LineageWallet,
} from '@mmo-idle/shared';
import {
  ROW_QUESTIONS, STAT_SHEET_INERT_NOTE, STAT_SHEET_NOTE, activateAfterBuy, cardRequirement, costChips,
  formHeader, gateBlocks, lockedRowQuestion, materialLines, pageBands, pageCard, pageCardSentence,
  pageStatSheet, previewLeanProgress, successToast, type PageBand, type PageCardModel,
} from '../../client/src/ui/lineage/weaponPageModel';

const rapier = LINEAGE_DATABASE.get('rapier')!;
const hammer = LINEAGE_DATABASE.get('hammer')!;
const card = (lineage: LineageDefinition, id: string) => lineage.cards.find((c) => c.id === id)!;

const tree = (over: Partial<LineageProgress> = {}): LineageProgress => ({
  ownedCards: [], active: {}, ownedForms: ['flash-rapier'], wornForm: 'flash-rapier', ...over,
});

const wallet = (over: Partial<LineageWallet> = {}): LineageWallet => ({
  essences: { green: 150, blue: 150 },
  shards: { tempo: 8, affliction: 2, engagement: 5, empowered: 9, control: 9 },
  capstones: { forest: 1 },
  biomeLevels: { forest: 4, plains: 6, mountain: 2 },
  globalMastery: 12,
  playerTier: 1,
  ...over,
});

const find = (band: PageBand, id: string): PageCardModel => {
  for (const row of band.rows) for (const c of row.cards) if (c.card.id === id) return c;
  throw new Error(`card ${id} not in band ${band.tier}`);
};

// ── Bands: the lit band, then the next band locked ───────────────────────────
{
  const bands = pageBands({ lineage: rapier, progress: tree(), wallet: wallet() });
  assert.deepEqual(bands.map((b) => [b.tier, b.mode]), [[1, 'lit'], [2, 'locked']]);
  const [lit, next] = bands;
  assert.deepEqual(lit.rows.map((r) => r.title), ['Tier 1 · Lean', 'Tier 1 · Verb']);
  assert.deepEqual(lit.rows.map((r) => r.question), [ROW_QUESTIONS.stat, ROW_QUESTIONS.payoff]);
  // A row is a choice of three, in the lineage's lane order.
  for (const row of lit.rows) assert.deepEqual(row.cards.map((c) => c.card.lane), [...rapier.lanes]);
  // The next band's rows are locked and say what opens them.
  assert.ok(next.rows.length >= 2);
  for (const row of next.rows) {
    assert.equal(row.locked, true);
    assert.equal(row.question, lockedRowQuestion(2));
    assert.ok(row.cards.every((c) => c.state === 'locked' && c.action === 'none'));
  }
  assert.equal(lockedRowQuestion(2), 'Opens with a Tier 2 form. Pay the gate below.');
}

// ── Card states come from the shared checks ──────────────────────────────────
{
  const [lit] = pageBands({ lineage: rapier, progress: tree(), wallet: wallet() });
  const quick = find(lit, 'rapier-t1-tempo-stat');
  assert.equal(quick.state, 'buy');
  assert.equal(quick.action, 'buy');
  assert.equal(quick.sentence, '+9% attack speed.');
  assert.deepEqual(quick.requirement, { text: 'Forest 2', met: true });
  assert.deepEqual(quick.chips.map((c) => [c.amount, c.word, c.short]), [[30, 'Wild', false], [3, 'Gale', false]]);

  // Short on Venom Shards: pressable, says so in the mockup's words, chip red.
  const envenomed = find(lit, 'rapier-t1-affliction-stat');
  assert.equal(envenomed.state, 'short');
  assert.equal(envenomed.action, 'toast');
  assert.equal(envenomed.reason, 'Not enough Venom Shards. Shards drop where the map says.');
  assert.equal(envenomed.chips.find((c) => c.kind === 'shard')?.short, true);

  // The verb row: Forest 4 is met, Global Mastery 18 is the binding gate.
  const lunge = find(lit, 'rapier-t1-engagement-payoff');
  assert.equal(lunge.state, 'gated');
  assert.deepEqual(lunge.requirement, { text: 'Global Mastery 18', met: false });
  assert.match(lunge.reason ?? '', /Global Mastery 18/);
  // No lean: a verb reads its own pure sentence (design §24.2: a verb alone never does nothing).
  assert.equal(lunge.sentence, pureSentenceText('engagement'));
}

// ── A lean bought: verbs compose with it; the preview swaps it, display only ──
{
  const progress = tree({ ownedCards: ['rapier-t1-tempo-stat'], active: { stat: 'rapier-t1-tempo-stat' } });
  const [lit] = pageBands({ lineage: rapier, progress, wallet: wallet() });
  const quick = find(lit, 'rapier-t1-tempo-stat');
  assert.equal(quick.state, 'active');
  assert.equal(quick.tag, 'active');
  assert.ok(quick.accessibleName.startsWith('Quick Wrist. +9% attack speed.'));
  assert.equal(find(lit, 'rapier-t1-engagement-payoff').sentence, verbSentence('engagement', 'tempo'));

  assert.equal(previewLeanProgress(rapier, progress, 'rapier-t1-tempo-stat'), null, 'the active lean previews nothing');
  const preview = previewLeanProgress(rapier, progress, 'rapier-t1-engagement-stat')!;
  assert.equal(preview.active.stat, 'rapier-t1-engagement-stat');
  assert.ok(!progress.ownedCards.includes('rapier-t1-engagement-stat'), 'the real tree is untouched');
  const [previewed] = pageBands({ lineage: rapier, progress, wallet: wallet(), sentenceProgress: preview });
  assert.equal(find(previewed, 'rapier-t1-engagement-payoff').sentence, verbSentence('engagement', 'engagement'));
  assert.equal(find(previewed, 'rapier-t1-tempo-payoff').sentence, verbSentence('tempo', 'engagement'));
  // The cards' states still read the real tree.
  assert.equal(find(previewed, 'rapier-t1-engagement-stat').state, 'buy');

  // Owned, not active: a free swap.
  const both = tree({
    ownedCards: ['rapier-t1-tempo-stat', 'rapier-t1-engagement-stat'], active: { stat: 'rapier-t1-tempo-stat' },
  });
  const keen = find(pageBands({ lineage: rapier, progress: both, wallet: wallet() })[0], 'rapier-t1-engagement-stat');
  assert.equal(keen.state, 'owned');
  assert.equal(keen.action, 'activate');
  assert.equal(keen.tag, 'owned · click to swap in');
  assert.deepEqual(keen.chips, []);
}

// ── Control verbs say "needs a slow" (§24.2) ─────────────────────────────────
{
  const progress: LineageProgress = {
    ownedCards: ['hammer-t1-empowered-stat', 'hammer-t1-control-payoff'],
    active: { stat: 'hammer-t1-empowered-stat', payoff: 'hammer-t1-control-payoff' },
    ownedForms: ['heavy-hammer'], wornForm: 'heavy-hammer',
  };
  const verb = pageCard({ lineage: hammer, card: card(hammer, 'hammer-t1-control-payoff'), progress, wallet: wallet() });
  assert.equal(verb.needsSlow, true);
  assert.equal(verb.note, 'needs a slow');
  assert.equal(verb.state, 'active');
  assert.match(verb.accessibleName, /Needs a slow\./);
  assert.equal(verb.sentence, verbSentence('control', 'empowered'));
  const other = pageCard({ lineage: hammer, card: card(hammer, 'hammer-t1-engagement-payoff'), progress, wallet: wallet() });
  assert.equal(other.needsSlow, false);

  // With the Control lean active the lean IS the hold source (design §24.9).
  const seeded: LineageProgress = {
    ...progress,
    ownedCards: [...progress.ownedCards, 'hammer-t1-control-stat'],
    active: { stat: 'hammer-t1-control-stat', payoff: 'hammer-t1-control-payoff' },
  };
  const pinned = pageCard({ lineage: hammer, card: card(hammer, 'hammer-t1-control-payoff'), progress: seeded, wallet: wallet() });
  assert.equal(pinned.needsSlow, false);
  assert.equal(pinned.note, undefined);
  assert.doesNotMatch(pinned.accessibleName, /Needs a slow/);
  // And the lean's own line names its stat (it read "+3 Attack." like Engagement's).
  const lean = pageCard({ lineage: hammer, card: card(hammer, 'hammer-t1-control-stat'), progress: seeded, wallet: wallet() });
  assert.equal(lean.sentence, 'Every hit slows its target by 15% until your next swing.');
}

// ── The other verb caveats (design §24.9) ────────────────────────────────────
{
  const broadsword = LINEAGE_DATABASE.get('broadsword')!;
  const bTree = (over: Partial<LineageProgress> = {}): LineageProgress => ({
    ownedCards: [], active: {}, ownedForms: ['iron-broadsword'], wornForm: 'iron-broadsword', ...over,
  });
  const crown = card(broadsword, 'broadsword-t1-empowered-payoff');
  // The Slinger's mechanic is a reload, which has no hit: a payload that acts on
  // the hit (the pure pair's bigger mechanic hit) says so. Shown, not patched.
  const slinger = pageCard({ lineage: broadsword, card: crown, progress: bTree(), wallet: wallet(), archetype: 'reload' });
  assert.equal(slinger.note, 'your mechanic has no hit yet');
  assert.match(slinger.accessibleName, /Your mechanic has no hit yet\./);
  assert.equal(pageCard({ lineage: broadsword, card: crown, progress: bTree(), wallet: wallet(), archetype: 'cadence' }).note, undefined,
    'every other root\'s mechanic rides a hit');
  // A payload that does not need the hit (a refund) lands from a reload: no caveat.
  const refunding = bTree({ ownedCards: ['broadsword-t1-technique-stat'], active: { stat: 'broadsword-t1-technique-stat' } });
  assert.equal(pageCard({ lineage: broadsword, card: crown, progress: refunding, wallet: wallet(), archetype: 'reload' }).note, undefined);

  // Kill chain's moment is weak on bosses, whatever the lean; its lean is not a moment.
  const chain = pageCard({ lineage: broadsword, card: card(broadsword, 'broadsword-t1-kill-chain-payoff'), progress: bTree(), wallet: wallet() });
  assert.equal(chain.note, 'weak on bosses');
  assert.equal(chain.sentence, 'Your next hit after a kill heals a tenth of your pool and lands loaded (+50%).');
  assert.equal(pageCard({ lineage: broadsword, card: card(broadsword, 'broadsword-t1-kill-chain-stat'), progress: bTree(), wallet: wallet() }).note,
    undefined);

  // The page threads the class through every band's cards.
  const [lit] = pageBands({ lineage: broadsword, progress: bTree(), wallet: wallet(), archetype: 'reload' });
  assert.equal(find(lit, 'broadsword-t1-empowered-payoff').note, 'your mechanic has no hit yet');
}

// ── One sentence per card, never the authored description (rule 5) ──────────
for (const lineage of LINEAGE_DATABASE.values()) {
  if (isLineageParked(lineage)) continue;
  const progress = tree({ ownedForms: [lineage.forms[0]!.recipeId], wornForm: lineage.forms[0]!.recipeId });
  for (const c of lineage.cards) {
    const sentence = pageCardSentence(lineage, c, progress);
    assert.ok(sentence.length > 0 && sentence.endsWith('.'), `${c.id}: one sentence`);
    assert.notEqual(sentence, c.description, `${c.id}: never the flavour text`);
    assert.ok(!sentence.includes(c.description), `${c.id}: never the flavour text`);
    assert.ok(!/undefined|NaN/.test(sentence), `${c.id}: no hole in "${sentence}"`);
    if (c.row === 'keystone') assert.equal(sentence, keystoneDefinition(c.lane)?.rule, `${c.id}: the keystone's rule`);
  }
}

// ── The T2 band composes too (design §24.9): Lean / Verb / Amplifier ─────────
{
  const progress = tree({
    ownedCards: ['rapier-t1-tempo-stat', 'rapier-t1-tempo-payoff'],
    active: { stat: 'rapier-t1-tempo-stat', payoff: 'rapier-t1-tempo-payoff' },
    ownedForms: ['flash-rapier', 'gale-needle'], wornForm: 'gale-needle',
  });
  const bands = pageBands({ lineage: rapier, progress, wallet: wallet({ biomeLevels: { forest: 9 } }) });
  assert.deepEqual(bands.map((b) => [b.tier, b.mode]), [[1, 'collapsed'], [2, 'lit'], [3, 'locked']]);
  const [collapsed, lit] = bands;
  assert.equal(collapsed.summary, 'Tier 1: Quick Wrist, Flurry');
  assert.equal(collapsed.absorbedName, 'Quick Wrist');
  assert.equal(find(collapsed, 'rapier-t1-tempo-stat').state, 'absorbed');
  // The collapsed band's verb stays a wardrobe: owned and active.
  assert.equal(find(collapsed, 'rapier-t1-tempo-payoff').state, 'active');
  assert.deepEqual(lit.rows.map((r) => r.row), ['stat', 'payoff', 'amplifier']);
  // The rows compose, so they read Lean and Verb at T2 as at T1.
  assert.deepEqual(lit.rows.map((r) => r.title), ['Tier 2 · Lean', 'Tier 2 · Verb', 'Tier 2 · Amplifier']);
  // A T2 verb reads the generated composed sentence with the T2 numbers — here
  // with the lean carried up through the gate (Quick Wrist, absorbed: Tempo).
  assert.equal(find(lit, 'rapier-t2-tempo-payoff').sentence, verbSentence('tempo', 'tempo', 2));
  assert.equal(find(lit, 'rapier-t2-tempo-payoff').sentence, 'Every 6th hit strikes again at 115% strength.');
  assert.equal(find(lit, 'rapier-t2-engagement-payoff').sentence, verbSentence('engagement', 'tempo', 2));
  // The amplifier says what it changes on the pair the player has right now.
  assert.equal(find(lit, 'rapier-t2-tempo-amplifier').sentence, 'Running Riposte also lands on a second body.');
  assert.equal(find(lit, 'rapier-t2-affliction-amplifier').sentence, 'Deep Bloodletting can fire every 3.1 s (was every 5 s).');
  // An axis the pair does not have: it says so, and what it does instead.
  assert.equal(
    find(lit, 'rapier-t2-engagement-amplifier').sentence,
    'Its moment cannot come round sooner, so Opening Gambit lands bigger: 184% of the hit (was 115% of the hit).',
  );
  // With a lean whose payload lands on no body, the 'targets' amplifier grows the lunge.
  const lunge = tree({ ...progress, ownedCards: [...progress.ownedCards, 'rapier-t2-engagement-stat'],
    active: { ...progress.active, stat: 'rapier-t2-engagement-stat' } });
  const [collapsedLunge, litLunge] = pageBands({ lineage: rapier, progress: lunge, wallet: wallet({ biomeLevels: { forest: 9 } }) });
  assert.equal(find(litLunge!, 'rapier-t2-tempo-payoff').sentence, 'Every 6th hit is a lunge for 2.15× damage.');
  assert.equal(
    find(litLunge!, 'rapier-t2-tempo-amplifier').sentence,
    'Its payload lands on no body, so Running Riposte lands bigger: ×2.84 (was ×2.15).',
  );
  // The collapsed band's verb, reslotted under the T2 form, reads its OWN tier's numbers.
  assert.equal(find(collapsedLunge!, 'rapier-t1-tempo-payoff').sentence, 'Every 6th hit is a lunge for double damage.');
  // An absorbed stat card cannot be swapped back in, so a buy does not chase it.
  assert.equal(activateAfterBuy(rapier, progress, card(rapier, 'rapier-t1-engagement-stat')), false);
  assert.equal(activateAfterBuy(rapier, progress, card(rapier, 'rapier-t2-engagement-stat')), true);
}

// ── Cost chips and requirements ──────────────────────────────────────────────
{
  const chips = costChips({ essence: { green: 30 }, shards: { affliction: 3 } }, { essences: { green: 10 }, shards: { affliction: 3 } });
  assert.deepEqual(chips.map((c) => [c.kind, c.word, c.short]), [['essence', 'Wild', true], ['shard', 'Venom', false]]);
  const resolved = { requiredBiomeGroup: 'forest', requiredBiomeLevel: 4, requiredGlobalMastery: 18 };
  assert.deepEqual(cardRequirement(resolved, { biomeLevels: { forest: 2 }, globalMastery: 2 }), { text: 'Forest 4', met: false });
  assert.deepEqual(cardRequirement(resolved, { biomeLevels: { forest: 6 }, globalMastery: 18 }), { text: 'Forest 4', met: true });
  assert.deepEqual(cardRequirement(resolved, { biomeLevels: {}, isTestRoom: true }), { text: 'Forest 4', met: true });
}

// ── The stat sheet: the server's formula on a clone, rows that never jump ────
{
  const build = (archetype: CombatArchetype, root: string) => ({
    usesSkills: {
      unlockedSkills: [root], passives: {}, selectedClass: root,
      selectedSubVariant: null, selectedRange: null, combatArchetype: archetype,
    },
    equipment: { ...emptyEquipment(), weapon: 'flash-rapier' },
    itemUpgrades: {}, playerTier: 1, hpFraction: 1,
  });
  const leanIds = rapier.cards.filter((c) => c.tier === 1 && c.row === 'stat').map((c) => c.id);
  const progress = tree();
  const lineages = { rapier: progress };
  const sheet = (hovered: string | null, archetype: CombatArchetype = 'cadence', root = 'cadence-root') =>
    pageStatSheet({ build: build(archetype, root), lineages, lineage: rapier, progress, leanIds, hoveredLeanId: hovered });

  const still = sheet(null);
  assert.equal(still.note, STAT_SHEET_NOTE);
  assert.ok(still.rows.every((r) => r.after === undefined && r.direction === 0));
  assert.ok(still.attack > 0 && still.attacksPerSecond > 0);

  const speed = sheet('rapier-t1-tempo-stat');
  const aps = speed.rows.find((r) => r.key === 'attacksPerSecond')!;
  assert.ok(aps.after && aps.direction === 1, 'the tempo lean moves attack speed');
  assert.ok(speed.rows.find((r) => r.key === 'dps')?.direction === 1);
  assert.equal(speed.rows.find((r) => r.key === 'attack')?.after, undefined);

  const keen = sheet('rapier-t1-engagement-stat');
  assert.equal(keen.rows.find((r) => r.key === 'attack')?.direction, 1);
  assert.deepEqual(keen.rows.map((r) => r.key), still.rows.map((r) => r.key), 'rows never appear or vanish on hover');

  // DoT potency is read only by the DoT root: nothing moves for a Striker…
  const inert = sheet('rapier-t1-affliction-stat');
  assert.ok(inert.rows.every((r) => r.direction === 0));
  assert.equal(inert.note, STAT_SHEET_INERT_NOTE);
  assert.ok(!inert.rows.some((r) => r.key === 'dotMult'));
  // …and the Apprentice's poison moves.
  const dot = sheet('rapier-t1-affliction-stat', 'dot', 'dot-root');
  assert.equal(dot.rows.find((r) => r.key === 'dotMult')?.direction, 1);
}

// ── The gate: one block per boss, one sentence, pips, one door per form ──────
{
  const blocks = gateBlocks({ lineage: rapier, progress: tree(), wallet: wallet() });
  assert.deepEqual(blocks.map((b) => b.biome), ['forest', 'jungle']);
  const [forest, jungle] = blocks;
  assert.equal(forest.bossName, 'Gnarled Greatbear');
  assert.equal(forest.sentence,
    'Three Forest capstones, 180 Wild and 10 Gale Shards open a Tier 2 form: the Gale Needle (Forest · crowns Tempo).');
  assert.deepEqual(forest.pips, [true, false, false]);
  assert.equal(forest.progressLine, '1 of 3 capstones · the Greatbear is in Bearroot Hollow');
  assert.equal(forest.doors.length, 1);
  assert.equal(forest.doors[0]!.label, 'Pay the gate');
  assert.equal(forest.doors[0]!.action, 'blocked');
  assert.match(forest.doors[0]!.reason ?? '', /Forest level 6/);
  assert.deepEqual(jungle.pips, [false, false, false]);
  assert.match(jungle.sentence, /Venom Shards open a Tier 2 form: the Stinger Rapier \(Jungle · crowns Affliction\)\.$/);

  // Rich enough: the door pays; once owned, it wears.
  const rich = wallet({ biomeLevels: { forest: 6, plains: 12, mountain: 12 }, globalMastery: 30, capstones: { forest: 3 }, essences: { green: 500 }, shards: { tempo: 20 } });
  assert.equal(gateBlocks({ lineage: rapier, progress: tree(), wallet: rich })[0]!.doors[0]!.action, 'pay');
  const owned = tree({ ownedForms: ['flash-rapier', 'gale-needle'] });
  const door = gateBlocks({ lineage: rapier, progress: owned, wallet: wallet() })[0]!.doors[0]!;
  assert.equal(door.action, 'wear');
  assert.equal(door.label, 'Wear the Gale Needle');
}

// ── Header, materials, toasts ────────────────────────────────────────────────
{
  const header = formHeader({ lineage: rapier, progress: tree(), wallet: wallet(), attack: 29.4, attacksPerSecond: 1.6 });
  assert.equal(header.name, 'Flash Rapier');
  assert.equal(header.eyebrow, 'Weapon · Forest lineage · Tier 1 form');
  assert.equal(header.meta, 'Attack 29 · 1.6 swings/s · Forest level 4 · Global Mastery 12');
  assert.deepEqual(header.lanes.map((l) => l.name), ['Tempo', 'Affliction', 'Engagement']);
  assert.deepEqual(header.alsoOwned, []);

  const lines = materialLines({ lineage: rapier, progress: tree(), wallet: wallet() });
  assert.deepEqual(lines.map((l) => l.name), ['Wild essence', 'Gale Shards', 'Venom Shards', 'Spark Shards', "Warden's Heart", 'Matriarch Fang']);
  assert.match(lines[1]!.where ?? '', /^Pack territory: /);
  assert.equal(lines.find((l) => l.kind === 'capstone')?.held, 1);
  assert.equal(shardName('tempo'), 'Gale Shard');

  assert.equal(successToast({ action: 'unlockCard', cardId: 'x', row: 'stat', name: 'Quick Wrist', thenActivate: true }),
    'Quick Wrist bought and active. Owned forever.');
  assert.equal(successToast({ action: 'setActive', cardId: 'x', name: 'Keen Edge', afterBuy: false }), 'Keen Edge swapped in. Free.');
  assert.equal(ROW_LABELS.stat, 'Lean');
}

console.log('weaponPage: ok');
