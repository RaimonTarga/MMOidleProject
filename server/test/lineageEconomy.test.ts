/**
 * The four lineage handlers, end to end on a real World (progression rework 1b).
 *
 * WHY THIS EXISTS: the shared checks are already tested in
 * `shared/src/systems/lineages.test.ts`. What this pins is the half that only
 * exists on the server — that a refused action spends NOTHING, that an accepted
 * one spends exactly what the magnitude table said and no more, that the tree
 * and `equipment[slot]` stay in step in both directions, and that a card's stat
 * row actually reaches the player's stats.
 *
 * Deliberately NOT asserted: any magnitude. Costs and values come from the table
 * and move with every tuning pass, so every assertion here is relative — before
 * versus after, or resolved-cost versus wallet delta.
 *
 * Run: node --conditions=development --import tsx test/lineageEconomy.test.ts
 */
import {
  GAME_CONFIG,
  LINEAGE_DATABASE,
  absorbedStatCards,
  baseRecoveryForTier,
  emptyEquipment,
  lineageCardPrice,
  lineageCardTie,
  lineageGateCost,
  resolveLineageCard,
  rowBiomeLevel,
  rowsForTier,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { EssenceType, LineageCard, PacketId } from '@mmo-idle/shared';
import type { PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { craftRecipe } from '../src/systems/player/economy/crafting';
import { equipItem, unequipItem } from '../src/systems/player/economy/inventory';
import {
  setLineageActive, unlockLineageCard, unlockLineageForm, wearLineageForm,
} from '../src/systems/player/economy/lineages';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const rapier = LINEAGE_DATABASE.get('rapier')!;
const statCard = rapier.cards.find((c) => c.id === 'rapier-t1-tempo-stat')!;
const payoffCard = rapier.cards.find((c) => c.id === 'rapier-t1-tempo-payoff')!;
/** The Engagement stat row: flat attack, so a fold is an exact delta to compare. */
const engagementStat = rapier.cards.find((c) => c.id === 'rapier-t1-engagement-stat')!;
const galeNeedle = rapier.forms.find((f) => f.recipeId === 'gale-needle')!;

/** A character who already holds the crafted base form and can afford anything. */
function makePlayer(id: string, opts: { rich?: boolean } = {}): PersistedPlayerSlices {
  const rich = opts.rich ?? true;
  const wallet = rich ? 100000 : 0;
  const shards: Partial<Record<PacketId, number>> = rich
    ? { tempo: 999, affliction: 999, engagement: 999 }
    : {};
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-t1-forest-01', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: wallet, blue: wallet, green: wallet, yellow: wallet, purple: wallet },
      shards, capstones: rich ? { forest: 99, jungle: 99 } : {},
      biomeXP: {}, biomeLevel: rich ? { forest: 99, jungle: 99 } : {},
      unlockedRecipes: [], questProgress: {},
      playerTier: rich ? 4 : 1, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: {
      inventory: ['flash-rapier'], equipment: { ...emptyEquipment(), weapon: null }, itemUpgrades: {},
    },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

function spawn(id: string, opts: { rich?: boolean } = {}): { world: World; player: PlayerEntity } {
  const world = new World();
  const player = world.attachPlayerEntity(makePlayer(id, opts), id);
  equipItem(world, player, 'flash-rapier');
  return { world, player };
}

const walletTotal = (p: PlayerEntity): number =>
  Object.values(p.tracksProgression.essences).reduce((a, b) => a + b, 0)
  + Object.values(p.tracksProgression.shards).reduce((a, b) => a + (b ?? 0), 0)
  + Object.values(p.tracksProgression.capstones).reduce((a, b) => a + b, 0);

// ─── A tree is born from the form the player holds ───────────────────────────

{
  const { player } = spawn('p-born');
  const tree = player.holdsInventory.lineages?.rapier;
  assert(!!tree, 'holding the crafted base form opens its tree');
  assert(tree!.ownedForms.includes('flash-rapier'), 'the crafted form is owned');
  assert(tree!.wornForm === 'flash-rapier', 'equipping the base form wears it');
  assert(tree!.ownedCards.length === 0, 'a new tree owns no cards');
}

// Crafting the base form opens the tree too, not just loading with it.
{
  const world = new World();
  const slices = makePlayer('p-craft');
  slices.holdsInventory.inventory = [];
  const player = world.attachPlayerEntity(slices, 'p-craft');
  assert(!player.holdsInventory.lineages?.rapier, 'no form, no tree');
  player.tracksProgression.unlockedRecipes.push('flash-rapier');
  const result = craftRecipe(world, player, 'flash-rapier');
  assert(result.success, `fixture: crafting the base form should work (${result.reason})`);
  assert(!!player.holdsInventory.lineages?.rapier, 'crafting the base form opens its tree');
}

// ─── Buying a card spends exactly the resolved cost ──────────────────────────

{
  const { world, player } = spawn('p-buy');
  const { cost } = lineageCardPrice({ lineage: rapier, card: statCard });
  const greenBefore = player.tracksProgression.essences.green;
  const tempoBefore = player.tracksProgression.shards.tempo ?? 0;

  const result = unlockLineageCard(world, player, 'rapier', statCard.id);
  assert(result.success, `buying should succeed: ${result.reason}`);
  assert(result.action === 'unlockCard', 'the result names its action');

  assert(
    player.tracksProgression.essences.green === greenBefore - (cost.essence.green ?? 0),
    'essence spent must equal the resolved cost',
  );
  assert(
    (player.tracksProgression.shards.tempo ?? 0) === tempoBefore - (cost.shards.tempo ?? 0),
    'shards spent must equal the resolved cost',
  );
  const tree = player.holdsInventory.lineages!.rapier!;
  assert(tree.ownedCards.includes(statCard.id), 'the card is owned');
  assert(tree.active.stat === statCard.id, 'the first card into an empty row activates itself');

  // Buying it twice is refused and costs nothing.
  const before = walletTotal(player);
  const again = unlockLineageCard(world, player, 'rapier', statCard.id);
  assert(!again.success, 'a card cannot be bought twice');
  assert(walletTotal(player) === before, 'a refused purchase spends nothing');
}

// A refused purchase — too poor — spends nothing and owns nothing.
{
  const { world, player } = spawn('p-poor', { rich: false });
  player.tracksProgression.biomeLevel.forest = 99;
  const before = walletTotal(player);
  const result = unlockLineageCard(world, player, 'rapier', statCard.id);
  assert(!result.success, 'a broke player cannot buy');
  assert(walletTotal(player) === before, 'a refused purchase spends nothing');
  assert(player.holdsInventory.lineages!.rapier!.ownedCards.length === 0, 'and owns nothing');
}

// The biome gate is the server's, not the client's: it refuses below the level.
{
  const { world, player } = spawn('p-early');
  player.tracksProgression.biomeLevel.forest = rowBiomeLevel(statCard.tier, statCard.row) - 1;
  const result = unlockLineageCard(world, player, 'rapier', statCard.id);
  assert(!result.success && /forest level/i.test(result.reason ?? ''), `expected a level refusal, got ${result.reason}`);
}

// ─── A stat row reaches the player's stats ───────────────────────────────────

{
  const { world, player } = spawn('p-stats');
  const cooldownBefore = player.performsAttack.attackCooldown;
  unlockLineageCard(world, player, 'rapier', statCard.id);
  assert(
    player.performsAttack.attackCooldown < cooldownBefore,
    'an active Tempo stat row must shorten the attack cooldown',
  );

  // Deactivating it gives the stat straight back — owned is not active.
  setLineageActive(world, player, 'rapier', 'stat', null);
  assert(
    player.performsAttack.attackCooldown === cooldownBefore,
    'clearing the row must return the stat exactly',
  );

  // And re-activating is free.
  const before = walletTotal(player);
  const back = setLineageActive(world, player, 'rapier', 'stat', statCard.id);
  assert(back.success, 'reactivating an owned card is legal');
  assert(walletTotal(player) === before, 'activating a card is free');
  assert(player.performsAttack.attackCooldown < cooldownBefore, 'and the stat is back');
}

// An unworn lineage contributes nothing, even with everything bought.
{
  const { world, player } = spawn('p-unworn');
  unlockLineageCard(world, player, 'rapier', statCard.id);
  const withWeapon = player.performsAttack.attackCooldown;
  unequipItem(world, player, 'weapon');
  assert(
    player.performsAttack.attackCooldown > withWeapon,
    'unequipping the form must take its cards with it',
  );
}

// ─── The switch discount is real money ──────────────────────────────────────

{
  const { world, player } = spawn('p-switch');
  // Own the same row at the same tier on another weapon lineage.
  player.holdsInventory.lineages = {
    ...player.holdsInventory.lineages,
    broadsword: {
      ownedCards: ['broadsword-t1-technique-stat'], active: {},
      ownedForms: ['iron-broadsword'], wornForm: 'iron-broadsword',
    },
  };
  const full = resolveLineageCard(statCard, rapier).cost.essence.green!;
  const greenBefore = player.tracksProgression.essences.green;
  unlockLineageCard(world, player, 'rapier', statCard.id);
  const spent = greenBefore - player.tracksProgression.essences.green;
  assert(spent > 0 && spent < full, `a discounted row should cost less than ${full}, spent ${spent}`);
}

// ─── Gates spend the capstone, and buying a form is not wearing it ───────────

{
  const { world, player } = spawn('p-gate');
  const cost = lineageGateCost(galeNeedle, rapier);
  const capstonesBefore = player.tracksProgression.capstones.forest ?? 0;

  const result = unlockLineageForm(world, player, 'rapier', 'gale-needle');
  assert(result.success, `paying the gate should succeed: ${result.reason}`);
  assert(
    (player.tracksProgression.capstones.forest ?? 0) === capstonesBefore - cost.capstone.amount,
    'the gate spends the boss capstone',
  );

  const tree = player.holdsInventory.lineages!.rapier!;
  assert(tree.ownedForms.includes('gale-needle'), 'the form is owned');
  assert(tree.wornForm === 'flash-rapier', 'paying a gate does not change what you are wearing');
  assert(player.holdsInventory.equipment.weapon === 'flash-rapier', 'nor what is equipped');

  // Wearing it is free and mirrors into the slot.
  const before = walletTotal(player);
  const worn = wearLineageForm(world, player, 'rapier', 'gale-needle');
  assert(worn.success, `wearing an owned form should succeed: ${worn.reason}`);
  assert(walletTotal(player) === before, 'wearing an owned form is free');
  assert(player.holdsInventory.lineages!.rapier!.wornForm === 'gale-needle', 'wornForm moved');
  assert(player.holdsInventory.equipment.weapon === 'gale-needle', 'equipment[slot] mirrors wornForm');

  // And swapping back is free too — owned is forever.
  wearLineageForm(world, player, 'rapier', 'flash-rapier');
  assert(player.holdsInventory.equipment.weapon === 'flash-rapier', 'swapping back works');
  assert(
    player.holdsInventory.lineages!.rapier!.ownedForms.includes('gale-needle'),
    'the unworn form is still owned',
  );
}

// A gate with no capstone in the wallet is refused and spends nothing.
{
  const { world, player } = spawn('p-nocapstone');
  player.tracksProgression.capstones = {};
  const before = walletTotal(player);
  const result = unlockLineageForm(world, player, 'rapier', 'gale-needle');
  assert(!result.success, 'no capstone, no gate');
  assert(walletTotal(player) === before, 'a refused gate spends nothing');
}

// ─── Equipping through the ordinary inventory path keeps the tree in step ────

{
  const { world, player } = spawn('p-equip');
  unlockLineageForm(world, player, 'rapier', 'gale-needle');
  wearLineageForm(world, player, 'rapier', 'gale-needle');
  // Now go around the tree panel entirely.
  equipItem(world, player, 'flash-rapier');
  assert(
    player.holdsInventory.lineages!.rapier!.wornForm === 'flash-rapier',
    'equipping a form directly must move wornForm with it, or the tree goes dark',
  );
}

// ─── Band collapse: the gate absorbs the band below's stat row (design §4) ───
//
// "The stat row's value folds into the next form's base stats at the gate, so the
// visible stat row is always the current tier's." What is pinned here is that the
// fold lands EXACTLY ONCE — not twice while the save still points `active.stat` at
// the collapsed card, not again on the next recalc — and that only the STAT row is
// retired: the collapsed band's payoff row is a wardrobe to reslot from.

/** Climb to the tier-2 Gale Needle, optionally owning the T1 stat row first. */
function wearT2(id: string, opts: { withStatCard: boolean }): { world: World; player: PlayerEntity } {
  const { world, player } = spawn(id);
  if (opts.withStatCard) unlockLineageCard(world, player, 'rapier', engagementStat.id);
  unlockLineageForm(world, player, 'rapier', 'gale-needle');
  wearLineageForm(world, player, 'rapier', 'gale-needle');
  return { world, player };
}

{
  // The absorbed row is worth what the slotted row was: resolve it once here and
  // compare every delta against that, never against a literal.
  const absorbedAttack = resolveLineageCard(engagementStat, rapier).statEffects!.attack!;
  assert(absorbedAttack > 0, 'fixture: the engagement stat row should grant flat attack');

  // At tier 1 it is an ordinary slotted stat row.
  const { world, player } = spawn('p-absorb-t1');
  const attackBare = player.dealsDamage.attack;
  unlockLineageCard(world, player, 'rapier', engagementStat.id);
  assert(
    player.dealsDamage.attack === attackBare + absorbedAttack,
    `a slotted stat row should add exactly ${absorbedAttack}`,
  );

  // Now wear the tier-2 form. Compare against a twin who never bought the card,
  // so the new form's own base stats cancel out of the comparison.
  const owner = wearT2('p-absorb-owner', { withStatCard: true });
  const twin = wearT2('p-absorb-twin', { withStatCard: false });
  assert(
    owner.player.dealsDamage.attack - twin.player.dealsDamage.attack === absorbedAttack,
    'the absorbed stat row must still be worth exactly its resolved value',
  );

  const tree = owner.player.holdsInventory.lineages!.rapier!;
  assert(
    tree.active.stat === engagementStat.id,
    'fixture: the collapsed card is still the one the tree has slotted',
  );
  assert(
    absorbedStatCards(rapier, tree).map((c) => c.id).join() === engagementStat.id,
    'exactly one card is absorbed, and it is that one',
  );

  // ...and it is worth it ONCE, not once as the slotted row plus once as the
  // absorbed one. Clearing the row cannot take an absorbed row away.
  const absorbedTotal = owner.player.dealsDamage.attack;
  setLineageActive(owner.world, owner.player, 'rapier', 'stat', null);
  assert(
    owner.player.dealsDamage.attack === absorbedTotal,
    'clearing a collapsed stat row must change nothing — it is base stats now',
  );

  // A double recalc does not double it either.
  recalculatePlayerEntityStats(owner.world, owner.player);
  recalculatePlayerEntityStats(owner.world, owner.player);
  assert(
    owner.player.dealsDamage.attack === absorbedTotal,
    'recalculating twice must not double the absorbed row',
  );
  assert(
    owner.player.dealsDamage.attack - twin.player.dealsDamage.attack === absorbedAttack,
    'and the twin comparison still holds after the recalcs',
  );
}

// The stat row of a collapsed band is unselectable; its payoff row is not.
{
  const { world, player } = wearT2('p-collapse-rows', { withStatCard: true });

  const reslotStat = setLineageActive(world, player, 'rapier', 'stat', engagementStat.id);
  assert(!reslotStat.success, 'a collapsed stat row cannot be slotted again');
  assert(
    /already part of your form/i.test(reslotStat.reason ?? ''),
    `expected a "part of your form" reason, got ${reslotStat.reason}`,
  );

  // The payoff row of the same collapsed band is still bought and slotted freely.
  const bought = unlockLineageCard(world, player, 'rapier', payoffCard.id);
  assert(bought.success, `a collapsed band's payoff row stays buyable: ${bought.reason}`);
  const slotted = setLineageActive(world, player, 'rapier', 'payoff', payoffCard.id);
  assert(slotted.success, `a collapsed band's payoff row stays selectable: ${slotted.reason}`);
  assert(
    player.holdsInventory.lineages!.rapier!.active.payoff === payoffCard.id,
    'and it really is the active payoff',
  );
}

// Nothing absorbs while the tier-2 form is only OWNED: the band collapses under
// the form being WORN, so wearing the old form back un-folds it.
{
  const { world, player } = spawn('p-absorb-unworn');
  unlockLineageCard(world, player, 'rapier', engagementStat.id);
  const slottedAttack = player.dealsDamage.attack;
  unlockLineageForm(world, player, 'rapier', 'gale-needle');
  assert(
    player.dealsDamage.attack === slottedAttack,
    'buying the form must not absorb anything on its own',
  );
  assert(
    setLineageActive(world, player, 'rapier', 'stat', engagementStat.id).success,
    'and the stat row is still selectable at tier 1',
  );

  wearLineageForm(world, player, 'rapier', 'gale-needle');
  assert(!setLineageActive(world, player, 'rapier', 'stat', engagementStat.id).success, 'collapsed at tier 2');
  wearLineageForm(world, player, 'rapier', 'flash-rapier');
  assert(
    setLineageActive(world, player, 'rapier', 'stat', engagementStat.id).success,
    'and selectable again once the tier-1 form is worn back',
  );
  assert(
    player.dealsDamage.attack === slottedAttack,
    'wearing the tier-1 form back pays the row as a slotted row, exactly once',
  );
}

// ─── A non-weapon lineage has no stat row, so absorption is a no-op ──────────
//
// Design §4/§17: "Non-weapon slots run one row fewer per tier (no stat row; base
// stats come from the form)." Absorption must leave them alone rather than throw
// or invent a row to fold.

{
  const { world, player } = spawn('p-plate');
  player.tracksProgression.biomeLevel.mountain = 99;
  player.tracksProgression.capstones.mountain = 99;
  for (const lane of ['bulwark', 'barrier-tempo', 'control'] as PacketId[]) {
    player.tracksProgression.shards[lane] = 999;
  }
  player.holdsInventory.inventory.push('mountain-vest-t1');
  equipItem(world, player, 'mountain-vest-t1');

  const plate = LINEAGE_DATABASE.get('plate')!;
  assert(!plate.cards.some((c) => c.row === 'stat'), 'fixture: a non-weapon lineage authors no stat row');
  const platePayoff = plate.cards.find((c) => c.row === 'payoff')!;
  const boughtPayoff = unlockLineageCard(world, player, 'plate', platePayoff.id);
  assert(boughtPayoff.success, `the plate payoff row should be buyable: ${boughtPayoff.reason}`);

  assert(unlockLineageForm(world, player, 'plate', 'mountain-vest-t2').success, 'the plate gate should open');
  assert(wearLineageForm(world, player, 'plate', 'mountain-vest-t2').success, 'and the tier-2 plate is wearable');

  const progress = player.holdsInventory.lineages!.plate!;
  assert(absorbedStatCards(plate, progress).length === 0, 'a lineage with no stat row absorbs nothing');
  assert(
    progress.active.payoff === platePayoff.id,
    "and the collapsed band's payoff row is left slotted, not retired",
  );

  const hp = player.hasHealth.maxHp;
  const plating = player.mitigatesDamage.plating;
  recalculatePlayerEntityStats(world, player);
  recalculatePlayerEntityStats(world, player);
  assert(player.hasHealth.maxHp === hp, 'recalc must not move maxHp for a lineage with nothing to absorb');
  assert(player.mitigatesDamage.plating === plating, 'nor plating');
}

// ─── The amplifier connector reads the types, not authored data ──────────────
//
// The tree draws a tick from an amplifier to the card its `modifies` names. The
// T2 cards are authored elsewhere, so this is pinned against SYNTHETIC cards: the
// contract is `row === 'amplifier'` plus `modifies`, and it has to hold for a band
// with no amplifier cards at all and for a full one.

{
  const synth = (over: Partial<LineageCard> & Pick<LineageCard, 'id' | 'row' | 'lane'>): LineageCard => ({
    lineageId: 'synthetic', tier: 2, name: over.id, description: '', fx: 'tempo.trail',
    ...over,
  } as LineageCard);

  const t2Stat = synth({ id: 's-stat', row: 'stat', lane: 'tempo' });
  const t2Payoff = synth({ id: 's-payoff', row: 'payoff', lane: 'tempo' });
  const t2Amp = synth({ id: 's-amp', row: 'amplifier', lane: 'tempo', modifies: 's-payoff' });
  const offLaneAmp = synth({ id: 's-amp-off', row: 'amplifier', lane: 'affliction', modifies: 's-payoff' });
  const deepAmp = synth({ id: 's-amp-deep', row: 'amplifier', lane: 'tempo', modifies: 's-stat' });
  const lowerTier = synth({ id: 's-payoff-t1', row: 'payoff', lane: 'tempo', tier: 1 });
  const crossTierAmp = synth({ id: 's-amp-t1', row: 'amplifier', lane: 'tempo', modifies: 's-payoff-t1' });
  const danglingAmp = synth({ id: 's-amp-dangling', row: 'amplifier', lane: 'tempo', modifies: 'no-such-card' });

  const lineage = {
    ...rapier,
    id: 'synthetic',
    cards: [t2Stat, t2Payoff, t2Amp, offLaneAmp, deepAmp, lowerTier, crossTierAmp, danglingAmp],
  };
  const rows = rowsForTier(2);
  assert(rows.includes('amplifier'), 'fixture: the tier-2 band has an amplifier row');

  assert(!lineageCardTie(lineage, t2Payoff, rows), 'a payoff row modifies nothing, so it ties to nothing');
  assert(!lineageCardTie(lineage, danglingAmp, rows), 'an unknown `modifies` ties to nothing rather than throwing');

  const tie = lineageCardTie(lineage, t2Amp, rows)!;
  assert(tie.targetId === t2Payoff.id && tie.name === t2Payoff.name, 'the tie names the modified card');
  assert(tie.adjacent, 'the payoff row directly above in the same lane takes a straight tick');

  assert(lineageCardTie(lineage, offLaneAmp, rows)!.adjacent === false, 'a different lane is a different column');
  assert(lineageCardTie(lineage, deepAmp, rows)!.adjacent === false, 'two rows up is not a short tick');
  assert(lineageCardTie(lineage, crossTierAmp, rows)!.adjacent === false, 'a card in another band is not above it');

  // The zero-amplifier case: today's authored lineages have no amplifier row, and
  // nothing may tie, throw, or claim adjacency.
  for (const authored of LINEAGE_DATABASE.values()) {
    for (const card of authored.cards) {
      const authoredTie = lineageCardTie(authored, card, rowsForTier(card.tier));
      assert(
        card.modifies ? !!authoredTie : authoredTie === undefined,
        `${card.id}: a card ties exactly when it modifies something`,
      );
    }
  }
}

// ─── Unknown ids are refused, not crashed on ─────────────────────────────────

{
  const { world, player } = spawn('p-junk');
  assert(!unlockLineageCard(world, player, 'not-a-lineage', statCard.id).success, 'unknown lineage');
  assert(!unlockLineageCard(world, player, 'rapier', 'not-a-card').success, 'unknown card');
  assert(!unlockLineageForm(world, player, 'rapier', 'not-a-form').success, 'unknown form');
  assert(!wearLineageForm(world, player, 'rapier', 'iron-broadsword').success, 'another lineage\'s form');
  assert(!setLineageActive(world, player, 'rapier', 'payoff', payoffCard.id).success, 'unowned card');
}

console.log('lineageEconomy.test.ts: ok');
