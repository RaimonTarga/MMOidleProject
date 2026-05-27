import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const accounts = sqliteTable('accounts', {
  id:          text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  discordId:   text('discord_id'),
  createdAt:   integer('created_at').notNull(),
});

export const characters = sqliteTable('characters', {
  id:                text('id').primaryKey(),
  accountId:         text('account_id').notNull().references(() => accounts.id),
  isPlayer:          text('is_player').notNull(),
  hasPosition:       text('has_position').notNull(),
  hasHealth:         text('has_health').notNull(),
  tracksProgression: text('tracks_progression').notNull(),
  holdsInventory:    text('holds_inventory').notNull(),
  usesSkills:        text('uses_skills').notNull(),
  updatedAt:         integer('updated_at').notNull().default(0),
});

export const spriteHitboxMeta = sqliteTable('sprite_hitbox_meta', {
  key:       text('key').primaryKey(),
  atlasHash: text('atlas_hash').notNull(),
  bakedAt:   integer('baked_at').notNull(),
});

export const spriteHitboxes = sqliteTable('sprite_hitboxes', {
  frameName: text('frame_name').primaryKey(),
  sourceW:   integer('source_w').notNull(),
  sourceH:   integer('source_h').notNull(),
  rectsJson: text('rects_json').notNull(),
  coverage:  integer('coverage').notNull(),
});
