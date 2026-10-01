/**
 * Loading a character written before the progression rework (Phase 1b).
 *
 * WHY THIS EXISTS: the lineage slice and both wallets are new, so EVERY save in
 * existence lacks them. The load path has to invent them without inventing
 * progress — and it has to rebuild the tree from what the character already
 * holds, because crafting the Flash Rapier was always how you took the weapon
 * slot. Getting this wrong means a returning tester opens the panel to an empty
 * tree and is asked to buy a form they own.
 *
 * Exercised through `attachPlayerEntity` and the wallet sanitizers with
 * fixtures, not a live DB — CI provisions no Postgres.
 *
 * Run: node --conditions=development --import tsx test/lineagePersistence.test.ts
 */
import { GAME_CONFIG, baseRecoveryForTier, emptyEquipment } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { sanitizeCapstoneWallet, sanitizeShardWallet } from '../src/db/playerRepo';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

// ─── Wallet sanitizers ───────────────────────────────────────────────────────

{
  // A wallet is the one place a retired key can sit forever, invisible until
  // something tries to spend it — so unknown keys are dropped on load.
  const shards = sanitizeShardWallet({
    tempo: 12, affliction: 3,
    'a-packet-that-was-renamed': 999, tempoo: 50,
  } as never);
  assert(shards.tempo === 12 && shards.affliction === 3, 'known packets survive');
  assert(Object.keys(shards).length === 2, `unknown packet keys are dropped, got ${Object.keys(shards).join()}`);

  assert(Object.keys(sanitizeShardWallet(undefined)).length === 0, 'no wallet hydrates to an empty one');
  assert(sanitizeShardWallet({ tempo: -5 }).tempo === 0, 'a negative balance clamps to zero');
  assert(sanitizeShardWallet({ tempo: NaN }).tempo === undefined, 'NaN is not a balance');

  const capstones = sanitizeCapstoneWallet({ forest: 4, atlantis: 9 });
  assert(capstones.forest === 4, 'a real biome survives');
  assert(capstones.atlantis === undefined, 'a biome with no capstone material is dropped');
  assert(Object.keys(sanitizeCapstoneWallet(undefined)).length === 0, 'no wallet hydrates to an empty one');
}

// ─── A pre-Phase-1 save ──────────────────────────────────────────────────────

/**
 * Exactly what a save written before the rework looks like: no `lineages`, no
 * `shards`, no `capstones` — but a Flash Rapier equipped and a Chaotic Axe in
 * the bag, both of which are lineage base forms.
 */
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
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
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
  // The save predates all three fields, so they are genuinely absent rather than
  // empty. Cast because the current type says they are there.
  return slices as unknown as PersistedPlayerSlices;
}

{
  const world = new World();
  const player = world.attachPlayerEntity(legacySave('p-legacy'), 'p-legacy');

  // The wallets exist and are empty — no progress invented.
  assert(!!player.tracksProgression.shards, 'a legacy save gets a shard wallet');
  assert(!!player.tracksProgression.capstones, 'a legacy save gets a capstone wallet');
  assert(Object.keys(player.tracksProgression.shards).length === 0, 'and it starts empty');
  assert(Object.keys(player.tracksProgression.capstones).length === 0, 'and so does the other');

  // Catalysts are untouched — Phase 1 runs both economies side by side.

  // The equipped Flash Rapier rebuilt the Rapier tree, worn and owned.
  const rapier = player.holdsInventory.lineages?.rapier;
  assert(!!rapier, 'the equipped base form rebuilt its tree');
  assert(rapier!.ownedForms.includes('flash-rapier'), 'the form the character holds is owned');
  assert(rapier!.wornForm === 'flash-rapier', 'and it is what they are wearing');
  assert(rapier!.ownedCards.length === 0, 'but no cards are granted — nothing was paid for');

  // A base form sitting in the BAG also opens its tree; the character owns the
  // lineage, they are just not wearing it.
  const axe = player.holdsInventory.lineages?.axe;
  assert(!!axe, 'a base form in the bag opens its tree too');
  assert(axe!.ownedForms.includes('chaotic-axe'), 'and the form is owned');

  // A lineage the character holds nothing of gets no tree at all — presence
  // gates it, rather than every character carrying five empty trees.
  assert(!player.holdsInventory.lineages?.hammer, 'a lineage with no form held has no tree');

  // The +N ladder is untouched: Phase 1 leaves it in place, Phase 2 removes it.
  assert(player.holdsInventory.itemUpgrades['flash-rapier'] === 3, 'the upgrade ladder survives Phase 1');
}

// A legacy save that evolved UP the old +N ladder holds a T2 form and no T1 one.
// That form was paid for, so it must come back owned and worn — this is the
// "retained forms" half of the +N removal policy, and the case that would
// otherwise leave a returning tester staring at a locked gate for their own
// weapon.
{
  const world = new World();
  const save = legacySave('p-evolved');
  save.holdsInventory.inventory = [];
  save.holdsInventory.equipment.weapon = 'gale-needle';
  save.holdsInventory.itemUpgrades = { 'gale-needle': 2 };
  const player = world.attachPlayerEntity(save, 'p-evolved');

  const rapier = player.holdsInventory.lineages?.rapier;
  assert(!!rapier, 'a character holding only the T2 form still gets the tree');
  assert(rapier!.ownedForms.includes('gale-needle'), 'the evolved form they paid for is owned');
  assert(rapier!.wornForm === 'gale-needle', 'and it is what they are wearing');
  assert(!rapier!.ownedForms.includes('flash-rapier'), 'a form they no longer hold is not invented');
  assert(rapier!.ownedCards.length === 0, 'no cards are granted');
}

// Attaching twice (relog) must not duplicate anything.
{
  const world = new World();
  const save = legacySave('p-relog');
  world.attachPlayerEntity(save, 'p-relog');
  world.detachPlayerEntity('p-relog');
  const again = world.attachPlayerEntity(save, 'p-relog');
  const forms = again.holdsInventory.lineages!.rapier!.ownedForms;
  assert(forms.length === new Set(forms).size, `relogging duplicated forms: ${forms.join()}`);
}

console.log('lineagePersistence.test.ts: ok');
