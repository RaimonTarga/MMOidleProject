-- Execute once as the database administrator INSIDE the telemetry database.
-- Deliberately fails if this role already exists: audit it instead of reusing
-- an account with unknown memberships or privileges. No password in this file.
BEGIN;
CREATE ROLE telemetry_reader LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
  NOINHERIT NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 3;
DO $$ BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO telemetry_reader', current_database());
END $$;
GRANT USAGE ON SCHEMA public TO telemetry_reader;
GRANT SELECT ON public.gameplay_events, public.gameplay_daily TO telemetry_reader;
ALTER ROLE telemetry_reader SET default_transaction_read_only = on;
ALTER ROLE telemetry_reader SET statement_timeout = '5s';
ALTER ROLE telemetry_reader SET lock_timeout = '1s';
ALTER ROLE telemetry_reader SET idle_in_transaction_session_timeout = '10s';
COMMIT;
-- In psql, next run: \password telemetry_reader
-- This prompts securely. Do not put the password in a committed SQL file.
