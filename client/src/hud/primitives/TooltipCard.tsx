import type { ReactNode } from 'react';
import type { AbilityTag } from '@mmo-idle/shared';
import { AbilityTags } from '../../ui/AbilityTags';
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
  tags?: AbilityTag[];
  equipment?: TooltipRow[];
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
  /** Class execution adapters; absent when the normal ability path is used. */
  classSpecific?: TooltipRow[];
  /** Resolved values applying right now. Rendered under a CURRENT heading. */
  current?: TooltipRow[];
  /** Trailing note, e.g. a caveat or a source. */
  footnote?: string;
  /**
   * Set when the card describes something that is no longer live, e.g. a buff
   * that ended while its card was open: a banner names what happened, and the
   * CURRENT block is shown as the last known state instead of a live one.
   */
  ended?: { label: string; note: string; tone?: 'cleansed' };
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
  const { title, kicker, body, rows, rowsTitle, classSpecific, current, footnote, ended } = content;
  return (
    <div className={`tip-card${ended ? ' tip-card--ended' : ''}`}>
      {ended && (
        <div className={`tip-card__ended${ended.tone ? ` tip-card__ended--${ended.tone}` : ''}`}>
          <span className="tip-card__ended-label">{ended.label}</span>
          <span className="tip-card__ended-note">{ended.note}</span>
        </div>
      )}
      <div className="tip-card__title">{title}</div>
      {kicker && <div className="tip-card__kicker">{kicker}</div>}
      {content.tags && <AbilityTags tags={content.tags} />}
      {body && <p className="tip-card__body">{body}</p>}
      {rows && rows.length > 0 && (
        <div className="tip-card__section">
          {rowsTitle && <div className="tip-card__heading">{rowsTitle}</div>}
          <Rows rows={rows} live={false} />
        </div>
      )}
      {classSpecific && classSpecific.length > 0 && (
        <div className="tip-card__section tip-card__section--class-specific">
          <div className="tip-card__heading">Class-specific</div>
          <Rows rows={classSpecific} live={false} />
        </div>
      )}
      {current && current.length > 0 && (
        <div className="tip-card__section tip-card__section--live">
          <div className="tip-card__heading tip-card__heading--live">{ended ? 'Last known' : 'Current'}</div>
          <Rows rows={current} live={!ended} />
        </div>
      )}
      {!!content.equipment?.length && <div className="tip-card__section tip-card__section--equipment">
        <div className="tip-card__heading">Equipment bonuses</div>
        <Rows rows={content.equipment} live={false} />
        <p className="tip-card__footnote">Shown values include bonuses and caps. Kill refunds apply when triggered.</p>
      </div>}
      {footnote && <p className="tip-card__footnote">{footnote}</p>}
    </div>
  );
}
