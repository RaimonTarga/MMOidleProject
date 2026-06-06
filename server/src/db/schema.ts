import { pgTable, text, integer, bigint } from 'drizzle-orm/pg-core';

export const accounts = pgTable('accounts', {
  id:          text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  discordId:   text('discord_id'),
  createdAt:   bigint('created_at', { mode: 'number' }).notNull(),
  lastLoginAt: bigint('last_login_at', { mode: 'number' }).notNull().default(0),
});

export const characters = pgTable('characters', {
  id:                text('id').primaryKey(),
  accountId:         text('account_id').notNull().references(() => accounts.id),
  isPlayer:          text('is_player').notNull(),
  hasPosition:       text('has_position').notNull(),
  hasHealth:         text('has_health').notNull(),
  tracksProgression: text('tracks_progression').notNull(),
  holdsInventory:    text('holds_inventory').notNull(),
  usesSkills:        text('uses_skills').notNull(),
  updatedAt:         bigint('updated_at', { mode: 'number' }).notNull().default(0),
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
