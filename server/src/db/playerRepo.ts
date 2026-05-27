import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type {
  HasHealth,
  HasPosition,
  HoldsInventory,
  IsPlayer,
  TracksProgression,
  UsesSkills,
} from '@mmo-idle/shared';
import { GAME_CONFIG, emptyEquipment, type Vec2 } from '@mmo-idle/shared';
import type { PlayerEntity } from '../ecs/entity';
import { accounts, characters } from './schema';
import type * as schema from './schema';

type DB = BetterSQLite3Database<typeof schema>;

export interface PersistedPlayerSlices {
  isPlayer:          IsPlayer;
  hasPosition:       HasPosition;
  hasHealth:         HasHealth;
  tracksProgression: TracksProgression;
  holdsInventory:    HoldsInventory;
  usesSkills:        UsesSkills;
}

// ── Account ───────────────────────────────────────────────────────────────────

export function findOrCreateAccount(db: DB, accountId: string, displayName: string): void {
  const existing = db.select().from(accounts).where(eq(accounts.id, accountId)).get();
  if (!existing) {
    db.insert(accounts).values({
      id:          accountId,
      displayName,
      discordId:   null,
      createdAt:   Date.now(),
    }).run();
  }
}

// ── Character ─────────────────────────────────────────────────────────────────

export function getOrCreateCharacter(
  db: DB,
  accountId: string,
  characterName: string,
): PersistedPlayerSlices {
  const row = db.select().from(characters)
    .where(eq(characters.accountId, accountId))
    .get();

  if (row) {
    return hydratePlayerSlices(row);
  }

  const charId = randomUUID();
  const spawn: Vec2 = {
    x: GAME_CONFIG.NODE_WIDTH  / 2,
    y: GAME_CONFIG.NODE_HEIGHT / 2,
  };
  const fresh = buildFreshSlices(charId, characterName, spawn);

  db.insert(characters).values({
    id:                charId,
    accountId,
    isPlayer:          JSON.stringify(fresh.isPlayer),
    hasPosition:       JSON.stringify(fresh.hasPosition),
    hasHealth:         JSON.stringify(fresh.hasHealth),
    tracksProgression: JSON.stringify(fresh.tracksProgression),
    holdsInventory:    JSON.stringify(fresh.holdsInventory),
    usesSkills:        JSON.stringify(fresh.usesSkills),
    updatedAt:         Date.now(),
  }).run();

  return fresh;
}

export function saveCharacter(db: DB, accountId: string, entity: PlayerEntity): void {
  db.update(characters)
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
    .where(eq(characters.accountId, accountId))
    .run();
}

// ── Internals ─────────────────────────────────────────────────────────────────

type CharacterRow = typeof characters.$inferSelect;

function hydratePlayerSlices(row: CharacterRow): PersistedPlayerSlices {
  const holdsInventory = parseSlice<HoldsInventory>(row.holdsInventory);
  holdsInventory.equipment = {
    ...emptyEquipment(),
    ...holdsInventory.equipment,
  };
  const tracksProgression = parseSlice<TracksProgression>(row.tracksProgression);

  return {
    isPlayer:          parseSlice<IsPlayer>(row.isPlayer),
    hasPosition:       parseSlice<HasPosition>(row.hasPosition),
    hasHealth:         parseSlice<HasHealth>(row.hasHealth),
    tracksProgression: {
      ...tracksProgression,
      bossesCleared: tracksProgression.bossesCleared ?? [],
      clearedNodes:   tracksProgression.clearedNodes ?? [],
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
  equipment.weapon = 'basic-sword';

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
    },
    holdsInventory: {
      inventory: [],
      equipment,
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
