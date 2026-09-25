/** Read-only source/input audit. Never starts a World, bot, Docker service or experiment. */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { GAME_CONFIG, NODE_BIOMES, NODE_MODIFIERS, NATIVE_MODIFIER,
  modifierRewardMult, modifierSpawnFactor, RECIPE_DATABASE, catalystProgressRewardMult,
  tierEntryProfileFromT1Snapshot } from '@mmo-idle/shared';
import { ROUTES } from '../routes/index';
import { validateProfile } from '../tierEntry/validate';

const repo = resolve(__dirname, '../../..');
const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const i = a.indexOf('=');
  if (!a.startsWith('--') || i < 0) throw new Error('Use --key=value arguments');
  return [a.slice(2, i), a.slice(i + 1)];
}));
const out = resolve(args.out ?? join(repo, 'reports/economy-baseline-campaign-01-preparation'));
const roots = (args.snapshotRoots ?? join(process.env.LOCALAPPDATA ?? '', 'mmo-idle/experiments')).split(';').map(p => resolve(p));
const git = (...argv: string[]) => execFileSync('git', argv, { cwd: repo, encoding: 'utf8' }).trim();
const hash = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');
const write = (name: string, value: unknown) => writeFileSync(join(out, name), JSON.stringify(value, null, 2) + '\n');
mkdirSync(out, { recursive: true });
const source = { revision: git('rev-parse', 'HEAD'), tree: git('rev-parse', 'HEAD^{tree}'),
  branch: git('branch', '--show-current'), referenceRevision: 'ff98ba4513cb9fcb1e5752acfd56495268aff416' };
if (source.revision !== source.referenceRevision) throw new Error('Baseline drift: review the packet before refreshing against another revision');
const gameplayDrift = git('diff', '--name-only', 'HEAD', '--', 'shared/src', 'server/src',
  'bot/src/routes', 'bot/src/tierEntry', 'bot/src/loadout');
if (gameplayDrift) throw new Error(`Uncommitted authority changes: ${gameplayDrift}`);
const actors = [
  { id: 'striker', root: 'cadence-root', frame: 'cadence-balanced' },
  { id: 'squire', root: 'cooldown-root', frame: 'cooldown-heavy' },
  { id: 'apprentice', root: 'dot-root', frame: 'dot-balanced' },
  { id: 'conduit', root: 'summoner-root', frame: 'summoner-balanced' },
];
const nodes = Object.entries(NODE_BIOMES)
  .filter(([, n]) => n.kind === 'normal' && n.biomeTier >= 1 && n.biomeTier <= 4)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([nodeId, n]) => {
    const modifier = NODE_MODIFIERS[nodeId]?.modifier;
    return { nodeId, biome: n.biomeGroup, contentTier: n.biomeTier, modifier,
      native: modifier === NATIVE_MODIFIER[n.biomeGroup],
      rewardPremium: modifierRewardMult(modifier, n.biomeTier),
      authoredMobDensity: n.mobDensity ?? null, spawnFactor: modifierSpawnFactor(modifier, n.biomeTier),
      reachability: 'requires-entry-state-travel-check' };
  });
const selectedRoutes = actors.flatMap(a => [1, 2].map(t => {
  const id = `${a.id}-t${t}${t === 2 ? '-mid' : ''}`;
  const route = ROUTES.get(id);
  if (!route || route.classRoot !== a.root || route.frameId !== a.frame) throw new Error(`Route identity mismatch: ${id}`);
  return route;
}));
write('route-authorities.json', selectedRoutes);
write('later-tier-route-inventory.json', [...ROUTES.values()].filter(r =>
  (r.startsFromTierEntry ?? r.progressionEntry?.tier ?? 0) >= 3));
write('node-inventory.json', nodes);
write('recipe-demand-catalogue.json', [...RECIPE_DATABASE.values()].filter(r => r.tier >= 1 && r.tier <= 4));

