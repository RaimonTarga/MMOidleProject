import { useAtomValue } from 'jotai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clearReleaseAnnouncement, releaseAnnouncementAtom } from './atoms';
import './releaseAnnouncement.css';

function formatReleaseDate(ms: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(ms));
}

export function ReleaseAnnouncementOverlay() {
  const announcement = useAtomValue(releaseAnnouncementAtom);
  if (!announcement) return null;

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

        <div className="release-card__markdown">
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
