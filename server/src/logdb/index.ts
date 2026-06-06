import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';
import { Pool } from 'pg';
import * as schema from './schema';

const DEV_DEFAULT_LOG_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/logdb';

let connectionString = process.env.LOG_DATABASE_URL;
if (!connectionString) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[logdb] LOG_DATABASE_URL is not set. Point it at the separate logdb Postgres instance ' +
        '(on Railway: LOG_DATABASE_URL=${{logdb.DATABASE_URL}}).',
    );
  }
  connectionString = DEV_DEFAULT_LOG_DATABASE_URL;
  console.warn(
    `[logdb] LOG_DATABASE_URL not set — falling back to local dev Postgres (${DEV_DEFAULT_LOG_DATABASE_URL}).`,
  );
}

const wantsSsl =
  /[?&]sslmode=require/.test(connectionString) ||
  process.env.LOG_PGSSL === 'require' ||
  process.env.LOG_PGSSL === 'true';

function parsePoolMax(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return parsed;
}

export const logPool = new Pool({
  connectionString,
  max: parsePoolMax(process.env.LOG_PG_POOL_MAX, 2),
  ssl: wantsSsl ? { rejectUnauthorized: false } : false,
});

export const logDb = drizzle(logPool, { schema });

export async function runLogMigrations(): Promise<void> {
  const migrationsFolder = path.join(__dirname, '..', '..', 'src', 'logdb', 'migrations');
  await migrate(logDb, { migrationsFolder });
  console.log('[logdb] migrations applied');
}
