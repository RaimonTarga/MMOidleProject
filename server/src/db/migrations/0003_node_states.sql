CREATE TABLE `node_states` (
	`node_id` text PRIMARY KEY NOT NULL,
	`snapshot_json` text NOT NULL,
	`updated_at` integer NOT NULL
);
