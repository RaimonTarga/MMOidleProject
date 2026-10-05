import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { childFinished, postgresCommand, targetLabel } from './logdb-backup.mjs';

async function main() {
  const args = process.argv.slice(2);
  let file, url, container;
  let yes = false, dryRun = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--yes') yes = true;
    else if (args[i] === '--dry-run') dryRun = true;
    else if (['--file', '--to', '--docker-container'].includes(args[i]) && args[i + 1] && !args[i + 1].startsWith('--')) {
      const key = args[i++];
      if (key === '--file') file = args[i];
      else if (key === '--to') url = args[i];
      else container = args[i];
    } else throw new Error('Usage: logdb-restore.mjs --file <dump> --to <url> --yes [--dry-run] [--docker-container <name>]');
  }
  if (!file || !url) throw new Error('--file and --to are required.');
  if (!yes && !dryRun) throw new Error('Restore requires --yes.');
  const source = path.resolve(file);
  if (!(await fs.stat(source)).isFile()) throw new Error('The dump must be a regular file.');
  const command = postgresCommand('pg_restore', url, container);
  command.args.push('--exit-on-error', '--single-transaction');
  console.log(`${dryRun ? 'DRY RUN: would restore' : 'Restoring'} ${source} into ${targetLabel(url)}${container ? `; Docker ${container}` : ''}. Target must already exist and be empty.`);
  if (dryRun) return;
  const child = spawn(command.executable, command.args, { env: command.env, stdio: ['pipe', 'ignore', 'inherit'], windowsHide: true });
  await Promise.all([
    childFinished(child, 'pg_restore'),
    pipeline(createReadStream(source), child.stdin).catch(error => { child.kill(); throw error; }),
  ]);
  console.log('Restore complete.');
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
