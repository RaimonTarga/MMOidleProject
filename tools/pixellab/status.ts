// art:status — pipeline coverage report.
//
// Usage: pnpm art:status [--balance]
//
// Cross-checks manifests against the game registries (MONSTER_DATABASE,
// ITEM_DATABASE, frame maps) and the art/src tree so nothing ships without
// accepted art and no manifest entry is orphaned. --balance also queries the
// PixelLab account balance (free call, needs the API key).

import fs from 'node:fs';
import path from 'node:path';
// Relative imports into shared/src — see note in seed.ts.
import { ITEM_DATABASE } from '../../shared/src/itemDatabase';
import { MONSTER_DATABASE } from '../../shared/src/data/monsters/index';
import { MONSTER_FRAMES, PLAYER_FRAMES } from '../../shared/src/sprites/frameMaps';
import { getBalance } from './lib/api';
import { totalSpendUsd } from './lib/lock';
import { loadManifests, resolveEntries } from './lib/manifest';
import { CANDIDATES_DIR, srcPathFor } from './lib/paths';

const WANT_BALANCE = process.argv.includes('--balance');

function main(): void {
  const manifests = loadManifests();
  if (manifests.length === 0) {
    console.log('No manifests found — run pnpm art:import then pnpm art:seed first.');
    return;
  }
  const resolved = resolveEntries(manifests);
  const outsInManifests = new Set(resolved.map((r) => r.entry.out));

  console.log('category        total  draft  pending  regen  accepted  review  no-art');
  console.log('─'.repeat(74));
  for (const { manifest } of manifests) {
    const entries = manifest.entries;
    const count = (s: string) => entries.filter((e) => e.status === s).length;
    const awaitingReview = entries.filter((e) =>
      fs.existsSync(path.join(CANDIDATES_DIR, manifest.category, e.id)),
    ).length;
    const missingArt = entries.filter((e) => !fs.existsSync(srcPathFor(e.out))).length;
    console.log(
      manifest.category.padEnd(15) +
        String(entries.length).padStart(6) +
        String(count('draft')).padStart(7) +
        String(count('pending')).padStart(9) +
        String(count('regen')).padStart(7) +
        String(count('accepted')).padStart(10) +
        String(awaitingReview).padStart(8) +
        String(missingArt).padStart(8),
    );
  }

  const problems: string[] = [];

  // Monsters: every database monster should resolve to a frame with a manifest entry.
  for (const id of MONSTER_DATABASE.keys()) {
    const frame = MONSTER_FRAMES[id];
    if (!frame) problems.push(`monster '${id}' has no MONSTER_FRAMES sprite mapping`);
    else if (!outsInManifests.has(frame)) problems.push(`monster frame '${frame}' has no manifest entry`);
  }
  for (const frame of new Set(Object.values(PLAYER_FRAMES))) {
    if (!outsInManifests.has(frame)) problems.push(`player frame '${frame}' has no manifest entry`);
  }
  // Items: every database icon should have a manifest entry.
  for (const [id, def] of ITEM_DATABASE) {
    const icon = def.icon;
    if (icon && !outsInManifests.has(icon)) {
      problems.push(`item '${id}' icon '${icon}' has no manifest entry`);
    }
  }
  // Manifest entries pointing at art that does not exist AND aren't queued.
  for (const r of resolved) {
    if (r.entry.status === 'accepted' && !fs.existsSync(srcPathFor(r.entry.out))) {
      problems.push(`'${r.category}/${r.entry.id}' is accepted but art/src/${r.entry.out} is missing`);
    }
  }

  if (problems.length) {
    console.log(`\n${problems.length} coverage problems:`);
    for (const p of problems.slice(0, 40)) console.log(`  - ${p}`);
    if (problems.length > 40) console.log(`  ... and ${problems.length - 40} more`);
  } else {
    console.log('\nCoverage clean: every registry asset has a manifest entry.');
  }

  console.log(`\nlifetime spend (lockfile): $${totalSpendUsd().toFixed(2)}`);
  if (WANT_BALANCE) {
    getBalance()
      .then((b) => console.log(`account balance: $${b.credits.usd.toFixed(2)}`))
      .catch((err) => console.log(`balance check failed: ${err.message}`));
  }
}

main();
