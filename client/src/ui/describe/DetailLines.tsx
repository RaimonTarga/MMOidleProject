import { useHoverTooltip } from '../../hud/primitives';
import { atlasIcon, GameIcon } from '../GameIcon';
import type { DetailLine } from './index';
import './detailLines.css';

/**
 * The house style for "here is exactly what this does, with numbers".
 *
 * One row per effect: label, value, and — when the line carries prose or a
 * derivation — the same hover tooltip the character sheet uses. Every surface
 * that explains a thing (skill nodes, loadout slots, recipes) renders this, so
 * the player learns one reading grammar for the whole information layer.
 */

function DetailRow({ line }: { line: DetailLine }) {
  const { handlers, node } = useHoverTooltip(line.help);
  const classes = [
    'detail-line',
    line.help ? 'detail-line--help' : '',
    line.good === false ? 'detail-line--down' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...handlers}>
      {line.glyph && (
        <GameIcon
          source={atlasIcon(line.glyph)}
          size={14}
          fallback={null}
          className="detail-line__glyph"
          decorative
        />
      )}
      <span className="detail-line__label">{line.label}</span>
      <span className="detail-line__value">{line.value}</span>
      {line.detail && <span className="detail-line__detail">{line.detail}</span>}
      {node}
    </div>
  );
}

export function DetailLines({
  lines,
  title,
  className,
  empty,
}: {
  lines: readonly DetailLine[];
  /** Section heading, e.g. "Effects". Omit for an unlabelled block. */
  title?: string;
  className?: string;
  /** Shown instead of the list when there is nothing to report. */
  empty?: string;
}) {
  if (lines.length === 0) {
    return empty ? <div className="detail-lines__empty">{empty}</div> : null;
  }

  return (
    <div className={['detail-lines', className].filter(Boolean).join(' ')}>
      {title && <div className="detail-lines__title">{title}</div>}
      {lines.map((line) => <DetailRow key={line.key} line={line} />)}
    </div>
  );
}
