import { baseRecoveryForTier } from "@mmo-idle/shared";
import { hasRetiredAbilityEntries, migrateAttunement, retiredAbilityEntries } from "@mmo-idle/shared";
import { and, desc, eq, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  AdminCharacterRecord,
  CharacterSummary,
  EquipmentSlot,
  EssenceType,
  HasHealth,
  HasPosition,
  HoldsInventory,
  IsPlayer,
  TracksProgression,
  UsesSkills,
  SummonsMinions,
  PacketId,
} from '@mmo-idle/shared';
import {
  DEFAULT_RUNE_LOADOUT,
  EQUIPMENT_SLOTS,
  GAME_CONFIG,
  ITEM_DATABASE,
  normalizeEquipment,
  emptyEquipment,
  emptyAttunedAbilities,
  emptyEquippedStances,
  emptyEquippedRites,
  globalMastery,
  runeIdsFromCraftedRecipes,
  validRiteIds,
  PACKET_IDS,
  CAPSTONE_MATERIALS,
  normalizeLineageProgressMap,
  normalizeFiringsTaught,
  CLEARING_NODE_ID,
  WORLD_NODES,
  buildCharacterSummary,
  validateCharacterName,
  type Vec2,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../ecs/entity';
import { accounts, characters, sessions } from './schema';
import type * as schema from './schema';
import { weaponUpgradeRefundFor } from './weaponUpgradeRefund';
import { gearUpgradeRefundFor } from './gearUpgradeRefund';
import { log } from '../log';
import { refundRetiredLineageCards } from '../systems/player/economy/lineageSync';

export type DB = NodePgDatabase<typeof schema>;

export interface PersistedPlayerSlices {
  isPlayer:          IsPlayer;
  hasPosition:       HasPosition;
  hasHealth:         HasHealth;
  tracksProgression: TracksProgression;
  holdsInventory:    HoldsInventory;
  usesSkills:        UsesSkills;
  summonerState?:    SummonsMinions;
}

// ── Account ───────────────────────────────────────────────────────────────────

export interface AccountLoginResult {
  previousLoginAt: number | null;
  currentLoginAt: number;
  displayName: string;
  isGuest: boolean;
}

/** Provision the explicitly configured, non-production development identity. */
export async function findOrCreateDevAccount(
  db: DB,
  accountId: string,
  displayName: string,
): Promise<AccountLoginResult> {
  const now = Date.now();
  const existing = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
  if (existing.length === 0) {
    await db.insert(accounts).values({
      id:          accountId,
      displayName,
      discordId:   null,
      createdAt:   now,
      lastLoginAt: now,
    });
    return { previousLoginAt: null, currentLoginAt: now, displayName, isGuest: false };
  }

  const previousLoginAt = existing[0].lastLoginAt || existing[0].createdAt;
  await db.update(accounts)
    .set({
      displayName,
      lastLoginAt: now,
    })
    .where(eq(accounts.id, accountId));
  return { previousLoginAt, currentLoginAt: now, displayName, isGuest: false };
}

/** Record a socket login for an account that was already authenticated. */
export async function touchAccountLogin(
  db: DB,
  accountId: string,
): Promise<AccountLoginResult> {
  const rows = await db.select().from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);
  const account = rows[0];
  if (!account) throw new Error('Authenticated account no longer exists.');

  const now = Date.now();
  await db.update(accounts)
    .set({ lastLoginAt: now })
    .where(eq(accounts.id, accountId));

  return {
    previousLoginAt: account.lastLoginAt > 0 ? account.lastLoginAt : null,
    currentLoginAt: now,
    displayName: account.displayName,
    isGuest: account.discordId === null,
  };
}

export interface GuestAccount {
  id: string;
  displayName: string;
}

export interface AccountIdentity {
  id: string;
  displayName: string;
  discordId: string | null;
}

