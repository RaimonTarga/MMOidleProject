import type { ReactNode } from "react";
import "./primitives.css";

export interface DisclosureHeaderProps {
  title: ReactNode;
  summary?: ReactNode;
  expanded: boolean;
  controls?: string;
  className?: string;
  onToggle: () => void;
}

/** Accessible disclosure trigger with a stable title/summary/chevron layout. */
export function DisclosureHeader({
  title,
  summary,
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
