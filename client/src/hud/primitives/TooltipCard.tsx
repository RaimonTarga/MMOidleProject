import type { ReactNode } from 'react';
import './tooltipCard.css';

/**
 * The structured form of a HUD tooltip.
 *
 * `useHoverTooltip` already handles *where* a tooltip goes; this handles *what is
 * in it*. Everything the combat HUD explains has the same three parts — what the
 * thing is, what the mechanic does in general, and what it is doing to you right
 * now — and a player should only have to learn that reading order once.
 *
 * The CURRENT block is deliberately its own section rather than prose woven into
 * the explanation: static copy is authored once and never changes, while those
 * values are resolved this tick and are the reason the player hovered at all.
 * They are styled distinctly for the same reason — bold, in a live-value accent,
 * never underlined (which reads as clickable) and never coloured only by
 * good/bad, since "is this live" and "is this good for me" are separate
 * questions and one hue cannot answer both.
 */

export interface TooltipRow {
  key: string;
  label: string;
  value: string;
  /** Qualifier that belongs to the value, e.g. "every 8s". */
  detail?: string;
  /** False marks a downside; omit for neutral. Tone only — never the live cue. */
  good?: boolean;
}

export interface TooltipCardContent {
  /** The thing's name, e.g. "Sweep III" or "Frost". */
  title: string;
  /** What kind of thing it is, e.g. "Technique", "Debuff · Monster". */
  kicker?: string;
  /** The static mechanic explanation. Authored once, never sent per tick. */
  body?: string;
  /** Authored/static numbers for this rank or effect. */
  rows?: TooltipRow[];
  /** Optional heading for the static rows, when they need naming. */
  rowsTitle?: string;
  /** Resolved values applying right now. Rendered under a CURRENT heading. */
  current?: TooltipRow[];
  /** Trailing note, e.g. a caveat or a source. */
  footnote?: string;
}

function Rows({ rows, live }: { rows: readonly TooltipRow[]; live: boolean }) {
  return (
    <>
      {rows.map((row) => (
        <div
          key={row.key}
          className={`tip-row${row.good === false ? ' tip-row--down' : ''}`}
        >
          <span className="tip-row__label">{row.label}</span>
          <span className={live ? 'tip-row__value tip-row__value--live' : 'tip-row__value'}>
            {row.value}
            {row.detail && <span className="tip-row__detail"> {row.detail}</span>}
          </span>
        </div>
      ))}
    </>
  );
}

export function TooltipCard({ content }: { content: TooltipCardContent }): ReactNode {
  const { title, kicker, body, rows, rowsTitle, current, footnote } = content;
  return (
    <div className="tip-card">
      <div className="tip-card__title">{title}</div>
      {kicker && <div className="tip-card__kicker">{kicker}</div>}
      {body && <p className="tip-card__body">{body}</p>}
      {rows && rows.length > 0 && (
        <div className="tip-card__section">
          {rowsTitle && <div className="tip-card__heading">{rowsTitle}</div>}
          <Rows rows={rows} live={false} />
        </div>
      )}
      {current && current.length > 0 && (
        <div className="tip-card__section tip-card__section--live">
          <div className="tip-card__heading tip-card__heading--live">Current</div>
          <Rows rows={current} live />
        </div>
      )}
      {footnote && <p className="tip-card__footnote">{footnote}</p>}
    </div>
  );
}
