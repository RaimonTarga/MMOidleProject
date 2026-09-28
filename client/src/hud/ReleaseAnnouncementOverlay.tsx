import { useState } from 'react';
import { useAtomValue } from 'jotai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clearReleaseAnnouncement, releaseAnnouncementAtom, showReleaseAnnouncement } from './atoms';
import { RELEASES, loadReleaseNotes, type ReleaseEntry } from './releaseNotes';
import './releaseAnnouncement.css';

function formatReleaseDate(ms: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(ms));
}

export function ReleaseAnnouncementOverlay() {
  const announcement = useAtomValue(releaseAnnouncementAtom);
  const [paging, setPaging] = useState(false);
  if (!announcement) return null;

  // One page per release, newest first; the window opens on whichever it was given.
  const index = RELEASES.findIndex((entry) => entry.version === announcement.version);
  const older = index >= 0 ? RELEASES[index + 1] : undefined;
  const newer = index > 0 ? RELEASES[index - 1] : undefined;
  async function turnTo(entry: ReleaseEntry) {
    setPaging(true);
    try {
      showReleaseAnnouncement(await loadReleaseNotes(entry));
    } catch {
      // Keep the current page; the button stays available to retry.
    } finally {
      setPaging(false);
    }
  }

  return (
    <div
      className="release-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="release-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) clearReleaseAnnouncement();
      }}
    >
      <article className="release-card">
        <button
          type="button"
          className="release-card__close"
          aria-label="Close release notes"
          onClick={() => clearReleaseAnnouncement()}
        >
          x
        </button>

        <header className="release-card__header">
          <div className="release-card__eyebrow">Game Update</div>
          <h1 id="release-title">{announcement.title}</h1>
          <div className="release-card__meta">
            v{announcement.version} | {formatReleaseDate(announcement.releasedAt)}
          </div>
        </header>

        <div className="release-card__markdown" key={announcement.version}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {announcement.markdown}
          </ReactMarkdown>
        </div>

        <footer className="release-card__footer">
          <nav className="release-card__pager" aria-label="Older and newer release notes">
            {older && (
              <button type="button" className="release-card__page" disabled={paging}
                onClick={() => void turnTo(older)}>
                ‹ v{older.version}
              </button>
            )}
            {newer && (
              <button type="button" className="release-card__page" disabled={paging}
                onClick={() => void turnTo(newer)}>
                v{newer.version} ›
              </button>
            )}
          </nav>
          <button
            type="button"
            className="release-card__primary"
            onClick={() => clearReleaseAnnouncement()}
          >
            CONTINUE
          </button>
        </footer>
      </article>
    </div>
  );
}
