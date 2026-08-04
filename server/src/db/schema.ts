import { pgTable, text, integer, bigint, uniqueIndex } from 'drizzle-orm/pg-core';

export const accounts = pgTable(
  'accounts',
  {
    id:          text('id').primaryKey(),
    displayName: text('display_name').notNull(),
    discordId:   text('discord_id'),
    createdAt:   bigint('created_at', { mode: 'number' }).notNull(),
    lastLoginAt: bigint('last_login_at', { mode: 'number' }).notNull().default(0),
  },
  (table) => [uniqueIndex('accounts_discord_id_unique').on(table.discordId)],
);

export const characters = pgTable('characters', {
  id:                text('id').primaryKey(),
  accountId:         text('account_id').notNull().references(() => accounts.id),
  isPlayer:          text('is_player').notNull(),
  hasPosition:       text('has_position').notNull(),
  hasHealth:         text('has_health').notNull(),
  tracksProgression: text('tracks_progression').notNull(),
  holdsInventory:    text('holds_inventory').notNull(),
  usesSkills:        text('uses_skills').notNull(),
  deletedAt:         bigint('deleted_at', { mode: 'number' }),
  lastPlayedAt:      bigint('last_played_at', { mode: 'number' }).notNull().default(0),
  updatedAt:         bigint('updated_at', { mode: 'number' }).notNull().default(0),
});

export const sessions = pgTable('sessions', {
  tokenHash:  text('token_hash').primaryKey(),
  accountId:  text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  createdAt:  bigint('created_at', { mode: 'number' }).notNull(),
  expiresAt:  bigint('expires_at', { mode: 'number' }),
  lastSeenAt: bigint('last_seen_at', { mode: 'number' }).notNull(),
});

export const worldState = pgTable('world_state', {
  key:       text('key').primaryKey(),
  value:     text('value').notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull().default(0),
});

export const spriteHitboxMeta = pgTable('sprite_hitbox_meta', {
  key:       text('key').primaryKey(),
  atlasHash: text('atlas_hash').notNull(),
  bakedAt:   bigint('baked_at', { mode: 'number' }).notNull(),
});

export const spriteHitboxes = pgTable('sprite_hitboxes', {
  frameName: text('frame_name').primaryKey(),
  sourceW:   integer('source_w').notNull(),
  sourceH:   integer('source_h').notNull(),
  rectsJson: text('rects_json').notNull(),
  coverage:  integer('coverage').notNull(),
});
