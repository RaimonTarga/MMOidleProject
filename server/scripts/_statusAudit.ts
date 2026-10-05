/** Static status registry audit — the CLI. Run from the repository root with
 * node --conditions=development --import ./server/node_modules/tsx/dist/loader.mjs server/scripts/_statusAudit.ts
 * --calls prints extraction evidence; --json prints machine-readable evidence.
 * Reads source only. No game bootstrap, databases, writes or network access.
 *
 * The extraction lives in `statusAudit.ts`; `server/test/statusRegistry.test.ts`
 * runs the same audit and fails on any open gap.
 */
import { auditStatusRegistry } from './statusAudit';

const audit = auditStatusRegistry(process.cwd());
const { markdown } = audit;

if (process.argv.includes('--calls')) {
  for (const row of audit.applications) console.log(`${row.at}\t${row.id}\t${row.carrier}\ttotalMs=${row.totalMs}`);
  console.log('\nDYNAMIC'); for (const row of audit.dynamic) console.log(JSON.stringify(row));
  console.log('\nDESCRIPTORS'); for (const [id, row] of audit.descriptors) console.log(`${id}\t${row.at}\t${row.reads.join(',')}`);
} else if (process.argv.includes('--json')) {
  console.log(JSON.stringify({
    rows: audit.rows, dynamic: audit.dynamic, unexplained: audit.unexplained, uiOnly: audit.uiOnly,
    bossRows: audit.bossRows, unproducedInputs: audit.unproducedInputs, unusedIconKeys: audit.unusedIconKeys,
    gaps: audit.gaps, accepted: audit.accepted, staleAcceptances: audit.staleAcceptances,
    descriptors: Object.fromEntries(audit.descriptors),
  }, null, 2));
} else {
  console.log(`# Extracted status coverage\n\n${audit.rows.length} runtime IDs/families; ${audit.descriptors.size} unique projected tile IDs; ${audit.gaps.length} open gaps; ${audit.accepted.length} accepted.\n`);
  console.log(audit.gapLines.join('\n'));
  console.log('\n## Accepted gaps (reviewed, with reasons)\n');
  console.log(audit.acceptedLines.join('\n'));
  if (audit.staleAcceptances.length) console.log(`\nSTALE ACCEPTANCES (no longer a gap; remove them): ${audit.staleAcceptances.join(' / ')}`);
  console.log('\n## Complete runtime registry\n\n| ID | Carries | Application sites (writer; authored source) | Player tile | Label | Help P/T | Target badge | Icon lookup | Tooltip | totalMs |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const row of audit.rows) console.log(`| \`${row.id}\` | ${row.side}${row.hidden ? ' (hidden from the target frame)' : ''} | ${markdown([...new Set(row.evidence.map((r) => r.at))].join('; '))} | ${row.tiles.join(', ') || '—'} | ${row.label} | ${row.help ? 'yes' : '—'}/${row.targetCopy ? 'yes' : '—'} | ${row.badge ? 'authored' : row.side === 'player' ? '—' : 'fallback'} | ${row.icons.join(', ') || 'fallback text'} | ${row.tooltip} | ${row.totalMs} |`);
  console.log('\n## Projected tile registry\n\n| Tile ID | Producer | Status inputs (otherwise resource/component/target selector) | Help | Icon lookup |\n| --- | --- | --- | --- | --- |');
  for (const [id, row] of [...audit.descriptors].sort(([a], [b]) => a.localeCompare(b))) console.log(`| \`${id}\` | ${row.at} | ${row.reads.join(', ') || 'derived state'} | ${audit.playerHelp(id) ? 'authored' : 'fallback'} | ${audit.iconPath(row.icon) || 'fallback text'} |`);
  console.log('\n## Boss effect and phase namespace\n\n| ID | Producer | Carries | Label/badge | Help | Icon alias | Tooltip |\n| --- | --- | --- | --- | --- | --- | --- |');
  for (const row of audit.bossRows) console.log(`| \`${row.id}\` | ${row.at.join('; ') || 'none found'} | monster | ${row.label ? 'authored' : 'fallback'} | ${row.help ? 'authored' : 'fallback'} | ${row.icon} | ${row.id === 'boss-phase' ? 'phase description' : 'generic builder'} |`);
  console.log('\n## Dynamic writer evidence\n\n| Source | ID expression | Config (excerpt) |\n| --- | --- | --- |');
  for (const row of audit.dynamic) console.log(`| ${row.at} | ${markdown(row.expression)} | ${markdown(row.config)} |`);
  if (audit.unexplained.length) { console.error(`UNRESOLVED: ${audit.unexplained.length} new dynamic ID expressions require review.`); process.exitCode = 2; }
}
