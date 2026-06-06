ALTER TABLE "accounts" ADD COLUMN "last_login_at" bigint DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE "accounts" SET "last_login_at" = "created_at" WHERE "last_login_at" = 0;
