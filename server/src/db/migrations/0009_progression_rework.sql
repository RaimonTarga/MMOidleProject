-- Progression rework Phase 2b: the node-modifier catalyst wallet is retired
-- outright (no recipe/upgrade spends it any more), unlike 0002's re-key which
-- kept the wallet alive under a new key. Drop both keys from every character's
-- tracks_progression JSON blob; a stray key left by an older row is harmless
-- (playerRepo hydration also strips it defensively) but should not persist.
--
-- The weapon +N ladder's refund (itemUpgrades essence back for weapon-slot
-- items) is NOT done here: it needs ITEM_DATABASE to tell a weapon recipe from
-- a non-weapon one, which SQL cannot see, so it runs in playerRepo hydration
-- (server/src/db/weaponUpgradeRefund.ts) instead, exercised without a live DB
-- per the test-fixture convention in server/test/upgradeRefundMigration.test.ts.
--
-- tracks_progression is a text-encoded JSON blob; cast through jsonb to edit.
UPDATE "characters"
SET "tracks_progression" = (
  "tracks_progression"::jsonb - 'catalysts' - 'catalystProgress'
)::text;
