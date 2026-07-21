import type { KeyboardEvent, PropsWithChildren, ReactNode } from 'react';
import './dialogs.css';

export interface DialogTabsProps extends PropsWithChildren {
  label: string;
  className?: string;
}

export function DialogTabs({ label, className = '', children }: DialogTabsProps) {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])'),
    );
    if (tabs.length === 0) return;

    const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
    let next = current;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (event.key === 'ArrowLeft') next = current <= 0 ? tabs.length - 1 : current - 1;
    if (event.key === 'ArrowRight') next = current >= tabs.length - 1 ? 0 : current + 1;

    event.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  }

  return (
    <div
      className={['dialog-tabs', className].filter(Boolean).join(' ')}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}

export interface DialogTabProps {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  icon?: ReactNode;
  controls?: string;
  disabled?: boolean;
  className?: string;
}

export function DialogTab({
  selected,
  onSelect,
  children,
  icon,
  controls,
  disabled,
  className = '',
}: DialogTabProps) {
  return (
    <button
      type="button"
      className={['dialog-tab', selected && 'dialog-tab--selected', className].filter(Boolean).join(' ')}
      role="tab"
      aria-selected={selected}
      aria-controls={controls}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      onClick={onSelect}
    >
      {icon && <span className="dialog-tab__icon" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
