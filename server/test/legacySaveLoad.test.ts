/**
 * Loading a save written before a retired system went away.
 *
 * Four retirements are pinned here, all driven through the real load path with a
 * stub query builder — CI provisions no Postgres:
 *
 *  1. The lineage trees, their shard and capstone wallets, the card teaching
 *     counter and the ability node rows (class-first rework D1). A dev save
 *     written before that still holds all five; the load drops them, so the save
 *     loads clean and nothing downstream sees a key no type declares.
 *  2. The retired +N upgrade ladder: its refund GRANTS essence, so it runs on
 *     the load path that keeps the slices and never on the read-only listings.
 *  3. Stances, rites, crafted runes and the core slot (class-first rework D2): the
 *     load drops their keys and the core slot, and rune ownership comes from the
 *     class.
 *  4. Learned and attuned abilities (class-first rework D3): the load drops both
 *     lists and the older `equippedAbilities` shape, and attaching the character
 *     sanitizes away the Rune rules that named the retired Use Ability action.
 *
 * Run: node --conditions=development --import tsx test/legacySaveLoad.test.ts
 */
import { GAME_CONFIG, baseRecoveryForTier, emptyEquipment, runeIdsForArchetype } from '@mmo-idle/shared';
import { World } from '../src/world/World';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import {
  listAccountCharacters,
  listCharacters,
  loadCharacter,
  refundRetiredUpgradeEssence,
  type DB,
} from '../src/db/playerRepo';
import { subscribeAdminLogs } from '../src/log';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