const paths: string[] = [];
function scan(dir: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', '.build', 'source', 'dist'].includes(entry.name)) scan(path);
    } else if (entry.name === 'snapshot-b.json' ||
      (/^checkpoint-.*\.json$/.test(entry.name) && entry.name !== 'checkpoint-restore.json')) paths.push(path);
  }
}
for (const root of roots) if (existsSync(root)) scan(root);
const snapshots = paths.sort().map(path => {
  const bytes = readFileSync(path);
  try {
    const s = JSON.parse(bytes.toString('utf8'));
    const tier = s.state?.playerTier ?? s.progressionCheckpoint?.view?.playerTier ?? null;
    const rewardMultiplier = s.economy?.rewardMultiplier ?? s.progressionCheckpoint?.rewardMultiplier ?? null;
    const taints = s.sourceTaints ?? [];
    return { path, sha256: hash(bytes), snapshotId: s.snapshotId ?? null,
      kind: s.snapshotKind ?? null, boundaryId: s.progressionCheckpoint?.boundaryId ?? null,
      tier, classRoot: s.classRoot ?? null, frameId: s.frameId ?? null,
      routeId: s.routeId ?? null, policyId: s.policyId ?? null, revision: s.gitRevision ?? null,
      canonicalAtCapture: s.canonicalAtCapture ?? null, rewardMultiplier, sourceTaints: taints,
      hasInheritedProvenance: s.inheritedProvenance != null,
      // A provenance candidate is NOT approved: schema/current-definition/readback validation still required.
      candidateOnly: s.canonicalAtCapture === true && rewardMultiplier === 1 && taints.length === 0,
      accepted: false, disposition: 'unselected-input-requires-lineage-and-current-definition-validation' };
  } catch (error) {
    return { path, sha256: hash(bytes), candidateOnly: false, accepted: false,
      disposition: `unreadable:${String(error)}` };
  }
});
write('snapshot-inventory.json', { searchedRoots: roots, missingRoots: roots.filter(r => !existsSync(r)),
  excludes: ['node_modules', '.git', '.build', 'source', 'dist', 'symlinks'], snapshots });

// Fixed historical cohort/order, never choose a stronger or richer snapshot from outcomes.
const t2Inputs = actors.flatMap(a => [1, 2].map(replica => {
  const matches = snapshots.filter(s => s.candidateOnly && 'classRoot' in s && s.classRoot === a.root &&
    s.frameId === a.frame && s.path.includes('20260905t150415z-t1-final-economy-2026-09-05') &&
    s.path.includes(`${a.id}-t1-intended-r0${replica}`));
  if (matches.length !== 1) return { actor: a.id, replica, accepted: false, error: `Expected exactly one input, found ${matches.length}` };
  const input = matches[0];
  try {
    const snapshot = JSON.parse(readFileSync(input.path, 'utf8'));
    const profile = tierEntryProfileFromT1Snapshot(snapshot);
    const validation = validateProfile(profile);
    return { actor: a.id, replica, input, validation, wallet: profile.wallet,
      accepted: false, disposition: 'historical-predeclared-candidate-only-live-restore-and-lineage-not-qualified' };
  } catch (error) { return { actor: a.id, replica, input, accepted: false, error: String(error) }; }
}));
write('t2-input-validation.json', t2Inputs);

