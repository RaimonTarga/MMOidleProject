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
  baseRecoveryForTier,
  emptyEquipment,
  lineageCardPrice,
  lineageGateCost,
  resolveLineageCard,
  rowBiomeLevel,
} from '@mmo-idle/shared';
import type { EssenceType, PacketId, PersistedPlayerSlices } from '@mmo-idle/shared';
import type { PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { craftRecipe } from '../src/systems/player/economy/crafting';
import { equipItem, unequipItem } from '../src/systems/player/economy/inventory';
import {
  setLineageActive, unlockLineageCard, unlockLineageForm, wearLineageForm,
} from '../src/systems/player/economy/lineages';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const rapier = LINEAGE_DATABASE.get('rapier')!;
const statCard = rapier.cards.find((c) => c.id === 'rapier-t1-tempo-stat')!;
const payoffCard = rapier.cards.find((c) => c.id === 'rapier-t1-tempo-payoff')!;
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
      catalysts: {}, catalystProgress: {},
      shards, capstones: rich ? { forest: 99, jungle: 99 } : {},
      biomeXP: {}, biomeLevel: rich ? { forest: 99, jungle: 99 } : {},
      unlockedRecipes: [], questProgress: {},
      playerTier: rich ? 4 : 1, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { technique: null, guard: null },
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
      ownedCards: ['broadsword-t1-tempo-stat'], active: {},
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
