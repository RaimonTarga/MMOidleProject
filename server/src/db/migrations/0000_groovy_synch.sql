CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"discord_id" text,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"is_player" text NOT NULL,
	"has_position" text NOT NULL,
	"has_health" text NOT NULL,
	"tracks_progression" text NOT NULL,
	"holds_inventory" text NOT NULL,
	"uses_skills" text NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sprite_hitbox_meta" (
	"key" text PRIMARY KEY NOT NULL,
	"atlas_hash" text NOT NULL,
	"baked_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sprite_hitboxes" (
	"frame_name" text PRIMARY KEY NOT NULL,
	"source_w" integer NOT NULL,
	"source_h" integer NOT NULL,
	"rects_json" text NOT NULL,
	"coverage" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "world_state" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;