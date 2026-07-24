-- Map Variety Stage B: coordinate-shaped node ids were replaced by stable opaque
-- ids on a new sparse atlas. Node-keyed exploration cannot be mapped safely.
UPDATE "characters"
SET
  "has_position" = jsonb_set(
    "has_position"::jsonb,
    '{nodeId}',
    '"node-clearing"'::jsonb,
    true
  )::text,
  "tracks_progression" = jsonb_set(
    "tracks_progression"::jsonb,
    '{clearedNodes}',
    '[]'::jsonb,
    true
  )::text;

-- The throne placeholder is no longer present in the world.
DELETE FROM "world_state" WHERE "key" = 'void-overlord-respawn';
