import assert from 'node:assert/strict';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const root = 'D:/mmo-idle/subsystem-patch-candidate-01';
const read = p => JSON.parse(readFileSync(p, 'utf8'));
const hash = p => createHash('sha256').update(readFileSync(p)).digest('hex');
const manifest = read(root + '/packet/manifest.json');
const identities = read(root + '/packet/identity.json');
const historical = read(join(here, 'historical-references.json'));
const qualified = read(root + '/qualification/resolved-builds.json');
const replay = read(root + '/receipt-check/resolved-builds.json');
assert.equal(manifest.cases.length, 24);
assert.equal(qualified.length, 24);
assert.deepEqual(replay, qualified);
for (const dir of ['qualification', 'receipt-check']) {
  const c = read(`${root}/${dir}/complete.json`);
  assert.equal(c.qualified, 24);
  assert.equal(c.combatObservations, 0);
  assert.equal(c.failure, null);
}
assert(!existsSync(root + '/run-01'));
assert(!existsSync(root + '/packet/run-launched.json'));
const comparisons = [], ownershipDifferences = [];
for (const c of manifest.cases) {
  const r = qualified.find(r => r.observationId === c.id);
  const ref = historical.find(h => h.originalCase.id === c.referenceObservationId);
  assert(ref, c.referenceObservationId);
  assert.equal(r.sourceCommit, identities[c.arm].sourceCommit);
  const actualBuild = structuredClone(r.ready.packageReadback);
  const historicalBuild = ref.receipt.ready.packageReadback;
  const extraOwned = actualBuild.progression.runesOwned.filter(id => !historicalBuild.progression.runesOwned.includes(id));
  if (extraOwned.length) {
    assert(c.id.includes('desert-flash'));
    assert.deepEqual(extraOwned, ['tactical-reload', 'wait-for-execution', 'wait-for-summons']);
    assert(c.runeRules.every(rule => !extraOwned.includes(rule.actionId)));
    ownershipDifferences.push({ observationId: c.id, addedUnequippedStarterRunes: extraOwned, source: 'develop ca90ec3f; shared by both arms' });
    actualBuild.progression.runesOwned = actualBuild.progression.runesOwned.filter(id => !extraOwned.includes(id));
  }
  assert.deepEqual(actualBuild, historicalBuild, `${c.id}: historical package changed`);
  const original = structuredClone(ref.originalCase), current = structuredClone(c);
  for (const x of [original, current]) {
    for (const key of ['id', 'block', 'arm', 'comparisonId', 'referenceObservationId', 'referenceSource', 'durationMs', 'preparationNotes']) delete x[key];
    delete x.build.id;
  }
  assert.deepEqual(current, original, `${c.id}: historical case changed`);
  const peer = qualified.find(r => r.observationId === c.id.replace('-candidate-', '-control-'));
  assert.deepEqual(r.ready.initialRoster, peer.ready.initialRoster, 'paired ecology drift');
  const passiveKeys = Object.keys({ ...r.ready.view.passives, ...peer.ready.view.passives });
  const allowed = new Set(['technique.power-pct', 'mobility.kite-speed-pct', 'mobility.slow-resistance']);
  for (const k of passiveKeys) if (!allowed.has(k)) assert.deepEqual(r.ready.view.passives[k], peer.ready.view.passives[k], `${c.id}: unrelated passive ${k}`);
  for (const k of ['speed', 'attack', 'maxHp', 'barrierMax', 'recovery', 'attackRange']) assert.deepEqual(r.ready.view[k], peer.ready.view[k], `${c.id}: unrelated stat ${k}`);
  if (c.arm === 'candidate') {
    const expected = c.block === 'A' ? ['technique.power-pct', .3] : c.block === 'B' ? ['mobility.kite-speed-pct', .3] : ['mobility.slow-resistance', c.id.includes('swamp-t2') ? .48 : .56];
    assert(Math.abs(r.ready.view.passives[expected[0]] - expected[1]) < 1e-12, `${c.id}: treatment missing`);
    comparisons.push({ observationId: c.id, referenceObservationId: c.referenceObservationId, passive: expected[0], control: peer.ready.view.passives[expected[0]], candidate: r.ready.view.passives[expected[0]], historicalEquippedBuildExact: true });
  }
}
for (const entry of read(join(here, 'reference-inventory.json'))) assert.equal(hash(entry.path), entry.sha256, 'historical reference drift');
const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
for (const identity of Object.values(identities)) assert.equal(git(identity.root, 'status', '--porcelain', '--untracked-files=no'), '');
const files = git(root + '/candidate', 'diff', '--name-only', identities.control.sourceCommit, identities.candidate.sourceCommit).split('\n');
assert.deepEqual(files.sort(), ['docs/rites-current-state.md', 'server/src/db/playerRepo.ts', 'server/src/systems/player/rites/riteOoc.ts', 'server/test/equippedEvolutionAbilityTags.test.ts', 'server/test/rites.test.ts', 'shared/src/data/recipes/desert.recipes.ts', 'shared/src/data/recipes/mountain.recipes.ts', 'shared/src/data/recipes/swamp.recipes.ts', 'shared/src/riteRecipes.ts', 'shared/src/rites.ts'].sort());
const result = { status: 'pass', qualified: 24, replayed: 24, freshCombatObservations: 0, historicalEquippedPackagesExact: 24, ownershipDifferences, candidateFiles: files, comparisons, qualifiedReceiptsSha256: hash(root + '/qualification/resolved-builds.json'), replayReceiptsSha256: hash(root + '/receipt-check/resolved-builds.json') };
writeFileSync(join(here, 'validation.json'), JSON.stringify(result, null, 2) + '\n');
console.log('24 historical equipped builds, documented starter ownership drift, source deltas, paired ecology, intended passives and receipt replay verified; zero combat.');
