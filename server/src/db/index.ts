import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import * as schema from './schema';

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'game.db');

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

export function runMigrations() {
  const migrationsFolder = path.join(process.cwd(), 'src', 'db', 'migrations');
  migrate(db, { migrationsFolder });
  console.log('[db] migrations applied');
}
