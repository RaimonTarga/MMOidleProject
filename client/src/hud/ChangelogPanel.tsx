import { useState } from 'react';
import manifestText from '../../../updates/releases.json?raw';
import packageText from '../../../package.json?raw';
import { showReleaseAnnouncement } from './atoms';
import './releaseAnnouncement.css';

const version: string = JSON.parse(packageText).version;
const release = (JSON.parse(manifestText).releases as {
  version: string; title: string; releasedAt: number; markdownPath: string;
}[]).find(entry => entry.version === version);
const notes = import.meta.glob('../../../updates/v*/changelog.md', { query: '?raw', import: 'default' });

export function ChangelogPanel({ mobile = false }: { mobile?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  if (!release) return null;
  const current = release;
  async function open() {
    setLoading(true);
    setError(false);
    try {
      const markdown = await notes[`../../../updates/${current.markdownPath}`]() as string;
      showReleaseAnnouncement({ ...current, markdown });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }
  return (
    <aside className={`changelog-panel${mobile ? ' changelog-panel--mobile' : ''}`} aria-label="Game updates">
      <strong>What's new · v{version}</strong>
      <span>{current.title}</span>
      <button type="button" onClick={open} disabled={loading}>
        {loading ? 'Loading…' : 'Read the changelog →'}
      </button>
      {error && <span role="alert">Could not load notes. Please try again.</span>}
    </aside>
  );
}
