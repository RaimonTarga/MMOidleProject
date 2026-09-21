ALTER TABLE characters ADD COLUMN telemetry_id text NOT NULL DEFAULT gen_random_uuid()::text;
ALTER TABLE characters ADD COLUMN telemetry_cohort text NOT NULL DEFAULT 'human';
CREATE UNIQUE INDEX characters_telemetry_id_idx ON characters(telemetry_id);
