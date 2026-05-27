CREATE TABLE `sprite_hitbox_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`atlas_hash` text NOT NULL,
	`baked_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sprite_hitboxes` (
	`frame_name` text PRIMARY KEY NOT NULL,
	`source_w` integer NOT NULL,
	`source_h` integer NOT NULL,
	`rects_json` text NOT NULL,
	`coverage` integer NOT NULL
);