const pacing = [1, 2, 3, 4].flatMap(tier => actors.flatMap(a => [1, 2].map(replica => ({
  id: `P-T${tier}-${a.id}-r${replica}`, tier, actor: a.id, classRoot: a.root,
  frame: tier <= 2 ? a.frame : null, requestedLineage: a.frame,
  replica, exposure: 'fresh-independent-world-not-seeded', seed: null,
  routeId: tier <= 2 ? `${a.id}-t${tier}${tier === 2 ? '-mid' : ''}` : null,
  snapshotPath: null, snapshotSha256: null,
  inputCandidates: [...new Set(snapshots.filter(s => s.candidateOnly && 'tier' in s && s.tier === tier &&
    s.classRoot === a.root && s.frameId === a.frame).map(s => s.sha256))],
  capSimulatedMs: 24 * 60 * 60 * 1000, timeScale: 1, rewardMultiplier: 1,
  status: 'not-run', readyToLaunch: false,
  blockers: tier === 1 ? ['offline-route-validation', 'milestone-and-telemetry-qualification'] : tier === 2
    ? ['designated-snapshot-and-current-validation', 'offline-route-validation', 'milestone-and-telemetry-qualification']
    : ['canonical-entry-input-not-designated', 'complete-route-and-terminal-authority-unresolved', 'restore-economy-eligibility-contract'],
}))));
const rates = [1, 2, 3, 4].flatMap(playerTier => actors.flatMap(a => nodes
  .filter(n => n.contentTier <= playerTier).map(n => ({
    id: `R1-T${playerTier}-${a.id}-${n.nodeId}`, playerTier, actor: a.id,
    classRoot: a.root, requestedLineage: a.frame, nodeId: n.nodeId, contentTier: n.contentTier,
    biome: n.biome, modifier: n.modifier, snapshotPath: null, snapshotSha256: null,
    durationSimulatedMs: 20 * 60 * 1000, timeScale: 1, rewardMultiplier: 1,
    purchases: false, status: 'not-run', readyToLaunch: false,
    blockers: ['exact-entry-snapshot', 'fixed-profile-rate-adapter', 'reachability-and-ledger-qualification'],
  }))));
write('pacing-matrix.json', pacing);
write('rate-matrix.json', rates);
write('campaign.json', {
  schemaVersion: 1, id: 'economy-baseline-campaign-01', status: 'prepared-unsealed-not-launchable',
  source, sourceDrift: false, authorizedScope: 'preparation-only', launched: false,
  actors, pacingLives: pacing.length, rateCells: rates.length,
  normalNodes: nodes.length, snapshotFilesInspected: snapshots.length,
  provenanceCandidates: snapshots.filter(s => s.candidateOnly).length,
  rewardFacts: { biomeXp: GAME_CONFIG.BIOME_XP_REWARD_MULT_BY_TIER.slice(1, 5),
    essence: GAME_CONFIG.BIOME_ESSENCE_TIER_MULT.slice(1, 5), catalystThreshold: GAME_CONFIG.CATALYST_PROGRESS_PER_UNIT,
    catalystTierMultipliers: [1, 2, 3, 4].map(catalystProgressRewardMult) },
  pacingTargets: null, pacingVerdict: 'unset-awaiting-product-targets',
  confirmation: { durationSimulatedMs: 3600000, timeScale: 1, red: 'all',
    yellowPairsMaximum: 8, yellowSelection: 'largest death-rate reduction first; tie by ratio descending then cell id',
    zeroDenominator: 'positive/zero = red unbounded; zero/zero = uninformative; missing = unavailable',
    deduplicate: 'exact profile/input-hash/lower-node/current-node; union metric reasons', automaticLaunch: false },
  infrastructure: { defaultGlobalWorkers: 2, qualifiedCeiling: 4,
    strictFiveWayParallelLaunchSupported: false, requiresSchedulingResolution: true },
});
const files = ['campaign.json', 'route-authorities.json', 'later-tier-route-inventory.json', 'node-inventory.json',
  'recipe-demand-catalogue.json', 'snapshot-inventory.json', 'pacing-matrix.json', 'rate-matrix.json', 't2-input-validation.json'];
write('preparation-hashes.json', { scope: 'preparation-artifacts-only-not-an-execution-seal',
  files: files.map(file => ({ file, sha256: hash(readFileSync(join(out, file))) })) });
console.log(JSON.stringify({ out, source: source.revision, pacingLives: pacing.length, rateCells: rates.length,
  snapshots: snapshots.length, candidates: snapshots.filter(s => s.candidateOnly).length, launched: false }));
