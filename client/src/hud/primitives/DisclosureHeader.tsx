import type { ReactNode } from "react";
import "./primitives.css";

export interface DisclosureHeaderProps {
  title: ReactNode;
  /**
   * A short *readout* shown beside the title — "3 nearby", "18/40". Not a place
   * for instructions: the chevron and `aria-expanded` already say the section
   * opens, so copy like "See detailed stats" is the §15 de-texting rule's
   * example of prose to delete rather than shrink.
   */
  summary?: ReactNode;
  /** Overrides the accessible name when the visible title is not enough. */
  label?: string;
  expanded: boolean;
  controls?: string;
  className?: string;
  onToggle: () => void;
}

/** Accessible disclosure trigger with a stable title/summary/chevron layout. */
export function DisclosureHeader({
  title,
  summary,
  label,
  expanded,
  controls,
  className = "",
  onToggle,
}: DisclosureHeaderProps) {
  const classes = [
    "disclosure-header",
    expanded && "disclosure-header--expanded",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={classes}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-label={label}
      onClick={onToggle}
    >
      <span className="disclosure-header__title">{title}</span>
      <span className="disclosure-header__summary">
        {summary && <span>{summary}</span>}
        <span className="disclosure-header__chevron" aria-hidden="true">
          {expanded ? "▼" : "▶"}
        </span>
      </span>
    </button>
  );
}
