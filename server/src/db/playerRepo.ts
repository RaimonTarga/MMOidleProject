import { and, desc, eq, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  AdminCharacterRecord,
  CharacterSummary,
  HasHealth,
  HasPosition,
  HoldsInventory,
  IsPlayer,
  TracksProgression,
  UsesSkills,
  SummonsMinions,
} from '@mmo-idle/shared';
import {
  DEFAULT_RUNE_LOADOUT,
  EQUIPMENT_SLOTS,
  GAME_CONFIG,
  ITEM_DATABASE,
  normalizeEquipment,
  emptyEquipment,
  emptyEquippedAbilities,
  emptyEquippedStances,
  emptyEquippedRites,
  globalMastery,
  normalizeEquippedAbilities,
  runeIdsFromCraftedRecipes,
  validAbilityIds,
  validStanceIds,
  validRiteIds,
  PACE_FAMILIES,
  CLEARING_NODE_ID,
  WORLD_NODES,
  buildCharacterSummary,
  validateCharacterName,
  type Vec2,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../ecs/entity';
import { accounts, characters, sessions } from './schema';
import type * as schema from './schema';

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

  return rows[0] ? hydratePlayerSlices(rows[0]) : null;
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
      equippedAbilities: slices.tracksProgression.equippedAbilities,
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

/** Keep only combat-family keys in a catalyst wallet (drops stale biome keys). */
function sanitizeFamilyWallet(
  wallet: Record<string, number> | undefined,
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!wallet) return out;
  for (const family of PACE_FAMILIES) {
    const value = wallet[family];
    if (typeof value === 'number') out[family] = value;
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

function hydratePlayerSlices(row: CharacterRow): PersistedPlayerSlices {
  const holdsInventory = parseSlice<HoldsInventory>(row.holdsInventory);
  holdsInventory.equipment = normalizeEquipment(holdsInventory.equipment);
  holdsInventory.itemUpgrades = holdsInventory.itemUpgrades ?? {};
  holdsInventory.inventory = holdsInventory.inventory ?? [];
  pruneUnknownItems(holdsInventory);
  const tracksProgression = parseSlice<TracksProgression>(row.tracksProgression);
  const hasPosition = parseSlice<HasPosition>(row.hasPosition);
  if (!WORLD_NODES.has(hasPosition.nodeId)) {
    hasPosition.nodeId = CLEARING_NODE_ID;
  }
  const runeRecipesCrafted = tracksProgression.runeRecipesCrafted ?? [];

  return {
    isPlayer:          {
      ...parseSlice<IsPlayer>(row.isPlayer),
      id: row.id,
    },
    hasPosition,
    hasHealth:         parseSlice<HasHealth>(row.hasHealth),
    tracksProgression: {
      ...tracksProgression,
      // Catalyst wallets are keyed by combat family (Map Variety Stage A). Filter
      // to known family keys on load so any stray biome-keyed balance from before
      // the re-key migration can never resurface.
      catalysts:        sanitizeFamilyWallet(tracksProgression.catalysts),
      catalystProgress: sanitizeFamilyWallet(tracksProgression.catalystProgress),
      bossesCleared: tracksProgression.bossesCleared ?? [],
      clearedNodes:   tracksProgression.clearedNodes ?? [],
      visitedNodes:
        tracksProgression.visitedNodes ??
        (hasPosition.nodeId !== CLEARING_NODE_ID
          ? [hasPosition.nodeId]
          : tracksProgression.clearedNodes ?? []),
      runeRecipesCrafted,
      runesOwned:     runeIdsFromCraftedRecipes(runeRecipesCrafted),
      runesEquipped:  tracksProgression.runesEquipped ?? [],
      knownAbilities: validAbilityIds(tracksProgression.knownAbilities ?? []),
      // Migrates the Step 7 `{technique, guard}` shape to ordered lists and maps
      // renamed ability ids forward. No SQL migration needed — whole-slice JSON.
      equippedAbilities: normalizeEquippedAbilities(tracksProgression.equippedAbilities),
      knownStances: validStanceIds(tracksProgression.knownStances ?? []),
      equippedStances: tracksProgression.equippedStances ?? emptyEquippedStances(),
      activeStance:
        tracksProgression.activeStance ??
        (tracksProgression.equippedStances ?? emptyEquippedStances()).default,
      knownRites: validRiteIds(tracksProgression.knownRites ?? []),
      equippedRites: validRiteIds(tracksProgression.equippedRites ?? []),
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
      hpRegen: GAME_CONFIG.PLAYER_HP_REGEN,
    },
    tracksProgression: {
      level:            0,
      skillPoints:      0,
      essences:         { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts:        {},
      catalystProgress: {},
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
      equippedAbilities: emptyEquippedAbilities(),
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
