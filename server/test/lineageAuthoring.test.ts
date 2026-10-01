/**
 * Card files are pure shape — no numeric literals anywhere in them.
 *
 * "One magnitude table per tier. Hand-authored numbers per card are forbidden"
 * (design §9). The authored `LineageCard` type already has nowhere to put a
 * number but `tier`, so this is the belt to that braces: the failure mode it
 * guards against IS someone widening the type and authoring a magnitude next to
 * the card that uses it, which is how the old +N ladder ended up with a
 * hand-tuned number per item per level.
 *
 * It lives here rather than beside `shared/src/data/lineages/coverage.test.ts`
 * because it reads source files and `shared/` may not import Node APIs.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { LINEAGE_DATABASE } from '@mmo-idle/shared';

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

const LINEAGE_DIR = join(__dirname, '../../shared/src/data/lineages');

/** Everything in the directory that is not infrastructure is a card file. */
const INFRASTRUCTURE = new Set([
  'types.ts', 'packets.ts', 'magnitudes.ts', 'resolve.ts', 'index.ts', 'capstones.ts',
]);

const cardFiles = readdirSync(LINEAGE_DIR).filter(
  (f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && !INFRASTRUCTURE.has(f),
);

// Guard the guard: a scan that finds no files passes vacuously forever.
assert(
  cardFiles.length === LINEAGE_DATABASE.size,
  `found ${cardFiles.length} card files for ${LINEAGE_DATABASE.size} lineages — the scan is broken`,
);

const problems: string[] = [];

for (const file of cardFiles) {
  const lines = readFileSync(join(LINEAGE_DIR, file), 'utf8').split(/\r?\n/);
  let inBlockComment = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (inBlockComment) {
      if (trimmed.includes('*/')) inBlockComment = false;
      return;
    }
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) inBlockComment = true;
      return;
    }
    if (trimmed.startsWith('*') || trimmed.startsWith('//')) return;

    // Flavour text may say "every third hit"; strings are not code.
    const code = line
      .replace(/'(?:[^'\\]|\\.)*'/g, "''")
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      // `tier: N` is structure — which band the card sits in, not a magnitude.
      .replace(/\btier:\s*\d+/g, 'tier:');

    const literal = /(?<![\w.])\d+(?:\.\d+)?/.exec(code);
    if (literal) {
      problems.push(
        `${file}:${index + 1}: numeric literal '${literal[0]}' — every number comes from magnitudes.ts (design §9)`,
      );
    }
  });
}

assert(problems.length === 0, `hand-authored numbers in card files:\n  ${problems.join('\n  ')}`);

// And prove the scan can actually see a number, so a regex that stops matching
// does not quietly turn this suite into a no-op.
const canary = "      fx: 'tempo.trail', durationMs: 500,";
const canaryCode = canary.replace(/'(?:[^'\\]|\\.)*'/g, "''").replace(/\btier:\s*\d+/g, 'tier:');
assert(/(?<![\w.])\d+(?:\.\d+)?/.test(canaryCode), 'the literal scan no longer detects a literal');

console.log('lineageAuthoring.test.ts: ok');
