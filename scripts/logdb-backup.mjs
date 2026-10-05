import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';

export function postgresCommand(tool, rawUrl, container) {
  const url = new URL(rawUrl);
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !url.pathname.slice(1)) {
    throw new Error('A PostgreSQL URL with a host and database is required.');
  }
  const env = { ...process.env };
  if (url.password) env.PGPASSWORD = decodeURIComponent(url.password);
  url.password = '';
  if (container && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    // Docker Desktop reaches the host's published compose ports this way.
    url.hostname = 'host.docker.internal';
  }
  if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '10');
  const args = [`--dbname=${url.href}`, '--no-password'];
  return container
    ? { executable: 'docker', args: ['exec', '-i', ...(env.PGPASSWORD ? ['--env', 'PGPASSWORD'] : []), container, tool, ...args], env }
    : { executable: tool, args, env };
}

export function targetLabel(rawUrl) {
  const url = new URL(rawUrl);
  return `${url.hostname}:${url.port || '5432'}${url.pathname}`;
}

export function childFinished(child, tool) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${tool} failed (${signal || `exit ${code}`}).`));
    });
  });
}

async function backupsToPrune(directory, cutoff) {
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  return entries.filter(entry => {
    if (!entry.isFile()) return false;
    const match = /^logdb-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z)\.dump$/.exec(entry.name);
    if (!match) return false;
    const timestamp = match[1].replace(/T(\d{2})-(\d{2})-(\d{2})/, 'T$1:$2:$3');
    return Date.parse(timestamp) < cutoff;
  }).map(entry => path.join(directory, entry.name)).sort();
}

async function main() {
  const args = process.argv.slice(2);
  let dryRun = false;
  let container;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') dryRun = true;
    else if (args[i] === '--docker-container' && args[i + 1] && !args[i + 1].startsWith('--')) container = args[++i];
    else throw new Error('Usage: logdb-backup.mjs [--dry-run] [--docker-container <name>]');
  }
  const rawUrl = process.env.LOG_DATABASE_URL;
  if (!rawUrl) throw new Error('Set LOG_DATABASE_URL.');
  const keepDays = Number(process.env.LOGDB_BACKUP_KEEP_DAYS ?? 14);
  if (!Number.isFinite(keepDays) || keepDays <= 0) throw new Error('LOGDB_BACKUP_KEEP_DAYS must be greater than zero.');
  const directory = path.resolve(process.env.LOGDB_BACKUP_DIR || './backups/logdb');
  const now = new Date();
  const filename = `logdb-${now.toISOString().replaceAll(':', '-')}.dump`;
  const destination = path.join(directory, filename);
  const prune = await backupsToPrune(directory, now.getTime() - keepDays * 86400000);
  const command = postgresCommand('pg_dump', rawUrl, container);
  command.args.push('--format=custom', '--compress=6');
  console.log(`${dryRun ? 'DRY RUN: would dump' : 'Dumping'} ${targetLabel(rawUrl)} to ${destination} (custom format, gzip level 6${container ? `; Docker ${container}` : ''}).`);
  console.log(`${dryRun ? 'Would prune' : 'Will prune after a successful dump'} ${prune.length} backup(s) older than ${keepDays} days.`);
  if (dryRun) {
    for (const file of prune) console.log(`Would remove ${file}`);
    return;
  }
  await fs.mkdir(directory, { recursive: true });
  const partial = `${destination}.partial`;
  const partialHandle = await fs.open(partial, 'wx', 0o600);
  const output = partialHandle.createWriteStream();
  const child = spawn(command.executable, command.args, { env: command.env, stdio: ['ignore', 'pipe', 'inherit'], windowsHide: true });
  try {
    await Promise.all([
      childFinished(child, 'pg_dump'),
      pipeline(child.stdout, output).catch(error => { child.kill(); throw error; }),
    ]);
    const handle = await fs.open(partial, 'r');
    try {
      const magic = Buffer.alloc(5);
      await handle.read(magic, 0, 5, 0);
      if (magic.toString() !== 'PGDMP') throw new Error('Dump has no PostgreSQL custom archive header.');
    } finally {
      await handle.close();
    }
    // An exclusive hard link publishes the completed file without replacing a backup.
    await fs.link(partial, destination);
    await fs.unlink(partial);
  } catch (error) {
    child.kill();
    output.destroy();
    await new Promise(resolve => { if (output.closed) resolve(); else output.once('close', resolve); });
    await fs.rm(partial, { force: true });
    throw error; // Retention is deliberately unreachable on a failed dump.
  }
  console.log(`Backup complete: ${destination} (${(await fs.stat(destination)).size} bytes).`);
  for (const file of prune) {
    // Ignore directories and symlinks, even if a path changed during the dump.
    if ((await fs.lstat(file)).isFile()) {
      await fs.unlink(file);
      console.log(`Pruned ${file}`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
