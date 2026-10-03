/**
 * Parked trees are unreachable everywhere, consistently (design §24.5).
 *
 * Every armour, charm and boots lineage is parked for the second playtest: its
 * data is kept, and nothing reaches it. This pins every door a parked tree could
 * leak through — the shared checks the client gates buttons with, the four
 * server handlers, the inventory sync that births trees, the runtime resolver
 * (cards AND capstones), the client's tree entry, and the craft gate (a parked
 * lineage's T2+ forms are plain recipes, not gated doors). And it pins the other
 * half of "data stays": a save that already holds a parked tree keeps it intact.
 *
 * Run: node --conditions=development --import tsx test/lineageParked.test.ts
 */
import {
  GAME_CONFIG, LINEAGE_DATABASE, PACKET_IDS, PARKED_LINEAGE_REASON, baseRecoveryForTier,
  checkSetActive, checkUnlockCard, checkUnlockForm, checkWearForm, emptyEquipment,
  isGatedLineageForm, isLineageParked, lineageForEquippedItem, liveLineages,
  normalizeLineageProgressMap, resolveActiveLineages,
} from '@mmo-idle/shared';
import type { LineageProgress, LineageWallet, PacketId } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { craftRecipe } from '../src/systems/player/economy/crafting';
import { equipItem } from '../src/systems/player/economy/inventory';
import {
  setLineageActive, unlockLineageCard, unlockLineageForm, wearLineageForm,
} from '../src/systems/player/economy/lineages';
import { syncLineagesFromInventory } from '../src/systems/player/economy/lineageSync';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const PARKED = [...LINEAGE_DATABASE.values()].filter((l) => isLineageParked(l));

// ─── Which trees are parked ──────────────────────────────────────────────────

assert(PARKED.length === 15, `the fifteen non-weapon lineages are parked, got ${PARKED.length}`);
assert(PARKED.every((l) => l.slot !== 'weapon'), 'no weapon lineage is parked');
assert(
  liveLineages().length === 5 && liveLineages().every((l) => l.slot === 'weapon'),
  'the five weapon lineages are the live trees',
);
assert(PARKED.every((l) => l.cards.length > 0 && l.forms.length > 0), 'a parked tree keeps its data');

// ─── The shared checks refuse every action on a parked tree ──────────────────
//
// Even with the test room's bypass and an owned card in hand: parked is checked
// before anything else, so no wallet, level or ownership can open it.

const richWallet: LineageWallet = {
  essences: { red: 1e9, blue: 1e9, green: 1e9, yellow: 1e9, purple: 1e9 },
  shards: Object.fromEntries(PACKET_IDS.map((p) => [p, 1e9])) as Partial<Record<PacketId, number>>,
  capstones: Object.fromEntries([...new Set(PARKED.flatMap((l) => l.forms.map((f) => f.biome)))].map((b) => [b, 99])),
  biomeLevels: Object.fromEntries([...new Set(PARKED.flatMap((l) => l.forms.map((f) => f.biome)))].map((b) => [b, 99])),
  globalMastery: 999, playerTier: 4, isTestRoom: true,
};

for (const lineage of PARKED) {
  const base = lineage.forms.find((f) => f.tier === 1)!;
  const card = lineage.cards[0]!;
  const owned: LineageProgress = {
    ownedCards: lineage.cards.map((c) => c.id), active: {},
    ownedForms: lineage.forms.map((f) => f.recipeId), wornForm: base.recipeId,
  };
  const bare: LineageProgress = { ownedCards: [], active: {}, ownedForms: [base.recipeId], wornForm: base.recipeId };

  const checks = {
    unlockCard: checkUnlockCard({ lineage, card, progress: bare, wallet: richWallet }),
    setActive: checkSetActive({ lineage, progress: owned, row: card.row, cardId: card.id }),
    clearRow: checkSetActive({ lineage, progress: owned, row: card.row, cardId: null }),
    wearForm: checkWearForm({ lineage, progress: owned, recipeId: base.recipeId }),
    ...(lineage.forms.some((f) => f.tier > 1)
      ? { unlockForm: checkUnlockForm({ lineage, form: lineage.forms.find((f) => f.tier > 1)!, progress: bare, wallet: richWallet }) }
      : {}),
  };
  for (const [action, check] of Object.entries(checks)) {
    assert(!check.ok && check.reason === PARKED_LINEAGE_REASON, `${lineage.id} ${action}: refused as parked, got ${JSON.stringify(check)}`);
  }
}

// ─── The server handlers refuse, spend nothing, and write no tree ────────────

