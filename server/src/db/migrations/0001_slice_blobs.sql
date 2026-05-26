-- Snapshot-removal prep: persist one JSON blob per player slice.
-- Back up game.db before applying this migration to live data.
ALTER TABLE `characters` ADD COLUMN `is_player` text NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE `characters` ADD COLUMN `has_position` text NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE `characters` ADD COLUMN `has_health` text NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE `characters` ADD COLUMN `tracks_progression` text NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE `characters` ADD COLUMN `holds_inventory` text NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE `characters` ADD COLUMN `uses_skills` text NOT NULL DEFAULT '{}';
--> statement-breakpoint
UPDATE `characters` SET
  `is_player` = json_object(
    'id', `id`,
    'name', `name`
  ),
  `has_position` = json_object(
    'current', json_object('x', `x`, 'y', `y`),
    'nodeId', `node_id`,
    'speed', 120
  ),
  `has_health` = json_object(
    'hp', 100,
    'maxHp', 100,
    'hpRegen', 10
  ),
  `tracks_progression` = json_object(
    'level', `level`,
    'skillPoints', `skill_points`,
    'essences', json(`essences`),
    'biomeXP', json(`biome_xp`),
    'biomeLevel', json(`biome_level`),
    'unlockedRecipes', json(`unlocked_recipes`),
    'questProgress', json(`quest_progress`),
    'playerTier', `player_tier`,
    'currentSkillTier', `current_skill_tier`
  ),
  `holds_inventory` = json_object(
    'inventory', json(`inventory`),
    'equipment', json(`equipment`)
  ),
  `uses_skills` = json_object(
    'unlockedSkills', json(`unlocked_skills`),
    'passives', json('{}'),
    'selectedClass', `selected_class`,
    'selectedSubVariant', `selected_sub_variant`,
    'selectedRange', `selected_range`,
    'combatArchetype', `combat_archetype`
  );
--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `name`;
--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `node_id`;
--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `x`;
--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `y`;
--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `level`;
--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `skill_points`;
--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `unlocked_skills`;
--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `inventory`;
--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `equipment`;
--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `essences`;
--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `biome_xp`;
--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `biome_level`;
--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `unlocked_recipes`;
--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `quest_progress`;
--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `combat_archetype`;
--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `selected_class`;
--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `selected_sub_variant`;
--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `selected_range`;
--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `current_skill_tier`;
--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `player_tier`;
