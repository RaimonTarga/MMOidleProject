CREATE UNIQUE INDEX "accounts_discord_id_unique" ON "accounts" USING btree ("discord_id");

ALTER TABLE "characters" ADD COLUMN "deleted_at" bigint;
ALTER TABLE "characters" ADD COLUMN "last_played_at" bigint DEFAULT 0 NOT NULL;

CREATE TABLE "sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"created_at" bigint NOT NULL,
	"expires_at" bigint NOT NULL,
	"last_seen_at" bigint NOT NULL
);

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_account_id_accounts_id_fk"
FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id")
ON DELETE cascade ON UPDATE no action;
