#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const DEVELOPMENT_BRANCH = 'develop';
const PRODUCTION_BRANCH = 'master';
const RELEASE_BRANCH_PREFIX = 'release-v';
const RELEASE_PATHS = [
  'package.json',
  'client/package.json',
  'admin/package.json',
  'server/package.json',
  'shared/package.json',
  'pnpm-lock.yaml',
  'updates/releases.json',
];

function main() {
  const [command, versionArg, ...rawFlags] = process.argv.slice(2);
  const flags = new Set(rawFlags);

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  const version = normalizeVersion(versionArg);
  if (!version) {
    fail('Expected a major.minor version like 1.2.');
  }

  if (command === 'prepare') {
    prepareRelease(version, flags);
    return;
  }
  if (command === 'cut') {
    cutRelease(version, flags);
    return;
  }

  fail(`Unknown command: ${command}`);
}

function prepareRelease(version, flags) {
  requireBranch(DEVELOPMENT_BRANCH);
  const dryRun = flags.has('--dry-run');
  const releaseBranch = `${RELEASE_BRANCH_PREFIX}${version}`;
  ensureReleaseBranchAvailable(releaseBranch);

  const releasedAt = Date.now();
  const title = `Release ${version}`;
  const markdownPath = `v${version}/changelog.md`;
  const changelog = buildChangelog(version, releasedAt);

  if (dryRun) {
    console.log(`[release] dry run for ${releaseBranch}`);
    console.log(changelog);
    return;
  }

  updatePackageVersions(version);
  updateReleaseManifest({ version, title, releasedAt, markdownPath });
  const changelogDir = path.join(ROOT, 'updates', `v${version}`);
  mkdirSync(changelogDir, { recursive: true });
  writeFileSync(path.join(changelogDir, 'changelog.md'), changelog);

  console.log(`[release] prepared ${releaseBranch}`);
  console.log(`[release] edit updates/v${version}/changelog.md, then run pnpm release:cut ${version}`);
}

function cutRelease(version, flags) {
  requireBranch(DEVELOPMENT_BRANCH);
  const releaseBranch = `${RELEASE_BRANCH_PREFIX}${version}`;
  ensureReleaseBranchAvailable(releaseBranch);
  ensureNoUnrelatedChanges(version);

  if (!flags.has('--skip-checks')) {
    const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
    run(pnpm, ['typecheck'], { stdio: 'inherit' });
  }

  commitReleaseChanges(version);

  ensureProductionCanFastForward();
  run('git', ['branch', releaseBranch, 'HEAD']);
  run('git', ['branch', '-f', PRODUCTION_BRANCH, 'HEAD']);
  run('git', ['push', 'origin', DEVELOPMENT_BRANCH], { stdio: 'inherit' });
  run('git', ['push', 'origin', releaseBranch], { stdio: 'inherit' });
  run('git', ['push', 'origin', PRODUCTION_BRANCH], { stdio: 'inherit' });

  console.log(`[release] cut ${releaseBranch} and advanced ${PRODUCTION_BRANCH}`);
}

function buildChangelog(version, releasedAt) {
  const previousRef = resolvePreviousReleaseRef();
  const range = previousRef ? `${previousRef}..HEAD` : 'HEAD';
  const commits = gitLog(range);
  const date = new Date(releasedAt).toISOString().slice(0, 10);
  const previousLabel = previousRef ?? 'project start';

  const changeLines = commits.length > 0
    ? commits.map((commit) => `- ${commit.subject} (${commit.hash})`).join('\n')
    : '- No commits found in this release range.';

  return `# v${version} - ${date}

## Highlights

- TODO: Summarize the player-facing changes in this release.

## Changes since ${previousLabel}

${changeLines}

## Technical changelog

- TODO: Add any deploy, migration, balance, or ops notes reviewers should know.

## Validation

- TODO: Add the checks run for this release.
`;
}

function updatePackageVersions(version) {
  for (const file of RELEASE_PATHS.filter((entry) => entry.endsWith('package.json'))) {
    const fullPath = path.join(ROOT, file);
    const json = JSON.parse(readFileSync(fullPath, 'utf8'));
    json.version = version;
    writeJson(fullPath, json);
  }
}

function updateReleaseManifest(nextRelease) {
  const manifestPath = path.join(ROOT, 'updates', 'releases.json');
  const manifest = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, 'utf8'))
    : { releases: [] };
  const releases = Array.isArray(manifest.releases) ? manifest.releases : [];
  if (releases.some((release) => normalizeVersion(release.version) === nextRelease.version)) {
    fail(`updates/releases.json already contains ${nextRelease.version}.`);
  }
  releases.push(nextRelease);
  releases.sort((a, b) => String(a.version).localeCompare(String(b.version), undefined, { numeric: true }));
  writeJson(manifestPath, { releases });
}

function commitReleaseChanges(version) {
  const changedReleasePaths = statusReleasePaths();
  if (changedReleasePaths.length === 0) {
    console.log('[release] no release metadata changes to commit');
    return;
  }

  run('git', ['add', ...changedReleasePaths]);
  run('git', [
    'commit',
    '-m',
    `Prepare release v${version}`,
  ], { stdio: 'inherit' });
}

