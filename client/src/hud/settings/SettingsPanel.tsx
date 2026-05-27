import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAtom, useAtomValue } from 'jotai';
import { gamepadStatusAtom } from '../atoms';
import {
  ACTION_LABELS,
  cloneBindings,
  codeToLabel,
  captureModeAtom,
  DEFAULT_BINDINGS,
  keybindsAtom,
  padButtonLabel,
  REBINDABLE_ACTIONS,
  saveBindings,
  type ActionId,
  type Bindings,
  type CaptureRequest,
} from '../../settings/keybinds';
import { clearCaptureSink, setCaptureSink } from '../../input/gamepad';
import '../hud.css';
import '../../ui/inventory.css';
import './settings.css';

interface Props {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: Props) {
  const [bindings, setBindings] = useAtom(keybindsAtom);
  const [capture, setCapture] = useAtom(captureModeAtom);
  const padStatus = useAtomValue(gamepadStatusAtom);

  useEffect(() => {
    if (!capture || capture.device !== 'keyboard') return;
    const action = capture.action;

    function onCapture(event: KeyboardEvent): void {
      event.preventDefault();
      event.stopPropagation();
      if (event.code === 'Escape') {
        setCapture(null);
        return;
      }
      const next = cloneBindings(bindings);
      for (const a of REBINDABLE_ACTIONS) {
        if (next[a].key === event.code && a !== action) {
          next[a] = { ...next[a], key: '' };
        }
      }
      next[action] = { ...next[action], key: event.code };
      setBindings(next);
      saveBindings(next);
      setCapture(null);
    }

    window.addEventListener('keydown', onCapture, { capture: true });
    return () => {
      window.removeEventListener('keydown', onCapture, { capture: true });
    };
  }, [capture, bindings, setBindings, setCapture]);

  useEffect(() => {
    if (!capture || capture.device !== 'gamepad') {
      clearCaptureSink();
      return;
    }

    const action = capture.action;
    setCaptureSink((idx) => {
      const next = cloneBindings(bindings);
      for (const a of REBINDABLE_ACTIONS) {
        if (next[a].pad === idx && a !== action) {
          next[a] = { ...next[a], pad: null };
        }
      }
      next[action] = { ...next[action], pad: idx };
      setBindings(next);
      saveBindings(next);
      setCapture(null);
    });

    function onEsc(event: KeyboardEvent): void {
      if (event.code === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setCapture(null);
      }
    }

    window.addEventListener('keydown', onEsc, { capture: true });
    return () => {
      clearCaptureSink();
      window.removeEventListener('keydown', onEsc, { capture: true });
    };
  }, [capture, bindings, setBindings, setCapture]);

  function handleOverlayClick(e: React.MouseEvent): void {
    if (e.target === e.currentTarget) onClose();
  }

  function startCapture(action: ActionId, device: CaptureRequest['device']): void {
    setCapture({ action, device });
  }

  function clearKey(action: ActionId): void {
    const next = cloneBindings(bindings);
    next[action] = { ...next[action], key: '' };
    setBindings(next);
    saveBindings(next);
  }

  function clearPad(action: ActionId): void {
    const next = cloneBindings(bindings);
    next[action] = { ...next[action], pad: null };
    setBindings(next);
    saveBindings(next);
  }

  function resetAll(): void {
    const next = cloneBindings(DEFAULT_BINDINGS);
    setBindings(next);
    saveBindings(next);
    setCapture(null);
  }

  return createPortal(
    <div className="inv-overlay" onClick={handleOverlayClick}>
      <div className="inv-panel settings-panel-wide" onClick={(e) => e.stopPropagation()}>
        <div className="inv-header">
          <span className="inv-title">Controls</span>
          <button type="button" className="inv-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div
          className={`settings-status${padStatus ? ' settings-status--connected' : ''}`}
        >
          {padStatus
            ? `Controller: ${padStatus.id}`
            : 'No controller detected'}
        </div>

        {capture && (
          <div className="settings-capture-hint">
            {capture.device === 'keyboard'
              ? 'Press a key (Esc to cancel)…'
              : 'Press a button or pull a trigger (Esc to cancel)…'}
          </div>
        )}

        <table className="settings-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Keyboard</th>
              <th>Controller</th>
            </tr>
          </thead>
          <tbody>
            {REBINDABLE_ACTIONS.map((action) => (
              <BindingRow
                key={action}
                action={action}
                bindings={bindings}
                capture={capture}
                onStartCapture={startCapture}
                onClearKey={clearKey}
                onClearPad={clearPad}
              />
            ))}
          </tbody>
        </table>

        <div className="settings-footnotes">
          Left stick always moves. Esc / B close overlays (not rebindable).
        </div>

        <button type="button" className="auto-btn settings-reset" onClick={resetAll}>
          RESET TO DEFAULTS
        </button>
      </div>
    </div>,
    document.body,
  );
}

function BindingRow({
  action,
  bindings,
  capture,
  onStartCapture,
  onClearKey,
  onClearPad,
}: {
  action: ActionId;
  bindings: Bindings;
  capture: CaptureRequest | null;
  onStartCapture: (action: ActionId, device: CaptureRequest['device']) => void;
  onClearKey: (action: ActionId) => void;
  onClearPad: (action: ActionId) => void;
}) {
  const b = bindings[action];
  const capturingKb =
    capture?.action === action && capture.device === 'keyboard';
  const capturingPad =
    capture?.action === action && capture.device === 'gamepad';

  return (
    <tr>
      <td className="settings-action-label">{ACTION_LABELS[action]}</td>
      <td>
        <div className="settings-bind-col">
          <span
            className={`settings-chip${capturingKb ? ' settings-chip--capturing' : ''}`}
          >
            {capturingKb ? '…' : codeToLabel(b.key)}
          </span>
          <button
            type="button"
            className="settings-btn-sm"
            onClick={() => onStartCapture(action, 'keyboard')}
          >
            Rebind
          </button>
          <button
            type="button"
            className="settings-btn-sm"
            onClick={() => onClearKey(action)}
          >
            Clear
          </button>
        </div>
      </td>
      <td>
        <div className="settings-bind-col">
          <span
            className={`settings-chip${capturingPad ? ' settings-chip--capturing' : ''}`}
          >
            {capturingPad ? '…' : b.pad !== null ? padButtonLabel(b.pad) : '—'}
          </span>
          <button
            type="button"
            className="settings-btn-sm"
            onClick={() => onStartCapture(action, 'gamepad')}
          >
            Rebind
          </button>
          <button
            type="button"
            className="settings-btn-sm"
            onClick={() => onClearPad(action)}
          >
            Clear
          </button>
        </div>
      </td>
    </tr>
  );
}
