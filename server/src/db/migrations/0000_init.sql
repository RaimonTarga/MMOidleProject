CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`discord_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`name` text NOT NULL,
	`node_id` text DEFAULT 'node-5-5' NOT NULL,
	`x` real DEFAULT 400 NOT NULL,
	`y` real DEFAULT 300 NOT NULL,
	`level` integer DEFAULT 0 NOT NULL,
	`skill_points` integer DEFAULT 0 NOT NULL,
	`unlocked_skills` text DEFAULT '[]' NOT NULL,
	`inventory` text DEFAULT '["basic-sword"]' NOT NULL,
	`equipment` text DEFAULT '{}' NOT NULL,
	`essences` text DEFAULT '{"red":0,"blue":0,"green":0,"yellow":0,"purple":0}' NOT NULL,
	`biome_xp` text DEFAULT '{}' NOT NULL,
	`biome_level` text DEFAULT '{}' NOT NULL,
	`unlocked_recipes` text DEFAULT '[]' NOT NULL,
	`quest_progress` text DEFAULT '{}' NOT NULL,
	`combat_archetype` text,
	`selected_class` text,
	`selected_sub_variant` text,
	`selected_range` text,
	`current_skill_tier` integer DEFAULT 0 NOT NULL,
	`player_tier` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