/** A save with a Flash Rapier equipped at the retired +3 and a Chaotic Axe in the bag. */
function legacySave(id: string): PersistedPlayerSlices {
  const slices = {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-t1-forest-01', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 5, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 40, yellow: 0, purple: 0 },
      catalysts: { alacrity: 2 }, biomeXP: {}, biomeLevel: { forest: 6 },
      unlockedRecipes: [], questProgress: {},
      playerTier: 1, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: {
      inventory: ['chaotic-axe'],
      equipment: { ...emptyEquipment(), weapon: 'flash-rapier' },
      itemUpgrades: { 'flash-rapier': 3 },
    },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
  // Cast: the fixture carries the retired `catalysts` wallet on purpose.
  return slices as unknown as PersistedPlayerSlices;
}

/** A drizzle builder that answers with fixed rows however it is chained. */
function stubDb(rows: readonly unknown[]): DB {
  const self: Record<string, unknown> = {
    then: (resolve: (value: readonly unknown[]) => unknown) => Promise.resolve(rows).then(resolve),
  };
  for (const step of ['from', 'where', 'orderBy', 'leftJoin', 'set', 'returning']) {
    self[step] = () => self;
  }
  return { select: () => self, update: () => self } as unknown as DB;
}

/** The save as the `characters` row it would have been written as. */
function storedRow(id: string, save: PersistedPlayerSlices = legacySave(id)): Record<string, unknown> {
  return {
    id,
    accountId: 'acct-refund',
    isPlayer: JSON.stringify(save.isPlayer),
    hasPosition: JSON.stringify(save.hasPosition),
    hasHealth: JSON.stringify(save.hasHealth),
    tracksProgression: JSON.stringify(save.tracksProgression),
    holdsInventory: JSON.stringify(save.holdsInventory),
    usesSkills: JSON.stringify(save.usesSkills),
    summonerState: null,
    deletedAt: null,
    lastPlayedAt: 1,
    updatedAt: 1,
  };
}

const totalEssence = (essences: Record<string, number>): number =>
  Object.values(essences).reduce((sum, n) => sum + n, 0);

// ─── A dev save written before the class-first rework ────────────────────────

async function lineageKeysAreDropped(): Promise<void> {
  const save = legacySave('p-pre-rework');
  Object.assign(save.tracksProgression, {
    shards: { tempo: 12 },
    capstones: { forest: 2 },
    cardFiringsTaught: { 'rapier-t1-speed': 3 },
    abilityNodes: { sweep: { owned: ['sweep-tempo'], active: { packet: 'sweep-tempo' } } },
  });
  Object.assign(save.holdsInventory, {
    lineages: { rapier: { ownedCards: [], active: {}, ownedForms: ['flash-rapier'], wornForm: 'flash-rapier' } },
  });
  const loaded = await loadCharacter(stubDb([storedRow('p-pre-rework', save)]), 'acct-refund', 'p-pre-rework');
  assert(loaded !== null, 'a pre-rework dev save still loads');
  const progression = loaded!.tracksProgression as unknown as Record<string, unknown>;
  for (const key of ['shards', 'capstones', 'cardFiringsTaught', 'abilityNodes']) {
    assert(!(key in progression), `the load drops the retired '${key}' key`);
  }
  assert(!('lineages' in (loaded!.holdsInventory as unknown as Record<string, unknown>)), 'and the lineage trees');
  assert(loaded!.holdsInventory.equipment.weapon === 'flash-rapier', 'the weapon the save wears is untouched');
  assert(loaded!.holdsInventory.inventory.includes('chaotic-axe'), 'and so is the bag');
}

// ─── A dev save written before the D2 removals ───────────────────────────────

async function d2KeysAreDropped(): Promise<void> {
  const save = legacySave('p-pre-d2');
  Object.assign(save.tracksProgression, {
    runeRecipesCrafted: ['rune-recipe-focus-elites'],
    knownStances: ['offensive-stance'], attunedStances: ['offensive-stance'],
    equippedStances: ['offensive-stance'], activeStance: 'offensive-stance',
    knownRites: ['swift-repose'], equippedRites: ['swift-repose'],
  });
  Object.assign(save.holdsInventory, {
    inventory: ['chaotic-axe', 'core-tempered'],
    equipment: { ...save.holdsInventory.equipment, core: 'core-tempered' },
  });
  const loaded = await loadCharacter(stubDb([storedRow('p-pre-d2', save)]), 'acct-refund', 'p-pre-d2');
  assert(loaded !== null, 'a save from before the D2 removals still loads');
  const progression = loaded!.tracksProgression as unknown as Record<string, unknown>;
  for (const key of [
    'runeRecipesCrafted', 'knownStances', 'attunedStances', 'equippedStances', 'activeStance',
    'knownRites', 'equippedRites',
  ]) {
    assert(!(key in progression), `the load drops the retired '${key}' key`);
  }
  assert(!('core' in loaded!.holdsInventory.equipment), 'and the core slot');
  assert(!loaded!.holdsInventory.inventory.includes('core-tempered'), 'and the core item in the bag');
  assert(loaded!.holdsInventory.equipment.weapon === 'flash-rapier', 'the weapon the save wears is untouched');
  assert(
    JSON.stringify(loaded!.tracksProgression.runesOwned) === JSON.stringify(runeIdsForArchetype(null)),
    'rune ownership comes from the class',
  );
}

// ─── A dev save written before the D3 removals ───────────────────────────────

async function d3KeysAreDropped(): Promise<void> {
  const save = legacySave('p-pre-d3');
  Object.assign(save.tracksProgression, {
    knownAbilities: ['sweep', 'brace', 'expose-weakness'],
    attunedAbilities: { techniques: ['sweep'], guards: ['brace'] },
    equippedAbilities: { technique: 'sweep', guard: 'brace' },
    runesEquipped: [
      { conditionId: 'in-combat', actionId: 'use-ability', targetAbilityId: 'sweep' },
      { conditionId: 'always', actionId: 'fire-guard' },
      { conditionId: 'in-combat', actionId: 'chase-enemy' },
    ],
  });
  const loaded = await loadCharacter(stubDb([storedRow('p-pre-d3', save)]), 'acct-refund', 'p-pre-d3');
  assert(loaded !== null, 'a save from before the D3 removals still loads');
  const progression = loaded!.tracksProgression as unknown as Record<string, unknown>;
  for (const key of ['knownAbilities', 'attunedAbilities', 'equippedAbilities']) {
    assert(!(key in progression), `the load drops the retired '${key}' key`);
  }
  assert(loaded!.holdsInventory.equipment.weapon === 'flash-rapier', 'the weapon the save wears is untouched');

  const player = new World().attachPlayerEntity(loaded!, 'p-pre-d3');
  const rules = player.tracksProgression.runesEquipped;
  assert(
    rules.length === 1 && rules[0]!.actionId === 'chase-enemy',
    `attaching drops the rules that fired abilities and keeps the rest, got ${JSON.stringify(rules)}`,
  );
  assert(!('targetAbilityId' in (rules[0] as unknown as Record<string, unknown>)), 'no rule carries an ability target');
}

// ─── A GRANT inside hydration, on paths that throw the slices away ───────────
//
// `refundRetiredUpgradeEssence` is the one hydration transform that is not a pure
// read: it hands back the essence the retired +N ladders cost and logs that it
// did. It ran inside `hydratePlayerSlices`, which also backs two READ-ONLY listings
// — the lobby's `listAccountCharacters` and the admin tab's `listCharacters` — so the
// grant was logged on every lobby load and then discarded, and the admin tab
// reported essence the character had never been given. Only `loadCharacter` hands
// the slices to a live entity that saves them.

async function refundStaysOnTheLoadPath(): Promise<void> {
  // The fixture must really be refundable, or none of this proves anything: the
  // legacy save carries flash-rapier+3, which the frozen table prices at 150 green.
  const probe = legacySave('p-refund-probe');
  const held = totalEssence(probe.tracksProgression.essences);
  refundRetiredUpgradeEssence('p-refund-probe', probe.holdsInventory, probe.tracksProgression.essences);
  assert(
    totalEssence(probe.tracksProgression.essences) > held,
    'the fixture must hold a refundable weapon upgrade',
  );
  assert(
    probe.holdsInventory.itemUpgrades['flash-rapier'] === undefined,
    'and the refund must drop the entry it paid out',
  );

  const refundLogs: string[] = [];
  const unsubscribe = subscribeAdminLogs((entry) => {
    if (/refunded (weapon|gear) upgrade essence/.test(entry.message)) refundLogs.push(entry.message);
  });

  const lobby = await listAccountCharacters(stubDb([storedRow('p-refund-lobby')]), 'acct-refund');
  assert(lobby.length === 1, 'the lobby listing should answer with the one character');
  assert(
    refundLogs.length === 0,
    `a lobby listing must not grant anything, got ${refundLogs.length} refund log(s)`,
  );

  const admin = await listCharacters(stubDb([{
    character: storedRow('p-refund-admin'),
    accountDisplayName: 'Tester',
    accountDiscordId: null,
  }]));
  assert(admin.length === 1, 'the admin listing should answer with the one character');
  assert(
    totalEssence(admin[0]!.essences) === held,
    `the admin tab must report the essence the save holds, got ${totalEssence(admin[0]!.essences)} against ${held}`,
  );
  assert(refundLogs.length === 0, 'and it must not log a grant either');

  // The load path is where the refund belongs: these slices are handed to a live
  // entity and saved, so what it grants survives.
  const loaded = await loadCharacter(
    stubDb([storedRow('p-refund-load')]),
    'acct-refund',
    'p-refund-load',
  );
  assert(loaded !== null, 'the load path should answer with the character');
  assert(
    totalEssence(loaded!.tracksProgression.essences) > held,
    'loading a character still refunds the retired weapon upgrade',
  );
  assert(
    loaded!.holdsInventory.itemUpgrades['flash-rapier'] === undefined,
    'and drops the entry it paid out',
  );
  assert(
    refundLogs.length === 1,
    `the refund is logged exactly once, where it is kept, got ${refundLogs.length}`,
  );

  unsubscribe();
}

void lineageKeysAreDropped()
  .then(d2KeysAreDropped)
  .then(d3KeysAreDropped)
  .then(refundStaysOnTheLoadPath)
  .then(() => { console.log('legacySaveLoad.test.ts: ok'); })
  .catch((err: unknown) => { console.error(err); process.exitCode = 1; });
