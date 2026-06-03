import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';
import { Pool } from 'pg';
import * as schema from './schema';

// Railway's Postgres service exposes its connection string as DATABASE_URL.
// Reference it on the app service with `DATABASE_URL=${{gamedb.DATABASE_URL}}`.
//
// For local development we fall back to the Postgres container defined in
// docker-compose.yml, so `pnpm dev:server` "just works" once Docker is up
// (the dev script auto-starts the db). Production must set DATABASE_URL.
const DEV_DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/gamedb';

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[db] DATABASE_URL is not set. Point it at your Postgres instance ' +
        '(on Railway: DATABASE_URL=${{gamedb.DATABASE_URL}}).',
    );
  }
  connectionString = DEV_DEFAULT_DATABASE_URL;
  console.warn(
    `[db] DATABASE_URL not set — falling back to local dev Postgres (${DEV_DEFAULT_DATABASE_URL}).`,
  );
}

// SSL is opt-in: local Postgres (docker-compose) and Railway's private-network
// DATABASE_URL do not use TLS. Enable it only when the URL asks for it
// (`?sslmode=require`) or PGSSL is set — e.g. when using a public Postgres URL.
const wantsSsl =
  /[?&]sslmode=require/.test(connectionString) ||
  process.env.PGSSL === 'require' ||
  process.env.PGSSL === 'true';

const pool = new Pool({
  connectionString,
  ssl: wantsSsl ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });

export async function runMigrations(): Promise<void> {
  const migrationsFolder = path.join(process.cwd(), 'src', 'db', 'migrations');
  await migrate(db, { migrationsFolder });
  console.log('[db] migrations applied');
}
