ALTER TABLE "world_log_entries" ADD COLUMN "viewer_character_id" text;
--> statement-breakpoint
CREATE INDEX "world_log_entries_viewer_character_ts_idx" ON "world_log_entries" USING btree ("viewer_character_id","ts");