function makeSlices(id: string, inventory: string[]): PersistedPlayerSlices {
  const levels = Object.fromEntries(
    [...new Set([...LINEAGE_DATABASE.values()].flatMap((l) => l.forms.map((f) => f.biome)))].map((b) => [b, 99]),
  );
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-t1-forest-01', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 1e6, blue: 1e6, green: 1e6, yellow: 1e6, purple: 1e6 },
      shards: Object.fromEntries(PACKET_IDS.map((p) => [p, 999])) as Partial<Record<PacketId, number>>,
      capstones: Object.fromEntries(Object.keys(levels).map((b) => [b, 99])),
      biomeXP: {}, biomeLevel: levels,
      unlockedRecipes: [], questProgress: {}, playerTier: 4, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory, equipment: { ...emptyEquipment() }, itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

{
  const allBaseForms = PARKED.map((l) => l.forms.find((f) => f.tier === 1)!.recipeId);
  const world = new World();
  const player = world.attachPlayerEntity(makeSlices('parked-handlers', [...allBaseForms]), 'parked-handlers');
  for (const lineage of PARKED) {
    const base = lineage.forms.find((f) => f.tier === 1)!.recipeId;
    assert(equipItem(world, player, base), `fixture: wears ${base}`);
  }
  const before = JSON.stringify(player.tracksProgression);

  for (const lineage of PARKED) {
    const card = lineage.cards[0]!;
    const gated = lineage.forms.find((f) => f.tier > 1);
    const results = [
      unlockLineageCard(world, player, lineage.id, card.id),
      setLineageActive(world, player, lineage.id, card.row, card.id),
      setLineageActive(world, player, lineage.id, card.row, null),
      wearLineageForm(world, player, lineage.id, lineage.forms[0]!.recipeId),
      ...(gated ? [unlockLineageForm(world, player, lineage.id, gated.recipeId)] : []),
    ];
    for (const result of results) {
      assert(
        !result.success && result.reason === PARKED_LINEAGE_REASON,
        `${lineage.id} ${result.action}: refused as parked, got ${JSON.stringify(result)}`,
      );
    }
  }
  assert(JSON.stringify(player.tracksProgression) === before, 'a refused parked action spends nothing');
  for (const lineage of PARKED) {
    assert(
      player.holdsInventory.lineages?.[lineage.id] === undefined,
      `${lineage.id}: no tree is created for a parked lineage (review finding B1)`,
    );
  }
}

// ─── Crafting and holding a parked form births no tree; weapons still do ─────

{
  const world = new World();
  const player = world.attachPlayerEntity(makeSlices('parked-craft', []), 'parked-craft');
  player.tracksProgression.unlockedRecipes.push('forest-vest-t1', 'flash-rapier');
  assert(craftRecipe(world, player, 'forest-vest-t1').success, 'fixture: crafts the T1 vest');
  assert(craftRecipe(world, player, 'flash-rapier').success, 'fixture: crafts the T1 rapier');
  equipItem(world, player, 'forest-vest-t1');
  syncLineagesFromInventory(world, player);
  assert(player.holdsInventory.lineages?.bindings === undefined, 'holding the vest opens no bindings tree');
  assert(!!player.holdsInventory.lineages?.rapier, 'holding the rapier still opens the rapier tree');
}

// ─── A save that holds a parked tree keeps it, and resolves none of it ───────

{
  const bindings = LINEAGE_DATABASE.get('bindings')!;
  const t2 = bindings.forms.find((f) => f.tier === 2 && f.capstone)!;
  const payoff = bindings.cards.find((c) => c.tier === 1 && c.row === 'payoff')!;
  const saved: LineageProgress = {
    ownedCards: [payoff.id], active: { payoff: payoff.id },
    ownedForms: [bindings.forms[0]!.recipeId, t2.recipeId], wornForm: t2.recipeId,
  };

  // Hydration keeps the parked tree exactly: data stays.
  const hydrated = normalizeLineageProgressMap({ bindings: saved });
  assert(JSON.stringify(hydrated.bindings) === JSON.stringify(saved), 'hydration leaves a parked tree untouched');

  // Worn and fully owned, it still contributes nothing — no card, no capstone.
  const effects = resolveActiveLineages({
    equipment: { ...emptyEquipment(), armor: t2.recipeId },
    lineages: { bindings: saved },
  });
  assert(effects.cards.length === 0, 'a parked tree resolves no runtime cards');
  assert(effects.capstones.length === 0, 'and no capstone, even on a worn T2 form');
  assert(Object.keys(effects.statEffects).length === 0, 'and no stat rows');

  // On a live entity, attach keeps the saved tree and wearing it changes nothing.
  const world = new World();
  const slices = makeSlices('parked-save', [t2.recipeId]);
  slices.holdsInventory.lineages = { bindings: saved };
  const player = world.attachPlayerEntity(slices, 'parked-save');
  syncLineagesFromInventory(world, player);
  assert(equipItem(world, player, t2.recipeId), 'fixture: wears the T2 vest');
  assert(
    JSON.stringify(player.holdsInventory.lineages?.bindings) === JSON.stringify(saved),
    'equipping and syncing leave a saved parked tree exactly as it was',
  );
}

// ─── No tree entry, and parked forms are plain recipes ───────────────────────

for (const lineage of PARKED) {
  for (const form of lineage.forms) {
    assert(lineageForEquippedItem(form.recipeId) === undefined, `${form.recipeId}: a parked slot opens no tree`);
    assert(!isGatedLineageForm(form.recipeId), `${form.recipeId}: a parked form is a plain recipe, not a gated door`);
  }
}
for (const lineage of liveLineages()) {
  for (const form of lineage.forms) {
    assert(lineageForEquippedItem(form.recipeId)?.id === lineage.id, `${form.recipeId}: a weapon form opens its tree`);
    assert(isGatedLineageForm(form.recipeId) === form.tier > 1, `${form.recipeId}: weapon forms of tier ≥ 2 stay gated (B4)`);
  }
}

console.log('lineageParked.test.ts: ok');
