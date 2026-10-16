#!/usr/bin/env node
// Isolated bot lanes: one private game server and one game database per lane, so a bot never
// shares its world (six bots in one world crowd each other and corrupt the numbers).
//
//   node tools/lane/lane.mjs start <n>     start lane n's server from THIS checkout (background)
//   node tools/lane/lane.mjs stop <n>      kill lane n's server (the whole process tree)
//   node tools/lane/lane.mjs status [<n>]  which lanes answer on their port
//   node tools/lane/lane.mjs reset <n>     stop, then drop and recreate lane n's game database
//
// Lane n: port 4310+n, database gamedb_ov<n> (in the `mmo-gamedb` container), Redis db 8+n,
// the shared log database logdb_rework. Lanes 0-6 exist. The server log goes to
// ../lanes/lane<n>/server.log (outside the repo), its pid to ../lanes/lane<n>/server.pid.
// A bot points at the lane with `--server=http://localhost:<port>`.
//
// The server runs from the checkout this script lives in, so a worktree's own code is what the
// lane plays. Restart the lane after editing server or shared code (no watcher).

import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LANES_DIR = path.resolve(ROOT, '..', 'lanes');

function lane(n) {
  const id = Number(n);
  if (!Number.isInteger(id) || id < 0 || id > 6) throw new Error(`lane must be 0-6, got "${n}"`);
  const dir = path.join(LANES_DIR, `lane${id}`);
  return {
    id,
    port: 4310 + id,
    db: `gamedb_ov${id}`,
    redisDb: 8 + id,
    dir,
    log: path.join(dir, 'server.log'),
    pidFile: path.join(dir, 'server.pid'),
  };
}

async function answers(port) {
  try {
    const res = await fetch(`http://localhost:${port}/healthz`, { signal: AbortSignal.timeout(1500) });
    return res.status < 500;
  } catch {
    return false;
  }
}

function readPid(l) {
  try { return Number(fs.readFileSync(l.pidFile, 'utf8').trim()) || null; } catch { return null; }
}

function killTree(pid) {
  try { execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* gone */ }
}

/** Kill whatever listens on the port too: a pid file can go stale. */
function killPort(port) {
  try {
    const out = execFileSync('netstat', ['-ano'], { encoding: 'utf8' });
    for (const line of out.split(/\r?\n/)) {
      const m = line.match(/^\s*TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)/);
      if (m && Number(m[1]) === port) killTree(Number(m[2]));
    }
  } catch { /* netstat unavailable */ }
}

async function start(l) {
  if (await answers(l.port)) {
    console.log(`lane ${l.id}: already up on :${l.port} (stop it first to restart)`);
    return;
  }
  fs.mkdirSync(l.dir, { recursive: true });
  const out = fs.openSync(l.log, 'w');
  const env = {
    ...process.env,
    PORT: String(l.port),
    DATABASE_URL: `postgresql://postgres:postgres@localhost:5432/${l.db}`,
    LOG_DATABASE_URL: 'postgresql://postgres:postgres@localhost:5433/logdb_rework',
    REDIS_URL: `redis://localhost:6379/${l.redisDb}`,
    AUTH_DEV_BYPASS: '1',
    NODE_ENV: 'development',
  };
  const child = spawn(process.execPath, ['--conditions=development', '--import', 'tsx', 'src/index.ts'], {
    cwd: path.join(ROOT, 'server'),
    env,
    detached: true,
    stdio: ['ignore', out, out],
    windowsHide: true,
  });
  child.unref();
  fs.writeFileSync(l.pidFile, String(child.pid));
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (await answers(l.port)) {
      console.log(`lane ${l.id}: up on :${l.port} (db ${l.db}, pid ${child.pid}, log ${l.log})`);
      return;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log(`lane ${l.id}: no answer on :${l.port} after 180 s; see ${l.log}`);
  process.exitCode = 1;
}

function stop(l) {
  const pid = readPid(l);
  if (pid) killTree(pid);
  killPort(l.port);
  try { fs.rmSync(l.pidFile); } catch { /* none */ }
  console.log(`lane ${l.id}: stopped`);
}

async function status(ids) {
  for (const id of ids) {
    const l = lane(id);
    console.log(`lane ${l.id} :${l.port} ${l.db} ${(await answers(l.port)) ? 'UP' : 'down'}`);
  }
}

function psql(sql) {
  execFileSync('docker', ['exec', 'mmo-gamedb', 'psql', '-U', 'postgres', '-c', sql], { stdio: 'inherit' });
}

const [cmd, n] = process.argv.slice(2);
if (cmd === 'start') await start(lane(n));
else if (cmd === 'stop') stop(lane(n));
else if (cmd === 'status') await status(n === undefined ? [0, 1, 2, 3, 4, 5, 6] : [n]);
else if (cmd === 'reset') {
  const l = lane(n);
  stop(l);
  await new Promise((r) => setTimeout(r, 1500));
  psql(`DROP DATABASE IF EXISTS ${l.db} WITH (FORCE)`);
  psql(`CREATE DATABASE ${l.db}`);
} else {
  console.log('usage: node tools/lane/lane.mjs start|stop|status|reset <n>');
  process.exitCode = 2;
}
