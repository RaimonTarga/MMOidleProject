#!/usr/bin/env node
// The playtest build in one command: a production client build served by a production server
// (DEV_TOOLS on) from THIS checkout, on its own game database, so a playtest never shares a world
// or a save with a dev server or a bot lane.
//
//   node tools/lane/playtest.mjs [--port 4000] [--db gamedb_playtest] [--skip-build] [--fresh]
//
// Needs the dev containers up (`pnpm db:up`: mmo-gamedb, mmo-logdb, mmo-redis). Creates the
// database when missing; `--fresh` drops and recreates it first (a new world, no characters).
// Then open http://localhost:<port> and use guest "Play now" (production ignores AUTH_DEV_BYPASS;
// guests are limited to 5 per IP per hour, and one guest can hold all six characters). The server
// runs in the foreground: Ctrl+C stops it.

import { spawn, execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const port = Number(flag('port', '4000'));
const db = flag('db', 'gamedb_playtest');
if (!/^[a-z0-9_]+$/.test(db)) throw new Error(`database name must be [a-z0-9_]: ${db}`);

function psql(sql) {
  return execFileSync('docker', ['exec', 'mmo-gamedb', 'psql', '-U', 'postgres', '-tAc', sql], { encoding: 'utf8' }).trim();
}

if (args.includes('--fresh')) {
  psql(`DROP DATABASE IF EXISTS ${db} WITH (FORCE)`);
  console.log(`playtest: dropped ${db}`);
}
if (psql(`SELECT 1 FROM pg_database WHERE datname = '${db}'`) !== '1') {
  psql(`CREATE DATABASE ${db}`);
  console.log(`playtest: created ${db}`);
}

if (!args.includes('--skip-build')) {
  console.log('playtest: building the client (about a minute)...');
  execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], {
    cwd: path.join(ROOT, 'client'),
    env: { ...process.env, VITE_DEV_TOOLS: 'true' },
    stdio: 'inherit',
  });
}

const env = {
  ...process.env,
  NODE_ENV: 'production',
  DEV_TOOLS: 'true',
  PORT: String(port),
  DATABASE_URL: `postgresql://postgres:postgres@localhost:5432/${db}`,
  LOG_DATABASE_URL: 'postgresql://postgres:postgres@localhost:5433/logdb_rework',
  REDIS_URL: 'redis://localhost:6379/15',
  ADMIN_TOKEN: process.env.ADMIN_TOKEN ?? 'playtest-local-admin-token-0123456789abcdef',
};
console.log(`playtest: starting the server on http://localhost:${port} (database ${db}); Ctrl+C stops it`);
const child = spawn(process.execPath, ['--conditions=development', '--import', 'tsx', 'src/index.ts'], {
  cwd: path.join(ROOT, 'server'),
  env,
  stdio: 'inherit',
});
child.on('exit', (code) => process.exit(code ?? 0));
process.on('SIGINT', () => child.kill('SIGINT'));
