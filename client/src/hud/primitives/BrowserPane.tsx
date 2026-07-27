import {
  useCallback,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import './browserPane.css';

export interface BrowserPaneProps<T> {
  /** Accessible name for the master list. */
  label: string;
  items: readonly T[];
  itemKey: (item: T) => string;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  /** Row content. Must not contain interactive children — see the note below. */
  renderItem: (item: T, state: { selected: boolean }) => ReactNode;
  renderDetail: (item: T) => ReactNode;
  /** Filters, search, facets. Rendered above both panes. */
  toolbar?: ReactNode;
  emptyList?: ReactNode;
  emptyDetail?: ReactNode;
  className?: string;
}

/**
 * The Map's browsing shape, extracted: a filter strip above a scrollable master
 * list beside a persistent detail pane that tracks selection.
 *
 * Actions belong in the detail pane, never in a row. A row is a `role="option"`
 * and may not contain its own buttons — that both keeps the listbox valid for
 * screen readers and keeps a long list scannable, because the one thing you can
 * press is always in the same place.
 *
 * Knows nothing about recipes, nodes, or items.
 */
export function BrowserPane<T>({
  label,
  items,
  itemKey,
  selectedKey,
  onSelect,
  renderItem,
  renderDetail,
  toolbar,
  emptyList,
  emptyDetail,
  className,
}: BrowserPaneProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedItem = items.find((item) => itemKey(item) === selectedKey) ?? null;

  const moveSelection = useCallback((delta: number | 'first' | 'last') => {
    if (items.length === 0) return;
    const current = items.findIndex((item) => itemKey(item) === selectedKey);
    let next: number;
    if (delta === 'first') next = 0;
    else if (delta === 'last') next = items.length - 1;
    else if (current < 0) next = delta > 0 ? 0 : items.length - 1;
    else next = Math.min(items.length - 1, Math.max(0, current + delta));

    const key = itemKey(items[next]);
    onSelect(key);
    // Roving tabindex: the newly selected row becomes the single tab stop, so
    // move focus with it or the next arrow press would restart from the top.
    window.requestAnimationFrame(() => {
      listRef.current
        ?.querySelector<HTMLElement>(`[data-browser-key="${CSS.escape(key)}"]`)
        ?.focus();
    });
  }, [items, itemKey, onSelect, selectedKey]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case 'ArrowDown': moveSelection(1); break;
      case 'ArrowUp': moveSelection(-1); break;
      case 'Home': moveSelection('first'); break;
      case 'End': moveSelection('last'); break;
      default: return;
    }
    event.preventDefault();
  }

  return (
    <div className={['browser-pane', className].filter(Boolean).join(' ')}>
      {toolbar && <div className="browser-pane__toolbar">{toolbar}</div>}

      <div className="browser-pane__body">
        <div
          ref={listRef}
          className="browser-pane__list"
          role="listbox"
          aria-label={label}
          onKeyDown={onKeyDown}
        >
          {items.length === 0 && (
            <div className="browser-pane__empty">{emptyList ?? 'Nothing here yet.'}</div>
          )}
          {items.map((item) => {
            const key = itemKey(item);
            const selected = key === selectedKey;
            return (
              <div
                key={key}
                data-browser-key={key}
                className={`browser-row${selected ? ' browser-row--selected' : ''}`}
                role="option"
                aria-selected={selected}
                tabIndex={selected || (selectedKey === null && key === itemKey(items[0])) ? 0 : -1}
                onClick={() => onSelect(key)}
              >
                {renderItem(item, { selected })}
              </div>
            );
          })}
        </div>

        <div className="browser-pane__detail">
          {selectedItem
            ? renderDetail(selectedItem)
            : <div className="browser-pane__empty">{emptyDetail ?? 'Select an entry to see details.'}</div>}
        </div>
      </div>
    </div>
  );
}
