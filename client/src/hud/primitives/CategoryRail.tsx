import type { ReactNode } from 'react';
import './categoryRail.css';

export interface CategoryRailItem {
  key: string;
  /** The category name, with any glyph or badge. */
  label: ReactNode;
  /** One line of state under the name: counts, what is equipped. */
  detail?: ReactNode;
  /** Draw a separator above this item (e.g. gear above, skills below). */
  divider?: boolean;
  /** Extra attributes for per-category styling hooks. */
  dataSlot?: string;
}

export interface CategoryRailProps {
  /** Accessible name for the rail. */
  label: string;
  items: readonly CategoryRailItem[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

/**
 * A vertical list of categories beside a `BrowserPane`, each saying what is in
 * it before you click. Becomes a horizontal strip on narrow screens. Callers
 * decide which categories exist; the rail only draws them.
 */
export function CategoryRail({ label, items, selectedKey, onSelect }: CategoryRailProps) {
  return (
    <nav className="category-rail" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`category-rail__item${item.divider ? ' category-rail__item--divider' : ''}`}
          aria-pressed={item.key === selectedKey}
          data-slot={item.dataSlot}
          onClick={() => onSelect(item.key)}
        >
          <span className="category-rail__name">{item.label}</span>
          {item.detail && <span className="category-rail__detail">{item.detail}</span>}
        </button>
      ))}
    </nav>
  );
}

/** Rail beside a browser pane; stacks on narrow screens. */
export function RailLayout({ children }: { children: ReactNode }) {
  return <div className="category-rail-layout">{children}</div>;
}
