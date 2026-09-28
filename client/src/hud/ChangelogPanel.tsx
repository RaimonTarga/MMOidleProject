import { useState } from 'react';
import packageText from '../../../package.json?raw';
import { showReleaseAnnouncement } from './atoms';
import { RELEASES, loadReleaseNotes } from './releaseNotes';
import './releaseAnnouncement.css';

const version: string = JSON.parse(packageText).version;
const release = RELEASES.find(entry => entry.version === version);

export function ChangelogPanel({ onOpen }: { onOpen?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  if (!release) return null;
  const current = release;
  async function open() {
    setLoading(true);
    setError(false);
    try {
      const payload = await loadReleaseNotes(current);
      onOpen?.();
      showReleaseAnnouncement(payload);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }
  return (
    <aside className="changelog-panel" aria-label="Game updates">
      <strong>What's new · v{version}</strong>
      <span>{current.title}</span>
      <button type="button" onClick={open} disabled={loading}>
        {loading ? 'Loading…' : 'Read the changelog →'}
      </button>
      {error && <span role="alert">Could not load notes. Please try again.</span>}
    </aside>
  );
}
