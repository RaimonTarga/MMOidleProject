import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { currentReleaseAnnouncement } from '../src/updates/releaseAnnouncements';

process.env.RAILWAY_GIT_COMMIT_SHA = '0123456789abcdef0123456789abcdef01234567';
process.env.GAME_VERSION = 'telemetry-cohort-build';
const root = path.resolve(__dirname, '../..');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(path.join(root, 'updates/releases.json'), 'utf8'));
const entry = manifest.releases.find((release: { version: string }) => release.version === pkg.version);
assert(entry, 'shipped package must have a release manifest entry');
const announcement = currentReleaseAnnouncement();
assert(announcement, 'Railway SHA and telemetry override must not suppress release notes');
assert.equal(announcement.version, pkg.version);
assert.equal(announcement.markdown, readFileSync(path.join(root, 'updates', entry.markdownPath), 'utf8'));
console.log('releaseAnnouncements.test.ts: ok');
