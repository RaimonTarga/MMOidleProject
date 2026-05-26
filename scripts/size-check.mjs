#!/usr/bin/env node
// size-check: warns on TS/TSX files over SOFT_MAX lines, fails on files over
// HARD_MAX lines unless they're listed in size-check.allowlist.json.
//
// Soft target: 300 lines per file (warning).
// Hard cap:    400 lines per file (error unless allowlisted).
//
// Walks client/src, server/src, shared/src. Skips node_modules, dist, .bak,
// .d.ts. Allowlist exists to support the code-organization-refactor plan —
// entries are removed as each phase shrinks the corresponding god file.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT     = process.cwd();
const ROOTS    = ['client/src', 'server/src', 'shared/src'];
const SOFT_MAX = 300;
const HARD_MAX = 400;
const ALLOWLIST_PATH = 'scripts/size-check.allowlist.json';

const allowlist = new Set(
  existsSync(ALLOWLIST_PATH)
    ? JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8'))
    : [],
);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules' || name === 'dist') continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith('.d.ts') && !name.endsWith('.bak')) {
      yield p;
    }
  }
}

let hardFail   = false;
let softWarn   = 0;
const overSoft = [];
const overHard = [];
const staleAllowlist = new Set(allowlist);

for (const root of ROOTS) {
  if (!existsSync(root)) continue;
  for (const file of walk(root)) {
    const rel   = relative(ROOT, file);
    const lines = readFileSync(file, 'utf8').split('\n').length;

    if (lines > HARD_MAX) {
      if (allowlist.has(rel)) {
        staleAllowlist.delete(rel);
      } else {
        overHard.push({ rel, lines });
        hardFail = true;
      }
    }
    if (lines > SOFT_MAX) {
      softWarn++;
      overSoft.push({ rel, lines });
    }
    staleAllowlist.delete(rel);
  }
}

overSoft.sort((a, b) => b.lines - a.lines);
overHard.sort((a, b) => b.lines - a.lines);

if (overSoft.length > 0) {
  console.log(`\n-- files over ${SOFT_MAX} lines (soft target) --`);
  for (const { rel, lines } of overSoft) {
    const flag = allowlist.has(rel) ? '  [allowed]' : lines > HARD_MAX ? '  [FAIL]' : '';
    console.log(`  ${String(lines).padStart(5)}  ${rel}${flag}`);
  }
}

if (overHard.length > 0) {
  console.error(`\nFAIL: ${overHard.length} file(s) over ${HARD_MAX} lines not in allowlist:`);
  for (const { rel, lines } of overHard) console.error(`  ${lines}  ${rel}`);
}

if (staleAllowlist.size > 0) {
  console.warn(`\nstale allowlist entries (remove from ${ALLOWLIST_PATH}):`);
  for (const rel of staleAllowlist) console.warn(`  ${rel}`);
}

const total = overSoft.length;
console.log(`\nsize:check — ${total} file(s) over ${SOFT_MAX}; ${hardFail ? 'FAIL' : 'PASS'}`);
process.exit(hardFail ? 1 : 0);
