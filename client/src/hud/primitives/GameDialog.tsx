import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import './dialogs.css';

/** `sheet` is the touch presentation: bottom-anchored, full-width, dismissable
 *  by drag. It shares the boundary, focus, and Escape behavior of the others. */
export type GameDialogSize = 'compact' | 'standard' | 'wide' | 'sheet';

export interface GameDialogProps extends PropsWithChildren {
  onClose: () => void;
  size?: GameDialogSize;
  className?: string;
  /** Transient presentation only (e.g. a drag offset). Not for layout. */
  style?: CSSProperties;
  describedBy?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  /** Return true when Escape was consumed by dialog content instead of closing. */
  onEscape?: () => boolean;
}

interface DialogContextValue {
  titleId: string;
  onClose: () => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableChildren(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => element.getClientRects().length > 0 && element.getAttribute('aria-hidden') !== 'true');
}

/** Portal-backed modal boundary with focus entry, trapping, and focus return. */
export function GameDialog({
  onClose,
  size = 'standard',
  className = '',
  style,
  describedBy,
  closeOnBackdrop = true,
  closeOnEscape = true,
  onEscape,
  children,
}: GameDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const onEscapeRef = useRef(onEscape);
  onCloseRef.current = onClose;
  onEscapeRef.current = onEscape;

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const frame = window.requestAnimationFrame(() => dialogRef.current?.focus());

    function onKeyDown(event: KeyboardEvent) {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        event.stopPropagation();
        if (onEscapeRef.current?.()) return;
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = focusableChildren(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === dialog || active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown, { capture: true });
      const returnTarget = returnFocusRef.current;
      if (returnTarget?.isConnected && !returnTarget.matches(':disabled')) {
        window.requestAnimationFrame(() => returnTarget.focus());
      }
    };
  }, [closeOnEscape]);

  const classes = [
    'game-dialog__panel',
    `game-dialog__panel--${size}`,
    className,
  ].filter(Boolean).join(' ');

  const backdropClasses = [
    'game-dialog__backdrop',
    size === 'sheet' && 'game-dialog__backdrop--sheet',
  ].filter(Boolean).join(' ');

  return createPortal(
    <div
      className={backdropClasses}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <DialogContext.Provider value={{ titleId, onClose }}>
        <div
          ref={dialogRef}
          className={classes}
          style={style}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={describedBy}
          tabIndex={-1}
        >
          {children}
        </div>
      </DialogContext.Provider>
    </div>,
    document.body,
  );
}

export interface DialogHeaderProps {
  title: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  closeLabel?: string;
}

export function DialogHeader({
  title,
  icon,
  actions,
  className = '',
  closeLabel = 'Close dialog',
}: DialogHeaderProps) {
  const context = useContext(DialogContext);
  if (!context) throw new Error('DialogHeader must be rendered inside GameDialog');

  return (
    <header className={['dialog-header', className].filter(Boolean).join(' ')}>
      {icon && <span className="dialog-header__icon" aria-hidden="true">{icon}</span>}
      <h2 id={context.titleId} className="dialog-header__title">{title}</h2>
      {actions && <div className="dialog-header__actions">{actions}</div>}
      <button
        type="button"
        className="dialog-header__close"
        aria-label={closeLabel}
        onClick={context.onClose}
      >
        <span aria-hidden="true">×</span>
      </button>
    </header>
  );
}
