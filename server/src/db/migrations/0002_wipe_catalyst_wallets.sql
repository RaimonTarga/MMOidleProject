-- Map Variety Stage A: catalyst wallets re-key from per-biome-group to per-combat
-- family. Balances were earned under placeholder biome keys during playtest and
-- are not worth converting (design §2.4), so reset both wallets to empty objects.
-- `tracks_progression` is a text-encoded JSON blob; cast through jsonb to edit.
UPDATE "characters"
SET "tracks_progression" = jsonb_set(
  jsonb_set("tracks_progression"::jsonb, '{catalysts}', '{}'::jsonb, true),
  '{catalystProgress}', '{}'::jsonb, true
)::text;
