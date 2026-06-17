import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  AdminCharacterRecord,
  HasHealth,
  HasPosition,
  HoldsInventory,
  IsPlayer,
  TracksProgression,
  UsesSkills,
} from '@mmo-idle/shared';
import {
  DEFAULT_RUNE_LOADOUT,
  GAME_CONFIG,
  emptyEquipment,
  runeIdsFromCraftedRecipes,
  runePointBonusFromCraftedRecipes,
  type Vec2,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../ecs/entity';
import { accounts, characters } from './schema';
import type * as schema from './schema';

export type DB = NodePgDatabase<typeof schema>;

export interface PersistedPlayerSlices {
  isPlayer:          IsPlayer;
  hasPosition:       HasPosition;
  hasHealth:         HasHealth;
  tracksProgression: TracksProgression;
  holdsInventory:    HoldsInventory;
  usesSkills:        UsesSkills;
}

// ── Account ───────────────────────────────────────────────────────────────────

export interface AccountLoginResult {
  previousLoginAt: number | null;
  currentLoginAt: number;
}

export async function findOrCreateAccount(
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
    return { previousLoginAt: null, currentLoginAt: now };
  }

  const previousLoginAt = existing[0].lastLoginAt || existing[0].createdAt;
  await db.update(accounts)
    .set({
      displayName,
      lastLoginAt: now,
    })
    .where(eq(accounts.id, accountId));
  return { previousLoginAt, currentLoginAt: now };
}

// ── Character ─────────────────────────────────────────────────────────────────

export async function getOrCreateCharacter(
  db: DB,
  accountId: string,
  characterName: string,
): Promise<PersistedPlayerSlices> {
  const rows = await db.select().from(characters)
    .where(eq(characters.accountId, accountId))
    .limit(1);

  const row = rows[0];
  if (row) {
    return hydratePlayerSlices(row);
  }

  const charId = randomUUID();
  const spawn: Vec2 = {
    x: GAME_CONFIG.NODE_WIDTH  / 2,
    y: GAME_CONFIG.NODE_HEIGHT / 2,
  };
  const fresh = buildFreshSlices(charId, characterName, spawn);

  await db.insert(characters).values({
    id:                charId,
    accountId,
    isPlayer:          JSON.stringify(fresh.isPlayer),
    hasPosition:       JSON.stringify(fresh.hasPosition),
    hasHealth:         JSON.stringify(fresh.hasHealth),
    tracksProgression: JSON.stringify(fresh.tracksProgression),
    holdsInventory:    JSON.stringify(fresh.holdsInventory),
    usesSkills:        JSON.stringify(fresh.usesSkills),
    updatedAt:         Date.now(),
  });

  return fresh;
}

export async function saveCharacter(db: DB, accountId: string, entity: PlayerEntity): Promise<void> {
  await db.update(characters)
    .set({
      isPlayer:          JSON.stringify(entity.isPlayer),
      hasPosition:       JSON.stringify(entity.hasPosition),
      hasHealth:         JSON.stringify(entity.hasHealth),
      tracksProgression: JSON.stringify(entity.tracksProgression),
      holdsInventory:    JSON.stringify(entity.holdsInventory),
      usesSkills:        JSON.stringify({
        ...entity.usesSkills,
        passives: {},
      }),
      updatedAt:         Date.now(),
    })
    .where(eq(characters.accountId, accountId));
}

export async function listCharacters(db: DB): Promise<AdminCharacterRecord[]> {
  const rows = await db
    .select({
      character: characters,
      accountDisplayName: accounts.displayName,
    })
    .from(characters)
    .leftJoin(accounts, eq(characters.accountId, accounts.id));

  return rows.map(({ character, accountDisplayName }) => {
    const slices = hydratePlayerSlices(character);
    const equipmentCount = Object.values(slices.holdsInventory.equipment)
      .filter((itemId): itemId is string => typeof itemId === 'string')
      .length;
    return {
      id: character.id,
      accountId: character.accountId,
      accountDisplayName: accountDisplayName ?? slices.isPlayer.name,
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
      clearedNodes: slices.tracksProgression.clearedNodes,
      bossesCleared: slices.tracksProgression.bossesCleared,
      inventoryCount: slices.holdsInventory.inventory.length,
      equipmentCount,
      updatedAt: character.updatedAt,
    };
  });
}

// ── Internals ─────────────────────────────────────────────────────────────────

type CharacterRow = typeof characters.$inferSelect;

function hydratePlayerSlices(row: CharacterRow): PersistedPlayerSlices {
  const holdsInventory = parseSlice<HoldsInventory>(row.holdsInventory);
  holdsInventory.equipment = {
    ...emptyEquipment(),
    ...holdsInventory.equipment,
  };
  holdsInventory.itemUpgrades = holdsInventory.itemUpgrades ?? {};
  const tracksProgression = parseSlice<TracksProgression>(row.tracksProgression);
  const runeRecipesCrafted = tracksProgression.runeRecipesCrafted ?? [];

  return {
    isPlayer:          parseSlice<IsPlayer>(row.isPlayer),
    hasPosition:       parseSlice<HasPosition>(row.hasPosition),
    hasHealth:         parseSlice<HasHealth>(row.hasHealth),
    tracksProgression: {
      ...tracksProgression,
      bossesCleared: tracksProgression.bossesCleared ?? [],
      clearedNodes:   tracksProgression.clearedNodes ?? [],
      runeRecipesCrafted,
      runePointBonus: runePointBonusFromCraftedRecipes(runeRecipesCrafted),
      runesOwned:     runeIdsFromCraftedRecipes(runeRecipesCrafted),
      runesEquipped:  tracksProgression.runesEquipped ?? [],
    },
    holdsInventory,
    usesSkills:        {
      ...parseSlice<UsesSkills>(row.usesSkills),
      passives: {},
    },
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
      nodeId:  'node-5-5',
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
      biomeXP:          {},
      biomeLevel:       {},
      unlockedRecipes:  [],
      questProgress:    {},
      playerTier:       0,
      currentSkillTier: 0,
      bossesCleared:    [],
      clearedNodes:     [],
      runesOwned:       runeIdsFromCraftedRecipes([]),
      runeRecipesCrafted: [],
      runePointBonus:   0,
      runesEquipped:    [...DEFAULT_RUNE_LOADOUT],
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
