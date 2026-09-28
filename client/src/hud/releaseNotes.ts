import type { ReleaseAnnouncementPayload } from '@mmo-idle/shared';
import manifestText from '../../../updates/releases.json?raw';

export interface ReleaseEntry {
  version: string; title: string; releasedAt: number; markdownPath: string;
}

/** Every published release, newest first: one page each in the notes window. */
export const RELEASES: readonly ReleaseEntry[] = (JSON.parse(manifestText).releases as ReleaseEntry[])
  .slice()
  .sort((a, b) => b.releasedAt - a.releasedAt);

// Each version's notes are a separate lazy chunk: an older page downloads only when opened.
const notes = import.meta.glob('../../../updates/v*/changelog.md', { query: '?raw', import: 'default' });

export async function loadReleaseNotes(entry: ReleaseEntry): Promise<ReleaseAnnouncementPayload> {
  const load = notes[`../../../updates/${entry.markdownPath}`];
  if (!load) throw new Error(`No notes for v${entry.version}`);
  const markdown = await load() as string;
  return { version: entry.version, title: entry.title, releasedAt: entry.releasedAt, markdown };
}
