import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const accounts = sqliteTable('accounts', {
  id:          text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  discordId:   text('discord_id'),
  createdAt:   integer('created_at').notNull(),
});

export const characters = sqliteTable('characters', {
  id:                 text('id').primaryKey(),
  accountId:          text('account_id').notNull().references(() => accounts.id),
  name:               text('name').notNull(),
  nodeId:             text('node_id').notNull().default('node-5-5'),
  x:                  real('x').notNull().default(400),
  y:                  real('y').notNull().default(300),
  level:              integer('level').notNull().default(0),
  skillPoints:        integer('skill_points').notNull().default(0),
  unlockedSkills:     text('unlocked_skills').notNull().default('[]'),
  inventory:          text('inventory').notNull().default('["basic-sword"]'),
  equipment:          text('equipment').notNull().default('{}'),
  essences:           text('essences').notNull().default('{"red":0,"blue":0,"green":0,"yellow":0,"purple":0}'),
  biomeXP:            text('biome_xp').notNull().default('{}'),
  biomeLevel:         text('biome_level').notNull().default('{}'),
  unlockedRecipes:    text('unlocked_recipes').notNull().default('[]'),
  questProgress:      text('quest_progress').notNull().default('{}'),
  combatArchetype:    text('combat_archetype'),
  selectedClass:      text('selected_class'),
  selectedSubVariant: text('selected_sub_variant'),
  selectedRange:      text('selected_range'),
  currentSkillTier:   integer('current_skill_tier').notNull().default(0),
  playerTier:         integer('player_tier').notNull().default(0),
  updatedAt:          integer('updated_at').notNull().default(0),
});