function ensureNoUnrelatedChanges(version) {
  const allowed = new Set([
    ...RELEASE_PATHS,
    `updates/v${version}/changelog.md`,
  ]);
  const allowedDir = `updates/v${version}/`;
  // Split into lines without trimming: porcelain prefixes each path with a
  // 2-char status field + space, and a leading-space status (e.g. " M path")
  // would lose its first path character to a whole-output .trim().
  const lines = git(['status', '--porcelain'])
    .split(/\r?\n/)
    .filter((line) => line.length > 0);
  if (lines.length === 0) return;

  const unrelated = lines
    .map((line) => line.slice(3))
    .filter((file) => !allowed.has(file) && !file.startsWith(allowedDir));
  if (unrelated.length > 0) {
    fail(`Unrelated working tree changes present:\n${unrelated.map((file) => `  - ${file}`).join('\n')}`);
  }
}

function statusReleasePaths() {
  return git(['status', '--porcelain', '--', ...RELEASE_PATHS, 'updates'])
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map((line) => line.slice(3));
}

function ensureReleaseBranchAvailable(branch) {
  if (refExists(branch) || refExists(`origin/${branch}`)) {
    fail(`${branch} already exists.`);
  }
}

function ensureProductionCanFastForward() {
  const productionRef = refExists(`origin/${PRODUCTION_BRANCH}`)
    ? `origin/${PRODUCTION_BRANCH}`
    : refExists(PRODUCTION_BRANCH)
      ? PRODUCTION_BRANCH
      : null;
  if (!productionRef) {
    fail(`${PRODUCTION_BRANCH} branch not found. Create it before cutting a release.`);
  }
  if (commandStatus('git', ['merge-base', '--is-ancestor', productionRef, 'HEAD']) !== 0) {
    fail(`${PRODUCTION_BRANCH} cannot fast-forward to HEAD. Merge or rebase ${DEVELOPMENT_BRANCH} onto ${PRODUCTION_BRANCH} before cutting the release.`);
  }
}

function resolvePreviousReleaseRef() {
  if (refExists(`origin/${PRODUCTION_BRANCH}`)) return `origin/${PRODUCTION_BRANCH}`;
  if (refExists(PRODUCTION_BRANCH)) return PRODUCTION_BRANCH;
  const refs = git(['for-each-ref', '--format=%(refname:short)', 'refs/heads', 'refs/remotes/origin'])
    .split('\n')
    .map((ref) => ref.trim())
    .filter(Boolean)
    .filter((ref) => /(^|\/)release-v\d+\.\d+$/.test(ref));
  refs.sort(compareReleaseRefs);
  return refs.at(-1) ?? null;
}

function compareReleaseRefs(a, b) {
  const av = versionParts(a.replace(/^origin\//, '').replace(RELEASE_BRANCH_PREFIX, ''));
  const bv = versionParts(b.replace(/^origin\//, '').replace(RELEASE_BRANCH_PREFIX, ''));
  for (let i = 0; i < 2; i++) {
    if (av[i] !== bv[i]) return av[i] - bv[i];
  }
  return a.localeCompare(b);
}

function gitLog(range) {
  const output = git(['log', '--no-merges', '--format=%h%x09%s', range]).trim();
  if (!output) return [];
  return output.split('\n').map((line) => {
    const [hash, ...subjectParts] = line.split('\t');
    return { hash, subject: subjectParts.join('\t') };
  });
}

function requireBranch(expected) {
  const current = git(['branch', '--show-current']).trim();
  if (current !== expected) {
    fail(`Release commands must run on ${expected}; current branch is ${current || '(detached)'}.`);
  }
}

function refExists(ref) {
  return commandStatus('git', ['rev-parse', '--verify', '--quiet', ref]) === 0;
}

function git(args) {
  return run('git', args).toString('utf8');
}

function run(command, args, options = {}) {
  try {
    return execFileSync(command, args, {
      cwd: ROOT,
      stdio: options.stdio ?? 'pipe',
    });
  } catch (error) {
    if (options.allowFailure && typeof error.status === 'number') {
      return error.status;
    }
    throw error;
  }
}

function commandStatus(command, args) {
  try {
    execFileSync(command, args, {
      cwd: ROOT,
      stdio: 'ignore',
    });
    return 0;
  } catch (error) {
    return typeof error.status === 'number' ? error.status : 1;
  }
}

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeVersion(value) {
  if (typeof value !== 'string') return null;
  const version = value.trim().replace(/^v/i, '');
  return /^\d+\.\d+$/.test(version) ? version : null;
}

function versionParts(version) {
  return version.split('.').map((part) => Number(part));
}

function printHelp() {
  console.log(`Usage:
  pnpm release:prepare 1.2 [--dry-run]
  pnpm release:cut 1.2 [--skip-checks]

Branch model:
  develop              in-flight work for the next release
  master               production branch Railway deploys
  release-vX.Y         immutable release snapshot
`);
}

function fail(message) {
  console.error(`[release] ${message}`);
  process.exit(1);
}

main();
