// landing:clean — reclaim the capture pipeline's scratch space.
//
//   pnpm landing:clean          # drop artifacts, keep the warm HTTP caches
//   pnpm landing:clean --all    # drop the browser profiles too
//
// Everything under .landing/ is regenerable, but not everything is CHEAP to
// regenerate, and not all of it is scratch. Two things survive the default
// sweep:
//
//   profile/, verify-profile/  the browsers' HTTP caches. A cold profile means a
//                              ~3 minute boot before the first frame can be
//                              captured, because the dev server serves
//                              multi-megabyte biome PNGs through a Docker bind
//                              mount. Only the throwaway sub-caches are dropped.
//   keep/                      deliberate output — candidate clips, comparison
//                              stills, anything being kept for review. Put it
//                              here and the sweep will not take it.
//
// `--all` takes the profiles too, for when disk matters more than the next
// capture's start-up time. It never takes keep/.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const WORK_DIR = path.join(REPO_ROOT, '.landing');

/** Chromium regenerates these in seconds; only `Cache` is worth keeping. */
const DISPOSABLE_PROFILE_DIRS = [
  'Code Cache',
  'GPUCache',
  'DawnWebGPUCache',
  'DawnGraphiteCache',
];

function sizeMb(target: string): number {
  if (!fs.existsSync(target)) return 0;
  let total = 0;
  const stack = [target];
  while (stack.length > 0) {
    const current = stack.pop()!;
    let stat: fs.Stats;
    try {
      stat = fs.statSync(current);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(current)) stack.push(path.join(current, entry));
    } else {
      total += stat.size;
    }
  }
  return total / 1024 / 1024;
}

function drop(target: string, label: string): number {
  const freed = sizeMb(target);
  if (freed === 0) return 0;
  fs.rmSync(target, { recursive: true, force: true });
  console.log(`   ${label.padEnd(34)} ${freed.toFixed(1).padStart(7)} MB`);
  return freed;
}

function main(): void {
  const all = process.argv.slice(2).includes('--all');
  if (!fs.existsSync(WORK_DIR)) {
    console.log('\nnothing to clean — .landing/ does not exist');
    return;
  }

  const before = sizeMb(WORK_DIR);
  console.log(`\n── cleaning .landing (${before.toFixed(1)} MB)`);
  let freed = 0;

  for (const entry of fs.readdirSync(WORK_DIR)) {
    const full = path.join(WORK_DIR, entry);
    // The anchor credential is not scratch: re-minting it burns one of the five
    // guest accounts /auth/guest allows per hour.
    if (entry === 'session.json') continue;
    // Deliberate output, not scratch — see the header.
    if (entry === 'keep') continue;
    const isProfile = entry === 'profile' || entry === 'verify-profile';
    if (isProfile && !all) {
      for (const cacheDir of DISPOSABLE_PROFILE_DIRS) {
        freed += drop(path.join(full, 'Default', cacheDir), `${entry}/${cacheDir}`);
      }
      continue;
    }
    freed += drop(full, entry);
  }

  const after = sizeMb(WORK_DIR);
  console.log(`\n   freed ${freed.toFixed(1)} MB · ${after.toFixed(1)} MB remains`);
  if (!all && after > 1) {
    console.log('   (warm asset caches kept — `--all` drops them, at the cost of a ~3 min cold boot)');
  }
}

main();
