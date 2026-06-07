import { readFileSync } from 'fs';
import path from 'path';
import type { ReleaseAnnouncementPayload } from '@mmo-idle/shared';
import { gameVersion } from '../analytics/version';

interface ReleaseManifest {
  releases?: ReleaseManifestEntry[];
}

interface ReleaseManifestEntry {
  version?: unknown;
  title?: unknown;
  releasedAt?: unknown;
  markdownPath?: unknown;
}

let cachedAnnouncement: ReleaseAnnouncementPayload | null | undefined;

export function currentReleaseAnnouncement(): ReleaseAnnouncementPayload | null {
  if (cachedAnnouncement !== undefined) return cachedAnnouncement;
  cachedAnnouncement = loadCurrentReleaseAnnouncement();
  return cachedAnnouncement;
}

function loadCurrentReleaseAnnouncement(): ReleaseAnnouncementPayload | null {
  const currentVersion = normalizeVersion(gameVersion());
  if (!currentVersion) return null;

  const root = repoRoot();
  for (const manifestPath of manifestCandidates(root)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as ReleaseManifest;
      const entry = manifest.releases?.find((candidate) =>
        normalizeVersion(candidate.version) === currentVersion
      );
      if (!entry) return null;

      const markdownPath = requireString(entry.markdownPath);
      const markdown = readFileSync(path.join(root, 'updates', markdownPath), 'utf8');
      return {
        version: requireString(entry.version),
        title: requireString(entry.title),
        releasedAt: requireNumber(entry.releasedAt),
        markdown,
      };
    } catch {
      // Try the next candidate; dev/prod __dirname layouts differ.
    }
  }

  return null;
}

function repoRoot(): string {
  return path.resolve(__dirname, '..', '..', '..');
}

function manifestCandidates(root: string): string[] {
  return [
    path.join(root, 'updates', 'releases.json'),
    path.resolve(process.cwd(), 'updates', 'releases.json'),
    path.resolve(process.cwd(), '..', 'updates', 'releases.json'),
  ];
}

function normalizeVersion(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^v/i, '');
}

function requireString(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('release manifest contains an invalid string field');
  }
  return value.trim();
}

function requireNumber(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('release manifest contains an invalid releasedAt field');
  }
  return value;
}