export async function createGuestAccount(db: DB): Promise<GuestAccount> {
  const id = randomUUID();
  const displayName = `Guest-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
  const now = Date.now();
  await db.insert(accounts).values({
    id,
    displayName,
    discordId: null,
    createdAt: now,
    lastLoginAt: 0,
  });
  return { id, displayName };
}

export async function findAccountById(
  db: DB,
  accountId: string,
): Promise<AccountIdentity | null> {
  const rows = await db.select({
    id: accounts.id,
    displayName: accounts.displayName,
    discordId: accounts.discordId,
  }).from(accounts).where(eq(accounts.id, accountId)).limit(1);
  return rows[0] ?? null;
}

export async function findAccountByDiscordId(
  db: DB,
  discordId: string,
): Promise<AccountIdentity | null> {
  const rows = await db.select({
    id: accounts.id,
    displayName: accounts.displayName,
    discordId: accounts.discordId,
  }).from(accounts).where(eq(accounts.discordId, discordId)).limit(1);
  return rows[0] ?? null;
}

/** Claim a Discord identity only while the source account is still a guest. */
export async function stampGuestDiscordIdentity(
  db: DB,
  accountId: string,
  discordId: string,
  displayName: string,
  persistentSessionsExpireAt: number,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const rows = await tx.update(accounts)
      .set({ discordId, displayName })
      .where(and(
        eq(accounts.id, accountId),
        isNull(accounts.discordId),
      ))
      .returning({ id: accounts.id });
    if (rows.length !== 1) return false;

    await tx.update(sessions)
      .set({ expiresAt: persistentSessionsExpireAt })
      .where(and(
        eq(sessions.accountId, accountId),
        isNull(sessions.expiresAt),
      ));
    return true;
  });
}

export interface MergeTargetSession {
  tokenHash: string;
  createdAt: number;
  expiresAt: number;
  lastSeenAt: number;
}

/** Move every character to the Discord account and hard-delete the guest account. */
export async function mergeGuestAccount(
  db: DB,
  guestAccountId: string,
  targetAccountId: string,
  targetDisplayName: string,
  targetSession: MergeTargetSession,
): Promise<void> {
  if (guestAccountId === targetAccountId) return;

  await db.transaction(async (tx) => {
    const guestRows = await tx.select({ discordId: accounts.discordId })
      .from(accounts)
      .where(eq(accounts.id, guestAccountId))
      .limit(1);
    if (!guestRows[0] || guestRows[0].discordId !== null) {
      throw new Error('Guest account is no longer eligible for merge.');
    }

    const targetRows = await tx.select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.id, targetAccountId))
      .limit(1);
    if (!targetRows[0]) throw new Error('Discord merge target no longer exists.');

    await tx.update(characters)
      .set({ accountId: targetAccountId })
      .where(eq(characters.accountId, guestAccountId));
    await tx.update(accounts)
      .set({ displayName: targetDisplayName })
      .where(eq(accounts.id, targetAccountId));
    await tx.delete(accounts).where(eq(accounts.id, guestAccountId));
    await tx.insert(sessions).values({
      ...targetSession,
      accountId: targetAccountId,
    });
  });
}

/** Upsert Discord identity without consuming the gameplay-login timestamp. */
export async function upsertDiscordAccount(
  db: DB,
  discordId: string,
  displayName: string,
): Promise<string> {
  const now = Date.now();
  const rows = await db.insert(accounts)
    .values({
      id: randomUUID(),
      displayName,
      discordId,
      createdAt: now,
      lastLoginAt: 0,
    })
    .onConflictDoUpdate({
      target: accounts.discordId,
      set: { displayName },
    })
    .returning({ id: accounts.id });

  const account = rows[0];
  if (!account) throw new Error('Discord account upsert returned no row.');
  return account.id;
}

// ── Character ─────────────────────────────────────────────────────────────────

export async function listAccountCharacters(
  db: DB,
  accountId: string,
): Promise<CharacterSummary[]> {
  const rows = await db.select().from(characters)
    .where(and(
      eq(characters.accountId, accountId),
      isNull(characters.deletedAt),
    ))
    .orderBy(desc(characters.lastPlayedAt), desc(characters.updatedAt));

  return rows.map((row) => buildCharacterSummary(hydratePlayerSlices(row), row));
}

export async function createCharacter(
  db: DB,
  accountId: string,
  requestedName: string,
): Promise<string> {
  const validation = validateCharacterName(requestedName);
  if (!validation.ok) throw new Error(validation.reason);

  const fresh = await insertCharacter(db, accountId, validation.name);
  return fresh.isPlayer.id;
}

export async function loadCharacter(
  db: DB,
  accountId: string,
  characterId: string,
): Promise<PersistedPlayerSlices | null> {
  const rows = await db.update(characters)
    .set({ lastPlayedAt: Date.now() })
    .where(and(
      eq(characters.id, characterId),
      eq(characters.accountId, accountId),
      isNull(characters.deletedAt),
    ))
    .returning();

  // The one path that hands the slices to a live entity, so the one path that may
  // run the retired-upgrade refund: whatever it grants is saved with the character.
  return rows[0] ? hydratePlayerSlices(rows[0], { grantRetiredRefunds: true }) : null;
}

export async function softDeleteCharacter(
  db: DB,
  accountId: string,
  characterId: string,
): Promise<boolean> {
  const rows = await db.update(characters)
    .set({ deletedAt: Date.now(), updatedAt: Date.now() })
    .where(and(
      eq(characters.id, characterId),
      eq(characters.accountId, accountId),
      isNull(characters.deletedAt),
    ))
    .returning({ id: characters.id });

  return rows.length > 0;
}

async function insertCharacter(
  db: DB,
  accountId: string,
  characterName: string,
): Promise<PersistedPlayerSlices> {
  const charId = randomUUID();
  const spawn: Vec2 = {
    x: GAME_CONFIG.NODE_WIDTH  / 2,
    y: GAME_CONFIG.NODE_HEIGHT / 2,
  };
  const fresh = buildFreshSlices(charId, characterName, spawn);

  const now = Date.now();
  await db.insert(characters).values({
    id:                charId,
    accountId,
    isPlayer:          JSON.stringify(fresh.isPlayer),
    hasPosition:       JSON.stringify(fresh.hasPosition),
    hasHealth:         JSON.stringify(fresh.hasHealth),
    tracksProgression: JSON.stringify(fresh.tracksProgression),
    holdsInventory:    JSON.stringify(fresh.holdsInventory),
    usesSkills:        JSON.stringify(fresh.usesSkills),
    lastPlayedAt:      now,
    updatedAt:         now,
  });

  return fresh;
}

export async function saveCharacter(
  db: DB,
  characterId: string,
  entity: PlayerEntity,
): Promise<void> {
  const now = Date.now();
  await db.update(characters)
    .set({
      isPlayer:          JSON.stringify({ ...entity.isPlayer, id: characterId }),
      hasPosition:       JSON.stringify(entity.hasPosition),
      hasHealth:         JSON.stringify(entity.hasHealth),
      tracksProgression: JSON.stringify(entity.tracksProgression),
      holdsInventory:    JSON.stringify(entity.holdsInventory),
      usesSkills:        JSON.stringify({
        ...entity.usesSkills,
        passives: {},
      }),
      summonerState: entity.summonsMinions ? JSON.stringify({
        ...entity.summonsMinions,
        minionIds: new Array(entity.summonsMinions.targetCount).fill(''),
        respawnTimers: new Array(entity.summonsMinions.targetCount).fill(0),
        formationTargetId: null,
      }) : null,
      lastPlayedAt:      now,
      updatedAt:         now,
    })
    .where(and(
      eq(characters.id, characterId),
      isNull(characters.deletedAt),
    ));
}

export async function listCharacters(db: DB): Promise<AdminCharacterRecord[]> {
  const rows = await db
    .select({
      character: characters,
      accountDisplayName: accounts.displayName,
      accountDiscordId: accounts.discordId,
    })
    .from(characters)
    .leftJoin(accounts, eq(characters.accountId, accounts.id))
    .where(isNull(characters.deletedAt));

  return rows.map(({ character, accountDisplayName, accountDiscordId }) => {
    const slices = hydratePlayerSlices(character);
    const equipmentCount = Object.values(slices.holdsInventory.equipment)
      .filter((itemId): itemId is string => typeof itemId === 'string')
      .length;
    return {
      id: character.id,
      accountId: character.accountId,
      accountDisplayName: accountDisplayName ?? slices.isPlayer.name,
      accountIsGuest: accountDiscordId === null,
      name: slices.isPlayer.name,
      nodeId: slices.hasPosition.nodeId,
      hp: slices.hasHealth.hp,
      maxHp: slices.hasHealth.maxHp,
      level: slices.tracksProgression.level,
      playerTier: slices.tracksProgression.playerTier,
      skillPoints: slices.tracksProgression.skillPoints,
      combatArchetype: slices.usesSkills.combatArchetype,
      selectedClass: slices.usesSkills.selectedClass,
      selectedSubVariant: slices.usesSkills.selectedSubVariant,
      selectedRange: slices.usesSkills.selectedRange,
      essences: slices.tracksProgression.essences,
      biomeLevel: slices.tracksProgression.biomeLevel,
      globalMastery: globalMastery(slices.tracksProgression.biomeLevel),
      clearedNodes: slices.tracksProgression.clearedNodes,
      bossesCleared: slices.tracksProgression.bossesCleared,
      inventoryCount: slices.holdsInventory.inventory.length,
      equipmentCount,
      knownAbilities: slices.tracksProgression.knownAbilities,
      attunedAbilities: slices.tracksProgression.attunedAbilities,
      attunedStances: slices.tracksProgression.attunedStances,
      knownStances: slices.tracksProgression.knownStances,
      equippedStances: slices.tracksProgression.equippedStances,
      activeStance: slices.tracksProgression.activeStance,
      knownRites: slices.tracksProgression.knownRites,
      equippedRites: slices.tracksProgression.equippedRites,
      lastPlayedAt: character.lastPlayedAt,
      updatedAt: character.updatedAt,
    };
  });
}

// ── Internals ─────────────────────────────────────────────────────────────────

type CharacterRow = typeof characters.$inferSelect;

/** One retired ladder's refund: which slots it covered and its frozen price table. */
interface RetiredLadder {
  slots: ReadonlySet<EquipmentSlot>;
  refundFor: (itemId: string, plus: number) => Partial<Record<EssenceType, number>>;
  message: string;
}

/**
 * The +N ladders, retired one slot group at a time: weapons in progression
 * rework Phase 2b (`weaponUpgradeRefund.ts`), armour/charm/boots in the course
 * correction (design §24.5, `gearUpgradeRefund.ts`). Both tables are frozen
 * authored-cost records; the recipe ladders they priced no longer exist.
 */
const RETIRED_LADDERS: readonly RetiredLadder[] = [
  {
    slots: new Set<EquipmentSlot>(['weapon']),
    refundFor: weaponUpgradeRefundFor,
    message: 'progression rework: refunded weapon upgrade essence',
  },
  {
    slots: new Set<EquipmentSlot>(['armor', 'recovery', 'mobility']),
    refundFor: gearUpgradeRefundFor,
    message: 'course correction: refunded gear upgrade essence',
  },
];

/**
 * The +N ladder is retired on every slot (weapons in Phase 2b, armour, charm and
 * boots in design §24.5), so a save written before can still hold `itemUpgrades`
 * entries that are now unspendable data — and that the stat rebuild no longer
 * reads. Refund the essence those levels cost (the frozen authored-cost tables)
 * and drop the entry; the item itself is kept. Same rule for both tables: an
 * entry of +1 or more on an item of a retired slot is paid out and removed; a +0
 * entry is left alone.
 *
 * Idempotent and self-healing like every other hydration transform in this
 * file: a save with no such entries left (the common case after the first load
 * post-migration) does nothing.
 */
export function refundRetiredUpgradeEssence(
  characterId: string,
  inv: HoldsInventory,
  essences: Record<EssenceType, number>,
): void {
  for (const ladder of RETIRED_LADDERS) {
    const refundTotal: Partial<Record<EssenceType, number>> = {};
    const refundedItems: string[] = [];
    for (const [itemId, plus] of Object.entries(inv.itemUpgrades)) {
      if (!plus || plus <= 0) continue;
      const slot = ITEM_DATABASE.get(itemId)?.slot;
      if (!slot || !ladder.slots.has(slot)) continue;
      const refund = ladder.refundFor(itemId, plus);
      for (const [type, amount] of Object.entries(refund) as [EssenceType, number][]) {
        essences[type] = (essences[type] ?? 0) + (amount ?? 0);
        refundTotal[type] = (refundTotal[type] ?? 0) + (amount ?? 0);
      }
      refundedItems.push(`${itemId}+${plus}`);
      delete inv.itemUpgrades[itemId];
    }
    if (refundedItems.length > 0) {
      log.info({ characterId, refundedItems, refundTotal }, ladder.message);
    }
  }
}

/**
 * Keep only live packet keys in a shard wallet, and only biomes that actually
 * have a capstone material in a capstone wallet.
 *
 * Same job as {@link sanitizeFamilyWallet}: a wallet is the one place a retired
 * key can sit forever, invisible until something tries to spend it.
 */
export function sanitizeShardWallet(
  wallet: Partial<Record<PacketId, number>> | undefined,
): Partial<Record<PacketId, number>> {
  const out: Partial<Record<PacketId, number>> = {};
  if (!wallet) return out;
  for (const packet of PACKET_IDS) {
    const value = wallet[packet];
    if (typeof value === 'number' && Number.isFinite(value)) out[packet] = Math.max(0, value);
  }
  return out;
}

export function sanitizeCapstoneWallet(
  wallet: Record<string, number> | undefined,
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!wallet) return out;
  for (const biome of CAPSTONE_MATERIALS.keys()) {
    const value = wallet[biome];
    if (typeof value === 'number' && Number.isFinite(value)) out[biome] = Math.max(0, value);
  }
  return out;
}

/**
 * Drop item ids that no longer exist in ITEM_DATABASE.
 *
 * Recipes get retired (the placeholder core cast was deleted outright), and a save
 * written before that still names them. The stat rebuild already skips unknown ids,
 * so this is not a correctness fix — it is a presentation one: an unknown id left in
 * an equipment slot renders as an occupied-but-blank slot the player cannot clear,
 * because the unequip path looks the definition up too.
 *
 * Runs on every load and is idempotent. Bag entries are dropped the same way, along
 * with any orphaned upgrade levels.
 */
function pruneUnknownItems(inv: HoldsInventory): void {
  inv.inventory = inv.inventory.filter((id) => ITEM_DATABASE.has(id));

  for (const slot of EQUIPMENT_SLOTS) {
    const id = inv.equipment[slot];
    if (id && !ITEM_DATABASE.has(id)) inv.equipment[slot] = null;
  }

  for (const id of Object.keys(inv.itemUpgrades)) {
    if (!ITEM_DATABASE.has(id)) delete inv.itemUpgrades[id];
  }
}

const LEGACY_RITE_IDS: Record<string, string> = {
  "quickened-breath": "swift-repose",
  "cleansing-breath": "purification",
  "lingering-momentum": "lingering-battle",
  "hunters-instinct": "blood-offering",
};

function migrateRiteIds(ids: readonly string[] | undefined): string[] {
  return validRiteIds((ids ?? []).map((id) => LEGACY_RITE_IDS[id] ?? id));
}

/**
 * Retired item ids -> the item a save that holds them receives instead.
 *
 * `thorn-needle` (2026-09-26) was an unintended on-hit sibling of Gale Needle that
 * duplicated the Jungle Stinger Rapier. A holder gets the Gale Needle it branched
 * beside, at the better of the two upgrade levels, so nobody loses progress. Runs
 * BEFORE `pruneUnknownItems`, which would otherwise silently drop the item.
 */
const LEGACY_ITEM_IDS: Record<string, string> = {
  "thorn-needle": "gale-needle",
};

const migrateItemIdList = (ids: readonly string[]): string[] =>
  [...new Set(ids.map((id) => LEGACY_ITEM_IDS[id] ?? id))];

/** Rewrite retired item ids in bag, equipment and upgrade levels. Idempotent. */
export function migrateLegacyItems(inv: HoldsInventory): void {
  inv.inventory = migrateItemIdList(inv.inventory);
  for (const slot of EQUIPMENT_SLOTS) {
    const id = inv.equipment[slot];
    if (id && LEGACY_ITEM_IDS[id]) inv.equipment[slot] = LEGACY_ITEM_IDS[id];
  }
  for (const [from, to] of Object.entries(LEGACY_ITEM_IDS)) {
    const level = inv.itemUpgrades[from];
    if (level === undefined) continue;
    inv.itemUpgrades[to] = Math.max(inv.itemUpgrades[to] ?? 0, level);
    delete inv.itemUpgrades[from];
  }
}

/** Unlocked recipe ids follow the same retirement map. */
export function migrateLegacyRecipeIds(ids: readonly string[] | undefined): string[] {
  return migrateItemIdList(ids ?? []);
}

/**
 * Read a stored row into slices.
 *
 * Every transform in here is a pure, idempotent read EXCEPT the retired
 * upgrade-ladder refund, which GRANTS essence and logs that it did — and this
 * function also backs two read-only listings (`listAccountCharacters` for the lobby
 * and `listCharacters` for the admin tab), which throw the slices away. Run there,
 * the refund logged a grant on every lobby load and persisted nothing, and the admin
 * tab reported essence the character had not been given. So it is opt-in, and the
 * only caller that opts in is `loadCharacter` — the one path that hands the slices to
 * a live entity, which saves them.
 */
function hydratePlayerSlices(
  row: CharacterRow,
  options: { grantRetiredRefunds?: boolean } = {},
): PersistedPlayerSlices {
  const holdsInventory = parseSlice<HoldsInventory>(row.holdsInventory);
  holdsInventory.equipment = normalizeEquipment(holdsInventory.equipment);
  holdsInventory.itemUpgrades = holdsInventory.itemUpgrades ?? {};
  holdsInventory.inventory = holdsInventory.inventory ?? [];
  // Lineage trees drop unknown lineage, card and form ids, and any active row
  // pointing at a card the save no longer owns. A save written before Phase 1
  // simply has none; the tree is rebuilt from the forms the player holds when
  // the entity attaches.
  holdsInventory.lineages = normalizeLineageProgressMap(holdsInventory.lineages);
  migrateLegacyItems(holdsInventory);
  pruneUnknownItems(holdsInventory);
  const tracksProgression = parseSlice<TracksProgression>(row.tracksProgression);
  tracksProgression.essences = tracksProgression.essences ?? { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 };
  // The catalyst wallet is gone (progression rework Phase 2b). Migration 0009
  // already strips both keys from every stored row, but hydration self-heals
  // too, the same way pruneUnknownItems does, in case a row predates that
  // migration or a dev reset bypassed it.
  delete (tracksProgression as { catalysts?: unknown }).catalysts;
  delete (tracksProgression as { catalystProgress?: unknown }).catalystProgress;
  // The +N ladder is retired on every slot: refund and drop any itemUpgrades
  // entry it left behind (weapons since Phase 2b, armour/charm/boots since design
  // §24.5). Mutates holdsInventory.itemUpgrades and tracksProgression.essences in
  // place; see weaponUpgradeRefund.ts and gearUpgradeRefund.ts. A GRANT, so only
  // for the load path that keeps it — see this function's docblock.
  if (options.grantRetiredRefunds) {
    refundRetiredUpgradeEssence(row.id, holdsInventory, tracksProgression.essences);
    // The T1 cards design §26.1 retired (legibility run): read off the save as
    // WRITTEN, because `normalizeLineageProgressMap` above already dropped their
    // ids from the live tree. See `refundRetiredLineageCards`.
    const refund = refundRetiredLineageCards(
      parseSlice<HoldsInventory>(row.holdsInventory).lineages,
      tracksProgression,
    );
    if (refund.cardIds.length > 0) {
      log.info(
        { characterId: row.id, refundedCards: refund.cardIds, essence: refund.essence, shards: refund.shards },
        'legibility run: refunded retired T1 lineage cards',
      );
    }
    // The abilities the ability pass CUT (design §22.2) drop silently from the
    // save below (`migrateAttunement`); say so once per character, on the load
    // that keeps the result. Read off the stored slice, before migration.
    const retired = retiredAbilityEntries(parseSlice<TracksProgression>(row.tracksProgression));
    if (hasRetiredAbilityEntries(retired)) {
      log.info(
        { characterId: row.id, ...retired },
        'ability pass: dropped cut abilities from the save',
      );
    }
  }
  tracksProgression.unlockedRecipes = migrateLegacyRecipeIds(tracksProgression.unlockedRecipes);
  const hasPosition = parseSlice<HasPosition>(row.hasPosition);
  if (!WORLD_NODES.has(hasPosition.nodeId)) {
    hasPosition.nodeId = CLEARING_NODE_ID;
  }
  const runeRecipesCrafted = tracksProgression.runeRecipesCrafted ?? [];
  const attunement = migrateAttunement(tracksProgression);
  delete (tracksProgression as unknown as { equippedAbilities?: unknown }).equippedAbilities;
  const knownRites = migrateRiteIds(tracksProgression.knownRites);
  const equippedRites = migrateRiteIds(tracksProgression.equippedRites)
    .filter((id) => knownRites.includes(id));

  return {
    isPlayer:          {
      ...parseSlice<IsPlayer>(row.isPlayer),
      id: row.id,
    },
    hasPosition,
    hasHealth:         parseSlice<HasHealth>(row.hasHealth),
    tracksProgression: {
      ...tracksProgression,
      // Lineage wallets (Phase 1). Keyed by packet and by biome respectively, and
      // absent from every save written before the progression rework.
      shards:     sanitizeShardWallet(tracksProgression.shards),
      capstones:  sanitizeCapstoneWallet(tracksProgression.capstones),
      bossesCleared: tracksProgression.bossesCleared ?? [],
      clearedNodes:   tracksProgression.clearedNodes ?? [],
      visitedNodes:
        tracksProgression.visitedNodes ??
        (hasPosition.nodeId !== CLEARING_NODE_ID
          ? [hasPosition.nodeId]
          : tracksProgression.clearedNodes ?? []),
      runeRecipesCrafted,
      runesOwned:     runeIdsFromCraftedRecipes(runeRecipesCrafted),
      knownRites,
      equippedRites,
      // The teaching counter (design §26.4). Absent from every save written before
      // the legibility run; counts clamp to 0..3.
      cardFiringsTaught: normalizeFiringsTaught(tracksProgression.cardFiringsTaught),
      // Ability nodes (design §19) ride in `attunement`: `migrateAttunement` drops
      // the trees of the abilities the ability pass cut (design §22.2), then
      // normalizes the rest the way lineage trees are (unknown ability ids, unknown
      // option ids and active rows pointing at something unowned are dropped), so a
      // save written before an offer changed loads clean.
      ...attunement,
    },
    holdsInventory,
    usesSkills:        {
      ...parseSlice<UsesSkills>(row.usesSkills),
      passives: {},
    },
    summonerState: row.summonerState
      ? sanitizePersistedSummonerState(parseSlice<SummonsMinions>(row.summonerState))
      : undefined,
  };
}

function sanitizePersistedSummonerState(state: SummonsMinions): SummonsMinions {
  const targetCount = Math.max(1, Math.min(9, Math.round(state.targetCount ?? state.slotIds?.length ?? 1)));
  const slotIds = Array.from({ length: targetCount }, (_, index) => (
    state.slotIds?.[index] ?? `normal:${index}`
  ));
  const validIds = new Set(slotIds);
  const reconstructionQueue = (state.reconstructionQueue ?? [])
    .filter((slotId, index, all) => validIds.has(slotId) && all.indexOf(slotId) === index);
  const active = state.activeReconstruction && validIds.has(state.activeReconstruction.slotId)
    ? {
      slotId: state.activeReconstruction.slotId,
      elapsedMs: Math.max(0, state.activeReconstruction.elapsedMs ?? 0),
      durationMs: Math.max(1, state.activeReconstruction.durationMs ?? 5_000),
    }
    : undefined;
  return {
    ...state,
    targetCount,
    slotIds,
    slotRoles: Array.from({ length: targetCount }, (_, index) => state.slotRoles?.[index] ?? 'normal'),
    minionIds: new Array(targetCount).fill(''),
    respawnTimers: new Array(targetCount).fill(0),
    reconstructionQueue: active
      ? reconstructionQueue.filter((slotId) => slotId !== active.slotId)
      : reconstructionQueue,
    activeReconstruction: active,
    redirectCursor: Math.max(0, Math.round(state.redirectCursor ?? 0)),
  };
}

function buildFreshSlices(
  id: string,
  name: string,
  pos: Vec2,
): PersistedPlayerSlices {
  const equipment = emptyEquipment();

  return {
    isPlayer: {
      id,
      name,
    },
    hasPosition: {
      current: pos,
      nodeId:  CLEARING_NODE_ID,
      speed:   GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp:      GAME_CONFIG.PLAYER_MAX_HP,
      maxHp:   GAME_CONFIG.PLAYER_MAX_HP,
      recovery: baseRecoveryForTier(0),
    },
    tracksProgression: {
      level:            0,
      skillPoints:      0,
      essences:         { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      shards:           {},
      capstones:        {},
      biomeXP:          {},
      biomeLevel:       {},
      unlockedRecipes:  [],
      questProgress:    {},
      playerTier:       0,
      currentSkillTier: 0,
      bossesCleared:    [],
      clearedNodes:     [],
      visitedNodes:     [],
      runesOwned:       runeIdsFromCraftedRecipes([]),
      runeRecipesCrafted: [],
      runesEquipped:    [...DEFAULT_RUNE_LOADOUT],
      knownAbilities:   [],
      attunedAbilities: emptyAttunedAbilities(),
      attunedStances:   [],
      knownStances:     [],
      equippedStances:  emptyEquippedStances(),
      activeStance:     null,
      knownRites:       [],
      equippedRites:    emptyEquippedRites(),
    },
    holdsInventory: {
      inventory: [],
      equipment,
      itemUpgrades: {},
    },
    usesSkills: {
      unlockedSkills:     [],
      passives:           {},
      selectedClass:      null,
      selectedSubVariant: null,
      selectedRange:      null,
      combatArchetype:    null,
    },
  };
}

function parseSlice<T>(value: string): T {
  return JSON.parse(value) as T;
}
